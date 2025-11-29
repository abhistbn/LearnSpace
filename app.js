require("dotenv").config();

const express = require("express");
const multer = require("multer");
const path = require("path");
const session = require("express-session");
const mysql = require("mysql2");
const fs = require("fs");
const AWS = require("aws-sdk");

const app = express();

// ===================== CONFIG DASAR =====================
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "src", "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===================== SESSION =====================
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

// ===================== DATABASE =====================
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

db.connect((err) => {
  if (err) {
    console.error("❌ Koneksi database gagal:", err);
    return;
  }
  console.log("✅ Terhubung ke database MySQL!");
});

// ===================== MULTER (UPLOAD FILE) =====================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "uploads"));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix =
      Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

const upload = multer({ storage: storage });

// ===================== MIDDLEWARE CEK ADMIN =====================
function checkAdmin(req, res, next) {
  if (req.session.isAdmin) return next();
  return res.redirect("/login");
}

// ===================== HALAMAN PUBLIK =====================

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/daftar", (req, res) => {
  res.render("form");
});

app.get("/tentang", (req, res) => {
  res.render("tentang");
});

app.get("/sukses", (req, res) => {
  res.render("sukses");
});

// ===================== CONFIG AWS S3 TANPA ACCESS KEY =====================
AWS.config.update({
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();


// ===================== FORM PENDAFTARAN =====================
app.post("/daftar", upload.single("bukti"), async (req, res) => {
  try {
    const file = req.file;
    let fileURL = null;
    let fileOriginalName = null;
    let filePathInBucket = null;

    // Upload ke S3
    if (file) {
      const fileContent = fs.readFileSync(file.path);

    const uploadParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `uploads/${Date.now()}_${file.originalname}`,
      Body: fileContent,
      ContentType: file.mimetype,
    };


      const s3Result = await s3.upload(uploadParams).promise();

      fileURL = s3Result.Location;
      fileOriginalName = file.originalname;
      filePathInBucket = uploadParams.Key;

      fs.unlinkSync(file.path);
    }

    // Simpan database
    const query = `
      INSERT INTO peserta 
      (nama, email, kelas, buktiPath, buktiOriginalName, buktiURL, status) 
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `;

    await db.query(query, [
      req.body.nama,
      req.body.email,
      req.body.kelas,
      filePathInBucket,
      fileOriginalName,
      fileURL
    ]);

    return res.json({
      success: true,
      message: "Pendaftaran berhasil!",
      fileURL: fileURL
    });

  } catch (err) {
    console.error("❌ Error /daftar:", err);

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mendaftar"
    });
  }
});


// ===================== LOGIN ADMIN =====================
app.get("/login", (req, res) => {
  res.render("loginAdmin");
});

app.post("/login", (req, res) => {
  const { nama, password } = req.body;

  const sql = "SELECT * FROM admin WHERE nama = ? LIMIT 1";

  db.query(sql, [nama], (err, results) => {
    if (err) {
      console.error("DB ERROR:", err);
      return res.json({ success: false });
    }

    if (results.length === 0) return res.json({ success: false });

    const admin = results[0];

    if (admin.password !== password)
      return res.json({ success: false });

    req.session.isAdmin = true;
    return res.json({ success: true });
  });
});

// ===================== DASHBOARD ADMIN =====================
app.get("/admin", checkAdmin, (req, res) => {
  const sql = "SELECT * FROM peserta ORDER BY id DESC";

  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Error mengambil data:", err);
      return res.status(500).send("Database error");
    }

    const stats = {
      total: results.length,
      accepted: results.filter((p) => p.status === "accepted").length,
      rejected: results.filter((p) => p.status === "rejected").length,
    };

    res.render("admin", {
      registrations: results,
      stats: stats,
    });
  });
});

// Update Status
app.post("/admin/update-status", checkAdmin, (req, res) => {
  const { id, status } = req.body;

  const sql = "UPDATE peserta SET status = ? WHERE id = ?";

  db.query(sql, [status, id], (err, result) => {
    if (err) {
      console.error("❌ Error update status:", err);
      return res.status(500).json({
        success: false,
        message: "Gagal mengupdate status",
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Peserta tidak ditemukan",
      });
    }

    db.query("SELECT * FROM peserta", (err, results) => {
      const stats = {
        total: results.length,
        accepted: results.filter((p) => p.status === "accepted").length,
        rejected: results.filter((p) => p.status === "rejected").length,
      };

      res.json({
        success: true,
        message: `Status berhasil diubah menjadi ${status}`,
        stats: stats,
      });
    });
  });
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login");
});

// ===================== PORT =====================
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server berjalan di http://0.0.0.0:${PORT}`);
});