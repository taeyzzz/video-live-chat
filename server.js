const express = require('express')
const next = require('next')
const http = require("http")
const socketIO = require("socket.io")

const PORT = process.env.PORT || 3000
const dev = process.env.NODE_ENV !== 'production'
const nextApp = next({ dev })
const handle = nextApp.getRequestHandler()

nextApp.prepare().then(() => {
  const app = express()
  const server = http.Server(app)
  const io = socketIO(server)

  io.on('connection', socket => {
    console.log('socket connect');
    socket.emit("greeting", { message: "hello from server" })
    socket.on("join-room", data => {
      socket.join(data.name);
      io.in(data.name).emit("joined-room", { socketInRoom: io.sockets.adapter.rooms[data.name]? Object.keys(io.sockets.adapter.rooms[data.name].sockets) : [] })
      socket.on("disconnect", () => {
        io.in(data.name).emit("joined-room", { socketInRoom: io.sockets.adapter.rooms[data.name]? Object.keys(io.sockets.adapter.rooms[data.name].sockets) : []})
      })
    })
    socket.on("make-call", data => {
      io.to(data.targetSocket).emit("make-call", { callFrom: data.fromSocket, signal: data.signal })
    })
    socket.on("answer-call", data => {
      io.to(data.targetSocket).emit("answer-call", { callFrom: data.fromSocket, signal: data.signal })
    })
    socket.on("greeting", data => {
      console.log(data);
    })
  });
  app.use(handle)

  server.listen(PORT, (err) => {
    if (err) throw err
    console.log(`> Ready on http://localhost:${PORT}`)
  })
})
