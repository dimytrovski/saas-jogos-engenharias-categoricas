"use client";

import React, { useState } from "react";

export default function CadastroUsuarioPage() {
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMensagem("");

    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Erro ao cadastrar usuário.");
      setMensagem("Cadastro realizado com sucesso!");
      e.currentTarget.reset();
    } catch (err) {
      setMensagem("Não foi possível concluir o cadastro. Verifique os dados.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5 shadow-xl"
      >
        <h1 className="text-2xl font-bold text-sky-400">Cadastro de Jogador</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 1. Nome Completo */}
          <div>
            <label className="block text-xs uppercase text-slate-400 mb-1">1. Nome Completo</label>
            <input name="nome_completo" required className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700" />
          </div>

          {/* 2. Nickname */}
          <div>
            <label className="block text-xs uppercase text-slate-400 mb-1">2. Nickname / Gamertag</label>
            <input name="nickname" required className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700" />
          </div>

          {/* 3. E-mail */}
          <div>
            <label className="block text-xs uppercase text-slate-400 mb-1">3. E-mail</label>
            <input type="email" name="email" required className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700" />
          </div>

          {/* 4. Senha */}
          <div>
            <label className="block text-xs uppercase text-slate-400 mb-1">4. Senha</label>
            <input type="password" name="senha" minLength={8} required className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700" />
          </div>

          {/* 5. CPF */}
          <div>
            <label className="block text-xs uppercase text-slate-400 mb-1">5. CPF (somente números)</label>
            <input name="cpf" maxLength={11} pattern="\d{11}" required className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700" />
          </div>

          {/* 6. WhatsApp */}
          <div>
            <label className="block text-xs uppercase text-slate-400 mb-1">6. Telefone / WhatsApp</label>
            <input type="tel" name="telefone_whatsapp" required className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700" />
          </div>

          {/* 7. Data de Nascimento */}
          <div>
            <label className="block text-xs uppercase text-slate-400 mb-1">7. Data de Nascimento</label>
            <input type="date" name="data_nascimento" required className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700" />
          </div>

          {/* 8. Plataforma */}
          <div>
            <label className="block text-xs uppercase text-slate-400 mb-1">8. Plataforma Principal</label>
            <select name="plataforma_principal" className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700">
              <option value="CLOUD_GAMING">Cloud Gaming (xCloud)</option>
              <option value="PC">PC</option>
              <option value="PS5">PlayStation 5</option>
              <option value="XBOX_SERIES">Xbox Series X|S</option>
            </select>
          </div>

          {/* 9. Posição */}
          <div>
            <label className="block text-xs uppercase text-slate-400 mb-1">9. Posição Preferida</label>
            <select name="posicao_preferida" className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700">
              <option value="FLEX">Flexível / Todas</option>
              <option value="GOL">Goleiro (GOL)</option>
              <option value="ZAG">Zagueiro (ZAG)</option>
              <option value="LAT">Lateral (LAT)</option>
              <option value="VOL">Volante (VOL)</option>
              <option value="MEI">Meia (MEI)</option>
              <option value="ATA">Atacante (ATA)</option>
            </select>
          </div>

          {/* 10. Chave Pix */}
          <div>
            <label className="block text-xs uppercase text-slate-400 mb-1">10. Chave Pix (opcional)</label>
            <input name="chave_pix" className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700" />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold transition-colors disabled:opacity-50"
        >
          {loading ? "Salvando no MySQL..." : "Finalizar Cadastro"}
        </button>

        {mensagem && <p className="text-center text-sm text-sky-400">{mensagem}</p>}
      </form>
    </main>
  );
}
