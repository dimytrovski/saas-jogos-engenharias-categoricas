export type PlatformId = "windows" | "macos" | "playstation" | "xbox" | "nintendo";

export interface PlatformProfile {
  id: PlatformId;
  label: string;
  deadzone: number;
  pollIntervalMs: number;
  focusRingColor: string;
  scrollBehavior: ScrollBehavior;
}

export function normalizeAxis(value: number, deadzone: number): number {
  if (Math.abs(value) < deadzone) return 0;
  const sign = Math.sign(value);
  return sign * ((Math.abs(value) - deadzone) / (1 - deadzone));
}
