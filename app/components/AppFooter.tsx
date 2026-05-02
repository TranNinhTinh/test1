import Link from 'next/link'

export default function AppFooter() {
  return (
    <footer className="border-t border-outline-variant/50 bg-surface py-app-lg">
      <div className="app-container flex flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="text-sm text-foreground-muted">
          © {new Date().getFullYear()}{' '}
          <span className="font-semibold text-foreground">Thợ Tốt</span>
          <span className="mx-2 hidden text-foreground-muted/50 sm:inline">·</span>
          <span className="hidden sm:inline">Kết nối khách hàng & thợ chuyên nghiệp</span>
        </p>
        <nav className="flex flex-wrap items-center justify-center gap-x-1 text-sm">
          <Link
            href="/dang-nhap"
            className="rounded-app-md px-3 py-1.5 font-medium text-foreground-muted transition-colors hover:bg-brand-tint/50 hover:text-brand-dark"
          >
            Đăng nhập
          </Link>
          <span className="text-foreground-muted/30" aria-hidden>
            |
          </span>
          <Link
            href="/dang-ky"
            className="rounded-app-md px-3 py-1.5 font-medium text-brand transition-colors hover:bg-brand-tint/60 hover:text-brand-dark"
          >
            Đăng ký
          </Link>
        </nav>
      </div>
    </footer>
  )
}
