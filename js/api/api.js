// =================================================================
// 📊 js/api/api.js：スプレッドシート管理（完全列名自動マッピング版）
// Google Sheets APIと通信し、アニメ・プロファイル・トロフィーの同期を行います。
// =================================================================

/**
 * Google APIの認証トークンがセットされているか確認・保証する安全関数
 */
function ensureGoogleToken() {
  if (typeof gapi !== "undefined" && gapi.client) {
    const token = gapi.client.getToken ? gapi.client.getToken() : null;
    if (!token && window.googleToken) {
      gapi.client.setToken({ access_token: window.googleToken });
    }
  }
}

/**
 * 💡 ヘッダー行（1行目）から「列名 -> インデックス」のマップを自動生成する
 * これにより、ユーザーがスプシの列を入れ替えてもシステムがバグらなくなります
 */
function createColumnMap(headerRow) {
  const map = {};
  if (!headerRow) return map;
  headerRow.forEach((cellName, index) => {
    if (cellName) map[cellName.trim()] = index;
  });
  return map;
}

// =================================================================
// 🎬 1. アニメデータ（anime_log シート）の制御
// =================================================================

/**
 * ① スプシから全アニメデータを取得する
 */
async function getAnimeDataFromDB(uid) {
  if (!window.userSpreadsheetId) return [];
  ensureGoogleToken();

  try {
    console.log("📥 スプレッドシートからアニメデータを取得中...");

    // 💡 データの塊をごそっと一括取得（A1からZZまで制限なく全回収）
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

      // キャラクターデータのJSONパース処理（壊れたデータでも落ちない安全ガード付き）
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
          console.warn(
            "⚠️ キャラクターデータのパースに失敗、生データを保持します:",
            e,
          );
          parsedCharacters = [];
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
        is_favorite: getValue("is_favorite", "false"),
        favorite_quotes: getValue("favorite_quotes", ""),
      };
    });

    // 常に最終更新日時が新しい順（降順）にソートして画面に渡す
    return animeList.sort((a, b) => (b.updated_at || 0) - (a.updated_at || 0));
  } catch (err) {
    console.error("❌ アニメデータの取得に失敗:", err);
    return [];
  }
}

/**
 * ② アニメデータを保存・新規追加・上書き更新する
 */
async function saveAnimeToDB(uid, anilist_id, animeData) {
  if (!window.userSpreadsheetId) throw new Error("スプシIDがありません");
  ensureGoogleToken();

  const now = Date.now();
  animeData.updated_at = now;

  const response = await gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: window.userSpreadsheetId,
    range: "anime_log!A1:ZZ",
  });

  const allRows = response.result.values || [];
  const headerRow = allRows[0] || [];
  const col = createColumnMap(headerRow);

  if (headerRow.length === 0) {
    throw new Error(
      "スプレッドシートの1行目にヘッダー（列名）が見つかりません。",
    );
  }

  // アニメIDの列をもとに、既存の行データがあるか探す
  let targetRowIndex = -1;
  const idColIndex = col["anilist_id"];

  if (idColIndex !== undefined) {
    for (let i = 1; i < allRows.length; i++) {
      if (String(allRows[i][idColIndex]) === String(anilist_id)) {
        targetRowIndex = i + 1; // スプシの行番号（1始まり）に変換
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

  // 現在のシートにある列数と同じ幅の空箱配列を作成
  const rowValue = new Array(headerRow.length).fill("");

  // 格納するデータ構造のマッピング定義
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
    is_favorite: String(animeData.is_favorite || "false"),
    favorite_quotes: String(animeData.favorite_quotes || ""),
  };

  // スプシの並び順に合わせて、正しい箱の中にデータを流し込む
  headerRow.forEach((key, index) => {
    const cleanKey = key.trim();
    if (mapping[cleanKey] !== undefined) {
      rowValue[index] = mapping[cleanKey];
    }
  });

  if (targetRowIndex !== -1) {
    // 既存アニメの「上書き更新」
    await gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: window.userSpreadsheetId,
      range: `anime_log!A${targetRowIndex}`,
      valueInputOption: "RAW",
      resource: { values: [rowValue] },
    });
    console.log(
      `💾 アニメ '${animeData.title}' のデータを上書き更新しました。`,
    );
  } else {
    // 新規アニメの「末尾追加」
    await gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId: window.userSpreadsheetId,
      range: "anime_log!A1",
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      resource: { values: [rowValue] },
    });
    console.log(
      `✨ 新しいアニメ '${animeData.title}' をスプシに追加しました！`,
    );
  }
}

/**
 * ③ 対象のアニメを行ごと完全に削除する
 */
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
      targetRowIndex = i; // APIリクエスト用に0から始まるインデックスを保持
      break;
    }
  }

  if (targetRowIndex === -1) return;

  // シートの内部ID（sheetId）を取得して行削除リクエストを送る
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
  console.log(
    `🗑️ ID: ${anilist_id} のアニメデータをスプシから完全に削除しました。`,
  );
}

// =================================================================
// 👤 2. ユーザープロファイル（user_profile シート）の制御
// =================================================================

/**
 * ④ スプシからユーザープロファイルデータを取得する
 */
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

    // アカウントのメアドが一致する行を探索
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
      account_created_at: getValue("account_created_at")
        ? Number(getValue("account_created_at"))
        : Date.now(),
    };
  } catch (err) {
    console.error("❌ プロファイルの取得に失敗:", err);
    return null;
  }
}

/**
 * ⑤ ユーザープロファイルデータを保存・更新する
 */
async function saveUserProfileToDB(uid, profileData) {
  if (!window.userSpreadsheetId) throw new Error("スプシIDがありません");
  ensureGoogleToken();

  const now = Date.now();
  const targetUid = uid || window.currentUserId;

  if (!targetUid || targetUid.includes("@") === false) {
    console.warn(
      "⚠️ 有効なユーザーID（メアド）が特定できないため処理を中断します:",
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
    let existingCreatedAt = null;
    const emailColIndex = col["account_id"];

    if (emailColIndex !== undefined) {
      for (let i = 1; i < allRows.length; i++) {
        if (
          String(allRows[i][emailColIndex]).trim().toLowerCase() ===
          String(targetUid).trim().toLowerCase()
        ) {
          targetRowIndex = i + 1;
          // アカウント作成日（一番最初の日時）を上書きしないよう保護
          const createdAtIndex = col["account_created_at"];
          if (createdAtIndex !== undefined && allRows[i][createdAtIndex]) {
            existingCreatedAt = allRows[i][createdAtIndex];
          }
          break;
        }
      }
    }

    const mapping = {
      account_id: String(targetUid),
      display_name: String(profileData.display_name || ""),
      avatar_url: String(profileData.avatar_url || ""),
      dummy_id: String(profileData.dummy_id || ""),
      last_updated: Number(now),
      account_created_at:
        existingCreatedAt || Number(profileData.account_created_at || now),
    };

    const rowValue = new Array(headerRow.length).fill("");
    headerRow.forEach((key, index) => {
      const cleanKey = key.trim();
      if (mapping[cleanKey] !== undefined) {
        rowValue[index] = mapping[cleanKey];
      }
    });

    if (targetRowIndex !== -1) {
      // プロファイルの上書き更新
      await gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: window.userSpreadsheetId,
        range: `user_profile!A${targetRowIndex}`,
        valueInputOption: "RAW",
        resource: { values: [rowValue] },
      });
    } else {
      // 新規プロファイルの追加
      await gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: window.userSpreadsheetId,
        range: "user_profile!A1",
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        resource: { values: [rowValue] },
      });
    }
    console.log("👤 ユーザープロファイルをスプシに同期しました。");
    return true;
  } catch (err) {
    console.error("❌ ユーザープロファイルの保存に失敗:", err);
    return false;
  }
}

// =================================================================
// 🏆 3. トロフィーデータ（trophy_log シート）の制御
// =================================================================

/**
 * ⑥ スプシの3枚目から獲得済みトロフィーデータをすべて取得する
 */
async function getTrophyDataFromDB() {
  if (!window.userSpreadsheetId) return {};
  ensureGoogleToken();

  try {
    console.log("📥 スプレッドシートからトロフィー獲得データを取得中...");
    const response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: window.userSpreadsheetId,
      range: "trophy_log!A1:ZZ",
    });

    const allRows = response.result.values;
    if (!allRows || allRows.length === 0) return {};

    const headerRow = allRows[0];
    const col = createColumnMap(headerRow);

    const dataRows = allRows.slice(1);
    const trophyMap = {};

    dataRows.forEach((row) => {
      const getValue = (columnName, defaultValue = "") => {
        const index = col[columnName];
        return index !== undefined && row[index] !== undefined
          ? row[index]
          : defaultValue;
      };

      const id = getValue("trophy_id");
      if (id) {
        trophyMap[id] = {
          trophy_id: id,
          is_unlocked: getValue("is_unlocked") === "true",
          unlocked_at: getValue("unlocked_at"), // 獲得した記念日時文字列
        };
      }
    });

    return trophyMap; // { first_step: { is_unlocked: true, unlocked_at: "..." }, ... }
  } catch (err) {
    console.error("❌ トロフィーデータの取得に失敗:", err);
    return {};
  }
}

/**
 * ⑦ 新しく達成したトロフィーを記録する（重複防止安全ガード付き）
 */
async function saveTrophyToDB(trophyId, unlockedAtStr) {
  if (!window.userSpreadsheetId) throw new Error("スプシIDがありません");
  ensureGoogleToken();

  try {
    const response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: window.userSpreadsheetId,
      range: "trophy_log!A1:ZZ",
    });

    const allRows = response.result.values || [];
    const headerRow = allRows[0] || [];
    const col = createColumnMap(headerRow);

    if (headerRow.length === 0) {
      throw new Error("trophy_logシートにヘッダーが見つかりません。");
    }

    // 🛡️ 歴史の保護：すでに同じトロフィーIDがスプシにあるか探す
    let targetRowIndex = -1;
    const idColIndex = col["trophy_id"];

    if (idColIndex !== undefined) {
      for (let i = 1; i < allRows.length; i++) {
        if (String(allRows[i][idColIndex]).trim() === String(trophyId).trim()) {
          targetRowIndex = i + 1;
          break;
        }
      }
    }

    // 🔥 すでに登録されている場合は、最初の感動（獲得日時）を守るために何もしない
    if (targetRowIndex !== -1) {
      console.log(
        `🛡️ トロフィー '${trophyId}' はすでに記録されているため、重複保存をブロックしました。`,
      );
      return true;
    }

    const mapping = {
      trophy_id: String(trophyId),
      is_unlocked: "true",
      unlocked_at: String(unlockedAtStr),
    };

    const rowValue = new Array(headerRow.length).fill("");
    headerRow.forEach((key, index) => {
      const cleanKey = key.trim();
      if (mapping[cleanKey] !== undefined) {
        rowValue[index] = mapping[cleanKey];
      }
    });

    // トロフィーログの末尾に行を追加
    await gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId: window.userSpreadsheetId,
      range: "trophy_log!A1",
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      resource: { values: [rowValue] },
    });

    console.log(
      `🏆 トロフィー '${trophyId}' の達成記録を永久保存しました！ (${unlockedAtStr})`,
    );
    return true;
  } catch (err) {
    console.error("❌ トロフィーの保存に失敗:", err);
    return false;
  }
}
