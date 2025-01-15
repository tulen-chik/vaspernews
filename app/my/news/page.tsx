'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getSessionFromCookie } from '@/utils/cookies'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function MyNewsPage() {
  const router = useRouter()
  const session = getSessionFromCookie()
  const [news, setNews] = useState<any[]>([])
  const [stats, setStats] = useState<Record<string, any>>({})
  const [searchDate, setSearchDate] = useState({
    day: '',
    month: '',
    year: '',
  })
  const [searchTitle, setSearchTitle] = useState('')

  useEffect(() => {
    if (!session?.user) {
      router.push('/auth/login')
      return
    }

    fetchNews()
  }, [session])

  const fetchNews = async () => {
    const { data } = await supabase
      .from('news')
      .select(`
        *,
        news_stats(views),
        comments(count),
        reactions(count)
      `)
      .eq('author_id', session?.user?.id)
      .order('created_at', { ascending: false })

    if (data) {
      setNews(data)
      const statsMap = data.reduce((acc: any, item: any) => {
        acc[item.id] = {
          views: item.news_stats?.[0]?.views || 0,
          comments: item.comments[0]?.count || 0,
          reactions: item.reactions[0]?.count || 0,
        }
        return acc
      }, {})
      setStats(statsMap)
    }
  }

  const handleSearch = () => {
    const { day, month, year } = searchDate
    const date = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day)
    )
    
    // Filter news based on search criteria
    const filtered = news.filter(item => {
      const itemDate = new Date(item.created_at)
      const titleMatch = item.title.toLowerCase().includes(searchTitle.toLowerCase())
      const dateMatch = !day || !month || !year ? true :
        itemDate.getDate() === date.getDate() &&
        itemDate.getMonth() === date.getMonth() &&
        itemDate.getFullYear() === date.getFullYear()
      
      return titleMatch && dateMatch
    })

    setNews(filtered)
  }

  return (
    <div className="container py-6 max-w-4xl">
      <Card className="p-6 mb-6 bg-pink-50">
        <h1 className="text-2xl font-bold mb-6">Статистика публикаций</h1>
        
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Input
              placeholder="Название публикации"
              value={searchTitle}
              onChange={(e) => setSearchTitle(e.target.value)}
              className="flex-1"
            />
            <div className="flex gap-2">
              <Input
                placeholder="День"
                value={searchDate.day}
                onChange={(e) => setSearchDate(prev => ({ ...prev, day: e.target.value }))}
                className="w-20"
              />
              <Input
                placeholder="Месяц"
                value={searchDate.month}
                onChange={(e) => setSearchDate(prev => ({ ...prev, month: e.target.value }))}
                className="w-20"
              />
              <Input
                placeholder="Год"
                value={searchDate.year}
                onChange={(e) => setSearchDate(prev => ({ ...prev, year: e.target.value }))}
                className="w-24"
              />
            </div>
            <Button onClick={handleSearch} className="bg-pink-500 hover:bg-pink-600">
              Найти
            </Button>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {news.map((item) => (
          <Card key={item.id} className="p-4">
            <div className="flex justify-between items-start gap-4">
              <div>
                <h2 className="text-xl font-semibold mb-2">{item.title}</h2>
                <div className="flex gap-4 text-sm text-gray-600">
                  <span>Просмотры: {stats[item.id]?.views}</span>
                  <span>Комментарии: {stats[item.id]?.comments}</span>
                  <span>Реакции: {stats[item.id]?.reactions}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/news/${item.id}`)}
                >
                  Перейти к публикации
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/my/news/${item.id}/edit`)}
                >
                  Редактировать
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="fixed bottom-4 right-4">
        <Button
          size="lg"
          className="bg-pink-500 hover:bg-pink-600"
          onClick={() => router.push('/my/news/new')}
        >
          Добавить публикацию
        </Button>
      </div>
    </div>
  )
}

