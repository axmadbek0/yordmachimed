const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// PostgreSQL ulanish sozlamalari
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'davvi',
  password: '', // Agar o'rnatishda parol qo'ymagan bo'lsangiz bo'sh qoladi
  port: 5432,
});

// 1. GET ALL - Barcha dorilar ro'yxatini olish
app.get('/api/medicines', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM medicines ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Serverda xatolik yuz berdi" });
  }
});

// 2. GET SINGLE - ID bo'yicha bitta dorini olish
app.get('/api/medicines/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM medicines WHERE id = \$1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Dori topilmadi" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Serverda xatolik yuz berdi" });
  }
});

// 3. POST - Yangi dori qo'shish
app.post('/api/medicines', async (req, res) => {
  const { name, price, description } = req.body;
  if (!name || !price) {
    return res.status(400).json({ error: "Dori nomi va narxi majburiy!" });
  }
  try {
    const result = await pool.query(
      'INSERT INTO medicines (name, price, description) VALUES (\$1, \$2, \$3) RETURNING *',
      [name, price, description]
    );
    res.status(201).json({ message: "Dori muvaffaqiyatli qo'shildi", medicine: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ma'lumot qo'shishda xatolik" });
  }
});

// 4. PUT - Dorini ID bo'yicha yangilash
app.put('/api/medicines/:id', async (req, res) => {
  const { id } = req.params;
  const { name, price, description } = req.body;
  try {
    const result = await pool.query(
      'UPDATE medicines SET name = \$1, price = \$2, description = \$3 WHERE id = \$4 RETURNING *',
      [name, price, description, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Yangilash uchun bunday dori topilmadi" });
    }
    res.json({ message: "Dori ma'lumotlari yangilandi", medicine: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Serverda xatolik yuz berdi" });
  }
});

// 5. DELETE - Dorini o'chirish
app.delete('/api/medicines/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM medicines WHERE id = \$1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "O'chirish uchun bunday dori topilmadi" });
    }
    res.json({ message: "Dori bazadan o'chirildi", deletedMedicine: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Serverda xatolik yuz berdi" });
  }
});

// Serverni ishga tushirish
const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Davvi API Server http://localhost:${PORT} portida ishlamoqda`);
});
