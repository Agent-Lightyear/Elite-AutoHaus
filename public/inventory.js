
// ✅ Navbar scroll effect (only once)
const header = document.querySelector("header");
window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
        header.classList.add("bg-[#181E26]", "shadow-md");
        header.classList.remove("bg-transparent");
    } else {
        header.classList.remove("bg-[#181E26]", "shadow-md");
        header.classList.add("bg-transparent");
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


