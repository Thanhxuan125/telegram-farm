// =========================
// LẤY PHẦN TỬ
// =========================

const plots =
  document.querySelectorAll(".plot");

const seedPanel =
  document.getElementById("seedPanel");

const seedClose =
  document.getElementById("seedClose");

const selectedPlot =
  document.getElementById("selectedPlot");

const seedItems =
  document.querySelectorAll(".seed-item");


// =========================
// Ô ĐẤT ĐANG CHỌN
// =========================

let currentPlot = null;


// =========================
// BẤM VÀO Ô ĐẤT
// =========================

plots.forEach((plot) => {

  plot.addEventListener("click", () => {

    // Nếu ô bị khóa
    if (
      plot.classList.contains("locked")
    ) {

      return;
    }


    // Lưu ô đang chọn
    currentPlot =
      plot.dataset.plot;


    // Hiển thị số ô
    selectedPlot.textContent =
      "Đang chọn ô đất số " +
      currentPlot;


    // Mở bảng hạt
    seedPanel.classList.add("show");


    // Cập nhật trạng thái
    seedPanel.setAttribute(
      "aria-hidden",
      "false"
    );

  });

});


// =========================
// ĐÓNG BẢNG
// =========================

function closeSeedPanel() {

  seedPanel.classList.remove("show");

  seedPanel.setAttribute(
    "aria-hidden",
    "true"
  );

  currentPlot = null;

}


// =========================
// NÚT X
// =========================

seedClose.addEventListener(
  "click",
  closeSeedPanel
);


// =========================
// BẤM RA NGOÀI
// =========================

seedPanel.addEventListener(
  "click",
  (event) => {

    if (
      event.target === seedPanel
    ) {

      closeSeedPanel();

    }

  }
);


// =========================
// CHỌN HẠT
// =========================

seedItems.forEach((item) => {

  item.addEventListener(
    "click",
    () => {

      const seed =
        item.dataset.seed;


      // Hiện thông báo tạm thời
      alert(
        "Bạn đã chọn hạt: " +
        seed +
        "\nÔ đất: " +
        currentPlot
      );


      // Đóng bảng
      closeSeedPanel();

    }
  );

});
