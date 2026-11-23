import "./globals.css";
import "../styles/cerro-overlays.css";
import "../styles/cerro-vector-ux.css";
import "../styles/cerro-gazette-theme.css";
import type { Metadata } from "next";
import { TelemetryProvider } from "./TelemetryContext";

export const metadata: Metadata = {
  title: "SynStrom",
  description: "SynStrom — Fluxo, Licenciamento e Telemetria"
};

export default function RootLayout({
  children
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