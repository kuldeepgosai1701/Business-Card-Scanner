
// OCR Scan
document.getElementById("scanBtn")?.addEventListener("click", async () => {
  const file = document.getElementById("cardImage").files[0];
  if (!file) {
    alert("Please upload or capture an image!");
    return;
  }

    // Loader show
  const loader = document.getElementById("loader");
  loader.style.display = "block";


  // Extract text using Tesseract
  const text = await extractText(file);

  // Save data temporarily (localStorage se dusre page me bhejenge)
  localStorage.setItem("ocrText", text);

    // Loader hide
  loader.style.display = "none";

  // ✅ Direct form.html pe redirect
  window.location.href = "form.html";
});

  
async function extractText(file) {
  return new Promise((resolve, reject) => {
    Tesseract.recognize(
      file,
      'eng',
      { logger: m => console.log(m) }
    ).then(({ data: { text } }) => {
      resolve(text);
    }).catch(err => reject(err));
  });
}
window.addEventListener("load", () => {

  // OCR Function
  async function extractText(file) {
    return new Promise((resolve, reject) => {
      Tesseract.recognize(file, 'eng', { logger: m => console.log(m) })
        .then(({ data: { text } }) => resolve(text))
        .catch(err => reject(err));
    });
  }

  // --- INDEX PAGE ---
  if (document.getElementById("scanBtn")) {
    document.getElementById("scanBtn").addEventListener("click", async () => {
      const file = document.getElementById("cardImage").files[0];
      if (!file) { alert("Please upload or capture an image!"); return; }

      document.getElementById("loader").style.display = "block";
      const text = await extractText(file);
      localStorage.setItem("ocrText", text);
      document.getElementById("loader").style.display = "none";

      window.location.href = "form.html";
    });
  }

  // --- FORM PAGE ---
  if (document.getElementById("businessName")) {
    const ocrText = localStorage.getItem("ocrText");
    if (!ocrText) return;

    const lines = ocrText.split("\n").map(l => l.trim()).filter(l => l);
    console.log("Extracted Lines:", lines);

    // 📧 Emails (multiple allowed)
    const emailMatches = ocrText.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi);
    const email = emailMatches ? emailMatches.join(", ") : "";

    // 📞 Phone numbers (multiple allowed)
    const phoneMatches = ocrText.match(/\+?\d[\d\s-]{7,}\d/g);
    const phone = phoneMatches ? phoneMatches.join(", ") : "";

    // 🏢 Business Name
    let businessLine = lines.find(l =>
      /(University|College|Company|Pvt|Ltd|LLP|Inc|Trust|Hospital|Institute|Technologies)/i.test(l)
    );
    if (!businessLine) {
      businessLine = lines.find(l => !/\d/.test(l) && !/@/.test(l) && l.length > 3) || "";
    }

    // 👤 Contact Person
    let contactLine = lines.find(l =>
      /(Dr\.|Mr\.|Mrs\.|Ms\.|Prof\.|CEO|Manager|Director|Founder|Head)/i.test(l)
    );
    if (!contactLine) {
      contactLine = lines.find(l => /^[A-Z][a-z]+ [A-Z][a-z]+$/.test(l)); // Simple Name Pattern
    }

    // 🏠 Address (multiple lines allowed)
    let addressMatches = [];
    lines.forEach(line => {
      if (/(road|street|highway|lane|nagar|sector|circle|block|gate|city|state|india|\d{6})/i.test(line)) {
        addressMatches.push(line);
      }
    });
    let address = addressMatches.length > 0 ? addressMatches.join(", ") : "";

    // ✅ Fill Form Fields
    document.getElementById("businessName").value = businessLine;
    document.getElementById("contactPerson").value = contactLine || "";
    document.getElementById("phone").value = phone;
    document.getElementById("email").value = email;
    document.getElementById("address").value = address;
  }
});



