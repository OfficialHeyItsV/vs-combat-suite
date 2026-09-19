import {initConfig} from "./echDnd5e.js";
import { registerSettings } from "./settings.js";

export const MODULE_ID = "vs-combat-suite";

Hooks.on("setup", () => {
    if (game.system.id !== "dnd5e") return;
    registerSettings();
    initConfig();
});
