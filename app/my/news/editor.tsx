'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { getSessionFromCookie } from '@/utils/cookies'
import { supabase } from '@/lib/supabase'

interface Category {
    id: string
    name: string
}

interface NewsEditorProps {
    news?: any
}

export function NewsEditor({ news }: NewsEditorProps) {
    const router = useRouter()
    const [session, setSession] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [categories, setCategories] = useState<Category[]>([])
    const [selectedCategories, setSelectedCategories] = useState<string[]>(
        news?.news_categories?.map((nc: any) => nc.category_id) || []
    )

    useEffect(() => {
        const fetchSession = () => {
            const sessionData = getSessionFromCookie()
            setSession(sessionData)
        }

        fetchSession()
        fetchCategories()
    }, [])

    const fetchCategories = async () => {
        const { data } = await supabase
            .from('categories')
            .select('*')
            .order('name')

        if (data) {
            setCategories(data)
        }
    }

    const handleCategoryChange = (categoryId: string) => {
        setSelectedCategories(prev =>
            prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        )
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!session?.user) return

        setLoading(true)
        const formData = new FormData(e.currentTarget)

        try {
            let imageUrl = news?.image_url

            if (imageFile) {
                const fileExt = imageFile.name.split('.').pop()
                const fileName = `${Math.random()}.${fileExt}`
                const { error: uploadError } = await supabase.storage
                    .from('news-images')
                    .upload(fileName, imageFile)

                if (!uploadError) {
                    const { data: { publicUrl } } = supabase.storage
                        .from('news-images')
                        .getPublicUrl(fileName)

                    imageUrl = publicUrl
                } else {
                    console.error(uploadError)
                }
            }

            if (news?.id) {
                // Update existing news
                await supabase
                    .from('news')
                    .update({
                        title: formData.get('title'),
                        content: formData.get('content'),
                        image_url: imageUrl,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', news.id)

                // Update categories
                await supabase
                    .from('news_categories')
                    .delete()
                    .eq('news_id', news.id)

                if (selectedCategories.length > 0) {
                    await supabase
                        .from('news_categories')
                        .insert(
                            selectedCategories.map(categoryId => ({
                                news_id: news.id,
                                category_id: categoryId
                            }))
                        )
                }
            } else {
                // Create new news
                const { data: newsData, error: newsError } = await supabase
                    .from('news')
                    .insert({
                        title: formData.get('title'),
                        content: formData.get('content'),
                        image_url: imageUrl,
                        author_id: session.user.id,
                        published: true,
                    })
                    .select()
                    .single()

                if (!newsError && newsData) {
                    // Add categories
                    if (selectedCategories.length > 0) {
                        await supabase
                            .from('news_categories')
                            .insert(
                                selectedCategories.map(categoryId => ({
                                    news_id: newsData.id,
                                    category_id: categoryId
                                }))
                            )
                    }

                    // Initialize stats
                    await supabase
                        .from('news_stats')
                        .insert({
                            news_id: newsData.id,
                            views: 0,
                        })
                }
            }

            router.push('/my/news')
            router.refresh()
        } catch (error) {
            console.error('Error saving news:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex justify-center w-screen">
        <Card className="p-6 bg-pink-50">
            <h1 className="text-2xl font-bold mb-6">
                {news ? 'Редактировать публикацию' : 'Добавить публикацию'}
            </h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="title">Название публикации</Label>
                    <Input
                        id="title"
                        name="title"
                        defaultValue={news?.title}
                        required
                        className="bg-white"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="content">Описание</Label>
                    <Textarea
                        id="content"
                        name="content"
                        defaultValue={news?.content}
                        required
                        className="min-h-[200px] bg-white"
                    />
                </div>

                <div className="space-y-2">
                    <Label>Категории</Label>
                    <div className="grid grid-cols-2 gap-2">
                        {categories.map((category) => (
                            <div key={category.id} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`category-${category.id}`}
                                    checked={selectedCategories.includes(category.id)}
                                    onCheckedChange={() => handleCategoryChange(category.id)}
                                />
                                <Label htmlFor={`category-${category.id}`}>{category.name}</Label>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="image">Добавить картинку</Label>
                    <Input
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                        className="bg-white"
                    />
                </div>

                <div className="flex justify-end gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                    >
                        Отмена
                    </Button>
                    <Button
                        type="submit"
                        disabled={loading}
                        className="bg-pink-500 hover:bg-pink-600"
                    >
                        {loading ? 'Сохранение...' : 'Опубликовать'}
                    </Button>
                </div>
            </form>
        </Card>
        </div>
    )
}