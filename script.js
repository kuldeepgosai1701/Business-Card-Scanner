// OCR Scan
document.getElementById("scanBtn")?.addEventListener("click", async () => {
  const file = document.getElementById("cardImage").files[0];
  if (!file) {
    alert("Please upload or capture an image!");
    return;
  }

  // Extract text using Tesseract
  const text = await extractText(file);

  // Save data temporarily (localStorage se dusre page me bhejenge)
  localStorage.setItem("ocrText", text);

  alert("Scan complete! Now click Form button to view details.");
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
function goToForm() {
  window.location.href = "form.html";
}

// On form page load, fill extracted text
window.addEventListener("load", () => {
  const ocrText = localStorage.getItem("ocrText");
  if (ocrText && document.getElementById("businessName")) {
    // Basic fill (later regex se parse karenge)
    document.getElementById("businessName").value = ocrText.split("\n")[0] || "";
    document.getElementById("contactPerson").value = ocrText.split("\n")[1] || "";
    document.getElementById("phone").value = (ocrText.match(/\+?\d[\d\s-]{8,}/) || [""])[0];
    document.getElementById("email").value = (ocrText.match(/\S+@\S+\.\S+/) || [""])[0];
    document.getElementById("address").value = ocrText.split("\n").slice(-2).join(" ");
  }
});
