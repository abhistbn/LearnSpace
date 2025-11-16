// Update status function
async function updateStatus(id, status) {
    try {
        const response = await fetch('/admin/update-status', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id, status })
        });

        const result = await response.json();

        if (result.success) {
            // Update the UI
            const row = document.querySelector(`tr[data-id="${id}"]`);
            const statusCell = row.querySelector('.status-display');
            
            // Replace buttons with status badge
            if (status === 'accepted') {
                statusCell.innerHTML = `
                    <span class="status-badge status-accepted">
                        <span class="checkmark"></span> Diterima
                    </span>
                `;
            } else if (status === 'rejected') {
                statusCell.innerHTML = `
                    <span class="status-badge status-rejected">
                        <span class="cross"></span> Ditolak
                    </span>
                `;
            }

            // Update statistics
            if (result.stats) {
                document.getElementById('totalCount').textContent = result.stats.total;
                document.getElementById('acceptedCount').textContent = result.stats.accepted;
                document.getElementById('rejectedCount').textContent = result.stats.rejected;
            }

            // Show success message
            showNotification('Status berhasil diupdate!', 'success');
        } else {
            showNotification(result.message || 'Gagal mengupdate status', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Terjadi kesalahan saat mengupdate status', 'error');
    }
}

// Show notification function
function showNotification(message, type = 'success') {
    // Remove existing notification if any
    const existingNotif = document.querySelector('.notification');
    if (existingNotif) {
        existingNotif.remove();
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

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
    `;

    // Add animation
    const style = document.createElement('style');
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

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Auto refresh page every 30 seconds to check for new registrations
// Uncomment if needed
// setInterval(() => {
//     window.location.reload();
// }, 30000);