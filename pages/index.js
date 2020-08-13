import Head from 'next/head'
import { useEffect, useState } from 'react'
import io from 'socket.io-client';
import Peer from 'simple-peer'

let socket
export default function Page() {
  const [msg, setMsg] = useState("hello")
  const [roomName, setRoomName] = useState("")
  const [listUser, setListUser] = useState([])
  const [stream, setStream] = useState(undefined)
  const [incomingCall, setIncomingCall] = useState(false)
  const [incomingSignal, setIncomingSignal] = useState(undefined)
  useEffect(() => {
    socket = io();
    socket.on("greeting", data => {
      setMsg(data.message)
      socket.emit("greeting", { message: "hello from client" })
    })
    socket.on("joined-room", data => {
      setListUser(data.socketInRoom)
    })
    socket.on("make-call", data => {
      setIncomingCall(data.callFrom)
      setIncomingSignal(data.signal)
    })


    navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    })
      .then((stream) => {
        const currentUserVideo = document.getElementById('current-user-video')
        currentUserVideo.srcObject = stream
        currentUserVideo.autoplay = true;
        setStream(stream)
      }
    );
  }, [])

  const handleJoinClick = () => {
    socket.emit("join-room", { name: roomName })
  }

  const handleCall = (socketId) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream,
    })
    peer.on('signal', signal => {
      socket.emit("make-call", { targetSocket: socketId, fromSocket: socket.id, signal })
    })

    peer.on('stream', stream => {
      const friendUserVideo = document.getElementById('friend-user-video')
      friendUserVideo.srcObject = stream
      friendUserVideo.autoplay = true;
    })
    socket.on("answer-call", data => {
      peer.signal(data.signal)
    })
  }

  const answerCall = () => {
    setIncomingCall(false)
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream,
    });
    peer.on("signal", signal => {
      socket.emit("answer-call", { targetSocket: incomingCall, fromSocket: socket.id, signal })
    })

    peer.on("stream", stream => {
      const friendUserVideo = document.getElementById('friend-user-video')
      friendUserVideo.srcObject = stream
      friendUserVideo.autoplay = true;
    });
    peer.signal(incomingSignal)
  }

  return (
    <div className="page-container">
      <Head>
        <title>Video Chat</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div>
        <video id="current-user-video" />
      </div>
      <div>
        <video id="friend-user-video" />
      </div>
      {incomingCall? <div><button onClick={answerCall}>Answer</button></div> : null}
      <div>Greeting: {msg}</div>
      <input
        type="text"
        onChange={e => setRoomName(e.target.value)}
        value={roomName}
      />
      <button onClick={handleJoinClick}>Join</button>

      <div>
        {listUser.map(socketId => {
          return (
            <div key={socketId}>
              <button onClick={() => handleCall(socketId)}>Call->{socketId}</button> {socketId === socket.id ? "<--- is you" : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
