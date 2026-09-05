// 1. Apni custom ID format banane ke liye generator
function generateRandomID() {
    const chars = '0123456789ABCDEF';
    let result = '';
    for (let i = 0; i < 4; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
    }
    return `IN-JH-ROSHAN-${result}`;
}

const myId = generateRandomID();
document.getElementById('my-id').innerText = myId;

// 2. Peer JS object ko initialize karein (Fixed Secure HTTPS Configuration)
const peer = new Peer(myId, {
    host: '0.peerjs.com',  // Fixed: '://' ko hata diya hai
    port: 443,
    secure: true,
    path: '/'
});

let conn = null;
let currentCall = null;
let localStream = null;

const chatBox = document.getElementById('chat-box');
const remoteIdInput = document.getElementById('remote-id-input');
const msgInput = document.getElementById('msg-input');

// Jab network se connection ban jaye
peer.on('open', (id) => {
    console.log('Connected to PeerServer with ID: ' + id);
});

// 3. TEXT CHAT SYSTEM: Incoming Text Connection handle karna
peer.on('connection', (incomingConn) => {
    conn = incomingConn;
    setupChatConnection();
});

// Outgoing Text Connection banana
function connectToPeer() {
    const remoteId = remoteIdInput.value.trim();
    if (!remoteId) return false;
    if (!conn || conn.peer !== remoteId) {
        conn = peer.connect(remoteId);
        setupChatConnection();
    }
    return true;
}

function setupChatConnection() {
    conn.on('open', () => {
        console.log("Chat connected with: " + conn.peer);
    });
    conn.on('data', (data) => {
        // incoming message screen par dikhane ke liye
        if(chatBox) chatBox.value += `\nRemote: ${data}`;
    });
}

// Message send karne ka function
function sendMessage() {
    const msg = msgInput.value.trim();
    if (!msg) return;
    
    if (connectToPeer()) {
        setTimeout(() => {
            if (conn && conn.open) {
                conn.send(msg);
                if(chatBox) chatBox.value += `\nYou: ${msg}`;
                msgInput.value = '';
            }
        }, 500); // Connection banane ke liye thoda wait
    }
}

// 4. VIDEO & AUDIO CALL SYSTEM (Missing Features Added)

// Camera aur Mic access karne ka helper function
async function startLocalStream(videoEnabled, audioEnabled) {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({
            video: videoEnabled,
            audio: audioEnabled
        });
        // Agar aapke HTML me local-video element hai toh stream vaha dikhegi
        const localVideo = document.getElementById('local-video');
        if (localVideo) localVideo.srcObject = localStream;
        return localStream;
    } catch (err) {
        console.error("Camera/Mic access nahi mila: ", err);
        alert("कृपया कॉल करने के लिए कैमरा और माइक की परमिशन दें।");
        return null;
    }
}

// Outgoing Call lagane ke liye function
async function startCall(isVideo) {
    const remoteId = remoteIdInput.value.trim();
    if (!remoteId) {
        alert("कृपया पहले Remote ID डालें!");
        return;
    }

    const stream = await startLocalStream(isVideo, true);
    if (!stream) return;

    console.log(`Calling ${remoteId}...`);
    const call = peer.call(remoteId, stream);
    handleCall(call);
}

// Incoming Call accept karne ke liye listener
peer.on('call', async (incomingCall) => {
    const accept = confirm("Incoming call! Kya aap call uthana chahte hain?");
    if (accept) {
        // Samne vale ki call ke response me video call ya sirf audio call select karein
        const stream = await startLocalStream(true, true); 
        incomingCall.answer(stream);
        handleCall(incomingCall);
    } else {
        incomingCall.close();
    }
});

// Call handles karne ka common function
function handleCall(call) {
    currentCall = call;
    call.on('stream', (remoteStream) => {
        // Samne wale ka video screen par dikhane ke liye element
        const remoteVideo = document.getElementById('remote-video');
        if (remoteVideo) remoteVideo.srcObject = remoteStream;
    });

    call.on('close', () => {
        alert("Call cut ho gayi.");
        endCall();
    });
}

// Call khatam karne ke liye function
function endCall() {
    if (currentCall) currentCall.close();
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
}

// 5. HTML BUTTONS BINDINGS (BUttons par click event lagana)
document.addEventListener("DOMContentLoaded", () => {
    // Video Call Button
    const videoBtn = document.querySelector("button.btn-success, #video-call-btn, .video-call"); 
    if(videoBtn) videoBtn.onclick = () => startCall(true);

    // Audio Call Button
    const audioBtn = document.querySelector("button.btn-info, #audio-call-btn, .audio-call");
    if(audioBtn) audioBtn.onclick = () => startCall(false);
    
    // Send Message Button
    const sendBtn = document.querySelector("#send-btn, .send-btn");
    if(sendBtn) sendBtn.onclick = sendMessage;
});
