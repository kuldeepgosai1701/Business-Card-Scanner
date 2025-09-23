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

  // 📞 Phones(case1)
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

  // 🏢 Business Name(case 1)
  /*let businessLine = lines.find(l =>
    /(University|College|Company|Pvt|Ltd|LLP|Inc|Trust|Hospital|Institute|Technologies)/i.test(l)
  );
  if (!businessLine) {
    // Agar keyword wala nahi mila to sabse upar wali non-email/phone line
    businessLine = lines.find(l => !/\d/.test(l) && !/@/.test(l) && l.length > 2) || "";
  }*/
 
 /* 🏢 Business Name(case 2)
let businessLine = lines.find(l =>
  /(University|College|Company|Pvt|Ltd|LLP|Inc|Trust|Hospital|Institute|Technologies)/i.test(l)
);

if (!businessLine) {
  // Fallback: pick first line that is not a personal name
  businessLine = lines.find(l => !/^[A-Z][a-z]+(\s[A-Z][a-z]+){0,2}$/.test(l) && l.length > 2) || "";
}*/


  // 👤 Contact (case 1)
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
 /* 👤 Contact Person(case 2)
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
}*/

    // 🏢 Business Name(case 3)
/*let businessLine = lines.find(l =>
  /(University|College|Company|Pvt|Ltd|LLP|Inc|Trust|Hospital|Institute|Technologies|Solutions|Enterprises|Corporation|Associates|Systems|Group|Industries)/i.test(l)
);

if (!businessLine) {
  // fallback → pick longest line which is not a simple personal name
  businessLine = lines.reduce((longest, line) => {
    if (
      line.length > (longest?.length || 0) &&
      !/^[A-Z][a-z]+(\s[A-Z][a-z]+){0,2}$/.test(line) && // not a typical name
      !/\d{10}/.test(line) && // not phone
      !/@/.test(line) // not email
    ) {
      return line;
    }
    return longest;
  }, "");
}*/

// 🏢 Business Name(case 4)
let businessIndex = lines.findIndex(l =>
  /(University|Consultancy|Tech|Resort|Restaurant|Academy|Infotech|CENTRE|Adverstising|College|Company|Pvt|Ltd|LLP|Inc|Trust|Hospital|Institute|Technologies|Solutions|Enterprises|Corporation|Associates|Systems|Group|Education|Jewelers|Industries)/i.test(l)
);

let businessLine = "";
if (businessIndex !== -1) {
  businessLine = lines[businessIndex];

  // 👆 Check previous line also (could be part of business name)
  if (businessIndex > 0) {
    let prevLine = lines[businessIndex - 1];
    if (
      prevLine.length > 2 &&
      !/^\d+$/.test(prevLine) &&         // not just numbers
      !/@/.test(prevLine) &&            // not email
      !/\d{10}/.test(prevLine) &&       // not phone
      !/^[A-Z][a-z]+(\s[A-Z][a-z]+){0,2}$/.test(prevLine) // not a personal name
    ) {
      businessLine = prevLine + " " + businessLine; // merge
    }
  }
} else {
  // fallback → pick longest non-name line
  businessLine = lines.reduce((longest, line) => {
    if (
      line.length > (longest?.length || 0) &&
      !/^[A-Z][a-z]+(\s[A-Z][a-z]+){0,2}$/.test(line) &&
      !/\d{10}/.test(line) &&
      !/@/.test(line)
    ) {
      return line;
    }
    return longest;
  }, "");
}
// 👤 Contact (case 3)
let contactLine = lines.find(l =>
  /(Dr\.|Mr\.|Mrs\.|Ms\.|Prof\.|CEO|Manager|Director|Founder|Head|MD|Chairman|Owner)/i.test(l)
);

if (!contactLine) {
  const businessIndex = lines.indexOf(businessLine);
  // search nearby lines that look like personal names
  for (let i = businessIndex - 1; i <= businessIndex + 2; i++) {
    if (i >= 0 && i < lines.length) {
      let candidate = lines[i].trim();
      if (/^[A-Z][a-z]+(\s[A-Z][a-z]+){1,2}$/.test(candidate)) {
        contactLine = candidate;
        break;
      }
    }
  }
}

  // 🏠 Address
  let addressMatches = [];
  lines.forEach(line => {
    if (/(garden|Quarter|Complex|road|street|highway|lane|nagar|sector|circle|block|gate|tower|city|state|india)/i.test(line)) {
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

// ================= Form Submit with Confirmation =================
document.getElementById("cardForm")?.addEventListener("submit", function (e) {
  e.preventDefault(); // page reload na ho

  // popup confirm box
  let userConfirm = confirm("Do you want to download the extracted details?");
  
  if (userConfirm) {
    // form se values lo
    let businessName = document.getElementById("businessName").value;
    let contactPerson = document.getElementById("contactPerson").value;
    let phone = document.getElementById("phone").value;
    let email = document.getElementById("email").value;
    let address = document.getElementById("address").value.replace(/\n/g, " ");

    // CSV headers + values
    let headers = ["Business Name", "Contact Person", "Phone Number", "Email", "Address"];
    let values = [businessName, contactPerson, phone, email, address];

    // CSV string banao
    let csvContent = headers.join(",") + "\n" + values.map(v => `"${v}"`).join(",");

    // Blob create karo
    let blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    // Download link create karo
    let link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "business-card.csv"; // file name
    link.click();

    // memory cleanup
    URL.revokeObjectURL(link.href);
  } else {
    alert("Download cancelled!");
  }
});

// ================= PWA Install Prompt =================
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault(); // Prevent automatic prompt
  deferredPrompt = e;

  // Show custom install button
  const installBtn = document.createElement('button');
  installBtn.textContent = "Install App";
  installBtn.style = "position: fixed; bottom: 20px; right: 20px; padding: 10px; font-size: 16px; z-index: 1000;";
  document.body.appendChild(installBtn);

  installBtn.addEventListener('click', async () => {
    installBtn.style.display = 'none';
    deferredPrompt.prompt(); // Show the native install prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log('User choice:', outcome);
    deferredPrompt = null;
  });
});

