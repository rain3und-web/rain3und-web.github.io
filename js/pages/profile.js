// =========================================================
// 👤 js/pages/profile.js：マイページ・プロフィール・推し画面
// =========================================================

const profileImgUrlInput = document.getElementById("profileImgUrl");
const profileDisplayNameInput = document.getElementById("profileDisplayName");
const profileNameInput = document.getElementById("profileName");
const profileAvatarWrapper = document.getElementById("profileAvatarWrapper");

// Gemini APIキー用の要素
const geminiApiKeyInput = document.getElementById("geminiApiKeyInput");
const geminiUserEmailHidden = document.getElementById("geminiUserEmailHidden");
const togglePasswordBtn = document.getElementById("togglePasswordBtn");
const eyeIcon = document.getElementById("eyeIcon");

// 🌟 初期読み込み処理
if (profileDisplayNameInput)
  profileDisplayNameInput.value =
    localStorage.getItem("otaku_log_display_name") || "";
if (profileNameInput)
  profileNameInput.value = localStorage.getItem("otaku_log_dummy_id") || "";
if (profileImgUrlInput)
  profileImgUrlInput.value = localStorage.getItem("otaku_log_avatar_url") || "";

function initGeminiKeySettings() {
  if (!window.currentUserId) return;

  if (geminiUserEmailHidden) geminiUserEmailHidden.value = window.currentUserId;

  if (geminiApiKeyInput) {
    const savedKey = localStorage.getItem(
      `gemini_api_key_${window.currentUserId}`,
    );

    if (savedKey === "EMPTY") {
      geminiApiKeyInput.value = "";
    } else if (savedKey) {
      geminiApiKeyInput.value = savedKey;
    } else {
      geminiApiKeyInput.value = "";
    }
  }
}

// ページを開いた時、すでにログイン中なら即座に適用
initGeminiKeySettings();

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

// 🌟 👁️ 目のマーク（SVG）をクリックしたときの表示切り替え（トグル）
togglePasswordBtn?.addEventListener("click", () => {
  if (!geminiApiKeyInput) return;

  if (geminiApiKeyInput.type === "password") {
    geminiApiKeyInput.type = "text";
    // 表示中用のSVG（斜線入り）に動的に書き換え
    eyeIcon.innerHTML = `
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
      <line x1="1" y1="1" x2="23" y2="23"></line>
    `;
  } else {
    geminiApiKeyInput.type = "password";
    // 非表示用の通常の目に書き換え
    eyeIcon.innerHTML = `
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    `;
  }
});

// 🌟 プロフィール保存ボタン（APIキーの保存も1つのボタンで完全に連動させる）
document
  .getElementById("saveProfileBtn")
  .addEventListener("click", async () => {
    if (!window.currentUserId) {
      alert("保存するにはログインが必要です！");
      return;
    }

    // 事前に隠し欄にメアドが入っているか最終確認
    if (geminiUserEmailHidden)
      geminiUserEmailHidden.value = window.currentUserId;

    const dName = profileDisplayNameInput.value.trim();
    const aId = profileNameInput.value.trim();
    const aUrl = profileImgUrlInput.value.trim();
    const aKey = geminiApiKeyInput ? geminiApiKeyInput.value.trim() : "";

    // 1. プロフィール情報をローカルストレージへ保存
    localStorage.setItem("otaku_log_display_name", dName);
    localStorage.setItem("otaku_log_dummy_id", aId);
    localStorage.setItem("otaku_log_avatar_url", aUrl);

    // 2. APIキーの保存（ここを修正！）
    // もし入力欄が空っぽなら「明示的に消したよ」という印（EMPTY）を保存する
    if (aKey) {
      localStorage.setItem(`gemini_api_key_${window.currentUserId}`, aKey);
    } else {
      localStorage.setItem(`gemini_api_key_${window.currentUserId}`, "EMPTY");
    }

    // 3. プロフィール情報「だけ」を安全にDB（スプシ）に送信
    await saveUserProfileToDB(window.currentUserId, {
      display_name: dName,
      avatar_url: aUrl,
      dummy_id: aId,
    });

    // 4. 🌟 パスワードマネージャーに「メアド＋APIキー」を安全に学習・記憶させる（Credential Management API）
    if (aKey && typeof window.PasswordCredential === "function") {
      try {
        const cred = new PasswordCredential({
          id: window.currentUserId,
          password: aKey,
          name: "Gemini API Key",
        });
        await navigator.credentials.store(cred);
      } catch (err) {
        console.log("Password Management hint skipped:", err);
      }
    }

    // 5. UIの即時更新
    if (document.getElementById("headerName"))
      document.getElementById("headerName").innerText = dName;
    if (document.getElementById("headerId"))
      document.getElementById("headerId").innerText = "@" + aId;

    const headerAvatar = document.getElementById("headerAvatar");
    if (headerAvatar) {
      if (aUrl) {
        headerAvatar.innerHTML = "";
        const img = document.createElement("img");
        img.src = aUrl;
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
    }, 2000);

    if (typeof window.renderFeed === "function") {
      window.renderFeed();
    }
  });

// GoogleAuthログインが完了した後にこの関数を呼び出すフックを、ログイン処理の末尾などにも1行追記しておくと完璧です
window.onGoogleAuthSuccess = function () {
  initGeminiKeySettings();
};
