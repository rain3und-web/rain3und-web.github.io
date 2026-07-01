// ==========================================
// 🔑 Google API & OAuth 2.0 認証管理設定
// ==========================================

// 🚨 【ここにあなたのクライアントIDを貼り付けてください】
const CLIENT_ID =
  "494923453363-fqgccmebini73aia6bk0t9jjk9dg96jt.apps.googleusercontent.com";

// アプリが要求するGoogleの権限（スプシの読み書き ＆ ドライブのファイル作成）
const SCOPES =
  "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file";

let tokenClient;
let gapiInited = false;
let gisInited = false;

// 画面起動時にGoogleライブラリを初期化する
document.addEventListener("DOMContentLoaded", () => {
  gapiLoaded();
  gisLoaded();

  // UI関連ボタンのイベント紐づけ
  setupAuthUIEvents();
});

// ① Google API クライアント (gapi) の初期化
function gapiLoaded() {
  gapi.load("client", async () => {
    await gapi.client.init({
      discoveryDocs: [
        "https://sheets.googleapis.com/$discovery/rest?version=v4",
        "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
      ],
    });
    gapiInited = true;
    checkExistingToken();
  });
}

// ② Google Identity Services (gis) ログイン画面の初期化
function gisLoaded() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: async (resp) => {
      if (resp.error !== undefined) {
        alert("ログインに失敗したか、キャンセルされました。");
        throw resp;
      }
      console.log("🔑 Googleログイン成功！通行証を取得しました。");

      // トークンをブラウザに一時保存（リロード対策）
      localStorage.setItem("gapi_access_token", resp.access_token);

      // ログイン成功後のデータ・UI処理へ
      await onLoginSuccess();
    },
  });
  gisInited = true;
  checkExistingToken();
}

// すでにログイン済みのトークンが残っているかチェックする
async function checkExistingToken() {
  if (gapiInited && gisInited) {
    const savedToken = localStorage.getItem("gapi_access_token");
    if (savedToken) {
      gapi.client.setToken({ access_token: savedToken });
      console.log("⚡ ログイン状態を復元しました。");
      await onLoginSuccess();
    } else {
      // トークンがなければログアウト状態のUIにする
      onLogoutSuccess();
    }
  }
}

// ==========================================
// 🕹️ UIイベントの紐づけ（元のコードを移植）
// ==========================================
function setupAuthUIEvents() {
  // Googleログインボタンのコンテナ生成とクリック処理
  const btnContainer = document.getElementById("googleLoginBtnContainer");
  if (btnContainer) {
    btnContainer.innerHTML = `
        <button id="realGoogleBtn" class="dummy-google-btn google-btn-inner">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" class="google-icon-img"> 
            Googleでログイン
        </button>`;

    document.getElementById("realGoogleBtn").addEventListener("click", () => {
      handleGoogleLogin();
    });
  }

  // ヘッダーのログアウトボタン
  const headerLogoutBtn = document.getElementById("headerLogoutBtn");
  if (headerLogoutBtn) {
    headerLogoutBtn.addEventListener("click", () => handleGoogleLogout());
  }

  // ヘッダーのログインボタン（オーバーレイを表示）
  const headerLoginBtn = document.getElementById("headerLoginBtn");
  if (headerLoginBtn) {
    headerLoginBtn.addEventListener("click", () => {
      const overlay = document.getElementById("loginOverlay");
      if (overlay) overlay.classList.remove("hidden");
    });
  }

  // ログインモーダルの外側をクリックしたら閉じる処理
  const loginOverlay = document.getElementById("loginOverlay");
  if (loginOverlay) {
    loginOverlay.addEventListener("click", (e) => {
      if (e.target.id === "loginOverlay") loginOverlay.classList.add("hidden");
    });
  }
}

// ログイン処理のトリガー
function handleGoogleLogin() {
  if (!tokenClient) return;
  // ポップアップを強制表示して同意を得る
  tokenClient.requestAccessToken({ prompt: "consent" });
}

// ログアウト処理のトリガー
function handleGoogleLogout() {
  const token = gapi.client.getToken();
  if (token !== null) {
    google.accounts.oauth2.revoke(token.access_token, () => {
      gapi.client.setToken(null);
      localStorage.removeItem("gapi_access_token");
      localStorage.removeItem("user_spreadsheet_id");
      window.userSpreadsheetId = null;
      console.log("🔒 ログアウトしました。");
      onLogoutSuccess();
      location.reload();
    });
  }
}

// ==========================================
// 🟢 ログイン成功時のデータ & UI反映ロジック
// ==========================================
async function onLoginSuccess() {
  const userPanel = document.getElementById("userProfilePanel");
  const loginPanel = document.getElementById("loginPromptPanel");

  try {
    // 1. スプシの自動検索 ＆ 自動生成
    await setupUserSpreadsheet();

    // 💡 修正：Googleログイン情報（gapi.auth2）から本物のユーザー情報を安全に取得
    let googleUser = null;
    if (typeof gapi !== "undefined" && gapi.auth2) {
      const authInstance = gapi.auth2.getAuthInstance();
      if (authInstance && authInstance.isSignedIn.get()) {
        googleUser = authInstance.currentUser.get().getBasicProfile();
      }
    }

    // 💡 修正：「雨音」や「usukidesu」の直書きを廃止し、Googleデータ ➔ なければ初期値へ
    let profile = {
      // 名前：Google名 ➔ なければ localStorage ➔ なければ「新規ユーザー」
      display_name: googleUser
        ? googleUser.getName()
        : localStorage.getItem("otaku_log_display_name") || "新規ユーザー",
      // ID：Googleのメールアドレス ➔ なければ localStorage ➔ なければ空
      account_id: googleUser
        ? googleUser.getEmail()
        : localStorage.getItem("otaku_log_account_id") || "",
      // アイコン：Googleの画像URL ➔ なければ localStorage ➔ なければ空
      avatar_url: googleUser
        ? googleUser.getImageUrl()
        : localStorage.getItem("otaku_log_avatar_url") || "",
    };

    // 次回以降のために最新情報を localStorage に同期
    localStorage.setItem("otaku_log_display_name", profile.display_name);
    localStorage.setItem("otaku_log_account_id", profile.account_id);
    localStorage.setItem("otaku_log_avatar_url", profile.avatar_url);

    // グローバルに保持（これまでの user.uid の代わりにメールアドレスなどをセット）
    window.currentUserId = profile.account_id;

    // 💡 追記：さっき作った2枚目のスプシ（user_profileタブ）にログイン時の最新情報を自動保存・更新！
    if (typeof saveUserProfileToDB === "function" && profile.account_id) {
      await saveUserProfileToDB(profile.account_id, profile);
    }

    // 3. UIへの反映（元のコードそのまま）
    if (document.getElementById("headerName"))
      document.getElementById("headerName").innerText = profile.display_name;
    if (document.getElementById("headerId"))
      document.getElementById("headerId").innerText = "@" + profile.account_id;

    const headerAvatar = document.getElementById("headerAvatar");
    if (headerAvatar) {
      headerAvatar.innerHTML = profile.avatar_url
        ? `<img src="${profile.avatar_url}" class="feed-avatar-img">`
        : "ME";
    }

    if (userPanel) userPanel.classList.remove("hidden");
    if (loginPanel) loginPanel.classList.add("hidden");

    // 4. スプシからのアニメデータ読み込み関数を呼び出す
    if (typeof window.fetchAndRenderAllData === "function") {
      window.fetchAndRenderAllData();
    } else if (typeof fetchData === "function") {
      fetchData();
    }

    // 設定ページの入力欄への反映
    if (document.getElementById("profileDisplayName"))
      document.getElementById("profileDisplayName").value =
        profile.display_name;
    if (document.getElementById("profileName"))
      document.getElementById("profileName").value = profile.account_id;
    if (document.getElementById("profileImgUrl"))
      document.getElementById("profileImgUrl").value = profile.avatar_url;
    if (typeof updateAvatarPreview === "function") updateAvatarPreview();

    // ログインモーダルを閉じる
    const overlay = document.getElementById("loginOverlay");
    if (overlay) overlay.classList.add("hidden");
  } catch (err) {
    console.error("ログイン後の初期化エラー:", err);
  }
}
// ==========================================
// 🔴 ログアウト状態のUI反映ロジック
// ==========================================
function onLogoutSuccess() {
  const userPanel = document.getElementById("userProfilePanel");
  const loginPanel = document.getElementById("loginPromptPanel");

  window.currentUserId = null;
  window.userSpreadsheetId = null;

  if (userPanel) userPanel.classList.add("hidden");
  if (loginPanel) loginPanel.classList.remove("hidden");

  if (typeof animeDB !== "undefined") animeDB = [];
  if (typeof updateAllViews === "function") updateAllViews();

  // スプライト起動画面のフェードアウト処理
  setTimeout(() => {
    const overlay = document.getElementById("startupOverlay");
    if (overlay) overlay.classList.add("fade-out");
  }, 1000);

  const overlay = document.getElementById("loginOverlay");
  if (overlay) overlay.classList.remove("hidden");
}

// ==========================================
// 📄 ユーザー専用スプレッドシートの作成・検索ロジック
// ==========================================
async function setupUserSpreadsheet() {
  const cachedId = localStorage.getItem("user_spreadsheet_id");
  if (cachedId) {
    window.userSpreadsheetId = cachedId;
    console.log(`⭕ キャッシュからスプシIDを復元: ${window.userSpreadsheetId}`);
    return;
  }

  console.log(
    "🔍 ユーザーのGoogleドライブから 'anime_log_db' を探しています...",
  );

  const response = await gapi.client.drive.files.list({
    q: "name = 'anime_log_db' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false",
    fields: "files(id, name)",
    spaces: "drive",
  });

  const files = response.result.files;
  if (files && files.length > 0) {
    window.userSpreadsheetId = files[0].id;
    console.log(
      `⭕ 既存のスプシを発見しました！ ID: ${window.userSpreadsheetId}`,
    );
  } else {
    console.log("✨ スプシが見つからないため、新しく作成します...");

    const createResponse = await gapi.client.sheets.spreadsheets.create({
      resource: {
        properties: { title: "anime_log_db" },
        sheets: [
          { properties: { title: "anime_log" } },
          { properties: { title: "profile" } },
        ],
      },
      fields: "spreadsheetId",
    });

    window.userSpreadsheetId = createResponse.result.spreadsheetId;
    console.log(
      `🎉 新しいスプシを自動作成しました！ ID: ${window.userSpreadsheetId}`,
    );
    await initSpreadsheetHeaders();
  }

  localStorage.setItem("user_spreadsheet_id", window.userSpreadsheetId);
}

async function initSpreadsheetHeaders() {
  const headers = [
    "anilist_id",
    "title",
    "watch_status",
    "my_score",
    "score_story",
    "score_visual",
    "score_character",
    "score_music",
    "score_resonance",
    "format",
    "year",
    "season",
    "episodes",
    "genres",
    "director",
    "studio",
    "cast",
    "cover_url",
    "official_site",
    "created_at",
    "updated_at",
    "img_position",
    "memo",
    "characters",
    "user_id",
  ];

  await gapi.client.sheets.spreadsheets.values.update({
    spreadsheetId: window.userSpreadsheetId,
    range: "anime_log!A1",
    valueInputOption: "RAW",
    resource: { values: [headers] },
  });
  console.log("📄 スプシにヘッダー行を書き込みました。");
}
