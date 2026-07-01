// =========================================================
// 🧩 js/components/customSelect.js：自作セレクトボックスの動き
// =========================================================

// ステータス用（色や文字の連動）
window.updateStatusColor = function () {
  const hiddenInput = document.getElementById("editStatus");
  const triggerBtn = document.getElementById("customStatusTrigger");
  if (!hiddenInput || !triggerBtn) return;

  // Firebaseの値をそのままdata-statusへ
  triggerBtn.setAttribute("data-status", hiddenInput.value || "未履修");

  // 表示文字
  const textSpan = triggerBtn.querySelector(".status-trigger-text");
  if (textSpan) {
    textSpan.textContent = hiddenInput.value || "未履修";
  }
};

// プルダウンの開閉や選択時のイベント設定
window.setupCustomSelects = function () {
  document
    .querySelectorAll(
      ".custom-select-wrapper, .score-trigger, .format-select-trigger",
    )
    .forEach((wrapper) => {
      const trigger = wrapper.querySelector(".cute-custom-trigger");
      const options = wrapper.querySelector(".cute-custom-options");
      const hiddenInput = wrapper.querySelector('input[type="hidden"]');
      if (!trigger || !options || !hiddenInput) return;
      trigger.onclick = (e) => {
        e.stopPropagation();
        document.querySelectorAll(".cute-custom-options").forEach((opt) => {
          if (opt !== options) opt.classList.add("hidden");
        });
        options.classList.toggle("hidden");
      };
      options.querySelectorAll("div").forEach((opt) => {
        opt.onclick = (e) => {
          e.stopPropagation();

          hiddenInput.value = opt.getAttribute("data-value");

          // ステータス用のセレクトだけ特別処理
          const textSpan = trigger.querySelector(".status-trigger-text");

          if (textSpan) {
            textSpan.innerText = opt.innerText;
            trigger.dataset.status = opt.getAttribute("data-value");
          } else {
            // それ以外のセレクト
            trigger.innerText = opt.innerText;
          }

          options.classList.add("hidden");
          hiddenInput.dispatchEvent(new Event("change"));
        };
      });
    });
};

// データの値をプルダウンの見た目に反映
window.updateCustomSelectDisplays = function () {
  document.querySelectorAll(".custom-select-wrapper").forEach((wrapper) => {
    const hiddenInput = wrapper.querySelector('input[type="hidden"]');
    const trigger = wrapper.querySelector(".cute-custom-trigger");
    const options = wrapper.querySelector(".cute-custom-options");

    if (!hiddenInput || !trigger || !options) return;

    const val = hiddenInput.value;
    const opt = Array.from(options.querySelectorAll("div")).find(
      (d) => d.getAttribute("data-value") == val,
    );

    if (!opt) return;

    // ステータス用だけ特別処理
    const textSpan = trigger.querySelector(".status-trigger-text");

    if (textSpan) {
      textSpan.innerText = opt.innerText;
      trigger.dataset.status = val;
    } else {
      // 他のセレクトは今まで通り
      trigger.innerText = opt.innerText;
    }
  });
};
