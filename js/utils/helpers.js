// =========================================================
// 🛠 js/utils/helpers.js：計算や文字変換などの便利ツール
// =========================================================

// スコアの平均値を計算
window.getAvg = function (scores) {
  const t =
    parseInt(scores.story || 0) +
    parseInt(scores.visual || 0) +
    parseInt(scores.character || 0) +
    parseInt(scores.music || 0);
  const r = parseInt(scores.resonance || 0) * 1.5;
  return ((t + r) / 5.5).toFixed(1);
};

// 声優・キャラのあいうえお順グループ分け
window.getActorGroupInfo = function (name) {
  let romaji = "";
  const match = name.match(/\[(.*?)\]/);
  if (match) {
    romaji = match[1].trim().toLowerCase();
    romaji = romaji.split(" ").reverse().join(" ");
  } else {
    romaji = name.trim().toLowerCase();
    if (/^[a-z\s]+$/.test(romaji)) {
      romaji = romaji.split(" ").reverse().join(" ");
    }
  }
  const first = romaji.charAt(0);
  let group = "その他";
  let order = 99;
  if (/[aeiou]/i.test(first)) {
    group = "あ行";
    order = 1;
  } else if (/[kg]/i.test(first)) {
    group = "か行";
    order = 2;
  } else if (/[szj]/i.test(first)) {
    group = "さ行";
    order = 3;
  } else if (/[tdc]/i.test(first)) {
    group = "た行";
    order = 4;
  } else if (/[n]/i.test(first)) {
    group = "な行";
    order = 5;
  } else if (/[hbpvf]/i.test(first)) {
    group = "は行";
    order = 6;
  } else if (/[m]/i.test(first)) {
    group = "ま行";
    order = 7;
  } else if (/[y]/i.test(first)) {
    group = "や行";
    order = 8;
  } else if (/[rl]/i.test(first)) {
    group = "ら行";
    order = 9;
  } else if (/[w]/i.test(first)) {
    group = "わ行";
    order = 10;
  } else if (/[a-z]/i.test(first)) {
    group = "A-Z";
    order = 11;
  } else if (/[0-9]/.test(first)) {
    group = "数字";
    order = 12;
  }

  if (group === "その他" || group === "A-Z") {
    if (/[あ-おア-オ]/.test(first)) {
      group = "あ行";
      order = 1;
    } else if (/[か-こカ-コガ-ゴ]/.test(first)) {
      group = "か行";
      order = 2;
    } else if (/[さ-そサ-ソザ-ゾ]/.test(first)) {
      group = "さ行";
      order = 3;
    } else if (/[た-とタ-トダ-ド]/.test(first)) {
      group = "た行";
      order = 4;
    } else if (/[な-のナ-ノ]/.test(first)) {
      group = "な行";
      order = 5;
    } else if (/[は-ほハ-ホバ-ボパ-ポ]/.test(first)) {
      group = "は行";
      order = 6;
    } else if (/[ま-もマ-モ]/.test(first)) {
      group = "ま行";
      order = 7;
    } else if (/[や-よヤ-ヨ]/.test(first)) {
      group = "や行";
      order = 8;
    } else if (/[ら-ろラ-ロ]/.test(first)) {
      group = "ら行";
      order = 9;
    } else if (/[わ-んワ-ン]/.test(first)) {
      group = "わ行";
      order = 10;
    }
  }
  return { group, order, sortKey: romaji };
};
