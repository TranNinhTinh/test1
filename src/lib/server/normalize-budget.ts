/**
 * Chuẩn hóa ngân sách từ JSON / Form (hỗ trợ dạng 1.500.000 hoặc 1500000).
 * Trả về số dương tối đa 2 chữ thập phân, hoặc undefined nếu bỏ qua field.
 */
export function normalizeBudgetInput(raw: unknown): number | undefined {
  if (raw === '' || raw === null || raw === undefined) return undefined
  const first = Array.isArray(raw) ? raw[0] : raw
  if (first === '' || first === null || first === undefined) return undefined

  let s = String(first).trim().replace(/\s/g, '')
  // Hàng nghìn bằng dấu chấm: 1.500.000
  if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, '')
  } else {
    s = s.replace(/,/g, '')
  }

  const n = Number(s)
  if (!Number.isFinite(n) || n <= 0) return undefined
  return Math.round(n * 100) / 100
}
