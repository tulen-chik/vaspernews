"use client"
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Share2, MessageCircle, ThumbsUp, ThumbsDown } from 'lucide-react'
import { ShareDialog } from '@/components/share-dialog'
import { getSessionFromCookie } from '@/utils/cookies'
import { supabase } from '@/lib/supabase'

export function NewsFeed({ initialNews }: { initialNews: any[] }) {
  const [news, setNews] = useState(initialNews)
  const [reactions, setReactions] = useState<{ [key: string]: any[] }>({})
  const [session, setSession] = useState<any>(null) // Состояние для хранения информации о сессии

  useEffect(() => {
    const currentSession = getSessionFromCookie()
    setSession(currentSession)

    const fetchReactions = async () => {
      const { data: reactionsData, error } = await supabase
          .from('reactions')
          .select('*')
          .in('news_id', news.map(item => item.id))

      if (error) {
        console.error('Error fetching reactions:', error)
      } else {
        const reactionsMap = reactionsData.reduce((acc, reaction) => {
          if (!acc[reaction.news_id]) {
            acc[reaction.news_id] = []
          }
          acc[reaction.news_id].push(reaction)
          return acc
        }, {} as { [key: string]: any[] })

        setReactions(reactionsMap)
      }
    }

    fetchReactions()
  }, [news])

  const handleReaction = async (newsId: string, reactionType: 'like' | 'dislike') => {
    if (!session?.user) {
      alert('Пожалуйста, авторизуйтесь для добавления реакции.')
      return
    }

    try {
      const { data: existingReaction } = await supabase
          .from('reactions')
          .select('*')
          .eq('news_id', newsId)
          .eq('user_id', session.user.id)
          .single();

      if (existingReaction) {
        if (existingReaction.type === reactionType) {
          const { error: deleteError } = await supabase
              .from('reactions')
              .delete()
              .eq('id', existingReaction.id);

          if (deleteError) {
            console.error('Error deleting reaction:', deleteError);
          } else {
            setReactions(prev => {
              const updatedReactions = prev[newsId].filter(r => r.id !== existingReaction.id);
              return { ...prev, [newsId]: updatedReactions };
            });
          }
        } else {
          const { error: updateError } = await supabase
              .from('reactions')
              .update({ type: reactionType })
              .eq('id', existingReaction.id);

          if (updateError) {
            console.error('Error updating reaction:', updateError);
          } else {
            setReactions(prev => {
              const updatedReactions = prev[newsId].map(r =>
                  r.id === existingReaction.id ? { ...r, type: reactionType } : r
              );
              return { ...prev, [newsId]: updatedReactions };
            });
          }
        }
      } else {
        const { error: insertError } = await supabase
            .from('reactions')
            .insert({
              news_id: newsId,
              user_id: session.user.id,
              type: reactionType,
            });

        if (insertError) {
          console.error('Error adding reaction:', insertError);
        } else {
          setReactions(prev => {
            const updatedReactions = [...(prev[newsId] || []), { type: reactionType, user_id: session.user.id }];
            return { ...prev, [newsId]: updatedReactions };
          });
        }
      }
    } catch (error) {
      console.error('Error processing reaction:', error);
    }
  };

  return (
      <div className="space-y-4 md:space-y-6">
        {news.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <CardHeader className="space-y-2 p-4">
                <Link href={`/news/${item.id}`} className="block">
                  <h2 className="text-xl md:text-2xl font-bold hover:text-primary transition-colors">
                    {item.title}
                  </h2>
                </Link>
                <div className="flex items-center text-sm text-muted-foreground">
                  <span>{item.profiles.username}</span>
                  <span className="mx-2">•</span>
                  <time>
                    {formatDistanceToNow(new Date(item.created_at), {
                      locale: ru,
                      addSuffix: true,
                    })}
                  </time>
                </div>
              </CardHeader>
              {item.image_url && (
                  <CardContent className="p-0">
                    <div className="relative aspect-[16/9] overflow-hidden">
                      <Image
                          src={item.image_url || "/placeholder.svg"}
                          alt={item.title}
                          fill
                          className="object-cover transition-transform hover:scale-105"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          priority
                      />
                    </div>
                  </CardContent>
              )}
              <CardFooter className="flex flex-wrap items-center justify-between gap-2 p-4">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => handleReaction(item.id, 'like')}>
                    <ThumbsUp className="h-4 w-4 mr-1" />
                    <span className="text-sm">{reactions[item.id] ? reactions[item.id].filter((r: any) => r.type === 'like').length : 0}</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => handleReaction(item.id, 'dislike')}>
                    <ThumbsDown className="h-4 w-4 mr-1" />
                    <span className="text-sm">{reactions[item.id] ? reactions[item.id].filter((r: any) => r.type === 'dislike').length : 0}</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 px-2">
                    <MessageCircle className="h-4 w-4 mr-1" />
                    <span className="text-sm">{item.comments.length}</span>
                  </Button>
                </div>
                <ShareDialog url={`/news/${item.id}`}>
                  <Button variant="ghost" size="sm" className="h-8">
                    <Share2 className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Поделиться</span>
                  </Button>
                </ShareDialog>
              </CardFooter>
            </Card>
        ))}
      </div>
  )
}