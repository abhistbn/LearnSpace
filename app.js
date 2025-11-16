const express = require("express");
const multer = require("multer");
const path = require("path");

const app = express();

// Folder public
app.use(express.static(path.join(__dirname, "public")));

// Folder upload gambar bukti
const upload = multer({ dest: path.join(__dirname, "uploads") });

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "src", "views"));

app.use(express.urlencoded({ extended: true }));

// Home
app.get("/", (req, res) => {
  res.render("home");
});

// Form daftar
app.get("/daftar", (req, res) => {
  res.render("form");
});

// Tentang
app.get("/tentang", (req, res) => {
  res.render("tentang");
});

// Success Page
app.get("/sukses", (req, res) => {
  res.render("sukses");
});

// Submit Form
app.post("/daftar", upload.single("bukti"), (req, res) => {
  const { nama, email, kelas } = req.body;
  const fileData = req.file;

  console.log("===== DATA PESERTA =====");
  console.log("Nama:", nama);
  console.log("Email:", email);
  console.log("Kelas:", kelas);
  console.log("===== FILE UPLOAD =====");
  console.log(fileData);

  // Redirect ke halaman sukses
  res.redirect('/sukses');
});

app.listen(3000, () => {
  console.log("Server berjalan di http://localhost:3000");
});
