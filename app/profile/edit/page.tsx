'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { getSessionFromCookie } from '@/utils/cookies'
import { supabase } from '@/lib/supabase'
import { toast } from "@/hooks/use-toast"

export default function EditProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    const session = getSessionFromCookie()
    if (!session?.user) {
      router.push('/auth/login')
      return
    }

    fetchProfile(session.user.id)
  }, [router])

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

    if (!error && data) {
      setProfile(data)
    } else {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить профиль',
        variant: 'destructive',
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const updates = {
      username: formData.get('username'),
      full_name: formData.get('full_name'),
      website: formData.get('website'),
    }

    const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profile.id)

    if (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить профиль',
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Профиль обновлен',
        description: 'Изменения успешно сохранены',
      })
      router.push('/profile')
    }

    setLoading(false)
  }

  if (!profile) {
    return null
  }

  return (
      <div className="container max-w-2xl py-6">
        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-6">Редактировать профиль</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Имя пользователя</Label>
              <Input
                  id="username"
                  name="username"
                  defaultValue={profile.username}
                  required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="full_name">Полное имя</Label>
              <Input
                  id="full_name"
                  name="full_name"
                  defaultValue={profile.full_name}
                  required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Веб-сайт</Label>
              <Input
                  id="website"
                  name="website"
                  type="url"
                  defaultValue={profile.website}
              />
            </div>
            <div className="flex justify-end space-x-4">
              <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/profile')}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
  )
}