// =========================================================
// 📖 js/pages/quotes.js：チーム開発の結晶・洗練極限設計版
// =========================================================

(function () {
  // ─── 🎨 [共通ヘルパー] HTML生成の責任を持つオブジェクト ───
  const QuoteRenderer = {
    renderList(quotesArray) {
      if (!quotesArray || quotesArray.length === 0) return "";
      return quotesArray.map((q) => this.renderBlock(q)).join("");
    },
    renderBlock(q) {
      const epText = q.episode ? ` (${q.episode}話)` : "";
      return `
        <div class="quote-text-block">
          <p class="quote-main-speech">${q.text.replace(/"/g, "&quot;")}</p>
          <p class="quote-author-credit">— ${q.character || "キャラクター"}${epText}</p>
        </div>
      `;
    },
  };

  // ─── 📦 [データ管理クラス] 作品データの状態に責任を持つ ───
  class QuoteBookManager {
    constructor() {
      this.books = [];
      this.currentBookIdx = 0;
    }

    buildMasterList() {
      this.books = [];
      const sourceList = window.animeDB || [];
      sourceList.forEach((anime) => {
        if (!anime.favorite_quotes) return;
        try {
          const quotes =
            typeof anime.favorite_quotes === "string"
              ? JSON.parse(anime.favorite_quotes)
              : anime.favorite_quotes;
          if (Array.isArray(quotes) && quotes.length > 0) {
            this.books.push({
              animeId: anime.id,
              animeTitle: anime.title_japanese || anime.title || "不明な作品",
              quotes: quotes,
            });
          }
        } catch (e) {
          console.error("データ抽出エラー:", e);
        }
      });
    }

    get currentBook() {
      return this.books[this.currentBookIdx];
    }

    switchBook(idx) {
      this.currentBookIdx = idx;
    }

    nextBook() {
      this.currentBookIdx = (this.currentBookIdx + 1) % this.books.length;
    }

    prevBook() {
      this.currentBookIdx =
        (this.currentBookIdx - 1 + this.books.length) % this.books.length;
    }
  }

  // ─── 📖 [ページング計算クラス] 表示サイズからのページ割り振りに責任を持つ ───
  class QuotePager {
    constructor() {
      this.pagePairs = [];
      this.currentPagePairIdx = 0;
    }

    calculate(quotes, targetHeight, targetWidth) {
      // 💡 DOMアクセスはここだけ（テスターは動的生成ではないため、ここでのみ取得）
      const tester = document.getElementById("quoteHeightTester");
      if (!tester) return;

      tester.style.width = `${targetWidth}px`;
      tester.innerHTML = "";

      let pages = [];
      let currentPageItems = [];

      quotes.forEach((q) => {
        tester.insertAdjacentHTML("beforeend", QuoteRenderer.renderBlock(q));

        if (
          tester.scrollHeight > targetHeight - 12 &&
          currentPageItems.length > 0
        ) {
          pages.push(currentPageItems);
          currentPageItems = [q];
          tester.innerHTML = QuoteRenderer.renderBlock(q);
        } else {
          currentPageItems.push(q);
        }
      });

      if (currentPageItems.length > 0) pages.push(currentPageItems);
      tester.innerHTML = "";

      this.pagePairs = [];
      for (let i = 0; i < pages.length; i += 2) {
        this.pagePairs.push({
          left: pages[i],
          right: pages[i + 1] || null,
        });
      }
    }

    get currentPair() {
      return this.pagePairs[this.currentPagePairIdx] || null;
    }

    get totalPages() {
      return this.pagePairs.length || 1;
    }
  }

  // ─── 🏹 [アニメーション・ライフサイクルクラス] めくり演出に責任を持つ ───
  class QuoteFlipAnimation {
    constructor(step, currentPair, nextPair, onComplete) {
      this.step = step;
      this.currentPair = currentPair;
      this.nextPair = nextPair;
      this.onComplete = onComplete;

      this.wrapper = document.querySelector(".quote-spread-wrapper");
      this.flipDiv = null;
      this.boundTransitionEndHandler = this.handleTransitionEnd.bind(this);

      this.createFlipElement();
    }

    createFlipElement() {
      if (!this.wrapper) return;

      this.flipDiv = document.createElement("div");
      this.flipDiv.className = `quote-page-flip ${this.step > 0 ? "flip-to-left" : "flip-to-right"}`;
      const sheetPaddingClass = "padding: 20px 70px;";

      // 💡 画面側の本物のDOM（UI）への先行表示とフリップ内の中身アサイン
      if (this.step > 0) {
        this.flipDiv.innerHTML = `
          <div class="flip-surface-front" style="${sheetPaddingClass}">
            <div class="quote-sheet-inner">${QuoteRenderer.renderList(this.currentPair.right)}</div>
          </div>
          <div class="flip-surface-back" style="${sheetPaddingClass}">
            <div class="quote-sheet-inner">${QuoteRenderer.renderList(this.nextPair.left)}</div>
          </div>
        `;
        if (UI.right)
          UI.right.innerHTML = QuoteRenderer.renderList(this.nextPair.right);
      } else {
        this.flipDiv.innerHTML = `
          <div class="flip-surface-front" style="${sheetPaddingClass}">
            <div class="quote-sheet-inner">${QuoteRenderer.renderList(this.currentPair.left)}</div>
          </div>
          <div class="flip-surface-back" style="${sheetPaddingClass}">
            <div class="quote-sheet-inner">${QuoteRenderer.renderList(this.nextPair.right)}</div>
          </div>
        `;
        if (UI.left)
          UI.left.innerHTML = QuoteRenderer.renderList(this.nextPair.left);
      }
    }

    start() {
      if (!this.flipDiv || !this.wrapper) return;

      this.wrapper.appendChild(this.flipDiv);
      this.flipDiv.addEventListener(
        "transitionend",
        this.boundTransitionEndHandler,
      );

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (this.flipDiv) {
            this.flipDiv.classList.add(
              this.step > 0 ? "effect-next" : "effect-prev",
            );
          }
        });
      });
    }

    handleTransitionEnd(e) {
      if (e.propertyName !== "transform") return;
      if (this.onComplete) this.onComplete();
      this.destroy();
    }

    destroy() {
      if (this.flipDiv) {
        this.flipDiv.removeEventListener(
          "transitionend",
          this.boundTransitionEndHandler,
        );
        if (this.flipDiv.parentNode) {
          this.flipDiv.parentNode.removeChild(this.flipDiv);
        }
      }
      this.flipDiv = null;
      this.wrapper = null;
      this.onComplete = null;
    }
  }

  // ─── 🏛️ 全体を統括するシステムコア ───
  const BM = new QuoteBookManager();
  const Pager = new QuotePager();

  // 💡 【大改善】頻繁にアクセスするDOM要素をキャッシュする責任を持つオブジェクト
  const UI = {
    left: null,
    right: null,
    title: null,
    page: null,

    // HTMLが流し込まれた後に一括でキャッシュを更新する
    refresh() {
      this.left = document.getElementById("quoteLeftContent");
      this.right = document.getElementById("quoteRightContent");
      this.title = document.getElementById("quoteBookTitle");
      this.page = document.getElementById("quotePageNum");
    },
  };

  window.renderQuoteLibraryPage = function () {
    const container = document.getElementById("quoteLibraryArea");
    if (!container) return;

    container.innerHTML = "";
    BM.buildMasterList();

    if (BM.books.length === 0) {
      container.innerHTML = `<div class="list-empty-text" style="padding: 40px; text-align: center; color: #94a3b8;">まだ名言が登録されていません。</div>`;
      return;
    }

    loadBook(BM.currentBookIdx);
  };

  function loadBook(bookIdx) {
    BM.switchBook(bookIdx);
    Pager.currentPagePairIdx = 0;

    renderBookStage(document.getElementById("quoteLibraryArea"));
    refreshPages();
  }

  function refreshPages() {
    if (!UI.left) return;
    // キャッシュされたUIから安全にサイズを取得して計算
    Pager.calculate(
      BM.currentBook.quotes,
      UI.left.clientHeight,
      UI.left.clientWidth,
    );
    updatePageDisplay();
  }

  function renderBookStage(container) {
    container.innerHTML = `
      <div class="quote-book-top-bar">
        <div class="quote-header-left-group"><span class="quote-page-number" id="quotePageNum">ページ -- / --</span></div>
        <div class="quote-book-header-fixed"><h3 class="quote-book-title" id="quoteBookTitle">${BM.currentBook.animeTitle}</h3></div>
        <div class="quote-header-right-group">
          <button class="quote-index-trigger" id="quoteIndexBtn">
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>作品目次
          </button>
        </div>
      </div>
      <div class="quote-spread-wrapper">
        <div class="quote-sheet page-left"><div class="quote-sheet-inner" id="quoteLeftContent"></div></div>
        <div class="book-spine"></div>
        <div class="quote-sheet page-right"><div class="quote-sheet-inner" id="quoteRightContent"></div></div>
        <div id="quoteHeightTester" style="position: absolute; visibility: hidden; pointer-events: none; top: 0; left: 0; display: flex; flex-direction: column; gap: 10px; z-index: -1;"></div>
      </div>
      <button class="quote-page-nav-btn prev-btn" id="quotePrevBtn"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg></button>
      <button class="quote-page-nav-btn next-btn" id="quoteNextBtn"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg></button>
      <div class="quote-index-popup hidden" id="quoteIndexPopup">
        <h5>作品目次</h5>
        <div class="quote-index-list">${BM.books.map((b, i) => `<div class="quote-index-item" data-idx="${i}">${b.animeTitle}</div>`).join("")}</div>
      </div>
    `;

    // 💡 HTMLが確定したので、即座にUIキャッシュを最新化する
    UI.refresh();

    document.getElementById("quotePrevBtn").onclick = () => movePage(-1);
    document.getElementById("quoteNextBtn").onclick = () => movePage(1);

    const indexBtn = document.getElementById("quoteIndexBtn");
    const popup = document.getElementById("quoteIndexPopup");

    indexBtn.onclick = (e) => {
      e.stopPropagation();
      popup.classList.toggle("hidden");
    };

    popup.querySelectorAll(".quote-index-item").forEach((item) => {
      item.onclick = (e) => {
        loadBook(parseInt(e.currentTarget.getAttribute("data-idx")));
        popup.classList.add("hidden");
      };
    });
  }

  function updatePageDisplay() {
    if (Pager.pagePairs.length === 0) return;

    if (UI.title) UI.title.innerText = BM.currentBook.animeTitle;
    if (UI.page)
      UI.page.innerText = `ページ ${Pager.currentPagePairIdx + 1} / ${Pager.totalPages}`;

    const pair = Pager.currentPair;
    if (UI.left)
      UI.left.innerHTML = pair ? QuoteRenderer.renderList(pair.left) : "";
    if (UI.right)
      UI.right.innerHTML = pair ? QuoteRenderer.renderList(pair.right) : "";
  }

  function movePage(step) {
    if (Pager.pagePairs.length === 0) return;
    const nextPairIdx = Pager.currentPagePairIdx + step;

    // 作品またぎ：次へ
    if (nextPairIdx >= Pager.pagePairs.length) {
      BM.nextBook();
      const tempPager = new QuotePager();
      tempPager.calculate(
        BM.currentBook.quotes,
        UI.left.clientHeight,
        UI.left.clientWidth,
      );

      const animator = new QuoteFlipAnimation(
        step,
        Pager.currentPair,
        tempPager.pagePairs[0],
        () => {
          Pager.pagePairs = tempPager.pagePairs;
          Pager.currentPagePairIdx = 0;
          updatePageDisplay();
        },
      );
      animator.start();
      if (UI.title) UI.title.innerText = BM.currentBook.animeTitle;
      return;
    }

    // 作品またぎ：前へ
    if (nextPairIdx < 0) {
      BM.prevBook();
      const tempPager = new QuotePager();
      tempPager.calculate(
        BM.currentBook.quotes,
        UI.left.clientHeight,
        UI.left.clientWidth,
      );
      const lastIdx = tempPager.pagePairs.length - 1;

      const animator = new QuoteFlipAnimation(
        step,
        Pager.currentPair,
        tempPager.pagePairs[lastIdx],
        () => {
          Pager.pagePairs = tempPager.pagePairs;
          Pager.currentPagePairIdx = lastIdx;
          updatePageDisplay();
        },
      );
      animator.start();
      if (UI.title) UI.title.innerText = BM.currentBook.animeTitle;
      return;
    }

    // 同一作品内での移動
    const currentPair = Pager.currentPair;
    const nextPair = Pager.pagePairs[nextPairIdx];

    const animator = new QuoteFlipAnimation(step, currentPair, nextPair, () => {
      Pager.currentPagePairIdx = nextPairIdx;
      updatePageDisplay();
    });
    animator.start();
  }

  // ─── 🌐 [グローバルイベントリスナー] ───

  document.addEventListener("click", () => {
    const popup = document.getElementById("quoteIndexPopup");
    if (popup && !popup.classList.contains("hidden")) {
      popup.classList.add("hidden");
    }
  });

  let resizeTimeout;
  window.addEventListener("resize", () => {
    if (window.currentView !== "quoteLibrary") return;
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(refreshPages, 150);
  });

  document.addEventListener("keydown", (e) => {
    if (window.currentView !== "quoteLibrary") return;
    if (e.key === "ArrowRight") movePage(1);
    else if (e.key === "ArrowLeft") movePage(-1);
  });
})();
