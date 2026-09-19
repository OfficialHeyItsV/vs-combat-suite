import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function fixture(saved={}) {
  const items=Array.from({length:4},(_,i)=>({id:String(i),uuid:`Item.${i}`,type:'weapon',system:{equipped:i<3}}));
  const updates=[];
  const merge=(a,b)=>{for(const [k,v] of Object.entries(b)){if(v&&typeof v==='object')a[k]=merge(a[k]??{},v);else a[k]=v;}return a;};
  const context=vm.createContext({
    VcsComponent:class{},MODULE_ID:'vs-combat-suite',Set,console,
    foundry:{utils:{mergeObject:merge,deepClone:structuredClone}},
    fromUuid:uuid=>items.find(i=>i.uuid===uuid)??null,
    game:{settings:{get:()=>true}},Hooks:{callAll(){}},getActivationType:()=> 'action'
  });
  const base=fs.readFileSync(new URL('../scripts/core/app/components/main/weaponSets.js',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'').replace(/^export /gm,'');
  vm.runInContext(base+'\nglobalThis.VCS={WeaponSets};',context);
  const adapter=fs.readFileSync(new URL('../scripts/dnd5e/echDnd5e.js',import.meta.url),'utf8');
  const code=adapter.slice(adapter.indexOf('class DND5eWeaponSets'),adapter.indexOf('const enableMacroPanel'));
  vm.runInContext(code+'\nglobalThis.Panel=DND5eWeaponSets;',context);
  const panel=new context.Panel();
  panel.actor={type:'character',items,flags:{},getFlag:()=>saved,updateEmbeddedDocuments:(_type,data)=>updates.push(...data)};
  return {panel,items,updates};
}

test('equipped character weapons fill primary/secondary slots; unequipped weapons stay out',async()=>{
  const f=fixture();
  const sets=await f.panel._getSets();
  assert.equal(sets[1].primary,f.items[0]);
  assert.equal(sets[1].secondary,f.items[1]);
  assert.equal(sets[2].primary,f.items[2]);
  assert.equal(sets[2].secondary,null);
  await f.panel.onSetChange({sets,active:'1'},{updateEquipment:false});
  assert.equal(f.updates.length,0,'displaying defaults never changes inventory');
  await f.panel.onSetChange({sets,active:'2'});
  assert.equal(f.updates.length,0,'switching automatic slots keeps other equipped weapons available');
});

test('manual assignments survive and empty slots auto-fill without duplicate weapons',async()=>{
  const f=fixture({1:{primary:'Item.2',secondary:null}});
  const sets=await f.panel._getSets();
  assert.equal(sets[1].primary,f.items[2]);
  assert.equal(sets[1].secondary,f.items[0]);
  assert.equal(sets[2].primary,f.items[1]);
  f.items[1].system.equipped=false;
  const changed=await f.panel._getSets();
  assert.equal(changed[2].primary,null);
});
