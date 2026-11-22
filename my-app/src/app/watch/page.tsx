"use client";

import React, { useState } from "react";
import UniversalHlsPlayer from "@/components/UniversalHlsPlayer";
import PlatformMenu, { MenuActionItem } from "@/components/PlatformMenu";
import { PlatformId } from "@/lib/platform-adapters";

const PLATFORMS: PlatformId[] = ["windows", "macos", "playstation", "xbox", "nintendo"];

export default function WatchPage() {
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformId | undefined>(undefined);
  const [streamUrl, setStreamUrl] = useState<string>("/hls/teste.m3u8");
  const [statusMessage, setStatusMessage] = useState<string>("Pronto para navegar por rato, teclado ou analógico esquerdo.");

  const menuItems: MenuActionItem[] = [
    {
      id: "stream-main",
      label: "Stream Principal (teste.m3u8)",
      description: "Reproduz o fluxo HLS ativo em C:\\tmp\\hls",
      onSelect: () => {
        setStreamUrl("/hls/teste.m3u8");
        setStatusMessage("Carregado: /hls/teste.m3u8");
      },
    },
    {
      id: "cycle-platform",
      label: "Alternar Perfil de Plataforma",
      description: selectedPlatform
        ? `Perfil forçado atual: ${selectedPlatform} (clique para avançar)`
        : "Deteção automática ativa (clique para testar perfis manualmente)",
      onSelect: () => {
        setSelectedPlatform((prev) => {
          if (!prev) return "windows";
          const idx = PLATFORMS.indexOf(prev);
          const next = PLATFORMS[(idx + 1) % PLATFORMS.length];
          setStatusMessage(`Perfil de teste selecionado: ${next}`);
          return next;
        });
      },
    },
    {
      id: "auto-platform",
      label: "Modo Automático por Dispositivo",
      description: "Volta a usar o User-Agent detetado no navegador atual",
      onSelect: () => {
        setSelectedPlatform(undefined);
        setStatusMessage("Modo automático reativado.");
      },
    },
    {
      id: "copy-lan-hint",
      label: "Endereço da Rede Local (Porta 80)",
      description: "Usa http://192.168.0.152/watch noutros equipamentos da rede",
      onSelect: () => {
        setStatusMessage("Endereço LAN: http://192.168.0.152/watch");
      },
    },
  ];

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0b0f19",
        color: "#f9fafb",
        padding: "24px 16px 48px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1120, margin: "0 auto", display: "grid", gap: 24 }}>
        <UniversalHlsPlayer src={streamUrl} title="Arena Indie — Transmissão Universal" />

        <div
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            background: "#111827",
            border: "1px solid #1f2937",
            fontSize: 14,
            color: "#cbd5e1",
          }}
        >
          {statusMessage}
        </div>

        <PlatformMenu items={menuItems} overridePlatform={selectedPlatform} />
      </div>
    </main>
  );
}
