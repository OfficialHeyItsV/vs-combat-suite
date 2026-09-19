import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../scripts/core/app/components/component.js',import.meta.url),'utf8');
const method=source.slice(source.indexOf('    async _onTooltipMouseEnter('),source.indexOf('    async _onTooltipMouseLeave('));
test('highlighted feature replaces the description without a hover timer',async()=>{
 let rendered=0;
 const context=vm.createContext({ui:{VCS:{_tooltip:{_triggerElement:{}}}},setTimeout:()=>{throw new Error('No hover delay expected');}});
 const handler=vm.runInContext('({'+method+'})._onTooltipMouseEnter',context);
 const component={element:{matches:()=>true},getTooltipData:async()=>({description:'text'}),tooltipCls:class{render(){rendered++;}}};
 await handler.call(component,{});assert.equal(rendered,1);
});
test('description fetched after pointer leaves cannot replace current popup',async()=>{
 let resolveData,rendered=0,hovered=true;
 const context=vm.createContext({ui:{VCS:{_tooltip:null}},setTimeout});
 const handler=vm.runInContext('({'+method+'})._onTooltipMouseEnter',context);
 const component={element:{matches:()=>hovered},getTooltipData:()=>new Promise(resolve=>resolveData=resolve),tooltipCls:class{render(){rendered++;}}};
 const request=handler.call(component,{});hovered=false;resolveData({});await request;assert.equal(rendered,0);
});
