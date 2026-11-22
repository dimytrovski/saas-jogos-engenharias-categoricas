import React from "react";
import ProgressDigestPanel from "@/components/ProgressDigestPanel";

export const metadata = {
  title: "Progress Digest | Painel do Jogador",
  description: "Agendamento, identidade, adaptacao e envio de relatorios de progresso."
};

export default function DashboardProgressDigestPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#f1f5f9", padding: "24px 12px" }}>
      <ProgressDigestPanel
        defaultPlayerId="player-001"
        defaultPlayerName="Jogador"
        defaultPlayerEmail="jogador@exemplo.com"
        defaultBrandName="SaaS Talentos & Stream"
        defaultBrandLogoUrl="/logo.png"
        defaultIdentityRole="Jogador / Criador"
        defaultIdentityBio="Perfil focado em evolucao continua, transmissao ao vivo e descoberta de talentos."
        defaultProgressScore={75}
        defaultProgressSummary="Progresso consistente nas ultimas sessoes, engajamento e licencas ativas."
      />
    </main>
  );
}
