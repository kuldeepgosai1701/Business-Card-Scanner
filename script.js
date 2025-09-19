// script.js
// Works for both index.html (scan) and form.html (populate fields)

// --- Helper parsers ---
function extractEmails(text) {
  return Array.from(new Set((text.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi) || []).map(s => s.trim())));
}

function extractPhones(text) {
  // reasonably flexible phone regex (international/local)
  const raw = text.match(/(\+?\d{1,3}[-.\s]?)?(?:\d{10}|\d{3}[-.\s]\d{3}[-.\s]\d{4}|\d{5}[-.\s]\d{5}|\d{4}[-.\s]\d{6}|\d{2,4}[-.\s]\d{6,8})/g) || [];
  // cleanup: remove very short/garbage
  const cleaned = raw.map(s => s.replace(/[^\d+]/g, '').trim()).filter(s => s.length >= 7);
  return Array.from(new Set(cleaned));
}

function extractAddressCandidates(text) {
  // split lines, trim, remove empties
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l && l.length > 3);

  // keywords often found in addresses
  const addrKeywords = /\b(road|rd\.?|street|st\.?|lane|lane\.?|sector|sector-|sector\.|block|colony|nagar|village|town|city|dist|district|pincode|pin|postcode|state|near|opp|opposite|floor|suite|office)\b/i;

  const candidates = lines.filter(l => {
    // if line contains keyword -> likely address
    if (addrKeywords.test(l)) return true;
    // if contains 6-digit number (India pincode)
    if (/\b\d{6}\b/.test(l)) return true;
    // if line contains commas and numbers -> likely address fragment
    if (/,/.test(l) && /\d/.test(l)) return true;
    // sometimes addresses are multiword with numbers
    if (/\d/.test(l) && /\w+\s\w+/.test(l) && l.length > 15) return true;
    return false;
  });

  // fallback: last 2-3 lines if none detected
  if (candidates.length === 0) {
    const fallback = lines.slice(-3);
    return fallback;
  }

  return Array.from(new Set(candidates));
}

// --- OCR extract wrapper ---
async function extractTextFromFile(file) {
  return new Promise((resolve, reject) => {
    Tesseract.recognize(file, 'eng', { logger: m => console.log(m) })
      .then(({ data: { text } }) => resolve(text))
      .catch(err => reject(err));
  });
}

// --- INDEX PAGE: scan handler ---
async function handleScanClick() {
  const fileEl = document.getElementById('cardImage');
  const file = fileEl && fileEl.files[0];
  if (!file) {
    alert('Please upload or capture an image!');
    return;
  }

  const loader = document.getElementById('loader');
  if (loader) loader.style.display = 'block';

  try {
    const text = await extractTextFromFile(file);
    console.log('OCR raw text:', text);

    // parse values
    const emails = extractEmails(text);
    const phones = extractPhones(text);
    const addresses = extractAddressCandidates(text);

    const ocrData = {
      raw: text,
      emails,
      phones,
      addresses,
      timestamp: new Date().toISOString()
    };

    localStorage.setItem('ocrData', JSON.stringify(ocrData));
    // hide loader
    if (loader) loader.style.display = 'none';

    // redirect to form.html
    window.location.href = 'form.html';
  } catch (err) {
    if (loader) loader.style.display = 'none';
    console.error(err);
    alert('OCR failed: ' + (err.message || err));
  }
}

// --- FORM PAGE: render parsed values as editable inputs ---
function renderFormFromOCR() {
  const raw = localStorage.getItem('ocrData');
  if (!raw) return;
  const data = JSON.parse(raw);

  // show raw debug (optional) - you can remove this if you don't want to show raw text
  // if you'd like, add a <pre id="ocrRaw"></pre> in form.html to show
  const pre = document.getElementById('ocrRaw');
  if (pre) pre.textContent = data.raw;

  // Business name and contact person heuristics:
  const lines = data.raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length) {
    // company usually first line
    const company = lines[0] || '';
    const maybeContact = lines[1] || '';
    const companyEl = document.getElementById('businessName');
    const contactEl = document.getElementById('contactPerson');
    if (companyEl && !companyEl.value) companyEl.value = company;
    if (contactEl && !contactEl.value) contactEl.value = maybeContact;
  }

  // Phones
  const phonesContainer = document.getElementById('phonesContainer');
  if (phonesContainer) {
    phonesContainer.innerHTML = ''; // clear
    if (data.phones && data.phones.length) {
      data.phones.forEach((p, idx) => {
        const div = document.createElement('div');
        div.className = 'multi-row';
        div.innerHTML = `<input class="multi-input phone-input" value="${p}" /> 
                         <button class="remove-btn" type="button">Remove</button>`;
        // remove handler
        div.querySelector('.remove-btn').addEventListener('click', () => div.remove());
        phonesContainer.appendChild(div);
      });
    } else {
      // one empty input if none detected
      const div = document.createElement('div');
      div.className = 'multi-row';
      div.innerHTML = `<input class="multi-input phone-input" placeholder="Enter phone number" />`;
      phonesContainer.appendChild(div);
    }
  }

  // Emails
  const emailsContainer = document.getElementById('emailsContainer');
  if (emailsContainer) {
    emailsContainer.innerHTML = '';
    if (data.emails && data.emails.length) {
      data.emails.forEach(e => {
        const div = document.createElement('div');
        div.className = 'multi-row';
        div.innerHTML = `<input class="multi-input email-input" value="${e}" /> 
                         <button class="remove-btn" type="button">Remove</button>`;
        div.querySelector('.remove-btn').addEventListener('click', () => div.remove());
        emailsContainer.appendChild(div);
      });
    } else {
      const div = document.createElement('div');
      div.className = 'multi-row';
      div.innerHTML = `<input class="multi-input email-input" placeholder="Enter email" />`;
      emailsContainer.appendChild(div);
    }
  }

  // Addresses
  const addrContainer = document.getElementById('addressesContainer');
  if (addrContainer) {
    addrContainer.innerHTML = '';
    if (data.addresses && data.addresses.length) {
      data.addresses.forEach(a => {
        const div = document.createElement('div');
        div.className = 'multi-row';
        div.innerHTML = `<textarea class="multi-textarea address-input">${a}</textarea>
                         <button class="remove-btn" type="button">Remove</button>`;
        div.querySelector('.remove-btn').addEventListener('click', () => div.remove());
        addrContainer.appendChild(div);
      });
    } else {
      const div = document.createElement('div');
      div.className = 'multi-row';
      div.innerHTML = `<textarea class="multi-textarea address-input" placeholder="Enter address"></textarea>`;
      addrContainer.appendChild(div);
    }
  }
}

// collect values from dynamic fields and optionally save or download
function collectAndSave() {
  const businessName = document.getElementById('businessName')?.value || '';
  const contactPerson = document.getElementById('contactPerson')?.value || '';

  const phones = Array.from(document.querySelectorAll('.phone-input')).map(i => i.value.trim()).filter(Boolean);
  const emails = Array.from(document.querySelectorAll('.email-input')).map(i => i.value.trim()).filter(Boolean);
  const addresses = Array.from(document.querySelectorAll('.address-input')).map(i => i.value.trim()).filter(Boolean);

  const final = {
    businessName, contactPerson, phones, emails, addresses,
    savedAt: new Date().toISOString()
  };

  localStorage.setItem('ocrFinal', JSON.stringify(final));
  alert('Saved locally (ocrFinal). You can now download or proceed.');
}

// add handlers for "Add more" buttons
function wireAddButtons() {
  const addPhone = document.getElementById('addPhoneBtn');
  addPhone?.addEventListener('click', () => {
    const container = document.getElementById('phonesContainer');
    const div = document.createElement('div');
    div.className = 'multi-row';
    div.innerHTML = `<input class="multi-input phone-input" placeholder="New phone" />
                     <button class="remove-btn" type="button">Remove</button>`;
    div.querySelector('.remove-btn').addEventListener('click', () => div.remove());
    container.appendChild(div);
  });

  const addEmail = document.getElementById('addEmailBtn');
  addEmail?.addEventListener('click', () => {
    const container = document.getElementById('emailsContainer');
    const div = document.createElement('div');
    div.className = 'multi-row';
    div.innerHTML = `<input class="multi-input email-input" placeholder="New email" />
                     <button class="remove-btn" type="button">Remove</button>`;
    div.querySelector('.remove-btn').addEventListener('click', () => div.remove());
    container.appendChild(div);
  });

  const addAddr = document.getElementById('addAddrBtn');
  addAddr?.addEventListener('click', () => {
    const container = document.getElementById('addressesContainer');
    const div = document.createElement('div');
    div.className = 'multi-row';
    div.innerHTML = `<textarea class="multi-textarea address-input" placeholder="New address"></textarea>
                     <button class="remove-btn" type="button">Remove</button>`;
    div.querySelector('.remove-btn').addEventListener('click', () => div.remove());
    container.appendChild(div);
  });

  const saveBtn = document.getElementById('saveBtn');
  saveBtn?.addEventListener('click', collectAndSave);

  const downloadBtn = document.getElementById('downloadBtn');
  downloadBtn?.addEventListener('click', () => {
    const final = JSON.parse(localStorage.getItem('ocrFinal') || '{}');
    const blob = new Blob([JSON.stringify(final, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'card_details.json';
    a.click();
    URL.revokeObjectURL(url);
  });
}

// --- On load: decide page ---
document.addEventListener('DOMContentLoaded', () => {
  // If index page present (scanBtn), wire scan
  const scanBtn = document.getElementById('scanBtn');
  if (scanBtn) {
    scanBtn.addEventListener('click', handleScanClick);
    return;
  }

  // If form page present, render parsed data
  if (document.getElementById('cardForm')) {
    renderFormFromOCR();
    wireAddButtons();
  }
});
