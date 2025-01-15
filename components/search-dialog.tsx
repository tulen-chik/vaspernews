'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'

export function SearchDialog() {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setLoading(true)
    const { data, error } = await supabase
        .from('news')
        .select(`
        *,
        profiles:author_id(username),
        comments(count),
        reactions(count)
      `)
        .ilike('title', `%${searchQuery}%`)
        .order('created_at', { ascending: false })
        .limit(5)

    if (!error) {
      setSearchResults(data || [])
    }
    setLoading(false)
  }

  const handleResultClick = (id: string) => {
    setOpen(false)
    setSearchQuery('')
    setSearchResults([])
    router.push(`/news/${id}`)
  }

  return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Search className="h-4 w-4" />
            <span className="sr-only">Поиск</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Поиск новостей</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Input
                  type="search"
                  placeholder="Введите запрос..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-8"
              />
              {loading && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
              )}
            </div>
            <Button type="submit" disabled={loading || !searchQuery.trim()}>
              Найти
            </Button>
          </form>
          {searchResults.length > 0 && (
              <div className="mt-4 space-y-4">
                {searchResults.map((result) => (
                    <Button
                        key={result.id}
                        variant="ghost"
                        className="w-full p-4 h-auto flex flex-col items-start gap-2 text-left font-normal"
                        onClick={() => handleResultClick(result.id)}
                    >
                      <h3 className="font-semibold">{result.title}</h3>
                      <div className="text-sm text-muted-foreground">
                        <span>{result.profiles.username}</span>
                        <span className="mx-2">•</span>
                        <time>
                          {formatDistanceToNow(new Date(result.created_at), {
                            locale: ru,
                            addSuffix: true,
                          })}
                        </time>
                      </div>
                      <div className="text-sm text-muted-foreground flex gap-4">
                        <span>Комментарии: {result.comments[0]?.count || 0}</span>
                        <span>Реакции: {result.reactions[0]?.count || 0}</span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {result.content}
                      </p>
                    </Button>
                ))}
              </div>
          )}
        </DialogContent>
      </Dialog>
  )
}

