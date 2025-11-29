document.getElementById("registrationForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const form = e.target;
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

    // 1. Request presigned URL
    const presignRes = await fetch("/generate-upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
      }),
    });

    const presignData = await presignRes.json();

    if (!presignData.success) throw new Error("Gagal membuat presigned URL");

    const { uploadURL, fileURL: s3FileURL, key } = presignData;

    fileURL = s3FileURL;
    fileKey = key;

    // 2. Upload ke S3
    await fetch(uploadURL, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });

    // 3. ==== SET HIDDEN INPUTS ====
    document.getElementById("fileURL").value = fileURL;
    document.getElementById("fileName").value = fileName;
    document.getElementById("fileKey").value = fileKey;

    // 4. Submit data ke backend
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
  }

  submitBtn.disabled = false;
  submitBtn.textContent = "Daftar";
});
