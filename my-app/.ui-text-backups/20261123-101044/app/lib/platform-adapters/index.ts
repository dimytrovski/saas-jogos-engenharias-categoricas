import { PlatformId, PlatformProfile } from "./base";
import { windowsAdapter } from "./windows";
import { macosAdapter } from "./macos";
import { playstationAdapter } from "./playstation";
import { xboxAdapter } from "./xbox";
import { nintendoAdapter } from "./nintendo";

export * from "./base";

export function detectPlatformProfile(userAgent: string): PlatformProfile {
  const ua = userAgent.toLowerCase();
  if (ua.includes("playstation") || ua.includes("ps5") || ua.includes("ps4")) return playstationAdapter;
  if (ua.includes("xbox")) return xboxAdapter;
  if (ua.includes("nintendo") || ua.includes("switch")) return nintendoAdapter;
  if (ua.includes("macintosh") || ua.includes("mac os x")) return macosAdapter;
  return windowsAdapter;
}

export function getPlatformProfileById(id: PlatformId): PlatformProfile {
  switch (id) {
    case "macos": return macosAdapter;
    case "playstation": return playstationAdapter;
    case "xbox": return xboxAdapter;
    case "nintendo": return nintendoAdapter;
    case "windows":
    default: return windowsAdapter;
  }
}
