// =========================
// DỮ LIỆU 10 LOẠI CÂY
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
// NGƯỜI CHƠI TEST
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
// MỞ BẢNG HẠT
// =========================

function openSeedPanel(plotNumber) {

  currentPlot =
    plotNumber;

  selectedPlot.textContent =
    "Đang chọn ô đất số " +
    plotNumber;

  seedPanel.classList.add(
    "show"
  );

  seedPanel.setAttribute(
    "aria-hidden",
    "false"
  );

}


// =========================
// BẤM Ô ĐẤT
// =========================

plots.forEach((plot) => {

  plot.addEventListener(
    "click",
    () => {

      // Ô bị khóa
      if (
        plot.classList.contains("locked")
      ) {

        return;

      }


      // Nếu đang có cây
      if (
        plot.dataset.seed
      ) {

        return;

      }


      openSeedPanel(
        plot.dataset.plot
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
// TẠO CÂY TRÊN Ô ĐẤT
// =========================

function plantSeed(
  plot,
  seedId
) {

  const seed =
    seeds[seedId];

  if (!seed) {
    return;
  }


  // Lưu thông tin test
  plot.dataset.seed =
    seedId;

  plot.dataset.plantedAt =
    Date.now();

  plot.dataset.growTime =
    seed.growTime;


  // Xóa nội dung cũ
  plot.innerHTML = "";


  // Tạo vùng cây
  const plant =
    document.createElement(
      "div"
    );

  plant.className =
    "plant";


  // Cây non
  const icon =
    document.createElement(
      "div"
    );

  icon.className =
    "plant-icon";

  icon.textContent =
    "🌱";


  // Tên cây
  const name =
    document.createElement(
      "div"
    );

  name.className =
    "plant-name";

  name.textContent =
    seed.name;


  // Thời gian
  const timer =
    document.createElement(
      "div"
    );

  timer.className =
    "plant-timer";


  // Thanh phát triển
  const progress =
    document.createElement(
      "div"
    );

  progress.className =
    "plant-progress";


  const progressFill =
    document.createElement(
      "div"
    );

  progressFill.className =
    "plant-progress-fill";


  progress.appendChild(
    progressFill
  );


  plant.appendChild(icon);

  plant.appendChild(name);

  plant.appendChild(timer);

  plant.appendChild(progress);


  plot.appendChild(
    plant
  );


  // Bắt đầu cập nhật
  updatePlant(
    plot
  );

}


// =========================
// CẬP NHẬT CÂY
// =========================

function updatePlant(plot) {

  const seedId =
    plot.dataset.seed;

  if (!seedId) {
    return;
  }


  const seed =
    seeds[seedId];

  if (!seed) {
    return;
  }


  const plantedAt =
    Number(
      plot.dataset.plantedAt
    );


  const growTimeMs =
    seed.growTime *
    60 *
    1000;


  const now =
    Date.now();


  const elapsed =
    now - plantedAt;


  const percent =
    Math.min(
      elapsed /
      growTimeMs,
      1
    );


  const remaining =
    Math.max(
      0,
      growTimeMs - elapsed
    );


  const minutes =
    Math.floor(
      remaining / 60000
    );


  const seconds =
    Math.floor(
      (remaining % 60000) /
      1000
    );


  const timer =
    plot.querySelector(
      ".plant-timer"
    );


  const progressFill =
    plot.querySelector(
      ".plant-progress-fill"
    );


  if (!timer || !progressFill) {
    return;
  }


  // Cây đã trưởng thành
  if (percent >= 1) {

    timer.textContent =
      "🌾 Thu hoạch!";

    progressFill.style.width =
      "100%";

    plot.classList.add(
      "ready"
    );

    return;

  }


  // Đang lớn
  timer.textContent =
    minutes +
    ":" +
    String(seconds)
      .padStart(2, "0");


  progressFill.style.width =
    (percent * 100) +
    "%";


  // Tiếp tục cập nhật
  setTimeout(
    () => {

      updatePlant(plot);

    },
    1000
  );

}


// =========================
// THU HOẠCH
// =========================

function harvestPlot(plot) {

  const seedId =
    plot.dataset.seed;

  if (!seedId) {
    return;
  }


  const seed =
    seeds[seedId];


  // Chỉ thu hoạch khi đã lớn
  if (
    !plot.classList.contains(
      "ready"
    )
  ) {

    return;

  }


  // ===================
  // EXP TEST
  // ===================

  const gainedExp =
    Math.floor(
      Math.random() *
      291
    ) + 10;


  player.exp +=
    gainedExp;


  // ===================
  // COIN TEST
  // ===================

  const sellPrices = {

    wheat: 12,
    corn: 25,
    radish: 40,
    carrot: 75,
    beet: 88,
    eggplant: 125,
    chili: 210,
    green_onion: 350,
    cabbage: 750,
    pumpkin: 1250

  };


  player.coins +=
    sellPrices[seedId];


  // ===================
  // THÔNG BÁO
  // ===================

  alert(
    "Thu hoạch " +
    seed.name +
    " thành công!\n\n" +
    "+ " +
    gainedExp +
    " EXP\n" +
    "+ " +
    sellPrices[seedId] +
    " coin"
  );


  // ===================
  // RESET Ô ĐẤT
  // ===================

  delete plot.dataset.seed;

  delete plot.dataset.plantedAt;

  delete plot.dataset.growTime;


  plot.classList.remove(
    "ready"
  );


  plot.innerHTML =
    `<span class="plot-number">
      ${plot.dataset.plot}
    </span>`;


  updateHUD();

}


// =========================
// CHỌN HẠT
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


      // Kiểm tra level
      if (
        player.level <
        seed.level
      ) {

        alert(
          "Cần Lv." +
          seed.level +
          " để trồng " +
          seed.name
        );

        return;

      }


      // Kiểm tra coin
      if (
        player.coins <
        seed.price
      ) {

        alert(
          "Không đủ coin!"
        );

        return;

      }


      const plot =
        document.querySelector(
          `.plot[data-plot="${currentPlot}"]`
        );


      if (!plot) {
        return;
      }


      // Trừ coin TEST
      player.coins -=
        seed.price;


      // Trồng cây
      plantSeed(
        plot,
        seedId
      );


      // Cập nhật HUD
      updateHUD();


      // Đóng bảng
      closeSeedPanel();

    }
  );

});


// =========================
// BẤM CÂY ĐỂ THU HOẠCH
// =========================

plots.forEach((plot) => {

  plot.addEventListener(
    "click",
    () => {

      if (
        plot.classList.contains(
          "ready"
        )
      ) {

        harvestPlot(
          plot
        );

      }

    }
  );

});


// =========================
// KHỞI ĐỘNG
// =========================

updateHUD();
