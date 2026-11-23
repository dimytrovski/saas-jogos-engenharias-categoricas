"use client";

import React, { useMemo, useState } from "react";
import {
  selectIdealGateways,
  type GatewayBuyerScope,
  type GatewayMethod,
} from "@/data/paymentGatewayConnectors";

interface PreparedSessionResult {
  sessionReference: string;
  settlementCurrency: string;
  estimatedAmountBrl: number;
  settlementVault: string;
  message: string;
}

const METHODS: GatewayMethod[] = [
  "Pix",
  "Cartão de Crédito",
  "Cartão de Débito",
  "TED",
  "Boleto Bancário",
];

export default function DecisionGatewayConnector() {
  const [scope, setScope] = useState<GatewayBuyerScope>("misto_global_brl");
  const [method, setMethod] = useState<GatewayMethod>("Pix");
  const [planName, setPlanName] = useState<string>("Pro Fluxo (R$ 24,90)");
  const [loading, setLoading] = useState<boolean>(false);
  const [sessionResult, setSessionResult] = useState<PreparedSessionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const recommendedGateways = useMemo(
    () => selectIdealGateways(scope, method),
    [scope, method]
  );

  const amountBrl = planName.includes("89") ? 89 : 24.9;

  async function handlePrepareSecureConnection() {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/decision-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope,
          method,
          planName,
          amountBrl,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorMsg(data.error || "Falha ao preparar conexÃ£o segura.");
      } else {
        setSessionResult(data);
      }
    } catch {
      setErrorMsg("Erro de rede ao conectar Ã  rota segura de decisÃ£o.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto mt-6 rounded-2xl border-2 border-slate-200 bg-white p-5 sm:p-6 shadow-md text-left space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <span className="inline-block text-xs font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded bg-blue-700 text-white mb-1">
            ConexÃ£o Segura com Gateways â€¢ Central de DecisÃ£o Inteligente
          </span>
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
            Roteador Seguro de Gateways para BRL e Escala Global
          </h3>
          
        </div>

        <button
          type="button"
          onClick={handlePrepareSecureConnection}
          disabled={loading}
          className="rounded-xl bg-emerald-700 hover:bg-emerald-600 disabled:opacity-60 text-white font-extrabold px-4 py-2.5 text-xs sm:text-sm transition cursor-pointer shrink-0"
        >
          {loading ? "Preparando..." : "Gerar SessÃ£o Encapsulada"}
        </button>
      </div>

      {/* Filtros de perfil do comprador, mÃ©todo e plano */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label
            htmlFor="gateway-scope-select"
            className="block text-xs font-extrabold text-slate-800 mb-1"
          >
            Perfil de compradores
          </label>
          <select
            id="gateway-scope-select"
            value={scope}
            onChange={(e) => setScope(e.target.value as GatewayBuyerScope)}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900"
          >
            <option value="misto_global_brl">Global + Brasil (ConversÃ£o/LiquidaÃ§Ã£o BRL)</option>
            <option value="brasil_brl">Foco Brasil (Pix, Boleto, CartÃ£o e TED em BRL)</option>
            <option value="global_fx">Internacional / FX (CartÃµes Globais)</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="gateway-method-select"
            className="block text-xs font-extrabold text-slate-800 mb-1"
          >
            MÃ©todo de pagamento
          </label>
          <select
            id="gateway-method-select"
            value={method}
            onChange={(e) => setMethod(e.target.value as GatewayMethod)}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900"
          >
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="gateway-plan-select"
            className="block text-xs font-extrabold text-slate-800 mb-1"
          >
            Plano / referÃªncia de valor
          </label>
          <select
            id="gateway-plan-select"
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900"
          >
            <option value="Pro Fluxo (R$ 24,90)">Pro Fluxo â€” R$ 24,90/mÃªs</option>
            <option value="Founder VitalÃ­cio (R$ 89)">Founder VitalÃ­cio â€” R$ 89 Ãºnico</option>
          </select>
        </div>
      </div>

      {/* Gateways ideais encontrados para o contexto */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {recommendedGateways.map((gw) => (
          <div
            key={gw.id}
            className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-extrabold text-slate-900">
                {gw.gatewayName}
              </span>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                {gw.envVarName}
              </span>
            </div>
            <p className="text-xs text-slate-700">
              <strong>Ideal para:</strong> {gw.recommendedFor}
            </p>
            <p className="text-xs text-slate-700">
              <strong>MÃ©todos:</strong> {gw.supportedMethods.join(" â€¢ ")}
            </p>
            <p className="text-xs text-slate-700">
              <strong>BRL / ConversÃ£o:</strong> {gw.brlSettlementNotes}
            </p>
            <p className="text-xs text-emerald-950 bg-emerald-50 border border-emerald-200 rounded-lg p-2">
              <strong>ProteÃ§Ã£o:</strong> {gw.securityControl}
            </p>
          </div>
        ))}
      </div>

      {errorMsg && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-bold text-rose-800">
          {errorMsg}
        </div>
      )}

      {sessionResult && (
        <div className="rounded-xl bg-slate-950 text-white p-4 text-xs space-y-1">
          <div className="font-extrabold uppercase tracking-wider text-emerald-400">
            SessÃ£o Encapsulada Gerada no Servidor
          </div>
          <p>
            <strong>ReferÃªncia:</strong>{" "}
            <code className="text-sky-300">{sessionResult.sessionReference}</code> â€¢{" "}
            <strong>Destino:</strong>{" "}
            <code className="text-emerald-300">{sessionResult.settlementVault}</code>
          </p>
          <p>
            <strong>LiquidaÃ§Ã£o estimada:</strong>{" "}
            {sessionResult.estimatedAmountBrl.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}{" "}
            ({sessionResult.settlementCurrency})
          </p>
          <p className="text-slate-300">{sessionResult.message}</p>
        </div>
      )}
    </div>
  );
}
