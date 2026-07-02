// =========================================================
// 🧩 js/components/modal.js：アニメ追加・編集モーダルの処理
// =========================================================

// タグ（ジャンル・声優）の可愛いチップ型表示
window.renderCuteChips = function (hiddenInputId, displayContainerId, isGenre) {
  const rawVal = document.getElementById(hiddenInputId).value;
  const container = document.getElementById(displayContainerId);
  if (!container) return;
  container.innerHTML = "";
  if (!rawVal) return;
  const items = rawVal
    .split(",")
    .map((s) => s.replace(/\n/g, "").trim())
    .filter(Boolean);
  items.forEach((item) => {
    const displayTag = item.replace(/\[[\s\S]*?\]/g, "");
    const chip = document.createElement("div");
    chip.className = "cute-chip pop-up-animation";
    if (isGenre) {
      const colors = [
        { bg: "#DBEAFE", text: "#1D4ED8" },
        { bg: "#FEF3C7", text: "#B45309" },
        { bg: "#FCE7F3", text: "#BE185D" },
        { bg: "#D1FAE5", text: "#047857" },
        { bg: "#F3E8FF", text: "#6B21A8" },
        { bg: "#FFEDD5", text: "#C2410C" },
        { bg: "#E0E7FF", text: "#4338CA" },
      ];
      let hash = 0;
      for (let i = 0; i < displayTag.length; i++) {
        hash = displayTag.charCodeAt(i) + ((hash << 5) - hash);
      }
      const color = colors[Math.abs(hash) % colors.length];
      chip.style.backgroundColor = color.bg;
      chip.style.color = color.text;
      chip.style.borderColor = color.bg;
    }
    chip.innerText = displayTag;
    container.appendChild(chip);
  });
};

// モーダル内のスコア（点数）更新処理
window.updateModalScore = function () {
  let total = 0;
  let res = 0;
  const scores = {};

  document.querySelectorAll(".score-val").forEach((inp) => {
    const val = parseInt(inp.value, 10) || 0;
    scores[inp.dataset.type] = val;
    if (inp.dataset.type === "resonance") res = val;
    else total += val;

    // ==========================================
    // ✨ 【ここをあなたのファイルに永続追加！】
    // ==========================================
    const type = inp.dataset.type;
    const display =
      document.getElementById(`${type}ScoreDisplay`) ||
      inp.parentElement.querySelector(".score-num, span, div");
    if (display) {
      display.innerText = val;
    }
    // ==========================================
  });

  const scoreElement = document.getElementById("myScoreValue");
  const overallScore = (total + res * 1.5) / 5.5;
  if (scoreElement)
    scoreElement.innerText = ((total + res * 1.5) / 5.5).toFixed(1);

  const starsFg = document.getElementById("overallStarsFg");
  if (starsFg) {
    // 例：4.3点なら、(4.3 / 5) * 100 = 86%
    const percentage = (overallScore / 5.0) * 100;
    starsFg.style.width = `${percentage}%`;
  }
  const getP = (val, angle) => {
    const r = (val / 5) * 45;
    const rad = (angle - 90) * (Math.PI / 180);
    return { x: 50 + r * Math.cos(rad), y: 50 + r * Math.sin(rad) };
  };
  const pt1 = getP(scores.story, 0);
  const pt2 = getP(scores.visual, 72);
  const pt3 = getP(scores.music, 144);
  const pt4 = getP(scores.resonance, 216);
  const pt5 = getP(scores.character, 288);

  const polygon = document.querySelector(".radar-value-polygon");
  if (polygon)
    polygon.setAttribute(
      "points",
      `${pt1.x},${pt1.y} ${pt2.x},${pt2.y} ${pt3.x},${pt3.y} ${pt4.x},${pt4.y} ${pt5.x},${pt5.y}`,
    );
  const setCircle = (id, pt) => {
    const c = document.getElementById(id);
    if (c) {
      c.setAttribute("cx", pt.x);
      c.setAttribute("cy", pt.y);
    }
  };
  setCircle("pt-story", pt1);
  setCircle("pt-visual", pt2);
  setCircle("pt-music", pt3);
  setCircle("pt-resonance", pt4);
  setCircle("pt-character", pt5);
};

// アニメ追加・編集モーダルを開いてデータをセットする（超大作・URL連動版）
window.openEditModal = async function (anilist_id, presetData = null) {
  const addPopup = document.getElementById("addPopup");
  if (addPopup) addPopup.classList.add("hidden");

  const editModal = document.getElementById("editModal");
  if (editModal) {
    editModal.classList.remove("hidden");
    editModal.scrollTop = 0; // 1. モーダル外枠のリセット

    // 💡 2. モーダル内にあるすべての「スクロールバーを持つ可能性のあるパネルやコンテナ」を全強制リセット
    editModal.querySelectorAll("div").forEach((el) => {
      if (el.scrollTop > 0 || el.scrollHeight > el.clientHeight) {
        el.scrollTop = 0;
      }
    });
  }

  let targetId = null;

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val || "";
  };

  // =========================================================================
  // 🧹 🔥 【超重要】モーダルを開いた瞬間に、前のアニメの残骸を完全に全リセット！
  // =========================================================================
  // 1. テキスト入力・隠しインプット群をすべて空っぽにする
  setVal("editAnilistId", "");
  setVal("editTitle", "");
  setVal("editImgUrl", "");
  setVal("editYear", "");
  setVal("editFormat", "");
  setVal("editEps", "");
  setVal("editDuration", "");
  setVal("editStudio", "");
  setVal("editVoiceActors", "");
  setVal("editGenres", "");
  setVal("editDirector", "");
  setVal("editDirectorRaw", "");
  setVal("editOfficialSite", "");
  setVal("editCharacters", "[]");
  setVal("editMemo", "");
  setVal("editSynopsis", "");

  // 2. 履修ステータスをデフォルトの「履修済」に強制リセット
  setVal("editStatus", "履修済");
  const triggerText = document.querySelector(
    "#customStatusTrigger .status-trigger-text",
  );
  if (triggerText) triggerText.textContent = "履修済";
  const triggerBtn = document.getElementById("customStatusTrigger");
  if (triggerBtn) triggerBtn.setAttribute("data-status", "default"); // default = 履修済のデザイン

  // 3. 周回カウンターを「1周目」に絶対強制リセット
  setVal("editRewatch", "1");
  const rewatchDisplay = document.getElementById("rewatchCount");
  if (rewatchDisplay) rewatchDisplay.textContent = "1";

  // 4. スライダー評価（スコア）をすべて「0」にリセット
  document.querySelectorAll(".score-val").forEach((el) => {
    el.value = 0;
  });

  // 5. 画像プレビューを初期化
  if (document.getElementById("editImgPreview")) {
    document.getElementById("editImgPreview").src = "";
  }
  // =========================================================================

  // あとで使うための共通変数を用意
  let defaultImgUrl = "";
  let savedImgPosition = "50% 50%"; // 💡 初期値

  if (presetData) {
    targetId = presetData.anilist_id;
    setVal("editAnilistId", presetData.anilist_id);

    setVal("editSynopsis", presetData.synopsis || presetData.description || "");
    defaultImgUrl = presetData.img || "";
    savedImgPosition = presetData.img_position || "50% 50%"; // 💡 保存データから取得
    if (document.getElementById("editImgPreview"))
      document.getElementById("editImgPreview").src = defaultImgUrl;
    setVal("editImgUrl", defaultImgUrl);

    setVal("editTitle", presetData.title);
    // 🌟【ここを差し替え！】既存のDBデータを最優先し、空っぽなら裏のアニリストデータを見る
    const presetYear = presetData.year || "";
    const presetSeason = presetData.season || "";

    if (presetYear && !/[春夏秋冬]/.test(presetYear)) {
      // 1. まずDBにシーズン（英語か漢字）が入っていればそれを翻訳して合体
      if (presetSeason) {
        const translatedSeason = window.translateSeason
          ? window.translateSeason(presetSeason)
          : presetSeason;
        setVal("editYear", `${presetYear}${translatedSeason}`);
        // 2. DBが空っぽで、裏にアニリストのデータがあればそこから合体
      } else if (
        window.currentActiveAnime &&
        window.currentActiveAnime.season
      ) {
        const aniSeason = window.translateSeason
          ? window.translateSeason(window.currentActiveAnime.season)
          : "";
        setVal("editYear", `${presetYear}${aniSeason}`);
      } else {
        setVal("editYear", presetYear);
      }
    } else {
      setVal("editYear", presetYear);
    }

    setVal("editFormat", presetData.format);
    setVal("editFormat", presetData.format);
    setVal("editEps", presetData.eps);
    setVal("editDuration", presetData.duration);
    setVal("editStudio", presetData.studio);
    setVal("editVoiceActors", presetData.castStr);
    setVal("editGenres", presetData.genres);

    const rawDirPreset = presetData.director || "";
    setVal("editDirector", rawDirPreset.replace(/\[[^\]]*\]/g, "").trim());
    setVal("editDirectorRaw", rawDirPreset);

    setVal("editOfficialSite", presetData.officialSite);
    setVal("editCharacters", presetData.characters || "[]");

    // データがあればそれをセット、なければ上でリセットした「履修済」が活きる
    if (presetData.watch_status) {
      setVal("editStatus", presetData.watch_status);
      if (triggerText) triggerText.textContent = presetData.watch_status;
      // カスタムセレクトの枠色などの属性調整（もしあれば）
      if (triggerBtn) {
        if (presetData.watch_status === "履修中")
          triggerBtn.setAttribute("data-status", "watching");
        else if (presetData.watch_status === "再履修")
          triggerBtn.setAttribute("data-status", "rewatch");
        else if (presetData.watch_status === "脱落")
          triggerBtn.setAttribute("data-status", "dropped");
        else triggerBtn.setAttribute("data-status", "default");
      }
    }

    setVal("editMemo", presetData.memo);

    const count = parseInt(presetData.rewatch_count) || 1;
    setVal("editRewatch", count);
    if (rewatchDisplay) {
      rewatchDisplay.textContent = count;
    }

    document.querySelector('.score-val[data-type="story"]').value =
      presetData.score_story || 0;
    document.querySelector('.score-val[data-type="visual"]').value =
      presetData.score_visual || 0;
    document.querySelector('.score-val[data-type="character"]').value =
      presetData.score_character || 0;
    document.querySelector('.score-val[data-type="music"]').value =
      presetData.score_music || 0;
    document.querySelector('.score-val[data-type="resonance"]').value =
      presetData.score_resonance || 0;
  } else {
    const anime = window.animeDB.find(
      (a) => String(a.anilist_id) === String(anilist_id),
    );
    if (!anime) return;
    targetId = anime.anilist_id;
    setVal("editAnilistId", anime.anilist_id);

    defaultImgUrl = anime.cover_url || "";
    savedImgPosition = anime.img_position || "50% 50%"; // 💡 保存データから取得
    if (document.getElementById("editImgPreview"))
      document.getElementById("editImgPreview").src = defaultImgUrl;
    setVal("editImgUrl", defaultImgUrl);

    setVal("editTitle", anime.title);
    // 🌟【ここを差し替え！】マイリストから開くときも同様に、DB優先 ➔ なければアニリスト
    const animeYear = anime.year || "";
    const animeSeason = anime.season || "";

    if (animeYear && !/[春夏秋冬]/.test(animeYear)) {
      // 1. まずDBにシーズンが入っていればそれを合体
      if (animeSeason) {
        const translatedSeason = window.translateSeason
          ? window.translateSeason(animeSeason)
          : animeSeason;
        setVal("editYear", `${animeYear}${translatedSeason}`);
        // 2. なければ裏のアニリストデータから合体
      } else if (
        window.currentActiveAnime &&
        window.currentActiveAnime.season
      ) {
        const aniSeason = window.translateSeason
          ? window.translateSeason(window.currentActiveAnime.season)
          : "";
        setVal("editYear", `${animeYear}${aniSeason}`);
      } else {
        setVal("editYear", animeYear);
      }
    } else {
      setVal("editYear", animeYear);
    }
    setVal("editFormat", anime.format);
    setVal("editEps", anime.episodes);
    setVal("editDuration", anime.duration);
    setVal("editStudio", anime.studio);
    setVal("editGenres", anime.genres_jp || anime.genres);

    const rawDirAnime = anime.director || "";
    setVal("editDirector", rawDirAnime.replace(/\[[^\]]*\]/g, "").trim());
    setVal("editDirectorRaw", rawDirAnime);

    setVal("editOfficialSite", anime.official_site);
    setVal("editCharacters", anime.characters || "[]");

    let castStr = "";
    if (anime.cast) {
      try {
        castStr =
          typeof anime.cast === "string"
            ? JSON.parse(anime.cast).join(", ")
            : anime.cast.join(", ");
      } catch (e) {
        castStr = anime.cast;
      }
    }
    setVal("editVoiceActors", castStr);

    if (anime.watch_status) {
      setVal("editStatus", anime.watch_status);
      if (triggerText) triggerText.textContent = anime.watch_status;
      if (triggerBtn) {
        if (anime.watch_status === "履修中")
          triggerBtn.setAttribute("data-status", "watching");
        else if (anime.watch_status === "再履修")
          triggerBtn.setAttribute("data-status", "rewatch");
        else if (anime.watch_status === "脱落")
          triggerBtn.setAttribute("data-status", "dropped");
        else triggerBtn.setAttribute("data-status", "default");
      }
    }

    setVal("editMemo", anime.memo);
    setVal("editSynopsis", anime.synopsis || anime.description || "");

    const count = parseInt(anime.rewatch_count) || 1;
    setVal("editRewatch", count);
    if (rewatchDisplay) {
      rewatchDisplay.textContent = count;
    }

    document.querySelector('.score-val[data-type="story"]').value =
      anime.score_story || 0;
    document.querySelector('.score-val[data-type="visual"]').value =
      anime.score_visual || 0;
    document.querySelector('.score-val[data-type="character"]').value =
      anime.score_character || 0;
    document.querySelector('.score-val[data-type="music"]').value =
      anime.score_music || 0;
    document.querySelector('.score-val[data-type="resonance"]').value =
      anime.score_resonance || 0;
  }

  // 💡 最後に星の幅とレーダーチャートのUIを現在のスコア（または0）に合わせて再描画させる
  if (window.updateModalScore) window.updateModalScore();

  // 💡【ここを追加！】リセットされて消えてしまったジャンルと声優の可愛いチップを画面に復活させる！
  if (window.renderCuteChips) {
    window.renderCuteChips("editGenres", "genresTagsDisplay", true);
    window.renderCuteChips("editVoiceActors", "voiceActorsTagsDisplay", false);
  }

  // ==========================================
  // ✨ 画像URL入力欄への反映とリアルタイム連動
  // ==========================================
  const urlInput = document.getElementById("editImageUrl");
  const previewImg = document.getElementById("editImgPreview");

  if (urlInput && previewImg) {
    urlInput.value = defaultImgUrl;
    urlInput.setAttribute("data-original-url", defaultImgUrl);

    urlInput.oninput = function () {
      const currentVal = urlInput.value.trim();
      if (currentVal === "") {
        const orig = urlInput.getAttribute("data-original-url");
        previewImg.src = orig;
        setVal("editImgUrl", orig);
      } else {
        previewImg.src = currentVal;
        setVal("editImgUrl", currentVal);
      }
    };
  }
  // ==========================================

  const updateElem = document.getElementById("editUpdatedAt");
  if (updateElem) {
    const existingAnime = window.animeDB.find(
      (a) => String(a.anilist_id) === String(targetId),
    );
    if (existingAnime) {
      const formatTime = (ts) => {
        if (!ts) return "-";
        const d = new Date(ts);
        return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
      };
      const createdTs = existingAnime.created_at || existingAnime.updated_at;
      const updatedTs = existingAnime.updated_at;
      updateElem.innerHTML = `<span>作成: ${formatTime(createdTs)}</span><span class="archive-time-divider">|</span><span>更新: ${formatTime(updatedTs)}</span>`;
    } else {
      updateElem.innerHTML = `<span>新規登録</span>`;
    }
  }
  window.renderVoiceActors();
  window.renderGenres();
  window.updateStatusColor();
  window.updateModalScore();

  // --- 💡 ここから書き換え・追加 ---
  // 変数から直接今回のデータを取得する
  const currentAnime = window.animeDB
    ? window.animeDB.find((a) => String(a.anilist_id) === String(targetId))
    : null;

  const charInput = document.getElementById("editCharacters");
  if (charInput && currentAnime && currentAnime.characters) {
    // スプシから読み込んだキャラクターデータを、文字列にして隠しinputにセットしてあげる
    charInput.value =
      typeof currentAnime.characters === "object"
        ? JSON.stringify(currentAnime.characters)
        : currentAnime.characters;
  }

  // 画面のキャラクターリストを描画
  window.renderCharacterList();

  // もしセットしても空っぽ、かつAniListから引っ張れるなら取得する
  const charData = charInput ? charInput.value : "";
  if (!charData || charData === "[]" || charData === "undefined") {
    if (targetId && typeof fetchCharacterData === "function")
      await fetchCharacterData(targetId);
  }

  // 💡 正しい位置：すべての読み込みが終わった最後でドラッグ表示位置を再現する
  if (typeof window.initImageDragPosition === "function") {
    setVal("editImgPosition", savedImgPosition);
    window.initImageDragPosition();
  }
}; // 👈 綺麗に openEditModal を閉じました！

// ==========================================
// 画像プレビューモーダル制御用関数
// ==========================================
window.showPreviewModal = function (imgData) {
  const modal = document.getElementById("imagePreviewModal");
  const imgPreview = document.getElementById("generatedImagePreview");
  const downloadBtn = document.getElementById("downloadImageBtn");
  const cancelBtn = document.getElementById("cancelPreviewBtn");

  if (!modal || !imgPreview) return;

  // 画像をセットしてモーダルを表示
  imgPreview.src = imgData;
  modal.classList.remove("hidden");

  // 保存ボタンの処理
  downloadBtn.onclick = () => {
    const link = document.createElement("a");
    link.href = imgData;
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    link.download = `OtakuLog_Stats_${dateStr}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 保存したらモーダルを閉じる
    modal.classList.add("hidden");
  };

  // キャンセルボタンの処理
  cancelBtn.onclick = () => {
    modal.classList.add("hidden");
  };
};

/* =========================================================
   ✨ 新・画像自由ドラッグ位置調整（ボタン連動アクティブ式）
========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  const previewImg = document.getElementById("editImgPreview");
  const positionInput = document.getElementById("editImgPosition");
  // 右上のボタン要素を取得します
  const cropBtn = document.querySelector(".crop-overlay-icon");

  if (!previewImg || !positionInput || !cropBtn) return;

  let isEditMode = false; // 💡 編集モードがONかどうかを管理
  let isDragging = false;
  let startY = 0;
  let startX = 0;
  let currentPercentY = 50;
  let currentPercentX = 50;

  // モーダルが開かれた時に初期位置を復元する関数
  window.initImageDragPosition = function () {
    // 開いた時は安全のため編集モードを一度OFF（通常状態）にする
    isEditMode = false;

    // 💡【ここを追加】クロップボタンのアクティブクラスとカーソルを完全にリセット
    const cBtn = document.querySelector(".crop-overlay-icon");
    if (cBtn) cBtn.classList.remove("is-active");
    if (previewImg) previewImg.style.cursor = "default";

    const savedPos = positionInput.value || "50% 50%";
    const parts = savedPos.split(" ");
    if (parts.length === 2) {
      const px = parseFloat(parts[0]);
      const py = parseFloat(parts[1]);
      // 💡 0は正常な値として残し、数値として読み込めなかった時だけ50にする
      currentPercentX = isNaN(px) ? 50 : px;
      currentPercentY = isNaN(py) ? 50 : py;
    } else {
      currentPercentX = 50;
      currentPercentY = savedPos.includes("top")
        ? 0
        : savedPos.includes("bottom")
          ? 100
          : 50;
    }

    previewImg.style.objectPosition = `${currentPercentX}% ${currentPercentY}%`;
  };

  // 💡 右上のボタンをクリックしたら、編集モードを切り替える
  cropBtn.style.pointerEvents = "auto"; // マウスがクリックに反応するように設定
  cropBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    isEditMode = !isEditMode;

    if (isEditMode) {
      // 【編集モードON】掴めるカーソルに変更し、CSSに判定用のクラスを付ける
      cropBtn.classList.add("is-active");
      previewImg.style.cursor = "grab";
    } else {
      // 【編集モードOFF】カーソルを元に戻し、クラスを外す
      cropBtn.classList.remove("is-active");
      previewImg.style.cursor = "default";
    }
  });

  // ドラッグ開始（編集モードがONの時だけ動作）
  previewImg.addEventListener("mousedown", (e) => {
    if (!isEditMode) return; // 💡 編集モードでなければ何もしない
    isDragging = true;
    previewImg.style.cursor = "grabbing";
    startY = e.clientY;
    startX = e.clientX;
    e.preventDefault();
  });

  // ドラッグ中
  window.addEventListener("mousemove", (e) => {
    if (!isDragging || !isEditMode) return;

    const deltaY = e.clientY - startY;
    const deltaX = e.clientX - startX;
    const imgHeight = previewImg.clientHeight;
    const imgWidth = previewImg.clientWidth;

    if (imgHeight > 0) {
      currentPercentY = currentPercentY - (deltaY / imgHeight) * 50;
      currentPercentY = Math.max(0, Math.min(100, currentPercentY));
    }
    if (imgWidth > 0) {
      currentPercentX = currentPercentX - (deltaX / imgWidth) * 50;
      currentPercentX = Math.max(0, Math.min(100, currentPercentX));
    }

    const newPosition = `${Math.round(currentPercentX)}% ${Math.round(currentPercentY)}%`;
    previewImg.style.objectPosition = newPosition;

    // 隠しinput要素に値を更新保存
    positionInput.value = newPosition;

    startY = e.clientY;
    startX = e.clientX;
  });

  // ドラッグ終了
  window.addEventListener("mouseup", () => {
    if (isDragging) {
      isDragging = false;
      if (isEditMode) previewImg.style.cursor = "grab";
    }
  });
});
// -----------------------------------------
// 🔄 周回カウンターの動作処理
// -----------------------------------------
// イベントを何度も登録しないように、bodyのイベント委譲（Event Delegation）を使います。
document.body.addEventListener("click", (e) => {
  // マイナスボタンが押された時
  if (e.target.closest("#rewatchMinus")) {
    const hiddenInput = document.getElementById("editRewatch");
    const countDisplay = document.getElementById("rewatchCount");
    if (!hiddenInput || !countDisplay) return;

    let current = parseInt(hiddenInput.value) || 1;
    if (current > 1) {
      // 1以下にはならないようにする
      current--;
      hiddenInput.value = current;
      countDisplay.textContent = current;
    }
  }

  // プラスボタンが押された時
  if (e.target.closest("#rewatchPlus")) {
    const hiddenInput = document.getElementById("editRewatch");
    const countDisplay = document.getElementById("rewatchCount");
    if (!hiddenInput || !countDisplay) return;

    let current = parseInt(hiddenInput.value) || 1;
    current++;
    hiddenInput.value = current;
    countDisplay.textContent = current;
  }
});
