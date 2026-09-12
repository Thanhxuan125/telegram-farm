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
  | Lấy initData mới nhất từ Telegram
  |--------------------------------------------------------------------------
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
      | Render có thể cần thời gian khởi động.
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

    console.log(
      "AUTH PLAYER:",
      gameState.player
    );

    console.log(
      "AUTH PLOTS:",
      gameState.plots
    );

    console.log(
      "AUTH INVENTORY:",
      gameState.inventory
    );

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
  | Nếu authentication đang chạy thì không
  | gọi thêm state.
  */

  if (isAuthenticating) {
    return false;
  }

  /*
  | Nếu chưa có player thì authenticate.
  */

  if (!gameState.player) {
    return authenticateTelegram();
  }

  try {
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

    console.log(
      "GAME STATE PLOTS:",
      gameState.plots
    );

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

  console.log(
    "RENDER PLOTS:",
    gameState.plots.length,
    "ô từ server"
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
        /*
        | Không xóa HTML gốc của ô.
        */

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

      /*
      | Ô đã mở nhưng chưa trồng.
      | Không thêm gì -> người chơi bấm
      | vào sẽ mở bảng hạt giống.
      */

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

  timers.forEach(
    timer => {
      const harvestAt =
        timer.dataset.harvestAt;

      const remaining =
        getRemainingMs(
          harvestAt
        );

      const plotElement =
        timer.closest(
          ".plot[data-plot]"
        );

      if (
        remaining <= 0
      ) {
        timer.textContent =
          "✅ Chín";

        if (plotElement) {
          plotElement.classList.add(
            "ready"
          );
        }
      } else {
        timer.textContent =
          formatDuration(
            remaining
          );

        if (plotElement) {
          plotElement.classList.remove(
            "ready"
          );
        }
      }
    }
  );
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
  const plots =
    document.querySelectorAll(
      ".plot[data-plot]"
    );

  console.log(
    "Đã tìm thấy",
    plots.length,
    "ô đất trong HTML."
  );

  plots.forEach(
    plotElement => {
      /*
      | Tránh gắn event nhiều lần.
      */

      if (
        plotElement.dataset.clickReady ===
        "true"
      ) {
        return;
      }

      plotElement.dataset.clickReady =
        "true";

      plotElement.addEventListener(
        "click",
        async event => {
          event.preventDefault();
          event.stopPropagation();

          const plotNumber =
            Number(
              plotElement.dataset.plot
            );

          console.log(
            "🟢 CLICK Ô ĐẤT:",
            plotNumber
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
| ĐÂY LÀ PHẦN ĐÃ SỬA CHÍNH
|--------------------------------------------------------------------------
*/

async function handlePlotClick(
  plotNumber
) {
  if (
    isLoading ||
    isAuthenticating
  ) {
    console.log(
      "Click bị bỏ qua vì game đang loading."
    );

    return;
  }

  console.log(
    "🟢 CLICK PLOT:",
    plotNumber
  );

  console.log(
    "📦 GAME PLOTS:",
    gameState.plots
  );

  /*
  | Tìm plot hiện tại.
  */

  let plot =
    gameState.plots.find(
      item =>
        Number(
          item.plot_number
        ) ===
        Number(plotNumber)
    );

  /*
  |--------------------------------------------------------------------------
  | Nếu frontend chưa có plot
  | -> tải lại state từ server
  |--------------------------------------------------------------------------
  */

  if (!plot) {
    console.log(
      "⚠️ Không tìm thấy plot trong frontend."
    );

    console.log(
      "🔄 Đang tải lại game state..."
    );

    const loaded =
      await loadGameState();

    if (!loaded) {
      showMessage(
        "Không tải được dữ liệu ô đất từ máy chủ.",
        "error"
      );

      return;
    }

    /*
    | Tìm lại sau khi server trả dữ liệu.
    */

    plot =
      gameState.plots.find(
        item =>
          Number(
            item.plot_number
          ) ===
          Number(plotNumber)
      );

    if (!plot) {
      console.error(
        "❌ Server vẫn không trả về plot:",
        plotNumber,
        gameState.plots
      );

      showMessage(
        "Máy chủ chưa trả về dữ liệu ô đất này.",
        "error"
      );

      return;
    }
  }

  console.log(
    "🌱 PLOT ĐƯỢC CHỌN:",
    plot
  );

  /*
  |--------------------------------------------------------------------------
  | Ô bị khóa
  |--------------------------------------------------------------------------
  */

  if (
    !plot.unlocked
  ) {
    await unlockPlot(
      plotNumber
    );

    return;
  }

  /*
  |--------------------------------------------------------------------------
  | Ô đã mở + chưa trồng
  |--------------------------------------------------------------------------
  | => MỞ BẢNG HẠT GIỐNG
  |--------------------------------------------------------------------------
  */

  if (
    !plot.crop_type
  ) {
    console.log(
      "🌱 MỞ BẢNG HẠT GIỐNG CHO Ô:",
      plotNumber
    );

    openSeedPanel(
      plotNumber
    );

    return;
  }

  /*
  |--------------------------------------------------------------------------
  | Cây đã chín
  |--------------------------------------------------------------------------
  */

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

  /*
  |--------------------------------------------------------------------------
  | Cây đang lớn
  |--------------------------------------------------------------------------
  */

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

    /*
    | Nếu server trả plot nhưng frontend
    | chưa có thì thêm vào.
    */

    if (
      index === -1 &&
      data.plot
    ) {
      gameState.plots.push(
        data.plot
      );
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
  console.log(
    "🌱 OPEN SEED PANEL:",
    plotNumber
  );

  selectedPlot =
    Number(plotNumber);

  /*
  | Kiểm tra panel.
  */

  if (!seedPanel) {
    console.error(
      "❌ Không tìm thấy #seedPanel trong index.html"
    );

    showMessage(
      "Không tìm thấy bảng hạt giống trong giao diện.",
      "error"
    );

    return;
  }

  /*
  | Render danh sách hạt giống.
  */

  renderSeedList();

  /*
  | Hiện panel.
  */

  showPanel(
    seedPanel
  );

  console.log(
    "✅ Seed panel đã được mở."
  );

  console.log(
    "Seed panel class:",
    seedPanel.className
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
    console.error(
      "❌ Không tìm thấy #seedList."
    );

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
    showMessage(
      "Chưa chọn ô đất.",
      "error"
    );

    return;
  }

  const seed =
    SEEDS[seedKey];

  if (!seed) {
    return;
  }

  const targetPlot =
    Number(
      selectedPlot
    );

  setLoading(true);

  try {
    const data =
      await apiRequest(
        "/api/game/plant",
        {
          plotNumber:
            targetPlot,
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
            targetPlot
        );

      if (
        index !== -1
      ) {
        gameState.plots[index] =
          data.plot;
      } else {
        gameState.plots.push(
          data.plot
        );
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
   
