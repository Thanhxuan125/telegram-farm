// =========================
// DỮ LIỆU 10 LOẠI HẠT
// =========================

const seeds = [
  {
    id: "wheat",
    name: "Lúa mì",
    price: 10,
    unlockLevel: 1,
    growTime: 20
  },

  {
    id: "corn",
    name: "Ngô",
    price: 20,
    unlockLevel: 3,
    growTime: 60
  },

  {
    id: "radish",
    name: "Củ cải",
    price: 35,
    unlockLevel: 7,
    growTime: 90
  },

  {
    id: "carrot",
    name: "Cà rốt",
    price: 50,
    unlockLevel: 10,
    growTime: 150
  },

  {
    id: "beet",
    name: "Củ dền",
    price: 75,
    unlockLevel: 13,
    growTime: 280
  },

  {
    id: "eggplant",
    name: "Cà tím",
    price: 100,
    unlockLevel: 15,
    growTime: 450
  },

  {
    id: "chili",
    name: "Ớt",
    price: 180,
    unlockLevel: 17,
    growTime: 650
  },

  {
    id: "green_onion",
    name: "Hành lá",
    price: 250,
    unlockLevel: 20,
    growTime: 870
  },

  {
    id: "cabbage",
    name: "Bắp cải",
    price: 500,
    unlockLevel: 23,
    growTime: 950
  },

  {
    id: "pumpkin",
    name: "Bí đỏ",
    price: 1000,
    unlockLevel: 25,
    growTime: 1200
  }
];


// =========================
// LẤY PHẦN TỬ
// =========================

const plots = document.querySelectorAll(".plot");

const seedPanel = document.getElementById("seedPanel");

const seedClose = document.getElementById("seedClose");


// =========================
// BẤM Ô ĐẤT
// =========================

plots.forEach((plot) => {

  plot.addEventListener("click", () => {

    // Ô khóa không làm gì
    if (plot.classList.contains("locked")) {
      return;
    }

    seedPanel.classList.add("show");

  });

});


// =========================
// ĐÓNG BẢNG HẠT
// =========================

seedClose.addEventListener("click", () => {

  seedPanel.classList.remove("show");

});


// =========================
// BẤM RA NGOÀI
// =========================

seedPanel.addEventListener("click", (event) => {

  if (event.target === seedPanel) {

    seedPanel.classList.remove("show");

  }

});
