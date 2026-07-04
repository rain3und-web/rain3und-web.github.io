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
      // 💡 修正ポイント1: character（推しキャラ）と year_season（シーズン）をマップに追加
      const typeMap = {
        genre: "ジャンル",
        voiceActor: "声優",
        director: "監督",
        studio: "制作会社",
        year: "放送シーズン",
        year_season: "放送シーズン", // 🌟 シーズン別から戻るときも「放送年一覧へ戻る」にする
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

        // 💡 修正ポイント2: 戻り先のビュー判定に year_season と character を考慮
        returnBtn.onclick = () => {
          if (window.filterQuery.type === "character") {
            window.switchView("oshiChara");
          } else if (window.filterQuery.type === "year_season") {
            window.switchView("year"); // 🌟 year_season の場合は 放送年(year) の一覧に戻す！
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
      if (window.filterQuery.type === "year_season") {
        const [targetYear, targetSeason] = window.filterQuery.value.split("-");
        return a.year == targetYear && a.season === targetSeason;
      }
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
      // 💡 ここも「未履修」に変更して、正しくデータベースから抽出できるようにします！
      if (
        window.filterQuery.type === "watch_status" &&
        window.filterQuery.value === "積みアニメ"
      ) {
        return (
          a.watch_status === "未履修" ||
          a.watch_status === "再履修" ||
          a.watch_status === "履修中"
        );
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

    const imgPosition = anime.img_position || "center center";
    card.style.setProperty("--img-pos", imgPosition);

    // 💡 漢字のシーズン（春・夏・秋・冬）が空でなければ、スペースで繋いでバッジにします
    const seasonText = anime.season
      ? `${anime.year || ""} ${anime.season}`
      : anime.year || "-";

    // 💡 format（TV等）と episodes（話数）を綺麗に結合
    const infoParts = [];
    if (anime.format) {
      // 辞書にあれば日本語に変換、なければ元の文字を使う
      const displayFormat = formatTranslationMap[anime.format] || anime.format;
      infoParts.push(displayFormat);
    }
    if (anime.episodes) infoParts.push(`${anime.episodes}`);
    const infoText = infoParts.join(" / ");

    card.innerHTML = `
    <div class="card-img-wrapper">
      <img src="${anime.cover_url}" class="card-img">
    </div>
    <h3 class="card-title">${anime.title}</h3>
    <div class="card-meta-container">
      <span class="meta-season-badge">${seasonText}</span>
      <span class="meta-info-text">${infoText}</span>
    </div>
    <div class="card-status-row">
      <div class="status-pill ${statusClass}">${statusLabel}</div>
      <div class="score-display">
        <span class="score-icon">★</span>
        <span class="score-num">${score}</span>
      </div>
    </div>
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
      btnName.innerText = "シーズン別";
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
    year: "放送シーズン",
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
      // 4桁の数字（年）だけを綺麗に抽出する（例: "2026春" や "2026年" から "2026" を取る）
      const match = String(a.year).match(/\d{4}/);
      const y = match ? match[0] : null;

      if (y) {
        if (window.listSortMode === "count") {
          // ①「作品数順」のときは、今まで通りシンプルに年ごとの合計をカウント
          counts[y] = (counts[y] || 0) + 1;
        } else {
          // ②「シーズン別」のときは、年の中にさらに春夏秋冬の部屋を作ってカウント
          if (!counts[y]) {
            counts[y] = { total: 0, 春: 0, 夏: 0, 秋: 0, 冬: 0 };
          }
          counts[y].total++;

          // アニメに登録されている季節（漢字）をチェックして、該当する季節のカウントを増やす
          const s = a.season || "";
          if (s.includes("春")) counts[y]["春"]++;
          else if (s.includes("夏")) counts[y]["夏"]++;
          else if (s.includes("秋")) counts[y]["秋"]++;
          else if (s.includes("冬")) counts[y]["冬"]++;
        }
      }
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
        // -------------------------------------------------------------
        // 【ルートA】右上のボタンが「シーズン別」のとき
        // -------------------------------------------------------------
        if (window.listSortMode === "name") {
          // 1. まずデータを「年代（10年ごと）」にグループ分けする
          let decadeGroups = {};

          items.forEach((it) => {
            const y = parseInt(it.name);
            if (!isNaN(y)) {
              const decade = Math.floor(y / 10) * 10;
              if (!decadeGroups[decade]) {
                decadeGroups[decade] = { total: 0, years: [] };
              }

              const totalCount =
                it.count && typeof it.count === "object"
                  ? it.count.total || 0
                  : it.count || 0;

              if (
                !decadeGroups[decade].years.some(
                  (existing) => existing.name === it.name,
                )
              ) {
                decadeGroups[decade].total += totalCount;
                decadeGroups[decade].years.push(it);
              }
            }
          });

          // 2. 年代を「新しい順（2020年代が一番上）」に並び替える
          const sortedDecades = Object.keys(decadeGroups).sort((a, b) => b - a);

          htmlContent = `<div class="tag-view-header"><h2 class="tag-view-title">${titleMap[type]}</h2></div>`;
          htmlContent += `<div class="decade-accordion-container">`;

          sortedDecades.forEach((decade) => {
            const group = decadeGroups[decade];
            group.years.sort((a, b) => parseInt(b.name) - parseInt(a.name));

            htmlContent += `
              <div class="decade-section" id="decade-section-${decade}">
                <button class="decade-toggle-btn" onclick="window.toggleDecadeAccordion(${decade})">
                  <span>${decade} 年代 <span class="tag-count">${group.total} 作品</span></span>
                  <svg class="arrow-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </button>
                
                <div class="decade-content" id="decade-content-${decade}">
                  ${group.years
                    .map((it) => {
                      const yearNum = it.name;
                      const data =
                        it.count && typeof it.count === "object"
                          ? it.count
                          : {
                              total: it.count || 0,
                              春: 0,
                              夏: 0,
                              秋: 0,
                              冬: 0,
                            };

                      return `
                      <div class="season-row">
                        <button class="tag-item pop-up-animation" onclick="window.applyFilter('year', '${yearNum}')" style="min-width: 120px; justify-content: center;">${yearNum}年 <span class="tag-count">${data.total}</span>
                        </button>
                        <div class="season-sub-items">
                          ${["春", "夏", "秋", "冬"]
                            .map((season) => {
                              const count = data[season] || 0;
                              const isDisabled = count === 0;

                              // 🌟 季節に応じたCSSクラスの出し分けマッピング
                              const seasonClassMap = {
                                春: "spring",
                                夏: "summer",
                                秋: "autumn",
                                冬: "winter",
                              };
                              const seasonClass = `btn-season-${seasonClassMap[season]}`;

                              // 無効化時と有効化時でクラスとクリックイベントを切り替え
                              const statusClass = isDisabled ? "disabled" : "";
                              const clickAction = isDisabled
                                ? ""
                                : `onclick="window.applyFilter('year_season', '${yearNum}-${season}')"`;

                              return `<button class="tag-item btn-season ${seasonClass} ${statusClass} pop-up-animation" ${clickAction}>${season} <span class="tag-count">${count}</span></button>`;
                            })
                            .join("")}
                        </div>
                      </div>
                    `;
                    })
                    .join("")}
                </div>
              </div>
            `;
          });

          htmlContent += `</div>`;

          document.getElementById("tagCloudContainer").innerHTML = htmlContent;
          return;

          // -------------------------------------------------------------
          // 【ルートB】右上のボタンが「作品数順」のとき
          // -------------------------------------------------------------
        } else {
          items.sort((a, b) => b.count - a.count);

          htmlContent +=
            `<div class="tag-item-container">` +
            items
              .map((it) => {
                const displayName = it.name.replace(/\[[^\]]*\]/g, "").trim();
                const safeName = it.name
                  .replace(/'/g, "\\'")
                  .replace(/[\r\n]/g, "");
                return `<button class="tag-item pop-up-animation" onclick="window.applyFilter('${type}', '${safeName}')">${displayName} <span class="tag-count">${it.count}</span></button>`;
              })
              .join("") +
            `</div>`;

          document.getElementById("tagCloudContainer").innerHTML = htmlContent;
          return;
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

  // 修正：otaku_log_account_id から otaku_log_dummy_id へ変更
  const myDummyId = localStorage.getItem("otaku_log_dummy_id") || "user";

  const myAvatarUrl = localStorage.getItem("otaku_log_avatar_url") || "";
  const avatarHtml = myAvatarUrl
    ? `<img src="${myAvatarUrl}" class="feed-avatar-img">`
    : "ME";

  feed.innerHTML = recent
    .map((f) => {
      const memoHtml = f.memo ? `<div class="feed-text">${f.memo}</div>` : "";
      const dateObj = new Date(f.updated_at || Date.now());
      const dateStr = `${dateObj.getMonth() + 1}/${dateObj.getDate()} ${dateObj.getHours()}:${String(dateObj.getMinutes()).padStart(2, "0")}`;

      // 修正：@${myAccountId} を @${myDummyId} に変更
      return `<div class="feed-item twitter-style"><div class="feed-avatar">${avatarHtml}</div><div class="feed-content"><div class="feed-header-info"><span class="feed-name">${myDisplayName}</span><span class="feed-id">@${myDummyId}</span><span class="feed-time">${dateStr}</span></div><div class="feed-anime-title" onclick="window.openEditModal('${f.anilist_id}')">${f.title}</div>${memoHtml}</div></div>`;
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

// 🌟【新機能】年代別アコーディオンをパカパカ開閉する関数
window.toggleDecadeAccordion = function (targetDecade) {
  // 🌟 画面内にあるすべてのアコーディオンコンテンツとセクションを取得
  const allContents = document.querySelectorAll(".decade-content");
  const allSections = document.querySelectorAll(".decade-section");

  const targetContent = document.getElementById(
    `decade-content-${targetDecade}`,
  );
  const targetSection = document.getElementById(
    `decade-section-${targetDecade}`,
  );
  const targetArrow = targetSection
    ? targetSection.querySelector(".arrow-icon")
    : null;

  if (!targetContent) return;

  // 現在の状態を退避
  const isClosed =
    targetContent.style.display === "none" ||
    targetContent.style.display === "";

  // 🌟 【新規】ターゲット以外をすべて閉じるループ
  allContents.forEach((content) => {
    content.style.display = "none";
  });
  allSections.forEach((section) => {
    section.style.background = "var(--c-white)";
    const arrow = section.querySelector(".arrow-icon");
    if (arrow) arrow.style.transform = "rotate(0deg)";
  });

  // もしクリックしたものが閉じていたなら、それだけを開く
  if (isClosed) {
    targetContent.style.display = "flex";
    if (targetArrow) targetArrow.style.transform = "rotate(180deg)";
    if (targetSection) targetSection.style.background = "#F8FAFC"; // ほんのり選択色
  }
};

// =========================================================
// 🏠プライバシーポリシー
// =========================================================

// モーダルを開く関数
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden"; // モーダル開いてる間は後ろのスクロールを固定
  }
}

// モーダルを閉じる関数
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("hidden");
    document.body.style.overflow = ""; // スクロール固定を解除
  }
}

// モーダルの外側（黒背景）をクリックした時も閉じるようにする設定
document.querySelectorAll(".modal-overlay").forEach((overlay) => {
  overlay.addEventListener("click", (e) => {
    // クリックされたのが子要素（白い箱）ではなく、背景自体だった場合だけ閉じる
    if (e.target === overlay) {
      closeModal(overlay.id);
    }
  });
});

// --- 💡 ボタンとの紐付け設定 ---
document.addEventListener("DOMContentLoaded", () => {
  // 1. フッターの「オタクログとは」ボタン（既存）
  const aboutBtn = document.getElementById("footerAboutBtn");
  if (aboutBtn) {
    aboutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      openModal("aboutModal");
    });
  }

  // ✨ 2. フッターの「利用規約」ボタン（追加）
  const termsBtn = document.getElementById("footerTermsBtn");
  if (termsBtn) {
    termsBtn.addEventListener("click", (e) => {
      e.preventDefault();
      openModal("termsModal");
    });
  }

  // ✨ 3. フッターの「プライバシーポリシー」ボタン（追加）
  const privacyBtn = document.getElementById("footerPrivacyBtn");
  if (privacyBtn) {
    privacyBtn.addEventListener("click", (e) => {
      e.preventDefault();
      openModal("privacyModal");
    });
  }

  // 2. 左ナビなどの「マイページ（設定）」ボタン
  // （もし左ナビのボタンに id="navMyPageBtn" などがあれば、ここに繋げられます）
  const myPageBtn = document.getElementById("navMyPageBtn");
  if (myPageBtn) {
    myPageBtn.addEventListener("click", (e) => {
      e.preventDefault();
      openModal("myPageModal");
    });
  }
});
