
// ✅ Navbar scroll effect (only once)
const header = document.querySelector("header");

window.addEventListener("scroll", () => {
  if (window.scrollY > 50) {
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");
  }
});


const slides = document.querySelectorAll(".hero-slide");
const dots = document.querySelectorAll(".dot");
let currentSlide = 0;

// Show specific slide
function showSlide(index) {
    slides.forEach((slide, i) => {
        slide.classList.toggle("active", i === index);
        dots[i].classList.toggle("active", i === index);
    });
    currentSlide = index;
}

// Next button
document.getElementById("next").addEventListener("click", () => {
    let newIndex = (currentSlide + 1) % slides.length;
    showSlide(newIndex);
});

// Prev button
document.getElementById("prev").addEventListener("click", () => {
    let newIndex = (currentSlide - 1 + slides.length) % slides.length;
    showSlide(newIndex);
});

// Dot navigation
dots.forEach((dot, i) => {
    dot.addEventListener("click", () => showSlide(i));
});

// Auto slide every 5s
setInterval(() => {
    let newIndex = (currentSlide + 1) % slides.length;
    showSlide(newIndex);
}, 5000);

// Initialize first slide
showSlide(0);


const searchInput = document.getElementById("searchInput");
const fuelFilter = document.getElementById("fuelFilter");
const priceFilter = document.getElementById("priceFilter");
const carCards = document.querySelectorAll(".car-card");

function parsePrice(priceText) {
  // Example: "₹75,00,000" → 7500000
  return parseInt(priceText.replace(/[₹,]/g, ""), 10);
}

function filterCars() {
  const searchText = searchInput.value.toLowerCase();
  const selectedFuel = fuelFilter.value;
  const selectedPrice = priceFilter.value;

  carCards.forEach(card => {
    const name = card.querySelector(".car-title").textContent.toLowerCase();
    const fuel = card.querySelector(".car-tag").classList[1]; // petrol, diesel, hybrid, ev
    const price = parsePrice(card.querySelector(".car-price").textContent);

    const matchesSearch = name.includes(searchText);
    const matchesFuel = !selectedFuel || fuel === selectedFuel;

    let matchesPrice = true;
    if (selectedPrice) {
      const [min, max] = selectedPrice.split("-").map(Number);
      matchesPrice = price >= min && price <= max;
    }

    if (matchesSearch && matchesFuel && matchesPrice) {
      card.style.display = "block";
    } else {
      card.style.display = "none";
    }
  });
}

// Event listeners
searchInput.addEventListener("input", filterCars);
fuelFilter.addEventListener("change", filterCars);
priceFilter.addEventListener("change", filterCars);


