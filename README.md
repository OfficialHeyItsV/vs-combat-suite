# V's Combat Suite

V's Combat Suite is a D&D 5e combat HUD for Foundry Virtual Tabletop 14. It combines the Argon Combat HUD workflow with a D&D5E adapter, a slate/teal presentation, and V's Targeted Attacks in one independently installed module.

This documentation describes the v0.3.18 public release, which consolidates the v0.3.17 release line.

## Install

### Install from Foundry

1. Open **Add-on Modules → Install Module**.
2. Paste this manifest URL into **Manifest URL**:

   `https://github.com/OfficialHeyItsV/vs-combat-suite/releases/latest/download/module.json`

3. Install the module, then enable **V's Combat Suite** in a D&D5E world.
4. Disable **Argon - Combat HUD (CORE)**, **Argon - Combat HUD (DND5E)**, and the standalone **V's Targeted Attacks** module. Their workflows are included here; running both implementations can register duplicate hooks.
5. Reload the GM client and connected player clients. When Midi-QOL is active, reload the GM first so its required automation settings are initialized before players attack or cast.

### Install a release ZIP

Download the release ZIP from GitHub, extract it, and place the `vs-combat-suite` folder directly under Foundry's `Data/modules` directory. The installed folder must contain `module.json` at its top level. Restart Foundry, enable the module, and reload connected clients.

## Requirements

- Foundry Virtual Tabletop 14; the release was packaged and checked against Foundry 14.367.
- D&D5E system 5.3.2–5.3.3.
- No required module dependencies.
- Midi-QOL is optional. When it is active, the Suite uses its workflow for HUD attacks, spells, and bundled targeted attacks; see [Midi-QOL integration](#midi-qol-integration).

## Opening and using the HUD

The HUD opens for a player's assigned character or selected owned token. It can also be opened by clicking an owned token while the Select Token tool is active, using the Foundry control, or pressing **Shift+A**. GMs can open it for an owned or selected actor as well.

The D&D5E panels provide:

- Actions, bonus actions, reactions, free/basic actions, features, consumables, spells, and optional macros.
- Weapon sets, automatic population of empty sets from equipped weapons, and optional automatic equip/unequip when switching sets.
- Ability checks, saving throws, skills, tools, movement, combat turn controls, Long Rest, and Short Rest.
- Native D&D5E activity use, including multi-activity choices such as Attack, Grapple, and Shove.
- Native death saves from the zero-HP skull for owned actors that support death saves.
- Hover descriptions that remain readable while the pointer moves into the description, with immediate switching to the newly hovered feature.
- Target selection that clears the current user's old targets before an item or attack starts and keeps newly selected targets for native use.

Ritual spells appear in a **Rituals** panel grouped by spell level. Ritual buttons use the native D&D5E activity workflow with spell-slot consumption disabled; they do not advance world time automatically.

## Bundled Targeted Attacks

The built-in Targeted Attack control lists equipped weapons with Attack activities and offers Standard, Eyes, Head, Arm, Object, Torso, Groin, and Leg locations. Each location displays its attack adjustment, damage rule, and hit, Bloodied, or Critical effect descriptions. The selected adjustment is added to the native attack formula once.

In a non-Midi workflow, the hit card provides the native damage flow. The **Automatically Apply Damage** world setting controls whether targeted damage is applied automatically: GM rolls apply immediately, while player rolls are sent to a connected GM; disabling it leaves a manual GM **Apply** action. Targeted injury effects remain GM-controlled. A connected GM is required for player damage that affects an actor the player does not own.

When switching from the standalone Targeted Attacks module, the Suite carries forward its automatic-damage preference when Foundry still exposes it. Existing standalone pending cards and ledgers are not migrated; begin new attacks after switching.

## Midi-QOL integration

With Midi-QOL enabled, HUD attacks and spells use `MidiQOL.completeActivityUse` with the selected token UUIDs. Midi-QOL owns hit checking, attack and damage dialogs, critical handling, resistances, vulnerabilities, temporary hit points, and the resulting HP update. The Suite does not run a second native damage path.

On a GM `ready` hook, the Suite changes only the Midi settings needed for this workflow:

- Enables Midi workflow processing on the GM client if it is disabled.
- Sets `ConfigSettings.autoCheckHit` to `all` when hit checking is disabled.
- Sets `ConfigSettings.autoApplyDamage` to `yesCard` when automatic damage is not enabled.
- Sets `ConfigSettings.autoCheckSaves` to `allShow` when save checking is disabled.

These are Midi-QOL settings with world-wide gameplay effects. They also affect Midi attacks and spells outside the HUD. The previous hit-checking, save-checking, and damage-application values are saved in the Suite's hidden `midiAutomationBackup` world setting; the Suite does not silently restore them when the module is disabled, so a GM should review or restore the values deliberately when changing modules. The changes are made through Foundry settings at runtime; the Suite does not edit world database files.

The GM should reload first and keep an active GM connected for player workflows against unowned targets. If the GM coordinator disconnects during a targeted damage application, the card must be reviewed or reconciled by a GM before it can be safely retried. Targeted injury buttons are available only to GMs. Midi-managed targeted cards intentionally do not show a second damage-application button.

## Settings and compatibility notes

World settings cover theme scope, target selection, range display, combat opening, dialog styling, D&D5E panels, activity expansion, basic actions, and automatic targeted damage. Client settings cover HUD position, scaling, tooltips, fade behavior, macro/player-bar visibility, and the Always On preference. A world theme can be shared by all players; client theme mode lets each client choose its own presentation.

The Suite is scoped to Foundry 14 and D&D5E 5.3.2–5.3.3. Other Foundry or system versions may require source changes. Automated tests, source/API checks, and static previews do not establish live Foundry, multiplayer, Midi-QOL, or end-to-end HP compatibility. Validate a release in a disposable test world before using it in a campaign.

## Source, attribution, and license

The shipped JavaScript is readable source. No Node dependency install or JavaScript bundling step is required to use the module. See [ATTRIBUTION.md](ATTRIBUTION.md), [LICENSE](LICENSE), and [the D&D5E MIT notice](licenses/argon-dnd5e-MIT.txt) before redistributing or modifying it.

V's Combat Suite is a modified fork of [Argon - Combat HUD (CORE)](https://github.com/theripper93/enhancedcombathud) and the [Argon DND5E integration](https://github.com/theripper93/enhancedcombathud-dnd5e). It is not an official Argon release. Original copyright notices and license terms remain applicable to their respective components.

## Automated checks

From this module directory, run:

```sh
npm test
```

The test suite uses Node's built-in test runner. `preview.html` and `targeted-preview.html` are representative visual fixtures, not live Foundry sessions. See [CONTRIBUTING.md](CONTRIBUTING.md) for the packaging checks and manual validation checklist.

