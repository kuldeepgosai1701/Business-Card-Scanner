
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
  }

  const loader = document.getElementById("loader");
  loader.style.display = "block";

  const text = await extractText(file);
  localStorage.setItem("ocrText", text);
  loader.style.display = "none";
  window.location.href = "form.html";
});*/

const scanBtn = document.getElementById("scanBtn");

// --- Image Selection Handlers ---
let selectedFiles = []; // store multiple images
// Function to handle a file selection
function handleFileSelection(e) {
  selectedFiles = Array.from(e.target.files); // all selected images

  if (selectedFiles.length > 0) {
    console.log("Selected files:", selectedFiles.map(f => f.name).join(", "));
    scanBtn.style.display = 'block';
  } else {
    scanBtn.style.display = 'none';
  }
}

// Camera button click → trigger hidden input
document.getElementById("openCamera")?.addEventListener("click", () => {
    document.getElementById("cameraInput").value = null; // Clear previous selection
    document.getElementById("cameraInput").click();
});

  document.getElementById("openGallery")?.addEventListener("click", () => {
    document.getElementById("galleryInput").value = null;
    document.getElementById("galleryInput").click();
    });

// File selected from camera
document.getElementById("cameraInput")?.addEventListener("change", handleFileSelection);

// File selected from gallery
document.getElementById("galleryInput")?.addEventListener("change", handleFileSelection);


// --- Scan Button Logic ---

// Scan button → start OCR
document.getElementById("scanBtn")?.addEventListener("click", async (e) => {
    e.preventDefault();
    if (!selectedFiles || selectedFiles.length === 0) {
        alert("Please capture or upload an image first!");
        return;
    }
    
    const selectedFile = selectedFiles[0]; // ✅ fix added here

    loader.style.display = "block";
    scanBtn.style.display = 'none'; // Hide button during scan

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

 window.addEventListener("load", () => {
  if (!document.getElementById("businessName")) return;

  const ocrText = localStorage.getItem("ocrText");
  if (!ocrText) return;

  let lines = ocrText.split("\n").map(l => l.trim()).filter(l => l);
  console.log("Extracted Lines:", lines);

   lines = lines.filter(line => !/(www\.|\.com|\.in|@)/i.test(line));

  // Remove address-like lines to avoid picking them as business name
  let nonAddressLines = lines.filter(line => 
      !/(garden|road|street|lane|nagar|sector|circle|city|state|india|\b\d{6}\b)/i.test(line) &&
      !/(www\.|\.com|\.in|@)/i.test(line)  // also remove website/email lines
  );

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

  // 🏠 Address
  let addressMatches = [];
   for (let i = 0; i < lines.length; i++) {
  if (/(garden|Quarter|plot|gate|near|road|lane|nagar|circle|Complex|road|street|corner|park|lane|nagar|sector|circle|city|state|india)/i.test(lines[i]) || /\b\d{6}\b/.test(lines[i])) {
    let addr = lines[i];

    // Check next 1-2 lines if they look like address continuation
    if (i + 1 < lines.length && !/(www|@)/i.test(lines[i+1])) {
      addr += ", " + lines[i+1];
      i++; // skip next line as it is already added
    }
    if (i + 1 < lines.length && !/(www|@)/i.test(lines[i+1]) && !/\b\d{10}\b/.test(lines[i+1])) {
      addr += ", " + lines[i+1];
      i++; // optional third line
    }

    addressMatches.push(addr);
  }
}
const address = addressMatches.join(", ");


 // 🏢 Business Name(case 4)
/*let businessIndex = lines.findIndex(l =>
  /(University|Mall|School|Project|Consultancy|Tech|Resort|Restaurant|Academy|Infotech|CENTRE|Plastic|Adverstising|College|Company|Pvt|Ltd|LLP|Inc|Trust|Hospital|Institute|Technologies|Solutions|Enterprises|Corporation|Associates|Explores|Systems|Group|Education|Jewelers|Industries)/i.test(l)
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
}*/
// 🏢 Business Name using nonAddressLines
let businessIndex = nonAddressLines.findIndex(l =>
  /(University|Mall|School|Project|Consultancy|Tech|Resort|Restaurant|Academy|Infotech|CENTRE|Plastic|Advertising|College|Company|Pvt|Ltd|LLP|Inc|Trust|Hospital|Institute|Technologies|Solutions|Enterprises|Corporation|Associates|Explores|Systems|Group|Education|Jewelers|Industries)/i.test(l)
);

let businessLine = "";
if (businessIndex !== -1) {
  businessLine = nonAddressLines[businessIndex];

  // Check previous line for multi-line names
  if (businessIndex > 0) {
    let prevLine = nonAddressLines[businessIndex - 1];
    if (prevLine && prevLine.length > 2 && !/(garden|road|street|lane|nagar|sector|city|state|india|\d{6}|@|\d{10})/i.test(prevLine)) {
      businessLine = prevLine + " " + businessLine;
    }
  }

  if (businessIndex > 0) {
  let prevLine = nonAddressLines[businessIndex - 1];
  if (prevLine && !/(Dr\.|Mr\.|Ms\.|CEO|Manager|Dean|Director)/i.test(prevLine) &&
      !/@|\d/.test(prevLine) && prevLine.length > 2) {
      businessLine = prevLine + " " + businessLine;
  }
}

  // Check next line for single-word business names
  let nextLine = nonAddressLines[businessIndex + 1];
  if (nextLine && nextLine.length > 2 && /University|Ltd|Inc|Pvt|Trust|College/i.test(nextLine)) {
    businessLine += " " + nextLine;
  }
} else {
  // fallback → pick longest line in nonAddressLines
  businessLine = nonAddressLines.reduce((longest, line) =>
    line.length > (longest?.length || 0) ? line : longest
  , "");
}



// 👤 Contact (case 3)
let contactLine = lines.find(l =>
  /(Dr\.|Mr\.|Mrs\.|Ms\.|Prof\.|CEO|Manager|Director|Founder|Head|MD|Chairman|Owner|Proprietor)/i.test(l)
);

if (!contactLine) {
  const businessIndex = lines.indexOf(businessLine);

  // Search nearby lines around business name
  for (let i = businessIndex - 2; i <= businessIndex + 3; i++) {
    if (i >= 0 && i < lines.length) {
      let candidate = lines[i].trim();

      // ✅ Match 1–3 words (e.g. "Rahul", "Rahul Mehta", "Pooja R Sharma")
      if (/^[A-Z][a-z]+(\s[A-Z][a-z]+){0,2}$/.test(candidate)) {
        // Reject lines that are too long or contain numbers/emails
        if (
          candidate.length <= 30 &&
          !/@/.test(candidate) &&
          !/\d/.test(candidate) &&
          !/(Pvt|Ltd|Company|Tech|Solutions|Institute|Trust|Group)/i.test(candidate)
        ) {
          contactLine = candidate;
          break;
        }
      }
    }
  }
}

/*
  let addressMatches = [];
  lines.forEach(line => {
    if (/(garden|Quarter|Complex|road|street|highway|lane|nagar|sector|circle|block|gate|tower|city|state|india)/i.test(line)) {
      addressMatches.push(line);
    } else if (/\b\d{6}\b/.test(line)) { // pincode
      addressMatches.push(line);
    }
  });
  const address = addressMatches.join(", ");*/

  // ✅ Fill Form
  document.getElementById("businessName").value = businessLine || "";
  document.getElementById("contactPerson").value = contactLine || "";
  document.getElementById("phone").value = phone;
  document.getElementById("email").value = email;
  document.getElementById("address").value = address;
});


// ================= Form Submit with Confirmation (Custom Modal) =================

// Modal elements ko select karein
const customConfirmModal = document.getElementById("customConfirmModal");
const okDownloadBtn = document.getElementById("okDownloadBtn");
const cancelDownloadBtn = document.getElementById("cancelDownloadBtn");

// Download logic ko ek function mein wrap karein
function startDownload() {
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
}


document.getElementById("cardForm")?.addEventListener("submit", function (e) {
    e.preventDefault(); // page reload na ho

    // Custom Modal ko dikhao
    customConfirmModal.style.display = "flex";
});

// OK button click handler
okDownloadBtn.addEventListener("click", () => {
    customConfirmModal.style.display = "none"; // Modal hide karo
    startDownload(); // Download shuru karo

     sendToSheet({
      businessName: document.getElementById("businessName").value,
      contactPerson: document.getElementById("contactPerson").value,
      phone: document.getElementById("phone").value,
      email: document.getElementById("email").value,
      address: document.getElementById("address").value
    });
});

// Cancel button click handler
cancelDownloadBtn.addEventListener("click", () => {
    customConfirmModal.style.display = "none"; // Modal hide karo
    alert("Download cancelled!");
});

async function sendToSheet(ocr) {
  const url = 'https://script.google.com/a/macros/raoinformationtechnology.com/s/AKfycbwmmkOtprjZ4YK6iB7R2nusF1k8SxjUKpw8G8JmYJ2YM6g9w5itsCDltELgZi4oLHNJ/exec';
  const payload = {
    __secret: 'myApp123',
    Name: ocr.businessName || '',
    ContactPerson: ocr.contactPerson || '',
    Phone: ocr.phone || '',
    Email: ocr.email || '',
    Address: ocr.address || '',
    
    
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    console.log('Response from Google Sheet:', json);
  } catch (err) {
    console.error('Error sending to Google Sheet:', err);
  }
}
