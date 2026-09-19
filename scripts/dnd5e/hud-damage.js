const MODULE = "vs-combat-suite";
const pending = new Set();

export function registerMidiHudAutomation() {
    game.settings.register(MODULE, "midiAutomationBackup", {scope:"world", config:false, type:Object, default:{}});
    Hooks.once("ready", async () => {
        if (game.modules.get("midi-qol")?.active && game.user.isGM) {
            try { await ensureMidiAutomation(true); }
            catch (error) { console.error("V's Combat Suite | Midi configuration", error); ui.notifications.error("Combat Suite could not enable Midi hit/save checking and automatic damage."); }
        }
    });
}

export async function ensureMidiAutomation(spells = false) {
    if (game.settings.get("midi-qol", "EnableWorkflow") === false) await game.settings.set("midi-qol", "EnableWorkflow", true);
    const settings = game.settings.get("midi-qol", "ConfigSettings");
    const changes = {};
    if (!settings.autoCheckHit || settings.autoCheckHit === "none") changes.autoCheckHit = "all";
    if (!["yes", "yesCard", "yesCardMisses"].includes(settings.autoApplyDamage)) changes.autoApplyDamage = "yesCard";
    if (spells && (!settings.autoCheckSaves || ["none", "allNoRoll"].includes(settings.autoCheckSaves))) changes.autoCheckSaves = "allShow";
    if (!Object.keys(changes).length) return true;
    if (!game.user.isGM) {
        ui.notifications.warn("A GM must reload Combat Suite to enable Midi hit/save checking and automatic damage.");
        return false;
    }
    const backup = game.settings.get(MODULE, "midiAutomationBackup");
    if (!backup.saved) await game.settings.set(MODULE, "midiAutomationBackup", {
        saved:true, autoCheckHit:settings.autoCheckHit, autoApplyDamage:settings.autoApplyDamage,
    });
    if (changes.autoCheckSaves && !("autoCheckSaves" in backup)) {
        const saved = game.settings.get(MODULE, "midiAutomationBackup");
        await game.settings.set(MODULE, "midiAutomationBackup", {...saved, autoCheckSaves: settings.autoCheckSaves ?? null});
    }
    await game.settings.set("midi-qol", "ConfigSettings", {...settings, ...changes});
    return true;
}

export async function useMidiHudAttack(activity, usage, event, position, tokens, targeted = null) {
    const api = globalThis.MidiQOL;
    if (typeof api?.completeActivityUse !== "function") {
        ui.notifications.error("Midi-QOL is enabled but its attack API is not ready. Reload Foundry before attacking.");
        return;
    }
    const spell = activity.item?.type === "spell";
    const requiresTarget = !spell || (!activity.target?.template?.type && !activity.target?.template?.units
        && ["creature", "ally", "enemy"].includes(activity.target?.affects?.type));
    const targetUuids = tokens.map(token => token.document?.uuid).filter(Boolean);
    if (requiresTarget && !targetUuids.length) { ui.notifications.warn("Select a creature before attacking."); return; }
    if (!await ensureMidiAutomation(spell)) return;
    if (pending.has(activity.uuid)) return;
    pending.add(activity.uuid);
    const nonce = foundry.utils.randomID();
    const hooks = [];
    const positionRoll = (config, dialog) => {
        const subject = config.workflow?.activity ?? config.subject;
        if (subject?.uuid !== activity.uuid) return;
        dialog.configure = true;
        dialog.options ??= {};
        dialog.options.position = {...dialog.options.position, ...position};
    };
    hooks.push(["dnd5e.preRollAttack", Hooks.on("dnd5e.preRollAttack", positionRoll)]);
    hooks.push(["dnd5e.preRollDamage", Hooks.on("dnd5e.preRollDamage", positionRoll)]);
    hooks.push(["preCreateChatMessage", Hooks.on("preCreateChatMessage", (document, data, options) => {
        if ((data.flags?.[MODULE]?.hudMidiUse ?? document.getFlag?.(MODULE, "hudMidiUse")) === nonce) options.notify = false;
    })]);
    if (targeted) {
        const adjustedRolls = new WeakSet();
        hooks.push(["dnd5e.preRollAttack", Hooks.on("dnd5e.preRollAttack", config => {
            const subject = config.workflow?.activity ?? config.subject;
            if (subject?.uuid !== activity.uuid || !targeted.attack) return;
            const roll = config.rolls?.[0];
            if (!roll) {
                if (config.workflow) config.workflow.aborted = true;
                ui.notifications.error("Targeted attack modifier could not be added. Attack stopped.");
                return false;
            }
            if (adjustedRolls.has(roll)) return;
            adjustedRolls.add(roll);
            roll.parts ??= [];
            roll.parts.push(String(targeted.attack));
        })]);
        hooks.push(["midi-qol.DamageRollComplete", Hooks.on("midi-qol.DamageRollComplete", async workflow => {
            if (workflow.activity?.uuid !== activity.uuid || workflow.workflowOptions?.vcsAttackId !== nonce) return;
            if (!targeted.damage || workflow._vcsTargetedScaled) return;
            workflow._vcsTargetedScaled = true;
            try {
                const multiplierRoll = await new Roll(targeted.damage).evaluate();
                const multiplier = Number(multiplierRoll.total);
                if (!Number.isFinite(multiplier) || multiplier < 0) throw new Error("Invalid targeted damage multiplier");
                await multiplierRoll.toMessage({flavor: targeted.label + " targeted damage multiplier"});
                const scale = async rolls => Promise.all((rolls ?? []).map(async roll => {
                    // The native roll has already resolved critical dice. Scale that result once, preserving its type/properties.
                    return new CONFIG.Dice.DamageRoll("(" + roll.total + ") * " + multiplier, {}, {...roll.options}).evaluate();
                }));
                await workflow.setDamageRolls(await scale(workflow.damageRolls));
                if (workflow.bonusDamageRolls?.length) await workflow.setBonusDamageRolls(await scale(workflow.bonusDamageRolls));
                workflow.vcsTargetedMultiplier = multiplier;
            } catch (error) {
                workflow.aborted = true;
                ui.notifications.error("Targeted damage could not be adjusted. Midi damage application was stopped.");
                console.error("V's Combat Suite | Targeted Midi damage", error);
            }
        })]);
    }
    try {
        // Midi owns hit resolution, criticals, damage rolls, resistance and GM-side HP updates.
        // Never run the Suite's native/manual damage path alongside this workflow.
        const workflow = await api.completeActivityUse(activity, {
            ...usage,
            midiOptions: {
                targetUuids, configureDialog:spell,
                workflowOptions: {
                    autoRollAttack:true, autoRollDamage:"onHit", vcsAttackId:nonce,
                    fastForwardAttack:false, fastForwardDamage:false,
                    targetConfirmation:"none",
                },
            },
        }, {configure:spell, options:{position}}, {
            systemCard:false, data:{flags:{[MODULE]:{hudMidiUse:nonce}}},
        });
        return workflow?.aborted ? undefined : workflow;
    } finally {
        for (const [name, id] of hooks) Hooks.off(name, id);
        pending.delete(activity.uuid);
    }
}
