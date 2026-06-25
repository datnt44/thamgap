const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

app.get("/", (req, res) => {
  res.json({
    ok: true,
    service: "api-postgresql",
    endpoints: {
      read_A2: "GET /api/a2",
      write_thamgap: "POST /api/thamgap"
    }
  });
});

// CHỈ ĐỌC bảng _A2
app.get("/api/a2", async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 5000;

    const result = await pool.query(
      `
      SELECT *
      FROM public."_A2"
      ORDER BY "Ngày vào NTG" DESC NULLS LAST
      LIMIT $1
      `,
      [limit]
    );

    res.json({
      ok: true,
      table: "_A2",
      count: result.rowCount,
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      table: "_A2",
      error: error.message
    });
  }
});

// CHỈ GHI bảng thamgap
app.post("/api/thamgap", async (req, res) => {
  try {
    const data = req.body;

    const result = await pool.query(
      `
      INSERT INTO public."thamgap" (
        "STT",
        "Họ và tên",
        "Ngày thăm gặp",
        "Tên người thăm",
        "Quan hệ",
        "Số CCCD",
        "Ghi chú"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
      `,
      [
        data.STT,
        data.ho_ten,
        data.ngay_tham_gap,
        data.ten_nguoi_tham,
        data.quan_he,
        data.so_cccd,
        data.ghi_chu
      ]
    );

    res.json({
      ok: true,
      message: "Đã ghi dữ liệu vào bảng thamgap",
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      table: "thamgap",
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
