import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../scripts/dnd5e/hud-damage.js',import.meta.url),'utf8').replace(/^export /gm,'');
function fixture(gm=true){
 const settings=new Map([['ConfigSettings',{autoCheckHit:'none',autoApplyDamage:'none',other:42}],['midiAutomationBackup',{}],['EnableWorkflow',true]]),hooks=new Map(),warnings=[];
 const context=vm.createContext({Set,console,game:{user:{isGM:gm},settings:{get:(_ns,key)=>settings.get(key),set:async(_ns,key,value)=>{settings.set(key,value);}}},foundry:{utils:{randomID:()=> 'nonce'}},ui:{notifications:{warn:t=>warnings.push(t),error:t=>warnings.push(t)}},Hooks:{on:(name,fn)=>{hooks.set(name,fn);return fn;},off:(name)=>hooks.delete(name)},MidiQOL:{}});
 vm.runInContext(source+'\nthis.api={ensureMidiAutomation,useMidiHudAttack};',context);return {context,settings,hooks,warnings,...context.api};
}
test('Midi automation saves prior values and enables hit checks/application without replacing unrelated settings',async()=>{
 const f=fixture();await f.ensureMidiAutomation();assert.equal(f.settings.get('ConfigSettings').autoCheckHit,'all');assert.equal(f.settings.get('ConfigSettings').autoApplyDamage,'yesCard');assert.equal(f.settings.get('ConfigSettings').other,42);assert.equal(f.settings.get('midiAutomationBackup').autoApplyDamage,'none');
 await f.ensureMidiAutomation();assert.equal(f.settings.get('midiAutomationBackup').autoApplyDamage,'none');
});
test('player cannot silently overwrite GM world settings',async()=>{const f=fixture(false);assert.equal(await f.ensureMidiAutomation(),false);assert.equal(f.settings.get('ConfigSettings').autoApplyDamage,'none');});
test('Midi owns one targeted workflow, keeps both roll dialogs, and scoped popup hooks are removed',async()=>{
 const f=fixture();let calls=0;
 f.context.MidiQOL.completeActivityUse=async(activity,usage,dialog,message)=>{
  calls++;assert.equal(usage.midiOptions.targetUuids[0],'Scene.s.Token.t');assert.equal(usage.midiOptions.workflowOptions.autoRollAttack,true);assert.equal(usage.midiOptions.workflowOptions.autoRollDamage,'onHit');assert.equal(usage.midiOptions.workflowOptions.fastForwardAttack,false);assert.equal(usage.midiOptions.workflowOptions.fastForwardDamage,false);assert.equal(usage.subsequentActions,undefined);assert.equal(message.create,undefined);
  const own={options:{}},other={options:{}};const fn=f.hooks.get('dnd5e.preRollAttack');fn({workflow:{activity:{uuid:'attack'}}},own);fn({subject:{uuid:'other'}},other);assert.equal(own.configure,true);assert.equal(own.options.position.left,200);assert.equal(other.configure,undefined);
  const notification={};f.hooks.get('preCreateChatMessage')({},message.data,notification);assert.equal(notification.notify,false);
  return {completed:true};
 };
 const result=await f.useMidiHudAttack({uuid:'attack'},{},{},{left:200,top:100},[{document:{uuid:'Scene.s.Token.t'}}]);assert.equal(result.completed,true);assert.equal(calls,1);assert.equal(f.hooks.size,0);
});
test('Midi failure cleans hooks without retrying or applying damage separately',async()=>{
 const f=fixture();f.context.MidiQOL.completeActivityUse=async()=>{throw new Error('failed');};
 await assert.rejects(f.useMidiHudAttack({uuid:'attack'},{},{},{},[{document:{uuid:'token'}}]),/failed/);assert.equal(f.hooks.size,0);
});

test('targeted penalty is applied once and typed damage is multiplied once before Midi application',async()=>{
 for(const formula of ['1d2','0']) {
  const f=fixture();
  f.context.Roll=class{constructor(formula){this.total=formula==='0'?0:2;}async evaluate(){return this;}async toMessage(){}};
  f.context.CONFIG={Dice:{DamageRoll:class{constructor(formula,data,options){this.total=Number(formula.match(/\(([^)]+)\)/)[1])*Number(formula.split('*')[1]);this.options=options;}async evaluate(){return this;}}}};
  f.context.MidiQOL.completeActivityUse=async(activity,usage)=>{
   const config={subject:activity,rolls:[{parts:['1d20','5']}]};
   const attackHook=f.hooks.get('dnd5e.preRollAttack');attackHook(config);attackHook(config);assert.deepEqual(config.rolls[0].parts,['1d20','5','-6']);
   const workflow={activity,workflowOptions:usage.midiOptions.workflowOptions,damageRolls:[{total:8,options:{type:'slashing',properties:['mgc']}}],bonusDamageRolls:[],async setDamageRolls(rolls){this.damageRolls=rolls;}};
   const damageHook=f.hooks.get('midi-qol.DamageRollComplete');await damageHook(workflow);await damageHook(workflow);
   assert.equal(workflow.damageRolls[0].total,formula==='0'?0:16);assert.equal(workflow.damageRolls[0].options.type,'slashing');assert.equal(workflow.damageRolls[0].options.properties[0],'mgc');return workflow;
  };
  await f.useMidiHudAttack({uuid:'attack'},{},{},{},[{document:{uuid:'token'}}],{label:'Head',attack:-6,damage:formula});assert.equal(f.hooks.size,0);
 }
});
test('Midi spells retain casting/ritual configuration and allow native self/template targeting',async()=>{
 const f=fixture();let calls=0;
 f.context.MidiQOL.completeActivityUse=async(activity,usage,dialog)=>{calls++;assert.equal(dialog.configure,true);assert.equal(usage.midiOptions.configureDialog,true);assert.equal(usage.consume.spellSlot,false);return {};};
 await f.useMidiHudAttack({uuid:'spell',item:{type:'spell'},target:{affects:{type:'self'}}},{consume:{spellSlot:false}},{},{},[]);
 assert.equal(calls,1);assert.equal(f.settings.get('ConfigSettings').autoCheckSaves,'allShow');assert.equal(f.settings.get('midiAutomationBackup').autoCheckSaves,null);
});
