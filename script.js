"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

const app = express();

const PORT = process.env.PORT || 10000;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const TELEGRAM_BOT_TOKEN =
  process.env.TELEGRAM_BOT_TOKEN;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Thiếu SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

if (!TELEGRAM_BOT_TOKEN) {
  console.error("❌ Thiếu TELEGRAM_BOT_TOKEN");
  process.exit(1);
}

/*
|--------------------------------------------------------------------------
| Supabase
|--------------------------------------------------------------------------
| Service Role Key CHỈ được dùng ở backend.
| Tuyệt đối không đưa key này vào script.js/frontend.
|--------------------------------------------------------------------------
*/

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
*/

const allowedOrigins = new Set([
  "https://telegram-farm-nine.vercel.app",
  "http://localhost:3000",
  "http://localhost:5173",
]);

app.use(
  cors({
    origin(origin, callback) {
      // Cho phép request không có Origin như health check/server tools.
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS blocked"));
    },
  })
);

app.use(
  express.json({
    limit: "20kb",
  })
);

/*
|--------------------------------------------------------------------------
| Server-side game configuration
|--------------------------------------------------------------------------
| Client KHÔNG được quyết định giá/thời gian/EXP.
|--------------------------------------------------------------------------
*/

const SEEDS = {
  wheat: {
    name: "Lúa mì",
    level: 1,
    buyPrice: 10,
    sellPrice: 12,
    growMinutes: 20,
  },

  corn: {
    name: "Bắp",
    level: 3,
    buyPrice: 20,
    sellPrice: 25,
    growMinutes: 60,
  },

  radish: {
    name: "Củ cải",
    level: 7,
    buyPrice: 35,
    sellPrice: 40,
    growMinutes: 90,
  },

  carrot: {
    name: "Cà rốt",
    level: 10,
    buyPrice: 50,
    sellPrice: 75,
    growMinutes: 150,
  },

  beet: {
    name: "Củ dền",
    level: 13,
    buyPrice: 75,
    sellPrice: 88,
    growMinutes: 280,
  },

  eggplant: {
    name: "Cà tím",
    level: 15,
    buyPrice: 100,
    sellPrice: 125,
    growMinutes: 450,
  },

  chili: {
    name: "Ớt",
    level: 17,
    buyPrice: 180,
    sellPrice: 210,
    growMinutes: 650,
  },

  greenOnion: {
    name: "Hành lá",
    level: 20,
    buyPrice: 250,
    sellPrice: 350,
    growMinutes: 870,
  },

  cabbage: {
    name: "Bắp cải",
    level: 23,
    buyPrice: 500,
    sellPrice: 750,
    growMinutes: 950,
  },

  pumpkin: {
    name: "Bí đỏ",
    level: 25,
    buyPrice: 1000,
    sellPrice: 1250,
    growMinutes: 1200,
  },
};

const TOTAL_PLOTS = 20;
const FREE_PLOTS = 3;
const EXP_PER_LEVEL = 7000;

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function nowIso() {
  return new Date().toISOString();
}

function getPlotUnlockPrice(plotNumber) {
  if (plotNumber <= FREE_PLOTS) {
    return 0;
  }

  // Ô 4 = 500
  // Ô 5 = 1000
  // Ô 6 = 2000...
  return 500 * Math.pow(2, plotNumber - 4);
}

function getRandomExp() {
  // EXP server tự tạo.
  // Không nhận EXP từ client.
  return crypto.randomInt(20, 51);
}

function getFertilizerReductionMinutes(seedKey) {
  /*
   * Theo thiết kế hiện tại:
   * phân bón giảm ngẫu nhiên 5–30 phút.
   *
   * Có thể tinh chỉnh công thức theo level hạt sau này.
   */
  const seed = SEEDS[seedKey];

  if (!seed) {
    return 0;
  }

  const min = 5;
  const max = Math.min(30, 5 + Math.floor(seed.level / 2));

  return crypto.randomInt(min, max + 1);
}

function addExp(player, amount) {
  let level = Number(player.level || 1);
  let exp = Number(player.exp || 0);

  exp += amount;

  while (exp >= EXP_PER_LEVEL) {
    exp -= EXP_PER_LEVEL;
    level += 1;
  }

  return {
    level,
    exp,
  };
}

function isValidPlotNumber(plotNumber) {
  return (
    Number.isInteger(plotNumber) &&
    plotNumber >= 1 &&
    plotNumber <= TOTAL_PLOTS
  );
}

/*
|--------------------------------------------------------------------------
| Telegram initData verification
|--------------------------------------------------------------------------
*/

function verifyTelegramInitData(initData) {
  if (!initData || typeof initData !== "string") {
    throw new Error("Thiếu Telegram initData");
  }

  const params = new URLSearchParams(initData);

  const receivedHash = params.get("hash");

  if (!receivedHash) {
    throw new Error("Telegram initData không có hash");
  }

  params.delete("hash");

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(TELEGRAM_BOT_TOKEN)
    .digest();

  const calculatedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  const receivedBuffer = Buffer.from(receivedHash, "hex");
  const calculatedBuffer = Buffer.from(calculatedHash, "hex");

  if (
    receivedBuffer.length !== calculatedBuffer.length ||
    !crypto.timingSafeEqual(
      receivedBuffer,
      calculatedBuffer
    )
  ) {
    throw new Error("Telegram initData không hợp lệ");
  }

  const authDate = Number(params.get("auth_date"));

  if (!Number.isFinite(authDate)) {
    throw new Error("Telegram auth_date không hợp lệ");
  }

  const now = Math.floor(Date.now() / 1000);

  // Cho phép initData tối đa 24 giờ.
  if (authDate > now + 60) {
    throw new Error("Telegram auth_date nằm trong tương lai");
  }

  if (now - authDate > 24 * 60 * 60) {
    throw new Error("Telegram initData đã hết hạn");
  }

  const userString = params.get("user");

  if (!userString) {
    throw new Error("Telegram initData không có user");
  }

  let telegramUser;

  try {
    telegramUser = JSON.parse(userString);
  } catch {
    throw new Error("Telegram user JSON không hợp lệ");
  }

  if (
    !telegramUser ||
    telegramUser.id === undefined ||
    telegramUser.id === null
  ) {
    throw new Error("Không xác định được Telegram user");
  }

  return telegramUser;
}

/*
|--------------------------------------------------------------------------
| Player
|--------------------------------------------------------------------------
*/

async function getOrCreatePlayer(telegramUser) {
  const telegramId = String(telegramUser.id);

  const { data: existingPlayer, error: selectError } =
    await supabase
      .from("players")
      .select("*")
      .eq("telegram_id", telegramId)
      .maybeSingle();

  if (selectError) {
    throw new Error(
      `Không đọc được player: ${selectError.message}`
    );
  }

  if (existingPlayer) {
    const { data: updatedPlayer, error: updateError } =
      await supabase
        .from("players")
        .update({
          username: telegramUser.username || null,
          first_name: telegramUser.first_name || null,
          last_name: telegramUser.last_name || null,
          updated_at: nowIso(),
        })
        .eq("id", existingPlayer.id)
        .select("*")
        .single();

    if (updateError) {
      throw new Error(
        `Không cập nhật player: ${updateError.message}`
      );
    }

    return updatedPlayer;
  }

  const { data: newPlayer, error: insertError } =
    await supabase
      .from("players")
      .insert({
        telegram_id: telegramId,
        username: telegramUser.username || null,
        first_name: telegramUser.first_name || null,
        last_name: telegramUser.last_name || null,
        level: 1,
        exp: 0,
        coins: 1000,
        fertilizer: 3,
        auto_care_cards: 0,
      })
      .select("*")
      .single();

  if (!insertError) {
    return newPlayer;
  }

  // Nếu có request đồng thời tạo cùng Telegram ID,
  // thử đọc lại player.
  const { data: retryPlayer, error: retryError } =
    await supabase
      .from("players")
      .select("*")
      .eq("telegram_id", telegramId)
      .maybeSingle();

  if (retryError || !retryPlayer) {
    throw new Error(
      `Không tạo được player: ${insertError.message}`
    );
  }

  return retryPlayer;
}

/*
|--------------------------------------------------------------------------
| Plots
|--------------------------------------------------------------------------
*/

async function ensurePlayerPlots(playerId) {
  const { data: existingPlots, error } =
    await supabase
      .from("plots")
      .select("plot_number")
      .eq("player_id", playerId)
      .order("plot_number", { ascending: true });

  if (error) {
    throw new Error(
      `Không đọc được plots: ${error.message}`
    );
  }

  const existingNumbers = new Set(
    (existingPlots || []).map((plot) =>
      Number(plot.plot_number)
    )
  );

  const missingPlots = [];

  for (let i = 1; i <= TOTAL_PLOTS; i++) {
    if (!existingNumbers.has(i)) {
      missingPlots.push({
        player_id: playerId,
        plot_number: i,
        unlocked: i <= FREE_PLOTS,
        crop_type: null,
        planted_at: null,
        harvest_at: null,
        fertilizer_used: false,
      });
    }
  }

  if (missingPlots.length > 0) {
    const { error: insertError } =
      await supabase
        .from("plots")
        .insert(missingPlots);

    if (insertError) {
      throw new Error(
        `Không tạo được plots: ${insertError.message}`
      );
    }
  }

  const { data: plots, error: finalError } =
    await supabase
      .from("plots")
      .select("*")
      .eq("player_id", playerId)
      .order("plot_number", { ascending: true });

  if (finalError) {
    throw new Error(
      `Không đọc được plots sau khi tạo: ${finalError.message}`
    );
  }

  return plots || [];
}

/*
|--------------------------------------------------------------------------
| Inventory
|--------------------------------------------------------------------------
*/

async function getPlayerInventory(playerId) {
  const { data, error } = await supabase
    .from("player_inventory")
    .select("*")
    .eq("player_id", playerId)
    .order("seed_key", { ascending: true });

  if (error) {
    throw new Error(
      `Không đọc được inventory: ${error.message}`
    );
  }

  return data || [];
}

async function addInventory(playerId, seedKey, amount) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("Số lượng inventory không hợp lệ");
  }

  const { data: existing, error: selectError } =
    await supabase
      .from("player_inventory")
      .select("*")
      .eq("player_id", playerId)
      .eq("seed_key", seedKey)
      .maybeSingle();

  if (selectError) {
    throw new Error(
      `Không đọc được inventory: ${selectError.message}`
    );
  }

  if (existing) {
    const newAmount =
      Number(existing.amount) + amount;

    const { data, error } = await supabase
      .from("player_inventory")
      .update({
        amount: newAmount,
        updated_at: nowIso(),
      })
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error) {
      throw new Error(
        `Không cập nhật inventory: ${error.message}`
      );
    }

    return data;
  }

  const { data, error } = await supabase
    .from("player_inventory")
    .insert({
      player_id: playerId,
      seed_key: seedKey,
      amount,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(
      `Không tạo inventory: ${error.message}`
    );
  }

  return data;
}

/*
|--------------------------------------------------------------------------
| Authentication middleware
|--------------------------------------------------------------------------
*/

async function requireTelegram(req, res, next) {
  try {
    const initData =
      req.body && req.body.initData;

    const telegramUser =
      verifyTelegramInitData(initData);

    const player =
      await getOrCreatePlayer(telegramUser);

    const plots =
      await ensurePlayerPlots(player.id);

    req.telegramUser = telegramUser;
    req.player = player;
    req.playerId = player.id;
    req.plots = plots;

    next();
  } catch (error) {
    console.error("Authentication error:", error.message);

    return res.status(401).json({
      ok: false,
      error: error.message || "Unauthorized",
    });
  }
}

/*
|--------------------------------------------------------------------------
| Health
|--------------------------------------------------------------------------
*/

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "telegram-farm-backend",
    time: nowIso(),
  });
});

app.get("/health/supabase", async (req, res) => {
  try {
    const { error } = await supabase
      .from("players")
      .select("id")
      .limit(1);

    if (error) {
      throw error;
    }

    res.json({
      ok: true,
      service: "telegram-farm-backend",
      supabase: true,
    });
  } catch (error) {
    console.error("Supabase health error:", error);

    res.status(500).json({
      ok: false,
      service: "telegram-farm-backend",
      supabase: false,
      error: error.message,
    });
  }
});

/*
|--------------------------------------------------------------------------
| Telegram authentication
|--------------------------------------------------------------------------
*/

app.post(
  "/api/auth/telegram",
  async (req, res) => {
    try {
      const { initData } = req.body || {};

      const telegramUser =
        verifyTelegramInitData(initData);

      const player =
        await getOrCreatePlayer(telegramUser);

      const plots =
        await ensurePlayerPlots(player.id);

      const inventory =
        await getPlayerInventory(player.id);

      return res.json({
        ok: true,

        player,

        plots,

        inventory,
      });
    } catch (error) {
      console.error(
        "Telegram auth error:",
        error.message
      );

      return res.status(401).json({
        ok: false,
        error:
          error.message ||
          "Telegram authentication failed",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| GAME STATE
|--------------------------------------------------------------------------
*/

app.post(
  "/api/game/state",
  requireTelegram,
  async (req, res) => {
    try {
      const inventory =
        await getPlayerInventory(req.playerId);

      const { data: freshPlayer, error } =
        await supabase
          .from("players")
          .select("*")
          .eq("id", req.playerId)
          .single();

      if (error) {
        throw error;
      }

      return res.json({
        ok: true,
        player: freshPlayer,
        plots: req.plots,
        inventory,
      });
    } catch (error) {
      console.error(
        "State error:",
        error.message
      );

      return res.status(500).json({
        ok: false,
        error: "Không lấy được game state",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| UNLOCK PLOT
|--------------------------------------------------------------------------
*/

app.post(
  "/api/game/unlock-plot",
  requireTelegram,
  async (req, res) => {
    try {
      const plotNumber =
        Number(req.body.plotNumber);

      if (!isValidPlotNumber(plotNumber)) {
        return res.status(400).json({
          ok: false,
          error: "plotNumber không hợp lệ",
        });
      }

      const plot = req.plots.find(
        (item) =>
          Number(item.plot_number) === plotNumber
      );

      if (!plot) {
        return res.status(404).json({
          ok: false,
          error: "Không tìm thấy ô đất",
        });
      }

      if (plot.unlocked) {
        return res.status(400).json({
          ok: false,
          error: "Ô đất đã được mở khóa",
        });
      }

      // Chỉ cho mở tuần tự.
      if (plotNumber > FREE_PLOTS) {
        const previousPlot =
          req.plots.find(
            (item) =>
              Number(item.plot_number) ===
              plotNumber - 1
          );

        if (
          previousPlot &&
          !previousPlot.unlocked
        ) {
          return res.status(400).json({
            ok: false,
            error:
              "Phải mở khóa ô đất trước đó",
          });
        }
      }

      const price =
        getPlotUnlockPrice(plotNumber);

      const coins =
        Number(req.player.coins || 0);

      if (coins < price) {
        return res.status(400).json({
          ok: false,
          error: "Không đủ Coin",
          requiredCoins: price,
          coins,
        });
      }

      const newCoins = coins - price;

      const { data: updatedPlayer, error: playerError } =
        await supabase
          .from("players")
          .update({
            coins: newCoins,
            updated_at: nowIso(),
          })
          .eq("id", req.playerId)
          .eq("coins", coins)
          .select("*")
          .maybeSingle();

      if (playerError) {
        throw playerError;
      }

      if (!updatedPlayer) {
        return res.status(409).json({
          ok: false,
          error:
            "Dữ liệu Coin vừa thay đổi. Vui lòng thử lại.",
        });
      }

      const { data: updatedPlot, error: plotError } =
        await supabase
          .from("plots")
          .update({
            unlocked: true,
            updated_at: nowIso(),
          })
          .eq("id", plot.id)
          .eq("unlocked", false)
          .select("*")
          .single();

      if (plotError) {
        throw plotError;
      }

      return res.json({
        ok: true,
        player: updatedPlayer,
        plot: updatedPlot,
      });
    } catch (error) {
      console.error(
        "Unlock plot error:",
        error.message
      );

      return res.status(500).json({
        ok: false,
        error: "Không thể mở khóa ô đất",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| PLANT
|--------------------------------------------------------------------------
*/

app.post(
  "/api/game/plant",
  requireTelegram,
  async (req, res) => {
    try {
      const plotNumber =
        Number(req.body.plotNumber);

      const seedKey =
        String(req.body.seedKey || "");

      if (!isValidPlotNumber(plotNumber)) {
        return res.status(400).json({
          ok: false,
          error: "plotNumber không hợp lệ",
        });
      }

      const seed = SEEDS[seedKey];

      if (!seed) {
        return res.status(400).json({
          ok: false,
          error: "Loại hạt không hợp lệ",
        });
      }

      const plot = req.plots.find(
        (item) =>
          Number(item.plot_number) === plotNumber
      );

      if (!plot) {
        return res.status(404).json({
          ok: false,
          error: "Không tìm thấy ô đất",
        });
      }

      if (!plot.unlocked) {
        return res.status(400).json({
          ok: false,
          error: "Ô đất chưa mở khóa",
        });
      }

      if (plot.crop_type) {
        return res.status(400).json({
          ok: false,
          error: "Ô đất đang có cây",
        });
      }

      const playerLevel =
        Number(req.player.level || 1);

      if (playerLevel < seed.level) {
        return res.status(400).json({
          ok: false,
          error: "Chưa đủ level để trồng hạt này",
          requiredLevel: seed.level,
          level: playerLevel,
        });
      }

      const inventory =
        await supabase
          .from("player_inventory")
          .select("*")
          .eq("player_id", req.playerId)
          .eq("seed_key", seedKey)
          .maybeSingle();

      if (inventory.error) {
        throw inventory.error;
      }

      const currentAmount =
        inventory.data
          ? Number(inventory.data.amount)
          : 0;

      if (currentAmount <= 0) {
        return res.status(400).json({
          ok: false,
          error: "Không có hạt giống",
        });
      }

      const plantedAt =
        new Date();

      const harvestAt =
        new Date(
          plantedAt.getTime() +
            seed.growMinutes * 60 * 1000
        );

      const { data: updatedPlot, error: plotError } =
        await supabase
          .from("plots")
          .update({
            crop_type: seedKey,
            planted_at:
              plantedAt.toISOString(),
            harvest_at:
              harvestAt.toISOString(),
            fertilizer_used: false,
            updated_at: nowIso(),
          })
          .eq("id", plot.id)
          .is("crop_type", null)
          .select("*")
          .single();

      if (plotError) {
        throw plotError;
      }

      const newAmount =
        currentAmount - 1;

      const { data: updatedInventory, error: invError } =
        await supabase
          .from("player_inventory")
          .update({
            amount: newAmount,
            updated_at: nowIso(),
          })
          .eq("id", inventory.data.id)
          .eq("amount", currentAmount)
          .select("*")
          .maybeSingle();

      if (invError) {
        throw invError;
      }

      if (!updatedInventory) {
        return res.status(409).json({
          ok: false,
          error:
            "Kho vừa thay đổi. Vui lòng thử lại.",
        });
      }

      return res.json({
        ok: true,
        plot: updatedPlot,
        inventory: updatedInventory,
      });
    } catch (error) {
      console.error(
        "Plant error:",
        error.message
      );

      return res.status(500).json({
        ok: false,
        error: "Không thể trồng cây",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| FERTILIZER
|--------------------------------------------------------------------------
*/

app.post(
  "/api/game/fertilize",
  requireTelegram,
  async (req, res) => {
    try {
      const plotNumber =
        Number(req.body.plotNumber);

      if (!isValidPlotNumber(plotNumber)) {
        return res.status(400).json({
          ok: false,
          error: "plotNumber không hợp lệ",
        });
      }

      const plot = req.plots.find(
        (item) =>
          Number(item.plot_number) === plotNumber
      );

      if (!plot) {
        return res.status(404).json({
          ok: false,
          error: "Không tìm thấy ô đất",
        });
      }

      if (!plot.unlocked || !plot.crop_type) {
        return res.status(400).json({
          ok: false,
          error:
            "Ô đất chưa có cây để bón phân",
        });
      }

      if (plot.fertilizer_used) {
        return res.status(400).json({
          ok: false,
          error:
            "Cây này đã dùng phân bón",
        });
      }

      const fertilizer =
        Number(req.player.fertilizer || 0);

      if (fertilizer <= 0) {
        return res.status(400).json({
          ok: false,
          error: "Không còn phân bón",
        });
      }

      const reductionMinutes =
        getFertilizerReductionMinutes(
          plot.crop_type
        );

      const currentHarvest =
        new Date(plot.harvest_at);

      const newHarvest =
        new Date(
          currentHarvest.getTime() -
            reductionMinutes * 60 * 1000
        );

      const newFertilizer =
        fertilizer - 1;

      const { data: updatedPlayer, error: playerError } =
        await supabase
          .from("players")
          .update({
            fertilizer: newFertilizer,
            updated_at: nowIso(),
          })
          .eq("id", req.playerId)
          .eq("fertilizer", fertilizer)
          .select("*")
          .maybeSingle();

      if (playerError) {
        throw playerError;
      }

      if (!updatedPlayer) {
        return res.status(409).json({
          ok: false,
          error:
            "Phân bón vừa thay đổi. Vui lòng thử lại.",
        });
      }

      const { data: updatedPlot, error: plotError } =
        await supabase
          .from("plots")
          .update({
            harvest_at:
              newHarvest.toISOString(),
            fertilizer_used: true,
            updated_at: nowIso(),
          })
          .eq("id", plot.id)
          .eq("fertilizer_used", false)
          .select("*")
          .single();

      if (plotError) {
        throw plotError;
      }

      return res.json({
        ok: true,
        player: updatedPlayer,
        plot: updatedPlot,
        reductionMinutes,
      });
    } catch (error) {
      console.error(
        "Fertilizer error:",
        error.message
      );

      return res.status(500).json({
        ok: false,
        error: "Không thể bón phân",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| HARVEST
|--------------------------------------------------------------------------
*/

app.post(
  "/api/game/harvest",
  requireTelegram,
  async (req, res) => {
    try {
      const plotNumber =
        Number(req.body.plotNumber);

      if (!isValidPlotNumber(plotNumber)) {
        return res.status(400).json({
          ok: false,
          error: "plotNumber không hợp lệ",
        });
      }

      const plot = req.plots.find(
        (item) =>
          Number(item.plot_number) === plotNumber
      );

      if (!plot) {
        return res.status(404).json({
          ok: false,
          error: "Không tìm thấy ô đất",
        });
      }

      if (!plot.crop_type) {
        return res.status(400).json({
          ok: false,
          error: "Ô đất chưa trồng cây",
        });
      }

      if (!plot.harvest_at) {
        return res.status(400).json({
          ok: false,
          error:
            "Không có thời gian thu hoạch",
        });
      }

      const harvestTime =
        new Date(plot.harvest_at).getTime();

      if (Date.now() < harvestTime) {
        return res.status(400).json({
          ok: false,
          error: "Cây chưa chín",
          harvestAt: plot.harvest_at,
        });
      }

      const seedKey =
        plot.crop_type;

      const seed =
        SEEDS[seedKey];

      if (!seed) {
        return res.status(400).json({
          ok: false,
          error: "Loại cây không hợp lệ",
        });
      }

      /*
       * Ở bản hiện tại:
       * 1 lần trồng → 1 nông sản.
       * Có thể nâng cấp sản lượng sau.
       */
      const harvestAmount = 1;

      const expGain =
        getRandomExp();

      const nextStats =
        addExp(
          req.player,
          expGain
        );

      const { data: updatedPlot, error: plotError } =
        await supabase
          .from("plots")
          .update({
            crop_type: null,
            planted_at: null,
            harvest_at: null,
            fertilizer_used: false,
            updated_at: nowIso(),
          })
          .eq("id", plot.id)
          .eq("crop_type", seedKey)
          .eq("harvest_at", plot.harvest_at)
          .select("*")
          .maybeSingle();

      if (plotError) {
        throw plotError;
      }

      if (!updatedPlot) {
        return res.status(409).json({
          ok: false,
          error:
            "Cây vừa được thu hoạch hoặc dữ liệu đã thay đổi.",
        });
      }

      const inventory =
        await addInventory(
          req.playerId,
          seedKey,
          harvestAmount
        );

      const { data: updatedPlayer, error: playerError } =
        await supabase
          .from("players")
          .update({
            level: nextStats.level,
            exp: nextStats.exp,
            updated_at: nowIso(),
          })
          .eq("id", req.playerId)
          .select("*")
          .single();

      if (playerError) {
        throw playerError;
      }

      return res.json({
        ok: true,

        player: updatedPlayer,

        plot: updatedPlot,

        inventory,

        harvested: {
          seedKey,
          amount: harvestAmount,
        },

        expGain,
      });
    } catch (error) {
      console.error(
        "Harvest error:",
        error.message
      );

      return res.status(500).json({
        ok: false,
        error: "Không thể thu hoạch",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| SELL
|--------------------------------------------------------------------------
*/

app.post(
  "/api/game/sell",
  requireTelegram,
  async (req, res) => {
    try {
      const seedKey =
        String(req.body.seedKey || "");

      const amount =
        Number(req.body.amount);

      if (!SEEDS[seedKey]) {
        return res.status(400).json({
          ok: false,
          error: "Loại nông sản không hợp lệ",
        });
      }

      if (
        !Number.isInteger(amount) ||
        amount <= 0
      ) {
        return res.status(400).json({
          ok: false,
          error: "Số lượng bán không hợp lệ",
        });
      }

      const { data: inventory, error: invError } =
        await supabase
          .from("player_inventory")
          .select("*")
          .eq("player_id", req.playerId)
          .eq("seed_key", seedKey)
          .maybeSingle();

      if (invError) {
        throw invError;
      }

      if (
        !inventory ||
        Number(inventory.amount) < amount
      ) {
        return res.status(400).json({
          ok: false,
          error: "Không đủ nông sản",
        });
      }

      const sellPrice =
        SEEDS[seedKey].sellPrice;

      const totalCoins =
        sellPrice * amount;

      const currentAmount =
        Number(inventory.amount);

      const newAmount =
        currentAmount - amount;

      const { data: updatedInventory, error: updateInvError } =
        await supabase
          .from("player_inventory")
          .update({
            amount: newAmount,
            updated_at: nowIso(),
          })
          .eq("id", inventory.id)
          .eq("amount", currentAmount)
          .select("*")
          .maybeSingle();

      if (updateInvError) {
        throw updateInvError;
      }

      if (!updatedInventory) {
        return res.status(409).json({
          ok: false,
          error:
            "Kho vừa thay đổi. Vui lòng thử lại.",
        });
      }

      const currentCoins =
        Number(req.player.coins || 0);

      const newCoins =
        currentCoins + totalCoins;

      const { data: updatedPlayer, error: playerError } =
        await supabase
          .from("players")
          .update({
            coins: newCoins,
            updated_at: nowIso(),
          })
          .eq("id", req.playerId)
          .eq("coins", currentCoins)
          .select("*")
          .maybeSingle();

      if (playerError) {
        throw playerError;
      }

      if (!updatedPlayer) {
        return res.status(409).json({
          ok: false,
          error:
            "Coin vừa thay đổi. Vui lòng thử lại.",
        });
      }

      return res.json({
        ok: true,

        player: updatedPlayer,

        inventory: updatedInventory,

        sold: {
          seedKey,
          amount,
          priceEach: sellPrice,
          totalCoins,
        },
      });
    } catch (error) {
      console.error(
        "Sell error:",
        error.message
      );

      return res.status(500).json({
        ok: false,
        error: "Không thể bán nông sản",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| 404
|--------------------------------------------------------------------------
*/

app.use((req, res) => {
  res.status(404).json({
    ok: false,
    error: "API endpoint không tồn tại",
  });
});

/*
|--------------------------------------------------------------------------
| Error handler
|--------------------------------------------------------------------------
*/

app.use((error, req, res, next) => {
  console.error(
    "Server error:",
    error.message
  );

  if (error.message === "CORS blocked") {
    return res.status(403).json({
      ok: false,
      error: "CORS blocked",
    });
  }

  res.status(500).json({
    ok: false,
    error: "Internal server error",
  });
});

/*
|--------------------------------------------------------------------------
| Start
|--------------------------------------------------------------------------
*/

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `🌱 Telegram Farm backend đang chạy tại port ${PORT}`
  );
});
