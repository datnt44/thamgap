const result = await pool.query(
  `
  SELECT 
    "STT",
    "Họ và tên",
    "Ngày sinh",
    "Nơi TT",
    "TrangThai"
  FROM public."_A2"
  WHERE
    "TrangThai" = 'Đang trong NTG'
    AND (
      ($1 <> '' AND REPLACE(TRIM("Số CCCD"::text), ' ', '') = $1)
      OR
      ($2 <> '' AND LOWER(TRIM("Họ và tên"::text)) LIKE LOWER('%' || $2 || '%'))
    )
  ORDER BY "Họ và tên"
  LIMIT 5
  `,
  [cccd, hoten]
);
