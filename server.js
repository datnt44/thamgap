app.get("/api/a2/search", async (req, res) => {
  try {
    const stt = (req.query.stt || "").trim();
    const cccd = (req.query.cccd || "").trim();

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
        "Ngày sinh",
        "Giới tính",
        "Ngày vào NTG",
        "Số CCCD"
      FROM public."_A2"
      WHERE
        ($1 <> '' AND TRIM("STT"::text) = $1)
        OR
        ($2 <> '' AND REPLACE(TRIM("Số CCCD"::text), ' ', '') = REPLACE($2, ' ', ''))
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
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});
