export interface ForecastInput {
  monthlyActiveSubscribers: number;
  monthlyPriceBrl: number;
  monthlyPassesSold: number;
  passPriceBrl: number;
  deploymentsClosed: number;
  deploymentPriceBrl: number;
  gatewayFeePct: number;
  monthlyInfraCostBrl: number;
}

export interface ForecastOutput {
  grossRevenueBrl: number;
  gatewayFeesBrl: number;
  netAfterGatewayBrl: number;
  estimatedNetProfitBrl: number;
}

export function calculateConcreteScenario(input: ForecastInput): ForecastOutput {
  const subs = Math.max(0, Number(input.monthlyActiveSubscribers) || 0);
  const subPrice = Math.max(0, Number(input.monthlyPriceBrl) || 0);
  const passes = Math.max(0, Number(input.monthlyPassesSold) || 0);
  const passPrice = Math.max(0, Number(input.passPriceBrl) || 0);
  const deps = Math.max(0, Number(input.deploymentsClosed) || 0);
  const depPrice = Math.max(0, Number(input.deploymentPriceBrl) || 0);
  const feePct = Math.min(100, Math.max(0, Number(input.gatewayFeePct) || 0));
  const infraCost = Math.max(0, Number(input.monthlyInfraCostBrl) || 0);

  const grossRevenueBrl = Number(
    (subs * subPrice + passes * passPrice + deps * depPrice).toFixed(2)
  );
  const gatewayFeesBrl = Number(((grossRevenueBrl * feePct) / 100).toFixed(2));
  const netAfterGatewayBrl = Number((grossRevenueBrl - gatewayFeesBrl).toFixed(2));
  const estimatedNetProfitBrl = Number((netAfterGatewayBrl - infraCost).toFixed(2));

  return {
    grossRevenueBrl,
    gatewayFeesBrl,
    netAfterGatewayBrl,
    estimatedNetProfitBrl
  };
}