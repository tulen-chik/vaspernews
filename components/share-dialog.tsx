'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Copy, Check } from 'lucide-react'
import { useState } from 'react'
import Image from 'next/image'

const SHARE_BUTTONS = [
  {
    name: 'Telegram',
    icon: '/telegram.svg',
    getUrl: (url: string) => `https://t.me/share/url?url=${url}`,
  },
  {
    name: 'VK',
    icon: '/vk.svg',
    getUrl: (url: string) => `https://vk.com/share.php?url=${url}`,
  },
  {
    name: 'WhatsApp',
    icon: '/whatsapp.svg',
    getUrl: (url: string) => `https://wa.me/?text=${url}`,
  },
  {
    name: 'Viber',
    icon: '/viber.svg',
    getUrl: (url: string) => `viber://forward?text=${url}`,
  },
]

export function ShareDialog({ children, url }: { children: React.ReactNode; url: string }) {
  const [copied, setCopied] = useState(false)
  const fullUrl = `${window.location.origin}${url}`

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Поделиться новостью</DialogTitle>
        </DialogHeader>
        <div className="flex items-center space-x-2">
          <div className="grid flex-1 gap-2">
            <Input
              value={fullUrl}
              readOnly
              className="w-full"
            />
          </div>
          <Button 
            size="sm" 
            onClick={copyToClipboard}
            variant="secondary"
            className="px-3"
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            <span className="sr-only">Copy</span>
          </Button>
        </div>
        <div className="flex flex-wrap justify-center gap-4 py-4">
          {SHARE_BUTTONS.map((button) => (
            <Button
              key={button.name}
              variant="outline"
              size="icon"
              className="h-12 w-12"
              onClick={() => window.open(button.getUrl(fullUrl), '_blank')}
            >
              <Image
                src={button.icon || "/placeholder.svg"}
                alt={button.name}
                width={24}
                height={24}
                className="aspect-square"
              />
              <span className="sr-only">{button.name}</span>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

