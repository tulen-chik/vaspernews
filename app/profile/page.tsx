"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getSessionFromCookie } from "@/utils/cookies"
import { supabase } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"
import { Pencil, X } from "lucide-react"

export default function ProfilePage() {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [editMode, setEditMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    reactions: 0,
    comments: 0,
    daysOnSite: 1,
  })

  useEffect(() => {
    const sessionData = getSessionFromCookie()
    setSession(sessionData)

    if (!sessionData?.user) {
      router.push("/auth/login")
      return
    }

    fetchProfile(sessionData.user.id)
    fetchStats(sessionData.user.id)
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

  const fetchStats = async (userId: string) => {
    const [reactionsResponse, commentsResponse] = await Promise.all([
      supabase.from("reactions").select("*", { count: "exact" }).eq("user_id", userId),
      supabase.from("comments").select("*", { count: "exact" }).eq("author_id", userId),
    ])

    const daysOnSite = Math.ceil((Date.now() - new Date(session?.user?.created_at).getTime()) / (1000 * 60 * 60 * 24))

    setStats({
      reactions: reactionsResponse.count || 0,
      comments: commentsResponse.count || 0,
      daysOnSite,
    })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const updates = {
      username: formData.get("username"),
      full_name: formData.get("full_name"),
      website: formData.get("website"),
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
      fetchProfile(profile.id)
      setEditMode(false)
    }

    setLoading(false)
  }

  const toggleEditMode = () => {
    setEditMode(!editMode)
  }

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
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-6">
                <Avatar className="h-24 w-24 border-4 border-white">
                  <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                  <AvatarFallback>{profile.full_name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h1 className="text-2xl font-semibold">{profile.full_name}</h1>
                  <div className="text-sm text-gray-600">@{profile.username}</div>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={toggleEditMode}>
                {editMode ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
              </Button>
            </div>

            <Tabs defaultValue="info" className="w-full">
              <TabsList className="w-full justify-start bg-white/50 p-0 h-auto gap-2">
                <TabsTrigger value="info" className="data-[state=active]:bg-white rounded-full px-4 py-2">
                  Информация
                </TabsTrigger>
                <TabsTrigger value="activity" className="data-[state=active]:bg-white rounded-full px-4 py-2">
                  Активность
                </TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="mt-6">
                <Card className="bg-white">
                  <div className="p-6">
                    {editMode ? (
                        <form onSubmit={handleSubmit} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="username">Имя пользователя</Label>
                            <Input id="username" name="username" defaultValue={profile.username} required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="full_name">Полное имя</Label>
                            <Input id="full_name" name="full_name" defaultValue={profile.full_name} required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="website">Веб-сайт</Label>
                            <Input id="website" name="website" defaultValue={profile.website} />
                          </div>
                          <div className="flex justify-end space-x-4 pt-4">
                            <Button type="button" variant="outline" onClick={toggleEditMode}>
                              Отмена
                            </Button>
                            <Button type="submit" disabled={loading}>
                              {loading ? "Сохранение..." : "Сохранить изменения"}
                            </Button>
                          </div>
                        </form>
                    ) : (
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-semibold">Имя пользователя</h3>
                            <p>{profile.username}</p>
                          </div>
                          <div>
                            <h3 className="font-semibold">Полное имя</h3>
                            <p>{profile.full_name}</p>
                          </div>
                          <Button onClick={toggleEditMode} className="mt-4">
                            Редактировать профиль
                          </Button>
                        </div>
                    )}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="activity" className="mt-6">
                <Card className="bg-white">
                  <div className="p-6">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-4 rounded-lg bg-[#FFD6E4]/50">
                        <div className="text-2xl font-bold">{stats.reactions}</div>
                        <div className="text-sm text-gray-600">Реакций</div>
                      </div>
                      <div className="p-4 rounded-lg bg-[#FFD6E4]/50">
                        <div className="text-2xl font-bold">{stats.comments}</div>
                        <div className="text-sm text-gray-600">Комментариев</div>
                      </div>
                      <div className="p-4 rounded-lg bg-[#FFD6E4]/50">
                        <div className="text-2xl font-bold">{stats.daysOnSite}</div>
                        <div className="text-sm text-gray-600">Дней на сайте</div>
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>

            <Card className="bg-white">
              <div className="p-6">
                <Button
                    variant="outline"
                    className="w-full"
                    onClick={async () => {
                      await supabase.auth.signOut()
                      router.push("/")
                    }}
                >
                  Выйти
                </Button>
              </div>
            </Card>
          </div>
        </Card>
      </div>
  )
}

