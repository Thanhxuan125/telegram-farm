"use strict";

/* =====================================
   TELEGRAM + BACKEND
===================================== */

const BACKEND_URL =
  "DAN_URL_RENDER_BACKEND_CUA_BAN_VAO_DAY";

let serverPlayer = null;
let serverPlots = [];
let telegramAuthenticated = false;


/* =====================================
   XÁC THỰC TELEGRAM
===================================== */

async function authenticateTelegram() {

  try {

    if (
      !window.Telegram ||
      !window.Telegram.WebApp
    ) {

      console.error(
        "❌ Telegram WebApp SDK chưa được tải."
      );

      return false;
    }

    const tg =
      window.Telegram.WebApp;

    tg.ready();

    tg.expand();

    const initData =
      tg.initData;

    if (!initData) {

      console.warn(
        "⚠️ Không có Telegram initData."
      );

      return false;
    }

    console.log(
      "🔐 Đang xác thực Telegram với backend..."
    );

    const response =
      await fetch(
        `${BACKEND_URL}/api/auth/telegram`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            initData
          })
        }
      );

    const data =
      await response.json();

    if (
      !response.ok ||
      !data.ok
    ) {

      console.error(
        "❌ Telegram authentication failed:",
        data
      );

      return false;
    }

    serverPlayer =
      data.player || null;

    serverPlots =
      data.plots || [];

    telegramAuthenticated =
      true;

    console.log(
      "✅ Telegram authenticated"
    );

    console.log(
      "👤 Server player:",
      serverPlayer
    );

    console.log(
      "🌱 Server plots:",
      serverPlots
    );

    return true;

  } catch (error) {

    console.error(
      "❌ Backend authentication error:",
      error
    );

    return false;
  }
}


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

  sellPrices[key] =
    seeds[key].sell;

});


/* =====================================
   CẤU HÌNH
===================================== */

const SAVE_KEY =
  "telegram_farm_save_v3";

const EXP_PER_LEVEL =
  7000;

const TOTAL_PLOTS =
  20;

const FREE_PLOTS =
  3;

const FERTILIZER_PRICE =
  150;


/* =====================================
   CẤU HÌNH NHIỆM VỤ
===================================== */

const TASK_COOLDOWN_AD2 =
  15 * 60 * 1000;

const TASK_COOLDOWN_AD3 =
  15 * 60 * 1000;

const TASK_COOLDOWN_AD4 =
  30 * 60 * 1000;

const TASK_AD2_LIMIT =
  10;

const TASK_AD3_LIMIT =
  20;

const TASK_AD4_LIMIT =
  5;


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

  plots: {},

  autoCareCards: 0,

  tasks: {

    date: "",

    ad1Claimed: false,

    ad2Count: 0,
    ad2LastClaim: 0,

    ad3Count: 0,
    ad3LastClaim: 0,

    ad4Count: 0,
    ad4LastClaim: 0,

    groupClaimed: false,

    channelClaimed: false
  }
};


/* =====================================
   DOM
===================================== */

const plots =
  document.querySelectorAll(".plot");

const seedPanel =
  document.getElementById(
    "seedPanel"
  );

const seedClose =
  document.getElementById(
    "seedClose"
  );

const seedList =
  document.getElementById(
    "seedList"
  );

const shopPanel =
  document.getElementById(
    "shopPanel"
  );

const shopMenu =
  document.getElementById(
    "shopMenu"
  );

const shopClose =
  document.getElementById(
    "shopClose"
  );

const shopList =
  document.getElementById(
    "shopList"
  );

const shopTotalValue =
  document.getElementById(
    "shopTotalValue"
  );

const seedMenu =
  document.getElementById(
    "seedMenu"
  );

const inventoryMenu =
  document.getElementById(
    "inventoryMenu"
  );

const settingsMenu =
  document.getElementById(
    "settingsMenu"
  );

const tasksMenu =
  document.getElementById(
    "tasksMenu"
  );

const tasksPanel =
  document.getElementById(
    "tasksPanel"
  );

const tasksClose =
  document.getElementById(
    "tasksClose"
  );

const tasksList =
  document.getElementById(
    "tasksList"
  );

const coinValue =
  document.getElementById(
    "coinValue"
  );

const fertilizerValue =
  document.getElementById(
    "fertilizerValue"
  );

const levelNumber =
  document.getElementById(
    "levelNumber"
  );

const levelValue =
  document.getElementById(
    "levelValue"
  );

const expFill =
  document.getElementById(
    "expFill"
  );

const expText =
  document.getElementById(
    "expText"
  );


/* =====================================
   HỖ TRỢ
===================================== */

function formatNumber(number) {

  return Number(number || 0)
    .toLocaleString("vi-VN");
}


function getPlotUnlockPrice(
  plotNumber
) {

  if (
    plotNumber <=
    FREE_PLOTS
  ) {

    return 0;
  }

  return (
    500 *
    Math.pow(
      2,
      plotNumber - 4
    )
  );
}


function getRandomExp() {

  return Math.floor(
    Math.random() * 291
  ) + 10;
}


function getTodayKey() {

  const now =
    new Date();

  const year =
    now.getFullYear();

  const month =
    String(
      now.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      now.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
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
      localStorage.getItem(
        SAVE_KEY
      );

    if (!saved) {

      return;
    }

    const data =
      JSON.parse(saved);

    player = {

      ...player,

      ...data,

      inventory:
        data.inventory || {},

      plots:
        data.plots || {},

      tasks: {

        ...player.tasks,

        ...(data.tasks || {})
      },

      autoCareCards:
        Number(
          data.autoCareCards || 0
        )
    };

  } catch (error) {

    console.error(
      "Không thể tải dữ liệu:",
      error
    );
  }
}


/* =====================================
   ĐỒNG BỘ DỮ LIỆU SERVER
   CHỈ DÙNG ĐỂ KIỂM TRA Ở BƯỚC NÀY
===================================== */

function showServerData() {

  if (!telegramAuthenticated) {

    return;
  }

  console.log(
    "━━━━━━━━━━━━━━━━━━━━"
  );

  console.log(
    "🌐 SERVER DATA"
  );

  console.log(
    "Telegram ID:",
    serverPlayer?.telegram_id
  );

  console.log(
    "Username:",
    serverPlayer?.username
  );

  console.log(
    "Level:",
    serverPlayer?.level
  );

  console.log(
    "Coins:",
    serverPlayer?.coins
  );

  console.log(
    "Fertilizer:",
    serverPlayer?.fertilizer
  );

  console.log(
    "Plots:",
    serverPlots
  );

  console.log(
    "━━━━━━━━━━━━━━━━━━━━"
  );
}


/* =====================================
   RESET NHIỆM VỤ HÀNG NGÀY
===================================== */

function checkDailyTasks() {

  const today =
    getTodayKey();

  if (
    player.tasks.date ===
    today
  ) {

    return;
  }

  player.tasks.date =
    today;

  player.tasks.ad1Claimed =
    false;

  player.tasks.ad2Count =
    0;

  player.tasks.ad2LastClaim =
    0;

  player.tasks.ad3Count =
    0;

  player.tasks.ad3LastClaim =
    0;

  player.tasks.ad4Count =
    0;

  player.tasks.ad4LastClaim =
    0;

  saveGame();
}


/* =====================================
   HUD
===================================== */

function updateHUD() {

  coinValue.textContent =
    formatNumber(
      player.coins
    );

  fertilizerValue.textContent =
    formatNumber(
      player.fertilizer
    );

  levelNumber.textContent =
    player.level;

  levelValue.textContent =
    player.level;

  const currentExp =
    player.exp %
    EXP_PER_LEVEL;

  const percent =
    Math.min(
      100,
      (
        currentExp /
        EXP_PER_LEVEL
      ) * 100
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

  amount =
    Math.max(
      0,
      Number(amount) || 0
    );

  player.exp +=
    amount;

  while (
    player.exp >=
    EXP_PER_LEVEL
  ) {

    player.exp -=
      EXP_PER_LEVEL;

    player.level +=
      1;

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
      Number(
        plot.dataset.plot
      );

    const unlocked =
      number <=
      player.unlockedPlots;

    plot.classList.toggle(
      "locked",
      !unlocked
    );

    plot.classList.toggle(
      "unlocked",
      unlocked
    );

    const lock =
      plot.querySelector(
        ".lock"
      );

    if (lock) {

      lock.style.display =
        unlocked
          ? "none"
          : "flex";
    }

    let priceElement =
      plot.querySelector(
        ".plot-price"
      );

    if (!unlocked) {

      const price =
        getPlotUnlockPrice(
          number
        );

      if (!priceElement) {

        priceElement =
          document.createElement(
            "span"
          );

        priceElement.className =
          "plot-price";

        plot.appendChild(
          priceElement
        );
      }

      priceElement.textContent =
        `🪙 ${formatNumber(price)}`;

    } else if (
      priceElement
    ) {

      priceElement.remove();
    }

  });
}


/* =====================================
   MỞ ĐẤT
===================================== */

function unlockPlot(
  plotNumber
) {

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
    getPlotUnlockPrice(
      plotNumber
    );

  if (
    player.coins <
    price
  ) {

    alert(
      `❌ Không đủ tiền!\nCần ${formatNumber(price)} 🪙`
    );

    return false;
  }

  player.coins -=
    price;

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

let selectedPlot =
  null;


function openSeedPanel(plot) {

  selectedPlot =
    plot;

  seedPanel.classList.add(
    "show"
  );

  seedPanel.setAttribute(
    "aria-hidden",
    "false"
  );

  renderSeedList();
}


function closeSeedPanel() {

  selectedPlot =
    null;

  seedPanel.classList.remove(
    "show"
  );

  seedPanel.setAttribute(
    "aria-hidden",
    "true"
  );
}


/* =====================================
   RENDER HẠT
===================================== */

function renderSeedList() {

  seedList.innerHTML =
    "";

  Object.entries(
    seeds
  ).forEach(
    ([key, seed]) => {

      const item =
        document.createElement(
          "button"
        );

      item.type =
        "button";

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

      seedList.appendChild(
        item
      );

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
    Number(
      plot.dataset.plot
    );

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

    fertilizerUsed:
      false,

    fertilizerReduction:
      0
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

function updatePlotVisual(
  plot
) {

  const number =
    Number(
      plot.dataset.plot
    );

  const data =
    player.plots[number];

  const oldCrop =
    plot.querySelector(
      ".crop-image"
    );

  const oldName =
    plot.querySelector(
      ".crop-name"
    );

  const oldTime =
    plot.querySelector(
      ".grow-time"
    );

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
    document.createElement(
      "div"
    );

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

  plot.appendChild(
    crop
  );


  const name =
    document.createElement(
      "span"
    );

  name.className =
    "crop-name";

  name.textContent =
    seed.name;

  plot.appendChild(
    name
  );


  const time =
    document.createElement(
      "span"
    );

  time.className =
    "grow-time";

  plot.appendChild(
    time
  );


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
    data.fertilizerReduction ||
    0;

  const totalTime =
    Math.max(
      1,
      seed.growTime -
      reduction * 60
    );

  const elapsed =
    (
      Date.now() -
      data.plantedAt
    ) / 1000;

  const remaining =
    Math.max(
      0,
      totalTime -
      elapsed
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
      Number(
        plot.dataset.plot
      );

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

      updatePlotVisual(
        plot
      );

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

function harvestPlot(
  plot
) {

  const number =
    Number(
      plot.dataset.plot
    );

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
      (
        data.fertilizerReduction ||
        0
      ) * 60
    );

  const elapsed =
    (
      Date.now() -
      data.plantedAt
    ) / 1000;

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
    !player.inventory[
      data.seedKey
    ]
  ) {

    player.inventory[
      data.seedKey
    ] = 0;
  }

  player.inventory[
    data.seedKey
  ] += 1;

  const gainedExp =
    getRandomExp();

  addExp(
    gainedExp
  );

  delete player.plots[
    number
  ];

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

function getFertilizerReduction(
  seed
) {

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

  const seedKey =
    Object.keys(seeds)
      .find(
        key =>
          seeds[key] ===
          seed
      );

  const range =
    ranges[seedKey];

  if (!range) {

    return 5;
  }

  return Math.floor(
    Math.random() *
    (
      range[1] -
      range[0] +
      1
    )
  ) + range[0];
}


function useFertilizer(
  plot
) {

  const number =
    Number(
      plot.dataset.plot
    );

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
    getFertilizerReduction(
      seed
    );

  player.fertilizer -=
    1;

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

  let total =
    0;

  Object.entries(
    player.inventory
  ).forEach(
    ([key, amount]) => {

      const price =
        sellPrices[key] ||
        0;

      total +=
        price *
        amount;
    }
  );

  return total;
}


function renderShop() {

  shopList.innerHTML =
    "";

  const total =
    getInventoryTotalValue();

  shopTotalValue.textContent =
    `Tổng giá trị kho: ${formatNumber(total)} 🪙`;

  let hasItems =
    false;

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

      hasItems =
        true;

      const seed =
        seeds[key];

      const item =
        document.createElement(
          "div"
        );

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

      shopList.appendChild(
        item
      );
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
    player.inventory[key] ||
    0;

  if (amount <= 0) {

    return;
  }

  const price =
    sellPrices[key] ||
    0;

  player.inventory[key] -=
    1;

  player.coins +=
    price;

  updateHUD();

  renderShop();

  saveGame();
}


function sellAll(key) {

  const amount =
    player.inventory[key] ||
    0;

  if (amount <= 0) {

    return;
  }

  const price =
    sellPrices[key] ||
    0;

  player.coins +=
    amount *
    price;

  player.inventory[key] =
    0;

  updateHUD();

  renderShop();

  saveGame();
}


/* =====================================
   NHIỆM VỤ - HỖ TRỢ
===================================== */

function getRemainingCooldown(
  lastClaim,
  cooldown
) {

  if (!lastClaim) {

    return 0;
  }

  return Math.max(
    0,
    cooldown -
    (
      Date.now() -
      lastClaim
    )
  );
}


function formatCooldown(
  milliseconds
) {

  const totalSeconds =
    Math.ceil(
      milliseconds /
      1000
    );

  const minutes =
    Math.floor(
      totalSeconds /
      60
    );

  const seconds =
    totalSeconds %
    60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}


/* =====================================
   NHIỆM VỤ - RENDER
===================================== */

function renderTasks() {

  if (!tasksList) {

    return;
  }

  checkDailyTasks();

  tasksList.innerHTML =
    "";

  const tasks = [

    {
      id: "ad1",

      icon: "📺",

      title:
        "Điểm danh hằng ngày",

      description:
        "Xem quảng cáo để nhận phần thưởng hôm nay.",

      reward:
        "🎁 +100 🪙",

      status:
        player.tasks.ad1Claimed
          ? "✅ Đã nhận hôm nay"
          : "🎬 Có thể nhận",

      button:
        player.tasks.ad1Claimed
          ? "Đã nhận"
          : "Xem quảng cáo",

      disabled:
        player.tasks.ad1Claimed
    },

    {
      id: "ad2",

      icon: "🧪",

      title:
        "Nhận phân bón",

      description:
        "Xem quảng cáo để nhận ngẫu nhiên 1–3 phân bón.",

      reward:
        "🎁 +1–3 🧪",

      status:
        getAd2Status(),

      button:
        getAd2ButtonText(),

      disabled:
        isAd2Disabled()
    },

    {
      id: "ad3",

      icon: "🪙",

      title:
        "Nhận Coin",

      description:
        "Xem quảng cáo để nhận ngẫu nhiên 50–150 coin.",

      reward:
        "🎁 +50–150 🪙",

      status:
        getAd3Status(),

      button:
        getAd3ButtonText(),

      disabled:
        isAd3Disabled()
    },

    {
      id: "ad4",

      icon: "🛡️",

      title:
        "Thẻ tự động chăm sóc",

      description:
        "Xem quảng cáo để nhận 1 thẻ tự động chăm sóc cây 3 giờ.",

      reward:
        "🎁 +1 thẻ Auto-care 3 giờ",

      status:
        getAd4Status(),

      button:
        getAd4ButtonText(),

      disabled:
        isAd4Disabled()
    },

    {
      id: "group",

      icon: "👥",

      title:
        "Tham gia nhóm",

      description:
        "Tham gia nhóm chat của Nông Trại Xanh.",

      reward:
        "🎁 +500 🪙",

      status:
        player.tasks.groupClaimed
          ? "✅ Đã nhận"
          : "🔒 Chờ Bot xác minh",

      button:
        player.tasks.groupClaimed
          ? "Đã nhận"
          : "Chưa mở",

      disabled:
        true
    },

    {
      id: "channel",

      icon: "📢",

      title:
        "Tham gia kênh thông báo",

      description:
        "Tham gia kênh thông báo của Nông Trại Xanh.",

      reward:
        "🎁 +500 🪙",

      status:
        player.tasks.channelClaimed
          ? "✅ Đã nhận"
          : "🔒 Chờ Bot xác minh",

      button:
        player.tasks.channelClaimed
          ? "Đã nhận"
          : "Chưa mở",

      disabled:
        true
    }

  ];


  tasks.forEach(
    (task) => {

      const item =
        document.createElement(
          "div"
        );

      item.className =
        "task-item";

      if (
        task.disabled &&
        (
          task.id === "ad1" ||
          task.id === "group" ||
          task.id === "channel"
        )
      ) {

        item.classList.add(
          "completed"
        );
      }

      if (
        task.id === "ad2" &&
        getRemainingCooldown(
          player.tasks.ad2LastClaim,
          TASK_COOLDOWN_AD2
        ) > 0
      ) {

        item.classList.add(
          "cooldown"
        );
      }

      if (
        task.id === "ad3" &&
        getRemainingCooldown(
          player.tasks.ad3LastClaim,
          TASK_COOLDOWN_AD3
        ) > 0
      ) {

        item.classList.add(
          "cooldown"
        );
      }

      if (
        task.id === "ad4" &&
        getRemainingCooldown(
          player.tasks.ad4LastClaim,
          TASK_COOLDOWN_AD4
        ) > 0
      ) {

        item.classList.add(
          "cooldown"
        );
      }


      item.innerHTML = `

        <div class="task-icon">
          ${task.icon}
        </div>

        <div class="task-content">

          <div class="task-title">
            ${task.title}
          </div>

          <div class="task-desc">
            ${task.description}
          </div>

          <div class="task-reward">
            ${task.reward}
          </div>

          <div class="task-status">
            ${task.status}
          </div>

        </div>

        <button
          class="task-button"
          type="button"
          data-task="${task.id}"
          ${task.disabled ? "disabled" : ""}
        >
          ${task.button}
        </button>

      `;

      tasksList.appendChild(
        item
      );
    }
  );


  const note =
    document.createElement(
      "div"
    );

  note.className =
    "task-note";

  note.innerHTML = `
    ℹ️ Giới hạn nhiệm vụ được tính theo ngày.
    Cooldown được lưu lại khi bạn thoát game.
    <br><br>

    🛡️ Thẻ Auto-care hiện được lưu vào tài khoản.
    Chức năng tự chăm sóc sẽ được kết nối khi hệ thống chăm sóc cây được xây dựng.
    <br><br>

    🔒 Nhiệm vụ nhóm và kênh sẽ chỉ nhận thưởng
    sau khi Bot Telegram xác minh thành công.
  `;

  tasksList.appendChild(
    note
  );
}


/* =====================================
   NHIỆM VỤ - TRẠNG THÁI AD 2
===================================== */

function isAd2Disabled() {

  if (
    player.tasks.ad2Count >=
    TASK_AD2_LIMIT
  ) {

    return true;
  }

  return (
    getRemainingCooldown(
      player.tasks.ad2LastClaim,
      TASK_COOLDOWN_AD2
    ) > 0
  );
}


function getAd2Status() {

  if (
    player.tasks.ad2Count >=
    TASK_AD2_LIMIT
  ) {

    return `✅ Đã đủ ${TASK_AD2_LIMIT}/${TASK_AD2_LIMIT} lượt hôm nay`;
  }

  const cooldown =
    getRemainingCooldown(
      player.tasks.ad2LastClaim,
      TASK_COOLDOWN_AD2
    );

  if (cooldown > 0) {

    return `⏳ Còn ${formatCooldown(cooldown)}`;
  }

  return `Đã dùng ${player.tasks.ad2Count}/${TASK_AD2_LIMIT} lượt hôm nay`;
}


function getAd2ButtonText() {

  if (
    player.tasks.ad2Count >=
    TASK_AD2_LIMIT
  ) {

    return "Hết lượt";
  }

  const cooldown =
    getRemainingCooldown(
      player.tasks.ad2LastClaim,
      TASK_COOLDOWN_AD2
    );

  if (cooldown > 0) {

    return formatCooldown(
      cooldown
    );
  }

  return "Xem quảng cáo";
}


/* =====================================
   NHIỆM VỤ - TRẠNG THÁI AD 3
===================================== */

function isAd3Disabled() {

  if (
    player.tasks.ad3Count >=
    TASK_AD3_LIMIT
  ) {

    return true;
  }

  return (
    getRemainingCooldown(
      player.tasks.ad3LastClaim,
      TASK_COOLDOWN_AD3
    ) > 0
  );
}


function getAd3Status() {

  if (
    player.tasks.ad3Count >=
    TASK_AD3_LIMIT
  ) {

    return `✅ Đã đủ ${TASK_AD3_LIMIT}/${TASK_AD3_LIMIT} lượt hôm nay`;
  }

  const cooldown =
    getRemainingCooldown(
      player.tasks.ad3LastClaim,
      TASK_COOLDOWN_AD3
    );

  if (cooldown > 0) {

    return `⏳ Còn ${formatCooldown(cooldown)}`;
  }

  return `Đã dùng ${player.tasks.ad3Count}/${TASK_AD3_LIMIT} lượt hôm nay`;
}


function getAd3ButtonText() {

  if (
    player.tasks.ad3Count >=
    TASK_AD3_LIMIT
  ) {

    return "Hết lượt";
  }

  const cooldown =
    getRemainingCooldown(
      player.tasks.ad3LastClaim,
      TASK_COOLDOWN_AD3
    );

  if (cooldown > 0) {

    return formatCooldown(
      cooldown
    );
  }

  return "Xem quảng cáo";
}


/* =====================================
   NHIỆM VỤ - TRẠNG THÁI AD 4
===================================== */

function isAd4Disabled() {

  if (
    player.tasks.ad4Count >=
    TASK_AD4_LIMIT
  ) {

    return true;
  }

  return (
    getRemainingCooldown(
      player.tasks.ad4LastClaim,
      TASK_COOLDOWN_AD4
    ) > 0
  );
}


function getAd4Status() {

  if (
    player.tasks.ad4Count >=
    TASK_AD4_LIMIT
  ) {

    return `✅ Đã đủ ${TASK_AD4_LIMIT}/${TASK_AD4_LIMIT} lượt hôm nay`;
  }

  const cooldown =
    getRemainingCooldown(
      player.tasks.ad4LastClaim,
      TASK_COOLDOWN_AD4
    );

  if (cooldown > 0) {

    return `⏳ Còn ${formatCooldown(cooldown)}`;
  }

  return `Đã dùng ${player.tasks.ad4Count}/${TASK_AD4_LIMIT} lượt hôm nay`;
}


function getAd4ButtonText() {

  if (
    player.tasks.ad4Count >=
    TASK_AD4_LIMIT
  ) {

    return "Hết lượt";
  }

  const cooldown =
    getRemainingCooldown(
      player.tasks.ad4LastClaim,
      TASK_COOLDOWN_AD4
    );

  if (cooldown > 0) {

    return formatCooldown(
      cooldown
    );
  }

  return "Xem quảng cáo";
}


/* =====================================
   NHIỆM VỤ - GIẢ LẬP QUẢNG CÁO
===================================== */

function simulateAd(
  callback
) {

  alert(
    "🎬 Quảng cáo mô phỏng\n\n" +
    "Sau này bước này sẽ được thay bằng hệ thống quảng cáo thật."
  );

  callback();
}


/* =====================================
   NHIỆM VỤ 1
===================================== */

function claimAd1() {

  checkDailyTasks();

  if (
    player.tasks.ad1Claimed
  ) {

    alert(
      "⚠️ Bạn đã nhận phần thưởng hôm nay."
    );

    return;
  }

  simulateAd(
    () => {

      player.coins +=
        100;

      player.tasks.ad1Claimed =
        true;

      updateHUD();

      saveGame();

      renderTasks();

      alert(
        "🎉 Nhận thành công!\n+100 🪙"
      );
    }
  );
}


/* =====================================
   NHIỆM VỤ 2
===================================== */

function claimAd2() {

  checkDailyTasks();

  if (
    player.tasks.ad2Count >=
    TASK_AD2_LIMIT
  ) {

    alert(
      "⚠️ Bạn đã hết 10 lượt hôm nay."
    );

    return;
  }

  const cooldown =
    getRemainingCooldown(
      player.tasks.ad2LastClaim,
      TASK_COOLDOWN_AD2
    );

  if (cooldown > 0) {

    alert(
      `⏳ Bạn cần chờ ${formatCooldown(cooldown)}.`
    );

    return;
  }

  simulateAd(
    () => {

      const reward =
        Math.floor(
          Math.random() * 3
        ) + 1;

      player.fertilizer +=
        reward;

      player.tasks.ad2Count +=
        1;

      player.tasks.ad2LastClaim =
        Date.now();

      updateHUD();

      saveGame();

      renderTasks();

      alert(
        `🎉 Nhận thành công!\n+${reward} 🧪`
      );
    }
  );
}


/* =====================================
   NHIỆM VỤ 3
===================================== */

function claimAd3() {

  checkDailyTasks();

  if (
    player.tasks.ad3Count >=
    TASK_AD3_LIMIT
  ) {

    alert(
      "⚠️ Bạn đã hết 20 lượt hôm nay."
    );

    return;
  }

  const cooldown =
    getRemainingCooldown(
      player.tasks.ad3LastClaim,
      TASK_COOLDOWN_AD3
    );

  if (cooldown > 0) {

    alert(
      `⏳ Bạn cần chờ ${formatCooldown(cooldown)}.`
    );

    return;
  }

  simulateAd(
    () => {

      const reward =
        Math.floor(
          Math.random() * 101
        ) + 50;

      player.coins +=
        reward;

      player.tasks.ad3Count +=
        1;

      player.tasks.ad3LastClaim =
        Date.now();

      updateHUD();

      saveGame();

      renderTasks();

      alert(
        `🎉 Nhận thành công!\n+${formatNumber(reward)} 🪙`
      );
    }
  );
}


/* =====================================
   NHIỆM VỤ 4
===================================== */

function claimAd4() {

  checkDailyTasks();

  if (
    player.tasks.ad4Count >=
    TASK_AD4_LIMIT
  ) {

    alert(
      "⚠️ Bạn đã hết 5 lượt hôm nay."
    );

    return;
  }

  const cooldown =
    getRemainingCooldown(
      player.tasks.ad4LastClaim,
      TASK_COOLDOWN_AD4
    );

  if (cooldown > 0) {

    alert(
      `⏳ Bạn cần chờ ${formatCooldown(cooldown)}.`
    );

    return;
  }

  simulateAd(
    () => {

      player.autoCareCards +=
        1;

      player.tasks.ad4Count +=
        1;

      player.tasks.ad4LastClaim =
        Date.now();

      saveGame();

      renderTasks();

      alert(
        "🎉 Nhận thành công!\n" +
        "+1 thẻ tự động chăm sóc 3 giờ 🛡️"
      );
    }
  );
}


/* =====================================
   CLICK NHIỆM VỤ
===================================== */

function handleTaskClick(
  taskId
) {

  switch (taskId) {

    case "ad1":

      claimAd1();

      break;

    case "ad2":

      claimAd2();

      break;

    case "ad3":

      claimAd3();

      break;

    case "ad4":

      claimAd4();

      break;

    case "group":

      alert(
        "🔒 Nhiệm vụ này sẽ được Bot Telegram xác minh khi hệ thống Bot được kết nối."
      );

      break;

    case "channel":

      alert(
        "🔒 Nhiệm vụ này sẽ được Bot Telegram xác minh khi hệ thống Bot được kết nối."
      );

      break;
  }
}


/* =====================================
   CLICK Ô ĐẤT
===================================== */

plots.forEach((plot) => {

  plot.addEventListener(
    "click",
    () => {

      const number =
        Number(
          plot.dataset.plot
        );

      if (
        number >
        player.unlockedPlots
      ) {

        unlockPlot(
          number
        );

        return;
      }

      const data =
        player.plots[number];

      if (!data) {

        openSeedPanel(
          plot
        );

        return;
      }

      if (
        plot.dataset.ready ===
        "true"
      ) {

        harvestPlot(
          plot
        );

        return;
      }

      const fertilizerQuestion =
        confirm(
          "🌱 Cây đang lớn.\n\n" +
          "Bấm OK để dùng 1 phân bón.\n" +
          "Bấm Hủy để đóng."
        );

      if (
        fertilizerQuestion
      ) {

        useFertilizer(
          plot
        );
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

    selectedPlot =
      null;

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
   MENU NHIỆM VỤ
===================================== */

tasksMenu.addEventListener(
  "click",
  () => {

    checkDailyTasks();

    renderTasks();

    tasksPanel.classList.add(
      "show"
    );

    tasksPanel.setAttribute(
      "aria-hidden",
      "false"
    );

  }
);


/* =====================================
   ĐÓNG NHIỆM VỤ
===================================== */

tasksClose.addEventListener(
  "click",
  () => {

    tasksPanel.classList.remove(
      "show"
    );

    tasksPanel.setAttribute(
      "aria-hidden",
      "true"
    );

  }
);


/* =====================================
   CLICK NGOÀI BẢNG NHIỆM VỤ
===================================== */

tasksPanel.addEventListener(
  "click",
  (event) => {

    if (
      event.target ===
      tasksPanel
    ) {

      tasksPanel.classList.remove(
        "show"
      );

      tasksPanel.setAttribute(
        "aria-hidden",
        "true"
      );
    }

  }
);


/* =====================================
   CLICK NÚT NHIỆM VỤ
===================================== */

tasksList.addEventListener(
  "click",
  (event) => {

    const button =
      event.target.closest(
        "[data-task]"
      );

    if (!button) {

      return;
    }

    const taskId =
      button.dataset.task;

    if (!taskId) {

      return;
    }

    handleTaskClick(
      taskId
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

      if (tasksPanel) {

        tasksPanel.classList.remove(
          "show"
        );

        tasksPanel.setAttribute(
          "aria-hidden",
          "true"
        );
      }
    }

  }
);


/* =====================================
   KHỞI ĐỘNG
===================================== */

async function initGame() {

  /*
    Vẫn load game local trước
    để không phá dữ liệu hiện tại.
  */

  loadGame();

  checkDailyTasks();

  updateHUD();

  updatePlotsLockState();

  plots.forEach(
    (plot) => {

      const number =
        Number(
          plot.dataset.plot
        );

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

  if (tasksPanel) {

    renderTasks();
  }

  updateAllPlants();


  /*
    KẾT NỐI TELEGRAM + BACKEND
  */

  await authenticateTelegram();

  showServerData();

}


initGame();


/* =====================================
   CẬP NHẬT THỜI GIAN
===================================== */

setInterval(
  updateAllPlants,
  1000
);


/* =====================================
   CẬP NHẬT NHIỆM VỤ MỖI GIÂY
===================================== */

setInterval(
  () => {

    if (
      tasksPanel &&
      tasksPanel.classList.contains(
        "show"
      )
    ) {

      renderTasks();
    }

  },
  1000
);
