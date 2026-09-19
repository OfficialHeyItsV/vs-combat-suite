import { defaultTheme } from "./config.js";
import { EchThemeOptions } from "./app/EchThemeOptions.js";

export function registerSettings() {
        game.settings.register("vs-combat-suite", "globalTheme", {
        name: game.i18n.localize("vs-combat-suite.settings.globalTheme.name"),
        hint: game.i18n.localize("vs-combat-suite.settings.globalTheme.hint"),
        scope: "world",
        config: true,
        type: String,
        requiresReload: true,
        choices: {
            client: game.i18n.localize("vs-combat-suite.settings.globalTheme.choices.client"),
            world: game.i18n.localize("vs-combat-suite.settings.globalTheme.choices.world"),
        },
        default: "client",
        onChange: () => ui.VCS.refresh(),
    });

    const globalTheme = game.settings.get("vs-combat-suite", "globalTheme");

    game.settings.register("vs-combat-suite", "echThemeData", {
        name: "Data used for Theming",
        type: Object,
        default: defaultTheme,
        scope: globalTheme,
        config: false,
        onChange: () => {
            ui.VCS.setColorSettings();
            ui.VCS.refresh();
        },
    });

    game.settings.register("vs-combat-suite", "targetPickerGuideShown", {
        type: Boolean,
        default: false,
        scope: "client",
        config: false,
    });

    // Define a settings submenu which handles advanced configuration needs
    game.settings.registerMenu("vs-combat-suite", "echThemeOptions", {
        name: game.i18n.localize("vs-combat-suite.settings.thememenu.name"),
        label: game.i18n.localize("vs-combat-suite.settings.thememenu.label"),
        hint: game.i18n.localize("vs-combat-suite.settings.thememenu.hint"),
        icon: "fas fa-bars",
        type: EchThemeOptions,
        restricted: globalTheme === "world",
    });

    game.settings.register("vs-combat-suite", "rangefinder", {
        name: game.i18n.localize("vs-combat-suite.settings.rangefinder.name"),
        hint: game.i18n.localize("vs-combat-suite.settings.rangefinder.hint"),
        scope: "world",
        config: true,
        type: Boolean,
        default: true,
        onChange: () => ui.VCS.refresh(),
    });

    game.settings.register("vs-combat-suite", "rangepicker", {
        name: game.i18n.localize("vs-combat-suite.settings.rangepicker.name"),
        hint: game.i18n.localize("vs-combat-suite.settings.rangepicker.hint"),
        scope: "world",
        config: true,
        type: Boolean,
        default: true,
        onChange: () => ui.VCS.refresh(),
    });

    game.settings.register("vs-combat-suite", "rangepickerclear", {
        name: game.i18n.localize("vs-combat-suite.settings.rangepickerclear.name"),
        hint: game.i18n.localize("vs-combat-suite.settings.rangepickerclear.hint"),
        scope: "world",
        config: true,
        type: Boolean,
        default: false,
        onChange: () => ui.VCS.refresh(),
    });

    game.settings.register("vs-combat-suite", "openCombatStart", {
        name: game.i18n.localize("vs-combat-suite.settings.openCombatStart.name"),
        hint: game.i18n.localize("vs-combat-suite.settings.openCombatStart.hint"),
        scope: "world",
        config: true,
        type: Boolean,
        default: false,
        onChange: () => ui.VCS.refresh(),
    });

    game.settings.register("vs-combat-suite", "dialogTheme", {
        name: game.i18n.localize("vs-combat-suite.settings.dialogTheme.name"),
        hint: game.i18n.localize("vs-combat-suite.settings.dialogTheme.hint"),
        scope: "world",
        config: true,
        type: Boolean,
        default: true,
    });

    game.settings.register("vs-combat-suite", "autoScale", {
        name: game.i18n.localize("vs-combat-suite.settings.autoScale.name"),
        hint: game.i18n.localize("vs-combat-suite.settings.autoScale.hint"),
        scope: "client",
        config: true,
        type: Boolean,
        default: true,
        onChange: () => ui.VCS.refresh(),
    });

    game.settings.register("vs-combat-suite", "scale", {
        name: game.i18n.localize("vs-combat-suite.settings.scale.name"),
        hint: game.i18n.localize("vs-combat-suite.settings.scale.hint"),
        scope: "client",
        config: true,
        range: {
            min: 0.1,
            max: 1,
            step: 0.01,
        },
        type: Number,
        default: 0.5,
        onChange: () => ui.VCS.refresh(),
    });

    game.settings.register("vs-combat-suite", "alwaysOn", {
        name: game.i18n.localize("vs-combat-suite.settings.alwaysOn.name"),
        hint: game.i18n.localize("vs-combat-suite.settings.alwaysOn.hint"),
        scope: "client",
        config: true,
        type: Boolean,
        default: false,
        onChange: () => ui.VCS.refresh(),
    });

    game.settings.register("vs-combat-suite", "leftPos", {
        name: game.i18n.localize("vs-combat-suite.settings.leftPos.name"),
        hint: game.i18n.localize("vs-combat-suite.settings.leftPos.hint"),
        scope: "client",
        config: true,
        type: Number,
        default: 15,
        onChange: () => ui.VCS.refresh(),
    });

    game.settings.register("vs-combat-suite", "botPos", {
        name: game.i18n.localize("vs-combat-suite.settings.botPos.name"),
        hint: game.i18n.localize("vs-combat-suite.settings.botPos.hint"),
        scope: "client",
        config: true,
        type: Number,
        default: 15,
        onChange: () => ui.VCS.refresh(),
    });

    game.settings.register("vs-combat-suite", "hideMacroPlayers", {
        name: game.i18n.localize("vs-combat-suite.settings.hideMacroPlayers.name"),
        hint: game.i18n.localize("vs-combat-suite.settings.hideMacroPlayers.hint"),
        scope: "client",
        config: true,
        type: Boolean,
        default: true,
        onChange: () => ui.VCS.refresh(),
    });

    game.settings.register("vs-combat-suite", "playerDetailsBottom", {
        name: game.i18n.localize("vs-combat-suite.settings.playerDetailsBottom.name"),
        hint: game.i18n.localize("vs-combat-suite.settings.playerDetailsBottom.hint"),
        scope: "client",
        config: true,
        type: Boolean,
        default: false,
        onChange: () => ui.VCS.refresh(),
    });

    game.settings.register("vs-combat-suite", "showTooltips", {
        name: game.i18n.localize("vs-combat-suite.settings.showTooltips.name"),
        hint: game.i18n.localize("vs-combat-suite.settings.showTooltips.hint"),
        scope: "client",
        config: true,
        type: Boolean,
        default: true,
        onChange: () => ui.VCS.refresh(),
    });

    game.settings.register("vs-combat-suite", "tooltipScale", {
        name: game.i18n.localize("vs-combat-suite.settings.tooltipScale.name"),
        hint: game.i18n.localize("vs-combat-suite.settings.tooltipScale.hint"),
        scope: "client",
        config: true,
        range: {
            min: 0.1,
            max: 1,
            step: 0.01,
        },
        type: Number,
        default: 0.7,
        onChange: () => ui.VCS.refresh(),
    });

    game.settings.register("vs-combat-suite", "fadeOutInactive", {
        name: game.i18n.localize("vs-combat-suite.settings.fadeOutInactive.name"),
        hint: game.i18n.localize("vs-combat-suite.settings.fadeOutInactive.hint"),
        scope: "client",
        config: true,
        type: Boolean,
        default: false,
        onChange: () => {
            ui.VCS.setColorSettings();
            ui.VCS.refresh();
        },
    });

    game.settings.register("vs-combat-suite", "fadeoutDelay", {
        name: game.i18n.localize("vs-combat-suite.settings.fadeoutDelay.name"),
        hint: game.i18n.localize("vs-combat-suite.settings.fadeoutDelay.hint"),
        scope: "client",
        config: true,
        type: Number,
        default: 4,
        onChange: () => {
            ui.VCS.setColorSettings();
            ui.VCS.refresh();
        },
    });

    game.settings.register("vs-combat-suite", "fadeoutOpacity", {
        name: game.i18n.localize("vs-combat-suite.settings.fadeoutOpacity.name"),
        hint: game.i18n.localize("vs-combat-suite.settings.fadeoutOpacity.hint"),
        scope: "client",
        config: true,
        type: Number,
        range: {
            min: 0,
            max: 1,
            step: 0.05,
        },
        default: 0.1,
        onChange: () => {
            ui.VCS.setColorSettings();
            ui.VCS.refresh();
        },
    });

    game.settings.register("vs-combat-suite", "noBlur", {
        name: game.i18n.localize("vs-combat-suite.settings.noBlur.name"),
        hint: game.i18n.localize("vs-combat-suite.settings.noBlur.hint"),
        scope: "client",
        config: true,
        type: Boolean,
        default: false,
        onChange: () => {
            ui.VCS.setColorSettings();
            ui.VCS.refresh();
        },
    });

    game.settings.register("vs-combat-suite", "suppressWarnings", {
        name: game.i18n.localize("vs-combat-suite.settings.suppressWarnings.name"),
        hint: game.i18n.localize("vs-combat-suite.settings.suppressWarnings.hint"),
        scope: "world",
        config: true,
        type: Boolean,
        default: false,
    });
}

