// -----------------------------------------
// ③ 検索・予測変換（サジェスト）機能
// -----------------------------------------
// 【メイン検索】
document.getElementById("mainSearchInput")?.addEventListener("input", (e) => {
  const query = e.target.value.toLowerCase().trim();
  const suggestBox = document.getElementById("searchSuggestBox");
  if (query.length < 1) {
    suggestBox.classList.add("hidden");
    if (window.filterQuery && window.filterQuery.type === "search")
      window.filterQuery = null;
    window.renderGrid();
    return;
  }
  let suggestions = [];
  window.animeDB.forEach((a) => {
    if (a.title.toLowerCase().includes(query))
      suggestions.push({ type: "title", label: a.title, badge: "作品" });
    if (a.studio && a.studio.toLowerCase().includes(query))
      suggestions.push({ type: "studio", label: a.studio, badge: "制作" });
    if (a.director) {
      let name = a.director.replace(/[\r\n]/g, "").trim();
      if (name.toLowerCase().includes(query))
        suggestions.push({ type: "director", label: name, badge: "監督" });
    }
    if (a.cast) {
      a.cast.split(",").forEach((c) => {
        let name = c.replace(/[\r\n]/g, "").trim();
        if (name.toLowerCase().includes(query))
          suggestions.push({ type: "voiceActor", label: name, badge: "声優" });
      });
    }
  });
  let uniqueMap = new Map();
  suggestions.forEach((item) => {
    uniqueMap.set(item.label + item.type, item);
  });
  let uniqueList = Array.from(uniqueMap.values()).slice(0, 10);
  if (uniqueList.length > 0) {
    suggestBox.innerHTML = uniqueList
      .map((s) => {
        const displayLabel = s.label.replace(/\[[^\]]*\]/g, "").trim();
        const safeLabel = s.label.replace(/'/g, "\\'");
        return `<div class="suggest-item" onclick="window.applySearchSuggest('${s.type}', '${safeLabel}')"><span class="suggest-badge">${s.badge}</span> ${displayLabel}</div>`;
      })
      .join("");
    suggestBox.classList.remove("hidden");
  } else {
    suggestBox.classList.add("hidden");
  }
});

// 【アニメ追加検索(AniList)】
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

        // ★シーズンを廃止し、純粋な「年」と「時間」だけにする
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
          // 1. クリックされたボタンを取得
          const btn = e.currentTarget;

          // 🌟【大復活！】アニリストの生データを丸ごと一時保管庫に叩き込む！
          // これにより、画面（UI）を汚すことなく裏で anime.season が app.js へ引き継がれます
          window.currentActiveAnime = anime;

          // 2. ボタンをローディング状態にする（CSSクラスで制御）
          btn.classList.add("is-loading");
          const originalText = btn.innerText;
          btn.innerText = "取得中...";
          btn.disabled = true; // 連打防止

          try {
            const existingData = window.animeDB.find(
              (a) => String(a.anilist_id) === String(anime.id),
            );
            let synopsis_jp =
              existingData && existingData.synopsis
                ? existingData.synopsis
                : "";

            // -----------------------------------------------------------------
            // 3. 既存のあらすじの判定 ＆ 誤操作による手書きあらすじ上書き完全防衛ガード
            // -----------------------------------------------------------------
            const infoText =
              "（マイページでGemini APIキーを設定すると、AIによる自動あらすじ生成が有効になります）";

            // 「まだあらすじが無い」または「あらすじ欄がただの初期案内テキストのまま」の場合のみ、上書き・生成の対象にする
            const isSynopsisEmptyOrGuide =
              !synopsis_jp ||
              synopsis_jp === infoText ||
              synopsis_jp.includes("Gemini APIキーを設定すると");

            if (isSynopsisEmptyOrGuide && anime.description) {
              // 新規生成、または案内テキストからのアップデート時のみGeminiを呼び出す
              synopsis_jp = await window.translateSynopsis(
                anime.description,
                title,
              );
            } else if (existingData && existingData.synopsis) {
              // 🌟 手書きのあらすじ、または過去にGeminiが生成したあらすじが既にある場合は、絶対に上書きせず死守する！
              synopsis_jp = existingData.synopsis;
              console.log(
                "🔒 ユーザーの手書きあらすじ、または既存ログを検出。上書きを完全にブロックしました。",
              );
            }

            // ★元々あった処理：SAVEボタンに確定したあらすじをこっそり持たせておく
            const saveBtn = document.getElementById("saveBtn");
            if (saveBtn) saveBtn.dataset.synopsis = synopsis_jp;
            // -----------------------------------------------------------------
            // 4. データが揃ったらモーダルを開く
            window.openEditModal(null, {
              anilist_id: String(anime.id),
              title: title,
              synopsis: synopsis_jp, // ★ここで取得したあらすじを渡す！
              year:
                existingData && existingData.year
                  ? existingData.year
                  : `${anime.seasonYear || ""}${window.translateSeason ? window.translateSeason(anime.season) : ""}`,
              format: anime.format,
              eps: anime.episodes ? "全" + anime.episodes + "話" : "",
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
          } finally {
            // 5. 処理が終わったらローディング状態を解除
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
// 【声優検索】
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

// 【キャラ検索】
let charSearchTimeout;
document.getElementById("charSearchInput")?.addEventListener("input", (e) => {
  clearTimeout(charSearchTimeout);
  const query = e.target.value.trim();
  const suggestBox = document.getElementById("charSuggestBox");
  if (!suggestBox) return;
  if (query.length < 1) {
    suggestBox.innerHTML = "";
    return;
  }

  // 🌟 修正1：検索中メッセージを共通クラスに！
  suggestBox.innerHTML = '<div class="suggest-message">検索中...</div>';

  charSearchTimeout = setTimeout(async () => {
    try {
      const charList = await window.searchCharacterFromAnilist(query);
      suggestBox.innerHTML = "";
      if (charList && charList.length > 0) {
        charList.forEach((c) => {
          const cName = c.name.native || c.name.full;
          const div = document.createElement("div");
          div.className = "voiceActor-chara-suggest-item pop-up-animation";

          // 🌟 修正2：新人さん（アイコン画像）をクラスに置き換え！
          div.innerHTML = `<img src="${c.image?.large || ""}" class="suggest-char-img"> ${cName} を追加`;

          div.onclick = () => {
            let chars = [];
            const rawVal = document.getElementById("editCharacters").value;
            if (rawVal)
              try {
                chars = JSON.parse(rawVal);
              } catch (err) {}
            if (!chars.find((x) => x.id === c.id)) {
              chars.push({
                id: c.id,
                name: cName,
                img: c.image?.large || "",
                isOshi: false,
              });
              document.getElementById("editCharacters").value =
                JSON.stringify(chars);
            }
            document.getElementById("charSearchInput").value = "";
            suggestBox.innerHTML = "";
            document
              .getElementById("charaSearchContainer")
              ?.classList.add("hidden");
            window.renderCharacterList();
          };
          suggestBox.appendChild(div);
        });
      } else {
        // 🌟 修正3：見つからない時のメッセージも共通クラスに！
        suggestBox.innerHTML =
          '<div class="suggest-message error">見つかりませんでした</div>';
      }
    } catch (err) {
      // 🌟 修正4：エラー時のメッセージも共通クラスに！
      suggestBox.innerHTML =
        '<div class="suggest-message error">エラーが発生しました</div>';
    }
  }, 500);
});

// 【監督検索】
document.getElementById("editDirector")?.addEventListener("input", (e) => {
  const query = e.target.value.trim();
  document.getElementById("editDirectorRaw").value = query; // 手動入力時はそのまま同期
  if (typeof window.searchDirectorSuggest === "function")
    window.searchDirectorSuggest(query);
});
