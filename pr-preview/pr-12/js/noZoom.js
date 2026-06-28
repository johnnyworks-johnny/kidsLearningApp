// ============================================================
// 画面拡大の無効化（iPad/iOS Safari 対策）
//   ネイティブアプリのように、ダブルタップ拡大・ピンチ拡大を無効にする
//   ※ iOS Safari は viewport の user-scalable=no を無視するため、
//     JavaScript 側でも保険をかける
//   ※ なぞり書き（Pointer Events）の操作には影響しないようにする
// ============================================================

export function disableZoom() {
  // --- ピンチ拡大の無効化（Safari独自の gesture イベント）---
  ["gesturestart", "gesturechange", "gestureend"].forEach((type) => {
    document.addEventListener(type, (e) => e.preventDefault(), { passive: false });
  });

  // --- ダブルタップ拡大の無効化 ---
  // 直前のタップから300ms以内に2回目のタップが来たら拡大とみなして打ち消す
  let lastTouchEnd = 0;
  document.addEventListener(
    "touchend",
    (e) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault(); // 2回目の素早いタップ＝ダブルタップを無効化
      }
      lastTouchEnd = now;
    },
    { passive: false }
  );

  // --- 一部ブラウザ向け：ダブルクリック相当も無効化 ---
  document.addEventListener("dblclick", (e) => e.preventDefault(), { passive: false });
}
