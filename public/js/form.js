document.addEventListener("DOMContentLoaded", () => {
  const uploadArea = document.getElementById("uploadArea");
  const fileInput = document.getElementById("fileUpload");
  const previewContainer = document.getElementById("filePreviewContainer");
  const previewImage = document.getElementById("previewImage");
  const previewName = document.getElementById("previewFilename");
  const removeBtn = document.getElementById("btnRemoveFile");
  const buktiURL = document.getElementById("buktiURL");

  // Klik area upload
  uploadArea.addEventListener("click", () => fileInput.click());

  // Drag over
  uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadArea.classList.add("drag-over");
  });

  uploadArea.addEventListener("dragleave", () => {
    uploadArea.classList.remove("drag-over");
  });

  uploadArea.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadArea.classList.remove("drag-over");
    fileInput.files = e.dataTransfer.files;
    handleFile(fileInput.files[0]);
  });

  // Input manual
  fileInput.addEventListener("change", () => {
    if (fileInput.files.length > 0) {
      handleFile(fileInput.files[0]);
    }
  });

  async function handleFile(file) {
    if (!file) return;

    // Preview
    previewContainer.style.display = "block";
    uploadArea.style.display = "none";

    previewImage.src = URL.createObjectURL(file);
    previewName.textContent = file.name;

    // 1. Request presigned URL dari backend
    const res = await fetch("/generate-upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type
      }),
    });

    const data = await res.json();

    // 2. Upload file ke S3
    await fetch(data.uploadURL, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });

    // 3. Simpan URL final ke hidden input
    buktiURL.value = data.fileURL;
  }

  // Hapus file
  removeBtn.addEventListener("click", () => {
    previewContainer.style.display = "none";
    uploadArea.style.display = "block";
    buktiURL.value = "";
    fileInput.value = "";
  });
});
