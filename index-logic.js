const scanBtn = document.getElementById("scanBtn");
const loader = document.getElementById("loader"); 
const imagePreviewContainer = document.getElementById("imagePreviewContainer");
const imagePreview = document.getElementById("imagePreview");

// --- Image Selection Handlers ---
let selectedFiles = []; // store multiple images

// Function to handle a file selection
function handleFileSelection(e) {
  selectedFiles = Array.from(e.target.files);

  if (selectedFiles.length > 0) {
    const selectedFile = selectedFiles[0];
    console.log("Selected file:", selectedFile.name);
    scanBtn.style.display = 'block';

    const reader = new FileReader();
    reader.onload = function(event) {
        imagePreview.src = event.target.result;
        imagePreviewContainer.style.display = 'block';
    };
    reader.readAsDataURL(selectedFile);
  } else {
    scanBtn.style.display = 'none';
    imagePreviewContainer.style.display = 'none';
    imagePreview.src = '';
  }
}

// Camera button click → trigger hidden input
document.getElementById("openCamera")?.addEventListener("click", () => {
    document.getElementById("cameraInput").value = null;
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
    
    const selectedFile = selectedFiles[0];

    loader.style.display = "block";
    scanBtn.style.display = 'none'; // Hide button during scan

    const text = await extractText(selectedFile);
    
    localStorage.setItem("ocrText", text);
    loader.style.display = "none";
    window.location.href = "form.html";
});


async function extractText(file) {
    // You must ensure Tesseract.js is loaded in index.html for this to work
    const { createWorker } = Tesseract;
    const worker = await createWorker({
        logger: info => console.log(info)
    });

    await worker.loadLanguage('eng');
    await worker.initialize('eng');

    const result = await worker.recognize(file);
    await worker.terminate();

    return result.data.text;
}

// Service worker register (Keep this here or in index.html)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(reg => console.log('Service Worker registered:', reg.scope))
      .catch(err => console.log('Service Worker failed:', err));
  });
}