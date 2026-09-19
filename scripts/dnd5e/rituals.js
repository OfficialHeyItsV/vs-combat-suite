/**
 * Small D&D5E ritual helpers shared by the HUD and its focused tests.
 * D&D5E 5.3.x stores the ritual property in a Set, while plain test data and
 * older document shapes may expose an array or boolean map.
 */
export function hasRitualProperty(properties) {
    if (properties?.has instanceof Function) return properties.has("ritual");
    if (Array.isArray(properties)) return properties.includes("ritual");
    return properties?.ritual === true;
}

export function isRitualSpell(item) {
    return item?.type === "spell" && hasRitualProperty(item.system?.properties);
}

export function getRitualSpells(items) {
    return Array.from(items ?? []).filter(isRitualSpell);
}

/**
 * Keep D&D5E's native Activity.use workflow and checks, but tell its native
 * consumption layer not to spend a spell slot for this ritual invocation.
 */
export function ritualUseConfig(event) {
    return { event, legacy: false, consume: { spellSlot: false } };
}
