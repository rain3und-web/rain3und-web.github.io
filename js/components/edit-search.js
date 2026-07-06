// =========================================================
// 🎬 js/components/edit-search.js：モーダル専用検索・UI制御
// 編集・追加モーダル内にある各種検索入力の動きを管理します。
// =========================================================

// 🌟 対象アニメのキャラクター一覧を一時保存する変数
let currentAnimeCharacters = [];

// -----------------------------------------
// ① モーダル内の「アニメ追加検索(AniList)」機能
// -----------------------------------------
let searchTimeout;
document.getElementById("addSearchInput")?.addEventListener("input", (e) => {
  clearTimeout(searchTimeout);
  const query = e.target.value;
  const results = document.getElementById("popupResults");
  const count = document.getElementById("popupResultCount");
  if (query.length < 2) {
    results.innerHTML = "";
    count.innerText = "検索結果 0 件";
    return;
  }
  document.getElementById("searchLoader").style.display = "block";
  searchTimeout = setTimeout(async () => {
    try {
      const animes = await fetchAnimeFromAnilist(query);
      results.innerHTML = "";
      document.getElementById("searchLoader").style.display = "none";
      count.innerText = `検索結果 ${animes.length} 件`;
      animes.forEach((anime) => {
        const title = anime.title.native || anime.title.romaji;
        const rawStudio =
          anime.studios.nodes.length > 0 ? anime.studios.nodes[0].name : "不明";
        const studio = window.translateStudio(rawStudio);
        const img = anime.coverImage.large;

        const durationStr = anime.duration ? `(${anime.duration}分/話)` : "";
        const meta = `${anime.seasonYear || "不明"} ${anime.format || ""} ${anime.episodes ? "全" + anime.episodes + "話" : ""} ${durationStr}`;

        const genres_jp = window.translateGenres(
          anime.genres ? anime.genres.join(", ") : "",
        );
        const officialSite =
          anime.externalLinks?.find((l) => l.site === "Official Site")?.url ||
          "";

        const directorEdge = anime.staff?.edges?.find((e) =>
          e.role.toLowerCase().includes("director"),
        );
        let director = "";
        if (directorEdge) {
          const dNative = directorEdge.node.name.native;
          const dFull = directorEdge.node.name.full;
          director = dNative || dFull;
          if (dNative && dFull && dNative !== dFull)
            director = `${dNative}[${dFull}]`;
          director = director.replace(/[\r\n]/g, "").trim();
        }

        let voiceActors = [];
        let characterList = [];
        if (anime.characters && anime.characters.edges) {
          anime.characters.edges.forEach((edge) => {
            if (edge.voiceActors && edge.voiceActors.length > 0) {
              const native = edge.voiceActors[0].name.native;
              const full = edge.voiceActors[0].name.full;
              let vaName = native || full;
              if (native && full && native !== full)
                vaName = `${native}[${full}]`;
              vaName = vaName.replace(/[\r\n]/g, "").trim();
              if (vaName && !voiceActors.includes(vaName))
                voiceActors.push(vaName);
            }
            characterList.push({
              id: edge.node.id,
              name: edge.node.name.native || edge.node.name.full,
              img: edge.node.image?.large || "",
            });
          });
        }
        const castString = voiceActors.join(", ");
        const displayCastStr = voiceActors
          .map((v) => v.replace(/\[[^\]]*\]/g, ""))
          .join(", ");
        const div = document.createElement("div");
        div.className = "pop-result-item";
        div.innerHTML = `
                        <img src="${img}" class="pop-result-img">
                        <div class="pop-result-info">
                            <div class="pop-result-title">${title}</div><div class="pop-result-meta">${meta}<br>制作: ${studio}<br>声優: ${displayCastStr || "データなし"}</div>
                        </div><button class="btn-pop-add">＋ 追加</button>
                    `;
        div.querySelector("button").onclick = async (e) => {
          const btn = e.currentTarget;
          window.currentActiveAnime = anime;

          btn.classList.add("is-loading");
          const originalText = btn.innerText;
          btn.innerText = "取得中...";
          btn.disabled = true;

          try {
            const existingData = window.animeDB.find(
              (a) => String(a.anilist_id) === String(anime.id),
            );
            let synopsis_jp =
              existingData && existingData.synopsis
                ? existingData.synopsis
                : "";

            const infoText =
              "（マイページでGemini APIキーを設定すると、AIによる自動あらすじ生成が有効になります）";

            const isSynopsisEmptyOrGuide =
              !synopsis_jp ||
              synopsis_jp === infoText ||
              synopsis_jp.includes("Gemini APIキーを設定すると");

            if (isSynopsisEmptyOrGuide && anime.description) {
              synopsis_jp = await window.translateSynopsis(
                anime.description,
                title,
              );
            } else if (existingData && existingData.synopsis) {
              synopsis_jp = existingData.synopsis;
              console.log("🔒 既存のあらすじを保護しました。");
            }

            window.openEditModal(null, {
              anilist_id: String(anime.id),
              title: title,
              synopsis: synopsis_jp,
              year:
                existingData && existingData.year
                  ? existingData.year
                  : `${anime.seasonYear || ""}${window.translateSeason ? window.translateSeason(anime.season) : ""}`,
              format: anime.format,
              eps: anime.episodes ? anime.episodes : "",
              duration:
                existingData && existingData.duration
                  ? existingData.duration
                  : anime.duration,
              studio: studio,
              castStr: castString,
              img: img,
              genres: genres_jp,
              director: director,
              officialSite: officialSite,
              characters:
                existingData && existingData.characters
                  ? existingData.characters
                  : JSON.stringify(characterList),
              watch_status: existingData ? existingData.watch_status : "履修済",
              memo: existingData ? existingData.memo : "",
              score_story: existingData ? existingData.score_story : 0,
              score_visual: existingData ? existingData.score_visual : 0,
              score_character: existingData ? existingData.score_character : 0,
              score_music: existingData ? existingData.score_music : 0,
              score_resonance: existingData ? existingData.score_resonance : 0,
            });
          } catch (err) {
            console.error("データ取得エラー:", err);
            alert("アニメ情報の取得中にエラーが発生しました。");
          }
          {
            btn.classList.remove("is-loading");
            btn.innerText = originalText;
            btn.disabled = false;
          }
        };
        results.appendChild(div);
      });
    } catch (err) {
      console.error(err);
      document.getElementById("searchLoader").style.display = "none";
    }
  }, 600);
});

// -----------------------------------------
// ② モーダル内の「声優検索」機能
// -----------------------------------------
let actorSearchTimeout;
document.getElementById("actorSearchInput")?.addEventListener("input", (e) => {
  clearTimeout(actorSearchTimeout);
  const query = e.target.value.trim();
  const suggestBox = document.getElementById("actorSuggestBox");
  if (!suggestBox) return;

  if (query.length < 1) {
    suggestBox.innerHTML = "";
    suggestBox.classList.add("hidden");
    return;
  }
  suggestBox.classList.remove("hidden");
  suggestBox.innerHTML = '<div class="suggest-message">検索中...</div>';

  actorSearchTimeout = setTimeout(async () => {
    try {
      const staffList = await window.fetchStaffFromAnilist(query);
      suggestBox.innerHTML = "";
      if (staffList && staffList.length > 0) {
        staffList.forEach((staff) => {
          const native = staff.name.native;
          const full = staff.name.full;
          let vaName = native || full;
          if (native && full && native !== full) {
            vaName = `${native}[${full}]`;
          }
          vaName = vaName.replace(/\n/g, "").trim();

          const displayTag = vaName.replace(/\[[\s\S]*?\]/g, "");
          const div = document.createElement("div");
          div.className = "voiceActor-chara-suggest-item pop-up-animation";
          div.innerText = `${displayTag} を追加`;
          div.onclick = () => {
            let tags = document.getElementById("editVoiceActors").value
              ? document
                  .getElementById("editVoiceActors")
                  .value.split(",")
                  .map((s) => s.replace(/\n/g, "").trim())
                  .filter(Boolean)
              : [];
            if (!tags.includes(vaName)) tags.push(vaName);
            document.getElementById("editVoiceActors").value = tags.join(", ");
            document.getElementById("actorSearchInput").value = "";
            suggestBox.innerHTML = "";
            suggestBox.classList.add("hidden");
            window.updateActorCurrentList();
            window.renderVoiceActors();
          };
          suggestBox.appendChild(div);
        });
      } else {
        suggestBox.innerHTML =
          '<div class="suggest-message error">見つかりませんでした</div>';
      }
    } catch (err) {
      suggestBox.innerHTML =
        '<div class="suggest-message error">エラーが発生しました</div>';
    }
  }, 500);
});

// -----------------------------------------
// ③ モーダル内の「キャラクター検索・サジェスト」表示処理
// -----------------------------------------
function renderCharacterSuggestBox(charactersToDisplay) {
  const suggestBox = document.getElementById("charSuggestBox");
  if (!suggestBox) return;
  suggestBox.innerHTML = "";

  if (charactersToDisplay.length === 0) {
    suggestBox.innerHTML =
      '<div class="suggest-message error">見つかりませんでした</div>';
    return;
  }

  charactersToDisplay.forEach((edge) => {
    const c = edge.node;
    const cName = c.name.native || c.name.full;
    const voiceActors = edge.voiceActors || [];

    const div = document.createElement("div");
    div.className = "voiceActor-chara-suggest-item pop-up-animation";
    div.innerHTML = `<img src="${c.image?.large || ""}" class="suggest-char-img"> ${cName} を追加`;

    div.onclick = () => {
      let chars = [];
      const rawVal = document.getElementById("editCharacters").value;
      if (rawVal) {
        try {
          chars = JSON.parse(rawVal);
        } catch (err) {}
      }
      if (!chars.find((x) => x.id === c.id)) {
        chars.push({
          id: c.id,
          name: cName,
          img: c.image?.large || "",
          isOshi: false,
        });
        document.getElementById("editCharacters").value = JSON.stringify(chars);
      }

      if (voiceActors.length > 0) {
        const va = voiceActors[0];
        const vaNative = va.name.native;
        const vaFull = va.name.full;
        let vaName = vaNative || vaFull;
        if (vaNative && vaFull && vaNative !== vaFull) {
          vaName = `${vaNative}[${full}]`;
        }
        vaName = vaName.replace(/\n/g, "").trim();

        let actorTags = document.getElementById("editVoiceActors").value
          ? document
              .getElementById("editVoiceActors")
              .value.split(",")
              .map((s) => s.replace(/\n/g, "").trim())
              .filter(Boolean)
          : [];

        if (!actorTags.includes(vaName)) {
          actorTags.push(vaName);
          document.getElementById("editVoiceActors").value =
            actorTags.join(", ");
          if (typeof window.updateActorCurrentList === "function")
            window.updateActorCurrentList();
          if (typeof window.renderVoiceActors === "function")
            window.renderVoiceActors();
        }
      }

      document.getElementById("charSearchInput").value = "";
      suggestBox.innerHTML = "";
      document.getElementById("charaSearchContainer")?.classList.add("hidden");
      if (typeof window.renderCharacterList === "function")
        window.renderCharacterList();
    };
    suggestBox.appendChild(div);
  });
}

// -----------------------------------------
// ④ モーダル内の「キャラ一覧を開く」処理
// -----------------------------------------
async function openCharacterDropdown() {
  const suggestBox = document.getElementById("charSuggestBox");
  if (!suggestBox) return;

  suggestBox.innerHTML =
    '<div class="suggest-message">キャラクター一覧を読み込み中...</div>';
  suggestBox.classList.remove("hidden");

  let currentAnilistId = document.getElementById("editAnilistId")?.value;

  if (!currentAnilistId && window.currentEditingAnime) {
    currentAnilistId = window.currentEditingAnime.anilist_id;
  }

  if (!currentAnilistId) {
    suggestBox.innerHTML =
      '<div class="suggest-message error">アニメIDが特定できません</div>';
    return;
  }

  try {
    if (currentAnimeCharacters.length === 0) {
      currentAnimeCharacters =
        await window.fetchAnimeCharactersAndActors(currentAnilistId);
    }
    renderCharacterSuggestBox(currentAnimeCharacters);
  } catch (err) {
    suggestBox.innerHTML =
      '<div class="suggest-message error">読み込みに失敗しました</div>';
  }
}

// -----------------------------------------
// ⑤ キャラ検索欄の入力イベント（絞り込み）
// -----------------------------------------
document.getElementById("charSearchInput")?.addEventListener("input", (e) => {
  const query = e.target.value.trim().toLowerCase();
  const suggestBox = document.getElementById("charSuggestBox");
  if (!suggestBox) return;

  if (query.length === 0) {
    if (currentAnimeCharacters.length > 0) {
      renderCharacterSuggestBox(currentAnimeCharacters);
    } else {
      suggestBox.innerHTML = "";
    }
    return;
  }

  const filteredChars = currentAnimeCharacters.filter((edge) => {
    const cNameFull = (edge.node.name.full || "").toLowerCase();
    const cNameNative = (edge.node.name.native || "").toLowerCase();
    return cNameFull.includes(query) || cNameNative.includes(query);
  });

  renderCharacterSuggestBox(filteredChars);
});

// -----------------------------------------
// ⑥ モーダル内の「監督検索」機能
// -----------------------------------------
document.getElementById("editDirector")?.addEventListener("input", (e) => {
  const query = e.target.value.trim();
  document.getElementById("editDirectorRaw").value = query;
  if (typeof window.searchDirectorSuggest === "function")
    window.searchDirectorSuggest(query);
});
