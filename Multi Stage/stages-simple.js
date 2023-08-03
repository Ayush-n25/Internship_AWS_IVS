/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. SPDX-License-Identifier: Apache-2.0 */

// All helpers are expose on 'media-devices.js' and 'dom.js'
// const { setupParticipant } = window;
// const { initializeDeviceSelect, getCamera, getMic } = window;
const {json} = 'json'
const { Stage, LocalStageStream, SubscribeType, StageEvents, ConnectionState, StreamType } = IVSBroadcastClient;

let cameraButton = document.getElementById("camera-control");
let micButton = document.getElementById("mic-control");
let joinButton = document.getElementById("join-button");
let leaveButton = document.getElementById("leave-button")

let controls = document.getElementById("local-controls");
let videoDevicesList = document.getElementById("video-devices");
let audioDevicesList = document.getElementById("audio-devices");

// Stage management
let stage;
let joining = false;
let connected = false;
let localCamera;
let localMic;
let cameraStageStream;
let micStageStream;
let remoteStreams = [];

const init = async () => {
  await initializeDeviceSelect();
  
  cameraButton.addEventListener('click', () => {
    const isMuted = !cameraStageStream.isMuted
    cameraStageStream.setMuted(isMuted)
    cameraButton.innerText = isMuted ? 'Show Camera' : 'Hide Camera'
  })

  micButton.addEventListener('click', () => {
    const isMuted = !micStageStream.isMuted
    micStageStream.setMuted(isMuted)
    micButton.innerText = isMuted ? 'Unmute Mic' : 'Mute Mic'
  })

  joinButton.addEventListener('click', () => {
    joinStage()
  })
  
  leaveButton.addEventListener('click', () => {
    leaveStage()
  })
};
var token;
var userID;
var Pid;
var groupID;
var stageID;
var playback_url="";
const Createfun=async ()=>{
  const un=await document.getElementById('username').value;
  const uurl=await document.getElementById("userUrl").value;
  const grpname=await document.getElementById("meetingName").value;
  const uID=await (String(un)+" "+String(grpname));
  userID=uID;
  groupID=grpname;
  //console.log(un)
  //console.log(uurl)
  //console.log(grpname)
  //console.log(uID)
  let response=await fetch('https://jefre4nw34.execute-api.us-east-1.amazonaws.com/prod/create', {
    method: 'POST',
    body: JSON.stringify({
      groupId: grpname,
      userId: uID,
      attributes: {
        avatarUrl: uurl,
        username: un
      }
    }),
  })
      .then(async resp => {
        if(resp.ok){
          console.log('Group created !');
          const tk_parsed= await resp.json();
          //console.log(tk_parsed.stage.token.token);
          Pid=tk_parsed.stage.token.participantId;
          stageID=tk_parsed.stage.id;
          token=tk_parsed.stage.token.token;
          playback_url=tk_parsed.channel.playbackUrl;
          document.getElementById('playbackUrl').innerHTML=`The playbackurl is ${playback_url}`;
          return tk_parsed.stage.token.token;
        }
      })
      .catch(error => {
        console.error('Failed to create group:', error);
        return "";
      });
}
const joinStage = async () => {
  if (connected || joining) { return }
  joining = true
  //API call create
  const t=await Createfun().then(async (tk)=>{
    //console.log("Inside the joinStage(): \n",token);
    if (!token) {
      window.alert("Please enter a participant token");
      joining = false;
      return;
    }

    // Retrieve the User Media currently set on the page
    localCamera = await getCamera(videoDevicesList.value);
    localMic = await getMic(audioDevicesList.value);

    // Create StageStreams for Audio and Video
    cameraStageStream = new LocalStageStream(localCamera.getVideoTracks()[0]);
    micStageStream = new LocalStageStream(localMic.getAudioTracks()[0]);

    const strategy = {
      stageStreamsToPublish() {
        return [cameraStageStream, micStageStream];
      },
      shouldPublishParticipant() {
        return true;
      },
      shouldSubscribeToParticipant() {
        return SubscribeType.AUDIO_VIDEO;
      }
    }

    stage = new Stage(token, strategy);

    // Other available events:
    // https://aws.github.io/amazon-ivs-web-broadcast/docs/sdk-guides/stages#events

    stage.on(StageEvents.STAGE_CONNECTION_STATE_CHANGED, (state) => {
      connected = state === ConnectionState.CONNECTED;

      if (connected) {
        joining = false;
        controls.classList.remove('hidden');
      } else {
        controls.classList.add('hidden')
      }
    });

    stage.on(StageEvents.STAGE_PARTICIPANT_JOINED, (participant) => {
      console.log("Participant Joined:", participant);
    });

    stage.on(StageEvents.STAGE_PARTICIPANT_STREAMS_ADDED, (participant, streams) => {
      console.log("Participant Media Added: ", participant, streams);
      document.getElementById('username').disabled=true;
      document.getElementById('userUrl').disabled=true;
      document.getElementById('meetingName').disabled=true;
      document.getElementById('join-button').disabled=true;
      document.getElementById('deleteStage').disabled=false;
      document.getElementById('leave-button').disabled=false;
      let streamsToDisplay = streams;

      if (participant.isLocal) {
        // Ensure to exclude local audio streams, otherwise echo will occur
        streamsToDisplay = streams.filter(stream => stream.streamType === StreamType.VIDEO);
      }

      const videoEl = setupParticipant(participant);
      streamsToDisplay.forEach(stream => videoEl.srcObject.addTrack(stream.mediaStreamTrack));
    });

    stage.on(StageEvents.STAGE_PARTICIPANT_LEFT, (participant) => {
      console.log("Participant Left: ", participant);
      teardownParticipant(participant);
    });

    try {
      await stage.join();
    } catch (err) {
      joining = false;
      connected = false;
      console.error(err.message);
    }
  });

}

const disconnect=async ()=> {
  console.log(groupID)
  console.log(Pid)
  console.log(userID)
  fetch('https://jefre4nw34.execute-api.us-east-1.amazonaws.com/prod/disconnect', {
    method: 'POST',
    body: JSON.stringify({
    groupId:groupID,
    participantId:Pid,
    reason:"You left the meeting/Stream",
    userId:userID
        }),
  }).then(()=>{
    console.log( "disconnected Successfully !");
  })
  .catch((error)=>{
    console.log(`Cannot disconnect the Participant ${userID}`,error.message);
  });

}
const leaveStage = async () => {
  stage.leave();
  
  joining = false;
  connected = false;
  
  cameraButton.innerText = 'Hide Camera';
  micButton.innerText = 'Mute Mic';
  controls.classList.add('hidden');
  //add disconnect API call so to disconnect the user 
  const d_status=await disconnect().then(()=>{
    console.log("Left Stage successfully");
    document.getElementById('username').disabled=false;
    document.getElementById('userUrl').disabled=false;
    document.getElementById('meetingName').disabled=false;
    document.getElementById('join-button').disabled=false;
    document.getElementById('leave-button').disabled=true;
  });
}
const deleteStagefunc =async ()=>{
    fetch('https://jefre4nw34.execute-api.us-east-1.amazonaws.com/prod/delete',{
      method:"DELETE",
      body:JSON.stringify({
        groupId:groupID,
        stageId:stageID
      })
    }).then(()=>{
      console.log("Stream Deleted successfully");
      document.getElementById('deleteStage').disabled=true;
    }).catch((error)=>{
      console.log(error.message);
    })

}
init();