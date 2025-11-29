// === DOM ELEMENTS ===
const fileUpload = document.getElementById("fileUpload");
const uploadArea = document.getElementById("uploadArea");
const filePreviewContainer = document.getElementById("filePreviewContainer");
const previewImage = document.getElementById("previewImage");
const previewFilename = document.getElementById("previewFilename");
const btnRemoveFile = document.getElementById("btnRemoveFile");

// === NOTIFICATION FUNCTION ===
function showNotification(message, type = "success") {
  const existingNotif = document.querySelector(".notification");
  if (existingNotif) existingNotif.remove();

  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px;">
      <span style="font-size: 20px;">${type === "success" ? "✓" : "✕"}</span>
      <span>${message}</span>
    </div>
  `;

  notification.style.cssText = `
    position: fixed;
    top: 120px;
    right: 20px;
    padding: 15px 25px;
    background-color: ${type === "success" ? "#a995c7" : "#d7c8ec"};
    color: ${type === "success" ? "#ffffff" : "#4b3b63"};
    border-radius: 10px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 9999;
    font-family: 'Poppins', sans-serif;
    font-weight: 600;
    animation: slideIn 0.3s ease-out;
    min-width: 300px;
  `;

  if (!document.getElementById("notification-styles")) {
    const style = document.createElement("style");
    style.id = "notification-styles";
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to   { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to   { transform: translateX(400px); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease-out";
    setTimeout(() => notification.remove(), 300);
  }, 4000);
}

// === FILE PREVIEW HANDLER ===
function handleFileSelect(file) {
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    showNotification("File harus berupa gambar!", "error");
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    previewImage.src = e.target.result;
    previewFilename.textContent = file.name;

    uploadArea.style.display = "none";
    filePreviewContainer.classList.add("active");
  };
  reader.readAsDataURL(file);
}

function resetFileUpload() {
  fileUpload.value = "";
  previewImage.src = "";
  previewFilename.textContent = "";
  filePreviewContainer.classList.remove("active");
  uploadArea.style.display = "block";
}

// === UPLOAD EVENTS ===
uploadArea.addEventListener("click", () => fileUpload.click());

fileUpload.addEventListener("change", (e) => {
  if (e.target.files.length > 0) handleFileSelect(e.target.files[0]);
});

btnRemoveFile.addEventListener("click", resetFileUpload);

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
    const dt = new DataTransfer();
    dt.items.add(files[0]);
    fileUpload.files = dt.files;
    handleFileSelect(files[0]);
  }
});

// === SUBMIT FORM WITH PRESIGNED URL ===
document.getElementById("registrationForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const form = e.target;

  // === VALIDASI FILE WAJIB ===
  const file = fileUpload.files[0];
  if (!file) {
    showNotification("Silakan upload bukti pembayaran.", "error");
    return;
  }

  const submitBtn = form.querySelector(".btn-submit");
  submitBtn.disabled = true;
  submitBtn.textContent = "Mengirim...";

  try {
    let fileURL = "";
    let fileKey = "";
    let fileName = file.name;

    // === 1. Ambil Presigned URL dari server ===
    const presignRes = await fetch("/generate-upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
      }),
    });

    const presignData = await presignRes.json();

    if (!presignData.success) {
      throw new Error("Tidak bisa mendapatkan presigned URL");
    }

    const { uploadURL, fileURL: s3FileURL, key } = presignData;

    fileURL = s3FileURL;
    fileKey = key;

    // === 2. Upload file ke S3 ===
    await fetch(uploadURL, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });

    // === 3. Kirim data form ke server ===
    const sendRes = await fetch("/daftar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nama: form.nama.value,
        email: form.email.value,
        kelas: form.kelas.value,
        fileURL,
        fileName,
        fileKey,
      }),
    });

    const result = await sendRes.json();

    if (result.success) {
      showNotification("Pendaftaran berhasil!", "success");
      setTimeout(() => window.location.href = "/sukses", 800);
    } else {
      showNotification(result.message, "error");
    }
  } catch (err) {
    showNotification("Error: " + err.message, "error");
    console.error(err);
  }

  submitBtn.disabled = false;
  submitBtn.textContent = "Daftar";
});

// === CHECK URL NOTIFS ===
window.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);

  if (urlParams.get("success") === "true") {
    showNotification("Pendaftaran berhasil dikirim!", "success");
    window.history.replaceState({}, "", window.location.pathname);
  }

  if (urlParams.get("error") === "true") {
    showNotification("Terjadi kesalahan saat mengirim data.", "error");
    window.history.replaceState({}, "", window.location.pathname);
  }
});
