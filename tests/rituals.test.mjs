import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { getRitualSpells, isRitualSpell, ritualUseConfig } from "../scripts/dnd5e/rituals.js";

const source = fs.readFileSync(new URL("../scripts/dnd5e/echDnd5e.js", import.meta.url), "utf8");

test("ritual helper recognizes D&D5E properties and limits the HUD list to ritual spells", () => {
  const ritual = { type: "spell", system: { properties: new Set(["ritual"]) } };
  const normal = { type: "spell", system: { properties: new Set(["concentration"]) } };
  const feat = { type: "feat", system: { properties: ["ritual"] } };
  assert.equal(isRitualSpell(ritual), true);
  assert.equal(isRitualSpell(normal), false);
  assert.equal(isRitualSpell(feat), false);
  assert.deepEqual(getRitualSpells([normal, ritual, feat]), [ritual]);
  assert.deepEqual(getRitualSpells(new Set([ritual])), [ritual]);
});

test("action panel exposes a ritual tab only when ritual spells exist", async () => {
  const start = source.indexOf("class DND5eActionActionPanel");
  const end = source.indexOf("class DND5eBonusActionPanel");
  assert.ok(start >= 0 && end > start);
  const code = `${source.slice(start, end)}\nglobalThis.Panel = DND5eActionActionPanel;`;
  class ActionPanel {}
  class ItemButton {
    constructor(options) { Object.assign(this, options); }
    get hasContents() { return Boolean(this.item); }
  }
  class PanelButton {
    constructor(options) { Object.assign(this, options); }
    get hasContents() { return this.items?.length > 0; }
  }
  class SplitButton { constructor(button1, button2) { this.button1 = button1; this.button2 = button2; } }
  const context = vm.createContext({
    VCS: { MAIN: { ActionPanel, BUTTONS: { ItemButton, SplitButton } } },
    CoreHUD: { DND5E: { mainBarFeatures: [] } },
    DND5eItemButton: ItemButton,
    DND5eButtonPanelButton: PanelButton,
    DND5eSpecialActionButton: class {},
    MODULE_ID: "vs-combat-suite",
    ECHItems: Object.fromEntries(Array.from({ length: 6 }, (_, i) => [`action-${i}`, { name: `Action ${i}` }])),
    itemTypes: { spell: ["spell"], feat: ["feat"], consumable: ["consumable"] },
    actionTypes: { action: ["action"], bonus: ["bonus"], reaction: ["reaction"], free: ["special"] },
    getActivationType: item => item.activationType,
    expandActivities: items => items,
    condenseItemButtons: items => items,
    getRitualSpells,
    getMidiFlag: () => null,
    game: { settings: { get: () => true } },
  });
  vm.runInContext(code, context);
  const ritual = { type: "spell", activationType: "minute", system: { properties: new Set(["ritual"]) } };
  const normal = { type: "spell", activationType: "action", system: { properties: new Set() } };
  const panel = new context.Panel();
  panel.actor = { items: [normal] };
  assert.equal((await panel._getButtons()).some(button => button.type === "ritual"), false);
  panel.actor = { items: [normal, ritual] };
  const ritualButton = (await panel._getButtons()).find(button => button.type === "ritual");
  assert.ok(ritualButton);
  assert.deepEqual(ritualButton.items, [ritual]);
});

test("ritual clicks use native activity consumption with only spell-slot spending disabled", async () => {
  const start = source.indexOf("class DND5eItemButton");
  const end = source.indexOf("class DND5eButtonPanelButton");
  assert.ok(start >= 0 && end > start);
  const code = `${source.slice(start, end)}\nglobalThis.Button = DND5eItemButton;`;
  class BaseItemButton {
    constructor({ item, isWeaponSet = false, isPrimary = false }) {
      this._item = item;
      this._isWeaponSet = isWeaponSet;
      this._isPrimary = isPrimary;
    }
    get actor() { return this._item?.parent; }
    get parent() { return null; }
    get visible() { return Boolean(this._item); }
    async render() { return this; }
  }
  const context = vm.createContext({
    VCS: { MAIN: { BUTTONS: { ItemButton: BaseItemButton } } },
    DND5eReactionActionPanel: class {},
    actionTypes: { action: ["action"], bonus: ["bonus"], reaction: ["reaction"], free: ["special"] },
    ritualUseConfig,
    game: { combat: null },
    ui: { VCS: { components: { main: [{}, {}, {}, {}] }, updateItemButtons() {} } },
  });
  vm.runInContext(code, context);
  const event = { type: "click" };
  const actor = { items: [] };
  let normalConfig;
  const normal = {
    type: "spell", parent: actor, system: {},
    async use(usage) { normalConfig = usage; return true; },
  };
  await new context.Button({ item: normal })._onLeftClick(event);
  assert.equal(normalConfig.event, event);
  assert.equal(normalConfig.legacy, false);

  let ritualConfig;
  const activity = {
    item: null,
    activation: { type: "none" },
    consumption: { targets: [] },
    async use(usage) { ritualConfig = usage; return true; },
  };
  const ritual = {
    type: "spell", parent: actor,
    system: { properties: new Set(["ritual"]), activities: new Map([["cast", activity]]) },
    async use(usage) { ritualConfig = usage; return true; },
  };
  activity.item = ritual;
  const ritualButton = new context.Button({ item: ritual, ritual: true });
  assert.equal(ritualButton.isActivity, false);
  await ritualButton._onLeftClick(event);
  assert.equal(ritualConfig.event, event);
  assert.equal(ritualConfig.legacy, false);
  assert.deepEqual({ ...ritualConfig.consume }, { spellSlot: false });
});
