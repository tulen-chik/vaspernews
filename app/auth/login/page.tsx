'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { setCookie } from '@/utils/cookies'
import {toast} from "@/hooks/use-toast";

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      toast({
        title: 'Ошибка входа',
        description: error.message,
        variant: 'destructive',
      })
      console.error(error)
    } else {
      if (data?.session) {
        setCookie('supabaseSession', JSON.stringify(data.session))
        router.push('/')
        router.refresh()
      }
    }

    setLoading(false)
  }

  return (
      <div className="flex justify-center">
        <div className="container max-w-md py-16 ">
          <h1 className="text-3xl font-bold mb-8 text-center">Вход</h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input id="password" name="password" type="password" required/>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Вход...' : 'Войти'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm">
            Нет аккаунта?{' '}
            <Link href="/auth/register" className="text-blue-600 hover:underline">
              Зарегистрироваться
            </Link>
          </p>
        </div>
      </div>
  )
}

