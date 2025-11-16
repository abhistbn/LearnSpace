const express = require("express");
const multer = require("multer");
const path = require("path");
const session = require("express-session");

const app = express();

// ==== KONFIGURASI DASAR ====
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "src", "views"));
app.use(express.static(path.join(__dirname, "public")));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==== SESSION UNTUK LOGIN ADMIN ====
app.use(
  session({
    secret: "adminsecret123",
    resave: false,
    saveUninitialized: true,
  })
);

// ==== UPLOAD FILE ====
const upload = multer({ dest: path.join(__dirname, "uploads") });

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

// FORM PENDAFTARAN
app.get("/daftar", (req, res) => {
  res.render("form");
});

// TENTANG
app.get("/tentang", (req, res) => {
  res.render("tentang");
});

// SUBMIT FORM PENDAFTARAN
app.post("/daftar", upload.single("bukti"), (req, res) => {
  const { nama, email, kelas } = req.body;

  console.log("===== DATA PESERTA =====");
  console.log(req.body);
  console.log("===== FILE UPLOAD =====");
  console.log(req.file);

  res.send(`
    <h2>Pendaftaran berhasil!</h3>
    <p>Nama: ${nama}</p>
    <p>Email: ${email}</p>
    <p>Kelas: ${kelas}</p>
    <a href="/">Kembali ke Home</a>
  `);
});

// ===================== LOGIN ADMIN =====================

// Halaman Login Admin
app.get("/login", (req, res) => {
  res.render("loginAdmin");
});

// Proses Login Admin
app.post("/login", (req, res) => {
  const { nama, password } = req.body;

  // ==== AKUN ADMIN ====
  const ADMIN_USERNAME = "admin";
  const ADMIN_PASSWORD = "12345";

  if (nama === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    req.session.isAdmin = true;

    return res.json({ success: true });
  }

  return res.json({ success: false });
});

// ===================== DASHBOARD ADMIN =====================

// Halaman Dashboard Admin
app.get("/admin", checkAdmin, (req, res) => {
    // nantinya data peserta diambil dari DB
    const pesertaDummy = [];

    res.render("admin", { peserta: pesertaDummy });
});

// ===================== PORT =====================
app.listen(3000, () => {
  console.log("Server berjalan di http://localhost:3000");
});
