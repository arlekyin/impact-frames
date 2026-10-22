/**
 * Решающий удар в настоящей Foundry: бросок урона dnd5e (activity.rollDamage) и применение урона с исходным
 * сообщением — как лоток под карточкой броска. Автокадры (по умолчанию выключены) включаются на время проверки. Сцена «IF-тест»: герой игрока (Claude_player — владелец),
 * два врага, монстр. Кадр ловится хуком impactFrames.play; снимок кадра — с замедлением ×12.
 *
 *   node tools/foundry/decisive.mjs
 */

import { connect, checker } from "./harness.mjs";

const { page, log, shot, close, joinAs } = await connect();
const { check, summary } = checker();
const ev = (fn, arg) => page.evaluate(fn, arg);
const wait = ms => page.waitForTimeout(ms);

try {
  const ids = await ev(async () => {
    for (const c of game.combats.filter(c => c.scene?.name?.startsWith("IF-тест") || !c.scene)) await c.delete();
    for (const s of game.scenes.filter(s => s.name.startsWith("IF-тест"))) await s.delete();
    for (const a of game.actors.filter(a => a.name.startsWith("IF-тест"))) await a.delete();
    const scene = await Scene.create({ name: "IF-тест: удар", width: 1200, height: 700, padding: 0, grid: { size: 100, type: 1 }, backgroundColor: "#5d6b4a" });
    await scene.view();
    const sword = (await fromUuid(CONFIG.DND5E.weaponIds.longsword)).toObject();
    sword.system.equipped = true;
    const player = game.users.getName("Claude_player");
    const hero = await Actor.create({ name: "IF-тест: Герой", type: "character", img: "icons/svg/mystery-man.svg",
      system: { attributes: { hp: { value: 40, max: 40 } } }, prototypeToken: { actorLink: true, disposition: 1 },
      ownership: { default: 0, [player.id]: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER }, items: [sword] });
    const npc = name => Actor.create({ name: `IF-тест: ${name}`, type: "npc", system: { attributes: { hp: { value: 30, max: 30 } } },
      prototypeToken: { actorLink: true, disposition: -1, texture: { src: "icons/svg/skull.svg" } }, items: [sword] });
    const a = await npc("Враг А"), b = await npc("Враг Б"), m = await npc("Монстр");
    const at = (actor, x, y) => ({ ...actor.prototypeToken.toObject(), actorId: actor.id, name: actor.name, x: x * 100, y: y * 100 });
    await scene.createEmbeddedDocuments("Token", [at(hero, 4, 3), at(a, 5, 3), at(b, 6, 3), at(m, 5, 4)]);
    for (let i = 0; i < 40 && canvas.tokens.placeables.length < 4; i++) await new Promise(r => setTimeout(r, 100));
    window.__frames = [];
    Hooks.on("impactFrames.play", d => window.__frames.push(d.reasons ?? ["manual"]));
    return { scene: scene.id, hero: hero.id, a: a.id, b: b.id, m: m.id };
  });
  // Бросок урона мечом; вернуть id сообщения
  const roll = (actorId, crit = false) => ev(async ({ actorId, crit }) => {
    const item = game.actors.get(actorId).items.find(i => i.type === "weapon");
    await item.system.activities.getByType("attack")[0].rollDamage({ isCritical: crit }, { configure: false }, {});
    await new Promise(r => setTimeout(r, 400));
    return game.messages.contents.at(-1).id;
  }, { actorId, crit });
  // Применить урон, как лоток под карточкой: с исходным сообщением (или без него)
  const apply = (actorId, value, messageId) => ev(async ({ actorId, value, messageId }) => {
    const n = window.__frames.length;
    const message = messageId ? game.messages.get(messageId) : null;
    await game.actors.get(actorId).applyDamage([{ value, type: "slashing" }], { isDelta: true, ...(message ? { originatingMessage: message } : {}) });
    await new Promise(r => setTimeout(r, 500));
    return window.__frames.slice(n);
  }, { actorId, value, messageId });
  const set = (key, value) => ev(([k, v]) => game.settings.set("impact-frames", k, v), [key, value]);

  const api = await ev(() => ({ active: game.modules.get("impact-frames")?.active, api: Object.keys(game.modules.get("impact-frames")?.api ?? {}), who: game.settings.get("impact-frames", "who"), auto: game.settings.get("impact-frames", "auto") }));
  check("модуль включён, API (play, launch, decisiveReasons, cutscene); по умолчанию автокадры выключены, удары — героев игроков",
    api.active && ["play", "launch", "decisiveReasons", "cutscene"].every(k => api.api.includes(k)) && api.who === "players" && api.auto === false, JSON.stringify(api));

  let msg = await roll(ids.hero);
  let f = await apply(ids.a, 16, msg);
  check("автокадры выключены — тяжёлый удар без кадра", f.length === 0, JSON.stringify(f));
  await set("auto", true);
  await ev(id => game.actors.get(id).update({ "system.attributes.hp.value": 30 }), ids.a);

  msg = await roll(ids.hero);
  f = await apply(ids.a, 3, msg);
  check("лёгкий удар героя (3 из 30) — кадра нет", f.length === 0, JSON.stringify(f));
  msg = await roll(ids.hero);
  f = await apply(ids.a, 16, msg);
  check("тяжёлый удар (16 из 30, больше половины) — кадр «heavy»", f.length === 1 && f[0].includes("heavy"), JSON.stringify(f));
  f = await apply(ids.b, 16, msg);
  check("тот же бросок по второй цели — второго кадра нет", f.length === 0, JSON.stringify(f));
  msg = await roll(ids.hero);
  f = await apply(ids.a, 50, msg);
  check("цель пала — кадр «kill»", f.length === 1 && f[0].includes("kill"), JSON.stringify(f));
  msg = await roll(ids.hero, true);
  f = await apply(ids.b, 1, msg);
  check("критическое попадание, урон 1 — кадр «crit»", f.length === 1 && f[0].includes("crit"), JSON.stringify(f));
  f = await apply(ids.b, 20, null);
  check("урон без броска в чате (бьющий неизвестен) — кадра нет", f.length === 0, JSON.stringify(f));
  msg = await roll(ids.m);
  f = await apply(ids.hero, 25, msg);
  check("тяжёлый удар монстра — кадра нет: только герои игроков", f.length === 0, JSON.stringify(f));
  await set("who", "all");
  msg = await roll(ids.m);
  await ev(id => game.actors.get(id).update({ "system.attributes.hp.value": 40 }), ids.hero);
  f = await apply(ids.hero, 25, msg);
  check("«Чьи удары: все» — тяжёлый удар монстра даёт кадр", f.length === 1, JSON.stringify(f));
  await set("who", "players");

  // ---------- Бой: не чаще кадра за ход; последний враг
  await ev(async ({ a, b }) => {
    for (const id of [a, b]) await game.actors.get(id).update({ "system.attributes.hp.value": 30 });
  }, ids);
  const combatId = await ev(async ({ scene }) => {
    const combat = await Combat.create({ scene });
    await combat.createEmbeddedDocuments("Combatant", canvas.tokens.placeables.filter(t => !/Монстр/.test(t.name)).map(t => ({ tokenId: t.id, sceneId: scene, actorId: t.actor.id, initiative: 10 })));
    await combat.startCombat();
    return combat.id;
  }, ids);
  await wait(600);
  msg = await roll(ids.hero);
  f = await apply(ids.a, 16, msg);
  const second = await roll(ids.hero);
  const f2 = await apply(ids.b, 16, second);
  check("в бою: два тяжёлых удара в один ход — один кадр", f.length === 1 && f2.length === 0, JSON.stringify({ f, f2 }));
  await ev(() => game.combat.nextTurn());
  await wait(400);
  msg = await roll(ids.hero);
  f = await apply(ids.a, 50, msg);
  check("следующий ход: Враг А пал — кадр снова есть, Враг Б ещё жив — не последний", f.length === 1 && f[0].includes("kill") && !f[0].includes("last"), JSON.stringify(f));
  await ev(() => game.combat.nextTurn());
  await wait(400);
  msg = await roll(ids.hero);
  f = await apply(ids.b, 50, msg);
  check("пал последний враг — кадр «last»", f.length === 1 && f[0].includes("last"), JSON.stringify(f));
  await ev(id => game.combats.get(id)?.delete(), combatId);

  // ---------- Кадр на экране: замедление ×12, полный режим
  await ev(async () => {
    await game.settings.set("impact-frames", "effects", "full");
    await game.settings.set("impact-frames", "slow", 12);
  });
  const seen = await ev(async ({ hero, b }) => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const token = id => canvas.tokens.placeables.find(t => t.actor?.id === id);
    game.modules.get("impact-frames").api.play({ attacker: token(hero), target: token(b), everyone: false });
    await sleep(1400);
    return !!document.querySelector(".ifr-overlay");
  }, ids);
  await shot("decisive-frame");
  await wait(3500);
  const gone = await ev(() => !document.querySelector(".ifr-overlay"));
  check("кадр на экране — холст поверх сцены, потом убран", seen && gone, JSON.stringify({ seen, gone }));
  await ev(() => game.settings.set("impact-frames", "effects", "off"));
  const off = await ev(async ({ hero, b }) => {
    const token = id => canvas.tokens.placeables.find(t => t.actor?.id === id);
    game.modules.get("impact-frames").api.play({ attacker: token(hero), target: token(b), everyone: false });
    await new Promise(r => setTimeout(r, 400));
    return !!document.querySelector(".ifr-overlay");
  }, ids);
  check("«Выключено» — кадра на экране нет", !off, String(off));
  await ev(async () => { await game.settings.set("impact-frames", "effects", "calm"); await game.settings.set("impact-frames", "slow", 1); });

  // ---------- Игрок видит кадр, решённый у Мастера
  const pl = await joinAs("Claude_player");
  // Особенность стенда: два окна одного браузера — сообщения модулей от Мастера доходят до игрока, только если
  // Мастер подключился позже игрока. Документы синхронизируются в любом порядке; в игре так не бывает
  await page.reload();
  await page.waitForFunction(() => window.game?.ready, null, { polling: 250, timeout: 120000 });
  await page.waitForTimeout(1500);
  await ev(() => { window.__frames = []; Hooks.on("impactFrames.play", d => window.__frames.push(d.reasons ?? ["manual"])); });
  await pl.page.evaluate(async () => {
    window.__frames = [];
    Hooks.on("impactFrames.play", d => window.__frames.push(d.reasons ?? ["manual"]));
    await game.settings.set("impact-frames", "slow", 12);
  });
  await ev(async ({ b }) => game.actors.get(b).update({ "system.attributes.hp.value": 30 }), ids);
  msg = await roll(ids.hero);
  const gm = await apply(ids.b, 16, msg);
  await pl.page.waitForTimeout(1200);
  const remote = await pl.page.evaluate(() => ({ frames: window.__frames, overlay: !!document.querySelector(".ifr-overlay") }));
  await pl.shot("decisive-player");
  check("игрок: кадр пришёл от Мастера по сокету и показан у него", remote.frames.length === 1 && remote.frames[0].includes("heavy"), JSON.stringify({ gm, remote }));
  await pl.page.evaluate(() => game.settings.set("impact-frames", "slow", 1));
  await pl.close();

  await set("auto", false);
  const errors = log.filter(l => /impact-frames|ifr-/.test(l) && /error/i.test(l));
  check("ошибок модуля в консоли нет", !errors.length, errors.slice(0, 3).join(" | "));
} catch (error) {
  console.error(error);
  check("проверка дошла до конца", false, error.message);
}
const failed = summary();
await close();
process.exit(failed ? 1 : 0);
