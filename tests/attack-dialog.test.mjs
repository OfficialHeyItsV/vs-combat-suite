import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../scripts/dnd5e/echDnd5e.js", import.meta.url), "utf8");

function loadButton(choose, targetSet = new Set([{actor:{uuid:"Actor.enemy",system:{attributes:{ac:{value:15}}}}}]), midi = null) {
  const start = source.indexOf("class DND5eItemButton");
  const end = source.indexOf("class DND5eButtonPanelButton");
  assert.ok(start >= 0 && end > start);

  class BaseItemButton {
    constructor({ item, isWeaponSet = false, isPrimary = false }) {
      this._item = item;
      this._isWeaponSet = isWeaponSet;
      this._isPrimary = isPrimary;
    }

    get actor() {
      return this._item?.item?.parent ?? this._item?.parent;
    }

    get parent() {
      return null;
    }

    get visible() {
      return Boolean(this._item);
    }

    async render() {
      return this;
    }
  }

  const context = vm.createContext({
    useMidiHudAttack: (...args) => midi(...args),
    dnd5e: choose ? {applications: {activity: {ActivityChoiceDialog: {create: choose}}}} : undefined,
    VCS: { MAIN: { BUTTONS: { ItemButton: BaseItemButton } } },
    DND5eReactionActionPanel: class {},
    actionTypes: { action: ["action"], bonus: ["bonus"], reaction: ["reaction"], free: ["special"] },
    ritualUseConfig: event => ({ event, legacy: false, consume: { spellSlot: false } }),
    game: { combat: null, user: {targets: targetSet}, modules: {get: id => id === "midi-qol" ? {active:Boolean(midi)} : undefined} },
    ui: { notifications: {warn() {}}, VCS: { components: { main: Array.from({length:4}, () => ({updateActionUse() {}})) }, updateItemButtons() {} } },
  });
  vm.runInContext(`${source.slice(start, end)}\nglobalThis.Button = DND5eItemButton;`, context);
  return context.Button;
}

function activity(type = "attack") {
  const item = {
    type: "weapon",
    parent: { items: [] },
    system: { activities: new Set() },
  };
  const value = {
    type,
    item,
    system: {},
    activation: { type: "action" },
    consumption: { targets: [] },
    async use() {
      return undefined;
    },
  };
  item.system.activities.add(value);
  return { item, value };
}

test("HUD attack buttons suppress only the usage dialog and delegate to native activity use", async () => {
  const Button = loadButton();
  const { value } = activity();
  const calls = [];
  value.use = async (...args) => {
    calls.push(args);
    return undefined;
  };
  const event = { type: "mouseup" };

  await new Button({ item: value })._onLeftClick(event);

  assert.equal(calls.length, 1);
  assert.equal(calls[0][0].event, event);
  assert.equal(calls[0][0].legacy, false);
  assert.equal(calls[0][1].event, event);
  assert.equal(calls[0][1].configure, false);
  assert.equal(calls[0][0].consume, undefined, "native consumption defaults remain enabled");
  assert.equal(calls[0][0].subsequentActions, false, "the automatic continuation is disabled to avoid duplicate rolls");
});

test("single-activity item attack buttons use the same native direct-roll path", async () => {
  const Button = loadButton();
  const { item, value } = activity();
  const calls = [];
  value.use = async (...args) => {
    calls.push(args);
    return undefined;
  };

  await new Button({ item })._onLeftClick({ type: "mouseup" });

  assert.equal(calls.length, 1);
  assert.equal(calls[0][1].configure, false);
});

test("non-attack and multi-activity item uses keep native usage configuration", async () => {
  const Button = loadButton();
  const utility = activity("utility");
  const utilityCalls = [];
  utility.value.use = async (...args) => {
    utilityCalls.push(args);
    return undefined;
  };
  await new Button({ item: utility.value })._onLeftClick({ type: "mouseup" });
  assert.equal("configure" in utilityCalls[0][1], false);

  const multi = activity();
  const second = { ...activity("utility").value, item: multi.item };
  multi.item.system.activities.add(second);
  const itemCalls = [];
  multi.item.use = async (...args) => {
    itemCalls.push(args);
    return undefined;
  };
  await new Button({ item: multi.item })._onLeftClick({ type: "mouseup" });
  assert.equal("configure" in itemCalls[0][1], false);
});

test("attack spells and rituals retain native usage choices", async () => {
 const Button=loadButton();
 for (const ritual of [false,true]) {
   const {item,value}=activity(); item.type="spell";
   let dialog;
   value.use=async (_usage,options)=>{dialog=options;};
   await new Button({item:value,ritual})._onLeftClick({type:"mouseup"});
   assert.equal(dialog.configure,undefined);
 }
});

test("unarmed chooser Attack opens native roll flow; Grapple/Shove and cancel stay native", async () => {
 for (const kind of ["attack","check","save",null]) {
  const {item,value}=activity(); value.canUse=true;
  const other={...activity("check").value,item,canUse:true};item.system.activities.add(other);
  let calls=0,configured;
  const chosen=kind ? {...value,type:kind,use:async (usage,dialog)=>{calls++;configured=dialog.configure;assert.equal(usage.consume,undefined);}} : null;
  const Button=loadButton(async actual=>{assert.equal(actual,item);return chosen;});
  await new Button({item})._onLeftClick({});
  assert.equal(calls,kind?1:0);
  assert.equal(configured,kind==="attack"?false:undefined);
 }
});

test("all natively classified unarmed attacks use the roll dialog regardless of name or item type", async () => {
 for (const name of ["Unarmed Strike","Lightning Fist","Renamed technique"]) {
  const {item,value}=activity();item.type="feat";item.name=name;
  value.attack={type:{classification:"unarmed"}};value.canUse=true;
  let calls=0;
  value.use=async (_usage,dialog)=>{calls++;assert.equal(dialog.configure,false);};
  await new (loadButton())({item:value})._onLeftClick({});
  item.system.activities.add({...activity("check").value,item,canUse:true});
  await new (loadButton(async ()=>value))({item})._onLeftClick({});
  assert.equal(calls,2);
 }
});

test("successful HUD use immediately opens exactly one native roll prompt with consumed resources", async () => {
 const Button=loadButton();const {item,value}=activity();value.id="attack";value.actor={id:"actor"};
 let rolls=0,cloned;
 const deltas={spent:1};
 const rollActivity={rollAttack:async (config,dialog,message)=>{rolls++;assert.equal(dialog.configure,true);assert.equal(message.data["flags.dnd5e.originatingMessage"],"usage-card");}};
 item.clone=(data)=>{cloned=data;return {system:{activities:new Map([["attack",rollActivity]])}};};
 value.createConsumedFlag=(actor,actual)=>{assert.equal(actor,value.actor);assert.equal(actual,deltas);return {resource:1};};
 value.use=async usage=>{if(usage.subsequentActions!==false) rolls++;return {message:{id:"usage-card",system:{deltas,scaling:2}}};};
 await new Button({item:value})._onLeftClick({});
 assert.equal(rolls,1);
 assert.equal(cloned["flags.dnd5e"].scaling,2);
 assert.equal(cloned["flags.dnd5e"].consumed.resource,1);
});

test("canceled HUD usage never opens an attack prompt", async () => {
 const Button=loadButton();const {value}=activity();let rolls=0;
 value.use=async ()=>undefined;value.rollAttack=async ()=>{rolls++;};
 await new Button({item:value})._onLeftClick({});assert.equal(rolls,0);
});

test("HUD roll is positioned near the cursor and creates no intermediate usage card", async () => {
 const Button=loadButton();const {item,value}=activity();value.id="attack";
 item.system.activities=new Map([[value.id,value]]);
 value.createConsumedFlag=()=>null;
 value.use=async (_usage,_dialog,message)=>{
   assert.equal(message.create,false);
   return {message:{system:{deltas:{}}}};
 };
 let opened=0;
 value.rollAttack=async (_config,dialog,message)=>{
   opened++;
   assert.equal(dialog.options.position.left,216);
   assert.equal(dialog.options.position.top,120);
   assert.equal(message.data["flags.dnd5e.originatingMessage"],undefined);
 };
 await Button.useHudAttack(value,{}, {clientX:200,clientY:200});
 assert.equal(opened,1);
});

test('native unarmed activity requires targeting even without legacy target metadata',()=>{
 const Button=loadButton();const {item,value}=activity();item.type='feat';value.attack={type:{classification:'unarmed'}};
 const button=new Button({item:value});assert.equal(button.requiresTargetSelection,true);assert.equal(button.targets,1);
});

test('HUD attack compares selected AC and prompts damage only on a hit, preserving target metadata', async()=>{
 for(const outcome of [{total:15},{total:14},{total:1,isCritical:true},{total:30,isFumble:true},null]){
  const set=new Set();const token={name:'Enemy',actor:{uuid:'Actor.enemy',system:{attributes:{ac:{value:15}}}},setTarget(on){if(on)set.add(this);}};set.add(token);
  const Button=loadButton(undefined,set);const {item,value}=activity();value.id='attack';item.system.activities=new Map([[value.id,value]]);value.createConsumedFlag=()=>null;
  value.use=async()=>{set.clear();return {message:{system:{}}};};
  let damage=0;
  value.rollAttack=async(config,dialog,message)=>{assert.equal(set.has(token),true);assert.equal(config.target,15);assert.equal(message.data['flags.dnd5e.targets'][0].ac,15);return outcome?[outcome]:null;};
  value.rollDamage=async(config,dialog,message)=>{damage++;assert.equal(config.isCritical,Boolean(outcome.isCritical));assert.equal(dialog.configure,true);assert.equal(message.data['flags.dnd5e.targets'][0].uuid,'Actor.enemy');};
  await Button.useHudAttack(value,{},{});
  assert.equal(damage,outcome&&!outcome.isFumble&&(outcome.isCritical||outcome.total>=15)?1:0);
 }
});
test('no target blocks HUD attack before resource consumption',async()=>{
 const Button=loadButton(undefined,new Set());const {value}=activity();let uses=0;value.use=async()=>{uses++;};
 await Button.useHudAttack(value,{},{});assert.equal(uses,0);
});

test('active Midi receives the selected tokens exactly once without parallel native rolls',async()=>{
 const token={document:{uuid:'Scene.test.Token.enemy'}};let calls=0;
 const {value}=activity();value.use=async()=>{throw new Error('native path must not run with Midi');};
 const Button=loadButton(undefined,new Set([token]),async(activity,usage,event,position,tokens)=>{calls++;assert.equal(activity,value);assert.equal(tokens[0],token);return {completed:true};});
 const result=await Button.useHudAttack(value,{},{});assert.equal(result.completed,true);assert.equal(calls,1);
});

test('HUD spell activities use Midi for attacks, saves, and healing while preserving rituals',async()=>{
 for(const type of ['attack','save','heal']) {
  const {item,value}=activity(type);item.type='spell';let calls=0;
  value.use=async()=>{throw new Error('No parallel native use');};
  const Button=loadButton(undefined,new Set(),async(selected,usage)=>{calls++;assert.equal(selected,value);assert.equal(usage.consume.spellSlot,false);});
  await new Button({item:value,ritual:true})._onLeftClick({});assert.equal(calls,1);
 }
});
