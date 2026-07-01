// =========================================================
// 📸 画像出力専用エンジン (Canvas API Digital Synth)
// =========================================================

const StatsExporter = {
  config: {
    scale: 2,
    width: 780,
    height: 1320, // 🌟 「最高のクリエイター陣」下の無駄な隙間を詰め、高さを1280に最適化！
    fonts: {
      titleEng: '900 28px "arbotek", sans-serif',
      panelTitle: '800 11px "Source Han Sans JP", "Noto Sans JP", sans-serif',
      watermark: '800 10px "rustica", sans-serif',
      baseJp: '500 12px "Source Han Sans JP", "Noto Sans JP", sans-serif',
      baseJpHighlight:
        '600 12px "Source Han Sans JP", "Noto Sans JP", sans-serif',
      baseJpBold: '900 12px "Source Han Sans JP", "Noto Sans JP", sans-serif',
      numberLarge: '500 32px "rustica", sans-serif',
      numberMid: '500 22px "rustica", sans-serif',
      numberSmall: '600 12px "rustica", sans-serif',
      numberOshi: '500 24px "rustica", sans-serif',
    },
    colors: {
      bgStart: "#E2E8F0",
      bgEnd: "#DBEAFE",
      cardBg: "#FFFFFF",
      panelBg: "#F4F7FB",
      panelBorder: "rgba(30, 41, 59, 0.08)",
      textMain: "#1E293B",
      textSub: "#64748b",
      accentBlue: "#6366f1",
      starYellow: "#F59E0B",
      watermark: "#64748B",
      neonBlue: "#6366f1",
      neonYellow: "#F9C106",
      neonRed: "#FF1F4F",
    },
  },

  // 👤 ヘルパー関数群（元のロジックを完全維持）
  drawImageCover(ctx, img, x, y, w, h, radius) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    ctx.clip();

    const imgRatio = img.width / img.height;
    const boxRatio = w / h;
    let renderW, renderH, renderX, renderY;

    if (imgRatio > boxRatio) {
      renderH = h;
      renderW = img.width * (h / img.height);
      renderX = x - (renderW - w) / 2;
      renderY = y;
    } else {
      renderW = w;
      renderH = img.height * (w / img.width);
      renderX = x;
      renderY = y - (renderH - h) / 2;
    }

    ctx.drawImage(img, renderX, renderY, renderW, renderH);
    ctx.restore();
  },

  // 🚀 HTMLの解析をやめて、直接配列を描画する超安全な関数に進化！
  drawTokenTextWithWrapping(ctx, tokens, x, y, maxWidth, lineHeight) {
    if (!tokens || tokens.length === 0) return;
    const cfg = StatsExporter.config;

    let currentX = x;
    let currentY = y;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    for (const token of tokens) {
      // 🎨 ここが超シンプル！
      // type が "highlight" なら青紫の太字、それ以外は黒文字にするだけ！
      if (token.type === "highlight") {
        ctx.font = cfg.fonts.baseJpBold;
        ctx.fillStyle = cfg.colors.accentBlue;
      } else {
        ctx.font = cfg.fonts.baseJp;
        ctx.fillStyle = cfg.colors.textMain;
      }

      // 文字を1文字ずつ取り出して改行位置を計算しながら書く
      const chars = String(token.text);
      for (let i = 0; i < chars.length; i++) {
        const char = chars[i];
        if (char === "\n") {
          currentX = x;
          currentY += lineHeight;
          continue;
        }
        const charWidth = ctx.measureText(char).width;
        if (currentX + charWidth > x + maxWidth) {
          currentX = x;
          currentY += lineHeight;
        }
        ctx.fillText(char, currentX, currentY);
        currentX += charWidth;
      }
    }
  },

  async loadImage(src) {
    return new Promise((resolve) => {
      if (!src) return resolve(null);
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src.includes("data:")
        ? src
        : src + (src.includes("?") ? "&" : "?") + "cb=" + Date.now();
    });
  },

  // 🚀 メインの画像生成処理（元のデザイン・色を100%再現しつつ中央を大改造）
  async generateImage(data) {
    return new Promise(async (resolve, reject) => {
      try {
        await document.fonts.ready;
        const canvas = document.createElement("canvas");
        canvas.width = StatsExporter.config.width;
        canvas.height = StatsExporter.config.height;
        const ctx = canvas.getContext("2d");

        const cfg = StatsExporter.config;
        const scale = cfg.scale;

        // 画質向上のためのスケーリング設定
        canvas.width = cfg.width * scale;
        canvas.height = cfg.height * scale;
        ctx.scale(scale, scale);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // 1️⃣ 背景グラデーションを完全復元 (bgStart -> bgEnd)
        const bgGradient = ctx.createLinearGradient(0, 0, 0, cfg.height);
        bgGradient.addColorStop(0, cfg.colors.cardBg);
        bgGradient.addColorStop(1, cfg.colors.cardBg);
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, cfg.width, cfg.height);

        // 2️⃣ 全体の白い大きな土台カード (cardBg)
        ctx.fillStyle = cfg.colors.cardBg;
        ctx.beginPath();
        ctx.roundRect(16, 16, 748, cfg.height - 32, 24);
        ctx.fill();

        // メインタイトル
        ctx.fillStyle = cfg.colors.accentBlue;
        ctx.font = cfg.fonts.titleEng;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("OTAKU LOG INSIGHTS", cfg.width / 2, 45);

        // ==========================================
        // 🧱 パネル1：診断プロファイル（高さを伸ばして余裕を確保）
        // ==========================================
        const reportY = 75;
        const reportH = 255; // 🌟 230 ➔ 255 へ下に伸ばして文字下スペースにゆとりを持たせました
        ctx.fillStyle = cfg.colors.panelBg;
        ctx.beginPath();
        ctx.roundRect(24, reportY, 732, reportH, 16);
        ctx.fill();
        ctx.strokeStyle = cfg.colors.panelBorder;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = cfg.colors.textMain;
        ctx.font = cfg.fonts.panelTitle;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText("診断プロファイル", 24 + 16, reportY + 16);

        // 💡 ここを新しい配列処理関数に変更！
        if (data.reportTokens) {
          StatsExporter.drawTokenTextWithWrapping(
            ctx,
            data.reportTokens,
            24 + 16,
            reportY + 45,
            700,
            24,
          );
        }

        // ==========================================
        // 🧱 パネル2：中央 3カラム × 2行 (縦長化)
        // ==========================================
        const gridStartX = 24;
        const gridStartY = 350;
        const gridGap = 12;
        const gridColWidth = (732 - gridGap * 2) / 3; // 1マスの横幅
        const gridRowHeight = 330;
        const imagePromises = [];

        for (let row = 0; row < 2; row++) {
          for (let col = 0; col < 3; col++) {
            const x = gridStartX + col * (gridColWidth + gridGap);
            const y = gridStartY + row * (gridRowHeight + gridGap);

            // 土台の描画
            ctx.fillStyle = cfg.colors.panelBg;
            ctx.beginPath();
            ctx.roundRect(x, y, gridColWidth, gridRowHeight, 16);
            ctx.fill();
            ctx.strokeStyle = cfg.colors.panelBorder;
            ctx.lineWidth = 1;
            ctx.stroke();

            // 🚀 1段目・左のマス (row: 0, col: 0) に高評価トップ5を描画
            if (row === 0 && col === 0) {
              ctx.fillStyle = cfg.colors.textSub;
              ctx.font = cfg.fonts.panelTitle;
              ctx.textAlign = "left";
              ctx.textBaseline = "top";
              ctx.fillText("高評価トップ5", x + 12, y + 12);

              if (data.masterpieces && data.masterpieces.length > 0) {
                // ↕️ ここを調整！初期位置を 40 ➔ 48 に下げて、間隔を 55 ➔ 54 に微調整
                let itemY = y + 48; // 全体を少し下に下げる
                const itemHeight = 54; // 5個がきれいに収まる均等な縦幅
                const iconSize = 40;

                for (
                  let i = 0;
                  i < Math.min(5, data.masterpieces.length);
                  i++
                ) {
                  const item = data.masterpieces[i];

                  // 1. タイトルの描画（2行構成にするため、少し上に配置します）
                  ctx.fillStyle = cfg.colors.textMain;
                  ctx.font = '600 12px "Source Han Sans JP", sans-serif';
                  let titleTxt = item.title || "";
                  const maxTitleW = gridColWidth - iconSize - 30;
                  if (ctx.measureText(titleTxt).width > maxTitleW) {
                    while (
                      ctx.measureText(titleTxt + "...").width > maxTitleW &&
                      titleTxt.length > 0
                    ) {
                      titleTxt = titleTxt.slice(0, -1);
                    }
                    titleTxt += "...";
                  }
                  // 💡 縦位置を「itemY + 12」にして少し上にズラす
                  ctx.fillText(titleTxt, x + 16 + iconSize + 10, itemY + 12);

                  // 🚀 2. 【新規追加】タイトルの下に★と点数を描画
                  ctx.fillStyle = cfg.colors.starYellow; // 前に設定した星の黄色
                  ctx.font = "10px sans-serif"; // 星マーク用
                  ctx.fillText("★", x + 16 + iconSize + 10, itemY + 30);

                  ctx.fillStyle = cfg.colors.textSub; // 点数は少し落ち着いたグレー、または textMain でもOK
                  ctx.font = "800 12px sans-serif"; // 点数用のフォント
                  const scoreVal = parseFloat(item.my_score || 0).toFixed(1);
                  // 星マークの横幅分（約12px）右にズラして点数を描画
                  ctx.fillText(
                    scoreVal,
                    x + 16 + iconSize + 10 + 12,
                    itemY + 29,
                  );

                  // 🖼️ 実績のある loadImage 関数を使って安全に画像を読み込む
                  if (item.cover_url) {
                    const currentX = x + 16;
                    const currentY = itemY;

                    // StatsExporter内、または this 内にある loadImage を呼び出す
                    // もしクラス外の独立した関数なら、単に loadImage(item.cover_url) でOKです
                    const loader =
                      typeof this.loadImage === "function"
                        ? this.loadImage(item.cover_url)
                        : typeof StatsExporter.loadImage === "function"
                          ? StatsExporter.loadImage(item.cover_url)
                          : null;

                    if (loader) {
                      const p = loader.then((imgObj) => {
                        if (imgObj) {
                          ctx.save();
                          ctx.beginPath();
                          ctx.roundRect(
                            currentX,
                            currentY,
                            iconSize,
                            iconSize,
                            6,
                          ); // 角丸6px
                          ctx.clip();
                          ctx.drawImage(
                            imgObj,
                            currentX,
                            currentY,
                            iconSize,
                            iconSize,
                          );
                          ctx.restore();
                        }
                      });
                      imagePromises.push(p); // 監視配列に追加して完了を待つ
                    }
                  }

                  itemY += itemHeight;
                }
              } else {
                ctx.fillStyle = cfg.colors.textSub;
                ctx.font = cfg.fonts.baseJp;
                ctx.fillText("データなし", x + 12, y + 36);
              }
            }
            // 🚀 1段目・真ん中のマス (row: 0, col: 1) に「視聴スタイル」を描画（位置・反転完全修正版）
            else if (row === 0 && col === 1) {
              // 🚀 画面のHTML要素から直接「1696」と「21」の文字を確実に引っこ抜く！
              let calcH = "0";
              let calcM = "0";

              // 画面内の time-badge から数字が書かれているクラスを探します
              const timeNums = document.querySelectorAll(".s-time-num");
              if (timeNums && timeNums.length >= 2) {
                calcH = timeNums[0].textContent.trim(); // 1番目のバッジから「1696」を取得
                calcM = timeNums[1].textContent.trim(); // 2番目のバッジから「21」を取得
              } else {
                // 万が一画面から取れなかった場合のセーフティ
                const totalMins = data.totalMinutes || 0;
                calcH = Math.floor(totalMins / 60);
                calcM = totalMins % 60;
              }

              const totalAnimeVal = data.totalAnime || 0;
              const totalDBLengthVal = data.totalDB || 0;
              const compRateVal =
                totalDBLengthVal > 0
                  ? Math.round((totalAnimeVal / totalDBLengthVal) * 100)
                  : 0;
              const backlogCountVal = totalDBLengthVal - totalAnimeVal;

              // 1. パネルタイトル
              ctx.fillStyle = cfg.colors.textSub;
              ctx.font = cfg.fonts.panelTitle;
              ctx.textAlign = "left";
              ctx.textBaseline = "top";
              ctx.fillText("視聴スタイル", x + 12, y + 12);

              // --- ① 視聴作品数 & 進捗パーセント ---
              const compRowY = y + 36;
              ctx.fillStyle = "#6366f1";
              ctx.font = "800 24px sans-serif";
              ctx.fillText(totalAnimeVal, x + 12, compRowY);

              const numW = ctx.measureText(totalAnimeVal).width;
              ctx.fillStyle = "#64748b";
              ctx.font = '600 11px "Source Han Sans JP", sans-serif';
              ctx.fillText(
                ` / ${totalDBLengthVal} 作品視聴済み`,
                x + 12 + numW + 4,
                compRowY + 10,
              );

              // 右側：進捗丸背景とチェック
              const chkX = x + gridColWidth - 12 - 14;
              const chkY = compRowY + 12;
              ctx.fillStyle = "#eef2ff";
              ctx.beginPath();
              ctx.arc(chkX, chkY, 14, 0, Math.PI * 2);
              ctx.fill();

              ctx.strokeStyle = "#6366f1";
              ctx.lineWidth = 2.5;
              ctx.beginPath();
              ctx.moveTo(chkX - 5, chkY);
              ctx.lineTo(chkX - 1, chkY + 4);
              ctx.lineTo(chkX + 5, chkY - 4);
              ctx.stroke();

              // 進捗率テキスト（チェックマークの左側に配置）
              ctx.textAlign = "right";
              ctx.fillStyle = "#64748b";
              ctx.font = "700 12px sans-serif";
              ctx.fillText(`${compRateVal}%`, chkX - 18, compRowY + 14);
              ctx.textAlign = "left"; // 基準を「左寄せ」に即座に戻す

              // 達成バー
              const barY = compRowY + 32;
              const barW = gridColWidth - 24;
              ctx.fillStyle = "#eef2ff";
              ctx.beginPath();
              ctx.roundRect(x + 12, barY, barW, 6, 3);
              ctx.fill();

              if (compRateVal > 0) {
                ctx.fillStyle = "#fbbf24";
                ctx.beginPath();
                ctx.roundRect(
                  x + 12,
                  barY,
                  barW * (Math.min(100, compRateVal) / 100),
                  6,
                  3,
                );
                ctx.fill();
              }

              // --- ② 総視聴時間 (.s-total-time-wrap) ---
              const timeWrapY = y + 84;
              const timeWrapH = 40;
              ctx.fillStyle = "#f8fafc";
              ctx.strokeStyle = "#cbd5e1";
              ctx.lineWidth = 1.5;
              ctx.setLineDash([4, 4]);
              ctx.beginPath();
              ctx.roundRect(x + 12, timeWrapY, barW, timeWrapH, 12);
              ctx.fill();
              ctx.stroke();
              ctx.setLineDash([]);

              // ラベル
              ctx.fillStyle = "#64748b";
              ctx.font = '800 11px "Source Han Sans JP", sans-serif';
              ctx.fillText("総視聴時間", x + 24, timeWrapY + 14);

              // 🚀 【並び順修正】右端から左に向かって「m ➔ 分の数字 ➔ h ➔ 時間の数字」の順にパズルを組み立てる
              ctx.textAlign = "right";

              // 1. まず一番右端に「m」を書く
              ctx.fillStyle = "#64748b";
              ctx.font = "800 10px sans-serif";
              ctx.fillText("m", x + gridColWidth - 24, timeWrapY + 16);
              const unitMW = ctx.measureText("m").width;

              // 2. 「m」のすぐ左に「分の数字」を書く
              ctx.fillStyle = "#334155";
              ctx.font = "900 15px sans-serif";
              ctx.fillText(
                calcM,
                x + gridColWidth - 24 - unitMW - 2,
                timeWrapY + 12,
              );
              const valMW = ctx.measureText(calcM).width;

              // 3. その左に「h」を書く
              const hLabelX = x + gridColWidth - 24 - unitMW - 2 - valMW - 12;
              ctx.fillStyle = "#64748b";
              ctx.font = "800 10px sans-serif";
              ctx.fillText("h", hLabelX, timeWrapY + 16);
              const unitHW = ctx.measureText("h").width;

              // 4. 「h」のすぐ左に「時間の数字」を書く
              ctx.fillStyle = "#334155";
              ctx.font = "900 15px sans-serif";
              ctx.fillText(calcH, hLabelX - unitHW - 2, timeWrapY + 12);

              ctx.textAlign = "left"; // 基準を戻す

              // --- ③ 積みアニメボタンデザイン ---
              const btnY = y + 138;
              const btnH = 42;
              const gradient = ctx.createLinearGradient(
                x + 12,
                btnY,
                x + 12 + barW,
                btnY + btnH,
              );
              gradient.addColorStop(0, "#eef2ff");
              gradient.addColorStop(1, "#e0e7ff");
              ctx.fillStyle = gradient;
              ctx.beginPath();
              ctx.roundRect(x + 12, btnY, barW, btnH, 12);
              ctx.fill();

              ctx.fillStyle = "#6366f1";
              ctx.font = '800 12px "Source Han Sans JP", sans-serif';
              ctx.fillText("積みアニメ", x + 26, btnY + 15);

              // 🚀 【並び順修正】右端に「本」、その左に「本数の数字」を描画する
              ctx.textAlign = "right";

              // 1. 一番右端に「本」を書く
              ctx.fillStyle = "#6366f1";
              ctx.font = '700 10px "Source Han Sans JP", sans-serif';
              ctx.fillText("本", x + gridColWidth - 24, btnY + 16);
              const unitHonW = ctx.measureText("本").width;

              // 2. 「本」のすぐ左に「本数の数字」を書く
              ctx.fillStyle = "#6366f1";
              ctx.font = "900 16px sans-serif";
              ctx.fillText(
                backlogCountVal,
                x + gridColWidth - 24 - unitHonW - 2,
                btnY + 12,
              );

              ctx.textAlign = "left"; // 基準を戻す

              // --- ④ フォーマット別シェアバー ---
              let rowY = y + 196;
              const formatCounts = data.formatCounts || {};

              if (formatCounts && totalAnimeVal > 0) {
                const topFormats = Object.entries(formatCounts)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 4);

                topFormats.forEach(([formatName, count]) => {
                  const pct = Math.round((count / totalAnimeVal) * 100);

                  // フォーマット名
                  ctx.fillStyle = "#334155";
                  ctx.font = '700 11px "Source Han Sans JP", sans-serif';
                  ctx.fillText(formatName, x + 12, rowY + 2);

                  // 横型ミニプログレスバー
                  const miniBarX = x + 68;
                  const miniBarW = gridColWidth - 110;
                  ctx.fillStyle = "#f1f5f9";
                  ctx.beginPath();
                  ctx.roundRect(miniBarX, rowY + 5, miniBarW, 8, 4);
                  ctx.fill();

                  if (pct > 0) {
                    ctx.fillStyle = "#6366f1";
                    ctx.beginPath();
                    ctx.roundRect(
                      miniBarX,
                      rowY + 5,
                      miniBarW * (Math.min(100, pct) / 100),
                      8,
                      4,
                    );
                    ctx.fill();
                  }

                  // パーセンテージ
                  ctx.textAlign = "right";
                  ctx.fillStyle = "#334155";
                  ctx.font = "700 11px sans-serif";
                  ctx.fillText(`${pct}%`, x + gridColWidth - 12, rowY + 2);
                  ctx.textAlign = "left";

                  rowY += 31;
                });
              }
            }

            // 🚀 1段目・右側のマス (row: 0, col: 2) に「刺さるジャンル」を描画（重なり回避＆全体下げ版）
            else if (row === 0 && col === 2) {
              const gData = data.genre || {};
              const ballGenres = gData.ballGenres || [];

              // 1. パネルタイトル
              ctx.fillStyle = cfg.colors.textSub;
              ctx.font = cfg.fonts.panelTitle;
              ctx.textAlign = "left";
              ctx.textBaseline = "top";
              ctx.fillText("刺さるジャンル", x + 12, y + 12);

              // カラーマップの定義
              const genreColorMap = {
                ドラマ: "#FF7EB3",
                コメディ: "#2DD4BF",
                日常: "#FFA800",
                アクション: "#FF4B72",
                ミステリー: "#A855F7",
                アドベンチャー: "#F97316",
                超能力: "#38BDF8",
                ファンタジー: "#14B8A6",
                ロマンス: "#F472B6",
                スポーツ: "#60A5FA",
                ホラー: "#6366F1",
                魔法少女: "#D946EF",
                メカ: "#64748B",
                音楽: "#10B981",
                サイコ: "#06B6D4",
                SF: "#2563EB",
                スリラー: "#E11D48",
                お色気: "#FF52D9",
              };
              const fallbackColors = [
                "#FF7EB3",
                "#2DD4BF",
                "#FFA800",
                "#A855F7",
                "#38BDF8",
              ];

              if (ballGenres && ballGenres.length > 0) {
                // 🚀 【調整ポイント1】ドーナツの中心をさらに下に下げる
                const cx = x + gridColWidth / 2;
                const cy = y + 140; // ↕️ 中心を 130 ➔ 140 に下げて全体を下に移動
                const radius = 42; // 直径はキープ（これ以上縮めるとネオン感が減るため）
                const thickness = 16;

                const pseudoTotal = ballGenres.reduce(
                  (sum, g) => sum + g[1],
                  0,
                );

                // 土台のグレーリング
                ctx.strokeStyle = "#f1f5f9";
                ctx.lineWidth = thickness;
                ctx.beginPath();
                ctx.arc(cx, cy, radius, 0, Math.PI * 2);
                ctx.stroke();

                // セグメントのデータ組み立て
                let cumulativePercent = 0;
                const labels = ballGenres.map((g, index) => {
                  const name = g[0];
                  const count = g[1];
                  const fraction = count / pseudoTotal;
                  const startAngle =
                    -Math.PI / 2 + cumulativePercent * Math.PI * 2;
                  const endAngle = startAngle + fraction * Math.PI * 2;
                  const midAngle = startAngle + (fraction / 2) * Math.PI * 2;
                  const isRight = Math.cos(midAngle) >= 0;
                  cumulativePercent += fraction;

                  return {
                    name,
                    count,
                    fraction,
                    startAngle,
                    endAngle,
                    midAngle,
                    isRight,
                    // 重なり防止の初期Y座標
                    y2: cy + (radius + 28) * Math.sin(midAngle),
                  };
                });

                // 重なり防止ロジック
                const leftLabels = labels
                  .filter((l) => !l.isRight)
                  .sort((a, b) => a.y2 - b.y2);
                const rightLabels = labels
                  .filter((l) => l.isRight)
                  .sort((a, b) => a.y2 - b.y2);
                [leftLabels, rightLabels].forEach((side) => {
                  for (let k = 0; k < 10; k++) {
                    for (let i = 0; i < side.length - 1; i++) {
                      const diff = side[i + 1].y2 - side[i].y2;
                      // 間隔を 18px に広げてゆったり
                      if (diff < 18) {
                        const overlap = 18 - diff;
                        side[i].y2 -= overlap / 2;
                        side[i + 1].y2 += overlap / 2;
                      }
                    }
                  }
                });

                // ドーナツグラフ＆引き出し線の描画
                labels.forEach((label, index) => {
                  const color =
                    genreColorMap[label.name] ||
                    fallbackColors[index % fallbackColors.length];

                  // 1. セグメント
                  ctx.strokeStyle = color;
                  ctx.lineWidth = thickness;
                  ctx.lineCap = "butt";
                  ctx.beginPath();
                  const gap = 0.03;
                  if (label.endAngle - label.startAngle > gap * 2) {
                    ctx.arc(
                      cx,
                      cy,
                      radius,
                      label.startAngle + gap,
                      label.endAngle - gap,
                    );
                  } else {
                    ctx.arc(cx, cy, radius, label.startAngle, label.endAngle);
                  }
                  ctx.stroke();

                  // 2. 引き出し線（中心を下げたのに合わせて計算を維持）
                  const x1 = cx + (radius + 6) * Math.cos(label.midAngle);
                  const y1 = cy + (radius + 6) * Math.sin(label.midAngle);
                  const x2 = cx + (radius + 16) * Math.cos(label.midAngle);
                  const y2 = label.y2;
                  const x3 = label.isRight ? x + gridColWidth - 14 : x + 14;

                  ctx.strokeStyle = color;
                  ctx.lineWidth = 1.0;
                  ctx.globalAlpha = 0.5;
                  ctx.beginPath();
                  ctx.moveTo(x1, y1);
                  ctx.lineTo(x2, y2);
                  ctx.lineTo(x3, y2);
                  ctx.stroke();
                  ctx.globalAlpha = 1.0;

                  // 3. ジャンル名
                  ctx.fillStyle = color;

                  // 🚀 【調整ポイント2】5文字以上のジャンルのみ、文字を小さくする（アドベンチャー重なり回避）
                  if (label.name.length >= 5) {
                    // 通常 11px ➔ 9.5px に縮小
                    ctx.font = "900 9.5px sans-serif";
                  } else {
                    ctx.font = "900 11px sans-serif"; // 通常サイズ
                  }

                  ctx.textBaseline = "middle";
                  if (label.isRight) {
                    ctx.textAlign = "right";
                    ctx.fillText(label.name, x + gridColWidth - 14, y2 - 7);
                  } else {
                    ctx.textAlign = "left";
                    ctx.fillText(label.name, x + 14, y2 - 7);
                  }
                });

                // --- ② コンボタグセクション (下部・最下部留まり配置) ---
                // 🚀 【調整ポイント3】コンボタグ全体をさらに下に下げる
                // グラフが全体的に下がったので、タグのスタート位置も 220 ➔ 235 に下げて底に寄せる
                let badgeY = y + 235;

                // 画面のHTML要素 (.combo-legend-item) から直接コンボ名と回数を引っこ抜く！
                const comboElements =
                  document.querySelectorAll(".combo-legend-item");

                if (comboElements && comboElements.length > 0) {
                  const maxCombos = Math.min(3, comboElements.length);
                  for (let cIdx = 0; cIdx < maxCombos; cIdx++) {
                    const el = comboElements[cIdx];
                    const spans = el.querySelectorAll("span");

                    if (spans.length >= 4) {
                      const part1 = spans[0].textContent.trim();
                      const part2 = spans[2].textContent.trim();
                      const countVal = spans[3].textContent.trim();

                      const btnW = gridColWidth - 24;

                      // バッジ背景
                      ctx.fillStyle = "#ffffff";
                      ctx.strokeStyle = "#f1f5f9";
                      ctx.lineWidth = 1.5;
                      ctx.beginPath();
                      ctx.roundRect(x + 12, badgeY, btnW, 24, 12);
                      ctx.fill();
                      ctx.stroke();

                      // カラー取得
                      const color1 = genreColorMap[part1] || "#475569";
                      const color2 = genreColorMap[part2] || "#475569";

                      ctx.textBaseline = "middle";
                      ctx.font = '800 10px "Source Han Sans JP", sans-serif';

                      let textStartX = x + 24;
                      ctx.fillStyle = color1;
                      ctx.textAlign = "left";
                      ctx.fillText(part1, textStartX, badgeY + 12);
                      textStartX += ctx.measureText(part1).width;

                      ctx.fillStyle = "#94a3b8";
                      ctx.fillText(" × ", textStartX, badgeY + 12);
                      textStartX += ctx.measureText(" × ").width;

                      ctx.fillStyle = color2;
                      ctx.fillText(part2, textStartX, badgeY + 12);

                      // 右端：カウント数バッジ
                      const countBadgeX = x + gridColWidth - 22;
                      ctx.fillStyle = "#f8fafc";
                      ctx.beginPath();
                      ctx.roundRect(countBadgeX - 18, badgeY + 4, 18, 16, 8);
                      ctx.fill();

                      ctx.fillStyle = "#94a3b8";
                      ctx.font = "900 9px sans-serif";
                      ctx.textAlign = "center";
                      ctx.fillText(countVal, countBadgeX - 9, badgeY + 12);

                      badgeY += 28; // 次のタグへの間隔
                    }
                  }
                } else {
                  ctx.fillStyle = "#94a3b8";
                  ctx.font = "11px sans-serif";
                  ctx.textAlign = "center";
                  // データがない場合の配置も下に
                  ctx.fillText(
                    "データがありません",
                    x + gridColWidth / 2,
                    y + 275,
                  );
                }
              } else {
                // データがない場合
                ctx.fillStyle = "#94a3b8";
                ctx.font = "12px sans-serif";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(
                  "データがありません",
                  x + gridColWidth / 2,
                  y + 165,
                );
              }
            }

            // 🚀 2段目・左側のマス (row: 1, col: 0) に「評価分析」を描画！
            else if (row === 1 && col === 0) {
              const rData = data.ratingData || {};

              const avgScore = rData.avgScore || "0.0";
              const tendencyTxt = data.tendency || "未分析";
              const maxScore = rData.maxScore || "0.0";
              const scoreMedian = rData.median || "0.0";
              const minScore = rData.minScore || "0.0";
              const dist = rData.dist || [0, 0, 0, 0, 0];

              // 🚀 【一言コメントだけHTMLから確実に引っこ抜く！】
              let comment = "データがありません。";
              const commentEl = document.querySelector(".t-analysis-comment");
              if (commentEl) {
                comment = commentEl.textContent.trim();
              }

              // 1. パネルタイトル
              ctx.fillStyle = cfg.colors.textSub;
              ctx.font = cfg.fonts.panelTitle;
              ctx.textAlign = "left";
              ctx.textBaseline = "top";
              ctx.fillText("評価分析", x + 12, y + 12);
              // --------------------------------------------------------
              // ① 平均スコアボックス (.t-avg-box)
              // --------------------------------------------------------
              const boxX = x + 12;
              const boxY = y + 36;
              const boxW = gridColWidth - 24;
              const boxH = 54;

              ctx.fillStyle = "#ffffff";
              ctx.strokeStyle = "#e2e8f0";
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.roundRect(boxX, boxY, boxW, boxH, 14);
              ctx.fill();
              ctx.stroke();

              // 平均スコアの数値と「/5.0」
              ctx.textBaseline = "middle";
              ctx.textAlign = "left";
              ctx.fillStyle = "#6366f1";
              ctx.font = "900 24px sans-serif";
              ctx.fillText(avgScore, boxX + 16, boxY + boxH / 2 - 2);

              const scoreNumW = ctx.measureText(avgScore).width;
              ctx.fillStyle = "#94a3b8";
              ctx.font = "700 11px sans-serif";
              ctx.fillText(
                "/5.0",
                boxX + 16 + scoreNumW + 3,
                boxY + boxH / 2 + 3,
              );

              // 傾向上限バッジ (右端寄せ)
              ctx.font = '700 10px "Source Han Sans JP", sans-serif';
              const badgeW = ctx.measureText(tendencyTxt).width + 16;
              const badgeX = boxX + boxW - badgeW - 12;
              const badgeY = boxY + (boxH - 18) / 2;

              ctx.fillStyle = "#eef2ff";
              ctx.beginPath();
              ctx.roundRect(badgeX, badgeY, badgeW, 18, 9);
              ctx.fill();

              ctx.fillStyle = "#6366f1";
              ctx.textAlign = "center";
              ctx.fillText(tendencyTxt, badgeX + badgeW / 2, badgeY + 9);

              // --------------------------------------------------------
              // ② 3連カプセル (.t-capsules)
              // --------------------------------------------------------
              const capY = boxY + boxH + 8;
              const capW = (boxW - 16) / 3;
              const capH = 34;
              const labelsCaps = [
                {
                  lbl: "最高",
                  val: maxScore,
                  bg: "#f8fafc",
                  stroke: "#f1f5f9",
                },
                {
                  lbl: "中央値",
                  val: scoreMedian,
                  bg: "#ffffff",
                  stroke: "#e0e7ff",
                },
                {
                  lbl: "最低",
                  val: minScore,
                  bg: "#f8fafc",
                  stroke: "#f1f5f9",
                },
              ];

              labelsCaps.forEach((cap, idx) => {
                const capX = boxX + idx * (capW + 8);

                ctx.fillStyle = cap.bg;
                ctx.strokeStyle = cap.stroke;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.roundRect(capX, capY, capW, capH, 17);
                ctx.fill();
                ctx.stroke();

                ctx.textAlign = "center";
                ctx.fillStyle = "#64748b";
                ctx.font = '700 9px "Source Han Sans JP", sans-serif';
                ctx.fillText(cap.lbl, capX + capW / 2, capY + 10);

                ctx.fillStyle = "#1E293B";
                ctx.font = "800 12px sans-serif";
                ctx.fillText(cap.val, capX + capW / 2, capY + 23);
              });

              // --------------------------------------------------------
              // ③ スコア分布ヒストグラム (.t-hist-wrap)
              // --------------------------------------------------------
              const histY = capY + capH + 8;
              const histH = 110; // ヒストグラムエリア全体の高さ

              ctx.fillStyle = "#ffffff";
              ctx.strokeStyle = "#e2e8f0";
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.roundRect(boxX, histY, boxW, histH, 14);
              ctx.fill();
              ctx.stroke();

              const maxDistCount = Math.max(...dist, 1);
              const distLabels = [
                "0-1.0",
                "1.1-2.0",
                "2.1-3.0",
                "3.1-4.0",
                "4.1-5.0",
              ];
              const colW = boxW / 5;
              const maxBarH = 62; // 棒グラフの最大可能ピクセル高

              dist.forEach((cnt, i) => {
                const colX = boxX + i * colW;
                const barW = 14; // 棒の太さ
                const pctHeight = cnt / maxDistCount;
                const barH = Math.round(pctHeight * maxBarH);

                // 各種ベースY座標
                const labelY = histY + histH - 12;
                const barBottomY = labelY - 14;
                const barTopY = barBottomY - barH;

                // 1. カウント数値（0より大きい場合のみ描画）
                if (cnt > 0) {
                  ctx.fillStyle = "#6366f1";
                  ctx.font = "800 9px sans-serif";
                  ctx.textAlign = "center";
                  ctx.fillText(cnt, colX + colW / 2, barTopY - 6);
                }

                // 2. グラデーション付きの棒 (t-hist-bar)
                if (barH > 0) {
                  const grad = ctx.createLinearGradient(
                    0,
                    barBottomY,
                    0,
                    barTopY,
                  );
                  grad.addColorStop(0, "#a5b4fc");
                  grad.addColorStop(1, "#6366f1");

                  ctx.fillStyle = grad;
                  ctx.beginPath();
                  ctx.roundRect(
                    colX + (colW - barW) / 2,
                    barTopY,
                    barW,
                    barH,
                    [4, 4, 0, 0],
                  );
                  ctx.fill();
                }

                // 3. 底部のラベル
                ctx.fillStyle = "#94a3b8";
                ctx.font = "700 8.5px sans-serif";
                ctx.textAlign = "center";
                ctx.fillText(distLabels[i], colX + colW / 2, labelY);
              });

              // --------------------------------------------------------
              // ④ 一言分析コメント吹き出し (.t-analysis-comment)
              // --------------------------------------------------------
              const commentY = histY + histH + 12;
              const commentW = boxW;
              const commentH = 50; // 固定高ではなく、少し余裕を持たせた高さ

              // 吹き出し背景の描画
              ctx.fillStyle = "#eef2ff";
              ctx.beginPath();
              ctx.roundRect(boxX, commentY, commentW, commentH, 10);
              ctx.fill();

              // 吹き出しの三角形の尻尾 (上向き)
              ctx.beginPath();
              ctx.moveTo(boxX + commentW / 2 - 6, commentY);
              ctx.lineTo(boxX + commentW / 2 + 6, commentY);
              ctx.lineTo(boxX + commentW / 2, commentY - 5);
              ctx.closePath();
              ctx.fill();

              // コメントテキストの自動折り返し描画（横幅に合わせて安全に改行）
              ctx.fillStyle = "#4338ca";
              ctx.font = '700 9px "Source Han Sans JP", sans-serif';
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";

              const maxWidth = commentW - 24; // 左右の余白
              const words = comment.split("");
              let line = "";
              let lines = [];

              for (let n = 0; n < words.length; n++) {
                let testLine = line + words[n];
                let metrics = ctx.measureText(testLine);
                if (metrics.width > maxWidth && n > 0) {
                  lines.push(line);
                  line = words[n];
                } else {
                  line = testLine;
                }
              }
              lines.push(line);

              // 1行か2行かに応じて、吹き出しの中央に美しく配置するY座標の調整
              const startTextY =
                commentY + commentH / 2 - (lines.length - 1) * 7;
              lines.forEach((txt, idx) => {
                ctx.fillText(txt, boxX + commentW / 2, startTextY + idx * 14);
              });
            }

            // 🚀 2段目・中央のマス (row: 1, col: 1) に「推しキャラクター（推しボール）」を描画（最高峰：サークルパッキング充填版）
            else if (row === 1 && col === 1) {
              const rawOshiList = data.oshiList || [];
              const oshiCount = rawOshiList.length;

              // 1. パネルタイトルと総数の描画
              ctx.fillStyle = cfg.colors.textSub;
              ctx.font = cfg.fonts.panelTitle;
              ctx.textAlign = "left";
              ctx.textBaseline = "top";
              ctx.fillText("見つけた推し", x + 12, y + 12);

              const titleW = ctx.measureText("見つけた推し").width;
              ctx.fillStyle = "#6366f1";
              ctx.font = "800 14px sans-serif";
              ctx.fillText(` ${oshiCount} `, x + 12 + titleW, y + 10);

              const countW = ctx.measureText(` ${oshiCount} `).width;
              ctx.fillStyle = "#334155";
              ctx.font = "700 10px sans-serif";
              ctx.fillText("人", x + 12 + titleW + countW, y + 13);

              if (oshiCount > 0) {
                // 2. 出現確率の重み付け処理（お気に入り/一推しを最優先）
                let weightedList = rawOshiList.map((o) => {
                  const isFav = o.isIchioshi || o.isFavorite;
                  return { ...o, weight: (isFav ? 10.0 : 0.0) + Math.random() };
                });
                // 重い順（お気に入り＝デカい円にしたい順）にソート
                weightedList.sort((a, b) => b.weight - a.weight);

                // --------------------------------------------------------
                // 🚀 【極限密度・サークルパッキング アルゴリズム】
                // --------------------------------------------------------
                const currentWidth =
                  typeof gridColWidth !== "undefined" ? gridColWidth : 330;
                const currentHeight =
                  typeof gridRowHeight !== "undefined" ? gridRowHeight : 240;

                // 描画可能エリアを限界まで広く
                const paddingX = 4;
                const paddingY = 40;
                const minX = x + paddingX;
                const maxX = x + currentWidth - paddingX;
                const minY = y + paddingY;
                const maxY = y + currentHeight - 6; // 底の余白もさらに詰める

                let placedBalls = [];
                // 密度を上げるため、最大挑戦数を 45個に増加！
                const displayCount = Math.min(45, oshiCount);

                for (let i = 0; i < displayCount; i++) {
                  const oshi = weightedList[i];
                  const isMainFav = oshi.isIchioshi || oshi.isFavorite;

                  // 初期サイズ設定（お顔の見えやすさをキープしつつ調整）
                  let maxR = isMainFav ? 54 : 38;
                  let minR = isMainFav ? 38 : 15; // 最小サイズを 15 にして、隙間に滑り込みやすくする

                  const diminishFactor = 1.0 - (i / displayCount) * 0.5;
                  maxR = Math.max(minR, maxR * diminishFactor);

                  let bestX = 0;
                  let bestY = 0;
                  let bestR = 0;

                  // ① 探索数を 300回 に爆上げして、最も綺麗にハマる隙間を執念深く探す
                  const candidateCount = 300;
                  for (let c = 0; c < candidateCount; c++) {
                    const cx = minX + Math.random() * (maxX - minX);
                    const cy = minY + Math.random() * (maxY - minY);

                    let distToWallX = Math.min(cx - minX, maxX - cx);
                    let distToWallY = Math.min(cy - minY, maxY - cy);
                    let allowedR = Math.min(distToWallX, distToWallY);

                    for (let j = 0; j < placedBalls.length; j++) {
                      const other = placedBalls[j];
                      const dx = cx - other.x;
                      const dy = cy - other.y;
                      const dist = Math.sqrt(dx * dx + dy * dy);

                      // 💡 隙間マイナスを消し、完全に「フチが触れ合う」限界まで攻める！
                      const rToOther = dist - other.r;
                      if (rToOther < allowedR) {
                        allowedR = rToOther;
                      }
                    }

                    if (allowedR > maxR) {
                      allowedR = maxR;
                    }

                    if (allowedR > bestR) {
                      bestR = allowedR;
                      bestX = cx;
                      bestY = cy;
                    }
                  }

                  if (bestR >= minR) {
                    placedBalls.push({
                      x: bestX,
                      y: bestY,
                      r: bestR,
                      oshi: oshi,
                    });
                  }
                }

                // 4. 確定した神配置の円たちを一気に描画
                for (let i = 0; i < placedBalls.length; i++) {
                  const ball = placedBalls[i];
                  const oshi = ball.oshi;
                  const ballX = ball.x;
                  const ballY = ball.y;
                  const radius = ball.r;

                  // 影＋白いフチ
                  ctx.save();
                  ctx.shadowColor = "rgba(0, 0, 0, 0.1)";
                  ctx.shadowBlur = 5;
                  ctx.shadowOffsetX = 0;
                  ctx.shadowOffsetY = 2;

                  ctx.fillStyle = "#ffffff";
                  ctx.beginPath();
                  ctx.arc(ballX, ballY, radius, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.restore();

                  // 画像クリップ
                  if (oshi && oshi.img) {
                    const loader =
                      typeof this.loadImage === "function"
                        ? this.loadImage(oshi.img)
                        : typeof StatsExporter.loadImage === "function"
                          ? StatsExporter.loadImage(oshi.img)
                          : null;

                    if (loader) {
                      const p = loader.then((imgObj) => {
                        if (imgObj) {
                          ctx.save();
                          ctx.beginPath();
                          ctx.arc(ballX, ballY, radius - 2.5, 0, Math.PI * 2);
                          ctx.clip();

                          const imgW = imgObj.width;
                          const imgH = imgObj.height;
                          const size = radius * 2 - 5.0;

                          let dx, dy, dW, dH;
                          if (imgW > imgH) {
                            dH = size;
                            dW = (imgW / imgH) * size;
                            dx = ballX - dW / 2;
                            dy = ballY - radius + 2.5;
                          } else {
                            dW = size;
                            dH = (imgH / imgW) * size;
                            dx = ballX - radius + 2.5;
                            dy = ballY - dH / 2;
                          }

                          ctx.drawImage(imgObj, dx, dy, dW, dH);
                          ctx.restore();
                        }
                      });
                      imagePromises.push(p);
                    }
                  }
                }
              }
            }

            // 📈 2段目・右側のマス (row: 1, col: 2) に「視聴年代ヒストリー」を描画（最古・最新完全復旧版）
            else if (row === 1 && col === 2) {
              let dbYears = [];
              const animeSrcList = data.historyAnimeList || [];

              if (animeSrcList.length > 0) {
                animeSrcList.forEach((a) => {
                  const yVal = parseInt(a.year);
                  if (
                    !isNaN(yVal) &&
                    yVal > 1950 &&
                    yVal <= new Date().getFullYear() + 2
                  ) {
                    if (
                      a.watch_status === "履修済" ||
                      a.watch_status === "履修中"
                    ) {
                      dbYears.push(yVal);
                    }
                  }
                });
              }

              const oldestYear =
                dbYears.length > 0 ? Math.min(...dbYears) : 2000;
              const newestYear =
                dbYears.length > 0
                  ? Math.max(...dbYears)
                  : new Date().getFullYear();

              const yearData = {};
              for (let yVal = oldestYear; yVal <= newestYear; yVal++) {
                yearData[yVal] = { count: 0, scoreSum: 0, scoreCount: 0 };
              }

              let showaCount = 0;
              let heiseiCount = 0;
              let reiwaCount = 0;

              animeSrcList.forEach((a) => {
                const yVal = parseInt(a.year);
                if (isNaN(yVal) || yVal < oldestYear || yVal > newestYear)
                  return;

                if (
                  a.watch_status === "履修済" ||
                  a.watch_status === "履修中"
                ) {
                  yearData[yVal].count++;

                  if (yVal <= 1988) showaCount++;
                  else if (yVal <= 2018) heiseiCount++;
                  else reiwaCount++;

                  const score = parseFloat(a.my_score || 0);
                  if (score >= 0.1) {
                    yearData[yVal].scoreSum += score;
                    yearData[yVal].scoreCount++;
                  }
                }
              });

              let maxCount = 0;
              let maxAvgScore = 0;
              const yearsArray = [];

              for (let yVal = oldestYear; yVal <= newestYear; yVal++) {
                const d = yearData[yVal];
                if (d.count > maxCount) maxCount = d.count;
                const avg = d.scoreCount > 0 ? d.scoreSum / d.scoreCount : 0;
                if (avg > maxAvgScore && d.scoreCount >= 1) maxAvgScore = avg;
                yearsArray.push({ year: yVal, count: d.count });
              }

              let maxCountYears = [];
              let maxAvgScoreYears = [];
              for (let yVal = oldestYear; yVal <= newestYear; yVal++) {
                const d = yearData[yVal];
                const avg = d.scoreCount > 0 ? d.scoreSum / d.scoreCount : 0;
                if (d.count === maxCount && maxCount > 0)
                  maxCountYears.push(yVal);
                if (
                  Math.abs(avg - maxAvgScore) < 0.0001 &&
                  maxAvgScore > 0 &&
                  d.scoreCount >= 1
                ) {
                  maxAvgScoreYears.push(yVal);
                }
              }

              if (maxAvgScoreYears.length > 3)
                maxAvgScoreYears = maxAvgScoreYears.slice(0, 3);
              if (maxCountYears.length > 3)
                maxCountYears = maxCountYears.slice(0, 3);

              let eraTitle = "アニメマニア";
              if (showaCount > heiseiCount && showaCount > reiwaCount)
                eraTitle = "懐かし昭和アニメファン";
              else if (heiseiCount > showaCount && heiseiCount > reiwaCount)
                eraTitle = "黄金期平成アニメファン";
              else if (reiwaCount > showaCount && reiwaCount > heiseiCount)
                eraTitle = "最新令和アニメファン";

              // --------------------------------------------------------
              // 🎨 1. タイトル部分
              // --------------------------------------------------------
              ctx.fillStyle = cfg.colors.textSub;
              ctx.font = cfg.fonts.panelTitle;
              ctx.textAlign = "left";
              ctx.textBaseline = "top";
              ctx.fillText("視聴年代ヒストリー", x + 12, y + 12);

              // --------------------------------------------------------
              // 🎨 2. 折れ線グラフセクション
              // --------------------------------------------------------
              const graphPaddingL = 22;
              const graphPaddingR = 12;
              const graphPaddingT = 36;
              const graphH = 80;
              const graphW = gridColWidth - graphPaddingL - graphPaddingR;

              const maxAxisVal = maxCount > 0 ? maxCount : 1;

              // Y軸目盛り＆点線
              ctx.font = "500 9px sans-serif";
              ctx.fillStyle = "#64748b";
              ctx.textAlign = "right";
              ctx.textBaseline = "middle";

              for (let i = 0; i <= 3; i++) {
                const val = Math.round(maxAxisVal * (i / 3));
                const yPos = y + graphPaddingT + graphH - graphH * (i / 3);
                ctx.fillText(val.toString(), x + graphPaddingL - 5, yPos);

                ctx.save();
                ctx.strokeStyle = "#f1f5f9";
                ctx.lineWidth = 1;
                ctx.setLineDash([3, 3]);
                ctx.beginPath();
                ctx.moveTo(x + graphPaddingL, yPos);
                ctx.lineTo(x + gridColWidth - graphPaddingR, yPos);
                ctx.stroke();
                ctx.restore();
              }

              // X軸目盛り（年代）
              ctx.textAlign = "center";
              ctx.textBaseline = "top";
              const startDecade = Math.ceil(oldestYear / 10) * 10;
              const totalYearsRange = newestYear - oldestYear;

              for (let dec = startDecade; dec <= newestYear; dec += 10) {
                const ratio = (dec - oldestYear) / (totalYearsRange || 1);
                const xPos = x + graphPaddingL + ratio * graphW;

                ctx.strokeStyle = "#cbd5e1";
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(xPos, y + graphPaddingT + graphH);
                ctx.lineTo(xPos, y + graphPaddingT + graphH + 4);
                ctx.stroke();

                ctx.fillText(
                  dec.toString(),
                  xPos,
                  y + graphPaddingT + graphH + 6,
                );
              }

              // 折れ線描画
              let graphPoints = [];
              if (yearsArray.length > 1) {
                yearsArray.forEach((item, index) => {
                  const ratio = index / (yearsArray.length - 1);
                  const px = x + graphPaddingL + ratio * graphW;
                  const py =
                    y +
                    graphPaddingT +
                    graphH -
                    (item.count / maxAxisVal) * graphH;
                  graphPoints.push({ x: px, y: py });
                });
              }

              if (graphPoints.length > 0) {
                ctx.save();
                ctx.lineCap = "round";
                ctx.lineJoin = "round";

                ctx.strokeStyle = "rgba(255, 46, 99, 0.18)";
                ctx.lineWidth = 6;
                ctx.beginPath();
                ctx.moveTo(graphPoints[0].x, graphPoints[0].y);
                for (let i = 1; i < graphPoints.length; i++)
                  ctx.lineTo(graphPoints[i].x, graphPoints[i].y);
                ctx.stroke();

                ctx.strokeStyle = "#ff2e63";
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(graphPoints[0].x, graphPoints[0].y);
                for (let i = 1; i < graphPoints.length; i++)
                  ctx.lineTo(graphPoints[i].x, graphPoints[i].y);
                ctx.stroke();
                ctx.restore();
              }

              // --------------------------------------------------------
              // 🎨 3. スタッツ配置計算（元の正確な幅を維持して縦に伸ばす）
              // --------------------------------------------------------
              const mainColor = "#6366f1"; // 指定の可愛いブルー
              const boxW = (gridColWidth - 24 - 10) / 2; // 正しい元の横幅
              const startStatsY = y + graphPaddingT + graphH + 20; // 元の開始基準位置

              // ── 3段目：【底辺に完全固定】称号バッジ ──
              const box3H = 26;
              const box3Y = y + gridRowHeight - box3H - 12; // 下マージン12pxで固定
              const honorW = gridColWidth - 48;

              // ── 1段目：最古・最新作品のタイムライン（提示されたあってるコードを完全再現） ──
              const box1Y = startStatsY;
              const box1H = 26;

              ctx.fillStyle = "#ffffff";
              ctx.strokeStyle = "#e2e8f0";
              ctx.lineWidth = 1;
              ctx.textAlign = "center";
              ctx.textBaseline = "top";

              // 左：最古
              ctx.beginPath();
              ctx.roundRect(x + 12, box1Y, boxW, box1H, 8);
              ctx.fill();
              ctx.stroke();

              ctx.font = "700 9px sans-serif";
              ctx.fillStyle = "#94a3b8";
              ctx.fillText("最古", x + 12 + 18, box1Y + 9);
              ctx.font = "800 11px sans-serif";
              ctx.fillStyle = "#334155";
              ctx.fillText(`${oldestYear}`, x + 12 + boxW - 25, box1Y + 8);

              // 矢印線
              ctx.strokeStyle = "#cbd5e1";
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(x + 12 + boxW + 2, box1Y + box1H / 2);
              ctx.lineTo(x + 12 + boxW + 8, box1Y + box1H / 2);
              ctx.stroke();

              // --------------------------------------------------------
              // 👉 右：最新の枠とテキスト（真っ黒バグ対策版）
              // --------------------------------------------------------
              ctx.beginPath(); // パスを新しく開始

              // 🌟 ココ！右側を描く直前で、色と線の太さを100%確実に再セットします
              ctx.fillStyle = "#ffffff"; // 背景を白にリセット
              ctx.strokeStyle = "#e2e8f0"; // 枠線を淡いグレーにリセット
              ctx.lineWidth = 1; // 線の太さを1pxにリセット

              ctx.roundRect(x + 12 + boxW + 10, box1Y, boxW, box1H, 8);
              ctx.fill(); // これで中が真っ白に塗られます
              ctx.stroke(); // これで綺麗な1pxの枠線が引かれます

              ctx.font = "700 9px sans-serif";
              ctx.fillStyle = "#94a3b8";
              ctx.fillText("最新", x + 12 + boxW + 10 + 18, box1Y + 9);

              // 最新の年号
              ctx.font = "800 11px sans-serif";
              ctx.fillStyle = "#334155";
              ctx.fillText(
                `${newestYear}`,
                x + 12 + boxW + 10 + boxW - 25,
                box1Y + 8,
              );

              // ── 2段目：【縦のばし仕様】最高平均点年 ＆ 最多視聴年 ──
              const box2Y = box1Y + box1H + 8; // タイムラインの下からスタート
              const box2H = box3Y - box2Y - 10; // 3段目バッジの上ギリギリまでフルに引き伸ばし

              // 枠の描画
              ctx.fillStyle = "#ffffff";
              ctx.strokeStyle = "#e2e8f0";
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.roundRect(x + 12, box2Y, boxW, box2H, 10);
              ctx.fill();
              ctx.stroke();
              ctx.beginPath();
              ctx.roundRect(x + 12 + boxW + 10, box2Y, boxW, box2H, 10);
              ctx.fill();
              ctx.stroke();

              // 📝 左側：最高平均点イヤー（複数年縦並び対応）
              ctx.font = "700 9px sans-serif";
              ctx.fillStyle = "#94a3b8";
              ctx.fillText("最高平均点年", x + 12 + boxW / 2, box2Y + 6);

              ctx.font = "700 9px sans-serif";
              ctx.fillStyle = "#64748b";
              ctx.fillText(
                `平均 ${maxAvgScore.toFixed(1)}`,
                x + 12 + boxW / 2,
                box2Y + box2H - 12,
              );

              const textAreaTop = box2Y + 16;
              const textAreaBottom = box2Y + box2H - 14;
              const textAreaCenter = (textAreaTop + textAreaBottom) / 2;

              ctx.font = "800 12px sans-serif";
              ctx.fillStyle = mainColor;
              ctx.textBaseline = "middle";

              if (maxAvgScoreYears.length === 1) {
                ctx.fillText(
                  `${maxAvgScoreYears[0]}`,
                  x + 12 + boxW / 2,
                  textAreaCenter,
                );
              } else {
                const totalH = (maxAvgScoreYears.length - 1) * 18;
                const startY = textAreaCenter - totalH / 2;
                maxAvgScoreYears.forEach((year, idx) => {
                  ctx.fillText(`${year}`, x + 12 + boxW / 2, startY + idx * 18);
                });
              }

              // 📝 右側：最多視聴イヤー（複数年縦並び対応）
              ctx.textBaseline = "top";
              ctx.font = "700 9px sans-serif";
              ctx.fillStyle = "#94a3b8";
              ctx.fillText(
                "最多視聴年",
                x + 12 + boxW + 10 + boxW / 2,
                box2Y + 6,
              );

              ctx.font = "700 9px sans-serif";
              ctx.fillStyle = "#64748b";
              ctx.fillText(
                `${maxCount} 作品マーク`,
                x + 12 + boxW + 10 + boxW / 2,
                box2Y + box2H - 12,
              );

              ctx.font = "800 12px sans-serif";
              ctx.fillStyle = mainColor;
              ctx.textBaseline = "middle";

              if (maxCountYears.length === 1) {
                ctx.fillText(
                  `${maxCountYears[0]}年`,
                  x + 12 + boxW + 10 + boxW / 2,
                  textAreaCenter,
                );
              } else {
                const totalH = (maxCountYears.length - 1) * 18;
                const startY = textAreaCenter - totalH / 2;
                maxCountYears.forEach((year, idx) => {
                  ctx.fillText(
                    `${year}`,
                    x + 12 + boxW + 10 + boxW / 2,
                    startY + idx * 18,
                  );
                });
              }

              // ── 3段目：称号リボン風バッジ（固定配置） ──
              ctx.textBaseline = "top";
              ctx.fillStyle = "#ffffff";
              ctx.strokeStyle = mainColor;
              ctx.lineWidth = 1.3;
              ctx.beginPath();
              ctx.roundRect(
                x + (gridColWidth - honorW) / 2,
                box3Y,
                honorW,
                box3H,
                13,
              );
              ctx.fill();
              ctx.stroke();

              ctx.font = "800 11px sans-serif";
              ctx.fillStyle = mainColor;
              ctx.fillText(eraTitle, x + gridColWidth / 2, box3Y + 8);
            }

            // 🔍 他の空きマス用の開発デバッグテキスト
            else {
              ctx.fillStyle = "#94a3b8";
              ctx.font = "600 10px sans-serif";
              ctx.fillText(
                `中央マス [行${row + 1}, 列${col + 1}]`,
                x + 16,
                y + 16,
              );
            }
          }
        }

        // ==========================================
        // 🧱 パネル3：最高のクリエイター陣
        // ==========================================
        // ⬅️ 中央マスが縦に伸びたので、開始Y座標を大幅に下げる
        const staffY = gridStartY + gridRowHeight * 2 + gridGap + 20; // 計算すると 1029 あたり
        const staffH = 220;
        ctx.fillStyle = cfg.colors.panelBg;
        ctx.beginPath();
        ctx.roundRect(24, staffY, 732, staffH, 16);
        ctx.fill();
        ctx.strokeStyle = cfg.colors.panelBorder;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = cfg.colors.textMain;
        ctx.font = cfg.fonts.panelTitle;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText("最高のクリエイター陣", 24 + 16, staffY + 16);

        const colW = (732 - 32 - 24) / 3; // 各カラムの横幅
        const categories = [
          { title: "制作会社", list: data.staff?.studios || [] },
          { title: "声優", list: data.staff?.actors || [] },
          { title: "監督", list: data.staff?.directors || [] },
        ];

        categories.forEach((cat, colIdx) => {
          const colX = 24 + 16 + colIdx * (colW + 12);

          // 📁 カラムタイトル（制作会社、声優、監督）の描画
          ctx.fillStyle = cfg.colors.textSub;
          ctx.font = cfg.fonts.baseJp;
          ctx.fillText(cat.title, colX, staffY + 45);

          let itemY = staffY + 70;

          if (cat.list && cat.list.length > 0) {
            cat.list.forEach((item) => {
              // 1. ランキングの「#」マークを青紫で描画
              ctx.fillStyle = cfg.colors.accentBlue;
              ctx.font = "800 12px sans-serif";
              ctx.fillText("#", colX, itemY - 1);
              const hashW = ctx.measureText("# ").width;

              // 2. 名前の描画（枠をはみ出る場合は自動で「...」に省略）
              ctx.fillStyle = cfg.colors.textMain;
              ctx.font = cfg.fonts.baseJpBold;
              let nameText = item.name || "";
              let maxNameW = colW - hashW - 45; // 右端の数値と被らないように幅を調整
              if (ctx.measureText(nameText).width > maxNameW) {
                while (ctx.measureText(nameText + "...").width > maxNameW) {
                  nameText = nameText.slice(0, -1);
                }
                nameText += "...";
              }
              ctx.fillText(nameText, colX + hashW, itemY);

              // 3. 右端に作品数を綺麗に描画（生データの count を参照）
              ctx.fillStyle = cfg.colors.textSub;
              ctx.font = "800 12px sans-serif";
              ctx.textAlign = "right";

              const countVal = item.count || item.score || "0";
              ctx.fillText(`${countVal} 作品`, colX + colW, itemY);
              ctx.textAlign = "left"; // 描画後はテキスト基準を左に戻す（お約束）

              itemY += 28; // 次の行へ改行
            });
          } else {
            // 万が一データが1件もない場合の表示
            ctx.fillStyle = cfg.colors.textSub;
            ctx.font = cfg.fonts.baseJp;
            ctx.fillText("データなし", colX, itemY);
          }
        });

        // ==========================================
        // 4️⃣ フッター・ウォーターマーク＆作成日時（アップデート版）
        // ==========================================
        ctx.fillStyle = cfg.colors.watermark;
        ctx.font = cfg.fonts.watermark;
        ctx.textBaseline = "middle";

        // 📅 ① 左側に「作成日時」を自動生成して配置
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, "0");
        const dd = String(now.getDate()).padStart(2, "0");
        const dateString = `CREATED: ${yyyy}.${mm}.${dd}`;

        ctx.textAlign = "left";
        ctx.fillText(dateString, 24, cfg.height - 35); // 左端（パディング24px）に固定

        // 🏷️ ② 中央〜右側に元のウォーターマークを配置
        // (左の日付と被らないよう、やや右に寄せるか、完全に右端 or 中央のままで調整)
        ctx.textAlign = "right";
        ctx.fillText(
          "OTAKU LOG - ANIME INSIGHTS REPORT",
          cfg.width - 24, // 右端（パディング24px）に綺麗に収めます
          cfg.height - 35,
        );

        // 🚀 画像の読み込みがすべて終わるのをその場で待ってから出力！
        Promise.all(imagePromises)
          .then(() => {
            const imgData = canvas.toDataURL("image/png", 1.0);
            resolve(imgData);
          })
          .catch((err) => {
            reject(err);
          });
      } catch (error) {
        reject(error);
      }
    });
  },
};
