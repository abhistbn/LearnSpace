require("dotenv").config();
const mysql = require("mysql2/promise");

// Config Koneksi Khusus Migrasi
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
};

async function migrate() {
  let conn;
  try {
    console.log("⏳ Menghubungkan ke MySQL...");
    conn = await mysql.createConnection(dbConfig);
    console.log("✅ Terhubung!");

    // 1. Buat Tabel Admin
    console.log("Creating table: admin...");
    await conn.query(`
      CREATE TABLE IF NOT EXISTS admin (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama VARCHAR(100) NOT NULL,
        password VARCHAR(255) NOT NULL
      ) ENGINE=InnoDB;
    `);

    // 2. Buat Tabel Peserta
    console.log("Creating table: peserta...");
    await conn.query(`
      CREATE TABLE IF NOT EXISTS peserta (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        kelas VARCHAR(50) NOT NULL,
        buktiPath TEXT,
        buktiOriginalName TEXT,
        buktiURL TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    // 3. Insert Admin Default
    const [rows] = await conn.query("SELECT * FROM admin WHERE nama = ?", ['admin']);
    if (rows.length === 0) {
      await conn.query("INSERT INTO admin (nama, password) VALUES (?, ?)", ['admin', 'admin123']);
      console.log("✅ Admin default dibuat: admin / admin123");
    } else {
      console.log("ℹ️ Admin sudah ada, skip insert.");
    }

    console.log("🎉 Migrasi Selesai!");
    process.exit(0);

  } catch (err) {
    console.error("❌ Migrasi Gagal:", err.message);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

migrate();