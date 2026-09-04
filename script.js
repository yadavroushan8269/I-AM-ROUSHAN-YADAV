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
