import type { UiLanguage } from "./translations";

export type HomeChallenge = { id: string; title: string; dexes: number[] };
export type HomeChallengesDataset = {
  meta: { source: string; sourceUrl: string; generatedAt: string; speciesCount: number; challengeCount: number; caveat: string };
  dexes: number[];
  challenges: HomeChallenge[];
};

type PokemonNames = Record<string, Partial<Record<UiLanguage, string>>>;

const REGION_NAMES: Record<string, Partial<Record<UiLanguage, string>>> = {
  Alola: { JPN: "アローラ", KOR: "알로라", CHS: "阿罗拉", CHT: "阿羅拉" },
  Galar: { JPN: "ガラル", KOR: "가라르", CHS: "伽勒尔", CHT: "伽勒爾" },
  Hisui: { JPN: "ヒスイ", KOR: "히스이", CHS: "洗翠", CHT: "洗翠" },
  Hoenn: { JPN: "ホウエン", KOR: "호연", CHS: "丰缘", CHT: "豐緣" },
  Johto: { JPN: "ジョウト", KOR: "성도", CHS: "城都", CHT: "城都" },
  Kalos: { JPN: "カロス", KOR: "칼로스", CHS: "卡洛斯", CHT: "卡洛斯" },
  Kanto: { JPN: "カントー", KOR: "관동", CHS: "关都", CHT: "關都" },
  Paldea: { JPN: "パルデア", KOR: "팔데아", CHS: "帕底亚", CHT: "帕底亞" },
  Sinnoh: { JPN: "シンオウ", KOR: "신오", CHS: "神奥", CHT: "神奧" },
  Unova: { "ES-LA": "Teselia", "ES-ES": "Teselia", DEU: "Einall", FRA: "Unys", ITA: "Unima", JPN: "イッシュ", KOR: "하나", CHS: "合众", CHT: "合眾" },
};

const REGIONAL_NAMES: Record<string, Partial<Record<UiLanguage, string>>> = {
  Alolan: REGION_NAMES.Alola,
  Galarian: REGION_NAMES.Galar,
  Hisuian: REGION_NAMES.Hisui,
  Paldean: REGION_NAMES.Paldea,
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function regionName(language: UiLanguage, region: string) {
  return REGION_NAMES[region]?.[language] ?? region;
}

function regionalName(language: UiLanguage, region: string, name: string) {
  const localizedRegion = REGIONAL_NAMES[region]?.[language] ?? region.replace(/ian$/, "");
  if (language.startsWith("ES")) return `${name} de ${localizedRegion}`;
  if (language === "DEU") return `${localizedRegion}-${name}`;
  if (language === "FRA") return `${name} de ${localizedRegion}`;
  if (language === "ITA") return `${name} di ${localizedRegion}`;
  if (language === "JPN") return `${localizedRegion}のすがたの${name}`;
  if (language === "KOR") return `${localizedRegion}의 모습 ${name}`;
  if (language === "CHS") return `${localizedRegion}的样子${name}`;
  if (language === "CHT") return `${localizedRegion}的樣子${name}`;
  return `${region} ${name}`;
}

function genderedName(language: UiLanguage, gender: "male" | "female", name: string) {
  const labels: Record<"male" | "female", Record<UiLanguage, string>> = {
    male: { "ES-LA": "macho", "ES-ES": "macho", ENG: "male", DEU: "männlich", FRA: "mâle", ITA: "maschio", JPN: "オス", KOR: "수컷", CHS: "雄性", CHT: "雄性" },
    female: { "ES-LA": "hembra", "ES-ES": "hembra", ENG: "female", DEU: "weiblich", FRA: "femelle", ITA: "femmina", JPN: "メス", KOR: "암컷", CHS: "雌性", CHT: "雌性" },
  };
  const genderLabel = labels[gender][language];
  return language === "JPN" || language === "KOR" || language === "CHS" || language === "CHT" ? `${genderLabel} ${name}` : `${name} ${genderLabel}`;
}

function localizePokemonNames(language: UiLanguage, value: string, dexes: number[], pokemonNames: PokemonNames) {
  let localized = value;
  for (const dex of dexes) {
    const names = pokemonNames[String(dex)];
    const englishName = names?.ENG;
    const localName = names?.[language] ?? englishName;
    if (!englishName || !localName) continue;
    for (const region of Object.keys(REGIONAL_NAMES)) {
      localized = localized.replace(new RegExp(`\\b${region} ${escapeRegExp(englishName)}\\b`, "g"), regionalName(language, region, localName));
    }
    localized = localized
      .replace(new RegExp(`\\bmale ${escapeRegExp(englishName)}\\b`, "g"), genderedName(language, "male", localName))
      .replace(new RegExp(`\\bfemale ${escapeRegExp(englishName)}\\b`, "g"), genderedName(language, "female", localName))
      .replace(new RegExp(`\\b${escapeRegExp(englishName)}\\b`, "g"), localName);
  }
  return localized;
}

function conjunctions(language: UiLanguage, value: string) {
  const conjunction = language.startsWith("ES") || language === "ITA" ? "y" : language === "DEU" ? "und" : language === "FRA" ? "et" : language === "JPN" ? "と" : language === "KOR" ? "와" : "和";
  const alternative = language.startsWith("ES") || language === "ITA" ? "o" : language === "DEU" ? "oder" : language === "FRA" ? "ou" : language === "JPN" ? "または" : language === "KOR" ? "또는" : "或";
  return value.replace(/, and /g, `, ${conjunction} `).replace(/ and /g, ` ${conjunction} `).replace(/ or /g, ` ${alternative} `);
}

function localizedSubject(language: UiLanguage, source: string, dexes: number[], pokemonNames: PokemonNames) {
  let subject = localizePokemonNames(language, source, dexes, pokemonNames);
  const region = (name: string) => regionName(language, name);

  const starters = subject.match(/^all the first-?partner Pokémon that Trainers can choose in (.+)$/i);
  if (starters) {
    const place = region(starters[1]);
    if (language.startsWith("ES")) return `todos los Pokémon iniciales que se pueden elegir en ${place}`;
    if (language === "DEU") return `alle ersten Partner-Pokémon aus ${place}`;
    if (language === "FRA") return `tous les Pokémon de départ de ${place}`;
    if (language === "ITA") return `tutti i Pokémon iniziali di ${place}`;
    if (language === "JPN") return `${place}で選べるすべての最初のパートナー`;
    if (language === "KOR") return `${place}에서 선택할 수 있는 모든 파트너 포켓몬`;
    if (language === "CHS") return `${place}可选择的所有最初的伙伴宝可梦`;
    if (language === "CHT") return `${place}可選擇的所有最初的夥伴寶可夢`;
  }

  const count = subject.match(/^(\d+) (forms|patterns|varieties|colors) of (.+)$/i);
  if (count) {
    const words = {
      forms: { ES: "formas", DEU: "Formen", FRA: "formes", ITA: "forme", JPN: "フォルム", KOR: "폼", CHS: "种形态", CHT: "種形態" },
      patterns: { ES: "patrones", DEU: "Muster", FRA: "motifs", ITA: "motivi", JPN: "もよう", KOR: "무늬", CHS: "种花纹", CHT: "種花紋" },
      varieties: { ES: "variedades", DEU: "Varianten", FRA: "variétés", ITA: "varietà", JPN: "種類", KOR: "종류", CHS: "种", CHT: "種" },
      colors: { ES: "colores", DEU: "Farben", FRA: "couleurs", ITA: "colori", JPN: "色", KOR: "색", CHS: "种颜色", CHT: "種顏色" },
    }[count[2].toLowerCase() as "forms" | "patterns" | "varieties" | "colors"];
    if (language.startsWith("ES")) return `${count[1]} ${words.ES} de ${count[3]}`;
    if (language === "DEU") return `${count[1]} ${words.DEU} von ${count[3]}`;
    if (language === "FRA") return `${count[1]} ${words.FRA} de ${count[3]}`;
    if (language === "ITA") return `${count[1]} ${words.ITA} di ${count[3]}`;
    const suffix = language === "JPN" ? words.JPN : language === "KOR" ? words.KOR : language === "CHS" ? words.CHS : words.CHT;
    return `${count[3]} ${count[1]}${suffix}`;
  }

  const possessiveForms = subject.match(/^(.+) 's Forms$/i);
  if (possessiveForms) {
    if (language.startsWith("ES")) return `formas de ${possessiveForms[1]}`;
    if (language === "DEU") return `Formen von ${possessiveForms[1]}`;
    if (language === "FRA") return `formes de ${possessiveForms[1]}`;
    if (language === "ITA") return `forme di ${possessiveForms[1]}`;
    if (language === "JPN") return `${possessiveForms[1]}のフォルム`;
    if (language === "KOR") return `${possessiveForms[1]}의 폼`;
    return language === "CHS" ? `${possessiveForms[1]}的形态` : `${possessiveForms[1]}的形態`;
  }

  const fromOldRegion = subject.match(/^(.+) from the good ol' (.+) region$/i);
  if (fromOldRegion) {
    const place = region(fromOldRegion[2]);
    if (language.startsWith("ES")) return `${fromOldRegion[1]} procedente de la región de ${place} de antaño`;
    if (language === "DEU") return `${fromOldRegion[1]} aus der guten alten ${place}-Region`;
    if (language === "FRA") return `${fromOldRegion[1]} de la bonne vieille région de ${place}`;
    if (language === "ITA") return `${fromOldRegion[1]} dalla vecchia regione di ${place}`;
    if (language === "JPN") return `懐かしの${place}地方から来た${fromOldRegion[1]}`;
    if (language === "KOR") return `추억의 ${place}지방에서 온 ${fromOldRegion[1]}`;
    return language === "CHS" ? `来自令人怀念的${place}地区的${fromOldRegion[1]}` : `來自令人懷念的${place}地區的${fromOldRegion[1]}`;
  }

  const fromGame = subject.match(/^(.+) from (Pokémon .+)$/i);
  if (fromGame) {
    if (language.startsWith("ES")) return `${fromGame[1]} procedente de ${conjunctions(language, fromGame[2])}`;
    if (language === "DEU") return `${fromGame[1]} aus ${conjunctions(language, fromGame[2])}`;
    if (language === "FRA") return `${fromGame[1]} provenant de ${conjunctions(language, fromGame[2])}`;
    if (language === "ITA") return `${fromGame[1]} proveniente da ${conjunctions(language, fromGame[2])}`;
    if (language === "JPN") return `${conjunctions(language, fromGame[2])}から来た${fromGame[1]}`;
    if (language === "KOR") return `${conjunctions(language, fromGame[2])}에서 온 ${fromGame[1]}`;
    return language === "CHS" ? `来自${conjunctions(language, fromGame[2])}的${fromGame[1]}` : `來自${conjunctions(language, fromGame[2])}的${fromGame[1]}`;
  }

  const transporter = subject.match(/^(.+) brought over using Poké Transporter$/i);
  if (transporter) {
    if (language.startsWith("ES")) return `${transporter[1]} transferido mediante Poké Trasladador`;
    if (language === "DEU") return `${transporter[1]}, das mit PokéMover übertragen wurde`;
    if (language === "FRA") return `${transporter[1]} transféré avec Poké Transfert`;
    if (language === "ITA") return `${transporter[1]} trasferito con Pokétrasferitore`;
    if (language === "JPN") return `ポケムーバーで連れてきた${transporter[1]}`;
    if (language === "KOR") return `포켓무버로 데려온 ${transporter[1]}`;
    return language === "CHS" ? `通过宝可梦虚拟传送带传送的${transporter[1]}` : `透過寶可夢虛擬傳送傳送的${transporter[1]}`;
  }

  const replacements: Record<UiLanguage, Array<[RegExp, string]>> = {
    "ES-LA": [[/species of Pokémon revived from Fossils/gi, "especies de Pokémon revividos de fósiles"], [/different Ruinous Pokémon/gi, "Pokémon de la ruina diferentes"], [/different species of Ultra Beast/gi, "especies diferentes de Ultraentes"], [/Alcremie 's Forms/gi, "formas de Alcremie"], [/and its (\d+) Evolutions/gi, "y sus $1 evoluciones"], [/wearing a hat/gi, "con gorra"], [/Shiny /gi, "shiny "], [/the guardian deities of Alola/gi, "los espíritus guardianes de Alola"], [/Roaming Form/gi, "Forma Andante"], [/Spring Form/gi, "Forma Primavera"], [/Summer Form/gi, "Forma Verano"], [/Autumn Form/gi, "Forma Otoño"], [/Winter Form/gi, "Forma Invierno"], [/Eternal Flower/gi, "Flor Eterna"], [/Bloodmoon/gi, "Luna Carmesí"], [/West Sea/gi, "Mar Oeste"], [/East Sea/gi, "Mar Este"]],
    "ES-ES": [[/species of Pokémon revived from Fossils/gi, "especies de Pokémon revividos de fósiles"], [/different Ruinous Pokémon/gi, "Pokémon de la ruina diferentes"], [/different species of Ultra Beast/gi, "especies diferentes de Ultraentes"], [/Alcremie 's Forms/gi, "formas de Alcremie"], [/and its (\d+) Evolutions/gi, "y sus $1 evoluciones"], [/wearing a hat/gi, "con gorra"], [/Shiny /gi, "variocolor "], [/the guardian deities of Alola/gi, "los espíritus guardianes de Alola"], [/Roaming Form/gi, "Forma Andante"], [/Spring Form/gi, "Forma Primavera"], [/Summer Form/gi, "Forma Verano"], [/Autumn Form/gi, "Forma Otoño"], [/Winter Form/gi, "Forma Invierno"], [/Eternal Flower/gi, "Flor Eterna"], [/Bloodmoon/gi, "Luna Carmesí"], [/West Sea/gi, "Mar Oeste"], [/East Sea/gi, "Mar Este"]],
    ENG: [],
    DEU: [[/species of Pokémon revived from Fossils/gi, "aus Fossilien wiederbelebte Pokémon-Arten"], [/different Ruinous Pokémon/gi, "verschiedene Unheil-Pokémon"], [/different species of Ultra Beast/gi, "verschiedene Ultrabestien-Arten"], [/and its (\d+) Evolutions/gi, "und seine $1 Entwicklungen"], [/wearing a hat/gi, "mit einer Mütze"], [/Shiny /gi, "Schillerndes "], [/the guardian deities of Alola/gi, "die Schutzpatrone Alolas"], [/Roaming Form/gi, "Wanderform"], [/Spring Form/gi, "Frühlingsform"], [/Summer Form/gi, "Sommerform"], [/Autumn Form/gi, "Herbstform"], [/Winter Form/gi, "Winterform"], [/Eternal Flower/gi, "Ewige Blume"], [/Bloodmoon/gi, "Blutmond"], [/West Sea/gi, "Westliches Meer"], [/East Sea/gi, "Östliches Meer"]],
    FRA: [[/species of Pokémon revived from Fossils/gi, "espèces de Pokémon ressuscités de Fossiles"], [/different Ruinous Pokémon/gi, "différents Pokémon Fléaux"], [/different species of Ultra Beast/gi, "espèces différentes d'Ultra-Chimères"], [/and its (\d+) Evolutions/gi, "et ses $1 Évolutions"], [/wearing a hat/gi, "portant une casquette"], [/Shiny /gi, "chromatique "], [/the guardian deities of Alola/gi, "les gardiens d'Alola"], [/Roaming Form/gi, "Forme Marche"], [/Spring Form/gi, "Forme Printemps"], [/Summer Form/gi, "Forme Été"], [/Autumn Form/gi, "Forme Automne"], [/Winter Form/gi, "Forme Hiver"], [/Eternal Flower/gi, "Fleur Éternelle"], [/Bloodmoon/gi, "Lune Vermeille"], [/West Sea/gi, "Mer Occident"], [/East Sea/gi, "Mer Orient"]],
    ITA: [[/species of Pokémon revived from Fossils/gi, "specie di Pokémon riportate in vita dai Fossili"], [/different Ruinous Pokémon/gi, "diversi Pokémon disastrosi"], [/different species of Ultra Beast/gi, "specie diverse di Ultracreature"], [/and its (\d+) Evolutions/gi, "e le sue $1 evoluzioni"], [/wearing a hat/gi, "con un berretto"], [/Shiny /gi, "cromatico "], [/the guardian deities of Alola/gi, "i protettori di Alola"], [/Roaming Form/gi, "Forma Ambulante"], [/Spring Form/gi, "Forma Primavera"], [/Summer Form/gi, "Forma Estate"], [/Autumn Form/gi, "Forma Autunno"], [/Winter Form/gi, "Forma Inverno"], [/Eternal Flower/gi, "Fiore Eterno"], [/Bloodmoon/gi, "Luna Cremisi"], [/West Sea/gi, "Mare Ovest"], [/East Sea/gi, "Mare Est"]],
    JPN: [[/species of Pokémon revived from Fossils/gi, "カセキから復元したポケモンの種類"], [/different Ruinous Pokémon/gi, "種類の災厄ポケモン"], [/different species of Ultra Beast/gi, "種類のウルトラビースト"], [/and its (\d+) Evolutions/gi, "とその進化形$1種"], [/wearing a hat/gi, "ぼうしをかぶった"], [/Shiny /gi, "色違いの"], [/the guardian deities of Alola/gi, "アローラの守り神"], [/Roaming Form/gi, "とほフォルム"], [/Spring Form/gi, "はるのすがた"], [/Summer Form/gi, "なつのすがた"], [/Autumn Form/gi, "あきのすがた"], [/Winter Form/gi, "ふゆのすがた"], [/Eternal Flower/gi, "えいえんのはな"], [/Bloodmoon/gi, "アカツキ"], [/West Sea/gi, "にしのうみ"], [/East Sea/gi, "ひがしのうみ"]],
    KOR: [[/species of Pokémon revived from Fossils/gi, "화석에서 복원한 포켓몬 종"], [/different Ruinous Pokémon/gi, "종류의 재앙의 포켓몬"], [/different species of Ultra Beast/gi, "종류의 울트라비스트"], [/and its (\d+) Evolutions/gi, "와 그 진화형 $1종"], [/wearing a hat/gi, "모자를 쓴"], [/Shiny /gi, "색이 다른 "], [/the guardian deities of Alola/gi, "알로라의 수호신"], [/Roaming Form/gi, "도보폼"], [/Spring Form/gi, "봄의 모습"], [/Summer Form/gi, "여름의 모습"], [/Autumn Form/gi, "가을의 모습"], [/Winter Form/gi, "겨울의 모습"], [/Eternal Flower/gi, "영원의 꽃"], [/Bloodmoon/gi, "붉은 달"], [/West Sea/gi, "서쪽바다"], [/East Sea/gi, "동쪽바다"]],
    CHS: [[/species of Pokémon revived from Fossils/gi, "种由化石复活的宝可梦"], [/different Ruinous Pokémon/gi, "种不同的灾祸宝可梦"], [/different species of Ultra Beast/gi, "种不同的究极异兽"], [/and its (\d+) Evolutions/gi, "及其$1种进化形"], [/wearing a hat/gi, "戴着帽子的"], [/Shiny /gi, "异色"], [/the guardian deities of Alola/gi, "阿罗拉的守护神"], [/Roaming Form/gi, "徒步形态"], [/Spring Form/gi, "春天的样子"], [/Summer Form/gi, "夏天的样子"], [/Autumn Form/gi, "秋天的样子"], [/Winter Form/gi, "冬天的样子"], [/Eternal Flower/gi, "永恒之花"], [/Bloodmoon/gi, "赫月"], [/West Sea/gi, "西海"], [/East Sea/gi, "东海"]],
    CHT: [[/species of Pokémon revived from Fossils/gi, "種由化石復活的寶可夢"], [/different Ruinous Pokémon/gi, "種不同的災禍寶可夢"], [/different species of Ultra Beast/gi, "種不同的究極異獸"], [/and its (\d+) Evolutions/gi, "及其$1種進化型"], [/wearing a hat/gi, "戴著帽子的"], [/Shiny /gi, "異色"], [/the guardian deities of Alola/gi, "阿羅拉的守護神"], [/Roaming Form/gi, "徒步形態"], [/Spring Form/gi, "春天的樣子"], [/Summer Form/gi, "夏天的樣子"], [/Autumn Form/gi, "秋天的樣子"], [/Winter Form/gi, "冬天的樣子"], [/Eternal Flower/gi, "永恆之花"], [/Bloodmoon/gi, "赫月"], [/West Sea/gi, "西海"], [/East Sea/gi, "東海"]],
  };
  for (const [pattern, replacement] of replacements[language]) subject = subject.replace(pattern, replacement);
  return conjunctions(language, subject);
}

export function localizeHomeChallengeTitle(language: UiLanguage, challenge: HomeChallenge, pokemonNames: PokemonNames) {
  if (language === "ENG") return challenge.title;
  const source = challenge.title.replace(/!$/, "");
  const depositCount = source.match(/^Deposit (\d+) (.+)$/i);
  const depositCaught = source.match(/^Deposit a (.+) that was caught in (.+)$/i);
  const register = source.match(/^Register (.+)$/i);
  const trade = source.match(/^Trade (.+)$/i);
  const withdraw = source.match(/^Withdraw (.+) from Pokémon HOME$/i);

  let action: "deposit" | "register" | "trade" | "withdraw" = "register";
  let subject = source;
  if (depositCount) { action = "deposit"; subject = `${depositCount[1]} ${depositCount[2]}`; }
  else if (depositCaught) { action = "deposit"; subject = `${depositCaught[1]} · ${depositCaught[2]}`; }
  else if (register) { action = "register"; subject = register[1]; }
  else if (trade) { action = "trade"; subject = trade[1]; }
  else if (withdraw) { action = "withdraw"; subject = withdraw[1]; }
  subject = localizedSubject(language, subject, challenge.dexes, pokemonNames);

  const verbs: Record<UiLanguage, Record<typeof action, [string, string]>> = {
    "ES-LA": { deposit: ["Deposita ", ""], register: ["Registra ", ""], trade: ["Intercambia ", ""], withdraw: ["Retira de Pokémon HOME a ", ""] },
    "ES-ES": { deposit: ["Deposita ", ""], register: ["Registra ", ""], trade: ["Intercambia ", ""], withdraw: ["Retira de Pokémon HOME a ", ""] },
    ENG: { deposit: ["Deposit ", ""], register: ["Register ", ""], trade: ["Trade ", ""], withdraw: ["Withdraw ", " from Pokémon HOME"] },
    DEU: { deposit: ["Lagere ", " ein"], register: ["Registriere ", ""], trade: ["Tausche ", ""], withdraw: ["Hole ", " aus Pokémon HOME ab"] },
    FRA: { deposit: ["Déposez ", ""], register: ["Enregistrez ", ""], trade: ["Échangez ", ""], withdraw: ["Retirez ", " de Pokémon HOME"] },
    ITA: { deposit: ["Deposita ", ""], register: ["Registra ", ""], trade: ["Scambia ", ""], withdraw: ["Ritira ", " da Pokémon HOME"] },
    JPN: { deposit: ["", "を預けよう"], register: ["", "を登録しよう"], trade: ["", "を交換しよう"], withdraw: ["", "をPokémon HOMEから引き出そう"] },
    KOR: { deposit: ["", " 맡기기"], register: ["", " 등록하기"], trade: ["", " 교환하기"], withdraw: ["Pokémon HOME에서 ", " 꺼내기"] },
    CHS: { deposit: ["寄放", ""], register: ["登记", ""], trade: ["交换", ""], withdraw: ["从 Pokémon HOME 取出", ""] },
    CHT: { deposit: ["寄放", ""], register: ["登記", ""], trade: ["交換", ""], withdraw: ["從 Pokémon HOME 取出", ""] },
  };
  const [prefix, suffix] = verbs[language][action];
  return `${prefix}${subject}${suffix}!`;
}
