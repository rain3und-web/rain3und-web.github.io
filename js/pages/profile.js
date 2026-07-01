// =========================================================
// 👤 js/pages/profile.js：マイページ・プロフィール・推し画面
// =========================================================

// --- app.js から持ってきたプロフィール設定の処理 ---
const profileImgUrlInput = document.getElementById("profileImgUrl");
const profileDisplayNameInput = document.getElementById("profileDisplayName");
const profileNameInput = document.getElementById("profileName");
const profileAvatarWrapper = document.getElementById("profileAvatarWrapper");

if (profileDisplayNameInput)
  profileDisplayNameInput.value =
    localStorage.getItem("otaku_log_display_name") || "";
if (profileNameInput)
  profileNameInput.value = localStorage.getItem("otaku_log_account_id") || "";
if (profileImgUrlInput)
  profileImgUrlInput.value = localStorage.getItem("otaku_log_avatar_url") || "";

window.updateAvatarPreview = function () {
  if (!profileImgUrlInput || !profileAvatarWrapper) return;
  const url = profileImgUrlInput.value.trim();
  if (url) {
    profileAvatarWrapper.innerHTML = `<img src="${url}">`;
  } else {
    profileAvatarWrapper.innerHTML = "ME";
  }
};
if (profileImgUrlInput) {
  window.updateAvatarPreview();
  profileImgUrlInput.addEventListener("input", window.updateAvatarPreview);
}
document.getElementById("clearIconBtn")?.addEventListener("click", () => {
  if (profileImgUrlInput) profileImgUrlInput.value = "";
  window.updateAvatarPreview();
});

document
  .getElementById("saveProfileBtn")
  .addEventListener("click", async () => {
    if (!window.currentUserId) {
      alert("保存するにはログインが必要です！");
      return;
    }
    const dName = profileDisplayNameInput.value.trim();
    const aId = profileNameInput.value.trim();
    const aUrl = profileImgUrlInput.value.trim();
    localStorage.setItem("otaku_log_display_name", dName);
    localStorage.setItem("otaku_log_account_id", aId);
    localStorage.setItem("otaku_log_avatar_url", aUrl);

    await saveUserProfileToDB(window.currentUserId, {
      display_name: dName,
      account_id: aId,
      avatar_url: aUrl,
    });

    if (document.getElementById("headerName"))
      document.getElementById("headerName").innerText = dName;
    if (document.getElementById("headerId"))
      document.getElementById("headerId").innerText = "@" + aId;
    const headerAvatar = document.getElementById("headerAvatar");
    if (headerAvatar) {
      headerAvatar.innerHTML = aUrl
        ? `<img src="${aUrl}" class="feed-avatar-img">`
        : "ME";
    }

    const btn = document.getElementById("saveProfileBtn");
    btn.innerText = "保存しました！";
    setTimeout(() => {
      btn.innerText = "プロフィールを保存";
      btn.style.background = "";
    }, 2000);
    window.renderFeed();
  });
