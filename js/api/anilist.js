// =========================================================
// 🌍 js/anilist.js：外部API通信（AniList）
// アニメやキャラクター、声優の情報を外部から取得する専門ファイルです。
// =========================================================

// -----------------------------------------
// ① アニメを検索する魔法
// -----------------------------------------
async function fetchAnimeFromAnilist(query) {
  const graphqlQuery = `
    query ($search: String) {
      Page (page: 1, perPage: 10) {
        media (search: $search, type: ANIME) {
          id title { native romaji } season seasonYear format episodes duration genres description
          coverImage { large } studios(isMain: true) { nodes { name } }
          externalLinks { url site }
          staff (sort: RELEVANCE, perPage: 5) { edges { role node { name { full native } } } }
          characters (sort: [ROLE, FAVOURITES_DESC], perPage: 10) {
            edges {
              node { id name { full native } image { large } }
              voiceActors (language: JAPANESE) { name { full native } }
            }
          }
        }
      }
    }`;
  const res = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: graphqlQuery, variables: { search: query } }),
  });
  const json = await res.json();
  return json.data.Page.media;
}

// -----------------------------------------
// ② 声優を検索する魔法
// -----------------------------------------
async function fetchStaffFromAnilist(query) {
  const graphqlQuery = `query ($search: String) { Page(page: 1, perPage: 5) { staff(search: $search) { id name { full native } } } }`;
  const res = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: graphqlQuery, variables: { search: query } }),
  });
  const json = await res.json();
  return json.data.Page.staff || [];
}

// -----------------------------------------
// ③ キャラクターを自動取得して画面に出す魔法
// -----------------------------------------
window.fetchCharacterData = async function (anilistId) {
  const query = `query ($id: Int) { Media (id: $id, type: ANIME) { characters (sort: [ROLE, FAVOURITES_DESC], perPage: 10) { edges { node { id name { full native } image { large } } } } } }`;
  try {
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: query,
        variables: { id: parseInt(anilistId) },
      }),
    });
    const json = await res.json();
    const edges = json.data.Media.characters.edges;
    let characterList = edges.map((edge) => ({
      id: edge.node.id,
      name: edge.node.name.native || edge.node.name.full,
      img: edge.node.image?.large || "",
    }));
    document.getElementById("editCharacters").value =
      JSON.stringify(characterList);
    if (typeof window.renderCharacterList === "function")
      window.renderCharacterList();
  } catch (e) {
    console.error("キャラ自動補完エラー", e);
  }
};

// -----------------------------------------
// ④ 特定のキャラクターを名前で検索する魔法
// -----------------------------------------
window.searchCharacterFromAnilist = async function (query) {
  const graphqlQuery = `query ($search: String) { 
        Page(page: 1, perPage: 10) { 
            characters(search: $search) { id name { full native } image { large } } 
        } 
    }`;
  const res = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: graphqlQuery, variables: { search: query } }),
  });
  const json = await res.json();
  return json.data.Page.characters || [];
};
// ⑤ 英語のあらすじを日本語に翻訳する魔法（Gemini API経由）
window.translateSynopsis = async function (englishText, animeTitle) {
  if (!englishText) return "";

  const gasUrl =
    "https://script.google.com/macros/s/AKfycbz5tA_NaxljnTEX-_iAIy2mQLPn_HBrUYiR6hHDCLQJlFF01FuXBrssHlX06U09XC9o/exec";

  const userEmail = window.currentUserId;
  const userApiKey = userEmail
    ? localStorage.getItem(`gemini_api_key_${userEmail}`)
    : null;

  // 🌟 修正：キーが「空っぽ（nullや空文字）」または「消去フラグ（EMPTY）」の場合は未設定として扱う！
  if (!userApiKey || userApiKey === "EMPTY") {
    console.log(
      "Gemini APIキー未設定のため、AIあらすじ生成をスキップしました。",
    );
    return "マイページでGemini APIキーを設定すると、AIによる自動あらすじ生成が有効になります";
  }

  try {
    const cleanText = englishText.replace(/<[^>]*>?/gm, "");

    const res = await fetch(gasUrl, {
      method: "POST",
      body: JSON.stringify({
        text: cleanText,
        title: animeTitle,
        apiKey: userApiKey,
      }),
    });

    const json = await res.json();
    return json.translatedText;
  } catch (e) {
    console.error("翻訳エラー:", e);
    return "あらすじの取得に失敗しました。";
  }
};
