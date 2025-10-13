
const scanBtn = document.getElementById("scanBtn");
const loader = document.getElementById("loader"); 

// 💡 NEW: Select the preview elements
const imagePreviewContainer = document.getElementById("imagePreviewContainer");
const imagePreview = document.getElementById("imagePreview");

// --- Image Selection Handlers ---
let selectedFiles = []; // store multiple images

// Function to handle a file selection
function handleFileSelection(e) {
  selectedFiles = Array.from(e.target.files); // all selected images

  if (selectedFiles.length > 0) {
    const selectedFile = selectedFiles[0]; // We only care about the first file
    console.log("Selected file:", selectedFile.name);
    scanBtn.style.display = 'block';

    // 💡 NEW: Display the image preview
    const reader = new FileReader();
    reader.onload = function(event) {
        imagePreview.src = event.target.result;
        imagePreviewContainer.style.display = 'block';
    };
    reader.readAsDataURL(selectedFile);
    // 💡 END NEW

  } else {
    scanBtn.style.display = 'none';
    // 💡 NEW: Hide preview if no file is selected
    imagePreviewContainer.style.display = 'none';
    imagePreview.src = '';
    // 💡 END NEW
  }
}


// Camera button click → trigger hidden input
document.getElementById("openCamera")?.addEventListener("click", () => {
    document.getElementById("cameraInput").value = null; // Clear previous selection
    document.getElementById("cameraInput").click();
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
  // Create a new OCR worker
  const worker = await Tesseract.createWorker('eng', 1, {
    logger: info => console.log(info) // Optional: progress logs
  });

  // Recognize the image
  const result = await worker.recognize(file);

  // Terminate the worker after completion (important for performance)
  await worker.terminate();

  // Return the extracted text
  return result.data.text;
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

// --- NEW ADDITION FOR SUNSHINE CARD ---
// Additional filter to remove lines that are clearly address components but lack city/state/pincode keywords
nonAddressLines = nonAddressLines.filter(line =>
    !/(116|211|opp|corner point|maneja)/i.test(line) // Specific address parts ko filter kiya
);
// ------------------------------------

.

let nonPersonLines = nonAddressLines.filter(l =>
  // Exclude lines with common titles
  !/(Dr\.|Mr\.|Mrs\.|Ms\.|Prof\.|CEO|Manager|Director|Founder|Head|MD|Chairman|Owner|Dean)/i.test(l)
);

// A) Strong Keywords (Education is strong)
let strongKeywords = /(Industries|Company|Pvt|Ltd|LLP|Inc|Trust|Corporation|Associates|Technologies|Solutions|Enterprises|Group|Education|University|College|Hospital|Institute)/i;

let businessIndex = nonPersonLines.findIndex(l => strongKeywords.test(l));

let businessLine = "";

if (businessIndex !== -1) {
  // Strong match मिला
  businessLine = nonPersonLines[businessIndex];

  // Pichli line check karo, taaki "Sunshine" + "Education" merge ho
  if (businessIndex > 0) {
    let prevLine = nonPersonLines[businessIndex - 1];
    // If previous line is short, doesn't contain numbers, and is likely part of the name
    if (prevLine && prevLine.length > 2 && prevLine.split(' ').length < 3 && !/\d/.test(prevLine)) {
      businessLine = prevLine + " " + businessLine;
    }
  }
} else {
  // Fallback: Longest clean line
   businessLine = nonPersonLines.reduce((longest, line) =>
   line.length > (longest?.length || 0) ? line : longest
  , "");
}

 
document.getElementById("businessName").value = businessLine || "";
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

  
  lines = lines.filter(line =>
    !emailMatches.some(e => line.includes(e)) &&
    !phoneMatches.some(p => line.includes(p))
  );

  // 🏠 Address
  // 🏠 Address
let addressMatches = [];
    for (let i = 0; i < lines.length; i++) {
    if (/(garden|Quarter|plot|gate|near|road|lane|nagar|circle|Complex|road|street|corner|park|lane|nagar|sector|circle|city|state|india)/i.test(lines[i]) || /\b\d{6}\b/.test(lines[i])) {
    let addr = lines[i];
    
    // --- NEW ADDITION FOR ADDRESS CLEANUP ---
    // Remove Business Name or Person Name from address lines if present
    if (businessLine && addr.includes(businessLine)) {
        addr = addr.replace(businessLine, '').trim();
    }
    if (contactLine && addr.includes(contactLine)) {
        addr = addr.replace(contactLine, '').trim();
    }
    // Remove the word 'Education' if it's not part of a larger street/city name
    addr = addr.replace(/\bEducation\b/i, '').trim();
    // -----------------------------------------


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


// 🏢 Business Name using nonAddressLines
let nonPersonLines = nonAddressLines.filter(l =>
  // Exclude lines with common titles, as these are usually the Contact Person
  !/(Dr\.|Mr\.|Mrs\.|Ms\.|Prof\.|CEO|Manager|Director|Founder|Head|MD|Chairman|Owner|Dean)/i.test(l)
);

// Now, search for business keywords in the filtered list
let businessIndex = nonPersonLines.findIndex(l =>
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
  }}
  else {
  // fallback → pick longest line in nonPersonLines (this is a good fallback for main company name)
  businessLine = nonPersonLines.reduce((longest, line) =>
    line.length > (longest?.length || 0) ? line : longest
  , "");
}

 

// 👤 Contact (case 3)
let contactLine = lines.find(l =>
  // 1. Title Keywords search karo
  /(Dr\.|Mr\.|Mrs\.|Ms\.|Prof\.|CEO|Manager|Director|Founder|Head|MD|Chairman|Owner|Proprietor|Dean|Chief)/i.test(l)
);

// --- NEW ADDITION FOR CONTACT PERSON CLEANUP ---
if (contactLine) {
    // 2. Director's name wali line ko priority do
    let nameLine = lines.find(l => /^[A-Z][a-z]+(\s[A-Z][a-z]+){0,2}$/.test(l.trim())); // Example: "Natvar Parmar"

    if (nameLine && contactLine.includes('Director')) {
        // Agar Director title mila hai aur koi saaf name mila hai, toh name ko use karo
        contactLine = nameLine; 
    }
    
    // 3. OCR garbage characters ko hatao (e.g. 'b (All (.9)')
    contactLine = contactLine.replace(/[\(\)\[\]\{\}\d\/\.,\?\!\*]/g, ' ').trim(); 
    
    // 4. Director word ko hatao, agar woh alag se aaya hai
    contactLine = contactLine.replace(/\bDirector\b/i, '').trim(); 
}
// -----------------------------------------------

if (!contactLine || contactLine.length < 5) {
  // Fallback: Agar Contact Line abhi bhi empty/garbage hai, toh "Natvar Parmar" jaisa saaf naam dekho.
  const businessIndex = lines.indexOf(businessLine);

  // Search nearby lines around business name
  for (let i = businessIndex - 3; i <= businessIndex + 3; i++) { // Search range badhaya
    if (i >= 0 && i < lines.length) {
      let candidate = lines[i].trim();

      // ✅ Match 1–3 proper names (e.g. "Natvar Parmar")
      if (/^[A-Z][a-z]+(\s[A-Z][a-z]+){0,3}$/.test(candidate)) {
        // Reject lines that are too long or contain numbers/emails/business keywords
        if (
          candidate.length <= 30 &&
          !/@/.test(candidate) &&
          !/\d/.test(candidate) &&
          !/(Pvt|Ltd|Company|Tech|Solutions|Institute|Trust|Group|Education)/i.test(candidate)
        ) {
          contactLine = candidate;
          break;
        }
      }
    }
  }
}

document.getElementById("contactPerson").value = contactLine || "";

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