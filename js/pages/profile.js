// =========================================================
// 👤 js/pages/profile.js：マイページ・プロフィール・推し画面
// =========================================================

const profileImgUrlInput = document.getElementById("profileImgUrl");
const profileDisplayNameInput = document.getElementById("profileDisplayName");
const profileNameInput = document.getElementById("profileName");
const profileAvatarWrapper = document.getElementById("profileAvatarWrapper");

if (profileDisplayNameInput)
  profileDisplayNameInput.value =
    localStorage.getItem("otaku_log_display_name") || "";
// 🌟 修正：正しい変数名で呼び出し
if (profileNameInput)
  profileNameInput.value = localStorage.getItem("otaku_log_dummy_id") || "";
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

    // 1. キャッシュのキーを統一
    localStorage.setItem("otaku_log_display_name", dName);
    localStorage.setItem("otaku_log_dummy_id", aId);
    localStorage.setItem("otaku_log_avatar_url", aUrl);

    // 2. api.jsの受け取り口「dummy_id」に完全マッピング
    await saveUserProfileToDB(window.currentUserId, {
      display_name: dName,
      avatar_url: aUrl,
      dummy_id: aId,
    });

    // 3. UIの即時更新
    if (document.getElementById("headerName"))
      document.getElementById("headerName").innerText = dName;
    if (document.getElementById("headerId"))
      document.getElementById("headerId").innerText = "@" + aId;

    const headerAvatar = document.getElementById("headerAvatar");
    if (headerAvatar) {
      if (aUrl) {
        headerAvatar.innerHTML = ""; // 一度中身をクリア
        const img = document.createElement("img");
        img.src = aUrl; // 💡srcに直接代入すれば、中にどれだけ変な文字が入っていてもただの「URL文字列」として安全に処理されます
        img.className = "feed-avatar-img";
        headerAvatar.appendChild(img);
      } else {
        headerAvatar.innerText = "ME";
      }
    }

    const btn = document.getElementById("saveProfileBtn");
    btn.innerText = "保存しました！";
    setTimeout(() => {
      btn.innerText = "プロフィールを保存";
      btn.style.background = "";
    }, 2000);

    if (typeof window.renderFeed === "function") {
      window.renderFeed();
    }
  });
