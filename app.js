let pc;
let channel;
let key;
let role;
let sessionId;

const statusBox = document.getElementById("status");

function setStatus(t){ statusBox.innerText=t; }

function showHost(){
  home.classList.add("hidden");
  hostForm.classList.remove("hidden");
}

function showJoin(){
  home.classList.add("hidden");
  joinForm.classList.remove("hidden");
}

function showChat(){
  hostForm.classList.add("hidden");
  joinForm.classList.add("hidden");
  chatScreen.classList.remove("hidden");
}

function createPeer(){
  pc = new RTCPeerConnection({
    iceServers:[{urls:"stun:stun.l.google.com:19302"}]
  });

  // ✅ FIXED ICE SENDING
  pc.onicecandidate = async (e)=>{
    if(e.candidate){
      await fetch(`/api/session?id=${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidate: e.candidate })
      });
    }
  };

  pc.onconnectionstatechange=()=>{
    if(pc.connectionState==="connected"){
      setStatus("✅ Connected");
      showChat();
    }
  };

  pc.ondatachannel=e=>{
    channel=e.channel;
    setupChannel();
  };
}

function setupChannel(){
  channel.onmessage=async e=>{
    const msg=await decrypt(e.data);
    chat.value+="Friend: "+msg+"\n";
  };
}

// ✅ FIXED polling to match backend
async function pollCandidates(){
  const res = await fetch(`/api/session?id=${sessionId}`);
  if(res.status!==200){
    setTimeout(pollCandidates,1000);
    return;
  }

  const data=await res.json();

  if(!data.candidates) {
    setTimeout(pollCandidates,1000);
    return;
  }

  for(const c of data.candidates){
    try{
      await pc.addIceCandidate(new RTCIceCandidate(c));
    }catch{}
  }

  setTimeout(pollCandidates,1000);
}

async function deriveKey(pass){
  const enc=new TextEncoder();
  const base=await crypto.subtle.importKey("raw",enc.encode(pass),{name:"PBKDF2"},false,["deriveKey"]);
  return crypto.subtle.deriveKey({
    name:"PBKDF2",
    salt:enc.encode("xchat"),
    iterations:100000,
    hash:"SHA-256"
  },base,{name:"AES-GCM",length:256},false,["encrypt","decrypt"]);
}

async function encrypt(msg){
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const enc=await crypto.subtle.encrypt({name:"AES-GCM",iv},key,new TextEncoder().encode(msg));
  return JSON.stringify({d:Array.from(new Uint8Array(enc)),iv:Array.from(iv)});
}

async function decrypt(payload){
  const obj=JSON.parse(payload);
  const dec=await crypto.subtle.decrypt({name:"AES-GCM",iv:new Uint8Array(obj.iv)},key,new Uint8Array(obj.d));
  return new TextDecoder().decode(dec);
}

async function startHost(){
  role="host";
  sessionId=hostId.value.trim();
  const pass=hostPass.value.trim();
  if(!sessionId||!pass) return alert("Fill fields");

  setStatus("Creating session...");
  key=await deriveKey(pass);
  createPeer();

  channel=pc.createDataChannel("chat");
  setupChannel();

  const offer=await pc.createOffer();
  await pc.setLocalDescription(offer);

  await fetch(`/api/session?id=${sessionId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ offer })
  });

  setStatus("Waiting for peer...");
  pollAnswer();
  pollCandidates();
}

async function pollAnswer(){
  const res = await fetch(`/api/session?id=${sessionId}`);
  if(res.status!==200){
    setTimeout(pollAnswer,1000);
    return;
  }

  const data=await res.json();

  if(data.answer){
    await pc.setRemoteDescription(data.answer);
  }else{
    setTimeout(pollAnswer,1000);
  }
}

async function startJoin(){
  role="join";
  sessionId=joinId.value.trim();
  const pass=joinPass.value.trim();
  if(!sessionId||!pass) return alert("Fill fields");

  setStatus("Looking for host...");
  key=await deriveKey(pass);
  createPeer();

  const res=await fetch(`/api/session?id=${sessionId}`);
  if(res.status!==200){
    setStatus("Session not found");
    return;
  }

  const data=await res.json();

  if(!data.offer){
    setStatus("Waiting for host...");
    setTimeout(startJoin,1000);
    return;
  }

  await pc.setRemoteDescription(data.offer);

  const answer=await pc.createAnswer();
  await pc.setLocalDescription(answer);

  await fetch(`/api/session?id=${sessionId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answer })
  });

  setStatus("Connecting...");
  pollCandidates();
}

async function send(){
  if(!msg.value) return;
  const enc=await encrypt(msg.value);
  channel.send(enc);
  chat.value+="Me: "+msg.value+"\n";
  msg.value="";
}
