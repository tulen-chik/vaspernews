import * as React from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"

export function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <nav
      className={cn("flex items-center space-x-4 lg:space-x-6", className)}
      {...props}
    >
      <Link
        href="/"
        className="text-sm font-medium transition-colors hover:text-primary"
      >
        Главная
      </Link>
      <Link
        href="/category/politics"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        Политика
      </Link>
      <Link
        href="/category/economy"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        Экономика
      </Link>
      <Link
        href="/category/society"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        Общество
      </Link>
      <Link
        href="/category/world"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        В мире
      </Link>
    </nav>
  )
}

