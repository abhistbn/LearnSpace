const fileUpload = document.getElementById("fileUpload");
const uploadArea = document.getElementById("uploadArea");
const filePreviewContainer = document.getElementById("filePreviewContainer");
const previewImage = document.getElementById("previewImage");
const previewFilename = document.getElementById("previewFilename");
const btnRemoveFile = document.getElementById("btnRemoveFile");

function showNotification(message, type = 'success') {
  // Remove existing notification if any
  const existingNotif = document.querySelector('.notification');
  if (existingNotif) {
    existingNotif.remove();
  }

  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px;">
      <span style="font-size: 20px;">${type === 'success' ? '✓' : '✕'}</span>
      <span>${message}</span>
    </div>
  `;

  // Add styles
  notification.style.cssText = `
    position: fixed;
    top: 120px;
    right: 20px;
    padding: 15px 25px;
    background-color: ${type === 'success' ? '#a995c7' : '#d7c8ec'};
    color: ${type === 'success' ? '#ffffff' : '#4b3b63'};
    border-radius: 10px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 9999;
    font-family: 'Poppins', sans-serif;
    font-weight: 600;
    animation: slideIn 0.3s ease-out;
    min-width: 300px;
  `;

  // Add animation styles if not already added
  if (!document.getElementById('notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(400px);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(notification);

  // Remove after 4 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 4000);
}
// ========================================

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

// Form submission with AJAX
document.getElementById("registrationForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const form = e.target;
  const submitBtn = form.querySelector('.btn-submit');
  const originalBtnText = submitBtn.textContent;
  
  // Disable submit button
  submitBtn.disabled = true;
  submitBtn.textContent = 'Mengirim...';
  submitBtn.style.opacity = '0.6';
  submitBtn.style.cursor = 'not-allowed';

  try {
    const formData = new FormData(form);
    
    console.log('Mengirim data ke server...');
    
    const response = await fetch('/daftar', {
      method: 'POST',
      body: formData
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Server tidak mengembalikan JSON response');
    }

    const result = await response.json();
    console.log('Response dari server:', result);

    if (result.success) {
      // Show success notification
      showNotification(result.message || 'Pendaftaran berhasil dikirim!', 'success');
      
      // Redirect ke halaman sukses
      setTimeout(() => {
        window.location.href = '/sukses';
      }, 1000);
    } else {
      showNotification(result.message || 'Gagal mengirim pendaftaran', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
      submitBtn.style.opacity = '1';
      submitBtn.style.cursor = 'pointer';
    }
  } catch (error) {
    console.error('Error detail:', error);
    showNotification('Terjadi kesalahan: ' + error.message, 'error');
    submitBtn.disabled = false;
    submitBtn.textContent = originalBtnText;
    submitBtn.style.opacity = '1';
    submitBtn.style.cursor = 'pointer';
  }
});

// Check for success/error in URL params (for non-AJAX fallback)
window.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  
  if (urlParams.get('success') === 'true') {
    showNotification('Pendaftaran berhasil dikirim!', 'success');
    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
  } else if (urlParams.get('error') === 'true') {
    showNotification('Terjadi kesalahan saat mengirim data', 'error');
    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
  }
});