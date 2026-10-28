import type { UiLanguage } from "./translations";

const keys = ["go_released", "go_unreleased", "go_shiny_unreleased", "go_unknown", "go_method_unreleased", "go_method_unknown", "go_methods_note", "go_checked_on", "go_why_planning", "go_transfer_blocked", "go_transfer_unreleased", "go_transfer_unknown", "go_method_wild", "go_method_raid", "go_method_egg", "go_method_research", "go_method_go_pass", "go_method_battle_league", "go_method_snapshot", "go_method_routes", "go_method_max_battle", "go_method_evolution", "go_method_form_change", "go_method_fusion"] as const;
const es = [
  "Lanzado en Pokémon GO", "Aún no lanzado en GO", "Brillante aún no lanzado en GO", "Sin confirmar en GO",
  "Sin método disponible: esta forma o variante aún no se ha lanzado en Pokémon GO.", "Método de obtención pendiente de confirmación.",
  "Estos son métodos registrados para la forma. Las incursiones, misiones y apariciones pueden depender de temporadas, regiones o eventos; no indican una rotación activa hoy.",
  "Datos de GO consultados al", "Esta entrada se conserva para planificar la colección. Su presencia no significa que la forma o su brillante ya se hayan lanzado en GO.",
  "Esta forma no puede enviarse de GO a Pokémon HOME.", "No disponible: la forma o variante aún no se ha lanzado en GO.", "Transferencia a HOME sin confirmar.",
  "Encuentros salvajes", "Incursiones", "Eclosión de huevos", "Misiones de investigación", "Pase de GO", "Liga Combates GO", "Instantáneas GO", "Rutas", "Combates Max", "Evolución", "Cambio de forma", "Fusión",
];
const translations: Record<UiLanguage, string[]> = {
  "ES-LA": es,
  "ES-ES": es.map(value => value.replace("Brillante aún", "Variocolor aún")),
  ENG: [
    "Released in Pokémon GO", "Not yet released in GO", "Shiny not yet released in GO", "Unconfirmed in GO",
    "No available method: this form or variant has not yet been released in Pokémon GO.", "Acquisition method awaiting confirmation.",
    "These are documented methods for this form. Raids, research and encounters may depend on seasons, regions or events; they do not indicate today's active rotation.",
    "GO data checked as of", "This entry is kept for collection planning. Its presence does not mean this form or its Shiny has been released in GO.",
    "This form cannot be sent from GO to Pokémon HOME.", "Unavailable: this form or variant has not yet been released in GO.", "HOME transfer unconfirmed.",
    "Wild encounters", "Raid Battles", "Egg hatching", "Research tasks", "GO Pass", "GO Battle League", "GO Snapshot", "Routes", "Max Battles", "Evolution", "Form change", "Fusion",
  ],
  DEU: [
    "In Pokémon GO veröffentlicht", "Noch nicht in GO veröffentlicht", "Schillernd noch nicht in GO veröffentlicht", "In GO unbestätigt",
    "Keine Methode verfügbar: Diese Form oder Variante wurde noch nicht in Pokémon GO veröffentlicht.", "Erhaltmethode noch unbestätigt.",
    "Dies sind dokumentierte Methoden für diese Form. Raids, Forschungen und Begegnungen können von Jahreszeiten, Regionen oder Events abhängen und zeigen nicht die heutige Rotation an.",
    "GO-Daten geprüft am", "Dieser Eintrag dient der Sammlungsplanung. Er bedeutet nicht, dass diese Form oder ihre schillernde Variante bereits in GO veröffentlicht wurde.",
    "Diese Form kann nicht aus GO an Pokémon HOME gesendet werden.", "Nicht verfügbar: Diese Form oder Variante wurde noch nicht in GO veröffentlicht.", "HOME-Übertragung unbestätigt.",
    "Wilde Begegnungen", "Raid-Kämpfe", "Eier ausbrüten", "Forschungsaufgaben", "GO-Pass", "GO-Kampfliga", "GO-Schnappschuss", "Routen", "Dyna-Kämpfe", "Entwicklung", "Formwechsel", "Fusion",
  ],
  FRA: [
    "Disponible dans Pokémon GO", "Pas encore sorti dans GO", "Chromatique pas encore sorti dans GO", "Non confirmé dans GO",
    "Aucune méthode disponible : cette forme ou variante n'est pas encore sortie dans Pokémon GO.", "Méthode d'obtention à confirmer.",
    "Ces méthodes sont documentées pour cette forme. Les raids, études et rencontres peuvent dépendre des saisons, régions ou événements et n'indiquent pas la rotation active du jour.",
    "Données GO vérifiées le", "Cette entrée sert à planifier la collection. Sa présence ne signifie pas que cette forme ou sa variante chromatique est déjà sortie dans GO.",
    "Cette forme ne peut pas être envoyée de GO vers Pokémon HOME.", "Indisponible : cette forme ou variante n'est pas encore sortie dans GO.", "Transfert HOME non confirmé.",
    "Rencontres sauvages", "Combats de Raid", "Éclosion d'Œufs", "Tâches d'Étude", "Passe GO", "Ligue de Combat GO", "Cliché GO", "Routes", "Combats Max", "Évolution", "Changement de forme", "Fusion",
  ],
  ITA: [
    "Pubblicato in Pokémon GO", "Non ancora pubblicato in GO", "Cromatico non ancora pubblicato in GO", "Non confermato in GO",
    "Nessun metodo disponibile: questa forma o variante non è ancora stata pubblicata in Pokémon GO.", "Metodo di ottenimento da confermare.",
    "Questi sono metodi documentati per la forma. Raid, ricerche e incontri possono dipendere da stagioni, regioni o eventi e non indicano la rotazione attiva di oggi.",
    "Dati GO verificati al", "Questa voce serve a pianificare la collezione. La sua presenza non significa che questa forma o la variante cromatica sia già stata pubblicata in GO.",
    "Questa forma non può essere inviata da GO a Pokémon HOME.", "Non disponibile: questa forma o variante non è ancora stata pubblicata in GO.", "Trasferimento HOME non confermato.",
    "Incontri selvatici", "Raid", "Schiusa delle Uova", "Missioni di ricerca", "Pass GO", "Lega Lotte GO", "Foto GO", "Percorsi", "Lotte Dynamax", "Evoluzione", "Cambio di forma", "Fusione",
  ],
  JPN: [
    "Pokémon GOで実装済み", "GOでは未実装", "GOでは色違い未実装", "GOでの情報未確認",
    "このすがたまたは色違いはPokémon GOで未実装のため、入手方法はありません。", "入手方法は確認待ちです。",
    "このすがたについて記録された入手方法です。レイド、リサーチ、出現はシーズン、地域、イベントによって異なり、本日の開催を示すものではありません。",
    "GOデータ確認日", "コレクション計画用の項目です。このすがたや色違いがGOで実装済みであることを意味しません。",
    "このすがたはGOからPokémon HOMEへ転送できません。", "このすがたまたは色違いはGOでは未実装です。", "HOMEへの転送可否は未確認です。",
    "野生で出現", "レイドバトル", "タマゴふか", "リサーチタスク", "GOパス", "GOバトルリーグ", "GOスナップショット", "ルート", "マックスバトル", "進化", "フォルムチェンジ", "合体",
  ],
  KOR: [
    "Pokémon GO 출시됨", "GO 미출시", "GO 색이 다른 모습 미출시", "GO 정보 미확인",
    "이 폼 또는 색이 다른 모습은 Pokémon GO에 출시되지 않아 입수 방법이 없습니다.", "입수 방법 확인 대기 중입니다.",
    "이 폼의 기록된 입수 방법입니다. 레이드, 리서치, 출현은 시즌, 지역, 이벤트에 따라 달라지며 오늘의 진행 상황을 뜻하지 않습니다.",
    "GO 데이터 확인일", "컬렉션 계획용 항목입니다. 이 폼이나 색이 다른 모습이 GO에 출시되었다는 뜻은 아닙니다.",
    "이 폼은 GO에서 Pokémon HOME으로 보낼 수 없습니다.", "이 폼 또는 색이 다른 모습은 GO 미출시입니다.", "HOME 전송 가능 여부 미확인.",
    "야생 출현", "레이드배틀", "알 부화", "리서치 과제", "GO패스", "GO배틀리그", "GO스냅샷", "루트", "맥스배틀", "진화", "폼체인지", "합체",
  ],
  CHS: [
    "已在Pokémon GO推出", "尚未在GO推出", "异色尚未在GO推出", "GO信息未确认",
    "此形态或异色尚未在Pokémon GO推出，目前没有获取方式。", "获取方式有待确认。",
    "这些是该形态已记录的获取方式。团体战、调查和出没可能受季节、地区或活动影响，并不表示今天正在开放。",
    "GO数据核查日期", "此条目供收藏规划使用。显示此条目不代表该形态或其异色已在GO推出。",
    "此形态无法从GO传送至Pokémon HOME。", "无法获取：该形态或异色尚未在GO推出。", "能否传送至HOME尚未确认。",
    "野外遭遇", "团体战", "孵蛋", "调查任务", "GO通行证", "GO对战联盟", "GO Snapshot", "路线", "极巨对战", "进化", "形态变化", "合体",
  ],
  CHT: [
    "已在Pokémon GO推出", "尚未在GO推出", "異色尚未在GO推出", "GO資訊未確認",
    "此形態或異色尚未在Pokémon GO推出，目前沒有獲得方式。", "獲得方式有待確認。",
    "這些是該形態已記錄的獲得方式。團體戰、調查和出沒可能受季節、地區或活動影響，並不表示今天正在開放。",
    "GO資料核查日期", "此項目供收藏規劃使用。顯示此項目不代表該形態或其異色已在GO推出。",
    "此形態無法從GO傳送至Pokémon HOME。", "無法獲得：該形態或異色尚未在GO推出。", "能否傳送至HOME尚未確認。",
    "野外遭遇", "團體戰", "孵蛋", "調查課題", "GO通行證", "GO對戰聯盟", "GO Snapshot", "路線", "極巨對戰", "進化", "形態變化", "合體",
  ],
};

export const GO_COPY_KEYS = keys;
export function goCopy(language: UiLanguage, key: string) {
  const index = keys.indexOf(key as typeof keys[number]);
  return index < 0 ? undefined : translations[language][index];
}
