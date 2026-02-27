let pc = new RTCPeerConnection({
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
});

let channel;
let key;
let connected = false;

async function deriveKey(pass) {
  const enc = new TextEncoder();
  const base = await crypto.subtle.importKey("raw", enc.encode(pass), {name:"PBKDF2"}, false, ["deriveKey"]);
  return crypto.subtle.deriveKey({
      name:"PBKDF2",
      salt:enc.encode("session-salt"),
      iterations:100000,
      hash:"SHA-256"
    },
    base,
    {name:"AES-GCM", length:256},
    false,
    ["encrypt","decrypt"]
  );
}

function RUN() {
  alert("RUN!");
  pc.close();
  document.body.innerHTML = "<h1 style='color:red'>SESSION TERMINATED</h1>";
}

async function encrypt(msg) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder().encode(msg);
  const data = await crypto.subtle.encrypt({name:"AES-GCM", iv}, key, enc);
  return JSON.stringify({d:Array.from(new Uint8Array(data)),iv:Array.from(iv)});
}

async function decrypt(payload) {
  try {
    const obj = JSON.parse(payload);
    const data = new Uint8Array(obj.d);
    const iv = new Uint8Array(obj.iv);
    const dec = await crypto.subtle.decrypt({name:"AES-GCM", iv}, key, data);
    return new TextDecoder().decode(dec);
  } catch {
    RUN();
  }
}

function append(text) {
  chat.value += text + "\n";
}

function setupChannel() {
  channel.onmessage = async e => {
    const msg = await decrypt(e.data);
    if(msg) append("Friend: " + msg);
  };
  channel.onclose = RUN;
}

async function host() {
  key = await deriveKey(secret.value);
  channel = pc.createDataChannel("secure");
  setupChannel();

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  await fetch("/api/session", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({
      id: sessionId.value,
      offer: offer
    })
  });

  pollForAnswer();
}

async function join() {
  key = await deriveKey(secret.value);

  const res = await fetch("/api/session?id=" + sessionId.value);
  const data = await res.json();

  if(!data.offer) return alert("Invalid session");

  await pc.setRemoteDescription(data.offer);

  channel = pc.createDataChannel("secure");
  setupChannel();

  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);

  await fetch("/api/session", {
    method:"PUT",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({
      id: sessionId.value,
      answer: answer
    })
  });

  connected = true;
}

async function pollForAnswer() {
  const res = await fetch("/api/session?id=" + sessionId.value);
  const data = await res.json();
  if(data.answer) {
    await pc.setRemoteDescription(data.answer);
    connected = true;
  } else {
    setTimeout(pollForAnswer, 1000);
  }
}

async function send() {
  if(!connected) return RUN();
  const encrypted = await encrypt(msg.value);
  channel.send(encrypted);
  append("Me: " + msg.value);
  msg.value="";
}


.flying-text {
  position: absolute;
  font-weight: bold;
  color: #00ff88;
  pointer-events: none;
  animation: flyUp 0.8s ease forwards;
}

@keyframes flyUp {
  0% {
    opacity: 1;
    transform: translateY(0px);
  }
  100% {
    opacity: 0;
    transform: translateY(-120px);
  }
}