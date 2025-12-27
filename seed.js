const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

async function seed() {
  const db = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "", // empty if your local root has no password
    database: "knockster_security",
  });

  console.log("Connected to DB.");

  const hashed = await bcrypt.hash("Apple@123", 10);
  const id = crypto.randomUUID();

  const sql = `
    INSERT INTO super_admin (id, email, password_hash, two_factor_enabled)
    VALUES (?, ?, ?, ?);
  `;

  await db.execute(sql, [id, "apple@gmail.com", hashed, 0]);

  console.log("✔ SuperAdmin inserted");
  console.log("  Username: apple@gmail.com");
  console.log("  Password: Apple@123 (hashed)");
  console.log("  Hash:", hashed);

  await db.end();
}

seed().catch(console.error);
