/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
*/
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'

import { SettingsSection } from '../components/settings-section'
import { useUpdateOption } from '../hooks/use-update-option'

type ContactMethod = {
  name: string
  description: string
  url: string
  icon: string
  qr_code: string
  enabled: boolean
  sort: number
}

function parseMethods(raw: string): ContactMethod[] {
  try {
    const parsed: unknown = JSON.parse(raw || '[]')
    if (!Array.isArray(parsed)) return []
    return parsed.map((rawItem, index) => {
      const item =
        rawItem && typeof rawItem === 'object'
          ? (rawItem as Record<string, unknown>)
          : {}
      return {
        name: typeof item.name === 'string' ? item.name : '',
        description: typeof item.description === 'string' ? item.description : '',
        url: typeof item.url === 'string' ? item.url : '',
        icon: typeof item.icon === 'string' ? item.icon : '',
        qr_code: typeof item.qr_code === 'string' ? item.qr_code : '',
        enabled: item.enabled !== false,
        sort: Number.isFinite(Number(item.sort)) ? Number(item.sort) : index,
      }
    })
  } catch {
    return []
  }
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return (
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      url.hostname !== '' &&
      !url.username &&
      !url.password
    )
  } catch {
    return false
  }
}

export function ContactMethodsSection({ data }: { data: string }) {
  const [methods, setMethods] = useState<ContactMethod[]>(() => parseMethods(data))
  const updateOption = useUpdateOption()

  useEffect(() => setMethods(parseMethods(data)), [data])

  const updateMethod = (index: number, patch: Partial<ContactMethod>) => {
    setMethods((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item
      )
    )
  }

  const moveMethod = (index: number, offset: number) => {
    setMethods((current) => {
      const target = index + offset
      if (target < 0 || target >= current.length) return current
      const next = [...current]
      const temporary = next[index]
      next[index] = next[target]
      next[target] = temporary
      return next.map((item, itemIndex) => ({ ...item, sort: itemIndex }))
    })
  }

  const save = async () => {
    const normalized = methods.map((item, index) => ({
      ...item,
      name: item.name.trim(),
      description: item.description.trim(),
      url: item.url.trim(),
      icon: item.icon.trim(),
      qr_code: item.qr_code.trim(),
      sort: index,
    }))
    const invalid = normalized.find(
      (item) =>
        item.enabled &&
        (!item.name ||
          !isHttpUrl(item.url) ||
          (item.qr_code !== '' && !isHttpUrl(item.qr_code)))
    )
    if (invalid) {
      toast.error(
        '已启用的联系方式需要填写名称和有效的 http(s) 链接；二维码图片地址也必须是 http(s) 链接。'
      )
      return
    }
    await updateOption.mutateAsync({
      key: 'ContactMethods',
      value: JSON.stringify(normalized),
    })
  }

  return (
    <SettingsSection title='首页悬浮客服联系方式'>
      <p className='text-sm text-muted-foreground'>
        配置首页右下角的客服入口。启用的项目会显示在前台；跳转链接和二维码图片地址仅支持 http(s)。
      </p>
      <div className='flex flex-col gap-4'>
        {methods.map((method, index) => (
          <div key={index} className='rounded-xl border p-4'>
            <div className='mb-3 flex items-center justify-between gap-3'>
              <div className='font-medium'>
                {method.name || `联系方式 ${index + 1}`}
              </div>
              <div className='flex items-center gap-1'>
                <Button
                  type='button'
                  size='icon'
                  variant='ghost'
                  aria-label='上移'
                  disabled={index === 0}
                  onClick={() => moveMethod(index, -1)}
                >
                  <ArrowUp className='size-4' />
                </Button>
                <Button
                  type='button'
                  size='icon'
                  variant='ghost'
                  aria-label='下移'
                  disabled={index === methods.length - 1}
                  onClick={() => moveMethod(index, 1)}
                >
                  <ArrowDown className='size-4' />
                </Button>
                <Button
                  type='button'
                  size='icon'
                  variant='ghost'
                  aria-label='删除'
                  onClick={() =>
                    setMethods((current) =>
                      current
                        .filter((_, itemIndex) => itemIndex !== index)
                        .map((item, itemIndex) => ({
                          ...item,
                          sort: itemIndex,
                        }))
                    )
                  }
                >
                  <Trash2 className='size-4' />
                </Button>
              </div>
            </div>
            <div className='grid gap-3 sm:grid-cols-2'>
              <label className='flex flex-col gap-1.5 text-sm'>
                名称
                <Input
                  value={method.name}
                  placeholder='例如：微信客服'
                  onChange={(event) =>
                    updateMethod(index, { name: event.target.value })
                  }
                />
              </label>
              <label className='flex flex-col gap-1.5 text-sm'>
                跳转链接
                <Input
                  type='url'
                  value={method.url}
                  placeholder='https://...'
                  onChange={(event) =>
                    updateMethod(index, { url: event.target.value })
                  }
                />
              </label>
              <label className='flex flex-col gap-1.5 text-sm'>
                说明
                <Input
                  value={method.description}
                  placeholder='例如：工作日 9:00-18:00'
                  onChange={(event) =>
                    updateMethod(index, { description: event.target.value })
                  }
                />
              </label>
              <label className='flex flex-col gap-1.5 text-sm'>
                图标文字（可选）
                <Input
                  value={method.icon}
                  placeholder='例如：💬'
                  onChange={(event) =>
                    updateMethod(index, { icon: event.target.value })
                  }
                />
              </label>
              <label className='flex flex-col gap-1.5 text-sm sm:col-span-2'>
                二维码图片地址（可选）
                <Input
                  type='url'
                  value={method.qr_code}
                  placeholder='https://.../wechat-qr.png'
                  onChange={(event) =>
                    updateMethod(index, { qr_code: event.target.value })
                  }
                />
              </label>
            </div>
            <div className='mt-3 flex items-center gap-2'>
              <Switch
                id={`contact-enabled-${index}`}
                checked={method.enabled}
                onCheckedChange={(checked) =>
                  updateMethod(index, { enabled: checked })
                }
              />
              <label
                htmlFor={`contact-enabled-${index}`}
                className='text-sm'
              >
                在首页显示
              </label>
            </div>
          </div>
        ))}
      </div>
      <div className='flex flex-wrap gap-2'>
        <Button
          type='button'
          variant='outline'
          onClick={() =>
            setMethods((current) => [
              ...current,
              {
                name: '',
                description: '',
                url: '',
                icon: '',
                qr_code: '',
                enabled: true,
                sort: current.length,
              },
            ])
          }
        >
          <Plus className='mr-2 size-4' />
          添加联系方式
        </Button>
        <Button type='button' onClick={save} disabled={updateOption.isPending}>
          {updateOption.isPending ? '保存中…' : '保存联系方式'}
        </Button>
      </div>
    </SettingsSection>
  )
}
