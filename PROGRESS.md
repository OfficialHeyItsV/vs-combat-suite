# V's Combat Suite progress

Started 2026-09-19. This is a new module, separate from Targeted Attacks and Pointer.

## Authorized scope

Create the user's own version of Argon Combat HUD, named V's Combat Suite, with a clean, pleasant design. Target the user's Foundry 14.367 / DND5E 5.3.x installation. Preserve Argon's combat workflows through an attributed source fork; package as one independently installable module.

## Completed investigation

- Read installed CORE 5.0.1 and DND5E adapter 5.2.2 manifests/licenses.
- CORE ships GPL-3.0; DND5E adapter ships MIT. Preserve notices and include editable corresponding source.
- Extracted complete mapped JavaScript source into `work/vcs-reference`; original installed modules are unchanged.
- Recovered core SCSS source from its stylesheet map.

## Completed 2026-09-19: standalone runtime and integration

- Copied the mapped CORE and DND5E JavaScript sources into `scripts/core` and `scripts/dnd5e`, with an unbundled `index.js` entrypoint and no SCSS runtime imports.
- Reworked runtime identity to `vs-combat-suite`, `ui.VCS`, `CONFIG.VCS`, `vcsInit`, VCS-scoped hooks/helpers/custom elements, unique HUD/control/theme DOM identifiers, and a DND5E system check without an external adapter dependency.
- Added the standalone Foundry manifest (`0.1.0`, Foundry `14.367`, DND5E `5.3.2`–`5.3.3`) and copied complete core theme JSON resources, including the transformed `vcs.json` fallback.
- Added an optional Targeted Attacks HUD button that appears only for an owned actor when `TargetedSpecialAttacks.open(actor)` is available; its click path rechecks both conditions so no stale disabled integration remains.
- Checks: all 31 runtime files pass `node --check`; direct Node test run passes all 5 module/startup tests. Live Foundry/world validation remains outstanding.
- Follow-up review fixes: `CoreHud.setPosition` now publishes `--vcs-hud-scale` using the exact applied transform scale; DND5E button HUD stays visible in combat only when the owned actor has the optional Targeted Attacks API, with rest buttons omitted during combat and stale API clicks guarded. Startup regression coverage exercises these paths.

## Historical first-build verification boundary

The module has not been installed or enabled in a live world. Tests and preview verification must be distinguished from actual multiplayer combat validation. No public release or upstream contribution is requested.

## Completed 2026-09-19: reviewed first build

- Packaged artifact: `outputs/vs-combat-suite-v0.1.0.zip`, containing one `vs-combat-suite` module folder, editable runtime/styles/templates, licenses, documentation, tests, and static preview.
- Added a scoped slate/teal visual theme, rounded panels, category colors, focus styling, reduced-motion handling, and scale-aware action text. Removed external font loading. Reviewed the browser preview at 1280x720; corrected an overlapping static tooltip and preview drawer alignment. Shared theme variables now also apply to live tooltip surfaces.
- Primary reviewed independent runtime identity, import/template/resource paths, optional shortcut behavior, and source/license completeness. All 5 automated tests pass, including startup registration and optional integration state checks. All 31 runtime JavaScript files passed syntax checks.
- Source modules and previous projects remain unchanged. This new folder is not a Git repository; no commit, upload, public release, or hosted installation URL was created.
- Next required action: install this first build in a DND5E test world, disable the original Argon pair, and verify token switching, attacks/spells, saves/skills, weapon sets, movement, combat transitions, and targeted attacks. Automated mocks and static screenshots do not establish live or multiplayer compatibility.

## Completed 2026-09-19: v0.1.1 HUD opening fix

- Trigger: user reports no HUD after enabling the module, selecting a token, and pressing Shift+A. Revisited rendering because the first build's tests did not exercise the Foundry template parser.
- Cause found: `templates/core-hud.hbs` contained only a Handlebars comment. Foundry 14's HandlebarsApplicationMixin rejects a template part without a single HTML root before runtime HUD assembly can start.
- Fix: supplied a single div root; no combat behavior changes. Module/package version is 0.1.1. Package test now checks version consistency rather than a stale fixed version.
- Evidence: local browser probe using the actual installed Foundry 14 parser reproduced the old failure and accepted the fixed template. Probe source retained in `tests/template-render-probe.cjs`; Foundry's proprietary source is loaded locally and is not distributed. Five Node package/startup tests pass. This remains isolated rendering evidence, not a completed live gameplay test.
- Updated installed `module.json` and `templates/core-hud.hbs` under the user's Foundry Data/modules/vs-combat-suite; hashes match the corrected source. Backups are in `outputs/vs-combat-suite-backup-before-0.1.1`. Installed package metadata, regression checks, README and progress record were also synchronized. Other runtime files and world data were untouched.
- Replacement artifact: `outputs/vs-combat-suite-v0.1.1.zip`. Prior ZIP retained for history.
- Next action: reload the Foundry client, select an owned token, and press Shift+A. User confirmation of live HUD appearance and remaining combat checks is outstanding. A separately requested console error has not yet arrived, so additional faults are not excluded.


## Completed 2026-09-19: v0.2.0 integrated combat update

- User screenshot confirms the v0.1.1 HUD now appears in live Foundry. This confirms opening only, not all gameplay workflows.
- Fixed blurred action icons: the inherited `vcs-blur::before` backdrop filter blurred the background icon after card transforms created a stacking context. Scoped that pseudo-element to no backdrop filter on action cards. Browser preview now includes the real runtime blur class; computed styles confirm no icon blur and screenshot review shows sharp icons.
- Bundled Targeted Attacks 0.2.29 under `scripts/targeted/`, with local stylesheet, suite-scoped settings/flags/socket, and no standalone dependency. Includes existing Head -6, Leg -3/descriptive half-speed effect, and targeted reset behavior. If standalone Targeted Attacks is enabled, the suite skips bundled initialization to avoid duplicate processing. Disable standalone for built-in use.
- Preserves the standalone automatic-damage preference when registered or available as a saved world Setting. Does not migrate historical pending cards/ledgers; start fresh attacks after switching. Original standalone files unchanged.
- Weapon/spell item and activity buttons clear only the current user's previous targets before selection, even when the range picker is disabled. New targets are kept for item use. Updated the range picker to native Foundry 14 control activation, refreshed its count after clearing, and ignored other users' target hooks. Cancellation does not execute the action.
- Skull is an accessible button linked to the native DND5E death save for owned zero-HP actors with death-save support; unsupported NPC types stay non-rollable. Preserves native death-save rules, including stable/dead validation. Prevents concurrent duplicate rolls.
- Players automatically open the HUD for their selected owned token or assigned owned character at ready/canvasReady, token selection, and character assignment updates. Deselecting returns to the assigned character. GM manual opening and Always On preference are retained.
- Reviewed the delegated integration; primary added persisted-setting preservation and verified namespace/boot guards. All 73 automated tests pass, including adapted targeted damage regression cases, item target lifecycle, skull delegation, and automatic player opening. All 34 runtime JS/MJS files pass syntax checks. No live attacks, multiplayer HP changes, death saves, or remote player login were performed by the agent.
- Built `outputs/vs-combat-suite-v0.2.0.zip`. Updated the installed suite after verifying it matched the previous v0.1.1 artifact. Backups of replaced files are in `outputs/vs-combat-suite-backup-before-0.2.0`. World settings/module activation were not changed by this update; no GitHub publication.
- Next action: restart/reload Foundry and have connected players reload; enable Combat Suite alone (disable standalone Targeted Attacks and original Argon modules), then verify a fresh targeted attack, fresh weapon/spell targets, zero-HP skull, and player auto-open in the live world.

## Completed 2026-09-19: embedded targeted menu and cursor polish

- Repaired the bundled targeted dialog for Foundry 14's standard-form wrapper: content is a non-nested `.tsa-dialog` panel, the dialog is bounded to 520px, the attack row is explicitly scoped, and location cards remain a compact two-column grid even when the Suite theme is active.
- Selecting a target location now refreshes every weapon/activity option's displayed flat attack bonus (for example Standard `+5`, Eyes `-1`) while the existing native `rule.attack` roll injection remains the sole applied penalty. Formula-style labels are preserved and receive an explanatory appended modifier rather than being numerically guessed.
- Added a startup fallback stylesheet link for clients with stale manifest style links. Foundry 14's local `cleanHTML` path preserves the targeted classes and form control attributes used by the panel.
- Targeted selection now starts and cleans up the shared crosshair cursor through the bundled session lifecycle. Added focused static/DOM-style menu checks and a local fixture at `work/vcs-targeted-menu-preview.html`.
- Checks: full package Node test suite passes (80 tests), focused menu tests pass (3), and targeted runtime syntax checks pass. Live Foundry rendering and multiplayer behavior remain unverified.

## Completed 2026-09-19: v0.3.0 combined HUD update

- Clicking an owned token in Select Token mode opens the HUD, including for GMs and already-selected tokens. The pointer listener is attached after Foundry's native listener reset; player assigned-character opening remains intact.
- Equipped character weapons populate empty weapon-set slots, preserving nonempty manual assignments. Rendering or choosing automatic sets does not change inventory equipment.
- Restored the compact targeted menu and location-adjusted dropdown bonuses without duplicating the native attack penalty. Corrected the legacy dialog callback alongside the Foundry 14 path.
- Shared teal cursor follows active HUD/targeted selection and cleans up on completion/cancellation. Ordinary HUD selection also handles scene teardown.
- Conditional Rituals panel lists ritual spells only and uses native casting with spell-slot consumption disabled. It does not advance world time or consume a HUD combat action.
- Removed floating suite branding above chat. Long Rest, Short Rest, and Targeted Attack retain their original column beside the portrait; rest controls retain their existing outside-combat visibility.
- Primary reviewed the delegated menu and ritual changes. All 83 automated tests and syntax checks for 36 runtime files pass. Browser preview checks covered compact layout, displayed penalty changes, cursor movement/cancellation, and removal of branding. These checks are not live Foundry or multiplayer verification.
- Release artifact: outputs/vs-combat-suite-v0.3.0.zip. Installed files matched the previous v0.2.0 release before update. Changed files are backed up in outputs/vs-combat-suite-backup-before-0.3.0; installed replacement hashes verified. No world data, module activation, or remote repository changes.
- Next action: restart Foundry and reload player clients. In a test world verify token clicking, auto weapon slots, targeted menu bonuses and targeting, ritual casting without slot spending, and preserved rest/target button positions. Keep standalone Targeted Attacks and original Argon modules disabled for bundled use.

## Completed 2026-09-19: v0.3.1 menu effects and readability

- Added Hit, Bloodied, and Critical effect descriptions to all eight targeted options, sourced directly from the existing rules. Standard explicitly shows no additional effects; no attack/damage/effect rules changed.
- Scoped the targeted dialog to the Combat Suite slate/teal palette, rounded cards, readable labels, visible selection/focus, and a scrollable effects grid with the weapon selector and action controls outside it. Increased width to 640px with narrow-screen fallback.
- Targeted options now include only equipped weapon items with Attack activities. Unequipping a weapon removes it on the next menu opening. An empty list explains that a weapon must be equipped.
- Tooltip titles and hovered/focused/selected action labels are white with a black outline. Browser computed styles confirm the white color and black surrounding text shadows.
- Browser fixture review confirmed effect card layout, scrolling to Leg/Groin while keeping action buttons available, and location selection continuing to update displayed bonuses. The static fixture is not live Foundry verification.
- Regular HUD weapon attack activities now skip the intermediate usage dialog and follow native Activity.use into the native Attack Roll dialog after targeting. Native resource consumption remains enabled, and the HUD does not issue a second roll. Multi-activity item selection remains native.
- Primary reviewed the delegated attack change and narrowed it to non-ritual weapons so spell level/slot and ritual configuration remain available. Based on installed DND5E 5.3.2 Activity.use and AttackActivity._triggerSubsequentActions source; no live attack was performed.
- Final checks: 89 automated tests pass; all 36 runtime files pass syntax checks. Installed files matched the v0.3.0 ZIP before update; changed files backed up under outputs/vs-combat-suite-backup-before-0.3.1 and replacement hashes verified.
- Artifact: outputs/vs-combat-suite-v0.3.1.zip. No remote publication or world-setting changes.
- Next action: restart Foundry/reload connected clients. Verify equipped-only choices, effect descriptions, tooltip readability, and target-then-native-roll behavior in the live world. Spell use may still require native spell configuration before the attack dialog.

## Completed 2026-09-19: v0.3.2 reference menu arrangement

- Reorganized the targeted menu into screenshot-matching pairs: Eyes/Head, Arm/Object, Torso/Groin, and Leg/Standard. Kept Standard available and selected by default.
- Expanded the dialog to 1080px with responsive width; aligned the weapon selector and equal-width footer buttons with the reference. Effect cards scroll within a viewport-aware height so controls remain visible.
- Preserved slate/teal styling, all effect descriptions, equipped-only weapon filtering, dynamic bonuses, and current Head -6/Leg -3 rules. Screenshot's historical penalty values were not copied.
- Verification: 89 automated tests passed and edited runtime syntax passed. Browser screenshot review confirmed wide paired rows and visible footer at the available viewport. No live Foundry session tested.
- Installed baseline matched v0.3.1; changed files backed up under outputs/vs-combat-suite-backup-before-0.3.2. Replacement hashes verified and artifact packaged as outputs/vs-combat-suite-v0.3.2.zip. No remote publication.
- Next action: reload Foundry clients and confirm live dialog layout.

## Completed 2026-09-19: v0.3.3 unarmed multi-activity flow

- User screenshot identified Lightning Fist's native Attack/Grapple/Shove chooser. Previous direct attack configuration deliberately excluded multi-activity weapons; that left the chosen Attack on the intermediate usage-dialog path.
- HUD now resolves the same native ActivityChoiceDialog for usable multi-activity weapons, then passes configure:false only to the selected Attack activity. Grapple/Shove retain their native configuration; cancellation performs no use. Shift retains native first-usable-activity behavior. No direct roll call or duplicate resource consumption was added.
- Verified the chooser API and Item.use sequence against installed official DND5E 5.3.2 source. All 90 automated tests pass, including chosen Attack, non-attack choices, and cancellation; changed runtime syntax passes. Live Foundry behavior remains to be confirmed.
- Installed baseline matched v0.3.2; backup: outputs/vs-combat-suite-backup-before-0.3.3. Updated files hash-verified. Artifact: outputs/vs-combat-suite-v0.3.3.zip. No remote publication or world changes.
- Next action: reload Foundry, click Lightning Fist, choose Attack, and confirm the native Attack Roll window appears. Confirm Grapple/Shove still open their own workflow.

## Completed 2026-09-19: v0.3.4 all unarmed HUD attacks

- Clarified scope: all unarmed attacks, not only Lightning Fist. The previous change was name-independent but limited to weapon items.
- Extended direct attack configuration to any native attack.type.classification === unarmed activity, including feature items and renamed attacks, for direct activity buttons and multi-activity choosers. Weapon behavior remains; other activity types retain their configuration.
- Verified the native classification against installed DND5E source. All 91 tests pass, covering several names and feature-backed direct/chooser paths; runtime syntax passes. Live world confirmation remains outstanding.
- Installed baseline matched v0.3.3; changed files backed up to outputs/vs-combat-suite-backup-before-0.3.4 and replacement hashes checked. Artifact: outputs/vs-combat-suite-v0.3.4.zip. No remote publication.
- Next action: reload Foundry clients and verify unarmed Attack choices lead to the native Attack Roll dialog; Grapple/Shove remain native.

## Completed 2026-09-19: v0.3.5 explicit HUD attack continuation

- User live screenshot disproved the previous assumption that skipping the usage dialog ensured an immediate roll: a usage card still required a separate chat Attack click. Exact external/native suppression cause was not established; the symptom is confirmed.
- HUD weapon/unarmed attacks now use the native activity with subsequentActions:false, then explicitly call native rollAttack with configure:true only after a successful usage message. This replaces reliance on automatic continuation and avoids a duplicate native follow-up.
- Mirrors DND5E's own chat Attack preparation: clones consumed-resource/scaling flags from the usage message before rolling, and links the roll to the originating message. No second Activity.use or direct damage call. Cancellation before use creates no roll prompt. All named/renamed native unarmed classifications, weapon buttons, and multi-action Attack choices share this path; Grapple/Shove remain native.
- Verification: all 93 automated tests pass, including exactly-one prompt, consumption/scaling preservation, and canceled use. Changed runtime syntax passes. This is automated evidence, not a live-world verification of the reported issue.
- Installed baseline matched v0.3.4. Backups: outputs/vs-combat-suite-backup-before-0.3.5. Hash-verified installed replacement; artifact outputs/vs-combat-suite-v0.3.5.zip. No remote publication.
- Next action: reload Foundry, choose any unarmed Attack from the HUD, and verify the native Advantage/Normal/Disadvantage dialog opens without clicking chat.

## Completed 2026-09-19: v0.3.6 hoverable descriptions

- HUD tooltips now use Foundry's native lockTooltip after activation. Unlike ordinary tooltips, these remain interactive under the pointer and use native proximity dismissal when moving away. Description text can be selected and scrolled; colors and contents remain unchanged.
- Opening a new HUD tooltip dismisses only the preceding HUD tooltip; HUD closing also dismisses its owned container. Unrelated locked Foundry tooltips are not explicitly cleared by the suite.
- Verified behavior/API against installed Foundry 14 TooltipManager source. All 94 automated tests pass, including ownership and replacement cleanup; edited runtime syntax passes. Live pointer/scroll behavior still requires confirmation.
- Installed baseline matched v0.3.5; backups at outputs/vs-combat-suite-backup-before-0.3.6. Installed hashes verified; archive outputs/vs-combat-suite-v0.3.6.zip. No remote publication.
- Next action: reload Foundry; hover Ready or another described option, move into the popup, and scroll/read it. Moving away should dismiss it.

## Completed 2026-09-19: v0.3.7 feature and description hover boundary

- User reported popup dismissal while still over a feature. Native locked-tooltip proximity covers only popup bounds, so the v0.3.6 approach could dismiss from movement on the originating feature.
- Retained native tooltip positioning/popover rendering, but removed the suite popup from native proximity tracking. Suite now owns dismissal while checking both the source feature and popup descendants. A 300ms grace period permits crossing the gap. Escape, replacement, and HUD close clean up the owned popup and listeners.
- Updated focused regression coverage for source hover, popup hover, gap crossing in both directions, replacement, and leaving both. All 94 tests and edited runtime syntax pass. Live Foundry confirmation remains outstanding.
- Installed baseline matched v0.3.6. Backup: outputs/vs-combat-suite-backup-before-0.3.7. Installed hashes verified; artifact outputs/vs-combat-suite-v0.3.7.zip. No remote publication.
- Next action: reload Foundry and verify hovering any part of a tall feature keeps its popup visible, then move into the popup and scroll.

## Completed 2026-09-19: v0.3.8 remove orange popup outline

- Traced screenshot's orange outer frame to Foundry 14's .locked-tooltip border using --color-warm-2. Scoped an override to suite popup containers: border:0 and outline:none. Existing inner slate/teal frame and hover persistence are retained.
- CSS-only behavior change; verified responsible native CSS rule and selector scope. No gameplay tests rerun; live visual confirmation remains outstanding.
- Installed baseline matched v0.3.7; changed-file backup outputs/vs-combat-suite-backup-before-0.3.8. Installed hashes verified; artifact outputs/vs-combat-suite-v0.3.8.zip. No remote publication.
- Next action: reload the Foundry client to refresh styling.

## Completed 2026-09-19: v0.3.9 lower-row popup access

- Crossing an upper-row feature previously opened its tooltip immediately, replacing the lower feature's popup. When a popup is already open, another feature now requires 500ms of continued hover before replacement. Leaving that feature cancels its pending display, including while description data is loading.
- Increased popup travel grace from 300ms to 650ms so crossing the gap or intervening card does not immediately close the original. Hovering inside the popup cancels dismissal; intentionally resting on a new feature changes descriptions.
- All 96 tests pass, including crossing vs intentional hover and late description results. Both edited runtime files pass syntax checks. Live Foundry pointer transit remains to be confirmed.
- Baseline installed files matched v0.3.8. Backup outputs/vs-combat-suite-backup-before-0.3.9; installed replacement hashes verified. Artifact outputs/vs-combat-suite-v0.3.9.zip. No remote publication.
- Next action: reload Foundry and move from a lower quarter-size feature across the upper card into its description.

## Completed 2026-09-19: v0.3.10 cursor-adjacent attack dialog

- User screenshot confirms native attack prompt appears, but native right-side positioning and an intermediate usage card were unwanted.
- HUD records pointer movement; weapon/unarmed attack dialogs receive explicit cursor-adjacent options.position with viewport edge clamping. Uses the latest cursor position after targeting/activity choice, with event coordinates as fallback.
- Native Activity.use now uses message.create:false to retain returned consumption/scaling data without publishing the intermediate usage card. The roll prompt and resulting attack chat message remain native. No chat card deletion or global chat settings changed.
- Verified native dialog options and create:false return behavior against installed DND5E source. All 97 tests pass, including no intermediate card, position coordinates, resource preservation, and one prompt. Both edited runtime files pass syntax checks. Live placement remains to be confirmed.
- Installed baseline matched v0.3.9; backup outputs/vs-combat-suite-backup-before-0.3.10. Hash-verified installation; artifact outputs/vs-combat-suite-v0.3.10.zip. No publication.
- Next action: reload Foundry and test an unarmed Attack from the HUD. Expect only the Attack Roll prompt near the cursor; after rolling, expect the normal attack result in chat.

## Completed 2026-09-19: v0.3.11 immediate description exit

- Added pointerleave handling to the description popup: after entering it, leaving its outer boundary immediately destroys the popup and clears pending dismissal/listeners. Moving between child elements inside the popup does not trigger pointerleave.
- Preserved pre-entry travel grace and delayed replacement when crossing an upper feature, so lower-row descriptions remain reachable.
- All 97 tests pass, including immediate popup exit without a timer and existing transit behavior. Edited runtime syntax passes. Live confirmation remains outstanding.
- Baseline matched v0.3.10; backup outputs/vs-combat-suite-backup-before-0.3.11. Installed hashes verified; artifact outputs/vs-combat-suite-v0.3.11.zip. No remote publication.
- Next action: reload Foundry and move into then out of a feature description; it should close immediately on exit.

## Completed 2026-09-19: v0.3.12 required unarmed/weapon targeting

- User reports unarmed roll prompt without acquiring/retaining a target. Found two runtime gaps: optional range-picker setting could bypass selection, and missing legacy target/actionType metadata could yield null target count for native unarmed attacks.
- Added native attack classification-based requiresTargetSelection for weapon/unarmed HUD buttons, including feature-backed unarmed attacks and multi-activity items. Such buttons clear this user's old targets and await the picker regardless of the optional range-picker setting; target count defaults to one when legacy metadata is absent. New targets remain selected for native use and roll. Cancellation stops use.
- Range access now tolerates absent range metadata. Spells and unrelated features retain their prior settings behavior.
- All 99 tests pass, including range-picker-disabled unarmed selection, target preservation, and metadata fallback. Both edited runtime files pass syntax checks. Exact live client settings were not inspected; user confirmation still required.
- Baseline matched v0.3.11; backup outputs/vs-combat-suite-backup-before-0.3.12. Installed hashes verified; artifact outputs/vs-combat-suite-v0.3.12.zip. No publication.
- Next action: reload Foundry, click an unarmed attack, select a creature, then choose Attack. The creature should stay targeted when the roll prompt opens.

## Completed 2026-09-19: v0.3.13 instant highlighted descriptions

- Latest user preference supersedes the 500ms feature-switch delay from v0.3.9: removed that delay and disabled popup fade/animation. A hovered feature now displays as soon as its description/template resolves. Late data still cannot replace a popup after leaving the feature.
- Preserved popup hover persistence, immediate pointerleave dismissal, and pre-entry travel grace. Crossing a different feature now switches its description immediately, as requested; no artificial switch delay remains.
- All 99 tests pass, including no timer on feature switching and late-result protection. Edited runtime syntax passes. Native live rendering still requires confirmation.
- Baseline matched v0.3.12; backup outputs/vs-combat-suite-backup-before-0.3.13. Installed hashes verified; artifact outputs/vs-combat-suite-v0.3.13.zip. No publication.
- Next action: reload Foundry and verify instant descriptions plus the v0.3.12 unarmed targeting correction.

## Completed 2026-09-19: v0.3.14 HUD target AC and damage continuation

- User still reports missing target AC/damage flow. Code confirmed the explicit HUD roll path had no damage continuation; prior tests proved only selection/configuration boundaries, not this complete sequence.
- Snapshot selected token/actor descriptors and AC before native use; reject missing targets/unknown AC before resource use. Restore selected targets if native use cleared them, explicitly pass single-target AC to rollAttack, and attach native-format target descriptors to attack and damage messages.
- Await attack result. Native criticals or totals meeting AC open the native damage prompt; fumbles, misses, and canceled rolls do not. Carry attack mode/ammunition and critical state into damage. Uses native rollDamage, not manual formula reconstruction or HP changes.
- All 101 tests pass, including AC equality, miss, critical, fumble, cancel, target restoration, message target metadata, and no-target pre-consumption guard. Edited runtime syntax passes. Installed official DND5E descriptor shape/roll APIs inspected; no live Foundry attack performed, so user confirmation is still necessary.
- Baseline matched v0.3.13; backup outputs/vs-combat-suite-backup-before-0.3.14. Installed hashes verified; artifact outputs/vs-combat-suite-v0.3.14.zip. No publication.
- Next action: reload Foundry, choose an unarmed attack, target a creature, roll, and verify target AC on the attack card and a damage prompt on a hit.

## Completed 2026-09-19: v0.3.15 Midi-QOL-owned HUD attack workflow

- User disclosed active Midi-QOL and authorized using its automation for target -> attack against AC -> damage prompt -> automatic HP application. Installed Midi version is 14.0.12.
- Primary reviewed source/API findings from a narrowly delegated investigation. No independent GM damage coordinator was shipped. Added hud-damage.js adapter and route active-Midi HUD attacks exclusively through MidiQOL.completeActivityUse with selected token UUIDs, autoRollAttack:true, autoRollDamage:onHit, and both fast-forward flags false.
- Keeps the native/Midi workflow card for Midi bookkeeping while suppressing its initial notification via a nonce-scoped preCreateChatMessage hook. Scoped attack/damage hooks keep dialogs visible near the cursor. All temporary hooks removed in finally; no second native damage path or error retry runs alongside Midi.
- Midi global autoCheckHit and autoApplyDamage govern these operations; no per-workflow override exists in installed source. GM ready/attack setup enables hit checking when disabled and all-target auto damage when absent (yesCard), preserving other settings and saving old values once in midiAutomationBackup. This affects Midi attacks outside the HUD too, disclosed in commentary and README. Client EnableWorkflow is enabled if false. Settings are applied at runtime after reload, not by editing world files.
- Existing Foundry target picker remains the entry step. Midi receives exact scene token UUIDs and restores targets through its own completion flow. Players require connected GM authority for non-owned HP updates.
- All 106 automated tests pass, including routing exclusivity, target UUIDs, explicit dialogs, world config backup/preservation, non-GM refusal to change world settings, scoped notification/position hooks, and cleanup on failure. Both changed runtime files pass syntax checks. No live Midi attack/HP application was performed; user confirmation remains required.
- Baseline installed copy matched v0.3.14. Changed files backed up to outputs/vs-combat-suite-backup-before-0.3.15; replacement hashes verified. Artifact outputs/vs-combat-suite-v0.3.15.zip. No remote publication.
- Next action: reload as GM first, then reload players. Click an unarmed/weapon HUD attack, click a creature, choose Attack if applicable, choose Normal/Advantage/Disadvantage, and on a hit roll damage. Verify Midi reduces the selected target's HP once, including resistance/temp HP handling. Without Midi the existing native fallback still prompts damage but does not newly auto-apply HP.

## Completed 2026-09-19: v0.3.16 Midi spells and targeted workflows

- Routed active-Midi HUD spell activities through completeActivityUse, including attack/save/healing activities and multi-activity selection. Retained native casting dialog and ritual slot-consumption configuration. Creature-targeted spells require selection; self/template spells may proceed through native targeting.
- Bundled Targeted Attacks route through the same Midi adapter. Scoped preRollAttack adds the selected penalty once; awaited DamageRollComplete scales already-evaluated main/bonus typed damage before Midi application, preserving damage properties and critical results. Invalid multiplier processing aborts application. Midi-result cards omit the duplicate native damage button and retain GM injury controls. Non-Midi path unchanged.
- GM ready now enables disabled save automation (allShow) as well as prior hit/damage setup; old save value is backed up. This world-wide setting effect was disclosed. No world database files edited directly.
- Inspected installed Midi 14.0.12 and DND5E 5.3.2 source for awaited hooks, damage setters and casting options. All 109 automated tests pass; three changed runtime files pass syntax checks. Tests cover spell routing/ritual configuration, typed multipliers including zero, penalty-once and hook cleanup. No live Foundry workflow/HP verification performed.
- Installed baseline matched v0.3.15 before replacement. Delivery: outputs/vs-combat-suite-v0.3.16.zip; prior changed files backed up to outputs/vs-combat-suite-backup-before-0.3.16. No remote publication.
- Next action: reload GM then players; verify an attack spell, save spell, healing spell, ritual and area template, plus targeted hit/miss/critical. Confirm slot use, target retention, location modifiers and exactly one HP update. Injury effects remain GM-controlled.

## Completed 2026-09-19: v0.3.17 ritual spell-level groups

- Replaced the flat Ritual panel with the existing HUD spell accordion component. Groups use DND5E spell-level labels in ascending numeric order and omit empty levels. Buttons retain ritual:true; no slot counters or prepared-spell filters added.
- Checked current source and Git status (workspace is not a Git repository). Runtime syntax check and all 3 existing ritual tests pass. No live Foundry visual verification performed.
- Installed baseline matched v0.3.16. Delivery: outputs/vs-combat-suite-v0.3.17.zip; changed installed files backed up to outputs/vs-combat-suite-backup-before-0.3.17, with installer hash verification. No remote publication.
- Next action: reload Foundry, open Rituals on a caster with ritual spells of multiple levels, and verify level groups and ritual casting.


## Release preparation 2026-09-19: v0.3.18 public GitHub distribution

- User explicitly authorized publishing Combat Suite source, documentation and a Foundry-installable release. Dedicated public repository created: https://github.com/OfficialHeyItsV/vs-combat-suite.
- Added stable latest-release manifest, version-pinned ZIP download, repository/issues/changelog URLs and optional Midi recommendation. Version0.3.18 contains release metadata/documentation changes over0.3.17, no combat behavior change.
- Added Python standard-library package validator/builder, GitHub Actions test/package checks, bug-report template and ignore rules. Release ZIP includes runtime source and original stylesheet sources/licenses; tests and contributor tooling remain in repository.
- Full suite:109 automated tests pass. Live Foundry/multiplayer verification remains outstanding. Public remote asset verification will be recorded after upload.

## Completed 2026-09-19: v0.3.18 published and public downloads verified

- Public repository: https://github.com/OfficialHeyItsV/vs-combat-suite. Source/release tag v0.3.18 points to commit53556a26d85abdc09e74b85b7e89e03e86bd1b80. GitHub release includes module.json, versioned ZIP and SHA256SUMS.txt.
- Reviewed delegated README/CHANGELOG/CONTRIBUTING work and corrected wording before publication. Documents include install/update instructions, architecture, configuration side effects, licenses, manual test checklist and release procedure.
- Command-line Git had no authenticated credentials. Used the already connected GitHub app to publish repository objects and the authenticated browser to publish the release; no new credentials created. Local repository follows origin/main; pre-publication local commits retained on local-pre-publication.
- GitHub Actions checks completed successfully: https://github.com/OfficialHeyItsV/vs-combat-suite/actions/runs/35472762233. All109 local automated tests passed. Packaging validated132 distribution files.
- Downloaded the stable latest-release manifest and its version-pinned ZIP without authentication; both SHA256 hashes match local release assets, and ZIP contains vs-combat-suite/module.json. Actual installation via Foundry UI and live gameplay were not performed.
- Stable install/update URL: https://github.com/OfficialHeyItsV/vs-combat-suite/releases/latest/download/module.json. Foundry's searchable package directory has not been submitted; manifest installation is available independently.
- Next action: reload clients after installing/updating; perform the documented live Foundry/Midi checklist. Future releases must increment both versions and download URL, tag source, upload validated assets, and preserve stable manifest URL.
