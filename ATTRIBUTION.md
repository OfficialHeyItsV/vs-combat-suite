# V's Combat Suite — attribution and source

V's Combat Suite is a modified fork of **Argon - Combat HUD (CORE) 5.0.1** by theripper93 and Mouse0270, with the **Argon DND5E integration 5.2.2** by theripper93. It is not an official Argon release.

- Core upstream: https://github.com/theripper93/enhancedcombathud
- DND5E upstream: https://github.com/theripper93/enhancedcombathud-dnd5e
- Core license: GNU GPL version 3, provided in `LICENSE`.
- DND5E integration: MIT license, original notice provided in `licenses/argon-dnd5e-MIT.txt`.

The combined modified distribution is provided under GPL-3.0. The original DND5E MIT notice remains applicable to that component. Original copyright notices and licenses are retained.

Source was recovered from the source maps included in the user's installed copies. All executable JavaScript in this distribution is readable source; no separate JavaScript compiler or private repository is needed. The inherited compiled core stylesheet is accompanied by its original SCSS source in `source-styles/`; the new design is editable CSS in `styles/suite.css`.

Changes for V's Combat Suite (2026-09-19): independent module identity and API namespace, bundled DND5E adapter, a redesigned HUD, and optional integration with V's Targeted Attacks. See `PROGRESS.md` for the completed changes and verification boundary.

## Editing the distributed source

`index.js` loads the readable files directly. Edit `scripts/`, `templates/`, `languages/en.json`, and the three files in `styles/`; there is no minified JavaScript build to regenerate. `source-styles/` preserves upstream stylesheet source-map contents for reference. The forked baseline CSS renames `ech-` to `vcs-`, `extended-combat-hud` to `vcs-combat-hud`, and the theme dialog selectors to `vcsThemeOptions` / `vcsExportTheme`; the new visual treatment lives in `styles/suite.css`.

As of Combat Suite 0.2.0, `scripts/targeted/` and `styles/targeted.css` include V's Targeted Attacks 0.2.29 by V, adapted to the suite's namespace and lifecycle. The original standalone project is retained separately.
