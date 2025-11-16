const express = require("express");
const multer = require("multer");
const path = require("path");

const app = express();

app.use(express.static(path.join(__dirname, "public")));

const upload = multer({ dest: path.join(__dirname, "uploads") });

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "src", "views"));

app.use(express.urlencoded({ extended: true }));

// Halaman Home 
app.get("/", (req, res) => {
  res.render("home");
});

// Halaman Form
app.get("/daftar", (req, res) => {
  res.render("form");
});

// Halaman Tentang Kami
app.get("/tentang", (req, res) => {
  res.render("tentang");
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

app.listen(3000, () => {
  console.log("Server berjalan di http://localhost:3000");
});