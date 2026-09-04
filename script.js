// Apni custom ID format banane ke liye generator
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

// PeerJS object ko initialize karein
const peer = new Peer(myId);

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

// 1. CHAT SYSTEM: Incoming Text Connection handle karna
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
        appendMessage('System', 'Secure Bridge Established.', 'msg-peer');
    });
    conn.on('data', (data) => {
        if(data.type === 'text') {
            appendMessage('Remote', data.content, 'msg-peer');
        }
    });
}

// Message send karne ka function
document.getElementById('sendMsgBtn').addEventListener('click', () => {
    const text = msgInput.value.trim();
    if (!text) return;
    
    connectToPeer();
    
    if (conn && conn.open) {
        conn.send({ type: 'text', content: text });
        appendMessage('You', text, 'msg-me');
        msgInput.value = '';
    } else {
        alert("Connecting... Please press send again in a second.");
    }
});

function appendMessage(sender, text, className) {
    const p = document.createElement('p');
    p.classList.add('msg-item', className);
    p.innerText = `[${sender}]: ${text}`;
    chatBox.appendChild(p);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function clearChat() {
    chatBox.innerHTML = '';
}

function setRemoteId(id) {
    remoteIdInput.value = id;
}

// 2. CALL SYSTEM: Audio/Video Calling Engine
function startLocalStream(videoRequired, callback) {
    navigator.mediaDevices.getUserMedia({ video: videoRequired, audio: true })
    .then((stream) => {
        localStream = stream;
        document.getElementById('localVideo').srcObject = stream;
        document.getElementById('videoArea').style.display = 'grid';
        callback(stream);
    })
    .catch((err) => {
        console.error('Failed to get local stream', err);
        alert('Camera/Microphone access denied!');
    });
}

// Incoming Call Handle Karna
peer.on('call', (incomingCall) => {
    const acceptCall = confirm("Incoming call from " + incomingCall.peer + ". Accept?");
    if (acceptCall) {
        startLocalStream(true, (stream) => {
            incomingCall.answer(stream);
            currentCall = incomingCall;
            setupCallEvents();
        });
    } else {
        incomingCall.close();
    }
});

// Outgoing Video Call Button
document.getElementById('videoCallBtn').addEventListener('click', () => {
    const remoteId = remoteIdInput.value.trim();
    if (!remoteId) return alert('Enter Remote ID first!');
    
    startLocalStream(true, (stream) => {
        currentCall = peer.call(remoteId, stream);
        setupCallEvents();
    });
});

// Outgoing Audio Call Button
document.getElementById('audioCallBtn').addEventListener('click', () => {
    const remoteId = remoteIdInput.value.trim();
    if (!remoteId) return alert('Enter Remote ID first!');
    
    startLocalStream(false, (stream) => {
        currentCall = peer.call(remoteId, stream);
        setupCallEvents();
    });
});

function setupCallEvents() {
    currentCall.on('stream', (remoteStream) => {
        document.getElementById('remoteVideo').srcObject = remoteStream;
    });
    currentCall.on('close', () => {
        endCall();
    });
}

document.getElementById('endCallBtn').addEventListener('click', () => {
    if (currentCall) currentCall.close();
    endCall();
});

function endCall() {
    document.getElementById('videoArea').style.display = 'none';
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
}
