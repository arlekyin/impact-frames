/**
 * Стенды анимаций без Foundry: общий запуск.
 *
 * Статический сервер отдаёт корень модуля, поэтому страницы стендов импортируют его код как в Foundry —
 * /scripts/..., /styles/..., /assets/...; /node_modules/ (PIXI) и Playwright — из node_modules модуля, а если
 * их там нет — у соседнего gachadnd (только для инструментов). Chromium запускается с программным WebGL
 * (SwiftShader): шейдеры и PIXI работают и без видеокарты. Снимки и звуки ложатся в tools/stand/out.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const OUT = path.join(ROOT, 'tools/stand/out');
const NODE = [path.join(ROOT, 'node_modules'), path.join(ROOT, '../gachadnd/node_modules')].find(d => fs.existsSync(d));

async function chromiumOf() {
    const req = createRequire(path.join(path.dirname(NODE), 'package.json'));
    const mod = await import(pathToFileURL(req.resolve('playwright')).href);
    return (mod.chromium ?? mod.default.chromium);
}

const TYPES = {
    '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
    '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png',
    '.jpg': 'image/jpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.woff2': 'font/woff2', '.ttf': 'font/ttf'
};

function serve() {
    const server = http.createServer((req, res) => {
        const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
        const base = url.startsWith('/node_modules/') ? path.dirname(NODE) : ROOT;
        const file = path.join(base, url);
        if (!file.startsWith(base) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
            res.writeHead(404).end();
            return;
        }
        res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
        fs.createReadStream(file).pipe(res);
    });
    return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(server)));
}

/**
 * Сервер, браузер и страница стенда.
 * @param {string} page   Страница из tools/stand, например 'fists.html?calm'.
 * @param {object} view   { width, height, dpr }.
 */
export async function open(page, { width = 1600, height = 900, dpr = 1 } = {}) {
    fs.mkdirSync(OUT, { recursive: true });
    const server = await serve();
    const browser = await (await chromiumOf()).launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
    const tab = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: dpr });
    tab.on('pageerror', e => console.log('ОШИБКА СТРАНИЦЫ', e.message));
    tab.on('console', m => { const t = m.text(); if (m.type() !== 'debug' && !/GL|swift|WebGL/i.test(t)) console.log('  ›', t); });
    await tab.goto(`http://127.0.0.1:${server.address().port}/tools/stand/${page}`);
    await tab.waitForFunction(() => window.ready, null, { polling: 100, timeout: 60000 });
    return {
        page: tab,
        /** Снимок экрана в out/ */
        shot: name => tab.screenshot({ path: path.join(OUT, `${name}.png`), timeout: 120000 }),
        close: async () => { await browser.close(); server.close(); }
    };
}

/** Аргументы вида --calm --only=1200 → { calm: true, only: '1200' } */
export function args() {
    return Object.fromEntries(process.argv.slice(2).filter(a => a.startsWith('--')).map(a => {
        const [k, v] = a.slice(2).split('=');
        return [k, v ?? true];
    }));
}
