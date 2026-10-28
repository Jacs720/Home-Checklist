import assert from "node:assert/strict";
import test from "node:test";
import { parseGoPage, parseGoSection, wikiTemplates } from "../scripts/go-availability-parser.mjs";

test("GO source parsing retains terminal date fields and nested links without inventing releases", () => {
  const text = "{{Trivia/Release|November|23|2016}}\n{{Trivia/Shiny Release|February|20|2021|[[Event|display text]]}}\n{{AvailabilityTable\n|w=t\n|sr=[[Research|Quest]]\n}}";
  assert.equal(wikiTemplates(text, "Trivia/Release")[0][3], "2016");
  assert.deepEqual(parseGoSection(text, "2026-10-28"), { release: "released", shiny: "released", releaseDate: "2016-11-23", shinyDate: "2021-02-20", methods: ["wild", "research"] });
  assert.equal(parseGoSection("{{Trivia/Release|November|6|2026}}", "2026-10-28").release, "unreleased");
  assert.equal(parseGoSection("{{Trivia/Unreleased}}", "2026-10-28").shiny, "unreleased");
  assert.equal(parseGoSection("No structured release evidence", "2026-10-28").release, "unknown");
});

test("GO source parsing keeps form-specific release and Shiny evidence separate", () => {
  const page = { title: "Example", revisions: [{ revid: 12, slots: { main: { content: "==Availability==\n===Normal Example===\n{{Trivia/Release|January|1|2020}}\n{{Trivia/Shiny Release|the same day}}\n{{AvailabilityTable|r=t}}\n===Other Example===\n{{Trivia/Unreleased|Other Example}}\n==Gallery==\n{{Trivia/Shiny Release|January|1|2019}}" } } }] };
  const fact = parseGoPage(page, "2026-10-28");
  assert.equal(fact.forms.length, 2);
  assert.equal(fact.forms[0].shinyDate, "2020-01-01");
  assert.equal(fact.forms[1].release, "unreleased");
  assert.equal(fact.forms[1].shiny, "unreleased");
});
