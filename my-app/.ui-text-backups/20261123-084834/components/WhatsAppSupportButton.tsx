"use client";

import React from "react";
import {
  SUPPORT_WHATSAPP,
  getWhatsAppSupportUrl,
} from "@/data/support";

interface WhatsAppSupportButtonProps {
  message?: string;
  floating?: boolean;
  className?: string;
}

export default function WhatsAppSupportButton({
  message,
  floating = false,
  className = "",
}: WhatsAppSupportButtonProps) {
  const href = getWhatsAppSupportUrl(message);

  if (floating) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Suporte via WhatsApp ${SUPPORT_WHATSAPP.displayPhone}`}
        title={`Suporte WhatsApp: ${SUPPORT_WHATSAPP.displayPhone}`}
        className={`fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-xl hover:bg-emerald-500 transition ${className}`}
      >
        <span>WhatsApp Suporte</span>
        <span className="text-xs opacity-90">{SUPPORT_WHATSAPP.displayPhone}</span>
      </a>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition ${className}`}
    >
      <span>Suporte WhatsApp</span>
      <span className="text-xs font-normal opacity-95">
        {SUPPORT_WHATSAPP.displayPhone}
      </span>
    </a>
  );
}