import { WebSocketServer } from 'ws';
import wrtc from '@roamhq/wrtc';

const wss = new WebSocketServer({ port: 8200 });``

function receiveChannelCallback(event) {
  const channel = event.channel;
  channel.onmessage = (messageEvent) => {
    console.log('Server got:', messageEvent.data);
    channel.send('pong');
  };
}

wss.on('connection', ws => {
  let remoteConnection = null;

  ws.on('message', async data => {
    const msg = JSON.parse(data);

    if (msg.type === 'offer') {
      remoteConnection = new wrtc.RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

     remoteConnection.ondatachannel = receiveChannelCallback;


      remoteConnection.onicecandidate = ({ candidate }) => {
        if (candidate) ws.send(JSON.stringify({ type: 'candidate', candidate }));
      };

      await remoteConnection.setRemoteDescription(msg.offer);
      const answer = await remoteConnection.createAnswer();
      await remoteConnection.setLocalDescription(answer);

      ws.send(JSON.stringify({ type: 'answer', answer }));
    }

    if (msg.type === 'candidate' && remoteConnection) {
      try { await remoteConnection.addIceCandidate(msg.candidate); } catch {}
    }
  });

  ws.on('close', () => remoteConnection && remoteConnection.close());
});