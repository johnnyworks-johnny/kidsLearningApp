// ============================================================
// なぞり書きパッド
//   - お手本（うすいひらがな）を表示するキャンバス
//   - 指でなぞる描画用キャンバス
//   - 低解像度の判定用キャンバスで「お手本をどれだけなぞれたか」を計算
// ============================================================

const RES = 600;       // 表示・描画キャンバスの内部解像度（正方形）
const LOW = 150;       // 判定用の低解像度（軽量に重なりを計算するため）
const STROKE_DISPLAY = 30; // 表示側の線の太さ
const STROKE_LOW = STROKE_DISPLAY * (LOW / RES); // 判定側の線の太さ（比例）

// 成功と判定する条件
const COVER_THRESHOLD = 0.62; // お手本の何割をなぞれたら成功か
const SPILL_LIMIT = 2.6;      // なぞった量がお手本の何倍までなら許すか（塗りつぶし防止）

export class TracePad {
  // guideCanvas: お手本表示用 / drawCanvas: 指でなぞる用（CSSで重ねて配置）
  constructor(guideCanvas, drawCanvas) {
    this.guide = guideCanvas;
    this.draw = drawCanvas;
    [this.guide, this.draw].forEach((c) => {
      c.width = RES;
      c.height = RES;
    });
    this.gctx = this.guide.getContext("2d");
    this.dctx = this.draw.getContext("2d");

    // 判定用の低解像度キャンバス（画面には出さない）
    this.maskCanvas = document.createElement("canvas"); // お手本のシルエット
    this.userCanvas = document.createElement("canvas"); // ユーザーがなぞった跡
    [this.maskCanvas, this.userCanvas].forEach((c) => {
      c.width = LOW;
      c.height = LOW;
    });
    this.mctx = this.maskCanvas.getContext("2d", { willReadFrequently: true });
    this.uctx = this.userCanvas.getContext("2d", { willReadFrequently: true });

    this.drawing = false;
    this.lastPt = null;
    this.targetCount = 0; // お手本のピクセル数（分母）
    this.onProgress = null; // 進捗(0〜1)を返すコールバック
    this.onSuccess = null;  // 成功時のコールバック
    this.succeeded = false;

    this._bindPointer();
  }

  // 出題する文字をセットしてお手本を描く
  setChar(kana) {
    this.kana = kana;
    this.succeeded = false;
    this.clear();
    this._drawGuide(kana);
    this._buildMask(kana);
  }

  // なぞった跡を消す（お手本は残す）
  clear() {
    this.dctx.clearRect(0, 0, RES, RES);
    this.uctx.clearRect(0, 0, LOW, LOW);
    this.lastPt = null;
    if (this.onProgress) this.onProgress(0);
  }

  // ---- お手本の描画（表示用キャンバス） ----
  _drawGuide(kana) {
    const ctx = this.gctx;
    ctx.clearRect(0, 0, RES, RES);

    // マス目のガイド線（原稿用紙のような十字＋外枠）をうすく描く
    ctx.strokeStyle = "rgba(120,140,200,0.25)";
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 12]);
    ctx.beginPath();
    ctx.moveTo(RES / 2, 20); ctx.lineTo(RES / 2, RES - 20); // 縦の中心線
    ctx.moveTo(20, RES / 2); ctx.lineTo(RES - 20, RES / 2); // 横の中心線
    ctx.stroke();
    ctx.setLineDash([]);

    // お手本の文字（うすいグレー）
    ctx.fillStyle = "rgba(80,80,90,0.18)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `${RES * 0.78}px "Hiragino Sans","Hiragino Kaku Gothic ProN","Yu Gothic",sans-serif`;
    ctx.fillText(kana, RES / 2, RES / 2 + RES * 0.02);
  }

  // ---- 判定用：お手本のシルエットを低解像度で作る ----
  _buildMask(kana) {
    const ctx = this.mctx;
    ctx.clearRect(0, 0, LOW, LOW);
    ctx.fillStyle = "#000";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `${LOW * 0.78}px "Hiragino Sans","Hiragino Kaku Gothic ProN","Yu Gothic",sans-serif`;
    ctx.fillText(kana, LOW / 2, LOW / 2 + LOW * 0.02);

    // お手本のピクセル数（不透明な部分）を数えて分母にする
    const data = ctx.getImageData(0, 0, LOW, LOW).data;
    let count = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 40) count++;
    this.targetCount = Math.max(count, 1);
  }

  // ---- ポインタ（指・マウス・ペン）入力 ----
  _bindPointer() {
    const start = (e) => {
      e.preventDefault();
      this.drawing = true;
      this.lastPt = this._pos(e);
    };
    const move = (e) => {
      if (!this.drawing) return;
      e.preventDefault();
      const p = this._pos(e);
      this._segment(this.lastPt, p);
      this.lastPt = p;
      this._evaluate(false); // なぞるたびに進捗を更新
    };
    const end = (e) => {
      if (!this.drawing) return;
      e.preventDefault();
      this.drawing = false;
      this.lastPt = null;
      this._evaluate(true); // 指を離したタイミングで成功判定
    };

    // Pointer Events（iPadのタッチ・Apple Pencil・マウスをまとめて扱える）
    this.draw.addEventListener("pointerdown", start);
    this.draw.addEventListener("pointermove", move);
    this.draw.addEventListener("pointerup", end);
    this.draw.addEventListener("pointercancel", end);
    this.draw.addEventListener("pointerleave", end);
  }

  // 画面上のタッチ座標をキャンバス内部座標に変換
  _pos(e) {
    const r = this.draw.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * RES,
      y: ((e.clientY - r.top) / r.height) * RES,
    };
  }

  // 2点を結ぶ線分を、表示用と判定用の両方に描く
  _segment(a, b) {
    if (!a) a = b;
    // 表示用（カラフルな太い線）
    const d = this.dctx;
    d.strokeStyle = "#ff6fa5";
    d.lineWidth = STROKE_DISPLAY;
    d.lineCap = "round";
    d.lineJoin = "round";
    d.beginPath();
    d.moveTo(a.x, a.y); d.lineTo(b.x, b.y);
    d.stroke();

    // 判定用（低解像度に縮小して同じ線を描く）
    const s = LOW / RES;
    const u = this.uctx;
    u.strokeStyle = "#000";
    u.lineWidth = STROKE_LOW;
    u.lineCap = "round";
    u.lineJoin = "round";
    u.beginPath();
    u.moveTo(a.x * s, a.y * s); u.lineTo(b.x * s, b.y * s);
    u.stroke();
  }

  // なぞり具合を評価して、進捗・成功を通知する
  _evaluate(final) {
    const mask = this.mctx.getImageData(0, 0, LOW, LOW).data;
    const user = this.uctx.getImageData(0, 0, LOW, LOW).data;

    let covered = 0; // お手本の上をなぞれたピクセル
    let userTotal = 0; // ユーザーがなぞった総ピクセル
    for (let i = 3; i < mask.length; i += 4) {
      const onTarget = mask[i] > 40;
      const onUser = user[i] > 40;
      if (onUser) userTotal++;
      if (onTarget && onUser) covered++;
    }

    const coverage = covered / this.targetCount; // なぞれた割合
    if (this.onProgress) this.onProgress(Math.min(coverage / COVER_THRESHOLD, 1));

    // 成功条件：十分なぞれている かつ はみ出し過ぎていない
    const spillOk = userTotal <= this.targetCount * SPILL_LIMIT;
    if (!this.succeeded && coverage >= COVER_THRESHOLD && spillOk) {
      this.succeeded = true;
      if (this.onSuccess) this.onSuccess();
    }
  }
}
