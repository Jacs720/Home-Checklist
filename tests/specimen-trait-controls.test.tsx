import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { TraitBadges, TraitSwitch } from "../src/components/specimen-trait-controls";
import { LANGUAGE_OPTIONS, copy } from "../src/translations";
import { SPECIMEN_TRAITS, TRAIT_LABELS } from "../src/specimen-traits";

test("individual trait details retain their accessible sliding switches", () => {
  for (const { code } of LANGUAGE_OPTIONS) {
    for (const trait of SPECIMEN_TRAITS) {
      const label = copy(code, TRAIT_LABELS[trait]);
      const html = renderToStaticMarkup(createElement(TraitSwitch, {
        id: `test-${trait}`, trait, label, checked: true, onChange() {},
      }));
      assert.match(html, /role="switch"/);
      assert.match(html, /checked=""/);
      assert.match(html, /class="trait-icon"/);
      assert.ok(html.includes(`<b>${label}</b>`));
      assert.doesNotMatch(html, /<small|<p[ >]/);
    }
  }
});

test("only Forms and Differences uses the existing checkbox for trait preferences", () => {
  const source = readFileSync("src/views/FilterPanel.tsx", "utf8");
  const forms = source.split('t("form_differences")')[1].split("</section>")[0];
  assert.match(forms, /<GooeyCheckbox id=\{\x60filter-/);
  assert.doesNotMatch(forms, /TraitSwitch|<small/);
});

test("trait badges only show enabled requirements", () => {
  const t = (key: string) => copy("ENG", key);
  assert.equal(renderToStaticMarkup(createElement(TraitBadges, { requirements: { alpha: false }, t })), "");
  const html = renderToStaticMarkup(createElement(TraitBadges, { requirements: { alpha: true, gmaxFactor: true }, t }));
  assert.match(html, /alt="Alpha Pokémon"/);
  assert.match(html, /alt="Gigantamax Factor"/);
});
