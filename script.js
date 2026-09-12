"use strict";

/* =========================================================
   NÔNG TRẠI XANH
   Frontend script - Telegram Mini App

   Kiến trúc:
   Telegram Mini App
        ↓ initData
   Render Backend
        ↓
   Supabase

   QUAN TRỌNG:
   - Không lưu coins / level / inventory vào localStorage.
   - Không tin dữ liệu do client tự gửi.
   - Backend phải kiểm tra Telegram initData.
   - Backend quyết định giá, thời gian trồng, phần thưởng.
========================================================= */


/* =========================================================
   CONFIG
========================================================= */

const BACKEND_URL = "https://telegram-farm-backend-lpiz.onrender.com";

const TOTAL_PLOTS = 20;
const FREE_PLOTS = 3;

const EXP_PER_LEVEL = 7000;

const REQUEST_TIMEOUT = 45000;
const MAX_RETRIES = 2;


/* =========================================================
   SEEDS
========================================================= */

const SEEDS = {
  wheat: {
    name: "Lúa mì",
    emoji: "🌾",
    level: 1,
    buyPrice: 10,
    sellPrice: 12,
    growSeconds: 20 * 60
  },

  corn: {
    name: "Bắp",
    emoji: "🌽",
    level: 3,
    buyPrice: 20,
    sellPrice: 25,
    growSeconds: 60 * 60
  },

  radish: {
    name: "Củ cải",
    emoji: "🥕",
    level: 7,
    buyPrice: 35,
    sellPrice: 40,
    growSeconds: 90 * 60
  },

  carrot: {
    name: "Cà rốt",
    emoji: "🥕",
    level: 10,
    buyPrice: 50,
    sellPrice: 75,
    growSeconds: 150 * 60
  },

  beet: {
    name: "Củ dền",
    emoji: "🫜",
    level: 13,
    buyPrice: 75,
    sellPrice: 88,
    growSeconds: 280 * 60
  },

  eggplant: {
    name: "Cà tím",
    emoji: "🍆",
    level: 15,
    buyPrice: 100,
    sellPrice: 125,
    growSeconds: 450 * 60
  },

  chili: {
    name: "Ớt",
    emoji: "🌶️",
    level: 17,
    buyPrice: 180,
    sellPrice: 210,
    growSeconds: 650 * 60
  },

  greenOnion: {
    name: "Hành lá",
    emoji: "🌱",
    level: 20,
    buyPrice: 250,
    sellPrice: 350,
    growSeconds: 870 * 60
  },

  cabbage: {
    name: "Bắp cải",
    emoji: "🥬",
    level: 23,
    buyPrice: 500,
    sellPrice: 750,
    growSeconds: 950 * 60
  },

  pumpkin: {
    name: "Bí đỏ",
    emoji: "🎃",
    level: 25,
    buyPrice: 1000,
    sellPrice: 1250,
    growSeconds: 1200 * 60
  }
};


/* =========================================================
   GAME STATE
========================================================= */

let gameState = {
  player: null,
  plots: [],
  inventory: []
};


/* =========================================================
   GLOBAL STATE
========================================================= */

let telegram = null;
let initData = "";

let selectedPlot = null;

let countdownTimer = null;

let isLoading = false;
let isAuthenticating = false;
let gameStarted = false;

let toastTimer = null;


/* =========================================================
   DOM REFERENCES
========================================================= */

let levelNumber = null;
let levelValue = null;
let expFill = null;
let expText = null;
let coinValue = null;
let fertilizerValue = null;

let seedPanel = null;
let seedClose = null;
let seedList = null;

let shopPanel = null;
let shopClose = null;
let shopTotalValue = null;
let shopList = null;

let tasksPanel = null;
let tasksClose = null;
let tasksList = null;

let shopMenu = null;
let seedMenu = null;
let inventoryMenu = null;
let tasksMenu = null;
let settingsMenu = null;


/* =========================================================
   INIT DOM
========================================================= */

function cacheDOM() {
  levelNumber = document.getElementById("levelNumber");
  levelValue = document.getElementById("levelValue");

  expFill = document.getElementById("expFill");
  expText = document.getElementById("expText");

  coinValue = document.getElementById("coinValue");
  fertilizerValue = document.getElementById("fertilizerValue");

  seedPanel = document.getElementById("seedPanel");
  seedClose = document.getElementById("seedClose");
  seedList = document.getElementById("seedList");

  shopPanel = document.getElementById("shopPanel");
  shopClose = document.getElementById("shopClose");
  shopTotalValue = document.getElementById("shopTotalValue");
  shopList = document.getElementById("shopList");

  tasksPanel = document.getElementById("tasksPanel");
  tasksClose = document.getElementById("tasksClose");
  tasksList = document.getElementById("tasksList");

  shopMenu = document.getElementById("shopMenu");
  seedMenu = document.getElementById("seedMenu");
  inventoryMenu = document.getElementById("inventoryMenu");
  tasksMenu = document.getElementById("tasksMenu");
  settingsMenu = document.getElementById("settingsMenu");
}


/* =========================================================
   TELEGRAM
========================================================= */

function initTelegram() {
  try {
    if (!window.Telegram || !window.Telegram.WebApp) {
      console.error("❌ Telegram WebApp SDK không tồn tại.");

      showMessage(
        "Không tìm thấy Telegram WebApp. Hãy mở game từ Telegram.",
        "error"
      );

      return false;
    }

    telegram = window.Telegram.WebApp;

    telegram.ready();
    telegram.expand();

    try {
      telegram.setHeaderColor("#0788df");
    } catch (error) {
      console.warn("Không setHeaderColor được:", error);
    }

    try {
      telegram.setBackgroundColor("#0788df");
    } catch (error) {
      console.warn("Không setBackgroundColor được:", error);
    }

    initData = telegram.initData || "";

    console.log("=================================");
    console.log("TELEGRAM MINI APP");
    console.log("SDK:", !!telegram);
    console.log("initData:", !!initData);
    console.log("initData length:", initData.length);

    if (telegram.initDataUnsafe && telegram.initDataUnsafe.user) {
      console.log(
        "Telegram user ID:",
        telegram.initDataUnsafe.user.id
      );

      console.log(
        "Telegram username:",
        telegram.initDataUnsafe.user.username
      );
    }

    console.log("Platform:", telegram.platform);
    console.log("Version:", telegram.version);
    console.log("=================================");

    if (!initData) {
      showMessage(
        "Không nhận được Telegram initData. Hãy mở Mini App trực tiếp trong Telegram.",
        "error"
      );

      return false;
    }

    return true;
  } catch (error) {
    console.error("initTelegram error:", error);

    showMessage(
      "Không thể khởi tạo Telegram Mini App.",
      "error"
    );

    return false;
  }
}


/* =========================================================
   NETWORK HELPERS
========================================================= */

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


async function fetchWithTimeout(
  url,
  options = {},
  timeout = REQUEST_TIMEOUT
) {
  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeoutId);
  }
}


async function apiRequest(
  endpoint,
  body = {},
  options = {}
) {
  if (!BACKEND_URL) {
    throw new Error("BACKEND_URL chưa được cấu hình.");
  }

  if (!initData) {
    throw new Error("Thiếu Telegram initData.");
  }

  const method = options.method || "POST";

  const requestBody = {
    initData,
    ...body
  };

  let lastError = null;

  for (
    let attempt = 0;
    attempt <= MAX_RETRIES;
    attempt++
  ) {
    try {
      const response =
        await fetchWithTimeout(
          `${BACKEND_URL}${endpoint}`,
          {
            method,
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
          }
        );

      let data = null;

      try {
        data = await response.json();
      } catch (jsonError) {
        throw new Error(
          `Backend trả về dữ liệu không hợp lệ (${response.status}).`
        );
      }

      if (!response.ok) {
        const message =
          data?.error ||
          data?.message ||
          `Request thất bại (${response.status})`;

        const error =
          new Error(message);

        error.status =
          response.status;

        error.data =
          data;

        if (
          attempt < MAX_RETRIES &&
          [502, 503, 504].includes(
            response.status
          )
        ) {
          lastError = error;

          await sleep(
            800 * (attempt + 1)
          );

          continue;
        }

        throw error;
      }

      return data;

    } catch (error) {
      lastError = error;

      if (
        error.name === "AbortError"
      ) {
        if (attempt < MAX_RETRIES) {
          await sleep(
            800 * (attempt + 1)
          );

          continue;
        }

        throw new Error(
          "Backend phản hồi quá lâu. Vui lòng thử lại."
        );
      }

      if (
        !error.status &&
        attempt < MAX_RETRIES
      ) {
        await sleep(
          800 * (attempt + 1)
        );

        continue;
      }

      throw error;
    }
  }

  throw (
    lastError ||
    new Error("Request thất bại.")
  );
}


/* =========================================================
   AUTHENTICATION
========================================================= */

async function authenticateTelegram() {
  if (isAuthenticating) {
    return false;
  }

  isAuthenticating = true;

  try {
    showLoading(
      "Đang xác thực Telegram..."
    );

    const result =
      await apiRequest(
        "/api/auth/telegram"
      );

    if (
      !result ||
      !result.player
    ) {
      throw new Error(
        "Backend không trả về thông tin người chơi."
      );
    }

    gameState.player =
      result.player;

    gameState.plots =
      Array.isArray(
        result.plots
      )
        ? result.plots
        : [];

    gameState.inventory =
      Array.isArray(
        result.inventory
      )
        ? result.inventory
        : [];

    console.log(
      "✅ Telegram authentication thành công."
    );

    console.log(
      "Player:",
      gameState.player
    );

    renderAll();

    return true;

  } catch (error) {
    console.error(
      "authenticateTelegram error:",
      error
    );

    showMessage(
      error.message ||
        "Không thể xác thực Telegram.",
      "error"
    );

    return false;

  } finally {
    isAuthenticating =
      false;

    hideLoading();
  }
}


/* =========================================================
   LOAD GAME STATE
========================================================= */

async function loadGameState(
  showError = true
) {
  try {
    const result =
      await apiRequest(
        "/api/game/state"
      );

    if (!result) {
      throw new Error(
        "Backend không trả về game state."
      );
    }

    if (result.player) {
      gameState.player =
        result.player;
    }

    gameState.plots =
      Array.isArray(
        result.plots
      )
        ? result.plots
        : [];

    gameState.inventory =
      Array.isArray(
        result.inventory
      )
        ? result.inventory
        : [];

    renderAll();

    return true;

  } catch (error) {
    console.error(
      "loadGameState error:",
      error
    );

    if (showError) {
      showMessage(
        error.message ||
          "Không thể tải dữ liệu nông trại.",
        "error"
      );
    }

    return false;
  }
}


/* =========================================================
   PLAYER RENDER
========================================================= */

function renderPlayer() {
  const player =
    gameState.player;

  if (!player) {
    return;
  }

  const level =
    Number(player.level) || 1;

  const exp =
    Number(player.exp) || 0;

  const coins =
    Number(player.coins) || 0;

  const fertilizer =
    Number(player.fertilizer) || 0;

  if (levelNumber) {
    levelNumber.textContent =
      level;
  }

  if (levelValue) {
    levelValue.textContent =
      `Lv.${level}`;
  }

  if (coinValue) {
    coinValue.textContent =
      formatNumber(coins);
  }

  if (fertilizerValue) {
    fertilizerValue.textContent =
      formatNumber(fertilizer);
  }

  const expInLevel =
    Math.max(
      0,
      exp % EXP_PER_LEVEL
    );

  const percentage =
    Math.min(
      100,
      (expInLevel /
        EXP_PER_LEVEL) *
        100
    );

  if (expFill) {
    expFill.style.width =
      `${percentage}%`;
  }

  if (expText) {
    expText.textContent =
      `${formatNumber(
        expInLevel
      )} / ${formatNumber(
        EXP_PER_LEVEL
      )}`;
  }
}


/* =========================================================
   PLOT HELPERS
========================================================= */

function isUnlocked(plot) {
  if (!plot) {
    return false;
  }

  return (
    plot.unlocked === true ||
    plot.unlocked === 1 ||
    plot.unlocked === "true"
  );
}


function normalizePlotNumber(value) {
  const number =
    Number(value);

  if (!Number.isInteger(number)) {
    return null;
  }

  if (
    number < 1 ||
    number > TOTAL_PLOTS
  ) {
    return null;
  }

  return number;
}


function getPlot(plotNumber) {
  const number =
    normalizePlotNumber(
      plotNumber
    );

  if (!number) {
    return null;
  }

  return (
    gameState.plots.find(
      plot =>
        Number(
          plot.plot_number
        ) === number
    ) || null
  );
}


function getUnlockPrice(
  plotNumber
) {
  const number =
    normalizePlotNumber(
      plotNumber
    );

  if (!number) {
    return 0;
  }

  if (
    number <= FREE_PLOTS
  ) {
    return 0;
  }

  return (
    500 *
    Math.pow(
      2,
      number - 4
    )
  );
}


/* =========================================================
   RENDER PLOTS
========================================================= */

function renderPlots() {
  const plotElements =
    document.querySelectorAll(
      ".plot[data-plot]"
    );

  if (!plotElements.length) {
    console.warn(
      "⚠️ Không tìm thấy .plot[data-plot]"
    );

    return;
  }

  plotElements.forEach(
    plotElement => {
      const plotNumber =
        normalizePlotNumber(
          plotElement.dataset.plot
        );

      if (!plotNumber) {
        return;
      }

      const serverPlot =
        getPlot(plotNumber);

      const unlocked =
        serverPlot
          ? isUnlocked(serverPlot)
          : false;

      plotElement.classList.toggle(
        "unlocked",
        unlocked
      );

      plotElement.classList.toggle(
        "locked",
        !unlocked
      );

      plotElement
        .querySelectorAll(
          ".crop-image, .crop-name, .grow-time, .plot-price, .fertilizer-button, .harvest-button"
        )
        .forEach(
          element => {
            element.remove();
          }
        );

      if (!unlocked) {
        renderLockedPlot(
          plotElement,
          plotNumber
        );

        return;
      }

      const cropType =
        serverPlot?.crop_type ||
        null;

      if (!cropType) {
        return;
      }

      renderCrop(
        plotElement,
        serverPlot
      );
    }
  );
}


/* =========================================================
   RENDER LOCKED PLOT
========================================================= */

function renderLockedPlot(
  plotElement,
  plotNumber
) {
  let lockElement =
    plotElement.querySelector(
      ".lock"
    );

  if (!lockElement) {
    lockElement =
      document.createElement(
        "div"
      );

    lockElement.className =
      "lock";

    plotElement.appendChild(
      lockElement
    );
  }

  lockElement.textContent =
    "🔒";

  const price =
    getUnlockPrice(
      plotNumber
    );

  const priceElement =
    document.createElement(
      "div"
    );

  priceElement.className =
    "plot-price";

  if (price === 0) {
    priceElement.textContent =
      "MỞ MIỄN PHÍ";
  } else {
    priceElement.textContent =
      `💰 ${formatNumber(
        price
      )}`;
  }

  plotElement.appendChild(
    priceElement
  );
}


/* =========================================================
   RENDER CROP
========================================================= */

function renderCrop(
  plotElement,
  plot
) {
  const cropType =
    String(
      plot.crop_type || ""
    );

  const seed =
    SEEDS[cropType];

  if (!seed) {
    console.warn(
      "Không tìm thấy seed:",
      cropType
    );

    return;
  }

  const cropImage =
    document.createElement(
      "div"
    );

  cropImage.className =
    "crop-image";

  cropImage.textContent =
    seed.emoji;

  cropImage.setAttribute(
    "aria-hidden",
    "true"
  );

  cropImage.style.pointerEvents =
    "none";

  plotElement.appendChild(
    cropImage
  );

  const cropName =
    document.createElement(
      "div"
    );

  cropName.className =
    "crop-name";

  cropName.textContent =
    seed.name;

  cropName.style.pointerEvents =
    "none";

  plotElement.appendChild(
    cropName
  );

  const growTime =
    document.createElement(
      "div"
    );

  growTime.className =
    "grow-time";

  growTime.dataset.harvestAt =
    plot.harvest_at || "";

  growTime.style.pointerEvents =
    "none";

  plotElement.appendChild(
    growTime
  );
}


/* =========================================================
   COUNTDOWN
========================================================= */

function startCountdown() {
  if (countdownTimer) {
    clearInterval(
      countdownTimer
    );
  }

  updateCountdowns();

  countdownTimer =
    setInterval(
      updateCountdowns,
      1000
    );
}


function updateCountdowns() {
  document
    .querySelectorAll(
      ".grow-time[data-harvest-at]"
    )
    .forEach(
      element => {
        const harvestAt =
          element.dataset.harvestAt;

        if (!harvestAt) {
          element.textContent =
            "";

          return;
        }

        const remaining =
          getRemainingMs(
            harvestAt
          );

        if (
          remaining <= 0
        ) {
          element.textContent =
            "✅ Sẵn sàng";

          element.classList.add(
            "ready"
          );
        } else {
          element.textContent =
            `⏱ ${getCountdownText(
              remaining
            )}`;

          element.classList.remove(
            "ready"
          );
        }
      }
    );
}


function getRemainingMs(
  harvestAt
) {
  const timestamp =
    new Date(
      harvestAt
    ).getTime();

  if (
    !Number.isFinite(
      timestamp
    )
  ) {
    return 0;
  }

  return (
    timestamp -
    Date.now()
  );
}


function getCountdownText(
  remainingMs
) {
  const totalSeconds =
    Math.max(
      0,
      Math.floor(
        remainingMs / 1000
      )
    );

  const days =
    Math.floor(
      totalSeconds /
        86400
    );

  const hours =
    Math.floor(
      (totalSeconds %
        86400) /
        3600
    );

  const minutes =
    Math.floor(
      (totalSeconds %
        3600) /
        60
    );

  const seconds =
    totalSeconds %
    60;

  if (days > 0) {
    return `${days}d ${String(
      hours
    ).padStart(
      2,
      "0"
    )}h`;
  }

  if (hours > 0) {
    return `${hours}h ${String(
      minutes
    ).padStart(
      2,
      "0"
    )}m`;
  }

  return `${String(
    minutes
  ).padStart(
    2,
    "0"
  )}:${String(
    seconds
  ).padStart(
    2,
    "0"
  )}`;
}


/* =========================================================
   PLOT EVENTS
========================================================= */

function setupPlotEvents() {
  const plotElements =
    document.querySelectorAll(
      ".plot[data-plot]"
    );

  console.log(
    `🌱 Tìm thấy ${plotElements.length} ô đất.`
  );

  if (!plotElements.length) {
    console.warn(
      "⚠️ Không có ô đất để gắn sự kiện."
    );

    return;
  }

  plotElements.forEach(
    plotElement => {
      if (
        plotElement.dataset
          .clickReady ===
        "true"
      ) {
        return;
      }

      plotElement.dataset
        .clickReady =
        "true";

      plotElement.style.pointerEvents =
        "auto";

      plotElement.style.touchAction =
        "manipulation";

      plotElement.addEventListener(
        "click",
        async event => {
          event.preventDefault();
          event.stopPropagation();

          const plotNumber =
            normalizePlotNumber(
              plotElement.dataset.plot
            );

          console.log(
            "🟢 CLICK Ô ĐẤT:",
            plotNumber
          );

          if (!plotNumber) {
            return;
          }

          await handlePlotClick(
            plotNumber
          );
        },
        {
          passive: false
        }
      );
    }
  );
}


/* =========================================================
   HANDLE PLOT CLICK
========================================================= */

async function handlePlotClick(
  plotNumber
) {
  if (isLoading) {
    console.log(
      "⏳ Đang xử lý request."
    );

    return;
  }

  if (isAuthenticating) {
    console.log(
      "⏳ Đang xác thực."
    );

    return;
  }

  const plot =
    getPlot(plotNumber);

  console.log(
    "📦 Plot state:",
    plot
  );

  if (!plot) {
    const loaded =
      await loadGameState();

    if (!loaded) {
      return;
    }

    const retryPlot =
      getPlot(plotNumber);

    if (!retryPlot) {
      showMessage(
        "Không tìm thấy dữ liệu ô đất.",
        "error"
      );

      return;
    }

    return handlePlotClick(
      plotNumber
    );
  }

  if (!isUnlocked(plot)) {
    await unlockPlot(
      plotNumber
    );

    return;
  }

  if (!plot.crop_type) {
    selectedPlot =
      plotNumber;

    openSeedPanel(
      plotNumber
    );

    return;
  }

  if (
    isCropReady(plot)
  ) {
    await harvestPlot(
      plotNumber
    );

    return;
  }

  showPlotActions(
    plotNumber
  );
}


/* =========================================================
   CROP READY
========================================================= */

function isCropReady(plot) {
  if (
    !plot ||
    !plot.crop_type
  ) {
    return false;
  }

  if (!plot.harvest_at) {
    return false;
  }

  return (
    getRemainingMs(
      plot.harvest_at
    ) <= 0
  );
}


/* =========================================================
   UNLOCK PLOT
========================================================= */

async function unlockPlot(
  plotNumber
) {
  const price =
    getUnlockPrice(
      plotNumber
    );

  const player =
    gameState.player;

  if (!player) {
    return;
  }

  const coins =
    Number(
      player.coins
    ) || 0;

  if (price > 0) {
    if (coins < price) {
      showMessage(
        `Bạn cần ${formatNumber(
          price
        )} xu để mở ô này.`,
        "error"
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Mở ô đất ${plotNumber} với giá ${formatNumber(
          price
        )} xu?`
      );

    if (!confirmed) {
      return;
    }

  } else {
    const confirmed =
      window.confirm(
        `Mở ô đất ${plotNumber}?`
      );

    if (!confirmed) {
      return;
    }
  }

  try {
    setLoading(
      true,
      "Đang mở ô đất..."
    );

    const result =
      await apiRequest(
        "/api/game/unlock-plot",
        {
          plotNumber
        }
      );

    if (result.player) {
      gameState.player =
        result.player;
    }

    if (
      Array.isArray(
        result.plots
      )
    ) {
      gameState.plots =
        result.plots;
    } else {
      const localPlot =
        getPlot(
          plotNumber
        );

      if (localPlot) {
        localPlot.unlocked =
          true;
      }
    }

    renderAll();

    showMessage(
      `🎉 Đã mở ô đất ${plotNumber}!`,
      "success"
    );

  } catch (error) {
    console.error(
      "unlockPlot error:",
      error
    );

    showMessage(
      error.message ||
        "Không thể mở ô đất.",
      "error"
    );

  } finally {
    setLoading(false);
  }
}


/* =========================================================
   SEED PANEL
========================================================= */

function openSeedPanel(
  plotNumber
) {
  const plot =
    getPlot(plotNumber);

  if (!plot) {
    showMessage(
      "Không tìm thấy ô đất.",
      "error"
    );

    return;
  }

  if (!isUnlocked(plot)) {
    showMessage(
      "Ô đất này chưa được mở.",
      "error"
    );

    return;
  }

  if (plot.crop_type) {
    showMessage(
      "Ô đất này đang có cây.",
      "error"
    );

    return;
  }

  selectedPlot =
    plotNumber;

  renderSeedList();

  showPanel(
    seedPanel
  );
}


function closeSeedPanel() {
  hidePanel(
    seedPanel
  );

  selectedPlot =
    null;
}


/* =========================================================
   RENDER SEED LIST
========================================================= */

function renderSeedList() {
  if (!seedList) {
    return;
  }

  seedList.innerHTML = "";

  const playerLevel =
    Number(
      gameState.player?.level
    ) || 1;

  Object.entries(
    SEEDS
  ).forEach(
    ([seedKey, seed]) => {
      const amount =
        getInventoryAmount(
          seedKey
        );

      const unlocked =
        playerLevel >=
        seed.level;

      const item =
        document.createElement(
          "div"
        );

      item.className =
        "seed-item";

      if (!unlocked) {
        item.classList.add(
          "locked"
        );
      }

      /* -----------------------------------------
         THÔNG TIN HẠT
      ----------------------------------------- */

      const info =
        document.createElement(
          "div"
        );

      info.className =
        "seed-info";

      info.innerHTML = `
        <div class="seed-icon">
          ${seed.emoji}
        </div>

        <div class="seed-details">
          <strong>
            ${escapeHtml(
              seed.name
            )}
          </strong>

          <small>
            🔓 Lv.${seed.level}
          </small>

          <small>
            🌱 Có: ${formatNumber(
              amount
            )}
          </small>

          <small>
            💰 ${formatNumber(
              seed.buyPrice
            )} xu
          </small>

          <small>
            ⏱️ ${formatGrowTime(
              seed.growSeconds
            )}
          </small>
        </div>
      `;

      item.appendChild(
        info
      );


      /* -----------------------------------------
         KHU VỰC NÚT
      ----------------------------------------- */

      const actions =
        document.createElement(
          "div"
        );

      actions.className =
        "seed-actions";


      /* -----------------------------------------
         NÚT MUA 1
      ----------------------------------------- */

      const buyOneButton =
        document.createElement(
          "button"
        );

      buyOneButton.type =
        "button";

      buyOneButton.className =
        "seed-buy-button";

      buyOneButton.textContent =
        "Mua 1";

      buyOneButton.disabled =
        !unlocked;

      buyOneButton.title =
        unlocked
          ? `Mua 1 ${seed.name}`
          : `Cần Lv.${seed.level}`;

      buyOneButton.addEventListener(
        "click",
        async event => {
          event.preventDefault();
          event.stopPropagation();

          if (!unlocked) {
            showMessage(
              `Cần đạt Lv.${seed.level} để mua ${seed.name}.`,
              "error"
            );

            return;
          }

          await buySeed(
            seedKey,
            1
          );
        }
      );

      actions.appendChild(
        buyOneButton
      );


      /* -----------------------------------------
         NÚT MUA 10
      ----------------------------------------- */

      const buyTenButton =
        document.createElement(
          "button"
        );

      buyTenButton.type =
        "button";

      buyTenButton.className =
        "seed-buy-button";

      buyTenButton.textContent =
        "Mua 10";

      buyTenButton.disabled =
        !unlocked;

      buyTenButton.title =
        unlocked
          ? `Mua 10 ${seed.name}`
          : `Cần Lv.${seed.level}`;

      buyTenButton.addEventListener(
        "click",
        async event => {
          event.preventDefault();
          event.stopPropagation();

          if (!unlocked) {
            showMessage(
              `Cần đạt Lv.${seed.level} để mua ${seed.name}.`,
              "error"
            );

            return;
          }

          await buySeed(
            seedKey,
            10
          );
        }
      );

      actions.appendChild(
        buyTenButton
      );


      /* -----------------------------------------
         NÚT TRỒNG
      ----------------------------------------- */

      const plantButton =
        document.createElement(
          "button"
        );

      plantButton.type =
        "button";

      plantButton.className =
        "seed-plant-button";

      plantButton.textContent =
        "Trồng";

      plantButton.disabled =
        !unlocked ||
        amount <= 0;

      if (!unlocked) {
        plantButton.title =
          `Cần Lv.${seed.level}`;
      } else if (
        amount <= 0
      ) {
        plantButton.title =
          "Bạn chưa có hạt này";
      } else {
        plantButton.title =
          `Trồng ${seed.name}`;
      }

      plantButton.addEventListener(
        "click",
        async event => {
          event.preventDefault();
          event.stopPropagation();

          if (!unlocked) {
            showMessage(
              `Cần đạt Lv.${seed.level} để trồng ${seed.name}.`,
              "error"
            );

            return;
          }

          if (amount <= 0) {
            showMessage(
              `Bạn chưa có ${seed.name}. Hãy mua hạt trước.`,
              "error"
            );

            return;
          }

          await plantSeed(
            seedKey
          );
        }
      );

      actions.appendChild(
        plantButton
      );

      item.appendChild(
        actions
      );


      /* -----------------------------------------
         THÔNG BÁO KHÓA
      ----------------------------------------- */

      if (!unlocked) {
        const lockedMessage =
          document.createElement(
            "div"
          );

        lockedMessage.className =
          "seed-locked";

        lockedMessage.textContent =
          `🔒 Cần Lv.${seed.level}`;

        item.appendChild(
          lockedMessage
        );
      }

      seedList.appendChild(
        item
      );
    }
  );
}


/* =========================================================
   FORMAT GROW TIME
========================================================= */

function formatGrowTime(
  seconds
) {
  const totalSeconds =
    Number(seconds) || 0;

  if (
    totalSeconds <= 0
  ) {
    return "0 phút";
  }

  const minutes =
    Math.floor(
      totalSeconds / 60
    );

  if (
    minutes < 60
  ) {
    return `${minutes} phút`;
  }

  const hours =
    Math.floor(
      minutes / 60
    );

  const remainingMinutes =
    minutes % 60;

  if (
    remainingMinutes === 0
  ) {
    return `${hours} giờ`;
  }

  return `${hours} giờ ${remainingMinutes} phút`;
}


/* =========================================================
   PLANT SEED
========================================================= */

async function plantSeed(
  seedKey
) {
  if (!selectedPlot) {
    showMessage(
      "Chưa chọn ô đất.",
      "error"
    );

    return;
  }

  const seed =
    SEEDS[seedKey];

  if (!seed) {
    showMessage(
      "Hạt giống không hợp lệ.",
      "error"
    );

    return;
  }

  const plot =
    getPlot(
      selectedPlot
    );

  if (!plot) {
    showMessage(
      "Không tìm thấy ô đất.",
      "error"
    );

    return;
  }

  if (!isUnlocked(plot)) {
    showMessage(
      "Ô đất chưa mở.",
      "error"
    );

    return;
  }

  if (plot.crop_type) {
    showMessage(
      "Ô đất đang có cây.",
      "error"
    );

    return;
  }

  const amount =
    getInventoryAmount(
      seedKey
    );

  if (amount <= 0) {
    showMessage(
      "Bạn không có hạt giống này.",
      "error"
    );

    return;
  }

  try {
    setLoading(
      true,
      "Đang gieo hạt..."
    );

    const result =
      await apiRequest(
        "/api/game/plant",
        {
          plotNumber:
            selectedPlot,
          seedKey
        }
      );

    if (result.player) {
      gameState.player =
        result.player;
    }

    if (
      Array.isArray(
        result.plots
      )
    ) {
      gameState.plots =
        result.plots;
    }

    if (
      Array.isArray(
        result.inventory
      )
    ) {
      gameState.inventory =
        result.inventory;
    }

    if (result.plot) {
      replacePlot(
        result.plot
      );
    }

    closeSeedPanel();

    renderAll();

    showMessage(
      `🌱 Đã trồng ${seed.name}!`,
      "success"
    );

  } catch (error) {
    console.error(
      "plantSeed error:",
      error
    );

    showMessage(
      error.message ||
        "Không thể trồng cây.",
      "error"
    );

  } finally {
    setLoading(false);
  }
}


/* =========================================================
   FERTILIZER
========================================================= */

function showPlotActions(
  plotNumber
) {
  const plot =
    getPlot(plotNumber);

  if (!plot) {
    return;
  }

  if (!plot.crop_type) {
    return;
  }

  if (
    isCropReady(plot)
  ) {
    harvestPlot(
      plotNumber
    );

    return;
  }

  const fertilizer =
    Number(
      gameState.player?.fertilizer
    ) || 0;

  if (fertilizer <= 0) {
    showMessage(
      "Bạn không còn phân bón.",
      "error"
    );

    return;
  }

  const seed =
    SEEDS[
      plot.crop_type
    ];

  const cropName =
    seed
      ? seed.name
      : "cây trồng";

  const confirmed =
    window.confirm(
      `Dùng 1 phân bón cho ${cropName}?\n\nThời gian sẽ được giảm theo quy tắc của máy chủ.`
    );

  if (!confirmed) {
    return;
  }

  fertilizePlot(
    plotNumber
  );
}


async function fertilizePlot(
  plotNumber
) {
  try {
    setLoading(
      true,
      "Đang bón phân..."
    );

    const result =
      await apiRequest(
        "/api/game/fertilize",
        {
          plotNumber
        }
      );

    if (result.player) {
      gameState.player =
        result.player;
    }

    if (
      Array.isArray(
        result.plots
      )
    ) {
      gameState.plots =
        result.plots;
    }

    if (result.plot) {
      replacePlot(
        result.plot
      );
    }

    renderAll();

    const reduction =
      Number(
        result.reductionMinutes
      ) || 0;

    if (reduction > 0) {
      showMessage(
        `⚡ Đã dùng phân bón! Giảm ${reduction} phút.`,
        "success"
      );
    } else {
      showMessage(
        "⚡ Đã dùng phân bón!",
        "success"
      );
    }

  } catch (error) {
    console.error(
      "fertilizePlot error:",
      error
    );

    showMessage(
      error.message ||
        "Không thể dùng phân bón.",
      "error"
    );

  } finally {
    setLoading(false);
  }
}


/* =========================================================
   HARVEST
========================================================= */

async function harvestPlot(
  plotNumber
) {
  const plot =
    getPlot(plotNumber);

  if (!plot) {
    return;
  }

  if (!plot.crop_type) {
    return;
  }

  if (!isCropReady(plot)) {
    showMessage(
      "Cây chưa chín.",
      "error"
    );

    return;
  }

  const seed =
    SEEDS[
      plot.crop_type
    ];

  try {
    setLoading(
      true,
      "Đang thu hoạch..."
    );

    const result =
      await apiRequest(
        "/api/game/harvest",
        {
          plotNumber
        }
      );

    if (result.player) {
      gameState.player =
        result.player;
    }

    if (
      Array.isArray(
        result.plots
      )
    ) {
      gameState.plots =
        result.plots;
    }

    if (
      Array.isArray(
        result.inventory
      )
    ) {
      gameState.inventory =
        result.inventory;
    }

    if (result.plot) {
      replacePlot(
        result.plot
      );
    }

    renderAll();

    const expGain =
      Number(
        result.expGain
      ) || 0;

    const cropName =
      seed
        ? seed.name
        : "cây trồng";

    if (expGain > 0) {
      showMessage(
        `🌾 Thu hoạch ${cropName}! +${expGain} EXP`,
        "success"
      );
    } else {
      showMessage(
        `🌾 Thu hoạch ${cropName}!`,
        "success"
      );
    }

  } catch (error) {
    console.error(
      "harvestPlot error:",
      error
    );

    showMessage(
      error.message ||
        "Không thể thu hoạch.",
      "error"
    );

  } finally {
    setLoading(false);
  }
}


/* =========================================================
   SHOP
========================================================= */

function openShop() {
  renderShop();

  showPanel(
    shopPanel
  );
}


function closeShop() {
  hidePanel(
    shopPanel
  );
}


function renderShop() {
  if (!shopList) {
    return;
  }

  shopList.innerHTML =
    "";

  let totalValue =
    0;

  const inventory =
    Array.isArray(
      gameState.inventory
    )
      ? gameState.inventory
      : [];

  Object.entries(
    SEEDS
  ).forEach(
    ([seedKey, seed]) => {
      const amount =
        getInventoryAmount(
          seedKey
        );

      if (amount <= 0) {
        return;
      }

      const value =
        amount *
        seed.sellPrice;

      totalValue +=
        value;

      const item =
        document.createElement(
          "div"
        );

      item.className =
        "shop-item";

      item.innerHTML = `
        <div class="shop-item-info">
          <span class="shop-icon">
            ${seed.emoji}
          </span>

          <div>
            <strong>
              ${escapeHtml(
                seed.name
              )}
            </strong>

            <small>
              Số lượng:
              ${formatNumber(
                amount
              )}
            </small>

            <small>
              Giá bán:
              ${formatNumber(
                seed.sellPrice
              )} xu
            </small>
          </div>
        </div>

        <button
          type="button"
          class="shop-sell-one"
          data-seed="${escapeHtml(
            seedKey
          )}"
        >
          Bán 1
        </button>

        <button
          type="button"
          class="shop-sell-all"
          data-seed="${escapeHtml(
            seedKey
          )}"
        >
          Bán hết
        </button>
      `;

      shopList.appendChild(
        item
      );
    }
  );

  if (
    shopList.children.length === 0
  ) {
    shopList.innerHTML = `
      <div class="empty-message">
        🌱 Kho hạt giống đang trống.
      </div>
    `;
  }

  if (shopTotalValue) {
    shopTotalValue.textContent =
      formatNumber(
        totalValue
      );
  }

  shopList
    .querySelectorAll(
      ".shop-sell-one"
    )
    .forEach(
      button => {
        button.addEventListener(
          "click",
          async event => {
            event.preventDefault();

            const seedKey =
              button.dataset.seed;

            await sellSeed(
              seedKey,
              1
            );
          }
        );
      }
    );

  shopList
    .querySelectorAll(
      ".shop-sell-all"
    )
    .forEach(
      button => {
        button.addEventListener(
          "click",
          async event => {
            event.preventDefault();

            const seedKey =
              button.dataset.seed;

            const amount =
              getInventoryAmount(
                seedKey
              );

            if (amount <= 0) {
              return;
            }

            await sellSeed(
              seedKey,
              amount
            );
          }
        );
      }
    );
}


/* =========================================================
   SELL SEED
========================================================= */

async function sellSeed(
  seedKey,
  amount
) {
  const seed =
    SEEDS[seedKey];

  if (!seed) {
    return;
  }

  const currentAmount =
    getInventoryAmount(
      seedKey
    );

  if (
    amount <= 0 ||
    currentAmount < amount
  ) {
    showMessage(
      "Số lượng hạt giống không hợp lệ.",
      "error"
    );

    return;
  }

  const confirmed =
    window.confirm(
      `Bán ${formatNumber(
        amount
      )} ${seed.name}?\n\nGiá: ${formatNumber(
        seed.sellPrice
      )} xu / hạt`
    );

  if (!confirmed) {
    return;
  }

  try {
    setLoading(
      true,
      "Đang bán..."
    );

    const result =
      await apiRequest(
        "/api/game/sell",
        {
          seedKey,
          amount
        }
      );

    if (result.player) {
      gameState.player =
        result.player;
    }

    if (
      Array.isArray(
        result.inventory
      )
    ) {
      gameState.inventory =
        result.inventory;
    }

    renderAll();

    renderShop();

    const coinsEarned =
      Number(
        result.coinsEarned ??
        result.totalCoins ??
        result.amount
      ) || 0;

    if (coinsEarned > 0) {
      showMessage(
        `💰 Đã bán ${formatNumber(
          amount
        )} ${seed.name}, nhận ${formatNumber(
          coinsEarned
        )} xu.`,
        "success"
      );
    } else {
      showMessage(
        `💰 Đã bán ${seed.name}.`,
        "success"
      );
    }

  } catch (error) {
    console.error(
      "sellSeed error:",
      error
    );

    showMessage(
      error.message ||
        "Không thể bán hạt giống.",
      "error"
    );

  } finally {
    setLoading(false);
  }
}


/* =========================================================
   BUY SEED
========================================================= */

async function buySeed(
  seedKey,
  amount = 1
) {
  const seed =
    SEEDS[seedKey];

  if (!seed) {
    showMessage(
      "Hạt giống không hợp lệ.",
      "error"
    );

    return;
  }

  const quantity =
    Number(amount);

  if (
    !Number.isInteger(
      quantity
    ) ||
    quantity <= 0 ||
    quantity > 100
  ) {
    showMessage(
      "Số lượng mua không hợp lệ.",
      "error"
    );

    return;
  }

  const playerLevel =
    Number(
      gameState.player?.level
    ) || 1;

  if (
    playerLevel < seed.level
  ) {
    showMessage(
      `Cần đạt Lv.${seed.level} để mua ${seed.name}.`,
      "error"
    );

    return;
  }

  const totalPrice =
    seed.buyPrice *
    quantity;

  const coins =
    Number(
      gameState.player?.coins
    ) || 0;

  if (
    coins < totalPrice
  ) {
    showMessage(
      `Không đủ Coin. Cần ${formatNumber(
        totalPrice
      )} Coin.`,
      "error"
    );

    return;
  }

  const confirmed =
    window.confirm(
      `Mua ${formatNumber(
        quantity
      )} ${seed.name}?\n\n` +
      `Giá: ${formatNumber(
        seed.buyPrice
      )} Coin/hạt\n` +
      `Tổng: ${formatNumber(
        totalPrice
      )} Coin`
    );

  if (!confirmed) {
    return;
  }

  try {
    setLoading(
      true,
      "Đang mua hạt giống..."
    );

    /*
     * QUAN TRỌNG:
     *
     * Client KHÔNG gửi price.
     *
     * Backend tự lấy giá từ
     * cấu hình SEEDS phía server.
     *
     * Sau đó backend gọi:
     * buy_seed_atomic()
     */
    const result =
      await apiRequest(
        "/api/game/buy-seed",
        {
          seedKey,
          amount: quantity
        }
      );

    if (result.player) {
      gameState.player =
        result.player;
    }

    if (
      Array.isArray(
        result.inventory
      )
    ) {
      gameState.inventory =
        result.inventory;
    }

    renderAll();

    /*
     * Cập nhật lại panel hạt
     * nếu panel vẫn đang mở.
     */
    renderSeedList();

    showMessage(
      `🌱 Đã mua ${formatNumber(
        quantity
      )} ${seed.name}!`,
      "success"
    );

  } catch (error) {
    console.error(
      "buySeed error:",
      error
    );

    showMessage(
      error.message ||
        "Không thể mua hạt giống.",
      "error"
    );

  } finally {
    setLoading(false);
  }
}


/* =========================================================
   INVENTORY
========================================================= */

function getInventoryAmount(
  seedKey
) {
  if (
    !Array.isArray(
      gameState.inventory
    )
  ) {
    return 0;
  }

  const item =
    gameState.inventory.find(
      inventoryItem =>
        String(
          inventoryItem.seed_key
        ) ===
        String(seedKey)
    );

  if (!item) {
    return 0;
  }

  return Math.max(
    0,
    Number(
      item.amount
    ) || 0
  );
}


function updateInventoryItem(
  seedKey,
  amount
) {
  if (
    !Array.isArray(
      gameState.inventory
    )
  ) {
    gameState.inventory =
      [];
  }

  const item =
    gameState.inventory.find(
      inventoryItem =>
        String(
          inventoryItem.seed_key
        ) ===
        String(seedKey)
    );

  if (item) {
    item.amount =
      Number(amount) || 0;
  } else if (
    Number(amount) > 0
  ) {
    gameState.inventory.push({
      seed_key: seedKey,
      amount:
        Number(amount)
    });
  }
}


/* =========================================================
   INVENTORY PANEL
========================================================= */

function openInventory() {
  const oldPanel =
    document.getElementById(
      "dynamicInventoryPanel"
    );

  if (oldPanel) {
    oldPanel.remove();
  }

  const panel =
    document.createElement(
      "div"
    );

  panel.id =
    "dynamicInventoryPanel";

  panel.style.position =
    "fixed";

  panel.style.inset =
    "0";

  panel.style.zIndex =
    "10000";

  panel.style.background =
    "rgba(0,0,0,.65)";

  panel.style.display =
    "flex";

  panel.style.alignItems =
    "center";

  panel.style.justifyContent =
    "center";

  panel.style.padding =
    "20px";

  const box =
    document.createElement(
      "div"
    );

  box.style.width =
    "min(92vw, 420px)";

  box.style.maxHeight =
    "80vh";

  box.style.overflow =
    "auto";

  box.style.borderRadius =
    "18px";

  box.style.padding =
    "18px";

  box.style.background =
    "#dff6ff";

  box.style.color =
    "#063b52";

  box.style.boxShadow =
    "0 12px 40px rgba(0,0,0,.35)";

  const title =
    document.createElement(
      "h2"
    );

  title.textContent =
    "🎒 Kho hạt giống";

  title.style.marginTop =
    "0";

  box.appendChild(
    title
  );

  Object.entries(
    SEEDS
  ).forEach(
    ([seedKey, seed]) => {
      const amount =
        getInventoryAmount(
          seedKey
        );

      const row =
        document.createElement(
          "div"
        );

      row.style.display =
        "flex";

      row.style.alignItems =
        "center";

      row.style.justifyContent =
        "space-between";

      row.style.padding =
        "10px";

      row.style.marginBottom =
        "7px";

      row.style.borderRadius =
        "10px";

      row.style.background =
        "rgba(255,255,255,.55)";

      row.innerHTML = `
        <span>
          ${seed.emoji}
          ${escapeHtml(
            seed.name
          )}
        </span>

        <strong>
          ${formatNumber(
            amount
          )}
        </strong>
      `;

      box.appendChild(
        row
      );
    }
  );

  const closeButton =
    document.createElement(
      "button"
    );

  closeButton.type =
    "button";

  closeButton.textContent =
    "Đóng";

  closeButton.style.width =
    "100%";

  closeButton.style.marginTop =
    "12px";

  closeButton.style.padding =
    "12px";

  closeButton.style.border =
    "0";

  closeButton.style.borderRadius =
    "12px";

  closeButton.style.background =
    "#0788df";

  closeButton.style.color =
    "#fff";

  closeButton.style.fontWeight =
    "700";

  closeButton.addEventListener(
    "click",
    () => {
      panel.remove();
    }
  );

  box.appendChild(
    closeButton
  );

  panel.appendChild(
    box
  );

  panel.addEventListener(
    "click",
    event => {
      if (
        event.target === panel
      ) {
        panel.remove();
      }
    }
  );

  document.body.appendChild(
    panel
  );
}


/* =========================================================
   TASKS
========================================================= */

function openTasks() {
  renderTasks();

  showPanel(
    tasksPanel
  );
}


function closeTasks() {
  hidePanel(
    tasksPanel
  );
}


function renderTasks() {
  if (!tasksList) {
    return;
  }

  tasksList.innerHTML =
    "";

  /*
   * Backend chưa có endpoint
   * xác minh nhiệm vụ.
   *
   * KHÔNG tự cộng thưởng
   * ở client.
   */

  const tasks = [
    {
      id: "join_channel",
      title: "📢 Tham gia kênh",
      description:
        "Tham gia kênh Telegram theo yêu cầu của game.",
      reward: 500
    },

    {
      id: "invite_friend",
      title: "👥 Mời bạn bè",
      description:
        "Mời bạn bè tham gia Nông Trại Xanh.",
      reward: 1000
    }
  ];

  tasks.forEach(
    task => {
      const item =
        document.createElement(
          "div"
        );

      item.className =
        "task-item";

      item.innerHTML = `
        <div class="task-info">
          <strong>
            ${escapeHtml(
              task.title
            )}
          </strong>

          <p>
            ${escapeHtml(
              task.description
            )}
          </p>

          <small>
            🎁 ${formatNumber(
              task.reward
            )} xu
          </small>
        </div>

        <button
          type="button"
          class="task-button"
          data-task="${escapeHtml(
            task.id
          )}"
        >
          Kiểm tra
        </button>
      `;

      const button =
        item.querySelector(
          ".task-button"
        );

      button.addEventListener(
        "click",
        () => {
          showMessage(
            "Tính năng xác minh nhiệm vụ đang chờ backend. Game sẽ không tự cộng thưởng ở phía client.",
            "info"
          );
        }
      );

      tasksList.appendChild(
        item
      );
    }
  );
}


/* =========================================================
   MENU EVENTS
========================================================= */

function setupMenuEvents() {
  if (shopMenu) {
    shopMenu.addEventListener(
      "click",
      event => {
        event.preventDefault();
        event.stopPropagation();

        openShop();
      }
    );
  }

  if (seedMenu) {
    seedMenu.addEventListener(
      "click",
      event => {
        event.preventDefault();
        event.stopPropagation();

        let targetPlot =
          selectedPlot;

        if (!targetPlot) {
          const emptyPlot =
            gameState.plots.find(
              plot =>
                isUnlocked(plot) &&
                !plot.crop_type
            );

          if (emptyPlot) {
            targetPlot =
              Number(
                emptyPlot.plot_number
              );
          }
        }

        if (!targetPlot) {
          showMessage(
            "Hãy mở một ô đất trống trước.",
            "info"
          );

          return;
        }

        openSeedPanel(
          targetPlot
        );
      }
    );
  }

  if (inventoryMenu) {
    inventoryMenu.addEventListener(
      "click",
      event => {
        event.preventDefault();
        event.stopPropagation();

        openInventory();
      }
    );
  }

  if (tasksMenu) {
    tasksMenu.addEventListener(
      "click",
      event => {
        event.preventDefault();
        event.stopPropagation();

        openTasks();
      }
    );
  }

  if (settingsMenu) {
    settingsMenu.addEventListener(
      "click",
      event => {
        event.preventDefault();
        event.stopPropagation();

        showMessage(
          "⚙️ Cài đặt sẽ được bổ sung sau.",
          "info"
        );
      }
    );
  }
}


/* =========================================================
   CLOSE EVENTS
========================================================= */

function setupCloseEvents() {
  if (seedClose) {
    seedClose.addEventListener(
      "click",
      event => {
        event.preventDefault();
        event.stopPropagation();

        closeSeedPanel();
      }
    );
  }

  if (shopClose) {
    shopClose.addEventListener(
      "click",
      event => {
        event.preventDefault();
        event.stopPropagation();

        closeShop();
      }
    );
  }

  if (tasksClose) {
    tasksClose.addEventListener(
      "click",
      event => {
        event.preventDefault();
        event.stopPropagation();

        closeTasks();
      }
    );
  }

  setupOutsidePanelClose(
    seedPanel,
    closeSeedPanel
  );

  setupOutsidePanelClose(
    shopPanel,
    closeShop
  );

  setupOutsidePanelClose(
    tasksPanel,
    closeTasks
  );
}


function setupOutsidePanelClose(
  panel,
  closeFunction
) {
  if (!panel) {
    return;
  }

  panel.addEventListener(
    "click",
    event => {
      if (
        event.target === panel
      ) {
        closeFunction();
      }
    }
  );
}


/* =========================================================
   RENDER ALL
========================================================= */

function renderAll() {
  renderPlayer();

  renderPlots();

  if (
    seedPanel &&
    seedPanel.classList.contains(
      "show"
    )
  ) {
    renderSeedList();
  }

  if (
    shopPanel &&
    shopPanel.classList.contains(
      "show"
    )
  ) {
    renderShop();
  }

  if (
    tasksPanel &&
    tasksPanel.classList.contains(
      "show"
    )
  ) {
    renderTasks();
  }

  startCountdown();
}


/* =========================================================
   PANEL HELPERS
========================================================= */

function showPanel(
  panel
) {
  if (!panel) {
    return;
  }

  panel.classList.add(
    "show"
  );

  panel.setAttribute(
    "aria-hidden",
    "false"
  );
}


function hidePanel(
  panel
) {
  if (!panel) {
    return;
  }

  panel.classList.remove(
    "show"
  );

  panel.setAttribute(
    "aria-hidden",
    "true"
  );
}


/* =========================================================
   LOADING
========================================================= */

function setLoading(
  loading,
  message = "Đang xử lý..."
) {
  isLoading =
    Boolean(loading);

  if (loading) {
    showLoading(
      message
    );
  } else {
    hideLoading();
  }
}


function showLoading(
  message = "Đang xử lý..."
) {
  let loadingElement =
    document.getElementById(
      "gameLoading"
    );

  if (!loadingElement) {
    loadingElement =
      document.createElement(
        "div"
      );

    loadingElement.id =
      "gameLoading";

    loadingElement.style.position =
      "fixed";

    loadingElement.style.left =
      "50%";

    loadingElement.style.bottom =
      "95px";

    loadingElement.style.transform =
      "translateX(-50%)";

    loadingElement.style.zIndex =
      "20000";

    loadingElement.style.padding =
      "10px 16px";

    loadingElement.style.borderRadius =
      "14px";

    loadingElement.style.background =
      "rgba(0,0,0,.82)";

    loadingElement.style.color =
      "#fff";

    loadingElement.style.fontSize =
      "14px";

    loadingElement.style.fontWeight =
      "700";

    loadingElement.style.pointerEvents =
      "none";

    document.body.appendChild(
      loadingElement
    );
  }

  loadingElement.textContent =
    `⏳ ${message}`;

  loadingElement.style.display =
    "block";
}


function hideLoading() {
  const loadingElement =
    document.getElementById(
      "gameLoading"
    );

  if (loadingElement) {
    loadingElement.style.display =
      "none";
  }
}


/* =========================================================
   TOAST / MESSAGE
========================================================= */

function showMessage(
  message,
  type = "info"
) {
  let toast =
    document.getElementById(
      "gameToast"
    );

  if (!toast) {
    toast =
      document.createElement(
        "div"
      );

    toast.id =
      "gameToast";

    toast.style.position =
      "fixed";

    toast.style.left =
      "50%";

    toast.style.bottom =
      "105px";

    toast.style.transform =
      "translateX(-50%)";

    toast.style.zIndex =
      "30000";

    toast.style.maxWidth =
      "88vw";

    toast.style.padding =
      "11px 16px";

    toast.style.borderRadius =
      "14px";

    toast.style.color =
      "#fff";

    toast.style.fontSize =
      "14px";

    toast.style.fontWeight =
      "700";

    toast.style.textAlign =
      "center";

    toast.style.boxShadow =
      "0 8px 25px rgba(0,0,0,.3)";

    toast.style.pointerEvents =
      "none";

    document.body.appendChild(
      toast
    );
  }

  if (type === "error") {
    toast.style.background =
      "rgba(190,35,35,.94)";
  } else if (
    type === "success"
  ) {
    toast.style.background =
      "rgba(18,145,76,.94)";
  } else {
    toast.style.background =
      "rgba(0,70,100,.94)";
  }

  toast.textContent =
    String(message);

  toast.style.display =
    "block";

  if (toastTimer) {
    clearTimeout(
      toastTimer
    );
  }

  toastTimer =
    setTimeout(
      () => {
        toast.style.display =
          "none";
      },
      3500
    );
}


/* =========================================================
   UTILITY
========================================================= */

function formatNumber(
  value
) {
  const number =
    Number(value);

  if (
    !Number.isFinite(number)
  ) {
    return "0";
  }

  return new Intl.NumberFormat(
    "vi-VN"
  ).format(number);
}


function escapeHtml(
  value
) {
  return String(
    value ?? ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
}


function replacePlot(
  newPlot
) {
  if (!newPlot) {
    return;
  }

  const number =
    Number(
      newPlot.plot_number
    );

  if (!number) {
    return;
  }

  const index =
    gameState.plots.findIndex(
      plot =>
        Number(
          plot.plot_number
        ) === number
    );

  if (index >= 0) {
    gameState.plots[index] =
      newPlot;
  } else {
    gameState.plots.push(
      newPlot
    );
  }
}


/* =========================================================
   VISIBILITY
========================================================= */

function setupVisibilityEvents() {
  document.addEventListener(
    "visibilitychange",
    async () => {
      if (
        document.visibilityState !==
        "visible"
      ) {
        return;
      }

      if (
        !gameStarted ||
        isLoading ||
        isAuthenticating
      ) {
        return;
      }

      console.log(
        "👀 Mini App visible trở lại → tải state."
      );

      await loadGameState(
        false
      );
    }
  );
}


/* =========================================================
   START GAME
========================================================= */

async function startGame() {
  console.log(
    "🌱 Nông Trại Xanh starting..."
  );

  cacheDOM();

  setupPlotEvents();
  setupMenuEvents();
  setupCloseEvents();
  setupVisibilityEvents();

  const telegramReady =
    initTelegram();

  if (!telegramReady) {
    return;
  }

  const authenticated =
    await authenticateTelegram();

  if (!authenticated) {
    return;
  }

  await loadGameState(
    false
  );

  gameStarted =
    true;

  renderAll();

  console.log(
    "✅ Nông Trại Xanh đã sẵn sàng."
  );
}


/* =========================================================
   DOM READY
========================================================= */

if (
  document.readyState ===
  "loading"
) {
  document.addEventListener(
    "DOMContentLoaded",
    startGame,
    {
      once: true
    }
  );
} else {
  startGame();
}


/* =========================================================
   DEBUG API
   Không chứa secret.
========================================================= */

window.NongTraiXanh =
  window.NongTraiXanh || {};

window.NongTraiXanh.getState =
  function () {
    return gameState;
  };

window.NongTraiXanh.reload =
  async function () {
    return loadGameState();
  };

window.NongTraiXanh.openSeed =
  function (plotNumber) {
    openSeedPanel(
      Number(plotNumber)
    );
  };
