"""Validate and package the editable module source using only Python's standard library."""
import hashlib
import json
from pathlib import Path
import shutil
import zipfile

root = Path(__file__).resolve().parents[1]
manifest = json.loads((root / 'module.json').read_text(encoding='utf-8-sig'))
package = json.loads((root / 'package.json').read_text(encoding='utf-8-sig'))
assert manifest['id'] == 'vs-combat-suite'
assert manifest['version'] == package['version'], 'Version mismatch'
version = manifest['version']
repo = 'https://github.com/OfficialHeyItsV/vs-combat-suite'
assert manifest['manifest'] == f'{repo}/releases/latest/download/module.json'
assert manifest['download'] == f'{repo}/releases/download/v{version}/vs-combat-suite-v{version}.zip'
for path in manifest['esmodules'] + manifest['styles'] + [x['path'] for x in manifest['languages']] + [manifest['license']]:
    assert (root / path).is_file(), f'Missing manifest entry: {path}'
folders = ['scripts', 'templates', 'styles', 'icons', 'languages', 'licenses', 'source-styles', 'storage']
files = [root / name for name in ['module.json', 'index.js', 'LICENSE', 'ATTRIBUTION.md', 'README.md', 'CHANGELOG.md']]
for folder in folders:
    files.extend(p for p in (root / folder).rglob('*') if p.is_file())
dist = root / 'dist'
dist.mkdir(exist_ok=True)
archive = dist / f'vs-combat-suite-v{version}.zip'
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as z:
    for path in sorted(files):
        z.write(path, f"vs-combat-suite/{path.relative_to(root).as_posix()}")
with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None
    assert json.loads(z.read('vs-combat-suite/module.json')) == manifest
shutil.copyfile(root / 'module.json', dist / 'module.json')
(dist / 'SHA256SUMS.txt').write_text(''.join(f'{hashlib.sha256(p.read_bytes()).hexdigest()}  {p.name}\n' for p in [archive, dist / 'module.json']), encoding='utf-8')
print(f'Validated {manifest["id"]} {version}; packaged {len(files)} files into {archive.name}')
