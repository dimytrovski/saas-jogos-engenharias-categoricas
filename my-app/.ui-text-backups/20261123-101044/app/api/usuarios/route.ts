import { NextResponse } from "next/server";
import crypto from "crypto";
import pool, { getPool } from "../../../lib/db";

function gerarHashSenha(senha: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(senha, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      nome_completo,
      nickname,
      email,
      senha,
      cpf,
      telefone_whatsapp,
      data_nascimento,
      plataforma_principal,
      posicao_preferida,
      chave_pix,
    } = body;

    if (!nome_completo || !nickname || !email || !senha || !cpf || !telefone_whatsapp || !data_nascimento) {
      return NextResponse.json(
        { error: "Preencha todos os campos obrigatrios." },
        { status: 400 }
      );
    }

    const cpfLimpo = String(cpf).replace(/\D/g, "");
    if (cpfLimpo.length !== 11) {
      return NextResponse.json(
        { error: "CPF invlido. Informe exatamente 11 dgitos." },
        { status: 400 }
      );
    }

    const senhaHash = gerarHashSenha(String(senha));

    const sql = `
      INSERT INTO usuarios (
        nome_completo,
        nickname,
        email,
        senha_hash,
        cpf,
        telefone_whatsapp,
        data_nascimento,
        plataforma_principal,
        posicao_preferida,
        chave_pix
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      String(nome_completo).trim(),
      String(nickname).trim(),
      String(email).trim().toLowerCase(),
      senhaHash,
      cpfLimpo,
      String(telefone_whatsapp).trim(),
      String(data_nascimento),
      plataforma_principal || "CLOUD_GAMING",
      posicao_preferida || "FLEX",
      chave_pix ? String(chave_pix).trim() : null,
    ];

    const [result]: any = await (await getPool()).execute(sql, values);

    return NextResponse.json(
      {
        message: "Usurio cadastrado com sucesso!",
        id: result.insertId,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error?.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { error: "E-mail, Nickname ou CPF j cadastrado no sistema." },
        { status: 409 }
      );
    }

    console.error("[POST /api/usuarios] Erro:", error);
    return NextResponse.json(
      { error: "Erro interno ao salvar usurio no MySQL." },
      { status: 500 }
    );
  }
}
