'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import type { AuthoringPayload } from '@/lib/templates/types'
import { useRouter } from 'next/navigation'
import { ComponentErrorBoundary } from '@/components/shared/ErrorBoundary'
import { getPageEnhancement, createErrorFallback } from '@/lib/design-consistency/page-enhancer'

function LegacyTemplatesIndexPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<{ businessId: string; name: string; type: 'stamp'|'membership' }>({ businessId: '', name: '', type: 'stamp' })

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/admin/templates')
      const json = await res.json()
      setTemplates(json.data || [])
    })()
  }, [])

  async function createTemplate() {
    setCreating(true)
    try {
      const uiPayload: AuthoringPayload = {
        cardName: form.name,
        businessId: form.businessId,
        type: form.type,
        cardColor: '#8B4513',
        iconEmoji: '☕',
        stampsRequired: 10,
        reward: 'Reward',
      }
      const res = await fetch('/api/admin/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: form.businessId, name: form.name, type: form.type, uiPayload })
      })
      const json = await res.json()
      if (json?.data?.template?.id) {
        router.push(`/admin/templates/${json.data.template.id}`)
      } else if (json?.data?.id === 'draft-local') {
        // fallback safe
        setOpen(false)
      }
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Templates</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>New Template</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-sm">Business ID</label>
                <Input value={form.businessId} onChange={(e)=>setForm(f=>({...f, businessId: e.target.value}))} placeholder="UUID" />
              </div>
              <div>
                <label className="text-sm">Name</label>
                <Input value={form.name} onChange={(e)=>setForm(f=>({...f, name: e.target.value}))} />
              </div>
              <div>
                <label className="text-sm">Type</label>
                <select className="w-full border rounded px-2 py-2" value={form.type} onChange={(e)=>setForm(f=>({...f, type: e.target.value as any}))}>
                  <option value="stamp">Stamp</option>
                  <option value="membership">Membership</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={createTemplate} disabled={creating}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">No templates found</CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map(tpl => (
            <Card key={tpl.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <div className="font-medium">{tpl.name}</div>
                  <div className="text-sm text-gray-600">{tpl.type}</div>
                </div>
                <Button size="sm" variant="outline" onClick={()=>router.push(`/admin/templates/${tpl.id}`)}>Edit</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default function TemplatesIndexPage() {
  const enhancement = getPageEnhancement('admin', 'management')
  
  return (
    <ComponentErrorBoundary fallback={createErrorFallback('admin', 'Template Management')}>
      <div className={enhancement.containerClass}>
        <LegacyTemplatesIndexPage />
      </div>
    </ComponentErrorBoundary>
  )
}

