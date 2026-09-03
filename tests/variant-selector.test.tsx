import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { VariantSelector } from "../src/components/variant-selector";
import { LANGUAGE_OPTIONS, copy } from "../src/translations";

test("variant selector shows only a shiny symbol and localizes normal color in all languages", () => {
  for (const { code } of LANGUAGE_OPTIONS) {
    const t = (key: string) => copy(code, key);
    assert.equal(t("non_shiny"), t("preset_normal"));
    assert.notEqual(t("variant_shiny"), "variant_shiny");
    assert.notEqual(t("special_non_shiny"), "special_non_shiny");
    const html = renderToStaticMarkup(createElement(VariantSelector, {
      variants: { shiny: true, normal: true }, onToggle() {}, t, shinyIconUrl: "/assets/shiny.png",
    }));
    assert.match(html, /role="group"/);
    assert.equal((html.match(/<button/g) ?? []).length, 2);
    const shiny = html.match(/<button id="variant-shiny"[\s\S]*?<\/button>/)?.[0] ?? "";
    assert.ok(shiny.includes(`aria-label="${t("variant_shiny")}"`));
    assert.match(shiny, /><img [^>]*alt=""\/><\/button>$/);
    assert.ok(html.includes(`>${t("non_shiny")}</button>`));
    assert.doesNotMatch(html, /checkbox|special-non-shiny|<small/);
  }
});

test("variant buttons reflect each selection and join only when both are selected", () => {
  for (const shiny of [false, true]) {
    for (const normal of [false, true]) {
      const html = renderToStaticMarkup(createElement(VariantSelector, {
        variants: { shiny, normal }, onToggle() {}, t: (key) => copy("ENG", key), shinyIconUrl: "/assets/shiny.png",
      }));
      assert.equal(html.includes('class="variant-options joined"'), shiny && normal);
      assert.ok(html.includes(`aria-pressed="${shiny}"`));
      assert.equal((html.match(/aria-pressed="true"/g) ?? []).length, Number(shiny) + Number(normal));
    }
  }
});

test("variant buttons invoke only their own independent toggle", () => {
  const toggled: string[] = [];
  const element = VariantSelector({
    variants: { shiny: true, normal: false }, onToggle: (variant) => toggled.push(variant),
    t: (key) => copy("ENG", key), shinyIconUrl: "/assets/shiny.png",
  });
  element.props.children[0].props.onClick();
  assert.deepEqual(toggled, ["shiny"]);
  element.props.children[1].props.onClick();
  assert.deepEqual(toggled, ["shiny", "normal"]);
});

test("special-color checkbox remains outside the joined variant selector", () => {
  const source = readFileSync("src/views/FilterPanel.tsx", "utf8");
  const variants = source.split('t("variants")')[1].split("</section>")[0];
  assert.match(variants, /<VariantSelector variants=\{variants\} onToggle=\{setVariant\}/);
  assert.match(variants, /<GooeyCheckbox id="special-non-shiny"/);
  assert.doesNotMatch(variants, /shiny_possible|<small/);
});
