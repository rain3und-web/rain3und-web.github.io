// =================================================================
// 📊 スプレッドシート データの読み書き管理 (api.js) - 全31項目・完全同期版
// =================================================================

// 💡 認証エラー(401)を徹底防止するための安全装置
function ensureGoogleToken() {
  if (typeof gapi !== "undefined" && gapi.client) {
    const token = gapi.client.getToken ? gapi.client.getToken() : null;
    if (!token && window.googleToken) {
      gapi.client.setToken({ access_token: window.googleToken });
    }
  }
}

// -----------------------------------------
// ① アニメデータを取得する（A2:AE列 対応版）
// -----------------------------------------
async function getAnimeDataFromDB(uid) {
  if (!window.userSpreadsheetId) {
    console.warn("⚠️ スプレッドシートIDが見つかりません。");
    return [];
  }

  ensureGoogleToken();

  try {
    console.log("📥 スプレッドシートからアニメデータを取得中（A2:AE）...");

    // 💡 修正：不要な項目を削ったため、取得範囲を「AC列」までに縮小
    const response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: window.userSpreadsheetId,
      range: "anime_log!A2:AC",
    });

    const rows = response.result.values;
    if (!rows || rows.length === 0) {
      console.log("📄 スプシはまだ空っぽです。");
      return [];
    }

    const animeList = rows.map((row) => {
      let parsedCharacters = [];
      const rawCharacters = row[26]; // AA列：characters

      if (rawCharacters) {
        try {
          if (
            typeof rawCharacters === "string" &&
            (rawCharacters.startsWith("[") || rawCharacters.startsWith("{"))
          ) {
            parsedCharacters = JSON.parse(rawCharacters);
          } else {
            parsedCharacters = rawCharacters;
          }
        } catch (e) {
          console.warn("キャラクターのパースに失敗:", rawCharacters);
          parsedCharacters = rawCharacters;
        }
      }

      // 💡 修正：スプシのA列〜AE列（全31項目）に完全1対1でマッピング
      return {
        anilist_id: row[0] || "", // A
        title: row[1] || "", // B
        watch_status: row[2] || "未履修", // C
        my_score: row[3] ? Number(row[3]) : 0, // D
        score_story: row[4] ? Number(row[4]) : 0, // E
        score_visual: row[5] ? Number(row[5]) : 0, // F
        score_character: row[6] ? Number(row[6]) : 0, // G
        score_music: row[7] ? Number(row[7]) : 0, // H
        score_resonance: row[8] ? Number(row[8]) : 0, // I
        format: row[9] || "", // J
        year: row[10] || "", // K
        season: row[11] || "", // L
        episodes: row[12] || "", // M
        duration: row[13] || "0", // N
        rewatch_count: row[14] || "1", // O
        synopsis: row[15] || "", // P
        genres: row[16] || "", // Q
        director: row[17] || "", // R
        studio: row[18] || "", // S
        cast: row[19] || "", // T
        cover_url: row[20] || "", // U
        official_site: row[21] || "", // V
        created_at: row[22] ? Number(row[22]) : Date.now(), // W
        updated_at: row[23] ? Number(row[23]) : Date.now(), // X
        img_position: row[24] || "50% 50%", // Y
        memo: row[25] || "", // Z
        characters: parsedCharacters, // AA
        account_id: row[27] || "", // AB
        last_updated: row[28] ? Number(row[28]) : Date.now(), // AC
      };
    });

    return animeList.sort((a, b) => (b.updated_at || 0) - (a.updated_at || 0));
  } catch (err) {
    console.error("❌ スプシからのデータ取得に失敗しました:", err);
    return [];
  }
}

// -----------------------------------------
// ② アニメデータを保存・更新する（A:AE列 対応版）
// -----------------------------------------
async function saveAnimeToDB(uid, anilist_id, animeData) {
  if (!window.userSpreadsheetId) throw new Error("スプシIDがありません");

  ensureGoogleToken();

  const now = Date.now();
  animeData.updated_at = now;

  const response = await gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: window.userSpreadsheetId,
    range: "anime_log!A1:A",
  });

  const rows = response.result.values || [];
  let targetRowIndex = -1;

  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][0]) === String(anilist_id)) {
      targetRowIndex = i + 1;
      break;
    }
  }

  const charactersStr =
    typeof animeData.characters === "object"
      ? JSON.stringify(animeData.characters)
      : animeData.characters || "[]";

  // 💡 修正：保存する配列からも avatar_url と display_name を削除（全29項目）
  const rowValue = [
    String(animeData.anilist_id || ""), // A
    String(animeData.title || ""), // B
    String(animeData.watch_status || "未履修"), // C
    Number(animeData.my_score || 0), // D
    Number(animeData.score_story || 0), // E
    Number(animeData.score_visual || 0), // F
    Number(animeData.score_character || 0), // G
    Number(animeData.score_music || 0), // H
    Number(animeData.score_resonance || 0), // I
    String(animeData.format || ""), // J
    String(animeData.year || ""), // K
    String(animeData.season || ""), // L
    String(animeData.episodes || ""), // M
    String(animeData.duration || "0"), // N
    String(animeData.rewatch_count || "1"), // O
    String(animeData.synopsis || animeData.description || ""), // P
    String(animeData.genres || ""), // Q
    String(animeData.director || ""), // R
    String(animeData.studio || ""), // S
    String(animeData.cast || ""), // T
    String(animeData.cover_url || ""), // U
    String(animeData.official_site || ""), // V
    Number(animeData.created_at || now), // W
    Number(animeData.updated_at || now), // X
    String(animeData.img_position || "50% 50%"), // Y
    String(animeData.memo || ""), // Z
    charactersStr, // AA
    String(animeData.account_id || window.currentUserId || ""), // AB
    Number(animeData.last_updated || now), // AC
  ];

  if (targetRowIndex !== -1) {
    // 上書き更新（A列からAE列まで一気に更新）
    await gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: window.userSpreadsheetId,
      range: `anime_log!A${targetRowIndex}`,
      valueInputOption: "RAW",
      resource: { values: [rowValue] },
    });
  } else {
    // 新規追加
    await gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId: window.userSpreadsheetId,
      range: "anime_log!A1",
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      resource: { values: [rowValue] },
    });
  }
}

// -----------------------------------------
// ③ アニメデータを削除する
// -----------------------------------------
async function deleteAnimeFromDB(uid, anilist_id) {
  if (!window.userSpreadsheetId) throw new Error("スプシIDがありません");
  ensureGoogleToken();

  const response = await gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: window.userSpreadsheetId,
    range: "anime_log!A1:A",
  });

  const rows = response.result.values || [];
  let targetRowIndex = -1;

  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][0]) === String(anilist_id)) {
      targetRowIndex = i;
      break;
    }
  }

  if (targetRowIndex === -1) return;

  const spreadsheet = await gapi.client.sheets.spreadsheets.get({
    spreadsheetId: window.userSpreadsheetId,
  });
  const sheetId = spreadsheet.result.sheets[0].properties.sheetId;

  await gapi.client.sheets.spreadsheets.batchUpdate({
    spreadsheetId: window.userSpreadsheetId,
    resource: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: sheetId,
              dimension: "ROWS",
              startIndex: targetRowIndex,
              endIndex: targetRowIndex + 1,
            },
          },
        },
      ],
    },
  });
}

// -----------------------------------------
// ④ ユーザープロファイルを取得する（別タブ user_profile から）
// -----------------------------------------
async function getUserProfileFromDB(uid) {
  if (!window.userSpreadsheetId) return null;
  ensureGoogleToken();

  try {
    // 💡 「user_profile」シートのA列〜D列を取得
    const response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: window.userSpreadsheetId,
      range: "user_profile!A2:D",
    });

    const rows = response.result.values || [];
    // ログイン中のユーザーID（uid）に一致する行を探す
    const userRow = rows.find((row) => String(row[0]) === String(uid));

    if (!userRow) return null;

    return {
      account_id: userRow[0] || "",
      display_name: userRow[1] || "",
      avatar_url: userRow[2] || "",
      last_updated: userRow[3] ? Number(userRow[3]) : Date.now(),
    };
  } catch (err) {
    console.error("❌ ユーザープロファイルの取得に失敗:", err);
    return null;
  }
}

// -----------------------------------------
// ⑤ ユーザープロファイルを保存・更新する（別タブ user_profile へ）
// -----------------------------------------
async function saveUserProfileToDB(uid, profileData) {
  if (!window.userSpreadsheetId) throw new Error("スプシIDがありません");
  ensureGoogleToken();

  const now = Date.now();
  const targetUid = uid || profileData.account_id || window.currentUserId;

  if (!targetUid) {
    console.warn(
      "⚠️ ユーザーIDが特定できないため、プロファイルを保存できません。",
    );
    return false;
  }

  try {
    // 既存のユーザー行があるか確認するためにA列（ID列）を取得
    const response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: window.userSpreadsheetId,
      range: "user_profile!A1:A",
    });

    const rows = response.result.values || [];
    let targetRowIndex = -1;

    for (let i = 0; i < rows.length; i++) {
      if (String(rows[i][0]) === String(targetUid)) {
        targetRowIndex = i + 1; // スプシの行番号（1始まり）
        break;
      }
    }

    // 書き込むデータ配列を作成
    const rowValue = [
      String(targetUid),
      String(profileData.display_name || ""),
      String(profileData.avatar_url || ""),
      Number(now),
    ];

    if (targetRowIndex !== -1) {
      // 既存ユーザーがいれば「user_profile」シートの該当行を上書き
      await gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: window.userSpreadsheetId,
        range: `user_profile!A${targetRowIndex}`,
        valueInputOption: "RAW",
        resource: { values: [rowValue] },
      });
      console.log("👤 ユーザープロファイルを更新しました。");
    } else {
      // 新規ユーザーなら「user_profile」シートの末尾に追加
      await gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: window.userSpreadsheetId,
        range: "user_profile!A1",
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        resource: { values: [rowValue] },
      });
      console.log("👤 ユーザープロファイルを新規保存しました。");
    }
    return true;
  } catch (err) {
    console.error("❌ ユーザープロファイルの保存に失敗:", err);
    return false;
  }
}
