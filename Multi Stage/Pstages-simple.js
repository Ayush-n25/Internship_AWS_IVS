/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. SPDX-License-Identifier: Apache-2.0 */

// All helpers are expose on 'media-devices.js' and 'dom.js'
// const { setupParticipant } = window;
// const { initializeDeviceSelect, getCamera, getMic } = window;

const { Stage, LocalStageStream, SubscribeType, StageEvents, ConnectionState, StreamType } = IVSBroadcastClient;

let cameraButton = document.getElementById("camera-control");
let micButton = document.getElementById("mic-control");
let joinButton = document.getElementById("participant-join-button");
let leaveButton = document.getElementById("participant-leave-button")

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
var token="";
var meeting_name="";
var participant_ID="";
var puser_ID="";
const join_api=async ()=>{
    let P_uname= document.getElementById('Pusername').value;
    let mtID= document.getElementById('PmeetingName').value;
    let P_url= document.getElementById('Purl').value;
    let Puid= (String(P_uname)+String(mtID));
    meeting_name=mtID;
    puser_ID=Puid;
    let resp=await fetch('https://jefre4nw34.execute-api.us-east-1.amazonaws.com/prod/join',{
        method:"POST",
        body:JSON.stringify({
            groupId:mtID,
            "userId":Puid,
            "attributes":{
                "avatarUrl":P_url,
                "username":P_uname
            }
        })
    }).then(async (response)=>{
        if(response.ok){
            let tk = await response.json();
            token = tk.stage.token.token;
            //participantId
            participant_ID=tk.stage.token.participantId;
            console.log(token);
            return token;
        }
    }).catch((error)=>{
        console.log("Cannot join meeting :",error.message);
    })
}
const joinStage = async () => {
    if (connected || joining) { return }
    joining = true
setTimeout(()=>{},1000);
    const t = await join_api().then(async (tk)=>{
        console.log("Inside join:\t",token);
        console.log("tk:\t",tk);
        if (token==="") {
            window.alert("Please enter a participant token");
            joining = false;
            return;
        }
        document.getElementById('participant-leave-button').disabled=false;
        document.getElementById('participant-join-button').disabled=true;
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
    }).catch((error)=>{
        console.log('Cannot join after token Creation! ',error.message);
    })
console.log(t);

}

const disconnect_api=async ()=>{
    let r=await fetch('',{
        method:'POST',
        body:JSON.stringify({
            "groupId":meeting_name,
            "participantId":puser_ID,
            "reason":"You left the meeting/Stream",
            "userId":participant_ID
        })
    }).then(async ()=>{
        console.log("Disconnected successfully");
    })
        .catch((error)=>{
            console.log("Not disconnected :",error.message);
        })
}
const leaveStage = async () => {
    stage.leave();

    joining = false;
    connected = false;

    cameraButton.innerText = 'Hide Camera';
    micButton.innerText = 'Mute Mic';
    controls.classList.add('hidden');
    // disconnect API call
    const dis=await disconnect_api().then(()=>{
        document.getElementById('participant-join-button').disabled=false;
        document.getElementById('participant-leave-button').disabled=true;
    }).catch((error)=>{
        console.log("Not disconnected");
        console.log(error.message);
    });
}

init();