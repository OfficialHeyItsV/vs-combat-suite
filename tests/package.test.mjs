import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
function walk(dir) {
  return fs.readdirSync(dir, {withFileTypes:true}).flatMap(e => e.isDirectory() ? walk(path.join(dir,e.name)) : [path.join(dir,e.name)]);
}
test('manifest installs a self-contained DND5E module', () => {
  const m = JSON.parse(fs.readFileSync(path.join(root,'module.json')));
  assert.equal(m.id,'vs-combat-suite');
  assert.equal(m.title,"V's Combat Suite");
  assert.equal(m.version,JSON.parse(fs.readFileSync(path.join(root,'package.json'))).version);
  assert.equal(m.relationships.systems[0].id,'dnd5e');
  assert.equal(m.socket,true,'Built-in player damage requires the suite socket');
  assert.ok(m.styles.includes('styles/targeted.css'));
  assert.ok(!(m.relationships.requires ?? []).some(r => r.id.includes('enhancedcombathud')));
  for(const p of [...(m.esmodules??[]),...(m.scripts??[]),...(m.styles??[]),...(m.languages??[]).map(l=>l.path)]) {
    assert.ok(fs.existsSync(path.join(root,p)),`Missing manifest resource: ${p}`);
  }
});
test('every runtime import resolves locally without a bundler', () => {
  const files = [path.join(root,'index.js'), ...walk(path.join(root,'scripts')).filter(p=>/\.m?js$/.test(p))];
  for(const file of files) {
    const code = fs.readFileSync(file,'utf8');
    for(const match of code.matchAll(/(?:import\s+(?:[^;\n]*?\s+from\s+)?|export\s+[^;\n]*?\s+from\s+)["']([^"']+)["']/g)) {
      assert.ok(match[1].startsWith('.'),`Non-local import ${match[1]} in ${file}`);
      assert.ok(fs.existsSync(path.resolve(path.dirname(file),match[1])),`Missing import ${match[1]} in ${file}`);
    }
    assert.doesNotMatch(code,/\b(?:ui|CONFIG)\.ARGON\b/,`Shared upstream API in ${file}`);
    assert.doesNotMatch(code,/modules\/enhancedcombathud/,`Upstream asset dependency in ${file}`);
  }
});
test('literal module resource links resolve inside the package', () => {
  for(const file of walk(root).filter(p=>/\.(?:m?js|hbs|css)$/.test(p)&&!p.includes(`${path.sep}tests${path.sep}`)&&!p.includes(`${path.sep}source-styles${path.sep}`))) {
    const code = fs.readFileSync(file,'utf8').replace(/^\s*\/\/.*$/gm,'');
    for(const [,p] of code.matchAll(/modules\/vs-combat-suite\/([^\s"'`<>)}]+\.(?:hbs|webp|png|svg|json|css))/g)) {
      if(p.includes('${')) continue;
      assert.ok(fs.existsSync(path.join(root,p)),`Missing asset ${p} referenced in ${file}`);
    }
  }
});
test('licenses and corresponding source accompany the fork', () => {
  for(const p of ['LICENSE','licenses/argon-dnd5e-MIT.txt','ATTRIBUTION.md','source-styles/module.scss','scripts/core/main.js','scripts/dnd5e/main.js']) assert.ok(fs.existsSync(path.join(root,p)),p);
});
