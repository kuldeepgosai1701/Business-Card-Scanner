 window.addEventListener("load", () => {
  if (!document.getElementById("businessName")) return;

  const ocrText = localStorage.getItem("ocrText");
  if (!ocrText) return;

  let lines = ocrText.split("\n").map(l => l.trim()).filter(l => l);
  console.log("Extracted Lines:", lines);

  // 1. Initial Data Extraction (Phone, Email)
  
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

  // 2. Clean up lines for Name and Address extraction
  lines = lines.filter(line => 
    !emailMatches.some(e => line.includes(e)) &&
    !phoneMatches.some(p => line.includes(p))
  );

// ----------------------------------------------------
// 3. EXTRACT CONTACT PERSON FIRST (Needed for Address Cleanup)
// ----------------------------------------------------

// 👤 Contact (case 3)
let contactLine = lines.find(l =>
  // 1. Title Keywords search karo
  /(Dr\.|Mr\.|Mrs\.|Ms\.|Prof\.|CEO|Manager|Director|Founder|Head|MD|Chairman|Owner|Proprietor|Dean|Chief)/i.test(l)
);

// --- NEW ADDITION FOR CONTACT PERSON CLEANUP ---
if (contactLine) {
    // 2. Director's name wali line ko priority do
    let nameLine = lines.find(l => /^[A-Z][a-z]+(\s[A-Z][a-z]+){0,2}$/.test(l.trim()));

    if (nameLine && contactLine.includes('Director')) {
        contactLine = nameLine; 
    }
    
    // 3. OCR garbage characters ko hatao
    contactLine = contactLine.replace(/[\(\)\[\]\{\}\d\/\.,\?\!\*]/g, ' ').trim(); 
    
    // 4. Director word ko hatao, agar woh alag se aaya hai
    contactLine = contactLine.replace(/\bDirector\b/i, '').trim(); 
}

if (!contactLine || contactLine.length < 5) {
  // Fallback: "Natvar Parmar" jaisa saaf naam dekho.
  let candidate = lines.find(line => 
    /^[A-Z][a-z]+(\s[A-Z][a-z]+){0,3}$/.test(line.trim()) && // Proper Name format
    line.length <= 30 &&
    !/@/.test(line) &&
    !/\d/.test(line) &&
    !/(Pvt|Ltd|Company|Tech|Solutions|Institute|Trust|Group|Education)/i.test(line) // Not a business line
  );
  contactLine = candidate || "";
}

// ----------------------------------------------------
// 4. EXTRACT BUSINESS NAME (Needed for Address Cleanup)
// ----------------------------------------------------

  // Remove address and email/phone lines to get clean business name candidates
  let nonAddressLines = lines.filter(line => 
      !/(garden|road|street|lane|nagar|sector|circle|city|state|india|\b\d{6}\b)/i.test(line) &&
      !/(www\.|\.com|\.in|@)/i.test(line)
  );
  nonAddressLines = nonAddressLines.filter(line =>
    !/(116|211|opp|corner point|maneja)/i.test(line) // Specific address parts
  );

  let nonPersonLines = nonAddressLines.filter(l =>
    !/(Dr\.|Mr\.|Mrs\.|Ms\.|Prof\.|CEO|Manager|Director|Founder|Head|MD|Chairman|Owner|Dean)/i.test(l)
  );

let businessLine = "";
let strongKeywords = /(Industries|Company|Pvt|Ltd|LLP|Inc|Trust|Corporation|Associates|Technologies|Solutions|Enterprises|Group|Education|University|College|Hospital|Institute)/i;

let businessIndex = nonPersonLines.findIndex(l => strongKeywords.test(l));

if (businessIndex !== -1) {
  businessLine = nonPersonLines[businessIndex];

  if (businessIndex > 0) {
    let prevLine = nonPersonLines[businessIndex - 1];
    if (prevLine && prevLine.length > 2 && prevLine.split(' ').length < 3 && !/\d/.test(prevLine)) {
      businessLine = prevLine + " " + businessLine;
    }
  }
} else {
  businessLine = nonPersonLines.reduce((longest, line) =>
    line.length > (longest?.length || 0) ? line : longest
  , "");
}


// ----------------------------------------------------
// 5. EXTRACT ADDRESS (Now using defined contactLine and businessLine)
// ----------------------------------------------------

let addressMatches = [];
for (let i = 0; i < lines.length; i++) {
  if (/(garden|Quarter|plot|gate|near|road|lane|nagar|circle|Complex|road|street|corner|park|lane|nagar|sector|circle|city|state|india)/i.test(lines[i]) || /\b\d{6}\b/.test(lines[i])) {
    let addr = lines[i];

    // --- ADDRESS CLEANUP (NOW WORKS!) ---
    if (businessLine && addr.includes(businessLine)) {
        addr = addr.replace(businessLine, '').trim();
    }
    if (contactLine && addr.includes(contactLine)) {
        addr = addr.replace(contactLine, '').trim();
    }
    addr = addr.replace(/\bEducation\b/i, '').trim();
    // ------------------------------------

    // Check next 1-2 lines
    if (i + 1 < lines.length && !/(www|@)/i.test(lines[i+1])) {
      addr += ", " + lines[i+1];
      i++;
    }
    if (i + 1 < lines.length && !/(www|@)/i.test(lines[i+1]) && !/\b\d{10}\b/.test(lines[i+1])) {
      addr += ", " + lines[i+1];
      i++;
    }

    addressMatches.push(addr);
  }
}
const address = addressMatches.join(", ");

// ----------------------------------------------------
// 6. FILL FORM
// ----------------------------------------------------

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
okDownloadBtn?.addEventListener("click", () => {
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
cancelDownloadBtn?.addEventListener("click", () => {
    customConfirmModal.style.display = "none"; // Modal hide karo
    alert("Download cancelled!");
});

async function sendToSheet(ocr) {
 
  const formdata = new FormData();
  formdata.append("__secret", "myApp123");
  formdata.append("Name", ocr.businessName);
  formdata.append('ContactPerson', ocr.contactPerson || '');
  formdata.append('Phone', ocr.phone || '');
  formdata.append('Email', ocr.email || '');
  formdata.append('Address', ocr.address || '');


  const requestOptions = {
    method: "POST",
    body: formdata,
    redirect: "follow"
  };

  try{

  fetch("https://script.google.com/macros/s/AKfycbxzhxJaYo2VGwM8RFeCc8hXAkVi3b1wvd2x4n9A0GkxfOaahGmNOZffKGNlp6gb6r5Q/exec", requestOptions)
    .then((response) => response.text())
    .then((result) => console.log(result))
    .catch((error) => console.error(error));
  } catch (err) {
    console.error('Error sending to Google Sheet:', err);
  }
}