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


      // Không có ô đất thì dừng
      if (!currentPlot) {
        return;
      }


      // Tìm đúng ô đất
      const plot =
        document.querySelector(
          `.plot[data-plot="${currentPlot}"]`
        );


      // Không tìm thấy ô đất thì dừng
      if (!plot) {
        return;
      }


      // Xóa nội dung cũ
      plot.innerHTML = "";


      // Tạo hình hạt
      const seedElement =
        document.createElement("span");

      seedElement.className =
        "planted-seed";


      // Chọn hình theo loại hạt
      const seedIcons = {

        wheat: "🌾",
        corn: "🌽",
        radish: "🌱",
        carrot: "🥕",
        beet: "🫜",
        eggplant: "🍆",
        chili: "🌶️",
        green_onion: "🌿",
        cabbage: "🥬",
        pumpkin: "🎃"

      };


      seedElement.textContent =
        seedIcons[seed] || "🌱";


      // Đưa hạt vào ô đất
      plot.appendChild(
        seedElement
      );


      // Đóng bảng
      closeSeedPanel();

    }
  );

});
