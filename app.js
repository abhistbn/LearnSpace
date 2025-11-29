require("dotenv").config();

const express = require("express");
const path = require("path");
const session = require("express-session");
const mysql = require("mysql2");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const app = express();

// ===================== CONFIG DASAR =====================
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "src", "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload());

// ===================== SESSION =====================
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

// ===================== DATABASE =====================
const db = mysql
  .createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
  })
  .promise();

// ===================== S3 CLIENT =====================
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

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

// ===================== UPLOAD FILE (DRAG & DROP / FORM) =====================
app.post("/upload", async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ success: false, message: "Tidak ada file" });
    }

    const file = req.files.file;

    // Sanitize filename
    const safeName = file.name.replace(/[^\w.-]/g, "_");
    const key = `uploads/${Date.now()}_${safeName}`;

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: file.data,
      ContentType: file.mimetype,
    };

    await s3.send(new PutObjectCommand(params));

    return res.json({
      success: true,
      fileURL: `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${key}`,
      fileKey: key,
      originalName: file.name,
    });
  } catch (err) {
    console.error("❌ Upload Error:", err);
    return res.status(500).json({ success: false, message: "Gagal upload ke S3" });
  }
});

// ===================== FORM PENDAFTARAN =====================
app.post("/daftar", async (req, res) => {
  try {
    const { nama, email, kelas, fileURL, fileName, fileKey } = req.body;

    const sql = `
      INSERT INTO peserta 
      (nama, email, kelas, buktiPath, buktiOriginalName, buktiURL, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `;

    await db.query(sql, [
      nama,
      email,
      kelas,
      fileKey,
      fileName,
      fileURL,
    ]);

    return res.json({
      success: true,
      message: "Pendaftaran berhasil!",
      fileURL,
    });
  } catch (err) {
    console.error("❌ Error /daftar:", err);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mendaftar",
    });
  }
});

// ===================== LOGIN ADMIN =====================
app.get("/login", (req, res) => {
  res.render("loginAdmin");
});

app.post("/login", async (req, res) => {
  try {
    const { nama, password } = req.body;

    const sql = "SELECT * FROM admin WHERE nama = ? LIMIT 1";
    const [results] = await db.query(sql, [nama]);

    if (results.length === 0) return res.json({ success: false });

    const admin = results[0];

    if (admin.password !== password)
      return res.json({ success: false });

    req.session.isAdmin = true;
    return res.json({ success: true });
  } catch (err) {
    console.error("DB ERROR:", err);
    return res.json({ success: false });
  }
});

// ===================== DASHBOARD ADMIN =====================
function checkAdmin(req, res, next) {
  if (req.session.isAdmin) return next();
  return res.redirect("/login");
}

app.get("/admin", checkAdmin, async (req, res) => {
  try {
    const sql = "SELECT * FROM peserta ORDER BY id DESC";
    const [results] = await db.query(sql);

    const stats = {
      total: results.length,
      accepted: results.filter((p) => p.status === "accepted").length,
      rejected: results.filter((p) => p.status === "rejected").length,
    };

    res.render("admin", {
      registrations: results,
      stats: stats,
    });
  } catch (err) {
    console.error("❌ Error mengambil data:", err);
    res.status(500).send("Database error");
  }
});

// ===================== UPDATE STATUS ADMIN =====================
app.post("/admin/update-status", checkAdmin, async (req, res) => {
  try {
    const { id, status } = req.body;

    const sql = "UPDATE peserta SET status = ? WHERE id = ?";
    const [result] = await db.query(sql, [status, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Peserta tidak ditemukan",
      });
    }

    const [results] = await db.query("SELECT * FROM peserta");

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
  } catch (err) {
    console.error("❌ Error update status:", err);
    res.status(500).json({
      success: false,
      message: "Gagal mengupdate status",
    });
  }
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
