import OBSWebSocket from 'obs-websocket-js';

const obs = new OBSWebSocket();

async function startStream() {
try {
await obs.connect('ws://localhost:4445', 'sua_senha');
await obs.call('StartOutput', { outputName: 'virtual-cam' });
console.log('Transmissão iniciada.');
} catch (error) {
console.error('Erro ao conectar:', error);
}
}

startStream();