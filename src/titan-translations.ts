import type { UiLanguage } from "./translations";

const ES = {
  titan_collection: "Pokémon dominantes",
  titan_mark: "Emblema Dominancia",
  method_titan: "Tras derrotarlo en la Senda legendaria, vuelve al lugar del encuentro y captura al antiguo Pokémon dominante.",
  why_titan: "Este ejemplar conserva el Emblema Dominancia y puede transferirse a Pokémon HOME. Los antiguos dominantes capturables no pueden ser variocolor; Dondozo no se puede capturar con este emblema.",
};

export const TITAN_COPY: Record<UiLanguage, Record<keyof typeof ES, string>> = {
  "ES-LA": ES,
  "ES-ES": ES,
  ENG: {
    titan_collection: "Titan Pokémon",
    titan_mark: "Titan Mark",
    method_titan: "After defeating it in the Path of Legends, return to its encounter location and catch the former Titan Pokémon.",
    why_titan: "This specimen retains the Titan Mark and can be transferred to Pokémon HOME. Catchable former Titans are Shiny-locked; Dondozo cannot be caught with this mark.",
  },
  DEU: {
    titan_collection: "Herrscher-Pokémon",
    titan_mark: "Herrscher-Zeichen",
    method_titan: "Kehre nach dem Sieg auf dem Pfad der Legenden zum Fundort zurück und fange das ehemalige Herrscher-Pokémon.",
    why_titan: "Dieses Exemplar behält das Herrscher-Zeichen und kann auf Pokémon HOME übertragen werden. Fangbare ehemalige Herrscher können nicht schillernd sein. Heerashai lässt sich nicht mit diesem Zeichen fangen.",
  },
  FRA: {
    titan_collection: "Pokémon Dominants",
    titan_mark: "Insigne Dominant",
    method_titan: "Après l’avoir vaincu dans Un parfum de légende, retournez sur le lieu de la rencontre pour capturer l’ancien Pokémon Dominant.",
    why_titan: "Cet individu conserve l’Insigne Dominant et peut être transféré dans Pokémon HOME. Les anciens Dominants capturables ne peuvent pas être chromatiques. Oyacata ne peut pas être capturé avec cet insigne.",
  },
  ITA: {
    titan_collection: "Pokémon dominanti",
    titan_mark: "Emblema del Dominante",
    method_titan: "Dopo averlo sconfitto nel Sentiero leggendario, torna sul luogo dell’incontro e cattura l’ex Pokémon dominante.",
    why_titan: "Questo esemplare conserva l’emblema del Dominante e può essere trasferito in Pokémon HOME. Gli ex dominanti catturabili non possono essere cromatici. Dondozo non può essere catturato con questo emblema.",
  },
  JPN: {
    titan_collection: "ヌシポケモン",
    titan_mark: "ヌシのあかし",
    method_titan: "レジェンドルートで倒した後、出会った場所に戻り、元ヌシポケモンを捕まえます。",
    why_titan: "この個体は「ヌシのあかし」を持ち、Pokémon HOMEに送ることができます。捕獲できる元ヌシポケモンは色違いになりません。ヘイラッシャはこのあかし付きで捕まえることができません。",
  },
  KOR: {
    titan_collection: "주인 포켓몬",
    titan_mark: "주인의증표",
    method_titan: "레전드 루트에서 쓰러뜨린 후 만났던 장소로 돌아가 이전의 주인 포켓몬을 잡으세요.",
    why_titan: "이 개체는 주인의증표를 유지하며 Pokémon HOME으로 보낼 수 있습니다. 잡을 수 있는 이전의 주인 포켓몬은 색이 다른 모습으로 등장하지 않습니다. 어써러셔는 이 증표를 가진 상태로 잡을 수 없습니다.",
  },
  CHS: {
    titan_collection: "宝主宝可梦",
    titan_mark: "宝主之证",
    method_titan: "在传说之路中击败它后，返回相遇地点，捕捉曾经的宝主宝可梦。",
    why_titan: "这个个体持有宝主之证，可以传送至Pokémon HOME。可捕捉的前宝主不会出现异色。吃吼霸无法以持有此证章的状态被捕捉。",
  },
  CHT: {
    titan_collection: "寶主寶可夢",
    titan_mark: "寶主之證",
    method_titan: "在傳說之路中擊敗牠後，返回相遇地點，捕捉曾經的寶主寶可夢。",
    why_titan: "這個個體持有寶主之證，可以傳送至Pokémon HOME。可捕捉的前寶主不會出現異色。吃吼霸無法以持有此證章的狀態被捕捉。",
  },
};

export function titanCopy(language: UiLanguage, key: string): string | undefined {
  return Object.hasOwn(TITAN_COPY[language], key) ? TITAN_COPY[language][key as keyof typeof ES] : undefined;
}
