"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { NewsEditor } from "../../editor"
import { notFound } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

type Prop = Promise<{ id: string }>

export default function EditNewsPage({ params }: { params: Prop }) {
  const router = useRouter()
  const [id, setId] = useState<string | null>(null)
  const [news, setNews] = useState<any | null>(null)
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
        const { data, error } = await supabase.from("news").select("*").eq("id", id).single()

        if (error) throw error

        setNews(data)
      } catch (error) {
        console.error("Error fetching news:", error)
        setError("Не удалось загрузить информацию о новости. Пожалуйста, попробуйте позже.")
      } finally {
        setLoading(false)
      }
    }

    fetchNews()
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
      <div className="container py-6 max-w-2xl">
        <NewsEditor news={news} />
      </div>
  )
}

function LoadingState() {
  return (
      <div className="container py-6 max-w-2xl">
        <Card className="p-6 bg-gray-50 space-y-6">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-40 w-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <div className="grid grid-cols-2 gap-2">
              {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 w-24" />
                  </div>
              ))}
            </div>
          </div>
          <Skeleton className="h-10 w-full" />
          <div className="flex justify-end gap-4">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </Card>
      </div>
  )
}

function ErrorState({ error }: { error: string }) {
  return (
      <div className="container py-6 max-w-2xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Ошибка</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
  )
}

