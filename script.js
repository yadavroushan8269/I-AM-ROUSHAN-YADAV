/* =========================================
   WEBRTC VIDEO CALL
========================================= */


/* Elements */

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

const startBtn = document.getElementById("startBtn");
const hangupBtn = document.getElementById("hangupBtn");

const micBtn = document.getElementById("micBtn");
const videoBtn = document.getElementById("videoBtn");
const screenBtn = document.getElementById("screenBtn");

const roomInput = document.getElementById("roomInput");
const joinBtn = document.getElementById("joinBtn");

const roomIdElement = document.getElementById("roomId");
const copyRoomBtn = document.getElementById("copyRoomBtn");

const statusText = document.getElementById("statusText");
const statusDot = document.getElementById("statusDot");

const remotePlaceholder =
    document.getElementById("remotePlaceholder");

const localPlaceholder =
    document.getElementById("localPlaceholder");

const toast = document.getElementById("toast");


/* =========================================
   VARIABLES
========================================= */

let localStream = null;

let screenStream = null;

let peerConnection = null;

let isMicOn = true;

let isVideoOn = true;


/*
    Google STUN server.

    This helps browsers discover their
    public network address.

    NOTE:
    STUN alone is NOT enough for a complete
    production calling system.
*/

const rtcConfig = {

    iceServers: [

        {
            urls: "stun:stun.l.google.com:19302"
        },

        {
            urls: "stun:stun1.l.google.com:19302"
        }

    ]

};


/* =========================================
   ROOM ID
========================================= */

function generateRoomId() {

    const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    let id = "";

    for (let i = 0; i < 6; i++) {

        id += chars[
            Math.floor(Math.random() * chars.length)
        ];

    }

    return "ROOM-" + id;
}


const generatedRoom = generateRoomId();

roomIdElement.textContent = generatedRoom;


/* =========================================
   STATUS
========================================= */

function setStatus(message, active = false) {

    statusText.textContent = message;

    if (active) {

        statusDot.classList.add("active");

    } else {

        statusDot.classList.remove("active");

    }
}


/* =========================================
   TOAST
========================================= */

function showToast(message) {

    toast.textContent = message;

    toast.classList.add("show");

    setTimeout(() => {

        toast.classList.remove("show");

    }, 2500);

}


/* =========================================
   START CAMERA
========================================= */

async function startCamera() {

    try {

        localStream =
            await navigator.mediaDevices.getUserMedia({

                video: {
                    width: {
                        ideal: 1280
                    },

                    height: {
                        ideal: 720
                    }
                },

                audio: true

            });


        localVideo.srcObject = localStream;


        localPlaceholder.classList.add("hidden");


        startBtn.disabled = true;

        hangupBtn.disabled = false;


        micBtn.disabled = false;

        videoBtn.disabled = false;

        screenBtn.disabled = false;


        setStatus(
            "Camera and microphone ready",
            true
        );


        /*
            Create peer connection.

            This becomes useful when the signaling
            server exchanges SDP/ICE information.
        */

        createPeerConnection();


    } catch (error) {

        console.error(error);

        setStatus(
            "Camera/microphone permission denied"
        );

        alert(
            "Camera aur microphone permission allow karo."
        );

    }

}


/* =========================================
   CREATE PEER CONNECTION
========================================= */

function createPeerConnection() {

    peerConnection =
        new RTCPeerConnection(rtcConfig);


    /*
        Add local tracks
    */

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


    /*
        Receive remote tracks
    */

    peerConnection.ontrack = event => {

        if (event.streams && event.streams[0]) {

            remoteVideo.srcObject =
                event.streams[0];

            remotePlaceholder.classList.add(
                "hidden"
            );

            setStatus(
                "Connected",
                true
            );

        }

    };


    /*
        ICE candidates

        These need to be sent to the other
        browser through a signaling server.
    */

    peerConnection.onicecandidate = event => {

        if (event.candidate) {

            console.log(
                "ICE candidate:",
                event.candidate
            );

            /*
                TODO:

                socket.emit("ice-candidate",
                    event.candidate
                );
            */

        }

    };


    /*
        Connection state
    */

    peerConnection.onconnectionstatechange =
        () => {

            console.log(
                "Connection:",
                peerConnection.connectionState
            );

            switch (
                peerConnection.connectionState
            ) {

                case "connected":

                    setStatus(
                        "Connected",
                        true
                    );

                    break;


                case "connecting":

                    setStatus(
                        "Connecting..."
                    );

                    break;


                case "disconnected":

                    setStatus(
                        "Disconnected"
                    );

                    break;


                case "failed":

                    setStatus(
                        "Connection failed"
                    );

                    break;


                case "closed":

                    setStatus(
                        "Call ended"
                    );

                    break;

            }

        };

}


/* =========================================
   MICROPHONE
========================================= */

function toggleMicrophone() {

    if (!localStream) return;


    const audioTracks =
        localStream.getAudioTracks();


    audioTracks.forEach(track => {

        track.enabled = !track.enabled;

        isMicOn = track.enabled;

    });


    if (isMicOn) {

        micBtn.classList.remove("active");

        micBtn.querySelector(".icon")
            .textContent = "🎤";

        micBtn.querySelector("span:last-child")
            .textContent = "Mute";

    } else {

        micBtn.classList.add("active");

        micBtn.querySelector(".icon")
            .textContent = "🔇";

        micBtn.querySelector("span:last-child")
            .textContent = "Unmute";

    }

}


/* =========================================
   CAMERA
========================================= */

function toggleCamera() {

    if (!localStream) return;


    const videoTracks =
        localStream.getVideoTracks();


    videoTracks.forEach(track => {

        track.enabled = !track.enabled;

        isVideoOn = track.enabled;

    });


    if (isVideoOn) {

        videoBtn.classList.remove("active");

        videoBtn.querySelector(".icon")
            .textContent = "📹";

        videoBtn.querySelector("span:last-child")
            .textContent = "Camera";

        localPlaceholder.classList.add(
            "hidden"
        );

    } else {

        videoBtn.classList.add("active");

        videoBtn.querySelector(".icon")
            .textContent = "🚫";

        videoBtn.querySelector("span:last-child")
            .textContent = "Camera Off";

        localPlaceholder.classList.remove(
            "hidden"
        );

    }

}


/* =========================================
   SCREEN SHARING
========================================= */

async function shareScreen() {

    try {

        screenStream =
            await navigator.mediaDevices.getDisplayMedia({

                video: true,

                audio: true

            });


        const screenTrack =
            screenStream.getVideoTracks()[0];


        if (!localStream) {

            localStream =
                new MediaStream();

        }


        /*
            Show screen locally
        */

        localVideo.srcObject =
            screenStream;


        /*
            Replace camera track in WebRTC
        */

        if (peerConnection) {

            const sender =
                peerConnection
                    .getSenders()
                    .find(
                        sender =>
                            sender.track &&
                            sender.track.kind === "video"
                    );


            if (sender) {

                await sender.replaceTrack(
                    screenTrack
                );

            }

        }


        screenTrack.onended =
            () => {

                stopScreenShare();

            };


        screenBtn.classList.add("active");

        setStatus(
            "Screen sharing",
            true
        );


    } catch (error) {

        console.log(
            "Screen sharing cancelled"
        );

    }

}


/* =========================================
   STOP SCREEN SHARE
========================================= */

async function stopScreenShare() {

    if (screenStream) {

        screenStream
            .getTracks()
            .forEach(track =>
                track.stop()
            );

        screenStream = null;

    }


    /*
        Return to camera
    */

    if (localStream) {

        localVideo.srcObject =
            localStream;


        const cameraTrack =
            localStream.getVideoTracks()[0];


        if (peerConnection && cameraTrack) {

            const sender =
                peerConnection
                    .getSenders()
                    .find(
                        sender =>
                            sender.track &&
                            sender.track.kind === "video"
                    );


            if (sender) {

                await sender.replaceTrack(
                    cameraTrack
                );

            }

        }

    }


    screenBtn.classList.remove("active");

    setStatus(
        "Camera active",
        true
    );

}


/* =========================================
   END CALL
========================================= */

function endCall() {

    /*
        Stop local media
    */

    if (localStream) {

        localStream
            .getTracks()
            .forEach(track =>
                track.stop()
            );

        localStream = null;

    }


    /*
        Stop screen
    */

    if (screenStream) {

        screenStream
            .getTracks()
            .forEach(track =>
                track.stop()
            );

        screenStream = null;

    }


    /*
        Close WebRTC
    */

    if (peerConnection) {

        peerConnection.close();

        peerConnection = null;

    }


    localVideo.srcObject = null;

    remoteVideo.srcObject = null;


    localPlaceholder.classList.remove(
        "hidden"
    );

    remotePlaceholder.classList.remove(
        "hidden"
    );


    startBtn.disabled = false;

    hangupBtn.disabled = true;

    micBtn.disabled = true;

    videoBtn.disabled = true;

    screenBtn.disabled = true;


    isMicOn = true;

    isVideoOn = true;


    setStatus(
        "Call ended"
    );

}


/* =========================================
   COPY ROOM ID
========================================= */

copyRoomBtn.addEventListener(
    "click",
    async () => {

        try {

            await navigator.clipboard.writeText(
                roomIdElement.textContent
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


/* =========================================
   JOIN ROOM
========================================= */

joinBtn.addEventListener(
    "click",
    () => {

        const room =
            roomInput.value.trim();


        if (!room) {

            showToast(
                "Room ID enter karo"
            );

            return;

        }


        /*
            Normally yahan signaling server
            ko room join message bhejna hoga.

            Example:

            socket.emit("join-room", room);
        */


        roomIdElement.textContent =
            room.toUpperCase();


        showToast(
            "Joined " + room.toUpperCase()
        );


        setStatus(
            "Waiting for participant..."
        );

    }
);


/* =========================================
   BUTTON EVENTS
========================================= */

startBtn.addEventListener(
    "click",
    startCamera
);


micBtn.addEventListener(
    "click",
    toggleMicrophone
);


videoBtn.addEventListener(
    "click",
    toggleCamera
);


screenBtn.addEventListener(
    "click",
    async () => {

        if (screenStream) {

            await stopScreenShare();

        } else {

            await shareScreen();

        }

    }
);


hangupBtn.addEventListener(
    "click",
    endCall
);


/* =========================================
   INITIAL STATE
========================================= */

micBtn.disabled = true;

videoBtn.disabled = true;

screenBtn.disabled = true;

hangupBtn.disabled = true;


setStatus(
    "Ready to connect"
);
