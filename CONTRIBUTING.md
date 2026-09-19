# Contributing to V's Combat Suite

Thanks for improving V's Combat Suite. Keep changes focused, preserve the upstream notices, and separate automated evidence from live Foundry results in every change description.

## Architecture

The module is an unbundled Foundry package. `index.js` is the entry point and loads the three runtime layers in order:

| Area | Responsibility |
| --- | --- |
| `scripts/core/` | Shared HUD application, panels, movement, weapon sets, tooltips, target picker/cursor, settings, themes, and Foundry controls. |
| `scripts/dnd5e/` | D&D5E actor/item/activity adapter, panels, rituals, settings, and the optional Midi-QOL HUD workflow. |
| `scripts/targeted/` | Bundled Targeted Attacks, location rules, damage validation, GM coordination, and chat-card controls. |
| `templates/` | Handlebars application parts and D&D5E partials. |
| `styles/` | Core, D&D5E, Suite, and targeted stylesheets. |
| `languages/` | Localized labels, settings, and rules text. |
| `scripts/themes/`, `storage/themes/` | Built-in and saved theme data. |
| `tests/` | Node test-runner fixtures for startup, HUD actions, targeting, Midi routing, rituals, tooltips, packaging, and template compatibility. |

The JavaScript is readable source and is loaded directly by Foundry; there is no bundler or generated JavaScript directory. `ATTRIBUTION.md`, `LICENSE`, `licenses/argon-dnd5e-MIT.txt`, and the preserved `source-styles/` material document the upstream fork and licenses.

## Local checks

Run the module tests from this directory:

```sh
npm test
```

The test command uses Node's built-in runner with shared test isolation. The suite uses small Foundry and Midi-QOL fixtures to exercise behavior such as target UUID routing, one-time targeted modifiers, ritual slot handling, GM-only controls, hook cleanup, and package/resource consistency. Passing these tests does not prove a live world or multiplayer workflow.

The optional template probe exercises Foundry's Handlebars application parser against a local installation:

```sh
node tests/template-render-probe.cjs
```

Set `FOUNDRY_HANDLEBARS_MIXIN` to the local Foundry mixin file when the probe cannot find it automatically. This probe checks template acceptance only; it does not launch a world or verify combat.

From the repository root, the release packaging check is:

```sh
python tools/package.py
```

The packaging step validates the manifest and packaged resources, then writes `dist/module.json`, a versioned release ZIP, and `dist/SHA256SUMS.txt`. CI runs the Node test suite on Node 24 and the same Python packaging check, then stores the package artifact. Review the generated archive before publishing it.

## Making changes safely

- Keep the module ID `vs-combat-suite` and its namespace boundaries intact. Hook listeners, DOM identifiers, settings, chat flags, sockets, and custom elements must remain Suite-scoped.
- Prefer the native Foundry and D&D5E activity APIs. A HUD action should have one clear owner for use, roll, and damage; do not add a second native or Midi damage path.
- Keep Targeted Attacks' evidence and GM approval boundaries intact. Player-provided socket payloads must not approve damage or injury effects.
- Preserve cancellation behavior, target ownership checks, and cleanup in `finally` blocks for temporary hooks and workflows.
- Add or update a focused automated test for behavior changes. Update the README or changelog when a user-visible workflow or setting changes.
- Preserve Argon and D&D5E attribution, copyright notices, and license files. Do not replace upstream notices with a project-only notice.
- Keep release notes honest about what was tested. Label mock/fixture checks, static previews, source/API inspection, and live Foundry or multiplayer validation separately.

## Manual validation

Run this checklist in a disposable Foundry 14 D&D5E world with the supported system version. Record the Foundry, D&D5E, Midi-QOL, and other active module versions with the result.

1. Disable the original Argon CORE/DND5E pair and standalone V's Targeted Attacks. Enable only V's Combat Suite and reload the world.
2. As GM and player, open the HUD through an assigned character, an owned selected token, the Select Token tool, the control, and **Shift+A**. Confirm deselection, actor switching, combat start, Always On, scaling, and closing behave as expected.
3. Exercise a weapon, an unarmed attack, a multi-activity item, a save, a skill, a tool, a feature, a consumable, movement, weapon sets, Long Rest, Short Rest, and a supported zero-HP death save. Confirm native D&D5E dialogs and resource consumption occur once.
4. Test target selection with old targets present, the target picker enabled and disabled, cancellation, one target, multiple targets, and a self/template spell. Confirm the intended targets survive into native use.
5. Open **Rituals** on a caster with ritual spells at more than one level. Confirm groups are ordered by spell level, non-ritual spells are absent, native targeting still works, and a ritual does not consume a spell slot or advance world time.
6. Open Targeted Attack with equipped and unequipped weapons. Check every location or a representative set of Standard, Head, Arm, Torso, and Leg. Confirm the displayed penalty is applied once, the native damage flow is correct, and only a GM can apply injury effects.
7. With Midi-QOL enabled, reload the GM before players. Verify the intended Midi settings and the saved `midiAutomationBackup` values, then test a weapon/unarmed attack, attack spell, save spell, healing spell, ritual, and area/template spell. Check attack dialogs, hit/miss/critical paths, resistance, vulnerability, temporary HP, and exactly one HP update.
8. Test a player attacking an unowned target, a disconnected or replaced GM coordinator, and an interrupted damage card. Confirm the card is blocked for review rather than silently retried or applied twice.
9. Review the browser console and chat log for duplicate hooks, duplicate rolls, stale target state, or unexpected world-setting changes. Re-enable any intentionally disabled companion module only after checking for duplicate workflows.

If live validation is unavailable, say so explicitly. Automated tests and static previews are useful regression evidence but are not substitutes for this checklist.

## License

Contributions remain subject to the distribution's GPL-3.0 terms and the original D&D5E MIT component notice. Read [ATTRIBUTION.md](ATTRIBUTION.md) and [LICENSE](LICENSE) before submitting changes that copy or replace upstream material.

## Publishing a release

1. Update both `module.json` and `package.json` versions and add a changelog entry. Point `module.json.download` at the new version's ZIP under its `vVERSION` release tag. Keep `manifest` at the stable `releases/latest/download/module.json` URL.
2. Run `npm test` using Node 24 and `python tools/package.py` using Python 3. Check CI and record any live test results separately.
3. Commit the source and tag that commit `vVERSION`. Create a GitHub release for the tag; attach the three files in `dist/`. Mark the installable release as latest so the stable manifest URL resolves to it.
4. Fetch the public manifest without signing in, follow its download URL, and compare the ZIP/manifest to the attached checksums. Confirm `module.json` is inside the `vs-combat-suite/` folder in the ZIP.
5. Test installation/update from Foundry's Manifest URL field. Do not overwrite published version assets with different code; publish a new version.

Manifest installation does not register the module in Foundry's searchable package directory. That listing requires a separate package submission. See [Foundry's module development documentation](https://foundryvtt.com/article/module-development/) for the manifest/distribution contract.
