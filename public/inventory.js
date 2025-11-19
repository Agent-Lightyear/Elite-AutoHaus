// =========================
// Imports
// =========================
import { auth, db } from "./firebase.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

// =========================
// Navbar scroll effect
// =========================
const header = document.querySelector("header");
window.addEventListener("scroll", () => {
  header.classList.toggle("scrolled", window.scrollY > 50);
});

// =========================
// Hero slider
// =========================
const slides = document.querySelectorAll(".hero-slide");
const dots = document.querySelectorAll(".dot");
let currentSlide = 0;

function showSlide(index) {
  slides.forEach((slide, i) => {
    slide.classList.toggle("active", i === index);
    dots[i].classList.toggle("active", i === index);
  });
  currentSlide = index;
}

document.getElementById("next").addEventListener("click", () => showSlide((currentSlide + 1) % slides.length));
document.getElementById("prev").addEventListener("click", () => showSlide((currentSlide - 1 + slides.length) % slides.length));
dots.forEach((dot, i) => dot.addEventListener("click", () => showSlide(i)));

setInterval(() => showSlide((currentSlide + 1) % slides.length), 5000);
showSlide(0);



// =========================
// Car Filter + Sort
// =========================
document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");
  const fuelFilter = document.getElementById("fuelFilter");
  const priceFilter = document.getElementById("priceFilter");
  const sortBy = document.getElementById("sortBy");
  const carCards = [...document.querySelectorAll(".car-card")];
  const container = document.querySelector(".inv-grid");

  function filterAndSort() {
    const searchVal = searchInput.value.toLowerCase();
    const fuelVal = fuelFilter.value;
    const priceVal = priceFilter.value;
    const sortVal = sortBy.value;

    let filtered = carCards.filter(card => {
      const name = card.querySelector(".car-title").innerText.toLowerCase();
      const price = +card.dataset.price;
      const fuel = card.dataset.fuel;

      return (
        name.includes(searchVal) &&
        (fuelVal === "" || fuel === fuelVal) &&
        (
          priceVal === "" ||
          (priceVal === "20-50" && price >= 2000000 && price <= 5000000) ||
          (priceVal === "50-100" && price > 5000000 && price <= 10000000) ||
          (priceVal === "100+" && price > 10000000)
        )
      );
    });


    // Sorting rules
    filtered.sort((a, b) => {
      if (sortVal === "priceLowHigh") return +a.dataset.price - +b.dataset.price;
      if (sortVal === "priceHighLow") return +b.dataset.price - +a.dataset.price;
      if (sortVal === "nameAZ") return a.querySelector(".car-title").innerText.localeCompare(b.querySelector(".car-title").innerText);
      if (sortVal === "nameZA") return b.querySelector(".car-title").innerText.localeCompare(a.querySelector(".car-title").innerText);
      return 0;
    });

    // Re-attach
    container.innerHTML = "";
    filtered.forEach(c => container.appendChild(c));
  }

  searchInput.addEventListener("input", filterAndSort);
  fuelFilter.addEventListener("change", filterAndSort);
  priceFilter.addEventListener("change", filterAndSort);
  sortBy.addEventListener("change", filterAndSort);

  filterAndSort();

  const carListSection = document.getElementById("carGrid");
  const exploreButtons = document.querySelectorAll(".explore-btn");

  if (carListSection) {
    exploreButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        carListSection.scrollIntoView({ behavior: "smooth" });
      });
    });
  }
});

// Brand sorting
document.addEventListener("DOMContentLoaded", function () {
  const params = new URLSearchParams(window.location.search);
  const brandParam = params.get("brand");

  if (!brandParam) return; // no brand selected → show all

  const selectedBrand = brandParam.toLowerCase();
  const cards = document.querySelectorAll(".car-card");

  cards.forEach(card => {
    const cardBrand = (card.dataset.brand || "").toLowerCase();

    if (cardBrand === selectedBrand) {
      card.style.display = ""; // keep default (flex/grid/block depending on your CSS)
    } else {
      card.style.display = "none";
    }
  });
});

// =========================
// Card animations
// =========================
const observer = new IntersectionObserver(
  entries => entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add("show");
      observer.unobserve(e.target);
    }
  }),
  { threshold: 0.2 }
);

document.querySelectorAll(".car-card").forEach(card => observer.observe(card));

// =========================
// Sold-out Handler
// =========================
document.querySelectorAll('.car-card[data-soldout="true"]').forEach(card => {
  const carName = card.querySelector(".car-title")?.textContent ?? "This vehicle";
  card.querySelectorAll(".btn-outline, .btn-primary").forEach(btn => {
    btn.addEventListener("click", e => {
      e.preventDefault();
      showSoldOutPopup(carName);
    });
  });
});

function showSoldOutPopup(carName) {
  const modal = document.getElementById("soldoutModal");
  document.getElementById("soldoutMessage").textContent = `🚫 Sorry, ${carName} is already sold out!`;
  modal.classList.add("show");
}

window.closeSoldOutModal = () => {
  document.getElementById("soldoutModal").classList.remove("show");
};

// =========================
// Purchase Flow + EmailJS
// =========================

// Init EmailJS safely
document.addEventListener("DOMContentLoaded", () => {
  if (emailjs && !emailjs._init) emailjs.init("tVUeCgo92oRs5zwnq");
});

let selectedCar = null;
const purchaseModal = document.getElementById("purchaseModal");

document.querySelectorAll(".car-card .btn-primary").forEach(button => {
  button.addEventListener("click", e => {
    const card = e.target.closest(".car-card");

    if (card.dataset.soldout === "true") return;

    selectedCar = {
      name: card.querySelector(".car-title").textContent,
      price: +card.dataset.price,
      cardEl: card
    };

    document.getElementById("purchaseCarName").textContent = `Book ${selectedCar.name}?`;
    document.getElementById("purchaseCarPrice").textContent = `Price: ₹${selectedCar.price.toLocaleString()}`;
    purchaseModal.style.display = "flex";
  });
});

const GST_RATE = 0.28;

document.getElementById("confirmPurchaseBtn").addEventListener("click", async () => {
  if (!selectedCar) return;

  const user = auth.currentUser;
  if (!user) {
    alert("⚠️ Login required.");
    return (window.location.href = "login.html");
  }

  const address = document.getElementById("purchaseAddress").value.trim();
  if (!address) return alert("📍 Enter your delivery address.");

  const gstAmount = Math.round(selectedCar.price * GST_RATE);
  const totalPrice = selectedCar.price + gstAmount;

  try {
    await addDoc(collection(db, "users", user.uid, "purchases"), {
      itemName: selectedCar.name,
      baseAmount: selectedCar.price,
      gst: gstAmount,
      totalAmount: totalPrice,
      address,
      date: new Date().toLocaleDateString(),
      createdAt: serverTimestamp()
    });

    await emailjs.send("service_lm77ga9", "template_245nooi", {
      name: user.displayName ?? "Customer",
      email: user.email,
      car_name: selectedCar.name,
      base_price: `₹${selectedCar.price.toLocaleString()}`,
      gst: `₹${gstAmount.toLocaleString()}`,
      total_price: `₹${totalPrice.toLocaleString()}`,
      address
    });

    successUI(user.email, selectedCar, gstAmount, totalPrice);

  } catch (err) {
    console.error(err);
    alert("❌ Error processing purchase.");
  }
});

function successUI(email, car, gstAmount, totalPrice) {
  purchaseModal.querySelector(".modal-content").innerHTML = `
    <h2 style="color:#28a745;">✅ Purchase Successful!</h2>
    <p>${car.name} has been booked.</p>
    <p>Base Price: ₹${car.price.toLocaleString()}</p>
    <p>GST (28%): ₹${gstAmount.toLocaleString()}</p>
    <p><b>Total: ₹${totalPrice.toLocaleString()}</b></p>
    <p>Email sent to <b>${email}</b></p>

    <button id="okBtn" class="btn-primary w-full mt-3">Okay</button>
  `;

  const btn = car.cardEl.querySelector(".btn-primary");
  btn.textContent = "Booked ✔";
  btn.disabled = true;

  document.getElementById("okBtn").onclick = closePurchaseModal;
  selectedCar = null;
}

function closePurchaseModal() {
  purchaseModal.style.display = "none";
}

window.closePurchaseModal = closePurchaseModal;


function scrollToCars() {
  document.getElementById("carGrid").scrollIntoView({
    behavior: "smooth"
  });
}
