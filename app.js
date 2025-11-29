const express = require("express");
const multer = require("multer");
const path = require("path");

const app = express();

app.use(express.static(path.join(__dirname, "public")));


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "src", "views"));

app.use(express.urlencoded({ extended: true }));

// Halaman Home (default)

// ==== SESSION UNTUK LOGIN ADMIN ====
app.use(
  session({
    secret: "adminsecret123",
    resave: false,
    saveUninitialized: true,
  })
);

// ==== KONEKSI DATABASE ====
const db = mysql.createConnection({
  host: 'learnspace-db.cdcs2wkm2ehy.us-east-1.rds.amazonaws.com',
  user: 'learnspace',       
  password: 'Adminls123!',       
  database: 'learnspace',
  port : 3306
});

db.connect((err) => {
  if (err) {
    console.error('❌ Koneksi database gagal:', err);
    return;
  }
  console.log('✅ Terhubung ke database MySQL!');
});

// ==== UPLOAD FILE dengan Ekstensi ====
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "uploads"));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage: storage });

// ==== MIDDLEWARE CEK LOGIN ADMIN ====
function checkAdmin(req, res, next) {
    if (req.session.isAdmin) {
        return next();
    }
    return res.redirect("/login");
}


// ===================== HALAMAN PUBLIK =====================

// HOME
app.get("/", (req, res) => {
  res.render("home");
});

// Halaman Form
app.get("/daftar", (req, res) => {
  res.render("form");
});

// Submit Form + Upload
app.post("/daftar", upload.single("bukti"), (req, res) => {
  const { nama, email, kelas } = req.body;
  const fileData = req.file;

  console.log("===== DATA PESERTA =====");
  console.log("Nama:", nama);
  console.log("Email:", email);
  console.log("Kelas:", kelas);
  console.log("===== FILE UPLOAD =====");
  console.log(fileData);

  res.send(`<h2>Pendaftaran berhasil!</h3>
            <p>Nama: ${nama}</p>
            <p>Email: ${email}</p>
            <p>Kelas: ${kelas}</p>
            <a href="/">Kembali ke Home</a>`);
});


// Halaman Login Admin
app.get("/login", (req, res) => {
  res.render("loginAdmin");
});

// Proses Login Admin
// app.post("/login", (req, res) => {
//   const { nama, password } = req.body;

//   // ==== AKUN ADMIN ====
//   const ADMIN_USERNAME = "admin";
//   const ADMIN_PASSWORD = "12345";

//   if (nama === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
//     req.session.isAdmin = true;
//     return res.json({ success: true });
//   }

//   return res.json({ success: false });
// });

//karena pake mysql jadi diganti langsung nyambung dari sql nya
app.post("/login", (req, res) => {
  const { nama, password } = req.body;

  const sql = "SELECT * FROM admin WHERE nama = ? LIMIT 1";

  db.query(sql, [nama], (err, results) => {
    if (err) {
      console.error("DB ERROR:", err);
      return res.json({ success: false });
    }

    if (results.length === 0) {
      return res.json({ success: false });
    }

    const admin = results[0];

    if (admin.password !== password) {
      return res.json({ success: false });
    }

    req.session.isAdmin = true;
    return res.json({ success: true });
  });
});


// ===================== DASHBOARD ADMIN =====================

// Halaman Dashboard Admin
app.get("/admin", checkAdmin, (req, res) => {
    // Ambil semua data peserta dari database
    const sql = 'SELECT * FROM peserta ORDER BY id DESC';
    
    db.query(sql, (err, results) => {
      if (err) {
        console.error('❌ Error mengambil data:', err);
        return res.status(500).send('Database error');
      }

      // Hitung statistik
      const stats = {
        total: results.length,
        accepted: results.filter(p => p.status === 'accepted').length,
        rejected: results.filter(p => p.status === 'rejected').length
      };

      console.log("===== CEK DATA PESERTA =====");
      console.log("Jumlah peserta:", results.length);
      console.log("Stats:", stats);

      res.render("admin", { 
        registrations: results,
        stats: stats 
      });
    });
});

// Update Status Pendaftaran
app.post("/admin/update-status", checkAdmin, (req, res) => {
  const { id, status } = req.body;

  console.log("===== UPDATE STATUS =====");
  console.log("ID:", id);
  console.log("Status:", status);

  // Update status di database
  const sql = 'UPDATE peserta SET status = ? WHERE id = ?';
  
  db.query(sql, [status, id], (err, result) => {
    if (err) {
      console.error('❌ Error update status:', err);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengupdate status'
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Peserta tidak ditemukan'
      });
    }

    console.log("✅ Status berhasil diupdate!");

    // Hitung ulang statistik
    db.query('SELECT * FROM peserta', (err, results) => {
      const stats = {
        total: results.length,
        accepted: results.filter(p => p.status === 'accepted').length,
        rejected: results.filter(p => p.status === 'rejected').length
      };

      res.json({
        success: true,
        message: `Status berhasil diubah menjadi ${status}`,
        stats: stats
      });
    });
  });
});

// Logout Admin
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login");
});

// ===================== PORT =====================
app.listen(3000, () => {
  console.log("Server berjalan di http://localhost:3000");
});