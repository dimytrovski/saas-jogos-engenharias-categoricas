import { NextRequest, NextResponse } from "next/server";
import { PTT_REPLICA_NODES, UPSTREAM_BALANCER_TARGETS } from "@/data/hpcRoutingAndReplication";

interface HpcRouteRequest {
  preferredRegionId?: string;
  playerGeographies?: string[];
  targetUpstreamId?: string;
}

export async function GET(req: NextRequest) {
  const nodeParam = req.nextUrl.searchParams.get("node");
  const node =
    PTT_REPLICA_NODES.find((n) => n.id === nodeParam) ?? PTT_REPLICA_NODES[1];

  return NextResponse.json({
    ok: true,
    pong: true,
    nodeId: node.id,
    regionCode: node.regionCode,
    serverTimestamp: Date.now(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as HpcRouteRequest;
    const node =
      PTT_REPLICA_NODES.find((n) => n.id === body.preferredRegionId) ??
      PTT_REPLICA_NODES[1];
    const upstream =
      UPSTREAM_BALANCER_TARGETS.find((u) => u.id === body.targetUpstreamId) ??
      UPSTREAM_BALANCER_TARGETS[2];

    const geos =
      Array.isArray(body.playerGeographies) && body.playerGeographies.length > 0
        ? body.playerGeographies.slice(0, 6)
        : ["Brasil", "América do Norte", "Europa"];

    const precisionScorePct = Math.min(
      99.8,
      Number((96.4 + node.replicasCount * 0.45 - node.baseLatencyMs * 0.04).toFixed(2))
    );

    return NextResponse.json({
      ok: true,
      routeId: `HPC-PTT-${Date.now().toString(36).toUpperCase()}`,
      selectedNode: node,
      selectedUpstream: upstream,
      connectedGeographies: geos,
      routingPrecisionPct: precisionScorePct,
      vaultSettlementProtected: true,
      guidance:
        "Rota balanceada com réplicas múltiplas, failover seguro e limites de custo para preservar sua paz operacional.",
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Falha ao calcular rota HPC e balanceamento." },
      { status: 400 }
    );
  }
}