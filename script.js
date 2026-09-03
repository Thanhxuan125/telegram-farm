// =========================
// LẤY CÁC PHẦN TỬ
// =========================

const plots = document.querySelectorAll(".plot");

const seedPanel = document.getElementById("seedPanel");

const seedClose = document.getElementById("seedClose");


// =========================
// BẤM VÀO Ô ĐẤT
// =========================

plots.forEach((plot) => {

  plot.addEventListener("click", () => {

    // Ô bị khóa thì không làm gì
    if (plot.classList.contains("locked")) {
      return;
    }

    // Hiện bảng hạt giống
    seedPanel.classList.add("show");

  });

});


// =========================
// ĐÓNG BẢNG
// =========================

seedClose.addEventListener("click", () => {

  seedPanel.classList.remove("show");

});


// =========================
// BẤM RA NGOÀI BẢNG
// =========================

seedPanel.addEventListener("click", (event) => {

  if (event.target === seedPanel) {

    seedPanel.classList.remove("show");

  }

});
