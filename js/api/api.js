// =================================================================
// 📊 スプレッドシート 管理 (api.js) - 列名自動マッピング版（行指定完全廃止）
// =================================================================

function ensureGoogleToken() {
  if (typeof gapi !== "undefined" && gapi.client) {
    const token = gapi.client.getToken ? gapi.client.getToken() : null;
    if (!token && window.googleToken) {
      gapi.client.setToken({ access_token: window.googleToken });
    }
  }
}

// 💡 ヘッダー行（1行目）から「列名 -> インデックス」のマップを自動で作る魔法の関数
function createColumnMap(headerRow) {
  const map = {};
  if (!headerRow) return map;
  headerRow.forEach((cellName, index) => {
    if (cellName) map[cellName.trim()] = index;
  });
  return map;
}

// -----------------------------------------
// ① アニメデータを取得する（列名ベース）
// -----------------------------------------
async function getAnimeDataFromDB(uid) {
  if (!window.userSpreadsheetId) return [];
  ensureGoogleToken();

  try {
    console.log("📥 スプレッドシートからアニメデータを取得中...");

    // 💡 変更：列指定を完全になくし、データがある分すべてをごそっと取る
    const response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: window.userSpreadsheetId,
      range: "anime_log!A1:ZZ",
    });

    const allRows = response.result.values;
    if (!allRows || allRows.length === 0) return [];

    const headerRow = allRows[0];
    const col = createColumnMap(headerRow);

    const dataRows = allRows.slice(1);
    const animeList = dataRows.map((row) => {
      const getValue = (columnName, defaultValue = "") => {
        const index = col[columnName];
        return index !== undefined && row[index] !== undefined
          ? row[index]
          : defaultValue;
      };

      let parsedCharacters = [];
      const rawCharacters = getValue("characters");
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
          parsedCharacters = rawCharacters;
        }
      }

      return {
        anilist_id: getValue("anilist_id"),
        title: getValue("title"),
        watch_status: getValue("watch_status", "未履修"),
        my_score: Number(getValue("my_score", 0)),
        score_story: Number(getValue("score_story", 0)),
        score_visual: Number(getValue("score_visual", 0)),
        score_character: Number(getValue("score_character", 0)),
        score_music: Number(getValue("score_music", 0)),
        score_resonance: Number(getValue("score_resonance", 0)),
        format: getValue("format"),
        year: getValue("year"),
        season: getValue("season"),
        episodes: getValue("episodes"),
        duration: getValue("duration", "0"),
        rewatch_count: getValue("rewatch_count", "1"),
        synopsis: getValue("synopsis"),
        genres: getValue("genres"),
        director: getValue("director"),
        studio: getValue("studio"),
        cast: getValue("cast"),
        cover_url: getValue("cover_url"),
        official_site: getValue("official_site"),
        created_at: Number(getValue("created_at", Date.now())),
        updated_at: Number(getValue("updated_at", Date.now())),
        img_position: getValue("img_position", "50% 50%"),
        memo: getValue("memo"),
        characters: parsedCharacters,
      };
    });

    return animeList.sort((a, b) => (b.updated_at || 0) - (a.updated_at || 0));
  } catch (err) {
    console.error("❌ アニメデータの取得に失敗:", err);
    return [];
  }
}

// -----------------------------------------
// ② アニメデータを保存・更新する（列名ベース・自動マップ型）
// -----------------------------------------
async function saveAnimeToDB(uid, anilist_id, animeData) {
  if (!window.userSpreadsheetId) throw new Error("スプシIDがありません");
  ensureGoogleToken();

  const now = Date.now();
  animeData.updated_at = now;

  // まず現在のシートの状態（1行目のヘッダーとA列のID）を取得
  const response = await gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: window.userSpreadsheetId,
    range: "anime_log!A1:ZZ",
  });

  const allRows = response.result.values || [];
  const headerRow = allRows[0] || [];
  const col = createColumnMap(headerRow);

  // 💡 もし万が一スプシが完全な空っぽなら、標準のヘッダーを自動生成してあげる安全ガード
  if (headerRow.length === 0) {
    throw new Error(
      "スプレッドシートの1行目にヘッダー（列名）が見つかりません。",
    );
  }

  // 更新対象の行を探す（anilist_idの列の位置を動的に特定）
  let targetRowIndex = -1;
  const idColIndex = col["anilist_id"];

  if (idColIndex !== undefined) {
    for (let i = 1; i < allRows.length; i++) {
      if (String(allRows[i][idColIndex]) === String(anilist_id)) {
        targetRowIndex = i + 1;
        break;
      }
    }
  } else {
    throw new Error("スプシの1行目に 'anilist_id' という列名が存在しません。");
  }

  const charactersStr =
    typeof animeData.characters === "object"
      ? JSON.stringify(animeData.characters)
      : animeData.characters || "[]";

  // 💡 決定：現在のスプシの列幅に合わせて、正しい名前の位置にデータを流し込む配列を動的作成
  const rowValue = new Array(headerRow.length).fill("");

  const mapping = {
    anilist_id: String(animeData.anilist_id || ""),
    title: String(animeData.title || ""),
    watch_status: String(animeData.watch_status || "未履修"),
    my_score: Number(animeData.my_score || 0),
    score_story: Number(animeData.score_story || 0),
    score_visual: Number(animeData.score_visual || 0),
    score_character: Number(animeData.score_character || 0),
    score_music: Number(animeData.score_music || 0),
    score_resonance: Number(animeData.score_resonance || 0),
    format: String(animeData.format || ""),
    year: String(animeData.year || ""),
    season: String(animeData.season || ""),
    episodes: String(animeData.episodes || ""),
    duration: String(animeData.duration || "0"),
    rewatch_count: String(animeData.rewatch_count || "1"),
    synopsis: String(animeData.synopsis || animeData.description || ""),
    genres: String(animeData.genres || ""),
    director: String(animeData.director || ""),
    studio: String(animeData.studio || ""),
    cast: String(animeData.cast || ""),
    cover_url: String(animeData.cover_url || ""),
    official_site: String(animeData.official_site || ""),
    created_at: Number(animeData.created_at || now),
    updated_at: Number(animeData.updated_at || now),
    img_position: String(animeData.img_position || "50% 50%"),
    memo: String(animeData.memo || ""),
    characters: charactersStr,
  };

  // スプシのヘッダー名に合わせて配列を組み立て（順番が入れ替わっていてもここにハマる）
  headerRow.forEach((key, index) => {
    const cleanKey = key.trim();
    if (mapping[cleanKey] !== undefined) {
      rowValue[index] = mapping[cleanKey];
    }
  });

  if (targetRowIndex !== -1) {
    // 既存行の上書き（その行のA列から右端までを綺麗に上書き）
    await gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: window.userSpreadsheetId,
      range: `anime_log!A${targetRowIndex}`,
      valueInputOption: "RAW",
      resource: { values: [rowValue] },
    });
  } else {
    // 新規行の追加
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
// ③ アニメデータを削除する（列名ベース）
// -----------------------------------------
async function deleteAnimeFromDB(uid, anilist_id) {
  if (!window.userSpreadsheetId) throw new Error("スプシIDがありません");
  ensureGoogleToken();

  const response = await gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: window.userSpreadsheetId,
    range: "anime_log!A1:ZZ",
  });

  const allRows = response.result.values || [];
  if (allRows.length === 0) return;

  const col = createColumnMap(allRows[0]);
  const idColIndex = col["anilist_id"];

  if (idColIndex === undefined) return;

  let targetRowIndex = -1;
  for (let i = 1; i < allRows.length; i++) {
    if (String(allRows[i][idColIndex]) === String(anilist_id)) {
      targetRowIndex = i; // batchUpdate用の0始まりインデックス
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
// ④ ユーザープロファイルを取得する（列名ベース）
// -----------------------------------------
async function getUserProfileFromDB(uid) {
  if (!window.userSpreadsheetId) return null;
  ensureGoogleToken();

  try {
    const response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: window.userSpreadsheetId,
      range: "user_profile!A1:ZZ",
    });

    const allRows = response.result.values || [];
    if (allRows.length === 0) return null;

    const col = createColumnMap(allRows[0]);
    const dataRows = allRows.slice(1);

    const userRow = dataRows.find((row) => {
      const emailIndex = col["account_id"];
      return (
        emailIndex !== undefined &&
        String(row[emailIndex]).trim().toLowerCase() ===
          String(uid).trim().toLowerCase()
      );
    });

    if (!userRow) return null;

    const getValue = (columnName) => {
      const index = col[columnName];
      return index !== undefined && userRow[index] !== undefined
        ? userRow[index]
        : "";
    };

    return {
      account_id: getValue("account_id"),
      display_name: getValue("display_name"),
      avatar_url: getValue("avatar_url"),
      dummy_id: getValue("dummy_id"),
      last_updated: getValue("last_updated")
        ? Number(getValue("last_updated"))
        : Date.now(),
    };
  } catch (err) {
    console.error("❌ プロファイルの取得に失敗:", err);
    return null;
  }
}

// -----------------------------------------
// ⑤ ユーザープロファイルを保存・更新する（列名ベース・自動マップ型）
// -----------------------------------------
async function saveUserProfileToDB(uid, profileData) {
  if (!window.userSpreadsheetId) throw new Error("スプシIDがありません");
  ensureGoogleToken();

  const now = Date.now();
  const targetUid = uid || window.currentUserId;

  if (!targetUid || targetUid.includes("@") === false) {
    console.warn(
      "⚠️ 有効なユーザーID（メアド）が特定できないため中断:",
      targetUid,
    );
    return false;
  }

  try {
    const response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: window.userSpreadsheetId,
      range: "user_profile!A1:ZZ",
    });

    const allRows = response.result.values || [];
    const headerRow = allRows[0] || [];
    const col = createColumnMap(headerRow);

    if (headerRow.length === 0) {
      throw new Error("user_profileシートにヘッダーが見つかりません。");
    }

    let targetRowIndex = -1;
    const emailColIndex = col["account_id"];

    if (emailColIndex !== undefined) {
      for (let i = 1; i < allRows.length; i++) {
        if (
          String(allRows[i][emailColIndex]).trim().toLowerCase() ===
          String(targetUid).trim().toLowerCase()
        ) {
          targetRowIndex = i + 1;
          break;
        }
      }
    }

    // データの詰め込み用オブジェクト
    const mapping = {
      account_id: String(targetUid),
      display_name: String(profileData.display_name || ""),
      avatar_url: String(profileData.avatar_url || ""),
      dummy_id: String(profileData.dummy_id || ""),
      last_updated: Number(now),
    };

    // ヘッダーの現在の並び順に合わせて配列を生成
    const rowValue = new Array(headerRow.length).fill("");
    headerRow.forEach((key, index) => {
      const cleanKey = key.trim();
      if (mapping[cleanKey] !== undefined) {
        rowValue[index] = mapping[cleanKey];
      }
    });

    if (targetRowIndex !== -1) {
      await gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: window.userSpreadsheetId,
        range: `user_profile!A${targetRowIndex}`,
        valueInputOption: "RAW",
        resource: { values: [rowValue] },
      });
    } else {
      await gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: window.userSpreadsheetId,
        range: "user_profile!A1",
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        resource: { values: [rowValue] },
      });
    }
    return true;
  } catch (err) {
    console.error("❌ ユーザープロファイルの保存に失敗:", err);
    return false;
  }
}
