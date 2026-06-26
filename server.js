const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.get("/", (req, res) => {
  res.json({ ok: true, service: "thamgap-api" });
});

app.get("/api/a2/search", async (req, res) => {
  try {
    const stt = (req.query.stt || "").trim();
    const cccd = (req.query.cccd || "").replace(/\s/g, "").trim();

    if (!stt && !cccd) {
      return res.status(400).json({
        ok: false,
        error: "Vui lòng nhập STT hoặc CCCD"
      });
    }

    const result = await pool.query(
      `
      SELECT 
        "STT",
        "Họ và tên",
        "Giới tính",
        "Ngày sinh",
        "Ngày vào NTG",
        "Số CCCD",
        "Ngày cấp",
        "Nơi cấp",
        "Nơi TT"
      FROM public."_A2"
      WHERE
        ($1 <> '' AND TRIM("STT"::text) = $1)
        OR
        ($2 <> '' AND REPLACE(TRIM("Số CCCD"::text), ' ', '') = $2)
      LIMIT 1
      `,
      [stt, cccd]
    );

    if (result.rowCount === 0) {
      return res.json({
        ok: false,
        error: "Không tìm thấy thông tin"
      });
    }

    res.json({
      ok: true,
      data: result.rows[0]
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
        d.Ten1,
        d.NamSinh1 || null,
        d.CCCD1,
        d.NgayCap1 || null,
        d.NoiCap1,
        d.HKTT,
        d.QuanHe1,
        d.PhoneNumber,
        d.Ten2,
        d.CCCD2,
        d.QuanHe2,
        d.Ten3,
        d.CCCD3,
        d.QuanHe3,
        d.NgayDeXuat || null,
        d.NgayThamGap || null,
        d.GioThamGap || null,
        d.TrangThai || "Chờ duyệt"
      ]
    );

    res.json({
      ok: true,
      message: "Đã gửi đăng ký thăm gặp",
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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
