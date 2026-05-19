export interface OccupationItem {
  label: string
  value: string
  category: string
}

export const WORKER_OCCUPATIONS: OccupationItem[] = [
  // ── Gia đình & Chăm sóc ────────────────────────────────────────────────────
  { label: 'Giữ trẻ / Babysitter', value: 'giu-tre', category: 'Gia đình & Chăm sóc' },
  { label: 'Chăm sóc người già', value: 'cham-soc-nguoi-gia', category: 'Gia đình & Chăm sóc' },
  { label: 'Bảo mẫu / Osin', value: 'bao-mau', category: 'Gia đình & Chăm sóc' },
  { label: 'Giúp việc nhà', value: 'giup-viec-nha', category: 'Gia đình & Chăm sóc' },
  { label: 'Nấu ăn gia đình', value: 'nau-an-gia-dinh', category: 'Gia đình & Chăm sóc' },
  { label: 'Tài xế riêng', value: 'tai-xe-rieng', category: 'Gia đình & Chăm sóc' },
  { label: 'Chăm sóc thú cưng', value: 'cham-soc-thu-cung', category: 'Gia đình & Chăm sóc' },

  // ── Gia sư & Giáo dục ──────────────────────────────────────────────────────
  { label: 'Gia sư các môn', value: 'gia-su-cac-mon', category: 'Gia sư & Giáo dục' },
  { label: 'Dạy ngoại ngữ', value: 'day-ngoai-ngu', category: 'Gia sư & Giáo dục' },
  { label: 'Dạy nhạc / Nhạc cụ', value: 'day-nhac', category: 'Gia sư & Giáo dục' },
  { label: 'Dạy thể dục / Thể thao', value: 'day-the-duc', category: 'Gia sư & Giáo dục' },
  { label: 'Huấn luyện viên cá nhân (PT)', value: 'huan-luyen-vien-ca-nhan', category: 'Gia sư & Giáo dục' },
  { label: 'Dạy vẽ / Mỹ thuật', value: 'day-ve-my-thuat', category: 'Gia sư & Giáo dục' },
  { label: 'Dạy nấu ăn', value: 'day-nau-an', category: 'Gia sư & Giáo dục' },

  // ── Sự kiện & Giải trí ─────────────────────────────────────────────────────
  { label: 'Phụ lễ cưới', value: 'phu-le-cuoi', category: 'Sự kiện & Giải trí' },
  { label: 'Bưng mâm quả / Đoàn rước dâu', value: 'bung-mam-qua', category: 'Sự kiện & Giải trí' },
  { label: 'MC / Dẫn chương trình', value: 'mc-dan-chuong-trinh', category: 'Sự kiện & Giải trí' },
  { label: 'Nhân viên phục vụ tiệc', value: 'phuc-vu-tiec', category: 'Sự kiện & Giải trí' },
  { label: 'Trang trí sự kiện / Tiệc cưới', value: 'trang-tri-su-kien', category: 'Sự kiện & Giải trí' },
  { label: 'Ca sĩ / Nhạc công biểu diễn', value: 'ca-si-nhac-cong', category: 'Sự kiện & Giải trí' },
  { label: 'DJ / Sound Engineer', value: 'dj-sound', category: 'Sự kiện & Giải trí' },
  { label: 'Người mẫu / Diễn viên', value: 'nguoi-mau-dien-vien', category: 'Sự kiện & Giải trí' },
  { label: 'Trình diễn ảo thuật / Xiếc', value: 'anh-thuat-xiec', category: 'Sự kiện & Giải trí' },
  { label: 'Cosplay / Nhân vật hoạt hình', value: 'cosplay', category: 'Sự kiện & Giải trí' },

  // ── Nhiếp ảnh & Truyền thông ───────────────────────────────────────────────
  { label: 'Chụp ảnh / Nhiếp ảnh gia', value: 'chup-anh', category: 'Nhiếp ảnh & Truyền thông' },
  { label: 'Quay phim / Dựng phim', value: 'quay-phim', category: 'Nhiếp ảnh & Truyền thông' },
  { label: 'Thiết kế đồ họa', value: 'thiet-ke-do-hoa', category: 'Nhiếp ảnh & Truyền thông' },
  { label: 'Lập trình viên / Kỹ thuật IT', value: 'lap-trinh-vien', category: 'Nhiếp ảnh & Truyền thông' },
  { label: 'Marketing / Social Media', value: 'marketing-social', category: 'Nhiếp ảnh & Truyền thông' },
  { label: 'Viết nội dung / Content Writer', value: 'viet-noi-dung', category: 'Nhiếp ảnh & Truyền thông' },
  { label: 'Biên tập video / Editor', value: 'bien-tap-video', category: 'Nhiếp ảnh & Truyền thông' },
  { label: 'Livestream / Streamer', value: 'livestream', category: 'Nhiếp ảnh & Truyền thông' },

  // ── Làm đẹp & Sức khỏe ────────────────────────────────────────────────────
  { label: 'Cắt tóc / Làm tóc tại nhà', value: 'cat-toc-tai-nha', category: 'Làm đẹp & Sức khỏe' },
  { label: 'Trang điểm / Makeup Artist', value: 'trang-diem', category: 'Làm đẹp & Sức khỏe' },
  { label: 'Massage / Spa tại nhà', value: 'massage-spa', category: 'Làm đẹp & Sức khỏe' },
  { label: 'Nail / Làm móng tay chân', value: 'nail', category: 'Làm đẹp & Sức khỏe' },
  { label: 'Phun xăm thẩm mỹ', value: 'phun-xam', category: 'Làm đẹp & Sức khỏe' },
  { label: 'Y tá / Điều dưỡng tại nhà', value: 'y-ta-dieu-duong', category: 'Làm đẹp & Sức khỏe' },
  { label: 'Yoga / Thiền tại nhà', value: 'yoga-thien', category: 'Làm đẹp & Sức khỏe' },

  // ── Ăn uống & Phục vụ ─────────────────────────────────────────────────────
  { label: 'Đầu bếp / Nấu ăn thuê', value: 'dau-bep-nau-an', category: 'Ăn uống & Phục vụ' },
  { label: 'Bartender / Pha chế', value: 'bartender', category: 'Ăn uống & Phục vụ' },
  { label: 'Phục vụ bàn / Nhà hàng', value: 'phuc-vu-ban', category: 'Ăn uống & Phục vụ' },
  { label: 'Làm bánh / Pastry Chef', value: 'lam-banh', category: 'Ăn uống & Phục vụ' },
  { label: 'Pha cà phê / Barista', value: 'barista', category: 'Ăn uống & Phục vụ' },

  // ── Xây dựng & Kỹ thuật ────────────────────────────────────────────────────
  { label: 'Thợ điện', value: 'tho-dien', category: 'Xây dựng & Kỹ thuật' },
  { label: 'Thợ nước / Điện nước', value: 'tho-nuoc', category: 'Xây dựng & Kỹ thuật' },
  { label: 'Thợ xây / Hồ', value: 'tho-xay-ho', category: 'Xây dựng & Kỹ thuật' },
  { label: 'Thợ sơn', value: 'tho-son', category: 'Xây dựng & Kỹ thuật' },
  { label: 'Thợ mộc / Nội thất', value: 'tho-moc', category: 'Xây dựng & Kỹ thuật' },
  { label: 'Thợ hàn', value: 'tho-han', category: 'Xây dựng & Kỹ thuật' },
  { label: 'Thợ lắp điều hòa / Điện lạnh', value: 'tho-dien-lanh', category: 'Xây dựng & Kỹ thuật' },
  { label: 'Thợ chống thấm / Lợp mái', value: 'chong-tham-lop-mai', category: 'Xây dựng & Kỹ thuật' },
  { label: 'Thợ ốp lát gạch', value: 'op-lat-gach', category: 'Xây dựng & Kỹ thuật' },
  { label: 'Thợ trần thạch cao', value: 'tran-thach-cao', category: 'Xây dựng & Kỹ thuật' },
  { label: 'Thợ kính / Nhôm', value: 'tho-kinh-nhom', category: 'Xây dựng & Kỹ thuật' },
  { label: 'Thợ cơ khí / Tiện', value: 'tho-co-khi', category: 'Xây dựng & Kỹ thuật' },

  // ── Sửa chữa thiết bị ──────────────────────────────────────────────────────
  { label: 'Sửa máy giặt / Tủ lạnh', value: 'sua-may-giat-tu-lanh', category: 'Sửa chữa thiết bị' },
  { label: 'Sửa máy lạnh / Điều hòa', value: 'sua-may-lanh', category: 'Sửa chữa thiết bị' },
  { label: 'Sửa bếp gas / Bình nóng lạnh', value: 'sua-bep-gas', category: 'Sửa chữa thiết bị' },
  { label: 'Sửa xe máy / Ô tô', value: 'sua-xe', category: 'Sửa chữa thiết bị' },
  { label: 'Sửa máy tính / Điện thoại', value: 'sua-may-tinh', category: 'Sửa chữa thiết bị' },
  { label: 'Sửa đồ điện tử / Điện gia dụng', value: 'sua-do-dien-tu', category: 'Sửa chữa thiết bị' },
  { label: 'Thợ khóa', value: 'tho-khoa', category: 'Sửa chữa thiết bị' },

  // ── Dọn dẹp & Vệ sinh ─────────────────────────────────────────────────────
  { label: 'Dọn dẹp nhà cửa', value: 'don-dep-nha', category: 'Dọn dẹp & Vệ sinh' },
  { label: 'Vệ sinh công nghiệp', value: 've-sinh-cong-nghiep', category: 'Dọn dẹp & Vệ sinh' },
  { label: 'Giặt sofa / Thảm / Rèm', value: 'giat-sofa-tham', category: 'Dọn dẹp & Vệ sinh' },
  { label: 'Vệ sinh máy lạnh', value: 've-sinh-may-lanh', category: 'Dọn dẹp & Vệ sinh' },
  { label: 'Tổng vệ sinh sau xây dựng', value: 've-sinh-sau-xay-dung', category: 'Dọn dẹp & Vệ sinh' },
  { label: 'Diệt côn trùng / Khử khuẩn', value: 'diet-con-trung', category: 'Dọn dẹp & Vệ sinh' },

  // ── Vận chuyển & Giao hàng ─────────────────────────────────────────────────
  { label: 'Giao hàng / Shipper', value: 'giao-hang', category: 'Vận chuyển & Giao hàng' },
  { label: 'Vận chuyển đồ / Dọn nhà', value: 'van-chuyen-don-nha', category: 'Vận chuyển & Giao hàng' },
  { label: 'Xe ôm / Đặt xe công nghệ', value: 'xe-om', category: 'Vận chuyển & Giao hàng' },
  { label: 'Bốc xếp hàng hóa', value: 'boc-xep-hang-hoa', category: 'Vận chuyển & Giao hàng' },
  { label: 'Thuê xe / Lái xe theo giờ', value: 'thue-xe-lai-theo-gio', category: 'Vận chuyển & Giao hàng' },

  // ── Nông nghiệp & Ngoại thất ───────────────────────────────────────────────
  { label: 'Làm vườn / Cắt cỏ', value: 'lam-vuon-cat-co', category: 'Nông nghiệp & Ngoại thất' },
  { label: 'Trồng cây / Thiết kế cảnh quan', value: 'trong-cay-canh-quan', category: 'Nông nghiệp & Ngoại thất' },
  { label: 'Chăm sóc bể cá / Tiểu cảnh', value: 'be-ca-tieu-canh', category: 'Nông nghiệp & Ngoại thất' },

  // ── Bảo vệ & An ninh ───────────────────────────────────────────────────────
  { label: 'Bảo vệ / Tuần tra', value: 'bao-ve', category: 'Bảo vệ & An ninh' },
  { label: 'Bảo vệ sự kiện', value: 'bao-ve-su-kien', category: 'Bảo vệ & An ninh' },

  // ── Hành chính & Chuyên nghiệp ─────────────────────────────────────────────
  { label: 'Phiên dịch / Biên dịch', value: 'phien-dich', category: 'Hành chính & Chuyên nghiệp' },
  { label: 'Kế toán / Tư vấn thuế', value: 'ke-toan-tu-van-thue', category: 'Hành chính & Chuyên nghiệp' },
  { label: 'Thư ký / Hành chính văn phòng', value: 'thu-ky-hanh-chinh', category: 'Hành chính & Chuyên nghiệp' },
  { label: 'Tư vấn pháp lý', value: 'tu-van-phap-ly', category: 'Hành chính & Chuyên nghiệp' },
  { label: 'Trợ lý ảo / Virtual Assistant', value: 'tro-ly-ao', category: 'Hành chính & Chuyên nghiệp' },

  // ── Thú y & Vật nuôi ───────────────────────────────────────────────────────
  { label: 'Thú y / Bác sĩ thú cưng', value: 'thu-y', category: 'Thú y & Vật nuôi' },
  { label: 'Tắm chó mèo / Grooming', value: 'grooming-thu-cung', category: 'Thú y & Vật nuôi' },
  { label: 'Trông giữ thú cưng', value: 'trong-giu-thu-cung', category: 'Thú y & Vật nuôi' },

  // ── Khác ───────────────────────────────────────────────────────────────────
  { label: 'Khác', value: 'khac', category: 'Khác' },
]

export const OCCUPATION_VALUES = WORKER_OCCUPATIONS.map((o) => o.value)

export const OCCUPATION_CATEGORIES = [
  ...new Set(WORKER_OCCUPATIONS.map((o) => o.category)),
]

export function getOccupationLabel(value?: string): string | undefined {
  if (!value) return undefined
  return WORKER_OCCUPATIONS.find((o) => o.value === value)?.label
}
