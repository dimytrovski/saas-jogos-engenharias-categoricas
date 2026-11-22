import type { Metadata } from "next";
import { TelemetryProvider } from './TelemetryContext';

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
