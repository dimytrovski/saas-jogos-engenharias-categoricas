import { useState, useEffect } from 'react';

export interface NetworkMetrics {
  ping: number;
  jitter: number;
  packetLoss: number;
  bitrate: string;
  connectionState: RTCIceConnectionState;
}

export function useWebRTCTelemetry(peerConnection: RTCPeerConnection | null) {
  const [metrics, setMetrics] = useState<NetworkMetrics>({
    ping: 0,
    jitter: 0,
    packetLoss: 0,
    bitrate: '0 Mbps',
    connectionState: 'new'
  });

  useEffect(() => {
    if (!peerConnection) return;

    const updateConnectionState = () => {
      setMetrics(prev => ({ ...prev, connectionState: peerConnection.iceConnectionState }));
    };

    peerConnection.addEventListener('iceconnectionstatechange', updateConnectionState);

    const interval = setInterval(async () => {
      if (peerConnection.connectionState === 'connected') {
        const stats = await peerConnection.getStats();
        let activeCandidatePair: RTCStats | null = null;
        let inboundVideoRtp: RTCStats | null = null;

        stats.forEach(report => {
          if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            activeCandidatePair = report;
          }
          if (report.type === 'inbound-rtp' && report.kind === 'video') {
            inboundVideoRtp = report;
          }
        });

        if (activeCandidatePair) {
          const rtt = (activeCandidatePair as any).currentRoundTripTime || 0;
          const jitter = (activeCandidatePair as any).jitter || 0;
          setMetrics(prev => ({
            ...prev,
            ping: Math.round(rtt * 1000),
            jitter: Number((jitter * 1000).toFixed(1))
          }));
        }

        if (inboundVideoRtp) {
          const bytesReceived = (inboundVideoRtp as any).bytesReceived || 0;
          const packetsLost = (inboundVideoRtp as any).packetsLost || 0;
          setMetrics(prev => ({
            ...prev,
            packetLoss: Number((packetsLost * 0.01).toFixed(1)),
            bitrate: "\ Mbps"
          }));
        }
      }
    }, 2000);

    return () => {
      clearInterval(interval);
      peerConnection.removeEventListener('iceconnectionstatechange', updateConnectionState);
    };
  }, [peerConnection]);

  return metrics;
}
