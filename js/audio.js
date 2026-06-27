// ============================================================
// 効果音（Web Audio API で生成）
// 音声ファイルを持たずに、コードで「ピンポーン♪」等を鳴らす
// ============================================================

let audioCtx = null;

// AudioContext を用意（ユーザー操作後でないと再生できないため遅延生成）
function getCtx() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) audioCtx = new AC();
  }
  // iOS はサスペンド状態になりがちなので毎回 resume
  if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

// 指定の周波数・長さで「ポーン」と1音鳴らす内部関数
function tone(freq, startTime, duration, type = "sine", gainPeak = 0.25) {
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;

  // 音量を立ち上げて減衰させる（やわらかい音にする）
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(gainPeak, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc.connect(gain).connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

// 成功音（明るい上昇アルペジオ：ド→ミ→ソ→ド）
export function playSuccess() {
  const ctx = getCtx();
  if (!ctx) return;
  const t = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
  notes.forEach((f, i) => tone(f, t + i * 0.12, 0.35, "triangle", 0.3));
}

// タップ音（軽い「ポッ」）
export function playTap() {
  const ctx = getCtx();
  if (!ctx) return;
  tone(660, ctx.currentTime, 0.12, "sine", 0.18);
}
