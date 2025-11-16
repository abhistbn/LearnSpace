const fileUpload = document.getElementById("fileUpload");
const uploadArea = document.getElementById("uploadArea");
const filePreviewContainer = document.getElementById("filePreviewContainer");
const previewImage = document.getElementById("previewImage");
const previewFilename = document.getElementById("previewFilename");
const btnRemoveFile = document.getElementById("btnRemoveFile");

function handleFileSelect(file) {
  if (file && file.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.onload = function (e) {
      previewImage.src = e.target.result;
      previewFilename.textContent = file.name;

      // Hide upload area, show preview
      uploadArea.style.display = "none";
      filePreviewContainer.classList.add("active");
    };
    reader.readAsDataURL(file);
  }
}

function resetFileUpload() {
  // Clear file input
  fileUpload.value = "";

  // Hide preview, show upload area
  filePreviewContainer.classList.remove("active");
  uploadArea.style.display = "block";

  // Clear preview
  previewImage.src = "";
  previewFilename.textContent = "";
}

// Click to upload
uploadArea.addEventListener("click", () => {
  fileUpload.click();
});

fileUpload.addEventListener("change", (e) => {
  if (e.target.files.length > 0) {
    handleFileSelect(e.target.files[0]);
  }
});

// Remove file button
btnRemoveFile.addEventListener("click", () => {
  resetFileUpload();
});

// Drag and drop for initial upload area
uploadArea.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadArea.style.borderColor = "var(--tertiary)";
  uploadArea.style.background = "#f5f0fa";
});

uploadArea.addEventListener("dragleave", () => {
  uploadArea.style.borderColor = "#d0d0d0";
  uploadArea.style.background = "#fafafa";
});

uploadArea.addEventListener("drop", (e) => {
  e.preventDefault();
  uploadArea.style.borderColor = "#d0d0d0";
  uploadArea.style.background = "#fafafa";

  const files = e.dataTransfer.files;
  if (files.length > 0) {
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(files[0]);
    fileUpload.files = dataTransfer.files;
    handleFileSelect(files[0]);
  }
});

// Form submission
document.getElementById("registrationForm").addEventListener("submit", () => {
  console.log("Mengirim formulir...");
});
