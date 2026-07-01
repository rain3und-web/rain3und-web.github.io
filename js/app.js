// =========================================================
// 🧠 js/app.js：全体の統括・メインロジック（指令室）
// ユーザーがクリックしたり入力した時の「操作への反応」をすべてここに集約しています。
// =========================================================

window.animeDB = [];
window.currentFilter = "ALL";
window.currentSort = "new";
window.currentView = "home";
window.filterQuery = null;
window.listSortMode = "count";

// 💡 Adobe Fontsがブロックされた時のための「絶対表示タイマー」
setTimeout(function () {
  const htmlTag = document.getElementsByTagName("html")[0];
  // 3秒経ってもフォントが読み込めていなければ、強制表示用のクラスを付与
  if (!htmlTag.classList.contains("wf-active")) {
    htmlTag.classList.add("loading-delay");
  }
}, 3000);
// -----------------------------------------
// ① 起動時の初期データ読み込み
// -----------------------------------------
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
    // 💡 iPadなどの描画速度に合わせて、ブラウザのレンダリング完了を待ってから消す
    requestAnimationFrame(() => {
      setTimeout(() => {
        const overlay = document.getElementById("startupOverlay");
        if (overlay) overlay.classList.add("fade-out");
      }, 500); // 描画処理のバッファとして500msあれば十分安全です
    });
  }
}

// =========================================================
// 🖱️ ここから下は、画面が読み込まれた後に設定する「操作への反応」です
// =========================================================
document.addEventListener("DOMContentLoaded", () => {
  // -----------------------------------------
  // 🌟 追加：ナビゲーションボタンのアクティブ（紫色）状態切り替え
  // -----------------------------------------
  const navBtns = document.querySelectorAll(".nav-btn");
  navBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      // 一旦すべてのボタンから 'active' を外す
      navBtns.forEach((b) => b.classList.remove("active"));
      // クリックされたボタンにだけ 'active' を付ける
      e.currentTarget.classList.add("active");
    });
  });
  // -----------------------------------------

  // 🌟 修正：ジャンルパネルの開閉は、クラス（is-open）の付け外しのみに変更
  document.getElementById("genreToggleBtn")?.addEventListener("click", () => {
    // ラップトップサイズ（矢印が表示されている状態）の時だけクリックを有効にする魔法
    const icon = document.querySelector("#genreToggleBtn .toggle-icon");
    if (icon && window.getComputedStyle(icon).display !== "none") {
      document.getElementById("genrePanelBox").classList.toggle("is-open");
    }
  });

  // -----------------------------------------
  // ② 画面・UIの開閉アクション（メニュー・モーダル等）
  // -----------------------------------------
  const addAnimeBtn = document.getElementById("addAnimeBtn");
  const addPopup = document.getElementById("addPopup");
  addAnimeBtn?.addEventListener("click", (e) => {
    addPopup.classList.toggle("hidden");
    e.stopPropagation();
  });

  // 白いアイコンボタンで左カラムを開閉する処理
  const sidebarToggleBtn = document.getElementById("sidebarToggleBtn");
  const mainSidebar = document.getElementById("mainSidebar");
  const appContainer = document.querySelector(".app-container");

  sidebarToggleBtn?.addEventListener("click", () => {
    // 全体のGrid幅を変更するクラスと、中身を隠すクラスを両方つける
    appContainer.classList.toggle("is-sidebar-closed");
    mainSidebar.classList.toggle("is-closed");
  });
  document
    .getElementById("closeEditBtn")
    ?.addEventListener("click", () =>
      document.getElementById("editModal").classList.add("hidden"),
    );

  // ジャンル・声優の選択ポップアップ開閉
  document
    .getElementById("openGenrePopupBtn")
    ?.addEventListener("click", () => {
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
      if (listContainer) {
        listContainer.innerHTML = "";
        Object.values(genreMap).forEach((genreName) => {
          // genreMapはui.jsで定義
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
      }
    });

  document
    .getElementById("openActorPopupBtn")
    ?.addEventListener("click", () => {
      const actorPopup = document.getElementById("actorPopup");
      if (!actorPopup) return;
      actorPopup.classList.toggle("hidden");
      document.getElementById("genrePopup")?.classList.add("hidden");
      window.updateActorCurrentList();
    });

  // -----------------------------------------
  // ⑤ モーダルの入力補助（スコア連動・ステータス色変更・画像プレビュー）
  // -----------------------------------------
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

  // -----------------------------------------
  // ⑥ モーダル保存・削除（スプレッドシート連携）
  // -----------------------------------------
  document.getElementById("saveBtn")?.addEventListener("click", async () => {
    if (!window.currentUserId) {
      alert("データの保存にはログインが必要です！");
      return;
    }
    const btn = document.getElementById("saveBtn");
    btn.innerText = "Saving...";

    const anilist_id = String(document.getElementById("editAnilistId").value);

    // ★ 刺さり度を特別扱いにして、1.5倍で計算するロジックに変更！
    const scores = {};
    let totalScore = 0;
    let resonanceScore = 0;
    document.querySelectorAll(".score-val").forEach((sel) => {
      const val = parseInt(sel.value);
      scores[sel.dataset.type] = val;
      if (sel.dataset.type === "resonance") {
        resonanceScore = val; // 刺さり度だけ分ける
      } else {
        totalScore += val; // それ以外を足す
      }
    });
    // (4項目 + 刺さり度×1.5) ÷ 5.5 で計算
    const calculatedMyScore = parseFloat(
      ((totalScore + resonanceScore * 1.5) / 5.5).toFixed(1),
    );

    // 既存のデータがあるかチェック
    const existingIndex = window.animeDB.findIndex(
      (a) => String(a.anilist_id) === anilist_id,
    );
    const existingData =
      existingIndex !== -1 ? window.animeDB[existingIndex] : null;

    const animeData = {
      synopsis: document.getElementById("editSynopsis").value,

      anilist_id: anilist_id,
      title: document.getElementById("editTitle").value,
      cover_url: document.getElementById("editImgUrl").value,
      year: document.getElementById("editYear").value, // ★これが自由に書ける「放送時期」になります
      format: document.getElementById("editFormat").value,
      episodes: document.getElementById("editEps").value,
      duration: document.getElementById("editDuration")
        ? document.getElementById("editDuration").value
        : "", // ★安全に時間を取得
      genres: document.getElementById("editGenres").value,
      director:
        document.getElementById("editDirectorRaw").value ||
        document.getElementById("editDirector").value,
      studio: document.getElementById("editStudio").value,
      cast: document.getElementById("editVoiceActors").value,
      official_site: document.getElementById("editOfficialSite").value,
      watch_status: document.getElementById("editStatus").value,
      memo: document.getElementById("editMemo").value,
      characters: document.getElementById("editCharacters").value,
      my_score: calculatedMyScore,
      score_story: scores.story,
      score_visual: scores.visual,
      score_character: scores.character,
      score_music: scores.music,
      score_resonance: scores.resonance,
      created_at:
        existingData && existingData.created_at
          ? existingData.created_at
          : existingData && existingData.updated_at
            ? existingData.updated_at
            : Date.now(),
      img_position: document.getElementById("editImgPosition")
        ? document.getElementById("editImgPosition").value
        : "50% 50%",
      rewatch_count: document.getElementById("editRewatch").value, // ★追加
    };
    try {
      await saveAnimeToDB(window.currentUserId, anilist_id, animeData);
      document.getElementById("editModal").classList.add("hidden");
      animeData.updated_at = Date.now();
      animeData.genres_jp = window.translateGenres(animeData.genres);
      if (existingIndex !== -1) {
        window.animeDB[existingIndex] = animeData;
      } else {
        window.animeDB.push(animeData);
      }
      window.animeDB.sort((a, b) => (b.updated_at || 0) - (a.updated_at || 0));
      window.updateAllViews();
    } catch (e) {
      alert("保存エラーが発生しました");
      console.error(e);
    } finally {
      btn.innerText = "SAVE";
    }
  });

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

  // -----------------------------------------
  // ⑧ その他・外側クリックで閉じる処理やプルダウンの初期化
  // -----------------------------------------
  if (typeof window.setupCustomSelects === "function")
    window.setupCustomSelects();

  document.addEventListener("click", (e) => {
    // 自作プルダウン
    document
      .querySelectorAll(".cute-custom-options")
      .forEach((opt) => opt.classList.add("hidden"));

    // 検索サジェスト
    const suggestBox = document.getElementById("searchSuggestBox");
    const searchInput = document.getElementById("mainSearchInput");
    if (
      suggestBox &&
      !suggestBox.contains(e.target) &&
      e.target !== searchInput
    )
      suggestBox.classList.add("hidden");

    // 編集モーダル（外側クリックで閉じる）
    const editModal = document.getElementById("editModal");
    if (e.target === editModal) editModal.classList.add("hidden");

    // ジャンル・声優ポップアップ
    const genrePopup = document.getElementById("genrePopup");
    const genreBtn = document.getElementById("openGenrePopupBtn");
    if (genrePopup && !genrePopup.classList.contains("hidden")) {
      if (!genrePopup.contains(e.target) && !genreBtn?.contains(e.target))
        genrePopup.classList.add("hidden");
    }
    const actorPopup = document.getElementById("actorPopup");
    const actorBtn = document.getElementById("openActorPopupBtn");
    if (actorPopup && !actorPopup.classList.contains("hidden")) {
      if (!actorPopup.contains(e.target) && !actorBtn?.contains(e.target))
        actorPopup.classList.add("hidden");
    }

    // 監督サジェスト
    const dirSuggestBox = document.getElementById("directorSuggestBox");
    const dirSearchInput = document.getElementById("editDirector");
    if (dirSuggestBox && !dirSuggestBox.classList.contains("hidden")) {
      if (!dirSuggestBox.contains(e.target) && e.target !== dirSearchInput)
        dirSuggestBox.classList.add("hidden");
    }
  });

  // 起動時のデータ取得開始
  fetchData();
});
