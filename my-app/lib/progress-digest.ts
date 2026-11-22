export type FrequencyMode = "once" | "weekly" | "biweekly" | "monthly";

export interface DigestPlayerRecord {
  id?: number;
  playerId: string;
  playerName: string;
  playerEmail: string;
  identityRole: string;
  identityBio: string;
  brandLogoUrl: string;
  brandName: string;
  timezone: string;
  scheduledFor: string;
  frequencyMode: FrequencyMode;
  preferredHour: number;
  focusGoal: string;
  progressScore: number;
  progressSummary: string;
  sendByDefault: boolean;
}

export interface AdaptationInput {
  scheduleId: number;
  playerId: string;
  accept: boolean;
  newFrequencyMode?: FrequencyMode;
  newPreferredHour?: number;
  newFocusGoal?: string;
}

const VALID_FREQUENCIES: FrequencyMode[] = ["once", "weekly", "biweekly", "monthly"];

export function normalizeFrequency(input: unknown, fallback: FrequencyMode = "weekly"): FrequencyMode {
  const val = String(input || "").trim().toLowerCase() as FrequencyMode;
  return VALID_FREQUENCIES.includes(val) ? val : fallback;
}

export function normalizeHour(input: unknown, fallback = 20): number {
  const n = Number(input);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(23, Math.round(n)));
}

export function normalizeScore(input: unknown, fallback = 70): number {
  const n = Number(input);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(100, Number(n.toFixed(2))));
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function toLocalSqlDateTime(input: string, preferredHour?: number): string {
  const cleaned = input.trim().replace("T", " ");
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(cleaned);
  if (dateOnlyMatch) {
    const hr = preferredHour !== undefined ? normalizeHour(preferredHour, 20) : 20;
    return `${dateOnlyMatch[1]}-${dateOnlyMatch[2]}-${dateOnlyMatch[3]} ${String(hr).padStart(2, "0")}:00:00`;
  }

  const sqlMatch = /^(\d{4}-\d{2}-\d{2})[ ](\d{2}):(\d{2})(?::(\d{2}))?$/.exec(cleaned);
  if (sqlMatch) {
    const hr = preferredHour !== undefined ? String(normalizeHour(preferredHour, 20)).padStart(2, "0") : sqlMatch[2];
    const sec = sqlMatch[4] || "00";
    return `${sqlMatch[1]} ${hr}:${sqlMatch[3]}:${sec}`;
  }

  const parsed = new Date(cleaned);
  const d = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  const pad = (n: number) => String(n).padStart(2, "0");
  const hr = preferredHour !== undefined ? normalizeHour(preferredHour, d.getHours()) : d.getHours();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${String(hr).padStart(2, "0")}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function advanceSqlDateTime(currentSql: string, mode: FrequencyMode, preferredHour: number): string {
  const normalized = toLocalSqlDateTime(currentSql, preferredHour);
  const [datePart] = normalized.split(" ");
  const [y, m, day] = datePart.split("-").map(Number);
  const d = new Date(y, (m || 1) - 1, day || 1, normalizeHour(preferredHour, 20), 0, 0);

  if (mode === "weekly") {
    d.setDate(d.getDate() + 7);
  } else if (mode === "biweekly") {
    d.setDate(d.getDate() + 14);
  } else if (mode === "monthly") {
    d.setMonth(d.getMonth() + 1);
  } else {
    d.setDate(d.getDate() + 7);
  }

  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:00:00`;
}

export function applyAdaptationPlan(baseRecord: DigestPlayerRecord, input: AdaptationInput) {
  const accepted = input.accept !== false;
  if (!accepted) {
    return {
      accepted: false,
      updatedRecord: baseRecord,
      nextScheduledFor: baseRecord.scheduledFor,
      message: "Adaptacao mantida como pendente sem alterar o agendamento atual."
    };
  }

  const newFrequencyMode = normalizeFrequency(input.newFrequencyMode, baseRecord.frequencyMode);
  const newPreferredHour = normalizeHour(input.newPreferredHour, baseRecord.preferredHour);
  const newFocusGoal = String(input.newFocusGoal || baseRecord.focusGoal || "Consistencia e performance").trim();

  const nextScheduledFor = advanceSqlDateTime(baseRecord.scheduledFor, newFrequencyMode, newPreferredHour);

  const updatedRecord: DigestPlayerRecord = {
    ...baseRecord,
    frequencyMode: newFrequencyMode,
    preferredHour: newPreferredHour,
    focusGoal: newFocusGoal,
    scheduledFor: nextScheduledFor
  };

  return {
    accepted: true,
    updatedRecord,
    nextScheduledFor,
    message: `Adaptacao aplicada: frequencia ${newFrequencyMode} as ${newPreferredHour}h, foco "${newFocusGoal}" e proximo envio em ${nextScheduledFor}.`
  };
}

export function buildProgressEmailPayload(record: DigestPlayerRecord, acceptUrl: string) {
  const roundedScore = Math.round(Number(record.progressScore || 0));
  const subject = `[${record.brandName}] Relatorio de Progresso de ${record.playerName} (${roundedScore}%)`;

  const headerHtml = `<header style="border-bottom:2px solid #1f2937;padding:16px 20px;background:#0f172a;color:#f8fafc;font-family:Arial,sans-serif;">
    <div style="display:flex;align-items:center;gap:12px;">
      <img src="${record.brandLogoUrl}" alt="${record.brandName}" style="height:40px;width:auto;border-radius:6px;object-fit:contain;" />
      <div>
        <div style="font-size:18px;font-weight:700;letter-spacing:0.3px;">${record.brandName}</div>
        <div style="font-size:12px;color:#94a3b8;">Relatorio Individual de Progresso &bull; Fuso: ${record.timezone}</div>
      </div>
    </div>
    <div style="margin-top:14px;padding:12px;border-radius:8px;background:#1e293b;">
      <div style="font-size:15px;font-weight:600;color:#ffffff;">${record.playerName} <span style="font-size:12px;color:#38bdf8;">(${record.identityRole})</span></div>
      <p style="margin:6px 0 0;font-size:13px;line-height:1.45;color:#cbd5e1;">${record.identityBio}</p>
    </div>
  </header>`;

  const html = `<!DOCTYPE html>
  <html lang="pt-BR">
  <body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;color:#0f172a;">
    <div style="max-width:640px;margin:24px auto;background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 4px 16px rgba(15,23,42,0.08);">
      ${headerHtml}
      <main style="padding:20px;">
        <h2 style="margin:0 0 8px;font-size:17px;">Seu Progresso Atual na Conta</h2>
        <p style="margin:0 0 12px;font-size:14px;color:#334155;">${record.progressSummary}</p>
        <div style="margin:14px 0;padding:12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
          <strong>Indice de Progresso:</strong> ${record.progressScore}%<br/>
          <strong>Foco Atual de Adaptacao:</strong> ${record.focusGoal}<br/>
          <strong>Agendamento Atual:</strong> ${record.scheduledFor} (${record.frequencyMode} &bull; as ${record.preferredHour}h)
        </div>
        <div style="margin-top:18px;padding:14px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;">
          <p style="margin:0 0 10px;font-size:13px;color:#1e3a8a;">
            <strong>Deseja adaptar seu ritmo e metas?</strong> Ao aceitar, ajustamos automaticamente a frequencia/horario de envio e o foco do seu progresso.
          </p>
          <a href="${acceptUrl}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;font-size:13px;">
            Aceitar Adaptacao de Ritmo e Metas
          </a>
        </div>
      </main>
    </div>
  </body>
  </html>`;

  const text = [
    `${record.brandName} - Progresso de ${record.playerName} (${record.identityRole})`,
    `Identidade: ${record.identityBio}`,
    `Agendado para: ${record.scheduledFor} | Fuso: ${record.timezone}`,
    `Progresso: ${record.progressScore}% | Foco: ${record.focusGoal}`,
    `Resumo: ${record.progressSummary}`,
    `Aceitar adaptacao: ${acceptUrl}`
  ].join("\n");

  return {
    to: record.playerEmail,
    sendByDefault: record.sendByDefault,
    subject,
    html,
    text,
    headerHtml
  };
}
