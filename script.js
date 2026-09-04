// =========================
// DỮ LIỆU HẠT GIỐNG
// =========================

const seeds = {

  wheat: {
    name: "Lúa mì",
    price: 10,
    level: 1,
    icon: "🌾",
    growTime: 20
  },

  corn: {
    name: "Ngô",
    price: 20,
    level: 3,
    icon: "🌽",
    growTime: 60
  },

  radish: {
    name: "Củ cải",
    price: 35,
    level: 7,
    icon: "🌱",
    growTime: 90
  },

  carrot: {
    name: "Cà rốt",
    price: 50,
    level: 10,
    icon: "🥕",
    growTime: 150
  },

  beet: {
    name: "Củ dền",
    price: 75,
    level: 13,
    icon: "🫜",
    growTime: 280
  },

  eggplant: {
    name: "Cà tím",
    price: 100,
    level: 15,
    icon: "🍆",
    growTime: 450
  },

  chili: {
    name: "Ớt",
    price: 180,
    level: 17,
    icon: "🌶️",
    growTime: 650
  },

  green_onion: {
    name: "Hành lá",
    price: 250,
    level: 20,
    icon: "🌿",
    growTime: 870
  },

  cabbage: {
    name: "Bắp cải",
    price: 500,
    level: 23,
    icon: "🥬",
    growTime: 950
  },

  pumpkin: {
    name: "Bí đỏ",
    price: 1000,
    level: 25,
    icon: "🎃",
    growTime: 1200
  }

};


// =========================
// NGƯỜI CHƠI TẠM THỜI
// =========================

let player = {

  level: 1,

  exp: 0,

  coins: 1000,

  fertilizer: 0

};


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

const coinValue =
  document.getElementById("coinValue");

const fertilizerValue =
  document.getElementById("fertilizerValue");

const expFill =
  document.getElementById("expFill");

const expText =
  document.getElementById("expText");


// =========================
// Ô ĐẤT ĐANG CHỌN
// =========================

let currentPlot = null;


// =========================
// CẬP NHẬT HUD
// =========================

function updateHUD() {

  coinValue.textContent =
    player.coins;

  fertilizerValue.textContent =
    player.fertilizer;

  expText.textContent =
    player.exp +
    " / 7000 EXP";

  const percent =
    (player.exp / 7000) * 100;

  expFill.style.width =
    Math.min(percent, 100) + "%";

}


// =========================
// BẤM Ô ĐẤT
// =========================

plots.forEach((plot) => {

  plot.addEventListener(
    "click",
    () => {

      // Ô khóa
      if (
        plot.classList.contains("locked")
      ) {

        return;

      }


      // Nếu đã có cây
      if (
        plot.dataset.seed
      ) {

        return;

      }


      currentPlot =
        plot.dataset.plot;


      selectedPlot.textContent =
        "Đang chọn ô đất số " +
        currentPlot;


      seedPanel.classList.add(
        "show"
      );


      seedPanel.setAttribute(
        "aria-hidden",
        "false"
      );

    }
  );

});


// =========================
// ĐÓNG BẢNG
// =========================

function closeSeedPanel() {

  seedPanel.classList.remove(
    "show"
  );

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
// GIEO HẠT
// =========================

seedItems.forEach((item) => {

  item.addEventListener(
    "click",
    () => {

      if (!currentPlot) {
        return;
      }


      const seedId =
        item.dataset.seed;


      const seed =
        seeds[seedId];


      if (!seed) {
        return;
      }


      // ===================
      // KIỂM TRA LEVEL
      // ===================

      if (
        player.level <
        seed.level
      ) {

        alert(
          "Bạn cần đạt Lv." +
          seed.level +
          " để mở khóa " +
          seed.name
        );

        return;

      }


      // ===================
      // KIỂM TRA COIN
      // ===================

      if (
        player.coins <
        seed.price
      ) {

        alert(
          "Không đủ coin!"
        );

        return;

      }


      // ===================
      // TÌM Ô ĐẤT
      // ===================

      const plot =
        document.querySelector(
          `.plot[data-plot="${currentPlot}"]`
        );


      if (!plot) {
        return;
      }


      // ===================
      // TRỪ COIN
      // ===================

      player.coins -=
        seed.price;


      // ===================
      // LƯU HẠT
      // ===================

      plot.dataset.seed =
        seedId;


      // ===================
      // XÓA SỐ Ô
      // ===================

      plot.innerHTML = "";


      // ===================
      // TẠO CÂY
      // ===================

      const planted =
        document.createElement(
          "span"
        );


      planted.className =
        "planted-seed";


      planted.textContent =
        seed.icon;


      plot.appendChild(
        planted
      );


      // ===================
      // CẬP NHẬT HUD
      // ===================

      updateHUD();


      // ===================
      // ĐÓNG BẢNG
      // ===================

      closeSeedPanel();

    }
  );

});


// =========================
// KHỞI ĐỘNG
// =========================

updateHUD();
