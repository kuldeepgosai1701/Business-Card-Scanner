
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

// Navigate to form page
/*function goToForm() {
  window.location.href = "form.html";
}*/

// On form page load, fill extracted text
/*window.addEventListener("load", () => {
  const ocrText = localStorage.getItem("ocrText");
  if (ocrText && document.getElementById("businessName")){
     const lines = ocrText.split("\n").map(l => l.trim()).filter(l => l); 
    

      // Business Name - pehli line
    document.getElementById("businessName").value = lines[0] || "";

    // Contact Person - doosri line
    document.getElementById("contactPerson").value = lines[1] || "";

    // Phone Numbers - sab match ho aur comma se join ho
    const phoneMatches = ocrText.match(/\+?\d[\d\s-]{7,}\d/g); // 8+ digit numbers
    document.getElementById("phone").value = phoneMatches ? phoneMatches.join(", ") : "";

    // Emails - sab match ho aur comma se join ho
    const emailMatches = ocrText.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi);
    document.getElementById("email").value = emailMatches ? emailMatches.join(", ") : "";

    // Address - last 2 lines (ya jitna ho) join
   // document.getElementById("address").value = lines.slice(-2).join(",");
   // Address extraction logic
let addressMatches = [];

// Split by line and check har line me address related keyword hai ya nahi
lines.forEach(line => {
  if (
    /\b(road|rd\.|street|st\.|lane|ln\.|block|sector|near|opp\.|tower|avenue|city|state|pincode|india|dist\.|taluka|village)\b/i.test(line) ||
    /\b\d{6}\b/.test(line) // Indian pincode match
  ) {
    addressMatches.push(line);
  }
});

// Agar kuch mila toh join karo, otherwise blank chhodo
document.getElementById("address").value =
  addressMatches.length > 0 ? addressMatches.join(", ") : "";
  }});*/

  window.addEventListener("load", () => {

  // --- INDEX.HTML PAGE ---
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

  // --- FORM.HTML PAGE ---
  if (document.getElementById("businessName")) {
    const ocrText = localStorage.getItem("ocrText");
    if (!ocrText) return;

    //const lines = ocrText.split("\n").map(l => l.trim()).filter(l => []);
    const lines = ocrText.split("\n").map(l => l.trim()).filter(l => l);

    document.getElementById("businessName").value = lines[0] || "";
    document.getElementById("contactPerson").value = lines[1] || "";

    const phoneMatches = ocrText.match(/\+?\d[\d\s-]{7,}\d/g);
    document.getElementById("phone").value = phoneMatches ? phoneMatches.join(", ") : "";

    const emailMatches = ocrText.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi);
    document.getElementById("email").value = emailMatches ? emailMatches.join(", ") : "";

    // Address extraction
    let addressMatches = [];
    lines.forEach(line => {
      if (/\b(road|rd\.|street|st\.|lane|ln\.|block|sector|near|opp\.|tower|avenue|city|state|pincode|india|dist\.|taluka|village)\b/i.test(line)
          || /\b\d{6}\b/.test(line)) {
        addressMatches.push(line);
      }
    });
    document.getElementById("address").value = addressMatches.length > 0 ? addressMatches.join(", ") : "";
  }

});
