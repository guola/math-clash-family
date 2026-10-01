import { AudioEngine } from "./audio.js";
import { Backdrop } from "./bg.js";
import { FX } from "./fx.js";

window.MathClashDopa = { AudioEngine, Backdrop, FX };
window.dispatchEvent(new CustomEvent("math-clash-dopa-ready"));
