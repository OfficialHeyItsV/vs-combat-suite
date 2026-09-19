let activeCleanup = null;

// Shared visual only: native Foundry tools retain all token hit-testing.
export function startTargetCursor() {
  activeCleanup?.();
  const cursor = document.createElement("div");
  cursor.className = "vcs-target-cursor";
  cursor.setAttribute("aria-hidden", "true");
  cursor.style.display = "none";
  document.body.appendChild(cursor);
  const move = event => {
    cursor.style.left = `${event.clientX}px`;
    cursor.style.top = `${event.clientY}px`;
    cursor.style.display = "block";
  };
  document.addEventListener("pointermove", move, { passive: true });
  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    document.removeEventListener("pointermove", move);
    cursor.remove();
    if (activeCleanup === cleanup) activeCleanup = null;
  };
  activeCleanup = cleanup;
  return cleanup;
}
