/*document.getElementById("cardImage")?.addEventListener("change", (e) => {
  
   e.preventDefault()
   const file = e.target.files[0];
     if (!file) {
     console.log("File selection cancelled.");
     return;
    }
    console.log("Image selected:", file);
});
   
  // Use the existing logic triggered by the scan button
document.getElementById("scanBtn")?.addEventListener("click", async (e) => {
  e.preventDefault()
  const file = document.getElementById("cardImage").files[0];
  if (!file) {
    alert("Please upload or capture an image!");
    return;
  }*/

const openCameraBtn = document.getElementById("openCamera");

// Camera button click → trigger hidden input
openCameraBtn.addEventListener("click", () => {
 cameraInput.value = null; // Clear previous selection
 cameraInput.click();
});

 let selectedFile = null;

// Camera input
const cameraInput = document.getElementById("cameraInput");
cameraInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    selectedFile = file; // ← important!
    console.log("Camera file:", file.name);
    //alert("Camera image captured: " + file.name);
    startScanProcess(file);
  }
});

// Gallery input
const galleryInput = document.getElementById("galleryInput");
galleryInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    selectedFile = file; // ← important!
    console.log("Gallery file:", file.name);
    //alert("Gallery image selected: " + file.name);
    startScanProcess(file);
    }
});

// Scan button
document.getElementById("scanBtn").addEventListener("click", async () => {
  if (!selectedFile) {
    alert("Please capture or upload an image first!");
    return;
  }
  const loader = document.getElementById("loader");
  loader.style.display = "block";
  const text = await extractText(selectedFile);
  localStorage.setItem("ocrText", text);
  loader.style.display = "none";
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
async function startScanProcess(fileToScan) {
    const loader = document.getElementById("loader");
    loader.style.display = "block";
    
    const text = await extractText(fileToScan);
    localStorage.setItem("ocrText", text);
    
    loader.style.display = "none";
    window.location.href = "form.html";
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


// ===================== Page Load Install Popup =====================
document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        if (confirm("Do you want to install the app?")) {
            if (window.deferredPrompt) {
                window.deferredPrompt.prompt();
                window.deferredPrompt.userChoice.then((choiceResult) => {
                    console.log("User choice:", choiceResult.outcome);
                    window.deferredPrompt = null;
                });
            } else {
                alert("App install not supported or already installed.");
            }
        }
    }, 500);
});

// Listen for PWA install prompt
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.deferredPrompt = e; 
});

// ===================== Form Submit Download Popup =====================
const form = document.getElementById("supportForm");
form.addEventListener("submit", function(e) {
    e.preventDefault();

    if (confirm("Do you want to download the extracted information?")) {
        const businessName = document.getElementById("businessName").value;
        const contactPerson = document.getElementById("contactPerson").value;
        const phone = document.getElementById("phone").value;
        const email = document.getElementById("email").value;
        const address = document.getElementById("address").value;

        const content = `Business Name: ${businessName}\nContact Person: ${contactPerson}\nPhone: ${phone}\nEmail: ${email}\nAddress: ${address}`;

        const blob = new Blob([content], { type: "text/plain" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "business_card_info.txt";
        link.click();
        URL.revokeObjectURL(link.href);
    } else {
        alert("Download cancelled!");
    }
});

