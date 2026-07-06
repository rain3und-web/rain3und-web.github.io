// =========================================================
// 👤 js/pages/profile.js：マイページ・プロフィール管理
// プロフィール情報、アバタープレビュー、Gemini APIキーの安全な保存を制御します。
// =========================================================

// 📥 UI要素の取得
const profileImgUrlInput = document.getElementById("profileImgUrl");
const profileDisplayNameInput = document.getElementById("profileDisplayName");
const profileNameInput = document.getElementById("profileName");
const profileAvatarWrapper = document.getElementById("profileAvatarWrapper");

// Gemini APIキー用のUI要素
const geminiApiKeyInput = document.getElementById("geminiApiKeyInput");
const geminiUserEmailHidden = document.getElementById("geminiUserEmailHidden");
const togglePasswordBtn = document.getElementById("togglePasswordBtn");
const eyeIcon = document.getElementById("eyeIcon");

/**
 * 🔑 Gemini APIキーの設定を初期化する
 * ログインユーザーごとのキーをLocalStorageから安全に復元します
 */
function initGeminiKeySettings() {
  if (!window.currentUserId) return;

  if (geminiUserEmailHidden) {
    geminiUserEmailHidden.value = window.currentUserId;
  }

  if (geminiApiKeyInput) {
    const savedKey = localStorage.getItem(
      `gemini_api_key_${window.currentUserId}`,
    );

    if (savedKey === "EMPTY" || !savedKey) {
      geminiApiKeyInput.value = "";
    } else {
      geminiApiKeyInput.value = savedKey;
    }
  }
}

/**
 * 🖼️ アバター画像のプレビューを即時更新する
 */
window.updateAvatarPreview = function () {
  if (!profileImgUrlInput || !profileAvatarWrapper) return;
  const url = profileImgUrlInput.value.trim();
  if (url) {
    profileAvatarWrapper.innerHTML = `<img src="${url}" alt="Avatar Preview" onerror="this.parentNode.innerHTML='ERR'">`;
  } else {
    profileAvatarWrapper.innerHTML = "ME";
  }
};

/**
 * 🌟 画面ロード時の初期化処理（安全なデータ復元）
 */
function initializeProfilePage() {
  if (profileDisplayNameInput) {
    profileDisplayNameInput.value =
      localStorage.getItem("otaku_log_display_name") || "";
  }
  if (profileNameInput) {
    profileNameInput.value = localStorage.getItem("otaku_log_dummy_id") || "";
  }
  if (profileImgUrlInput) {
    profileImgUrlInput.value =
      localStorage.getItem("otaku_log_avatar_url") || "";
  }

  // アバターのプレビューを初回反映
  window.updateAvatarPreview();

  // ユーザーIDが存在すればAPIキーも復元
  if (window.currentUserId) {
    initGeminiKeySettings();
  }
}

// 🎬 初期化の実行
initializeProfilePage();

// -----------------------------------------
// 🔄 イベントリスナー（ユーザーの操作監視）
// -----------------------------------------

// URL入力欄の変更に合わせてプレビューをリアルタイム更新
profileImgUrlInput?.addEventListener("input", window.updateAvatarPreview);

// アイコン消去ボタンの動作
document.getElementById("clearIconBtn")?.addEventListener("click", () => {
  if (profileImgUrlInput) profileImgUrlInput.value = "";
  window.updateAvatarPreview();
});

/**
 * 👁️ 目のマーク（SVG）をクリックしたときの表示切り替え（パスワードトグル）
 */
togglePasswordBtn?.addEventListener("click", () => {
  if (!geminiApiKeyInput || !eyeIcon) return;

  if (geminiApiKeyInput.type === "password") {
    geminiApiKeyInput.type = "text";
    // 表示中用のSVG（斜線入り）に書き換え
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

/**
 * 💾 プロフィール保存ボタンのクリック処理（APIキー保存・スプシ送信連動）
 */
document
  .getElementById("saveProfileBtn")
  ?.addEventListener("click", async () => {
    if (!window.currentUserId) {
      alert("保存するにはログインが必要です！");
      return;
    }

    // 事前に隠し欄にメアドが入っているか最終確認
    if (geminiUserEmailHidden) {
      geminiUserEmailHidden.value = window.currentUserId;
    }

    const dName = profileDisplayNameInput
      ? profileDisplayNameInput.value.trim()
      : "";
    const aId = profileNameInput ? profileNameInput.value.trim() : "";
    const aUrl = profileImgUrlInput ? profileImgUrlInput.value.trim() : "";
    const aKey = geminiApiKeyInput ? geminiApiKeyInput.value.trim() : "";

    // 1. プロフィール情報をローカルストレージへ保存
    localStorage.setItem("otaku_log_display_name", dName);
    localStorage.setItem("otaku_log_dummy_id", aId);
    localStorage.setItem("otaku_log_avatar_url", aUrl);

    // 2. APIキーの保存
    if (aKey) {
      localStorage.setItem(`gemini_api_key_${window.currentUserId}`, aKey);
    } else {
      localStorage.setItem(`gemini_api_key_${window.currentUserId}`, "EMPTY");
    }

    // 3. プロフィール情報「だけ」を安全にDB（スプシ）に送信
    if (typeof window.saveUserProfileToDB === "function") {
      await window.saveUserProfileToDB(window.currentUserId, {
        display_name: dName,
        avatar_url: aUrl,
        dummy_id: aId,
      });
    }

    // 4. ブラウザのパスワードマネージャーに安全に記憶させる（アカウント情報の学習）
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

    // 5. UIの即時更新（ヘッダー等の表示を書き換え）
    if (document.getElementById("headerName")) {
      document.getElementById("headerName").innerText = dName;
    }
    if (document.getElementById("headerId")) {
      document.getElementById("headerId").innerText = "@" + aId;
    }

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

    // ボタンのフィードバックアニメーション
    const btn = document.getElementById("saveProfileBtn");
    if (btn) {
      btn.innerText = "保存しました！";
      setTimeout(() => {
        btn.innerText = "プロフィールを保存";
      }, 2000);
    }

    // タイムライン（フィード）画面があれば再描画
    if (typeof window.renderFeed === "function") {
      window.renderFeed();
    }
  });

/**
 * 🔒 GoogleAuthログインが完了した後に呼び出されるフック
 */
window.onGoogleAuthSuccess = function () {
  initGeminiKeySettings();
};
