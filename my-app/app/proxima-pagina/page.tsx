import Link from "next/link";

export default function ProximaPagina() {
  return (
    <main className="min-h-screen bg-slate-950 text-white p-6 sm:p-10 flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8 space-y-5 shadow-xl">
        <span className="inline-block text-xs font-extrabold uppercase tracking-wider px-2.5 py-1 rounded bg-blue-600 text-white">
          Início Rápido • MicroSaaS
        </span>

        <h1 className="text-2xl sm:text-3xl font-black">
          Vamos Começar o Seu Fluxo Agora
        </h1>

        <p className="text-sm text-slate-300 leading-relaxed">
          Esta rota (<code className="text-sky-300">/proxima-pagina</code>) foi
          criada para que o botão <strong>Começar Agora</strong> funcione sem
          erro 404 e leve você direto aos blocos principais da plataforma.
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/"
            className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-4 py-2.5 text-sm transition"
          >
            Voltar para a Página Inicial
          </Link>

          <Link
            href="/#catalogo-cenarios-video"
            className="rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2.5 text-sm border border-slate-700 transition"
          >
            Ir para Catálogo de Cenários
          </Link>

          <Link
            href="/#central-decisao-inteligente"
            className="rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2.5 text-sm border border-slate-700 transition"
          >
            Abrir Central de Decisão
          </Link>
        </div>
      </div>
    </main>
  );
}