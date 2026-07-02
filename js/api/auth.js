// ==========================================
// 🔑 Google API & OAuth 2.0 認証管理設定
// ==========================================

// 🚨 クライアントID
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
      onLogoutSuccess();
    }
  }
}

// ==========================================
// 🕹️ UIイベントの紐づけ
// ==========================================
function setupAuthUIEvents() {
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

  const headerLogoutBtn = document.getElementById("headerLogoutBtn");
  if (headerLogoutBtn) {
    headerLogoutBtn.addEventListener("click", () => handleGoogleLogout());
  }

  const headerLoginBtn = document.getElementById("headerLoginBtn");
  if (headerLoginBtn) {
    headerLoginBtn.addEventListener("click", () => {
      const overlay = document.getElementById("loginOverlay");
      if (overlay) overlay.classList.remove("hidden");
    });
  }

  const loginOverlay = document.getElementById("loginOverlay");
  if (loginOverlay) {
    loginOverlay.addEventListener("click", (e) => {
      if (e.target.id === "loginOverlay") loginOverlay.classList.add("hidden");
    });
  }
}

function handleGoogleLogin() {
  if (!tokenClient) return;
  tokenClient.requestAccessToken({ prompt: "consent" });
}

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

    // 🌐 まずGoogleのuserInfoから最新のメアド（固定の鍵）を特定する
    let googleProfile = null;
    try {
      const token = gapi.client.getToken();
      if (token && token.access_token) {
        const userInfoRes = await fetch(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: { Authorization: `Bearer ${token.access_token}` },
          },
        );
        if (userInfoRes.ok) {
          googleProfile = await userInfoRes.json();
        }
      }
    } catch (e) {
      console.warn("Googleプロフィール取得失敗:", e);
    }

    // 🔑 【裏の絶対的な鍵】としてGoogleのメールアドレスを確定（変わらないもの）
    const secureUserEmail =
      googleProfile?.email ||
      localStorage.getItem("secure_user_email_id") ||
      "guest_user";
    localStorage.setItem("secure_user_email_id", secureUserEmail);

    // 🌟 今後の同期処理のために、グローバル変数にメールアドレスを完全固定
    window.currentUserId = secureUserEmail;

    // 📄 2枚目の「user_profile」シートから、裏の鍵（メアド）を元にカスタム設定を探す
    let savedProfile = null;
    try {
      const profileRes = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: window.userSpreadsheetId,
        range: "user_profile!A1:E", // 🌟 A:メアド, B:名前, C:画像, D:ダミーID, E:最終更新
      });
      const rows = profileRes.result.values || [];

      // A列（メアド）が一致する行を探す
      const matchedRow = rows.find(
        (row) => String(row[0]) === String(secureUserEmail),
      );
      if (matchedRow) {
        savedProfile = {
          account_id: matchedRow[0], // A列: メアド（鍵）
          display_name: matchedRow[1], // B列: 表示名
          avatar_url: matchedRow[2], // C列: アイコン画像
          dummy_id: matchedRow[3], // D列: お遊び用ダミーID
          last_updated: matchedRow[4], // E列: ⏱️ 5列目に最終更新！
        };
        console.log("⭕ スプレッドシートからプロフィールを復元しました");
      }
    } catch (e) {
      console.warn("スプシからのプロファイル取得失敗（初回ログインなど）:", e);
    }

    // 💡 決定：画面に表示するプロフィールデータオブジェクト
    let profile = {
      display_name:
        savedProfile?.display_name ||
        googleProfile?.name ||
        localStorage.getItem("otaku_log_display_name") ||
        "アニメオタク",
      account_id:
        savedProfile?.dummy_id ||
        googleProfile?.email?.split("@")[0] ||
        localStorage.getItem("otaku_log_account_id") ||
        "user", // 🌟 ここにお遊び用ダミーIDを確実に代入
      avatar_url:
        savedProfile?.avatar_url ||
        googleProfile?.picture ||
        localStorage.getItem("otaku_log_avatar_url") ||
        "",
    };

    // ブラウザのキャッシュ（localStorage）に最新状態を記憶
    localStorage.setItem("otaku_log_display_name", profile.display_name);
    localStorage.setItem("otaku_log_account_id", profile.account_id); // rain3und などが入る
    localStorage.setItem("otaku_log_avatar_url", profile.avatar_url);

    // 2. スプシにまだデータがない場合、Googleの初期データをベースに1行目を新規保存
    if (!savedProfile && typeof saveUserProfileToDB === "function") {
      // 5列構成の仕様に合わせて、API側の関数にデータを渡す
      await saveUserProfileToDB(secureUserEmail, {
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        dummy_id: profile.account_id,
      });
    }

    // 3. UIへの反映
    if (document.getElementById("headerName"))
      document.getElementById("headerName").innerText = profile.display_name;

    if (document.getElementById("headerId")) {
      document.getElementById("headerId").innerText = "@" + profile.account_id;
    }

    const headerAvatar = document.getElementById("headerAvatar");
    if (headerAvatar) {
      headerAvatar.innerHTML = profile.avatar_url
        ? `<img src="${profile.avatar_url}" class="feed-avatar-img">`
        : "ME";
    }

    if (userPanel) userPanel.classList.remove("hidden");
    if (loginPanel) loginPanel.classList.add("hidden");

    // 4. アニメデータの読み込み（次のステップで調整するため一旦そのまま）
    if (typeof window.fetchAndRenderAllData === "function") {
      window.fetchAndRenderAllData();
    } else if (typeof fetchData === "function") {
      fetchData();
    }

    // マイページ（設定画面）の入力欄への初期値セット
    if (document.getElementById("profileDisplayName"))
      document.getElementById("profileDisplayName").value =
        profile.display_name;
    if (document.getElementById("profileName"))
      document.getElementById("profileName").value = profile.account_id;
    if (document.getElementById("profileImgUrl"))
      document.getElementById("profileImgUrl").value = profile.avatar_url;
    if (typeof updateAvatarPreview === "function") updateAvatarPreview();

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
          { properties: { title: "user_profile" } },
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

// ※アニメデータ用のヘッダー初期化（1枚目からIDを撤去する方針なので、次のステップで連動させます）
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
    "user_id", // 🌟 ここは後ほど1枚目の修正ファイル（apiなど）を統合するときに、あなたの方針に合わせて完全に撤去または調整をかけます
  ];

  await gapi.client.sheets.spreadsheets.values.update({
    spreadsheetId: window.userSpreadsheetId,
    range: "anime_log!A1",
    valueInputOption: "RAW",
    resource: { values: [headers] },
  });
  console.log("📄 スプシにヘッダー行を書き込みました。");
}
