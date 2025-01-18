"use client"
import { getSessionFromCookie } from '@/utils/cookies'
import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Card } from '@/components/ui/card'
import { ShareDialog } from '@/components/share-dialog'
import { Button } from '@/components/ui/button'
import { MessageSquare, ThumbsUp, ThumbsDown, Share2 } from 'lucide-react'
import { CommentSection } from '@/components/comment-section'
import { useEffect, useState } from 'react'

export default function NewsPage({ params }: { params: Promise<{ id: string }> }) {
  const [news, setNews] = useState<any | null>(null)
  const [author, setAuthor] = useState<any | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [comments, setComments] = useState<any[]>([])
  const [reactions, setReactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [id, setId] = useState<string | null>(null)

  const handleReaction = async (type: 'like' | 'dislike') => {
    if (!news) return;

    try {
      const { data, error } = await supabase
          .from('reactions')
          .insert({ news_id: news.id, user_id: '1', type })
          .single();

      if (error) throw error;
      setReactions([...reactions, data]);
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };


  useEffect(() => {
    const fetchParams = async () => {
      const resolvedParams = await params
      setId(resolvedParams.id)
    }
    fetchParams()
  }, [params])

  useEffect(() => {
    const fetchNewsData = async () => {
      if (!id) return; // Ensure id is set before fetching news

      try {
        // Fetch the main news data
        const { data: newsData, error: newsError } = await supabase
            .from('news')
            .select('*')
            .eq('id', id)
            .single()

        if (newsError) throw newsError
        setNews(newsData)

        // Fetch the author profile
        const { data: authorData, error: authorError } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', newsData.author_id)
            .single()

        if (authorError) throw authorError
        setAuthor(authorData)

        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
            .from('news_categories')
            .select('categories(name)')
            .eq('news_id', id)

        if (categoriesError) throw categoriesError
        setCategories(categoriesData.map((item: any) => item.categories.name))

        // Fetch comments
        const { data: commentsData, error: commentsError } = await supabase
            .from('comments')
            .select('*')
            .eq('news_id', id)

        if (commentsError) throw commentsError
        setComments(commentsData)

        // Fetch reactions
        const { data: reactionsData, error: reactionsError } = await supabase
            .from('reactions')
            .select('*')
            .eq('news_id', id)

        if (reactionsError) throw reactionsError
        setReactions(reactionsData)

      } catch (error) {
        console.error('Error fetching news data:', error)
        setError('Не удалось загрузить новость. Пожалуйста, попробуйте позже.')
      } finally {
        setLoading(false)
      }
    }

    fetchNewsData()
  }, [id]) // Fetch news data when id changes

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
      <div className="container max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Card className="overflow-hidden">
          <div className="p-6">
            <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-900">{news.title}</h1>
            <div className="flex items-center text-sm text-gray-600 mb-6">
              <span className="font-medium">{author?.username}</span>
              <span className="mx-2">•</span>
              <time>
                {formatDistanceToNow(new Date(news.created_at), {
                  locale: ru,
                  addSuffix: true,
                })}
              </time>
            </div>
            {news.image_url && (
                <div className="relative aspect-video mb-6 max-w-2xl mx-auto shadow-lg rounded-lg overflow-hidden">
                  <Image
                      src={news.image_url || "/placeholder.svg"}
                      alt={news.title}
                      fill
                      className="object-cover"
                  />
                </div>
            )}
            <div className="prose prose-lg max-w-none mb-8" dangerouslySetInnerHTML={{ __html: news.content }} />
            {news.video_url && (
                <div className="aspect-video mb-6">
                  <iframe
                      src={news.video_url}
                      className="w-full h-full"
                      allowFullScreen
                  />
                </div>
            )}
            <div className="flex items-center justify-between border-t border-gray-200 pt-4">
              <div className="flex items-center space-x-4">
                <Button variant="outline" size="sm" onClick={() => handleReaction('like')}>
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  {reactions.filter((r: any) => r.type === 'like').length}
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleReaction('dislike')}>
                  <ThumbsDown className="w-4 h-4 mr-2" />
                  {reactions.filter((r: any) => r.type === 'dislike').length}
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
            </div>
          </div>
        </Card>
        <CommentSection newsId={news.id} />
      </div>
  )
}

