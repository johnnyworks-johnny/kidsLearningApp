// ============================================================
// 音声読み上げ（Web Speech API / SpeechSynthesis）
// 日本語(ja-JP)の声を選んで、ひらがなやことばを読み上げる
// ============================================================

let jaVoice = null; // 選ばれた日本語の声をキャッシュ

// 利用可能な声の一覧から、一番自然な日本語の声を選ぶ
// ※iOS/Safari では声の読み込みが非同期なので voiceschanged を待つ
// 優先順位: Enhanced/Premium → 通常の ja-JP → ja で始まるもの
function pickJapaneseVoice() {
  const voices = window.speechSynthesis.getVoices();
  const jaVoices = voices.filter(
    (v) => v.lang && v.lang.toLowerCase().startsWith("ja")
  );
  if (!jaVoices.length) { jaVoice = null; return; }

  // iOS/macOS では "Enhanced" や "Premium" が付いた高品質ボイスがある
  // ローカル(オフライン)の高品質 → ネットワーク高品質 → 通常 の順に探す
  jaVoice =
    jaVoices.find((v) => /enhanced|premium/i.test(v.name) && v.localService) ||
    jaVoices.find((v) => /enhanced|premium/i.test(v.name)) ||
    jaVoices.find((v) => v.lang === "ja-JP") ||
    jaVoices[0];
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
  utter.pitch = 1.0; // 自然なピッチ（高すぎると機械っぽく聞こえるため）
  if (jaVoice) utter.voice = jaVoice;
  window.speechSynthesis.speak(utter);
}
