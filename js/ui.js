// =========================================================
// 🎨 js/ui.js：画面の描画・見た目の制御（UI専用）
// =========================================================

// -----------------------------------------
// ② 画面全体の切り替え・更新に関する関数
// -----------------------------------------

window.switchView = function (viewType) {
  window.currentView = viewType;
  window.filterQuery = null;

  document.getElementById("animeGrid").classList.add("hidden");
  if (document.getElementById("listViewArea"))
    document.getElementById("listViewArea").classList.add("hidden");
  if (document.getElementById("myPageArea"))
    document.getElementById("myPageArea").classList.add("hidden");
  if (document.getElementById("oshiCharaArea"))
    document.getElementById("oshiCharaArea").classList.add("hidden");

  // ★ 統計画面を閉じる時はスライドダウンも確実に解除する！
  const statsArea = document.getElementById("statsPageArea");
  if (statsArea) {
    statsArea.classList.add("hidden");
    statsArea.classList.remove("slide-down");
  }

  document.getElementById("mainActionRow").style.display = "none";
  document.getElementById("mainFilterRow").style.display = "none";
  document.getElementById("breadcrumbArea").classList.add("hidden");

  if (viewType === "home") {
    document.getElementById("mainActionRow").style.display = "flex";
    document.getElementById("mainFilterRow").style.display = "flex";
    document.getElementById("animeGrid").classList.remove("hidden");
    window.renderGrid();
  } else if (viewType === "mypage") {
    document.getElementById("myPageArea").classList.remove("hidden");
  } else if (viewType === "oshiChara") {
    document.getElementById("oshiCharaArea").classList.remove("hidden");
    document.getElementById("breadcrumbArea").classList.remove("hidden");
    const goldHeartSvg = `<svg class="oshi-title-heart" viewBox="0 0 24 24" fill="#F9C106"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;
    document.getElementById("viewTitle").innerHTML =
      `${goldHeartSvg}推しキャラコレクション`;
    window.renderGlobalOshiView();
  } else if (viewType === "stats") {
    statsArea.classList.remove("hidden");
    // ★ 統計は独自ヘッダーを持たせたので、古いパンくずは隠す
    document.getElementById("breadcrumbArea").classList.add("hidden");
    window.renderStatsPage();
  } else {
    document.getElementById("listViewArea").classList.remove("hidden");
    window.renderListView(viewType);
  }

  setTimeout(() => {
    const scrollAreas = [
      "animeGrid",
      "listViewArea",
      "tagCloudContainer",
      "myPageArea",
      "oshiCharaArea",
      "statsPageArea",
    ];
    scrollAreas.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.scrollTop = 0;
    });
  }, 10);
};

// -----------------------------------------
// ③ 各種リストやカード一覧（グリッド）の描画関数
// -----------------------------------------

// ==========================================
// 💡 絞り込み実行（★スクロールを戻す魔法を追加）
// ==========================================
window.applyFilter = function (type, value, fromStats = false) {
  window.filterQuery = { type, value, fromStats };
  window.currentView = "home";

  document.getElementById("mainActionRow").style.display = "flex";
  document.getElementById("mainFilterRow").style.display = "flex";
  document.getElementById("animeGrid").classList.remove("hidden");

  const statsArea = document.getElementById("statsPageArea");
  if (fromStats && statsArea) {
    // ★これ！下の方のスタッフを押しても、一番上に戻してからスライドさせるので確実に文字が見える！
    statsArea.scrollTop = 0;
    statsArea.classList.add("slide-down");
  } else if (statsArea) {
    statsArea.classList.add("hidden");
    statsArea.classList.remove("slide-down");
  }

  window.renderGrid();

  setTimeout(() => {
    const grid = document.getElementById("animeGrid");
    if (grid) grid.scrollTop = 0;
  }, 10);
};

// -----------------------------------------
// ④ モーダルやUIパーツの更新に関する関数
// -----------------------------------------

window.updateActorCurrentList = function () {
  let rawVal = document.getElementById("editVoiceActors").value;
  let currentTags = rawVal
    ? rawVal
        .split(",")
        .map((s) => s.replace(/\n/g, "").trim())
        .filter(Boolean)
    : [];
  currentTags.sort((a, b) => {
    const getReading = (str) => {
      const match = str.match(/\[(.*?)\]/);
      return match ? match[1].toLowerCase() : str.toLowerCase();
    };
    return getReading(a).localeCompare(getReading(b));
  });
  document.getElementById("editVoiceActors").value = currentTags.join(", ");
  const listContainer = document.getElementById("actorCurrentList");
  if (!listContainer) return;
  listContainer.innerHTML = "";

  currentTags.forEach((tag, idx) => {
    const displayTag = tag.replace(/\[[\s\S]*?\]/g, "");
    const div = document.createElement("div");
    div.className = "actor-remove-item pop-up-animation";

    div.innerHTML = `<span class="actor-remove-name">${displayTag}</span> <button type="button" class="actor-remove-btn" data-idx="${idx}" title="削除">✕</button>`;
    div.querySelector(".actor-remove-btn").onclick = (e) => {
      const index = e.currentTarget.getAttribute("data-idx");
      let tags = document
        .getElementById("editVoiceActors")
        .value.split(",")
        .map((s) => s.replace(/\n/g, "").trim())
        .filter(Boolean);
      tags.splice(index, 1);
      document.getElementById("editVoiceActors").value = tags.join(", ");
      window.updateActorCurrentList();
      window.renderVoiceActors();
    };
    listContainer.appendChild(div);
  });
};

window.renderGenres = () =>
  window.renderCuteChips("editGenres", "genresTagsDisplay", true);
window.renderVoiceActors = () =>
  window.renderCuteChips("editVoiceActors", "voiceActorsTagsDisplay", false);

window.applySearchSuggest = function (type, value) {
  document.getElementById("mainSearchInput").value = "";
  document.getElementById("searchSuggestBox").classList.add("hidden");
  window.filterQuery = {
    type: type === "title" ? "search" : type,
    value: value,
  };
  window.currentView = "home";
  window.renderGrid();
};

let directorSearchTimeout;
window.searchDirectorSuggest = function (query) {
  clearTimeout(directorSearchTimeout);
  const suggestBox = document.getElementById("directorSuggestBox");
  if (!suggestBox) return;
  if (!query) {
    suggestBox.innerHTML = "";
    suggestBox.classList.add("hidden");
    return;
  }
  suggestBox.classList.remove("hidden");
  suggestBox.innerHTML = '<div class="suggest-message">検索中...</div>';
  directorSearchTimeout = setTimeout(async () => {
    try {
      const staffList = await window.fetchStaffFromAnilist(query);
      suggestBox.innerHTML = "";
      if (staffList && staffList.length > 0) {
        staffList.forEach((staff) => {
          const native = staff.name.native;
          const full = staff.name.full;
          let dName = native || full;
          if (native && full && native !== full) dName = `${native}[${full}]`;
          dName = dName.replace(/[\r\n]/g, "").trim();
          const displayTag = dName.replace(/\[[^\]]*\]/g, "").trim();
          const div = document.createElement("div");
          div.className = "suggest-item-row";
          div.innerText = displayTag;
          div.onclick = () => {
            document.getElementById("editDirector").value = displayTag;
            document.getElementById("editDirectorRaw").value = dName;
            suggestBox.innerHTML = "";
            suggestBox.classList.add("hidden");
          };
          suggestBox.appendChild(div);
        });
      } else {
        suggestBox.innerHTML = '<div class="suggest-message error">なし</div>';
      }
    } catch (err) {
      suggestBox.innerHTML = '<div class="suggest-message error">エラー</div>';
    }
  }, 400);
};
