export interface RevenueMixScenario {
  id: string;
  label: string;
  deploymentsCount: number;
  deploymentUnitBrl: number;
  passesCount: number;
  passUnitBrl: number;
  totalBrl: number;
  formattedTotalBrl: string;
}

export function getRevenueTargetBrl(): 30000 {
  return 30000;
}

export function formatCurrencyBrl(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

export function calculateRevenueTotalBrl(
  deploymentsCount: number,
  deploymentUnitBrl: number = 10000,
  passesCount: number = 0,
  passUnitBrl: number = 0
): number {
  const safeDeployments = Math.max(0, Number(deploymentsCount) || 0);
  const safeDepUnit = Math.max(0, Number(deploymentUnitBrl) || 0);
  const safePasses = Math.max(0, Number(passesCount) || 0);
  const safePassUnit = Math.max(0, Number(passUnitBrl) || 0);
  return Number((safeDeployments * safeDepUnit + safePasses * safePassUnit).toFixed(2));
}

export function getTarget30kScenarios(passUnitBrl: number = 25): RevenueMixScenario[] {
  const safePassPrice = Math.max(1, Number(passUnitBrl) || 25);

  const s1Deployments = 3;
  const s1Passes = 0;
  const s1Total = calculateRevenueTotalBrl(s1Deployments, 10000, s1Passes, safePassPrice);

  const s2Deployments = 2;
  const s2Passes = Math.ceil(10000 / safePassPrice);
  const s2Total = calculateRevenueTotalBrl(s2Deployments, 10000, s2Passes, safePassPrice);

  const s3Deployments = 1;
  const s3Passes = Math.ceil(20000 / safePassPrice);
  const s3Total = calculateRevenueTotalBrl(s3Deployments, 10000, s3Passes, safePassPrice);

  return [
    {
      id: "3x-impl-10k",
      label: "3x R$ 10k",
      deploymentsCount: s1Deployments,
      deploymentUnitBrl: 10000,
      passesCount: s1Passes,
      passUnitBrl: safePassPrice,
      totalBrl: s1Total,
      formattedTotalBrl: formatCurrencyBrl(s1Total)
    },
    {
      id: "2x-impl-plus-passes",
      label: "2x R$ 10k + Passes",
      deploymentsCount: s2Deployments,
      deploymentUnitBrl: 10000,
      passesCount: s2Passes,
      passUnitBrl: safePassPrice,
      totalBrl: s2Total,
      formattedTotalBrl: formatCurrencyBrl(s2Total)
    },
    {
      id: "1x-impl-plus-passes",
      label: "1x R$ 10k + Passes",
      deploymentsCount: s3Deployments,
      deploymentUnitBrl: 10000,
      passesCount: s3Passes,
      passUnitBrl: safePassPrice,
      totalBrl: s3Total,
      formattedTotalBrl: formatCurrencyBrl(s3Total)
    }
  ];
}