"use client";

import React, { useState } from "react";

export default function LicenseAccessPanel() {
  const [streamId, setStreamId] = useState("1");
  const [buyerEmail, setBuyerEmail] = useState("parceiro.dispositivo@exemplo.com");
  const [targetDevice, setTargetDevice] = useState("any");
  const [amountCents, setAmountCents] = useState("999");
  const [currency, setCurrency] = useState("USD");

  const [licenseId, setLicenseId] = useState("");
  const [token, setToken] = useState("");
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [validationData, setValidationData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function handleRequestLicense(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatusMsg(null);
    setValidationData(null);
    try {
      const res = await fetch("/api/licenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          streamId: Number(streamId),
          buyerEmail,
          targetDevice,
          amountCents: Number(amountCents),
          currency,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao criar licenca pendente.");
      setLicenseId(String(data.id));
      setToken("");
      setStatusMsg(`Licenca #${data.id} criada como PENDING (aguardando pagamento).`);
    } catch (err: any) {
      setStatusMsg(`Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmPayment() {
    if (!licenseId) {
      setStatusMsg("Informe ou gere primeiro um ID de licenca.");
      return;
    }
    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/licenses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseId: Number(licenseId) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao ativar licenca.");
      setToken(data.access_token || "");
      setStatusMsg(`Pagamento confirmado! Licenca #${data.id} esta ACTIVE. Token gerado.`);
    } catch (err: any) {
      setStatusMsg(`Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleValidateAccess() {
    if (!streamId || !token) {
      setStatusMsg("Informe streamId e token para validar.");
      return;
    }
    setLoading(true);
    setStatusMsg(null);
    setValidationData(null);
    try {
      const params = new URLSearchParams({ streamId: String(streamId), token: token.trim() });
      const res = await fetch(`/api/licenses?${params.toString()}`);
      const data = await res.json();
      if (!res.ok || !data.allowed) {
        setStatusMsg(`Acesso negado: ${data.reason || data.error || "Token invalido."}`);
      } else {
        setValidationData(data.data);
        setStatusMsg("Acesso autorizado para qualquer dispositivo!");
      }
    } catch (err: any) {
      setStatusMsg(`Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto my-8 max-w-3xl rounded-xl border border-neutral-800 bg-neutral-950 p-6 text-neutral-100 shadow-lg">
      <h2 className="text-xl font-bold tracking-tight">Licenciamento &amp; Acesso Multi-Dispositivo</h2>
      <p className="mt-1 text-sm text-neutral-400">
        Solicite uma licenca pendente, simule o pagamento para gerar o token e valide o acesso em qualquer dispositivo.
      </p>

      <form onSubmit={handleRequestLicense} className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs text-neutral-300">
          Stream ID
          <input
            type="number"
            value={streamId}
            onChange={(e) => setStreamId(e.target.value)}
            className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white"
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-neutral-300">
          E-mail do Espectador / Parceiro
          <input
            type="email"
            value={buyerEmail}
            onChange={(e) => setBuyerEmail(e.target.value)}
            className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white"
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-neutral-300">
          Dispositivo Alvo (logica universal)
          <input
            type="text"
            value={targetDevice}
            onChange={(e) => setTargetDevice(e.target.value)}
            className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white"
          />
        </label>

        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1 text-xs text-neutral-300">
            Valor (centavos)
            <input
              type="number"
              value={amountCents}
              onChange={(e) => setAmountCents(e.target.value)}
              className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-neutral-300">
            Moeda
            <input
              type="text"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white"
            />
          </label>
        </div>

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            1. Pedir Licenca (Pending)
          </button>
        </div>
      </form>

      <div className="mt-6 border-t border-neutral-800 pt-5 space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 items-end">
          <label className="flex flex-col gap-1 text-xs text-neutral-300 sm:col-span-2">
            ID da Licenca para Confirmar Pagamento
            <input
              type="number"
              value={licenseId}
              onChange={(e) => setLicenseId(e.target.value)}
              placeholder="Ex.: 4"
              className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white"
            />
          </label>
          <button
            type="button"
            onClick={handleConfirmPayment}
            disabled={loading}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
          >
            2. Simular Pagamento (Active)
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 items-end">
          <label className="flex flex-col gap-1 text-xs text-neutral-300 sm:col-span-2">
            Access Token para Validar Dispositivo
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Token gerado apos pagamento"
              className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm font-mono text-white"
            />
          </label>
          <button
            type="button"
            onClick={handleValidateAccess}
            disabled={loading}
            className="rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-50"
          >
            3. Validar Acesso
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="mt-5 rounded-lg border border-neutral-700 bg-neutral-900 p-3 text-sm text-amber-200">
          {statusMsg}
        </div>
      )}

      {validationData && (
        <div className="mt-4 rounded-lg border border-emerald-700/60 bg-emerald-950/30 p-4 text-xs space-y-1">
          <p className="font-semibold text-emerald-300 text-sm">Transmissao Liberada</p>
          <p><span className="text-neutral-400">Partida:</span> {validationData.match_title} ({validationData.streamer_handle})</p>
          <p><span className="text-neutral-400">Status da Stream:</span> {validationData.stream_status}</p>
          <p><span className="text-neutral-400">Comprador:</span> {validationData.buyer_email}</p>
          <p className="break-all"><span className="text-neutral-400">URL da Stream:</span> {validationData.stream_url}</p>
        </div>
      )}
    </section>
  );
}