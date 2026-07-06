// =========================================================
// 🏠 js/pages/listView.js：リストビュー（ジャンル・声優・監督・制作会社・放送シーズン一覧）
// =========================================================

window.renderListView = function (type) {
  // 1. UIの表示切り替え（リストビューエリアを覚醒させる）
  document.getElementById("animeGrid").classList.add("hidden");
  document.getElementById("listViewArea").classList.remove("hidden");
  document.getElementById("mainActionRow").style.display = "none";
  document.getElementById("mainFilterRow").style.display = "none";
  document.getElementById("breadcrumbArea").classList.add("hidden");

  // 2. 右上の「並び替えトグルトップボタン」の制御
  const btns = document.querySelectorAll(".btn-sort-list");
  if (btns.length >= 2) {
    const btnCount = btns[0];
    const btnName = btns[1];

    if (type === "genre") {
      btnName.style.display = "none"; // ジャンルは名前順不要
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

  // 3. 各項目の作品数カウント処理
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
      const match = String(a.year).match(/\d{4}/);
      const y = match ? match[0] : null;

      if (y) {
        if (window.listSortMode === "count") {
          counts[y] = (counts[y] || 0) + 1;
        } else {
          if (!counts[y]) {
            counts[y] = { total: 0, 春: 0, 夏: 0, 秋: 0, 冬: 0 };
          }
          counts[y].total++;

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

  // 4. 【シーズン別 or 50音順（名前順）】の描画ロジック
  if (
    window.listSortMode === "name" &&
    (type === "year" || type === "voiceActor" || type === "director")
  ) {
    // -------------------------------------------------------------
    // 📅 ルートA-1：放送年の「シーズン別（年代別アコーディオン）」
    // -------------------------------------------------------------
    if (type === "year") {
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

      const sortedDecades = Object.keys(decadeGroups).sort((a, b) => b - a);
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
                      : { total: it.count || 0, 春: 0, 夏: 0, 秋: 0, 冬: 0 };

                  return `
                  <div class="season-row">
                    <button class="tag-item pop-up-animation" onclick="window.applyFilter('year', '${yearNum}')" style="min-width: 120px; justify-content: center;">${yearNum}年 <span class="tag-count">${data.total}</span></button>
                    <div class="season-sub-items">
                      ${["春", "夏", "秋", "冬"]
                        .map((season) => {
                          const count = data[season] || 0;
                          const isDisabled = count === 0;
                          const seasonClassMap = {
                            春: "spring",
                            夏: "summer",
                            秋: "autumn",
                            冬: "winter",
                          };
                          const seasonClass = `btn-season-${seasonClassMap[season]}`;
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
    }

    // -------------------------------------------------------------
    // 🗣️ ルートA-2：声優・監督の「50音名前順（あ・か・さ・た・な…）」
    // -------------------------------------------------------------
    let groups = {};
    items.forEach((item) => {
      const info = window.getActorGroupInfo(item.name);
      const groupName = info.group;
      const groupOrder = info.order;
      const sortKey = info.sortKey;

      if (!groups[groupName]) {
        groups[groupName] = { order: groupOrder, items: [] };
      }
      groups[groupName].items.push({ ...item, sortKey });
    });

    const sortedGroupNames = Object.keys(groups).sort(
      (a, b) => groups[a].order - groups[b].order,
    );

    sortedGroupNames.forEach((gName) => {
      groups[gName].items.sort((a, b) =>
        String(a.sortKey).localeCompare(String(b.sortKey), "ja"),
      );

      htmlContent += `
        <div class="tag-group-section">
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
    // -------------------------------------------------------------
    // 📊 ルートB：通常の「作品数順」または「ジャンル・制作会社の一覧」
    // -------------------------------------------------------------
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

/**
 * 🌟 年代別アコーディオンをパカパカ開閉する関数
 */
window.toggleDecadeAccordion = function (targetDecade) {
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

  const isClosed =
    targetContent.style.display === "none" ||
    targetContent.style.display === "";

  // 他を全部閉じる
  allContents.forEach((content) => (content.style.display = "none"));
  allSections.forEach((section) => {
    section.style.background = "var(--c-white)";
    const arrow = section.querySelector(".arrow-icon");
    if (arrow) arrow.style.transform = "rotate(0deg)";
  });

  // ターゲットだけを開閉
  if (isClosed) {
    targetContent.style.display = "flex";
    if (targetArrow) targetArrow.style.transform = "rotate(180deg)";
    if (targetSection) targetSection.style.background = "#F8FAFC";
  }
};
