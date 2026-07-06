// =================================================================
// 💖 js/pages/oshiChara.js：推しキャラコレクション画面専用（スプシ対応版）
// =================================================================

/**
 * 「推しキャラコレクション」独立ページ全体の描画
 */
window.renderGlobalOshiView = function () {
  const container = document.getElementById("globalOshiContainer");
  if (!container) return;
  container.className = "";
  container.innerHTML = "";

  const oshiMap = new Map();

  // 1. 全アニメDBから推しキャラを全抽出して集約
  window.animeDB.forEach((anime) => {
    if (!anime.characters) return;
    try {
      const charList =
        typeof anime.characters === "string"
          ? JSON.parse(anime.characters)
          : anime.characters;
      if (!Array.isArray(charList)) return;

      let animeYear = parseInt(anime.year) || 9999;

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
  });

  const uniqueOshiList = Array.from(oshiMap.values());

  if (uniqueOshiList.length === 0) {
    container.innerHTML = `<div class="list-empty-text">まだ「推し」が登録されていません。<br>アニメの編集画面からキャラをタップして登録してみてね！</div>`;
    return;
  }

  // 2. プレミアム（ゴールド）とノーマルに分けるゾーン作成
  const goldZone = document.createElement("div");
  goldZone.className = "oshi-gold-zone";
  const normalZone = document.createElement("div");
  normalZone.className = "oshi-normal-zone";

  container.appendChild(goldZone);
  container.appendChild(normalZone);

  // 3. コレクションカード生成関数
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

    // 💡 ハート（お気に入り）クリックで瞬時にゾーン移動＆スプシ保存
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

      const targetAnime = window.animeDB.find(
        (a) => String(a.anilist_id) === String(oshi.anilist_id),
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

          if (targetChar) {
            targetChar.isFavorite = isNowFav;
            targetChar.isIchioshi = isNowFav;

            const updatedCharactersText = JSON.stringify(charList);
            targetAnime.characters = updatedCharactersText;

            let uid =
              window.currentUserId ||
              localStorage.getItem("otaku_log_account_id") ||
              "user";
            if (uid && typeof window.saveAnimeToDB === "function") {
              await window.saveAnimeToDB(uid, targetAnime.anilist_id, {
                ...targetAnime,
                characters: updatedCharactersText,
              });
            }
          }
        } catch (error) {
          console.error("スプシ自動保存エラー:", error);
        }
      }
    };

    // カードクリックで、そのキャラが出演する作品でホーム画面を絞り込み
    card.onclick = (e) => {
      e.stopPropagation();
      document.getElementById("statsPageArea")?.classList.remove("slide-down");
      if (typeof window.applyFilter === "function") {
        window.applyFilter("character", oshi.name);
      }
    };

    return card;
  }

  // 生成したカードを各ゾーンにバラまく
  uniqueOshiList.forEach((oshi) => {
    const cardElement = createCardElement(oshi);
    if (oshi.isFavorite) goldZone.appendChild(cardElement);
    else normalZone.appendChild(cardElement);
  });
};
