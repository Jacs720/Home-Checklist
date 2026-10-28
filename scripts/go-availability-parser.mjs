// Extract factual release dates and encounter categories from Pokémon GO Wiki
// Availability sections. Preserve revisions and URLs in the generated snapshot.
export const normalizeGoForm = (value) => (value ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

export function splitWikiFields(text) {
  const fields = []; let start = 0, braces = 0, links = 0;
  for (let i = 0; i < text.length; i++) {
    const pair = text.slice(i, i + 2);
    if (pair === '{{') { braces++; i++; }
    else if (pair === '}}') { braces--; i++; }
    else if (pair === '[[') { links++; i++; }
    else if (pair === ']]') { links--; i++; }
    else if (text[i] === '|' && braces === 0 && links === 0) { fields.push(text.slice(start, i).trim()); start = i + 1; }
  }
  fields.push(text.slice(start).trim()); return fields;
}

export function wikiTemplates(text, name) {
  const templates = []; const pattern = new RegExp('\\{\\{\\s*' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?=\\s*[|}])', 'gi');
  for (const match of text.matchAll(pattern)) {
    let depth = 1, end = match.index + 2;
    for (; end < text.length && depth; end++) {
      const pair = text.slice(end, end + 2);
      if (pair === '{{') { depth++; end++; }
      else if (pair === '}}') { depth--; end++; }
    }
    if (depth === 0) templates.push(splitWikiFields(text.slice(match.index + 2, end - 2)));
  }
  return templates;
}

const months = ['january','february','march','april','may','june','july','august','september','october','november','december'];
function dateFromTemplate(fields, sameDay) {
  if (/^(?:the )?same day$/i.test(fields[1] ?? '')) return sameDay;
  const month = months.indexOf(fields[1]?.toLowerCase()) + 1;
  const day = Number(fields[2]), year = Number(fields[3]);
  return month && day > 0 && day <= 31 && year >= 2016 ? `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}` : undefined;
}

export function parseGoSection(text, asOf) {
  const releaseDates = wikiTemplates(text, 'Trivia/Release').map(fields => dateFromTemplate(fields)).filter(Boolean).sort();
  const releaseDate = releaseDates[0];
  const shinyDates = wikiTemplates(text, 'Trivia/Shiny Release').map(fields => dateFromTemplate(fields, releaseDate)).filter(Boolean).sort();
  const shinyDate = shinyDates[0];
  const explicitlyUnreleased = wikiTemplates(text, 'Trivia/Unreleased').length > 0;
  const release = releaseDate ? releaseDate <= asOf ? 'released' : 'unreleased' : explicitlyUnreleased ? 'unreleased' : 'unknown';
  const shiny = release === 'unreleased' ? 'unreleased' : shinyDate ? shinyDate <= asOf ? 'released' : 'unreleased' : release === 'released' ? 'unreleased' : 'unknown';
  const params = Object.fromEntries(wikiTemplates(text, 'AvailabilityTable').flatMap(fields => fields.slice(1).filter(field => field.includes('=')).map(field => {
    const index = field.indexOf('='); return [field.slice(0,index).trim(),field.slice(index+1).trim()];
  })));
  const positive = key => Boolean(params[key] && !/^(?:no|false|0)$/i.test(params[key]));
  const methods = [];
  if (positive('w') || positive('we')) methods.push('wild');
  if (positive('r') || positive('lp')) methods.push('raid');
  if (positive('e') || positive('ee')) methods.push('egg');
  if (['fr','sr','rb','cc'].some(positive)) methods.push('research');
  if (positive('pass')) methods.push('go_pass');
  if (positive('gbl')) methods.push('battle_league');
  if (positive('gs')) methods.push('snapshot');
  if (positive('route')) methods.push('routes');
  if (positive('mb')) methods.push('max_battle');
  if (/(?:acquired|available)(?: only)? (?:by|through) (?:\[\[(?:evolution\|)?evolution\]\]|evolution)|can only be acquired.*?\[\[(?:evolution\|)?evolution\]\]/i.test(text)) methods.push('evolution');
  if (/acquired through \[\[Form Change\]\]|available (?:only )?through \[\[Form Change\]\]/i.test(text)) methods.push('form_change');
  return { release, shiny, ...(releaseDate ? { releaseDate } : {}), ...(shinyDate ? { shinyDate } : {}), methods: release === 'released' ? methods : [] };
}

export function parseGoPage(page, asOf) {
  const revision = page.revisions?.[0];
  const text = (revision?.slots.main.content ?? '').replace(/<!--[\s\S]*?-->/g, '');
  const availability = text.match(/^==\s*Availability\s*==\s*([\s\S]*?)(?=^==[^=]|$(?![\s\S]))/mi)?.[1] ?? '';
  const records = [];
  const headings = [...availability.matchAll(/^===(?!=)\s*(.*?)\s*===\s*$/gm)];
  const common = headings.length ? availability.slice(0,headings[0].index) : availability;
  const base = parseGoSection(common, asOf);
  const evolvesFrom = /\[\[Evolution\|evolves\]\]\s+from/i.test(text.split(/^==/m)[0]);
  if (base.release === 'released' && !base.methods.length && evolvesFrom) base.methods.push('evolution');
  for (let i = 0; i < headings.length; i++) {
    const label = headings[i][1];
    const section = availability.slice(headings[i].index + headings[i][0].length,headings[i+1]?.index ?? availability.length);
    if (!wikiTemplates(section,'Trivia/Release').length && !wikiTemplates(section,'Trivia/Unreleased').length) continue;
    const fact = parseGoSection(section,asOf);
    if (fact.release === 'released' && !fact.methods.length && label === page.title && evolvesFrom) fact.methods.push('evolution');
    records.push({ label, ...fact });
  }
  return { name: page.title, sourceUrl: `https://pokemongo.fandom.com/wiki/${encodeURIComponent(page.title.replaceAll(' ','_'))}`, revisionId: revision?.revid, revisionAt: revision?.timestamp, ...base, forms: records };
}
