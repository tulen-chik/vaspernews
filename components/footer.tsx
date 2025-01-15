import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-muted">
      <div className="container py-8 px-4 md:px-6">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <h3 className="font-bold mb-4">О нас</h3>
            <p className="text-sm text-muted-foreground">
              VasperNews - ведущее информационное агентство, предоставляющее актуальные новости и аналитику.
            </p>
          </div>
          <div>
            <h3 className="font-bold mb-4">Соцсети</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Telegram
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  VK
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Instagram
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-4">Контакты</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>Телефон: +7 (495) 645-6601</p>
              <p>Email: info@vaspernews.ru</p>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} VasperNews. Все права защищены.
        </div>
      </div>
    </footer>
  )
}

