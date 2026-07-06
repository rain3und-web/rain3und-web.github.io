// =========================================================
// 🧠 js/app.js：全体の統括・メインロジック（指令室）
// =========================================================

window.animeDB = [];
window.currentFilter = "ALL";
window.currentSort = "new";
window.currentView = "home";
window.filterQuery = null;
window.listSortMode = "count";

// 💡 Adobe Fonts用絶対表示タイマー
setTimeout(function () {
  const htmlTag = document.getElementsByTagName("html")[0];
  if (!htmlTag.classList.contains("wf-active")) {
    htmlTag.classList.add("loading-delay");
  }
}, 3000);

/**
 * ① 起動時の初期データ読み込み
 */
async function fetchData() {
  if (!window.currentUserId) return;
  try {
    const data = await getAnimeDataFromDB(window.currentUserId);
    window.animeDB = data.map((a) => {
      let cleanCast = a.cast ? a.cast.replace(/[\r\n]/g, "") : "";
      let jpStudio = window.translateStudio(a.studio);
      return {
        ...a,
        genres_jp: window.translateGenres(a.genres),
        studio: jpStudio,
        cast: cleanCast,
      };
    });
    window.updateAllViews();
  } catch (e) {
    console.error("データ読み込みエラー:", e);
    window.updateAllViews();
  } finally {
    requestAnimationFrame(() => {
      setTimeout(() => {
        const overlay = document.getElementById("startupOverlay");
        if (overlay) overlay.classList.add("fade-out");
      }, 500);
    });
  }
}

/**
 * 🖱️ イベントリスナー（DOM構築後の操作の反応をすべて集約）
 */
document.addEventListener("DOMContentLoaded", () => {
  // 1. ナビゲーションボタン
  const navBtns = document.querySelectorAll(".nav-btn");
  navBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const targetView = e.currentTarget.getAttribute("data-view");
      if (targetView) window.switchView(targetView);
    });
  });

  // 2. 左カラム（サイドバー）の開閉
  document.getElementById("sidebarToggleBtn")?.addEventListener("click", () => {
    document
      .querySelector(".app-container")
      .classList.toggle("is-sidebar-closed");
    document.getElementById("mainSidebar").classList.toggle("is-closed");
  });

  // 3. ホーム画面：ジャンルパネルの開閉トグル
  document.getElementById("genreToggleBtn")?.addEventListener("click", () => {
    const icon = document.querySelector("#genreToggleBtn .toggle-icon");
    if (icon && window.getComputedStyle(icon).display !== "none") {
      document.getElementById("genrePanelBox").classList.toggle("is-open");
    }
  });

  // 4. アニメ追加ポップアップトグル
  document.getElementById("addAnimeBtn")?.addEventListener("click", (e) => {
    document.getElementById("addPopup").classList.toggle("hidden");
    e.stopPropagation();
  });

  // 5. 編集モーダル：お気に入り（栞）ボタン
  const favBtn = document.getElementById("favoriteBtn");
  if (favBtn) {
    favBtn.onclick = function (e) {
      e.stopPropagation();
      const isFav = favBtn.getAttribute("data-favorite") === "true";
      const nextState = !isFav;
      favBtn.setAttribute("data-favorite", String(nextState));
      favBtn.style.transform = nextState ? "scale(1.2)" : "scale(1.0)";
      setTimeout(() => {
        favBtn.style.transform = "scale(1.0)";
      }, 150);
    };
  }

  // 6. 編集モーダル：名言追加ボタン
  document.getElementById("addQuoteLineBtn")?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (typeof window.addQuoteRow === "function") window.addQuoteRow("", "");
  });

  // 7. 編集モーダル：ジャンル・声優選択ポップアップを開く
  document
    .getElementById("openGenrePopupBtn")
    ?.addEventListener("click", () => {
      if (typeof window.openGenreModalPopup === "function")
        window.openGenreModalPopup();
    });
  document
    .getElementById("openActorPopupBtn")
    ?.addEventListener("click", () => {
      document.getElementById("actorPopup")?.classList.toggle("hidden");
      document.getElementById("genrePopup")?.classList.add("hidden");
      if (typeof window.updateActorCurrentList === "function")
        window.updateActorCurrentList();
    });

  // 8. 編集モーダル：閉じる処理とお掃除
  document.getElementById("closeEditBtn")?.addEventListener("click", () => {
    document.getElementById("editModal").classList.add("hidden");
    const fav = document.getElementById("favoriteBtn");
    if (fav) {
      fav.setAttribute("data-favorite", "false");
      fav.style.color = "#cbd5e1";
    }
    const quoteContainer = document.getElementById("quoteListContainer");
    if (quoteContainer) quoteContainer.innerHTML = "";
  });

  // 9. 編集モーダル：入力補助関連の連動
  document
    .getElementById("editStatus")
    ?.addEventListener("change", window.updateStatusColor);
  document
    .querySelectorAll(".score-val")
    .forEach((input) =>
      input.addEventListener("change", window.updateModalScore),
    );
  document.getElementById("editImgUrl")?.addEventListener("input", (e) => {
    const preview = document.getElementById("editImgPreview");
    if (preview) preview.src = e.target.value;
  });

  // 10. 編集モーダル：保存アクション（スプレッドシート連携）
  document.getElementById("saveBtn")?.addEventListener("click", async () => {
    if (!window.currentUserId) return;
    const btn = document.getElementById("saveBtn");
    btn.innerText = "Saving...";

    const anilist_id = String(document.getElementById("editAnilistId").value);
    const scores = {};
    let totalScore = 0;
    let resonanceScore = 0;

    document.querySelectorAll(".score-val").forEach((sel) => {
      const val = parseInt(sel.value);
      scores[sel.dataset.type] = val;
      if (sel.dataset.type === "resonance") resonanceScore = val;
      else totalScore += val;
    });

    const calculatedMyScore = parseFloat(
      ((totalScore + resonanceScore * 1.5) / 5.5).toFixed(1),
    );
    const existingIndex = window.animeDB.findIndex(
      (a) => String(a.anilist_id) === anilist_id,
    );
    const existingData =
      existingIndex !== -1 ? window.animeDB[existingIndex] : null;
    const nowTimestamp = Date.now();

    // 年・季節の自動分解ロジック
    const rawYearInput = document.getElementById("editYear").value.trim();
    const yearMatch = rawYearInput.match(/\d{4}/);
    const parsedYear = yearMatch ? yearMatch[0] : rawYearInput;

    let parsedSeason = "";
    if (rawYearInput.includes("春")) parsedSeason = "春";
    else if (rawYearInput.includes("夏")) parsedSeason = "夏";
    else if (rawYearInput.includes("秋")) parsedSeason = "秋";
    else if (rawYearInput.includes("冬")) parsedSeason = "冬";
    else
      parsedSeason =
        existingData && existingData.season ? existingData.season : "";

    const animeData = {
      anilist_id: anilist_id,
      title: document.getElementById("editTitle").value,
      watch_status: document.getElementById("editStatus").value,
      my_score: calculatedMyScore,
      score_story: scores.story,
      score_visual: scores.visual,
      score_character: scores.character,
      score_music: scores.music,
      score_resonance: scores.resonance,
      format: document.getElementById("editFormat").value,
      year: parsedYear,
      season: parsedSeason,
      episodes: document.getElementById("editEps").value,
      duration: document.getElementById("editDuration")
        ? document.getElementById("editDuration").value
        : "0",
      rewatch_count: document.getElementById("editRewatch")
        ? document.getElementById("editRewatch").value
        : "1",
      synopsis: document.getElementById("editSynopsis").value,
      genres: document.getElementById("editGenres").value,
      director:
        document.getElementById("editDirectorRaw").value ||
        document.getElementById("editDirector").value,
      studio: document.getElementById("editStudio").value,
      cast: document.getElementById("editVoiceActors").value,
      cover_url: document.getElementById("editImgUrl").value,
      official_site: document.getElementById("editOfficialSite").value,
      created_at:
        existingData && existingData.created_at
          ? existingData.created_at
          : nowTimestamp,
      updated_at: nowTimestamp,
      img_position: document.getElementById("editImgPosition")
        ? document.getElementById("editImgPosition").value
        : "50% 50%",
      memo: document.getElementById("editMemo").value,
      is_favorite:
        document
          .getElementById("favoriteBtn")
          ?.getAttribute("data-favorite") === "true"
          ? "true"
          : "false",
      favorite_quotes:
        typeof window.collectQuoteDataDataStr === "function"
          ? window.collectQuoteDataDataStr()
          : "",
      characters: (() => {
        const raw = document.getElementById("editCharacters")?.value || "[]";
        try {
          return raw.startsWith("[") || raw.startsWith("{")
            ? JSON.parse(raw)
            : raw;
        } catch (e) {
          return raw;
        }
      })(),
    };

    try {
      await saveAnimeToDB(window.currentUserId, anilist_id, animeData);
      document.getElementById("editModal").classList.add("hidden");

      animeData.genres_jp = window.translateGenres(animeData.genres);
      animeData.studio = window.translateStudio(animeData.studio);
      if (animeData.cast)
        animeData.cast = animeData.cast.replace(/[\r\n]/g, "");
      animeData.is_favorite =
        document
          .getElementById("favoriteBtn")
          ?.getAttribute("data-favorite") === "true"
          ? "true"
          : "false";

      if (existingIndex !== -1) {
        window.animeDB[existingIndex] = animeData;
      } else {
        window.animeDB.push(animeData);
      }

      window.animeDB.sort((a, b) => (b.updated_at || 0) - (a.updated_at || 0));
      window.updateAllViews();
    } catch (e) {
      console.error("スプレッドシートへの保存に失敗しました:", e);
    } finally {
      btn.innerText = "SAVE";
    }
  });

  // 11. 編集モーダル：削除アクション
  document.getElementById("deleteBtn")?.addEventListener("click", () => {
    if (!window.currentUserId) return;
    const anilist_id = document.getElementById("editAnilistId").value;
    if (!anilist_id) return;

    const confirmModal = document.getElementById("customConfirmModal");
    confirmModal.classList.remove("hidden");

    document.getElementById("confirmCancelBtn").onclick = () =>
      confirmModal.classList.add("hidden");
    document.getElementById("confirmDeleteBtn").onclick = async () => {
      confirmModal.classList.add("hidden");
      try {
        await deleteAnimeFromDB(window.currentUserId, anilist_id);
        document.getElementById("editModal").classList.add("hidden");
        window.animeDB = window.animeDB.filter(
          (a) => String(a.anilist_id) !== String(anilist_id),
        );
        window.updateAllViews();
      } catch (e) {
        alert("エラーが発生しました: " + e.message);
      }
    };
  });

  // 12. 外側クリック判定による各種UI閉じ処理一括
  document.addEventListener("click", (e) => {
    document
      .querySelectorAll(".cute-custom-options")
      .forEach((opt) => opt.classList.add("hidden"));

    const suggestBox = document.getElementById("searchSuggestBox");
    const searchInput = document.getElementById("mainSearchInput");
    if (
      suggestBox &&
      !suggestBox.contains(e.target) &&
      e.target !== searchInput
    )
      suggestBox.classList.add("hidden");

    if (e.target === document.getElementById("editModal")) {
      document.getElementById("editModal").classList.add("hidden");
      const quoteContainer = document.getElementById("quoteListContainer");
      if (quoteContainer) quoteContainer.innerHTML = "";
    }

    const genrePopup = document.getElementById("genrePopup");
    const genreBtn = document.getElementById("openGenrePopupBtn");
    if (
      genrePopup &&
      !genrePopup.classList.contains("hidden") &&
      !genrePopup.contains(e.target) &&
      !genreBtn?.contains(e.target)
    ) {
      genrePopup.classList.add("hidden");
    }

    const actorPopup = document.getElementById("actorPopup");
    const actorBtn = document.getElementById("openActorPopupBtn");
    if (
      actorPopup &&
      !actorPopup.classList.contains("hidden") &&
      !actorPopup.contains(e.target) &&
      !actorBtn?.contains(e.target)
    ) {
      actorPopup.classList.add("hidden");
    }

    const dirSuggestBox = document.getElementById("directorSuggestBox");
    const dirSearchInput = document.getElementById("editDirector");
    if (
      dirSuggestBox &&
      !dirSuggestBox.classList.contains("hidden") &&
      !dirSuggestBox.contains(e.target) &&
      e.target !== dirSearchInput
    ) {
      dirSuggestBox.classList.add("hidden");
    }

    const charaContainer = document.getElementById("charaSearchContainer");
    if (
      charaContainer &&
      !charaContainer.classList.contains("hidden") &&
      !charaContainer.contains(e.target)
    ) {
      charaContainer.classList.add("hidden");
    }
  });

  // 13. 声優欄折りたたみ状態管理の初期化
  const toggleVaBtn = document.getElementById("toggleVaBtn");
  const vaWrapper = document.getElementById("voiceActorWrapper");
  if (toggleVaBtn && vaWrapper) {
    const isCollapsed =
      localStorage.getItem("isVoiceActorCollapsed") === "true";
    if (isCollapsed) {
      vaWrapper.classList.add("hidden");
      toggleVaBtn.innerText = "声優欄を展開する ▼";
    } else {
      vaWrapper.classList.remove("hidden");
      toggleVaBtn.innerText = "声優欄を折りたたむ ▲";
    }

    toggleVaBtn.onclick = function (e) {
      e.stopPropagation();
      vaWrapper.classList.toggle("hidden");
      const closed = vaWrapper.classList.contains("hidden");
      toggleVaBtn.innerText = closed
        ? "声優欄を展開する ▼"
        : "声優欄を折りたたむ ▲";
      localStorage.setItem("isVoiceActorCollapsed", closed ? "true" : "false");
    };

    document
      .getElementById("openActorPopupBtn")
      ?.addEventListener("click", () => {
        if (vaWrapper.classList.contains("hidden")) {
          vaWrapper.classList.remove("hidden");
          toggleVaBtn.innerText = "声優欄を折りたたむ ▲";
          localStorage.setItem("isVoiceActorCollapsed", "false");
        }
      });
  }

  // 各種カスタムプルダウンの初期化
  if (typeof window.setupCustomSelects === "function")
    window.setupCustomSelects();

  // 初回データ取得
  fetchData();
});
