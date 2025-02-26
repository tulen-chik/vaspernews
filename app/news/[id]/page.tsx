"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { notFound } from "next/navigation"
import Image from "next/image"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { ShareDialog } from "@/components/share-dialog"
import { Button } from "@/components/ui/button"
import { MessageSquare, ThumbsUp, ThumbsDown, Share2, User, Calendar } from "lucide-react"
import { CommentSection } from "@/components/comment-section"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function NewsPage({ params }: { params: Promise<{ id: string }> }) {
  const [news, setNews] = useState<any | null>(null)
  const [author, setAuthor] = useState<any | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [comments, setComments] = useState<any[]>([])
  const [reactions, setReactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [id, setId] = useState<string | null>(null)

  const handleReaction = async (type: "like" | "dislike") => {
    if (!news) return

    try {
      const { data, error } = await supabase.from("reactions").insert({ news_id: news.id, user_id: "1", type }).single()

      if (error) throw error
      setReactions([...reactions, data])
    } catch (error) {
      console.error("Error adding reaction:", error)
    }
  }

  useEffect(() => {
    const fetchParams = async () => {
      const resolvedParams = await params
      setId(resolvedParams.id)
    }
    fetchParams()
  }, [params])

  useEffect(() => {
    const fetchNewsData = async () => {
      if (!id) return

      try {
        const { data: newsData, error: newsError } = await supabase.from("news").select("*").eq("id", id).single()

        if (newsError) throw newsError
        setNews(newsData)

        const { data: authorData, error: authorError } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", newsData.author_id)
            .single()

        if (authorError) throw authorError
        setAuthor(authorData)

        const { data: categoriesData, error: categoriesError } = await supabase
            .from("news_categories")
            .select("categories(name)")
            .eq("news_id", id)

        if (categoriesError) throw categoriesError
        setCategories(categoriesData.map((item: any) => item.categories.name))

        const { data: commentsData, error: commentsError } = await supabase
            .from("comments")
            .select("*")
            .eq("news_id", id)

        if (commentsError) throw commentsError
        setComments(commentsData)

        const { data: reactionsData, error: reactionsError } = await supabase
            .from("reactions")
            .select("*")
            .eq("news_id", id)

        if (reactionsError) throw reactionsError
        setReactions(reactionsData)
      } catch (error) {
        console.error("Error fetching news data:", error)
        setError("Не удалось загрузить новость. Пожалуйста, попробуйте позже.")
      } finally {
        setLoading(false)
      }
    }

    fetchNewsData()
  }, [id])

  if (loading) {
    return <LoadingState />
  }

  if (!news) {
    notFound()
  }

  if (error) {
    return <ErrorState error={error} />
  }

  return (
      <div className="container max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Card className="overflow-hidden">
          <CardHeader>
            <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-900">{news.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center">
                <User className="w-4 h-4 mr-2" />
                <span className="font-medium">{author?.username}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                <time>
                  {formatDistanceToNow(new Date(news.created_at), {
                    locale: ru,
                    addSuffix: true,
                  })}
                </time>
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                    <Badge key={category} variant="secondary">
                      {category}
                    </Badge>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {news.image_url && (
                <div className="relative aspect-video mb-6 rounded-lg overflow-hidden shadow-md">
                  <Image src={news.image_url || "/placeholder.svg"} alt={news.title} fill className="object-cover" />
                </div>
            )}
            <div className="prose prose-lg max-w-none mb-8" dangerouslySetInnerHTML={{ __html: news.content }} />
            {news.video_url && (
                <div className="aspect-video mb-6 rounded-lg overflow-hidden shadow-md">
                  <iframe src={news.video_url} className="w-full h-full" allowFullScreen />
                </div>
            )}
          </CardContent>
          <CardFooter className="flex items-center justify-between border-t">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={() => handleReaction("like")}>
                <ThumbsUp className="w-4 h-4 mr-2" />
                {reactions.filter((r: any) => r.type === "like").length}
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleReaction("dislike")}>
                <ThumbsDown className="w-4 h-4 mr-2" />
                {reactions.filter((r: any) => r.type === "dislike").length}
              </Button>
              <Button variant="outline" size="sm">
                <MessageSquare className="w-4 h-4 mr-2" />
                {comments.length}
              </Button>
            </div>
            <ShareDialog url={`/news/${news.id}`}>
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Поделиться
              </Button>
            </ShareDialog>
          </CardFooter>
        </Card>
        <CommentSection newsId={news.id} />
      </div>
  )
}

function LoadingState() {
  return (
      <div className="container max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-in fade-in-50">
        <Card className="overflow-hidden">
          <CardHeader>
            <Skeleton className="h-10 w-3/4 mb-4" />
            <div className="flex flex-wrap items-center gap-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-40" />
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="aspect-video w-full mb-6 rounded-lg" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-between border-t">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-9 w-16" />
              <Skeleton className="h-9 w-16" />
              <Skeleton className="h-9 w-16" />
            </div>
            <Skeleton className="h-9 w-28" />
          </CardFooter>
        </Card>
      </div>
  )
}

function ErrorState({ error }: { error: string }) {
  return (
      <div className="container max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Alert variant="destructive">
          <AlertTitle>Ошибка</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
  )
}

