import { NextRequest, NextResponse } from "next/server";

const VALID_OPERATOR_KEYS = new Set([
  "CERRO-OP-2026",
  "CERRO-ART-2026",
  "PARTICIPANTE-3F",
  "ADMIN-3F-VALIDATED"
]);

const MODULE_BACKEND_SPECS: Record<
  string,
  {
    code: string;
    ruleSummary: string;
    missionRule: string;
    licenseRule: string;
    telemetryRule: string;
    clearanceLevel: string;
  }
> = {
  "ENG-101": {
    code: "ENG-101",
    ruleSummary: "Valida carga trifasica R/S/T, fator de potencia e transicao de estado de licenca.",
    missionRule: "Carga >= 100% consolida ciclo trifasico no banco e registra telemetria assinada.",
    licenseRule: "Liberacao condicionada a confirmacao de estoque e token de sessao ativo.",
    telemetryRule: "Amostragem 4800 Hz com verificacao CRC/SHA-256 no servidor.",
    clearanceLevel: "OPERADOR-VALIDADO"
  },
  "ENG-202": {
    code: "ENG-202",
    ruleSummary: "Controla filas SDLC, latencia p99 e integridade de pacotes entre nos.",
    missionRule: "Estagio SDLC avanca mediante validacao de checksum e lease de sessao.",
    licenseRule: "Acesso remoto via token efemero validado no backend.",
    telemetryRule: "Janela p99 e taxa de sucesso auditadas no servidor.",
    clearanceLevel: "OPERADOR-VALIDADO"
  },
  "ENG-303": {
    code: "ENG-303",
    ruleSummary: "Calcula margens estruturais, flecha admissivel e limites de carga.",
    missionRule: "Fator de seguranca e deformacao validados contra limiares nominais.",
    licenseRule: "Pacote binario/hibrido liberado apos confirmacao de transacao.",
    telemetryRule: "Frames estruturais validados por integridade de bloco.",
    clearanceLevel: "OPERADOR-VALIDADO"
  },
  "ENG-404": {
    code: "ENG-404",
    ruleSummary: "Avalia torque rotativo, resposta PID e amortecimento vibracional.",
    missionRule: "Sobressinal e regime nominal conferidos antes de consolidar legado.",
    licenseRule: "Modo hibrido/nuvem sincronizado com estado de conta validado.",
    telemetryRule: "Sinais de malha fechada inspecionados no backend.",
    clearanceLevel: "OPERADOR-VALIDADO"
  }
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const accessKey = String(body?.accessKey || "").trim().toUpperCase();
    const moduleCode = String(body?.moduleCode || "ENG-101").trim().toUpperCase();

    if (!accessKey || !VALID_OPERATOR_KEYS.has(accessKey)) {
      return NextResponse.json(
        {
          authorized: false,
          message: "Acesso restrito a operacao validada."
        },
        { status: 403 }
      );
    }

    const spec =
      MODULE_BACKEND_SPECS[moduleCode] || {
        code: moduleCode || "ENG-101",
        ruleSummary: "Modulo validado no nucleo backend Cerro-Gradle.",
        missionRule: "Transicao de estado auditada por politica do servidor.",
        licenseRule: "Licenca e entrega governadas por registro validado.",
        telemetryRule: "Fluxo de dados verificado no backend.",
        clearanceLevel: "OPERADOR-VALIDADO"
      };

    return NextResponse.json({
      authorized: true,
      operatorKey: accessKey,
      spec
    });
  } catch {
    return NextResponse.json(
      { authorized: false, message: "Requisicao invalida." },
      { status: 400 }
    );
  }
}
