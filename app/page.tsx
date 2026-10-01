"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Check, Copy, Crown, Delete, Gamepad2, Globe2, Medal, RotateCcw, Trophy, Users, UserRound, Volume2, VolumeX, Zap } from "lucide-react";

type Lang = "zh" | "en" | "ja";
type Screen = "home" | "lobby" | "countdown" | "play" | "result";
type GameMode = "solo" | "duo";
type ScoreRow = { id: number; nickname: string; score: number; bestCombo: number; mode: GameMode };
type Player = { id: string; nickname: string; slot: number; score: number; combo: number; finished: boolean };
type DopaAudio = {
  unlock: () => void; setMuted: (muted: boolean) => void; setVolume: (volume: number) => void;
  setLevel: (level: number, bpm?: number) => void; startMusic: () => void; stopMusic: () => void;
  update: () => void; pulse: () => { kick: number; phase: number; beat: number };
  keyTap: (combo: number) => void; correct: (combo: number, energy: number) => void;
  wrong: (energy: number) => void; jingle: () => void; finale: () => void;
};
type DopaFx = {
  motion: number; reduced: boolean;
  burst: (x: number, y: number, options?: Record<string, unknown>) => void;
  ring: (x: number, y: number, options?: Record<string, unknown>) => void;
  text: (x: number, y: number, value: string, options?: Record<string, unknown>) => void;
  fireworks: (width: number, height: number, count?: number, top?: number, bottom?: number) => void;
  streamers: (width: number, height: number, count?: number) => void;
  rain: (width: number, count?: number, options?: Record<string, unknown>) => void;
  update: (delta: number) => void; draw: () => void;
};
type DopaBackdrop = { state: { E: number; kick: number; flash: number; reach: number; hue: number; cx: number; cy: number; theme: number }; render: (time: number) => void; setTheme: (name: string) => void };
type DopaBridge = {
  AudioEngine: new () => DopaAudio;
  Backdrop: new (canvas: HTMLCanvasElement, fallback: HTMLDivElement) => DopaBackdrop;
  FX: new (canvas: HTMLCanvasElement, max?: number) => DopaFx;
};

declare global { interface Window { MathClashDopa?: DopaBridge } }

function loadDopaBridge(): Promise<DopaBridge> {
  if (window.MathClashDopa) return Promise.resolve(window.MathClashDopa);
  return new Promise((resolve, reject) => {
    const ready = () => window.MathClashDopa ? resolve(window.MathClashDopa) : reject(new Error("Effects engine did not initialize."));
    window.addEventListener("math-clash-dopa-ready", ready, { once: true });
    let script = document.querySelector<HTMLScriptElement>('script[data-math-clash-dopa]');
    if (!script) {
      script = document.createElement("script");
      script.type = "module";
      script.src = "/dopa/bridge.js";
      script.dataset.mathClashDopa = "true";
      script.addEventListener("error", () => reject(new Error("Effects engine could not be loaded.")), { once: true });
      document.head.appendChild(script);
    }
  });
}

const GAME_SECONDS = 45;

const copy = {
  zh: {
    kicker: "亲子数学 · 节奏挑战", sub: "算得越快，节拍越燃。", solo: "单人闯关", soloNote: "45 秒刷新最高分", duo: "双人 PK", duoNote: "两台手机 · 同场对决", rank: "总排行榜", soundOn: "动态音效已开启", soundOff: "音效已关闭", ready: "选择模式", live: "实时", combo: "连击", start: "开始", nickname: "你的昵称", nameHint: "例如：MARK", createRoom: "创建房间", joinRoom: "加入房间", roomCode: "房间码", joinHint: "输入另一台手机上的 6 位房间码", duoTitle: "双人手机 PK", duoDesc: "一台手机创建房间，另一台输入房间码。两人加入后自动倒计时。", waiting: "等待挑战者加入", waitingNote: "在另一台手机打开本页，选择“双人 PK”并输入房间码。", copied: "已复制", player: "玩家", opponent: "对手", connecting: "正在连接…", invalidRoom: "房间不可用，请检查房间码。", getReady: "准备", go: "开始！", score: "得分", time: "时间", correct: "漂亮！", wrong: "再试一次", submit: "确定", finished: "挑战完成", newBest: "节奏全开！", resultSolo: "你的最终得分", resultWin: "你赢了！", resultLose: "对手获胜", resultTie: "平局！", again: "再来一局", home: "返回首页", saved: "成绩已进入排行榜", saving: "正在保存成绩…", empty: "等待第一位挑战者", rankNote: "来自所有单人和双人比赛", copyRoom: "复制房间码", questions: "答题", you: "你", rules: "45 秒内尽可能多答题，答错不会出局。连击越高，得分和音乐越燃。",
  },
  en: {
    kicker: "Family math · Rhythm challenge", sub: "Solve faster. Turn the beat up.", solo: "Solo Run", soloNote: "45 seconds to set a high score", duo: "2-Player VS", duoNote: "Two phones · One arena", rank: "Global leaderboard", soundOn: "Dynamic sound on", soundOff: "Sound off", ready: "Choose a mode", live: "Live", combo: "Combo", start: "Start", nickname: "Your nickname", nameHint: "e.g. MARK", createRoom: "Create room", joinRoom: "Join room", roomCode: "Room code", joinHint: "Enter the 6-character code from the other phone", duoTitle: "Two-phone battle", duoDesc: "Create a room on one phone and enter the code on the other. The match starts when both players join.", waiting: "Waiting for a challenger", waitingNote: "Open this page on the second phone, choose 2-Player VS, and enter the room code.", copied: "Copied", player: "Player", opponent: "Opponent", connecting: "Connecting…", invalidRoom: "Room unavailable. Check the code and try again.", getReady: "Get ready", go: "GO!", score: "Score", time: "Time", correct: "Perfect!", wrong: "Try again", submit: "Check", finished: "Challenge complete", newBest: "Full beat!", resultSolo: "Your final score", resultWin: "You win!", resultLose: "Opponent wins", resultTie: "Tie game!", again: "Play again", home: "Back home", saved: "Score added to the leaderboard", saving: "Saving your score…", empty: "Be the first challenger", rankNote: "Solo and two-player scores", copyRoom: "Copy room code", questions: "Solved", you: "You", rules: "Solve as many as you can in 45 seconds. Mistakes never knock you out. Bigger combos boost both score and sound.",
  },
  ja: {
    kicker: "親子で算数 · リズムチャレンジ", sub: "解くほど、ビートが熱くなる。", solo: "ひとりモード", soloNote: "45秒でハイスコアに挑戦", duo: "ふたり対戦", duoNote: "スマホ2台 · 同時バトル", rank: "総合ランキング", soundOn: "ダイナミックサウンド ON", soundOff: "サウンド OFF", ready: "モードを選ぶ", live: "ライブ", combo: "コンボ", start: "スタート", nickname: "ニックネーム", nameHint: "例：MARK", createRoom: "部屋をつくる", joinRoom: "部屋に入る", roomCode: "ルームコード", joinHint: "もう1台のスマホに表示された6文字を入力", duoTitle: "スマホ2台で対戦", duoDesc: "1台目で部屋を作り、2台目でコードを入力。2人そろうと自動でカウントダウンします。", waiting: "チャレンジャーを待っています", waitingNote: "もう1台のスマホでこのページを開き、「ふたり対戦」からコードを入力してください。", copied: "コピーしました", player: "プレイヤー", opponent: "相手", connecting: "接続中…", invalidRoom: "部屋が見つかりません。コードを確認してください。", getReady: "準備", go: "スタート！", score: "スコア", time: "タイム", correct: "ナイス！", wrong: "もう一度", submit: "決定", finished: "チャレンジ終了", newBest: "ビート全開！", resultSolo: "最終スコア", resultWin: "あなたの勝ち！", resultLose: "相手の勝ち", resultTie: "引き分け！", again: "もう一度", home: "ホームへ", saved: "ランキングに登録しました", saving: "スコアを保存中…", empty: "最初の挑戦者になろう", rankNote: "ひとり・ふたり対戦の総合", copyRoom: "コードをコピー", questions: "正解", you: "あなた", rules: "45秒でたくさん解こう。まちがえてもゲームオーバーなし。コンボが続くほどスコアと音楽が盛り上がります。",
  },
} as const;

function seeded(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function makeQuestion(seed: number, index: number) {
  const random = seeded(seed + index * 7919);
  const level = Math.min(3, Math.floor(index / 5));
  const kind = Math.floor(random() * (level > 0 ? 3 : 2));
  if (kind === 2) {
    const a = 2 + Math.floor(random() * (5 + level));
    const b = 2 + Math.floor(random() * 8);
    return { text: `${a} × ${b}`, answer: a * b };
  }
  const max = 10 + level * 18;
  const a = 2 + Math.floor(random() * max);
  const b = 2 + Math.floor(random() * max);
  if (kind === 1) {
    const high = Math.max(a, b);
    const low = Math.min(a, b);
    return { text: `${high} − ${low}`, answer: high - low };
  }
  return { text: `${a} + ${b}`, answer: a + b };
}

function validateEmptyToolInput(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input) || Object.keys(input).length > 0) {
    throw new Error("This tool accepts an empty object only.");
  }
}

export default function Home() {
  const [lang, setLang] = useState<Lang>("zh");
  const [screen, setScreen] = useState<Screen>("home");
  const [mode, setMode] = useState<GameMode>("solo");
  const [sound, setSound] = useState(true);
  const [duoOpen, setDuoOpen] = useState(false);
  const [joinMode, setJoinMode] = useState<"create" | "join">("create");
  const [nickname, setNickname] = useState("MARK");
  const [joinCode, setJoinCode] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [roomBusy, setRoomBusy] = useState(false);
  const [roomError, setRoomError] = useState("");
  const [copied, setCopied] = useState(false);
  const [startAt, setStartAt] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [seed, setSeed] = useState(1);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [remaining, setRemaining] = useState(GAME_SECONDS);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | "">("");
  const [opponent, setOpponent] = useState<Player | null>(null);
  const [leaderboard, setLeaderboard] = useState<ScoreRow[]>([]);
  const [saved, setSaved] = useState(false);
  const [resultOpponentScore, setResultOpponentScore] = useState<number | null>(null);
  const audioRef = useRef<DopaAudio | null>(null);
  const backdropRef = useRef<DopaBackdrop | null>(null);
  const fxRef = useRef<DopaFx | null>(null);
  const fxBackRef = useRef<DopaFx | null>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fallbackRef = useRef<HTMLDivElement | null>(null);
  const fxCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fxBackCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const questionStageRef = useRef<HTMLElement | null>(null);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const bestComboRef = useRef(0);
  const endAtRef = useRef(0);
  const finishingRef = useRef(false);
  const t = copy[lang];
  const question = useMemo(() => makeQuestion(seed, questionIndex), [seed, questionIndex]);

  const unlockAudio = useCallback(() => {
    if (!sound) return null;
    audioRef.current?.unlock();
    audioRef.current?.setMuted(false);
    return audioRef.current;
  }, [sound]);

  const playTap = useCallback(() => { unlockAudio()?.keyTap(comboRef.current); }, [unlockAudio]);

  const playCorrect = useCallback((nextCombo: number) => {
    const energy = Math.min(1.15, .12 + nextCombo / 10);
    unlockAudio()?.correct(nextCombo, energy);
    const rect = questionStageRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height * .48;
    fxRef.current?.burst(x, y, { count: 14 + Math.round(32 * energy), speed: 320 + 420 * energy, kinds: ["star", "spark", "confetti", "coin"], up: 120, life: .7 });
    fxRef.current?.ring(x, y, { color: energy > .55 ? "#ffd23f" : "#ff7ab6", radius: 70 + 100 * energy, width: 7 });
    fxRef.current?.text(x, y - 40, copy[lang].correct, { color: "#ffd23f", size: 24 + Math.round(16 * energy), vy: -110, life: 1 });
    if (energy > .45) fxBackRef.current?.burst(x, y, { count: Math.round(45 * energy), speed: 760, kinds: ["confetti", "star", "spark"], up: 220, life: .8 });
    if (nextCombo > 0 && nextCombo % 5 === 0) fxBackRef.current?.streamers(window.innerWidth, window.innerHeight, 5 + Math.floor(nextCombo / 5));
    if (backdropRef.current) backdropRef.current.state.flash = Math.min(.45, .12 + energy * .18);
  }, [lang, unlockAudio]);

  const playWrong = useCallback(() => {
    const energy = Math.min(1, .12 + comboRef.current / 10);
    unlockAudio()?.wrong(energy);
  }, [unlockAudio]);

  const loadLeaderboard = useCallback(async () => {
    try {
      const response = await fetch("/api/leaderboard", { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      setLeaderboard(data.leaderboard ?? []);
    } catch { /* keep the game usable when rankings are unavailable */ }
  }, []);

  useEffect(() => { void loadLeaderboard(); }, [loadLeaderboard]);
  useEffect(() => {
    const storedName = localStorage.getItem("math-clash-name");
    const storedLang = localStorage.getItem("math-clash-lang") as Lang | null;
    if (storedName) setNickname(storedName);
    if (storedLang && ["zh", "en", "ja"].includes(storedLang)) setLang(storedLang);
  }, []);
  useEffect(() => { localStorage.setItem("math-clash-lang", lang); }, [lang]);

  useEffect(() => {
    let active = true;
    void loadDopaBridge().then((bridge) => {
      if (!active) return;
      const engine = new bridge.AudioEngine();
      engine.setVolume(.82);
      engine.setMuted(!sound);
      audioRef.current = engine;
    });
    return () => { active = false; audioRef.current?.stopMusic(); };
  }, []);

  useEffect(() => { audioRef.current?.setMuted(!sound); }, [sound]);

  useEffect(() => {
    let active = true;
    let frame = 0;
    let previous = performance.now();
    void loadDopaBridge().then((bridge) => {
      if (!active || !bgCanvasRef.current || !fallbackRef.current || !fxCanvasRef.current || !fxBackCanvasRef.current) return;
      const backdrop = new bridge.Backdrop(bgCanvasRef.current, fallbackRef.current);
      const front = new bridge.FX(fxCanvasRef.current, 420);
      const back = new bridge.FX(fxBackCanvasRef.current, 600);
      front.motion = 1; back.motion = 1;
      backdrop.setTheme(screen === "lobby" ? "night" : screen === "result" ? "festival" : "classic");
      backdropRef.current = backdrop; fxRef.current = front; fxBackRef.current = back;
      if (screen === "home") back.rain(window.innerWidth, 28, { kinds: ["confetti", "star"] });
      if (screen === "result") { back.fireworks(window.innerWidth, window.innerHeight, 7, .08, .5); front.rain(window.innerWidth, 70, { kinds: ["confetti", "star", "coin"] }); }
      const render = (time: number) => {
        if (!active) return;
        const delta = Math.min(.05, Math.max(0, (time - previous) / 1000));
        previous = time;
        audioRef.current?.update();
        const pulse = audioRef.current?.pulse() ?? { kick: 0, phase: 0, beat: 0 };
        const energy = screen === "play" ? Math.min(1.18, .12 + comboRef.current / 10 + scoreRef.current / 12000) : screen === "result" ? 1.08 : screen === "countdown" ? .42 : .18;
        backdrop.state.E += (energy - backdrop.state.E) * Math.min(1, delta * 4);
        backdrop.state.kick = pulse.kick;
        backdrop.state.cx = window.innerWidth / 2;
        backdrop.state.cy = window.innerHeight * (screen === "play" ? .45 : .5);
        backdrop.state.hue = (backdrop.state.hue + delta * (.015 + energy * .04)) % 1;
        backdrop.state.flash *= Math.exp(-delta * 8);
        backdrop.render(time);
        front.update(delta); back.update(delta); back.draw(); front.draw();
        frame = requestAnimationFrame(render);
      };
      frame = requestAnimationFrame(render);
    });
    return () => {
      active = false;
      cancelAnimationFrame(frame);
      backdropRef.current = null; fxRef.current = null; fxBackRef.current = null;
    };
  }, [screen]);

  useEffect(() => {
    const engine = audioRef.current;
    if (!engine) return;
    if (screen === "play" && sound) { engine.unlock(); engine.setMuted(false); engine.startMusic(); }
    else engine.stopMusic();
    return () => { if (screen === "play") engine.stopMusic(); };
  }, [screen, sound]);

  useEffect(() => {
    if (screen !== "play") return;
    const level = Math.min(9, Math.floor(combo / 2));
    audioRef.current?.setLevel(level, 112 + level * 4);
  }, [combo, screen]);

  const resetGame = useCallback(() => {
    setQuestionIndex(0); setAnswer(""); setScore(0); setCombo(0); setBestCombo(0); setRemaining(GAME_SECONDS); setFeedback(""); setOpponent(null); setSaved(false); setResultOpponentScore(null);
    scoreRef.current = 0; comboRef.current = 0; bestComboRef.current = 0; endAtRef.current = 0; finishingRef.current = false;
  }, []);

  const beginSolo = useCallback(() => {
    setMode("solo"); resetGame(); setSeed(Date.now() % 2_000_000_000); setStartAt(Date.now() + 3000); setCountdown(3); setScreen("countdown");
    unlockAudio()?.jingle();
  }, [resetGame, unlockAudio]);

  const roomAction = async (action: "create" | "join") => {
    setRoomBusy(true); setRoomError("");
    const name = nickname.trim().slice(0, 14) || "PLAYER";
    localStorage.setItem("math-clash-name", name);
    try {
      const response = await fetch("/api/rooms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, nickname: name, lang, code: joinCode }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "room_error");
      setMode("duo"); setRoomCode(data.code); setPlayerId(data.playerId); setPlayers([{ id: data.playerId, nickname: name, slot: data.slot, score: 0, combo: 0, finished: false }]);
      resetGame(); setScreen("lobby"); setDuoOpen(false); unlockAudio()?.jingle();
    } catch { setRoomError(t.invalidRoom); } finally { setRoomBusy(false); }
  };

  useEffect(() => {
    if (screen !== "lobby" || !roomCode) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const response = await fetch(`/api/rooms?code=${encodeURIComponent(roomCode)}`, { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        if (cancelled) return;
        setPlayers(data.players ?? []);
        if (data.room?.status === "active" && data.room.startAt) {
          setSeed(data.room.seed); setStartAt(data.room.startAt); setCountdown(Math.max(1, Math.ceil((data.room.startAt - Date.now()) / 1000))); setScreen("countdown");
        }
      } catch { /* next poll retries */ }
    };
    void poll();
    const timer = window.setInterval(poll, 800);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [screen, roomCode]);

  useEffect(() => {
    if (screen !== "countdown") return;
    const tick = () => {
      const next = Math.ceil((startAt - Date.now()) / 1000);
      if (next <= 0) {
        endAtRef.current = startAt + GAME_SECONDS * 1000;
        setRemaining(GAME_SECONDS); setScreen("play");
        unlockAudio()?.jingle();
      } else setCountdown(next);
    };
    tick();
    const timer = window.setInterval(tick, 80);
    return () => window.clearInterval(timer);
  }, [screen, startAt, unlockAudio]);

  const finishGame = useCallback(async () => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    unlockAudio()?.finale();
    setScreen("result");
    const finalScore = scoreRef.current;
    const finalCombo = bestComboRef.current;
    try {
      if (mode === "solo") {
        await fetch("/api/leaderboard", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nickname, score: finalScore, bestCombo: finalCombo, mode, lang }) });
      } else {
        await fetch("/api/rooms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "progress", code: roomCode, playerId, score: finalScore, combo: finalCombo, finished: true }) });
        const response = await fetch(`/api/rooms?code=${encodeURIComponent(roomCode)}`, { cache: "no-store" });
        if (response.ok) {
          const data = await response.json();
          const rival = (data.players as Player[]).find((item) => item.id !== playerId);
          setResultOpponentScore(rival?.score ?? 0);
        }
      }
      setSaved(true); void loadLeaderboard();
    } catch { setSaved(false); }
  }, [lang, loadLeaderboard, mode, nickname, playerId, roomCode, unlockAudio]);

  useEffect(() => {
    if (screen !== "play") return;
    const timer = window.setInterval(() => {
      const left = Math.max(0, (endAtRef.current - Date.now()) / 1000);
      setRemaining(left);
      if (left <= 0) { window.clearInterval(timer); void finishGame(); }
    }, 70);
    return () => window.clearInterval(timer);
  }, [screen, finishGame]);

  useEffect(() => {
    if (screen !== "play" || mode !== "duo" || !roomCode || !playerId) return;
    const sync = async () => {
      try {
        await fetch("/api/rooms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "progress", code: roomCode, playerId, score: scoreRef.current, combo: bestComboRef.current, finished: false }) });
        const response = await fetch(`/api/rooms?code=${encodeURIComponent(roomCode)}`, { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        setOpponent((data.players as Player[]).find((item) => item.id !== playerId) ?? null);
      } catch { /* real-time score retries automatically */ }
    };
    void sync();
    const timer = window.setInterval(sync, 900);
    return () => window.clearInterval(timer);
  }, [screen, mode, roomCode, playerId]);

  const checkAnswer = useCallback(() => {
    if (!answer) return;
    if (Number(answer) === question.answer) {
      const nextCombo = comboRef.current + 1;
      const gain = 100 + Math.min(nextCombo, 20) * 18;
      comboRef.current = nextCombo; bestComboRef.current = Math.max(bestComboRef.current, nextCombo); scoreRef.current += gain;
      setCombo(nextCombo); setBestCombo(bestComboRef.current); setScore(scoreRef.current); setQuestionIndex((value) => value + 1); setFeedback("correct"); playCorrect(nextCombo);
      window.setTimeout(() => setFeedback(""), 330);
    } else {
      comboRef.current = 0; setCombo(0); setFeedback("wrong"); playWrong(); window.setTimeout(() => setFeedback(""), 420);
    }
    setAnswer("");
  }, [answer, question.answer, playCorrect, playWrong]);

  const inputDigit = (digit: string) => {
    playTap();
    setAnswer((value) => value.length < 3 ? `${value}${digit}` : value);
  };

  useEffect(() => {
    if (screen !== "play") return;
    const handler = (event: KeyboardEvent) => {
      if (/^[0-9]$/.test(event.key)) inputDigit(event.key);
      else if (event.key === "Backspace") setAnswer((value) => value.slice(0, -1));
      else if (event.key === "Enter") checkAnswer();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [screen, checkAnswer]);

  useEffect(() => {
    const context = (document as Document & { modelContext?: { registerTool: (tool: unknown, options?: { signal?: AbortSignal }) => void | Promise<void> } }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const tools = [
      { name: "start_solo_math_challenge", title: "Start solo challenge", description: "Start the visible 45-second solo math challenge.", inputSchema: { type: "object", properties: {}, additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false }, execute: (input: unknown) => { validateEmptyToolInput(input); beginSolo(); return { status: "countdown", durationSeconds: GAME_SECONDS }; } },
      { name: "open_two_player_setup", title: "Open two-player setup", description: "Open the visible setup for a two-phone Math Clash room.", inputSchema: { type: "object", properties: {}, additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false }, execute: (input: unknown) => { validateEmptyToolInput(input); setDuoOpen(true); return { status: "setup_open" }; } },
      { name: "read_math_clash_leaderboard", title: "Read leaderboard", description: "Read the current Math Clash high scores shown on the page.", inputSchema: { type: "object", properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true, untrustedContentHint: true }, execute: (input: unknown) => { validateEmptyToolInput(input); return { leaderboard: leaderboard.slice(0, 10) }; } },
    ];
    for (const tool of tools) void Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(() => undefined);
    return () => lifecycle.abort();
  }, [beginSolo, leaderboard]);

  const resultTitle = mode === "solo" ? t.resultSolo : resultOpponentScore === null ? t.finished : scoreRef.current > resultOpponentScore ? t.resultWin : scoreRef.current < resultOpponentScore ? t.resultLose : t.resultTie;

  const topbar = (
    <header className="topbar">
      <button className="brand-mark" aria-label="Math Clash home" onClick={() => setScreen("home")}><span>+</span><b>×</b></button>
      <div className="top-actions">
        <button className="sound-pill" onClick={() => setSound((value) => !value)}>{sound ? <Volume2 size={16} /> : <VolumeX size={16} />}<span>{sound ? t.soundOn : t.soundOff}</span></button>
        <div className="lang-picker" aria-label="Language"><Globe2 size={16} />{(["zh", "en", "ja"] as Lang[]).map((item) => <button key={item} onClick={() => setLang(item)} className={lang === item ? "active" : ""}>{item === "zh" ? "中" : item === "en" ? "EN" : "日"}</button>)}</div>
      </div>
    </header>
  );

  const effectLayers = (
    <>
      <div ref={fallbackRef} className="dopa-fallback" aria-hidden="true" />
      <canvas ref={bgCanvasRef} className="dopa-bg" aria-hidden="true" />
      <canvas ref={fxBackCanvasRef} className="dopa-fx dopa-fx-back" aria-hidden="true" />
      <canvas ref={fxCanvasRef} className="dopa-fx dopa-fx-front" aria-hidden="true" />
    </>
  );

  if (screen === "lobby") return (
    <main className="game-shell centered-shell">{effectLayers}{topbar}<section className="lobby-card"><div className="status-orbit"><Users /><i /></div><p className="eyebrow center"><span />{t.waiting}<span /></p><h1 className="room-code">{roomCode}</h1><Button className="copy-button" onClick={async () => { await navigator.clipboard.writeText(roomCode); setCopied(true); window.setTimeout(() => setCopied(false), 1300); }}><Copy size={16} />{copied ? t.copied : t.copyRoom}</Button><p className="lobby-note">{t.waitingNote}</p><div className="players-row">{[0, 1].map((index) => <div className={`player-slot ${players[index] ? "joined" : ""}`} key={index}><span>{players[index] ? players[index].nickname.slice(0, 1).toUpperCase() : "?"}</span><div><small>{t.player} {index + 1}</small><strong>{players[index]?.nickname ?? t.connecting}</strong></div>{players[index] && <Check size={18} />}</div>)}</div><button className="text-button" onClick={() => setScreen("home")}><ArrowLeft size={16} />{t.home}</button></section></main>
  );

  if (screen === "countdown") return (
    <main className="game-shell countdown-shell">{effectLayers}<div className="countdown-ring"><span>{countdown > 0 ? countdown : t.go}</span><i /><i /><i /></div><p>{t.getReady}</p>{mode === "duo" && <div className="versus-mini"><span>{players.find((item) => item.id === playerId)?.nickname ?? t.you}</span><b>VS</b><span>{players.find((item) => item.id !== playerId)?.nickname ?? t.opponent}</span></div>}</main>
  );

  if (screen === "play") return (
    <main className={`game-shell play-shell combo-level-${Math.min(4, Math.floor(combo / 4))}`}>
      {effectLayers}
      <header className="play-hud"><div className="hud-stat"><small>{t.score}</small><strong>{score.toLocaleString()}</strong></div><div className="timer"><svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="18" /><circle className="timer-progress" cx="22" cy="22" r="18" style={{ strokeDashoffset: `${113 - 113 * remaining / GAME_SECONDS}` }} /></svg><span>{Math.ceil(remaining)}</span></div><div className="hud-stat right"><small>{t.combo}</small><strong>×{combo}</strong></div></header>
      {mode === "duo" && <div className="opponent-bar"><span>{t.you} <b>{score}</b></span><i><i style={{ width: `${Math.min(100, score / Math.max(score, opponent?.score ?? 1) * 100)}%` }} /></i><span>{opponent?.nickname ?? t.opponent} <b>{opponent?.score ?? 0}</b></span></div>}
      <section ref={questionStageRef} className={`question-stage ${feedback}`}>
        <div className="combo-burst">{combo >= 3 && <><Zap /> {combo} {t.combo.toUpperCase()}</>}</div>
        <div className="question-number">{question.text}</div>
        <div className="answer-display"><span>=</span><strong>{answer || "?"}</strong></div>
        <div className="feedback-word">{feedback === "correct" ? t.correct : feedback === "wrong" ? t.wrong : ""}</div>
      </section>
      <div className="number-pad" aria-label="Number pad">{[1,2,3,4,5,6,7,8,9].map((digit) => <Button key={digit} onClick={() => inputDigit(String(digit))}>{digit}</Button>)}<Button className="delete-key" onClick={() => setAnswer((value) => value.slice(0, -1))} aria-label="Delete"><Delete /></Button><Button onClick={() => inputDigit("0")}>0</Button><Button className="submit-key" onClick={checkAnswer}><Check /></Button></div>
    </main>
  );

  if (screen === "result") return (
    <main className="game-shell centered-shell result-shell">{effectLayers}{topbar}<section className="result-card"><div className="result-crown"><Crown /></div><p className="eyebrow center"><span />{t.finished}<span /></p><h2>{resultTitle}</h2><div className="final-score">{scoreRef.current.toLocaleString()}</div><div className="result-stats"><div><small>{t.combo}</small><strong>×{bestComboRef.current}</strong></div><div><small>{t.questions}</small><strong>{questionIndex}</strong></div>{mode === "duo" && <div><small>{t.opponent}</small><strong>{resultOpponentScore ?? "…"}</strong></div>}</div><p className="save-state">{saved ? <><Check />{t.saved}</> : t.saving}</p><div className="result-actions"><Button onClick={mode === "solo" ? beginSolo : () => { setScreen("home"); setDuoOpen(true); }}><RotateCcw />{t.again}</Button><Button variant="outline" onClick={() => setScreen("home")}><ArrowLeft />{t.home}</Button></div></section></main>
  );

  return (
    <main className="game-shell">
      {effectLayers}<div className="ambient ambient-one" /><div className="ambient ambient-two" />{topbar}
      <section className="home-grid">
        <div className="hero-copy"><p className="eyebrow"><span />{t.kicker}</p><h1>MATH CLASH</h1><p className="subtitle">{t.sub}</p><div className="equation-strip" aria-hidden="true"><span>8 + 7</span><b>=</b><em>15</em><i>COMBO ×4</i></div><p className="rules-copy">{t.rules}</p><p className="ready-label">{t.ready}</p><div className="mode-grid"><Button className="mode-card solo-card" onClick={beginSolo}><span className="mode-icon"><UserRound /></span><span><strong>{t.solo}</strong><small>{t.soloNote}</small></span><span className="mode-key">01</span></Button><Button className="mode-card duo-card" onClick={() => { setRoomError(""); setDuoOpen(true); }}><span className="mode-icon"><Users /></span><span><strong>{t.duo}</strong><small>{t.duoNote}</small></span><span className="mode-key">02</span></Button></div></div>
        <aside className="score-panel"><div className="panel-head"><span><Trophy size={18} /> {t.rank}</span><b>{t.live}</b></div>{leaderboard.length ? <ol>{leaderboard.slice(0, 5).map((row, index) => <li key={row.id}><i>{index + 1}</i><span className={`avatar ${index === 0 ? "coral" : index === 1 ? "cyan" : "yellow"}`}>{row.nickname.slice(0,1).toUpperCase()}</span><span><strong>{row.nickname}</strong><small>{row.bestCombo} {t.combo.toLowerCase()} · {row.mode === "duo" ? "VS" : "SOLO"}</small></span><b>{row.score.toLocaleString()}</b></li>)}</ol> : <div className="empty-rank"><Medal /><p>{t.empty}</p></div>}<p className="rank-note">{t.rankNote}</p><div className="pulse-line"><span /><span /><span /><span /><span /><span /><span /></div></aside>
      </section>
      <footer><span>01</span><div /><p>FAST THINKING · BIG BEATS · FRIENDLY BATTLES</p><div /><a href="/dopa/LICENSE.txt" target="_blank" rel="noreferrer">FX: dopa-drill · MIT</a></footer>

      <Dialog open={duoOpen} onOpenChange={setDuoOpen}><DialogContent className="duo-dialog"><DialogHeader><div className="dialog-icon"><Gamepad2 /></div><DialogTitle>{t.duoTitle}</DialogTitle><DialogDescription>{t.duoDesc}</DialogDescription></DialogHeader><div className="dialog-tabs"><button className={joinMode === "create" ? "active" : ""} onClick={() => { setJoinMode("create"); setRoomError(""); }}>{t.createRoom}</button><button className={joinMode === "join" ? "active" : ""} onClick={() => { setJoinMode("join"); setRoomError(""); }}>{t.joinRoom}</button></div><label className="field-label">{t.nickname}<Input value={nickname} maxLength={14} onChange={(event) => setNickname(event.target.value)} placeholder={t.nameHint} /></label>{joinMode === "join" && <label className="field-label">{t.roomCode}<Input className="room-input" value={joinCode} maxLength={6} onChange={(event) => setJoinCode(event.target.value.toUpperCase().replace(/[^A-Z2-9]/g, ""))} placeholder="ABC123" /><small>{t.joinHint}</small></label>}{roomError && <p className="room-error">{roomError}</p>}<Button className="dialog-primary" disabled={roomBusy || !nickname.trim() || (joinMode === "join" && joinCode.length !== 6)} onClick={() => void roomAction(joinMode)}>{roomBusy ? t.connecting : joinMode === "create" ? t.createRoom : t.joinRoom}</Button></DialogContent></Dialog>
    </main>
  );
}
