import { showRangeFinder, showRangeRings, clearRangeFinders, clearRanges } from "./components/main/buttons/itemButton.js";
import { startTargetCursor } from "../targetCursor.js";

let activeTargetPicker = null;

export class TargetPicker{
  constructor ({token, targets, ranges}) {
    checkShowTargetPickerGuide();
    if (activeTargetPicker) activeTargetPicker.end(false);
    activeTargetPicker = this;
    this.ranges = ranges;
    this.token = token;
    this.resolve = null;
    this.reject = null;
    this._targetCount = game.user.targets.size;
    this._maxTargets = targets;

    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
    this.targetHook = Hooks.on("targetToken", (user, token, targeted) => { 
      if (user.id !== game.user.id) return;
      this.checkComplete();
    });

    this.movelistener = (event) => {
        this.update(event);
    };
    this.clicklistener = (event) => { 
      if(event.which === 3) {
        this.end(false);
      }
    };
    this.keyuplistener = (event) => { 
      if (event.key === "Escape") return this.end(false);
      //check for + and - keys
      if (event.key === "+" || event.key === "=") {
        this.maxTargets++;
      }
      if (event.key === "-" || event.key === "_") {
        if (this.maxTargets > 1) this.maxTargets--;
      }
    };
    document.addEventListener("mousemove", this.movelistener);
    document.addEventListener("mouseup", this.clicklistener);
    document.addEventListener("keyup", this.keyuplistener);
    this.sceneHook = Hooks.on("canvasTearDown", () => this.end(false));
    this.init();
  }

  checkComplete() { 
      this.targetCount = game.user.targets.size;
      if (this.targetCount >= this.maxTargets) {
          this.end(true);
      }
  }

  set targetCount(count) { 
    this._targetCount = count;
    this.update();
  }

  get targetCount() {
    return this._targetCount;
  }

  set maxTargets(count) {
    this._maxTargets = count;
    this.update();
    this.checkComplete();
  }

  get maxTargets() {
    return this._maxTargets;
  }

  init() {
    if(game.settings.get("vs-combat-suite", "rangepickerclear")) {
      for (const token of Array.from(game.user.targets)) token.setTarget(false, { releaseOthers: false });
    }
    this._targetCount = game.user.targets.size;
    const element = document.createElement("div");
    element.classList.add("vcs-target-picker");
    document.body.appendChild(element);
    this.element = element;
    if (!this.maxTargets || this.targetCount == this.maxTargets) return this.end(true);
    ui.controls.activate({ control: "tokens", tool: "target" });
    this.clearCursor = startTargetCursor();
    const tokenSizeOffset = Math.max(this.token.document.width, this.token.document.height) * 0.5 * canvas.scene.dimensions.distance;
    showRangeRings(this.ranges.normal, this.ranges.long, this.token, tokenSizeOffset);
  }

  update(event) {
    if(!this.element) return;
    if (event) {
      const clientX = event.clientX;
      const clientY = event.clientY;
      this.element.style.left = clientX + 20 + "px";
      this.element.style.top = clientY + "px";
    }
    this.element.innerText = `${this.targetCount}/${this.maxTargets} Targets`;
  }

  end(res) {
    if (this._ended) return;
    this._ended = true;
    this.clearCursor?.();
    clearRanges(true);
    activeTargetPicker = null;
    this.resolve(res);
    this.element.remove();
    Hooks.off("targetToken", this.targetHook);
    Hooks.off("canvasTearDown", this.sceneHook);
    document.removeEventListener("mousemove", this.movelistener);
    document.removeEventListener("mouseup", this.clicklistener);
    document.removeEventListener("keyup", this.keyuplistener);
    ui.controls.activate({ control: "tokens", tool: "select" });
  }
}

function checkShowTargetPickerGuide() {
  if (!game.settings.get("vs-combat-suite", "targetPickerGuideShown")) {
    window.ui.VCS.showTargetPickerGuide();
  }
}

export async function showTargetPickerGuide() {
  let list = "";
  const elementsCount = 4;
  for (let i = 0; i < elementsCount; i++) {
    list += `<li class="notification info" style="font-weight: 900">${game.i18n.localize(`vs-combat-suite.targetPicker.dialog.list.${i}`)}</li>`;
  }
  const result = await foundry.applications.api.DialogV2.prompt({
    window: { title: game.i18n.localize("vs-combat-suite.targetPicker.dialog.title") },
    content: `<ul class="guide-list" style="list-style:none;padding:0">${list}</ul>`,
    close: () => {return false},
  });
  if(result) game.settings.set("vs-combat-suite", "targetPickerGuideShown", true);
}
