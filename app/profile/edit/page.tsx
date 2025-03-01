"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getSessionFromCookie } from "@/utils/cookies"
import { supabase } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"
import { MapPin } from "lucide-react"

export default function EditProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    const session = getSessionFromCookie()
    if (!session?.user) {
      router.push("/auth/login")
      return
    }

    fetchProfile(session.user.id)
  }, [router])

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

    if (!error && data) {
      setProfile(data)
    } else {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить профиль",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const updates = {
      first_name: formData.get("first_name"),
      last_name: formData.get("last_name"),
      email: formData.get("email"),
      position: formData.get("position"),
      age: formData.get("age"),
      city: formData.get("city"),
    }

    const { error } = await supabase.from("profiles").update(updates).eq("id", profile.id)

    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить профиль",
        variant: "destructive",
      })
    } else {
      toast({
        title: "Профиль обновлен",
        description: "Изменения успешно сохранены",
      })
      router.push("/profile")
    }

    setLoading(false)
  }

  const initials = profile?.full_name
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()

  if (!profile) {
    return (
        <div className="container max-w-3xl py-8">
          <Card className="p-8 space-y-4">
            <div className="h-24 w-24 rounded-full bg-muted animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-48 bg-muted animate-pulse rounded" />
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            </div>
          </Card>
        </div>
    )
  }

  return (
      <div className="container max-w-3xl py-8">
        <Card className="bg-[#FFD6E4]">
          <div className="p-6 space-y-6">
            <div className="flex items-start gap-6">
              <Avatar className="h-24 w-24 border-4 border-white">
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h1 className="text-2xl font-semibold">{profile.full_name}</h1>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>{profile.age || 18} лет</span>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{profile.city || "г.Минск"}</span>
                  </div>
                </div>
              </div>
            </div>

            <Card className="bg-white">
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-6">Информация</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">Имя</Label>
                      <Input id="first_name" name="first_name" defaultValue={profile.first_name} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Фамилия</Label>
                      <Input id="last_name" name="last_name" defaultValue={profile.last_name} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" defaultValue={profile.email} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">Должность</Label>
                    <Input id="position" name="position" defaultValue={profile.position} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="age">Возраст</Label>
                      <Input id="age" name="age" type="number" defaultValue={profile.age || 18} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">Город</Label>
                      <Input id="city" name="city" defaultValue={profile.city || "г.Минск"} />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-4 pt-4">
                    <Button type="button" variant="outline" onClick={() => router.push("/profile")}>
                      Отмена
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? "Сохранение..." : "Сохранить изменения"}
                    </Button>
                  </div>
                </form>
              </div>
            </Card>
          </div>
        </Card>
      </div>
  )
}

