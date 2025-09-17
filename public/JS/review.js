document.addEventListener('DOMContentLoaded', () => {
  // ===== Navbar logic =====
  const menuBtn = document.querySelector('.menu-btn');
  const navigation = document.querySelector('.navigation');
  const navLinks = document.querySelectorAll('.navigation a');
  const header = document.querySelector('header');

  if (menuBtn && navigation) {
    // Toggle menu
    menuBtn.addEventListener('click', () => {
      menuBtn.classList.toggle('active');
      navigation.classList.toggle('active');
    });

    // Close menu when clicking a link
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        menuBtn.classList.remove('active');
        navigation.classList.remove('active');
      });
    });

    // Change navbar background on scroll
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  }

  // ===== Review slider logic =====
  const reviews = [
    {
      name: "Diksha Thakur",
      text: "Awesome collection. I Have an Audi Q5 from here... Highly Recommended ✌️",
      rating: 5
    },
    {
      name: "Ibha Sharma",
      text: "EXCELLENT SERVICE AND QUICK PROCESS WILL SURELY SUGGEST EVERYONE TO GO AND BUY FROM HERE ONLY #EliteAutoHaus",
      rating: 5
    },
    {
      name: "Sanay Singh",
      text: "Great experience buying my car from Elite AutoHaus.",
      rating: 4
    }
  ];
  let currentReview = 0;

  function renderReview(index) {
    const review = reviews[index];
    const slider = document.getElementById('reviews-slider');
    if (slider) {
      slider.innerHTML = `
        <div class="review" style="margin-bottom:40px;">
          <div style="font-size:2.5rem; color:#c9a55b; display:inline-block; vertical-align:middle;">&#10077;</div>
          <span style="color:#ffc107; font-size:1.5rem;">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</span>
          <p style="font-size:1.1rem; color:#181E26; margin:20px 0;">${review.text}</p>
          <div style="font-size:2.5rem; color:#c9a55b; display:inline-block; vertical-align:middle;">&#10078;</div>
          <div style="font-weight:700; font-size:1.2rem; margin-top:10px;">${review.name}</div>
        </div>
      `;
    }
  }

  const prevBtn = document.getElementById('prevReview');
  const nextBtn = document.getElementById('nextReview');
  if (prevBtn && nextBtn) {
    prevBtn.onclick = () => {
      currentReview = (currentReview - 1 + reviews.length) % reviews.length;
      renderReview(currentReview);
    };
    nextBtn.onclick = () => {
      currentReview = (currentReview + 1) % reviews.length;
      renderReview(currentReview);
    };
    renderReview(currentReview);
  } else {
    renderReview(currentReview);
  }

  // ===== Star rating logic =====
  const stars = document.querySelectorAll('#starRating .star');
  const ratingInput = document.getElementById('reviewRating');
  if (stars.length && ratingInput) {
    stars.forEach(star => {
      star.addEventListener('click', function () {
        const val = parseInt(this.getAttribute('data-value'));
        ratingInput.value = val;
        stars.forEach((s, i) => {
          s.innerHTML = i < val ? '&#9733;' : '&#9734;';
          s.style.color = i < val ? '#ffc107' : '#ccc';
        });
      });
    });
  }

  // ===== Add user review =====
  const form = document.getElementById('userReviewForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const name = document.getElementById('reviewerName').value.trim();
      const text = document.getElementById('reviewText').value.trim();
      const rating = parseInt(ratingInput.value);

      if (name && text && rating) {
        reviews.push({ name, text, rating });
        currentReview = reviews.length - 1;
        renderReview(currentReview);
        form.reset();
        ratingInput.value = 0;
        stars.forEach(s => {
          s.innerHTML = '&#9734;';
          s.style.color = '#ccc';
        });
      }
    });
  }

  // ===== Inventory link login check =====
  const inventoryLink = document.getElementById("inventoryLink");
  if (inventoryLink) {
    inventoryLink.addEventListener("click", function (e) {
      const isLoggedIn = localStorage.getItem("loggedIn") === "true";
      if (!isLoggedIn) {
        e.preventDefault();
        window.location.href = "login.html";
      }
    });
  }
});
