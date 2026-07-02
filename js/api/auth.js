// ==========================================
// 🔑 Google API & OAuth 2.0 認証管理設定 (auth.js)
// ==========================================

const CLIENT_ID =
  "494923453363-fqgccmebini73aia6bk0t9jjk9dg96jt.apps.googleusercontent.com";

// 🌟 修正：メールアドレスとプロフィールを取得する権限を追加！
const SCOPES =
  "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile";

let tokenClient;
let gapiInited = false;
let gisInited = false;

document.addEventListener("DOMContentLoaded", () => {
  gapiLoaded();
  gisLoaded();
  setupAuthUIEvents();
});

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
      localStorage.setItem("gapi_access_token", resp.access_token);
      await onLoginSuccess();
    },
  });
  gisInited = true;
  checkExistingToken();
}

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

function setupAuthUIEvents() {
  const btnContainer = document.getElementById("googleLoginBtnContainer");
  if (btnContainer) {
    btnContainer.innerHTML = `
        <button id="realGoogleBtn" class="dummy-google-btn google-btn-inner">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" class="google-icon-img"> 
            Googleでログイン
        </button>`;
    document
      .getElementById("realGoogleBtn")
      .addEventListener("click", handleGoogleLogin);
  }
  document
    .getElementById("headerLogoutBtn")
    ?.addEventListener("click", handleGoogleLogout);
  document.getElementById("headerLoginBtn")?.addEventListener("click", () => {
    document.getElementById("loginOverlay")?.classList.remove("hidden");
  });
  document.getElementById("loginOverlay")?.addEventListener("click", (e) => {
    if (e.target.id === "loginOverlay") e.target.classList.add("hidden");
  });
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

async function onLoginSuccess() {
  const userPanel = document.getElementById("userProfilePanel");
  const loginPanel = document.getElementById("loginPromptPanel");

  try {
    await setupUserSpreadsheet();

    // 🌐 GoogleのuserInfoから確実にメアドを取得（401エラーはもう出ません）
    let googleProfile = null;
    try {
      const token = gapi.client.getToken();
      if (token && token.access_token) {
        const userInfoRes = await fetch(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          { headers: { Authorization: `Bearer ${token.access_token}` } },
        );
        if (userInfoRes.ok) {
          googleProfile = await userInfoRes.json();
        }
      }
    } catch (e) {
      console.warn("Googleプロフィール取得失敗:", e);
    }

    // 🔑 裏の絶対的な鍵（メアド）を確定
    const secureUserEmail =
      googleProfile?.email ||
      localStorage.getItem("secure_user_email_id") ||
      "guest_user";
    localStorage.setItem("secure_user_email_id", secureUserEmail);
    window.currentUserId = secureUserEmail;

    // 📄 2枚目からプロフィールを取得
    let savedProfile = null;
    try {
      const profileRes = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: window.userSpreadsheetId,
        range: "user_profile!A1:E",
      });
      const rows = profileRes.result.values || [];
      const matchedRow = rows.find(
        (row) => String(row[0]) === String(secureUserEmail),
      );
      if (matchedRow) {
        savedProfile = {
          account_id: matchedRow[0],
          display_name: matchedRow[1],
          avatar_url: matchedRow[2],
          dummy_id: matchedRow[3],
          last_updated: matchedRow[4],
        };
      }
    } catch (e) {
      console.warn("スプシからのプロファイル取得失敗:", e);
    }

    // 💡 決定：悪しき変数名「account_id」を廃止し、「dummy_id」として完全管理
    let profile = {
      display_name:
        savedProfile?.display_name ||
        googleProfile?.name ||
        localStorage.getItem("otaku_log_display_name") ||
        "アニメオタク",
      dummy_id:
        savedProfile?.dummy_id ||
        localStorage.getItem("otaku_log_dummy_id") ||
        googleProfile?.email?.split("@")[0] ||
        "user",
      avatar_url:
        savedProfile?.avatar_url ||
        googleProfile?.picture ||
        localStorage.getItem("otaku_log_avatar_url") ||
        "",
    };

    // キャッシュ名も dummy_id に統一
    localStorage.setItem("otaku_log_display_name", profile.display_name);
    localStorage.setItem("otaku_log_dummy_id", profile.dummy_id);
    localStorage.setItem("otaku_log_avatar_url", profile.avatar_url);

    // 新規ユーザーの場合、正しいキー名で保存
    if (
      !savedProfile &&
      typeof saveUserProfileToDB === "function" &&
      secureUserEmail !== "guest_user"
    ) {
      await saveUserProfileToDB(secureUserEmail, {
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        dummy_id: profile.dummy_id,
      });
    }

    // UI反映
    if (document.getElementById("headerName"))
      document.getElementById("headerName").innerText = profile.display_name;
    if (document.getElementById("headerId"))
      document.getElementById("headerId").innerText = "@" + profile.dummy_id;

    const headerAvatar = document.getElementById("headerAvatar");
    if (headerAvatar) {
      headerAvatar.innerHTML = profile.avatar_url
        ? `<img src="${profile.avatar_url}" class="feed-avatar-img">`
        : "ME";
    }

    if (userPanel) userPanel.classList.remove("hidden");
    if (loginPanel) loginPanel.classList.add("hidden");

    if (typeof window.fetchAndRenderAllData === "function") {
      window.fetchAndRenderAllData();
    } else if (typeof fetchData === "function") {
      fetchData();
    }

    // 入力欄へのセット
    if (document.getElementById("profileDisplayName"))
      document.getElementById("profileDisplayName").value =
        profile.display_name;
    if (document.getElementById("profileName"))
      document.getElementById("profileName").value = profile.dummy_id;
    if (document.getElementById("profileImgUrl"))
      document.getElementById("profileImgUrl").value = profile.avatar_url;
    if (typeof updateAvatarPreview === "function") updateAvatarPreview();

    document.getElementById("loginOverlay")?.classList.add("hidden");
  } catch (err) {
    console.error("ログイン後の初期化エラー:", err);
  }
}

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
    document.getElementById("startupOverlay")?.classList.add("fade-out");
  }, 1000);
  document.getElementById("loginOverlay")?.classList.remove("hidden");
}

async function setupUserSpreadsheet() {
  const cachedId = localStorage.getItem("user_spreadsheet_id");
  if (cachedId) {
    window.userSpreadsheetId = cachedId;
    return;
  }

  const response = await gapi.client.drive.files.list({
    q: "name = 'anime_log_db' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false",
    fields: "files(id, name)",
    spaces: "drive",
  });

  const files = response.result.files;
  if (files && files.length > 0) {
    window.userSpreadsheetId = files[0].id;
  } else {
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
    await initSpreadsheetHeaders();
  }
  localStorage.setItem("user_spreadsheet_id", window.userSpreadsheetId);
}

async function initSpreadsheetHeaders() {
  const animeHeaders = [
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
  ];

  // 🌟 修正：2枚目のプロフィールシートのヘッダーもここで確実に生成する
  const profileHeaders = [
    "account_id",
    "display_name",
    "avatar_url",
    "dummy_id",
    "last_updated",
  ];

  await gapi.client.sheets.spreadsheets.values.update({
    spreadsheetId: window.userSpreadsheetId,
    range: "anime_log!A1",
    valueInputOption: "RAW",
    resource: { values: [animeHeaders] },
  });

  await gapi.client.sheets.spreadsheets.values.update({
    spreadsheetId: window.userSpreadsheetId,
    range: "user_profile!A1",
    valueInputOption: "RAW",
    resource: { values: [profileHeaders] },
  });

  console.log("📄 スプシ両シートにヘッダー行を書き込みました。");
}
