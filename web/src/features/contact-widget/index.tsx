import { useQuery } from '@tanstack/react-query'
import { Headset, MessageCircle, X } from 'lucide-react'
import { useState } from 'react'
import { api } from '@/lib/api'

type ContactMethod = {
  name: string
  description?: string
  url: string
  icon?: string
  qr_code?: string
}

export function ContactWidget() {
  const [open, setOpen] = useState(false)
  const { data: contacts = [] } = useQuery({
    queryKey: ['public-contact-methods'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: ContactMethod[] }>('/api/contact-methods')
      return response.data.data || []
    },
    staleTime: 60_000,
  })

  if (contacts.length === 0) return null

  return (
    <div className='fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3'>
      {open && (
        <section aria-label='客服联系方式' className='w-[min(22rem,calc(100vw-3rem))] rounded-xl border bg-background p-4 shadow-xl'>
          <div className='mb-3 flex items-center justify-between'>
            <h2 className='font-semibold'>联系客服</h2>
            <button type='button' aria-label='关闭联系方式' onClick={() => setOpen(false)} className='rounded p-1 hover:bg-muted'><X className='size-4' /></button>
          </div>
          <div className='flex flex-col gap-3'>
            {contacts.map((contact) => (
              <div key={contact.name + contact.url} className='flex items-start gap-3 rounded-lg border p-3'>
                {contact.qr_code ? (
                  <img src={contact.qr_code} alt={contact.name + '二维码'} referrerPolicy='no-referrer' className='size-16 shrink-0 rounded-md object-contain' />
                ) : (
                  <span className='flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary'>
                    {contact.icon || <MessageCircle className='size-5' />}
                  </span>
                )}
                <div className='min-w-0 flex-1'>
                  <div className='font-medium'>{contact.name}</div>
                  {contact.description && <p className='mt-0.5 break-words text-xs text-muted-foreground'>{contact.description}</p>}
                  <a href={contact.url} target='_blank' rel='noopener noreferrer' className='mt-2 inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline'>打开联系方式</a>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      <button type='button' aria-label={open ? '关闭客服联系方式' : '打开客服联系方式'} aria-expanded={open} onClick={() => setOpen((value) => !value)} className='flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105'>
        {open ? <X className='size-6' /> : <Headset className='size-6' />}
      </button>
    </div>
  )
}
