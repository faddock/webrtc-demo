// script tag contents for html file 

const log = (...m) => (
    document.querySelector('#log').textContent += m.join(' ') + '\n'
);

document.querySelector('#connectButton').onclick = async () => {
  const ws = new WebSocket('ws://localhost:8200');
  const localConnection = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  });

  const sendChannel = localConnection.createDataChannel('sendChannel');
  sendChannel.onopen  = () => { 
    log('channel open'); 
    sendChannel.send('ping'); 
};
  sendChannel.onmessage = (e) => {
    log('received:', e.data);
  }

  localConnection.onicecandidate = ({ candidate }) => {
    if (candidate) ws.send(JSON.stringify({ type: 'candidate', candidate }));
  };

  ws.onmessage = async ({ data }) => {
    const msg = JSON.parse(data);
    if (msg.type === 'answer') await localConnection.setRemoteDescription(msg.answer);
    if (msg.type === 'candidate') await localConnection.addIceCandidate(msg.candidate);
  };

  ws.onopen = async () => {
    const offer = await localConnection.createOffer();
    await localConnection.setLocalDescription(offer);
    ws.send(JSON.stringify({ type: 'offer', offer }));
  };
};