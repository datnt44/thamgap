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
