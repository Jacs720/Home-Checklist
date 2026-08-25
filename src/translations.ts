export type UiLanguage = "CHS" | "CHT" | "DEU" | "ENG" | "ES-ES" | "ES-LA" | "FRA" | "ITA" | "JPN" | "KOR";

export const LANGUAGE_OPTIONS: { code: UiLanguage; label: string; locale: string }[] = [
  { code: "ES-LA", label: "Español (Latinoamérica)", locale: "es-MX" },
  { code: "ES-ES", label: "Español (España)", locale: "es-ES" },
  { code: "ENG", label: "English", locale: "en-US" },
  { code: "DEU", label: "Deutsch", locale: "de-DE" },
  { code: "FRA", label: "Français", locale: "fr-FR" },
  { code: "ITA", label: "Italiano", locale: "it-IT" },
  { code: "JPN", label: "日本語", locale: "ja-JP" },
  { code: "KOR", label: "한국어", locale: "ko-KR" },
  { code: "CHS", label: "简体中文", locale: "zh-CN" },
  { code: "CHT", label: "繁體中文", locale: "zh-TW" },
];

type Copy = Record<string, string>;

const ES: Copy = {
  original_trainer: "EO",
  loading: "Ordenando las cajas…", load_error: "No pude abrir el catálogo", reload: "Recarga la página para intentarlo de nuevo.",
  open_filters: "Abrir filtros", close_filters: "Cerrar filtros", of: "de", your_collection: "TU COLECCIÓN", design: "Diseña tu checklist",
  preset_shiny: "Solo shinys", preset_shiny_desc: "Capturables y especiales", preset_special: "Especiales", preset_special_desc: "N, Dream, Shadow, intercambios y Cherish", preset_normal: "Color normal", preset_normal_desc: "Ejemplares de color normal", preset_sv: "Todo SV", preset_sv_desc: "Normal + shiny",
  normal_living_dex: "Living Dex normal", normal_living_dex_desc: "Una entrada por especie · conserva los filtros",
  variants: "VARIANTES", shiny_possible: "Shiny posible", catalog_review: "Catálogo en revisión", non_shiny: "No shiny", normal_specimen: "Ejemplar normal",
  special_non_shiny: "No shiny en especiales", special_non_shiny_desc: "Añádelos aunque el perfil sea solo shiny", gender_differences: "DIMORFISMOS", all_gender_differences: "Todos los dimorfismos", all_gender_differences_desc: "Las 102 especies con diferencias visibles", notable_gender_differences_desc: "Solo los ocho destacados de Gen 5 en adelante", male: "Macho", female: "Hembra",
  trainer_origin: "ORIGEN DEL ENTRENADOR", own_ot: "Capturable · tu EO", own_ot_desc: "Encuentros y regalos con tu nombre", event_ot: "Distribuido · EO ajeno", event_ot_desc: "Eventos y entrenadores del juego",
  origin_marks: "MARCAS DE ORIGEN", gba_ports: "Ports de GBA en Switch", gba_ports_desc: "FR/LG y escenario rumoreado R/S/E", special_collections: "COLECCIONES ESPECIALES", special_ot_independent: "Filtro propio", special_ot_independent_desc: "Las colecciones seleccionadas se incluyen aunque el filtro global de EO esté apagado.", cherish_beta: "Lista aproximada, todavía sin verificación evento por evento.",
  capacity: "CAPACIDAD DE REFERENCIA", current: "Oficial actual", future: "Escenario futuro", active_catalogs: "CATÁLOGOS ACTIVOS", next_expansion: "Próxima ampliación: más regalos con EO de personajes y verificación individual de eventos.",
  export: "Exportar respaldo", import: "Importar", invalid_backup: "Ese archivo no es un respaldo válido de Origin Marks.", checklist_backup: "RESPALDO DEL CHECKLIST", theme_backup: "CONFIGURACIÓN DE TEMAS", export_themes: "Exportar temas", import_themes: "Importar temas", invalid_theme_backup: "Ese archivo no contiene una configuración de temas válida.",
  theme: "Tema", box_appearance: "APARIENCIA DE CAJAS", theme_title: "Elige un tema", theme_intro: "Usa un fondo clásico o crea uno propio. Sólo cambiará la zona de las cajas.", close_theme: "Cerrar temas", apply_to: "APLICAR A", all_boxes: "Todas las cajas", all_boxes_desc: "Reemplaza también las excepciones", origin_mark_boxes: "Esta marca de origen", this_box: "Sólo esta caja", open_a_box: "Abre una caja para usar esta opción", preview: "VISTA PREVIA", theme_games: "Juegos disponibles", concept_art: "Concept art", concept_art_games: "Concept art por juego", original_theme: "Original", custom: "Personalizado", wallpaper: "Fondo", upload_background: "Subir un fondo", change_background: "Cambiar fondo", theme_image_types: "PNG, JPG o WebP · 12 MB máx.", app_color: "Color de la aplicación", primary_highlight: "Resalte primario", secondary_highlight: "Resalte secundario", custom_color_note: "Estos colores se aplican a la superficie y los resaltes de la caja; los shinys y filtros conservan sus colores.", reset_original: "Restablecer original", apply_theme: "Aplicar tema", upload_to_continue: "Sube un fondo para continuar", theme_image_error: "No pude preparar esa imagen. Usa PNG, JPG o WebP de hasta 12 MB.", theme_storage_error: "No hay espacio suficiente en este navegador para guardar más temas personalizados.",
  page: "Página", search: "Buscar Pokémon…", missing_only: "Solo faltantes", page_view: "VISTA DE PÁGINA", page_desc: "Selecciona una caja para ver sus 30 posiciones en el orden exacto.", boxes_plan: "cajas del plan", available: "disponibles",
  no_capacity: "Sin capacidad", free: "Libre", outside_home: "Fuera del plan HOME", box_available: "Caja disponible", obtained: "obtenidos", overflow: "Overflow", previous_page: "← Página anterior", next_page: "Página siguiente →", mark_page: "Marcar página", unmark_page: "Desmarcar página",
  box_instruction: "Haz clic en cada Pokémon para alternar entre pendiente y obtenido.", page_view_button: "Vista de página", empty: "Vacío", shiny: "✦ Shiny", normal: "Normal", your_ot: "Tu EO", foreign_ot: "EO ajeno", pending: "pendientes", mark_box: "Marcar caja completa", unmark_box: "Desmarcar caja", official_art_pending: "Arte oficial pendiente", official_art: "Arte oficial de",
  data: "DATOS", data_note: "Los encuentros de X/Y con tu EO están separados de sus distribuciones shiny. GO reserva los números 1–1025 incluso si hoy no se pueden transferir.", n_source: "Pokémon de N ↗", dream_source: "Dream World ↗", shadow_source: "Shadow ↗", trade_source: "Intercambios ↗", gender_source: "Dimorfismos ↗", art_source: "Arte: PokéAPI ↗",
  go_note: "Planificación completa 1–1025", trade_note: "Incluye Yancy, Curtis y Partner Ribbon", collection_beta: "beta", language: "Idioma",
};

const EN: Copy = {
  original_trainer: "OT",
  loading: "Organizing boxes…", load_error: "The catalog could not be opened", reload: "Reload the page to try again.", open_filters: "Open filters", close_filters: "Close filters", of: "of", your_collection: "YOUR COLLECTION", design: "Design your checklist",
  preset_shiny: "Shiny only", preset_shiny_desc: "Catchable and special collections", preset_special: "Special collections", preset_special_desc: "N, Dream, Shadow, trades and Cherish", preset_normal: "Normal color", preset_normal_desc: "Normal-color specimens", preset_sv: "All SV", preset_sv_desc: "Normal + shiny",
  normal_living_dex: "Normal Living Dex", normal_living_dex_desc: "One entry per species · keeps your filters",
  variants: "VARIANTS", shiny_possible: "Shiny available", catalog_review: "Catalog under review", non_shiny: "Non-shiny", normal_specimen: "Normal specimen", special_non_shiny: "Non-shiny specials", special_non_shiny_desc: "Include them even in a shiny-only profile", gender_differences: "GENDER DIFFERENCES", all_gender_differences: "All gender differences", all_gender_differences_desc: "All 102 species with visible differences", notable_gender_differences_desc: "Only the eight notable species from Gen V onward", male: "Male", female: "Female",
  trainer_origin: "TRAINER ORIGIN", own_ot: "Catchable · your OT", own_ot_desc: "Encounters and gifts bearing your name", event_ot: "Distributed · other OT", event_ot_desc: "Events and in-game trainers", origin_marks: "ORIGIN MARKS", gba_ports: "GBA ports on Switch", gba_ports_desc: "FR/LG and rumored R/S/E scenario", special_collections: "SPECIAL COLLECTIONS", special_ot_independent: "Independent filter", special_ot_independent_desc: "Selected collections stay included even when the global OT filter is off.", cherish_beta: "Approximate list; event-by-event verification is still pending.",
  capacity: "REFERENCE CAPACITY", current: "Current official", future: "Future scenario", active_catalogs: "ACTIVE CATALOGS", next_expansion: "Next: more character-OT gifts and individual event verification.", export: "Export backup", import: "Import", invalid_backup: "That file is not a valid Origin Marks backup.", checklist_backup: "CHECKLIST BACKUP", theme_backup: "THEME SETTINGS", export_themes: "Export themes", import_themes: "Import themes", invalid_theme_backup: "That file does not contain valid theme settings.",
  theme: "Theme", box_appearance: "BOX APPEARANCE", theme_title: "Choose a theme", theme_intro: "Use a classic wallpaper or create your own. Only the box area will change.", close_theme: "Close themes", apply_to: "APPLY TO", all_boxes: "All boxes", all_boxes_desc: "Also replaces exceptions", origin_mark_boxes: "This origin mark", this_box: "This box only", open_a_box: "Open a box to use this option", preview: "PREVIEW", theme_games: "Available games", concept_art: "Concept art", concept_art_games: "Concept art by game", original_theme: "Original", custom: "Custom", wallpaper: "Wallpaper", upload_background: "Upload a wallpaper", change_background: "Change wallpaper", theme_image_types: "PNG, JPG or WebP · 12 MB max.", app_color: "App color", primary_highlight: "Primary highlight", secondary_highlight: "Secondary highlight", custom_color_note: "These colors apply to the box surface and highlights; shiny and filter colors stay unchanged.", reset_original: "Restore original", apply_theme: "Apply theme", upload_to_continue: "Upload a wallpaper to continue", theme_image_error: "That image could not be prepared. Use a PNG, JPG or WebP up to 12 MB.", theme_storage_error: "This browser does not have enough space to save more custom themes.",
  page: "Page", search: "Search Pokémon…", missing_only: "Missing only", page_view: "PAGE VIEW", page_desc: "Select a box to see its 30 positions in exact order.", boxes_plan: "boxes in plan", available: "available", no_capacity: "No capacity", free: "Free", outside_home: "Outside HOME plan", box_available: "Available box", obtained: "obtained", overflow: "Overflow", previous_page: "← Previous page", next_page: "Next page →", mark_page: "Mark page", unmark_page: "Unmark page",
  box_instruction: "Click each Pokémon to switch between missing and obtained.", page_view_button: "Page view", empty: "Empty", shiny: "✦ Shiny", normal: "Normal", your_ot: "Your OT", foreign_ot: "Other OT", pending: "missing", mark_box: "Mark full box", unmark_box: "Unmark box", official_art_pending: "Official art pending", official_art: "Official artwork of",
  data: "DATA", data_note: "X/Y encounters with your OT are separate from their shiny distributions. GO reserves numbers 1–1025 even when transfer is currently unavailable.", n_source: "N's Pokémon ↗", dream_source: "Dream World ↗", shadow_source: "Shadow ↗", trade_source: "In-game trades ↗", gender_source: "Gender differences ↗", art_source: "Art: PokéAPI ↗", go_note: "Complete 1–1025 planning", trade_note: "Includes Yancy, Curtis and Partner Ribbon", collection_beta: "beta", language: "Language",
};

const DE: Copy = {
  original_trainer: "OT",
  loading: "Boxen werden sortiert…", load_error: "Der Katalog konnte nicht geöffnet werden", reload: "Lade die Seite neu und versuche es erneut.", open_filters: "Filter öffnen", close_filters: "Filter schließen", of: "von", your_collection: "DEINE SAMMLUNG", design: "Gestalte deine Checkliste",
  preset_shiny: "Nur Shinys", preset_shiny_desc: "Fangbar und Sondersammlungen", preset_special: "Sondersammlungen", preset_special_desc: "N, Traumwelt, Crypto, Tausch und Jubelball", preset_normal: "Normale Farbe", preset_normal_desc: "Normalfarbene Exemplare", preset_sv: "Alles aus K/P", preset_sv_desc: "Normal + Shiny",
  normal_living_dex: "Normaler Living Dex", normal_living_dex_desc: "Ein Eintrag pro Spezies · Filter bleiben erhalten",
  variants: "VARIANTEN", shiny_possible: "Shiny möglich", catalog_review: "Katalog in Prüfung", non_shiny: "Nicht-Shiny", normal_specimen: "Normales Exemplar", special_non_shiny: "Nicht-Shinys in Sonderlisten", special_non_shiny_desc: "Auch bei einem reinen Shiny-Profil einplanen", gender_differences: "GESCHLECHTSUNTERSCHIEDE", all_gender_differences: "Alle Geschlechtsunterschiede", all_gender_differences_desc: "Alle 102 Arten mit sichtbaren Unterschieden", notable_gender_differences_desc: "Nur die acht markanten Arten ab Generation V", male: "Männlich", female: "Weiblich",
  trainer_origin: "TRAINER-HERKUNFT", own_ot: "Fangbar · dein OT", own_ot_desc: "Begegnungen und Geschenke mit deinem Namen", event_ot: "Verteilt · fremder OT", event_ot_desc: "Events und Trainer im Spiel", origin_marks: "HERKUNFTSZEICHEN", gba_ports: "GBA-Ports auf Switch", gba_ports_desc: "FR/BG und mögliches R/S/SM", special_collections: "SONDERSAMMLUNGEN", special_ot_independent: "Eigener Filter", special_ot_independent_desc: "Ausgewählte Sammlungen bleiben unabhängig vom globalen OT-Filter enthalten.", cherish_beta: "Ungefähre Liste; die Einzelprüfung der Events steht noch aus.",
  capacity: "REFERENZKAPAZITÄT", current: "Aktuell offiziell", future: "Zukunftsszenario", active_catalogs: "AKTIVE KATALOGE", next_expansion: "Als Nächstes: weitere Geschenke mit Charakter-OT und Einzelprüfung der Events.", export: "Sicherung exportieren", import: "Importieren", invalid_backup: "Diese Datei ist keine gültige Origin-Marks-Sicherung.",
  page: "Seite", search: "Pokémon suchen…", missing_only: "Nur fehlende", page_view: "SEITENANSICHT", page_desc: "Wähle eine Box, um ihre 30 Plätze in genauer Reihenfolge zu sehen.", boxes_plan: "Boxen im Plan", available: "verfügbar", no_capacity: "Keine Kapazität", free: "Frei", outside_home: "Außerhalb des HOME-Plans", box_available: "Verfügbare Box", obtained: "erhalten", overflow: "Überlauf", previous_page: "← Vorherige Seite", next_page: "Nächste Seite →", mark_page: "Seite markieren", unmark_page: "Markierung entfernen",
  box_instruction: "Klicke ein Pokémon an, um zwischen fehlend und erhalten zu wechseln.", page_view_button: "Seitenansicht", empty: "Leer", shiny: "✦ Shiny", normal: "Normal", your_ot: "Dein OT", foreign_ot: "Fremder OT", pending: "fehlend", mark_box: "Ganze Box markieren", unmark_box: "Box zurücksetzen", official_art_pending: "Offizielles Artwork fehlt", official_art: "Offizielles Artwork von",
  data: "DATEN", data_note: "X/Y-Begegnungen mit deinem OT sind von ihren Shiny-Verteilungen getrennt. GO reserviert die Nummern 1–1025, auch wenn ein Transfer derzeit nicht möglich ist.", n_source: "Ns Pokémon ↗", dream_source: "Traumwelt ↗", shadow_source: "Crypto-Pokémon ↗", trade_source: "Spielinterner Tausch ↗", gender_source: "Geschlechtsunterschiede ↗", art_source: "Artwork: PokéAPI ↗", go_note: "Komplette Planung 1–1025", trade_note: "Mit Yancy, Curtis und Partnerband", collection_beta: "Beta", language: "Sprache",
};

const FR: Copy = {
  original_trainer: "DO",
  loading: "Organisation des Boîtes…", load_error: "Impossible d’ouvrir le catalogue", reload: "Rechargez la page pour réessayer.", open_filters: "Ouvrir les filtres", close_filters: "Fermer les filtres", of: "sur", your_collection: "VOTRE COLLECTION", design: "Créez votre checklist",
  preset_shiny: "Chromatiques", preset_shiny_desc: "Capturables et collections spéciales", preset_special: "Collections spéciales", preset_special_desc: "N, Rêve, Obscurs, échanges et Mémoire", preset_normal: "Couleur normale", preset_normal_desc: "Spécimens de couleur normale", preset_sv: "Tout EV", preset_sv_desc: "Normal + chromatique",
  normal_living_dex: "Living Dex normal", normal_living_dex_desc: "Une entrée par espèce · conserve vos filtres",
  variants: "VARIANTES", shiny_possible: "Chromatique possible", catalog_review: "Catalogue en révision", non_shiny: "Non chromatique", normal_specimen: "Spécimen normal", special_non_shiny: "Spéciaux non chromatiques", special_non_shiny_desc: "Les inclure même dans un profil chromatique", gender_differences: "DIMORPHISMES SEXUELS", all_gender_differences: "Tous les dimorphismes", all_gender_differences_desc: "Les 102 espèces aux différences visibles", notable_gender_differences_desc: "Seulement les huit espèces marquantes depuis la génération V", male: "Mâle", female: "Femelle",
  trainer_origin: "ORIGINE DU DRESSEUR", own_ot: "Capturable · votre DO", own_ot_desc: "Rencontres et cadeaux à votre nom", event_ot: "Distribué · autre DO", event_ot_desc: "Événements et Dresseurs du jeu", origin_marks: "MARQUES D’ORIGINE", gba_ports: "Ports GBA sur Switch", gba_ports_desc: "RF/VF et scénario R/S/E supposé", special_collections: "COLLECTIONS SPÉCIALES", special_ot_independent: "Filtre indépendant", special_ot_independent_desc: "Les collections sélectionnées restent incluses sans dépendre du filtre global de DO.", cherish_beta: "Liste approximative, à vérifier événement par événement.",
  capacity: "CAPACITÉ DE RÉFÉRENCE", current: "Officielle actuelle", future: "Scénario futur", active_catalogs: "CATALOGUES ACTIFS", next_expansion: "Prochaine étape : autres cadeaux avec DO de personnage et vérification des événements.", export: "Exporter la sauvegarde", import: "Importer", invalid_backup: "Ce fichier n’est pas une sauvegarde Origin Marks valide.",
  page: "Page", search: "Rechercher un Pokémon…", missing_only: "Manquants", page_view: "VUE DE PAGE", page_desc: "Sélectionnez une Boîte pour voir ses 30 places dans l’ordre exact.", boxes_plan: "Boîtes du plan", available: "disponibles", no_capacity: "Capacité dépassée", free: "Libre", outside_home: "Hors du plan HOME", box_available: "Boîte disponible", obtained: "obtenus", overflow: "Dépassement", previous_page: "← Page précédente", next_page: "Page suivante →", mark_page: "Marquer la page", unmark_page: "Démarquer la page",
  box_instruction: "Cliquez sur chaque Pokémon pour alterner entre manquant et obtenu.", page_view_button: "Vue de page", empty: "Vide", shiny: "✦ Chromatique", normal: "Normal", your_ot: "Votre DO", foreign_ot: "Autre DO", pending: "manquants", mark_box: "Marquer toute la Boîte", unmark_box: "Démarquer la Boîte", official_art_pending: "Illustration officielle indisponible", official_art: "Illustration officielle de",
  data: "DONNÉES", data_note: "Les rencontres de X/Y avec votre DO sont séparées de leurs distributions chromatiques. GO réserve les numéros 1–1025 même si le transfert est indisponible.", n_source: "Pokémon de N ↗", dream_source: "Monde des Rêves ↗", shadow_source: "Pokémon Obscurs ↗", trade_source: "Échanges internes ↗", gender_source: "Dimorphismes ↗", art_source: "Illustrations : PokéAPI ↗", go_note: "Planification complète 1–1025", trade_note: "Inclut Yancy, Curtis et Ruban Partenaire", collection_beta: "bêta", language: "Langue",
};

const IT: Copy = {
  original_trainer: "AO",
  loading: "Ordinamento dei Box…", load_error: "Impossibile aprire il catalogo", reload: "Ricarica la pagina per riprovare.", open_filters: "Apri filtri", close_filters: "Chiudi filtri", of: "di", your_collection: "LA TUA COLLEZIONE", design: "Crea la tua checklist",
  preset_shiny: "Solo cromatici", preset_shiny_desc: "Catturabili e collezioni speciali", preset_special: "Collezioni speciali", preset_special_desc: "N, Dream World, Ombra, scambi e Pregio", preset_normal: "Colore normale", preset_normal_desc: "Esemplari di colore normale", preset_sv: "Tutto SV", preset_sv_desc: "Normale + cromatico",
  normal_living_dex: "Living Dex normale", normal_living_dex_desc: "Una voce per specie · mantiene i filtri",
  variants: "VARIANTI", shiny_possible: "Cromatico possibile", catalog_review: "Catalogo in revisione", non_shiny: "Non cromatico", normal_specimen: "Esemplare normale", special_non_shiny: "Speciali non cromatici", special_non_shiny_desc: "Includili anche in un profilo solo cromatici", gender_differences: "DIMORFISMI SESSUALI", all_gender_differences: "Tutti i dimorfismi", all_gender_differences_desc: "Tutte le 102 specie con differenze visibili", notable_gender_differences_desc: "Solo le otto specie più evidenti dalla generazione V", male: "Maschio", female: "Femmina",
  trainer_origin: "ORIGINE ALLENATORE", own_ot: "Catturabile · tuo AO", own_ot_desc: "Incontri e doni con il tuo nome", event_ot: "Distribuito · altro AO", event_ot_desc: "Eventi e Allenatori del gioco", origin_marks: "MARCHI D’ORIGINE", gba_ports: "Port GBA su Switch", gba_ports_desc: "RF/VF e possibile R/Z/S", special_collections: "COLLEZIONI SPECIALI", special_ot_independent: "Filtro indipendente", special_ot_independent_desc: "Le collezioni selezionate restano incluse indipendentemente dal filtro AO globale.", cherish_beta: "Lista approssimativa, ancora da verificare evento per evento.",
  capacity: "CAPIENZA DI RIFERIMENTO", current: "Ufficiale attuale", future: "Scenario futuro", active_catalogs: "CATALOGHI ATTIVI", next_expansion: "Prossimamente: altri doni con AO dei personaggi e verifica degli eventi.", export: "Esporta backup", import: "Importa", invalid_backup: "Questo file non è un backup Origin Marks valido.",
  page: "Pagina", search: "Cerca Pokémon…", missing_only: "Solo mancanti", page_view: "VISTA PAGINA", page_desc: "Seleziona un Box per vedere le 30 posizioni nell’ordine esatto.", boxes_plan: "Box nel piano", available: "disponibili", no_capacity: "Capienza esaurita", free: "Libero", outside_home: "Fuori dal piano HOME", box_available: "Box disponibile", obtained: "ottenuti", overflow: "Eccedenza", previous_page: "← Pagina precedente", next_page: "Pagina successiva →", mark_page: "Segna pagina", unmark_page: "Deseleziona pagina",
  box_instruction: "Fai clic su ogni Pokémon per alternare tra mancante e ottenuto.", page_view_button: "Vista pagina", empty: "Vuoto", shiny: "✦ Cromatico", normal: "Normale", your_ot: "Tuo AO", foreign_ot: "Altro AO", pending: "mancanti", mark_box: "Segna tutto il Box", unmark_box: "Deseleziona Box", official_art_pending: "Artwork ufficiale non disponibile", official_art: "Artwork ufficiale di",
  data: "DATI", data_note: "Gli incontri di X/Y con il tuo AO sono separati dalle distribuzioni cromatiche. GO riserva i numeri 1–1025 anche se il trasferimento non è disponibile.", n_source: "Pokémon di N ↗", dream_source: "Dream World ↗", shadow_source: "Pokémon Ombra ↗", trade_source: "Scambi nel gioco ↗", gender_source: "Dimorfismi ↗", art_source: "Artwork: PokéAPI ↗", go_note: "Pianificazione completa 1–1025", trade_note: "Include Yancy, Curtis e Fiocco Partner", collection_beta: "beta", language: "Lingua",
};

const JA: Copy = {
  original_trainer: "おや",
  loading: "ボックスを整理しています…", load_error: "カタログを開けませんでした", reload: "ページを再読み込みしてください。", open_filters: "フィルターを開く", close_filters: "フィルターを閉じる", of: "/", your_collection: "コレクション", design: "チェックリストを作成",
  preset_shiny: "色違いのみ", preset_shiny_desc: "捕獲可能＋特別コレクション", preset_special: "特別コレクション", preset_special_desc: "N・夢・ダーク・ゲーム内交換・プレシャス", preset_normal: "通常色", preset_normal_desc: "通常色の個体", preset_sv: "SVすべて", preset_sv_desc: "通常＋色違い",
  normal_living_dex: "通常のLiving Dex", normal_living_dex_desc: "1種につき1匹・フィルターを維持",
  variants: "バリエーション", shiny_possible: "色違い可能", catalog_review: "確認中のカタログ", non_shiny: "通常色", normal_specimen: "通常個体", special_non_shiny: "特別枠の通常色", special_non_shiny_desc: "色違いのみの設定でも追加する", gender_differences: "性別による違い", all_gender_differences: "すべての性別差", all_gender_differences_desc: "見た目が異なる102種すべて", notable_gender_differences_desc: "第5世代以降の代表的な8種のみ", male: "オス", female: "メス",
  trainer_origin: "おやの種類", own_ot: "捕獲・自分のおや", own_ot_desc: "自分の名前になる出会いと贈り物", event_ot: "配布・別のおや", event_ot_desc: "イベントとゲーム内トレーナー", origin_marks: "出身マーク", gba_ports: "SwitchのGBA移植", gba_ports_desc: "FR/LGと噂のR/S/E", special_collections: "特別コレクション", special_ot_independent: "独立フィルター", special_ot_independent_desc: "選択したコレクションは、おやフィルターに関係なく追加されます。", cherish_beta: "概算リストです。イベントごとの確認は未完了です。",
  capacity: "参考容量", current: "現在の公式容量", future: "将来の想定", active_catalogs: "有効なカタログ", next_expansion: "次回：キャラクターのおやの贈り物追加とイベントの個別確認。", export: "バックアップを書き出す", import: "読み込む", invalid_backup: "Origin Marksの有効なバックアップではありません。",
  page: "ページ", search: "ポケモンを検索…", missing_only: "未入手のみ", page_view: "ページ表示", page_desc: "ボックスを選ぶと30枠を正しい順番で表示します。", boxes_plan: "計画中のボックス", available: "利用可能", no_capacity: "容量不足", free: "空き", outside_home: "HOME計画外", box_available: "利用可能なボックス", obtained: "入手済み", overflow: "超過", previous_page: "← 前のページ", next_page: "次のページ →", mark_page: "ページを入手済みにする", unmark_page: "ページの印を外す",
  box_instruction: "各ポケモンをクリックして未入手／入手済みを切り替えます。", page_view_button: "ページ表示", empty: "空き", shiny: "✦ 色違い", normal: "通常", your_ot: "自分のおや", foreign_ot: "別のおや", pending: "未入手", mark_box: "ボックス全体を入手済みにする", unmark_box: "ボックスの印を外す", official_art_pending: "公式イラスト未対応", official_art: "公式イラスト：",
  data: "データ", data_note: "X/Yで自分がおやになる伝説の捕獲個体と色違い配布を分離しました。GOは現在転送できなくても全国図鑑1～1025を確保します。", n_source: "Nのポケモン ↗", dream_source: "ポケモンドリームワールド ↗", shadow_source: "ダークポケモン ↗", trade_source: "ゲーム内交換 ↗", gender_source: "性別による違い ↗", art_source: "イラスト：PokéAPI ↗", go_note: "全国図鑑1～1025", trade_note: "ルリ・テツとあいぼうリボンを含む", collection_beta: "ベータ", language: "言語",
};

const KO: Copy = {
  original_trainer: "어버이",
  loading: "박스를 정리하는 중…", load_error: "카탈로그를 열 수 없습니다", reload: "페이지를 새로고침해 주세요.", open_filters: "필터 열기", close_filters: "필터 닫기", of: "/", your_collection: "내 컬렉션", design: "체크리스트 만들기",
  preset_shiny: "이로치만", preset_shiny_desc: "포획 가능＋특별 컬렉션", preset_special: "특별 컬렉션", preset_special_desc: "N, 드림월드, 다크, 게임 내 교환, 프레셔스", preset_normal: "일반 색상", preset_normal_desc: "일반 색상의 개체", preset_sv: "SV 전체", preset_sv_desc: "일반＋이로치",
  normal_living_dex: "일반 Living Dex", normal_living_dex_desc: "종마다 1마리 · 필터 유지",
  variants: "종류", shiny_possible: "이로치 가능", catalog_review: "검토 중인 카탈로그", non_shiny: "일반색", normal_specimen: "일반 개체", special_non_shiny: "특별 컬렉션 일반색", special_non_shiny_desc: "이로치 전용 설정에서도 포함", gender_differences: "성별 차이", all_gender_differences: "모든 성별 차이", all_gender_differences_desc: "외형 차이가 있는 102종 전체", notable_gender_differences_desc: "5세대 이후 대표적인 8종만", male: "수컷", female: "암컷",
  trainer_origin: "트레이너 출처", own_ot: "포획 · 내 어버이", own_ot_desc: "내 이름이 붙는 만남과 선물", event_ot: "배포 · 다른 어버이", event_ot_desc: "이벤트와 게임 내 트레이너", origin_marks: "출신 마크", gba_ports: "Switch GBA 이식", gba_ports_desc: "FR/LG 및 예상 R/S/E", special_collections: "특별 컬렉션", special_ot_independent: "독립 필터", special_ot_independent_desc: "선택한 컬렉션은 전체 어버이 필터와 관계없이 포함됩니다.", cherish_beta: "대략적인 목록이며 이벤트별 검증이 필요합니다.",
  capacity: "기준 용량", current: "현재 공식", future: "향후 예상", active_catalogs: "활성 카탈로그", next_expansion: "다음: 캐릭터 어버이 선물 추가 및 이벤트별 검증.", export: "백업 내보내기", import: "가져오기", invalid_backup: "올바른 Origin Marks 백업 파일이 아닙니다.",
  page: "페이지", search: "포켓몬 검색…", missing_only: "미보유만", page_view: "페이지 보기", page_desc: "박스를 선택하면 30칸을 정확한 순서로 표시합니다.", boxes_plan: "계획 박스", available: "사용 가능", no_capacity: "용량 없음", free: "빈 박스", outside_home: "HOME 계획 밖", box_available: "사용 가능한 박스", obtained: "보유", overflow: "초과", previous_page: "← 이전 페이지", next_page: "다음 페이지 →", mark_page: "페이지 모두 표시", unmark_page: "페이지 표시 해제",
  box_instruction: "각 포켓몬을 눌러 미보유와 보유를 전환합니다.", page_view_button: "페이지 보기", empty: "비어 있음", shiny: "✦ 이로치", normal: "일반", your_ot: "내 어버이", foreign_ot: "다른 어버이", pending: "미보유", mark_box: "박스 전체 표시", unmark_box: "박스 표시 해제", official_art_pending: "공식 일러스트 준비 중", official_art: "공식 일러스트:",
  data: "데이터", data_note: "X/Y에서 내 어버이로 잡는 전설과 이로치 배포를 분리했습니다. GO는 현재 전송 불가여도 전국도감 1–1025의 자리를 확보합니다.", n_source: "N의 포켓몬 ↗", dream_source: "포켓몬 드림월드 ↗", shadow_source: "다크 포켓몬 ↗", trade_source: "게임 내 교환 ↗", gender_source: "성별 차이 ↗", art_source: "일러스트: PokéAPI ↗", go_note: "전국도감 1–1025", trade_note: "루리·철권과 파트너리본 포함", collection_beta: "베타", language: "언어",
};

const ZHS: Copy = {
  original_trainer: "初训家",
  loading: "正在整理盒子…", load_error: "无法打开目录", reload: "请刷新页面后重试。", open_filters: "打开筛选", close_filters: "关闭筛选", of: "/", your_collection: "你的收藏", design: "设计收藏清单",
  preset_shiny: "仅异色", preset_shiny_desc: "可捕获与特殊收藏", preset_special: "特殊收藏", preset_special_desc: "N、梦境、黑暗、游戏内交换与贵重球", preset_normal: "普通颜色", preset_normal_desc: "普通颜色的个体", preset_sv: "全部朱紫", preset_sv_desc: "普通＋异色",
  normal_living_dex: "普通 Living Dex", normal_living_dex_desc: "每个种类一只 · 保留筛选",
  variants: "版本", shiny_possible: "可为异色", catalog_review: "目录审核中", non_shiny: "非异色", normal_specimen: "普通个体", special_non_shiny: "特殊收藏中的非异色", special_non_shiny_desc: "即使只收藏异色也加入盒子", gender_differences: "性别差异", all_gender_differences: "所有性别差异", all_gender_differences_desc: "全部102种具有可见差异的宝可梦", notable_gender_differences_desc: "仅第5世代起最显著的8种", male: "雄性", female: "雌性",
  trainer_origin: "训练家来源", own_ot: "可捕获 · 你的初训家", own_ot_desc: "使用你名字的相遇与礼物", event_ot: "配信 · 其他初训家", event_ot_desc: "活动与游戏内训练家", origin_marks: "起源标记", gba_ports: "Switch 的 GBA 移植", gba_ports_desc: "FR/LG 与传闻中的 R/S/E", special_collections: "特殊收藏", special_ot_independent: "独立筛选", special_ot_independent_desc: "已选择的收藏不受全局初训家筛选影响。", cherish_beta: "近似列表，仍需逐个活动验证。",
  capacity: "参考容量", current: "当前官方", future: "未来规划", active_catalogs: "已启用目录", next_expansion: "下一步：更多角色初训家礼物和活动逐项验证。", export: "导出备份", import: "导入", invalid_backup: "该文件不是有效的 Origin Marks 备份。",
  page: "页面", search: "搜索宝可梦…", missing_only: "仅未获得", page_view: "页面视图", page_desc: "选择盒子以按准确顺序查看30个位置。", boxes_plan: "计划盒子", available: "可用", no_capacity: "容量不足", free: "空闲", outside_home: "超出 HOME 规划", box_available: "可用盒子", obtained: "已获得", overflow: "超出", previous_page: "← 上一页", next_page: "下一页 →", mark_page: "标记整页", unmark_page: "取消整页标记",
  box_instruction: "点击宝可梦可在未获得和已获得之间切换。", page_view_button: "页面视图", empty: "空", shiny: "✦ 异色", normal: "普通", your_ot: "你的初训家", foreign_ot: "其他初训家", pending: "未获得", mark_box: "标记整个盒子", unmark_box: "取消盒子标记", official_art_pending: "暂无官方绘图", official_art: "官方绘图：",
  data: "数据", data_note: "X/Y 中以你为初训家的传说捕获个体已与异色配信分开。GO 会预留全国图鉴1–1025，即使目前无法传送。", n_source: "N的宝可梦 ↗", dream_source: "宝可梦梦境世界 ↗", shadow_source: "黑暗宝可梦 ↗", trade_source: "游戏内交换 ↗", gender_source: "性别差异 ↗", art_source: "绘图：PokéAPI ↗", go_note: "完整规划1–1025", trade_note: "包含琉璃、铁男与搭档奖章", collection_beta: "测试版", language: "语言",
};

const ZHT: Copy = {
  ...ZHS,
  original_trainer: "初訓家",
  loading: "正在整理盒子…", load_error: "無法開啟目錄", reload: "請重新整理頁面後再試。", open_filters: "開啟篩選", close_filters: "關閉篩選", your_collection: "你的收藏", design: "設計收藏清單",
  preset_shiny: "僅異色", preset_shiny_desc: "可捕捉與特殊收藏", preset_special: "特殊收藏", preset_special_desc: "N、夢境、黑暗、遊戲內交換與貴重球", preset_normal: "普通收藏", preset_normal_desc: "每種形態一個位置", variants: "種類", shiny_possible: "可為異色", catalog_review: "目錄審核中", non_shiny: "非異色", normal_specimen: "普通個體", special_non_shiny: "特殊收藏中的非異色", special_non_shiny_desc: "即使只收藏異色也加入盒子", gender_differences: "性別差異", all_gender_differences: "所有性別差異", all_gender_differences_desc: "全部102種具有可見差異的寶可夢", notable_gender_differences_desc: "僅第5世代起最顯著的8種", male: "雄性", female: "雌性",
  trainer_origin: "訓練家來源", own_ot: "可捕捉 · 你的初訓家", own_ot_desc: "使用你名字的相遇與禮物", event_ot: "配信 · 其他初訓家", event_ot_desc: "活動與遊戲內訓練家", origin_marks: "起源標記", gba_ports: "Switch 的 GBA 移植", gba_ports_desc: "FR/LG 與傳聞中的 R/S/E", special_collections: "特殊收藏", special_ot_independent: "獨立篩選", special_ot_independent_desc: "已選擇的收藏不受全域初訓家篩選影響。", cherish_beta: "近似清單，仍需逐一驗證活動。",
  capacity: "參考容量", current: "目前官方", future: "未來規劃", active_catalogs: "已啟用目錄", next_expansion: "下一步：更多角色初訓家禮物和活動逐項驗證。", export: "匯出備份", import: "匯入", invalid_backup: "此檔案不是有效的 Origin Marks 備份。",
  page: "頁面", search: "搜尋寶可夢…", missing_only: "僅未獲得", page_view: "頁面檢視", page_desc: "選擇盒子以正確順序查看30個位置。", boxes_plan: "規劃盒子", available: "可用", no_capacity: "容量不足", free: "空閒", outside_home: "超出 HOME 規劃", box_available: "可用盒子", obtained: "已獲得", overflow: "超出", previous_page: "← 上一頁", next_page: "下一頁 →", mark_page: "標記整頁", unmark_page: "取消整頁標記",
  box_instruction: "點擊寶可夢可在未獲得與已獲得之間切換。", page_view_button: "頁面檢視", empty: "空", your_ot: "你的初訓家", foreign_ot: "其他初訓家", pending: "未獲得", mark_box: "標記整個盒子", unmark_box: "取消盒子標記", official_art_pending: "暫無官方繪圖", official_art: "官方繪圖：",
  data: "資料", data_note: "X/Y 中以你為初訓家的傳說捕捉個體已與異色配信分開。GO 會預留全國圖鑑1–1025，即使目前無法傳送。", n_source: "N的寶可夢 ↗", dream_source: "寶可夢夢境世界 ↗", shadow_source: "黑暗寶可夢 ↗", trade_source: "遊戲內交換 ↗", gender_source: "性別差異 ↗", art_source: "繪圖：PokéAPI ↗", go_note: "完整規劃1–1025", trade_note: "包含琉璃、鐵男與搭檔獎章", collection_beta: "測試版", language: "語言",
};

const UI_OVERRIDES: Record<UiLanguage, Copy> = {
  "ES-LA": {
    preset_shiny: "Solo brillantes", preset_shiny_desc: "Brillantes y colecciones especiales", preset_normal: "Living Dex", preset_normal_desc: "Una entrada por forma",
    shiny_possible: "Brillante posible", non_shiny: "No brillante", special_non_shiny: "No brillantes en especiales", special_non_shiny_desc: "Añádelos aunque el perfil sea solo brillante", shiny: "Brillante",
    acquisition: "PROCEDENCIA", in_game_trades: "Intercambios internos", in_game_trades_desc: "Pokémon de N y entrenadores del juego", events: "Eventos", events_desc: "Distribuciones brillantes por marca y Cherish Ball", other_games_apps: "Otros juegos y apps", other_games_apps_desc: "Colosseum, XD, Dream World, Dream Radar y GO",
    data_note: "Las distribuciones brillantes están separadas por marca. Xerneas e Yveltal existen como eventos con Pentágono; Zygarde brillante aparece con marca de Alola. GO reserva los números 1–1025.", radar_source: "Dream Radar ↗", event_source: "Eventos brillantes ↗", github_repo: "Abrir el repositorio de Home Checklist en GitHub",
  },
  "ES-ES": {
    preset_shiny: "Solo variocolor", preset_shiny_desc: "Variocolor y colecciones especiales", preset_normal: "Living Dex", preset_normal_desc: "Una entrada por forma",
    shiny_possible: "Variocolor posible", non_shiny: "No variocolor", special_non_shiny: "No variocolor en especiales", special_non_shiny_desc: "Añádelos aunque el perfil sea solo variocolor", shiny: "Variocolor",
    acquisition: "PROCEDENCIA", in_game_trades: "Intercambios internos", in_game_trades_desc: "Pokémon de N y entrenadores del juego", events: "Eventos", events_desc: "Distribuciones variocolor por marca y Gloria Ball", other_games_apps: "Otros juegos y aplicaciones", other_games_apps_desc: "Colosseum, XD, Dream World, Dream Radar y GO",
    data_note: "Las distribuciones variocolor están separadas por marca. Xerneas e Yveltal existen como eventos con Pentágono; Zygarde variocolor aparece con marca de Alola. GO reserva los números 1–1025.", radar_source: "Dream Radar ↗", event_source: "Eventos variocolor ↗", github_repo: "Abrir el repositorio de Home Checklist en GitHub",
  },
  ENG: {
    preset_normal: "Living Dex", preset_shiny_desc: "Shiny and special collections", shiny: "Shiny", acquisition: "ACQUISITION", in_game_trades: "In-game trades", in_game_trades_desc: "N's Pokémon and in-game trainers", events: "Events", events_desc: "Distributed Shiny Pokémon by origin mark and Cherish Ball", other_games_apps: "Other games and apps", other_games_apps_desc: "Colosseum, XD, Dream World, Dream Radar and GO", radar_source: "Dream Radar ↗", event_source: "Shiny events ↗", github_repo: "Open the Home Checklist repository on GitHub",
  },
  DEU: {
    preset_normal: "Living Dex", shiny: "Shiny", acquisition: "ERHALTSART", in_game_trades: "Spielinterner Tausch", in_game_trades_desc: "Ns Pokémon und Trainer im Spiel", events: "Events", events_desc: "Verteilte Shinys nach Herkunftszeichen und Jubelball", other_games_apps: "Andere Spiele und Apps", other_games_apps_desc: "Colosseum, XD, Traumwelt, Traumradar und GO", radar_source: "Traumradar ↗", event_source: "Shiny-Events ↗", github_repo: "Home-Checklist-Repository auf GitHub öffnen",
  },
  FRA: {
    preset_normal: "Living Dex", shiny: "Chromatique", acquisition: "OBTENTION", in_game_trades: "Échanges internes", in_game_trades_desc: "Pokémon de N et Dresseurs du jeu", events: "Événements", events_desc: "Pokémon chromatiques distribués par marque et Mémoire Ball", other_games_apps: "Autres jeux et applis", other_games_apps_desc: "Colosseum, XD, Monde des Rêves, RAdar Pokémon et GO", radar_source: "RAdar Pokémon ↗", event_source: "Événements chromatiques ↗", github_repo: "Ouvrir le dépôt Home Checklist sur GitHub",
  },
  ITA: {
    preset_normal: "Living Dex", shiny: "Cromatico", acquisition: "OTTENIMENTO", in_game_trades: "Scambi nel gioco", in_game_trades_desc: "Pokémon di N e Allenatori del gioco", events: "Eventi", events_desc: "Pokémon cromatici distribuiti per marchio e Pregio Ball", other_games_apps: "Altri giochi e app", other_games_apps_desc: "Colosseum, XD, Dream World, Dream Radar e GO", radar_source: "Dream Radar ↗", event_source: "Eventi cromatici ↗", github_repo: "Apri il repository Home Checklist su GitHub",
  },
  JPN: {
    preset_normal: "Living Dex", shiny: "色違い", acquisition: "入手方法", in_game_trades: "ゲーム内交換", in_game_trades_desc: "Nのポケモンとゲーム内トレーナー", events: "配布イベント", events_desc: "出身マーク別の色違い配布とプレシャスボール", other_games_apps: "他のゲーム・アプリ", other_games_apps_desc: "コロシアム・XD・夢・ARサーチャー・GO", radar_source: "ARサーチャー ↗", event_source: "色違い配布 ↗", github_repo: "GitHubでHome Checklistのリポジトリを開く",
  },
  KOR: {
    preset_normal: "Living Dex", shiny: "이로치", acquisition: "입수 방법", in_game_trades: "게임 내 교환", in_game_trades_desc: "N의 포켓몬과 게임 내 트레이너", events: "이벤트", events_desc: "출신 마크별 이로치 배포와 프레셔스볼", other_games_apps: "다른 게임 및 앱", other_games_apps_desc: "콜로세움, XD, 드림월드, 드림 레이더, GO", radar_source: "드림 레이더 ↗", event_source: "이로치 이벤트 ↗", github_repo: "GitHub에서 Home Checklist 저장소 열기",
  },
  CHS: {
    preset_normal: "Living Dex", shiny: "异色", acquisition: "获得方式", in_game_trades: "游戏内交换", in_game_trades_desc: "N的宝可梦与游戏内训练家", events: "活动", events_desc: "按起源标记整理的异色配信与贵重球", other_games_apps: "其他游戏与应用", other_games_apps_desc: "Colosseum、XD、梦境世界、梦境雷达与GO", radar_source: "梦境雷达 ↗", event_source: "异色活动 ↗", github_repo: "在GitHub打开Home Checklist仓库",
  },
  CHT: {
    preset_normal: "Living Dex", shiny: "異色", acquisition: "獲得方式", in_game_trades: "遊戲內交換", in_game_trades_desc: "N的寶可夢與遊戲內訓練家", events: "活動", events_desc: "依起源標記整理的異色配信與貴重球", other_games_apps: "其他遊戲與應用程式", other_games_apps_desc: "Colosseum、XD、夢境世界、夢境雷達與GO", radar_source: "夢境雷達 ↗", event_source: "異色活動 ↗", github_repo: "在GitHub開啟Home Checklist儲存庫",
  },
};

export const UI_COPY: Record<UiLanguage, Copy> = {
  "ES-LA": ES,
  "ES-ES": ES,
  ENG: EN,
  DEU: DE,
  FRA: FR,
  ITA: IT,
  JPN: JA,
  KOR: KO,
  CHS: ZHS,
  CHT: ZHT,
};

const GLOBAL_VIEW_COPY: Record<UiLanguage, Copy> = {
  "ES-LA": {
    choose_view: "Elegir vista", boxes_view: "Cajas", global_view: "Vista global",
    global_view_desc: "Explora todos los Pokémon de los filtros activos. Pasa el cursor para ver su ficha y selecciónalo para abrir su ubicación exacta.",
    results: "resultados", status_obtained: "Obtenido", status_missing: "Faltante", slot: "POSICIÓN",
    locate_in_box: "Selecciona para localizarlo en su caja", no_results: "No hay Pokémon para mostrar", no_results_desc: "Prueba otra búsqueda o ajusta los filtros activos.",
  },
  "ES-ES": {
    choose_view: "Elegir vista", boxes_view: "Cajas", global_view: "Vista global",
    global_view_desc: "Explora todos los Pokémon de los filtros activos. Pasa el cursor para ver su ficha y selecciónalo para abrir su ubicación exacta.",
    results: "resultados", status_obtained: "Obtenido", status_missing: "Faltante", slot: "POSICIÓN",
    locate_in_box: "Selecciona para localizarlo en su caja", no_results: "No hay Pokémon para mostrar", no_results_desc: "Prueba otra búsqueda o ajusta los filtros activos.",
  },
  ENG: {
    choose_view: "Choose view", boxes_view: "Boxes", global_view: "Global view",
    global_view_desc: "Explore every Pokémon in the active filters. Hover for details, then select one to open its exact location.",
    results: "results", status_obtained: "Obtained", status_missing: "Missing", slot: "SLOT",
    locate_in_box: "Select to locate it in its box", no_results: "No Pokémon to show", no_results_desc: "Try another search or adjust the active filters.",
  },
  DEU: {
    choose_view: "Ansicht wählen", boxes_view: "Boxen", global_view: "Gesamtansicht",
    global_view_desc: "Durchsuche alle Pokémon der aktiven Filter. Fahre für Details darüber und wähle eines aus, um seinen genauen Platz zu öffnen.",
    results: "Ergebnisse", status_obtained: "Erhalten", status_missing: "Fehlend", slot: "PLATZ",
    locate_in_box: "Auswählen, um es in seiner Box zu finden", no_results: "Keine Pokémon zum Anzeigen", no_results_desc: "Versuche eine andere Suche oder passe die aktiven Filter an.",
  },
  FRA: {
    choose_view: "Choisir la vue", boxes_view: "Boîtes", global_view: "Vue globale",
    global_view_desc: "Explorez tous les Pokémon correspondant aux filtres actifs. Survolez-les pour voir leur fiche, puis sélectionnez-en un pour ouvrir son emplacement exact.",
    results: "résultats", status_obtained: "Obtenu", status_missing: "Manquant", slot: "PLACE",
    locate_in_box: "Sélectionnez-le pour le retrouver dans sa Boîte", no_results: "Aucun Pokémon à afficher", no_results_desc: "Essayez une autre recherche ou modifiez les filtres actifs.",
  },
  ITA: {
    choose_view: "Scegli vista", boxes_view: "Box", global_view: "Vista globale",
    global_view_desc: "Esplora tutti i Pokémon inclusi nei filtri attivi. Passa il cursore per i dettagli, quindi selezionane uno per aprire la sua posizione esatta.",
    results: "risultati", status_obtained: "Ottenuto", status_missing: "Mancante", slot: "POSTO",
    locate_in_box: "Seleziona per trovarlo nel suo Box", no_results: "Nessun Pokémon da mostrare", no_results_desc: "Prova un'altra ricerca o modifica i filtri attivi.",
  },
  JPN: {
    choose_view: "表示を選択", boxes_view: "ボックス", global_view: "全体表示",
    global_view_desc: "有効なフィルター内のすべてのポケモンを一覧できます。カーソルを合わせて詳細を確認し、選択すると正確な場所を開きます。",
    results: "件", status_obtained: "入手済み", status_missing: "未入手", slot: "場所",
    locate_in_box: "選択してボックス内の場所を表示", no_results: "表示するポケモンがいません", no_results_desc: "検索条件または有効なフィルターを変更してください。",
  },
  KOR: {
    choose_view: "보기 선택", boxes_view: "박스", global_view: "전체 보기",
    global_view_desc: "활성 필터에 포함된 모든 포켓몬을 살펴보세요. 마우스를 올려 정보를 확인하고 선택하면 정확한 위치가 열립니다.",
    results: "결과", status_obtained: "보유", status_missing: "미보유", slot: "위치",
    locate_in_box: "선택하여 박스 위치 찾기", no_results: "표시할 포켓몬이 없습니다", no_results_desc: "다른 검색어나 활성 필터를 사용해 보세요.",
  },
  CHS: {
    choose_view: "选择视图", boxes_view: "盒子", global_view: "全局视图",
    global_view_desc: "浏览当前筛选条件下的所有宝可梦。悬停可查看详情，选择后会打开其准确位置。",
    results: "个结果", status_obtained: "已获得", status_missing: "未获得", slot: "位置",
    locate_in_box: "选择以在盒子中定位", no_results: "没有可显示的宝可梦", no_results_desc: "请尝试其他搜索词或调整当前筛选条件。",
  },
  CHT: {
    choose_view: "選擇檢視", boxes_view: "盒子", global_view: "全域檢視",
    global_view_desc: "瀏覽目前篩選條件下的所有寶可夢。懸停可查看詳情，選取後會開啟其準確位置。",
    results: "個結果", status_obtained: "已獲得", status_missing: "未獲得", slot: "位置",
    locate_in_box: "選取以在盒子中定位", no_results: "沒有可顯示的寶可夢", no_results_desc: "請嘗試其他搜尋詞或調整目前篩選條件。",
  },
};

const FEATURE_EN: Copy = {
  collection_profiles: "COLLECTION PROFILE", profile_basic: "Basic Living Dex", profile_basic_desc: "One normal specimen of each species.",
  profile_forms: "Living Form Dex", profile_forms_desc: "Every storable form and visible gender difference.",
  profile_shiny: "Shiny Living Dex", profile_shiny_desc: "Every possible shiny with your OT.",
  profile_origin: "Origin Mark Dex", profile_origin_desc: "One normal specimen per species and origin mark.",
  profile_completionist: "Completionist", profile_completionist_desc: "Every mark, collection, form and possible variant.",
  profile_custom: "Custom", profile_custom_desc: "Your current combination of filters.",
  availability: "AVAILABILITY", availability_current: "Currently available", availability_legacy: "Requires legacy infrastructure",
  availability_historical: "Historically obtainable", availability_hypothetical: "Hypothetical scenario",
  bank_required: "Requires Pokémon Bank", bank_missing: "missing require Bank", favorites: "Favorites", favorites_only: "Targets only",
  add_favorite: "Add to targets", remove_favorite: "Remove from targets", box_navigator: "BOX NAVIGATOR", jump_to_box: "Jump to a box…",
  entry_details: "Pokémon details", close_details: "Close details", origin_required: "Required origin", method: "Method",
  transfer: "Transfer", shiny_available: "Shiny", own_ot_possible: "Your own OT", yes: "Yes", no: "No",
  location: "Location", why_exists: "Why this entry exists", catalog_note: "Catalog note", shiny_locked: "Shiny locked",
  open_details: "Open details", availability_label: "Availability",
  method_transfer_evolve: "Obtain a compatible earlier-stage Pokémon with this origin, transfer it, then evolve it in a later compatible game.",
  method_dream_world: "Use a specimen legitimately obtained from Pokémon Dream World before the service closed.",
  method_dream_radar: "Catch it in Pokémon Dream Radar and send it to a compatible Generation V game.",
  method_shadow: "Catch the Shadow Pokémon in Colosseum or XD, purify it, then transfer it forward.",
  method_n_pokemon: "Receive N's Pokémon in Black 2 or White 2, then transfer it forward.",
  method_go: "Catch or receive it in Pokémon GO, then send it to Pokémon HOME.",
  method_trade: "Complete the indicated in-game trade in the source title.",
  method_event: "Use the corresponding official distribution or event specimen.",
  method_hypothetical: "Reserved for the future Switch-port scenario represented by this catalog.",
  method_source_game: "Catch, hatch or receive the Pokémon in a compatible game for this origin.",
  why_transfer_evolution: "This species or form did not exist in the origin generation. The entry remains valid because an earlier-stage Pokémon can keep its origin data after being transferred and evolved later.",
  why_dream_world: "Dream World is closed, so no new legitimate specimen can be obtained there. A specimen obtained while the service was active can still be transferred through Bank.",
  why_hypothetical: "This entry belongs to a clearly marked future scenario and is not currently obtainable.",
  why_valid_entry: "The species or form can legitimately retain this origin or collection provenance in Pokémon HOME.",
  transfer_bank_home: "Source game → transfer chain → Pokémon Bank → Pokémon HOME",
  transfer_existing_bank_home: "Existing legacy specimen → Pokémon Bank → Pokémon HOME",
  transfer_go_home: "Pokémon GO → Pokémon HOME", transfer_direct_home: "Compatible source game → Pokémon HOME",
  transfer_hypothetical: "Future Switch port → Pokémon HOME",
};

const FEATURE_ES: Copy = {
  collection_profiles: "PERFIL DE COLECCIÓN", profile_basic: "Living Dex básica", profile_basic_desc: "Un ejemplar normal de cada especie.",
  profile_forms: "Living Form Dex", profile_forms_desc: "Todas las formas almacenables y diferencias de sexo visibles.",
  profile_shiny: "Shiny Living Dex", profile_shiny_desc: "Todos los shiny posibles con tu EO.",
  profile_origin: "Origin Mark Dex", profile_origin_desc: "Un ejemplar normal por especie y marca de origen.",
  profile_completionist: "Completionist", profile_completionist_desc: "Todas las marcas, colecciones, formas y variantes posibles.",
  profile_custom: "Personalizada", profile_custom_desc: "Tu combinación actual de filtros.",
  availability: "DISPONIBILIDAD", availability_current: "Disponible actualmente", availability_legacy: "Requiere infraestructura legacy",
  availability_historical: "Obtenible históricamente", availability_hypothetical: "Escenario hipotético",
  bank_required: "Requiere Pokémon Bank", bank_missing: "faltantes requieren Bank", favorites: "Favoritos", favorites_only: "Solo objetivos",
  add_favorite: "Añadir a objetivos", remove_favorite: "Quitar de objetivos", box_navigator: "NAVEGADOR DE CAJAS", jump_to_box: "Saltar a una caja…",
  entry_details: "Detalles del Pokémon", close_details: "Cerrar detalles", origin_required: "Origen necesario", method: "Método",
  transfer: "Transferencia", shiny_available: "Shiny", own_ot_possible: "EO propio posible", yes: "Sí", no: "No",
  location: "Ubicación", why_exists: "Por qué existe esta entrada", catalog_note: "Nota del catálogo", shiny_locked: "Shiny bloqueado",
  open_details: "Abrir detalles", availability_label: "Disponibilidad",
  method_transfer_evolve: "Obtén una preevolución compatible con este origen, transfiérela y evolúcionala después en un juego compatible.",
  method_dream_world: "Usa un ejemplar obtenido legítimamente en Pokémon Dream World antes del cierre del servicio.",
  method_dream_radar: "Captúralo en Pokémon Dream Radar y envíalo a un juego compatible de quinta generación.",
  method_shadow: "Captura al Pokémon oscuro en Colosseum o XD, purifícalo y transfiérelo hacia adelante.",
  method_n_pokemon: "Recibe al Pokémon de N en Negro 2 o Blanco 2 y transfiérelo hacia adelante.",
  method_go: "Captúralo o recíbelo en Pokémon GO y envíalo a Pokémon HOME.",
  method_trade: "Completa el intercambio interno indicado en el juego de origen.",
  method_event: "Usa el ejemplar correspondiente de una distribución o evento oficial.",
  method_hypothetical: "Reservado para el escenario futuro de ports de Switch representado por este catálogo.",
  method_source_game: "Captura, cría o recibe al Pokémon en un juego compatible con este origen.",
  why_transfer_evolution: "Esta especie o forma no existía en la generación de origen. La entrada es válida porque una preevolución puede conservar sus datos de origen después de transferirse y evolucionar más tarde.",
  why_dream_world: "Dream World está cerrado y ya no permite obtener nuevos ejemplares legítimos. Los obtenidos mientras estuvo activo todavía pueden transferirse mediante Bank.",
  why_hypothetical: "Esta entrada pertenece a un escenario futuro claramente señalado y no se puede obtener actualmente.",
  why_valid_entry: "La especie o forma puede conservar legítimamente este origen o procedencia de colección en Pokémon HOME.",
  transfer_bank_home: "Juego de origen → cadena de transferencia → Pokémon Bank → Pokémon HOME",
  transfer_existing_bank_home: "Ejemplar legacy existente → Pokémon Bank → Pokémon HOME",
  transfer_go_home: "Pokémon GO → Pokémon HOME", transfer_direct_home: "Juego de origen compatible → Pokémon HOME",
  transfer_hypothetical: "Port futuro de Switch → Pokémon HOME",
};

const FEATURE_COPY: Partial<Record<UiLanguage, Copy>> = {
  "ES-LA": FEATURE_ES,
  "ES-ES": FEATURE_ES,
  ENG: FEATURE_EN,
  DEU: { ...FEATURE_EN, collection_profiles: "SAMMLUNGSPROFIL", availability: "VERFÜGBARKEIT", favorites: "Favoriten", favorites_only: "Nur Ziele", box_navigator: "BOX-NAVIGATOR", entry_details: "Pokémon-Details", close_details: "Details schließen" },
  FRA: { ...FEATURE_EN, collection_profiles: "PROFIL DE COLLECTION", availability: "DISPONIBILITÉ", favorites: "Favoris", favorites_only: "Objectifs uniquement", box_navigator: "NAVIGATEUR DE BOÎTES", entry_details: "Détails du Pokémon", close_details: "Fermer les détails" },
  ITA: { ...FEATURE_EN, collection_profiles: "PROFILO COLLEZIONE", availability: "DISPONIBILITÀ", favorites: "Preferiti", favorites_only: "Solo obiettivi", box_navigator: "NAVIGATORE BOX", entry_details: "Dettagli Pokémon", close_details: "Chiudi dettagli" },
  JPN: { ...FEATURE_EN, collection_profiles: "コレクションプロフィール", availability: "入手可能性", favorites: "お気に入り", favorites_only: "目標のみ", box_navigator: "ボックスナビゲーター", entry_details: "ポケモン詳細", close_details: "詳細を閉じる" },
  KOR: { ...FEATURE_EN, collection_profiles: "컬렉션 프로필", availability: "획득 가능성", favorites: "즐겨찾기", favorites_only: "목표만", box_navigator: "박스 탐색", entry_details: "포켓몬 상세", close_details: "상세 닫기" },
  CHS: { ...FEATURE_EN, collection_profiles: "收藏配置", availability: "可获得性", favorites: "收藏", favorites_only: "仅目标", box_navigator: "盒子导航", entry_details: "宝可梦详情", close_details: "关闭详情" },
  CHT: { ...FEATURE_EN, collection_profiles: "收藏設定", availability: "可獲得性", favorites: "收藏", favorites_only: "僅目標", box_navigator: "盒子導覽", entry_details: "寶可夢詳情", close_details: "關閉詳情" },
};

const GROUPS: Record<string, Partial<Record<UiLanguage, string>>> = {
  "Sin marca": { ENG: "No mark", DEU: "Ohne Zeichen", FRA: "Sans marque", ITA: "Senza marchio", JPN: "マークなし", KOR: "마크 없음", CHS: "无标记", CHT: "無標記" },
  GB: { ENG: "Game Boy", DEU: "Game Boy", FRA: "Game Boy", ITA: "Game Boy", JPN: "ゲームボーイ", KOR: "게임보이", CHS: "Game Boy", CHT: "Game Boy" },
  P: { ENG: "Pentagon", DEU: "Fünfeck", FRA: "Pentagone", ITA: "Pentagono", JPN: "カロスマーク", KOR: "칼로스 마크", CHS: "五边形", CHT: "五邊形" },
  USUM: { ENG: "Alola", DEU: "Alola", FRA: "Alola", ITA: "Alola", JPN: "アローラ", KOR: "알로라", CHS: "阿罗拉", CHT: "阿羅拉" },
  LGPE: { ENG: "Let's Go", DEU: "Let's Go", FRA: "Let's Go", ITA: "Let's Go", JPN: "Let's Go", KOR: "레츠고", CHS: "Let's Go", CHT: "Let's Go" },
  SwSh: { ENG: "Galar", DEU: "Galar", FRA: "Galar", ITA: "Galar", JPN: "ガラル", KOR: "가라르", CHS: "伽勒尔", CHT: "伽勒爾" },
  LA: { ENG: "Hisui", DEU: "Hisui", FRA: "Hisui", ITA: "Hisui", JPN: "ヒスイ", KOR: "히스이", CHS: "洗翠", CHT: "洗翠" },
  BDSP: { ENG: "Sinnoh", DEU: "Sinnoh", FRA: "Sinnoh", ITA: "Sinnoh", JPN: "シンオウ", KOR: "신오", CHS: "神奥", CHT: "神奧" },
  SV: { ENG: "Scarlet / Violet", DEU: "Karmesin / Purpur", FRA: "Écarlate / Violet", ITA: "Scarlatto / Violetto", JPN: "スカーレット / バイオレット", KOR: "스칼렛 / 바이올렛", CHS: "朱 / 紫", CHT: "朱 / 紫" },
  LZA: { ENG: "Lumiose", DEU: "Illumina", FRA: "Illumis", ITA: "Luminopoli", JPN: "ミアレ", KOR: "미르", CHS: "密阿雷", CHT: "密阿雷" },
  GBA: { ENG: "GBA", DEU: "GBA", FRA: "GBA", ITA: "GBA", JPN: "GBA", KOR: "GBA", CHS: "GBA", CHT: "GBA" },
  n: { ENG: "N's Pokémon", DEU: "Ns Pokémon", FRA: "Pokémon de N", ITA: "Pokémon di N", JPN: "Nのポケモン", KOR: "N의 포켓몬", CHS: "N的宝可梦", CHT: "N的寶可夢" },
  dream: { ENG: "Dream World", DEU: "Traumwelt", FRA: "Monde des Rêves", ITA: "Dream World", JPN: "ポケモンドリームワールド", KOR: "포켓몬 드림월드", CHS: "宝可梦梦境世界", CHT: "寶可夢夢境世界" },
  radar: { ENG: "Dream Radar", DEU: "Pokémon Traumradar", FRA: "RAdar Pokémon", ITA: "Pokémon Dream Radar", JPN: "ポケモンARサーチャー", KOR: "포켓몬 AR 서처", CHS: "宝可梦梦境雷达", CHT: "寶可夢夢境雷達" },
  "shadow-colosseum": { ENG: "Shadow · Colosseum", DEU: "Crypto · Colosseum", FRA: "Obscur · Colosseum", ITA: "Ombra · Colosseum", JPN: "ダーク · コロシアム", KOR: "다크 · 콜로세움", CHS: "黑暗 · Colosseum", CHT: "黑暗 · Colosseum" },
  "shadow-xd": { ENG: "Shadow · XD", DEU: "Crypto · XD", FRA: "Obscur · XD", ITA: "Ombra · XD", JPN: "ダーク · XD", KOR: "다크 · XD", CHS: "黑暗 · XD", CHT: "黑暗 · XD" },
  cherish: { ENG: "Cherish Ball", DEU: "Jubelball", FRA: "Mémoire Ball", ITA: "Pregio Ball", JPN: "プレシャスボール", KOR: "프레셔스볼", CHS: "贵重球", CHT: "貴重球" },
  trades: { ENG: "In-game trades", DEU: "Spielinterner Tausch", FRA: "Échanges internes", ITA: "Scambi nel gioco", JPN: "ゲーム内交換", KOR: "게임 내 교환", CHS: "游戏内交换", CHT: "遊戲內交換" },
  go: { ENG: "Pokémon GO", DEU: "Pokémon GO", FRA: "Pokémon GO", ITA: "Pokémon GO", JPN: "Pokémon GO", KOR: "Pokémon GO", CHS: "Pokémon GO", CHT: "Pokémon GO" },
};

const VIVILLON_FORMS: Record<string, Record<UiLanguage, string>> = {
  "Icy Snow": { "ES-LA": "Motivo Polar", "ES-ES": "Motivo Polar", ENG: "Icy Snow Pattern", DEU: "Frostmuster", FRA: "Motif Blizzard", ITA: "Motivo Nevi Perenni", JPN: "ひょうせつのもよう", KOR: "빙설의 모양", CHS: "冰雪花纹", CHT: "冰雪花紋" },
  Polar: { "ES-LA": "Motivo Taiga", "ES-ES": "Motivo Taiga", ENG: "Polar Pattern", DEU: "Schneefeldmuster", FRA: "Motif Banquise", ITA: "Motivo Nordico", JPN: "ゆきぐにのもよう", KOR: "설국의 모양", CHS: "雪国花纹", CHT: "雪國花紋" },
  Tundra: { "ES-LA": "Motivo Tundra", "ES-ES": "Motivo Tundra", ENG: "Tundra Pattern", DEU: "Flockenmuster", FRA: "Motif Glace", ITA: "Motivo Manto di Neve", JPN: "せつげんのもよう", KOR: "설원의 모양", CHS: "雪原花纹", CHT: "雪原花紋" },
  Continental: { "ES-LA": "Motivo Continental", "ES-ES": "Motivo Continental", ENG: "Continental Pattern", DEU: "Kontinentalmuster", FRA: "Motif Continent", ITA: "Motivo Continentale", JPN: "たいりくのもよう", KOR: "대륙의 모양", CHS: "大陆花纹", CHT: "大陸花紋" },
  Garden: { "ES-LA": "Motivo Vergel", "ES-ES": "Motivo Vergel", ENG: "Garden Pattern", DEU: "Ziergartenmuster", FRA: "Motif Verdure", ITA: "Motivo Prato", JPN: "ていえんのもよう", KOR: "정원의 모양", CHS: "庭园花纹", CHT: "庭園花紋" },
  Elegant: { "ES-LA": "Motivo Oriental", "ES-ES": "Motivo Oriental", ENG: "Elegant Pattern", DEU: "Prunkmuster", FRA: "Motif Monarchie", ITA: "Motivo Eleganza", JPN: "みやびなもよう", KOR: "우아한 모양", CHS: "高雅花纹", CHT: "高雅花紋" },
  Meadow: { "ES-LA": "Motivo Pradera", "ES-ES": "Motivo Pradera", ENG: "Meadow Pattern", DEU: "Blumenmeermuster", FRA: "Motif Floraison", ITA: "Motivo Giardinfiore", JPN: "はなぞののもよう", KOR: "화원의 모양", CHS: "花园花纹", CHT: "花園花紋" },
  Modern: { "ES-LA": "Motivo Moderno", "ES-ES": "Motivo Moderno", ENG: "Modern Pattern", DEU: "Innovationsmuster", FRA: "Motif Métropole", ITA: "Motivo Trendy", JPN: "モダンなもよう", KOR: "모던한 모양", CHS: "摩登花纹", CHT: "摩登花紋" },
  Marine: { "ES-LA": "Motivo Marino", "ES-ES": "Motivo Marino", ENG: "Marine Pattern", DEU: "Aquamarinmuster", FRA: "Motif Rivage", ITA: "Motivo Marino", JPN: "マリンのもよう", KOR: "마린의 모양", CHS: "大海花纹", CHT: "大海花紋" },
  Archipelago: { "ES-LA": "Motivo Isleño", "ES-ES": "Motivo Isleño", ENG: "Archipelago Pattern", DEU: "Archipelmuster", FRA: "Motif Archipel", ITA: "Motivo Arcipelago", JPN: "ぐんとうのもよう", KOR: "군도의 모양", CHS: "群岛花纹", CHT: "群島花紋" },
  "High Plains": { "ES-LA": "Motivo Estepa", "ES-ES": "Motivo Estepa", ENG: "High Plains Pattern", DEU: "Dürremuster", FRA: "Motif Sécheresse", ITA: "Motivo Deserto", JPN: "こうやのもよう", KOR: "황야의 모양", CHS: "荒野花纹", CHT: "荒野花紋" },
  Sandstorm: { "ES-LA": "Motivo Desierto", "ES-ES": "Motivo Desierto", ENG: "Sandstorm Pattern", DEU: "Sandmuster", FRA: "Motif Sable", ITA: "Motivo Sabbia", JPN: "さじんのもよう", KOR: "사진의 모양", CHS: "沙尘花纹", CHT: "沙塵花紋" },
  River: { "ES-LA": "Motivo Oasis", "ES-ES": "Motivo Oasis", ENG: "River Pattern", DEU: "Flussdeltamuster", FRA: "Motif Delta", ITA: "Motivo Fluviale", JPN: "たいがのもよう", KOR: "대하의 모양", CHS: "大河花纹", CHT: "大河花紋" },
  Monsoon: { "ES-LA": "Motivo Monzón", "ES-ES": "Motivo Monzón", ENG: "Monsoon Pattern", DEU: "Monsunmuster", FRA: "Motif Cyclone", ITA: "Motivo Pluviale", JPN: "スコールのもよう", KOR: "스콜의 모양", CHS: "骤雨花纹", CHT: "驟雨花紋" },
  Savanna: { "ES-LA": "Motivo Pantano", "ES-ES": "Motivo Pantano", ENG: "Savanna Pattern", DEU: "Savannenmuster", FRA: "Motif Mangrove", ITA: "Motivo Savana", JPN: "サバンナのもよう", KOR: "사바나의 모양", CHS: "热带草原花纹", CHT: "熱帶草原花紋" },
  Sun: { "ES-LA": "Motivo Solar", "ES-ES": "Motivo Solar", ENG: "Sun Pattern", DEU: "Sonnenmuster", FRA: "Motif Zénith", ITA: "Motivo Solare", JPN: "たいようのもよう", KOR: "태양의 모양", CHS: "太阳花纹", CHT: "太陽花紋" },
  Ocean: { "ES-LA": "Motivo Océano", "ES-ES": "Motivo Océano", ENG: "Ocean Pattern", DEU: "Ozeanmuster", FRA: "Motif Soleil Levant", ITA: "Motivo Oceanico", JPN: "オーシャンのもよう", KOR: "오션의 모양", CHS: "大洋花纹", CHT: "大洋花紋" },
  Jungle: { "ES-LA": "Motivo Jungla", "ES-ES": "Motivo Jungla", ENG: "Jungle Pattern", DEU: "Dschungelmuster", FRA: "Motif Jungle", ITA: "Motivo Giungla", JPN: "ジャングルのもよう", KOR: "정글의 모양", CHS: "热带雨林花纹", CHT: "熱帶雨林花紋" },
  Fancy: { "ES-LA": "Motivo Fantasía", "ES-ES": "Motivo Fantasía", ENG: "Fancy Pattern", DEU: "Fantasiemuster", FRA: "Motif Fantaisie", ITA: "Motivo Sbarazzino", JPN: "ファンシーなもよう", KOR: "팬시한 모양", CHS: "幻彩花纹", CHT: "幻彩花紋" },
  "Poké Ball": { "ES-LA": "Motivo Pokébola", "ES-ES": "Motivo Poké Ball", ENG: "Poké Ball Pattern", DEU: "Pokéball-Muster", FRA: "Motif Poké Ball", ITA: "Motivo Poké Ball", JPN: "ボールのもよう", KOR: "볼의 모양", CHS: "球球花纹", CHT: "球球花紋" },
};

const FORM_FILTER_COPY: Record<UiLanguage, Record<string, string>> = {
  "ES-LA": { form_differences: "FORMAS Y DIFERENCIAS", alternate_forms: "Formas alternas", all_alcremie_forms: "63 formas de Alcremie", all_minior_forms: "7 núcleos de Minior" },
  "ES-ES": { form_differences: "FORMAS Y DIFERENCIAS", alternate_forms: "Formas alternativas", all_alcremie_forms: "63 formas de Alcremie", all_minior_forms: "7 núcleos de Minior" },
  ENG: { form_differences: "FORMS & DIFFERENCES", alternate_forms: "Alternate forms", all_alcremie_forms: "All 63 Alcremie forms", all_minior_forms: "All 7 Minior cores" },
  DEU: { form_differences: "FORMEN & UNTERSCHIEDE", alternate_forms: "Alternative Formen", all_alcremie_forms: "Alle 63 Alcremie-Formen", all_minior_forms: "Alle 7 Minior-Kerne" },
  FRA: { form_differences: "FORMES ET DIFFÉRENCES", alternate_forms: "Formes alternatives", all_alcremie_forms: "Les 63 formes de Charmilly", all_minior_forms: "Les 7 noyaux de Météno" },
  ITA: { form_differences: "FORME E DIFFERENZE", alternate_forms: "Forme alternative", all_alcremie_forms: "Tutte le 63 forme di Alcremie", all_minior_forms: "Tutti i 7 nuclei di Minior" },
  JPN: { form_differences: "フォルムと違い", alternate_forms: "別フォルム", all_alcremie_forms: "マホイップ全63フォルム", all_minior_forms: "メテノ全7色のコア" },
  KOR: { form_differences: "폼과 차이", alternate_forms: "다른 폼", all_alcremie_forms: "마휘핑 63개 폼", all_minior_forms: "메테노 코어 7종" },
  CHS: { form_differences: "形态与差异", alternate_forms: "其他形态", all_alcremie_forms: "霜奶仙全部63种形态", all_minior_forms: "小陨星全部7种核心" },
  CHT: { form_differences: "形態與差異", alternate_forms: "其他形態", all_alcremie_forms: "霜奶仙全部63種形態", all_minior_forms: "小隕星全部7種核心" },
};

export function formName(language: UiLanguage, dex: number, form: string | null) {
  if (!form) return null;
  return dex === 666 ? VIVILLON_FORMS[form]?.[language] ?? form : form;
}

export function copy(language: UiLanguage, key: string) {
  if (key === "box") return ({ "ES-LA": "CAJA", "ES-ES": "CAJA", ENG: "BOX", DEU: "BOX", FRA: "BOÎTE", ITA: "BOX", JPN: "ボックス", KOR: "박스", CHS: "盒子", CHT: "盒子" } as Record<UiLanguage, string>)[language];
  if (FORM_FILTER_COPY[language][key]) return FORM_FILTER_COPY[language][key];
  if (language === "CHT" && key === "preset_normal") return "一般顏色";
  if (language === "CHT" && key === "preset_normal_desc") return "一般顏色的個體";
  if (language === "CHT" && key === "normal_living_dex") return "一般 Living Dex";
  if (language === "CHT" && key === "normal_living_dex_desc") return "每個種類一隻 · 保留篩選";
  if (key === "preset_normal" || key === "preset_normal_desc") return UI_COPY[language][key] ?? ES[key] ?? key;
  return FEATURE_COPY[language]?.[key] ?? FEATURE_EN[key] ?? GLOBAL_VIEW_COPY[language][key] ?? UI_OVERRIDES[language][key] ?? UI_COPY[language][key] ?? ES[key] ?? key;
}

export function groupName(language: UiLanguage, key: string) {
  return GROUPS[key]?.[language] ?? (language.startsWith("ES") ? ({ P: "Pentágono", USUM: "Alola", LGPE: "Let's Go", SwSh: "Galar", LA: "Hisui", BDSP: "Sinnoh", SV: "Escarlata / Púrpura", LZA: "Lumiose", GBA: "GBA", "Sin marca": "Sin marca", GB: "GB", n: "Pokémon de N", dream: "Dream World", radar: "Pokémon Dream Radar", "shadow-colosseum": "Shadow · Colosseum", "shadow-xd": "Shadow · XD", cherish: "Cherish Ball", trades: "Intercambios internos", go: "Pokémon GO" } as Record<string, string>)[key] : undefined) ?? key;
}
