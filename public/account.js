// account.js
// (module — make sure your <script> tag uses type="module")
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

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
const invoicePrice = document.getElementById('invoice-price');
const invoiceDate = document.getElementById('invoice-date');
const downloadPdfBtn = document.getElementById('download-pdf');
const closePopupBtn = document.getElementById('close-popup');

// ---------- state ----------
let currentInvoice = null;

// safe close function
window.closePopup = function () {
  if (invoicePopup) invoicePopup.style.display = 'none';
  currentInvoice = null;
};

if (closePopupBtn) {
  closePopupBtn.addEventListener('click', () => window.closePopup());
}

// ---------- load purchases ----------
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.assign('login.html');
    return;
  }

  let displayName = user.displayName || "Elite User";
  let email = user.email || "Not available";
  let phone = user.phoneNumber || "Not provided";

  userName.textContent = displayName;
  nameField.textContent = displayName;
  emailField.textContent = email;
  phoneField.textContent = phone;

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

  try {
    const purchasesRef = collection(db, "users", user.uid, "purchases");
    const purchaseSnap = await getDocs(purchasesRef);

    purchaseList.innerHTML = "";

    if (purchaseSnap.empty) {
      purchaseList.innerHTML = "<li style='color:#777;'>No purchases yet.</li>";
      return;
    }

    purchaseSnap.forEach(docSnap => {
      const p = docSnap.data();
      const li = document.createElement('li');
      li.className = 'purchase-item';

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'invoice-btn';
      const displayText = `${p.itemName || "Unknown Item"} - ₹${(p.amount || 0).toLocaleString()} (on ${p.date || "N/A"})`;
      btn.textContent = displayText;

      btn.dataset.car = p.itemName || "";
      btn.dataset.price = p.amount || "";
      btn.dataset.date = p.date || (p.createdAt ? new Date(p.createdAt.seconds * 1000).toLocaleDateString() : new Date().toLocaleDateString());

      btn.addEventListener('click', () => {
        currentInvoice = {
          customer: displayName,
          car: btn.dataset.car,
          price: btn.dataset.price,
          date: btn.dataset.date,
          phone: phone, // ✅ add phone here
          address: "10, Adarsh Nagar, Wadi, Nagpur, 440023" // ✅ static address
        };
      
        invoiceCustomer.textContent = currentInvoice.customer;
        invoiceCar.textContent = currentInvoice.car;
        invoicePrice.textContent = Number(currentInvoice.price).toLocaleString();
        invoiceDate.textContent = currentInvoice.date;
      
        invoicePopup.style.display = 'flex';
      });
      

      li.appendChild(btn);
      purchaseList.appendChild(li);
    });
  } catch (err) {
    console.error("Error loading purchases:", err);
    purchaseList.innerHTML = "<li style='color:#f88;'>Unable to load purchases.</li>";
  }
});

// ---------- logout ----------
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    await signOut(auth);
    window.location.assign('login.html');
  });
}

// ---------- download PDF ----------
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

// ✅ Add phone
doc.text(`Phone: ${currentInvoice.phone || "Not provided"}`, 40, y); 
y += 16;

// ✅ Add address
doc.text(currentInvoice.address, 40, y, { maxWidth: 250 }); 
y += 32;

doc.text(currentInvoice.car, 40, y);


        // --- Table ---
        const basePrice = Number(currentInvoice.price);
        const gst = basePrice * 0.18; // 18% GST
        const total = basePrice + gst;

        doc.autoTable({
          startY: 250,
          head: [['Vehicle', 'Price (INR)', 'Tax (18%)', 'Total (INR)']],
          body: [
            [
              currentInvoice.car,
              basePrice.toLocaleString("en-IN"),
              gst.toLocaleString("en-IN"),
              total.toLocaleString("en-IN")
            ]
          ],
          styles: { halign: 'center' },
          headStyles: { fillColor: [212, 175, 55] }
        });

        // --- Summary Section ---
        let finalY = doc.lastAutoTable.finalY + 30;

        doc.setFontSize(12);
        doc.text(`Subtotal: INR ${basePrice.toLocaleString("en-IN")}`, 400, finalY);
        doc.text(`Tax (18%): INR ${gst.toLocaleString("en-IN")}`, 400, finalY + 20);
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(`Grand Total: INR ${total.toLocaleString("en-IN")}`, 400, finalY + 50);

        // --- Notes ---
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        doc.text("Notes:", 40, finalY);
        doc.text("- All sales are final.", 40, finalY + 20);
        doc.text("- Warranty as per manufacturer policy.", 40, finalY + 35);
        doc.text("- For queries: eliteautohaus.helpdesk@gmail.com", 40, finalY + 50);

        // --- Footer ---
        doc.setDrawColor(212, 175, 55);
        doc.setLineWidth(1);
        doc.line(40, 780, 555, 780);
        doc.setFontSize(10);
        doc.text("Élite Autohaus | www.eliteautohaus.com | +91 99999 88888", 150, 795);

        // --- Save ---
        const safeName = (currentInvoice.car || "invoice").toString().replace(/[^\w-]/g, "_");
        doc.save(`${safeName}_invoice.pdf`);
      };
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Unable to generate PDF. Open console for details.");
    }
  });
}
