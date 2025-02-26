"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { NewsFeed } from "@/components/news-feed"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"

// Define types for the fetched data
interface Category {
  id: number
  name: string
}

interface Profile {
  username: string
}

interface NewsCategory {
  categories: Category
}

interface NewsItem {
  id: number
  title: string
  image_url: string
  created_at: string
  author_id: number
  published: boolean
  profiles?: Profile
  news_categories?: NewsCategory[]
  comments?: number
  reactions?: number
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
        const { data: categoriesData } = await supabase.from("categories").select("*").order("name")

        setCategories(categoriesData ? categoriesData : [])
      } catch (err) {
        console.error("Error fetching categories:", err)
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
            .from("news")
            .select("id, title, image_url, created_at, author_id, published")
            .eq("published", true)
            .order("created_at", { ascending: false })
            .limit(20)

        if (newsError) throw new Error(newsError.message)

        // Fetch news details including profiles and categories
        const newsDetails = await Promise.all(
            newsData.map(async (newsItem) => {
              const { data: profileData, error: profileError } = await supabase
                  .from("profiles")
                  .select("username")
                  .eq("id", newsItem.author_id)
                  .single()

              if (profileError) {
                console.error("Error fetching profile:", profileError)
                return { ...newsItem, profiles: { username: "Unknown" }, news_categories: [] }
              }

              const { data: newsCategories, error: categoryError } = await supabase
                  .from("news_categories")
                  .select("categories(id, name)")
                  .eq("news_id", newsItem.id)

              if (categoryError) {
                console.error("Error fetching categories:", categoryError)
                return { ...newsItem, profiles: profileData, news_categories: [] }
              }

              const { count: commentsCount } = await supabase
                  .from("comments")
                  .select("*", { count: "exact" })
                  .eq("news_id", newsItem.id)

              const { count: reactionsCount } = await supabase
                  .from("reactions")
                  .select("*", { count: "exact" })
                  .eq("news_id", newsItem.id)

              return {
                ...newsItem,
                profiles: profileData,
                news_categories: newsCategories || [],
                comments: commentsCount,
                reactions: reactionsCount,
              }
            }),
        )

        // Filter news based on selected category
        const filteredNews = selectedCategory
            ? newsDetails.filter((news) =>
                news.news_categories?.some(
                    (newsCategory) =>
                        // @ts-ignore
                        newsCategory.categories.id === selectedCategory,
                ),
            )
            : newsDetails

        // @ts-ignore
        setNewsWithDetails(filteredNews)
      } catch (err) {
        console.error("Error fetching news:", err)
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

  return (
      <div className="container py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8">
          {/* Sidebar */}
          <aside className="md:sticky md:top-20 self-start">
            <div className="bg-card rounded-xl shadow-sm p-5 border">
              <h2 className="text-xl font-semibold mb-4">Категории</h2>

              {categories.length === 0 ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-10 w-full rounded-md" />
                    ))}
                  </div>
              ) : (
                  <ScrollArea className="h-[calc(100vh-250px)] pr-4">
                    <div className="space-y-2">
                      {categories.map((category) => (
                          <Button
                              key={category.id}
                              onClick={() => handleCategorySelect(category.id)}
                              variant={selectedCategory === category.id ? "default" : "outline"}
                              className="w-full justify-start text-left font-medium"
                          >
                            {category.name}
                            {selectedCategory === category.id && (
                                <Badge variant="secondary" className="ml-auto">
                                  Выбрано
                                </Badge>
                            )}
                          </Button>
                      ))}
                    </div>
                  </ScrollArea>
              )}
            </div>
          </aside>

          {/* Main content */}
          <main>
            {loading ? (
                <LoadingState />
            ) : error ? (
                <ErrorState error={error} />
            ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold">
                      {selectedCategory
                          ? `Новости: ${categories.find((c) => c.id === selectedCategory)?.name}`
                          : "Все новости"}
                    </h1>
                    {selectedCategory && (
                        <Button variant="ghost" onClick={() => setSelectedCategory(null)} className="text-muted-foreground">
                          Сбросить фильтр
                        </Button>
                    )}
                  </div>
                  <NewsFeed initialNews={newsWithDetails || []} />
                </>
            )}
          </main>
        </div>
      </div>
  )
}

function LoadingState() {
  return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-8 w-32" />
        </div>

        {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card rounded-xl overflow-hidden border shadow-sm">
              <Skeleton className="h-64 w-full" />
              <div className="p-6 space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <div className="flex gap-2">
                  {[1, 2].map((j) => (
                      <Skeleton key={j} className="h-6 w-20 rounded-full" />
                  ))}
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
                <div className="flex justify-between items-center pt-4">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <div className="flex gap-4">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </div>
              </div>
            </div>
        ))}
      </div>
  )
}

function ErrorState({ error }: { error: string }) {
  return (
      <Alert variant="destructive" className="animate-in fade-in-50">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Ошибка загрузки</AlertTitle>
        <AlertDescription>Не удалось загрузить новости: {error}</AlertDescription>
      </Alert>
  )
}

