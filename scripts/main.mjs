/**
 * Impact Frames — кадры решающего удара для dnd5e.
 * Точка входа: настройки, сокет, распознавание решающего удара, API для макросов и других модулей.
 */

import { MODULE_ID, registerSettings } from "./settings.mjs";
import { registerSocket, emit } from "./socket.mjs";
import { playFrame } from "./frame.mjs";
import { decisiveReasons } from "./decisive.mjs";
import * as cutscene from "./cutscene/index.mjs";

/**
 * Кадр по токенам: бьющий и цель. Без них — выделенный токен и цель (клавиша T).
 * @param {object} [options]
 * @param {Token} [options.attacker]
 * @param {Token} [options.target]
 * @param {boolean} [options.everyone=true]  Показать всем, а не только себе.
 */
function play({ attacker = canvas?.tokens?.controlled[0], target = game.user.targets.first(), everyone = true } = {}) {
  if (!target) return ui.notifications.warn(game.i18n.localize("IFRAMES.Warn.target"));
  const data = {
    art: attacker?.actor?.img ?? target.actor?.img, sceneId: canvas.scene?.id ?? null,
    point: { x: target.center.x, y: target.center.y }, tokens: [attacker?.id, target.id].filter(Boolean)
  };
  if (everyone) emit("frame", { data });
  return playFrame(data);
}

Hooks.once("init", () => registerSettings());

Hooks.once("setup", () => {
  game.modules.get(MODULE_ID).api = { play, decisiveReasons, cutscene };
});

Hooks.once("ready", () => registerSocket());
