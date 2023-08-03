const express =require('express');
const app=express();
const path =require('path');
const hbs=require('hbs');
// const {collection_user,collection_Channels} = require('./connectionMongo');
const { listenerCount } = require('process');
const template_path=path.join(__dirname,'../templates');
const static_path=path.join(__dirname,"../public");
app.use(express.static(static_path));

app.use(express.json());
app.set('view engine','hbs');
app.set('views',template_path);
app.use(express.urlencoded({extended:false}));
const portNO=5500;
app.listen(5500,()=>{
    console.log('listening on port ',portNO);
})

// var for rotuing
let logIn=false;
// logIn=true;
// setting routes
app.get('/',(req,res)=>{
    if(logIn==false){
        res.render('home');
    }
    else{
        res.render('userAfLogin');
    }
})
app.get('/home',(req,res)=>{
    if(logIn==true){
        res.render('userAfLogin');
    }
    else{
        res.render('home');
    }
})
app.get('/about',(q,r)=>{
    r.render('home');
})
app.get('/loginSIGNUP',(q,r)=>{
    if(logIn==false){
    r.render('loginSIGNUP');
    }
    else{
        r.render('userAfLogin');
    }
})
app.get('/plan',(q,r)=>{
    if(logIn==true){
        r.render('plan');
    }else{
        r.render('loginSIGNUP');
    }
})
app.get('/schedule',(q,r)=>{
    if(logIn==true){
        r.render('schedule');
    }else{
        r.render('loginSIGNUP');
    }
})
app.get('/forgotPass',(q,r)=>{
    r.render('forgetPass');
})
app.get('/userAfLogin',(q,r)=>{
    if(logIn){
        r.render('userAfLogin');
    }
    else{
        r.render('loginSIGNUP');
    }
})
// Sign up post
app.post('/SignUp',async(q,r)=>{
    let Uname=q.body.username;
    let Uemail=q.body.email;
    let Upass=q.body.pass;
    
    const add_User={
        UserName:Uname,
        Email:Uemail,
        Password:Upass
    }
    // for errors 
    try {
        await collection_user.insertMany([add_User]);
    } catch (error) {
        console.log(error);
        r.redirect('SignUp');
    }
    console.log(Uname+'\n'+Uemail+'\n'+Upass);
    r.render('UserLanding');
})