// =========================================================
// 🏠 js/pages/home.js：ホーム画面（一覧表示・絞り込み・並び替え）
// =========================================================

window.renderGrid = function () {
  document.getElementById("animeGrid").classList.remove("hidden");
  document.getElementById("listViewArea").classList.add("hidden");

  // 💡 1. これを追加！：作品一覧を表示する時は、推しキャラ画面を確実に隠す
  const oshiArea = document.getElementById("oshiCharaArea");
  if (oshiArea) oshiArea.classList.add("hidden");

  document.getElementById("mainActionRow").style.display = "flex";
  document.getElementById("mainFilterRow").style.display = "flex";
  const grid = document.getElementById("animeGrid");
  grid.innerHTML = "";

  let filtered = [...window.animeDB];
  const breadcrumb = document.getElementById("breadcrumbArea");

  if (window.filterQuery) {
    breadcrumb.classList.remove("hidden");
    const displayTitleName = window.filterQuery.value
      .replace(/\[[^\]]*\]/g, "")
      .trim();
    document.getElementById("viewTitle").innerText =
      `「${displayTitleName}」の作品`;

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

    const existingReturnBtn = document.getElementById("dynamicReturnBtn");
    if (existingReturnBtn) existingReturnBtn.remove();

    // ★ 統計から来た場合(fromStats = true)は「一覧へ戻る」ボタンを作らない！
    if (!window.filterQuery.fromStats) {
      // 💡 修正ポイント1: character（推しキャラ）をマップに追加
      const typeMap = {
        genre: "ジャンル",
        voiceActor: "声優",
        director: "監督",
        studio: "制作会社",
        year: "放送年",
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

        // 💡 修正ポイント2: ボタンを押したとき、推しキャラの場合は "oshiChara" 画面に戻す
        returnBtn.onclick = () => {
          if (window.filterQuery.type === "character") {
            window.switchView("oshiChara");
          } else {
            window.switchView(window.filterQuery.type);
          }
        };

        const clearBtn = document.getElementById("clearFilterBtn");
        if (clearBtn) btnContainer.insertBefore(returnBtn, clearBtn);
      }
    }

    filtered = filtered.filter((a) => {
      if (window.filterQuery.type === "search")
        return a.title && a.title.includes(window.filterQuery.value);
      if (window.filterQuery.type === "genre_high_score")
        return (
          a.genres_jp &&
          a.genres_jp.includes(window.filterQuery.value) &&
          parseFloat(a.my_score || 0) >= 3.8
        );
      if (window.filterQuery.type === "genre")
        return a.genres_jp && a.genres_jp.includes(window.filterQuery.value);
      if (window.filterQuery.type === "voiceActor")
        return a.cast && a.cast.includes(window.filterQuery.value);
      if (window.filterQuery.type === "director")
        return a.director && a.director.includes(window.filterQuery.value);
      if (window.filterQuery.type === "studio")
        return a.studio === window.filterQuery.value;
      if (window.filterQuery.type === "year")
        return a.year == window.filterQuery.value;
      if (window.filterQuery.type === "character") {
        if (!a.characters) return false;
        try {
          // 💡 文字列ならパースし、オブジェクトならそのまま扱う
          const charList =
            typeof a.characters === "string"
              ? JSON.parse(a.characters)
              : a.characters;
          if (!Array.isArray(charList)) return false;
          // 配列内のどれかのキャラ名が、検索対象と一致するかを正しく検証
          return charList.some((c) => c.name === window.filterQuery.value);
        } catch (e) {
          // パース失敗時の保険として、部分一致検索も残す
          return a.characters.includes(window.filterQuery.value);
        }
      }

      if (window.filterQuery.type === "genre_combo") {
        if (!a.genres_jp) return false;
        const targetGenres = window.filterQuery.value.split(" × "); // 「コメディ × 日常」を分割
        return targetGenres.every((g) => a.genres_jp.includes(g)); // 両方含まれているかチェック
      }
      return true;
    });
  } else {
    breadcrumb.classList.add("hidden");
    // ★ フィルター解除（HOME）時に、スライドダウン状態の統計画面を確実に消去してズレを直す！
    const statsArea = document.getElementById("statsPageArea");
    if (statsArea) {
      statsArea.classList.add("hidden");
      statsArea.classList.remove("slide-down");
    }
    if (window.currentFilter !== "ALL") {
      filtered = filtered.filter(
        (a) => a.watch_status === window.currentFilter,
      );
    }
  }

  if (window.currentSort === "score") {
    filtered.sort(
      (a, b) => parseFloat(b.my_score || 0) - parseFloat(a.my_score || 0),
    );
  } else if (window.currentSort === "year") {
    filtered.sort((a, b) => parseInt(b.year || 0) - parseInt(a.year || 0));
  }

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
    let statusClass = "status-default";
    if (statusLabel === "履修済") statusClass = "status-watched";
    else if (statusLabel === "履修中") statusClass = "status-watching";
    else if (statusLabel === "再履修") statusClass = "status-rewatch";
    else if (statusLabel === "脱落") statusClass = "status-dropped";

    const card = document.createElement("div");
    card.className = "card pop-up-animation";
    card.onclick = () => window.openEditModal(anime.anilist_id);

    // 💡 これを追加！保存されている位置（例: '50% 30%'）を取得し、無ければ中央にします
    const imgPosition = anime.img_position || "center center";
    // カード全体に対して、CSS変数として位置を叩き込みます
    card.style.setProperty("--img-pos", imgPosition);

    card.innerHTML = `
    <div class="card-img-wrapper"><img src="${anime.cover_url}" class="card-img"></div>
    <h3 class="card-title">${anime.title}</h3>
            <div class="card-meta">${anime.year || "-"} ${anime.format || ""} ${anime.episodes || ""}</div>
            <div class="card-status-row"><div class="status-pill ${statusClass}">${statusLabel}</div><div class="score-display"><span class="score-icon">★</span><span class="score-num">${score}</span></div></div>
        `;
    fragment.appendChild(card);
  });
  grid.appendChild(fragment);
};

window.renderListView = function (type) {
  document.getElementById("animeGrid").classList.add("hidden");
  document.getElementById("listViewArea").classList.remove("hidden");
  document.getElementById("mainActionRow").style.display = "none";
  document.getElementById("mainFilterRow").style.display = "none";
  document.getElementById("breadcrumbArea").classList.add("hidden");

  const btns = document.querySelectorAll(".btn-sort-list");
  if (btns.length >= 2) {
    const btnCount = btns[0];
    const btnName = btns[1];
    if (type === "genre") {
      btnName.style.display = "none";
      if (window.listSortMode === "name") window.listSortMode = "count";
    } else if (type === "year") {
      btnName.style.display = "inline-block";
      btnName.innerText = "古い順";
    } else {
      btnName.style.display = "inline-block";
      btnName.innerText = "名前順";
    }
    btnCount.classList.toggle("active", window.listSortMode === "count");
    btnName.classList.toggle("active", window.listSortMode === "name");

    if (!btnCount.onclick) {
      btns.forEach((btn) => {
        btn.onclick = (e) => {
          btns.forEach((b) => b.classList.remove("active"));
          e.target.classList.add("active");
          window.listSortMode = e.target.getAttribute("data-sort");
          window.renderListView(window.currentView);
        };
      });
    }
  }

  let titleMap = {
    genre: "ジャンル一覧",
    voiceActor: "声優一覧",
    director: "監督一覧",
    studio: "制作会社一覧",
    year: "放送年別アーカイブ",
  };
  let counts = {};
  window.animeDB.forEach((a) => {
    if (type === "genre" && a.genres_jp) {
      a.genres_jp.split(",").forEach((g) => {
        let t = g.trim();
        if (t) counts[t] = (counts[t] || 0) + 1;
      });
    }
    if (type === "voiceActor" && a.cast) {
      a.cast.split(",").forEach((v) => {
        let t = v.replace(/[\r\n]/g, "").trim();
        if (t) counts[t] = (counts[t] || 0) + 1;
      });
    }
    if (type === "director" && a.director) {
      let t = a.director.replace(/[\r\n]/g, "").trim();
      if (t) counts[t] = (counts[t] || 0) + 1;
    }
    if (type === "studio" && a.studio) {
      counts[a.studio] = (counts[a.studio] || 0) + 1;
    }
    if (type === "year" && a.year) {
      counts[a.year] = (counts[a.year] || 0) + 1;
    }
  });

  let items = Object.entries(counts).map(([name, count]) => ({ name, count }));
  let htmlContent = `<div class="tag-view-header"><h2 class="tag-view-title">${titleMap[type]}</h2></div>`;

  if (
    window.listSortMode === "name" &&
    (type === "year" || type === "voiceActor" || type === "director")
  ) {
    let groups = {};
    items.forEach((item) => {
      let groupName, groupOrder, sortKey;
      if (type === "year") {
        const y = parseInt(item.name);
        if (isNaN(y)) {
          groupName = "不明";
          groupOrder = 9999;
          sortKey = 9999;
        } else {
          const decade = Math.floor(y / 10) * 10;
          groupName = decade + "年代";
          groupOrder = decade;
          sortKey = y;
        }
      } else if (type === "voiceActor" || type === "director") {
        const info = window.getActorGroupInfo(item.name);
        groupName = info.group;
        groupOrder = info.order;
        sortKey = info.sortKey;
      }
      if (!groups[groupName]) {
        groups[groupName] = { order: groupOrder, items: [] };
      }
      groups[groupName].items.push({ ...item, sortKey });
    });

    const sortedGroupNames = Object.keys(groups).sort(
      (a, b) => groups[a].order - groups[b].order,
    );
    sortedGroupNames.forEach((gName) => {
      groups[gName].items.sort((a, b) => {
        if (type === "year") return a.sortKey - b.sortKey;
        return String(a.sortKey).localeCompare(String(b.sortKey), "ja");
      });
      htmlContent += `
            <div class="tag-view-header">
            <h3 class="sticky-group-header">${gName}</h3>
            <div class="tag-item-container">
            ${groups[gName].items
              .map((item) => {
                const displayName = item.name.replace(/\[[^\]]*\]/g, "").trim();
                const safeName = item.name
                  .replace(/'/g, "\\'")
                  .replace(/[\r\n]/g, "");
                return `<button class="tag-item pop-up-animation" onclick="window.applyFilter('${type}', '${safeName}')">${displayName} <span class="tag-count">${item.count}</span></button>`;
              })
              .join("")}
            </div>
            </div>`;
    });
  } else {
    if (window.listSortMode === "count") {
      items.sort((a, b) => b.count - a.count);
    } else {
      items.sort((a, b) => String(a.name).localeCompare(String(b.name), "ja"));
    }
    htmlContent +=
      `<div class="tag-item-container">` +
      items
        .map((item) => {
          const displayName = item.name.replace(/\[[^\]]*\]/g, "").trim();
          const safeName = item.name
            .replace(/'/g, "\\'")
            .replace(/[\r\n]/g, "");
          return `<button class="tag-item pop-up-animation" onclick="window.applyFilter('${type}', '${safeName}')">${displayName} <span class="tag-count">${item.count}</span></button>`;
        })
        .join("") +
      `</div>`;
  }
  document.getElementById("tagCloudContainer").innerHTML = htmlContent;
};

window.renderFeed = function () {
  const feed = document.getElementById("feedList");
  const recent = [...window.animeDB].slice(0, 15);
  const myDisplayName =
    localStorage.getItem("otaku_log_display_name") || "自分";
  const myAccountId =
    localStorage.getItem("otaku_log_account_id") || "otaku_log";
  const myAvatarUrl = localStorage.getItem("otaku_log_avatar_url") || "";
  const avatarHtml = myAvatarUrl
    ? `<img src="${myAvatarUrl}" class="feed-avatar-img">`
    : "ME";

  feed.innerHTML = recent
    .map((f) => {
      const memoHtml = f.memo ? `<div class="feed-text">${f.memo}</div>` : "";
      const dateObj = new Date(f.updated_at || Date.now());
      const dateStr = `${dateObj.getMonth() + 1}/${dateObj.getDate()} ${dateObj.getHours()}:${String(dateObj.getMinutes()).padStart(2, "0")}`;
      return `<div class="feed-item twitter-style"><div class="feed-avatar">${avatarHtml}</div><div class="feed-content"><div class="feed-header-info"><span class="feed-name">${myDisplayName}</span><span class="feed-id">@${myAccountId}</span><span class="feed-time">${dateStr}</span></div><div class="feed-anime-title" onclick="window.openEditModal('${f.anilist_id}')">${f.title}</div>${memoHtml}</div></div>`;
    })
    .join("");
};

window.updateAllViews = function () {
  window.renderFeed();
  if (window.currentView === "home") {
    window.renderGrid();
  } else if (window.currentView === "oshiChara") {
    window.renderGlobalOshiView();
  } else {
    window.renderListView(window.currentView);
  }
};

// -----------------------------------------
// ④ フィルター・並び替え機能
// -----------------------------------------
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

// 「解除してHOMEへ」ボタン
document.getElementById("clearFilterBtn")?.addEventListener("click", () => {
  window.filterQuery = null;
  window.currentView = "home";
  const mainInput = document.getElementById("mainSearchInput");
  if (mainInput) mainInput.value = "";

  const oshiArea = document.getElementById("oshiCharaArea");
  if (oshiArea) oshiArea.classList.add("hidden");

  document.getElementById("mainActionRow").style.display = "flex";
  document.getElementById("mainFilterRow").style.display = "flex";
  document.getElementById("animeGrid").classList.remove("hidden");
  document.getElementById("breadcrumbArea").classList.add("hidden");
  window.renderGrid();
});
