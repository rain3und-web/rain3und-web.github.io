// =========================================================
// 🎨 js/ui.js：画面の描画・見た目の制御（UI専用）
// =========================================================

/**
 * ② 画面全体の切り替え・表示更新に関する制御
 */
window.switchView = function (viewType) {
  window.currentView = viewType;
  window.filterQuery = null;

  const areas = [
    "animeGrid",
    "listViewArea",
    "myPageArea",
    "oshiCharaArea",
    "trophyPageArea",
    "quoteLibraryArea",
    "statsPageArea",
  ];

  // 一旦すべての個別画面を隠す
  areas.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.add("hidden");
      if (id === "statsPageArea") el.classList.remove("slide-down");
    }
  });

  // 共通パーツの一時非表示
  document.getElementById("mainActionRow").style.display = "none";
  document.getElementById("mainFilterRow").style.display = "none";
  document.getElementById("breadcrumbArea").classList.add("hidden");
  document.getElementById("dynamicReturnBtn")?.remove(); // 戻るボタンの残像完全消滅魔法！

  // 目的の画面をピンポイントで覚醒
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
    document.getElementById("viewTitle").innerHTML = `推しキャラコレクション`;
    window.renderGlobalOshiView();
  } else if (viewType === "trophy") {
    document.getElementById("trophyPageArea").classList.remove("hidden");
    document.getElementById("breadcrumbArea").classList.remove("hidden");
    document.getElementById("viewTitle").innerHTML = `達成トロフィー`;
    if (typeof window.renderTrophyPage === "function")
      window.renderTrophyPage();
  } else if (viewType === "quoteLibrary") {
    document.getElementById("quoteLibraryArea").classList.remove("hidden");
    document.getElementById("breadcrumbArea").classList.remove("hidden");
    document.getElementById("viewTitle").innerHTML = `名言ライブラリ`;
    if (typeof window.renderQuoteLibraryPage === "function")
      window.renderQuoteLibraryPage();
  } else if (viewType === "stats") {
    document.getElementById("statsPageArea").classList.remove("hidden");
    window.renderStatsPage();
  } else {
    document.getElementById("listViewArea").classList.remove("hidden");
    window.renderListView(viewType);
  }

  // サイドパネルのボタンのアクティブ状態を完全同期
  const navBtns = document.querySelectorAll(".nav-btn");
  navBtns.forEach((btn) => {
    if (btn.getAttribute("data-view") === viewType) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  // スクロール位置のリセット
  setTimeout(() => {
    const scrollAreas = [
      "animeGrid",
      "listViewArea",
      "tagCloudContainer",
      "myPageArea",
      "oshiCharaArea",
      "statsPageArea",
      "trophyPageArea",
      "quoteLibraryArea",
    ];
    scrollAreas.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.scrollTop = 0;
    });
  }, 10);
};

/**
 * ③ データの絞り込みと画面連動処理
 */
window.applyFilter = function (type, value, fromStats = false) {
  window.filterQuery = { type, value, fromStats };
  window.currentView = "home";

  document.getElementById("mainActionRow").style.display = "flex";
  document.getElementById("mainFilterRow").style.display = "flex";
  document.getElementById("animeGrid").classList.remove("hidden");

  // 🌟【追加】推しキャラコレクション画面のコンテナを非表示にして隠す
  const oshiContainer = document.getElementById("oshiCharaArea");
  if (oshiContainer) {
    oshiContainer.classList.add("hidden");
  }

  const statsArea = document.getElementById("statsPageArea");
  if (fromStats && statsArea) {
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

/**
 * ④ モーダルやUI内部パーツの描画・更新に関する処理
 */

// 編集モーダル：現在の選択中声優リストの構築
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

// 編集モーダル：ジャンル選択ポップアップの内容生成
window.openGenreModalPopup = function () {
  const genrePopup = document.getElementById("genrePopup");
  if (!genrePopup) return;
  genrePopup.classList.toggle("hidden");
  document.getElementById("actorPopup")?.classList.add("hidden");

  const currentGenres = document
    .getElementById("editGenres")
    .value.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const listContainer = document.getElementById("genreCheckboxList");
  if (!listContainer) return;

  listContainer.innerHTML = "";
  // 💡注：genreMapが別ファイル定義の場合はwindow経由、または同階層で呼べる前提
  Object.values(genreMap).forEach((genreName) => {
    const isActive = currentGenres.includes(genreName);
    const div = document.createElement("div");
    div.className = `genre-check-label ${isActive ? "is-active" : ""}`;
    div.innerText = genreName;
    div.onclick = () => {
      let tags = document.getElementById("editGenres").value
        ? document
            .getElementById("editGenres")
            .value.split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];
      if (tags.includes(genreName)) {
        tags = tags.filter((t) => t !== genreName);
        div.classList.remove("is-active");
      } else {
        tags.push(genreName);
        div.classList.add("is-active");
      }
      document.getElementById("editGenres").value = tags.join(", ");
      window.renderGenres();
    };
    listContainer.appendChild(div);
  });
};

window.renderGenres = () =>
  window.renderCuteChips("editGenres", "genresTagsDisplay", true);
window.renderVoiceActors = () =>
  window.renderCuteChips("editVoiceActors", "voiceActorsTagsDisplay", false);

// 編集モーダル：監督の入力サジェスト生成
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
