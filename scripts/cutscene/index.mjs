/**
 * Impact Frames — части рисованных сцен в Foundry: из них собираются кадры удара и сцены Мастера.
 *
 *  math.mjs        — кривые времени, пружины, случайность с зерном, шум.
 *  camera.mjs      — камера сцены: наезд, поворот, сдвиг, вписывание точек в кадр, тряска.
 *  letterbox.mjs   — кинополосы.
 *  stage.mjs       — фильтры всей сцены (ч/б), копии токенов, скрытие токенов и их значков.
 *  overlay.mjs     — холсты поверх экрана, негатив кадра, уборка за оборвавшейся сценой.
 *  ripple.mjs      — волны по кадру (шейдер WebGL).
 *  audio.mjs       — синтез звука: шина с басом и ревербацией, реестр звуков сцен, приглушение
 *                    музыки, провалы в тишину.
 *  instruments.mjs — инструменты синтеза: удары, бас, треск, стекло, свист.
 *  windows.mjs     — окна Foundry сворачиваются на время сцены.
 */

export * from "./math.mjs";
export * from "./camera.mjs";
export * from "./letterbox.mjs";
export * from "./stage.mjs";
export * from "./overlay.mjs";
export * from "./ripple.mjs";
export * from "./audio.mjs";
export * from "./windows.mjs";
export * from "./instruments.mjs";
