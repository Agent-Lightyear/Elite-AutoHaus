// account.js
// (module — make sure your <script> tag uses type="module")
//
// Full account page script: auth state, profile load, purchases/invoice popup + PDF,
// review UI & Firestore integration (submit reviews).
//
// Firebase v12 modular imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  where
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

// ---------- firebase config ----------
const firebaseConfig = {
  apiKey: "AIzaSyAMR69VGl2IFav9-P-rwpzaLvZh7WpwFcE",
  authDomain: "elite-autohaus-018s.firebaseapp.com",
  projectId: "elite-autohaus-018s",
  storageBucket: "elite-autohaus-018s.appspot.com",
  messagingSenderId: "374828356950",
  appId: "1:374828356950:web:04abb8bcced3f3ea02f2f7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ---------- DOM refs ----------
const userName = document.getElementById('userName');
const nameField = document.getElementById('nameField');
const emailField = document.getElementById('emailField');
const phoneField = document.getElementById('phoneField');
const purchaseList = document.getElementById('purchaseList');
const logoutBtn = document.getElementById('logoutBtn');

const invoicePopup = document.getElementById('invoice-popup');
const invoiceCustomer = document.getElementById('invoice-customer');
const invoiceCar = document.getElementById('invoice-car');
const invoiceBase = document.getElementById('invoice-base');
const invoiceGST = document.getElementById('invoice-gst');
const invoiceTotal = document.getElementById('invoice-total');
const invoiceDate = document.getElementById('invoice-date');
const invoiceAddress = document.getElementById('invoice-address');
const downloadPdfBtn = document.getElementById('download-pdf');
const closePopupBtn = document.getElementById('close-popup');

// Review form refs
const reviewForm = document.getElementById('reviewForm');
const reviewText = document.getElementById('reviewText');
const ratingStarsContainer = document.getElementById('ratingStars');
const ratingValueInput = document.getElementById('ratingValue');
const reviewMessage = document.getElementById('reviewMessage');

// ---------- state ----------
let currentInvoice = null;

// ---------- helpers ----------
function safeText(t) { return (t == null) ? '' : String(t); }
function formatINR(n) {
  if (typeof n !== 'number') n = Number(n) || 0;
  return n.toLocaleString('en-IN');
}

// safe close function for popup (exposed on window for inline handlers if needed)
window.closePopup = function () {
  if (invoicePopup) invoicePopup.style.display = 'none';
  currentInvoice = null;
};

if (closePopupBtn) {
  closePopupBtn.addEventListener('click', () => window.closePopup());
}

// Close popup when clicking outside content (optional)
if (invoicePopup) {
  invoicePopup.addEventListener('click', (e) => {
    if (e.target === invoicePopup) window.closePopup();
  });
}

// ---------- auth & profile/purchases load ----------
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    // not signed in
    window.location.assign('login.html');
    return;
  }

  // basic profile
  let displayName = user.displayName || "Elite User";
  let email = user.email || "Not available";
  let phone = user.phoneNumber || "Not provided";

  userName.textContent = displayName;
  nameField.textContent = displayName;
  emailField.textContent = email;
  phoneField.textContent = phone;

  // try to read extended user doc
  try {
    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      displayName = data.name || displayName;
      phone = (data.phone && data.phone.trim() !== "") ? data.phone : phone;

      userName.textContent = displayName;
      nameField.textContent = displayName;
      phoneField.textContent = phone;
    }
  } catch (err) {
    console.error("Error reading user doc:", err);
  }

  // load purchases (subcollection: users/{uid}/purchases)
  try {
    const purchasesRef = collection(db, "users", user.uid, "purchases");
    // get recent purchases first if you want:
    const q = query(purchasesRef, orderBy('createdAt', 'desc'));
    const purchaseSnap = await getDocs(q);

    purchaseList.innerHTML = "";

    if (purchaseSnap.empty) {
      purchaseList.innerHTML = "<li style='color:#777;'>No purchases yet.</li>";
    } else {
      purchaseSnap.forEach(docSnap => {
        const p = docSnap.data();
        // create list item with button to open invoice popup
        const li = document.createElement('li');
        li.className = 'purchase-item';
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'invoice-btn';
        const displayText = `${safeText(p.itemName || "Unknown Item")} - ₹${formatINR(p.totalAmount || 0)} (on ${p.date || "N/A"})`;
        btn.textContent = displayText;

        btn.addEventListener('click', () => {
          currentInvoice = {
            customer: displayName,
            car: p.itemName || "",
            baseAmount: Number(p.baseAmount || 0),
            gst: Number(p.gst || Math.round((p.baseAmount || 0) * 0.28)),
            totalAmount: Number(p.totalAmount || (Number(p.baseAmount || 0) + (Number(p.gst || 0)))),
            date: p.date || (p.createdAt ? new Date(p.createdAt.seconds * 1000).toLocaleDateString() : new Date().toLocaleDateString()),
            phone: phone,
            address: p.address || "Not provided"
          };

          // update popup DOM
          invoiceCustomer.textContent = currentInvoice.customer;
          invoiceCar.textContent = currentInvoice.car;
          invoiceBase.textContent = formatINR(currentInvoice.baseAmount);
          invoiceGST.textContent = formatINR(currentInvoice.gst);
          invoiceTotal.textContent = formatINR(currentInvoice.totalAmount);
          invoiceDate.textContent = currentInvoice.date;
          invoiceAddress.textContent = currentInvoice.address;

          invoicePopup.style.display = 'flex';
        });

        li.appendChild(btn);
        purchaseList.appendChild(li);
      });
    }
  } catch (err) {
    console.error("Error loading purchases:", err);
    purchaseList.innerHTML = "<li style='color:#f88;'>Unable to load purchases.</li>";
  }

  // Optionally: load user's previous reviews (display area not in markup by default)
  // (Left out - can be added if you want to show them.)
});

// ---------- logout ----------
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    try {
      await signOut(auth);
      window.location.assign('login.html');
    } catch (err) {
      console.error("Sign out failed:", err);
      alert("Logout failed. Check console.");
    }
  });
}

// ---------- download PDF ----------
if (downloadPdfBtn) {
  downloadPdfBtn.addEventListener('click', () => {
    if (!currentInvoice) {
      alert("No invoice selected.");
      return;
    }

    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });

      // the website to include (clickable)
      const website = "https://elite-autohaus-018s.web.app/";

      // --- Logo & Company ---
      const logo = new Image();
      logo.src = "IMG/logo_1.png";
      logo.onload = () => {
        doc.addImage(logo, "PNG", 40, 30, 80, 50);

        doc.setFontSize(22);
        doc.setTextColor(212, 175, 55);
        doc.text("Élite Autohaus", 140, 60);

        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        doc.text("A-99, MIDC, Wadi, Nagpur, 440016", 140, 80);
        doc.text("Phone: +91 99999 88888 | Email: eliteautohaus.helpdesk@gmail.com", 140, 95);
        doc.text("Website: elite-autohaus-018s.web.app", 140, 110);

        // --- Invoice Title ---
        doc.setFontSize(16);
        doc.setTextColor(40, 40, 40);
        doc.text("INVOICE", 450, 60);

        // --- Invoice meta ---
        doc.setFontSize(11);
        let metaY = 120;
        doc.text(`Invoice #: INV-${Date.now()}`, 450, metaY); metaY += 18;
        doc.text(`Date: ${currentInvoice.date}`, 450, metaY);

        // --- Customer info ---
        doc.setFontSize(12);
        doc.setTextColor(40, 40, 40);
        let y = 150;
        doc.text("Bill To:", 40, y);
        y += 18;

        doc.setFontSize(11);
        doc.setTextColor(80, 80, 80);
        doc.text(currentInvoice.customer, 40, y);
        y += 16;

        doc.text(`Phone: ${currentInvoice.phone || "Not provided"}`, 40, y);
        y += 16;

        doc.text(`Address: ${currentInvoice.address}`, 40, y, { maxWidth: 250 });
        y += 32;

        doc.text(currentInvoice.car, 40, y);

        // --- Table ---
        doc.autoTable({
          startY: 250,
          head: [['Vehicle', 'Base Amount (INR)', 'GST (INR)', 'Total (INR)']],
          body: [
            [
              currentInvoice.car,
              formatINR(currentInvoice.baseAmount),
              formatINR(currentInvoice.gst),
              formatINR(currentInvoice.totalAmount)
            ]
          ],
          styles: { halign: 'center' },
          headStyles: { fillColor: [212, 175, 55] }
        });

        // --- Summary Section ---
        const finalY = doc.lastAutoTable.finalY + 30;
        doc.setFontSize(12);
        doc.text(`Subtotal: INR ${formatINR(currentInvoice.baseAmount)}`, 400, finalY);
        doc.text(`GST (28%): INR ${formatINR(currentInvoice.gst)}`, 400, finalY + 20);
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(`Grand Total: INR ${formatINR(currentInvoice.totalAmount)}`, 400, finalY + 50);

        // --- Notes ---
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        doc.text("Notes:", 40, finalY);
        doc.text("- All sales are final.", 40, finalY + 20);
        doc.text("- Warranty as per manufacturer policy.", 40, finalY + 35);
        doc.text("- For queries: eliteautohaus.helpdesk@gmail.com", 40, finalY + 50);
        

        // --- Footer (with clickable website link) ---
        doc.setDrawColor(212, 175, 55);
        doc.setLineWidth(1);
        doc.line(40, 780, 555, 780);
        doc.setFontSize(10);
        // standard footer text
        doc.text("Élite Autohaus | +91 99999 88888", 150, 795);
        // website text (visually distinct)
        doc.setTextColor(40, 120, 200); // bluish color for link
        const linkX = 150 + doc.getTextWidth("Élite Autohaus | +91 99999 88888") + 12; // position after the other text
        doc.text(website, linkX, 795);
        // make the website clickable
        const linkWidth = doc.getTextWidth(website);
        // y coordinate for link rectangle; anchor slightly above text baseline
        doc.link(linkX, 789, linkWidth, 12, { url: website });

        // --- Save ---
        const safeName = (currentInvoice.car || "invoice").toString().replace(/[^\w-]/g, "_");
        doc.save(`${safeName}_invoice.pdf`);
      };

      // If logo fails to load (cross-origin/local path issues), still proceed with textual PDF:
      logo.onerror = () => {
        try {
          doc.setFontSize(22);
          doc.setTextColor(212, 175, 55);
          doc.text("Élite Autohaus", 40, 60);
          doc.setFontSize(10);
          doc.setTextColor(80, 80, 80);
          doc.text("A-99, MIDC, Wadi, Nagpur, 440016", 40, 80);

          // Minimal invoice fallback content
          doc.setFontSize(12);
          doc.text("Invoice (logo failed to load)", 40, 110);
          doc.text(`Customer: ${currentInvoice.customer}`, 40, 130);
          doc.text(`Car: ${currentInvoice.car}`, 40, 150);
          doc.text(`Total: INR ${formatINR(currentInvoice.totalAmount)}`, 40, 170);

          // add the clickable website in fallback too
          doc.setDrawColor(212, 175, 55);
          doc.setLineWidth(1);
          doc.line(40, 780, 555, 780);
          doc.setFontSize(10);
          doc.text("Élite Autohaus | +91 99999 88888", 150, 795);
          doc.setTextColor(40, 120, 200);
          const fallbackLinkX = 150 + doc.getTextWidth("Élite Autohaus | +91 99999 88888") + 12;
          doc.text(website, fallbackLinkX, 795);
          const fallbackLinkW = doc.getTextWidth(website);
          doc.link(fallbackLinkX, 789, fallbackLinkW, 12, { url: website });

          doc.save(`${(currentInvoice.car || "invoice").replace(/[^\w-]/g, "_")}_invoice.pdf`);
        } catch (err) {
          console.error("Fallback PDF failed:", err);
          alert("Unable to generate PDF. Check console for details.");
        }
      };
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Unable to generate PDF. Open console for details.");
    }
  });
}


// ---------- Review: star rating UI ----------
if (ratingStarsContainer && ratingValueInput) {
  // initialize default stars (all active = 5 by default)
  const createStarsHandler = () => {
    const spans = ratingStarsContainer.querySelectorAll('span[data-value]');
    spans.forEach(s => {
      const val = Number(s.dataset.value);
      // set hover and click
      s.addEventListener('mouseenter', () => {
        spans.forEach(x => {
          x.style.color = (Number(x.dataset.value) <= val) ? '#d1ac5f' : '#777';
        });
      });
      s.addEventListener('mouseleave', () => {
        const cur = Number(ratingValueInput.value || 5);
        spans.forEach(x => {
          x.style.color = (Number(x.dataset.value) <= cur) ? '#d1ac5f' : '#777';
        });
      });
      s.addEventListener('click', () => {
        ratingValueInput.value = String(val);
        spans.forEach(x => {
          x.style.color = (Number(x.dataset.value) <= val) ? '#d1ac5f' : '#777';
        });
      });
    });
    // default state: 5 stars active
    const defaultVal = Number(ratingValueInput.value || 5);
    spans.forEach(x => x.style.color = (Number(x.dataset.value) <= defaultVal) ? '#d1ac5f' : '#777');
  };
  createStarsHandler();
}

// ---------- Review: submit handler (writes to Firestore) ----------
if (reviewForm) {
  reviewForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!auth.currentUser) {
      reviewMessage.textContent = "Please log in to submit a review.";
      reviewMessage.style.color = "crimson";
      return;
    }

    const text = (reviewText && reviewText.value || "").trim();
    const rating = Number(ratingValueInput.value || 5);

    if (!text) {
      reviewMessage.textContent = "Please write something before submitting.";
      reviewMessage.style.color = "crimson";
      return;
    }

    try {
      // store review in 'reviews' collection with moderation flag
      await addDoc(collection(db, "reviews"), {
        uid: auth.currentUser.uid,
        name: auth.currentUser.displayName || auth.currentUser.email || "Anonymous",
        review: text,
        rating: rating,
        approved: false,             // moderation flow: admin will flip to true
        createdAt: serverTimestamp(),
      });

      reviewMessage.textContent = "Thanks — your review has been submitted for moderation.";
      reviewMessage.style.color = "limegreen";
      reviewForm.reset();
      // reset stars to default 5
      ratingValueInput.value = "5";
      if (ratingStarsContainer) {
        const spans = ratingStarsContainer.querySelectorAll('span[data-value]');
        spans.forEach(x => x.style.color = (Number(x.dataset.value) <= 5) ? '#d1ac5f' : '#777');
      }
    } catch (err) {
      console.error("Error submitting review:", err);
      reviewMessage.textContent = "Error submitting review: " + (err.message || err);
      reviewMessage.style.color = "crimson";
    }
  });
}

// ---------- Optional: helpful dev utility to fetch approved reviews (not used by default) ----------
export async function fetchApprovedReviews(limit = 6) {
  try {
    const reviewsRef = collection(db, "reviews");
    const q = query(reviewsRef, where("approved", "==", true), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    const out = [];
    snap.forEach(d => out.push({ id: d.id, ...d.data() }));
    return out;
  } catch (err) {
    console.error("fetchApprovedReviews error:", err);
    return [];
  }
}

// End of account.js
