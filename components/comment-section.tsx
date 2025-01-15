'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import { getSessionFromCookie } from '@/utils/cookies'
import { toast } from "@/hooks/use-toast"
import {supabase} from "@/lib/supabase";

export function CommentSection({ newsId }: { newsId: string }) {
  const session = getSessionFromCookie()
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchComments()
  }, [])

  const fetchComments = async () => {
    const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .eq('news_id', newsId)
        .order('created_at', { ascending: false })

    if (commentsError) {
      console.error('Error fetching comments:', commentsError)
    } else {
      const commentsWithProfiles = await Promise.all(commentsData.map(async (comment) => {
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', comment.author_id)
            .single()

        if (profileError) {
          console.error('Error fetching profile:', profileError)
          return { ...comment, profiles: { username: 'Unknown', avatar_url: null } }
        }

        return { ...comment, profiles: profileData }
      }));

      setComments(commentsWithProfiles)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session) {
      toast({
        title: 'Необходима авторизация',
        description: 'Пожалуйста, войдите в систему, чтобы оставить комментарий',
        variant: 'destructive',
      })
      return
    }
    setLoading(true)
    const { error } = await supabase
        .from('comments')
        .insert({
          content: newComment,
          news_id: newsId,
          author_id: session.user.id,
        })

    if (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить комментарий',
        variant: 'destructive',
      })
    } else {
      setNewComment('')
      fetchComments()
      toast({
        title: 'Комментарий отправлен',
        description: 'Ваш комментарий успешно добавлен',
      })
    }
    setLoading(false)
  }

  return (
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Комментарии</h2>
        {session && (
            <form onSubmit={handleSubmitComment} className="mb-6">
              <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Оставьте свой комментарий..."
                  className="mb-2"
              />
              <Button type="submit" disabled={loading || !newComment.trim()}>
                {loading ? 'Отправка...' : 'Отправить комментарий'}
              </Button>
            </form>
        )}
        <div className="space-y-4">
          {comments.map((comment) => (
              <div key={comment.id} className="flex space-x-4">
                <Avatar>
                  <AvatarImage src={comment.profiles.avatar_url} />
                  <AvatarFallback>{comment.profiles.username[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold">{comment.profiles.username}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), {
                      locale: ru,
                      addSuffix: true,
                    })}
                  </div>
                  <div className="mt-1">{comment.content}</div>
                </div>
              </div>
          ))}
        </div>
      </div>
  )
}