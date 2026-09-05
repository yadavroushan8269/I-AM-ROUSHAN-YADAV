// 1. Unique ID Generator
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

// 2. PeerJS Setup with Network Bypass (Google STUN Servers)
const peer = new Peer(myId, {
    host: '://peerjs.com',
    port: 443,
    secure: true,
    path: '/',
    config: {
        'iceServers': [
            { urls: 'stun:://google.com' },
            { urls: 'stun:://google.com' },
            { urls: 'stun:://google.com' }
        ]
    }
});

let conn = null;
let currentCall = null;
let localStream = null;

const chatBox = document.getElementById('chat-box');
const remoteIdInput = document.getElementById('remote-id-input');
const msgInput = document.getElementById('msg-input');
const videoArea = document.getElementById('videoArea');

peer.on('open', (id) => {
    console.log('Connected to PeerServer with ID: ' + id);
});

// 3. TEXT CHAT SYSTEM
peer.on('connection', (incomingConn) => {
    conn = incomingConn;
    setupChatConnection();
});

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
        chatBox.innerHTML += `<div class="msg-item" style="color: #64748b;">[ System: Connected to peer ]</div>`;
    });
    conn.on('data', (data) => {
        chatBox.innerHTML += `<div class="msg-item msg-peer"><strong>Remote:</strong> ${data}</div>`;
        chatBox.scrollTop = chatBox.scrollHeight;
    });
}

function sendMessage() {
    const msg = msgInput.value.trim();
    if (!msg) return;
    
    connectToPeer();
    
    setTimeout(() => {
        if (conn && conn.open) {
            conn.send(msg);
            chatBox.innerHTML += `<div class="msg-item msg-me"><strong>You:</strong> ${msg}</div>`;
            msgInput.value = '';
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    }, 600);
}

function clearChat() {
    if(chatBox) chatBox.innerHTML = '';
}

// 4. VIDEO & AUDIO CALL SYSTEM (कैमरा ओपन फिक्स)
async function startLocalStream(videoEnabled, audioEnabled) {
    try {
        // कैमरा और माइक की रिक्वेस्ट
        localStream = await navigator.mediaDevices.getUserMedia({
            video: videoEnabled,
            audio: audioEnabled
        });
        
        // वीडियो बॉक्स को स्क्रीन पर दिखाना (CSS Grid के अनुसार)
        if (videoArea) {
            videoArea.style.setProperty('display', 'grid', 'important');
        }
        
        // अपने खुद के कैमरे का वीडियो स्क्रीन पर सेट करना
        const localVideo = document.getElementById('localVideo');
        if (localVideo) {
            localVideo.srcObject = localStream;
            localVideo.play().catch(e => console.log("Local video autoplay failed", e));
        }
        
        return localStream;
    } catch (err) {
        console.error("Camera error details:", err);
        alert("कैमरा या माइक चालू नहीं हो पाया। कृपया ब्राउज़र में कैमरा परमिशन चेक करें।");
        return null;
    }
}

async function startCall(isVideo) {
    const remoteId = remoteIdInput.value.trim();
    if (!remoteId) {
        alert("कृपया पहले Remote ID डालें!");
        return;
    }

    // पहले अपना कैमरा चालू करें
    const stream = await startLocalStream(isVideo, true);
    if (!stream) return;

    // सामने वाले को कॉल लगाएं
    const call = peer.call(remoteId, stream);
    handleCall(call);
}

// Incoming Call Receiver
peer.on('call', async (incomingCall) => {
    const accept = confirm(`Incoming call from ${incomingCall.peer}\nक्या आप कॉल उठाना चाहते हैं?`);
    if (accept) {
        const stream = await startLocalStream(true, true);
        if (stream) {
            incomingCall.answer(stream);
            handleCall(incomingCall);
        }
    } else {
        incomingCall.close();
    }
});

function handleCall(call) {
    currentCall = call;
    call.on('stream', (remoteStream) => {
        const remoteVideo = document.getElementById('remoteVideo');
        if (remoteVideo) {
            remoteVideo.srcObject = remoteStream;
            remoteVideo.play().catch(e => console.log("Remote video autoplay failed", e));
        }
    });

    call.on('close', () => {
        endCall();
    });
}

function endCall() {
    if (currentCall) currentCall.close();
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
    if (videoArea) {
        videoArea.style.display = 'none';
    }
    alert("कॉल समाप्त हो गई है।");
}

// 5. EVENT BINDINGS (बटन क्लिक कनेक्टर्स)
document.addEventListener("DOMContentLoaded", () => {
    const videoBtn = document.getElementById('videoCallBtn');
    const audioBtn = document.getElementById('audioCallBtn');
    const sendBtn = document.getElementById('sendMsgBtn');
    const endBtn = document.getElementById('endCallBtn');

    if (videoBtn) videoBtn.onclick = () => startCall(true);
    if (audioBtn) audioBtn.onclick = () => startCall(false);
    if (sendBtn) sendBtn.onclick = sendMessage;
    if (endBtn) endBtn.onclick = endCall;
});
