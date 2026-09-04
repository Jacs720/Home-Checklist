import type { UiLanguage } from "./translations";

const ROWS = {
  "details": [
    "Ver detalles",
    "View details",
    "Details anzeigen",
    "Voir les détails",
    "Vedi dettagli",
    "詳細を見る",
    "상세 보기",
    "查看详情",
    "查看詳情"
  ],
  "close": [
    "Cerrar",
    "Close",
    "Schließen",
    "Fermer",
    "Chiudi",
    "閉じる",
    "닫기",
    "关闭",
    "關閉"
  ],
  "all": [
    "Todos",
    "All",
    "Alle",
    "Tous",
    "Tutti",
    "すべて",
    "전체",
    "全部",
    "全部"
  ],
  "complete": [
    "Completados",
    "Completed",
    "Abgeschlossen",
    "Terminés",
    "Completati",
    "達成",
    "완료",
    "已完成",
    "已完成"
  ],
  "missing": [
    "Faltantes",
    "Missing",
    "Fehlend",
    "Manquants",
    "Mancanti",
    "未達成",
    "미완료",
    "未完成",
    "未完成"
  ],
  "review": [
    "Por verificar",
    "To verify",
    "Zu prüfen",
    "À vérifier",
    "Da verificare",
    "要確認",
    "확인 필요",
    "待确认",
    "待確認"
  ],
  "search": [
    "Buscar desafío o Pokémon",
    "Search challenges or Pokémon",
    "Aufgabe oder Pokémon suchen",
    "Rechercher un défi ou un Pokémon",
    "Cerca sfide o Pokémon",
    "チャレンジ・ポケモンを検索",
    "과제 또는 포켓몬 검색",
    "搜索挑战或宝可梦",
    "搜尋挑戰或寶可夢"
  ],
  "empty": [
    "No hay desafíos con estos filtros.",
    "No challenges match these filters.",
    "Keine passenden Aufgaben.",
    "Aucun défi ne correspond à ces filtres.",
    "Nessuna sfida corrisponde ai filtri.",
    "条件に合うチャレンジはありません。",
    "조건에 맞는 과제가 없습니다.",
    "没有符合条件的挑战。",
    "沒有符合條件的挑戰。"
  ],
  "evidence": [
    "Según tu colección registrada; no sincroniza logros con HOME.",
    "Based on your registered collection; does not sync achievements with HOME.",
    "Aus deiner registrierten Sammlung; keine Synchronisierung mit HOME.",
    "Selon votre collection enregistrée ; aucun succès synchronisé avec HOME.",
    "In base alla collezione registrata; nessuna sincronizzazione dei risultati con HOME.",
    "登録済みコレクションから推定。HOMEの実績とは同期しません。",
    "등록한 컬렉션 기준이며 HOME 업적과 동기화되지 않습니다.",
    "根据已登记的收藏推算，不与 HOME 成就同步。",
    "根據已登記的收藏推算，不與 HOME 成就同步。"
  ],
  "levels": [
    "Niveles",
    "Levels",
    "Stufen",
    "Niveaux",
    "Livelli",
    "段階",
    "단계",
    "等级",
    "等級"
  ],
  "challenges": [
    "Desafíos",
    "Challenges",
    "Aufgaben",
    "Défis",
    "Sfide",
    "チャレンジ",
    "과제",
    "挑战",
    "挑戰"
  ],
  "pokemon": [
    "Pokémon",
    "Pokémon",
    "Pokémon",
    "Pokémon",
    "Pokémon",
    "ポケモン",
    "포켓몬",
    "宝可梦",
    "寶可夢"
  ],
  "trade": [
    "Intercambios",
    "Trades",
    "Tausch",
    "Échanges",
    "Scambi",
    "交換",
    "교환",
    "交换",
    "交換"
  ],
  "other": [
    "Otros",
    "Other",
    "Sonstiges",
    "Autres",
    "Altro",
    "その他",
    "기타",
    "其他",
    "其他"
  ],
  "activity": [
    "Requiere una acción en Pokémon HOME. Tener los Pokémon no confirma este logro.",
    "Requires an action in Pokémon HOME. Owning the Pokémon does not confirm this achievement.",
    "Erfordert eine Aktion in Pokémon HOME. Besitz allein bestätigt diesen Erfolg nicht.",
    "Nécessite une action dans Pokémon HOME. Posséder les Pokémon ne confirme pas ce succès.",
    "Richiede un’azione in Pokémon HOME. Possedere i Pokémon non conferma questo risultato.",
    "Pokémon HOME内の操作が必要です。所持だけでは達成を確認できません。",
    "Pokémon HOME에서 행동이 필요합니다. 소유만으로는 완료를 확인할 수 없습니다.",
    "需要在 Pokémon HOME 中执行操作，仅持有宝可梦无法确认完成。",
    "需要在 Pokémon HOME 中執行操作，僅持有寶可夢無法確認完成。"
  ],
  "metadata": [
    "Verifica el origen o los datos específicos en HOME; la colección no contiene toda la información necesaria.",
    "Check the origin or specimen details in HOME; the collection does not record all required information.",
    "Prüfe Herkunft oder Details in HOME; die Sammlung enthält nicht alle nötigen Angaben.",
    "Vérifiez l’origine ou les détails dans HOME ; la collection ne contient pas toutes les informations requises.",
    "Verifica origine o dettagli in HOME; la collezione non registra tutte le informazioni necessarie.",
    "出身や個体の詳細をHOMEで確認してください。必要な情報がすべて登録されているわけではありません。",
    "HOME에서 출신이나 개체 정보를 확인하세요. 필요한 정보가 모두 기록되어 있지는 않습니다.",
    "请在 HOME 确认来源或个体详情，收藏未记录所有必要信息。",
    "請在 HOME 確認來源或個體詳情，收藏未記錄所有必要資訊。"
  ],
  "source": [
    "Requisito original (inglés)",
    "Original requirement (English)",
    "Originalanforderung (Englisch)",
    "Condition originale (anglais)",
    "Requisito originale (inglese)",
    "原文の条件（英語）",
    "원문 조건 (영어)",
    "原始要求（英语）",
    "原始要求（英語）"
  ],
  "base": [
    "Forma habitual",
    "Usual form",
    "Standardform",
    "Forme habituelle",
    "Forma abituale",
    "通常のすがた",
    "일반적인 모습",
    "通常形态",
    "通常形態"
  ],
  "owned": [
    "Registrado",
    "Registered",
    "Registriert",
    "Enregistré",
    "Registrato",
    "登録済み",
    "등록됨",
    "已登记",
    "已登記"
  ],
  "needed": [
    "Falta",
    "Missing",
    "Fehlt",
    "Manquant",
    "Mancante",
    "未登録",
    "미등록",
    "未登记",
    "未登記"
  ],
  "countNote": [
    "Cada nivel cuenta como un desafío. Se usa toda tu colección, sin aplicar filtros.",
    "Each level counts as a challenge. Uses your entire collection, without filters.",
    "Jede Stufe zählt als Aufgabe. Die gesamte Sammlung wird ohne Filter berücksichtigt.",
    "Chaque niveau compte comme un défi. Toute la collection est utilisée, sans filtres.",
    "Ogni livello conta come una sfida. Viene usata l’intera collezione, senza filtri.",
    "各段階を1件として数えます。フィルターに関係なく全コレクションを使用します。",
    "각 단계를 하나의 과제로 계산합니다. 필터와 관계없이 전체 컬렉션을 사용합니다.",
    "每个等级算作一项挑战，使用完整收藏，不应用筛选。",
    "每個等級算作一項挑戰，使用完整收藏，不套用篩選。"
  ],
  "requirements": [
    "Pokémon requeridos",
    "Required Pokémon",
    "Benötigte Pokémon",
    "Pokémon requis",
    "Pokémon richiesti",
    "必要なポケモン",
    "필요한 포켓몬",
    "所需宝可梦",
    "所需寶可夢"
  ],
  "deposit": [
    "Depositar",
    "Deposit",
    "Einlagern",
    "Déposer",
    "Depositare",
    "預ける",
    "맡기기",
    "寄放",
    "寄放"
  ],
  "register": [
    "Registrar",
    "Register",
    "Registrieren",
    "Enregistrer",
    "Registrare",
    "登録",
    "등록",
    "登记",
    "登記"
  ],
  "nature": [
    "Naturaleza",
    "Nature",
    "Wesen",
    "Nature",
    "Natura",
    "性格",
    "성격",
    "性格",
    "性格"
  ],
  "ball": [
    "Poké Ball",
    "Poké Ball",
    "Pokéball",
    "Poké Ball",
    "Poké Ball",
    "ボール",
    "볼",
    "精灵球",
    "精靈球"
  ],
  "abilities": [
    "Habilidades distintas",
    "Distinct Abilities",
    "Verschiedene Fähigkeiten",
    "Talents distincts",
    "Abilità diverse",
    "異なる特性",
    "서로 다른 특성",
    "不同特性",
    "不同特性"
  ],
  "shiny": [
    "Pokémon shiny",
    "Shiny Pokémon",
    "Schillernde Pokémon",
    "Pokémon chromatiques",
    "Pokémon cromatici",
    "色違いのポケモン",
    "색이 다른 포켓몬",
    "异色宝可梦",
    "異色寶可夢"
  ],
  "alpha": [
    "Pokémon alfa",
    "Alpha Pokémon",
    "Elite-Pokémon",
    "Pokémon Barons",
    "Pokémon alfa",
    "オヤブン",
    "우두머리 포켓몬",
    "头目宝可梦",
    "頭目寶可夢"
  ],
  "mightiest": [
    "Emblema Imbatibilidad",
    "Mightiest Mark",
    "Titanen-Zeichen",
    "Insigne Surpuissant",
    "Emblema Forza Assoluta",
    "さいきょうのあかし",
    "최강의증표",
    "最强之证",
    "最強之證"
  ],
  "twinkling": [
    "Cinta Estrella Brillante",
    "Twinkling Star Ribbon",
    "Funkelsternband",
    "Ruban Étoile Scintillante",
    "Fiocco Stella Splendente",
    "トゥインクルスターリボン",
    "트윙클스타리본",
    "璀璨之星奖章",
    "璀璨之星獎章"
  ],
  "effort": [
    "Niveles de esfuerzo al máximo",
    "All effort levels maxed",
    "Alle Leistungslevel maximiert",
    "Tous les niveaux d’effort au maximum",
    "Tutti i livelli impegno al massimo",
    "すべてのがんばレベルが最大",
    "모든 노력레벨 최대",
    "所有奋斗等级达到最高",
    "所有奮鬥等級達到最高"
  ],
  "moves": [
    "Movimientos distintos",
    "Distinct moves",
    "Verschiedene Attacken",
    "Capacités distinctes",
    "Mosse diverse",
    "異なる技",
    "서로 다른 기술",
    "不同招式",
    "不同招式"
  ],
  "physical": [
    "Físicos",
    "Physical",
    "Physisch",
    "Physiques",
    "Fisiche",
    "物理",
    "물리",
    "物理",
    "物理"
  ],
  "special": [
    "Especiales",
    "Special",
    "Speziell",
    "Spéciales",
    "Speciali",
    "特殊",
    "특수",
    "特殊",
    "特殊"
  ],
  "status": [
    "De estado",
    "Status",
    "Status",
    "De statut",
    "Di stato",
    "変化",
    "변화",
    "变化",
    "變化"
  ]
} as const;
const INDEX: Record<UiLanguage, number> = { "ES-LA": 0, "ES-ES": 0, ENG: 1, DEU: 2, FRA: 3, ITA: 4, JPN: 5, KOR: 6, CHS: 7, CHT: 8 };
export function challengeCopy(language: UiLanguage, key: keyof typeof ROWS): string {
  return ROWS[key][INDEX[language]];
}

