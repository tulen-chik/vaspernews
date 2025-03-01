"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { getSessionFromCookie } from "@/utils/cookies"
import { supabase } from "@/lib/supabase"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, Edit, Trash2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { NewsEditor } from "../my/news/editor"

type Entity = "news" | "categories" | "profiles" | "comments" | "reactions"

export default function AdminPage() {
  const [session, setSession] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<Entity>("news")
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    const checkSession = async () => {
      const sessionData = getSessionFromCookie()
      setSession(sessionData)

      if (!sessionData?.user || sessionData.user.user_metadata.role !== "admin") {
        redirect("/")
      }
    }

    checkSession()
  }, [])

  useEffect(() => {
    fetchData(activeTab)
    fetchStats()
  }, [activeTab])

  const fetchData = async (entity: Entity) => {
    setLoading(true)
    setError(null)

    try {
      let query = supabase.from(entity).select("*")

      if (entity === "news") {
        // @ts-ignore
        query = query.select("*, profiles(username), news_categories(categories(name))")
      }

      const { data, error } = await query.order("created_at", { ascending: false })

      if (error) throw error

      setData(data)
    } catch (err) {
      console.error(`Error fetching ${entity}:`, err)
      setError(`Не удалось загрузить данные. Пожалуйста, попробуйте позже.`)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const [newsCount, categoriesCount, profilesCount, commentsCount, reactionsCount] = await Promise.all([
        supabase.from("news").select("*", { count: "exact", head: true }),
        supabase.from("categories").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("comments").select("*", { count: "exact", head: true }),
        supabase.from("reactions").select("*", { count: "exact", head: true }),
      ])

      setStats({
        news: newsCount.count,
        categories: categoriesCount.count,
        profiles: profilesCount.count,
        comments: commentsCount.count,
        reactions: reactionsCount.count,
      })
    } catch (err) {
      console.error("Error fetching stats:", err)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from(activeTab).delete().eq("id", id)

      if (error) throw error

      setData(data.filter((item) => item.id !== id))
      toast({
        title: "Запись удалена",
        description: "Запись успешно удалена",
      })
    } catch (err) {
      console.error("Error deleting item:", err)
      toast({
        title: "Ошибка",
        description: "Не удалось удалить запись",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <LoadingState />
  }

  if (error) {
    return <ErrorState error={error} />
  }

  return (
      <div className="container py-10">
        <h1 className="text-3xl font-bold mb-8">Панель администратора</h1>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
          <StatsCard title="Новости" value={stats?.news} />
          <StatsCard title="Категории" value={stats?.categories} />
          <StatsCard title="Пользователи" value={stats?.profiles} />
          <StatsCard title="Комментарии" value={stats?.comments} />
          <StatsCard title="Реакции" value={stats?.reactions} />
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as Entity)}>
          <TabsList>
            <TabsTrigger value="news">Новости</TabsTrigger>
            <TabsTrigger value="categories">Категории</TabsTrigger>
            <TabsTrigger value="profiles">Пользователи</TabsTrigger>
            <TabsTrigger value="comments">Комментарии</TabsTrigger>
            <TabsTrigger value="reactions">Реакции</TabsTrigger>
          </TabsList>

          <TabsContent value="news">
            <NewsTable data={data} onDelete={handleDelete} />
          </TabsContent>

          <TabsContent value="categories">
            <CategoriesTable data={data} onDelete={handleDelete} />
          </TabsContent>

          <TabsContent value="profiles">
            <ProfilesTable data={data} onDelete={handleDelete} />
          </TabsContent>

          <TabsContent value="comments">
            <CommentsTable data={data} onDelete={handleDelete} />
          </TabsContent>

          <TabsContent value="reactions">
            <ReactionsTable data={data} onDelete={handleDelete} />
          </TabsContent>
        </Tabs>
      </div>
  )
}

function StatsCard({ title, value }: { title: string; value: number | undefined }) {
  return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value ?? <Skeleton className="h-8 w-20" />}</div>
        </CardContent>
      </Card>
  )
}

function NewsTable({ data, onDelete }: { data: any[]; onDelete: (id: string) => void }) {
  return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Управление новостями</h2>
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
            {data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.title}</TableCell>
                  <TableCell>{item.profiles?.username}</TableCell>
                  <TableCell>{item.news_categories?.map((nc: any) => nc.categories.name).join(", ")}</TableCell>
                  <TableCell>{item.published ? "Опубликовано" : "Черновик"}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                          <DialogHeader>
                            <DialogTitle>Редактировать новость</DialogTitle>
                          </DialogHeader>
                          <NewsEditor news={item} />
                        </DialogContent>
                      </Dialog>
                      <Button variant="destructive" size="icon" onClick={() => onDelete(item.id)}>
                        <Trash2 className="h-4 w-4" />
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

function CategoriesTable({ data, onDelete }: { data: any[]; onDelete: (id: string) => void }) {
  return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Управление категориями</h2>
          <CreateCategoryDialog />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Название</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Дата создания</TableHead>
              <TableHead>Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.slug}</TableCell>
                  <TableCell>{new Date(item.created_at).toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <EditCategoryDialog category={item} />
                      <Button variant="destructive" size="icon" onClick={() => onDelete(item.id)}>
                        <Trash2 className="h-4 w-4" />
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

function ProfilesTable({ data, onDelete }: { data: any[]; onDelete: (id: string) => void }) {
  return (
      <div>
        <h2 className="text-2xl font-bold mb-4">Управление пользователями</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Имя пользователя</TableHead>
              <TableHead>Полное имя</TableHead>
              <TableHead>Веб-сайт</TableHead>
              <TableHead>Дата регистрации</TableHead>
              <TableHead>Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.username}</TableCell>
                  <TableCell>{item.full_name}</TableCell>
                  <TableCell>{item.website}</TableCell>
                  <TableCell>{new Date(item.created_at).toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <EditProfileDialog profile={item} />
                      <Button variant="destructive" size="icon" onClick={() => onDelete(item.id)}>
                        <Trash2 className="h-4 w-4" />
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

function CommentsTable({ data, onDelete }: { data: any[]; onDelete: (id: string) => void }) {
  return (
      <div>
        <h2 className="text-2xl font-bold mb-4">Управление комментариями</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Содержание</TableHead>
              <TableHead>ID новости</TableHead>
              <TableHead>ID автора</TableHead>
              <TableHead>Дата создания</TableHead>
              <TableHead>Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.content}</TableCell>
                  <TableCell>{item.news_id}</TableCell>
                  <TableCell>{item.author_id}</TableCell>
                  <TableCell>{new Date(item.created_at).toLocaleString()}</TableCell>
                  <TableCell>
                    <Button variant="destructive" size="icon" onClick={() => onDelete(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
  )
}

function ReactionsTable({ data, onDelete }: { data: any[]; onDelete: (id: string) => void }) {
  return (
      <div>
        <h2 className="text-2xl font-bold mb-4">Управление реакциями</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID новости</TableHead>
              <TableHead>ID пользователя</TableHead>
              <TableHead>Тип</TableHead>
              <TableHead>Дата создания</TableHead>
              <TableHead>Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.news_id}</TableCell>
                  <TableCell>{item.user_id}</TableCell>
                  <TableCell>{item.type}</TableCell>
                  <TableCell>{new Date(item.created_at).toLocaleString()}</TableCell>
                  <TableCell>
                    <Button variant="destructive" size="icon" onClick={() => onDelete(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
  )
}

function LoadingState() {
  return (
      <div className="container py-10">
        <Skeleton className="h-10 w-64 mb-8" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
          {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-20" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-20" />
                </CardContent>
              </Card>
          ))}
        </div>
        <Skeleton className="h-10 w-full mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
  )
}

function ErrorState({ error }: { error: string }) {
  return (
      <div className="container py-10">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Ошибка</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
  )
}

function CreateCategoryDialog() {
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { error } = await supabase.from("categories").insert({ name, slug })

      if (error) throw error

      toast({
        title: "Категория создана",
        description: "Новая категория успешно добавлена",
      })
    } catch (err) {
      console.error("Error creating category:", err)
      toast({
        title: "Ошибка",
        description: "Не удалось создать категорию",
        variant: "destructive",
      })
    }
  }

  return (
      <Dialog>
        <DialogTrigger asChild>
          <Button>Создать категорию</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать новую категорию</DialogTitle>
            <DialogDescription>Заполните форму для создания новой категории.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Название
                </Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="slug" className="text-right">
                  Slug
                </Label>
                <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Создать категорию</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
  )
}

function EditCategoryDialog({ category }: { category: any }) {
  const [name, setName] = useState(category.name)
  const [slug, setSlug] = useState(category.slug)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { error } = await supabase.from("categories").update({ name, slug }).eq("id", category.id)

      if (error) throw error

      toast({
        title: "Категория обновлена",
        description: "Изменения успешно сохранены",
      })
    } catch (err) {
      console.error("Error updating category:", err)
      toast({
        title: "Ошибка",
        description: "Не удалось обновить категорию",
        variant: "destructive",
      })
    }
  }

  return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon">
            <Edit className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать категорию</DialogTitle>
            <DialogDescription>Измените данные категории и нажмите "Сохранить" для обновления.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Название
                </Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="slug" className="text-right">
                  Slug
                </Label>
                <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Сохранить изменения</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
  )
}

function EditProfileDialog({ profile }: { profile: any }) {
  const [username, setUsername] = useState(profile.username)
  const [fullName, setFullName] = useState(profile.full_name)
  const [website, setWebsite] = useState(profile.website)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { error } = await supabase
          .from("profiles")
          .update({ username, full_name: fullName, website })
          .eq("id", profile.id)

      if (error) throw error

      toast({
        title: "Профиль обновлен",
        description: "Изменения успешно сохранены",
      })
    } catch (err) {
      console.error("Error updating profile:", err)
      toast({
        title: "Ошибка",
        description: "Не удалось обновить профиль",
        variant: "destructive",
      })
    }
  }

  return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon">
            <Edit className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать профиль</DialogTitle>
            <DialogDescription>Измените данные профиля и нажмите "Сохранить" для обновления.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="username" className="text-right">
                  Имя пользователя
                </Label>
                <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="fullName" className="text-right">
                  Полное имя
                </Label>
                <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="website" className="text-right">
                  Веб-сайт
                </Label>
                <Input id="website" value={website} onChange={(e) => setWebsite(e.target.value)} className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Сохранить изменения</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
  )
}

