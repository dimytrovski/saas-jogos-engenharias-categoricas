import "./globals.css";
import "../styles/cerro-overlays.css";
import "../styles/cerro-vector-ux.css";
import "../styles/cerro-gazette-theme.css";
import type { Metadata } from "next";
import "../styles/cerro-overlays.css";
import "../styles/cerro-vector-ux.css";
import "../styles/cerro-gazette-theme.css";
import { TelemetryProvider } from './TelemetryContext';
import "../styles/cerro-overlays.css";
import "../styles/cerro-vector-ux.css";
import "../styles/cerro-gazette-theme.css";

export const metadata: Metadata = {
  title: "Minha Aplicação",
  description: "Painel com telemetria",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <TelemetryProvider>{children}</TelemetryProvider>
      </body>
    </html>
  );
}



