'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getSessionFromCookie } from '@/utils/cookies'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

export default function ProfilePage() {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState({
    reactions: 0,
    comments: 0,
    daysOnSite: 1,
  })

  useEffect(() => {
    // Fetch session from cookies
    const sessionData = getSessionFromCookie()
    setSession(sessionData)

    if (!sessionData?.user) {
      router.push('/auth/login')
      return
    }

    fetchProfile()
    fetchStats()
  }, [])

  const fetchProfile = async () => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session?.user?.id)
        .single()

    if (!error && data) {
      setProfile(data)
    }
  }

  const fetchStats = async () => {
    if (!session?.user?.id) return

    const [reactionsResponse, commentsResponse] = await Promise.all([
      supabase
          .from('reactions')
          .select('*', { count: 'exact' })
          .eq('user_id', session.user.id),
      supabase
          .from('comments')
          .select('*', { count: 'exact' })
          .eq('author_id', session.user.id),
    ])

    const daysOnSite = Math.ceil(
        (Date.now() - new Date(session.user.created_at).getTime()) / (1000 * 60 * 60 * 24)
    )

    setStats({
      reactions: reactionsResponse.count || 0,
      comments: commentsResponse.count || 0,
      daysOnSite,
    })
  }

  if (!profile) {
    return null
  }

  const initials = profile.full_name
      ?.split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()

  return (
      <div className="container py-4 md:py-6">
        <Tabs defaultValue="profile" className="space-y-4 md:space-y-6">
          <ScrollArea className="w-full whitespace-nowrap">
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <TabsContent value="profile" className="space-y-4 md:space-y-6">
            <Card className="p-4 md:p-6">
              <h3 className="text-lg font-semibold mb-4">Активность</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-muted p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold">{stats.reactions}</div>
                  <div className="text-sm text-muted-foreground">Реакций</div>
                </div>
                <div className="bg-muted p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold">{stats.comments}</div>
                  <div className="text-sm text-muted-foreground">Сообщений</div>
                </div>
                <div className="bg-muted p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold">{stats.daysOnSite}</div>
                  <div className="text-sm text-muted-foreground">На сайте</div>
                </div>
              </div>
            </Card>

            <Card className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground text-center md:text-left">
                  Если у вас возник вопрос — воспользуйтесь{' '}
                  <a href="/feedback" className="text-primary hover:underline">
                    формой обратной связи
                  </a>
                  .
                </div>
                <Button
                    variant="outline"
                    onClick={async () => {
                      await supabase.auth.signOut()
                      router.push('/')
                    }}
                >
                  Выйти
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="p-4 md:p-6">
              <p className="text-muted-foreground">Уведомления пока недоступны</p>
            </Card>
          </TabsContent>

          <TabsContent value="blacklist">
            <Card className="p-4 md:p-6">
              <p className="text-muted-foreground">Черный список пока пуст</p>
            </Card>
          </TabsContent>

          <TabsContent value="mailing">
            <Card className="p-4 md:p-6">
              <p className="text-muted-foreground">Настройки рассылки пока недоступны</p>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="p-4 md:p-6">
              <p className="text-muted-foreground">Настройки профиля пока недоступны</p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  )
}