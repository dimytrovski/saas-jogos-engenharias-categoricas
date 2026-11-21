import React, { Suspense } from "react";
import CloudGamingSkeleton from "../components/CloudGamingSkeleton";

async function ConteudoPosLogin() {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return (
    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-white">
      <h1 className="text-xl font-bold">Painel pós-login ativo</h1>
      <p className="text-sm text-slate-400 mt-1">Dados carregados com sucesso.</p>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <main className="min-h-screen p-6 bg-slate-950 flex items-center justify-center">
      <Suspense fallback={<CloudGamingSkeleton />}>
        <ConteudoPosLogin />
      </Suspense>
    </main>
  );
}
