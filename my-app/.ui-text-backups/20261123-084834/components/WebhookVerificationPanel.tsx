"use client";

import React, { useState } from "react";

interface WebhookTestResponse {
  ok: boolean;
  verified?: boolean;
  idempotentReplay?: boolean;
  eventId?: string;
  transactionId?: string;
  status?: string;
  amountBRL?: number;
  settlementVault?: string;
  message?: string;
  error?: string;
}

async function sha256Hex(message: string): Promise<string> {
  const secret = "dev-local-webhook-secret-change-in-production";
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuffer = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function WebhookVerificationPanel() {
  const [eventId, setEventId] = useState<string>("evt_brl_001");
  const [amountBRL, setAmountBRL] = useState<number>(24.9);
  const [method, setMethod] = useState<string>("Pix");
  const [sending, setSending] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<WebhookTestResponse | null>(null);

  async function dispatchWebhook(tamperSignature: boolean) {
    setSending(true);
    try {
      const payloadObj = {
        eventId: eventId.trim() || "evt_brl_001",
        transactionId: `txn_${(eventId.trim() || "evt_brl_001").replace(/[^a-zA-Z0-9_-]/g, "")}`,
        status: "approved",
        amountBRL: Number(amountBRL) || 24.9,
        method,
      };
      const rawBody = JSON.stringify(payloadObj);
      const validHex = await sha256Hex(rawBody);
      const signatureToSend = tamperSignature
        ? "0".repeat(64)
        : validHex;

      const res = await fetch("/api/webhooks/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-webhook-signature": signatureToSend,
        },
        body: rawBody,
      });
      const data = (await res.json()) as WebhookTestResponse;
      setLastResult(data);
    } finally {
      setSending(false);
    }
  }

  return (
    <section
      id="verificacao-webhook-seguro"
      aria-label="Validação de webhook seguro com assinatura HMAC e idempotência"
      className="w-full max-w-6xl mx-auto mt-10 rounded-2xl border-2 border-slate-200 bg-white p-5 sm:p-6 shadow-md text-left space-y-5"
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <span className="inline-block text-xs font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded bg-emerald-800 text-white mb-1">
            Auditoria Real • HMAC SHA-256 &amp; Idempotência
          </span>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
            Confirmação Antifraude de Pagamentos via Webhook (/api/webhooks/payment)
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Testa confirmação autenticada no servidor, bloqueio de assinatura
            inválida e proteção contra reenvio duplicado do mesmo eventId.
          </p>
        </div>

        <div className="rounded-xl bg-slate-950 text-white px-3.5 py-2 text-xs shrink-0">
          <div className="font-bold text-emerald-400">Destino Encapsulado</div>
          <div className="font-mono">VAULT-BRL-NUBANK-PROTECTED</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label
            htmlFor="wh-event-id"
            className="block text-xs font-extrabold text-slate-800 mb-1"
          >
            ID do Evento (teste repetir o mesmo ID)
          </label>
          <input
            id="wh-event-id"
            type="text"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-mono font-bold text-slate-900"
          />
        </div>

        <div>
          <label
            htmlFor="wh-amount"
            className="block text-xs font-extrabold text-slate-800 mb-1"
          >
            Valor confirmado (BRL)
          </label>
          <input
            id="wh-amount"
            type="number"
            min={1}
            step="0.1"
            value={amountBRL}
            onChange={(e) => setAmountBRL(Number(e.target.value))}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900"
          />
        </div>

        <div>
          <label
            htmlFor="wh-method"
            className="block text-xs font-extrabold text-slate-800 mb-1"
          >
            Método
          </label>
          <select
            id="wh-method"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900"
          >
            <option value="Pix">Pix</option>
            <option value="Cartão de Crédito">Cartão de Crédito</option>
            <option value="Cartão de Débito">Cartão de Débito</option>
            <option value="TED">TED</option>
            <option value="Boleto Bancário">Boleto Bancário</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2.5">
        <button
          type="button"
          onClick={() => dispatchWebhook(false)}
          disabled={sending}
          className="rounded-xl bg-emerald-700 hover:bg-emerald-600 disabled:opacity-60 text-white font-extrabold px-4 py-2.5 text-xs transition cursor-pointer"
        >
          {sending ? "Enviando..." : "Simular Webhook Assinado (Válido / Idempotente)"}
        </button>

        <button
          type="button"
          onClick={() => dispatchWebhook(true)}
          disabled={sending}
          className="rounded-xl bg-rose-700 hover:bg-rose-600 disabled:opacity-60 text-white font-extrabold px-4 py-2.5 text-xs transition cursor-pointer"
        >
          {sending ? "Enviando..." : "Simular Assinatura Inválida (Teste Antifraude)"}
        </button>
      </div>

      {lastResult && (
        <div
          className={`rounded-xl p-4 text-xs space-y-1 border ${
            lastResult.ok
              ? "bg-slate-950 text-white border-emerald-700"
              : "bg-rose-950 text-rose-100 border-rose-700"
          }`}
        >
          <div className="font-extrabold uppercase tracking-wider text-emerald-400">
            Resposta do Servidor • {lastResult.ok ? "ACEITO" : "REJEITADO"}
          </div>
          <p>{lastResult.message || lastResult.error}</p>
          {lastResult.eventId && (
            <p className="font-mono text-[11px] text-slate-300">
              eventId: {lastResult.eventId} | idempotentReplay:{" "}
              {String(Boolean(lastResult.idempotentReplay))} | vault:{" "}
              {lastResult.settlementVault || "N/A"}
            </p>
          )}
        </div>
      )}
    </section>
  );
}