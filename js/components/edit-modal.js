// =========================================================
// 🧩 js/components/edit-modal.js：アニメ詳細・編集モーダルの処理
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

    const type = inp.dataset.type;
    const display =
      document.getElementById(`${type}ScoreDisplay`) ||
      inp.parentElement.querySelector(".score-num, span, div");
    if (display) {
      display.innerText = val;
    }
  });
  const scoreElement = document.getElementById("myScoreValue");

  const overallScore = (total + res * 1.5) / 5.5;
  if (scoreElement)
    scoreElement.innerText = ((total + res * 1.5) / 5.5).toFixed(1);

  const starsFg = document.getElementById("overallStarsFg");
  if (starsFg) {
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
    editModal.scrollTop = 0;

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
  // 🧹 【超重要】モーダルを開いた瞬間に、前のアニメの残骸を完全に全リセット！
  // =========================================================================
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

  // 履修ステータスをデフォルトの「履修済」に強制リセット
  const triggerText = document.querySelector(
    "#customStatusTrigger .status-trigger-text",
  );
  if (triggerText) triggerText.textContent = "履修済";
  const triggerBtn = document.getElementById("customStatusTrigger");
  if (triggerBtn) triggerBtn.setAttribute("data-status", "default");

  // 形式（フォーマット）の表示も「形式を選択」に初期リセット
  const formatTrigger = document.getElementById("customFormatTrigger");
  if (formatTrigger) formatTrigger.textContent = "形式を選択";

  // 周回カウンターを「1周目」に絶対強制リセット
  setVal("editRewatch", "1");
  const rewatchDisplay = document.getElementById("rewatchCount");
  if (rewatchDisplay) rewatchDisplay.textContent = "1";

  // スライダー評価（スコア）をすべて「0」にリセット
  document.querySelectorAll(".score-val").forEach((el) => {
    el.value = 0;
  });

  // お気に入りボタン（栞）の状態を一旦グレー（false）に初期化
  const initialFavBtn = document.getElementById("favoriteBtn");
  if (initialFavBtn) {
    initialFavBtn.setAttribute("data-favorite", "false");
  }

  // 画像プレビューを初期化
  if (document.getElementById("editImgPreview")) {
    document.getElementById("editImgPreview").src = "";
  }

  // 前のアニメの「名言入力行」を完全に消去する
  const inputContainer = document.getElementById("quoteListContainer");
  if (inputContainer) inputContainer.innerHTML = "";

  // キャラクター検索用のキャッシュをリセット
  if (typeof currentAnimeCharacters !== "undefined") {
    currentAnimeCharacters = [];
  }
  // =========================================================================

  let defaultImgUrl = "";
  let savedImgPosition = "50% 50%";

  // 安全ガード付きのフォーマット辞書を特定
  const currentFormatMap = typeof formatMap !== "undefined" ? formatMap : {};

  if (presetData) {
    targetId = presetData.anilist_id;
    setVal("editAnilistId", presetData.anilist_id);

    setVal("editSynopsis", presetData.synopsis || presetData.description || "");
    defaultImgUrl = presetData.img || "";
    savedImgPosition = presetData.img_position || "50% 50%";
    if (document.getElementById("editImgPreview"))
      document.getElementById("editImgPreview").src = defaultImgUrl;
    setVal("editImgUrl", defaultImgUrl);

    setVal("editTitle", presetData.title);

    const presetYear = presetData.year || "";
    const presetSeason = presetData.season || "";

    if (presetYear && !/[春夏秋冬]/.test(presetYear)) {
      if (presetSeason) {
        const translatedSeason = window.translateSeason
          ? window.translateSeason(presetSeason)
          : presetSeason;
        setVal("editYear", `${presetYear}${translatedSeason}`);
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
    const formatTriggerA = document.getElementById("customFormatTrigger");
    if (formatTriggerA) {
      // 🌟 formatMap（公式辞書）を参照するように綺麗に修正！
      formatTriggerA.textContent =
        currentFormatMap[presetData.format] ||
        presetData.format ||
        "形式を選択";
    }
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

    if (presetData.watch_status) {
      setVal("editStatus", presetData.watch_status);
      if (triggerText) triggerText.textContent = presetData.watch_status;
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

    if (presetData.favorite_quotes) {
      try {
        const quotes =
          typeof presetData.favorite_quotes === "string"
            ? JSON.parse(presetData.favorite_quotes)
            : presetData.favorite_quotes;
        if (Array.isArray(quotes)) {
          const container = document.getElementById("quoteListContainer");
          if (container) container.innerHTML = "";

          quotes.forEach((q) => {
            if (typeof window.addQuoteRow === "function")
              window.addQuoteRow(
                q.character || "",
                q.text || "",
                q.episode || "",
                q.characterId || "",
              );
          });
        }
      } catch (e) {
        console.error("名言復元エラー:", e);
      }
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
    savedImgPosition = anime.img_position || "50% 50%";
    if (document.getElementById("editImgPreview"))
      document.getElementById("editImgPreview").src = defaultImgUrl;
    setVal("editImgUrl", defaultImgUrl);

    setVal("editTitle", anime.title);

    const animeYear = anime.year || "";
    const animeSeason = anime.season || "";

    if (animeYear && !/[春夏秋冬]/.test(animeYear)) {
      if (animeSeason) {
        const translatedSeason = window.translateSeason
          ? window.translateSeason(animeSeason)
          : animeSeason;
        setVal("editYear", `${animeYear}${translatedSeason}`);
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
    const formatTriggerB = document.getElementById("customFormatTrigger");
    if (formatTriggerB) {
      // 🌟 formatMap（公式辞書）を参照するように綺麗に修正！
      formatTriggerB.textContent =
        currentFormatMap[anime.format] || anime.format || "形式を選択";
    }
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

    if (anime.favorite_quotes) {
      try {
        const quotes =
          typeof anime.favorite_quotes === "string"
            ? JSON.parse(anime.favorite_quotes)
            : anime.favorite_quotes;
        if (Array.isArray(quotes)) {
          const container = document.getElementById("quoteListContainer");
          if (container) container.innerHTML = "";

          quotes.forEach((q) => {
            if (typeof window.addQuoteRow === "function")
              window.addQuoteRow(
                q.character || "",
                q.text || "",
                q.episode || "",
                q.characterId || "",
              );
          });
        }
      } catch (e) {
        console.error("名言復元エラー:", e);
      }
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

  if (window.updateModalScore) window.updateModalScore();

  if (window.renderCuteChips) {
    window.renderCuteChips("editGenres", "genresTagsDisplay", true);
    window.renderCuteChips("editVoiceActors", "voiceActorsTagsDisplay", false);
  }

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

  const currentAnime = window.animeDB
    ? window.animeDB.find((a) => String(a.anilist_id) === String(targetId))
    : null;

  const charInput = document.getElementById("editCharacters");
  if (charInput && currentAnime && currentAnime.characters) {
    charInput.value =
      typeof currentAnime.characters === "object"
        ? JSON.stringify(currentAnime.characters)
        : currentAnime.characters;
  }

  window.renderCharacterList();

  const charData = charInput ? charInput.value : "";
  if (!charData || charData === "[]" || charData === "undefined") {
    if (targetId && typeof fetchCharacterData === "function")
      await fetchCharacterData(targetId);
  }

  if (typeof window.initImageDragPosition === "function") {
    setVal("editImgPosition", savedImgPosition);
    window.initImageDragPosition();
  }

  if (currentAnime) {
    const favBtn = document.getElementById("favoriteBtn");
    if (favBtn) {
      const isFav =
        currentAnime.is_favorite === "true" ||
        currentAnime.is_favorite === true;
      favBtn.setAttribute("data-favorite", isFav ? "true" : "false");
    }
  }
};
/**
 * 編集モーダル内の「キャラクター Rosters（一覧）」を描画する関数
 */
window.renderCharacterList = function () {
  const container = document.getElementById("oshiRosterDisplay");
  const rawVal = document.getElementById("editCharacters").value;
  if (!container) return;
  container.innerHTML = "";

  let characters = [];
  if (rawVal) {
    try {
      characters = typeof rawVal === "string" ? JSON.parse(rawVal) : rawVal;
    } catch (e) {
      console.error("キャラクターのパースに失敗しました", e);
    }
  }

  // 元の並び順を記憶
  characters.forEach((c, i) => {
    if (c.originalIndex === undefined) c.originalIndex = i;
  });

  // 「推し」が上にくるようにソート
  let displayChars = [...characters].sort((a, b) => {
    if (a.isOshi && !b.isOshi) return -1;
    if (!a.isOshi && b.isOshi) return 1;
    if (!a.isOshi && !b.isOshi)
      return (a.originalIndex || 0) - (b.originalIndex || 0);
    return 0;
  });

  let draggedItemIdx = null;

  displayChars.forEach((c, idx) => {
    const div = document.createElement("div");
    div.className = `oshi-card pop-up-animation ${c.isOshi ? "is-oshi" : ""}`;
    div.draggable = true;

    const tooltipText = c.isOshi
      ? "推しをお休みさせる"
      : "全力で推し登録する！！！";
    const removeSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line> <line x1="6" y1="6" x2="18" y2="18"></line></svg>`;

    div.innerHTML = `
      <div class="oshi-img-wrapper" title="${tooltipText}">
        <img src="${c.img}" class="oshi-img" loading="lazy">
        ${c.isOshi ? '<div class="oshi-text-badge">推し</div>' : ""}
      </div>
      <div class="oshi-name">${c.name}</div>
      <button class="oshi-remove-btn" title="作品から外す">${removeSvg}</button>
    `;

    // 💡 推し状態のトグル切り替え
    div.querySelector(".oshi-img-wrapper").onclick = () => {
      c.isOshi = !c.isOshi;
      if (!c.isOshi) {
        c.isFavorite = false;
        c.isIchioshi = false;
      }
      document.getElementById("editCharacters").value =
        JSON.stringify(displayChars);
      window.renderCharacterList();

      if (c.isOshi) {
        setTimeout(() => {
          const newOshiCard = container.querySelectorAll(".oshi-card")[0];
          if (newOshiCard) {
            newOshiCard.classList.remove("pop-up-animation");
            newOshiCard.classList.add("sparkle-effect");
          }
        }, 10);
      }
    };

    // 💡 作品からキャラクター自体を除外
    div.querySelector(".oshi-remove-btn").onclick = (e) => {
      e.stopPropagation();
      displayChars.splice(idx, 1);
      document.getElementById("editCharacters").value =
        JSON.stringify(displayChars);
      window.renderCharacterList();
    };

    // 💡 ドラッグ＆ドロップ（並び替え）
    div.addEventListener("dragstart", (e) => {
      draggedItemIdx = idx;
      const img = div.querySelector(".oshi-img");
      if (img) e.dataTransfer.setDragImage(img, 32, 32);
      setTimeout(() => div.classList.add("dragging"), 0);
    });

    div.addEventListener("dragend", () => {
      div.classList.remove("dragging");
      draggedItemIdx = null;
    });

    div.addEventListener("dragover", (e) => {
      e.preventDefault();
      div.classList.add("drag-over");
    });

    div.addEventListener("dragleave", () => div.classList.remove("drag-over"));

    div.addEventListener("drop", (e) => {
      e.preventDefault();
      div.classList.remove("drag-over");

      if (draggedItemIdx !== null && draggedItemIdx !== idx) {
        const movedItem = displayChars.splice(draggedItemIdx, 1)[0];
        displayChars.splice(idx, 0, movedItem);

        displayChars.forEach((char, i) => {
          char.originalIndex = i;
        });
        document.getElementById("editCharacters").value =
          JSON.stringify(displayChars);
        window.renderCharacterList();
      }
    });

    container.appendChild(div);
  });
};
/* =========================================================
   ✨ 新・画像自由ドラッグ位置調整（ボタン連動アクティブ式）
========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  const previewImg = document.getElementById("editImgPreview");
  const positionInput = document.getElementById("editImgPosition");
  const cropBtn = document.querySelector(".crop-overlay-icon");

  if (!previewImg || !positionInput || !cropBtn) return;

  let isEditMode = false;
  let isDragging = false;
  let startY = 0;
  let startX = 0;
  let currentPercentY = 50;
  let currentPercentX = 50;

  window.initImageDragPosition = function () {
    isEditMode = false;

    const cBtn = document.querySelector(".crop-overlay-icon");
    if (cBtn) cBtn.classList.remove("is-active");
    if (previewImg) previewImg.style.cursor = "default";

    const savedPos = positionInput.value || "50% 50%";
    const parts = savedPos.split(" ");
    if (parts.length === 2) {
      const px = parseFloat(parts[0]);
      const py = parseFloat(parts[1]);
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

  cropBtn.style.pointerEvents = "auto";
  cropBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    isEditMode = !isEditMode;

    if (isEditMode) {
      cropBtn.classList.add("is-active");
      previewImg.style.cursor = "grab";
    } else {
      cropBtn.classList.remove("is-active");
      previewImg.style.cursor = "default";
    }
  });

  previewImg.addEventListener("mousedown", (e) => {
    if (!isEditMode) return;
    isDragging = true;
    previewImg.style.cursor = "grabbing";
    startY = e.clientY;
    startX = e.clientX;
    e.preventDefault();
  });

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
    positionInput.value = newPosition;

    startY = e.clientY;
    startX = e.clientX;
  });

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
document.body.addEventListener("click", (e) => {
  if (e.target.closest("#rewatchMinus")) {
    const hiddenInput = document.getElementById("editRewatch");
    const countDisplay = document.getElementById("rewatchCount");
    if (!hiddenInput || !countDisplay) return;

    let current = parseInt(hiddenInput.value) || 1;
    if (current > 1) {
      current--;
      hiddenInput.value = current;
      countDisplay.textContent = current;
    }
  }

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

// =========================================================
// 🔖 お気に入り（栞）＆ 💬 名言登録機能の動的制御
// =========================================================

window.setupFavoriteButton = function () {
  const favBtn = document.getElementById("favoriteBtn");
  if (!favBtn) return;

  favBtn.onclick = null;
  favBtn.onclick = function () {
    const isFav = favBtn.getAttribute("data-favorite") === "true";
    const nextState = !isFav;

    favBtn.setAttribute("data-favorite", String(nextState));

    favBtn.style.transform = nextState ? "scale(1.2)" : "scale(1.0)";
    setTimeout(() => {
      favBtn.style.transform = "scale(1.0)";
    }, 150);
  };
};

window.getCurrentCharacterList = function () {
  const charInput = document.getElementById("editCharacters");
  if (!charInput || !charInput.value) return [];

  const rawValue = charInput.value.trim();
  let characterNames = [];

  if (rawValue.startsWith("[") && rawValue.endsWith("]")) {
    try {
      const parsedArray = JSON.parse(rawValue);
      if (Array.isArray(parsedArray)) {
        parsedArray.forEach((item) => {
          if (!item) return;
          if (typeof item === "object" && item.name) {
            characterNames.push(item.name.replace(/\[[\s\S]*?\]/g, "").trim());
          } else if (typeof item === "string") {
            characterNames.push(item.replace(/\[[\s\S]*?\]/g, "").trim());
          }
        });
        return characterNames.filter(Boolean);
      }
    } catch (e) {}
  }

  return rawValue
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((item) => item.replace(/\[[\s\S]*?\]/g, "").trim())
    .filter(Boolean);
};

window.addQuoteRow = function (
  initialCharacter = "",
  initialText = "",
  initialEpisode = "",
  initialId = "",
) {
  const container = document.getElementById("quoteListContainer");
  if (!container) return;

  const rowId =
    "quote_row_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4);

  const row = document.createElement("div");
  row.id = rowId;
  row.className = "quote-input-row pop-up-animation";

  row.innerHTML = `
    <div class="quote-char-wrapper">
      <input type="text" class="custom-input quote-char-search-input" 
             placeholder="キャラ名を入力..." 
             data-id="${initialId}" 
             value="${initialCharacter.replace(/"/g, "&quot;")}">
      <div class="chara-suggest-list cute-custom-options hidden"></div>
    </div>
    <div class="quote-episode-wrapper">
      <input type="text" class="custom-input quote-episode-input" 
             placeholder="話数" 
             value="${initialEpisode.replace(/"/g, "&quot;")}">
      <span class="quote-episode-unit">話</span>
    </div>
    <input type="text" class="custom-input quote-text-input" 
           placeholder="心に刺さった名言やセリフを入力..." 
           value="${initialText.replace(/"/g, "&quot;")}">
    <button type="button" class="delete-quote-row-btn" title="削除">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      </svg>
    </button>
  `;

  const charInput = row.querySelector(".quote-char-search-input");
  const suggestBox = row.querySelector(".chara-suggest-list");

  row.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  charInput.addEventListener("input", function () {
    charInput.removeAttribute("data-id");
  });

  let debounceTimeout = null;
  charInput.addEventListener("input", function () {
    const query = charInput.value.trim().toLowerCase();

    clearTimeout(debounceTimeout);
    if (!query) {
      suggestBox.innerHTML = "";
      suggestBox.classList.add("hidden");
      return;
    }

    debounceTimeout = setTimeout(() => {
      let matchedChars = [];
      const charInputEl = document.getElementById("editCharacters");
      let characterSourceArray = [];

      if (charInputEl && charInputEl.value) {
        try {
          const rawVal = charInputEl.value.trim();
          characterSourceArray =
            typeof rawVal === "string" ? JSON.parse(rawVal) : rawVal;
        } catch (e) {}
      }

      if (
        Array.isArray(characterSourceArray) &&
        characterSourceArray.length > 0
      ) {
        characterSourceArray.forEach((item) => {
          if (!item) return;

          let rawObj = item;
          let targetName = "";
          let charId = "";

          if (typeof rawObj === "object") {
            if (rawObj.node) {
              charId = rawObj.node.id || "";
              if (rawObj.node.name) {
                targetName =
                  rawObj.node.name.native || rawObj.node.name.full || "";
              }
            } else {
              charId = rawObj.id || "";
              targetName = rawObj.name || "";
            }
          } else if (typeof rawObj === "string" || typeof rawObj === "number") {
            targetName = String(rawObj);
          }

          if (targetName) {
            targetName = targetName
              .replace(/\[[\s\S]*?\]/g, "")
              .replace(/^["'\s：:]+|["'\s：:]+$/g, "")
              .trim();
          }

          if (targetName && targetName.toLowerCase().includes(query)) {
            if (!matchedChars.some((m) => m.name === targetName)) {
              matchedChars.push({
                name: targetName,
                id: String(charId).trim(),
              });
            }
          }
        });
      }

      if (matchedChars.length === 0) {
        suggestBox.innerHTML = `<div class="suggest-message" style="padding: 8px; font-size: 12px; color: #94A3B8; text-align: center;">候補なし</div>`;
      } else {
        suggestBox.innerHTML = matchedChars
          .map(
            (c) =>
              `<div class="suggest-item-row" data-val="${c.name.replace(/"/g, "&quot;")}" data-id="${c.id}">${c.name}</div>`,
          )
          .join("");

        suggestBox.querySelectorAll(".suggest-item-row").forEach((item) => {
          item.onclick = function (e) {
            e.stopPropagation();
            charInput.value = item.getAttribute("data-val");
            charInput.setAttribute(
              "data-id",
              item.getAttribute("data-id") || "",
            );
            suggestBox.classList.add("hidden");
          };
        });
      }
      suggestBox.classList.remove("hidden");
    }, 200);
  });

  charInput.onblur = function () {
    setTimeout(() => {
      suggestBox.classList.add("hidden");
    }, 200);
  };

  row.querySelector(".delete-quote-row-btn").onclick = function () {
    row.style.opacity = "0";
    row.style.transform = "scale(0.9)";
    setTimeout(() => {
      row.remove();
    }, 200);
  };

  container.appendChild(row);
};

window.collectQuoteDataDataStr = function () {
  const container = document.getElementById("quoteListContainer");
  if (!container) return "";

  const rows = container.querySelectorAll(".quote-input-row");
  const quotesArray = [];

  rows.forEach((row) => {
    const charInput = row.querySelector(".quote-char-search-input");
    const textInput = row.querySelector(".quote-text-input");
    const epInput = row.querySelector(".quote-episode-input");
    if (!textInput) return;

    const character = charInput ? charInput.value.trim() : "";
    const text = textInput.value.trim();
    const episode = epInput ? epInput.value.trim() : "";
    const characterId = charInput
      ? charInput.getAttribute("data-id") || ""
      : "";

    if (text) {
      quotesArray.push({ character, characterId, text, episode });
    }
  });

  return quotesArray.length > 0 ? JSON.stringify(quotesArray) : "";
};
