// Звуки ударов: node tools/stand/sound.mjs
// Каждый звук — out/sound/<имя>.wav. Если есть out/launch-cues.json (его пишет launch.mjs),
// ещё и вся сцена с настоящими таймингами — out/sound/launch_full.wav. Пик выше 1.0 — перегруз.
import fs from 'node:fs';
import path from 'node:path';
import { open, OUT } from './harness.mjs';

const cuesFile = path.join(OUT, 'launch-cues.json');
const cues = fs.existsSync(cuesFile) ? JSON.parse(fs.readFileSync(cuesFile, 'utf8')) : null;
if (!cues) console.log('Журнала стенда отлёта нет — вся сцена не собирается (сначала node tools/stand/launch.mjs).');
const dir = path.join(OUT, 'sound');
fs.mkdirSync(dir, { recursive: true });
const stand = await open('sound.html');
const files = await stand.page.evaluate(cues => renderAll(cues), cues);
for (const [name, [data, peak]] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, `${name}.wav`), Buffer.from(data, 'base64'));
    console.log(name.padEnd(14), 'пик', peak.toFixed(2), peak > 1 ? '— ПЕРЕГРУЗ' : '');
}
await stand.close();
