"use client";

import React, { useRef } from "react";
import UniversalHlsPlayer, { UniversalHlsPlayerHandle } from "./components/UniversalHlsPlayer";

export default function HomePage() {
  const playerRef = useRef<UniversalHlsPlayerHandle | null>(null);

  return (
    <main style={{ padding: "2rem" }}>
      <h1>Live Stream HLS</h1>
      <UniversalHlsPlayer
        ref={playerRef}
        src="http://127.0.0.1/hls/teste.m3u8"
        title="Live Stream HLS"
      />
    </main>
  );
}