// =========================================================
// 🏠 js/pages/home.js：ホーム画面（グリッド表示・絞り込み・並び替え）
// =========================================================

/**
 * 🌟 ホーム画面（グリッド・カード一覧）の描画
 */
window.renderGrid = function () {
  // 1. UIの表示切り替え（自分の担当エリアだけを表示する）
  document.getElementById("animeGrid")?.classList.remove("hidden");
  document.getElementById("listViewArea")?.classList.add("hidden");
  document.getElementById("mainActionRow").style.display = "flex";
  document.getElementById("mainFilterRow").style.display = "flex";

  const grid = document.getElementById("animeGrid");
  if (!grid) return;
  grid.innerHTML = "";

  let filtered = [...window.animeDB];
  const breadcrumb = document.getElementById("breadcrumbArea");

  // 2. フィルター（絞り込み）ロジックの処理
  if (window.filterQuery) {
    breadcrumb?.classList.remove("hidden");

    // 表示するタイトルから [ ] などの注釈を除去
    const displayTitleName = window.filterQuery.value
      .replace(/\[[^\]]*\]/g, "")
      .trim();
    const viewTitle = document.getElementById("viewTitle");
    if (viewTitle) viewTitle.innerText = `「${displayTitleName}」の作品`;

    // パンくずリスト内のボタンコンテナの生成・維持
    let btnContainer = document.getElementById("breadcrumbBtnContainer");
    if (!btnContainer) {
      btnContainer = document.createElement("div");
      btnContainer.id = "breadcrumbBtnContainer";
      btnContainer.style.cssText =
        "display: flex; gap: 10px; align-items: center;";
      const clearBtn = document.getElementById("clearFilterBtn");
      if (clearBtn) {
        clearBtn.parentNode.insertBefore(btnContainer, clearBtn);
        btnContainer.appendChild(clearBtn);
      }
    }

    // 古い戻るボタンがあれば削除
    document.getElementById("dynamicReturnBtn")?.remove();

    // 統計（Stats）以外から来た場合のみ「一覧へ戻る」ボタンを生成
    if (!window.filterQuery.fromStats) {
      const typeMap = {
        genre: "ジャンル",
        voiceActor: "声優",
        director: "監督",
        studio: "制作会社",
        year: "放送シーズン",
        year_season: "放送シーズン",
        character: "推しキャラ",
      };

      if (typeMap[window.filterQuery.type]) {
        const typeName = typeMap[window.filterQuery.type];
        const returnBtn = document.createElement("button");
        returnBtn.id = "dynamicReturnBtn";
        returnBtn.className = "pop-up-animation";
        returnBtn.style.cssText =
          "display: flex; align-items: center; gap: 4px; background: white; border: 1px solid #E2E8F0; color: #475569; font-size: 11px; font-weight: 700; font-family: var(--f-jp); padding: 8px 16px; border-radius: 99px; cursor: pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.02); transition: 0.2s;";
        returnBtn.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>${typeName}一覧へ戻る`;

        // ホバーエフェクト
        returnBtn.onmouseover = () => {
          returnBtn.style.borderColor = "#94A3B8";
          returnBtn.style.color = "#0F172A";
          returnBtn.style.background = "#F8FAFC";
        };
        returnBtn.onmouseout = () => {
          returnBtn.style.borderColor = "#E2E8F0";
          returnBtn.style.color = "#475569";
          returnBtn.style.background = "white";
        };

        // ボタンクリック時の戻り先ビューの判定
        returnBtn.onclick = () => {
          if (window.filterQuery.type === "character") {
            window.switchView("oshiChara");
          } else if (window.filterQuery.type === "year_season") {
            window.switchView("year");
          } else {
            window.switchView(window.filterQuery.type);
          }
        };

        const clearBtn = document.getElementById("clearFilterBtn");
        if (clearBtn) btnContainer.insertBefore(returnBtn, clearBtn);
      }
    }

    // データの条件フィルタリング実行
    filtered = filtered.filter((a) => {
      if (window.filterQuery.type === "search") {
        return a.title && a.title.includes(window.filterQuery.value);
      }
      if (window.filterQuery.type === "genre_high_score") {
        return (
          a.genres_jp &&
          a.genres_jp.includes(window.filterQuery.value) &&
          parseFloat(a.my_score || 0) >= 3.8
        );
      }
      if (window.filterQuery.type === "genre") {
        return a.genres_jp && a.genres_jp.includes(window.filterQuery.value);
      }
      if (window.filterQuery.type === "voiceActor") {
        return a.cast && a.cast.includes(window.filterQuery.value);
      }
      if (window.filterQuery.type === "director") {
        return a.director && a.director.includes(window.filterQuery.value);
      }
      if (window.filterQuery.type === "studio") {
        return a.studio === window.filterQuery.value;
      }
      if (window.filterQuery.type === "year") {
        return a.year == window.filterQuery.value;
      }
      if (window.filterQuery.type === "year_season") {
        const [targetYear, targetSeason] = window.filterQuery.value.split("-");
        return a.year == targetYear && a.season === targetSeason;
      }
      if (window.filterQuery.type === "character") {
        if (!a.characters) return false;
        try {
          const charList =
            typeof a.characters === "string"
              ? JSON.parse(a.characters)
              : a.characters;
          if (!Array.isArray(charList)) return false;
          return charList.some((c) => c.name === window.filterQuery.value);
        } catch (e) {
          return a.characters.includes(window.filterQuery.value);
        }
      }
      if (window.filterQuery.type === "genre_combo") {
        if (!a.genres_jp) return false;
        const targetGenres = window.filterQuery.value.split(" × ");
        return targetGenres.every((g) => a.genres_jp.includes(g));
      }
      if (
        window.filterQuery.type === "watch_status" &&
        window.filterQuery.value === "積みアニメ"
      ) {
        return (
          a.watch_status === "未履修" ||
          a.watch_status === "再履修" ||
          a.watch_status === "履修中"
        );
      }
      return true;
    });
  } else {
    // フィルターがない場合（通常のホーム表示）
    breadcrumb?.classList.add("hidden");

    // 統計スライドダウン画面を確実に閉じる
    const statsArea = document.getElementById("statsPageArea");
    if (statsArea) {
      statsArea.classList.add("hidden");
      statsArea.classList.remove("slide-down");
    }

    // 上部タブ（履修済・未履修など）のステータスフィルター適用
    if (window.currentFilter !== "ALL") {
      filtered = filtered.filter(
        (a) => a.watch_status === window.currentFilter,
      );
    }
  }

  // 3. 並び替え（ソート）ロジックの処理
  if (window.currentSort === "score") {
    filtered.sort(
      (a, b) => parseFloat(b.my_score || 0) - parseFloat(a.my_score || 0),
    );
  } else if (window.currentSort === "year") {
    filtered.sort((a, b) => parseInt(b.year || 0) - parseInt(a.year || 0));
  }

  // 4. アニメカードのHTML生成・描画
  const fragment = document.createDocumentFragment();
  filtered.forEach((anime) => {
    const score = window.getAvg({
      story: anime.score_story,
      visual: anime.score_visual,
      character: anime.score_character,
      music: anime.score_music,
      resonance: anime.score_resonance,
    });

    const statusLabel = anime.watch_status || "未履修";
    const statusClasses = {
      履修済: "status-watched",
      履修中: "status-watching",
      再履修: "status-rewatch",
      脱落: "status-dropped",
    };
    const statusClass = statusClasses[statusLabel] || "status-default";

    const card = document.createElement("div");
    card.className = "card pop-up-animation";
    card.onclick = () => window.openEditModal(anime.anilist_id);

    const imgPosition = anime.img_position || "center center";
    card.style.setProperty("--img-pos", imgPosition);

    const seasonText = anime.season
      ? `${anime.year || ""} ${anime.season}`
      : anime.year || "-";

    // 話数表示の組み立て（★スプシ置換＆修正後の綺麗なロジック）
    const infoParts = [];
    if (anime.format) {
      const currentFormatMap =
        typeof formatMap !== "undefined" ? formatMap : {};
      const displayFormat = currentFormatMap[anime.format] || anime.format;
      infoParts.push(displayFormat);
    }
    if (anime.episodes) {
      infoParts.push(`全${anime.episodes}話`);
    }
    const infoText = infoParts.join(" / ");

    card.innerHTML = `
      <div class="card-img-wrapper">
        <img src="${anime.cover_url}" class="card-img">
      </div>
      <h3 class="card-title">${anime.title}</h3>
      <div class="card-meta-container">
        <span class="meta-season-badge">${seasonText}</span>
        <span class="meta-info-text">${infoText}</span>
      </div>
      <div class="card-status-row">
        <div class="status-pill ${statusClass}">${statusLabel}</div>
        <div class="score-display">
          <span class="score-icon">★</span>
          <span class="score-num">${score}</span>
        </div>
      </div>
    `;
    fragment.appendChild(card);
  });
  grid.appendChild(fragment);
};

/**
 * 🌟 全画面の統合更新処理
 */
window.updateAllViews = function () {
  if (typeof window.renderFeed === "function") window.renderFeed();

  if (window.currentView === "home") {
    window.renderGrid();
  } else if (window.currentView === "oshiChara") {
    if (typeof window.renderGlobalOshiView === "function")
      window.renderGlobalOshiView();
  } else {
    if (typeof window.renderListView === "function")
      window.renderListView(window.currentView);
  }
};

/**
 * 🌟 イベントリスナー登録（フィルタータブ・ソート・クリア）
 */
const filterTabs = document.querySelectorAll(".filter-tab");
filterTabs.forEach((tab) => {
  tab.addEventListener("click", (e) => {
    filterTabs.forEach((t) => t.classList.remove("active"));
    e.target.classList.add("active");
    window.currentFilter = e.target.getAttribute("data-status");
    window.filterQuery = null;
    window.renderGrid();
  });
});

document.getElementById("sortSelect")?.addEventListener("change", (e) => {
  window.currentSort = e.target.value;
  window.renderGrid();
});

document.getElementById("clearFilterBtn")?.addEventListener("click", () => {
  window.filterQuery = null;
  const mainInput = document.getElementById("mainSearchInput");
  if (mainInput) mainInput.value = "";
  window.switchView("home");
});

// =========================================================
// 🔍 HOME画面専用：メイン検索・予測変換（サジェスト）機能
// =========================================================
document.getElementById("mainSearchInput")?.addEventListener("input", (e) => {
  const query = e.target.value.toLowerCase().trim();
  const suggestBox = document.getElementById("searchSuggestBox");
  if (query.length < 1) {
    suggestBox.classList.add("hidden");
    if (window.filterQuery && window.filterQuery.type === "search")
      window.filterQuery = null;
    window.renderGrid();
    return;
  }
  let suggestions = [];
  window.animeDB.forEach((a) => {
    if (a.title.toLowerCase().includes(query))
      suggestions.push({ type: "title", label: a.title, badge: "作品" });
    if (a.studio && a.studio.toLowerCase().includes(query))
      suggestions.push({ type: "studio", label: a.studio, badge: "制作" });
    if (a.director) {
      let name = a.director.replace(/[\r\n]/g, "").trim();
      if (name.toLowerCase().includes(query))
        suggestions.push({ type: "director", label: name, badge: "監督" });
    }
    if (a.cast) {
      a.cast.split(",").forEach((c) => {
        let name = c.replace(/[\r\n]/g, "").trim();
        if (name.toLowerCase().includes(query))
          suggestions.push({ type: "voiceActor", label: name, badge: "声優" });
      });
    }
  });
  let uniqueMap = new Map();
  suggestions.forEach((item) => {
    uniqueMap.set(item.label + item.type, item);
  });
  let uniqueList = Array.from(uniqueMap.values()).slice(0, 10);
  if (uniqueList.length > 0) {
    suggestBox.innerHTML = uniqueList
      .map((s) => {
        const displayLabel = s.label.replace(/\[[^\]]*\]/g, "").trim();
        const safeLabel = s.label.replace(/'/g, "\\'");
        return `<div class="suggest-item" onclick="window.applySearchSuggest('${s.type}', '${safeLabel}')"><span class="suggest-badge">${s.badge}</span> ${displayLabel}</div>`;
      })
      .join("");
    suggestBox.classList.remove("hidden");
  } else {
    suggestBox.classList.add("hidden");
  }
});
