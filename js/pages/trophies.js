// =================================================================
// 🏆 js/pages/trophies.js：アカウント作成実績補正 ＆ 高次元タイムラインソート版
// =================================================================

const trophyEvaluators = {
  // 📆 ⏰ ⑬ オタク歴・継続日数 シリーズ
  history_1: () => {
    const createdStr =
      localStorage.getItem("account_created_at") ||
      sessionStorage.getItem("account_created_at");
    if (!createdStr) return false;
    const diffDays =
      (Date.now() - new Date(createdStr).getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= 30;
  },
  history_2: () => {
    const createdStr =
      localStorage.getItem("account_created_at") ||
      sessionStorage.getItem("account_created_at");
    if (!createdStr) return false;
    const diffDays =
      (Date.now() - new Date(createdStr).getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= 180;
  },
  history_3: () => {
    const createdStr =
      localStorage.getItem("account_created_at") ||
      sessionStorage.getItem("account_created_at");
    if (!createdStr) return false;
    const diffDays =
      (Date.now() - new Date(createdStr).getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= 365;
  },
  history_4: () => {
    const createdStr =
      localStorage.getItem("account_created_at") ||
      sessionStorage.getItem("account_created_at");
    if (!createdStr) return false;
    const diffDays =
      (Date.now() - new Date(createdStr).getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= 730;
  },

  // 📊 ① 履修本数 シリーズ
  count_1: (animeDB) =>
    animeDB.filter((a) => a.watch_status === "履修済").length >= 10,
  count_2: (animeDB) =>
    animeDB.filter((a) => a.watch_status === "履修済").length >= 50,
  count_3: (animeDB) =>
    animeDB.filter((a) => a.watch_status === "履修済").length >= 150,
  count_4: (animeDB) =>
    animeDB.filter((a) => a.watch_status === "履修済").length >= 300,

  // ⏱️ ② 総視聴時間 シリーズ
  time_1: () =>
    (window.calculateTotalMinutes ? window.calculateTotalMinutes() : 0) >= 1440,
  time_2: () =>
    (window.calculateTotalMinutes ? window.calculateTotalMinutes() : 0) >= 6000,
  time_3: () =>
    (window.calculateTotalMinutes ? window.calculateTotalMinutes() : 0) >=
    30000,
  time_4: () =>
    (window.calculateTotalMinutes ? window.calculateTotalMinutes() : 0) >=
    60000,

  // 📝 ③ ストーリー5.0 シリーズ
  story_1: (animeDB) =>
    animeDB.filter(
      (a) => parseFloat(a.score_story) === 5.0 && a.watch_status === "履修済",
    ).length >= 3,
  story_2: (animeDB) =>
    animeDB.filter(
      (a) => parseFloat(a.score_story) === 5.0 && a.watch_status === "履修済",
    ).length >= 10,
  story_3: (animeDB) =>
    animeDB.filter(
      (a) => parseFloat(a.score_story) === 5.0 && a.watch_status === "履修済",
    ).length >= 25,
  story_4: (animeDB) =>
    animeDB.filter(
      (a) => parseFloat(a.score_story) === 5.0 && a.watch_status === "履修済",
    ).length >= 50,

  // 🎨 ④ 美術・作画5.0 シリーズ
  visual_1: (animeDB) =>
    animeDB.filter(
      (a) => parseFloat(a.score_visual) === 5.0 && a.watch_status === "履修済",
    ).length >= 3,
  visual_2: (animeDB) =>
    animeDB.filter(
      (a) => parseFloat(a.score_visual) === 5.0 && a.watch_status === "履修済",
    ).length >= 10,
  visual_3: (animeDB) =>
    animeDB.filter(
      (a) => parseFloat(a.score_visual) === 5.0 && a.watch_status === "履修済",
    ).length >= 25,
  visual_4: (animeDB) =>
    animeDB.filter(
      (a) => parseFloat(a.score_visual) === 5.0 && a.watch_status === "履修済",
    ).length >= 50,

  // 🎵 ⑤ 音楽5.0 シリーズ
  music_1: (animeDB) =>
    animeDB.filter(
      (a) => parseFloat(a.score_music) === 5.0 && a.watch_status === "履修済",
    ).length >= 3,
  music_2: (animeDB) =>
    animeDB.filter(
      (a) => parseFloat(a.score_music) === 5.0 && a.watch_status === "履修済",
    ).length >= 10,
  music_3: (animeDB) =>
    animeDB.filter(
      (a) => parseFloat(a.score_music) === 5.0 && a.watch_status === "履修済",
    ).length >= 25,
  music_4: (animeDB) =>
    animeDB.filter(
      (a) => parseFloat(a.score_music) === 5.0 && a.watch_status === "履修済",
    ).length >= 50,

  // 👤 ⑥ キャラ魅力5.0 シリーズ
  char_1: (animeDB) =>
    animeDB.filter(
      (a) =>
        parseFloat(a.score_character) === 5.0 && a.watch_status === "履修済",
    ).length >= 3,
  char_2: (animeDB) =>
    animeDB.filter(
      (a) =>
        parseFloat(a.score_character) === 5.0 && a.watch_status === "履修済",
    ).length >= 10,
  char_3: (animeDB) =>
    animeDB.filter(
      (a) =>
        parseFloat(a.score_character) === 5.0 && a.watch_status === "履修済",
    ).length >= 25,
  char_4: (animeDB) =>
    animeDB.filter(
      (a) =>
        parseFloat(a.score_character) === 5.0 && a.watch_status === "履修済",
    ).length >= 50,

  // ⚡ ⑦ 刺さと度5.0 シリーズ
  resonance_1: (animeDB) =>
    animeDB.filter(
      (a) =>
        parseFloat(a.score_resonance) === 5.0 && a.watch_status === "履修済",
    ).length >= 3,
  resonance_2: (animeDB) =>
    animeDB.filter(
      (a) =>
        parseFloat(a.score_resonance) === 5.0 && a.watch_status === "履修済",
    ).length >= 10,
  resonance_3: (animeDB) =>
    animeDB.filter(
      (a) =>
        parseFloat(a.score_resonance) === 5.0 && a.watch_status === "履修済",
    ).length >= 25,
  resonance_4: (animeDB) =>
    animeDB.filter(
      (a) =>
        parseFloat(a.score_resonance) === 5.0 && a.watch_status === "履修済",
    ).length >= 50,

  // 🎬 ⑧ 映画 シリーズ
  movie_1: (animeDB) =>
    animeDB.filter(
      (a) =>
        (a.format === "映画" || a.format === "MOVIE") &&
        a.watch_status === "履修済",
    ).length >= 5,
  movie_2: (animeDB) =>
    animeDB.filter(
      (a) =>
        (a.format === "映画" || a.format === "MOVIE") &&
        a.watch_status === "履修済",
    ).length >= 15,
  movie_3: (animeDB) =>
    animeDB.filter(
      (a) =>
        (a.format === "映画" || a.format === "MOVIE") &&
        a.watch_status === "履修済",
    ).length >= 30,
  movie_4: (animeDB) =>
    animeDB.filter(
      (a) =>
        (a.format === "映画" || a.format === "MOVIE") &&
        a.watch_status === "履修済",
    ).length >= 60,

  // 🕒 ⑨ ショート シリーズ
  short_1: (animeDB) =>
    animeDB.filter(
      (a) =>
        (a.format === "ショート" ||
          a.format === "SHORT" ||
          a.format === "TV_SHORT") &&
        a.watch_status === "履修済",
    ).length >= 3,
  short_2: (animeDB) =>
    animeDB.filter(
      (a) =>
        (a.format === "ショート" ||
          a.format === "SHORT" ||
          a.format === "TV_SHORT") &&
        a.watch_status === "履修済",
    ).length >= 10,
  short_3: (animeDB) =>
    animeDB.filter(
      (a) =>
        (a.format === "ショート" ||
          a.format === "SHORT" ||
          a.format === "TV_SHORT") &&
        a.watch_status === "履修済",
    ).length >= 20,
  short_4: (animeDB) =>
    animeDB.filter(
      (a) =>
        (a.format === "ショート" ||
          a.format === "SHORT" ||
          a.format === "TV_SHORT") &&
        a.watch_status === "履修済",
    ).length >= 40,

  // 📚 ⑩ 積読 シリーズ
  tsundoku_1: (animeDB) =>
    animeDB.filter(
      (a) => a.watch_status === "未履修" || a.watch_status === "履修中",
    ).length >= 10,
  tsundoku_2: (animeDB) =>
    animeDB.filter(
      (a) => a.watch_status === "未履修" || a.watch_status === "履修中",
    ).length >= 25,
  tsundoku_3: (animeDB) =>
    animeDB.filter(
      (a) => a.watch_status === "未履修" || a.watch_status === "履修中",
    ).length >= 50,
  tsundoku_4: (animeDB) =>
    animeDB.filter(
      (a) => a.watch_status === "未履修" || a.watch_status === "履修中",
    ).length >= 100,

  // 🔄 ⑪ 再履修ループ シリーズ
  loop_1: (animeDB) => animeDB.some((a) => parseInt(a.rewatch_count || 0) >= 1),
  loop_2: (animeDB) => animeDB.some((a) => parseInt(a.rewatch_count || 0) >= 2),
  loop_3: (animeDB) => animeDB.some((a) => parseInt(a.rewatch_count || 0) >= 4),
  loop_4: (animeDB) => animeDB.some((a) => parseInt(a.rewatch_count || 0) >= 8),

  // 💖 ⑫ 推しキャラ登録 シリーズ
  oshi_1: (animeDB, oshiCount) => oshiCount >= 5,
  oshi_2: (animeDB, oshiCount) => oshiCount >= 15,
  oshi_3: (animeDB, oshiCount) => oshiCount >= 30,
  oshi_4: (animeDB, oshiCount) => oshiCount >= 60,

  // 🔒 ⑭ 【隠し進化】奇跡のオール満点作品シリーズ
  secret_perfect_1: (animeDB) =>
    animeDB.filter(
      (a) =>
        parseFloat(a.score_story) === 5.0 &&
        parseFloat(a.score_visual) === 5.0 &&
        parseFloat(a.score_music) === 5.0 &&
        parseFloat(a.score_character) === 5.0 &&
        parseFloat(a.score_resonance) === 5.0 &&
        a.watch_status === "履修済",
    ).length >= 1,
  secret_perfect_2: (animeDB) =>
    animeDB.filter(
      (a) =>
        parseFloat(a.score_story) === 5.0 &&
        parseFloat(a.score_visual) === 5.0 &&
        parseFloat(a.score_music) === 5.0 &&
        parseFloat(a.score_character) === 5.0 &&
        parseFloat(a.score_resonance) === 5.0 &&
        a.watch_status === "履修済",
    ).length >= 2,
  secret_perfect_3: (animeDB) =>
    animeDB.filter(
      (a) =>
        parseFloat(a.score_story) === 5.0 &&
        parseFloat(a.score_visual) === 5.0 &&
        parseFloat(a.score_music) === 5.0 &&
        parseFloat(a.score_character) === 5.0 &&
        parseFloat(a.score_resonance) === 5.0 &&
        a.watch_status === "履修済",
    ).length >= 5,
  secret_perfect_4: (animeDB) =>
    animeDB.filter(
      (a) =>
        parseFloat(a.score_story) === 5.0 &&
        parseFloat(a.score_visual) === 5.0 &&
        parseFloat(a.score_music) === 5.0 &&
        parseFloat(a.score_character) === 5.0 &&
        parseFloat(a.score_resonance) === 5.0 &&
        a.watch_status === "履修済",
    ).length >= 10,

  // 🔒 ⑮ 【隠し進化】ストーリーはアレだけど他が最高ギャップシリーズ
  secret_gap_1: (animeDB) =>
    animeDB.filter(
      (a) =>
        parseFloat(a.score_story) <= 1.5 &&
        (parseFloat(a.score_visual) === 5.0 ||
          parseFloat(a.score_character) === 5.0) &&
        a.watch_status === "履修済",
    ).length >= 1,
  secret_gap_2: (animeDB) =>
    animeDB.filter(
      (a) =>
        parseFloat(a.score_story) <= 1.5 &&
        (parseFloat(a.score_visual) === 5.0 ||
          parseFloat(a.score_character) === 5.0) &&
        a.watch_status === "履修済",
    ).length >= 2,
  secret_gap_3: (animeDB) =>
    animeDB.filter(
      (a) =>
        parseFloat(a.score_story) <= 1.5 &&
        (parseFloat(a.score_visual) === 5.0 ||
          parseFloat(a.score_character) === 5.0) &&
        a.watch_status === "履修済",
    ).length >= 5,
  secret_gap_4: (animeDB) =>
    animeDB.filter(
      (a) =>
        parseFloat(a.score_story) <= 1.5 &&
        (parseFloat(a.score_visual) === 5.0 ||
          parseFloat(a.score_character) === 5.0) &&
        a.watch_status === "履修済",
    ).length >= 10,
};

const MEDAL_CONFIGS = {
  cast: {
    thresholds: [3, 10, 20, 40],
    titles: ["の耳", "推し", "神推し", "レジェンドファン"],
  },
  director: {
    thresholds: [3, 7, 15, 30],
    titles: ["の視線", "信者", "のミューズ", "の脳内理解者"],
  },
  studio: {
    thresholds: [3, 7, 15, 30],
    titles: ["の門下生", "フリーク", "の専属スポンサー", "スタジオの株主"],
  },
};

const RANK_NAMES = ["bronze", "silver", "gold", "platinum"];
const RANK_WEIGHTS = { bronze: 1, silver: 2, gold: 3, platinum: 4 };

window.calculateTotalMinutes = function () {
  const animeDB = window.animeDB || [];
  return animeDB.reduce((sum, a) => {
    const eps =
      parseInt(String(a.episodes || "0").replace(/[^0-9]/g, ""), 10) || 0;
    const dur = parseInt(a.duration || 0, 10) || 0;
    return sum + eps * dur;
  }, 0);
};

function formatDisplayDate(timestampOrStr) {
  if (!timestampOrStr) return "";
  let date = isNaN(timestampOrStr)
    ? new Date(timestampOrStr)
    : new Date(Number(timestampOrStr));
  if (isNaN(date.getTime())) return String(timestampOrStr);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const r = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${y}/${m}/${d} ${r}:${min}`;
}

window.renderTrophyPage = async function () {
  const container = document.getElementById("trophyGridContainer");
  if (!container) return;

  const pageArea = document.getElementById("trophyPageArea");
  if (pageArea) pageArea.style.height = "auto";
  container.style.height = "auto";

  container.innerHTML = `<div class="trophy-loading">トロフィーデータを同期中...</div>`;

  let trophyList = [];
  try {
    const response = await fetch("data/trophies.json");
    if (!response.ok) throw new Error("JSON読み込み失敗");
    trophyList = await response.json();
  } catch (error) {
    container.innerHTML = `<div class="trophy-loading" style="color: var(--c-red);">データの読み込みに失敗しました。</div>`;
    return;
  }

  let savedTrophyMap = {};
  if (typeof getTrophyDataFromDB === "function") {
    savedTrophyMap = await getTrophyDataFromDB();
  }

  const animeDB = window.animeDB || [];
  const nowTimestamp = Date.now();

  // アカウント作成日時のベース取得 (account_created_at に修正)
  const createdStr =
    localStorage.getItem("account_created_at") ||
    sessionStorage.getItem("account_created_at");
  const accountCreatedTimestamp = createdStr
    ? new Date(createdStr).getTime()
    : nowTimestamp;

  // アニメデータの updated_at と created_at を正しく巡回する関数
  function getLatestAnimeTimestamp(filteredAnime) {
    if (!filteredAnime || filteredAnime.length === 0)
      return accountCreatedTimestamp;
    const timestamps = filteredAnime
      .map((a) =>
        Math.max(Number(a.updated_at) || 0, Number(a.created_at) || 0),
      )
      .filter((t) => t > 0);
    return timestamps.length > 0
      ? Math.max(...timestamps)
      : accountCreatedTimestamp;
  }

  const pendingSaveTasks = [];

  // ---------------------------------------------------------------
  // ⚡ オタク勲章（声優・制作会社など）の自動生成 ＆ DB保存対応
  // ---------------------------------------------------------------
  const generatedMedals = [];
  const showMedalToggle = document.getElementById("toggleMedalShow");
  const isMedalVisible = showMedalToggle ? showMedalToggle.checked : true;

  if (showMedalToggle && !showMedalToggle.dataset.listenerAttached) {
    showMedalToggle.addEventListener("change", () => window.renderTrophyPage());
    showMedalToggle.dataset.listenerAttached = "true";
  }

  if (isMedalVisible) {
    Object.keys(MEDAL_CONFIGS).forEach((type) => {
      const config = MEDAL_CONFIGS[type];
      const registry = {};

      animeDB
        .filter((a) => a.watch_status === "履修済")
        .forEach((anime) => {
          let rawValue = anime[type] || "";
          let cleanedRaw = String(rawValue)
            .replace(/\[.*?\]/g, "")
            .replace(/\(.*?\)/g, "")
            .replace(/（.*?）/g, "");
          let items = cleanedRaw
            .split(/[,/、\t\n]+/)
            .map((i) => i.trim())
            .filter((i) => i.length > 0);

          items.forEach((item) => {
            let cleanName = item.trim();
            if (cleanName.length === 0) return;
            if (!registry[cleanName]) registry[cleanName] = [];
            registry[cleanName].push(anime);
          });
        });

      Object.keys(registry).forEach((name) => {
        const matchAnimes = registry[name];
        const count = matchAnimes.length;

        // 💡 該当する声優のアニメを、作成日時・更新日時の古い順にソート（段階的な達成日を割り出すため）
        const sortedAnimes = [...matchAnimes].sort((a, b) => {
          const timeA = Math.max(
            Number(a.updated_at) || 0,
            Number(a.created_at) || 0,
          );
          const timeB = Math.max(
            Number(b.updated_at) || 0,
            Number(b.created_at) || 0,
          );
          return timeA - timeB;
        });

        // 💡 最高ランク1つだけではなく、条件を満たしているランク（ブロンズ、シルバー等）を全て生成
        config.thresholds.forEach((th, idx) => {
          if (count >= th) {
            const rank = RANK_NAMES[idx]; // 現在のインデックスのランク (bronze, silver...)
            const suffix = config.titles[idx]; // 対応する称号
            const typeLabel =
              type === "cast"
                ? "声優"
                : type === "director"
                  ? "監督"
                  : "制作会社";
            const medalId = `auto_medal_${type}_${name}_${rank}`; // 💡 IDにランクを混ぜて重複・上書きを回避！

            // 💡 そのランクの閾値（例: 3本目、10本目）を達成した「当時のアニメ」のタイムスタンプを狙い撃ち
            const targetAnimeIndex = th - 1;
            const targetAnime =
              sortedAnimes[targetAnimeIndex] ||
              sortedAnimes[sortedAnimes.length - 1];
            let unlockedAtVal = targetAnime
              ? Math.max(
                  Number(targetAnime.updated_at) || 0,
                  Number(targetAnime.created_at) || 0,
                )
              : accountCreatedTimestamp;
            if (unlockedAtVal === 0) unlockedAtVal = accountCreatedTimestamp;

            if (
              savedTrophyMap[medalId] &&
              savedTrophyMap[medalId].is_unlocked
            ) {
              unlockedAtVal =
                savedTrophyMap[medalId].unlocked_at || unlockedAtVal;
            } else {
              pendingSaveTasks.push({
                id: medalId,
                timestamp: String(unlockedAtVal),
              });
            }

            generatedMedals.push({
              id: medalId,
              category: "medal",
              title: `${name}${suffix}`,
              description: `${typeLabel}・${name} の関連作品を ${th} 本履修したオタクの勲章。`, // 💡 本数表示も可変に
              rank: rank,
              isUnlocked: true,
              unlockedAtVal: unlockedAtVal,
            });
          }
        });
      });
    });
  }

  // ---------------------------------------------------------------
  // 🏆 通常トロフィーの判定 ＆ DB保存・最終日時連動
  // ---------------------------------------------------------------
  const processedTrophies = [];
  let oshiCount = 0;
  animeDB.forEach((anime) => {
    if (anime.characters) {
      try {
        const charList =
          typeof anime.characters === "string"
            ? JSON.parse(anime.characters)
            : anime.characters;
        if (Array.isArray(charList)) {
          charList.forEach((c) => {
            if (c.isOshi || c.isIchioshi || c.isFavorite || c.fav || c.is_oshi)
              oshiCount++;
          });
        }
      } catch (e) {}
    }
  });

  for (const trophy of trophyList) {
    if (trophy.category === "medal") continue;

    const dbRecord = savedTrophyMap[trophy.id];
    let isUnlocked = false;
    let unlockedAtVal = null;

    if (dbRecord && dbRecord.is_unlocked) {
      isUnlocked = true;
      unlockedAtVal = dbRecord.unlocked_at || accountCreatedTimestamp;
    } else {
      const meetsCondition =
        trophy.id === "history_0"
          ? true
          : trophyEvaluators[trophy.id]
            ? trophyEvaluators[trophy.id](animeDB, oshiCount)
            : false;

      if (meetsCondition) {
        isUnlocked = true;
        let calculatedDate = nowTimestamp;

        if (trophy.id === "history_0") {
          calculatedDate = accountCreatedTimestamp;
        } else if (trophy.id.startsWith("count_")) {
          calculatedDate = getLatestAnimeTimestamp(
            animeDB.filter((a) => a.watch_status === "履修済"),
          );
        } else if (trophy.id.startsWith("story_")) {
          calculatedDate = getLatestAnimeTimestamp(
            animeDB.filter(
              (a) =>
                parseFloat(a.score_story) === 5.0 &&
                a.watch_status === "履修済",
            ),
          );
        } else if (trophy.id.startsWith("visual_")) {
          calculatedDate = getLatestAnimeTimestamp(
            animeDB.filter(
              (a) =>
                parseFloat(a.score_visual) === 5.0 &&
                a.watch_status === "履修済",
            ),
          );
        } else if (trophy.id.startsWith("music_")) {
          calculatedDate = getLatestAnimeTimestamp(
            animeDB.filter(
              (a) =>
                parseFloat(a.score_music) === 5.0 &&
                a.watch_status === "履修済",
            ),
          );
        } else if (trophy.id.startsWith("char_")) {
          calculatedDate = getLatestAnimeTimestamp(
            animeDB.filter(
              (a) =>
                parseFloat(a.score_character) === 5.0 &&
                a.watch_status === "履修済",
            ),
          );
        } else if (trophy.id.startsWith("resonance_")) {
          calculatedDate = getLatestAnimeTimestamp(
            animeDB.filter(
              (a) =>
                parseFloat(a.score_resonance) === 5.0 &&
                a.watch_status === "履修済",
            ),
          );
        } else if (trophy.id.startsWith("movie_")) {
          calculatedDate = getLatestAnimeTimestamp(
            animeDB.filter(
              (a) =>
                (a.format === "映画" || a.format === "MOVIE") &&
                a.watch_status === "履修済",
            ),
          );
        } else if (trophy.id.startsWith("short_")) {
          calculatedDate = getLatestAnimeTimestamp(
            animeDB.filter(
              (a) =>
                (a.format === "ショート" ||
                  a.format === "SHORT" ||
                  a.format === "TV_SHORT") &&
                a.watch_status === "履修済",
            ),
          );
        } else if (trophy.id.startsWith("tsundoku_")) {
          calculatedDate = getLatestAnimeTimestamp(
            animeDB.filter(
              (a) => a.watch_status === "未履修" || a.watch_status === "履修中",
            ),
          );
        } else if (trophy.id.startsWith("history_")) {
          calculatedDate =
            accountCreatedTimestamp +
            (trophy.id === "history_1"
              ? 30
              : trophy.id === "history_2"
                ? 180
                : trophy.id === "history_3"
                  ? 365
                  : 730) *
              24 *
              60 *
              60 *
              1000;
          if (calculatedDate > nowTimestamp) calculatedDate = nowTimestamp;
        } else {
          calculatedDate = getLatestAnimeTimestamp(animeDB);
        }

        unlockedAtVal = calculatedDate;
        pendingSaveTasks.push({
          id: trophy.id,
          timestamp: String(calculatedDate),
        });
      }
    }
    processedTrophies.push({ ...trophy, isUnlocked, unlockedAtVal });
  }

  // 💡 APIリクエスト1分間60回制限(1300ms間隔)を厳守した遅延キュー
  if (pendingSaveTasks.length > 0 && typeof saveTrophyToDB === "function") {
    console.log(
      `[TrophyQueue] 未保存の実績を ${pendingSaveTasks.length} 件検出。API制限回避のため1300ms間隔で同期を開始します。`,
    );
    (async () => {
      for (const task of pendingSaveTasks) {
        try {
          await saveTrophyToDB(task.id, task.timestamp);
          await new Promise((resolve) => setTimeout(resolve, 1300));
        } catch (err) {
          console.error(`[TrophyQueue] 同期エラー: ${task.id}`, err);
        }
      }
    })();
  }

  const finalAllList = [...processedTrophies, ...generatedMedals];

  finalAllList.forEach((t) => {
    if (t.isUnlocked) {
      if (t.id === "secret_perfect_1") {
        t.title = "極上のフルコース";
        t.description = "全評価項目が5.0点満点の神作が1本に到達した。";
      }
      if (t.id === "secret_perfect_2") {
        t.title = "神々の悪戯";
        t.description = "全評価項目が5.0点満点の神作が2本に到達した。";
      }
      if (t.id === "secret_perfect_3") {
        t.title = "黄金比のセカイ";
        t.description = "全評価項目が5.0点満点の神作が5本に到達した。";
      }
      if (t.id === "secret_perfect_4") {
        t.title = "アニメの概念を超越せし開拓者";
        t.description = "全評価項目が5.0点満点の神作が10本に到達した伝説。";
      }
      if (t.id === "secret_gap_1") {
        t.title = "B級映画の沼";
        t.description =
          "ストーリーは1.5以下だけど作画かキャラが5.0満点の偏愛作が1本に到達。";
      }
      if (t.id === "secret_gap_2") {
        t.title = "愛すべき歪な結晶";
        t.description =
          "ストーリーは1.5以下だけど作画かキャラが5.0満点の偏愛作が2本に到達。";
      }
      if (t.id === "secret_gap_3") {
        t.title = "カルト的信者の集会所";
        t.description =
          "ストーリーは1.5以下だけど作画かキャラが5.0満点の偏愛作が5本に到達。";
      }
      if (t.id === "secret_gap_4") {
        t.title = "これぞオタクの終着駅";
        t.description =
          "ストーリーは1.5以下だけど作画かキャラが5.0満点の偏愛作が10本に到達。";
      }
    }
  });

  // 💡 【完璧な階層タイムラインソートロジック】
  finalAllList.sort((a, b) => {
    // 1. 解放済みを上、未解放を下
    if (b.isUnlocked !== a.isUnlocked) return b.isUnlocked - a.isUnlocked;

    // 2. 解放済みの間での判定
    if (a.isUnlocked && b.isUnlocked) {
      const timeA = Number(a.unlockedAtVal || 0);
      const timeB = Number(b.unlockedAtVal || 0);

      // 基準①: 獲得日時が新しい順（降順）
      if (timeA !== timeB) {
        return timeB - timeA;
      }

      // 基準②: 獲得日時が【完全に同一】なら、ランクの「高い順」（プラチナが上、ブロンズが下）
      const weightA = RANK_WEIGHTS[a.rank || "bronze"] || 1;
      const weightB = RANK_WEIGHTS[b.rank || "bronze"] || 1;
      return weightB - weightA;
    }

    // 3. 未解放の間ではランクの低い順（ブロンズ ➔ プラチナ）
    const weightA = RANK_WEIGHTS[a.rank || "bronze"] || 1;
    const weightB = RANK_WEIGHTS[b.rank || "bronze"] || 1;
    if (weightA !== weightB) return weightA - weightB;

    return 0;
  });

  const unlockedNormalCount = processedTrophies.filter(
    (t) => t.isUnlocked,
  ).length;
  document.getElementById("unlockedTrophyCount").textContent =
    unlockedNormalCount;
  document.getElementById("totalTrophyCount").textContent =
    "/ " + processedTrophies.length;

  const medalCounterEl = document.getElementById("unlockedMedalCount");
  if (medalCounterEl) {
    if (isMedalVisible) {
      medalCounterEl.textContent = generatedMedals.length;
      medalCounterEl.style.opacity = "1";
    } else {
      medalCounterEl.textContent = "OFF";
      medalCounterEl.style.opacity = "0.5";
    }
  }

  if (finalAllList.length === 0) {
    container.innerHTML = `<div class="trophy-loading">トロフィーデータが空です。</div>`;
    return;
  }

  const trophyIconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="trophy-card-icon-svg"><path d="M6 6H4.5a2 2 0 0 0 0 4H6"></path><path d="M18 6h1.5a2 2 0 0 1 0 4H18"></path><path d="M6 3h12v5a6 6 0 0 1-12 0V3z"></path><path d="M12 14v4"></path><path d="M9.5 18h5l1.5 3H8l1.5-3z"></path></svg>`;
  const medalIconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="trophy-card-icon-svg"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>`;
  const lockedIconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="trophy-card-icon-svg"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`;

  container.innerHTML = finalAllList
    .map((t) => {
      const isSecretLocked = !t.isUnlocked && t.is_secret;
      const title = isSecretLocked ? "？？？？？" : t.title;
      const desc = isSecretLocked
        ? "このトロフィーの解放条件は謎に包まれている…"
        : t.description;
      const iconHtml = isSecretLocked
        ? lockedIconSvg
        : t.category === "medal"
          ? medalIconSvg
          : trophyIconSvg;
      const rankClass = t.rank || "bronze";
      const cardClass = t.isUnlocked
        ? `trophy-card unlocked ${rankClass}`
        : "trophy-card locked";
      const displayDate = formatDisplayDate(t.unlockedAtVal);
      const dateHtml = t.isUnlocked
        ? `<div class="trophy-card-date">${displayDate} 獲得</div>`
        : "";

      return `
        <div class="${cardClass}">
          ${iconHtml}
          <div class="trophy-card-info">
            <div class="trophy-card-title">${title}</div>
            <div class="trophy-card-desc">${desc}</div>
            ${dateHtml}
          </div>
        </div>
      `;
    })
    .join("");
};
