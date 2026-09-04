// =========================
// DỮ LIỆU 10 LOẠI HẠT
// =========================

const seeds = {

  wheat: {
    name: "Lúa mì",
    price: 10,
    level: 1,
    icon: "🌾",
    growTime: 20,

    // Phân bón giảm 5-8 phút
    fertilizerMin: 5,
    fertilizerMax: 8
  },

  corn: {
    name: "Ngô",
    price: 20,
    level: 3,
    icon: "🌽",
    growTime: 60,

    // 6-10 phút
    fertilizerMin: 6,
    fertilizerMax: 10
  },

  radish: {
    name: "Củ cải",
    price: 35,
    level: 7,
    icon: "🌱",
    growTime: 90,

    // 8-13 phút
    fertilizerMin: 8,
    fertilizerMax: 13
  },

  carrot: {
    name: "Cà rốt",
    price: 50,
    level: 10,
    icon: "🥕",
    growTime: 150,

    // 10-16 phút
    fertilizerMin: 10,
    fertilizerMax: 16
  },

  beet: {
    name: "Củ dền",
    price: 75,
    level: 13,
    icon: "🫜",
    growTime: 280,

    // 12-19 phút
    fertilizerMin: 12,
    fertilizerMax: 19
  },

  eggplant: {
    name: "Cà tím",
    price: 100,
    level: 15,
    icon: "🍆",
    growTime: 450,

    // 14-22 phút
    fertilizerMin: 14,
    fertilizerMax: 22
  },

  chili: {
    name: "Ớt",
    price: 180,
    level: 17,
    icon: "🌶️",
    growTime: 650,

    // 16-25 phút
    fertilizerMin: 16,
    fertilizerMax: 25
  },

  green_onion: {
    name: "Hành lá",
    price: 250,
    level: 20,
    icon: "🌿",
    growTime: 870,

    // 18-27 phút
    fertilizerMin: 18,
    fertilizerMax: 27
  },

  cabbage: {
    name: "Bắp cải",
    price: 500,
    level: 23,
    icon: "🥬",
    growTime: 950,

    // 20-29 phút
    fertilizerMin: 20,
    fertilizerMax: 29
  },

  pumpkin: {
    name: "Bí đỏ",
    price: 1000,
    level: 25,
    icon: "🎃",
    growTime: 1200,

    // 22-30 phút
    fertilizerMin: 22,
    fertilizerMax: 30
  }

};


// =========================
// NGƯỜI CHƠI TEST
// =========================

let player = {

  level: 1,

  exp: 0,

  coins: 1000,

  // Để 3 để TEST
  // Khi test xong đổi lại 0
  fertilizer: 3

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

const levelValue =
  document.getElementById("levelValue");


// =========================
// Ô ĐẤT ĐANG CHỌN
// =========================

let currentPlot = null;


// =========================
// CẬP NHẬT HUD
// =========================

function updateHUD() {

  if (coinValue) {

    coinValue.textContent =
      player.coins;

  }


  if (fertilizerValue) {

    fertilizerValue.textContent =
      player.fertilizer;

  }


  if (expText) {

    expText.textContent =
      player.exp +
      " / 7000 EXP";

  }


  if (expFill) {

    const percent =
      (player.exp / 7000) * 100;

    expFill.style.width =
      Math.min(percent, 100) + "%";

  }


  if (levelValue) {

    levelValue.textContent =
      "Lv." + player.level;

  }

}


// =========================
// MỞ BẢNG HẠT
// =========================

function openSeedPanel(plotNumber) {

  currentPlot =
    plotNumber;

  if (selectedPlot) {

    selectedPlot.textContent =
      "Đang chọn ô đất số " +
      plotNumber;

  }


  seedPanel.classList.add(
    "show"
  );

  seedPanel.setAttribute(
    "aria-hidden",
    "false"
  );

}


// =========================
// ĐÓNG BẢNG HẠT
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
// BẤM Ô ĐẤT
// =========================

plots.forEach((plot) => {

  plot.addEventListener(
    "click",
    () => {

      // ---------------------
      // Ô bị khóa
      // ---------------------

      if (
        plot.classList.contains(
          "locked"
        )
      ) {

        return;

      }


      // ---------------------
      // Đang có cây
      // ---------------------

      if (
        plot.dataset.seed
      ) {

        // Cây trưởng thành
        if (
          plot.classList.contains(
            "ready"
          )
        ) {

          harvestPlot(plot);

          return;

        }


        // Cây đang lớn
        showFertilizerButton(
          plot
        );

        return;

      }


      // ---------------------
      // Ô đất trống
      // ---------------------

      openSeedPanel(
        plot.dataset.plot
      );

    }
  );

});


// =========================
// NÚT X
// =========================

if (seedClose) {

  seedClose.addEventListener(
    "click",
    closeSeedPanel
  );

}


// =========================
// BẤM RA NGOÀI BẢNG
// =========================

if (seedPanel) {

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

}


// =========================
// RANDOM SỐ PHÚT
// =========================

function randomMinutes(
  min,
  max
) {

  return Math.floor(
    Math.random() *
    (max - min + 1)
  ) + min;

}


// =========================
// HIỆN NÚT PHÂN BÓN
// =========================

function showFertilizerButton(
  plot
) {

  // Nếu đã có nút
  if (
    plot.querySelector(
      ".fertilizer-button"
    )
  ) {

    return;

  }


  // Đã dùng phân bón
  if (
    plot.dataset.fertilizerUsed ===
    "true"
  ) {

    alert(
      "Vụ này đã dùng phân bón rồi."
    );

    return;

  }


  // Không còn phân
  if (
    player.fertilizer <= 0
  ) {

    alert(
      "Bạn không có phân bón."
    );

    return;

  }


  // Lấy hạt
  const seedId =
    plot.dataset.seed;

  const seed =
    seeds[seedId];


  if (!seed) {

    return;

  }


  // ---------------------
  // Tạo nút
  // ---------------------

  const button =
    document.createElement(
      "button"
    );


  button.className =
    "fertilizer-button";


  button.type =
    "button";


  button.textContent =
    "🧪 Dùng phân";


  // Không cho click lan
  button.addEventListener(
    "click",
    (event) => {

      event.stopPropagation();

      useFertilizer(plot);

    }
  );


  plot.appendChild(
    button
  );

}


// =========================
// DÙNG PHÂN BÓN
// =========================

function useFertilizer(
  plot
) {

  // Không có cây
  if (
    !plot.dataset.seed
  ) {

    return;

  }


  // Đã dùng rồi
  if (
    plot.dataset.fertilizerUsed ===
    "true"
  ) {

    alert(
      "Vụ này đã dùng phân bón rồi."
    );

    return;

  }


  // Hết phân
  if (
    player.fertilizer <= 0
  ) {

    alert(
      "Bạn không có phân bón."
    );

    return;

  }


  const seedId =
    plot.dataset.seed;

  const seed =
    seeds[seedId];


  if (!seed) {

    return;

  }


  // ---------------------
  // RANDOM PHÚT GIẢM
  // ---------------------

  const reducedMinutes =
    randomMinutes(
      seed.fertilizerMin,
      seed.fertilizerMax
    );


  // ---------------------
  // Đổi sang mili-giây
  // ---------------------

  const reduceMs =
    reducedMinutes *
    60 *
    1000;


  // ---------------------
  // Lấy thời gian trồng
  // ---------------------

  const plantedAt =
    Number(
      plot.dataset.plantedAt
    );


  // ---------------------
  // Đẩy thời gian trồng
  // về quá khứ
  // ---------------------

  plot.dataset.plantedAt =
    plantedAt - reduceMs;


  // ---------------------
  // Đánh dấu đã dùng
  // ---------------------

  plot.dataset.fertilizerUsed =
    "true";


  // ---------------------
  // Trừ 1 phân
  // ---------------------

  player.fertilizer -= 1;


  // ---------------------
  // Xóa nút
  // ---------------------

  const button =
    plot.querySelector(
      ".fertilizer-button"
    );


  if (button) {

    button.remove();

  }


  // ---------------------
  // HUD
  // ---------------------

  updateHUD();


  // ---------------------
  // Cập nhật cây
  // ---------------------

  updatePlant(
    plot
  );


  // ---------------------
  // Thông báo
  // ---------------------

  alert(
    "🧪 Đã bón phân!\n\n" +
    seed.name +
    "\n" +
    "Giảm ngẫu nhiên: " +
    reducedMinutes +
    " phút"
  );

}


// =========================
// TRỒNG CÂY
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


  // ---------------------
  // Lưu dữ liệu
  // ---------------------

  plot.dataset.seed =
    seedId;


  plot.dataset.plantedAt =
    Date.now();


  plot.dataset.growTime =
    seed.growTime;


  plot.dataset.fertilizerUsed =
    "false";


  // ---------------------
  // Xóa nội dung cũ
  // ---------------------

  plot.innerHTML =
    "";


  // ---------------------
  // Tạo cây
  // ---------------------

  const plant =
    document.createElement(
      "div"
    );

  plant.className =
    "plant";


  // ---------------------
  // Icon
  // ---------------------

  const icon =
    document.createElement(
      "div"
    );

  icon.className =
    "plant-icon";

  icon.textContent =
    "🌱";


  // ---------------------
  // Tên
  // ---------------------

  const name =
    document.createElement(
      "div"
    );

  name.className =
    "plant-name";

  name.textContent =
    seed.name;


  // ---------------------
  // Timer
  // ---------------------

  const timer =
    document.createElement(
      "div"
    );

  timer.className =
    "plant-timer";


  // ---------------------
  // Thanh tiến độ
  // ---------------------

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


  // ---------------------
  // Ghép cây
  // ---------------------

  plant.appendChild(
    icon
  );

  plant.appendChild(
    name
  );

  plant.appendChild(
    timer
  );

  plant.appendChild(
    progress
  );


  plot.appendChild(
    plant
  );


  // ---------------------
  // Bắt đầu timer
  // ---------------------

  updatePlant(
    plot
  );

}


// =========================
// CẬP NHẬT CÂY
// =========================

function updatePlant(
  plot
) {

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


  const elapsed =
    Date.now() -
    plantedAt;


  const percent =
    Math.min(
      elapsed /
      growTimeMs,
      1
    );


  const remaining =
    Math.max(
      0,
      growTimeMs -
      elapsed
    );


  const minutes =
    Math.floor(
      remaining /
      60000
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


  const icon =
    plot.querySelector(
      ".plant-icon"
    );


  if (
    !timer ||
    !progressFill
  ) {

    return;

  }


  // ---------------------
  // ĐÃ TRƯỞNG THÀNH
  // ---------------------

  if (
    percent >= 1
  ) {

    timer.textContent =
      "🌾 Thu hoạch";


    progressFill.style.width =
      "100%";


    plot.classList.add(
      "ready"
    );


    if (icon) {

      icon.textContent =
        seed.icon;

    }


    return;

  }


  // ---------------------
  // ĐANG LỚN
  // ---------------------

  timer.textContent =
    minutes +
    ":" +
    String(seconds)
      .padStart(2, "0");


  progressFill.style.width =
    (percent * 100) +
    "%";


  // ---------------------
  // Tiếp tục timer
  // ---------------------

  setTimeout(
    () => {

      updatePlant(
        plot
      );

    },
    1000
  );

}


// =========================
// THU HOẠCH
// =========================

function harvestPlot(
  plot
) {

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


  // Chưa chín
  if (
    !plot.classList.contains(
      "ready"
    )
  ) {

    return;

  }


  // ---------------------
  // RANDOM EXP
  // 10-300
  // ---------------------

  const gainedExp =
    randomMinutes(
      10,
      300
    );


  player.exp +=
    gainedExp;


  // ---------------------
  // GIÁ BÁN
  // ---------------------

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


  const earnedCoins =
    sellPrices[seedId];


  player.coins +=
    earnedCoins;


  // ---------------------
  // THÔNG BÁO
  // ---------------------

  alert(
    "🌾 Thu hoạch thành công!\n\n" +
    seed.name +
    "\n\n" +
    "+ " +
    gainedExp +
    " EXP\n" +
    "+ " +
    earnedCoins +
    " coin"
  );


  // ---------------------
  // XÓA DỮ LIỆU CÂY
  // ---------------------

  delete plot.dataset.seed;

  delete plot.dataset.plantedAt;

  delete plot.dataset.growTime;

  delete plot.dataset.fertilizerUsed;


  plot.classList.remove(
    "ready"
  );


  // ---------------------
  // Trả ô đất về ban đầu
  // ---------------------

  plot.innerHTML =
    `<span class="plot-number">
      ${plot.dataset.plot}
    </span>`;


  // ---------------------
  // HUD
  // ---------------------

  updateHUD();

}


// =========================
// CHỌN HẠT
// =========================

seedItems.forEach(
  (item) => {

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


        // ---------------------
        // Kiểm tra level
        // ---------------------

        if (
          player.level <
          seed.level
        ) {

          alert(
            "🔒 Cần Lv." +
            seed.level +
            " để trồng " +
            seed.name
          );

          return;

        }


        // ---------------------
        // Kiểm tra coin
        // ---------------------

        if (
          player.coins <
          seed.price
        ) {

          alert(
            "🪙 Không đủ coin!"
          );

          return;

        }


        // ---------------------
        // Lấy ô
        // ---------------------

        const plot =
          document.querySelector(
            `.plot[data-plot="${currentPlot}"]`
          );


        if (!plot) {

          return;

        }


        // ---------------------
        // Trừ tiền
        // ---------------------

        player.coins -=
          seed.price;


        // ---------------------
        // Trồng
        // ---------------------

        plantSeed(
          plot,
          seedId
        );


        // ---------------------
        // HUD
        // ---------------------

        updateHUD();


        // ---------------------
        // Đóng bảng
        // ---------------------

        closeSeedPanel();

      }
    );

  }
);


// =========================
// KHỞI ĐỘNG
// =========================

updateHUD();
