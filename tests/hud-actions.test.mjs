import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function portrait(actor) {
  const source=fs.readFileSync(new URL('../scripts/dnd5e/echDnd5e.js',import.meta.url),'utf8');
  const code=source.slice(source.indexOf('class DND5ePortraitPanel'),source.indexOf('class DND5eDrawerButton'));
  const context=vm.createContext({VCS:{PORTRAIT:{PortraitPanel:class{}}}});
  vm.runInContext(code+'\nglobalThis.Panel=DND5ePortraitPanel;',context);
  const panel=new context.Panel();
  panel.actor=actor;
  return panel;
}
const click=()=>({preventDefault(){},stopPropagation(){}});

test('zero-HP skull delegates to native death saves and prevents concurrent duplicate rolls',async()=>{
  let resolve, calls=0;
  const event=click();
  const actor={isOwner:true,system:{attributes:{hp:{value:0},death:{success:0,failure:0}}},
    rollDeathSave(options){calls++;assert.equal(options.event,event);assert.equal(options.legacy,false);return new Promise(r=>resolve=r);}};
  const panel=portrait(actor);
  assert.equal(panel.canRollDeathSave,true);
  const pending=panel._onDeathSave(event);
  await panel._onDeathSave(event);
  assert.equal(calls,1);
  resolve('native-roll');
  assert.equal(await pending,'native-roll');
  assert.equal(panel._rollingDeathSave,false);
});

test('skull does not roll for healthy, unowned, or unsupported actors',async()=>{
  for(const variant of ['healthy','unowned','unsupported']) {
    let calls=0;
    const actor={isOwner:variant!=='unowned',system:{attributes:{hp:{value:variant==='healthy'?5:0},death:{}}},rollDeathSave(){calls++;}};
    if(variant==='unsupported') delete actor.system.attributes.death;
    const panel=portrait(actor);
    assert.equal(panel.canRollDeathSave,false,variant);
    await panel._onDeathSave(click());
    assert.equal(calls,0,variant);
  }
});

function hud({isGM=false,alwaysOn=false,character=null,controlled=[],ready=true}={}) {
  const source=fs.readFileSync(new URL('../scripts/core/app/CoreHud.js',import.meta.url),'utf8')
    .replace(/^import .*;\r?\n/gm,'').replace(/^export /gm,'');
  const bindings=[];
  const context=vm.createContext({
    HandlebarsApplication:class{},WeaponSets:class{},MovementHud:class{},Tooltip:class{},
    game:{activeTool:'select',user:{isGM,character},settings:{get:()=>alwaysOn}},
    canvas:{ready,tokens:{controlled}},setTimeout:fn=>fn()
  });
  vm.runInContext(source+'\nglobalThis.Hud=CoreHud;',context);
  const instance=Object.create(context.Hud.prototype);
  instance._target=null;
  instance.bind=target=>{bindings.push(target);instance._target=target;};
  return {instance,bindings};
}

test('players automatically use selected owned tokens or their assigned character',()=>{
  const character={isOwner:true},token={actor:{isOwner:true}};
  const selected=hud({character,controlled:[token]});
  selected.instance.openPreferredActor();
  assert.equal(selected.bindings[0],token);
  const assigned=hud({character});
  assigned.instance.openPreferredActor();
  assert.equal(assigned.bindings[0],character);
  const loading=hud({character,controlled:[token],ready:false});
  loading.instance.openPreferredActor();
  assert.equal(loading.bindings[0],character);
});

test('player selection opens the HUD and deselection falls back to their character',()=>{
  const character={isOwner:true},token={actor:{isOwner:true}};
  const f=hud({character});
  f.instance._onControlToken(token,true);
  assert.equal(f.bindings[0],token);
  f.instance._onControlToken(token,false);
  assert.equal(f.bindings[1],character);
});

test('automatic opening respects ownership and GM opt-in',()=>{
  const character={isOwner:true};
  const gm=hud({isGM:true,character});
  gm.instance.openPreferredActor();
  assert.equal(gm.bindings.length,0);
  const optedIn=hud({isGM:true,alwaysOn:true,character});
  optedIn.instance.openPreferredActor();
  assert.equal(optedIn.bindings[0],character);
  const missing=hud({character:{isOwner:false},controlled:[{actor:{isOwner:false}}]});
  missing.instance.openPreferredActor();
  assert.equal(missing.bindings.length,0);
});

test('selecting an owned token opens the HUD for a GM without Always On',()=>{
  const token={actor:{isOwner:true}};
  const f=hud({isGM:true});
  f.instance._onControlToken(token,true);
  assert.equal(f.bindings[0],token);
});
