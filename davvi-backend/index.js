const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Status tekshiruvi
app.get('/', (req, res) => {
  res.json({ message: "API server muvaffaqiyatli ishlayapti!" });
});

// Dinamik GET API
app.get('/api/:model', async (req, res) => {
  const { model } = req.params;
  try {
    if (!prisma[model]) {
      return res.status(404).json({ error: `'${model}' degan model topilmadi.` });
    }
    const data = await prisma[model].findMany();
    res.json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dinamik POST API
app.post('/api/:model', async (req, res) => {
  const { model } = req.params;
  try {
    if (!prisma[model]) {
      return res.status(404).json({ error: `'${model}' degan model topilmadi.` });
    }
    const newData = await prisma[model].create({
      data: req.body
    });
    res.status(201).json({ success: true, data: newData });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 API Server ishga tushdi: http://localhost:${PORT}`);
});

