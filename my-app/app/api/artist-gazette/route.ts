import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export interface VirtualGazetteIssue {
  issueCode: string;
  editionTitle: string;
  headline: string;
  aiConcreteVerdict: string;
  prizePoolBrl: number;
  licenseRuleSummary: string;
  costBenefitMatrix: {
    criterion: string;
    weightPct: number;
    targetMetric: string;
  }[];
  producerBriefs: {
    producerAlias: string;
    disciplineFocus: string;
    scoreComputed: number;
    status: "LIBERADO_PELA_IA" | "EM_ANALISE_IA";
    dispatchNote: string;
  }[];
  releasedAt: string;
}

const VALID_PARTICIPANT_KEYS = new Set([
  "CERRO-ART-2026",
  "PARTICIPANTE-3F",
  "LEGADO-PRODUCER"
]);

function buildConcreteAiGazette(participantCode: string): VirtualGazetteIssue {
  const nowIso = new Date().toISOString();
  return {
    issueCode: "JORNAL-3F-ED01",
    editionTitle: "GAZETA VIRTUALIZADA · CERRO-GRADLE CONCURSO DE ARTE & ENGENHARIA",
    headline:
      "Premio Fixo por Custo-Beneficio Autoral: Como Transformar Ativos de Referencia em Escala de Licencas",
    aiConcreteVerdict:
      "IA Concreta validou: o custo fixo de premio por rodada so gera escala saudavel quando o ativo aprovado alimenta licencas hibridas e planos institucionais com credito de legado preservado ao artista.",
    prizePoolBrl: 1200,
    licenseRuleSummary:
      "Pagamento do premio fixo apos aceite tecnico -> outorga de licenca de uso e revenda na plataforma -> autoria e legado do artista preservados na ficha e no historico.",
    costBenefitMatrix: [
      {
        criterion: "Adequacao Tecnica & Visual ao Universo do SaaS",
        weightPct: 40,
        targetMetric: "Coesao geometrica/media + leitura em bancada"
      },
      {
        criterion: "Execucao, Camadas & Prontidao de Integracao",
        weightPct: 30,
        targetMetric: "Entrega limpa, sem retrabalho estrutural"
      },
      {
        criterion: "Custo-Beneficio & Viabilidade do Premio Fixo",
        weightPct: 20,
        targetMetric: "Retorno por modulo/licenca vs. valor do premio"
      },
      {
        criterion: "Reuso Multidisciplinar & Escala",
        weightPct: 10,
        targetMetric: "Aplicacao em Disco/Nuvem/Hibrido e equipes"
      }
    ],
    producerBriefs: [
      {
        producerAlias: `Produtor Habilitado ()`,
        disciplineFocus: "Eletrica 3F · Software · Civil · Mecanica",
        scoreComputed: 91.5,
        status: "LIBERADO_PELA_IA",
        dispatchNote:
          "Edicao virtualizada liberada pela IA Concreta para o produtor participante com matriz de custo-beneficio e teto de premio."
      },
      {
        producerAlias: "Banca Curadoria · Rodada 01",
        disciplineFocus: "Sistemas Visuais & Simulacao",
        scoreComputed: 87.0,
        status: "LIBERADO_PELA_IA",
        dispatchNote:
          "Dados consolidados prontos para submissao de proposta de custo-beneficio."
      }
    ],
    releasedAt: nowIso
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawCode = String(body.participantCode || "").trim().toUpperCase();
    const action = String(body.action || "authenticate");

    if (!rawCode || !VALID_PARTICIPANT_KEYS.has(rawCode)) {
      return NextResponse.json(
        {
          authorized: false,
          gazetteReleased: false,
          message:
            "Acesso restrito aos participantes do concurso. Use uma chave valida de participante (ex.: CERRO-ART-2026)."
        },
        { status: 403 }
      );
    }

    if (action === "release_ai_gazette" || action === "authenticate") {
      const issue = buildConcreteAiGazette(rawCode);
      return NextResponse.json({
        authorized: true,
        gazetteReleased: true,
        participantCode: rawCode,
        aiEngine: "IA-CONCRETA-GAZETTE-V1",
        issue
      });
    }

    return NextResponse.json({
      authorized: true,
      gazetteReleased: false,
      message: "Acao nao reconhecida."
    });
  } catch {
    return NextResponse.json(
      {
        authorized: false,
        gazetteReleased: false,
        message: "Erro ao processar validacao do participante."
      },
      { status: 400 }
    );
  }
}
