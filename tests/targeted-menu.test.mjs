import {test} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../scripts/targeted/special-attacks.js", import.meta.url), "utf8");
const targetedMain = fs.readFileSync(new URL("../scripts/targeted/main.js", import.meta.url), "utf8");
const styles = fs.readFileSync(new URL("../styles/targeted.css", import.meta.url), "utf8");

function menuRuntime() {
  const runnable = source
    .replace(/^(?:import .*?;\s*)+/u, "")
    .replace(/^export function /gm, "function ");
  const context = vm.createContext({
    foundry: {utils: {escapeHTML: value => String(value)}},
    console: {log() {}, debug() {}, warn() {}, error() {}},
    setTimeout, clearTimeout
  });
  vm.runInContext(`${runnable}\n__menu = {adjustedAttackBonus, attackOptionLabel, bindTargetedDialog, renderLocationOptions, getAttackActivities};`, context);
  return context.__menu;
}

function row(name, bonus, activityName = "") {
  return {item: {name}, activity: {name: activityName || name, labels: {toHit: bonus}}};
}

test("targeted dialog keeps a compact two-column layout despite standard-form CSS", () => {
  assert.match(styles, /\.tsa-dialog\s*\{[\s\S]*?display:\s*block/);
  assert.match(styles, /\.tsa-dialog \.tsa-grid\s*\{[\s\S]*?display:\s*grid\s*!important/);
  assert.match(styles, /grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
  assert.doesNotMatch(source, /<form class=["']tsa-dialog/);
  assert.match(source, /position:\s*\{\s*width:\s*1080\s*\}/);
  assert.match(targetedMain, /modules\/\$\{MODULE_ID\}\/styles\/targeted\.css/);
  assert.match(targetedMain, /ensureTargetedStyles\(\)/);
});

test("location selection updates every activity bonus without changing the native penalty path", () => {
  const menu = menuRuntime();
  const attacks = [row("Longsword", "+5", "Slash"), row("Bow", "3", "Shoot")];
  const options = attacks.map(() => ({textContent: ""}));
  const inputs = ["standard", "eyes", "arm"].map((value, index) => ({
    value,
    checked: index === 0,
    listeners: {},
    addEventListener(type, callback) { this.listeners[type] = callback; }
  }));
  const root = {
    dataset: {},
    matches(selector) { return selector === ".tsa-dialog"; },
    querySelector(selector) {
      if (selector === "select[name=attackIndex]") return {options};
      if (selector === "input[name=location]:checked") return inputs.find(input => input.checked);
      return null;
    },
    querySelectorAll(selector) {
      return selector === "input[name=location]" ? inputs : [];
    }
  };

  menu.bindTargetedDialog(root, attacks);
  assert.equal(options[0].textContent, "Longsword — Slash (+5)");
  assert.equal(options[1].textContent, "Bow — Shoot (3)");

  inputs[0].checked = false;
  inputs[1].checked = true;
  inputs[1].listeners.change();
  assert.equal(options[0].textContent, "Longsword — Slash (-1)");
  assert.equal(options[1].textContent, "Bow — Shoot (-3)");

  inputs[1].checked = false;
  inputs[2].checked = true;
  inputs[2].listeners.change();
  assert.equal(options[0].textContent, "Longsword — Slash (+2)");
  assert.equal(options[1].textContent, "Bow — Shoot (+0)");

  assert.equal(menu.adjustedAttackBonus({labels: {toHit: "1d20 + 5"}}, -6), "1d20 + 5 -6",
    "formula labels stay intact instead of being guessed as flat bonuses");
  assert.match(source, /rolls:\s*\[\{ parts:\s*\[penaltyPart\]/);
  assert.match(source, /rollNativeAttack\(selected\.activity, rule\.attack, rule\.label/);
});

test("targeted selection owns and cleans up the shared cursor", () => {
  assert.match(source, /import \{ startTargetCursor \} from "\.\.\/core\/targetCursor\.js"/);
  assert.match(source, /cursorCleanup:\s*startTargetCursor\(\)/);
  assert.match(source, /session\.cursorCleanup\?\.\(\)/);
});

test("every location describes hit, bloodied and critical effects from the current rules", () => {
 const html = menuRuntime().renderLocationOptions();
 assert.equal((html.match(/class="tsa-effect"/g) || []).length, 24);
 assert.match(html, /movement speed is reduced by half for 1 turn/);
 assert.match(html, /DC 16 Constitution/);
 assert.match(html, /Normal critical damage; no extra effect/);
 assert.match(html, /permanently Blinded/);
});

test("targeted menu includes only equipped weapons with attack activities", () => {
 const attack={type:"attack"};
 const item=(name,type,equipped,activities=[attack])=>({name,type,system:{equipped,activities}});
 const sword=item("Sword","weapon",true);
 const items=[sword,item("Stowed bow","weapon",false),item("Spell","spell",true),item("Feature","feat",true),item("No attacks","weapon",true,[])];
 const menu=menuRuntime();
 assert.deepEqual(Array.from(menu.getAttackActivities({items}),r=>r.item.name),["Sword"]);
 sword.system.equipped=false;
 assert.equal(menu.getAttackActivities({items}).length,0);
});
