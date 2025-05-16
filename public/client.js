const log = (...m) => (document.querySelector('#log').textContent += m.join(' ') + '\n');

document.querySelector('#connectButton').onclick = async () => {
  const ws = new WebSocket('ws://localhost:8200');
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  });

  const dc = pc.createDataChannel('demo');
  dc.onopen  = () => { 
    log('channel open'); 
    dc.send('ping'); };
  dc.onmessage = e => {
    log('received:', e.data);
  }

  pc.onicecandidate = ({ candidate }) => {
    if (candidate) ws.send(JSON.stringify({ type: 'candidate', candidate }));
  };

  ws.onmessage = async ({ data }) => {
    const msg = JSON.parse(data);
    if (msg.type === 'answer') await pc.setRemoteDescription(msg.answer);
    if (msg.type === 'candidate') await pc.addIceCandidate(msg.candidate);
  };

  ws.onopen = async () => {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    ws.send(JSON.stringify({ type: 'offer', offer }));
  };
};