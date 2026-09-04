const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);

const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));


// ===============================
// SOCKET.IO
// ===============================

io.on("connection", (socket) => {

    console.log("User connected:", socket.id);


    // JOIN ROOM
    socket.on("join-room", (roomId) => {

        if (!roomId) return;


        const room = io.sockets.adapter.rooms.get(roomId);

        const users = room ? room.size : 0;


        // Maximum 2 users
        if (users >= 2) {

            socket.emit("room-full");

            return;
        }


        socket.join(roomId);

        socket.roomId = roomId;


        console.log(
            `${socket.id} joined room ${roomId}`
        );


        if (users === 0) {

            socket.emit("waiting");

        } else {

            socket.emit("joined");

            socket.to(roomId).emit("user-joined");

        }

    });


    // OFFER
    socket.on("offer", (offer) => {

        if (!socket.roomId) return;

        socket.to(socket.roomId).emit(
            "offer",
            offer
        );

    });


    // ANSWER
    socket.on("answer", (answer) => {

        if (!socket.roomId) return;

        socket.to(socket.roomId).emit(
            "answer",
            answer
        );

    });


    // ICE CANDIDATE
    socket.on("ice-candidate", (candidate) => {

        if (!socket.roomId) return;

        socket.to(socket.roomId).emit(
            "ice-candidate",
            candidate
        );

    });


    // LEAVE
    socket.on("leave-room", () => {

        leaveRoom(socket);

    });


    // DISCONNECT
    socket.on("disconnect", () => {

        console.log(
            "User disconnected:",
            socket.id
        );

        leaveRoom(socket);

    });

});


// ===============================
// LEAVE ROOM
// ===============================

function leaveRoom(socket) {

    const roomId = socket.roomId;

    if (!roomId) return;


    socket.to(roomId).emit("user-left");

    socket.leave(roomId);

    socket.roomId = null;

}


// ===============================
// START SERVER
// ===============================

server.listen(PORT, () => {

    console.log(
        `Server running at http://localhost:${PORT}`
    );

});

const socket = io();


// ===============================
// ELEMENTS
// ===============================

const localVideo =
    document.getElementById("localVideo");

const remoteVideo =
    document.getElementById("remoteVideo");

const startBtn =
    document.getElementById("startBtn");

const endBtn =
    document.getElementById("endBtn");

const micBtn =
    document.getElementById("micBtn");

const cameraBtn =
    document.getElementById("cameraBtn");

const screenBtn =
    document.getElementById("screenBtn");

const joinBtn =
    document.getElementById("joinBtn");

const roomInput =
    document.getElementById("roomInput");

const roomId =
    document.getElementById("roomId");

const copyBtn =
    document.getElementById("copyBtn");

const statusText =
    document.getElementById("statusText");

const statusDot =
    document.getElementById("statusDot");

const remotePlaceholder =
    document.getElementById("remotePlaceholder");

const localPlaceholder =
    document.getElementById("localPlaceholder");

const toast =
    document.getElementById("toast");


// ===============================
// VARIABLES
// ===============================

let localStream = null;

let peerConnection = null;

let currentRoom = null;

let micOn = true;

let cameraOn = true;

let screenStream = null;


// ===============================
// WEBRTC CONFIG
// ===============================

const configuration = {

    iceServers: [

        {
            urls: "stun:stun.l.google.com:19302"
        },

        {
            urls: "stun:stun1.l.google.com:19302"
        }

    ]

};


// ===============================
// ROOM ID
// ===============================

function generateRoomId() {

    const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    let result = "ROOM-";

    for (let i = 0; i < 6; i++) {

        result += characters[
            Math.floor(
                Math.random() * characters.length
            )
        ];

    }

    return result;

}


const myRoom =
    generateRoomId();

roomId.textContent =
    myRoom;


// ===============================
// STATUS
// ===============================

function setStatus(text, active = false) {

    statusText.textContent = text;

    if (active) {

        statusDot.classList.add("active");

    } else {

        statusDot.classList.remove("active");

    }

}


// ===============================
// TOAST
// ===============================

function showToast(text) {

    toast.textContent = text;

    toast.classList.add("show");

    setTimeout(() => {

        toast.classList.remove("show");

    }, 2000);

}


// ===============================
// START CAMERA
// ===============================

async function startCamera() {

    try {

        localStream =
            await navigator.mediaDevices.getUserMedia({

                video: true,

                audio: true

            });


        localVideo.srcObject =
            localStream;


        localPlaceholder
            .classList.add("hidden");


        startBtn.disabled = true;

        endBtn.disabled = false;

        micBtn.disabled = false;

        cameraBtn.disabled = false;

        screenBtn.disabled = false;


        setStatus(
            "Camera ready",
            true
        );


        createPeerConnection();


        /*
            Automatically join generated room.
        */

        if (!currentRoom) {

            currentRoom = myRoom;

            socket.emit(
                "join-room",
                currentRoom
            );

        }


    } catch (error) {

        console.error(error);

        alert(
            "Camera aur microphone permission allow karo."
        );

        setStatus(
            "Camera permission required"
        );

    }

}


// ===============================
// CREATE PEER CONNECTION
// ===============================

function createPeerConnection() {

    if (peerConnection) {

        return;

    }


    peerConnection =
        new RTCPeerConnection(
            configuration
        );


    // LOCAL TRACKS

    if (localStream) {

        localStream
            .getTracks()
            .forEach(track => {

                peerConnection.addTrack(
                    track,
                    localStream
                );

            });

    }


    // REMOTE TRACK

    peerConnection.ontrack =
        event => {

            if (
                event.streams &&
                event.streams[0]
            ) {

                remoteVideo.srcObject =
                    event.streams[0];

                remotePlaceholder
                    .classList
                    .add("hidden");

                setStatus(
                    "Connected",
                    true
                );

            }

        };


    // ICE

    peerConnection.onicecandidate =
        event => {

            if (event.candidate) {

                socket.emit(
                    "ice-candidate",
                    event.candidate
                );

            }

        };


    // CONNECTION STATE

    peerConnection.onconnectionstatechange =
        () => {

            const state =
                peerConnection
                    .connectionState;


            console.log(
                "Connection:",
                state
            );


            if (state === "connected") {

                setStatus(
                    "Connected",
                    true
                );

            }


            if (state === "connecting") {

                setStatus(
                    "Connecting..."
                );

            }


            if (state === "disconnected") {

                setStatus(
                    "Disconnected"
                );

            }


            if (state === "failed") {

                setStatus(
                    "Connection failed"
                );

            }

        };

}


// ===============================
// JOIN ROOM
// ===============================

joinBtn.addEventListener(
    "click",
    async () => {

        const room =
            roomInput.value
                .trim()
                .toUpperCase();


        if (!room) {

            showToast(
                "Room ID enter karo"
            );

            return;

        }


        if (!localStream) {

            await startCamera();

        }


        currentRoom = room;

        roomId.textContent =
            room;


        socket.emit(
            "join-room",
            room
        );


        setStatus(
            "Joining room..."
        );

    }
);


// ===============================
// WAITING
// ===============================

socket.on(
    "waiting",
    () => {

        setStatus(
            "Waiting for participant..."
        );

    }
);


// ===============================
// USER JOINED
// ===============================

socket.on(
    "user-joined",
    async () => {

        console.log(
            "Other user joined"
        );


        setStatus(
            "Connecting..."
        );


        await createOffer();

    }
);


// ===============================
// CREATE OFFER
// ===============================

async function createOffer() {

    if (!peerConnection) {

        createPeerConnection();

    }


    const offer =
        await peerConnection
            .createOffer();


    await peerConnection
        .setLocalDescription(
            offer
        );


    socket.emit(
        "offer",
        offer
    );

}


// ===============================
// RECEIVE OFFER
// ===============================

socket.on(
    "offer",
    async offer => {

        console.log(
            "Offer received"
        );


        if (!localStream) {

            await startCamera();

        }


        if (!peerConnection) {

            createPeerConnection();

        }


        await peerConnection
            .setRemoteDescription(
                new RTCSessionDescription(
                    offer
                )
            );


        const answer =
            await peerConnection
                .createAnswer();


        await peerConnection
            .setLocalDescription(
                answer
            );


        socket.emit(
            "answer",
            answer
        );

    }
);


// ===============================
// RECEIVE ANSWER
// ===============================

socket.on(
    "answer",
    async answer => {

        console.log(
            "Answer received"
        );


        if (!peerConnection) {

            return;

        }


        await peerConnection
            .setRemoteDescription(
                new RTCSessionDescription(
                    answer
                )
            );

    }
);


// ===============================
// ICE CANDIDATE
// ===============================

socket.on(
    "ice-candidate",
    async candidate => {

        try {

            if (
                peerConnection &&
                candidate
            ) {

                await peerConnection
                    .addIceCandidate(
                        new RTCIceCandidate(
                            candidate
                        )
                    );

            }

        } catch (error) {

            console.error(
                "ICE error:",
                error
            );

        }

    }
);


// ===============================
// ROOM FULL
// ===============================

socket.on(
    "room-full",
    () => {

        alert(
            "Ye room already full hai. Maximum 2 users allowed."
        );


        setStatus(
            "Room full"
        );

    }
);


// ===============================
// USER LEFT
// ===============================

socket.on(
    "user-left",
    () => {

        remoteVideo.srcObject =
            null;


        remotePlaceholder
            .classList
            .remove("hidden");


        setStatus(
            "Participant left"
        );

    }
);


// ===============================
// MICROPHONE
// ===============================

micBtn.addEventListener(
    "click",
    () => {

        if (!localStream) return;


        const tracks =
            localStream
                .getAudioTracks();


        tracks.forEach(track => {

            track.enabled =
                !track.enabled;

            micOn =
                track.enabled;

        });


        if (micOn) {

            micBtn.classList
                .remove("active");

            micBtn.innerHTML =
                "🎤 <span>Mute</span>";

        } else {

            micBtn.classList
                .add("active");

            micBtn.innerHTML =
                "🔇 <span>Unmute</span>";

        }

    }
);


// ===============================
// CAMERA
// ===============================

cameraBtn.addEventListener(
    "click",
    () => {

        if (!localStream) return;


        const tracks =
            localStream
                .getVideoTracks();


        tracks.forEach(track => {

            track.enabled =
                !track.enabled;

            cameraOn =
                track.enabled;

        });


        if (cameraOn) {

            cameraBtn.classList
                .remove("active");

            cameraBtn.innerHTML =
                "📹 <span>Camera</span>";

            localPlaceholder
                .classList
                .add("hidden");

        } else {

            cameraBtn.classList
                .add("active");

            cameraBtn.innerHTML =
                "🚫 <span>Camera Off</span>";

            localPlaceholder
                .classList
                .remove("hidden");

        }

    }
);


// ===============================
// SCREEN SHARE
// ===============================

screenBtn.addEventListener(
    "click",
    async () => {

        try {

            screenStream =
                await navigator.mediaDevices
                    .getDisplayMedia({

                        video: true,

                        audio: false

                    });


            const screenTrack =
                screenStream
                    .getVideoTracks()[0];


            const sender =
                peerConnection
                    ?.getSenders()
                    .find(
                        s =>
                            s.track &&
                            s.track.kind ===
                            "video"
                    );


            if (sender) {

                await sender.replaceTrack(
                    screenTrack
                );

            }


            localVideo.srcObject =
                screenStream;


            screenBtn.classList
                .add("active");


            setStatus(
                "Sharing screen",
                true
            );


            screenTrack.onended =
                async () => {

                    await stopScreenShare();

                };


        } catch (error) {

            console.log(
                "Screen sharing cancelled"
            );

        }

    }
);


// ===============================
// STOP SCREEN SHARE
// ===============================

async function stopScreenShare() {

    if (!screenStream) return;


    screenStream
        .getTracks()
        .forEach(
            track => track.stop()
        );


    screenStream = null;


    const cameraTrack =
        localStream
            ?.getVideoTracks()[0];


    const sender =
        peerConnection
            ?.getSenders()
            .find(
                s =>
                    s.track &&
                    s.track.kind ===
                    "video"
            );


    if (
        sender &&
        cameraTrack
    ) {

        await sender.replaceTrack(
            cameraTrack
        );

    }


    localVideo.srcObject =
        localStream;


    screenBtn.classList
        .remove("active");


    setStatus(
        "Camera active",
        true
    );

}


// ===============================
// END CALL
// ===============================

endBtn.addEventListener(
    "click",
    () => {

        if (localStream) {

            localStream
                .getTracks()
                .forEach(
                    track => track.stop()
                );

            localStream = null;

        }


        if (screenStream) {

            screenStream
                .getTracks()
                .forEach(
                    track => track.stop()
                );

            screenStream = null;

        }


        if (peerConnection) {

            peerConnection.close();

            peerConnection = null;

        }


        socket.emit(
            "leave-room"
        );


        localVideo.srcObject =
            null;

        remoteVideo.srcObject =
            null;


        remotePlaceholder
            .classList
            .remove("hidden");

        localPlaceholder
            .classList
            .remove("hidden");


        startBtn.disabled = false;

        endBtn.disabled = true;

        micBtn.disabled = true;

        cameraBtn.disabled = true;

        screenBtn.disabled = true;


        micBtn.classList
            .remove("active");

        cameraBtn.classList
            .remove("active");

        screenBtn.classList
            .remove("active");


        setStatus(
            "Call ended"
        );

    }
);


// ===============================
// COPY ROOM
// ===============================

copyBtn.addEventListener(
    "click",
    async () => {

        try {

            await navigator.clipboard
                .writeText(
                    roomId.textContent
                );


            showToast(
                "Room ID copied!"
            );

        } catch (error) {

            showToast(
                "Copy failed"
            );

        }

    }
);
