'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { NewsFeed } from '@/components/news-feed'

// Define types for the fetched data
interface Category {
  id: number;
  name: string;
}

interface Profile {
  username: string;
}

interface NewsCategory {
  categories: Category; // Changed to reflect the structure
}

interface NewsItem {
  id: number;
  title: string;
  image_url: string;
  created_at: string;
  author_id: number;
  published: boolean;
  profiles?: Profile;
  news_categories?: NewsCategory[]; // Updated to be an array of NewsCategory
  comments?: number;
  reactions?: number;
}

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [newsWithDetails, setNewsWithDetails] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data: categoriesData } = await supabase
            .from('categories')
            .select('*')
            .order('name')

        setCategories(categoriesData ? categoriesData : [])
      } catch (err) {
        console.error('Error fetching categories:', err)
      }
    }

    fetchCategories()
  }, [])

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true)
      setError(null)

      try {
        // Fetch published news based on selected category
        const { data: newsData, error: newsError } = await supabase
            .from('news')
            .select('id, title, image_url, created_at, author_id, published')
            .eq('published', true)
            .order('created_at', { ascending: false })
            .limit(20)

        if (newsError) throw new Error(newsError.message)

        // Fetch news details including profiles and categories
        const newsDetails = await Promise.all(newsData.map(async (newsItem) => {
          const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('username')
              .eq('id', newsItem.author_id)
              .single()

          if (profileError) {
            console.error('Error fetching profile:', profileError)
            return { ...newsItem, profiles: { username: 'Unknown' }, news_categories: [] }
          }

          const { data: newsCategories, error: categoryError } = await supabase
              .from('news_categories')
              .select('categories(id, name)')
              .eq('news_id', newsItem.id)

          if (categoryError) {
            console.error('Error fetching categories:', categoryError)
            return { ...newsItem, profiles: profileData, news_categories: [] }
          }

          const { count: commentsCount } = await supabase
              .from('comments')
              .select('*', { count: 'exact' })
              .eq('news_id', newsItem.id)

          const { count: reactionsCount } = await supabase
              .from('reactions')
              .select('*', { count: 'exact' })
              .eq('news_id', newsItem.id)

          return {
            ...newsItem,
            profiles: profileData,
            news_categories: newsCategories || [],
            comments: commentsCount,
            reactions: reactionsCount,
          }
        }))

        // Filter news based on selected category

        const filteredNews = selectedCategory
            ? newsDetails.filter(news =>
                news.news_categories?.some(newsCategory =>
                    // @ts-ignore
                    newsCategory.categories.id === selectedCategory
                )
            )
            : newsDetails;

        // @ts-ignore
        setNewsWithDetails(filteredNews)
      } catch (err) {
        console.error('Error fetching news:', err)
        setError(err instanceof Error ? err.message : "Неизвестная ошибка")
      } finally {
        setLoading(false)
      }
    }

    fetchNews()
  }, [selectedCategory]) // Trigger fetchNews when selectedCategory changes

  const handleCategorySelect = (categoryId: number) => {
    setSelectedCategory(categoryId === selectedCategory ? null : categoryId)
  }

  if (loading) {
    return <div className="container py-6">Загрузка...</div>
  }

  if (error) {
    return (
        <div className="container py-6">
          <div className="text-center text-red-500">Не удалось загрузить новости: {error}</div>
        </div>
    )
  }

  return (
      <div className="container py-6">
        <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-6">
          <aside className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Фильтр по категориям</h2>
              <div className="space-y-2">
                {categories.map((category) => (
                    <button
                        key={category.id}
                        onClick={() => handleCategorySelect(category.id)}
                        className={`block w-full text-left px-3 py-2 text-sm rounded-md ${
                            selectedCategory === category.id
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-secondary hover:bg-secondary/80'
                        }`}
                    >
                      {category.name}
                    </button>
                ))}
              </div>
            </div>
          </aside>
          <main>
            <NewsFeed initialNews={newsWithDetails || []} />
          </main>
        </div>
      </div>
  )
}