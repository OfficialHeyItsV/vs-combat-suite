import {ActionPanel} from "../components/main/actionPanel.js";
import {ActionButton} from "../components/main/buttons/actionButton.js";


export class PassTurnPanel extends ActionPanel {
  constructor(...args) {
    super(...args);
  }

  get label() {
    return "vs-combat-suite.hud.pass.name";
  }

  async _getButtons() {
    return [
      new PassTurnButton()
    ];
  }

  updateVisibility() {
    super.updateVisibility();
    this._buttons.forEach(button => button.render());
  }
}

class PassTurnButton extends ActionButton{

  get visible() {
    return !!game.combat?.started && game.combat?.combatant?.actor === this.actor;
  }

  get colorScheme() {
    return 4;
  }

  get label() {
    return "vs-combat-suite.hud.endturn.name";
  }

  get icon() {
    return "modules/vs-combat-suite/icons/duration.webp";
  }

  async _onLeftClick(event) {
    game.combat?.nextTurn();
  }
}