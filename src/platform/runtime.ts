import type { HomeChecklistPlatform } from "./contracts";
import { createWebPlatform } from "./web";

let activePlatform: HomeChecklistPlatform = createWebPlatform();

export function configurePlatform(platform: HomeChecklistPlatform) {
  activePlatform = platform;
}

export function getPlatform() {
  return activePlatform;
}
