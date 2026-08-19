import type { CSSProperties } from "react";

export type ThemeGame = "swsh" | "sv" | "bdsp" | "home" | "lza";

export type BoxTheme =
  | { kind: "default" }
  | { kind: "preset"; game: ThemeGame; wallpaper: string; appColor: string; primary: string; secondary: string }
  | { kind: "custom"; wallpaper: string; appColor: string; primary: string; secondary: string };

export type BoxThemeConfig = {
  global: BoxTheme;
  marks: Record<string, BoxTheme>;
  boxes: Record<string, BoxTheme>;
};

type ThemeStyle = CSSProperties & {
  "--box-theme-base"?: string;
  "--box-theme-primary"?: string;
  "--box-theme-secondary"?: string;
};

export const DEFAULT_BOX_THEME: BoxTheme = { kind: "default" };
export const EMPTY_THEME_CONFIG: BoxThemeConfig = { global: DEFAULT_BOX_THEME, marks: {}, boxes: {} };

const themeAssetUrl = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
const numberedWallpapers = (folder: string, prefix: string, count: number, extension = "png") =>
  Array.from({ length: count }, (_, index) => themeAssetUrl(`assets/themes/${folder}/${prefix}-${String(index + 1).padStart(2, "0")}.${extension}`));

export const THEME_GAMES: { id: ThemeGame; label: string; wallpapers: string[]; appColor: string; primary: string; secondary: string }[] = [
  { id: "swsh", label: "Sword / Shield", wallpapers: numberedWallpapers("swsh", "swsh", 19), appColor: "#173643", primary: "#29c5d9", secondary: "#e94c87" },
  { id: "sv", label: "Scarlet / Violet", wallpapers: [...numberedWallpapers("sv", "sv", 19), themeAssetUrl("assets/themes/sv/sv-20-scarlet.png"), themeAssetUrl("assets/themes/sv/sv-20-violet.png")], appColor: "#2d2349", primary: "#8f6bea", secondary: "#ef6b56" },
  { id: "bdsp", label: "Brilliant Diamond / Shining Pearl", wallpapers: numberedWallpapers("bdsp", "bdsp", 32), appColor: "#213453", primary: "#62aef4", secondary: "#f0a04d" },
  { id: "home", label: "Pokémon HOME", wallpapers: numberedWallpapers("home", "home", 49, "webp"), appColor: "#102e44", primary: "#42cbe8", secondary: "#f0ce58" },
  { id: "lza", label: "Legends Z-A", wallpapers: numberedWallpapers("lza", "lza", 25, "webp"), appColor: "#183329", primary: "#62d4a8", secondary: "#d7b65e" },
];

const allowedWallpapers = new Set(THEME_GAMES.flatMap((game) => game.wallpapers));
const isHexColor = (value: unknown): value is string => typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);

export function boxThemeKey(groupKey: string, number: number) { return `${groupKey}:${number}`; }

export function createPresetTheme(gameId: ThemeGame, wallpaper?: string): BoxTheme {
  const game = THEME_GAMES.find((option) => option.id === gameId) ?? THEME_GAMES[0];
  return { kind: "preset", game: game.id, wallpaper: wallpaper && game.wallpapers.includes(wallpaper) ? wallpaper : game.wallpapers[0], appColor: game.appColor, primary: game.primary, secondary: game.secondary };
}

export function resolveBoxTheme(config: BoxThemeConfig, groupKey: string, number: number) {
  return config.boxes[boxThemeKey(groupKey, number)] ?? config.marks[groupKey] ?? config.global ?? DEFAULT_BOX_THEME;
}

export function boxThemeStyle(theme: BoxTheme): ThemeStyle | undefined {
  if (theme.kind === "default") return undefined;
  const shade = theme.kind === "custom" ? "rgba(4, 14, 13, .34)" : "rgba(4, 14, 13, .18)";
  return {
    "--box-theme-base": theme.appColor,
    "--box-theme-primary": theme.primary,
    "--box-theme-secondary": theme.secondary,
    backgroundColor: theme.appColor,
    backgroundImage: `linear-gradient(${shade}, ${shade}), url("${theme.wallpaper}")`,
  };
}

function sanitizeTheme(value: unknown): BoxTheme | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<BoxTheme>;
  if (candidate.kind === "default") return DEFAULT_BOX_THEME;
  if (candidate.kind === "preset" && THEME_GAMES.some((game) => game.id === candidate.game) && typeof candidate.wallpaper === "string" && allowedWallpapers.has(candidate.wallpaper)) return createPresetTheme(candidate.game as ThemeGame, candidate.wallpaper);
  if (candidate.kind === "custom" && typeof candidate.wallpaper === "string" && /^data:image\/(?:png|jpeg|webp);base64,/i.test(candidate.wallpaper) && candidate.wallpaper.length <= 3_500_000 && isHexColor(candidate.appColor) && isHexColor(candidate.primary) && isHexColor(candidate.secondary)) {
    return { kind: "custom", wallpaper: candidate.wallpaper, appColor: candidate.appColor, primary: candidate.primary, secondary: candidate.secondary };
  }
  return null;
}

function sanitizeThemeRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).flatMap(([key, candidate]) => {
    const theme = sanitizeTheme(candidate);
    return theme ? [[key, theme]] : [];
  }));
}

export function parseThemeConfig(value: unknown): BoxThemeConfig | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as Partial<BoxThemeConfig>;
  const global = sanitizeTheme(candidate.global);
  return global ? { global, marks: sanitizeThemeRecord(candidate.marks), boxes: sanitizeThemeRecord(candidate.boxes) } : null;
}
