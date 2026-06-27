// ============================================================
// ひらがなデータ（清音46文字）
// 各文字に「読み(romaji)」「ことば」「ことばのかな」「絵文字」を持たせる
// ※あとから濁音・拗音などを追加できるよう、このファイルだけ増やせば拡張可能
// ============================================================

// 五十音表の行（表示レイアウト用）。null は空マス（や行・わ行のすき間）
export const GOJUON_ROWS = [
  ["あ", "い", "う", "え", "お"],
  ["か", "き", "く", "け", "こ"],
  ["さ", "し", "す", "せ", "そ"],
  ["た", "ち", "つ", "て", "と"],
  ["な", "に", "ぬ", "ね", "の"],
  ["は", "ひ", "ふ", "へ", "ほ"],
  ["ま", "み", "む", "め", "も"],
  ["や", null, "ゆ", null, "よ"],
  ["ら", "り", "る", "れ", "ろ"],
  ["わ", null, null, null, "を"],
  ["ん", null, null, null, null],
];

// 文字ごとの詳細データ
// kana    : ひらがな本体（読み上げ・なぞり書きの対象）
// romaji  : ローマ字読み（大人向けの補助表示用）
// word    : その文字で始まる子ども向けのことば（かな）
// emoji   : ことばを表す絵文字（イラスト代わり）
// say     : 読み上げる文字列（を・ん など単体で読みにくい文字を補正）
export const HIRAGANA = {
  "あ": { romaji: "a",  word: "あり",       emoji: "🐜", say: "あ" },
  "い": { romaji: "i",  word: "いぬ",       emoji: "🐕", say: "い" },
  "う": { romaji: "u",  word: "うさぎ",     emoji: "🐰", say: "う" },
  "え": { romaji: "e",  word: "えび",       emoji: "🦐", say: "え" },
  "お": { romaji: "o",  word: "おにぎり",   emoji: "🍙", say: "お" },

  "か": { romaji: "ka", word: "かさ",       emoji: "☂️", say: "か" },
  "き": { romaji: "ki", word: "きのこ",     emoji: "🍄", say: "き" },
  "く": { romaji: "ku", word: "くるま",     emoji: "🚗", say: "く" },
  "け": { romaji: "ke", word: "けーき",     emoji: "🍰", say: "け" },
  "こ": { romaji: "ko", word: "こあら",     emoji: "🐨", say: "こ" },

  "さ": { romaji: "sa", word: "さかな",     emoji: "🐟", say: "さ" },
  "し": { romaji: "shi",word: "しか",       emoji: "🦌", say: "し" },
  "す": { romaji: "su", word: "すいか",     emoji: "🍉", say: "す" },
  "せ": { romaji: "se", word: "せみ",       emoji: "🦗", say: "せ" },
  "そ": { romaji: "so", word: "そら",       emoji: "☁️", say: "そ" },

  "た": { romaji: "ta", word: "たまご",     emoji: "🥚", say: "た" },
  "ち": { romaji: "chi",word: "ちきゅう",   emoji: "🌍", say: "ち" },
  "つ": { romaji: "tsu",word: "つき",       emoji: "🌙", say: "つ" },
  "て": { romaji: "te", word: "てぶくろ",   emoji: "🧤", say: "て" },
  "と": { romaji: "to", word: "とり",       emoji: "🐦", say: "と" },

  "な": { romaji: "na", word: "なす",       emoji: "🍆", say: "な" },
  "に": { romaji: "ni", word: "にじ",       emoji: "🌈", say: "に" },
  "ぬ": { romaji: "nu", word: "ぬいぐるみ", emoji: "🧸", say: "ぬ" },
  "ね": { romaji: "ne", word: "ねこ",       emoji: "🐈", say: "ね" },
  "の": { romaji: "no", word: "のり",       emoji: "🍙", say: "の" },

  "は": { romaji: "ha", word: "はな",       emoji: "🌸", say: "は" },
  "ひ": { romaji: "hi", word: "ひつじ",     emoji: "🐑", say: "ひ" },
  "ふ": { romaji: "fu", word: "ふね",       emoji: "⛵", say: "ふ" },
  "へ": { romaji: "he", word: "へび",       emoji: "🐍", say: "へ" },
  "ほ": { romaji: "ho", word: "ほし",       emoji: "⭐", say: "ほ" },

  "ま": { romaji: "ma", word: "まめ",       emoji: "🫘", say: "ま" },
  "み": { romaji: "mi", word: "みかん",     emoji: "🍊", say: "み" },
  "む": { romaji: "mu", word: "むし",       emoji: "🐛", say: "む" },
  "め": { romaji: "me", word: "めがね",     emoji: "👓", say: "め" },
  "も": { romaji: "mo", word: "もも",       emoji: "🍑", say: "も" },

  "や": { romaji: "ya", word: "やま",       emoji: "⛰️", say: "や" },
  "ゆ": { romaji: "yu", word: "ゆき",       emoji: "⛄", say: "ゆ" },
  "よ": { romaji: "yo", word: "よっと",     emoji: "⛵", say: "よ" },

  "ら": { romaji: "ra", word: "らいおん",   emoji: "🦁", say: "ら" },
  "り": { romaji: "ri", word: "りんご",     emoji: "🍎", say: "り" },
  "る": { romaji: "ru", word: "るびー",     emoji: "💎", say: "る" },
  "れ": { romaji: "re", word: "れもん",     emoji: "🍋", say: "れ" },
  "ろ": { romaji: "ro", word: "ろうそく",   emoji: "🕯️", say: "ろ" },

  "わ": { romaji: "wa", word: "わに",       emoji: "🐊", say: "わ" },
  "を": { romaji: "wo", word: "ほんを よむ", emoji: "📖", say: "を" },
  "ん": { romaji: "n",  word: "ぱん",       emoji: "🍞", say: "ん" },
};

// 表に出てくる順番のフラットな配列（「つぎへ」ナビゲーション用）
export const KANA_ORDER = GOJUON_ROWS.flat().filter((k) => k !== null);
