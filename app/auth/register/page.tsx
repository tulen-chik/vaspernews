'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { setCookie } from '@/utils/cookies'
import Link from 'next/link'
import { toast } from "@/hooks/use-toast"
import {supabase} from "@/lib/supabase";

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const username = formData.get('username') as string

    // Sign up the user
    await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          role: 'user',
        },
      },
    }).then(async ({data, error}) => {
      if (data) {
        // Set cookie for the session
        setCookie('supabaseSession', JSON.stringify(data.session))

      await supabase
          .from('profiles')
          .insert({
            id: data.user?.id, // Use user ID as profile ID
            username,
            full_name: '', // You can add another field for full name if needed
          })

        router.push('/')
      } else {
        console.error(error)
      }
    })



    setLoading(false)
  }

  return (
      <div className="flex justify-center">
      <div className="container max-w-md py-16">
        <h1 className="text-3xl font-bold mb-8 text-center">Регистрация</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username">Имя пользователя</Label>
            <Input id="username" name="username" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Пароль</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm">
          Уже есть аккаунт?{' '}
          <Link href="/auth/login" className="text-blue-600 hover:underline">
            Войти
          </Link>
        </p>
      </div>
      </div>
  )
}