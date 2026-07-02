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
      return; // 💡 ログインなし時は静かに中断
    }
    const btn = document.getElementById("saveBtn");
    btn.innerText = "Saving...";

    const anilist_id = String(document.getElementById("editAnilistId").value);

    // ★ 刺さり度を特別扱いにして、1.5倍で計算するロジック
    const scores = {};
    let totalScore = 0;
    let resonanceScore = 0;
    document.querySelectorAll(".score-val").forEach((sel) => {
      const val = parseInt(sel.value);
      scores[sel.dataset.type] = val;
      if (sel.dataset.type === "resonance") {
        resonanceScore = val;
      } else {
        totalScore += val;
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

    const nowTimestamp = Date.now();

    // 🌟【ここから追加！】画面に入力された「2026春」などの文字を自動で分解するロジック
    const rawYearInput = document.getElementById("editYear").value.trim(); // 例: "2026春"

    // 1. 数字の4桁を抽出して「年」にする
    const yearMatch = rawYearInput.match(/\d{4}/);
    const parsedYear = yearMatch ? yearMatch[0] : rawYearInput; // 4桁の数字が取れればそれ、取れなければ入力文字をそのまま

    // 2. 文字列の中に「春・夏・秋・冬」が含まれているか探して「季節」を抜き出す
    let parsedSeason = "";
    if (rawYearInput.includes("春")) parsedSeason = "春";
    else if (rawYearInput.includes("夏")) parsedSeason = "夏";
    else if (rawYearInput.includes("秋")) parsedSeason = "秋";
    else if (rawYearInput.includes("冬")) parsedSeason = "冬";
    else {
      // もし画面の入力欄に季節が書かれていなかった場合（例: 長寿アニメで「1999」とだけ書いた時）
      // 既存のデータがあればその漢字の季節を引き継ぎ、なければ空文字にする
      parsedSeason =
        existingData && existingData.season ? existingData.season : "";
    }

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

      // 🌟【ここを書き換え！】自動分解したデータをそれぞれ格納します
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
      // 1. api.js側のスマート保存を呼び出し
      await saveAnimeToDB(window.currentUserId, anilist_id, animeData);

      // モーダルを静かに閉じる
      document.getElementById("editModal").classList.add("hidden");

      // 2. ローカル表示用の日本語翻訳などをトッピング
      animeData.genres_jp = window.translateGenres(animeData.genres);
      animeData.studio = window.translateStudio(animeData.studio);
      if (animeData.cast)
        animeData.cast = animeData.cast.replace(/[\r\n]/g, "");

      // 3. メモリ上の配列（window.animeDB）を更新
      if (existingIndex !== -1) {
        window.animeDB[existingIndex] = animeData;
      } else {
        window.animeDB.push(animeData);
      }

      // 4. 並び替えて画面をパッと静かにリフレッシュ
      window.animeDB.sort((a, b) => (b.updated_at || 0) - (a.updated_at || 0));
      window.updateAllViews();

      // 💡 alert("保存が完了しました！") は綺麗さっぱり消去しました
    } catch (e) {
      // 💡 画面上の不快なエラーポップアップも廃止し、デベロッパーツール（コンソール）にだけログを出すように変更
      console.error("スプレッドシートへの保存に失敗しました:", e);
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
