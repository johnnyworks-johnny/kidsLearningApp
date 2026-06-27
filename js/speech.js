// ============================================================
// 音声読み上げ（Web Speech API / SpeechSynthesis）
// 日本語(ja-JP)の声を選んで、ひらがなやことばを読み上げる
// ============================================================

let jaVoice = null; // 選ばれた日本語の声をキャッシュ

// 利用可能な声の一覧から、日本語(ja)の声を1つ選ぶ
// ※iOS/Safari では声の読み込みが非同期なので voiceschanged を待つ
function pickJapaneseVoice() {
  const voices = window.speechSynthesis.getVoices();
  // ja-JP を優先、なければ ja で始まるものを使う
  jaVoice =
    voices.find((v) => v.lang === "ja-JP") ||
    voices.find((v) => v.lang && v.lang.toLowerCase().startsWith("ja")) ||
    null;
}

// 初期化：声の準備。ページ読み込み時に1回呼ぶ
export function initSpeech() {
  if (!("speechSynthesis" in window)) return; // 非対応ブラウザは何もしない
  pickJapaneseVoice();
  // 声がまだ読み込まれていない場合に備えてイベントでも拾う
  window.speechSynthesis.onvoiceschanged = pickJapaneseVoice;
}

// テキストを読み上げる
// rate: 読む速さ（子ども向けに少しゆっくりめが既定）
export function speak(text, rate = 0.85) {
  if (!("speechSynthesis" in window)) return;
  // 連続タップで重ならないよう、再生中のものは止める
  window.speechSynthesis.cancel();

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "ja-JP";
  utter.rate = rate;
  utter.pitch = 1.15; // 少し高めの声で子ども向けの明るい印象に
  if (jaVoice) utter.voice = jaVoice;
  window.speechSynthesis.speak(utter);
}
