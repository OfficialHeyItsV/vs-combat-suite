import { MODULE_ID } from "./main.js";
import { setExplodeItemActivities } from "./echDnd5e.js";

export function registerSettings() {
    const settings = {
        showWeaponsItems: {
            name: game.i18n.localize("vs-combat-suite-dnd5e.settings.showWeaponsItems.name"),
            hint: game.i18n.localize("vs-combat-suite-dnd5e.settings.showWeaponsItems.hint"),
            scope: "world",
            config: true,
            type: Boolean,
            default: false,
            onChange: (sett) => {
                ui.VCS.constructor.DND5E.itemTypes.consumable = ui.VCS.constructor.DND5E.itemTypes.consumable.filter(i => i !== "weapon");
                if(sett) ui.VCS.constructor.DND5E.itemTypes.consumable.push("weapon");
                ui.VCS.refresh()
            },
        },
        showClassActions: {
            name: game.i18n.localize("vs-combat-suite-dnd5e.settings.showClassActions.name"),
            hint: game.i18n.localize("vs-combat-suite-dnd5e.settings.showClassActions.hint"),
            scope: "world",
            config: true,
            type: Boolean,
            default: true,
            onChange: (sett) => {
                ui.VCS.constructor.DND5E.mainBarFeatures = ui.VCS.constructor.DND5E.mainBarFeatures.filter(i => i !== "class");
                if(sett) ui.VCS.constructor.DND5E.mainBarFeatures.push("class");
                ui.VCS.refresh()
            },
        },
        condenseClassActions: {
            name: game.i18n.localize("vs-combat-suite-dnd5e.settings.condenseClassActions.name"),
            hint: game.i18n.localize("vs-combat-suite-dnd5e.settings.condenseClassActions.hint"),
            scope: "world",
            config: true,
            type: Boolean,
            default: true,
            onChange: () => ui.VCS.refresh(),
        },
        explodeItemActivities: {
            name: game.i18n.localize("vs-combat-suite-dnd5e.settings.explodeItemActivities.name"),
            hint: game.i18n.localize("vs-combat-suite-dnd5e.settings.explodeItemActivities.hint"),
            scope: "world",
            config: true,
            type: String,
            default: "only-weapons",
            choices: {
                "only-weapons": "vs-combat-suite-dnd5e.settings.explodeItemActivities.only-weapons",
                "always": "vs-combat-suite-dnd5e.settings.explodeItemActivities.always",
                "never": "vs-combat-suite-dnd5e.settings.explodeItemActivities.never",
            },
            onChange: () => {
                setExplodeItemActivities();
                ui.VCS.refresh();
            },
        },
        macroPanel: {
            name: game.i18n.localize("vs-combat-suite-dnd5e.settings.macroPanel.name"),
            hint: game.i18n.localize("vs-combat-suite-dnd5e.settings.macroPanel.hint"),
            scope: "world",
            config: true,
            type: Boolean,
            default: false,
            requiresReload: true,
            onChange: () => ui.VCS.refresh(),
        },
        switchEquip: {
            name: game.i18n.localize("vs-combat-suite-dnd5e.settings.switchEquip.name"),
            hint: game.i18n.localize("vs-combat-suite-dnd5e.settings.switchEquip.hint"),
            scope: "world",
            config: true,
            type: Boolean,
            default: true,
            onChange: () => ui.VCS.refresh(),
        },
        showSpecialActions: {
            name: game.i18n.localize("vs-combat-suite-dnd5e.settings.showSpecialActions.name"),
            hint: game.i18n.localize("vs-combat-suite-dnd5e.settings.showSpecialActions.hint"),
            scope: "world",
            config: true,
            type: Boolean,
            default: true,
            onChange: () => ui.VCS.refresh(),
        },
    };

    registerSettingsArray(settings);
}

export function getSetting(key) {
    return game.settings.get(MODULE_ID, key);
}

export async function setSetting(key, value) {
    return await game.settings.set(MODULE_ID, key, value);
}

function registerSettingsArray(settings) {
    for(const [key, value] of Object.entries(settings)) {
        game.settings.register(MODULE_ID, key, value);
    }
}