
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
window.addEventListener("load", () => {
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
    document.getElementById("address").value = lines.slice(-2).join(" ");
  }
});
  

