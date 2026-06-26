const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 10000,
  query_timeout: 10000
});

app.get("/", (req, res) => {
  res.json({
    ok: true,
    service: "thamgap-api"
  });
});

app.get("/api/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS time");
    res.json({
      ok: true,
      db_time: result.rows[0].time
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message || String(error)
    });
  }
});

app.get("/api/a2/search", async (req, res) => {
  try {
    const cccd = (req.query.cccd || "").replace(/\s/g, "").trim();
    const hoten = (req.query.hoten || "").trim();

    if (!cccd && !hoten) {
      return res.status(400).json({
        ok: false,
        error: "Vui lòng nhập CCCD hoặc Họ và tên"
      });
    }

    const result = await pool.query(
      `
      SELECT 
        "STT",
        "Họ và tên",
        "Ngày sinh",
        "Nơi TT"
      FROM public."_A2"
      WHERE
        ($1 <> '' AND REPLACE(TRIM("Số CCCD"::text), ' ', '') = $1)
        OR
        ($2 <> '' AND LOWER(TRIM("Họ và tên"::text)) LIKE LOWER('%' || $2 || '%'))
      ORDER BY "Họ và tên"
      LIMIT 5
      `,
      [cccd, hoten]
    );

    if (result.rowCount === 0) {
      return res.json({
        ok: false,
        error: "Không tìm thấy thông tin"
      });
    }

    res.json({
      ok: true,
      data: result.rows
    });

  } catch (error) {
    console.error("A2 SEARCH ERROR:", error);
    res.status(500).json({
      ok: false,
      error: error.message || String(error)
    });
  }
});

app.post("/api/thamgap", async (req, res) => {
  try {
    const d = req.body;

    if (!d.STT) {
      return res.status(400).json({
        ok: false,
        error: "Bạn cần chọn người được thăm gặp trước"
      });
    }

    const result = await pool.query(
      `
      INSERT INTO public.thamgap (
        "STT",
        "Ten1",
        "NamSinh1",
        "CCCD1",
        "NgayCap1",
        "NoiCap1",
        "HKTT",
        "QuanHe1",
        "PhoneNumber",
        "Ten2",
        "CCCD2",
        "QuanHe2",
        "Ten3",
        "CCCD3",
        "QuanHe3",
        "NgayDeXuat",
        "NgayThamGap",
        "GioThamGap",
        "TrangThai"
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9,
        $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19
      )
      RETURNING "ID"
      `,
      [
        d.STT,
        d.Ten1 || null,
        d.NamSinh1 || null,
        d.CCCD1 || null,
        d.NgayCap1 || null,
        d.NoiCap1 || null,
        d.HKTT || null,
        d.QuanHe1 || null,
        d.PhoneNumber || null,
        d.Ten2 || null,
        d.CCCD2 || null,
        d.QuanHe2 || null,
        d.Ten3 || null,
        d.CCCD3 || null,
        d.QuanHe3 || null,
        d.NgayDeXuat || new Date().toISOString().slice(0, 10),
        d.NgayThamGap || null,
        d.GioThamGap || null,
        d.TrangThai || "Chờ duyệt"
      ]
    );

    res.json({
      ok: true,
      message: "Đăng ký thăm gặp thành công",
      id: result.rows[0].ID
    });

  } catch (error) {
    console.error("THAMGAP INSERT ERROR:", error);
    res.status(500).json({
      ok: false,
      error: error.message || String(error)
    });
  }
});

app.get("/api/thamgap", (req, res) => {
  res.status(405).json({
    ok: false,
    error: "Endpoint này chỉ dùng POST để ghi dữ liệu"
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
