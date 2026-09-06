/* ==================================================
   NÔNG TRẠI XANH
   GAME LOGIC
   SHOP + KHO NÔNG SẢN
================================================== */


/* ==================================================
   HẠT GIỐNG
================================================== */

const seeds = {

  wheat: {
    name: "Lúa mì",
    price: 10,
    level: 1,
    icon: "🌾",
    growTime: 20,
    fertilizerMin: 5,
    fertilizerMax: 8
  },

  corn: {
    name: "Ngô",
    price: 20,
    level: 3,
    icon: "🌽",
    growTime: 60,
    fertilizerMin: 6,
    fertilizerMax: 10
  },

  radish: {
    name: "Củ cải",
    price: 35,
    level: 7,
    icon: "🌱",
    growTime: 90,
    fertilizerMin: 8,
    fertilizerMax: 13
  },

  carrot: {
    name: "Cà rốt",
    price: 50,
    level: 10,
    icon: "🥕",
    growTime: 150,
    fertilizerMin: 10,
    fertilizerMax: 16
  },

  beet: {
    name: "Củ dền",
    price: 75,
    level: 13,
    icon: "🫜",
    growTime: 280,
    fertilizerMin: 12,
    fertilizerMax: 19
  },

  eggplant: {
    name: "Cà tím",
    price: 100,
    level: 15,
    icon: "🍆",
    growTime: 450,
    fertilizerMin: 14,
    fertilizerMax: 22
  },

  chili: {
    name: "Ớt",
    price: 180,
    level: 17,
    icon: "🌶️",
    growTime: 650,
    fertilizerMin: 16,
    fertilizerMax: 25
  },

  green_onion: {
    name: "Hành lá",
    price: 250,
    level: 20,
    icon: "🌿",
    growTime: 870,
    fertilizerMin: 18,
    fertilizerMax: 27
  },

  cabbage: {
    name: "Bắp cải",
    price: 500,
    level: 23,
    icon: "🥬",
    growTime: 950,
    fertilizerMin: 20,
    fertilizerMax: 29
  },

  pumpkin: {
    name: "Bí đỏ",
    price: 1000,
    level: 25,
    icon: "🎃",
    growTime: 1200,
    fertilizerMin: 22,
    fertilizerMax: 30
  }

};


/* ==================================================
   GIÁ BÁN NÔNG SẢN
================================================== */

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


/* ==================================================
   SAVE KEY
================================================== */

const SAVE_KEY = "telegram_farm_save_v3";


/* ==================================================
   KHO MẶC ĐỊNH
================================================== */

function createEmptyInventory() {

  return {
    wheat: 0,
    corn: 0,
    radish: 0,
    carrot: 0,
    beet: 0,
    eggplant: 0,
    chili: 0,
    green_onion: 0,
    cabbage: 0,
    pumpkin: 0
  };

}


/* ==================================================
   PLAYER
================================================== */

let player = {

  level: 1,

  exp: 0,

  coins: 1000,

  fertilizer: 3,

  unlockedPlots: 3,

  inventory: createEmptyInventory()

};


/* ==================================================
   ELEMENT
================================================== */

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

const levelNumber =
  document.getElementById("levelNumber");

const shopMenu =
  document.getElementById("shopMenu");

const shopPanel =
  document.getElementById("shopPanel");


let currentPlot = null;


/* ==================================================
   RANDOM
================================================== */

function randomNumber(min, max) {

  return Math.floor(
    Math.random() * (max - min + 1)
  ) + min;

}


/* ==================================================
   GIÁ MỞ ĐẤT
================================================== */

function getPlotUnlockPrice(plotNumber) {

  if (plotNumber <= 3) {
    return 0;
  }

  return (
    500 *
    Math.pow(2, plotNumber - 4)
  );

}


/* ==================================================
   KIỂM TRA Ô ĐẤT
================================================== */

function isPlotUnlocked(plotNumber) {

  return (
    Number(plotNumber) <=
    Number(player.unlockedPlots)
  );

}


/* ==================================================
   CẬP NHẬT 20 Ô ĐẤT
================================================== */

function updatePlotsLockState() {

  plots.forEach(plot => {

    const plotNumber =
      Number(plot.dataset.plot);

    if (isPlotUnlocked(plotNumber)) {

      plot.classList.remove("locked");

      if (!plot.dataset.seed) {

        plot.innerHTML = `
          <span class="plot-number">
            ${plotNumber}
          </span>
        `;

      }

    }

    else {

      plot.classList.add("locked");

      if (!plot.dataset.seed) {

        const price =
          getPlotUnlockPrice(plotNumber);

        plot.innerHTML = `
          <span class="plot-number">
            ${plotNumber}
          </span>

          <span class="lock">
            🔒
          </span>

          <span class="plot-price">
            ${price.toLocaleString("vi-VN")} 🪙
          </span>
        `;

      }

    }

  });

}


/* ==================================================
   MỞ KHÓA Ô ĐẤT
================================================== */

function unlockPlot(plotNumber) {

  plotNumber = Number(plotNumber);

  if (isPlotUnlocked(plotNumber)) {
    return;
  }

  if (
    plotNumber !==
    Number(player.unlockedPlots) + 1
  ) {

    alert(
      "🔒 Bạn phải mở ô đất " +
      (Number(player.unlockedPlots) + 1) +
      " trước."
    );

    return;

  }

  const price =
    getPlotUnlockPrice(plotNumber);

  if (player.coins < price) {

    alert(
      "❌ Không đủ xu!\n\n" +
      "Cần: " +
      price.toLocaleString("vi-VN") +
      " xu\n" +
      "Bạn có: " +
      player.coins.toLocaleString("vi-VN") +
      " xu"
    );

    return;

  }

  const confirmed =
    confirm(
      "🔓 Mở khóa ô đất " +
      plotNumber +
      "?\n\n" +
      "Giá: " +
      price.toLocaleString("vi-VN") +
      " xu"
    );

  if (!confirmed) {
    return;
  }

  player.coins -= price;

  player.unlockedPlots = plotNumber;

  updatePlotsLockState();

  updateHUD();

  saveGame();

  alert(
    "🎉 Đã mở khóa ô đất " +
    plotNumber +
    "!"
  );

}


/* ==================================================
   HUD
================================================== */

function updateHUD() {

  if (coinValue) {

    coinValue.textContent =
      player.coins.toLocaleString("vi-VN");

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

  if (levelNumber) {

    levelNumber.textContent =
      player.level;

  }

}


/* ==================================================
   SAVE GAME
================================================== */

function saveGame() {

  if (
    !player.inventory ||
    typeof player.inventory !== "object"
  ) {

    player.inventory =
      createEmptyInventory();

  }

  const data = {

    player: player,

    plots: Array.from(plots).map(plot => ({

      number: plot.dataset.plot,

      seed:
        plot.dataset.seed || null,

      plantedAt:
        plot.dataset.plantedAt || null,

      fertilizerUsed:
        plot.dataset.fertilizerUsed === "true"

    }))

  };

  localStorage.setItem(
    SAVE_KEY,
    JSON.stringify(data)
  );

}


/* ==================================================
   LOAD GAME
================================================== */

function loadGame() {

  const saved =
    localStorage.getItem(SAVE_KEY);

  if (!saved) {

    player.inventory =
      createEmptyInventory();

    updatePlotsLockState();

    return;

  }

  try {

    const data =
      JSON.parse(saved);

    if (data.player) {

      player = {
        ...player,
        ...data.player
      };

    }

    if (
      !player.inventory ||
      typeof player.inventory !== "object"
    ) {

      player.inventory =
        createEmptyInventory();

    }

    const emptyInventory =
      createEmptyInventory();

    Object.keys(emptyInventory).forEach(key => {

      if (
        typeof player.inventory[key] !== "number"
      ) {

        player.inventory[key] = 0;

      }

    });

    if (Array.isArray(data.plots)) {

      data.plots.forEach(savedPlot => {

        const plot =
          document.querySelector(
            `.plot[data-plot="${savedPlot.number}"]`
          );

        if (!plot) {
          return;
        }

        if (savedPlot.seed) {

          plot.dataset.seed =
            savedPlot.seed;

          plot.dataset.plantedAt =
            savedPlot.plantedAt || Date.now();

          plot.dataset.fertilizerUsed =
            savedPlot.fertilizerUsed
              ? "true"
              : "false";

          updatePlant(plot);

        }

      });

    }

    updatePlotsLockState();

    updateHUD();

  }

  catch (error) {

    console.error(
      "Lỗi tải dữ liệu game:",
      error
    );

    player = {

      level: 1,
      exp: 0,
      coins: 1000,
      fertilizer: 3,
      unlockedPlots: 3,
      inventory: createEmptyInventory()

    };

    updatePlotsLockState();

    updateHUD();

  }

}


/* ==================================================
   MỞ BẢNG HẠT GIỐNG
================================================== */

function openSeedPanel(plotNumber) {

  if (!seedPanel) {
    return;
  }

  currentPlot =
    Number(plotNumber);

  if (selectedPlot) {

    selectedPlot.textContent =
      currentPlot;

  }

  seedPanel.classList.add("show");

  seedPanel.setAttribute(
    "aria-hidden",
    "false"
  );

}


/* ==================================================
   ĐÓNG BẢNG HẠT
================================================== */

function closeSeedPanel() {

  if (!seedPanel) {
    return;
  }

  seedPanel.classList.remove("show");

  seedPanel.setAttribute(
    "aria-hidden",
    "true"
  );

  currentPlot = null;

}


/* ==================================================
   TRỒNG CÂY
================================================== */

function plantSeed(plot, seedId) {

  const seed =
    seeds[seedId];

  if (!seed) {
    return;
  }

  plot.dataset.seed =
    seedId;

  plot.dataset.plantedAt =
    Date.now();

  plot.dataset.fertilizerUsed =
    "false";

  plot.classList.remove("ready");

  updatePlant(plot);

  saveGame();

}


/* ==================================================
   CẬP NHẬT CÂY
================================================== */

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
    Number(plot.dataset.plantedAt);

  const growTime =
    seed.growTime * 1000;

  const elapsed =
    Date.now() - plantedAt;

  const progress =
    Math.min(
      elapsed / growTime,
      1
    );

  if (progress >= 1) {

    plot.classList.add("ready");

    plot.innerHTML = `
      <span class="plot-number">
        ${plot.dataset.plot}
      </span>

      <span class="crop ready-crop">
        ${seed.icon}
      </span>

      <span class="ready-text">
        Thu hoạch
      </span>
    `;

    return;

  }

  plot.classList.remove("ready");

  const remaining =
    Math.max(
      0,
      growTime - elapsed
    );

  const seconds =
    Math.ceil(
      remaining / 1000
    );

  const minutes =
    Math.floor(seconds / 60);

  const secs =
    seconds % 60;

  let timeText;

  if (minutes > 0) {

    timeText =
      minutes + "m " +
      secs + "s";

  }

  else {

    timeText =
      secs + "s";

  }

  plot.innerHTML = `
    <span class="plot-number">
      ${plot.dataset.plot}
    </span>

    <span class="crop">
      ${seed.icon}
    </span>

    <span class="grow-time">
      ${timeText}
    </span>
  `;

}


/* ==================================================
   CẬP NHẬT TOÀN BỘ CÂY
================================================== */

function updateAllPlants() {

  plots.forEach(plot => {

    if (plot.dataset.seed) {

      updatePlant(plot);

    }

  });

}


/* ==================================================
   TỰ ĐỘNG CẬP NHẬT THỜI GIAN CÂY
================================================== */

setInterval(() => {

  updateAllPlants();

}, 1000);


/* ==================================================
   NÚT BÓN PHÂN
================================================== */

function showFertilizerButton(plot) {

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

  if (
    plot.dataset.fertilizerUsed ===
    "true"
  ) {

    return;

  }

  if (
    plot.querySelector(
      ".fertilizer-button"
    )
  ) {

    return;

  }

  const button =
    document.createElement("button");

  button.type =
    "button";

  button.className =
    "fertilizer-button";

  button.textContent =
    "🧪 Bón phân";

  button.addEventListener(
    "click",
    event => {

      event.stopPropagation();

      useFertilizer(plot);

    }
  );

  plot.appendChild(button);

}


/* ==================================================
   BÓN PHÂN
================================================== */

function useFertilizer(plot) {

  const seedId =
    plot.dataset.seed;

  const seed =
    seeds[seedId];

  if (!seed) {
    return;
  }

  if (
    plot.dataset.fertilizerUsed ===
    "true"
  ) {

    alert(
      "🌱 Cây này đã được bón phân."
    );

    return;

  }

  if (player.fertilizer <= 0) {

    alert(
      "❌ Bạn không còn phân bón."
    );

    return;

  }

  const reducedMinutes =
    randomNumber(
      seed.fertilizerMin,
      seed.fertilizerMax
    );

  const plantedAt =
    Number(plot.dataset.plantedAt);

  plot.dataset.plantedAt =
    plantedAt -
    (
      reducedMinutes *
      60 *
      1000
    );

  plot.dataset.fertilizerUsed =
    "true";

  player.fertilizer--;

  const button =
    plot.querySelector(
      ".fertilizer-button"
    );

  if (button) {
    button.remove();
  }

  updateHUD();

  updatePlant(plot);

  saveGame();

  alert(
    "🧪 Đã bón phân!\n\n" +
    seed.name +
    "\n" +
    "Giảm " +
    reducedMinutes +
    " phút."
  );

}


/* ==================================================
   THÊM NÔNG SẢN VÀO KHO
================================================== */

function addToInventory(
  seedId,
  amount = 1
) {

  if (!player.inventory) {

    player.inventory =
      createEmptyInventory();

  }

  if (
    typeof player.inventory[seedId] !==
    "number"
  ) {

    player.inventory[seedId] = 0;

  }

  player.inventory[seedId] +=
    amount;

}


/* ==================================================
   LẤY SỐ LƯỢNG TRONG KHO
================================================== */

function getInventoryAmount(seedId) {

  if (!player.inventory) {
    return 0;
  }

  return Number(
    player.inventory[seedId] || 0
  );

}


/* ==================================================
   THU HOẠCH
================================================== */

function harvestPlot(plot) {

  const seedId =
    plot.dataset.seed;

  const seed =
    seeds[seedId];

  if (!seed) {
    return;
  }

  if (
    !plot.classList.contains("ready")
  ) {

    return;

  }

  const gainedExp =
    randomNumber(10, 300);

  addToInventory(
    seedId,
    1
  );

  player.exp +=
    gainedExp;

  while (
    player.exp >= 7000
  ) {

    player.exp -=
      7000;

    player.level++;

  }

  delete plot.dataset.seed;

  delete plot.dataset.plantedAt;

  delete plot.dataset.fertilizerUsed;

  plot.classList.remove("ready");

  plot.innerHTML = `
    <span class="plot-number">
      ${plot.dataset.plot}
    </span>
  `;

  updateHUD();

  saveGame();

  const currentAmount =
    getInventoryAmount(seedId);

  alert(
    "🌾 Thu hoạch thành công!\n\n" +
    seed.name +
    "\n\n+" +
    gainedExp +
    " EXP\n" +
    "🎒 Kho: " +
    currentAmount
  );

}


/* ==================================================
   BÁN 1 NÔNG SẢN
================================================== */

function sellCrop(
  seedId,
  amount = 1
) {

  const seed =
    seeds[seedId];

  if (!seed) {
    return;
  }

  amount =
    Math.floor(
      Number(amount)
    );

  if (amount <= 0) {
    return;
  }

  const owned =
    getInventoryAmount(seedId);

  if (owned < amount) {

    alert(
      "❌ Không đủ " +
      seed.name +
      " trong kho."
    );

    return;

  }

  const price =
    sellPrices[seedId];

  const total =
    price * amount;

  player.inventory[seedId] -=
    amount;

  player.coins +=
    total;

  updateHUD();

  saveGame();

  alert(
    "🏪 Bán thành công!\n\n" +
    seed.icon +
    " " +
    seed.name +
    "\nSố lượng: " +
    amount +
    "\nNhận: +" +
    total.toLocaleString("vi-VN") +
    " 🪙"
  );

  if (
    typeof renderShop ===
    "function"
  ) {

    renderShop();

  }

}


/* ==================================================
   BÁN TOÀN BỘ 1 LOẠI
================================================== */

function sellAllCrop(seedId) {

  const amount =
    getInventoryAmount(seedId);

  if (amount <= 0) {

    alert(
      "🎒 Kho đang không có " +
      seeds[seedId].name
    );

    return;

  }

  sellCrop(
    seedId,
    amount
  );

}


/* ==================================================
   TỔNG GIÁ TRỊ KHO
================================================== */

function getInventoryTotalValue() {

  let total = 0;

  Object.keys(seeds).forEach(seedId => {

    const amount =
      getInventoryAmount(seedId);

    const price =
      sellPrices[seedId];

    total +=
      amount * price;

  });

  return total;

}


/* ==================================================
   MỞ SHOP
================================================== */

if (shopMenu) {

  shopMenu.addEventListener(
    "click",
    event => {

      event.preventDefault();
      event.stopPropagation();

      const panel =
        document.getElementById(
          "shopPanel"
        );

      if (!panel) {

        alert(
          "🏪 SHOP\n\n" +
          "🎒 Giá trị kho hiện tại: " +
          getInventoryTotalValue()
            .toLocaleString("vi-VN") +
          " 🪙"
        );

        return;

      }

      panel.classList.add("show");

      panel.setAttribute(
        "aria-hidden",
        "false"
      );

      if (
        typeof renderShop ===
        "function"
      ) {

        renderShop();

      }

    }
  );

}


/* ==================================================
   ĐÓNG SHOP
================================================== */

function closeShop() {

  const panel =
    document.getElementById(
      "shopPanel"
    );

  if (!panel) {
    return;
  }

  panel.classList.remove("show");

  panel.setAttribute(
    "aria-hidden",
    "true"
  );

}


/*
   Dùng event delegation.

   Không cần khai báo:
   const shopClose = ...

   Vì Shop có thể được render lại
   bằng JavaScript.
*/

document.addEventListener(
  "click",
  event => {

    const closeButton =
      event.target.closest(
        "#shopClose"
      );

    if (closeButton) {

      event.preventDefault();

      event.stopPropagation();

      closeShop();

      return;

    }

    /*
       Bấm vùng nền bên ngoài
       cũng đóng Shop.
    */

    const panel =
      document.getElementById(
        "shopPanel"
      );

    if (
      panel &&
      event.target === panel
    ) {

      closeShop();

    }

  }
);


/* ==================================================
   BẤM Ô ĐẤT
================================================== */

plots.forEach(plot => {

  plot.addEventListener(
    "click",
    () => {

      const plotNumber =
        Number(plot.dataset.plot);

      /* ==========================
         Ô KHÓA
      ========================== */

      if (
        plot.classList.contains("locked")
      ) {

        unlockPlot(plotNumber);

        return;

      }

      /* ==========================
         CÓ CÂY
      ========================== */

      if (plot.dataset.seed) {

        if (
          plot.classList.contains("ready")
        ) {

          harvestPlot(plot);

        }

        else {

          showFertilizerButton(plot);

        }

        return;

      }

      /* ==========================
         ĐẤT TRỐNG
      ========================== */

      openSeedPanel(plotNumber);

    }
  );

});


/* ==================================================
   ĐÓNG BẢNG HẠT
================================================== */

if (seedClose) {

  seedClose.addEventListener(
    "click",
    closeSeedPanel
  );

}


if (seedPanel) {

  seedPanel.addEventListener(
    "click",
    event => {

      if (
        event.target ===
        seedPanel
      ) {

        closeSeedPanel();

      }

    }
  );

}


/* ==================================================
   CHỌN HẠT
================================================== */

seedItems.forEach(item => {

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

      if (
        player.coins <
        seed.price
      ) {

        alert(
          "🪙 Không đủ coin."
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

      player.coins -=
        seed.price;

      plantSeed(
        plot,
        seedId
      );

      updateHUD();

      closeSeedPanel();

    }
  );

});


/* ==================================================
   MENU HẠT GIỐNG
================================================== */

const seedMenu =
  document.getElementById(
    "seedMenu"
  );

if (seedMenu) {

  seedMenu.addEventListener(
    "click",
    () => {

      if (currentPlot) {

        openSeedPanel(
          currentPlot
        );

      }

      else {

        alert(
          "🌱 Hãy chọn ô đất trước."
        );

      }

    }
  );

}


/* ==================================================
   KHỞI ĐỘNG
================================================== */

loadGame();

updateHUD();

updateAllPlants();
