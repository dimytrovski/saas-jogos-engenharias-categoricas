export interface GameTheme {
  id: string;
  name: string;
  accentColor: string;
  backgroundGradient: string;
  glowIntensity: string;
}

export const GAME_THEMES: Record<string, GameTheme> = {
  rpg: {
    id: 'rpg',
    name: 'Ordem Paranormal',
    accentColor: '#8b5cf6',
    backgroundGradient: 'radial-gradient(circle at top, #1e1b4b, #09090b)',
    glowIntensity: '0 0 35px rgba(139, 92, 246, 0.4)'
  },
  fps: {
    id: 'fps',
    name: 'Tactical Shooter',
    accentColor: '#ef4444',
    backgroundGradient: 'radial-gradient(circle at top, #450a0a, #09090b)',
    glowIntensity: '0 0 35px rgba(239, 68, 68, 0.4)'
  },
  racing: {
    id: 'racing',
    name: 'Sim Racing',
    accentColor: '#3b82f6',
    backgroundGradient: 'radial-gradient(circle at top, #172554, #09090b)',
    glowIntensity: '0 0 35px rgba(59, 130, 246, 0.4)'
  }
};
