import { registerTargetedHooks } from "./special-attacks.js";

export const MODULE_ID = "vs-combat-suite";
export const STANDALONE_MODULE_ID = "targeted-special-attacks";

// Foundry creates game.modules before the init hook runs. Keep this decision
// inside init so the bundled module never registers hooks or sockets while the
// standalone module is active, even when both manifests are enabled.
let bootDecision = null;

// The targeted stylesheet was added after the first Suite build. Keep the
// embedded feature usable in a client which has stale manifest style links,
// while avoiding a duplicate link when Foundry already loaded the resource.
function ensureTargetedStyles() {
  if (!globalThis.document?.head?.querySelectorAll || !document.createElement) return false;
  const path = `modules/${MODULE_ID}/styles/targeted.css`;
  const loaded = Array.from(document.head.querySelectorAll("link[rel=stylesheet]"))
    .some(link => String(link.getAttribute?.("href") ?? link.href ?? "")
      .split(/[?#]/, 1)[0].replaceAll("\\", "/").endsWith(path));
  if (loaded) return false;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = path;
  link.dataset.vcsTargetedStyles = "true";
  document.head.append(link);
  return true;
}

export function standaloneIsActive() {
  const modules = globalThis.game?.modules;
  if (!modules || typeof modules.get !== "function") return false;
  return Boolean(modules.get(STANDALONE_MODULE_ID)?.active);
}

export function bootTargetedAttacks() {
  if (bootDecision) return bootDecision;

  if (standaloneIsActive()) {
    bootDecision = "standalone";
    console.info("V's Combat Suite | Standalone Targeted Attacks is active; bundled targeted hooks are disabled.");
    return bootDecision;
  }

  registerTargetedHooks();
  bootDecision = "bundled";
  return bootDecision;
}

// Do not inspect game.modules during module evaluation. In Foundry's startup
// sequence the collection is authoritative by init, which is the first safe
// point to choose between the standalone API and the embedded implementation.
Hooks.once("init", () => {
  ensureTargetedStyles();
  bootTargetedAttacks();
});
