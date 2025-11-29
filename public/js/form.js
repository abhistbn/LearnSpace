document.addEventListener("DOMContentLoaded", () => {
  const uploadArea = document.getElementById("uploadArea");
  const fileInput = document.getElementById("fileUpload");
  const previewContainer = document.getElementById("filePreviewContainer");
  const previewImage = document.getElementById("previewImage");
  const previewName = document.getElementById("previewFilename");
  const removeBtn = document.getElementById("btnRemoveFile");
  
  // Input hidden untuk data yang akan disubmit
  const buktiURL = document.getElementById("buktiURL");
  const inputFileName = document.getElementById("fileName"); 
  const inputFileKey = document.getElementById("fileKey"); 

  // Ambil elemen form dan tombol submit
  const registrationForm = document.getElementById("registrationForm");
  const btnSubmit = document.getElementById("btnSubmit"); // <-- AMBIL TOMBOL SUBMIT

  // Klik area upload
  uploadArea.addEventListener("click", () => fileInput.click());

  // Drag-and-drop handlers (kode ini tetap sama)
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
    
    // --- START: KONTROL TOMBOL SUBMIT SAAT UPLOAD ---
    btnSubmit.disabled = true;
    btnSubmit.textContent = "Mengunggah...";
    // --- END: KONTROL TOMBOL SUBMIT SAAT UPLOAD ---

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
      const uploadRes = await fetch(data.uploadUrl, { 
        method: "PUT",
        headers: { 
          "Content-Type": file.type 
        },
        body: file,
      });

      // Cek status respons S3 (biasanya 200 OK jika sukses)
      if (!uploadRes.ok) {
        throw new Error(`Upload ke S3 gagal dengan status: ${uploadRes.status}`);
      }

      // 3. Simpan URL final dan metadata ke hidden input
      buktiURL.value = data.fileURL;
      inputFileName.value = data.fileName; 
      inputFileKey.value = data.fileKey; 
      
      alert("Upload bukti pembayaran berhasil! Silakan klik 'Kirim' untuk menyelesaikan pendaftaran.");
      
      // --- START: AKTIFKAN KEMBALI TOMBOL SUBMIT SETELAH SUKSES ---
      btnSubmit.disabled = false;
      btnSubmit.textContent = "Kirim";
      // --- END: AKTIFKAN KEMBALI TOMBOL SUBMIT SETELAH SUKSES ---

    } catch (error) {
      console.error("Error dalam proses upload:", error);
      alert(`Gagal mengunggah file. Detail: ${error.message}`);
      
      // --- START: AKTIFKAN KEMBALI TOMBOL SUBMIT SETELAH GAGAL ---
      btnSubmit.disabled = false;
      btnSubmit.textContent = "Kirim";
      // --- END: AKTIFKAN KEMBALI TOMBOL SUBMIT SETELAH GAGAL ---
      
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

    // Pastikan tombol submit selalu aktif saat tidak ada file
    btnSubmit.disabled = false;
    btnSubmit.textContent = "Kirim";
  });


  // ==========================================================
  // =============== HANDLER SUBMIT FORM (TETAP SAMA) ===============
  // ==========================================================

  registrationForm.addEventListener("submit", async (e) => {
    e.preventDefault(); 

    // Pastikan buktiURL terisi (Cek ini tetap diperlukan sebagai pengaman)
    if (!buktiURL.value) {
      alert("Harap unggah bukti pembayaran terlebih dahulu sebelum mengirim formulir!");
      return;
    }
    
    // Nonaktifkan tombol saat submit data ke database
    btnSubmit.disabled = true;
    btnSubmit.textContent = "Mengirim...";

    // Ambil data dari form (termasuk hidden input)
    const formData = new FormData(registrationForm);
    const data = Object.fromEntries(formData.entries()); 

    try {
      // Kirim data pendaftaran ke backend
      const res = await fetch("/daftar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (result.success) {
        // Jika sukses, arahkan ke halaman sukses
        window.location.href = "/sukses";
      } else {
        alert(result.message || "Pendaftaran gagal disimpan di database.");
      }
    } catch (error) {
      console.error("Error submit form:", error);
      alert("Terjadi masalah saat mengirim pendaftaran. Cek konsol untuk detail.");
    } finally {
        // Pastikan tombol aktif kembali jika ada kegagalan sebelum redirect
        if (window.location.pathname !== "/sukses") {
            btnSubmit.disabled = false;
            btnSubmit.textContent = "Kirim";
        }
    }
  });
});