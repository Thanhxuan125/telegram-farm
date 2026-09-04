/* ==================================================
   NÔNG TRẠI XANH
   GAME LOGIC
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
   GIÁ BÁN
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
   PLAYER TEST
================================================== */

const SAVE_KEY =
  "telegram_farm_save_v2";


let player = {

  level: 1,

  exp: 0,

  coins: 1000,

  fertilizer: 3

};


/* ==================================================
   ELEMENT
================================================== */

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


const selectedPlot =
  document.getElementById(
    "selectedPlot"
  );


const seedItems =
  document.querySelectorAll(
    ".seed-item"
  );


const coinValue =
  document.getElementById(
    "coinValue"
  );


const fertilizerValue =
  document.getElementById(
    "fertilizerValue"
  );


const expFill =
  document.getElementById(
    "expFill"
  );


const expText =
  document.getElementById(
    "expText"
  );


const levelValue =
  document.getElementById(
    "levelValue"
  );


const levelNumber =
  document.getElementById(
    "levelNumber"
  );


let currentPlot = null;


/* ==================================================
   LEVEL
================================================== */

function checkLevelUp() {

  while (
    player.exp >= 7000
  ) {

    player.exp -= 7000;

    player.level++;

    alert(
      "🎉 Chúc mừng!\n\n" +
      "Bạn đã lên Lv." +
      player.level
    );

  }

}


/* ==================================================
   HUD
================================================== */

function updateHUD() {

  checkLevelUp();


  if (coinValue) {

    coinValue.textContent =
      player.coins.toLocaleString(
        "vi-VN"
      );

  }


  if (fertilizerValue) {

    fertilizerValue.textContent =
      player.fertilizer;

  }


  if (levelValue) {

    levelValue.textContent =
      player.level;

  }


  if (levelNumber) {

    levelNumber.textContent =
      player.level;

  }


  if (expText) {

    expText.textContent =

      player.exp.toLocaleString(
        "vi-VN"
      ) +

      " / 7000 EXP";

  }


  if (expFill) {

    const percent =

      (
        player.exp /
        7000
      ) *

      100;


    expFill.style.width =

      Math.min(
        percent,
        100
      ) + "%";

  }

}


/* ==================================================
   SAVE
================================================== */

function saveGame() {

  const data = {

    player: player,

    plots:

      Array.from(
        plots
      ).map(
        plot => ({

          number:
            plot.dataset.plot,

          seed:
            plot.dataset.seed ||
            null,

          plantedAt:
            plot.dataset.plantedAt ||
            null,

          growTime:
            plot.dataset.growTime ||
            null,

          fertilizerUsed:

            plot.dataset.fertilizerUsed ===
            "true"

        })
      )

  };


  localStorage.setItem(

    SAVE_KEY,

    JSON.stringify(
      data
    )

  );

}


/* ==================================================
   LOAD
================================================== */

function loadGame() {

  const saved =

    localStorage.getItem(
      SAVE_KEY
    );


  if (!saved) {

    updateHUD();

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
      Array.isArray(
        data.plots
      )
    ) {

      data.plots.forEach(
        savedPlot => {

          if (
            !savedPlot.seed
          ) {

            return;

          }


          const plot =
            document.querySelector(

              `.plot[data-plot="${savedPlot.number}"]`

            );


          if (!plot) {

            return;

          }


          plot.dataset.seed =
            savedPlot.seed;


          plot.dataset.plantedAt =
            savedPlot.plantedAt;


          plot.dataset.growTime =
            savedPlot.growTime;


          plot.dataset.fertilizerUsed =

            savedPlot.fertilizerUsed
              ? "true"
              : "false";


          restorePlant(
            plot
          );

        }
      );

    }

  }

  catch (error) {

    console.error(
      "Load game error:",
      error
    );

  }


  updateHUD();

}


/* ==================================================
   RESTORE PLANT
================================================== */

function restorePlant(
  plot
) {

  const seedId =
    plot.dataset.seed;


  const seed =
    seeds[seedId];


  if (!seed) {

    return;

  }


  renderPlant(
    plot,
    seed
  );


  updatePlant(
    plot
  );

}


/* ==================================================
   RENDER PLANT
================================================== */

function renderPlant(
  plot,
  seed
) {

  plot.innerHTML = "";


  const plant =
    document.createElement(
      "div"
    );


  plant.className =
    "plant";


  const icon =
    document.createElement(
      "div"
    );


  icon.className =
    "plant-icon";


  icon.textContent =
    "🌱";


  const name =
    document.createElement(
      "div"
    );


  name.className =
    "plant-name";


  name.textContent =
    seed.name;


  const timer =
    document.createElement(
      "div"
    );


  timer.className =
    "plant-timer";


  const progress =
    document.createElement(
      "div"
    );


  progress.className =
    "plant-progress";


  const fill =
    document.createElement(
      "div"
    );


  fill.className =
    "plant-progress-fill";


  progress.appendChild(
    fill
  );


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

}


/* ==================================================
   UPDATE PLANT
================================================== */

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


  const progress =

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
      (
        remaining %
        60000
      ) / 1000
    );


  const timer =
    plot.querySelector(
      ".plant-timer"
    );


  const fill =
    plot.querySelector(
      ".plant-progress-fill"
    );


  const icon =
    plot.querySelector(
      ".plant-icon"
    );


  if (!timer || !fill) {

    return;

  }


  if (
    progress >= 1
  ) {

    timer.textContent =
      "🌾 Thu hoạch";


    fill.style.width =
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


  plot.classList.remove(
    "ready"
  );


  timer.textContent =

    minutes +
    ":" +
    String(seconds)
      .padStart(
        2,
        "0"
      );


  fill.style.width =

    (
      progress *
      100
    ) + "%";


  setTimeout(
    () => {

      updatePlant(
        plot
      );

    },
    1000
  );

}


/* ==================================================
   RANDOM
================================================== */

function randomNumber(
  min,
  max
) {

  return Math.floor(

    Math.random() *
    (
      max -
      min +
      1
    )

  ) + min;

}


/* ==================================================
   OPEN SEED PANEL
================================================== */

function openSeedPanel(
  plotNumber
) {

  currentPlot =
    plotNumber;


  selectedPlot.textContent =

    "🌱 Đang chọn ô đất số " +
    plotNumber;


  seedPanel.classList.add(
    "show"
  );


  seedPanel.setAttribute(
    "aria-hidden",
    "false"
  );

}


/* ==================================================
   CLOSE
================================================== */

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


/* ==================================================
   PLANT
================================================== */

function plantSeed(
  plot,
  seedId
) {

  const seed =
    seeds[seedId];


  if (!seed) {

    return;

  }


  player.coins -=
    seed.price;


  plot.dataset.seed =
    seedId;


  plot.dataset.plantedAt =
    Date.now();


  plot.dataset.growTime =
    seed.growTime;


  plot.dataset.fertilizerUsed =
    "false";


  plot.classList.remove(
    "ready"
  );


  renderPlant(
    plot,
    seed
  );


  updatePlant(
    plot
  );


  updateHUD();

  saveGame();

}


/* ==================================================
   FERTILIZER BUTTON
================================================== */

function showFertilizerButton(
  plot
) {

  if (
    plot.dataset.fertilizerUsed ===
    "true"
  ) {

    alert(
      "🧪 Vụ này đã dùng phân bón."
    );

    return;

  }


  if (
    player.fertilizer <= 0
  ) {

    alert(
      "Bạn không có phân bón."
    );

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
    document.createElement(
      "button"
    );


  button.type =
    "button";


  button.className =
    "fertilizer-button";


  button.textContent =
    "🧪 Dùng phân";


  button.addEventListener(
    "click",
    event => {

      event.stopPropagation();

      useFertilizer(
        plot
      );

    }
  );


  plot.appendChild(
    button
  );

}


/* ==================================================
   USE FERTILIZER
================================================== */

function useFertilizer(
  plot
) {

  const seedId =
    plot.dataset.seed;


  if (!seedId) {

    return;

  }


  if (
    plot.dataset.fertilizerUsed ===
    "true"
  ) {

    return;

  }


  if (
    player.fertilizer <= 0
  ) {

    return;

  }


  const seed =
    seeds[seedId];


  if (!seed) {

    return;

  }


  const reducedMinutes =

    randomNumber(
      seed.fertilizerMin,
      seed.fertilizerMax
    );


  const plantedAt =
    Number(
      plot.dataset.plantedAt
    );


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

  updatePlant(
    plot
  );

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
   HARVEST
================================================== */

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


  if (
    !plot.classList.contains(
      "ready"
    )
  ) {

    return;

  }


  const gainedExp =

    randomNumber(
      10,
      300
    );


  const earnedCoins =
    sellPrices[seedId];


  player.exp +=
    gainedExp;


  player.coins +=
    earnedCoins;


  delete plot.dataset.seed;

  delete plot.dataset.plantedAt;

  delete plot.dataset.growTime;

  delete plot.dataset.fertilizerUsed;


  plot.classList.remove(
    "ready"
  );


  plot.innerHTML =

    `<span class="plot-number">
      ${plot.dataset.plot}
    </span>`;


  updateHUD();

  saveGame();


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

}


/* ==================================================
   CLICK Ô ĐẤT
================================================== */

plots.forEach(
  plot => {

    plot.addEventListener(
      "click",
      () => {

        if (
          plot.classList.contains(
            "locked"
          )
        ) {

          alert(
            "🔒 Ô đất này chưa mở."
          );

          return;

        }


        if (
          plot.dataset.seed
        ) {

          if (
            plot.classList.contains(
              "ready"
            )
          ) {

            harvestPlot(
              plot
            );

            return;

          }


          showFertilizerButton(
            plot
          );

          return;

        }


        openSeedPanel(
          plot.dataset.plot
        );

      }
    );

  }
);


/* ==================================================
   CLOSE PANEL
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

seedItems.forEach(
  item => {

    item.addEventListener(
      "click",
      () => {

        if (
          !currentPlot
        ) {

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
            "🪙 Không đủ coin!"
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


        plantSeed(
          plot,
          seedId
        );


        closeSeedPanel();

      }
    );

  }
);


/* ==================================================
   MENU HẠT GIỐNG
================================================== */

const seedMenuButton =
  document.getElementById(
    "seedMenuButton"
  );


if (seedMenuButton) {

  seedMenuButton.addEventListener(
    "click",
    () => {

      if (currentPlot) {

        openSeedPanel(
          currentPlot
        );

      }
      else {

        alert(
          "🌱 Hãy chọn một ô đất trước."
        );

      }

    }
  );

}


/* ==================================================
   START
================================================== */

loadGame();

updateHUD();
