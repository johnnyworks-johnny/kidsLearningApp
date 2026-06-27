// ============================================================
// アプリ本体：画面の切り替え・進捗管理・成功演出をまとめる
// ============================================================
import { GOJUON_ROWS, HIRAGANA, KANA_ORDER } from "./data.js";
import { initSpeech, speak } from "./speech.js";
import { playSuccess, playTap } from "./audio.js";
import { TracePad } from "./trace.js";

const STORAGE_KEY = "hiragana-progress-v1";

// ---- 進捗（クリアした文字）の保存・読み込み ----
function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}
function saveProgress(p) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

let progress = loadProgress();
let currentKana = null;
let pad = null;

// 主要なDOM要素
const el = {
  home: document.getElementById("screen-home"),
  practice: document.getElementById("screen-practice"),
  gojuon: document.getElementById("gojuon"),
  doneCount: document.getElementById("done-count"),
  practiceKana: document.getElementById("practice-kana"),
  practiceRomaji: document.getElementById("practice-romaji"),
  progressFill: document.getElementById("progress-fill"),
  overlay: document.getElementById("overlay-success"),
  confetti: document.getElementById("confetti"),
  praise: document.getElementById("praise-text"),
  vocabEmoji: document.getElementById("vocab-emoji"),
  vocabWord: document.getElementById("vocab-word"),
};

// ============================================================
// ホーム画面：五十音表をつくる
// ============================================================
function buildHome() {
  el.gojuon.innerHTML = "";
  GOJUON_ROWS.forEach((row) => {
    row.forEach((kana) => {
      const cell = document.createElement("button");
      if (kana === null) {
        // 空マス（や行・わ行のすき間）は押せない透明マスにする
        cell.className = "kana-cell empty";
        cell.disabled = true;
      } else {
        cell.className = "kana-cell" + (progress[kana] ? " done" : "");
        cell.innerHTML = `<span class="kana-char">${kana}</span>` +
          (progress[kana] ? `<span class="star">⭐</span>` : "");
        cell.addEventListener("click", () => {
          playTap();
          openPractice(kana);
        });
      }
      el.gojuon.appendChild(cell);
    });
  });
  updateDoneCount();
}

// クリア数の表示を更新
function updateDoneCount() {
  const done = Object.keys(progress).filter((k) => progress[k]).length;
  el.doneCount.textContent = `${done} / ${KANA_ORDER.length}`;
}

// ============================================================
// 練習画面
// ============================================================
function openPractice(kana) {
  currentKana = kana;
  const info = HIRAGANA[kana];
  el.practiceKana.textContent = kana;
  el.practiceRomaji.textContent = info.romaji;
  el.progressFill.style.width = "0%";

  el.home.classList.remove("active");
  el.practice.classList.add("active");

  // なぞり書きパッドを用意（初回のみ生成）
  if (!pad) {
    pad = new TracePad(
      document.getElementById("guide-canvas"),
      document.getElementById("draw-canvas")
    );
    pad.onProgress = (ratio) => {
      el.progressFill.style.width = `${Math.round(ratio * 100)}%`;
    };
    pad.onSuccess = onTraceSuccess;
  }
  pad.setChar(kana);

  // 開いたら一度読み上げて、お手本の音を聞かせる
  speak(info.say);
}

function backToHome() {
  el.practice.classList.remove("active");
  el.home.classList.add("active");
  buildHome(); // ⭐の表示を更新
}

// ============================================================
// なぞり成功時の演出
// ============================================================
function onTraceSuccess() {
  // 進捗を保存
  progress[currentKana] = true;
  saveProgress(progress);

  // 効果音＋紙吹雪
  playSuccess();
  launchConfetti();

  // ほめ言葉をランダムに表示
  const praises = ["すごい！", "よくできました！", "じょうず！", "やったね！", "はなまる！"];
  el.praise.textContent = praises[Math.floor(Math.random() * praises.length)];

  // ことばカードを用意
  const info = HIRAGANA[currentKana];
  el.vocabEmoji.textContent = info.emoji;
  el.vocabWord.textContent = info.word;

  el.overlay.classList.add("active");

  // 「もじ」→「ことば」の順にゆっくり読み上げる
  speak(info.say);
  setTimeout(() => speak(info.word), 1100);
}

// ことばカードの単語をもう一度読み上げる
function replayWord() {
  if (currentKana) speak(HIRAGANA[currentKana].word);
}

// 「もう一回」：同じ文字をやり直す
function retrySame() {
  el.overlay.classList.remove("active");
  pad.setChar(currentKana);
  el.progressFill.style.width = "0%";
}

// 「つぎのもじ」：五十音順で次の文字へ
function nextKana() {
  el.overlay.classList.remove("active");
  const idx = KANA_ORDER.indexOf(currentKana);
  const next = KANA_ORDER[(idx + 1) % KANA_ORDER.length];
  openPractice(next);
}

// ============================================================
// 紙吹雪アニメーション（Canvas）
// ============================================================
function launchConfetti() {
  const canvas = el.confetti;
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ["#ff6fa5", "#ffd166", "#06d6a0", "#4d96ff", "#c77dff"];
  // 紙吹雪の粒をたくさん生成
  const pieces = Array.from({ length: 140 }, () => ({
    x: Math.random() * canvas.width,
    y: -20 - Math.random() * canvas.height * 0.5,
    size: 6 + Math.random() * 8,
    color: colors[Math.floor(Math.random() * colors.length)],
    vy: 2 + Math.random() * 4,
    vx: -2 + Math.random() * 4,
    rot: Math.random() * Math.PI,
    vrot: -0.2 + Math.random() * 0.4,
  }));

  const startTime = performance.now();
  function frame(now) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vrot;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    });
    // 2.5秒間だけ降らせる
    if (now - startTime < 2500) {
      requestAnimationFrame(frame);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
  requestAnimationFrame(frame);
}

// ============================================================
// ボタンの配線・初期化
// ============================================================
function wireButtons() {
  document.getElementById("btn-back").addEventListener("click", () => {
    playTap();
    backToHome();
  });
  document.getElementById("btn-speak").addEventListener("click", () => {
    if (currentKana) speak(HIRAGANA[currentKana].say);
  });
  document.getElementById("btn-clear").addEventListener("click", () => {
    playTap();
    pad.clear();
  });
  document.getElementById("btn-vocab-speak").addEventListener("click", replayWord);
  document.getElementById("btn-retry").addEventListener("click", retrySame);
  document.getElementById("btn-next").addEventListener("click", nextKana);
  document.getElementById("btn-overlay-home").addEventListener("click", () => {
    el.overlay.classList.remove("active");
    backToHome();
  });
}

function init() {
  initSpeech();
  buildHome();
  wireButtons();

  // Service Worker（オフライン・ホーム画面追加のため）を登録
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
}

document.addEventListener("DOMContentLoaded", init);
