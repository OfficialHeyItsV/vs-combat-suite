import { CoreHud } from "./app/CoreHud.js";
import { initConfig } from "./config.js";
import { registerSettings } from "./settings.js";
import { HTMLAlphaColorPickerElement } from "./AlphaColorPicker.js";

export const MODULE_ID = "vs-combat-suite";

Object.defineProperty(globalThis.CONFIG, "VCS", {
  get: () => {
    return CoreHud.VCS;
  }
});

CoreHud.setControlHooks();

Hooks.on("init", () => {
  registerKeybindings();
  window.customElements.define(HTMLAlphaColorPickerElement.tagName, HTMLAlphaColorPickerElement);
});

Hooks.on("ready", () => {
  initConfig();
  registerSettings();
  ui.VCS = new CoreHud();
  // Let every ready hook (including the built-in attack API) finish first.
  setTimeout(() => ui.VCS.openPreferredActor(), 0);
});

export function registerKeybindings() {
    game.keybindings.register("vs-combat-suite", "toggleHud", {
        name: "vs-combat-suite.hotkey.toggle.name",
        editable: [{ key: "KeyA", modifiers: [foundry.helpers.interaction.KeyboardManager.MODIFIER_KEYS.SHIFT] }],
        restricted: false,
        onDown: () => {},
        onUp: () => {
            ui.VCS.toggle();
        },
    });
}
