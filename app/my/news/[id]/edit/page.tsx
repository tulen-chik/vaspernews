'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { NewsEditor } from '../../editor'
import { notFound } from 'next/navigation'

type Prop = Promise<{ id: string }>

export default function EditNewsPage({ params }: { params: Prop }) {
  const router = useRouter()
  const [id, setId] = useState<string | null>(null)
  const [news, setNews] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchParams = async () => {
      const resolvedParams = await params
      setId(resolvedParams.id)
    }

    fetchParams()
  }, [params])

  useEffect(() => {
    const fetchNews = async () => {
      if (!id) return

      try {
        const { data, error } = await supabase
            .from('news')
            .select('*')
            .eq('id', id)
            .single()

        if (error) throw error

        setNews(data)
      } catch (error) {
        console.error('Error fetching news:', error)
        setError('Не удалось загрузить информацию о новости. Пожалуйста, попробуйте позже.')
      } finally {
        setLoading(false)
      }
    }

    fetchNews()
  }, [id])

  if (loading) {
    return (
        <div className="max-w-md mx-auto">
          <div className="text-center">Загрузка...</div>
        </div>
    )
  }

  if (!news) {
    notFound()
  }

  if (error) {
    return (
        <div className="max-w-md mx-auto">
          <div className="text-center text-red-500">{error}</div>
        </div>
    )
  }

  return (
      <div className="container py-6 max-w-2xl">
        <NewsEditor news={news} />
      </div>
  )
}