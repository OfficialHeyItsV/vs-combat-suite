# Changelog

Release notes for V's Combat Suite. The v0.3.18 entry is the initial public release and consolidates the v0.3.17 release line.

## [0.3.18] — 2026-09-19

### Initial public release

- Combined the standalone Argon CORE workflow, D&D5E adapter, redesigned Suite theme, and bundled V's Targeted Attacks into one module.
- Added automatic HUD opening for an assigned character or selected owned token, owned-token opening in Select Token mode, the **Shift+A** toggle, weapon sets, movement and combat controls, rest actions, native death saves, tooltips, and configurable client/world presentation settings.
- Added native D&D5E activity handling for weapons, unarmed attacks, multi-activity choices, spells, saves, healing, features, consumables, and target selection.
- Added a Rituals panel grouped by spell level. Ritual casting uses native activity rules while suppressing spell-slot consumption and does not advance world time automatically.
- Bundled Targeted Attacks with equipped-weapon filtering, Standard/Eyes/Head/Arm/Object/Torso/Groin/Leg locations, displayed effect descriptions, native attack penalties, typed damage multipliers, automatic or manual damage application, and GM-controlled injury effects.
- Added optional Midi-QOL routing for HUD attacks, spells, and bundled targeted attacks. Midi-QOL retains ownership of hit checks, attack/damage dialogs, criticals, resistances, vulnerabilities, temporary hit points, and HP application.
- Added scoped target and cursor handling, cursor-adjacent native dialogs, interactive hover descriptions, target preservation through native rolls, and prevention of duplicate native/Midi damage paths.
- Preserved upstream Argon attribution, GPL-3.0 licensing, the D&D5E MIT notice, and editable source files.

### Compatibility and operational notes

- Targets Foundry 14 and D&D5E 5.3.2–5.3.3. Midi-QOL is optional.
- When Midi-QOL is active, a GM reload may set `autoCheckHit=all`, `autoApplyDamage=yesCard`, and, for spell workflows, `autoCheckSaves=allShow` when those settings are disabled. These Midi settings affect workflows outside the HUD; prior values are retained in the hidden `midiAutomationBackup` world setting.
- A connected GM is required for player workflows that apply damage to actors the player does not own. Targeted injury effects remain GM-controlled. Existing standalone Targeted Attacks pending cards and ledgers are not migrated.

### Verification boundary

- The automated Node test suite passes 109 tests, with runtime syntax checks and source/API fixture checks included in the release workflow.
- Static previews and automated tests do not establish live Foundry, multiplayer, Midi-QOL, or end-to-end HP compatibility. Perform the manual validation in [CONTRIBUTING.md](CONTRIBUTING.md) in a disposable test world before campaign use.

[0.3.18]: https://github.com/OfficialHeyItsV/vs-combat-suite/releases/latest
