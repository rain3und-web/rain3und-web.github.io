// =========================================================
// js/pages/feed.js：右側フィード
// =========================================================

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
