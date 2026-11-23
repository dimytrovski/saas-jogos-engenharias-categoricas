import { Server } from 'socket.io';
import { createServer } from 'http';

export const STUN_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' }
];

export function initSignalingServer(port: number = 3001) {
  const httpServer = createServer();
  const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] }
  });

  io.on('connection', (socket) => {
    console.log('Peer conectado ao nó de sinalização:', socket.id);

    socket.on('join-room', (roomId: string, peerId: string) => {
      socket.join(roomId);
      socket.to(roomId).emit('peer-joined', peerId);
    });

    socket.on('offer', (roomId: string, offer: RTCSessionDescriptionInit) => {
      socket.to(roomId).emit('offer', offer);
    });

    socket.on('answer', (roomId: string, answer: RTCSessionDescriptionInit) => {
      socket.to(roomId).emit('answer', answer);
    });

    socket.on('ice-candidate', (roomId: string, candidate: RTCIceCandidate) => {
      socket.to(roomId).emit('ice-candidate', candidate);
    });

    socket.on('disconnect', () => {
      console.log('Peer desconectado:', socket.id);
    });
  });

  httpServer.listen(port, () => {
    console.log(`Servidor de sinalização ativo na porta ${port}`);
  });
}
