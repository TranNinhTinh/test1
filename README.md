# GR78 — Hệ thống kết nối dịch vụ

> Monorepo đồ án: nền tảng kết nối người dùng với dịch vụ — gồm API **NestJS**, web **Next.js** và ứng dụng **Flutter**, thống nhất qua OpenAPI/Swagger.

---

## Nhóm thực hiện

<table>
<thead>
<tr>
<th align="center">STT</th>
<th align="left">Vai trò</th>
<th align="left">Họ và tên</th>
</tr>
</thead>
<tbody>
<tr>
<td align="center">—</td>
<td>Giáo viên hướng dẫn</td>
<td>Phạm Văn Dược</td>
</tr>
<tr>
<td align="center">1</td>
<td>Thành viên nhóm</td>
<td>Nguyễn Trung Kiên</td>
</tr>
<tr>
<td align="center">2</td>
<td>Thành viên nhóm</td>
<td>Võ Văn Tín</td>
</tr>
<tr>
<td align="center">3</td>
<td>Thành viên nhóm</td>
<td>Trần Ninh Tình</td>
</tr>
<tr>
<td align="center">4</td>
<td>Thành viên nhóm</td>
<td>Nguyễn Lương Thiện</td>
</tr>
<tr>
<td align="center">5</td>
<td>Thành viên nhóm</td>
<td>Hoàng Văn Quyển</td>
</tr>
</tbody>
</table>

---

## Tổng quan

- **Backend** phục vụ REST `/api/v1` và Socket.IO (chat, cập nhật thời gian thực).
- **Web** và **Mobile** gọi chung API; mobile cấu hình base URL qua `dart-define` khi cần đổi môi trường.
- Dữ liệu lưu tại **PostgreSQL**, có **Redis** cho cache/luồng phụ trợ (theo module backend).

---

## Kiến trúc các thành phần

<table>
<thead>
<tr>
<th align="left">Thành phần</th>
<th align="left">Thư mục</th>
<th align="left">Công nghệ chính</th>
</tr>
</thead>
<tbody>
<tr>
<td>API</td>
<td><code>backend/</code></td>
<td>NestJS 10, TypeORM, PostgreSQL, Redis, Socket.IO, JWT, Stripe, Resend, Supabase</td>
</tr>
<tr>
<td>Web</td>
<td><code>frontend/</code></td>
<td>Next.js 14, React 18, Tailwind</td>
</tr>
<tr>
<td>Mobile</td>
<td><code>Mobile/</code></td>
<td>Flutter (Dart ^3.8), GetX, Dio, GoRouter, client OpenAPI trong <code>packages/openapi</code></td>
</tr>
</tbody>
</table>

**Luồng dữ liệu:** Mobile / Web → REST (và Socket.IO khi cần) → Backend → PostgreSQL, Redis và các dịch vụ tích hợp.

---

## Chức năng chính (theo backend)

<table>
<thead>
<tr>
<th align="left">Nhóm</th>
<th align="left">Nội dung</th>
</tr>
</thead>
<tbody>
<tr>
<td>Người dùng</td>
<td>Đăng ký, đăng nhập, JWT, OTP email, đặt lại mật khẩu</td>
</tr>
<tr>
<td>Nghiệp vụ</td>
<td>Bài đăng, tìm kiếm, báo giá, đơn hàng</td>
</tr>
<tr>
<td>Tương tác</td>
<td>Chat (WebSocket), thông báo</td>
</tr>
<tr>
<td>Khác</td>
<td>Yêu cầu tùy chỉnh, đánh giá, chứng chỉ, gói đăng ký / thanh toán (Stripe)</td>
</tr>
</tbody>
</table>

**Tài liệu API:** sau khi chạy backend, mở Swagger tại đường dẫn `/api` (cấu hình trong `backend/src/main.ts`).

---

## Yêu cầu môi trường

<table>
<thead>
<tr>
<th align="left">Công cụ</th>
<th align="left">Ghi chú</th>
</tr>
</thead>
<tbody>
<tr>
<td>Node.js</td>
<td>20+ (backend + frontend)</td>
</tr>
<tr>
<td>PostgreSQL, Redis</td>
<td>Theo cấu hình backend</td>
</tr>
<tr>
<td>Flutter</td>
<td>SDK tương thích <code>Mobile/pubspec.yaml</code> (Dart ^3.8.1)</td>
</tr>
</tbody>
</table>

Biến môi trường backend cấu hình qua module NestJS (`backend/src/config`). Chuẩn bị file `.env` theo hướng dẫn nội bộ nhóm hoặc tài liệu triển khai.

---

## Hướng dẫn chạy nhanh

<table>
<thead>
<tr>
<th align="center">Bước</th>
<th align="left">Thành phần</th>
<th align="left">Thư mục</th>
<th align="left">Lệnh</th>
</tr>
</thead>
<tbody>
<tr>
<td align="center">1</td>
<td>Backend API</td>
<td><code>backend/</code></td>
<td>
<code>cd backend</code><br>
<code>npm install</code><br>
<code>npm run start:dev</code>
</td>
</tr>
<tr>
<td align="center">2</td>
<td>Web</td>
<td><code>frontend/</code></td>
<td>
<code>cd frontend</code><br>
<code>npm install</code><br>
<code>npm run dev</code>
</td>
</tr>
<tr>
<td align="center">3</td>
<td>Mobile</td>
<td><code>Mobile/</code></td>
<td>
<code>cd Mobile</code><br>
<code>flutter pub get</code><br>
<code>flutter run</code>
</td>
</tr>
</tbody>
</table>

**Ghi chú thêm (backend):** cổng mặc định **3000** (hoặc `APP_PORT`), prefix API **`api`** — REST thường dạng `/api/v1/...`.

**Đổi API khi chạy Flutter:**

```bash
flutter run --dart-define=API_BASE_V1=https://<host-cua-ban>/api/v1
```

Giá trị mặc định trong `Mobile/lib/core/api_config.dart`. Socket.IO cùng host REST, bỏ hậu tố `/api/v1` — xem `Mobile/lib/core/api_socket_root.dart`.

---

## Cấu trúc thư mục

```
GR78/
├── backend/      # API NestJS
├── frontend/     # Next.js
├── Mobile/       # Flutter + package openapi
└── _docs/        # Tài liệu đồ án (nếu có)
```

---

## Tài liệu & client sinh từ API

<table>
<thead>
<tr>
<th align="left">Mục</th>
<th align="left">Vị trí trong repo</th>
</tr>
</thead>
<tbody>
<tr>
<td>Client Dart (Flutter)</td>
<td><code>Mobile/packages/openapi/</code></td>
</tr>
<tr>
<td>Sinh SDK TypeScript (web)</td>
<td><code>frontend/package.json</code> — script <code>generate:sdk</code></td>
</tr>
</tbody>
</table>

README riêng từng phần:

- [Backend](backend/README.md)
- [Frontend](frontend/README.md)
- [Mobile](Mobile/README.md)

---

## Lưu ý khi đưa lên môi trường thật

Dự án phục vụ học tập và demo. Cần rà soát lại CORS, URL mặc định, khóa bí mật và cấu hình bảo mật mạng trên Android (`network_security_config`, v.v.) trước khi public production.
