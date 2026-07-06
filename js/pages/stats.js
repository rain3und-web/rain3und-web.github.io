// =========================================================
// 📊 js/pages/stats.js：分析エンジン・統計ページ（スプシ完全対応版）
// =========================================================
// 💡 名前を綺麗にする専用の「お掃除マシーン」を作る
function cleanText(str) {
  if (!str) return "";
  return str
    .replace(/[\r\n]/g, "")
    .trim()
    .replace(/\[[^\]]*\]/g, "");
}

// 💡 2つ目のランキング並び替えマシーン（新しくここに追加！）
function getTopRankings(statsObj, limit = 5) {
  return Object.entries(statsObj)
    .map(([k, v]) => ({ name: k, count: v })) // { name: "名前", count: 数字 } の形にする
    .sort((a, b) => b.count - a.count) // 数の多い順に並び替える
    .slice(0, limit); // 上位5件（limit個）だけを切り取る
}

// 💡 3つ目の「推しキャラクター集計マシーン」（新しくここに追加！）
function extractOshiCharacters(charactersData, oshiList) {
  if (!charactersData) return false; // データがなければ「推し作品ではない(false)」

  try {
    // 文字列だったらJSONとして読み込み、配列だったらそのまま使う
    const chars =
      typeof charactersData === "string"
        ? JSON.parse(charactersData)
        : charactersData;

    if (Array.isArray(chars)) {
      let hasOshi = false;
      chars.forEach((c) => {
        if (c.isOshi) {
          oshiList.push(c); // 外側の推しリストに追加する
          hasOshi = true; // この作品に推しがいたよ、という目印
        }
      });
      return hasOshi; // 推しがいたら true、いなかったら false を返す
    }
  } catch (e) {
    console.error("Statsキャラ集計エラー:", e);
  }
  return false;
}

// 💡 4つ目の「ジャンル＆組み合わせ集計マシーン」（新しくここに追加！）
function countGenresAndPairs(genresJp, genreCounts, genrePairs) {
  if (!genresJp) return;

  // カンマで区切って、前後のスペースを消して、空っぽの文字を除外して配列にする
  const gList = genresJp
    .split(",")
    .map((g) => g.trim())
    .filter(Boolean);

  // 単体のジャンルをカウント
  gList.forEach((g) => (genreCounts[g] = (genreCounts[g] || 0) + 1));

  // ジャンルの組み合わせ（2重ループ）をここでひっそり処理する
  for (let i = 0; i < gList.length; i++) {
    for (let j = i + 1; j < gList.length; j++) {
      const pair = [gList[i], gList[j]].sort().join(" × ");
      genrePairs[pair] = (genrePairs[pair] || 0) + 1;
    }
  }
}

// 💡 5つ目の「オタクタイプ判定マシーン」（バグ修正版！）
function analyzeOtakuTendency(scoresList, avgScoreNum) {
  // 📚 日本語のキーワードをしっかり "" で囲むように修正しました！
  const tendencyDictionary = {
    始まりの冒険者:
      "まだ見ぬ名作たちとの出会いを待つ旅人。これからどんな素晴らしい作品と出会うのか、ワクワクが詰まった冒険の始まりです！",
    偏愛エキスパート:
      "刺さる作品には人生を捧げ、合わない作品には容赦なし！好みが極端にハッキリ分かれるタイプ。",
    隠れ熱狂のツンデレ:
      "普段の採点は厳しめですが、本物の「神作」に出会った瞬間にだけ全てを捧げます。",
    全肯定の神:
      "愛に溢れた無限の包容力の持ち主！すべてのアニメの美しい部分や輝きを見つける天才です。",
    絶望のリアリスト:
      "妥協を一切許さない超・厳格オタク。あなたを唸らせる作品は歴史的名作のみです。",
    ストイックレビュアー:
      "確固たる自分の基準を持つ厳格なオタク。真の良作しか認めない緊張感があります。",
    王道ポジティブ:
      "作品を前向きに楽しむ傾向があり、好きな作品に多く出会えている幸福な視聴者です。",
    精密なるバランサー:
      "スコアのブレが非常に少ない慎重派。大崩れも大爆発もしない、極めて安定的で客観的な視点。",
    加点主義ロマンチスト:
      "作品の欠点には目を瞑り、加点要素を拾い集めるタイプ。減点しない優しい世界を生きています。",
    完璧主義の批評家:
      "全体的に質は高く評価するものの、満点へのハードルが非常に高い。傑作への道のりは険しい。",
    マイベスト発掘家:
      "自分の好みを理解しており、お気に入りの作品を定期的に引き当てるオタ活コスパが高いタイプ。",
    辛口スパイス探求者:
      "平均点は普通ですが、地雷を踏むことも恐れず色々な作品に手を出すチャレンジャーです。",
    良作ソムリエ:
      "作品をフラットに楽しみつつ、大ハズレを引かずに良作を安定して引き当てる目利きです。",
  };

  let tendency = "始まりの冒険者"; // 初期値
  const actualScoredCount = scoresList.length;

  if (actualScoredCount > 0) {
    const maxScore = Math.max(...scoresList);
    const highCount = scoresList.filter((s) => s >= 4.3).length;
    const lowCount = scoresList.filter((s) => s <= 2.8).length;
    const highRatio = highCount / actualScoredCount;
    const lowRatio = lowCount / actualScoredCount;

    const variance =
      scoresList.reduce((acc, s) => acc + Math.pow(s - avgScoreNum, 2), 0) /
      actualScoredCount;
    const stdDev = Math.sqrt(variance);

    if (stdDev >= 0.55) tendency = "偏愛エキスパート";
    else if (avgScoreNum <= 3.6 && maxScore >= 4.5 && highRatio <= 0.15)
      tendency = "隠れ熱狂のツンデレ";
    else if (avgScoreNum >= 4.3) tendency = "全肯定の神";
    else if (avgScoreNum <= 2.9) tendency = "絶望のリアリスト";
    else if (avgScoreNum <= 3.3) tendency = "ストイックレビュアー";
    else if (avgScoreNum >= 4.0) tendency = "王道ポジティブ";
    else if (stdDev <= 0.25) tendency = "精密なるバランサー";
    else if (lowCount === 0 && highRatio >= 0.2)
      tendency = "加点主義ロマンチスト";
    else if (maxScore < 4.2) tendency = "完璧主義の批評家";
    else if (highRatio >= 0.2) tendency = "マイベスト発掘家";
    else if (lowRatio >= 0.15) tendency = "辛口スパイス探求者";
    else tendency = "良作ソムリエ";
  }

  return {
    tendency: tendency,
    tendDesc: tendencyDictionary[tendency] || "",
  };
}

// 💡 6つ目の「紹介文テキスト作成マシーン」（今度こそ完璧版）
function generateReportTexts(topActors, topDirectors, topDecade) {
  const topActor1 = topActors.length > 0 ? topActors[0].name : "";
  const topActor2 = topActors.length > 1 ? topActors[1].name : "";
  let actorText = `様々な声優さんの演技を楽しんでいるようです。`;

  if (topActor2) {
    actorText = `声優では <span class="report-highlight">${topActor1}</span> さんや <span class="report-highlight">${topActor2}</span> さんが出演する作品が、あなたの評価上位に多くランクインしています。`;
  } else if (topActor1) {
    actorText = `声優では <span class="report-highlight">${topActor1}</span> さんが出演する作品が評価上位に多くランクインしています。`;
  }

  const topDirObj = topDirectors.length > 0 ? topDirectors[0] : null;
  const directorText = topDirObj
    ? `監督では、<span class="report-highlight">${topDirObj.name}</span> 監督の作品が上位に最も多く、他の作品も探してみると新たな名作に出会えるかもしれません。`
    : "";

  const decadeText = topDecade
    ? `また、<span class="report-highlight">${topDecade}年代</span> のアニメを最もよく視聴しているようです。`
    : "";

  return { actorText, directorText, decadeText };
}

// 💡 7つ目の「画面＆画像テキスト一発生成マシーン」（新しくここに追加！）
function buildReportTokens(data) {
  const {
    userName,
    hours,
    mins,
    totalAnime,
    topGenreName,
    topPairStr,
    topDecade,
    topActor1,
    topActor2,
    topDirObj,
    tendency,
    tendDesc,
    oshiCount,
  } = data;
  const tokens = [];

  tokens.push({ text: userName, type: "highlight" });
  tokens.push({ text: " さんはこれまでに約 " });
  tokens.push({ text: hours, type: "highlight" });
  tokens.push({ text: " 時間 " });
  tokens.push({ text: mins, type: "highlight" });
  tokens.push({ text: " 分をアニメに費やし、" });
  tokens.push({ text: totalAnime, type: "highlight" });
  tokens.push({
    text: " 本の作品を視聴してきました。\n深層データによると、特に ",
  });
  tokens.push({ text: topGenreName, type: "highlight" });
  tokens.push({ text: " ジャンルへの適性が極めて高く、中でも " });
  tokens.push({ text: topPairStr, type: "highlight" });
  tokens.push({
    text: " の要素が組み合わさった作品につい心を奪われがちなようです。\n",
  });

  if (topDecade) {
    tokens.push({ text: "また、" });
    tokens.push({ text: topDecade + "年代", type: "highlight" });
    tokens.push({ text: " のアニメを最もよく視聴しているようです。 " });
  }

  if (topActor2) {
    tokens.push({ text: "声優では " });
    tokens.push({ text: topActor1, type: "highlight" });
    tokens.push({ text: " さんや " });
    tokens.push({ text: topActor2, type: "highlight" });
    tokens.push({
      text: " さんが出演する作品が、あなたの評価上位に多くランクインしています。 ",
    });
  } else if (topActor1) {
    tokens.push({ text: "声優では " });
    tokens.push({ text: topActor1, type: "highlight" });
    tokens.push({
      text: " さんが出演する作品が評価上位に多くランクインしています。 ",
    });
  } else {
    tokens.push({ text: "様々な声優さんの演技を楽しんでいるようです。 " });
  }

  if (topDirObj) {
    tokens.push({ text: "監督では、" });
    tokens.push({ text: topDirObj.name, type: "highlight" });
    tokens.push({
      text: " 監督の作品が上位に最も多く、他の作品も探してみると新たな名作に出会えるかもしれません。\n",
    });
  } else {
    tokens.push({ text: "\n" });
  }

  tokens.push({ text: "評価傾向は「" });
  tokens.push({ text: tendency, type: "highlight" });
  tokens.push({ text: "」。" + tendDesc + "\n見つけた「推し」の数は現在 " });
  tokens.push({ text: String(oshiCount), type: "highlight" });
  tokens.push({
    text: " 人。これからも素敵な作品とキャラクターに出会えることを祈っています！",
  });

  return tokens;
}

// 💡 8つ目の「高評価カード作成マシーン」（安全版）
function createMasterpieceCardHtml(anime, index) {
  const rank = index + 1;
  const rankClass = rank <= 3 ? `rank-${rank}` : "rank-other";
  const score = parseFloat(anime.my_score || 0).toFixed(1);

  return `
    <div class="master-item pop-up-animation" data-id="${anime.anilist_id}" onclick="if(window.openEditModal) window.openEditModal(this.dataset.id)">
      <div class="master-rank ${rankClass}">${rank}</div>
      <img src="${anime.cover_url}" class="master-cover">
      <div class="master-info">
        <div class="master-title">${anime.title}</div>
        <div class="master-score-badge">
          <span class="star-icon">★</span>
          <span class="rank-score-num">${score}</span>
        </div>
      </div>
    </div>`;
}

// 💡 9つ目の「視聴スタイルパネル作成マシーン」（新しく追加！）
function createStylePanelHtml(data) {
  const {
    totalAnime,
    totalDBLength,
    compRate,
    totalH,
    totalM,
    backlogCount,
    formatCounts,
  } = data;

  // 1. 安全ガード：辞書の設定
  const currentFormatMap =
    typeof formatMap !== "undefined"
      ? formatMap
      : {
          TV: "TV",
          TV_SHORT: "ショート",
          MOVIE: "映画",
          OVA: "OVA",
          ONA: "ONA",
          SPECIAL: "スペシャル",
        };

  // 2. 形式を多い順にソートして上位6件を計算
  const topFormats = Object.entries(formatCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const maxCount = topFormats.length > 0 ? topFormats[0][1] : 1;

  // 3. 各メディアのバー（HTML）を組み立て
  const formatHtml = topFormats
    .map(([rawFormat, count]) => {
      const displayFormatName = currentFormatMap[rawFormat] || rawFormat;
      const barWidth = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;

      return `
      <div class="s-media-row">
        <div class="s-media-left">
          <div class="s-media-name" style="display: flex; align-items: center; gap: 6px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="#6366F1" stroke-width="2.5"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/></svg> 
            ${displayFormatName}
          </div>
        </div>
        <div class="s-media-bar">
          <div class="s-media-fill" style="width: ${barWidth}%;"></div>
        </div>
        <div class="s-media-pct" style="width: 45px;">${count}本</div>
      </div>`;
    })
    .join("");

  // 4. パネル全体のHTMLを返す
  return `
    <div class="p-inner">
      <div class="s-comp-row">
        <div class="s-comp-l">
          <span class="s-comp-hl">${totalAnime}</span>
          <span class="s-comp-base">/ ${totalDBLength} 作品視聴済み</span>
        </div>
        <div class="s-comp-r">
          <span class="s-comp-pct">${compRate}%</span>
          <div class="s-comp-chk"><svg viewBox="0 0 24 24" fill="none"><polyline points="20 6 9 17 4 12"/></svg></div>
        </div>
      </div>
      
      <div class="s-comp-bar"><div class="s-comp-fill" style="width: ${compRate}%;"></div></div>
      
      <div class="s-total-time-wrap">
        <div class="s-time-label">総視聴時間</div>
        <div class="s-time-badges">
          <div class="s-time-badge"><span class="s-time-num">${totalH}</span><span class="s-time-unit">h</span></div>
          <div class="s-time-badge"><span class="s-time-num">${totalM}</span><span class="s-time-unit">m</span></div>
        </div>
      </div>
      
      <button class="s-backlog-btn" onclick="goToHomeUnwatched()">
        <div class="s-backlog-left">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
          <span class="s-backlog-title">積みアニメ</span>
        </div>
        <div class="s-backlog-right">
          <span class="s-backlog-count">${backlogCount}<span class="s-backlog-unit">本</span></span>
          <svg class="s-backlog-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </div>
      </button>
      
      <div class="s-media-rows">${formatHtml}</div>
    </div>`;
}

// 💡 積みアニメボタンを押したときの処理（関数を外側に引越しして整列！）
window.goToHomeUnwatched = function () {
  const statsArea = document.getElementById("statsPageArea");
  if (statsArea) statsArea.classList.remove("slide-down");
  if (typeof window.applyFilter === "function") {
    window.applyFilter("watch_status", "積みアニメ", true);
  }
};

// 💡 10つ目の「ドーナツグラフ描画マシーン」（ここへ丸ごと引越し！）
window.renderGenreDonut = function (genreData, rawWorksData) {
  const chartContainer = document.getElementById("genreDonutContainer");
  const legendContainer = document.getElementById("genreDonutLegend");
  if (!chartContainer) return;

  if (!genreData || genreData.length === 0) {
    chartContainer.innerHTML = "";
    if (legendContainer) legendContainer.innerHTML = "";
    return;
  }

  chartContainer.style.position = "relative";
  chartContainer.style.marginBottom = "0px";

  const pseudoTotal = genreData.reduce((sum, item) => sum + item.count, 0);

  const genreColorMap = {
    アクション: "#EF4444",
    アドベンチャー: "#F97316",
    スポーツ: "#FB923C",
    ロマンス: "#EC4899",
    ドラマ: "#F43F5E",
    お色気: "#F472B6",
    日常: "#EAB308",
    コメディ: "#84CC16",
    音楽: "#10B981",
    ファンタジー: "#0D9488",
    超能力: "#06B6D4",
    SF: "#2563EB",
    魔法少女: "#D946EF",
    ミステリー: "#8B5CF6",
    サイコ: "#6366F1",
    ホラー: "#4338CA",
    スリラー: "#991B1B",
    メカ: "#475569",
  };

  const fallbackColors = [
    "#14B8A6",
    "#F59E0B",
    "#6366F1",
    "#EC4899",
    "#A855F7",
  ];

  const cx = 150;
  const cy = 150;
  const radius = 90;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;

  const labels = genreData.map((item, index) => {
    const fraction = item.count / pseudoTotal;
    const midAngle =
      -Math.PI / 2 + (cumulativePercent + fraction / 2) * Math.PI * 2;
    const isRight = Math.cos(midAngle) >= 0;
    cumulativePercent += fraction;
    return {
      item,
      index,
      fraction,
      midAngle,
      isRight,
      y2: cy + 125 * Math.sin(midAngle),
    };
  });

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
        if (diff < 20) {
          const overlap = 20 - diff;
          side[i].y2 -= overlap / 2;
          side[i + 1].y2 += overlap / 2;
        }
      }
    }
  });

  let segmentsHTML = "";
  let linesHTML = "";
  let textsHTML = "";
  cumulativePercent = 0;

  labels.forEach((label) => {
    const { item, index, fraction, midAngle, isRight, y2 } = label;
    const drawLength = Math.max(0, fraction * circumference - 2);
    const offset = -(cumulativePercent * circumference);
    const color =
      genreColorMap[item.name] || fallbackColors[index % fallbackColors.length];
    const clickAction = `event.stopPropagation(); window.applyFilter('genre', '${item.name}', true)`;

    segmentsHTML += `
    <circle cx="${cx}" cy="${cy}" r="${radius}" fill="transparent" stroke="${color}"
      stroke-dasharray="${drawLength} ${circumference}" stroke-dashoffset="${offset}"
      class="donut-segment" data-count="${item.count}" data-color="${color}"
      style="--neon-color: ${color}80;" onclick="${clickAction}"></circle>`;

    const x1 = cx + 110 * Math.cos(midAngle);
    const y1 = cy + 110 * Math.sin(midAngle);
    const x2 = cx + 122 * Math.cos(midAngle);
    const x3 = isRight ? 285 : 15;
    const textX = isRight ? 290 : 10;
    const textAnchor = isRight ? "start" : "end";

    linesHTML += `<polyline points="${x1},${y1} ${x2},${y2} ${x3},${y2}" fill="none" stroke="${color}" stroke-width="1.2" opacity="0.5" stroke-linejoin="round" style="pointer-events: none;" />`;
    textsHTML += `<text x="${textX}" y="${y2 + 4}" fill="${color}" text-anchor="${textAnchor}" font-size="14" font-weight="900" class="donut-side-text" style="pointer-events: none;">${item.name}</text>`;

    cumulativePercent += fraction;
  });

  chartContainer.innerHTML = `
  <svg viewBox="0 0 300 300" class="cute-donut-svg" id="interactiveDonutSvg">
    <g transform="rotate(-90 ${cx} ${cy})">
      <circle cx="${cx}" cy="${cy}" r="${radius}" fill="transparent" stroke="#F1F5F9" class="donut-bg-ring" style="pointer-events: none;"></circle>
      ${segmentsHTML}
    </g>
    ${linesHTML}
    ${textsHTML}
    <text id="donutCount" x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" font-size="44" font-weight="900" class="donut-center-number" style="pointer-events: none;"></text>
  </svg>`;

  const svgEl = document.getElementById("interactiveDonutSvg");
  const countEl = document.getElementById("donutCount");

  if (svgEl && countEl) {
    svgEl.addEventListener("mouseover", function (e) {
      if (e.target && e.target.classList.contains("donut-segment")) {
        const count = e.target.getAttribute("data-count");
        const color = e.target.getAttribute("data-color");
        countEl.textContent = count;
        countEl.setAttribute("fill", color);
      }
    });
    svgEl.addEventListener("mouseout", function (e) {
      if (e.target && e.target.classList.contains("donut-segment")) {
        countEl.textContent = "";
      }
    });
    svgEl.addEventListener("mouseleave", function () {
      countEl.textContent = "";
    });
  }

  if (rawWorksData && rawWorksData.length > 0 && legendContainer) {
    legendContainer.style.marginTop = "0px";
    const validWorks = rawWorksData
      .filter(
        (w) =>
          w.my_score !== undefined && w.my_score !== null && w.my_score !== "",
      )
      .sort((a, b) => parseFloat(b.my_score) - parseFloat(a.my_score));

    if (validWorks.length > 0) {
      const top20PercentCount = Math.max(1, Math.ceil(validWorks.length * 0.2));
      const topWorks = validWorks.slice(0, top20PercentCount);

      let comboCounts = {};
      topWorks.forEach((w) => {
        if (!w.genres_jp) return;
        const gList = w.genres_jp
          .split(",")
          .map((g) => g.trim())
          .filter(Boolean);
        for (let i = 0; i < gList.length; i++) {
          for (let j = i + 1; j < gList.length; j++) {
            const pair = [gList[i], gList[j]].sort().join(" × ");
            comboCounts[pair] = (comboCounts[pair] || 0) + 1;
          }
        }
      });

      const topCombos = Object.entries(comboCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

      if (topCombos.length > 0) {
        const svgCrown = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#F59E0B" stroke-width="2" style="vertical-align: text-bottom; margin-right: 4px;"><polygon points="2 4 5 16 19 16 22 4 16 11 12 4 8 11 2 4"></polygon><line x1="5" y1="20" x2="19" y2="20"></line></svg>`;
        let comboHTML = topCombos
          .map((c) => {
            const clickComboAction = `event.stopPropagation(); window.applyFilter('genre_combo', '${c[0]}', true)`;
            const comboHover = `const el = document.getElementById('donutCount'); if(el){ el.textContent = '${c[1]}'; el.setAttribute('fill', '#475569'); }`;
            const comboLeave = `const el = document.getElementById('donutCount'); if(el){ el.textContent = ''; }`;
            const parts = c[0].split(" × ");
            const color1 = genreColorMap[parts[0]] || "#475569";
            const color2 = genreColorMap[parts[1]] || "#475569";

            return `
          <div class="combo-legend-item" onclick="${clickComboAction}" onmouseover="${comboHover}" onmouseout="${comboLeave}">
            <span style="color: ${color1}; font-weight: 800;">${parts[0]}</span>
            <span style="color: #94a3b8; margin: 0 5px;">×</span>
            <span style="color: ${color2}; font-weight: 800;">${parts[1]}</span>
            <span class="combo-count">${c[1]}</span>
          </div>`;
          })
          .join("");

        legendContainer.innerHTML = `
        <div class="combo-section-wrapper">
          <div class="combo-title">${svgCrown} 上位20%の神コンボ</div>
          <div class="combo-legend-container">${comboHTML}</div>
        </div>`;
      } else {
        legendContainer.innerHTML = "";
      }
    }
  }
};

// 💡 11つ目：スコアの詳しい統計（中央値・分布など）を計算するマシーン
function calculateScoreStats(scoresList) {
  if (scoresList.length === 0)
    return { median: 0, dist: [0, 0, 0, 0, 0], max: 0, min: 0, maxDist: 0 };

  const sorted = [...scoresList].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  const dist = [0, 0, 0, 0, 0];
  scoresList.forEach((s) => {
    if (s <= 1.0) dist[0]++;
    else if (s <= 2.0) dist[1]++;
    else if (s <= 3.0) dist[2]++;
    else if (s <= 4.0) dist[3]++;
    else dist[4]++;
  });
  return {
    median,
    dist,
    max: Math.max(...scoresList).toFixed(1),
    min: Math.min(...scoresList).toFixed(1),
    maxDist: Math.max(...dist),
  };
}

// 💡 12つ目：グラフの形から「分析コメント」を1つ選ぶマシーン
function getAnalysisComment(dist, total) {
  if (total === 0)
    return "まだ評価データが少ないようです。これからたくさんの作品に出会いましょう！";
  const pct = dist.map((cnt) => cnt / total);
  const maxPct = Math.max(...pct),
    peakIndex = dist.indexOf(Math.max(...dist));
  const lowSum = pct[0] + pct[1] + pct[2],
    extremeSum = pct[0] + pct[4],
    middleSum = pct[2] + pct[3];

  const bank = {
    beginner: [
      "アニメ開拓は始まったばかり！これからどんな形のグラフを描くのか楽しみです",
      "まだ見ぬ名作があなたを待っています！いろんなジャンルをつまみ食いしてみましょう",
    ],
    polarized: [
      "「神作」か「地雷」か！白黒ハッキリつける、己の直感を信じるギャンブラータイプ",
      "グラフの両端が盛り上がっていますね。あなたの「★5」は本当に心から愛した作品の証です！",
    ],
    concentrated: [
      "評価基準が全くブレない！自分だけの絶対的な「定規」で作品を測る達人です",
      "スコアが一点集中！あなたのストライクゾーンはとても明確でわかりやすいです",
    ],
    strict: [
      "審美眼が鋭く、評価のハードルは高め。あなたの高評価には絶大な説得力があります",
      "なかなか高得点が出ないのは、真の名作を探求している証拠。厳しい目を持っていますね",
    ],
    generous: [
      "グラフが右肩上がり！作品の長所を見つける天才で、アニメ愛に溢れています",
      "素晴らしい作品との出会いに恵まれていますね！好きなものにはとことん甘いスタイルです",
    ],
    flat: [
      "どんな作品にも良さと悪さを見つける、フラットで客観的な視点の持ち主です",
      "スコアが綺麗に分散しています。ジャンル問わず色々な作品を楽しめる守備範囲の広さが魅力！",
    ],
    noPerfect: [
      "最高評価（満点）は滅多に出さない完璧主義者。いつかグラフの右端を突き破る「神アニメ」に出会えますように",
      "★4までは行くけど★5の壁が厚い！あなたの心を完全に満たす究極の作品を絶賛捜索中ですね",
    ],
    balancer: [
      "「面白かったけど神作まではあと一歩！」冷静な分析力が光るバランサーです",
      "大ハズレを引かない安定感。良作をしっかり「良作」と評価できる信頼の目利きです",
    ],
  };
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  if (total < 10) return pick(bank.beginner);
  if (extremeSum > 0.4 && middleSum < 0.3) return pick(bank.polarized);
  if (maxPct > 0.65) return pick(bank.concentrated);
  if (pct[4] === 0 && total >= 30) return pick(bank.noPerfect);
  if (lowSum > 0.6) return pick(bank.strict);
  if (maxPct < 0.35) return pick(bank.flat);
  if (peakIndex === 4) return pick(bank.generous);
  if (peakIndex === 3) return pick(bank.balancer);
  return "じっくりと作品を吟味するタイプ。グラフの形から、あなたのこだわりの強さが伺えます✨";
}

// 💡 13つ目：評価分析パネルのHTMLを組み立てるマシーン
function createTendencyPanelHtml(data) {
  const {
    tendency,
    avgScore,
    starHtml,
    maxScore,
    scoreMedian,
    minScore,
    histogramHtml,
    analysisComment,
  } = data;
  return `
    <div class="p-inner">
      <div class="t-avg-box">
        <div class="t-avg-l"><div class="t-avg-txt">平均スコア</div><div class="t-avg-badge">${tendency}</div></div>
        <div class="t-avg-r"><div class="t-avg-val"><span class="t-avg-num">${avgScore}</span><span class="t-avg-max">/5.0</span></div><div class="t-stars">${starHtml}</div></div>
      </div>
      <div class="t-capsules">
        <div class="t-cap"><span class="t-cap-lbl">最高</span><span class="t-cap-val">${maxScore}</span></div>
        <div class="t-cap t-cap-center"><span class="t-cap-lbl">中央値</span><span class="t-cap-val">${scoreMedian}</span></div>
        <div class="t-cap"><span class="t-cap-lbl">最低</span><span class="t-cap-val">${minScore}</span></div>
      </div>
      <div class="t-hist-wrap">${histogramHtml}</div>
      <div class="t-analysis-comment">${analysisComment}</div>
    </div>`;
}

// 💡 14つ目の「推しキャラ集計マシーン」
function collectUniqueOshiList() {
  const uniqueOshiList = [];
  const seenIds = new Set();

  if (window.animeDB) {
    window.animeDB.forEach((anime) => {
      if (anime.characters) {
        try {
          const charList =
            typeof anime.characters === "string"
              ? JSON.parse(anime.characters)
              : anime.characters;
          if (Array.isArray(charList)) {
            charList.forEach((c) => {
              if (c.isOshi || c.isIchioshi || c.isFavorite) {
                const uniqueKey = c.id
                  ? String(c.id)
                  : (c.name + "_" + (anime.title || ""))
                      .replace(/[\s ]/g, "")
                      .toLowerCase();
                if (!seenIds.has(uniqueKey)) {
                  seenIds.add(uniqueKey);
                  uniqueOshiList.push({
                    ...c,
                    animeTitle: anime.title,
                    anilist_id: anime.anilist_id,
                  });
                }
              }
            });
          }
        } catch (e) {
          console.error("運命のキャラ集計エラー:", e);
        }
      }
    });
  }
  return uniqueOshiList;
}

// 💡 15つ目の「物理演算エンジンマシーン」（ここへ丸ごと引越し！）
window.initOshiPhysics = function (isShuffle = false) {
  if (window.oshiPhysicsAnimationId)
    cancelAnimationFrame(window.oshiPhysicsAnimationId);

  const box = document.getElementById("oshiPhysicsBox");
  if (!box || !window._currentOshiList || window._currentOshiList.length === 0)
    return;

  box.innerHTML = "";
  let balls = [];
  const boxW = box.clientWidth || 300;
  const boxH = box.clientHeight || 250;
  const scale = Math.min(1.2, Math.max(0.6, boxW / 500));
  const boxArea = boxW * boxH;
  const targetCount = Math.floor(boxArea / (10000 * scale * scale));
  const displayCount = Math.max(6, Math.min(25, targetCount));

  let weightedList = window._currentOshiList.map((o) => {
    const isFav = o.isIchioshi || o.isFavorite;
    return { ...o, weight: Math.random() + (isFav ? 0.8 : 0) };
  });
  weightedList.sort((a, b) => b.weight - a.weight);
  let displayList = weightedList.slice(0, displayCount);
  displayList.sort(() => 0.5 - Math.random());

  displayList.forEach((o) => {
    const baseMin = 38 * scale;
    const baseRange = 30 * scale;
    const radius = Math.floor(Math.random() * baseRange) + baseMin;

    const el = document.createElement("img");
    el.src = o.img;
    el.className = "oshi-physics-ball";
    el.style.width = `${radius * 2}px`;
    el.style.height = `${radius * 2}px`;
    el.title = o.name;

    el.onmouseenter = () => el.setAttribute("data-hover", "true");
    el.onmouseleave = () => el.removeAttribute("data-hover");

    el.onclick = (e) => {
      e.stopPropagation();
      const statsArea = document.getElementById("statsPageArea");
      if (statsArea) statsArea.classList.remove("slide-down");
      if (typeof window.applyFilter === "function")
        window.applyFilter("character", o.name, true);
    };

    box.appendChild(el);
    balls.push({
      x: radius + Math.random() * Math.max(0, boxW - radius * 2),
      y: radius + Math.random() * Math.max(0, boxH - radius * 2),
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      r: radius,
      el: el,
    });
  });

  let mouseX = -1000,
    mouseY = -1000;
  box.onmousemove = (e) => {
    const rect = box.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  };
  box.onmouseleave = () => {
    mouseX = -1000;
    mouseY = -1000;
  };

  function updatePhysics() {
    const currentW = box.clientWidth;
    const currentH = box.clientHeight;
    for (let i = 0; i < balls.length; i++) {
      let b = balls[i];
      if (b.el.getAttribute("data-hover") === "true") continue;
      b.vx *= 0.94;
      b.vy *= 0.94;
      b.x += b.vx;
      b.y += b.vy;

      if (b.x - b.r < 0) {
        b.x = b.r;
        b.vx *= -0.5;
      }
      if (b.x + b.r > currentW) {
        b.x = currentW - b.r;
        b.vx *= -0.5;
      }
      if (b.y - b.r < 0) {
        b.y = b.r;
        b.vy *= -0.5;
      }
      if (b.y + b.r > currentH) {
        b.y = currentH - b.r;
        b.vy *= -0.5;
      }

      let dxM = b.x - mouseX,
        dyM = b.y - mouseY;
      let distM = Math.sqrt(dxM * dxM + dyM * dyM);
      if (distM < b.r + 50) {
        b.vx += dxM * 0.015;
        b.vy += dyM * 0.015;
      }

      for (let j = i + 1; j < balls.length; j++) {
        let b2 = balls[j];
        let dx = b2.x - b.x,
          dy = b2.y - b.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        let minDist = b.r + b2.r;
        if (dist < minDist) {
          let angle = Math.atan2(dy, dx),
            overlap = minDist - dist;
          b.x -= Math.cos(angle) * overlap * 0.15;
          b.y -= Math.sin(angle) * overlap * 0.15;
          b2.x += Math.cos(angle) * overlap * 0.15;
          b2.y += Math.sin(angle) * overlap * 0.15;
          let tempVx = b.vx,
            tempVy = b.vy;
          b.vx = b2.vx;
          b.vy = b2.vy;
          b2.vx = tempVx;
          b2.vy = tempVy;
        }
      }
      b.el.style.left = `${b.x - b.r}px`;
      b.el.style.top = `${b.y - b.r}px`;
    }
    window.oshiPhysicsAnimationId = requestAnimationFrame(updatePhysics);
  }
  updatePhysics();
};

// 💡 16つ目：年代別データの集計とグラフ座標を計算するマシーン
function calculateDecadeStats() {
  let dbYears = [];
  const currentYear = new Date().getFullYear();

  if (window.animeDB) {
    window.animeDB.forEach((a) => {
      const y = parseInt(a.year);
      if (!isNaN(y) && y > 1950 && y <= currentYear + 2) {
        if (a.watch_status === "履修済" || a.watch_status === "履修中") {
          dbYears.push(y);
        }
      }
    });
  }

  const oldestYear = dbYears.length > 0 ? Math.min(...dbYears) : 2000;
  const newestYear = dbYears.length > 0 ? Math.max(...dbYears) : currentYear;

  const yearData = {};
  for (let y = oldestYear; y <= newestYear; y++) {
    yearData[y] = { count: 0, scoreSum: 0, scoreCount: 0 };
  }

  let showaCount = 0,
    heiseiCount = 0,
    reiwaCount = 0;

  if (window.animeDB) {
    window.animeDB.forEach((a) => {
      const y = parseInt(a.year);
      if (isNaN(y) || y < oldestYear || y > newestYear) return;

      if (a.watch_status === "履修済" || a.watch_status === "履修中") {
        yearData[y].count++;
        if (y <= 1988) showaCount++;
        else if (y <= 2018) heiseiCount++;
        else reiwaCount++;

        const score = parseFloat(a.my_score || 0);
        if (score >= 0.1) {
          yearData[y].scoreSum += score;
          yearData[y].scoreCount++;
        }
      }
    });
  }

  let maxCount = 0,
    maxAvgScore = 0,
    yearsArray = [];
  for (let y = oldestYear; y <= newestYear; y++) {
    const d = yearData[y];
    if (d.count > maxCount) maxCount = d.count;
    const avg = d.scoreCount > 0 ? d.scoreSum / d.scoreCount : 0;
    if (avg > maxAvgScore && d.scoreCount >= 1) maxAvgScore = avg;
    yearsArray.push({ year: y, count: d.count });
  }

  let maxCountYears = [],
    maxAvgScoreYears = [];
  for (let y = oldestYear; y <= newestYear; y++) {
    const d = yearData[y];
    const avg = d.scoreCount > 0 ? d.scoreSum / d.scoreCount : 0;
    if (d.count === maxCount && maxCount > 0) maxCountYears.push(y);
    if (
      Math.abs(avg - maxAvgScore) < 0.0001 &&
      maxAvgScore > 0 &&
      d.scoreCount >= 1
    ) {
      maxAvgScoreYears.push(y);
    }
  }

  let eraTitle = "アニメマニア";
  if (showaCount > heiseiCount && showaCount > reiwaCount)
    eraTitle = "懐かし昭和アニメファン";
  else if (heiseiCount > showaCount && heiseiCount > reiwaCount)
    eraTitle = "黄金期平成アニメファン";
  else if (reiwaCount > showaCount && reiwaCount > heiseiCount)
    eraTitle = "最新令和アニメファン";

  return {
    oldestYear,
    newestYear,
    yearsArray,
    maxCount,
    maxAvgScore,
    maxCountYears,
    maxAvgScoreYears,
    eraTitle,
  };
}

// 💡 17つ目：イヤーバッジHTMLを生成するマシーン
function generateYearBadgesHtml(years, defaultYear) {
  if (years.length === 0) {
    return `<button class="year-unit-btn" onclick="window.applyFilter('year', '${defaultYear}', true)">${defaultYear}<span class="year-suffix">年</span></button>`;
  }
  return years
    .map(
      (y) =>
        `<button class="year-unit-btn" onclick="window.applyFilter('year', '${y}', true)">${y}<span class="year-suffix">年</span></button>`,
    )
    .join('<span class="year-splitter">/</span>');
}

// 💡 18つ目：年代グラフパネルのHTMLを組み立てるマシーン
function createDecadePanelHtml(data) {
  const {
    svgW,
    svgH,
    gridLines,
    xAxisTicksHtml,
    yAxisHtml,
    polylineHtml,
    oldestYear,
    newestYear,
    htmlAvgYears,
    maxAvgScore,
    htmlCountYears,
    maxCount,
    eraTitle,
  } = data;
  return `
    <div class="decade-container">
      <div class="decade-graph-section">
        <svg viewBox="0 0 ${svgW} ${svgH}" class="neon-line-chart" overflow="visible">
          <defs>
            <filter id="neonGlowPink" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          ${gridLines} ${xAxisTicksHtml} ${yAxisHtml} ${polylineHtml}
        </svg>
      </div>
      <div class="decade-stats-section">
        <div class="stats-row row-timeline">
          <div class="capsule-badge gray-style"><span class="badge-label">最古作品</span><span class="badge-value clickable-badge-value" onclick="window.applyFilter('year', '${oldestYear}', true)">${oldestYear}年</span></div>
          <div class="timeline-arrow"></div>
          <div class="capsule-badge gray-style"><span class="badge-label">最新作品</span><span class="badge-value clickable-badge-value" onclick="window.applyFilter('year', '${newestYear}', true)">${newestYear}年</span></div>
        </div>
        <div class="stats-row row-twin">
          <div class="capsule-badge"><span class="badge-label">最高平均点イヤー</span><div class="multi-year-display">${htmlAvgYears}</div><span class="badge-sub">平均 ${maxAvgScore.toFixed(1)}点</span></div>
          <div class="capsule-badge"><span class="badge-label">最多視聴イヤー</span><div class="multi-year-display">${htmlCountYears}</div><span class="badge-sub">${maxCount}作品マーク</span></div>
        </div>
        <div class="stats-row row-honor"><div class="capsule-badge badge-honor"><span class="honor-text">${eraTitle}</span></div></div>
      </div>
    </div>`;
}

// 💡 19つ目：スタッフ（制作会社・声優・監督）の個別バッジHTMLを作るマシーン
function createStaffItemHtml(list, type) {
  if (!list || list.length === 0) {
    return '<div class="dashboard-empty-text staff-empty">データなし</div>';
  }
  return list
    .map((s) => {
      return `<div class="staff-rank-item pop-up-animation" onclick="event.stopPropagation(); window.applyFilter('${type}', '${s.name}', true)"><span class="staff-tag">${s.name}</span><div class="staff-score">${s.count} <span class="staff-arts">作品</span></div></div>`;
    })
    .join("");
}

// 💡 20つ目：クリエイター陣パネルのHTMLを組み立てるマシーン
function createStaffPanelHtml(studioHtml, actorHtml, directorHtml) {
  return `
    <div><div class="staff-col-header">制作会社</div><div class="staff-rank-container">${studioHtml}</div></div>
    <div><div class="staff-col-header">声優</div><div class="staff-rank-container">${actorHtml}</div></div>
    <div><div class="staff-col-header">監督</div><div class="staff-rank-container">${directorHtml}</div></div>`;
}

// 💡 21つ目：Canvas画像生成に渡すための「巨大な燃料データ」を組み立てる専門マシーン
function buildExportData(context) {
  const {
    reportTokens,
    topStudios,
    topActors,
    topDirectors,
    masterpieces,
    totalAnime,
    totalDBLength,
    compRate,
    totalH,
    totalM,
    backlogCount,
    formatCounts,
    ballGenres,
    userName,
    totalMinutes,
    tendency,
    validWorks,
    genreCounts,
    scoreMedian,
    dist,
    analysisComment,
    maxScore,
    minScore,
    avgScore,
    oshiList,
    decadeCounts,
    genrePairs,
  } = context;

  return {
    reportTokens: reportTokens,
    staff: { studios: topStudios, actors: topActors, directors: topDirectors },
    masterpieces: masterpieces,
    style: {
      totalAnime,
      totalDBLength,
      compRate,
      totalH,
      totalM,
      backlogCount,
      formatCounts,
    },
    genre: { ballGenres: ballGenres },
    tendency: {
      avgScore: window.storedTendencyData
        ? window.storedTendencyData.avgScore
        : "0.0",
      tendencyTxt: window.storedTendencyData
        ? window.storedTendencyData.tendencyTxt
        : "未分析",
      maxScore: window.storedTendencyData
        ? window.storedTendencyData.maxScore
        : "0.0",
      scoreMedian: window.storedTendencyData
        ? window.storedTendencyData.scoreMedian
        : "0.0",
      minScore: window.storedTendencyData
        ? window.storedTendencyData.minScore
        : "0.0",
      dist: window.storedTendencyData
        ? window.storedTendencyData.dist
        : [0, 0, 0, 0, 0],
      analysisComment: window.storedTendencyData
        ? window.storedTendencyData.analysisComment
        : "データがありません。",
    },
    oshiList: window._currentOshiList || [],
    historyAnimeList: window.animeDB
      ? window.animeDB.map((a) => ({
          year: a.year,
          watch_status: a.watch_status,
          my_score: a.my_score,
        }))
      : [],
    userName: userName,
    totalDB: totalDBLength,
    totalAnime: totalAnime,
    totalHours: Math.floor(totalMinutes / 60),
    totalMinutes: totalMinutes % 60,
    tendency: tendency,
    topAnime: validWorks.slice(0, 5),
    formatCounts: formatCounts,
    genreCounts: genreCounts,
    ratingData: {
      avgScore,
      maxScore,
      minScore,
      median: scoreMedian.toFixed(1),
      dist,
      comment: analysisComment,
    },
    oshiCharacters: oshiList.slice(0, 5),
    decadeCounts: decadeCounts,
    genrePairs: genrePairs,
  };
}

// 💡 22つ目：SHAREボタンを配備してクリックイベントを紐付けるマシーン
function setupShareButton(container, context) {
  let shareBtn = document.querySelector(".btn-share-small");
  console.log("🔍 [SHAREボタン自動検出]:", shareBtn);

  if (!shareBtn) {
    console.log(
      "💡 画面にSHAREボタンが配備されていなかったため、最下部に自動生成します。",
    );
    const footerArea = document.createElement("div");
    footerArea.className = "action-footer";
    footerArea.style.cssText =
      "margin-top: 40px; text-align: center; margin-bottom: 40px; width: 100%; display: flex; justify-content: center;";
    footerArea.innerHTML = `
      <button class="btn-share-small" style="padding: 12px 32px; background: #3b82f6; color: white; border: none; border-radius: 12px; font-weight: 800; font-size: 14px; cursor: pointer; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        SHARE
      </button>`;
    container.appendChild(footerArea);
    shareBtn = footerArea.querySelector(".btn-share-small");
  }

  if (shareBtn) {
    console.log(
      "✅ SHAREボタンへのイベント紐付けに成功しました！クリックを監視中...",
    );
    shareBtn.addEventListener("click", async () => {
      console.log(
        "🚀 SHAREボタンがクリックされました！画像生成処理を開始します。",
      );
      const originalText = shareBtn.innerHTML;
      shareBtn.innerHTML = "生成中...";
      shareBtn.style.opacity = "0.7";
      shareBtn.style.pointerEvents = "none";

      try {
        // マシーン21を呼び出してデータをスッキリ取得
        const exportData = buildExportData(context);
        console.log(
          "📸 画像生成エンジン(Canvas)へ送信する燃料データ:",
          exportData,
        );

        if (typeof StatsExporter !== "undefined") {
          const imgData = await StatsExporter.generateImage(exportData);
          console.log("✅ 画像生成エンジンからの応答に成功！");
          if (typeof showPreviewModal === "function") {
            showPreviewModal(imgData);
          } else {
            const newTab = window.open();
            newTab.document.write(
              `<img src="${imgData}" style="max-width:100%;">`,
            );
          }
        } else {
          alert("画像出力エンジン(statsExporter.js)が見つかりません。");
        }
      } catch (error) {
        console.error("❌ 画像生成エラー発生:", error);
        alert("画像の生成に失敗しました。詳細: " + error.message);
      } finally {
        shareBtn.innerHTML = originalText;
        shareBtn.style.opacity = "1";
        shareBtn.style.pointerEvents = "auto";
      }
    });
  } else {
    console.error("❌ SHAREボタンの自動生成・取得のすべてに失敗しました。");
  }
}

window.renderStatsPage = function () {
  const container = document.getElementById("statsDashboardContainer");
  if (!container) return;

  const userName = localStorage.getItem("otaku_log_display_name") || "GUEST";
  const totalDBLength = window.animeDB.length;
  const watchedAnime = window.animeDB.filter(
    (a) => a.watch_status === "履修済",
  );
  const totalAnime = watchedAnime.length;

  let totalMinutes = 0;
  let totalScore = 0;
  let scoredCount = 0;
  let genreCounts = {};
  let genrePairs = {};
  let oshiList = [];
  let decadeCounts = {};
  const validWorks = [];

  // 📈 視聴スタイル・推し作品率用の追加集計変数
  let oshiWorksCount = 0;
  let formatCounts = {};
  let totalEpisodesForTime = 0;
  let totalDurationsForTime = 0;
  let validYears = [];

  // 💡 「未視聴」からデータ上の正しい名前「未履修」に修正しました！
  const backlogCount = window.animeDB.filter(
    (a) =>
      a.watch_status === "未履修" ||
      a.watch_status === "再履修" ||
      a.watch_status === "履修中",
  ).length;

  window.animeDB.forEach((a) => {
    const y = parseInt(a.year);
    if (!isNaN(y) && y > 1950 && y <= new Date().getFullYear() + 2) {
      const decade = Math.floor(y / 10) * 10;
      decadeCounts[decade] = (decadeCounts[decade] || 0) + 1;
      validYears.push(y);
    }

    if (a.watch_status !== "履修済") return;

    const eps = parseInt(String(a.episodes || "0").replace(/[^0-9]/g, "")) || 0;
    const dur = parseInt(a.duration) || 0;
    const rewatch = parseInt(a.rewatch_count) || 1;
    totalMinutes += eps * dur * rewatch;

    // 1話平均時間用の集計
    if (dur > 0) {
      totalEpisodesForTime++;
      totalDurationsForTime += dur;
    }

    // フォーマット集計
    // 💡 .replace("_SHORT", "") を削除して、TV_SHORT をそのまま残します！
    let fmt = a.format || "OTHER";
    formatCounts[fmt] = (formatCounts[fmt] || 0) + 1;

    const score = parseFloat(a.my_score || 0);
    if (score > 0) {
      totalScore += score;
      scoredCount++;
      validWorks.push(a);
    }

    if (extractOshiCharacters(a.characters, oshiList)) {
      oshiWorksCount++;
    }

    // 💡 スコアが3.8以上なら、用意したマシーンでジャンルと組み合わせをカウント！
    if (score >= 3.8) {
      countGenresAndPairs(a.genres_jp, genreCounts, genrePairs);
    }
  });

  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const scoresList = validWorks.map((a) => parseFloat(a.my_score || 0));
  const actualScoredCount = scoresList.length;
  const actualTotalScore = scoresList.reduce((acc, s) => acc + s, 0);
  const avgScoreNum =
    actualScoredCount > 0 ? actualTotalScore / actualScoredCount : 0;
  const avgScore = actualScoredCount > 0 ? avgScoreNum.toFixed(1) : 0;

  // 💡 マシーンが勝手に中で辞書を引いて、両方まとめて返してくれます！
  const { tendency, tendDesc } = analyzeOtakuTendency(scoresList, avgScoreNum);

  // 💡 上位クリエイター集計ロジック
  validWorks.sort((a, b) => parseFloat(b.my_score) - parseFloat(a.my_score));
  const top20PercentCount = Math.max(1, Math.ceil(validWorks.length * 0.2));
  const topWorks = validWorks.slice(0, top20PercentCount);

  let studioStats = {};
  let directorStats = {};
  let actorStats = {};
  topWorks.forEach((a) => {
    if (a.studio) studioStats[a.studio] = (studioStats[a.studio] || 0) + 1;

    const dir = cleanText(a.director);

    if (dir) directorStats[dir] = (directorStats[dir] || 0) + 1;

    if (a.cast) {
      a.cast.split(",").forEach((v) => {
        const actor = cleanText(v);

        if (actor) actorStats[actor] = (actorStats[actor] || 0) + 1;
      });
    }
  });

  // 💡 用意したランキング並び替えマシーンを使って、上位5件を一発で取得！
  const topStudios = getTopRankings(studioStats);
  const topDirectors = getTopRankings(directorStats);
  const topActors = getTopRankings(actorStats);

  const masterpieces = [...watchedAnime]
    .filter((a) => parseFloat(a.my_score || 0) > 0)
    .sort((a, b) => parseFloat(b.my_score) - parseFloat(a.my_score))
    .slice(0, 5);

  const ballGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  const topGenreName = ballGenres.length > 0 ? ballGenres[0][0] : "アニメ";
  const topPairData = Object.entries(genrePairs).sort((a, b) => b[1] - a[1]);
  const topPairStr =
    topPairData.length > 0 ? topPairData[0][0] : "特定のジャンル";

  const topActor1 = topActors.length > 0 ? topActors[0].name : "";
  const topActor2 = topActors.length > 1 ? topActors[1].name : "";

  const topDirObj = topDirectors.length > 0 ? topDirectors[0] : null;

  const decadeKeys = Object.keys(decadeCounts).sort();
  const maxDecadeCount =
    decadeKeys.length > 0 ? Math.max(...Object.values(decadeCounts)) : 1;
  let topDecade =
    decadeKeys.length > 0
      ? Object.entries(decadeCounts).sort((a, b) => b[1] - a[1])[0][0]
      : "";
  // 💡 用意したマシーンで、紹介文テキストだけを一発で作成！
  const { actorText, directorText, decadeText } = generateReportTexts(
    topActors,
    topDirectors,
    topDecade,
  );
  const maxBallCount = ballGenres.length > 0 ? ballGenres[0][1] : 1;
  const compColors = [
    "#5152F5",
    "#FF1F4F",
    "#F9C106",
    "#10B981",
    "#8B5CF6",
    "#F43F5E",
    "#0EA5E9",
  ];

  // ==========================================
  // 💡 1. パネル群のHTML動的生成＆流し込み
  // ==========================================

  // --- 1. 診断プロファイル ---
  // 💡 1. 画面＆画像用のパーツをマシーンに渡して一発で作ってもらう！
  const reportTokens = buildReportTokens({
    userName,
    hours,
    mins,
    totalAnime,
    topGenreName,
    topPairStr,
    topDecade,
    topActor1,
    topActor2,
    topDirObj,
    tendency,
    tendDesc,
    oshiCount: oshiList.length,
  });

  // 💡 2. 診断プロファイル（画面への流し込み）
  const reportTextEl = document.getElementById("stat-report-text");
  if (reportTextEl) {
    reportTextEl.innerHTML = `
      <span class="report-username">${userName}</span> さんはこれまでに約 <span class="report-highlight">${hours}</span> 時間 <span class="report-highlight">${mins}</span> 分をアニメに費やし、<span class="report-highlight">${totalAnime}</span> 本の作品を視聴してきました。<br>
      深層データによると、特に <span class="report-highlight">${topGenreName}</span> ジャンルへの適性が極めて高く、中でも <span class="report-highlight">${topPairStr}</span> の要素が組み合わさった作品につい心を奪われがちなようです。<br>
      ${decadeText} ${actorText} ${directorText}
      評価傾向は「<span class="report-tendency">${tendency}</span>」。${tendDesc}<br>
      見つけた「推し」の数は現在 <span class="report-highlight">${oshiList.length}</span> 人。これからも素敵な作品とキャラクターに出会えることを祈っています！`;
  }

  // 💡 --- 2. 高評価トップ5 ---
  const masterpiecesEl = document.getElementById("stat-masterpieces");
  if (masterpiecesEl) {
    masterpiecesEl.innerHTML =
      masterpieces.length > 0
        ? masterpieces.map((a, i) => createMasterpieceCardHtml(a, i)).join("")
        : '<div class="dashboard-empty-text">スコア付き作品が表示されます</div>';
  }

  // 💡 --- 3. 視聴スタイル ---
  const compRate =
    totalDBLength > 0 ? Math.round((totalAnime / totalDBLength) * 100) : 0;
  const totalH = Math.floor(totalMinutes / 60);
  const totalM = totalMinutes % 60;

  const panelStyle = document.getElementById("panelContent-style");
  if (panelStyle) {
    // マシーンに必要なデータをまとめて渡して、HTMLを流し込むだけ！
    panelStyle.innerHTML = createStylePanelHtml({
      totalAnime,
      totalDBLength,
      compRate,
      totalH,
      totalM,
      backlogCount,
      formatCounts,
    });
  }

  // 💡 --- 4. 刺さるジャンル ---
  setTimeout(() => {
    if (window.genrePhysicsAnimationId)
      cancelAnimationFrame(window.genrePhysicsAnimationId);
    if (window.genrePhysicsObserver) window.genrePhysicsObserver.disconnect();

    if (ballGenres && ballGenres.length > 0) {
      const donutData = ballGenres.map((g) => ({ name: g[0], count: g[1] }));
      if (typeof window.renderGenreDonut === "function") {
        window.renderGenreDonut(donutData, validWorks);
      }
    } else {
      const container = document.getElementById("genreDonutContainer");
      if (container) {
        container.innerHTML =
          "<p style='text-align:center; color:#94A3B8; font-size:12px;'>データがありません</p>";
      }
    }
  }, 50);

  // 💡 --- 5. 評価分析 ---
  // 1. 統計の計算をマシーンにお任せ
  const {
    median: scoreMedian,
    dist,
    max: maxScore,
    min: minScore,
    maxDist: maxDistCount,
  } = calculateScoreStats(scoresList);

  // 2. 星の評価HTMLとヒストグラムを組み立て
  const fullStars = Math.round(avgScoreNum);
  const starHtml = [...Array(5)]
    .map(
      (_, i) =>
        `<span class="${i < fullStars ? "t-star-on" : "t-star-off"}">★</span>`,
    )
    .join("");
  const distLabels = ["0-1.0", "1.1-2.0", "2.1-3.0", "3.1-4.0", "4.1-5.0"];
  const histogramHtml = dist
    .map((cnt, i) => {
      const heightPct =
        maxDistCount > 0 ? Math.round((cnt / maxDistCount) * 100) : 0;
      return `<div class="t-hist-col"><div class="t-hist-val">${cnt > 0 ? cnt : ""}</div><div class="t-hist-bar-wrap"><div class="t-hist-bar" style="height: ${heightPct}%;"></div></div><div class="t-hist-lbl">${distLabels[i]}</div></div>`;
    })
    .join("");

  // 3. 分析コメントをマシーンに選んでもらう
  const analysisComment = getAnalysisComment(dist, actualScoredCount);

  // 4. パネルの流し込み
  const panelTendency = document.getElementById("panelContent-tendency");
  if (panelTendency) {
    panelTendency.innerHTML = createTendencyPanelHtml({
      tendency,
      avgScore,
      starHtml,
      maxScore,
      scoreMedian: scoreMedian.toFixed(1),
      minScore,
      histogramHtml,
      analysisComment,
    });

    // 💡 Canvas用のデータ保存
    window.storedTendencyData = {
      avgScore,
      tendencyTxt: tendency,
      maxScore,
      scoreMedian: scoreMedian.toFixed(1),
      minScore,
      dist: [...dist],
      analysisComment,
    };
  }

  // 💡 --- 6. 運命のキャラクター（推し） ---
  const panelOshi = document.getElementById("panelContent-oshi");
  if (panelOshi) {
    // 1. 集計マシーンを呼び出してデータを取得
    const uniqueOshiList = collectUniqueOshiList();
    window._currentOshiList = uniqueOshiList;

    // 2. パネルの土台HTMLを流し込み
    panelOshi.innerHTML = `
      <div class="p-inner" style="position: relative; display: flex; flex-direction: column; height: 100%;">
        <div class="o-header">
          <div class="o-label">見つけた推し <span class="o-total-count">${uniqueOshiList.length}</span>人</div>
          <button class="o-shuffle-btn" onclick="window.initOshiPhysics(true)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 3 21 3 21 8"></polyline><line x1="4" y1="20" x2="21" y2="3"></line><polyline points="21 16 21 21 16 21"></polyline><line x1="15" y1="15" x2="21" y2="21"></line><line x1="4" y1="4" x2="9" y2="9"></line></svg>
            シャッフル
          </button>
        </div>
        <div id="oshiPhysicsBox" class="oshi-physics-box" style="flex: 1; min-height: 250px;"></div>
      </div>`;

    // 3. 物理演算のエンジンを起動
    setTimeout(() => {
      if (typeof window.initOshiPhysics === "function")
        window.initOshiPhysics();
    }, 100);
  }

  // 💡 --- 7. 視聴年代ヒストリー ---
  const panelDecade = document.getElementById("panelContent-decade");

  if (panelDecade && window.animeDB && window.animeDB.length > 0) {
    // 1. 集計マシーンを呼び出して基本データを一網打尽
    const {
      oldestYear,
      newestYear,
      yearsArray,
      maxCount,
      maxAvgScore,
      maxCountYears,
      maxAvgScoreYears,
      eraTitle,
    } = calculateDecadeStats();

    const htmlAvgYears = generateYearBadgesHtml(maxAvgScoreYears, oldestYear);
    const htmlCountYears = generateYearBadgesHtml(maxCountYears, oldestYear);

    // 2. SVGのレイアウト計算
    const svgW = 500,
      svgH = 200,
      paddingT = 8,
      paddingB = 22,
      paddingL = 35;
    const graphW = svgW - paddingL,
      graphH = svgH - paddingT - paddingB;
    const maxAxisVal = maxCount > 0 ? maxCount : 1;

    // 3. Y軸とグリッド線の生成
    let yAxisHtml = "",
      gridLines = "";
    for (let i = 0; i <= 3; i++) {
      const val = Math.round(maxAxisVal * (i / 3));
      const yPos = paddingT + graphH - graphH * (i / 3);
      yAxisHtml += `<text x="${paddingL - 8}" y="${yPos + 4}" text-anchor="end" class="graph-axis-text">${val}</text>`;
      gridLines += `<line x1="${paddingL}" y1="${yPos}" x2="${svgW}" y2="${yPos}" stroke="#f1f5f9" stroke-width="1" stroke-dasharray="3,3" />`;
    }

    // 4. X軸の目盛生成
    let xAxisTicksHtml = "";
    const startDecade = Math.ceil(oldestYear / 10) * 10;
    const totalYearsRange = newestYear - oldestYear;
    for (let dec = startDecade; dec <= newestYear; dec += 10) {
      const ratio = (dec - oldestYear) / (totalYearsRange || 1);
      const xPos = paddingL + ratio * graphW;
      xAxisTicksHtml += `<line x1="${xPos}" y1="${paddingT + graphH}" x2="${xPos}" y2="${paddingT + graphH + 5}" stroke="#cbd5e1" stroke-width="1" />`;
      xAxisTicksHtml += `<text x="${xPos}" y="${paddingT + graphH + 18}" text-anchor="middle" class="graph-axis-text">${dec}</text>`;
    }

    // 5. 折れ線グラフのプロットポイント計算
    let points = [];
    yearsArray.forEach((item, index) => {
      const ratio = index / (yearsArray.length - 1);
      const x = paddingL + ratio * graphW;
      const y = paddingT + graphH - (item.count / maxAxisVal) * graphH;
      points.push(`${x},${y}`);
    });

    const polylineHtml = `<polyline points="${points.join(" ")}" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="neon-main-line" filter="url(#neonGlowPink)"/>`;

    // 6. パネルへ流し込み
    panelDecade.innerHTML = createDecadePanelHtml({
      svgW,
      svgH,
      gridLines,
      xAxisTicksHtml,
      yAxisHtml,
      polylineHtml,
      oldestYear,
      newestYear,
      htmlAvgYears,
      maxAvgScore,
      htmlCountYears,
      maxCount,
      eraTitle,
    });
  }

  // 💡 --- 8. 最高のクリエイター陣 ---
  const staffPanel = document.getElementById("panelContent-staff");
  if (staffPanel) {
    // 1. 各部門のHTML生成をマシーンに依頼
    const studioHtml = createStaffItemHtml(topStudios, "studio");
    const actorHtml = createStaffItemHtml(topActors, "voiceActor");
    const directorHtml = createStaffItemHtml(topDirectors, "director");

    // 2. パネル全体を組み立てて流し込み
    staffPanel.innerHTML = createStaffPanelHtml(
      studioHtml,
      actorHtml,
      directorHtml,
    );
  }

  // 💡 =========================================================
  // 📸 SHAREボタン押下時の画像エクスポート処理（完全安全版）
  // =========================================================
  // 変数群をまとめてマシーンにパスする
  setupShareButton(container, {
    reportTokens,
    topStudios,
    topActors,
    topDirectors,
    masterpieces,
    totalAnime,
    totalDBLength,
    compRate,
    totalH,
    totalM,
    backlogCount,
    formatCounts,
    ballGenres,
    userName,
    totalMinutes,
    tendency,
    validWorks,
    genreCounts,
    scoreMedian,
    dist,
    analysisComment,
    maxScore,
    minScore,
    avgScore,
    oshiList,
    decadeCounts,
    genrePairs,
  });
}; // 👈 ここでメイン関数 (renderStatsPage) が終了します

// 💡 画面外（背景）クリックでダッシュボードを閉じる共通イベント
document.addEventListener("click", (e) => {
  const statsArea = document.getElementById("statsPageArea");
  if (statsArea && statsArea.classList.contains("slide-down")) {
    if (e.target === statsArea) {
      statsArea.classList.remove("slide-down");
      if (typeof window.switchView === "function") window.switchView("stats");
    }
  }
});
