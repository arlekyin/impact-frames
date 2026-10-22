/**
 * Настройки модуля. Как показывать кадры (полностью, без вспышек, выключено) и замедление — у каждого игрока
 * свои: кому-то вспышки и мелькание мешают, а другим за столом — нет. Что считать решающим ударом — решает Мастер.
 */

export const MODULE_ID = "impact-frames";

const reducedMotion = () => globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

export function registerSettings() {
  const reg = (key, data) => game.settings.register(MODULE_ID, key, {
    name: `IFRAMES.Settings.${key}.name`,
    hint: `IFRAMES.Settings.${key}.hint`,
    config: true,
    ...data
  });
  // Показ — у каждого свой; «меньше движения» в системе — по умолчанию выключено
  reg("effects", {
    scope: "client", type: String, default: reducedMotion() ? "off" : "calm",
    choices: { full: "IFRAMES.Effects.full", calm: "IFRAMES.Effects.calm", off: "IFRAMES.Effects.off" }
  });
  reg("slow", { scope: "client", type: Number, range: { min: 1, max: 30, step: 1 }, default: 1 });
  // Что считать решающим ударом
  reg("onKill", { scope: "world", type: Boolean, default: true });
  reg("onCrit", { scope: "world", type: Boolean, default: true });
  reg("onHeavy", { scope: "world", type: Boolean, default: true });
  reg("heavyShare", { scope: "world", type: Number, range: { min: 25, max: 100, step: 5 }, default: 50 });
  reg("onLastEnemy", { scope: "world", type: Boolean, default: true });
  reg("who", {
    scope: "world", type: String, default: "players",
    choices: { players: "IFRAMES.Who.players", all: "IFRAMES.Who.all" }
  });
  reg("oncePerTurn", { scope: "world", type: Boolean, default: true });
  reg("sound", { scope: "world", type: String, default: "", filePicker: "audio" });
}

const get = key => game.settings.get(MODULE_ID, key);

/** Текущие настройки: читаются в момент удара, не каждый кадр */
export const prefs = {
  /** Кадры у этого игрока не выключены */
  on: () => get("effects") !== "off",
  /** Без вспышек: без белой вспышки и инверсии, первый кадр приглушён */
  calm: () => get("effects") !== "full",
  /** Во сколько раз медленнее показывать */
  slow: () => Math.max(1, Number(get("slow")) || 1),
  /** Громкость звуков интерфейса Foundry */
  volume: () => Number(game.settings.get("core", "globalInterfaceVolume") ?? 0.5),
  get
};
