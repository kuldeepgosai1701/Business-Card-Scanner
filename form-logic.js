// Change 'load' to 'DOMContentLoaded'
window.addEventListener("DOMContentLoaded", () => {
    // Check if form elements exist before trying to fill them
    const businessNameInput = document.getElementById("businessName");
    if (!businessNameInput) {
        console.error("Form input 'businessName' not found. Cannot proceed.");
        return;
    }

    const ocrText = localStorage.getItem("ocrText");
    if (!ocrText) {
        console.warn("No OCR text found in localStorage.");
        return;
    }

    let lines = ocrText.split("\n").map(l => l.trim()).filter(l => l);
    console.log("Extracted Lines:", lines);

    // 1. Initial Data Extraction (Phone, Email)

    // 📧 Emails (Keeping the duplicate fix from before)
    const rawEmailMatches = ocrText.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi) || [];
    const uniqueEmailMatches = [...new Set(rawEmailMatches.map(e => e.toLowerCase().trim()))];
    const email = uniqueEmailMatches.join(", "); 
    

    // 📞 Phones
    let phoneMatches = ocrText.match(/\+?\d[\d\s-]{7,}\d/g) || [];
    phoneMatches = phoneMatches.filter(num => {
        const cleanNum = num.replace(/\D/g, "");
        if (/^\d{6}$/.test(cleanNum)) return false; 
        return true;
    });
    const phone = phoneMatches.join(", ");

    // 2. Clean up lines for Name and Address extraction
    lines = lines.filter(line => 
        !uniqueEmailMatches.some(e => line.toLowerCase().includes(e.toLowerCase())) && // Use unique list
        !phoneMatches.some(p => line.includes(p))
    );

    // ----------------------------------------------------
    // 3. EXTRACT CONTACT PERSON 
    // ... (Your existing contact person logic)
    // ----------------------------------------------------
    let contactLine = lines.find(l =>
        /(Dr\.|Mr\.|Mrs\.|Ms\.|Prof\.|CEO|Manager|Director|Founder|Head|MD|Chairman|Owner|Proprietor|Dean|Chief)/i.test(l)
    );

    if (contactLine) {
        let nameLine = lines.find(l => /^[A-Z][a-z]+(\s[A-Z][a-z]+){0,2}$/.test(l.trim()));
        if (nameLine && contactLine.includes('Director')) {
            contactLine = nameLine; 
        }
        contactLine = contactLine.replace(/[\(\)\[\]\{\}\d\/\.,\?\!\*]/g, ' ').trim(); 
        contactLine = contactLine.replace(/\bDirector\b/i, '').trim(); 
    }

    if (!contactLine || contactLine.length < 5) {
        let candidate = lines.find(line => 
            /^[A-Z][a-z]+(\s[A-Z][a-z]+){0,3}$/.test(line.trim()) && 
            line.length <= 30 &&
            !/@/.test(line) &&
            !/\d/.test(line) &&
            !/(Pvt|Ltd|Company|Tech|Solutions|Institute|Trust|Group|Education)/i.test(line) 
        );
        contactLine = candidate || "";
    }
    
    // ----------------------------------------------------
    // 4. EXTRACT BUSINESS NAME
    // ... (Your existing business name logic)
    // ----------------------------------------------------
    let nonAddressLines = lines.filter(line => 
        !/(garden|road|street|lane|nagar|sector|circle|city|state|india|\b\d{6}\b)/i.test(line) &&
        !/(www\.|\.com|\.in|@)/i.test(line)
    );
    nonAddressLines = nonAddressLines.filter(line =>
        !/(116|211|opp|corner point|maneja)/i.test(line)
    );


      let nonPersonLines = nonAddressLines.filter(l =>
        !/(Dr\.|Mr\.|Mrs\.|Ms\.|Prof\.|CEO|Manager|Director|Founder|Head|MD|Chairman|Owner|Dean)/i.test(l)
    );

    let businessLine = "";
    // 'University' ko sabse strong keyword banao.
    let strongKeywords = /(University|Industries|Company|Pvt|Ltd|LLP|Inc|Trust|Corporation|Associates|Technologies|Solutions|Enterprises|Group|Education|College|Hospital|Institute)/i;

    let businessIndex = nonPersonLines.findIndex(l => strongKeywords.test(l));

    if (businessIndex !== -1) {
        // Step 1: Strong keyword (like 'University') wali line lo.
        businessLine = nonPersonLines[businessIndex];
        
        // Step 2: Current line ko clean karo (especially Darshan University ke logo ke paas ke special characters).
        businessLine = businessLine.replace(/[^\w\s\-\(\)\&\.,]/g, '').trim();

        // Step 3: Agar University wali line se upar koi choti line hai, to usko jod do.
        if (businessIndex > 0) {
            let prevLine = nonPersonLines[businessIndex - 1];
            // Check: line choti ho, 5 words se kam ho, aur usme sirf numbers na ho.
            if (prevLine && prevLine.length > 2 && prevLine.split(' ').length < 5 && !/^\d+$/.test(prevLine.trim())) {
                // Prev line ko bhi clean karo
                prevLine = prevLine.replace(/[^\w\s\-\(\)\&\.,]/g, '').trim();
                // 'Darshan' ko 'UNIVERSITY' se jod do.
                businessLine = prevLine + " " + businessLine;
            }
        }
    } else {
        // Fallback: Agar koi strong keyword nahi mila to sabse badi line lo.
        businessLine = nonPersonLines.reduce((longest, line) =>
            line.length > (longest?.length || 0) ? line : longest
        , "");
    }
    
    // Final check for common business phrases (e.g., 'Darshan University')
    if (!businessLine && nonPersonLines.length > 0) {
        // Agar abhi bhi empty hai, to sabse upar ki line (jo phone/email/address nahi hai) lo
        businessLine = nonPersonLines[0].replace(/[^\w\s\-\(\)\&\.,]/g, '').trim();
    }
 
    // ----------------------------------------------------
    // 5. EXTRACT ADDRESS 
    // ... (Your existing address logic)
    // ----------------------------------------------------
    let addressMatches = [];
    for (let i = 0; i < lines.length; i++) {
        if (/(garden|Quarter|plot|gate|near|road|lane|nagar|circle|Complex|road|street|corner|park|lane|nagar|sector|circle|city|state|india)/i.test(lines[i]) || /\b\d{6}\b/.test(lines[i])) {
            let addr = lines[i];

            if (businessLine && addr.includes(businessLine)) {
                addr = addr.replace(businessLine, '').trim();
            }
            if (contactLine && addr.includes(contactLine)) {
                addr = addr.replace(contactLine, '').trim();
            }
            addr = addr.replace(/\bEducation\b/i, '').trim();

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
    // 6. FILL FORM - THIS IS THE CRITICAL STEP
    // ----------------------------------------------------

    // ✅ Fill Form
    document.getElementById("businessName").value = businessLine || "";
    document.getElementById("contactPerson").value = contactLine || "";
    document.getElementById("phone").value = phone;
    document.getElementById("email").value = email;
    document.getElementById("address").value = address;
});


// ... (The rest of your form-logic.js remains the same)


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

  fetch("https://script.google.com/macros/s/AKfycbxYEPVJJXcq503---Inck4SPLFIeTrjCfywmmgxtt01tL_HoBFiDAcm73h8AU-RVzWF/exec", requestOptions)
    .then((response) => response.text())
    .then((result) => console.log(result))
    .catch((error) => console.error(error));
  } catch (err) {
    console.error('Error sending to Google Sheet:', err);
  }
}