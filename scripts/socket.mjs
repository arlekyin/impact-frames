/**
 * Сокет модуля: кадр решает тот, кто применил урон (обычно Мастер), а показывают все. Сокет не доставляет
 * сообщение отправителю — он показывает кадр у себя сам.
 */

import { MODULE_ID } from "./settings.mjs";

const SOCKET = `module.${MODULE_ID}`;
const handlers = {};

export const onSocket = (action, handler) => { handlers[action] = handler; };
export const emit = (action, data = {}) => game.socket.emit(SOCKET, { action, ...data });
export const registerSocket = () => game.socket.on(SOCKET, message => handlers[message.action]?.(message));
