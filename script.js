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

// Peer JS object ko initialize karein (Secure HTTPS Configuration)
const peer = new Peer(myId, {
    host: '://peerjs.com',
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
    // यहाँ आपका आगे का चैट कनेक्शन हैंडलर कोड (जो स्क्रीनशॉट में नीचे छिप गया है) आएगा
}
