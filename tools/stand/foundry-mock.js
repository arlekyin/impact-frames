// Минимум Foundry для стендов: настройки, хуки, сокет, уведомления.
// В адресе: ?calm — без вспышек, ?slow=N — замедление кадров в N раз.
(() => {
    const query = new URLSearchParams(location.search);
    const store = {
        effects: query.has('calm') ? 'calm' : 'full', slow: Number(query.get('slow')) || 1, sound: '', soundFolder: '', launchMoves: false,
        globalInterfaceVolume: 0.5
    };
    const hooks = {};
    window.Hooks = {
        events: hooks,
        on: (name, fn) => { (hooks[name] ??= []).push(fn); return fn; },
        off: (name, fn) => { hooks[name] = (hooks[name] ?? []).filter(f => f !== fn); },
        once: (name, fn) => (hooks[name] ??= []).push(fn),
        // Как в Foundry: false, если какой-то обработчик вернул false
        call: (name, ...args) => !(hooks[name] ?? []).some(fn => fn(...args) === false),
        callAll: (name, ...args) => hooks[name]?.forEach(fn => fn(...args))
    };
    window.game = {
        settings: { register() {}, get: (module, key) => store[key], set: (module, key, value) => { store[key] = value; } },
        socket: { emit: (...args) => { window.sent = args; }, on() {} },
        user: { id: 'u', isGM: true },
        users: { activeGM: { id: 'u' } },
        playlists: { playing: [] },
        actors: { get: () => null }
    };
    // Окна модуля импортируются вместе с кодом сцен: классы-заглушки, чтобы модули загрузились
    const Application = class { static DEFAULT_OPTIONS = {}; };
    window.foundry = {
        utils: { randomID: () => Math.random().toString(36).slice(2, 18), deepClone: v => structuredClone(v), mergeObject: (a, b) => Object.assign(a, b), hasProperty: () => false },
        applications: { api: { ApplicationV2: Application, HandlebarsApplicationMixin: Base => class extends Base {}, DialogV2: {} }, instances: new Map() }
    };
    window.ui = { notifications: { warn: console.warn, info: console.log, error: console.error } };
})();
