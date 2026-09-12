"use strict";

/*
|--------------------------------------------------------------------------
| NÔNG TRẠI XANH - FRONTEND
|--------------------------------------------------------------------------
| SECURITY:
| - Frontend không chứa Supabase key
| - Frontend không chứa Telegram Bot Token
| - Frontend không tự quyết định Coin / EXP / giá / thời gian
| - Server Render là nguồn dữ liệu game
| - Telegram initData được gửi cho backend để xác minh
|--------------------------------------------------------------------------
*/

const BACKEND_URL =
  "https://telegram-farm-backend.onrender.com";

const TOTAL_PLOTS = 20;
const FREE_PLOTS = 3;
const EXP_PER_LEVEL = 7000;

/*
|--------------------------------------------------------------------------
| NETWORK
|--------------------------------------------------------------------------
*/

const REQUEST_TIMEOUT = 45000;
const MAX_RETRIES = 2;

/*
|--------------------------------------------------------------------------
| SEEDS
|--------------------------------------------------------------------------
*/

const SEEDS = {
  wheat: {
    name: "Lúa mì",
    icon: "🌾",
    level: 1,
    buyPrice: 10,
    sellPrice: 12,
    growMinutes: 20
  },

  corn: {
    name: "Bắp",
    icon: "🌽",
    level: 3,
    buyPrice: 20,
    sellPrice: 25,
    growMinutes: 60
  },

  radish: {
    name: "Củ cải",
    icon: "🥕",
    level: 7,
    buyPrice: 35,
    sellPrice: 40,
    growMinutes: 90
  },

  carrot: {
    name: "Cà rốt",
    icon: "🥕",
    level: 10,
    buyPrice: 50,
    sellPrice: 75,
    growMinutes: 150
  },

  beet: {
    name: "Củ dền",
    icon: "🫜",
    level: 13,
    buyPrice: 75,
    sellPrice: 88,
    growMinutes: 280
  },

  eggplant: {
    name: "Cà tím",
    icon: "🍆",
    level: 15,
    buyPrice: 100,
    sellPrice: 125,
    growMinutes: 450
  },

  chili: {
    name: "Ớt",
    icon: "🌶️",
    level: 17,
    buyPrice: 180,
    sellPrice: 210,
    growMinutes: 650
  },

  greenOnion: {
    name: "Hành lá",
    icon: "🌱",
    level: 20,
    buyPrice: 250,
    sellPrice: 350,
    growMinutes: 870
  },

  cabbage: {
    name: "Bắp cải",
    icon: "🥬",
    level: 23,
    buyPrice: 500,
    sellPrice: 750,
    growMinutes: 950
  },

  pumpkin: {
    name: "Bí đỏ",
    icon: "🎃",
    level: 25,
    buyPrice: 1000,
    sellPrice: 1250,
    growMinutes: 1200
  }
};

/*
|--------------------------------------------------------------------------
| GAME STATE
|--------------------------------------------------------------------------
*/

let gameState = {
  player: null,
  plots: [],
  inventory: []
};

let telegram = null;
let initData = "";
let selectedPlot = null;
let countdownTimer = null;
let isLoading = false;
let isAuthenticating = false;
let gameStarted = false;

/*
|--------------------------------------------------------------------------
| DOM
|--------------------------------------------------------------------------
*/

const levelNumber =
  document.getElementById("levelNumber");

const levelValue =
  document.getElementById("levelValue");

const expFill =
  document.getElementById("expFill");

const expText =
  document.getElementById("expText");

const coinValue =
  document.getElementById("coinValue");

const fertilizerValue =
  document.getElementById("fertilizerValue");

const seedPanel =
  document.getElementById("seedPanel");

const seedList =
  document.getElementById("seedList");

const seedClose =
  document.getElementById("seedClose");

const shopPanel =
  document.getElementById("shopPanel");

const shopList =
  document.getElementById("shopList");

const shopClose =
  document.getElementById("shopClose");

const shopTotalValue =
  document.getElementById("shopTotalValue");

const tasksPanel =
  document.getElementById("tasksPanel");

const tasksList =
  document.getElementById("tasksList");

const tasksClose =
  document.getElementById("tasksClose");

const shopMenu =
  document.getElementById("shopMenu");

const seedMenu =
  document.getElementById("seedMenu");

const inventoryMenu =
  document.getElementById("inventoryMenu");

const tasksMenu =
  document.getElementById("tasksMenu");

const settingsMenu =
  document.getElementById("settingsMenu");

/*
|--------------------------------------------------------------------------
| TELEGRAM
|--------------------------------------------------------------------------
*/

function initTelegram(showDiagnostics = false) {
  if (
    !window.Telegram ||
    !window.Telegram.WebApp
  ) {
    console.error(
      "Telegram WebApp SDK chưa được tải."
    );

    if (showDiagnostics) {
      window.alert(
        "Không tìm thấy Telegram WebApp SDK.\n\n" +
        "Hãy mở Mini App trực tiếp từ Telegram."
      );
    }

    return false;
  }

  telegram =
    window.Telegram.WebApp;

  try {
    telegram.ready();
    telegram.expand();
  } catch (error) {
    console.warn(
      "Telegram ready/expand:",
      error
    );
  }

  try {
    telegram.setHeaderColor(
      "#0788df"
    );

    telegram.setBackgroundColor(
      "#0788df"
    );
  } catch (error) {
    console.warn(
      "Telegram color setup:",
      error
    );
  }

  /*
  |--------------------------------------------------------------------------
  | QUAN TRỌNG
  |--------------------------------------------------------------------------
  | Luôn lấy initData mới nhất từ Telegram.
  */

  initData =
    String(
      telegram.initData || ""
    );

  console.log(
    "Telegram SDK:",
    "CÓ"
  );

  console.log(
    "Telegram initData:",
    initData
      ? "CÓ"
      : "KHÔNG"
  );

  console.log(
    "Telegram initData length:",
    initData.length
  );

  if (!initData) {
    console.error(
      "Telegram initData đang trống."
    );

    if (showDiagnostics) {
      const unsafeUser =
        telegram.initDataUnsafe?.user;

      window.alert(
        "Telegram đã mở Mini App nhưng không có initData.\n\n" +
        "User ID: " +
        (unsafeUser?.id || "Không có") +
        "\nPlatform: " +
        (telegram.platform || "Không xác định") +
        "\nVersion: " +
        (telegram.version || "Không xác định")
      );
    }

    return false;
  }

  return true;
}

/*
|--------------------------------------------------------------------------
| NETWORK HELPER
|--------------------------------------------------------------------------
*/

function sleep(ms) {
  return new Promise(
    resolve =>
      setTimeout(
        resolve,
        ms
      )
  );
}

async function fetchWithTimeout(
  url,
  options = {},
  timeout = REQUEST_TIMEOUT
) {
  const controller =
    new AbortController();

  const timeoutId =
    setTimeout(
      () => {
        controller.abort();
      },
      timeout
    );

  try {
    return await fetch(
      url,
      {
        ...options,
        signal:
          controller.signal
      }
    );
  } catch (error) {
    if (
      error?.name ===
      "AbortError"
    ) {
      throw new Error(
        "Máy chủ phản hồi quá lâu. Render có thể đang khởi động lại, hãy thử lại."
      );
    }

    throw error;
  } finally {
    clearTimeout(
      timeoutId
    );
  }
}

/*
|--------------------------------------------------------------------------
| API
|--------------------------------------------------------------------------
*/

async function apiRequest(
  endpoint,
  body = {},
  options = {}
) {
  /*
  | Lấy initData mới nhất trước request.
  */

  if (
    telegram &&
    telegram.initData
  ) {
    initData =
      String(
        telegram.initData
      );
  }

  if (!initData) {
    throw new Error(
      "Không có Telegram initData. Hãy đóng Mini App và mở lại từ Telegram."
    );
  }

  const maxRetries =
    Number.isInteger(
      options.retries
    )
      ? options.retries
      : MAX_RETRIES;

  let lastError = null;

  for (
    let attempt = 0;
    attempt <= maxRetries;
    attempt++
  ) {
    try {
      const response =
        await fetchWithTimeout(
          `${BACKEND_URL}${endpoint}`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              initData,
              ...body
            })
          }
        );

      let data = null;

      try {
        data =
          await response.json();
      } catch {
        throw new Error(
          `Máy chủ trả về dữ liệu không hợp lệ (${response.status}).`
        );
      }

      /*
      | Server lỗi tạm thời:
      | 502 / 503 / 504
      | => thử lại vì Render Free có thể
      | đang thức dậy.
      */

      if (
        [502, 503, 504].includes(
          response.status
        ) &&
        attempt < maxRetries
      ) {
        await sleep(
          1500 * (attempt + 1)
        );

        continue;
      }

      if (
        !response.ok ||
        data?.ok === false
      ) {
        throw new Error(
          data?.error ||
          `Request thất bại (${response.status}).`
        );
      }

      return data;
    } catch (error) {
      lastError = error;

      /*
      | Không retry lỗi do game/server trả về
      | rõ ràng. Chỉ retry lỗi mạng / timeout.
      */

      const message =
        String(
          error?.message || ""
        ).toLowerCase();

      const shouldRetry =
        message.includes(
          "failed to fetch"
        ) ||
        message.includes(
          "network"
        ) ||
        message.includes(
          "fetch"
        ) ||
        message.includes(
          "phản hồi quá lâu"
        );

      if (
        !shouldRetry ||
        attempt >= maxRetries
      ) {
        break;
      }

      await sleep(
        1500 * (attempt + 1)
      );
    }
  }

  throw (
    lastError ||
    new Error(
      "Không thể kết nối máy chủ."
    )
  );
}

/*
|--------------------------------------------------------------------------
| AUTH
|--------------------------------------------------------------------------
*/

async function authenticateTelegram() {
  if (isAuthenticating) {
    return false;
  }

  isAuthenticating = true;

  showLoading(
    "Đang kết nối máy chủ..."
  );

  try {
    /*
    | Lấy initData mới nhất
    */

    if (
      telegram?.initData
    ) {
      initData =
        String(
          telegram.initData
        );
    }

    if (!initData) {
      throw new Error(
        "Telegram không cung cấp initData. Hãy đóng Mini App và mở lại từ Telegram."
      );
    }

    const data =
      await apiRequest(
        "/api/auth/telegram",
        {},
        {
          retries: 2
        }
      );

    if (!data) {
      throw new Error(
        "Máy chủ không trả về dữ liệu người chơi."
      );
    }

    gameState.player =
      data.player || null;

    gameState.plots =
      Array.isArray(
        data.plots
      )
        ? data.plots
        : [];

    gameState.inventory =
      Array.isArray(
        data.inventory
      )
        ? data.inventory
        : [];

    renderAll();

    console.log(
      "Telegram authentication thành công."
    );

    return true;
  } catch (error) {
    console.error(
      "Telegram authentication error:",
      error
    );

    showMessage(
      error?.message ||
        "Không thể kết nối máy chủ.",
      "error"
    );

    return false;
  } finally {
    isAuthenticating = false;
    hideLoading();
  }
}

/*
|--------------------------------------------------------------------------
| LOAD GAME STATE
|--------------------------------------------------------------------------
*/

async function loadGameState() {
  /*
  | Không gọi state khi auth đang chạy.
  */

  if (isAuthenticating) {
    return false;
  }

  /*
  | Nếu chưa có player thì authenticate trước.
  */

  if (!gameState.player) {
    return authenticateTelegram();
  }

  try {
    /*
    | Refresh initData.
    */

    if (
      telegram?.initData
    ) {
      initData =
        String(
          telegram.initData
        );
    }

    if (!initData) {
      return false;
    }

    const data =
      await apiRequest(
        "/api/game/state",
        {},
        {
          retries: 2
        }
      );

    gameState.player =
      data.player || null;

    gameState.plots =
      Array.isArray(
        data.plots
      )
        ? data.plots
        : [];

    gameState.inventory =
      Array.isArray(
        data.inventory
      )
        ? data.inventory
        : [];

    renderAll();

    console.log(
      "Game state đã được tải lại."
    );

    return true;
  } catch (error) {
    console.error(
      "Load game state error:",
      error
    );

    /*
    | Không hiện popup liên tục khi
    | Telegram chỉ vừa chuyển từ nền
    | trở lại.
    */

    showMessage(
      error?.message ||
        "Không thể tải dữ liệu game.",
      "error"
    );

    return false;
  }
}

/*
|--------------------------------------------------------------------------
| RENDER PLAYER
|--------------------------------------------------------------------------
*/

function renderPlayer() {
  const player =
    gameState.player;

  if (!player) {
    return;
  }

  const level =
    Number(
      player.level || 1
    );

  const exp =
    Number(
      player.exp || 0
    );

  const coins =
    Number(
      player.coins || 0
    );

  const fertilizer =
    Number(
      player.fertilizer || 0
    );

  if (levelNumber) {
    levelNumber.textContent =
      level;
  }

  if (levelValue) {
    levelValue.textContent =
      level;
  }

  if (coinValue) {
    coinValue.textContent =
      formatNumber(
        coins
      );
  }

  if (fertilizerValue) {
    fertilizerValue.textContent =
      formatNumber(
        fertilizer
      );
  }

  const expPercent =
    Math.max(
      0,
      Math.min(
        100,
        (exp /
          EXP_PER_LEVEL) *
          100
      )
    );

  if (expFill) {
    expFill.style.width =
      `${expPercent}%`;
  }

  if (expText) {
    expText.textContent =
      `${formatNumber(
        exp
      )} / ${formatNumber(
        EXP_PER_LEVEL
      )} EXP`;
  }
}

/*
|--------------------------------------------------------------------------
| RENDER PLOTS
|--------------------------------------------------------------------------
*/

function renderPlots() {
  const plotElements =
    document.querySelectorAll(
      ".plot[data-plot]"
    );

  plotElements.forEach(
    element => {
      const plotNumber =
        Number(
          element.dataset.plot
        );

      const plot =
        gameState.plots.find(
          item =>
            Number(
              item.plot_number
            ) === plotNumber
        );

      if (!plot) {
        return;
      }

      element.classList.toggle(
        "unlocked",
        Boolean(
          plot.unlocked
        )
      );

      element.classList.toggle(
        "locked",
        !plot.unlocked
      );

      element.classList.remove(
        "ready"
      );

      element
        .querySelectorAll(
          ".crop-image,.crop-name,.grow-time,.plot-price,.fertilizer-button,.harvest-button"
        )
        .forEach(
          item =>
            item.remove()
        );

      if (
        !plot.unlocked
      ) {
        renderLockedPlot(
          element,
          plotNumber
        );

        return;
      }

      if (
        !plot.crop_type
      ) {
        return;
      }

      renderCrop(
        element,
        plot
      );
    }
  );
}

/*
|--------------------------------------------------------------------------
| LOCKED PLOT
|--------------------------------------------------------------------------
*/

function renderLockedPlot(
  element,
  plotNumber
) {
  let price = 0;

  if (
    plotNumber >
    FREE_PLOTS
  ) {
    price =
      500 *
      Math.pow(
        2,
        plotNumber - 4
      );
  }

  const priceElement =
    document.createElement(
      "span"
    );

  priceElement.className =
    "plot-price";

  priceElement.textContent =
    `${formatNumber(
      price
    )} 🪙`;

  element.appendChild(
    priceElement
  );
}

/*
|--------------------------------------------------------------------------
| CROP
|--------------------------------------------------------------------------
*/

function renderCrop(
  element,
  plot
) {
  const seed =
    SEEDS[
      plot.crop_type
    ];

  if (!seed) {
    return;
  }

  const cropImage =
    document.createElement(
      "div"
    );

  cropImage.className =
    "crop-image";

  cropImage.style.display =
    "flex";

  cropImage.style.alignItems =
    "center";

  cropImage.style.justifyContent =
    "center";

  cropImage.style.fontSize =
    "clamp(20px, 8vw, 42px)";

  cropImage.textContent =
    seed.icon;

  element.appendChild(
    cropImage
  );

  const cropName =
    document.createElement(
      "span"
    );

  cropName.className =
    "crop-name";

  cropName.textContent =
    seed.name;

  element.appendChild(
    cropName
  );

  const growTime =
    document.createElement(
      "span"
    );

  growTime.className =
    "grow-time";

  growTime.dataset.harvestAt =
    plot.harvest_at;

  growTime.textContent =
    getCountdownText(
      plot.harvest_at
    );

  element.appendChild(
    growTime
  );
}

/*
|--------------------------------------------------------------------------
| COUNTDOWN
|--------------------------------------------------------------------------
*/

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
  const timers =
    document.querySelectorAll(
      ".grow-time"
    );

  let hasReadyCrop = false;

  timers.forEach(
    timer => {
      const harvestAt =
        timer.dataset.harvestAt;

      const remaining =
        getRemainingMs(
          harvestAt
        );

      if (
        remaining <= 0
      ) {
        timer.textContent =
          "✅ Chín";

        hasReadyCrop = true;
      } else {
        timer.textContent =
          formatDuration(
            remaining
          );
      }
    }
  );

  if (hasReadyCrop) {
    document
      .querySelectorAll(
        ".plot[data-plot]"
      )
      .forEach(
        plotElement => {
          plotElement.classList.add(
            "ready"
          );
        }
      );
  }
}

function getRemainingMs(
  harvestAt
) {
  if (!harvestAt) {
    return 0;
  }

  const timestamp =
    new Date(
      harvestAt
    ).getTime();

  if (
    Number.isNaN(
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
  harvestAt
) {
  const remaining =
    getRemainingMs(
      harvestAt
    );

  if (
    remaining <= 0
  ) {
    return "✅ Chín";
  }

  return formatDuration(
    remaining
  );
}

function formatDuration(
  milliseconds
) {
  let totalSeconds =
    Math.max(
      0,
      Math.floor(
        milliseconds / 1000
      )
    );

  const days =
    Math.floor(
      totalSeconds /
        86400
    );

  totalSeconds %= 86400;

  const hours =
    Math.floor(
      totalSeconds /
        3600
    );

  totalSeconds %= 3600;

  const minutes =
    Math.floor(
      totalSeconds /
        60
    );

  const seconds =
    totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
}

/*
|--------------------------------------------------------------------------
| PLOT EVENTS
|--------------------------------------------------------------------------
*/

function setupPlotEvents() {
  document
    .querySelectorAll(
      ".plot[data-plot]"
    )
    .forEach(
      plotElement => {
        plotElement.addEventListener(
          "click",
          async () => {
            const plotNumber =
              Number(
                plotElement.dataset.plot
              );

            await handlePlotClick(
              plotNumber
            );
          }
        );
      }
    );
}

/*
|--------------------------------------------------------------------------
| PLOT CLICK
|--------------------------------------------------------------------------
*/

async function handlePlotClick(
  plotNumber
) {
  /*
  | Trong lúc auth hoặc mutation đang
  | chạy thì không cho click thêm.
  */

  if (
    isLoading ||
    isAuthenticating
  ) {
    return;
  }

  const plot =
    gameState.plots.find(
      item =>
        Number(
          item.plot_number
        ) === plotNumber
    );

  if (!plot) {
    showMessage(
      "Chưa tải được dữ liệu ô đất. Hãy thử lại.",
      "error"
    );

    return;
  }

  if (
    !plot.unlocked
  ) {
    await unlockPlot(
      plotNumber
    );

    return;
  }

  if (
    !plot.crop_type
  ) {
    openSeedPanel(
      plotNumber
    );

    return;
  }

  if (
    getRemainingMs(
      plot.harvest_at
    ) <= 0
  ) {
    await harvestPlot(
      plotNumber
    );

    return;
  }

  showPlotActions(
    plot
  );
}

/*
|--------------------------------------------------------------------------
| UNLOCK PLOT
|--------------------------------------------------------------------------
*/

async function unlockPlot(
  plotNumber
) {
  const price =
    plotNumber <= FREE_PLOTS
      ? 0
      : 500 *
        Math.pow(
          2,
          plotNumber - 4
        );

  const confirmed =
    window.confirm(
      `Mở ô đất ${plotNumber} với giá ${formatNumber(
        price
      )} Coin?`
    );

  if (!confirmed) {
    return;
  }

  setLoading(true);

  try {
    const data =
      await apiRequest(
        "/api/game/unlock-plot",
        {
          plotNumber
        }
      );

    if (
      data.player
    ) {
      gameState.player =
        data.player;
    }

    const index =
      gameState.plots.findIndex(
        item =>
          Number(
            item.plot_number
          ) === plotNumber
      );

    if (
      index !== -1 &&
      data.plot
    ) {
      gameState.plots[index] =
        data.plot;
    }

    renderAll();

    showMessage(
      `Đã mở khóa ô đất ${plotNumber}!`,
      "success"
    );
  } catch (error) {
    console.error(
      "Unlock error:",
      error
    );

    showMessage(
      error?.message ||
        "Không thể mở khóa ô đất.",
      "error"
    );
  } finally {
    setLoading(false);
  }
}

/*
|--------------------------------------------------------------------------
| SEED PANEL
|--------------------------------------------------------------------------
*/

function openSeedPanel(
  plotNumber
) {
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

function renderSeedList() {
  if (!seedList) {
    return;
  }

  seedList.innerHTML = "";

  const playerLevel =
    Number(
      gameState.player?.level ||
        1
    );

  const inventory =
    Array.isArray(
      gameState.inventory
    )
      ? gameState.inventory
      : [];

  Object.entries(
    SEEDS
  ).forEach(
    ([key, seed]) => {
      const inventoryItem =
        inventory.find(
          item =>
            item.seed_key ===
            key
        );

      const amount =
        Number(
          inventoryItem?.amount ||
            0
        );

      const item =
        document.createElement(
          "button"
        );

      item.type =
        "button";

      item.className =
        "seed-item";

      const locked =
        playerLevel <
        seed.level;

      item.disabled =
        locked ||
        amount <= 0;

      item.innerHTML = `
        <span class="seed-icon">
          ${seed.icon}
        </span>

        <span class="seed-name">
          ${escapeHtml(
            seed.name
          )}
        </span>

        <span class="seed-price">
          ${
            locked
              ? `🔒 Lv.${seed.level}`
              : `Có: ${amount}`
          }
        </span>
      `;

      if (
        !locked &&
        amount > 0
      ) {
        item.addEventListener(
          "click",
          () => {
            plantSeed(
              key
            );
          }
        );
      }

      seedList.appendChild(
        item
      );
    }
  );
}

/*
|--------------------------------------------------------------------------
| PLANT
|--------------------------------------------------------------------------
*/

async function plantSeed(
  seedKey
) {
  if (
    selectedPlot === null
  ) {
    return;
  }

  const seed =
    SEEDS[seedKey];

  if (!seed) {
    return;
  }

  setLoading(true);

  try {
    const data =
      await apiRequest(
        "/api/game/plant",
        {
          plotNumber:
            selectedPlot,
          seedKey
        }
      );

    if (
      data.plot
    ) {
      const index =
        gameState.plots.findIndex(
          item =>
            Number(
              item.plot_number
            ) ===
            selectedPlot
        );

      if (
        index !== -1
      ) {
        gameState.plots[index] =
          data.plot;
      }
    }

    if (
      Array.isArray(
        data.inventory
      )
    ) {
      gameState.inventory =
        data.inventory;
    }

    if (
      data.player
    ) {
      gameState.player =
        data.player;
    }

    if (
      data.inventoryUpdated
    ) {
      updateInventoryItem(
        data.inventoryUpdated
      );
    }

    closeSeedPanel();

    renderAll();

    showMessage(
      `Đã trồng ${seed.name}!`,
      "success"
    );
  } catch (error) {
    console.error(
      "Plant error:",
      error
    );

    showMessage(
      error?.message ||
        "Không thể trồng cây.",
      "error"
    );
  } finally {
    setLoading(false);
  }
}

/*
|--------------------------------------------------------------------------
| FERTILIZER
|--------------------------------------------------------------------------
*/

function showPlotActions(
  plot
) {
  const seed =
    SEEDS[
      plot.crop_type
    ];

  if (!seed) {
    return;
  }

  const remaining =
    getRemainingMs(
      plot.harvest_at
    );

  if (
    remaining <= 0
  ) {
    harvestPlot(
      Number(
        plot.plot_number
      )
    );

    return;
  }

  const fertilizer =
    Number(
      gameState.player?.fertilizer ||
        0
    );

  const message =
    `🌱 ${seed.name}\n\n` +
    `⏳ Còn: ${formatDuration(
      remaining
    )}\n\n` +
    `🧪 Phân bón: ${fertilizer}`;

  const useFertilizer =
    fertilizer > 0 &&
    window.confirm(
      `${message}\n\nBấm OK để dùng 1 phân bón.`
    );

  if (
    useFertilizer
  ) {
    fertilizePlot(
      Number(
        plot.plot_number
      )
    );
  }
}

async function fertilizePlot(
  plotNumber
) {
  setLoading(true);

  try {
    const data =
      await apiRequest(
        "/api/game/fertilize",
        {
          plotNumber
        }
      );

    if (
      data.player
    ) {
      gameState.player =
        data.player;
    }

    if (
      data.plot
    ) {
      const index =
        gameState.plots.findIndex(
          item =>
            Number(
              item.plot_number
            ) ===
            plotNumber
        );

      if (
        index !== -1
      ) {
        gameState.plots[index] =
          data.plot;
      }
    }

    renderAll();

    const reduction =
      Number(
        data.reductionMinutes
      );

    if (
      Number.isFinite(
        reduction
      )
    ) {
      showMessage(
        `🧪 Đã dùng phân bón, giảm ${reduction} phút!`,
        "success"
      );
    } else {
      showMessage(
        "🧪 Đã dùng phân bón!",
        "success"
      );
    }
  } catch (error) {
    console.error(
      "Fertilizer error:",
      error
    );

    showMessage(
      error?.message ||
        "Không thể dùng phân bón.",
      "error"
    );
  } finally {
    setLoading(false);
  }
}

/*
|--------------------------------------------------------------------------
| HARVEST
|--------------------------------------------------------------------------
*/

async function harvestPlot(
  plotNumber
) {
  const plot =
    gameState.plots.find(
      item =>
        Number(
          item.plot_number
        ) === plotNumber
    );

  if (!plot) {
    return;
  }

  if (
    !plot.crop_type
  ) {
    return;
  }

  if (
    getRemainingMs(
      plot.harvest_at
    ) > 0
  ) {
    showMessage(
      "Cây chưa chín.",
      "error"
    );

    return;
  }

  setLoading(true);

  try {
    const data =
      await apiRequest(
        "/api/game/harvest",
        {
          plotNumber
        }
      );

    if (
      data.player
    ) {
      gameState.player =
        data.player;
    }

    if (
      data.plot
    ) {
      const index =
        gameState.plots.findIndex(
          item =>
            Number(
              item.plot_number
            ) === plotNumber
        );

      if (
        index !== -1
      ) {
        gameState.plots[index] =
          data.plot;
      }
    }

    if (
      Array.isArray(
        data.inventory
      )
    ) {
      gameState.inventory =
        data.inventory;
    }

    if (
      data.inventoryUpdated
    ) {
      updateInventoryItem(
        data.inventoryUpdated
      );
    }

    renderAll();

    const exp =
      Number(
        data.expGained || 0
      );

    if (
      exp > 0
    ) {
      showMessage(
        `🌾 Thu hoạch thành công! +${exp} EXP`,
        "success"
      );
    } else {
      showMessage(
        "🌾 Thu hoạch thành công!",
        "success"
      );
    }
  } catch (error) {
    console.error(
      "Harvest error:",
      error
    );

    showMessage(
      error?.message ||
        "Không thể thu hoạch.",
      "error"
    );
  } finally {
    setLoading(false);
  }
}

/*
|--------------------------------------------------------------------------
| SHOP
|--------------------------------------------------------------------------
*/

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

  shopList.innerHTML = "";

  let totalValue = 0;

  const inventory =
    Array.isArray(
      gameState.inventory
    )
      ? gameState.inventory
      : [];

  Object.entries(
    SEEDS
  ).forEach(
    ([key, seed]) => {
      const inventoryItem =
        inventory.find(
          item =>
            item.seed_key ===
            key
        );

      const amount =
        Number(
          inventoryItem?.amount ||
            0
        );

      const value =
        amount *
        seed.sellPrice;

      totalValue += value;

      const item =
        document.createElement(
          "div"
        );

      item.className =
        "shop-item";

      item.innerHTML = `
        <div class="shop-item-icon">
          ${seed.icon}
        </div>

        <div>
          <div class="shop-item-name">
            ${escapeHtml(
              seed.name
            )}
          </div>

          <div class="shop-item-count">
            Có: ${amount}
          </div>

          <div class="shop-item-value">
            Giá bán: ${seed.sellPrice} 🪙
          </div>
        </div>

        <button
          type="button"
          class="shop-sell-button"
          data-sell-seed="${escapeAttribute(
            key
          )}"
          ${
            amount <= 0
              ? "disabled"
              : ""
          }
        >
          Bán 1
        </button>
      `;

      const button =
        item.querySelector(
          "[data-sell-seed]"
        );

      if (button) {
        button.addEventListener(
          "click",
          () => {
            sellSeed(
              key
            );
          }
        );
      }

      shopList.appendChild(
        item
      );
    }
  );

  if (
    shopTotalValue
  ) {
    shopTotalValue.textContent =
      `Tổng giá trị kho: ${formatNumber(
        totalValue
      )} 🪙`;
  }
}

/*
|--------------------------------------------------------------------------
| SELL
|--------------------------------------------------------------------------
*/

async function sellSeed(
  seedKey
) {
  const seed =
    SEEDS[seedKey];

  if (!seed) {
    return;
  }

  const inventory =
    Array.isArray(
      gameState.inventory
    )
      ? gameState.inventory
      : [];

  const inventoryItem =
    inventory.find(
      item =>
        item.seed_key ===
        seedKey
    );

  const amount =
    Number(
      inventoryItem?.amount ||
        0
    );

  if (
    amount <= 0
  ) {
    showMessage(
      "Bạn không có nông sản này.",
      "error"
    );

    return;
  }

  setLoading(true);

  try {
    const data =
      await apiRequest(
        "/api/game/sell",
        {
          seedKey,
          amount: 1
        }
      );

    if (
      data.player
    ) {
      gameState.player =
        data.player;
    }

    if (
      Array.isArray(
        data.inventory
      )
    ) {
      gameState.inventory =
        data.inventory;
    }

    if (
      data.inventoryUpdated
    ) {
      updateInventoryItem(
        data.inventoryUpdated
      );
    }

    renderAll();

    renderShop();

    const coins =
      Number(
        data.coinsGained ||
          data.totalCoinsGained ||
          seed.sellPrice
      );

    showMessage(
      `💰 Đã bán ${seed.name} +${formatNumber(
        coins
      )} Coin`,
      "success"
    );
  } catch (error) {
    console.error(
      "Sell error:",
      error
    );

    showMessage(
      error?.message ||
        "Không thể bán nông sản.",
      "error"
    );
  } finally {
    setLoading(false);
  }
}

/*
|--------------------------------------------------------------------------
| INVENTORY
|--------------------------------------------------------------------------
*/

function openInventory() {
  renderShop();

  showPanel(
    shopPanel
  );
}

/*
|--------------------------------------------------------------------------
| TASKS
|--------------------------------------------------------------------------
*/

function openTasks() {
  renderTasks();

  showPanel(
    tasksPanel
  );
}

function renderTasks() {
  if (!tasksList) {
    return;
  }

  tasksList.innerHTML = "";

  const tasks = [
    {
      id: "join_channel",
      icon: "📢",
      title: "Tham gia kênh Telegram",
      desc: "Tham gia kênh để nhận thưởng một lần.",
      reward: "500 🪙"
    },

    {
      id: "invite_friend",
      icon: "👥",
      title: "Mời bạn bè",
      desc: "Mời bạn bè tham gia Nông Trại Xanh.",
      reward: "1000 🪙"
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
        <div class="task-icon">
          ${task.icon}
        </div>

        <div class="task-content">
          <div class="task-title">
            ${escapeHtml(
              task.title
            )}
          </div>

          <div class="task-desc">
            ${escapeHtml(
              task.desc
            )}
          </div>

          <div class="task-reward">
            🎁 ${escapeHtml(
              task.reward
            )}
          </div>

          <div class="task-status">
            Chưa xác minh
          </div>
        </div>

        <button
          class="task-button"
          type="button"
          data-task-id="${escapeAttribute(
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

      if (button) {
        button.addEventListener(
          "click",
          () => {
            checkTask(
              task.id,
              item,
              button
            );
          }
        );
      }

      tasksList.appendChild(
        item
      );
    }
  );
}

async function checkTask(
  taskId,
  item,
  button
) {
  /*
  | Backend task verification chưa
  | được triển khai nên frontend
  | tuyệt đối không tự cộng Coin.
  */

  showMessage(
    "Hệ thống xác minh nhiệm vụ sẽ được nối với backend ở bước tiếp theo.",
    "info"
  );
}

/*
|--------------------------------------------------------------------------
| PANELS
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| MENU
|--------------------------------------------------------------------------
*/

function setupMenuEvents() {
  if (shopMenu) {
    shopMenu.addEventListener(
      "click",
      openShop
    );
  }

  if (seedMenu) {
    seedMenu.addEventListener(
      "click",
      () => {
        if (
          selectedPlot === null
        ) {
          showMessage(
            "Hãy chọn một ô đất đã mở khóa trước.",
            "info"
          );

          return;
        }

        openSeedPanel(
          selectedPlot
        );
      }
    );
  }

  if (inventoryMenu) {
    inventoryMenu.addEventListener(
      "click",
      openInventory
    );
  }

  if (tasksMenu) {
    tasksMenu.addEventListener(
      "click",
      openTasks
    );
  }

  if (settingsMenu) {
    settingsMenu.addEventListener(
      "click",
      () => {
        showMessage(
          "Cài đặt sẽ được thêm sau.",
          "info"
        );
      }
    );
  }
}

/*
|--------------------------------------------------------------------------
| CLOSE BUTTONS
|--------------------------------------------------------------------------
*/

function setupCloseEvents() {
  if (seedClose) {
    seedClose.addEventListener(
      "click",
      closeSeedPanel
    );
  }

  if (shopClose) {
    shopClose.addEventListener(
      "click",
      closeShop
    );
  }

  if (tasksClose) {
    tasksClose.addEventListener(
      "click",
      () => {
        hidePanel(
          tasksPanel
        );
      }
    );
  }

  [
    seedPanel,
    shopPanel,
    tasksPanel
  ].forEach(
    panel => {
      if (!panel) {
        return;
      }

      panel.addEventListener(
        "click",
        event => {
          if (
            event.target ===
            panel
          ) {
            hidePanel(
              panel
            );
          }
        }
      );
    }
  );
}

/*
|--------------------------------------------------------------------------
| RENDER ALL
|--------------------------------------------------------------------------
*/

function renderAll() {
  renderPlayer();
  renderPlots();
  renderSeedList();
  renderShop();
  startCountdown();
}

/*
|--------------------------------------------------------------------------
| INVENTORY UPDATE
|--------------------------------------------------------------------------
*/

function updateInventoryItem(
  updatedItem
) {
  if (!updatedItem) {
    return;
  }

  if (
    !Array.isArray(
      gameState.inventory
    )
  ) {
    gameState.inventory =
      [];
  }

  const index =
    gameState.inventory.findIndex(
      item =>
        Number(item.id) ===
        Number(
          updatedItem.id
        )
    );

  if (
    index === -1
  ) {
    gameState.inventory.push(
      updatedItem
    );

    return;
  }

  gameState.inventory[index] =
    updatedItem;
}

/*
|--------------------------------------------------------------------------
| UTILITIES
|--------------------------------------------------------------------------
*/

function formatNumber(
  value
) {
  const number =
    Number(
      value || 0
    );

  return new Intl.NumberFormat(
    "vi-VN"
  ).format(number);
}

function escapeHtml(
  value
) {
  return String(value)
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
}

function escapeAttribute(
  value
) {
  return escapeHtml(
    value
  );
}

/*
|--------------------------------------------------------------------------
| LOADING
|--------------------------------------------------------------------------
*/

function setLoading(
  value
) {
  isLoading =
    Boolean(value);

  /*
  | QUAN TRỌNG:
  | Không khóa toàn bộ body bằng
  | pointer-events.
  */

  if (telegram) {
    try {
      if (isLoading) {
        telegram.MainButton
          ?.showProgress();
      } else {
        telegram.MainButton
          ?.hideProgress();
      }
    } catch {
      // ignore
    }
  }
}

function showLoading(
  message
) {
  setLoading(true);

  console.log(
    message
  );
}

function hideLoading() {
  setLoading(false);
}

/*
|--------------------------------------------------------------------------
| MESSAGE
|--------------------------------------------------------------------------
*/

function showMessage(
  message,
  type = "info"
) {
  console.log(
    `[${type}]`,
    message
  );

  if (
    telegram &&
    typeof telegram.showAlert ===
      "function"
  ) {
    try {
      telegram.showAlert(
        String(message)
      );

      return;
    } catch {
      // fallback
    }
  }

  window.alert(
    String(message)
  );
}

/*
|--------------------------------------------------------------------------
| VISIBILITY
|--------------------------------------------------------------------------
*/

let reconnectTimer = null;

document.addEventListener(
  "visibilitychange",
  () => {
    if (
      document.visibilityState !==
      "visible"
    ) {
      return;
    }

    /*
    | Tránh gọi liên tục.
    */

    if (reconnectTimer) {
      clearTimeout(
        reconnectTimer
      );
    }

    reconnectTimer =
      setTimeout(
        async () => {
          /*
          | Lấy Telegram WebApp/initData
          | mới nhất.
          */

          const telegramReady =
            initTelegram(false);

          if (!telegramReady) {
            return;
          }

          /*
          | Nếu game chưa xác thực,
          | authenticate lại.
          */

          if (
            !gameState.player
          ) {
            await authenticateTelegram();

            return;
          }

          /*
          | Nếu game đã có player,
          | chỉ tải state mới.
          */

          await loadGameState();
        },
        500
      );
  }
);

/*
|--------------------------------------------------------------------------
| START GAME
|--------------------------------------------------------------------------
*/

async function startGame() {
  if (gameStarted) {
    return;
  }

  gameStarted =
    true;

  console.log(
    "🌱 NÔNG TRẠI XANH đang khởi động..."
  );

  /*
  | Telegram
  */

  const telegramReady =
    initTelegram(true);

  if (!telegramReady) {
    hideLoading();

    return;
  }

  /*
  | Plot events
  */

  setupPlotEvents();

  /*
  | Menu
  */

  setupMenuEvents();

  /*
  | Close buttons
  */

  setupCloseEvents();

  /*
  | Auth + tải game
  */

  await authenticateTelegram();

  console.log(
    "🌱 NÔNG TRẠI XANH đã khởi động."
  );
}

/*
|--------------------------------------------------------------------------
| DOM READY
|--------------------------------------------------------------------------
*/

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
