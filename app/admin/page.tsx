'use client'

import { useEffect, useState } from 'react'
import { getSessionFromCookie } from '@/utils/cookies'
import { supabase } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from '@/hooks/use-toast'

export default function AdminPage() {
  const [session, setSession] = useState<any>(null)
  const [news, setNews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSessionAndNews = async () => {
      const sessionData = getSessionFromCookie()
      setSession(sessionData)

      if (!sessionData?.user || sessionData.user.user_metadata.role !== 'admin') {
        redirect('/')
        return
      }

      // Fetch news items
      const { data: newsData, error: newsError } = await supabase
          .from('news')
          .select('id, title, author_id, published, created_at')
          .order('created_at', { ascending: false })

      if (newsError) {
        console.error('Error fetching news:', newsError)
        setLoading(false)
        return
      }

      // Fetch profiles and categories
      const newsWithDetails = await Promise.all(newsData.map(async (newsItem) => {
        // Fetch author profile
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', newsItem.author_id)
            .single()

        if (profileError) {
          console.error('Error fetching profile:', profileError)
          return { ...newsItem, profiles: { username: 'Unknown' }, news_categories: [] }
        }

        // Fetch categories for this news item
        const { data: newsCategories, error: categoryError } = await supabase
            .from('news_categories')
            .select('categories(name)')
            .eq('news_id', newsItem.id)

        if (categoryError) {
          console.error('Error fetching categories:', categoryError)
          return { ...newsItem, profiles: profileData, news_categories: [] }
        }

        return {
          ...newsItem,
          profiles: profileData,
          news_categories: newsCategories,
        }
      }))

      setNews(newsWithDetails)
      setLoading(false)
    }

    fetchSessionAndNews()
  }, [])

  const handleDelete = async (id: string) => {
    const { error } = await supabase
        .from('news')
        .delete()
        .eq('id', id)

    if (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить новость',
        variant: 'destructive',
      })
    } else {
      setNews(news.filter(item => item.id !== id))
      toast({
        title: 'Новость удалена',
        description: 'Новость успешно удалена',
      })
    }
  }

  if (loading) {
    return <div className="text-center">Загрузка...</div>
  }

  return (
      <div className="container py-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Управление новостями</h1>
          <Button asChild>
            <Link href="/my/news/new">Создать новость</Link>
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Заголовок</TableHead>
              <TableHead>Автор</TableHead>
              <TableHead>Категории</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {news.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.title}</TableCell>
                  <TableCell>{item.profiles.username}</TableCell>
                  <TableCell>{item.news_categories.map((nc: any) => nc.categories.name).join(', ')}</TableCell>
                  <TableCell>{item.published ? 'Опубликовано' : 'Черновик'}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="destructive" onClick={() => handleDelete(item.id)}>
                        Удалить
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
  )
}