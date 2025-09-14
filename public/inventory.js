
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



document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.getElementById("searchInput");
  const fuelFilter = document.getElementById("fuelFilter");
  const priceFilter = document.getElementById("priceFilter");
  const sortBy = document.getElementById("sortBy");
  const carCards = Array.from(document.querySelectorAll(".car-card")); 

  function filterAndSort() {
    let searchVal = searchInput.value.toLowerCase();
    let fuelVal = fuelFilter.value;
    let priceVal = priceFilter.value;
    let sortVal = sortBy.value;

    let filtered = carCards.filter(card => {
      let name = card.querySelector(".car-title").innerText.toLowerCase();
      let fuel = card.getAttribute("data-fuel"); 
      let price = parseInt(card.getAttribute("data-price"));

      // search
      let matchSearch = name.includes(searchVal);

      // fuel filter
      let matchFuel = fuelVal === "" || fuel === fuelVal;

      // price filter
      let matchPrice = true;
      if (priceVal === "20-50") matchPrice = price >= 2000000 && price <= 5000000;
      if (priceVal === "50-100") matchPrice = price > 5000000 && price <= 10000000;
      if (priceVal === "100+") matchPrice = price > 10000000;

      return matchSearch && matchFuel && matchPrice;
    });

    // sorting
    if (sortVal === "priceLowHigh") {
      filtered.sort((a, b) => 
        parseInt(a.getAttribute("data-price")) - parseInt(b.getAttribute("data-price"))
      );
    } else if (sortVal === "priceHighLow") {
      filtered.sort((a, b) => 
        parseInt(b.getAttribute("data-price")) - parseInt(a.getAttribute("data-price"))
      );
    } else if (sortVal === "nameAZ") {
      filtered.sort((a, b) => 
        a.querySelector(".car-title").innerText.localeCompare(b.querySelector(".car-title").innerText)
      );
    } else if (sortVal === "nameZA") {
      filtered.sort((a, b) => 
        b.querySelector(".car-title").innerText.localeCompare(a.querySelector(".car-title").innerText)
      );
    }

    // ✅ your grid container
    const container = document.querySelector(".grid");  
    container.innerHTML = "";
    filtered.forEach(card => container.appendChild(card));
  }

  // events
  searchInput.addEventListener("input", filterAndSort);
  fuelFilter.addEventListener("change", filterAndSort);
  priceFilter.addEventListener("change", filterAndSort);
  sortBy.addEventListener("change", filterAndSort);

  filterAndSort();
});


document.addEventListener("DOMContentLoaded", () => {
  const cards = document.querySelectorAll(".car-card");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("show");
          observer.unobserve(entry.target); // reveal only once
        }
      });
    },
    { threshold: 0.2 } // triggers when 20% of card is visible
  );

  cards.forEach(card => observer.observe(card));
});


