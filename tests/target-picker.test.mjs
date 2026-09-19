import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function fixture(type='weapon', picker=true) {
  const targets=new Set(), cleared=[], used=[], controls=[], hooks=new Map(), listeners=new Map();
  const element=()=>({style:{},classList:{add(){}},setAttribute(){},remove(){},appendChild(){}});
  const user={id:'player',targets};
  for(let i=0;i<2;i++) {
    const token={setTarget(value,options){assert.equal(value,false);assert.equal(options.releaseOthers,false);cleared.push(token);targets.delete(token);}};
    targets.add(token);
  }
  const context=vm.createContext({
    console, Set, Map, Array,
    VcsComponent:class {constructor(){this.element=element();}},
    game:{user,settings:{get:(_ns,key)=>key==='rangepicker'?picker:key==='targetPickerGuideShown'}},
    ui:{VCS:{addItemButtons(){}},controls:{activate:options=>controls.push(options)}},
    canvas:{scene:{dimensions:{distance:5}}},
    document:{createElement:element,body:{appendChild(){}},addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:name=>listeners.delete(name)},
    Hooks:{on:(name,fn)=>{hooks.set(name,fn);return fn;},off:name=>hooks.delete(name)}
  });
  const load=relative=>fs.readFileSync(new URL(relative,import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'').replace(/^export /gm,'');
  // Evaluate the actual runtime methods with DOM/Foundry boundaries stubbed.
  vm.runInContext(load('../scripts/core/targetCursor.js'),context);
  vm.runInContext(load('../scripts/core/app/targetPicker.js')+'\nglobalThis.TargetPicker=TargetPicker;',context);
  vm.runInContext(load('../scripts/core/app/components/main/buttons/itemButton.js')+'\nglobalThis.ItemButton=ItemButton;',context);
  const button=new context.ItemButton({item:{type}});
  Object.defineProperties(button,{
    targets:{get:()=>1},token:{get:()=>({document:{width:1,height:1}})}
  });
  button._onLeftClick=()=>used.push([...targets]);
  return {button,user,targets,cleared,used,controls,hooks,listeners};
}

for(const type of ['weapon','spell']) test(`${type} clears old targets before picking and preserves the new target for use`,async()=>{
  const f=fixture(type);
  const result=f.button._onPreLeftClick({});
  assert.equal(f.targets.size,0);
  assert.equal(f.cleared.length,2);
  assert.equal(f.used.length,0,'must await a fresh target');
  assert.equal(f.controls.at(-1).tool,'target');
  f.hooks.get('targetToken')({id:'other-player'},{},true);
  assert.equal(f.used.length,0);
  const fresh={id:'fresh'};
  f.targets.add(fresh);
  f.hooks.get('targetToken')(f.user,fresh,true);
  await result;
  assert.equal(f.used.length,1);
  assert.equal(f.used[0][0],fresh);
  assert.equal(f.controls.at(-1).tool,'select');
  assert.equal(f.listeners.has('pointermove'),false,'cursor listener cleaned up');
});

test('canceling target selection does not execute the attack',async()=>{
  const f=fixture();
  const result=f.button._onPreLeftClick({});
  f.listeners.get('mouseup')({which:3});
  await result;
  assert.equal(f.used.length,0);
});

test('weapon use clears targets even with the range picker disabled; features retain targets',async()=>{
  const weapon=fixture('weapon',false);
  await weapon.button._onPreLeftClick({});
  assert.equal(weapon.cleared.length,2);
  assert.equal(weapon.used[0].length,0);
  const feature=fixture('feat',false);
  await feature.button._onPreLeftClick({});
  assert.equal(feature.cleared.length,0);
  assert.equal(feature.used[0].length,2);
});

test('unarmed attacks wait for a fresh target even when the optional range picker is disabled',async()=>{
 const f=fixture('feat',false);
 Object.defineProperty(f.button,'requiresTargetSelection',{value:true});
 const pending=f.button._onPreLeftClick({});
 assert.equal(f.targets.size,0);assert.equal(f.used.length,0);
 const creature={id:'enemy'};f.targets.add(creature);f.hooks.get('targetToken')(f.user,creature,true);
 await pending;assert.equal(f.used.length,1);assert.equal(f.used[0][0],creature);assert.equal(f.targets.has(creature),true);
});
