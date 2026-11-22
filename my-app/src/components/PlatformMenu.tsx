"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  detectPlatformProfile,
  getPlatformProfileById,
  normalizeAxis,
  PlatformId,
} from "../lib/platform-adapters";

export interface MenuActionItem {
  id: string;
  label: string;
  description?: string;
  onSelect: () => void;
}

interface PlatformMenuProps {
  items: MenuActionItem[];
  overridePlatform?: PlatformId;
}

export default function PlatformMenu({ items, overridePlatform }: PlatformMenuProps) {
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const lastStepTimeRef = useRef<number>(0);
  const prevConfirmPressedRef = useRef<boolean>(false);

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [detectedId, setDetectedId] = useState<PlatformId>("windows");

  useEffect(() => {
    const profile = detectPlatformProfile(navigator.userAgent || "");
    setDetectedId(profile.id);
  }, []);

  const activeProfile = useMemo(() => {
    return overridePlatform ? getPlatformProfileById(overridePlatform) : getPlatformProfileById(detectedId);
  }, [overridePlatform, detectedId]);

  const focusItem = (index: number) => {
    if (items.length === 0) return;
    const wrapped = ((index % items.length) + items.length) % items.length;
    setActiveIndex(wrapped);
    const el = buttonRefs.current[wrapped];
    if (el) {
      el.focus({ preventScroll: true });
      el.scrollIntoView({ behavior: activeProfile.scrollBehavior, block: "nearest" });
    }
  };

  // Navegação via Analógico Esquerdo (axes[0] = X, axes[1] = Y) e botão A/X (buttons[0])
  useEffect(() => {
    if (items.length === 0) return;

    const timer = window.setInterval(() => {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      const pad = Array.from(gamepads).find((gp): gp is Gamepad => Boolean(gp && gp.connected));
      if (!pad) return;

      const lx = normalizeAxis(pad.axes[0] ?? 0, activeProfile.deadzone);
      const ly = normalizeAxis(pad.axes[1] ?? 0, activeProfile.deadzone);
      const now = performance.now();

      // Move entre itens com analógico esquerdo (horizontal ou vertical)
      const moveDelta = Math.abs(lx) > Math.abs(ly) ? lx : ly;
      if (Math.abs(moveDelta) > 0.35 && now - lastStepTimeRef.current > 210) {
        lastStepTimeRef.current = now;
        focusItem(activeIndex + (moveDelta > 0 ? 1 : -1));
      }

      // Confirma seleção com botão principal do controle (ex.: A no Xbox, X no PlayStation, B/A conforme mapeamento)
      const confirmPressed = Boolean(pad.buttons[0]?.pressed);
      if (confirmPressed && !prevConfirmPressedRef.current) {
        const current = items[activeIndex];
        if (current) current.onSelect();
      }
      prevConfirmPressedRef.current = confirmPressed;
    }, activeProfile.pollIntervalMs);

    return () => window.clearInterval(timer);
  }, [items, activeIndex, activeProfile]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, idx: number) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      focusItem(idx + 1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      focusItem(idx - 1);
    }
  };

  return (
    <section aria-label="Menu de navegação" style={{ display: "grid", gap: 12 }}>
      <div style={{ fontSize: 13, opacity: 0.8 }}>
        Perfil ativo: <strong>{activeProfile.label}</strong> (Mouse, Teclado ou Analógico Esquerdo)
      </div>

      <div
        role="menu"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
        }}
      >
        {items.map((item, idx) => {
          const isFocused = idx === activeIndex;
          return (
            <button
              key={item.id}
              ref={(el) => {
                buttonRefs.current[idx] = el;
              }}
              type="button"
              role="menuitem"
              tabIndex={0}
              onMouseEnter={() => setActiveIndex(idx)}
              onFocus={() => setActiveIndex(idx)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              onClick={item.onSelect}
              style={{
                textAlign: "left",
                padding: "14px 16px",
                borderRadius: 10,
                cursor: "pointer",
                background: isFocused ? "#1e293b" : "#111827",
                color: "#f8fafc",
                border: isFocused
                  ? `2px solid ${activeProfile.focusRingColor}`
                  : "1px solid #334155",
                outline: "none",
                transition: "border-color 120ms ease, background 120ms ease",
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 16 }}>{item.label}</div>
              {item.description ? (
                <div style={{ fontSize: 13, opacity: 0.75, marginTop: 4 }}>{item.description}</div>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
