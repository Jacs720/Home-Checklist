import type { UiLanguage } from "./translations";

export const POKEDEX_COPY_KEYS = ["pokedex_organization", "pokedex_order", "pokedex_order_national", "pokedex_order_ingame", "pokedex_only", "pokedex_organization_hint", "pokedex_requires_origin", "pokedex_outside", "pokedex_ingame_number"] as const;
const es = ["Organización de cajas", "Orden de Pokédex", "Pokédex nacional", "Pokédex In-Game", "Únicamente Pokémon en la Pokédex", "Dentro de cada marca: Pokédex base y expansiones, sin repetir especies.", "Selecciona una colección por marca de origen para usar esta organización.", "Fuera de la Pokédex", "Número en la Pokédex del juego"];
const copy: Record<UiLanguage, string[]> = {
  "ES-LA": es, "ES-ES": es,
  ENG: ["Box organization", "Pokédex order", "National Pokédex", "In-Game Pokédex", "Only Pokémon in the Pokédex", "Within each origin mark: base Pokédex, then expansions, without duplicate species.", "Select a collection by origin mark to use this organization.", "Outside the Pokédex", "In-game Pokédex number"],
  DEU: ["Boxen organisieren", "Pokédex-Reihenfolge", "Nationaler Pokédex", "Pokédex im Spiel", "Nur Pokémon im Pokédex", "Pro Herkunftszeichen: Basis-Pokédex, dann Erweiterungen, ohne doppelte Arten.", "Wähle eine Sammlung nach Herkunftszeichen, um diese Organisation zu verwenden.", "Außerhalb des Pokédex", "Pokédex-Nummer im Spiel"],
  FRA: ["Organisation des Boîtes", "Ordre du Pokédex", "Pokédex national", "Pokédex du jeu", "Uniquement les Pokémon du Pokédex", "Pour chaque symbole d’origine : Pokédex de base puis extensions, sans répéter les espèces.", "Sélectionnez une collection par symbole d’origine pour utiliser cet ordre.", "Hors Pokédex", "Numéro dans le Pokédex du jeu"],
  ITA: ["Organizzazione dei Box", "Ordine del Pokédex", "Pokédex nazionale", "Pokédex del gioco", "Solo Pokémon nel Pokédex", "Per ogni simbolo d’origine: Pokédex base e poi espansioni, senza specie duplicate.", "Seleziona una collezione per simbolo d’origine per usare questa organizzazione.", "Fuori dal Pokédex", "Numero nel Pokédex del gioco"],
  JPN: ["ボックスの並び順", "図鑑の並び順", "全国図鑑", "ゲーム内の図鑑", "図鑑に載っているポケモンのみ", "出身マークごとに、本編の図鑑、追加コンテンツの順に種族の重複なく並べます。", "出身マーク別のコレクションを選ぶと、この並び順を使えます。", "図鑑の範囲外", "ゲーム内図鑑番号"],
  KOR: ["박스 정렬", "도감 순서", "전국도감", "게임 내 도감", "도감에 있는 포켓몬만", "출신 마크별로 기본 도감 다음 추가 콘텐츠 순서로 중복 종 없이 정렬합니다.", "출신 마크별 컬렉션을 선택하면 이 정렬을 사용할 수 있습니다.", "도감 외 포켓몬", "게임 내 도감 번호"],
  CHS: ["盒子排序", "图鉴顺序", "全国图鉴", "游戏内图鉴", "仅显示图鉴内的宝可梦", "在每个来源标记内，先排列基础图鉴，再排列扩展内容，不重复种类。", "请选择按来源标记分类的收藏以使用此排序。", "图鉴范围外", "游戏内图鉴编号"],
  CHT: ["盒子排序", "圖鑑順序", "全國圖鑑", "遊戲內圖鑑", "僅顯示圖鑑內的寶可夢", "在每個來源標記內，先排列基礎圖鑑，再排列擴充內容，不重複種類。", "請選擇按來源標記分類的收藏以使用此排序。", "圖鑑範圍外", "遊戲內圖鑑編號"],
};
export function pokedexCopy(language: UiLanguage, key: string) {
  const index = POKEDEX_COPY_KEYS.indexOf(key as typeof POKEDEX_COPY_KEYS[number]);
  return index < 0 ? undefined : copy[language][index];
}
