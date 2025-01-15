'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'
import { UserNav } from '@/components/user-nav'
import { SearchDialog } from '@/components/search-dialog'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Header() {
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
      <header className="sticky top-0 z-50 w-full border-b bg-white">
        <div className="container flex h-16 items-center p-2">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-pink-500">VasperNews</span>
          </Link>

          <nav className="mx-6 flex items-center space-x-4 lg:space-x-6">

          </nav>

          <div className="ml-auto flex items-center space-x-4">
            <SearchDialog />
            <UserNav user={user} />
          </div>
        </div>
      </header>
  )
}

