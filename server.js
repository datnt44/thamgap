const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// =============================
// KẾT NỐI POSTGRESQL
// =============================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 10000,
  query_timeout: 10000
});

// =============================
// TRANG CHỦ TEST API
// =============================
app.get("/", (req, res) => {
  res.json({
    ok: true,
    service: "thamgap-api",
    endpoints: {
      db_test: "/api/db-test",
      search_a2_by_stt: "/api/a2/search?stt=1",
      search_a2_by_cccd: "/api/a2/search?cccd=001234567890",
      post_thamgap: "POST /api/thamgap"
    }
  });
});

// =============================
// TEST DATABASE
// =============================
app.get("/api/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS time");

    res.json({
      ok: true,
      message: "Kết nối database thành công",
      db_time: result.rows[0].time
    });
  } catch (error) {
    console.error("DB TEST ERROR:", error);

    res.status(500).json({
      ok: false,
      error: error.message || String(error),
      detail: error.errors ? error.errors.map(e => e.message) : null
    });
  }
});

// =============================
// TÌM THÔNG TIN TRONG BẢNG _A2
// CHỈ TÌM 1 NGƯỜI THEO STT HOẶC CCCD
// =============================
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
      error: error.message || String(error),
      detail: error.errors ? error.errors.map(e => e.message) : null
    });
  }
});

// =============================
// GHI DỮ LIỆU VÀO BẢNG thamgap
// CHỈ POST, KHÔNG ĐỌC DANH SÁCH
// =============================
app.post("/api/thamgap", async (req, res) => {
  try {
    const d = req.body;

    if (!d.STT) {
      return res.status(400).json({
        ok: false,
        error: "Thiếu STT"
      });
    }

    if (!d.Ten1 || !d.CCCD1 || !d.QuanHe1 || !d.PhoneNumber) {
      return res.status(400).json({
        ok: false,
        error: "Thiếu thông tin người thăm gặp số 1"
      });
    }

    if (!d.NgayThamGap || !d.GioThamGap) {
      return res.status(400).json({
        ok: false,
        error: "Thiếu ngày hoặc giờ thăm gặp"
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
        d.Ten1,
        d.NamSinh1 || null,
        d.CCCD1,
        d.NgayCap1 || null,
        d.NoiCap1 || null,
        d.HKTT || null,
        d.QuanHe1,
        d.PhoneNumber,

        d.Ten2 || null,
        d.CCCD2 || null,
        d.QuanHe2 || null,

        d.Ten3 || null,
        d.CCCD3 || null,
        d.QuanHe3 || null,

        d.NgayDeXuat || new Date().toISOString().slice(0, 10),
        d.NgayThamGap,
        d.GioThamGap,
        d.TrangThai || "Chờ duyệt"
      ]
    );

    res.json({
      ok: true,
      message: "Đã gửi đăng ký thăm gặp thành công",
      id: result.rows[0].ID
    });

  } catch (error) {
    console.error("THAMGAP INSERT ERROR:", error);

    res.status(500).json({
      ok: false,
      error: error.message || String(error),
      detail: error.errors ? error.errors.map(e => e.message) : null
    });
  }
});

// =============================
// CHẶN GET /api/thamgap
// =============================
app.get("/api/thamgap", (req, res) => {
  res.status(405).json({
    ok: false,
    error: "Endpoint này chỉ dùng POST để ghi dữ liệu"
  });
});

// =============================
// START SERVER
// =============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
