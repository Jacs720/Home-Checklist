import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { PlannedBox, PlannedEntry } from "../src/app-types";
import { applyManualBoxMerges, boxLayoutKey, combineManualBoxes, parseManualBoxMerges } from "../src/manual-box-packing";
import { packBoxesContinuously } from "../src/box-packing";
import { ManualBoxPacking } from "../src/components/ManualBoxPacking";
import { MANUAL_PACKING_COPY } from "../src/manual-packing-translations";
import { LANGUAGE_OPTIONS, copy } from "../src/translations";

function makeBoxes(sizes = [10, 30, 12, 4]): PlannedBox[] {
  return sizes.map((size, index) => ({
    globalIndex: index, groupKey: `group-${index}`, number: 1, label: `Box ${index + 1}`,
    entries: Array.from({ length: size }, (_, i) => ({ planId: `${index}-${i}`, groupKey: `group-${index}`, groupLabel: `Group ${index}` } as PlannedEntry)),
  }));
}
const keys = (boxes: PlannedBox[]) => boxes.map(boxLayoutKey);
const ids = (boxes: PlannedBox[]) => boxes.flatMap((box) => box.entries.map((entry) => entry.planId));

test("manual packing combines only the chosen non-adjacent boxes and preserves entry identities", () => {
  const boxes = makeBoxes();
  const before = structuredClone(boxes);
  const merges = combineManualBoxes(boxes, [], keys(boxes)[0], keys(boxes)[2], "test")!;
  const result = applyManualBoxMerges(boxes, merges);
  assert.deepEqual(result.boxes.map((box) => box.entries.length), [22, 30, 4]);
  assert.deepEqual(result.boxes[0].entries, [...boxes[0].entries, ...boxes[2].entries]);
  assert.equal(result.boxes[0].label, "Box 1 + Box 3");
  assert.strictEqual(result.boxes[1], boxes[1]);
  assert.deepEqual([...result.activeIds], ["test"]);
  assert.deepEqual(ids(result.boxes).sort(), ids(boxes).sort());
  assert.deepEqual(result.boxes.map((box) => box.globalIndex), [0, 1, 2]);
  assert.deepEqual(boxes, before);
  assert.strictEqual(result.boxes[0].entries[0], boxes[0].entries[0]);
});

test("destination may follow the donor and retains its origin, theme key and entry order", () => {
  const boxes = makeBoxes();
  const merges = combineManualBoxes(boxes, [], keys(boxes)[2], keys(boxes)[0], "reverse")!;
  const result = applyManualBoxMerges(boxes, merges).boxes;
  assert.deepEqual(result.map((box) => box.entries.length), [30, 22, 4]);
  assert.equal(result[1].groupKey, boxes[2].groupKey);
  assert.equal(result[1].number, boxes[2].number);
  assert.deepEqual(result[1].entries, [...boxes[2].entries, ...boxes[0].entries]);
  assert.notEqual(boxLayoutKey(result[1]), boxLayoutKey(boxes[2]));
});

test("manual packing refuses overflow, self-combination, empty boxes and stale choices", () => {
  const boxes = makeBoxes([10, 20, 21, 0]);
  const [a, b, c, empty] = keys(boxes);
  assert.ok(combineManualBoxes(boxes, [], a, b, "exact"));
  for (const [target, donor] of [[a, c], [a, a], [a, empty], [a, "missing"]]) {
    assert.equal(combineManualBoxes(boxes, [], target, donor, "invalid"), null);
  }
});

test("manual combinations can be extended, reversed independently and reloaded from backups", () => {
  const boxes = makeBoxes([8, 12, 10, 5, 5]);
  const k = keys(boxes);
  const first = combineManualBoxes(boxes, [], k[0], k[1], "first")!;
  const extended = combineManualBoxes(boxes, first, "manual:first", k[2], "extended")!;
  const both = combineManualBoxes(boxes, extended, k[3], k[4], "second")!;
  assert.equal(both.length, 2);
  assert.equal(both[0].sources.length, 3);
  assert.deepEqual(applyManualBoxMerges(boxes, both).boxes.map((box) => box.entries.length), [30, 10]);
  const restored = parseManualBoxMerges(JSON.parse(JSON.stringify(both)));
  assert.deepEqual(restored, both);
  assert.deepEqual(applyManualBoxMerges(boxes, restored), applyManualBoxMerges(boxes, both));
  const separated = applyManualBoxMerges(boxes, both.filter((merge) => merge.id !== "extended"));
  assert.deepEqual(separated.boxes.map((box) => box.entries.length), [8, 12, 10, 10]);
  assert.deepEqual(applyManualBoxMerges(boxes, []).boxes, boxes);
});

test("changed filters pause a merge instead of combining different Pokémon at the same box number", () => {
  const boxes = makeBoxes();
  const merges = combineManualBoxes(boxes, [], keys(boxes)[0], keys(boxes)[2], "test")!;
  const changed = structuredClone(boxes);
  changed[2].entries[0].planId = "different-pokemon";
  assert.deepEqual(applyManualBoxMerges(changed, merges).boxes, changed);
  assert.equal(applyManualBoxMerges(changed, merges).activeIds.size, 0);
  assert.equal(applyManualBoxMerges(boxes.slice(1), merges).activeIds.size, 0);
  assert.equal(applyManualBoxMerges(boxes, merges).activeIds.size, 1);
  const translated = boxes.map((box) => ({ ...box, label: `Caja ${box.globalIndex + 1}` }));
  assert.equal(applyManualBoxMerges(translated, merges).boxes[0].label, "Caja 1 + Caja 3");
});

test("automatic packing remains independent and never destroys saved manual combinations", () => {
  const boxes = makeBoxes();
  const merges = combineManualBoxes(boxes, [], keys(boxes)[0], keys(boxes)[3], "test")!;
  const before = structuredClone(merges);
  assert.deepEqual(packBoxesContinuously(boxes, true).map((box) => box.entries.length), [30, 26]);
  assert.deepEqual(applyManualBoxMerges(boxes, merges).boxes.map((box) => box.entries.length), [14, 30, 12]);
  assert.deepEqual(merges, before);
  const source = readFileSync("src/hooks/use-app-controller.ts", "utf8");
  assert.match(source, /saveSpace \? packBoxesContinuously\(unpackedBoxes, true\) : manualPacking.boxes/);
  assert.match(source, /setManualBoxMerges\(parseManualBoxMerges\(value.manualBoxMerges\)\)/);
  assert.match(source, /setManualBoxMerges\(parseManualBoxMerges\(configuration.manualBoxMerges\)\)/);
  assert.match(source, /customBoxes, manualBoxMerges,/);
});

test("malformed or conflicting backup combinations cannot duplicate or drop entries", () => {
  const boxes = makeBoxes();
  const valid = combineManualBoxes(boxes, [], keys(boxes)[0], keys(boxes)[2], "test")![0];
  assert.deepEqual(parseManualBoxMerges(undefined), []);
  assert.deepEqual(parseManualBoxMerges([null, {}, { ...valid, id: 2 }, { ...valid, sources: [valid.sources[0]] }]), []);
  assert.deepEqual(parseManualBoxMerges([{ ...valid, sources: [valid.sources[0], valid.sources[0]] }]), []);
  assert.deepEqual(parseManualBoxMerges([valid, valid]), [valid]);
  const over = { ...valid, sources: valid.sources.map((source) => ({ ...source, planIds: Array.from({ length: 20 }, (_, i) => `${source.key}-${i}`) })) };
  assert.deepEqual(parseManualBoxMerges([over]), []);
  const conflicting = combineManualBoxes(boxes, [], keys(boxes)[0], keys(boxes)[3], "conflict")![0];
  const result = applyManualBoxMerges(boxes, [valid, conflicting]);
  assert.deepEqual([...result.activeIds], ["test"]);
  assert.deepEqual(ids(result.boxes).sort(), ids(boxes).sort());
});

test("manual packing dialog localizes controls and never starts with a preselected combination", () => {
  for (const { code } of LANGUAGE_OPTIONS) {
    for (const key of Object.keys(MANUAL_PACKING_COPY.ENG)) {
      assert.notEqual(copy(code, key), key, `${code}: ${key}`);
      assert.equal(copy(code, key), (MANUAL_PACKING_COPY[code] as Record<string, string>)[key]);
    }
    const html = renderToStaticMarkup(createElement(ManualBoxPacking, {
      boxes: makeBoxes(), merges: [], activeIds: new Set(), automatic: false,
      onUseManual() {}, onCombine: () => true, onSeparate() {}, onClose() {}, t: (key) => copy(code, key),
    }));
    assert.match(html, /role="dialog" aria-modal="true"/);
    assert.match(html, /disabled="" type="submit"/);
    assert.match(html, /role="status"/);
    assert.ok(html.includes(copy(code, "packing_destination")));
    assert.ok(html.includes(copy(code, "packing_source")));
    assert.doesNotMatch(html, /Box 2 · 30\/30/);
  }
});

test("dialog explains paused combinations and exposes independent separation controls", () => {
  const boxes = makeBoxes();
  const merges = combineManualBoxes(boxes, [], keys(boxes)[0], keys(boxes)[2], "test")!;
  const render = (automatic: boolean) => renderToStaticMarkup(createElement(ManualBoxPacking, {
    boxes, merges, activeIds: new Set(), automatic,
    onUseManual() {}, onCombine: () => true, onSeparate() {}, onClose() {}, t: (key) => copy("ENG", key),
  }));
  assert.match(render(true), /Use manual mode/);
  assert.match(render(true), /<select aria-label="Destination box" disabled="">/);
  assert.match(render(false), /Paused: boxes or filters changed/);
  assert.match(render(false), /aria-label="Separate boxes: Box 1 \+ Box 3"/);
});
