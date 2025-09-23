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
  if (!document.getElementById("businessName")) return;

  const ocrText = localStorage.getItem("ocrText");
  if (!ocrText) return;

  let lines = ocrText.split("\n").map(l => l.trim()).filter(l => l);
  console.log("Extracted Lines:", lines);

  // 📧 Emails
  const emailMatches = ocrText.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi) || [];
  const email = emailMatches.join(", ");

  // 📞 Phones
  let phoneMatches = ocrText.match(/\+?\d[\d\s-]{7,}\d/g) || [];
  phoneMatches = phoneMatches.filter(num => {
    const cleanNum = num.replace(/\D/g, "");
    if (/^\d{6}$/.test(cleanNum)) return false; // remove pincode
    return true;
  });
  const phone = phoneMatches.join(", ");

  // --- Lines clean karo (email/phone wali lines hatao address ke liye)
  lines = lines.filter(line =>
    !emailMatches.some(e => line.includes(e)) &&
    !phoneMatches.some(p => line.includes(p))
  );

  // 🏢 Business Name
  /*let businessLine = lines.find(l =>
    /(University|College|Company|Pvt|Ltd|LLP|Inc|Trust|Hospital|Institute|Technologies)/i.test(l)
  );
  if (!businessLine) {
    // Agar keyword wala nahi mila to sabse upar wali non-email/phone line
    businessLine = lines.find(l => !/\d/.test(l) && !/@/.test(l) && l.length > 2) || "";
  }*/
 
 // 🏢 Business Name
let businessLine = lines.find(l =>
  /(University|College|Company|Pvt|Ltd|LLP|Inc|Trust|Hospital|Institute|Technologies)/i.test(l)
);

if (!businessLine) {
  // Fallback: pick first line that is not a personal name
  businessLine = lines.find(l => !/^[A-Z][a-z]+(\s[A-Z][a-z]+){0,2}$/.test(l) && l.length > 2) || "";
}


  // 👤 Contact Person
  /*let contactLine = lines.find(l =>
    /(Dr\.|Mr\.|Mrs\.|Ms\.|Prof\.|CEO|Manager|Director|Founder|Head)/i.test(l)
  );
  if (!contactLine) {
    // Agar keyword nahi mila to business name ke baad wali clean line
    const businessIndex = lines.indexOf(businessLine);
    if (businessIndex >= 0 && businessIndex + 1 < lines.length) 
      let candidate = lines[businessIndex + 1];
      if (/^[A-Z][a-z]+(\s[A-Z][a-z]+)+$/.test(candidate)) {
        contactLine = candidate;
      }
    }
  }*/
 // 👤 Contact Person
let contactLine = lines.find(l =>
  /(Dr\.|Mr\.|Mrs\.|Ms\.|Prof\.|CEO|Manager|Director|Founder|Head)/i.test(l)
);

if (!contactLine) {
  // Fallback: pick first clean line after businessLine that looks like a name
  const businessIndex = lines.indexOf(businessLine);
  if (businessIndex >= 0) {
    for (let i = businessIndex + 1; i < lines.length; i++) {
      let candidate = lines[i].trim();
      // Simple personal name detection: 2-3 words, capitalized, no numbers/special chars
      if (/^[A-Z][a-z]+(\s[A-Z][a-z]+){0,2}$/.test(candidate)) {
        contactLine = candidate;
        break;
      }
    }
  }
}


  // 🏠 Address
  let addressMatches = [];
  lines.forEach(line => {
    if (/(road|street|highway|lane|nagar|sector|circle|block|gate|tower|city|state|india)/i.test(line)) {
      addressMatches.push(line);
    } else if (/\b\d{6}\b/.test(line)) { // pincode
      addressMatches.push(line);
    }
  });
  const address = addressMatches.join(", ");

  // ✅ Fill Form
  document.getElementById("businessName").value = businessLine || "";
  document.getElementById("contactPerson").value = contactLine || "";
  document.getElementById("phone").value = phone;
  document.getElementById("email").value = email;
  document.getElementById("address").value = address;
});
