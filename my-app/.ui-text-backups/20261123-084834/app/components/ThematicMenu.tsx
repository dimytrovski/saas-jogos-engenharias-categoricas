'use client';

import React from 'react';
import { GAME_THEMES } from '../lib/themes';

export interface StreamChannel {
  id: string;
  name: string;
  gameTitle: string;
  themeId: string;
  hlsUrl: string;
  hostName: string;
  participantsCount: number;
}

interface ThematicMenuProps {
  channels: StreamChannel[];
  onSelectChannel: (channel: StreamChannel) => void;
  activeChannelId: string;
}

export default function ThematicMenu({ channels, onSelectChannel, activeChannelId }: ThematicMenuProps) {
  return (
    <div style={{ background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 16, padding: 24 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#f8fafc' }}>Canais em Destaque</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        {channels.map((channel) => {
          const theme = GAME_THEMES[channel.themeId] || GAME_THEMES.rpg;
          const isActive = channel.id === activeChannelId;

          return (
            <div
              key={channel.id}
              onClick={() => onSelectChannel(channel)}
              style={{
                cursor: 'pointer',
                background: isActive ? theme.backgroundGradient : 'rgba(30, 41, 59, 0.5)',
                border: '1px solid rgba(148, 163, 184, 0.25)',
                borderRadius: 12,
                padding: 16,
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', color: theme.accentColor }}>
                    {channel.gameTitle}
                  </span>
                  <h3 style={{ fontSize: 16, margin: '4px 0 0 0', color: '#fff' }}>{channel.name}</h3>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.4)', padding: '4px 8px', borderRadius: 999, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#ef4444' }}></span>
                  {channel.participantsCount.toLocaleString()}
                </div>
              </div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>
                Host: <strong>{channel.hostName}</strong>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
