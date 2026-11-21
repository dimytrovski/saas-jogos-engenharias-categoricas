export type PlatformName =
  | "Xbox"
  | "PlayStation"
  | "Nintendo"
  | "Windows"
  | "Mac";

export interface HeroBackgroundTheme {
  id: string;
  platform: PlatformName;
  label: string;
  platformTag: string;
  overlayClass: string;
  badgeClass: string;
}

export const HERO_BACKGROUNDS: HeroBackgroundTheme[] = [
  {
    id: "arcade-xbox",
    platform: "Xbox",
    label: "Arena Neon • Xbox",
    platformTag: "Xbox • Ação & Multiplayer",
    overlayClass: "from-slate-950/85 via-emerald-950/75 to-slate-950/90",
    badgeClass: "bg-emerald-500/20 text-emerald-200 border-emerald-400/30",
  },
  {
    id: "cyber-ps",
    platform: "PlayStation",
    label: "Circuito Astral • PlayStation",
    platformTag: "PlayStation • Aventura & Velocidade",
    overlayClass: "from-slate-950/85 via-blue-950/75 to-slate-950/90",
    badgeClass: "bg-blue-500/20 text-blue-200 border-blue-400/30",
  },
  {
    id: "pixel-nintendo",
    platform: "Nintendo",
    label: "Mundo Retrô • Nintendo",
    platformTag: "Nintendo • Portátil & Clássicos",
    overlayClass: "from-slate-950/85 via-rose-950/75 to-slate-950/90",
    badgeClass: "bg-rose-500/20 text-rose-200 border-rose-400/30",
  },
  {
    id: "grid-windows",
    platform: "Windows",
    label: "Grade Tática • Windows",
    platformTag: "Windows • PC & Estratégia",
    overlayClass: "from-slate-950/85 via-sky-950/75 to-slate-950/90",
    badgeClass: "bg-sky-500/20 text-sky-200 border-sky-400/30",
  },
  {
    id: "studio-mac",
    platform: "Mac",
    label: "Horizonte Indie • Mac",
    platformTag: "Mac • Criação & Fluidez",
    overlayClass: "from-slate-950/85 via-indigo-950/75 to-slate-950/90",
    badgeClass: "bg-indigo-500/20 text-indigo-200 border-indigo-400/30",
  },
];

export function pickRandomBackground(
  excludeId?: string
): HeroBackgroundTheme {
  const pool = excludeId
    ? HERO_BACKGROUNDS.filter((item) => item.id !== excludeId)
    : HERO_BACKGROUNDS;

  const candidates = pool.length > 0 ? pool : HERO_BACKGROUNDS;
  const randomIndex = Math.floor(Math.random() * candidates.length);
  return candidates[randomIndex];
}