import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

test('target crosshair follows pointer coordinates and cleans up without touching a newer session',()=>{
  const nodes=[],listeners=new Set();
  const context=vm.createContext({document:{
    body:{appendChild:node=>nodes.push(node)},
    createElement:()=>({style:{},setAttribute(){},remove(){this.removed=true;}}),
    addEventListener:(name,fn)=>{assert.equal(name,'pointermove');listeners.add(fn);},
    removeEventListener:(_name,fn)=>listeners.delete(fn)
  }});
  vm.runInContext(fs.readFileSync(new URL('../scripts/core/targetCursor.js',import.meta.url),'utf8').replace('export function','function')+'\nglobalThis.start=startTargetCursor;',context);
  const first=context.start();
  [...listeners][0]({clientX:40,clientY:65});
  assert.equal(nodes[0].style.left,'40px');
  assert.equal(nodes[0].style.top,'65px');
  assert.equal(nodes[0].style.display,'block');
  const second=context.start();
  assert.equal(nodes[0].removed,true);
  first();
  assert.equal(nodes[1].removed,undefined);
  assert.equal(listeners.size,1);
  second();
  assert.equal(nodes[1].removed,true);
  assert.equal(listeners.size,0);
});
