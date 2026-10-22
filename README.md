<!-- Черновик README модуля impact-frames (docs/impact-frames.md). Описывает первую версию, которой ещё нет;
     тексты автор перепишет сам. [ВСТАВИТЬ …] — места для ссылок и записей экрана. -->

# Impact Frames

**The decisive hit, felt by the whole table.** When a blow decides the fight — the enemy drops, a critical lands,
half of its hit points are gone in one swing — Impact Frames freezes the screen for a heartbeat, the way fighting
games and anime do: a hitstop, a camera snap to the point of impact, and two stark ink-and-light frames of the
attacker and the target. Then the battle goes on.

For Foundry VTT and D&D 5e. No setup, no animation packs, no files: everything is drawn and voiced in the browser.

[ВСТАВИТЬ: запись экрана — три стиля подряд]

## What it does

**Frames on decisive hits — automatically, if you want.** Turn on *Automatic frames* (off by default). Roll damage
as usual; when it is applied and it matters, every player sees the frame at the same moment. A hit is decisive when (each can be turned on or off, thresholds are yours):

- the target drops to 0 HP;
- the attack is a critical hit;
- one hit takes at least half of the target's maximum HP;
- the last enemy of the encounter falls.

By default only player characters trigger frames, and at most once per turn — so the moment stays special.

**Styles, picked by the damage type.** You can set your own style for any item or actor.

| Style | Default for | What you see |
|---|---|---|
| **Freeze** | everything else | hitstop, then two inverted frames with the fighters as silhouettes |
| **Slash** | slashing damage | the scene turns stark black-and-white and splits along the line of the cut |
| **Barrage** | unarmed bludgeoning | the screen darkens and a flurry of blows flies in, with cracks, dust and a white flash |
| **Launch** | manual or API only | camera closes in, a breath, a lunge, a flash — the target flies off and crashes down |

**Launch** is a visual by default: the token returns to its square afterwards. Turn on *Launch moves the token* to
knock it back for real.

**Scenes for the GM, without code.** A small window and macros, played for everyone or just for you:
camera push-in, pan and shake; cinematic letterbox; black-and-white or negative; ripples across the screen;
music duck and sudden silence; an impact frame on any tokens you pick — for that one story beat.

**Sound without files.** Every moment has its own synthesized sound with depth and reverb. Want your own? Point the
module to a folder of `.ogg` files.

## Comfort and accessibility

Each player chooses for themselves:

- **Full** — everything;
- **No flashes** — no white flash, no inversion, no screen shake;
- **Off**.

The module respects the system *reduce motion* setting. A slow-motion option (×1–×30) lets you study a frame.

## Installation

In Foundry: **Add-on Modules → Install Module**, paste the manifest URL and press *Install*:

```
[ВСТАВИТЬ: ссылка на module.json выпуска]
```

Enable **Impact Frames** in your world. Turn on *Automatic frames* in its settings — and the next decisive hit will
show a frame. Other modules (for example, Gacha Roguelike) call the frames themselves.

## Compatibility

- Foundry VTT **v13–v14**
- D&D 5e system **5.2–6.x**
- Works alongside **Dice So Nice** (the frame waits for the dice to settle), **Automated Animations** and
  **Animater** (the frame comes after their attack animation), **Token Choreography** (bodies move, the frame
  lands the hit).
- Other game systems: camera scenes work anywhere; automatic decisive hits are D&D 5e only for now.

## Settings

| Setting | Who | Default |
|---|---|---|
| Automatic frames | GM | off |
| Effects: full / no flashes / off | each player | no flashes |
| Slow motion | each player | ×1 |
| Decisive hit: drop to 0 HP / critical / half max HP / last enemy | GM | all on |
| Half max HP threshold | GM | 50% |
| Who triggers frames: player characters / everyone | GM | player characters |
| At most one frame per turn | GM | on |
| Launch moves the token | GM | off |
| Sound folder | GM | empty — synthesized |

## For developers

```js
const frames = game.modules.get('impact-frames')?.api;
// play a frame for everyone right now
frames?.play({ style: 'slash', attacker: tokenA, target: tokenB });
// a launch: lunge, barrage and the target flying 30 ft (move: true — knock it back for real)
frames?.launch({ casterId: tokenA.id, targetId: tokenB.id, move: true });
```

The scene building blocks are exposed as well: `camera`, `letterbox`, `stage`, `overlay`, `audio`.
Hook `impactFrames.preplay` lets your module change or cancel a frame.

## FAQ

**Does it change the rules?** No. It only shows what already happened. The single exception is *Launch moves the
token*, and it is off by default.

**Does it need JB2A or Sequencer?** No. Nothing to download besides the module.

**Will it spam my combat?** No: only decisive hits, only player characters by default, at most one per turn.

## License

[ВСТАВИТЬ: лицензия]

---

# По-русски

**Решающий удар, который чувствует весь стол.** Когда удар решает бой — враг падает, выпал крит, за один удар ушла
половина ПЗ, — Impact Frames на мгновение останавливает экран, как в файтингах и аниме: хитстоп, рывок камеры
к точке удара и два резких кадра бьющего и цели. И бой идёт дальше.

Для Foundry VTT и D&D 5e. Без настройки, без паков анимаций и файлов: всё рисуется и звучит в браузере.

- **Кадры на решающие удары — сами, если включить «Автокадры»** (по умолчанию выключено). Убил, крит, половина ПЗ за удар, последний враг — каждое можно выключить,
  пороги задаёт Мастер. По умолчанию — только удары героев игроков и не чаще раза за ход.
- **Стили по типу урона:** Стоп-кадр, Разрез (рубящий), Серия ударов (дробящий без оружия), Отброс (вручную).
  Свой стиль — любому предмету или персонажу. Отброс по умолчанию только зрелище; настройка «Отброс двигает токен»
  переносит токен по-настоящему.
- **Сцены для Мастера без кода:** наезд и тряска камеры, кинополосы, ч/б и негатив, волны, приглушение музыки,
  кадр по выбранным токенам — у всех или только у себя.
- **Звук без файлов** — синтез в браузере; свои `.ogg` — через папку в настройках.
- **Комфорт:** у каждого игрока — полный режим, «без вспышек» или выключено; учитывается системное «меньше движения».

**Установка:** «Модули → Установить модуль», вставьте ссылку на манифест: [ВСТАВИТЬ]. Включите модуль в мире.

**Совместимость:** Foundry v13–v14, dnd5e 5.2–6.x; уживается с Dice So Nice, Automated Animations, Animater,
Token Choreography.
