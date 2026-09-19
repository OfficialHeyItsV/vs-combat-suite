import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// Exercises the actual entry modules with minimal Foundry boundaries. Does not
// simulate a rendered world, native DND5E activity execution, or multiplayer.
test('boots independently and registers DND5E controls without Argon', async () => {
  const hooks = new Map(), settings = new Map(), bindings = new Map(), tags = new Map();
  const socketChannels = [];
  const merge = (a={},b={}) => {
    for(const [k,v] of Object.entries(b)) a[k] = v && typeof v==='object' && !Array.isArray(v) ? merge({...a[k]},v) : v;
    return a;
  };
  const flatten = (o,p='',r={}) => {
    for(const [k,v] of Object.entries(o??{})) {
      const key=p?`${p}.${k}`:k;
      if(v&&typeof v==='object'&&!Array.isArray(v)) flatten(v,key,r); else r[key]=v;
    } return r;
  };
  const element = () => ({style:{setProperty(){}},classList:{add(){},remove(){},toggle(){},contains(){return false;}},addEventListener(){},querySelectorAll(){return[];},querySelector(){return null;}});
  class Application {
    static DEFAULT_OPTIONS = {window:{}};
    constructor(){this.options=this.constructor.DEFAULT_OPTIONS;this.element=element();}
  }
  globalThis.Hooks = {
    on(n,f){if(!hooks.has(n))hooks.set(n,[]);hooks.get(n).push(f);return f;},
    once(n,f){return this.on(n,f);}, off(){},
    callAll(n,...args){for(const fn of hooks.get(n)??[])fn(...args);}
  };
  globalThis.document = {documentElement:element(),body:element(),createElement:element,addEventListener(){}};
  globalThis.window = {customElements:{define(n,c){assert.ok(!tags.has(n));tags.set(n,c);},get(n){return tags.get(n);}},addEventListener(){},innerHeight:1080,innerWidth:1920};
  globalThis.customElements=window.customElements;
  globalThis.Handlebars={registerHelper(){}};
  globalThis.CONFIG = {DND5E:{},Canvas:{}};
  globalThis.ui={notifications:{error(message){throw new Error(message);},warn(){},info(){}}};
  globalThis.foundry = {
    applications:{api:{ApplicationV2:Application,HandlebarsApplicationMixin:C=>C},elements:{AbstractFormInputElement:class{}}},
    helpers:{interaction:{KeyboardManager:{MODIFIER_KEYS:{SHIFT:'Shift',CONTROL:'Control',ALT:'Alt'}},TooltipManager:{TOOLTIP_DIRECTIONS:{}}}},
    canvas:{placeables:{Token:class{}}},
    utils:{mergeObject:(a,b,options)=>merge(options?.inplace===false?merge({},a):a,b),deepClone:o=>merge({},o),duplicate:o=>merge({},o),debounce:f=>f,flattenObject:flatten}
  };
  globalThis.game={system:{id:'dnd5e'},user:{id:'gm',isGM:true},modules:new Map([['vs-combat-suite',{active:true}]]),
    i18n:{localize:s=>s,format:s=>s},settings:{
      register(ns,key,data){assert.equal(ns,'vs-combat-suite');assert.ok(!settings.has(key),`Duplicate setting ${key}`);settings.set(key,data.default);},
      registerMenu(ns){assert.equal(ns,'vs-combat-suite');},
      get(ns,key){assert.equal(ns,'vs-combat-suite');assert.ok(settings.has(key),`Unregistered setting ${key}`);return settings.get(key);},
      set(ns,key,v){settings.set(key,v);}
    },socket:{on(channel){socketChannels.push(channel);}},keybindings:{register(ns,key,data){assert.equal(ns,'vs-combat-suite');bindings.set(key,data);}}
  };
  await import('../index.js');
  for(const fn of hooks.get('init')??[]) await fn();
  const CoreHud = CONFIG.VCS.CORE.CoreHud;
  let ButtonHudClass;
  const originalDefineButtonHud = CoreHud.defineButtonHud;
  CoreHud.defineButtonHud = function(buttonHud) {
    ButtonHudClass = buttonHud;
    return originalDefineButtonHud.call(this, buttonHud);
  };
  try {
    for(const fn of hooks.get('setup')??[]) await fn();
    for(const fn of hooks.get('ready')??[]) await fn();
  } finally {
    CoreHud.defineButtonHud = originalDefineButtonHud;
  }
  assert.ok(ui.VCS,'Suite HUD was created');
  assert.equal(ui.ARGON,undefined);
  assert.equal(CONFIG.ARGON,undefined);
  assert.ok(CONFIG.VCS,'Suite API exists');
  assert.ok(bindings.has('toggleHud'));
  assert.ok(settings.has('explodeItemActivities'),'DND5E settings registered');
  assert.ok(settings.has('autoApplyPlayerDamage'),'Bundled targeted settings registered under suite namespace');
  assert.deepEqual(socketChannels,['module.vs-combat-suite'],'Bundled targeted socket uses suite namespace');
  assert.equal(typeof globalThis.TargetedSpecialAttacks?.open,'function','Bundled targeted API is ready');
  assert.ok(hooks.has('vcsInit'),'DND5E adapter connected to suite lifecycle');
  assert.ok(tags.has('vcs-alpha-color-picker'),'Own custom element registered');
  assert.ok(ButtonHudClass,'DND5E button HUD registered during setup');

  const actor = {isOwner:true,longRest(){},shortRest(){}};
  ui.VCS._actor = actor;
  const buttonHud = new ButtonHudClass();
  game.combat = {started:false};
  delete globalThis.TargetedSpecialAttacks;
  assert.equal(buttonHud.visible,true,'rest HUD remains visible without optional API');
  assert.deepEqual((await buttonHud._getButtons()).map(button => button.label), [
    'DND5E.REST.Long.Label',
    'DND5E.REST.Short.Label',
  ]);

  let targetedCalls = 0;
  globalThis.TargetedSpecialAttacks = {
    open(receivedActor) {
      targetedCalls += 1;
      assert.equal(receivedActor,actor);
    },
  };
  const outOfCombatButtons = await buttonHud._getButtons();
  assert.equal(outOfCombatButtons.length,3,'optional targeted action joins rest actions outside combat');
  const targetedButton = outOfCombatButtons.find(button => button.label === 'vs-combat-suite-dnd5e.hud.targetedAttack.name');
  await targetedButton.onClick();
  assert.equal(targetedCalls,1,'targeted action forwards the owned actor');

  game.combat.started = true;
  assert.equal(buttonHud.visible,true,'targeted HUD remains available during combat');
  assert.deepEqual((await buttonHud._getButtons()).map(button => button.label), [
    'vs-combat-suite-dnd5e.hud.targetedAttack.name',
  ],'rest actions are omitted during combat');
  actor.isOwner = false;
  assert.equal(buttonHud.visible,false,'targeted HUD hides for an unowned actor');
  assert.deepEqual(await buttonHud._getButtons(),[],'unowned actor cannot expose targeted action');
  actor.isOwner = true;
  delete globalThis.TargetedSpecialAttacks;
  assert.equal(buttonHud.visible,false,'targeted HUD hides when optional API is unavailable in combat');
  assert.deepEqual(await buttonHud._getButtons(),[],'missing optional API leaves no combat buttons');
  await targetedButton.onClick();
  assert.equal(targetedCalls,1,'stale targeted button does not call a removed API');
  game.combat.started = false;
  assert.equal(buttonHud.visible,true,'rest HUD returns outside combat when optional API is absent');
  assert.equal((await buttonHud._getButtons()).length,2);

  const controls={tokens:{tools:{}}};
  Hooks.callAll('getSceneControlButtons',controls);
  assert.ok(controls.tokens.tools.vcsToggle,'Independent scene control');
  assert.equal(controls.tokens.tools.echtoggle,undefined);
  const tokenEvents=new Map(),clicked=[];
  const token={actor:{isOwner:true},on:(name,fn)=>tokenEvents.set(name,fn),off:name=>tokenEvents.delete(name)};
  const originalBind=ui.VCS.bind;
  ui.VCS.bind=value=>clicked.push(value);
  game.activeTool='select';
  Hooks.callAll('drawToken',token);
  Hooks.callAll('drawToken',token);
  tokenEvents.clear(); // Native mouse-manager activation after the draw hook.
  await Promise.resolve();
  assert.equal(tokenEvents.size,1,'redraw does not duplicate token click handlers');
  tokenEvents.get('pointertap')({button:0});
  assert.equal(clicked[0],token,'clicking an already selected token reopens the HUD');
  game.activeTool='target';
  tokenEvents.get('pointertap')({button:0});
  assert.equal(clicked.length,1,'target mode does not switch the HUD actor');
  game.activeTool='select';
  token.actor.isOwner=false;
  tokenEvents.get('pointertap')({button:0});
  assert.equal(clicked.length,1,'unowned tokens do not open');
  ui.VCS.bind=originalBind;
  const seen=new Set();
  function checkTemplates(group) {
    for(const value of Object.values(group)) {
      if(seen.has(value)) continue;
      seen.add(value);
      if(value&&typeof value==='object') checkTemplates(value);
      else if(typeof value==='function'&&value.prototype) {
        if(value.name==='VcsComponent') continue;
        const instance=Object.create(value.prototype);
        if(!('template' in instance)) continue;
        const template=instance.template;
        if(typeof template!=='string') continue;
        assert.ok(template.startsWith('modules/vs-combat-suite/'),template);
        assert.ok(fs.existsSync(new URL('../'+template.slice('modules/vs-combat-suite/'.length),import.meta.url)),`Missing dynamic template ${template}`);
      }
    }
  }
  checkTemplates(CONFIG.VCS);
});
