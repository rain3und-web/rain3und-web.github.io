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
    const aId = profileNameInput.value.trim(); // ✨ これが表のお遊び用ダミーID（rain3undなど）
    const aUrl = profileImgUrlInput.value.trim();

    // 1. ブラウザのキャッシュを更新
    localStorage.setItem("otaku_log_display_name", dName);
    localStorage.setItem("otaku_log_account_id", aId);
    localStorage.setItem("otaku_log_avatar_url", aUrl);

    // 2. 🌟 修正：api.jsの受け取り口「dummy_id」に完全1対1で整合性を合わせる
    // 第1引数は裏の鍵（メアド＝window.currentUserId）。第2引数の名前を正確にマッピング。
    await saveUserProfileToDB(window.currentUserId, {
      display_name: dName,
      avatar_url: aUrl,
      dummy_id: aId, // 💡 決定：screen_idから、確定した共通キー「dummy_id」に修正して分裂を阻止！
    });

    // 3. 画面のヘッダーなどのUIを即時更新
    if (document.getElementById("headerName"))
      document.getElementById("headerName").innerText = dName;

    if (document.getElementById("headerId"))
      document.getElementById("headerId").innerText = "@" + aId; // メアドではなくダミーIDが表示される

    const headerAvatar = document.getElementById("headerAvatar");
    if (headerAvatar) {
      headerAvatar.innerHTML = aUrl
        ? `<img src="${aUrl}" class="feed-avatar-img">`
        : "ME";
    }

    // 4. ボタンの見た目を「保存しました」に変える処理
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
