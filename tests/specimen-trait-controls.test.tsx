import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { TraitBadges, TraitSwitch } from "../src/components/specimen-trait-controls";
import { LANGUAGE_OPTIONS, copy } from "../src/translations";
import { SPECIMEN_TRAITS, TRAIT_LABELS } from "../src/specimen-traits";

test("trait filters render accessible sliding switches with only icon and localized title", () => {
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

test("trait badges only show enabled requirements", () => {
  const t = (key: string) => copy("ENG", key);
  assert.equal(renderToStaticMarkup(createElement(TraitBadges, { requirements: { alpha: false }, t })), "");
  const html = renderToStaticMarkup(createElement(TraitBadges, { requirements: { alpha: true, gmaxFactor: true }, t }));
  assert.match(html, /alt="Alpha Pokémon"/);
  assert.match(html, /alt="Gigantamax Factor"/);
});
