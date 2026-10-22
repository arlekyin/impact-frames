/**
 * Impact Frames — кадры решающего удара для dnd5e.
 * Точка входа: настройки, сокет, распознавание решающего удара, API для макросов и других модулей.
 */

import { MODULE_ID, prefs, registerSettings } from "./settings.mjs";
import { registerSocket, emit } from "./socket.mjs";
import { playFrame, warmUp, tokenLine, knockback, STYLES, LAUNCH_FEET } from "./frame.mjs";
import { decisiveReasons, styleFor } from "./decisive.mjs";
import * as cutscene from "./cutscene/index.mjs";

/**
 * Кадр по токенам: бьющий и цель. Без них — выделенный токен и цель (клавиша T).
 * @param {object} [options]
 * @param {Token} [options.attacker]
 * @param {Token} [options.target]
 * @param {string} [options.style="freeze"]  freeze, slash, barrage, launch.
 * @param {boolean} [options.everyone=true]  Показать всем, а не только себе.
 */
function play({ attacker = canvas?.tokens?.controlled[0], target = game.user.targets.first(), style = "freeze", everyone = true } = {}) {
  if (!target) return ui.notifications.warn(game.i18n.localize("IFRAMES.Warn.target"));
  const point = { x: target.center.x, y: target.center.y };
  const data = {
    style, art: attacker?.actor?.img ?? target.actor?.img, sceneId: canvas.scene?.id ?? null,
    point, tokens: [attacker?.id, target.id].filter(Boolean),
    line: style === "slash" ? tokenLine(attacker?.id, point) : null,
    knock: style === "launch" ? knockback(attacker?.id, target.id, LAUNCH_FEET) : null,
    move: style === "launch" && !!prefs.get("launchMoves")
  };
  if (everyone) emit("frame", { data });
  return playFrame(data);
}

/**
 * Удар с отлётом цели по id токенов: подъезд, вдох, рывок, серия ударов, полёт и приземление.
 * @param {object} options
 * @param {string} options.casterId, options.targetId  Токены бьющего и цели на текущей сцене.
 * @param {object} [options.knock]   Куда летит цель (knockback); без него — вычисляется на LAUNCH_FEET футов.
 * @param {boolean} [options.move]   Перенести цель по-настоящему (переносит Мастер); по умолчанию — настройка.
 * @param {boolean} [options.everyone=true]
 */
function launch({ casterId, targetId, knock = null, move = !!prefs.get("launchMoves"), everyone = true } = {}) {
  const target = canvas?.tokens?.get(targetId);
  const data = {
    style: "launch", art: canvas?.tokens?.get(casterId)?.actor?.img ?? target?.actor?.img, sceneId: canvas?.scene?.id ?? null,
    point: target ? { x: target.center.x, y: target.center.y } : null, tokens: [casterId, targetId].filter(Boolean),
    knock: knock ?? knockback(casterId, targetId, LAUNCH_FEET), move
  };
  if (everyone) emit("frame", { data });
  return playFrame(data);
}

Hooks.once("init", () => registerSettings());

Hooks.once("setup", () => {
  game.modules.get(MODULE_ID).api = { play, launch, knockback, setStyle, styles: STYLES, decisiveReasons, styleFor, cutscene };
});

/** Свой стиль кадра предмету или персонажу; null — снова по типу урона */
function setStyle(doc, style) {
  if (style && !STYLES.includes(style)) throw new Error(`${MODULE_ID}: неизвестный стиль «${style}» (${STYLES.join(", ")})`);
  return style ? doc.setFlag(MODULE_ID, "style", style) : doc.unsetFlag(MODULE_ID, "style");
}

Hooks.once("ready", () => {
  registerSocket();
  // Рисунки ударов — заранее, когда браузер свободен: первый удар не ждёт подготовки
  if (prefs.on()) setTimeout(warmUp, 3000);
});
