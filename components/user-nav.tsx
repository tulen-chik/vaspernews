'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { removeCookie } from '@/utils/cookies'
import { supabase } from "@/lib/supabase"

interface UserNavProps {
  user: any
}

export function UserNav({ user }: UserNavProps) {
  const router = useRouter()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    removeCookie("supabaseSession")
    router.refresh()
  }

  if (!user) {
    return (
        <Button asChild variant="ghost">
          <Link href="/auth/login">
            Войти
          </Link>
        </Button>
    )
  }

  return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.user_metadata.avatar_url} alt={user.email || ''} />
              <AvatarFallback>{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.user_metadata.full_name}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href="/profile">
                Профиль
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/my/news">
                Мои публикации
              </Link>
            </DropdownMenuItem>
            {user.user_metadata.role === 'admin' && (
                <DropdownMenuItem asChild>
                  <Link href="/admin">
                    Админ панель
                  </Link>
                </DropdownMenuItem>
            )}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>
            Выйти
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
  )
}

