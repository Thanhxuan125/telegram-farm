"use strict";

/* =====================================
   DỮ LIỆU HẠT GIỐNG
===================================== */

const seeds = {
  wheat: {
    name: "Lúa mì",
    icon: "🌾",
    level: 1,
    price: 10,
    sell: 12,
    growTime: 20 * 60
  },

  corn: {
    name: "Bắp",
    icon: "🌽",
    level: 3,
    price: 20,
    sell: 25,
    growTime: 60 * 60
  },

  radish: {
    name: "Củ cải",
    icon: "🥕",
    level: 7,
    price: 35,
    sell: 40,
    growTime: 90 * 60
  },

  carrot: {
    name: "Cà rốt",
    icon: "🥕",
    level: 10,
    price: 50,
    sell: 75,
    growTime: 150 * 60
  },

  beet: {
    name: "Củ dền",
    icon: "🫜",
    level: 13,
    price: 75,
    sell: 88,
    growTime: 280 * 60
  },

  eggplant: {
    name: "Cà tím",
    icon: "🍆",
    level: 15,
    price: 100,
    sell: 125,
    growTime: 450 * 60
  },

  chili: {
    name: "Ớt",
    icon: "🌶️",
    level: 17,
    price: 180,
    sell: 210,
    growTime: 650 * 60
  },

  greenOnion: {
    name: "Hành lá",
    icon: "🌱",
    level: 20,
    price: 250,
    sell: 350,
    growTime: 870 * 60
  },

  cabbage: {
    name: "Bắp cải",
    icon: "🥬",
    level: 23,
    price: 500,
    sell: 750,
    growTime: 950 * 60
  },

  pumpkin: {
    name: "Bí đỏ",
    icon: "🎃",
    level: 25,
    price: 1000,
    sell: 1250,
    growTime: 1200 * 60
  }
};



/* =====================================
   GIÁ BÁN
===================================== */

const sellPrices = {};

Object.keys(seeds).forEach((key) => {
  sellPrices[key] = seeds[key].sell;
});



/* =====================================
   CẤU HÌNH
===================================== */

const SAVE_KEY = "telegram_farm_save_v3";

const EXP_PER_LEVEL = 7000;

const TOTAL_PLOTS = 20;

const FREE_PLOTS = 3;

const FERTILIZER_PRICE = 150;



/* =====================================
   PLAYER
===================================== */

let player = {
  level: 1,

  exp: 0,

  coins: 1000,

  fertilizer: 3,

  unlockedPlots: 3,

  inventory: {},

  plots: {}
};



/* =====================================
   DOM
===================================== */

const plots = document.querySelectorAll(".plot");

const seedPanel = document.getElementById("seedPanel");

const seedClose = document.getElementById("seedClose");

const seedList = document.getElementById("seedList");

const shopPanel = document.getElementById("shopPanel");

const shopMenu = document.getElementById("shopMenu");

const shopClose = document.getElementById("shopClose");

const shopList = document.getElementById("shopList");

const shopTotalValue = document.getElementById("shopTotalValue");

const seedMenu = document.getElementById("seedMenu");

const fertilizerMenu =
  document.getElementById("fertilizerMenu");

const inventoryMenu =
  document.getElementById("inventoryMenu");

const settingsMenu =
  document.getElementById("settingsMenu");

const coinValue =
  document.getElementById("coinValue");

const fertilizerValue =
  document.getElementById("fertilizerValue");

const levelNumber =
  document.getElementById("levelNumber");

const levelValue =
  document.getElementById("levelValue");

const expFill =
  document.getElementById("expFill");

const expText =
  document.getElementById("expText");



/* =====================================
   HỖ TRỢ
===================================== */

function formatNumber(number) {
  return Number(number || 0).toLocaleString("vi-VN");
}



function getPlotUnlockPrice(plotNumber) {
  if (plotNumber <= FREE_PLOTS) {
    return 0;
  }

  return 500 * Math.pow(2, plotNumber - 4);
}



function getRandomExp() {
  return Math.floor(
    Math.random() * 291
  ) + 10;
}



/* =====================================
   SAVE / LOAD
===================================== */

function saveGame() {
  try {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify(player)
    );
  } catch (error) {
    console.error(
      "Không thể lưu game:",
      error
    );
  }
}



function loadGame() {
  try {
    const saved =
      localStorage.getItem(SAVE_KEY);

    if (!saved) {
      return;
    }

    const data = JSON.parse(saved);

    player = {
      ...player,
      ...data,

      inventory:
        data.inventory || {},

      plots:
        data.plots || {}
    };

  } catch (error) {
    console.error(
      "Không thể tải dữ liệu:",
      error
    );
  }
}



/* =====================================
   HUD
===================================== */

function updateHUD() {

  coinValue.textContent =
    formatNumber(player.coins);

  fertilizerValue.textContent =
    formatNumber(player.fertilizer);

  levelNumber.textContent =
    player.level;

  levelValue.textContent =
    player.level;

  const currentExp =
    player.exp % EXP_PER_LEVEL;

  const percent =
    Math.min(
      100,
      (currentExp / EXP_PER_LEVEL) * 100
    );

  expFill.style.width =
    `${percent}%`;

  expText.textContent =
    `${formatNumber(currentExp)} / ${formatNumber(EXP_PER_LEVEL)} EXP`;
}



/* =====================================
   EXP
===================================== */

function addExp(amount) {

  amount = Math.max(
    0,
    Number(amount) || 0
  );

  player.exp += amount;

  while (
    player.exp >=
    EXP_PER_LEVEL
  ) {

    player.exp -=
      EXP_PER_LEVEL;

    player.level += 1;

    alert(
      `🎉 Chúc mừng! Bạn đã lên Lv.${player.level}!`
    );
  }

  updateHUD();

  updatePlotsLockState();

  saveGame();
}



/* =====================================
   PLOT LOCK
===================================== */

function updatePlotsLockState() {

  plots.forEach((plot) => {

    const number =
      Number(plot.dataset.plot);

    const unlocked =
      number <= player.unlockedPlots;

    plot.classList.toggle(
      "locked",
      !unlocked
    );

    plot.classList.toggle(
      "unlocked",
      unlocked
    );

    const lock =
      plot.querySelector(".lock");

    if (lock) {
      lock.style.display =
        unlocked
          ? "none"
          : "flex";
    }

    let priceElement =
      plot.querySelector(".plot-price");

    if (!unlocked) {

      const price =
        getPlotUnlockPrice(number);

      if (!priceElement) {

        priceElement =
          document.createElement("span");

        priceElement.className =
          "plot-price";

        plot.appendChild(
          priceElement
        );
      }

      priceElement.textContent =
        `🪙 ${formatNumber(price)}`;

    } else if (priceElement) {

      priceElement.remove();
    }
  });
}



/* =====================================
   MỞ ĐẤT
===================================== */

function unlockPlot(plotNumber) {

  if (
    plotNumber <=
    player.unlockedPlots
  ) {
    return true;
  }

  if (
    plotNumber !==
    player.unlockedPlots + 1
  ) {

    alert(
      "⚠️ Bạn phải mở các ô đất theo thứ tự."
    );

    return false;
  }

  const price =
    getPlotUnlockPrice(plotNumber);

  if (player.coins < price) {

    alert(
      `❌ Không đủ tiền!\nCần ${formatNumber(price)} 🪙`
    );

    return false;
  }

  player.coins -= price;

  player.unlockedPlots =
    plotNumber;

  updateHUD();

  updatePlotsLockState();

  saveGame();

  alert(
    `🎉 Đã mở ô đất ${plotNumber}!`
  );

  return true;
}



/* =====================================
   SEED PANEL
===================================== */

let selectedPlot = null;



function openSeedPanel(plot) {

  selectedPlot = plot;

  seedPanel.classList.add("show");

  seedPanel.setAttribute(
    "aria-hidden",
    "false"
  );

  renderSeedList();
}



function closeSeedPanel() {

  selectedPlot = null;

  seedPanel.classList.remove("show");

  seedPanel.setAttribute(
    "aria-hidden",
    "true"
  );
}



/* =====================================
   RENDER HẠT
===================================== */

function renderSeedList() {

  seedList.innerHTML = "";

  Object.entries(seeds)
    .forEach(
      ([key, seed]) => {

        const item =
          document.createElement("button");

        item.type = "button";

        item.className =
          "seed-item";

        const locked =
          player.level <
          seed.level;

        item.disabled =
          locked;

        item.innerHTML = `
          <span class="seed-icon">
            ${seed.icon}
          </span>

          <span class="seed-name">
            ${seed.name}
          </span>

          <span class="seed-price">
            🪙 ${formatNumber(seed.price)}
          </span>

          <span class="seed-price">
            Lv.${seed.level}
          </span>

          ${
            locked
              ? `<span class="seed-price">
                   🔒 Chưa mở
                 </span>`
              : ""
          }
        `;

        item.addEventListener(
          "click",
          () => {

            if (locked) {
              return;
            }

            if (!selectedPlot) {
              return;
            }

            plantSeed(
              selectedPlot,
              key
            );

            closeSeedPanel();
          }
        );

        seedList.appendChild(item);
      }
    );
}



/* =====================================
   TRỒNG
===================================== */

function plantSeed(
  plot,
  seedKey
) {

  const number =
    Number(plot.dataset.plot);

  if (
    number >
    player.unlockedPlots
  ) {
    return;
  }

  const seed =
    seeds[seedKey];

  if (!seed) {
    return;
  }

  if (
    player.level <
    seed.level
  ) {

    alert(
      `🔒 Cần Lv.${seed.level}`
    );

    return;
  }

  if (
    player.coins <
    seed.price
  ) {

    alert(
      "❌ Không đủ tiền mua hạt!"
    );

    return;
  }

  player.coins -=
    seed.price;

  const plantedAt =
    Date.now();

  player.plots[number] = {
    seedKey,
    plantedAt,
    fertilizerUsed: false,
    fertilizerReduction: 0
  };

  updatePlotVisual(
    plot
  );

  updateHUD();

  saveGame();
}



/* =====================================
   HIỂN THỊ CÂY
===================================== */

function updatePlotVisual(plot) {

  const number =
    Number(plot.dataset.plot);

  const data =
    player.plots[number];

  const oldCrop =
    plot.querySelector(".crop-image");

  const oldName =
    plot.querySelector(".crop-name");

  const oldTime =
    plot.querySelector(".grow-time");

  if (oldCrop) {
    oldCrop.remove();
  }

  if (oldName) {
    oldName.remove();
  }

  if (oldTime) {
    oldTime.remove();
  }

  if (!data) {
    return;
  }

  const seed =
    seeds[data.seedKey];

  if (!seed) {
    return;
  }

  const crop =
    document.createElement("div");

  crop.className =
    "crop-image";

  crop.textContent =
    seed.icon;

  crop.style.display =
    "flex";

  crop.style.alignItems =
    "center";

  crop.style.justifyContent =
    "center";

  crop.style.fontSize =
    "clamp(20px, 7vw, 40px)";

  plot.appendChild(crop);


  const name =
    document.createElement("span");

  name.className =
    "crop-name";

  name.textContent =
    seed.name;

  plot.appendChild(name);


  const time =
    document.createElement("span");

  time.className =
    "grow-time";

  plot.appendChild(time);

  updateSinglePlant(
    plot,
    data,
    time
  );
}



/* =====================================
   UPDATE CÂY
===================================== */

function updateSinglePlant(
  plot,
  data,
  timeElement
) {

  const seed =
    seeds[data.seedKey];

  if (!seed) {
    return;
  }

  const reduction =
    data.fertilizerReduction || 0;

  const totalTime =
    Math.max(
      1,
      seed.growTime -
      reduction * 60
    );

  const elapsed =
    (Date.now() -
      data.plantedAt) / 1000;

  const remaining =
    Math.max(
      0,
      totalTime - elapsed
    );

  if (
    remaining <= 0
  ) {

    timeElement.textContent =
      "✅ Thu hoạch";

    plot.dataset.ready =
      "true";

    plot.classList.add(
      "ready"
    );

  } else {

    const minutes =
      Math.floor(
        remaining / 60
      );

    const seconds =
      Math.floor(
        remaining % 60
      );

    timeElement.textContent =
      `⏳ ${minutes}:${String(seconds).padStart(2, "0")}`;

    plot.dataset.ready =
      "false";

    plot.classList.remove(
      "ready"
    );
  }
}



/* =====================================
   UPDATE TẤT CẢ CÂY
===================================== */

function updateAllPlants() {

  plots.forEach((plot) => {

    const number =
      Number(plot.dataset.plot);

    const data =
      player.plots[number];

    if (!data) {
      return;
    }

    const timeElement =
      plot.querySelector(
        ".grow-time"
      );

    if (!timeElement) {
      updatePlotVisual(plot);
      return;
    }

    updateSinglePlant(
      plot,
      data,
      timeElement
    );
  });
}



/* =====================================
   THU HOẠCH
===================================== */

function harvestPlot(plot) {

  const number =
    Number(plot.dataset.plot);

  const data =
    player.plots[number];

  if (!data) {
    return;
  }

  const seed =
    seeds[data.seedKey];

  if (!seed) {
    return;
  }

  const totalTime =
    Math.max(
      1,
      seed.growTime -
      (data.fertilizerReduction || 0) * 60
    );

  const elapsed =
    (Date.now() -
      data.plantedAt) / 1000;

  if (
    elapsed <
    totalTime
  ) {

    alert(
      "⏳ Cây chưa trưởng thành!"
    );

    return;
  }

  if (
    !player.inventory[data.seedKey]
  ) {
    player.inventory[data.seedKey] = 0;
  }

  player.inventory[data.seedKey] += 1;

  const gainedExp =
    getRandomExp();

  addExp(gainedExp);

  delete player.plots[number];

  plot.dataset.ready =
    "false";

  plot.classList.remove(
    "ready"
  );

  updatePlotVisual(
    plot
  );

  saveGame();

  renderShop();

  alert(
    `🌾 Thu hoạch ${seed.name}!\n+${gainedExp} EXP`
  );
}



/* =====================================
   PHÂN BÓN
===================================== */

function getFertilizerReduction(seed) {

  const ranges = {

    wheat: [5, 8],

    corn: [6, 10],

    radish: [8, 13],

    carrot: [10, 16],

    beet: [12, 19],

    eggplant: [14, 22],

    chili: [16, 25],

    greenOnion: [18, 27],

    cabbage: [20, 29],

    pumpkin: [22, 30]
  };

  const range =
    ranges[
      Object.keys(seeds)
        .find(
          key => seeds[key] === seed
        )
    ];

  if (!range) {
    return 5;
  }

  return (
    Math.floor(
      Math.random() *
      (range[1] - range[0] + 1)
    ) +
    range[0]
  );
}



function useFertilizer(plot) {

  const number =
    Number(plot.dataset.plot);

  const data =
    player.plots[number];

  if (!data) {

    alert(
      "🌱 Ô này chưa trồng cây."
    );

    return;
  }

  if (
    data.fertilizerUsed
  ) {

    alert(
      "⚠️ Cây này đã dùng phân bón."
    );

    return;
  }

  if (
    player.fertilizer <= 0
  ) {

    alert(
      "❌ Bạn không còn phân bón."
    );

    return;
  }

  const seed =
    seeds[data.seedKey];

  if (!seed) {
    return;
  }

  const reduction =
    getFertilizerReduction(seed);

  player.fertilizer -= 1;

  data.fertilizerUsed =
    true;

  data.fertilizerReduction =
    reduction;

  updateHUD();

  saveGame();

  updatePlotVisual(
    plot
  );

  alert(
    `🧪 Đã dùng phân bón!\nGiảm ${reduction} phút.`
  );
}



/* =====================================
   SHOP
===================================== */

function openShop() {

  renderShop();

  shopPanel.classList.add(
    "show"
  );

  shopPanel.setAttribute(
    "aria-hidden",
    "false"
  );
}



function closeShop() {

  shopPanel.classList.remove(
    "show"
  );

  shopPanel.setAttribute(
    "aria-hidden",
    "true"
  );
}



function getInventoryTotalValue() {

  let total = 0;

  Object.entries(
    player.inventory
  ).forEach(
    ([key, amount]) => {

      const price =
        sellPrices[key] || 0;

      total +=
        price *
        amount;
    }
  );

  return total;
}



function renderShop() {

  shopList.innerHTML = "";

  const total =
    getInventoryTotalValue();

  shopTotalValue.textContent =
    `Tổng giá trị kho: ${formatNumber(total)} 🪙`;

  let hasItems = false;

  Object.entries(
    player.inventory
  ).forEach(
    ([key, amount]) => {

      if (
        amount <= 0 ||
        !seeds[key]
      ) {
        return;
      }

      hasItems = true;

      const seed =
        seeds[key];

      const item =
        document.createElement("div");

      item.className =
        "shop-item";

      const value =
        amount *
        sellPrices[key];

      item.innerHTML = `
        <div class="shop-item-icon">
          ${seed.icon}
        </div>

        <div>
          <div class="shop-item-name">
            ${seed.name}
          </div>

          <div class="shop-item-count">
            Số lượng: ${formatNumber(amount)}
          </div>

          <div class="shop-item-value">
            ${formatNumber(sellPrices[key])} 🪙 / cây
          </div>
        </div>

        <button
          class="shop-sell-button"
          type="button"
          data-sell="${key}"
        >
          Bán
        </button>
      `;

      shopList.appendChild(item);
    }
  );

  if (!hasItems) {

    shopList.innerHTML = `
      <div style="
        padding:20px;
        color:#666;
        font-weight:700;
      ">
        🎒 Kho đang trống
      </div>
    `;
  }
}



/* =====================================
   BÁN NÔNG SẢN
===================================== */

function sellOne(key) {

  const amount =
    player.inventory[key] || 0;

  if (amount <= 0) {
    return;
  }

  const price =
    sellPrices[key] || 0;

  player.inventory[key] -= 1;

  player.coins += price;

  updateHUD();

  renderShop();

  saveGame();
}



function sellAll(key) {

  const amount =
    player.inventory[key] || 0;

  if (amount <= 0) {
    return;
  }

  const price =
    sellPrices[key] || 0;

  player.coins +=
    amount * price;

  player.inventory[key] = 0;

  updateHUD();

  renderShop();

  saveGame();
}



/* =====================================
   CLICK Ô ĐẤT
===================================== */

plots.forEach((plot) => {

  plot.addEventListener(
    "click",
    () => {

      const number =
        Number(plot.dataset.plot);

      if (
        number >
        player.unlockedPlots
      ) {

        unlockPlot(number);

        return;
      }


      const data =
        player.plots[number];

      if (!data) {

        openSeedPanel(plot);

        return;
      }


      if (
        plot.dataset.ready ===
        "true"
      ) {

        harvestPlot(plot);

        return;
      }


      const fertilizerQuestion =
        confirm(
          "🌱 Cây đang lớn.\n\nBấm OK để dùng 1 phân bón.\nBấm Hủy để đóng."
        );

      if (
        fertilizerQuestion
      ) {

        useFertilizer(plot);
      }

    }
  );

});



/* =====================================
   MENU HẠT
===================================== */

seedMenu.addEventListener(
  "click",
  () => {

    selectedPlot = null;

    seedPanel.classList.add(
      "show"
    );

    seedPanel.setAttribute(
      "aria-hidden",
      "false"
    );

    renderSeedList();
  }
);



/* =====================================
   ĐÓNG SEED
===================================== */

seedClose.addEventListener(
  "click",
  closeSeedPanel
);



seedPanel.addEventListener(
  "click",
  (event) => {

    if (
      event.target ===
      seedPanel
    ) {
      closeSeedPanel();
    }

  }
);



/* =====================================
   SHOP MENU
===================================== */

shopMenu.addEventListener(
  "click",
  openShop
);



/* =====================================
   SHOP CLOSE
===================================== */

shopClose.addEventListener(
  "click",
  closeShop
);



shopPanel.addEventListener(
  "click",
  (event) => {

    if (
      event.target ===
      shopPanel
    ) {
      closeShop();
    }

  }
);



/* =====================================
   SHOP BÁN
===================================== */

shopList.addEventListener(
  "click",
  (event) => {

    const button =
      event.target.closest(
        "[data-sell]"
      );

    if (!button) {
      return;
    }

    const key =
      button.dataset.sell;

    sellOne(key);
  }
);



/* =====================================
   MENU KHO
===================================== */

inventoryMenu.addEventListener(
  "click",
  openShop
);



/* =====================================
   MENU PHÂN
===================================== */

fertilizerMenu.addEventListener(
  "click",
  () => {

    alert(
      `🧪 Bạn đang có ${formatNumber(player.fertilizer)} phân bón.`
    );
  }
);



/* =====================================
   MENU CÀI ĐẶT
===================================== */

settingsMenu.addEventListener(
  "click",
  () => {

    alert(
      "⚙️ Cài đặt sẽ được phát triển ở bước sau."
    );
  }
);



/* =====================================
   ESC ĐÓNG PANEL
===================================== */

document.addEventListener(
  "keydown",
  (event) => {

    if (
      event.key ===
      "Escape"
    ) {

      closeSeedPanel();

      closeShop();
    }

  }
);



/* =====================================
   KHỞI ĐỘNG
===================================== */

function initGame() {

  loadGame();

  updateHUD();

  updatePlotsLockState();

  plots.forEach(
    (plot) => {

      const number =
        Number(plot.dataset.plot);

      if (
        player.plots[number]
      ) {

        updatePlotVisual(
          plot
        );
      }
    }
  );

  renderShop();

  updateAllPlants();
}



initGame();



/* =====================================
   CẬP NHẬT THỜI GIAN
===================================== */

setInterval(
  updateAllPlants,
  1000
);
