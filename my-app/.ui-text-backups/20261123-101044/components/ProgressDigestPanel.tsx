"use client";

import React, { useEffect, useState } from "react";

interface ScheduleItem {
  id: number;
  player_id: string;
  player_name: string;
  player_email: string;
  identity_role: string;
  identity_bio: string | null;
  brand_logo_url: string;
  brand_name: string;
  timezone: string;
  scheduled_for: string;
  frequency_mode: "once" | "weekly" | "biweekly" | "monthly";
  preferred_hour: number;
  focus_goal: string;
  progress_score: string | number;
  progress_summary: string | null;
  send_by_default: number | boolean;
  status: "pending" | "sent" | "cancelled";
  last_sent_at: string | null;
}

interface EmailPreviewPayload {
  to: string;
  sendByDefault: boolean;
  subject: string;
  html: string;
  text: string;
  headerHtml: string;
}

interface LiveMappedRecord {
  raw: Record<string, unknown>;
  profile: {
    playerId: string;
    playerName: string;
    playerEmail: string;
    identityRole: string;
    identityBio: string;
    progressScore: number;
    progressSummary: string;
  };
}

export interface ProgressDigestPanelProps {
  defaultPlayerId?: string;
  defaultPlayerName?: string;
  defaultPlayerEmail?: string;
  defaultBrandName?: string;
  defaultBrandLogoUrl?: string;
  defaultIdentityRole?: string;
  defaultIdentityBio?: string;
  defaultProgressScore?: number;
  defaultProgressSummary?: string;
}

function toInputDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function buildCleanHeaderHtml(params: {
  brandName: string;
  brandLogoUrl: string;
  timezone: string;
  playerName: string;
  identityRole: string;
  identityBio: string;
}): string {
  return `<header style="border-bottom:2px solid #1f2937;padding:16px 20px;background:#0f172a;color:#f8fafc;font-family:Arial,sans-serif;">
    <div style="display:flex;align-items:center;gap:12px;">
      <img src="${params.brandLogoUrl}" alt="${params.brandName}" style="height:40px;width:auto;border-radius:6px;object-fit:contain;" />
      <div>
        <div style="font-size:18px;font-weight:700;letter-spacing:0.3px;">${params.brandName}</div>
        <div style="font-size:12px;color:#94a3b8;">Relatorio Individual de Progresso &bull; Fuso: ${params.timezone}</div>
      </div>
    </div>
    <div style="margin-top:14px;padding:12px;border-radius:8px;background:#1e293b;">
      <div style="font-size:15px;font-weight:600;color:#ffffff;">${params.playerName} <span style="font-size:12px;color:#38bdf8;">(${params.identityRole})</span></div>
      <p style="margin:6px 0 0;font-size:13px;line-height:1.45;color:#cbd5e1;">${params.identityBio}</p>
    </div>
  </header>`;
}

export default function ProgressDigestPanel(props: ProgressDigestPanelProps) {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const [playerId, setPlayerId] = useState(props.defaultPlayerId || "player-001");
  const [playerName, setPlayerName] = useState(props.defaultPlayerName || "Jogador");
  const [playerEmail, setPlayerEmail] = useState(props.defaultPlayerEmail || "jogador@exemplo.com");
  const [brandName, setBrandName] = useState(props.defaultBrandName || "SaaS Talentos & Stream");
  const [brandLogoUrl, setBrandLogoUrl] = useState(props.defaultBrandLogoUrl || "/logo.png");
  const [identityRole, setIdentityRole] = useState(props.defaultIdentityRole || "Jogador / Criador");
  const [identityBio, setIdentityBio] = useState(
    props.defaultIdentityBio || "Perfil focado em evolucao continua, transmissao ao vivo e descoberta de talentos."
  );
  const [timezone, setTimezone] = useState("America/Belem");
  const [scheduleDate, setScheduleDate] = useState(toInputDate(tomorrow));
  const [preferredHour, setPreferredHour] = useState<number>(20);
  const [frequencyMode, setFrequencyMode] = useState<"once" | "weekly" | "biweekly" | "monthly">("weekly");
  const [focusGoal, setFocusGoal] = useState("Consistencia e visibilidade");
  const [progressScore, setProgressScore] = useState<number>(props.defaultProgressScore ?? 75);
  const [progressSummary, setProgressSummary] = useState(
    props.defaultProgressSummary || "Progresso consistente nas ultimas sessoes, engajamento e licencas ativas."
  );
  const [sendByDefault, setSendByDefault] = useState<boolean>(true);

  const [dbName, setDbName] = useState<string>("");
  const [availableTables, setAvailableTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [liveRecords, setLiveRecords] = useState<LiveMappedRecord[]>([]);

  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null);
  const [adaptFrequency, setAdaptFrequency] = useState<"once" | "weekly" | "biweekly" | "monthly">("biweekly");
  const [adaptHour, setAdaptHour] = useState<number>(21);
  const [adaptGoal, setAdaptGoal] = useState("Destaques de performance e clipes para vitrine");

  const [emailPreview, setEmailPreview] = useState<EmailPreviewPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [dispatchResult, setDispatchResult] = useState<string>("");
  const [feedback, setFeedback] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  async function loadSchedules(targetPlayerId = playerId) {
    try {
      const res = await fetch(`/api/progress-digest/schedule?playerId=${encodeURIComponent(targetPlayerId)}`);
      const data = await res.json();
      if (res.ok && data.ok && Array.isArray(data.schedules)) {
        setSchedules(data.schedules);
        if (data.schedules.length > 0 && !selectedScheduleId) {
          setSelectedScheduleId(Number(data.schedules[0].id));
        }
      }
    } catch {
      // Falha silenciosa na carga inicial
    }
  }

  async function loadLiveHeidiData(tableOverride = selectedTable, applyFirst = false) {
    setLoading(true);
    setErrorMsg("");
    try {
      const qs = new URLSearchParams();
      if (tableOverride) qs.set("table", tableOverride);
      const res = await fetch(`/api/progress-digest/live-source?${qs.toString()}`);
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Falha ao ler dados reais do HeidiSQL");
      }

      setDbName(String(data.database || ""));
      setAvailableTables(Array.isArray(data.tables) ? data.tables : []);
      if (data.table) setSelectedTable(String(data.table));

      const records: LiveMappedRecord[] = Array.isArray(data.records) ? data.records : [];
      setLiveRecords(records);

      if (applyFirst && records.length > 0) {
        applyLiveProfile(records[0]);
      }
      setFeedback(`HeidiSQL (${data.database}.${data.table}): ${records.length} registro(s) carregado(s).`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erro ao carregar dados do HeidiSQL");
    } finally {
      setLoading(false);
    }
  }

  function applyLiveProfile(rec: LiveMappedRecord) {
    setPlayerId(rec.profile.playerId);
    setPlayerName(rec.profile.playerName);
    setPlayerEmail(rec.profile.playerEmail);
    setIdentityRole(rec.profile.identityRole);
    setIdentityBio(rec.profile.identityBio);
    setProgressScore(rec.profile.progressScore);
    setProgressSummary(rec.profile.progressSummary);
    loadSchedules(rec.profile.playerId);
  }

  useEffect(() => {
    loadSchedules(playerId);
    loadLiveHeidiData("", false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreateSchedule(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setFeedback("");

    const hourStr = String(Math.max(0, Math.min(23, Number(preferredHour)))).padStart(2, "0");
    const scheduledFor = `${scheduleDate} ${hourStr}:00:00`;

    try {
      const res = await fetch("/api/progress-digest/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId,
          playerName,
          playerEmail,
          brandName,
          brandLogoUrl,
          identityRole,
          identityBio,
          timezone,
          scheduledFor,
          frequencyMode,
          preferredHour: Number(preferredHour),
          focusGoal,
          progressScore: Number(progressScore),
          progressSummary,
          sendByDefault
        })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Falha ao criar agendamento");
      }

      if (data.schedule?.id) {
        setSelectedScheduleId(Number(data.schedule.id));
      }
      if (data.emailPreview) {
        setEmailPreview(data.emailPreview);
      }
      setFeedback(`Agendamento salvo (#${data.schedule?.id ?? "novo"}) para ${scheduledFor}.`);
      await loadSchedules(playerId);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erro ao salvar agendamento");
    } finally {
      setLoading(false);
    }
  }

  async function handleAcceptAdaptation() {
    setLoading(true);
    setErrorMsg("");
    setFeedback("");

    const active = schedules.find((s) => Number(s.id) === Number(selectedScheduleId)) || schedules[0];
    const targetId = active ? Number(active.id) : Number(selectedScheduleId || 1);

    try {
      const res = await fetch("/api/progress-digest/adapt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduleId: targetId,
          playerId,
          accept: true,
          newFrequencyMode: adaptFrequency,
          newPreferredHour: Number(adaptHour),
          newFocusGoal: adaptGoal
        })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Falha ao aplicar adaptacao");
      }

      setFrequencyMode(adaptFrequency);
      setPreferredHour(Number(adaptHour));
      setFocusGoal(adaptGoal);
      setFeedback(data.message || `Adaptacao aplicada. Proximo envio: ${data.nextScheduledFor}`);
      await loadSchedules(playerId);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erro ao aceitar adaptacao");
    } finally {
      setLoading(false);
    }
  }

  async function handleDispatchNow(forceAll = false) {
    setLoading(true);
    setErrorMsg("");
    setDispatchResult("");

    try {
      const res = await fetch("/api/progress-digest/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId,
          forceAll
        })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Falha ao executar disparo");
      }
      setDispatchResult(JSON.stringify(data, null, 2));
      setFeedback(`Disparo concluido: ${data.processedCount ?? 0} relatorio(s) processado(s).`);
      await loadSchedules(playerId);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erro ao disparar relatorios");
    } finally {
      setLoading(false);
    }
  }

  const liveHeaderHtml =
    emailPreview?.headerHtml ||
    buildCleanHeaderHtml({
      brandName,
      brandLogoUrl,
      timezone,
      playerName,
      identityRole,
      identityBio
    });

  return (
    <div style={{ display: "grid", gap: 20, padding: 20, maxWidth: 1120, margin: "0 auto", fontFamily: "Arial, sans-serif" }}>
      <section style={{ border: "1px solid #cbd5e1", borderRadius: 12, padding: 20, background: "#ffffff" }}>
        <h2 style={{ margin: "0 0 6px" }}>Dados Reais do Banco (HeidiSQL / MariaDB)</h2>
        <p style={{ margin: "0 0 14px", color: "#475569", fontSize: 13 }}>
          Base ativa: <strong>{dbName || "conectando..."}</strong> &bull; Tabela selecionada: <strong>{selectedTable || "nenhuma"}</strong>
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 12 }}>
          <select
            value={selectedTable}
            onChange={(e) => {
              const tbl = e.target.value;
              setSelectedTable(tbl);
              loadLiveHeidiData(tbl, false);
            }}
            style={{ padding: 8, borderRadius: 6, border: "1px solid #94a3b8", minWidth: 220 }}
          >
            {availableTables.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <button
            type="button"
            disabled={loading}
            onClick={() => loadLiveHeidiData(selectedTable, true)}
            style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: "#0f766e", color: "#fff", fontWeight: 600, cursor: "pointer" }}
          >
            Carregar Dados Reais (HeidiSQL)
          </button>
        </div>

        {liveRecords.length > 0 && (
          <div style={{ display: "grid", gap: 8 }}>
            {liveRecords.slice(0, 5).map((rec, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 8,
                  padding: 10,
                  borderRadius: 8,
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  fontSize: 13
                }}
              >
                <div>
                  <strong>{rec.profile.playerName}</strong> ({rec.profile.playerId}) &bull; {rec.profile.playerEmail} &bull;{" "}
                  <span>{rec.profile.identityRole}</span>
                </div>
                <button
                  type="button"
                  onClick={() => applyLiveProfile(rec)}
                  style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #0f172a", background: "#fff", fontWeight: 600, cursor: "pointer" }}
                >
                  Usar este registro
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={{ border: "1px solid #cbd5e1", borderRadius: 12, padding: 20, background: "#ffffff" }}>
        <h2 style={{ margin: "0 0 6px" }}>Agendamento &amp; Identidade do Progress Digest</h2>
        

        <form onSubmit={handleCreateSchedule} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
            Player ID
            <input value={playerId} onChange={(e) => setPlayerId(e.target.value)} required style={{ padding: 8, borderRadius: 6, border: "1px solid #94a3b8" }} />
          </label>

          <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
            Nome do Jogador / Criador
            <input value={playerName} onChange={(e) => setPlayerName(e.target.value)} required style={{ padding: 8, borderRadius: 6, border: "1px solid #94a3b8" }} />
          </label>

          <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
            E-mail de Destino
            <input type="email" value={playerEmail} onChange={(e) => setPlayerEmail(e.target.value)} required style={{ padding: 8, borderRadius: 6, border: "1px solid #94a3b8" }} />
          </label>

          <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
            Nome da Marca / Plataforma
            <input value={brandName} onChange={(e) => setBrandName(e.target.value)} required style={{ padding: 8, borderRadius: 6, border: "1px solid #94a3b8" }} />
          </label>

          <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
            URL da Logomarca
            <input value={brandLogoUrl} onChange={(e) => setBrandLogoUrl(e.target.value)} required style={{ padding: 8, borderRadius: 6, border: "1px solid #94a3b8" }} />
          </label>

          <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
            Papel / Identidade
            <input value={identityRole} onChange={(e) => setIdentityRole(e.target.value)} required style={{ padding: 8, borderRadius: 6, border: "1px solid #94a3b8" }} />
          </label>

          <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
            Data (Dia/Mes/Ano)
            <input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} required style={{ padding: 8, borderRadius: 6, border: "1px solid #94a3b8" }} />
          </label>

          <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
            Hora Preferida (0 a 23)
            <input type="number" min={0} max={23} value={preferredHour} onChange={(e) => setPreferredHour(Number(e.target.value))} required style={{ padding: 8, borderRadius: 6, border: "1px solid #94a3b8" }} />
          </label>

          <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
            Frequencia
            <select value={frequencyMode} onChange={(e) => setFrequencyMode(e.target.value as "once" | "weekly" | "biweekly" | "monthly")} style={{ padding: 8, borderRadius: 6, border: "1px solid #94a3b8" }}>
              <option value="once">Uma vez (once)</option>
              <option value="weekly">Semanal (weekly)</option>
              <option value="biweekly">Quinzenal (biweekly)</option>
              <option value="monthly">Mensal (monthly)</option>
            </select>
          </label>

          <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
            Fuso Horario
            <input value={timezone} onChange={(e) => setTimezone(e.target.value)} style={{ padding: 8, borderRadius: 6, border: "1px solid #94a3b8" }} />
          </label>

          <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
            Foco Principal Atual
            <input value={focusGoal} onChange={(e) => setFocusGoal(e.target.value)} style={{ padding: 8, borderRadius: 6, border: "1px solid #94a3b8" }} />
          </label>

          <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
            Score de Progresso (0-100)
            <input type="number" step="0.5" min={0} max={100} value={progressScore} onChange={(e) => setProgressScore(Number(e.target.value))} style={{ padding: 8, borderRadius: 6, border: "1px solid #94a3b8" }} />
          </label>

          <label style={{ gridColumn: "1 / -1", display: "grid", gap: 4, fontSize: 13 }}>
            Descricao / Bio de Identidade
            <textarea rows={2} value={identityBio} onChange={(e) => setIdentityBio(e.target.value)} style={{ padding: 8, borderRadius: 6, border: "1px solid #94a3b8" }} />
          </label>

          <label style={{ gridColumn: "1 / -1", display: "grid", gap: 4, fontSize: 13 }}>
            Resumo do Progresso Atual
            <textarea rows={2} value={progressSummary} onChange={(e) => setProgressSummary(e.target.value)} style={{ padding: 8, borderRadius: 6, border: "1px solid #94a3b8" }} />
          </label>

          <label style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <input type="checkbox" checked={sendByDefault} onChange={(e) => setSendByDefault(e.target.checked)} />
            Enviar progresso por e-mail por padrao no horario agendado
          </label>

          <div style={{ gridColumn: "1 / -1", display: "flex", flexWrap: "wrap", gap: 10 }}>
            <button type="submit" disabled={loading} style={{ padding: "10px 18px", borderRadius: 8, border: "none", background: "#0f172a", color: "#fff", fontWeight: 600, cursor: "pointer" }}>
              {loading ? "Processando..." : "Salvar Agendamento"}
            </button>
            <button type="button" disabled={loading} onClick={() => handleDispatchNow(false)} style={{ padding: "10px 16px", borderRadius: 8, border: "1px solid #0f172a", background: "#ffffff", color: "#0f172a", fontWeight: 600, cursor: "pointer" }}>
              Disparar Vencidos Agora
            </button>
            <button type="button" disabled={loading} onClick={() => handleDispatchNow(true)} style={{ padding: "10px 16px", borderRadius: 8, border: "1px solid #2563eb", background: "#eff6ff", color: "#1d4ed8", fontWeight: 600, cursor: "pointer" }}>
              Disparar Pendentes (Teste/Forcar)
            </button>
          </div>
        </form>

        {feedback && null}
        {errorMsg && null}
      </section>

      <section style={{ border: "1px solid #cbd5e1", borderRadius: 12, padding: 20, background: "#ffffff" }}>
        <h3 style={{ margin: "0 0 10px" }}>Plano de Adaptacao (Aceite Dinamico)</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 12 }}>
          <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
            Agendamento Alvo
            <select value={selectedScheduleId ?? ""} onChange={(e) => setSelectedScheduleId(Number(e.target.value))} style={{ padding: 8, borderRadius: 6, border: "1px solid #94a3b8" }}>
              {schedules.map((s) => (
                <option key={s.id} value={s.id}>
                  #{s.id} - {s.frequency_mode} ({s.status})
                </option>
              ))}
              {schedules.length === 0 && <option value={1}>#1 (Padrao)</option>}
            </select>
          </label>

          <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
            Nova Frequencia Adaptada
            <select value={adaptFrequency} onChange={(e) => setAdaptFrequency(e.target.value as "once" | "weekly" | "biweekly" | "monthly")} style={{ padding: 8, borderRadius: 6, border: "1px solid #94a3b8" }}>
              <option value="weekly">Semanal (weekly)</option>
              <option value="biweekly">Quinzenal (biweekly)</option>
              <option value="monthly">Mensal (monthly)</option>
              <option value="once">Uma vez (once)</option>
            </select>
          </label>

          <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
            Nova Hora Adaptada (0-23)
            <input type="number" min={0} max={23} value={adaptHour} onChange={(e) => setAdaptHour(Number(e.target.value))} style={{ padding: 8, borderRadius: 6, border: "1px solid #94a3b8" }} />
          </label>

          <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
            Novo Foco Recomendado
            <input value={adaptGoal} onChange={(e) => setAdaptGoal(e.target.value)} style={{ padding: 8, borderRadius: 6, border: "1px solid #94a3b8" }} />
          </label>
        </div>

        <button type="button" disabled={loading} onClick={handleAcceptAdaptation} style={{ padding: "10px 18px", borderRadius: 8, border: "none", background: "#2563eb", color: "#fff", fontWeight: 600, cursor: "pointer" }}>
          Aceitar Plano de Adaptacao e Atualizar Proximo Envio
        </button>
      </section>

      <section style={{ border: "1px solid #cbd5e1", borderRadius: 12, padding: 20, background: "#ffffff" }}>
        <h3 style={{ margin: "0 0 12px" }}>Pre-visualizacao do Cabecalho &amp; E-mail</h3>
        <div dangerouslySetInnerHTML={{ __html: liveHeaderHtml }} />
        {emailPreview && (
          <div style={{ marginTop: 14, padding: 12, background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Assunto: {emailPreview.subject}</div>
            <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontSize: 12, color: "#334155" }}>{emailPreview.text}</pre>
          </div>
        )}
      </section>

      <section style={{ border: "1px solid #cbd5e1", borderRadius: 12, padding: 20, background: "#ffffff" }}>
        <h3 style={{ margin: "0 0 12px" }}>Agendamentos Persistidos ({schedules.length})</h3>
        <div style={{ display: "grid", gap: 8 }}>
          {schedules.map((item) => (
            <div key={item.id} style={{ padding: 12, borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: 13 }}>
              <strong>#{item.id}</strong> &bull; <strong>{item.player_name}</strong> ({item.player_email}) &bull;{" "}
              <span>Status: <strong>{item.status}</strong></span> &bull;{" "}
              <span>Frequencia: <strong>{item.frequency_mode}</strong> ({item.preferred_hour}h)</span> &bull;{" "}
              <span>Agendado: <strong>{String(item.scheduled_for)}</strong></span> &bull;{" "}
              <span>Foco: {item.focus_goal}</span>
            </div>
          ))}
        </div>

        {dispatchResult && (
          <pre style={{ marginTop: 14, padding: 12, borderRadius: 8, background: "#0f172a", color: "#e2e8f0", fontSize: 12, overflowX: "auto" }}>
            {dispatchResult}
          </pre>
        )}
      </section>
    </div>
  );
}

