export type GameThemeId = "rpg" | "fps" | "racing" | "strategy";

export interface GameTheme {
  id: GameThemeId;
  name: string;
  backgroundGradient: string;
  accentColor: string;
  glowIntensity: string;
}

export const GAME_THEMES: Record<GameThemeId, GameTheme> = {
  rpg: {
    id: "rpg",
    name: "Fantasia/RPG",
    backgroundGradient: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #0f172a 100%)",
    accentColor: "#818cf8",
    glowIntensity: "0 0 25px rgba(129, 140, 248, 0.5)",
  },
  fps: {
    id: "fps",
    name: "Ação/FPS",
    backgroundGradient: "linear-gradient(135deg, #450a0a 0%, #991b1b 50%, #0f172a 100%)",
    accentColor: "#f87171",
    glowIntensity: "0 0 25px rgba(248, 113, 113, 0.5)",
  },
  racing: {
    id: "racing",
    name: "Corrida/Sport",
    backgroundGradient: "linear-gradient(135deg, #064e3b 0%, #047857 50%, #0f172a 100%)",
    accentColor: "#34d399",
    glowIntensity: "0 0 25px rgba(52, 211, 153, 0.5)",
  },
  strategy: {
    id: "strategy",
    name: "Estratégia",
    backgroundGradient: "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #0f172a 100%)",
    accentColor: "#60a5fa",
    glowIntensity: "0 0 25px rgba(96, 165, 250, 0.5)",
  },
};
