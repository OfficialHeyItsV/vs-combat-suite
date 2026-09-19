import { PARTIALS_PATH } from "./CoreHud.js";

export class Tooltip {
    constructor(tooltipData, triggerElement, orientation, locked = false) {
        this.element = document.createElement("div");
        this.element.classList.add(...this.classes);
        if (tooltipData.classes) this.element.classList.add(...tooltipData.classes);
        this._tooltipData = tooltipData;
        this._triggerElement = triggerElement;
        this._orientation = orientation ?? foundry.helpers.interaction.TooltipManager.TOOLTIP_DIRECTIONS.UP; //orientation;
        this._locked = locked;
    }

    get template() {
        return `${PARTIALS_PATH}Tooltip.hbs`;
    }

    get classes() {
        return ["vcs-tooltip"];
    }

    async getData() {
        return this._tooltipData;
    }

    get directionClass() {
        switch(this._orientation) {
            case foundry.helpers.interaction.TooltipManager.TOOLTIP_DIRECTIONS.UP:
                return "vcs-tooltip-up";
            case foundry.helpers.interaction.TooltipManager.TOOLTIP_DIRECTIONS.DOWN:
                return "vcs-tooltip-down";
            case foundry.helpers.interaction.TooltipManager.TOOLTIP_DIRECTIONS.LEFT:
                return "vcs-tooltip-left";
            case foundry.helpers.interaction.TooltipManager.TOOLTIP_DIRECTIONS.RIGHT:
                return "vcs-tooltip-right";
        }
        return "";
    }

    async render(...args) {
        await this._renderInner();
        const details = this.element.querySelector(".vcs-tooltip-details");
        if (details) {
            let closestMultiplier = 3;
            [2, 3].forEach((multiplier) => {
                if (details.children.length % multiplier === 0) closestMultiplier = multiplier;
            });
            details.style.gridTemplateColumns = `repeat(${Math.min(details.children.length, closestMultiplier)}, 1fr)`;
        }

        const body = this.element.querySelector('.vcs-tooltip-body');
        if (!body.textContent.trim()) {
            body.style.display = 'none';
        }

        if (ui.VCS._tooltip && ui.VCS._tooltip !== this) ui.VCS._tooltip._destroy(true);
        ui.VCS._tooltip = this;
        game.tooltip.activate(this._triggerElement, { html: this.element, cssClass: `vcs-tooltip-container ${this.directionClass}` , direction: this._orientation });
        const scale = game.settings.get("vs-combat-suite", "tooltipScale");
        // Reuse native positioning, but own dismissal across BOTH the feature and popup.
        this._hoverContainer = game.tooltip.lockTooltip();
        this._hoverContainer.style.setProperty('--vcs-tooltip-scale', scale);
        // Native proximity only covers the popup, so movement on a tall feature can dismiss it.
        game.tooltip.dismissLockedTooltip(this._hoverContainer);
        document.body.appendChild(this._hoverContainer);
        this._hoverContainer.showPopover();
        // pointerleave fires only after entering this popup, preserving travel grace before entry.
        this._hoverContainer.addEventListener("pointerleave", () => this._destroy(true));
        this._onHoverMove = event => {
            const inside = this._triggerElement.contains(event.target) || this._hoverContainer?.contains(event.target);
            if (inside) {
                clearTimeout(this._dismissTimer);
                this._dismissTimer = null;
            } else if (!this._dismissTimer) {
                this._dismissTimer = setTimeout(() => this._destroy(true), 650);
            }
        };
        this._onHoverKey = event => { if (event.key === "Escape") this._destroy(true); };
        document.addEventListener("pointermove", this._onHoverMove, true);
        document.addEventListener("keydown", this._onHoverKey);
        return this.element;
    }

    async _renderInner() {
        const data = await this.getData();
        this._data = data;
        const rendered = await (foundry.applications?.handlebars?.renderTemplate ?? renderTemplate) (this.template, data);
        const tempElement = document.createElement("div");
        tempElement.innerHTML = rendered;
        this.element.innerHTML = tempElement.firstElementChild.innerHTML;
        if (!data.subtitle) this.element.classList.add("hide-subtitle");
    }


    setScrollDelta(delta) {
        if (!this._scrollableElement) return;
        this._scrollableElement.scrollTop += delta;
    }

    _destroy(force = false) {
        if (this._destroyed) return;
        this._destroyed = true;
        clearTimeout(this._dismissTimer);
        document.removeEventListener("pointermove", this._onHoverMove, true);
        document.removeEventListener("keydown", this._onHoverKey);
        if (ui.VCS._tooltip === this) ui.VCS._tooltip = null;
        if (this._hoverContainer) {
            this._hoverContainer.remove();
            this._hoverContainer = null;
            return;
        }
        if (force) {
            this.element.remove();
            return;
        }
        this.element.animate([{ opacity: 1 }, { opacity: 0 }], {
            duration: 300,
            easing: "ease-in-out",
        }).onfinish = () => {
            this.element.remove();
        };
    }
}
