// =========================================================
// 🧩 js/components/modal.js：モーダル処理
// =========================================================

// ==========================================
// 画像プレビューモーダル制御用関数
// ==========================================
window.showPreviewModal = function (imgData) {
  const modal = document.getElementById("imagePreviewModal");
  const imgPreview = document.getElementById("generatedImagePreview");
  const downloadBtn = document.getElementById("downloadImageBtn");
  const cancelBtn = document.getElementById("cancelPreviewBtn");

  if (!modal || !imgPreview) return;

  // 画像をセットしてモーダルを表示
  imgPreview.src = imgData;
  modal.classList.remove("hidden");

  // 保存ボタンの処理
  downloadBtn.onclick = () => {
    const link = document.createElement("a");
    link.href = imgData;
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    link.download = `OtakuLog_Stats_${dateStr}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 保存したらモーダルを閉じる
    modal.classList.add("hidden");
  };

  // キャンセルボタンの処理
  cancelBtn.onclick = () => {
    modal.classList.add("hidden");
  };
};
// =========================================================
// 🌐 共通モーダル制御（プライバシーポリシー・利用規約・各種設定）
// =========================================================

// モーダルを開く関数
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden"; // モーダル開いてる間は後ろのスクロールを固定
  }
}

// モーダルを閉じる関数
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("hidden");
    document.body.style.overflow = ""; // スクロール固定を解除
  }
}

// モーダルの外側（黒背景）をクリックした時も閉じるようにする設定
document.querySelectorAll(".modal-overlay").forEach((overlay) => {
  overlay.addEventListener("click", (e) => {
    // クリックされたのが子要素（白い箱）ではなく、背景自体だった場合だけ閉じる
    if (e.target === overlay) {
      closeModal(overlay.id);
    }
  });
});

// --- 💡 フッターボタン・ナビボタンとの紐付け設定 ---
document.addEventListener("DOMContentLoaded", () => {
  // 1. フッターの「オタクログとは」ボタン
  const aboutBtn = document.getElementById("footerAboutBtn");
  if (aboutBtn) {
    aboutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      openModal("aboutModal");
    });
  }

  // 2. フッターの「利用規約」ボタン
  const termsBtn = document.getElementById("footerTermsBtn");
  if (termsBtn) {
    termsBtn.addEventListener("click", (e) => {
      e.preventDefault();
      openModal("termsModal");
    });
  }

  // 3. フッターの「プライバシーポリシー」ボタン
  const privacyBtn = document.getElementById("footerPrivacyBtn");
  if (privacyBtn) {
    privacyBtn.addEventListener("click", (e) => {
      e.preventDefault();
      openModal("privacyModal");
    });
  }

  // 4. 左ナビなどの「マイページ（設定）」ボタン
  const myPageBtn = document.getElementById("navMyPageBtn");
  if (myPageBtn) {
    myPageBtn.addEventListener("click", (e) => {
      e.preventDefault();
      openModal("myPageModal");
    });
  }
});
