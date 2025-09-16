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
// Car filter + sort
// =========================
document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");
  const fuelFilter = document.getElementById("fuelFilter");
  const priceFilter = document.getElementById("priceFilter");
  const sortBy = document.getElementById("sortBy");
  const carCards = Array.from(document.querySelectorAll(".car-card"));
  const container = document.querySelector(".grid");

  function filterAndSort() {
    let searchVal = searchInput.value.toLowerCase();
    let fuelVal = fuelFilter.value;
    let priceVal = priceFilter.value;
    let sortVal = sortBy.value;

    let filtered = carCards.filter(card => {
      let name = card.querySelector(".car-title").innerText.toLowerCase();
      let fuel = card.dataset.fuel;
      let price = parseInt(card.dataset.price);

      let matchSearch = name.includes(searchVal);
      let matchFuel = fuelVal === "" || fuel === fuelVal;
      let matchPrice = true;

      if (priceVal === "20-50") matchPrice = price >= 2000000 && price <= 5000000;
      if (priceVal === "50-100") matchPrice = price > 5000000 && price <= 10000000;
      if (priceVal === "100+") matchPrice = price > 10000000;

      return matchSearch && matchFuel && matchPrice;
    });

    // Sorting
    if (sortVal === "priceLowHigh") {
      filtered.sort((a, b) => parseInt(a.dataset.price) - parseInt(b.dataset.price));
    } else if (sortVal === "priceHighLow") {
      filtered.sort((a, b) => parseInt(b.dataset.price) - parseInt(a.dataset.price));
    } else if (sortVal === "nameAZ") {
      filtered.sort((a, b) => a.querySelector(".car-title").innerText.localeCompare(b.querySelector(".car-title").innerText));
    } else if (sortVal === "nameZA") {
      filtered.sort((a, b) => b.querySelector(".car-title").innerText.localeCompare(a.querySelector(".car-title").innerText));
    }

    container.innerHTML = "";
    filtered.forEach(card => container.appendChild(card));
  }

  searchInput.addEventListener("input", filterAndSort);
  fuelFilter.addEventListener("change", filterAndSort);
  priceFilter.addEventListener("change", filterAndSort);
  sortBy.addEventListener("change", filterAndSort);

  filterAndSort();
});

// =========================
// Reveal cards on scroll
// =========================
document.addEventListener("DOMContentLoaded", () => {
  const cards = document.querySelectorAll(".car-card");
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("show");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  cards.forEach(card => observer.observe(card));
});

// =========================
// Sold-out cars popup
// =========================
document.addEventListener("DOMContentLoaded", () => {
  const soldCards = document.querySelectorAll('.car-card[data-soldout="true"]');
  soldCards.forEach(card => {
    const buttons = card.querySelectorAll(".btn-outline, .btn-primary");
    const carName = card.querySelector(".car-title")?.textContent || "This vehicle";
    buttons.forEach(btn => btn.addEventListener("click", e => {
      e.preventDefault();
      showSoldOutPopup(carName);
    }));
  });
});

function showSoldOutPopup(carName) {
  const modal = document.getElementById("soldoutModal");
  document.getElementById("soldoutMessage").textContent = `🚫 Sorry, ${carName} is already sold out!`;
  modal.classList.add("show");
}

function closeSoldOutModal() {
  document.getElementById("soldoutModal").classList.remove("show");
}
window.closeSoldOutModal = closeSoldOutModal;

// =========================
// Purchase Flow with EmailJS
// =========================
let selectedCar = null;
const purchaseModal = document.getElementById("purchaseModal");
const confirmBtn = document.getElementById("confirmPurchaseBtn");

// ✅ Initialize EmailJS (make sure <script src="https://cdn.jsdelivr.net/npm/emailjs-com@3/dist/email.min.js"></script> is in your HTML)
emailjs.init("tVUeCgo92oRs5zwnq"); // 🔑 Replace with your real Public Key

// Open purchase modal
document.querySelectorAll(".car-card .btn-primary").forEach(button => {
  button.addEventListener("click", e => {
    e.preventDefault();
    const card = e.target.closest(".car-card");

    if (card.dataset.soldout === "true") return;

    selectedCar = {
      name: card.querySelector(".car-title")?.textContent,
      price: parseInt(card.dataset.price) || 0,
      element: card
    };

    document.getElementById("purchaseCarName").textContent = `Book ${selectedCar.name}?`;
    document.getElementById("purchaseCarPrice").textContent = `Price: ₹${selectedCar.price.toLocaleString()}`;
    purchaseModal.style.display = "flex";
  });
});

const GST_RATE = 0.28; // 28%

// Confirm purchase
confirmBtn.addEventListener("click", async () => {
  if (!selectedCar) return;

  const user = auth.currentUser;
  if (!user) {
    alert("⚠️ Please log in first.");
    window.location.href = "login.html";
    return;
  }

  const address = document.getElementById("purchaseAddress").value.trim();
  if (!address) {
    alert("📍 Please enter your address.");
    return;
  }

  // 🧮 GST calculation
  const gstAmount = Math.round(selectedCar.price * GST_RATE);
  const totalPrice = selectedCar.price + gstAmount;

  try {
    // Save purchase in Firestore
    await addDoc(collection(db, "users", user.uid, "purchases"), {
      itemName: selectedCar.name,
      baseAmount: selectedCar.price,
      gst: gstAmount,
      totalAmount: totalPrice,
      address,
      date: new Date().toLocaleDateString(),
      createdAt: serverTimestamp()
    });

    // Send confirmation email
    await emailjs.send("service_lm77ga9", "template_245nooi", {
      email: user.email,
      order_id: Date.now(),
      name: user.displayName || "Customer",
      car_name: selectedCar.name,
      base_price: `₹${selectedCar.price.toLocaleString()}`,
      gst: `₹${gstAmount.toLocaleString()}`,
      total_price: `₹${totalPrice.toLocaleString()}`,
      address: address
    });

    // ✅ Success UI with styled buttons
purchaseModal.querySelector(".modal-content").innerHTML = `
  <h2 style="color: #28a745; font-size: 22px; margin-bottom: 10px;">✅ Purchase Successful!</h2>
  <p style="margin: 5px 0; font-size: 16px;">${selectedCar.name} has been booked.</p>
  <p style="margin: 5px 0;">Base Price: ₹${selectedCar.price.toLocaleString()}</p>
  <p style="margin: 5px 0;">GST (28%): ₹${gstAmount.toLocaleString()}</p>
  <p style="margin: 5px 0; font-weight: bold;">Total: ₹${totalPrice.toLocaleString()}</p>
  <p style="margin: 10px 0;">A confirmation email has been sent to <b>${user.email}</b>.</p>

  <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: center;">
    <button id="okayBtn" 
      style="padding: 8px 16px; background-color: #007bff; border: none; color: white; 
             font-size: 14px; border-radius: 5px; cursor: pointer;">
      Okay
    </button>
    <button id="closeSuccessModal" 
      style="padding: 8px 16px; background-color: #6c757d; border: none; color: white; 
             font-size: 14px; border-radius: 5px; cursor: pointer;">
      Close
    </button>
  </div>
`;

// Disable car button
selectedCar.element.querySelector(".btn-primary").textContent = "Booked ✅";
selectedCar.element.querySelector(".btn-primary").disabled = true;
selectedCar = null;

// Add event listeners
document.getElementById("closeSuccessModal").addEventListener("click", closePurchaseModal);
document.getElementById("okayBtn").addEventListener("click", closePurchaseModal);


// Disable car button
selectedCar.element.querySelector(".btn-primary").textContent = "Booked ✅";
selectedCar.element.querySelector(".btn-primary").disabled = true;
selectedCar = null;

// Add event listeners
document.getElementById("closeSuccessModal").addEventListener("click", closePurchaseModal);
document.getElementById("okayBtn").addEventListener("click", closePurchaseModal);


  } catch (err) {
    console.error(err);
    alert("❌ Something went wrong. Try again.");
  }
});

// Close modal function
function closePurchaseModal() {
  if (purchaseModal) purchaseModal.style.display = "none";
}
window.closePurchaseModal = closePurchaseModal;
