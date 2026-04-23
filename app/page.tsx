import Link from 'next/link'
import { Space_Grotesk } from 'next/font/google'
import ThoTotLogo from './components/ThoTotLogo'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['400', '500', '600', '700'] })

const stats = [
  { value: '5,200+', label: 'Thợ đã xác thực' },
  { value: '18,000+', label: 'Công việc/tháng' },
  { value: '4.9/5', label: 'Điểm hài lòng' },
]

const highlights = [
  {
    title: 'Đăng yêu cầu trong 2 phút',
    description: 'Chọn hạng mục, thêm hình ảnh, thời gian mong muốn và nhận thông báo ngay khi có thợ phù hợp.',
  },
  {
    title: 'Báo giá minh bạch',
    description: 'So sánh báo giá, xem hồ sơ và “chat” trực tiếp với thợ trước khi chốt.',
  },
  {
    title: 'Theo dõi toàn bộ hành trình',
    description: 'Từ báo giá đến hoàn tất, mọi trạng thái đều hiển thị rõ ràng trong bảng điều khiển.',
  },
]

const steps = [
  {
    id: '01',
    title: 'Tạo yêu cầu',
    body: 'Điền biểu mẫu trực quan, mô tả nhu cầu và vị trí. Thợ Tốt gợi ý thợ phù hợp dựa trên kinh nghiệm và khoảng cách.',
  },
  {
    id: '02',
    title: 'Nhận báo giá & trao đổi',
    body: 'Nhận nhiều báo giá minh bạch, dùng chat tích hợp để hỏi thêm và gửi hình ảnh thực tế.',
  },
  {
    id: '03',
    title: 'Giám sát và đánh giá',
    body: 'Chốt đơn, theo dõi tiến độ, xác nhận hoàn thành và đánh giá chất lượng ngay trên nền tảng.',
  },
]

const testimonials = [
  {
    content:
      'Từ khi dùng Thợ Tốt, team vận hành của tôi không còn phải gọi từng thợ nữa. Báo giá rõ ràng và luôn có người nhận việc đúng hẹn.',
    author: 'Vân Anh – Quản lý tòa nhà',
  },
  {
    content:
      'Là thợ điện nước, tôi dễ dàng nhận khách gần nhà, cập nhật tiến độ và thanh toán đúng quy trình.',
    author: 'Trung Kiên – Thợ đối tác',
  },
]

export default function Home() {
  return (
    <main className={`${spaceGrotesk.className} relative min-h-screen bg-transparent text-slate-900 overflow-hidden`}>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-300/35 blur-[140px]" />
        <div className="absolute -bottom-10 right-0 h-[420px] w-[420px] rounded-full bg-rose-200/30 blur-[200px]" />
      </div>

      <div className="relative z-10">
        <header className="max-w-6xl mx-auto px-6 py-6 flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/75 border border-cyan-100 shadow-lg shadow-cyan-900/10 backdrop-blur flex items-center justify-center">
              <ThoTotLogo className="w-10" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-700">Thợ Tốt</p>
              <p className="text-lg font-semibold text-slate-900">Kết nối khách hàng & thợ chuyên nghiệp</p>
            </div>
          </div>
          <nav className="flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-700">
            <Link href="#features" className="hover:text-cyan-700 transition-colors">
              Tính năng
            </Link>
            <Link href="#steps" className="hover:text-cyan-700 transition-colors">
              Quy trình
            </Link>
            <Link href="#stories" className="hover:text-cyan-700 transition-colors">
              Câu chuyện
            </Link>
            <Link
              href="/dang-nhap"
              className="rounded-full border border-cyan-200 bg-white/70 px-4 py-2 text-xs uppercase tracking-wide text-cyan-800 hover:border-cyan-300 hover:bg-white"
            >
              Đăng nhập
            </Link>
            <Link
              href="/dang-ky"
              className="rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 px-4 py-2 text-xs uppercase tracking-wide text-white shadow-lg shadow-cyan-700/25"
            >
              Trải nghiệm miễn phí
            </Link>
          </nav>
        </header>

        <section className="max-w-6xl mx-auto px-6 py-14 lg:py-20 grid gap-12 lg:grid-cols-[1.1fr_0.9fr] items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-700">Nền tảng dịch vụ on-demand</p>
            <h1 className="mt-6 text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-slate-900">
              Tìm thợ uy tín cho mọi nhu cầu sửa chữa, lắp đặt, vệ sinh chỉ trong vài thao tác.
            </h1>
            <p className="mt-6 text-lg text-slate-600">
              Thợ Tốt giúp khách hàng và thợ giao tiếp, thương lượng và quản lý đơn hàng một cách minh bạch. Không còn gọi điện hay ghi chú rời rạc.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/dang-ky"
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 px-8 py-3 text-white font-semibold shadow-lg shadow-cyan-700/25"
              >
                Bắt đầu ngay →
              </Link>
              <Link
                href="/dang-nhap"
                className="inline-flex items-center justify-center rounded-full border border-cyan-200 bg-white/75 px-8 py-3 font-semibold text-cyan-800 hover:border-cyan-300"
              >
                Xem bảng điều khiển
              </Link>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-cyan-100 bg-white/75 shadow-lg shadow-cyan-900/5 p-4 text-center backdrop-blur">
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.3em] text-slate-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-cyan-100 bg-white/80 p-8 shadow-2xl shadow-cyan-900/10 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-700">Điểm nổi bật</p>
            <div className="mt-8 space-y-6">
              {highlights.map((item) => (
                <div key={item.title} className="rounded-2xl border border-cyan-100 bg-gradient-to-r from-cyan-50/70 to-rose-50/60 p-5">
                  <p className="text-lg font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-2 text-sm text-slate-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="max-w-6xl mx-auto px-6 py-16">
          <div className="rounded-[32px] border border-cyan-100 bg-white/80 p-8 lg:p-12 shadow-lg shadow-cyan-900/5 backdrop-blur">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-cyan-700">Tính năng toàn diện</p>
                <h2 className="mt-4 text-3xl font-bold text-slate-900">Một nền tảng – nhiều công cụ</h2>
              </div>
              <p className="max-w-xl text-slate-600">
                Từ đăng việc, chat, gửi báo giá đến quản lý đơn hàng và thông báo real-time, mọi thứ đều nằm trong giao diện thống nhất.
              </p>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {['Đăng & duyệt việc', 'Chat & báo giá', 'Theo dõi đơn hàng'].map((feature, index) => (
                <div key={feature} className="rounded-3xl border border-cyan-100 bg-gradient-to-b from-white to-cyan-50/40 p-6">
                  <p className="text-xs uppercase tracking-[0.4em] text-cyan-700">0{index + 1}</p>
                  <h3 className="mt-4 text-2xl font-semibold text-slate-900">{feature}</h3>
                  <p className="mt-3 text-sm text-slate-600">
                    {index === 0 && 'Form hướng dẫn từng bước kèm thư viện hình ảnh và danh mục có sẵn.'}
                    {index === 1 && 'Chat real-time, chia sẻ file, cập nhật trạng thái và thương lượng ngay lập tức.'}
                    {index === 2 && 'Timeline trạng thái, xác nhận hoàn thành và lịch sử thanh toán minh bạch.'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="steps" className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step) => (
              <div key={step.id} className="rounded-3xl border border-cyan-100 bg-white/80 p-6 shadow-lg shadow-cyan-900/5">
                <p className="text-3xl font-bold text-cyan-700">{step.id}</p>
                <h3 className="mt-4 text-2xl font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-3 text-sm text-slate-600">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="stories" className="max-w-6xl mx-auto px-6 py-16">
          <div className="rounded-[32px] border border-cyan-100 bg-gradient-to-br from-white to-cyan-50/50 p-10 shadow-lg shadow-cyan-900/5">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-cyan-700">Câu chuyện thành công</p>
                <h2 className="mt-4 text-3xl font-bold text-slate-900">Niềm tin từ cộng đồng</h2>
              </div>
              <Link
                href="/dang-ky"
                className="rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 px-6 py-3 text-white font-semibold shadow-lg shadow-cyan-700/25"
              >
                Trở thành thành viên
              </Link>
            </div>
            <div className="mt-10 grid gap-8 md:grid-cols-2">
              {testimonials.map((item) => (
                <div key={item.author} className="rounded-3xl border border-cyan-100 bg-white/80 p-6">
                  <p className="text-lg text-slate-700">“{item.content}”</p>
                  <p className="mt-4 text-xs uppercase tracking-[0.3em] text-cyan-700">{item.author}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-6 pb-20">
          <div className="rounded-[28px] border border-cyan-100 bg-white/85 p-10 text-center shadow-xl shadow-cyan-900/5">
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-700">Sẵn sàng khởi động?</p>
            <h2 className="mt-4 text-3xl font-bold text-slate-900">
              Hơn 5.000 khách hàng và thợ đã dùng Thợ Tốt để xử lý công việc nhanh hơn mỗi ngày.
            </h2>
            <p className="mt-4 text-slate-600">
              Tạo tài khoản miễn phí, khám phá bảng điều khiển trực quan và bắt đầu kết nối chỉ trong vài phút.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/dang-ky"
                className="rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 px-8 py-3 text-white font-semibold shadow-lg shadow-cyan-700/25"
              >
                Đăng ký miễn phí
              </Link>
              <Link
                href="/dang-nhap"
                className="rounded-full border border-cyan-200 bg-white/70 px-8 py-3 font-semibold text-cyan-800 hover:border-cyan-300"
              >
                Tôi đã có tài khoản
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
