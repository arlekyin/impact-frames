/**
 * Решающий удар (автокадры; включает Мастер настройкой «Автокадры»). dnd5e применяет урон лотком под карточкой броска и передаёт в хук dnd5e.applyDamage
 * исходное сообщение (originatingMessage): по нему известен бьющий и был ли крит. Хук срабатывает у того,
 * кто применил урон (обычно Мастер), — он решает, был ли удар решающим, и рассылает кадр всем.
 *
 * Решающий (каждое — настройка Мастера): цель упала до 0 ПЗ; критическое попадание; за раз ушла доля
 * максимума ПЗ (по умолчанию половина); пал последний враг боя. По умолчанию — только удары героев игроков
 * и не чаще кадра за ход; из одного броска по нескольким целям — один кадр.
 *
 * Стиль кадра: свой у предмета, иначе свой у бьющего (флаг style), иначе по типу урона — рубящий — Разрез,
 * дробящий без оружия — Серия ударов, остальное — Стоп-кадр. Отброс — только своим стилем или по API.
 */

import { prefs } from "./settings.mjs";
import { emit, onSocket } from "./socket.mjs";
import { MODULE_ID } from "./settings.mjs";
import { playFrame, trace, tokenLine, knockback, STYLES, LAUNCH_FEET } from "./frame.mjs";

// Броски, по которым кадр уже был: урон по нескольким целям применяется по очереди
const shown = new Set();
let lastTurn = null;

const center = token => token?.center ? { x: token.center.x, y: token.center.y } : null;
const tokenOf = actor => actor?.token?.object ?? actor?.getActiveTokens?.()[0] ?? null;
// Предмет и активность броска: если предмета уже нет, dnd5e 6 падает внутри getAssociatedItem
const itemOf = message => { try { return message.getAssociatedItem?.() ?? null; } catch { return null; } };
const activityOf = message => { try { return message.getAssociatedActivity?.() ?? null; } catch { return null; } };

/** Свой стиль документа (предмета или актёра), если задан и известен */
const ownStyle = doc => { const style = doc?.getFlag?.(MODULE_ID, "style"); return STYLES.includes(style) ? style : null; };

/** Стиль кадра по броску */
export function styleFor(message, attacker) {
  const item = itemOf(message);
  const own = ownStyle(item) ?? ownStyle(attacker?.actor);
  if (own) return own;
  const types = (message.rolls ?? []).map(r => r.options?.type).filter(Boolean);
  if (types.includes("slashing")) return "slash";
  const unarmed = item?.system?.identifier === "unarmed-strike" || activityOf(message)?.attack?.type?.classification === "unarmed";
  if (types.includes("bludgeoning") && unarmed) return "barrage";
  return "freeze";
}

/** Бьющий по сообщению броска: токен говорящего на этой сцене, иначе первый токен его актёра */
function attackerOf(message) {
  const speaker = message?.speaker ?? {};
  const actor = ChatMessage.implementation.getSpeakerActor(speaker);
  const token = (speaker.scene === canvas?.scene?.id ? canvas.tokens?.get(speaker.token) : null) ?? tokenOf(actor);
  return actor ? { actor, token } : null;
}

/** Почему удар решающий: список причин, пустой — не решающий */
export function decisiveReasons(target, amount, message, attacker) {
  const hp = target.system?.attributes?.hp ?? {};
  const reasons = [];
  const dead = (Number(hp.value) || 0) <= 0;
  if (prefs.get("onKill") && dead) reasons.push("kill");
  if (prefs.get("onCrit") && (message.rolls ?? []).some(r => r.isCritical || r.options?.isCritical)) reasons.push("crit");
  if (prefs.get("onHeavy") && hp.max > 0 && amount >= hp.max * prefs.get("heavyShare") / 100) reasons.push("heavy");
  if (prefs.get("onLastEnemy") && dead && lastEnemy(target, attacker)) reasons.push("last");
  return reasons;
}

/** Пал последний из своих в бою: живых на стороне цели не осталось */
function lastEnemy(target, attacker) {
  const combat = game.combat?.started ? game.combat : null;
  const side = tokenOf(target)?.document?.disposition;
  if (!combat || side === undefined || side === attacker?.token?.document?.disposition) return false;
  return !combat.combatants.some(c => c.actor && c.actor !== target && c.token?.disposition === side && (Number(c.actor.system?.attributes?.hp?.value) || 0) > 0);
}

Hooks.on("dnd5e.applyDamage", (target, amount, options = {}) => {
  if (!(amount > 0) || !prefs.get("auto")) return;
  const message = options.originatingMessage ?? options.origin ?? null;
  if (!message) return trace(`урон ${amount} по ${target.name} — без броска в чате, бьющий неизвестен`);
  const attacker = attackerOf(message);
  if (!attacker) return trace(`урон по ${target.name} — у броска нет бьющего`);
  if (prefs.get("who") === "players" && !attacker.actor.hasPlayerOwner) return trace(`${attacker.actor.name} — не герой игрока`);
  const reasons = decisiveReasons(target, amount, message, attacker);
  if (!reasons.length) return trace(`урон ${amount} по ${target.name} не решающий`);
  if (shown.has(message.id)) return trace(`по броску ${message.id} кадр уже был`);
  const combat = game.combat?.started ? game.combat : null;
  const turn = combat ? `${combat.id}.${combat.round}.${combat.turn}` : null;
  if (turn && prefs.get("oncePerTurn") && turn === lastTurn) return trace("в этот ход кадр уже был");
  shown.add(message.id);
  lastTurn = turn;
  const targetToken = tokenOf(target);
    const style = styleFor(message, attacker), point = center(targetToken);
  const data = {
    reasons, style, art: attacker.actor.img, sceneId: canvas?.scene?.id ?? null, point,
    tokens: [attacker.token?.id, targetToken?.id].filter(Boolean),
    line: style === "slash" ? tokenLine(attacker.token?.id, point) : null,
    knock: style === "launch" ? knockback(attacker.token?.id, targetToken?.id, LAUNCH_FEET) : null,
    move: style === "launch" && !!prefs.get("launchMoves")
  };
  trace(`решающий удар (${reasons.join(", ")}), ${style}: ${attacker.actor.name} → ${target.name}`);
  emit("frame", { data });
  playFrame(data);
});

onSocket("frame", ({ data }) => playFrame(data));
