"use client";

import React, { useState, useEffect, useRef } from "react";
import UniversalHlsPlayer, { UniversalHlsPlayerHandle } from "../components/UniversalHlsPlayer";
import ThematicMenu, { StreamChannel } from "../components/ThematicMenu";
import { GAME_THEMES } from "../lib/themes";

const AUTHENTIC_CHANNELS: StreamChannel[] = [
  {
    id: "live-rpg-01",
    name: "Ordem Paranormal",
    gameTitle: "TTRPG Live Session",
    themeId: "rpg",
    hlsUrl: "https://test-streams.mux.dev/x30xhzz/x30xhzz.m3u8",
    hostName: "MestreKael",
    participantsCount: 1420
  },
  {
    id: "live-fps-02",
    name: "Global Offensive Pro",
    gameTitle: "Tactical Shooter",
    themeId: "fps",
    hlsUrl: "https://test-streams.mux.dev/x30xhzz/x30xhzz.m3u8",
    hostName: "ViperAim",
    participantsCount: 3890
  },
  {
    id: "live-racing-03",
    name: "Apex Masters",
    gameTitle: "Sim Racing League",
    themeId: "racing",
    hlsUrl: "https://test-streams.mux.dev/x30xhzz/x36xhzz/x30xhzz.m3u8",
    hostName: "ApexPredator",
    participantsCount: 856
  }
];

export default function DemostracaoPage() {
  const playerRef = useRef<UniversalHlsPlayerHandle | null>(null);
  const [activeChannel, setActiveChannel] = useState<StreamChannel>(AUTHENTIC_CHANNELS[0]);
  const [ping, setPing] = useState(24);
  const [jitter, setJitter] = useState(2);
  const [packetLoss, setPacketLoss] = useState(0.1);

  useEffect(() => {
    const interval = setInterval(() => {
      setPing(Math.floor(20 + Math.random() * 15));
      setJitter(Number((1 + Math.random() * 2).toFixed(1)));
      setPacketLoss(Number((Math.random() * 0.5).toFixed(2)));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const currentTheme = GAME_THEMES[activeChannel.themeId] || GAME_THEMES.rpg;

  const handleSelectChannel = (channel: StreamChannel) => {
    setActiveChannel(channel);
    playerRef.current?.loadStream(channel.hlsUrl);
  };

  return (
    <main style={{ 
      minHeight: "100vh", 
      background: currentTheme.backgroundGradient, 
      transition: "background 0.8s ease",
      color: "#f8fafc", 
      padding: "24px 16px",
      fontFamily: "system-ui, sans-serif"
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gap: 24 }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: 24, margin: 0, fontWeight: 800 }}>Arena Global SaaS</h1>
            
          </div>
          <div style={{ display: "flex", gap: 12, background: "rgba(0,0,0,0.4)", padding: "8px 16px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.1)", fontSize: 12 }}>
            <div>🟢 Latência: <strong style={{ color: currentTheme.accentColor }}>{ping}ms</strong></div>
            <div>|</div>
            <div>Jitter: <strong>{jitter}ms</strong></div>
            <div>|</div>
            <div>Perda: <strong>{packetLoss}%</strong></div>
          </div>
        </header>

        <UniversalHlsPlayer 
          ref={playerRef} 
          initialSrc={activeChannel.hlsUrl} 
          title={'Transmitindo: ' + activeChannel.gameTitle + ' - Sala: ' + activeChannel.name}
          glowStyle={currentTheme.glowIntensity}
        />

        <ThematicMenu 
          channels={AUTHENTIC_CHANNELS} 
          onSelectChannel={handleSelectChannel} 
          activeChannelId={activeChannel.id} 
        />
      </div>
    </main>
  );
}

