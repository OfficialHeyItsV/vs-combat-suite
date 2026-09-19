const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const template = path.resolve(__dirname, '../templates/core-hud.hbs');
const mixin = process.env.FOUNDRY_HANDLEBARS_MIXIN || 'D:/Foundry/Foundry Virtual Tabletop/resources/app/client/applications/api/handlebars-application.mjs';
const page = `<!doctype html><title>Foundry template regression check</title><pre id="result">Running</pre><script type="module">
import mixin from '/mixin.mjs';
let html = '';
globalThis.foundry = {utils:{deepClone:(value)=>structuredClone(value)},applications:{handlebars:{renderTemplate:async()=>html}}};
class Base {_configureRenderOptions() {} get id(){return 'vcs-test';}}
class Probe extends mixin(Base) {static PARTS={content:{template:'core-hud.hbs',classes:[]}};}
const probe = new Probe(), options = {};
probe._configureRenderOptions(options);
const results = [];
try {await probe._renderHTML({},options); results.push('FAIL: empty template was accepted');}
catch(e){results.push(e.message.includes('must render a single HTML element') ? 'PASS: old empty template reproduces Foundry failure' : 'FAIL: '+e.message);}
html = (await (await fetch('/template')).text()).replace(/{{!--[\\s\\S]*?--}}/g,'');
try {const result=await probe._renderHTML({},options); results.push(result.content instanceof HTMLElement ? 'PASS: current template accepted by actual Foundry 14 parser' : 'FAIL: missing element');}
catch(e){results.push('FAIL: '+e.message);}
document.querySelector('#result').textContent=results.join('\\n');
</script>`;
http.createServer((req,res)=>{
 if(req.url==='/mixin.mjs'){res.setHeader('Content-Type','text/javascript');res.end(fs.readFileSync(mixin));}
 else if(req.url==='/template'){res.end(fs.readFileSync(template));}
 else {res.setHeader('Content-Type','text/html');res.end(page);}
}).listen(8769,'127.0.0.1');


