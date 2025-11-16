const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'bukti-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files (jpeg, jpg, png) are allowed!'));
        }
    }
});

// In-memory database (replace with real database in production)
let registrations = [];
let currentId = 1;

// Routes
// Home - Form Registration
app.get('/', (req, res) => {
    res.render('form');
});

app.get('/daftar', (req, res) => {
    res.render('form');
});

// Handle form submission
app.post('/daftar', upload.single('bukti'), (req, res) => {
    try {
        const { nama, email, kelas } = req.body;
        const buktiPath = req.file ? `/uploads/${req.file.filename}` : null;

        const newRegistration = {
            id: 'P' + String(currentId).padStart(3, '0'),
            nama,
            email,
            kelas,
            buktiPath,
            status: 'pending' // pending, accepted, rejected
        };

        registrations.push(newRegistration);
        currentId++;

        // Check if it's an AJAX request
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            res.json({ 
                success: true, 
                message: 'Pendaftaran berhasil dikirim! Menunggu konfirmasi admin.',
                data: newRegistration 
            });
        } else {
            // For regular form submission
            res.redirect('/daftar?success=true');
        }
    } catch (error) {
        console.error('Error:', error);
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            res.status(500).json({ 
                success: false, 
                message: 'Terjadi kesalahan saat mendaftar' 
            });
        } else {
            res.redirect('/daftar?error=true');
        }
    }
});

// Admin page
app.get('/admin', (req, res) => {
    const stats = {
        total: registrations.length,
        accepted: registrations.filter(r => r.status === 'accepted').length,
        rejected: registrations.filter(r => r.status === 'rejected').length
    };

    res.render('admin', { 
        registrations,
        stats
    });
});

// Update status
app.post('/admin/update-status', (req, res) => {
    try {
        const { id, status } = req.body;
        
        const registration = registrations.find(r => r.id === id);
        if (registration) {
            registration.status = status;
            
            const stats = {
                total: registrations.length,
                accepted: registrations.filter(r => r.status === 'accepted').length,
                rejected: registrations.filter(r => r.status === 'rejected').length
            };
            
            res.json({ 
                success: true, 
                message: 'Status berhasil diupdate',
                stats
            });
        } else {
            res.status(404).json({ 
                success: false, 
                message: 'Data tidak ditemukan' 
            });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Terjadi kesalahan' 
        });
    }
});

// Delete registration
app.delete('/admin/delete/:id', (req, res) => {
    try {
        const { id } = req.params;
        const index = registrations.findIndex(r => r.id === id);
        
        if (index !== -1) {
            // Delete file if exists
            const registration = registrations[index];
            if (registration.buktiPath) {
                const filePath = path.join(__dirname, 'public', registration.buktiPath);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
            
            registrations.splice(index, 1);
            
            const stats = {
                total: registrations.length,
                accepted: registrations.filter(r => r.status === 'accepted').length,
                rejected: registrations.filter(r => r.status === 'rejected').length
            };
            
            res.json({ 
                success: true, 
                message: 'Data berhasil dihapus',
                stats
            });
        } else {
            res.status(404).json({ 
                success: false, 
                message: 'Data tidak ditemukan' 
            });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Terjadi kesalahan' 
        });
    }
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        success: false, 
        message: err.message || 'Something went wrong!' 
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});