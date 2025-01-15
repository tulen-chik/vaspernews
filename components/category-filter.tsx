'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function CategoryFilter({ categories }: { categories: any[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentCategory = searchParams.get('category')

  const handleCategoryClick = (id: string) => {
    const params = new URLSearchParams(searchParams)
    if (currentCategory === id) {
      params.delete('category')
    } else {
      params.set('category', id)
    }
    router.push(`/?${params.toString()}`)
  }

  return (
      <div className="space-y-2">
        <h2 className="font-semibold">Категории</h2>
        <div className="space-y-1">
          {categories.map((category) => (
              <Button
                  key={category.id}
                  variant={currentCategory === category.id ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => handleCategoryClick(category.id)}
              >
                {category.name}
              </Button>
          ))}
        </div>
      </div>
  )
}

