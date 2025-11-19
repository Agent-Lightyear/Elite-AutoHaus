// inventory.js (complete)

// =========================
// Imports (keep as module)
// =========================
import { auth, db } from "./firebase.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

// =========================
// Navbar scroll effect (runs immediately)
// =========================
const header = document.querySelector("header");
if (header) {
  window.addEventListener("scroll", () => {
    header.classList.toggle("scrolled", window.scrollY > 50);
  });
}

// =========================
// Global helpers & modal close functions (exposed for inline onclick attributes)
// =========================
window.closeSoldOutModal = () => {
  const modal = document.getElementById("soldoutModal");
  if (modal) modal.classList.remove("show");
};

window.closePurchaseModal = () => {
  const purchaseModal = document.getElementById("purchaseModal");
  if (purchaseModal) purchaseModal.style.display = "none";
};

// =========================
// Consolidated initializer
// (handles hero, filters, sort, brand filter, observer, sold-out handlers, purchase wiring)
// =========================
document.addEventListener("DOMContentLoaded", () => {
  // --- Safe EmailJS init (if EmailJS script loaded separately) ---
  if (window.emailjs && !emailjs._init) {
    try { emailjs.init("tVUeCgo92oRs5zwnq"); } catch (e) { /* silent */ }
  }

  // ---------------- HERO SLIDER ----------------
  const slides = Array.from(document.querySelectorAll(".hero-slide"));
  const dots = Array.from(document.querySelectorAll(".dot"));
  let currentSlide = 0;
  let slideTimer = null;

  function showSlide(index) {
    if (!slides.length) return;
    index = (index + slides.length) % slides.length;
    slides.forEach((s, i) => s.classList.toggle("active", i === index));
    if (dots && dots.length) dots.forEach((d, i) => d.classList.toggle("active", i === index));
    currentSlide = index;
  }

  const nextBtn = document.getElementById("next");
  const prevBtn = document.getElementById("prev");
  if (nextBtn) nextBtn.addEventListener("click", () => showSlide(currentSlide + 1));
  if (prevBtn) prevBtn.addEventListener("click", () => showSlide(currentSlide - 1));
  if (dots && dots.length) dots.forEach((dot, i) => dot.addEventListener("click", () => showSlide(i)));

  if (slideTimer) clearInterval(slideTimer);
  slideTimer = setInterval(() => showSlide(currentSlide + 1), 5000);
  showSlide(0);

  // Ensure Explore buttons scroll to car grid
  const carGridEl = document.getElementById("carGrid");
  document.querySelectorAll(".explore-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const href = btn.getAttribute && btn.getAttribute("href");
      if (href && href.trim()) return; // allow normal navigation
      if (carGridEl) {
        carGridEl.scrollIntoView({ behavior: "smooth" });
      } else {
        window.location.href = "cars.html";
      }
    });
  });

  // ---------------- FILTERS & SORT ----------------
  const searchInput = document.getElementById("searchInput");
  const fuelFilter = document.getElementById("fuelFilter");
  const priceFilter = document.getElementById("priceFilter");
  const sortBy = document.getElementById("sortBy");
  const container = document.querySelector(".inv-grid");

  // Capture original card nodes once
  const allCards = Array.from(document.querySelectorAll(".car-card"));

  function applyFiltersAndSort() {
    const searchVal = (searchInput?.value || "").toLowerCase();
    const fuelVal = (fuelFilter?.value || "");
    const priceVal = (priceFilter?.value || "");
    const sortVal = (sortBy?.value || "");

    let filtered = allCards.filter(card => {
      const name = (card.querySelector(".car-title")?.innerText || "").toLowerCase();
      const price = Number(card.dataset.price || 0);
      const fuel = (card.dataset.fuel || "");

      const matchesSearch = name.includes(searchVal);
      const matchesFuel = (fuelVal === "" || fuel === fuelVal);
      const matchesPrice = (priceVal === "") ||
        (priceVal === "20-50" && price >= 2000000 && price <= 5000000) ||
        (priceVal === "50-100" && price > 5000000 && price <= 10000000) ||
        (priceVal === "100+" && price > 10000000);

      return matchesSearch && matchesFuel && matchesPrice;
    });

    // Sorting
  filtered.sort((a, b) => {
  const pa = Number(a.dataset.price || 0);
  const pb = Number(b.dataset.price || 0);
  const na = (a.querySelector(".car-title")?.innerText || "").trim();
  const nb = (b.querySelector(".car-title")?.innerText || "").trim();

  // Availability sorting: available (not sold out) first
  if (sortVal === "availability") {
    const aAvailable = a.dataset.soldout === "true" ? 0 : 1; // 1 = available
    const bAvailable = b.dataset.soldout === "true" ? 0 : 1;
    if (aAvailable !== bAvailable) return bAvailable - aAvailable; // available first
    // secondary: keep original order by price ascending
    return pa - pb;
  }

  // Best-selling sorting: bestseller first
  if (sortVal === "bestSelling") {
    const aBest = a.dataset.bestseller === "true" ? 1 : 0;
    const bBest = b.dataset.bestseller === "true" ? 1 : 0;
    if (aBest !== bBest) return bBest - aBest; // bestseller first

    // secondary: keep available cars above sold-out (if both same bestseller state)
    const aAvailable = a.dataset.soldout === "true" ? 0 : 1;
    const bAvailable = b.dataset.soldout === "true" ? 0 : 1;
    if (aAvailable !== bAvailable) return bAvailable - aAvailable;

    // tertiary: price low → high
    return pa - pb;
  }

  // existing sorts
  if (sortVal === "priceLowHigh") return pa - pb;
  if (sortVal === "priceHighLow") return pb - pa;
  if (sortVal === "nameAZ") return na.localeCompare(nb);
  if (sortVal === "nameZA") return nb.localeCompare(na);
  return 0;
});


    // Render safely using DocumentFragment
    if (!container) return;
    const frag = document.createDocumentFragment();
    filtered.forEach(card => frag.appendChild(card));
    container.innerHTML = "";
    container.appendChild(frag);
  }

  if (searchInput) searchInput.addEventListener("input", applyFiltersAndSort);
  if (fuelFilter) fuelFilter.addEventListener("change", applyFiltersAndSort);
  if (priceFilter) priceFilter.addEventListener("change", applyFiltersAndSort);
  if (sortBy) sortBy.addEventListener("change", applyFiltersAndSort);

  // Initial render
  applyFiltersAndSort();

  // ---------------- Brand param filtering (if ?brand=XXX in URL) ----------------
  const params = new URLSearchParams(window.location.search);
  const brandParam = params.get("brand");
  if (brandParam && container) {
    const selectedBrand = brandParam.toLowerCase();
    allCards.forEach(card => {
      const cb = (card.dataset.brand || "").toLowerCase();
      card.style.display = (cb === selectedBrand) ? "" : "none";
    });
  }

  // ---------------- Intersection Observer for card reveal ----------------
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add("show");
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.2 });

  document.querySelectorAll(".car-card").forEach(c => observer.observe(c));

  // ---------------- Sold-out handler ----------------
  document.querySelectorAll('.car-card[data-soldout="true"]').forEach(card => {
    const carName = card.querySelector(".car-title")?.textContent ?? "this vehicle";
    card.querySelectorAll(".btn-outline, .btn-primary").forEach(btn => {
      btn.addEventListener("click", (ev) => {
        ev.preventDefault();
        const modal = document.getElementById("soldoutModal");
        if (modal) {
          const msgEl = document.getElementById("soldoutMessage");
          if (msgEl) msgEl.textContent = `🚫 Sorry, ${carName} is already sold out!`;
          modal.classList.add("show");
        } else {
          alert(`Sorry, ${carName} is sold out.`);
        }
      });
    });
  });

  // ---------------- Purchase flow wiring ----------------
  let selectedCar = null;
  const purchaseModal = document.getElementById("purchaseModal");
  const confirmPurchaseBtn = document.getElementById("confirmPurchaseBtn");
  const GST_RATE = 0.28;

  // Open purchase modal when a non-sold car's Book Now clicked
  document.querySelectorAll(".car-card .btn-primary").forEach(button => {
    button.addEventListener("click", (e) => {
      const card = e.target.closest(".car-card");
      if (!card || card.dataset.soldout === "true") return;
      selectedCar = {
        name: card.querySelector(".car-title")?.textContent || "Vehicle",
        price: Number(card.dataset.price || 0),
        cardEl: card
      };

      const nameEl = document.getElementById("purchaseCarName");
      const priceEl = document.getElementById("purchaseCarPrice");
      if (nameEl) nameEl.textContent = `Book ${selectedCar.name}?`;
      if (priceEl) priceEl.textContent = `Price: ₹${selectedCar.price.toLocaleString()}`;

      if (purchaseModal) purchaseModal.style.display = "flex";
    });
  });

  // Confirm purchase handler
  if (confirmPurchaseBtn) {
    confirmPurchaseBtn.addEventListener("click", async () => {
      if (!selectedCar) return;

      const user = auth?.currentUser;
      if (!user) {
        alert("⚠️ Login required.");
        return (window.location.href = "login.html");
      }

      const address = (document.getElementById("purchaseAddress")?.value || "").trim();
      if (!address) return alert("📍 Enter your delivery address.");

      const gstAmount = Math.round(selectedCar.price * GST_RATE);
      const totalPrice = selectedCar.price + gstAmount;

      try {
        // Save purchase to Firestore (users/{uid}/purchases)
        await addDoc(collection(db, "users", user.uid, "purchases"), {
          itemName: selectedCar.name,
          baseAmount: selectedCar.price,
          gst: gstAmount,
          totalAmount: totalPrice,
          address,
          date: new Date().toLocaleDateString(),
          createdAt: serverTimestamp()
        });

        // Send email via EmailJS (keep your service/template ids)
        if (window.emailjs) {
          await emailjs.send("service_lm77ga9", "template_245nooi", {
            name: user.displayName ?? "Customer",
            email: user.email,
            car_name: selectedCar.name,
            base_price: `₹${selectedCar.price.toLocaleString()}`,
            gst: `₹${gstAmount.toLocaleString()}`,
            total_price: `₹${totalPrice.toLocaleString()}`,
            address
          });
        }

        // success UI
        successUI(user.email, selectedCar, gstAmount, totalPrice);
      } catch (err) {
        console.error(err);
        alert("❌ Error processing purchase.");
      }
    });
  }

  // successUI: replaces modal content with confirmation and disables booked button
  function successUI(email, car, gstAmount, totalPrice) {
    const modalContent = purchaseModal?.querySelector(".modal-content");
    if (!modalContent) return;

    modalContent.innerHTML = `
      <h2 style="color:#28a745;">✅ Purchase Successful!</h2>
      <p>${car.name} has been booked.</p>
      <p>Base Price: ₹${car.price.toLocaleString()}</p>
      <p>GST (28%): ₹${gstAmount.toLocaleString()}</p>
      <p><b>Total: ₹${totalPrice.toLocaleString()}</b></p>
      <p>Email sent to <b>${email}</b></p>
      <button id="okBtn" class="btn-primary w-full mt-3">Okay</button>
    `;

    // update UI state of the original card's button
    try {
      const btn = car.cardEl.querySelector(".btn-primary");
      if (btn) {
        btn.textContent = "Booked ✔";
        btn.disabled = true;
      }
    } catch (e) { /* ignore */ }

    const okBtn = document.getElementById("okBtn");
    if (okBtn) okBtn.onclick = () => {
      selectedCar = null;
      purchaseModal.style.display = "none";
      // Optionally show a toast or redirect
    };
  }

}); // end DOMContentLoaded

// =========================
// Small exported helper (optional)
// =========================
function scrollToCars() {
  const el = document.getElementById("carGrid");
  if (el) el.scrollIntoView({ behavior: "smooth" });
}
window.scrollToCars = scrollToCars;
