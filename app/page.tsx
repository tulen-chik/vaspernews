import { supabase } from '@/lib/supabase'
import { NewsFeed } from '@/components/news-feed'
import { CategoryFilter } from '@/components/category-filter'

export default async function HomePage() {
  // Fetch categories
  const { data: categories } = await supabase
      .from('categories')
      .select('*')
      .order('name')

  // Fetch published news
  const { data: newsData, error: newsError } = await supabase
      .from('news')
      .select('id, title, image_url, created_at, author_id, published')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(20)

  if (newsError) {
    console.error('Error fetching news:', newsError)
    return (
        <div className="container py-6">
          <div className="text-center text-red-500">Не удалось загрузить новости.</div>
        </div>
    )
  }

  // Fetch profiles and other related data
  const newsWithDetails = await Promise.all(newsData.map(async (newsItem) => {
    const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', newsItem.author_id)
        .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return { ...newsItem, profiles: { username: 'Unknown' } }
    }

    // Fetch categories for this news item
    const { data: newsCategories, error: categoryError } = await supabase
        .from('news_categories')
        .select('categories(name)')
        .eq('news_id', newsItem.id)

    if (categoryError) {
      console.error('Error fetching categories:', categoryError)
      return { ...newsItem, profiles: profileData, news_categories: [] }
    }

    // Fetch comments count
    const { count: commentsCount } = await supabase
        .from('comments')
        .select('*', { count: 'exact' })
        .eq('news_id', newsItem.id)

    // Fetch reactions count
    const { count: reactionsCount } = await supabase
        .from('reactions')
        .select('*', { count: 'exact' })
        .eq('news_id', newsItem.id)

    return {
      ...newsItem,
      profiles: profileData,
      news_categories: newsCategories,
      comments: commentsCount,
      reactions: reactionsCount,
    }
  }))

  return (
      <div className="container py-6">
        <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-6">
          <aside className="space-y-6">
            <CategoryFilter categories={categories || []} />
          </aside>
          <main>
            <NewsFeed initialNews={newsWithDetails || []} />
          </main>
        </div>
      </div>
  )
}