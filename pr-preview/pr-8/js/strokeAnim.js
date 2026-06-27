// ============================================================
// 書き順アニメーション
//   KanjiVGのストロークデータ(js/strokes.js)を使い、
//   正しい書き順で1画ずつ「ペン先の点」と一緒に線を描いて見せる
// ============================================================
import { STROKES, STROKE_VIEWBOX } from "./strokes.js";

const SVG_NS = "http://www.w3.org/2000/svg";

export class StrokeAnimator {
  // container: アニメSVGを入れる要素（trace-area内のオーバーレイ）
  constructor(container) {
    this.container = container;
    this.svg = null;
    this.kana = null;
    this.timers = [];   // 途中キャンセル用のタイマー
    this.raf = null;    // requestAnimationFrameのID
    this.playing = false;
  }

  // 出題文字をセットしてSVGを組み立てる（まだ描かない）
  setChar(kana) {
    this.stop();
    this.kana = kana;
    this.container.innerHTML = "";

    const vb = STROKE_VIEWBOX;
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", `0 0 ${vb} ${vb}`);
    svg.setAttribute("class", "stroke-svg");
    this.svg = svg;

    const strokes = STROKES[kana] || [];
    this.paths = [];
    this.numbers = [];

    strokes.forEach((d, i) => {
      // 1) うすい「お手本（全画）」を最初から表示しておく
      const ghost = document.createElementNS(SVG_NS, "path");
      ghost.setAttribute("d", d);
      ghost.setAttribute("class", "stroke-ghost");
      svg.appendChild(ghost);
    });

    strokes.forEach((d, i) => {
      // 2) 実際に描かれていく線（最初は隠しておく）
      const p = document.createElementNS(SVG_NS, "path");
      p.setAttribute("d", d);
      p.setAttribute("class", "stroke-active");
      svg.appendChild(p);
      this.paths.push(p);
    });

    // 3) ペン先の点
    this.pen = document.createElementNS(SVG_NS, "circle");
    this.pen.setAttribute("r", "4.5");
    this.pen.setAttribute("class", "stroke-pen");
    this.pen.style.opacity = "0";
    svg.appendChild(this.pen);

    // 4) 各画の「番号」を始点に置く（最初は隠す）
    strokes.forEach((d, i) => {
      // 番号は始点に置きたいが、SVG挿入後でないと座標を測れないので後で配置する
      const g = document.createElementNS(SVG_NS, "g");
      g.setAttribute("class", "stroke-num");
      g.style.opacity = "0";
      const circle = document.createElementNS(SVG_NS, "circle");
      circle.setAttribute("r", "7");
      const text = document.createElementNS(SVG_NS, "text");
      text.textContent = String(i + 1);
      text.setAttribute("dy", "3.5");
      text.setAttribute("text-anchor", "middle");
      g.appendChild(circle);
      g.appendChild(text);
      svg.appendChild(g);
      this.numbers.push(g);
    });

    this.container.appendChild(svg);

    // SVGに挿入後なら長さ・座標が測れるので、番号の位置を始点に置く
    this.paths.forEach((p, i) => {
      const s = p.getPointAtLength(0);
      const g = this.numbers[i];
      g.querySelector("circle").setAttribute("cx", s.x);
      g.querySelector("circle").setAttribute("cy", s.y);
      g.querySelector("text").setAttribute("x", s.x);
      g.querySelector("text").setAttribute("y", s.y);
      // 描く線の初期状態（dash で隠す）
      const len = p.getTotalLength();
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
    });
  }

  // アニメーション再生
  play(onDone) {
    if (!this.svg || this.playing) return;
    this.stop(false);
    this.playing = true;
    this.container.classList.add("playing");

    let idx = 0;
    const animateStroke = (i) => {
      if (i >= this.paths.length) {
        // 全画おわり：少し見せてからオーバーレイを閉じる
        this.pen.style.opacity = "0";
        const t = setTimeout(() => {
          this.playing = false;
          this.container.classList.remove("playing");
          if (onDone) onDone();
        }, 600);
        this.timers.push(t);
        return;
      }
      const p = this.paths[i];
      const len = p.getTotalLength();
      const num = this.numbers[i];

      num.style.opacity = "1"; // この画の番号を表示
      this.pen.style.opacity = "1";

      // 線の長さに応じて描画時間を決める（短い画はサッと、長い画はゆっくり）
      const duration = Math.max(450, len * 11);
      const startTime = performance.now();

      const step = (now) => {
        const t = Math.min((now - startTime) / duration, 1);
        p.style.strokeDashoffset = len * (1 - t); // だんだん見せる
        const pt = p.getPointAtLength(len * t);    // ペン先を進める
        this.pen.setAttribute("cx", pt.x);
        this.pen.setAttribute("cy", pt.y);
        if (t < 1) {
          this.raf = requestAnimationFrame(step);
        } else {
          // 次の画へ（少し間をあける）
          const tm = setTimeout(() => animateStroke(i + 1), 280);
          this.timers.push(tm);
        }
      };
      this.raf = requestAnimationFrame(step);
    };

    animateStroke(0);
  }

  // 再生中のアニメをすべて止める
  stop(reset = true) {
    this.playing = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.container.classList.remove("playing");
    if (reset && this.paths) {
      // 線・番号・ペンを初期状態に戻す
      this.paths.forEach((p) => {
        const len = p.getTotalLength();
        p.style.strokeDashoffset = len;
      });
      this.numbers.forEach((g) => (g.style.opacity = "0"));
      if (this.pen) this.pen.style.opacity = "0";
    }
  }
}
