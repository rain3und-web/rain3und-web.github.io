// =================================================================
// 💖 js/pages/oshiChara.js：推しキャラコレクション画面専用（スプシ対応版）
// =================================================================

window.renderCharacterList = function () {
  const container = document.getElementById("oshiRosterDisplay");
  const rawVal = document.getElementById("editCharacters").value;
  if (!container) return;
  container.innerHTML = "";
  let characters = [];
  if (rawVal) {
    try {
      // オブジェクトならそのまま、文字列ならパースする
      characters = typeof rawVal === "string" ? JSON.parse(rawVal) : rawVal;
    } catch (e) {}
  }

  characters.forEach((c, i) => {
    if (c.originalIndex === undefined) c.originalIndex = i;
  });
  let displayChars = [...characters];
  displayChars.sort((a, b) => {
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
    div.innerHTML = `<div class="oshi-img-wrapper" title="${tooltipText}"><img src="${c.img}" class="oshi-img">${c.isOshi ? '<div class="oshi-text-badge">推し</div>' : ""}</div><div class="oshi-name">${c.name}</div><button class="oshi-remove-btn" title="作品から外す">${removeSvg}</button>`;

    div.querySelector(".oshi-img-wrapper").onclick = () => {
      c.isOshi = !c.isOshi;

      // 🌟 推しを解除したら、お気に入りも強制解除する
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

    div.querySelector(".oshi-remove-btn").onclick = (e) => {
      e.stopPropagation();
      displayChars.splice(idx, 1);
      document.getElementById("editCharacters").value =
        JSON.stringify(displayChars);
      window.renderCharacterList();
    };

    // ドラッグ＆ドロップイベント群
    div.addEventListener("dragstart", (e) => {
      draggedItemIdx = idx;
      const img = div.querySelector(".oshi-img");
      if (img) {
        e.dataTransfer.setDragImage(img, 32, 32);
      }
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

window.renderGlobalOshiView = function () {
  document.getElementById("viewTitle").innerHTML =
    '<svg class="oshi-title-heart" viewBox="0 0 24 24" fill="#F9C106"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg> 推しキャラコレクション';

  const breadcrumbArea = document.getElementById("breadcrumbArea");
  if (breadcrumbArea) {
    breadcrumbArea.classList.remove("hidden");
    const allElements = breadcrumbArea.querySelectorAll("*");
    allElements.forEach((el) => {
      if (el.textContent.includes("戻る") && !el.textContent.includes("HOME")) {
        el.style.display = "none";
      }
    });
  }

  const container = document.getElementById("globalOshiContainer");
  if (!container) return;
  container.className = "";
  container.innerHTML = "";

  // 1. データの収集と整理
  const oshiMap = new Map();

  window.animeDB.forEach((anime) => {
    if (anime.characters) {
      try {
        // 💡 修正ポイント: 最初から配列（オブジェクト）ならそのまま使い、文字列ならパースする
        const charList =
          typeof anime.characters === "string"
            ? JSON.parse(anime.characters)
            : anime.characters;

        if (!Array.isArray(charList)) return; // 配列でなければスキップ

        let animeYear = parseInt(anime.year);
        if (isNaN(animeYear)) animeYear = 9999;

        charList.forEach((c) => {
          if (c.isOshi || c.isIchioshi || c.isFavorite) {
            const uniqueKey = c.id
              ? String(c.id)
              : (c.name + "_" + (anime.title || ""))
                  .replace(/[\s ]/g, "")
                  .toLowerCase();

            const isFav = c.isIchioshi || c.isFavorite || false;

            if (!oshiMap.has(uniqueKey)) {
              oshiMap.set(uniqueKey, {
                ...c,
                uniqueKey,
                animeTitle: anime.title,
                anilist_id: anime.anilist_id,
                isFavorite: isFav,
                year: animeYear,
              });
            } else {
              const existing = oshiMap.get(uniqueKey);
              existing.isFavorite = existing.isFavorite || isFav;
              if (animeYear < existing.year) {
                existing.animeTitle = anime.title;
                existing.anilist_id = anime.anilist_id;
                existing.year = animeYear;
              }
            }
          }
        });
      } catch (e) {
        console.error("キャラクターパースエラー:", e);
      }
    }
  });

  const uniqueOshiList = Array.from(oshiMap.values());

  if (uniqueOshiList.length === 0) {
    container.innerHTML = `<div class="list-empty-text">まだ「推し」が登録されていません。<br>アニメの編集画面からキャラをタップして登録してみてね！</div>`;
    return;
  }

  // 2. ゾーンの作成
  const goldZone = document.createElement("div");
  goldZone.className = "oshi-gold-zone";

  const normalZone = document.createElement("div");
  normalZone.className = "oshi-normal-zone";

  container.appendChild(goldZone);
  container.appendChild(normalZone);

  // 3. カード生成関数
  function createCardElement(oshi) {
    const card = document.createElement("div");
    card.className = `global-oshi-card pop-up-animation ${oshi.isFavorite ? "gold-card" : ""}`;

    card.innerHTML = `
      <img src="${oshi.img}" class="global-oshi-avatar" loading="lazy">
      <div class="akusuta-info">
        <div class="global-oshi-name">${oshi.name}</div>
        <div class="global-oshi-anime">${oshi.animeTitle}</div>
      </div>
      <div class="oshi-pin-btn ${oshi.isFavorite ? "active" : ""}">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      </div>
    `;

    // ハートボタンのクリックイベント
    const pinBtn = card.querySelector(".oshi-pin-btn");
    pinBtn.onclick = async (e) => {
      e.stopPropagation();

      const isNowFav = pinBtn.classList.toggle("active");

      if (isNowFav) {
        card.classList.add("gold-card");
        goldZone.appendChild(card);
      } else {
        card.classList.remove("gold-card");
        normalZone.appendChild(card);
      }

      console.log(
        "① ボタンがクリックされました。対象キャラ:",
        oshi.name,
        "アニメID:",
        oshi.anilist_id,
      );

      // 型変換の安全対策を入れつつアニメを探す
      const targetAnime = window.animeDB.find(
        (a) => String(a.anilist_id) === String(oshi.anilist_id),
      );

      console.log(
        "② アニメの検索結果:",
        targetAnime ? "見つかりました！" : "❌見つかりません",
      );

      if (targetAnime && targetAnime.characters) {
        try {
          const charList =
            typeof targetAnime.characters === "string"
              ? JSON.parse(targetAnime.characters)
              : targetAnime.characters;

          const targetChar = charList.find(
            (c) =>
              (c.id && String(c.id) === String(oshi.id)) ||
              c.name === oshi.name,
          );

          console.log(
            "④ 該当キャラクターの検索結果:",
            targetChar ? "見つかりました！" : "❌見つかりません",
          );

          if (targetChar) {
            targetChar.isFavorite = isNowFav;
            targetChar.isIchioshi = isNowFav;

            // 💡 スプシ用に文字列（JSONテキスト）にしてから代入する
            const updatedCharactersText = JSON.stringify(charList);
            targetAnime.characters = updatedCharactersText;

            let uid =
              window.currentUserId ||
              localStorage.getItem("otaku_log_account_id") ||
              "user";
            if (!uid) {
              uid =
                localStorage.getItem("otaku_log_uid") || window.currentUserId;
            }

            console.log(
              "⑤ 安全に取得できたUID:",
              uid,
              "保存関数はあるか:",
              typeof window.saveAnimeToDB,
            );

            if (uid && typeof window.saveAnimeToDB === "function") {
              // スプレッドシート送信用に完全にパッキングしたペイロードを作成
              const savePayload = {
                ...targetAnime,
                characters: updatedCharactersText,
              };

              console.log(
                "⑥ saveAnimeToDBを実行します。渡すデータ:",
                savePayload,
              );

              await window.saveAnimeToDB(
                uid,
                targetAnime.anilist_id,
                savePayload,
              );
              console.log(
                `⑦ 【完了】「${oshi.name}」のお気に入り状態(${isNowFav})を保存しました！`,
              );
            }
          }
        } catch (error) {
          console.error("❌ 処理中にエラーが発生しました:", error);
        }
      }
    };
    card.onclick = (e) => {
      e.stopPropagation();
      const statsArea = document.getElementById("statsPageArea");
      if (statsArea) statsArea.classList.remove("slide-down");
      if (typeof window.applyFilter === "function") {
        window.applyFilter("character", oshi.name);
      }
    };

    return card;
  }

  // 4. 生成と配置
  uniqueOshiList.forEach((oshi) => {
    const cardElement = createCardElement(oshi);
    if (oshi.isFavorite) {
      goldZone.appendChild(cardElement);
    } else {
      normalZone.appendChild(cardElement);
    }
  });
};
