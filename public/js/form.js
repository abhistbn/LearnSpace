document.addEventListener("DOMContentLoaded", () => {
  const uploadArea = document.getElementById("uploadArea");
  const fileInput = document.getElementById("fileUpload");
  const previewContainer = document.getElementById("filePreviewContainer");
  const previewImage = document.getElementById("previewImage");
  const previewName = document.getElementById("previewFilename");
  const removeBtn = document.getElementById("btnRemoveFile");
  
  // Input hidden untuk data yang akan disubmit
  const buktiURL = document.getElementById("buktiURL");
  const inputFileName = document.getElementById("fileName"); // BARU
  const inputFileKey = document.getElementById("fileKey"); // BARU

  // Klik area upload
  uploadArea.addEventListener("click", () => fileInput.click());

  // Drag-and-drop handlers
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

    // Preview UI
    previewContainer.style.display = "block";
    uploadArea.style.display = "none";

    previewImage.src = URL.createObjectURL(file);
    previewName.textContent = file.name;

    try {
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
      
      // Cek jika ada error dari server
      if (!data.success) {
          throw new Error(data.message || "Gagal mendapatkan upload URL dari server.");
      }

      // 2. Upload file ke S3 menggunakan presigned URL
      await fetch(data.uploadUrl, { // Perhatikan: data.uploadUrl harus sama dengan yang dikirim backend
        method: "PUT",
        headers: { 
          "Content-Type": file.type 
        },
        body: file,
      });

      // 3. Simpan URL final dan metadata ke hidden input
      buktiURL.value = data.fileURL;
      inputFileName.value = data.fileName; // Nama file yang sudah "safe"
      inputFileKey.value = data.fileKey; // Key path di S3
      
      alert("Upload berhasil! Silakan Kirim Form.");

    } catch (error) {
      console.error("Error dalam proses upload:", error);
      alert(`Gagal mengunggah file. Pastikan AWS Credentials (IAM Role) di Learner Lab sudah benar. Detail: ${error.message}`);
      
      // Reset UI dan input jika gagal
      removeBtn.click();
    }
  }

  // Hapus file
  removeBtn.addEventListener("click", () => {
    previewContainer.style.display = "none";
    uploadArea.style.display = "block";
    
    // Reset semua input hidden
    buktiURL.value = "";
    inputFileName.value = "";
    inputFileKey.value = "";
    
    // Reset file input
    fileInput.value = ""; 
  });
});