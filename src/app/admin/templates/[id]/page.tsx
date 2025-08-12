'use client'

import React, { Suspense, useEffect, useMemo, useState } from 'react'
import { use } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CardLivePreview } from '@/components/unified/CardLivePreview'
import type { AuthoringPayload } from '@/lib/templates/types'
import { AuthoringSchema } from '@/lib/validation/authoring'
import { useAutosaveDraft } from '@/lib/hooks/use-autosave-draft'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ComponentErrorBoundary } from '@/components/shared/ErrorBoundary'
import { modernStyles, roleStyles } from '@/lib/design-tokens'

function LegacyTemplateEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [loading, setLoading] = useState(true)
  const [template, setTemplate] = useState<any>(null)
  const [versions, setVersions] = useState<any[]>([])
  const [authoring, setAuthoring] = useState<AuthoringPayload | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [activePlatform, setActivePlatform] = useState<'apple'|'google'|'pwa'>('apple')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/admin/templates/${id}`)
        const json = await res.json()
        if (mounted) {
          setTemplate(json.data?.template)
          setVersions(json.data?.versions || [])
          const latest = json.data?.versions?.[0]?.ui_payload
          setAuthoring(latest || null)
        }
      } finally {
        setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [id])

  async function saveDraft() {
    if (!authoring) return
    const parsed = AuthoringSchema.safeParse(authoring)
    if (!parsed.success) {
      setErrors(parsed.error.issues.map(i => i.message))
      return
    }
    await fetch(`/api/admin/templates/${id}/versions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uiPayload: parsed.data })
    })
  }

  async function publish() {
    if (!authoring) return
    const parsed = AuthoringSchema.safeParse(authoring)
    if (!parsed.success) {
      setErrors(parsed.error.issues.map(i => i.message))
      return
    }
    await fetch(`/api/admin/templates/${id}/versions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uiPayload: parsed.data, publish: true })
    })
  }

  // Autosave draft after debounce
  useAutosaveDraft(`tpl:${id}`, authoring, (v) => {
    if (!v) return
    const parsed = AuthoringSchema.safeParse(v)
    if (!parsed.success) return
    fetch(`/api/admin/templates/${id}/versions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uiPayload: parsed.data })
    }).catch(() => {})
  })

  const previewData = useMemo(() => {
    if (!authoring) return null
    return {
      cardType: authoring.type,
      businessName: authoring.businessName || 'Business',
      businessLogoUrl: authoring.businessLogoUrl,
      cardName: authoring.cardName,
      cardColor: authoring.cardColor,
      iconEmoji: authoring.iconEmoji,
      stampsRequired: authoring.stampsRequired || 10,
      reward: authoring.reward,
      cardDescription: authoring.cardDescription,
    }
  }, [authoring])

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Template Editor</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={saveDraft} disabled={!authoring}>Save draft</Button>
          <Button onClick={publish} disabled={!authoring}>Publish</Button>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="mb-4 text-sm text-red-600">
          {errors.map((e) => (
            <div key={e}>• {e}</div>
          ))}
        </div>
      )}

      {loading ? (
        <div>Loading...</div>
      ) : !template ? (
        <div>Template not found</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div>
                <label className="text-sm">Name</label>
                <Input value={template.name} onChange={() => {}} readOnly />
              </div>
              <Tabs defaultValue="meta">
                <TabsList>
                  <TabsTrigger value="meta">Meta</TabsTrigger>
                  <TabsTrigger value="versions">Versions</TabsTrigger>
                </TabsList>
                <TabsContent value="meta" className="pt-4 space-y-4">
              <div>
                <label className="text-sm">Card Name</label>
                <Input value={authoring?.cardName || ''} onChange={(e) => setAuthoring(a => ({ ...(a as any), cardName: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm">Emoji</label>
                <Input value={authoring?.iconEmoji || ''} onChange={(e) => setAuthoring(a => ({ ...(a as any), iconEmoji: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm">Color</label>
                <Input value={authoring?.cardColor || ''} onChange={(e) => setAuthoring(a => ({ ...(a as any), cardColor: e.target.value }))} />
              </div>
                </TabsContent>
                <TabsContent value="versions" className="pt-4">
                  <div className="space-y-2">
                    {versions.map(v => (
                      <div key={v.id} className="flex items-center justify-between border rounded-md p-3">
                        <div className="flex items-center gap-3">
                          <div className="text-sm font-medium">v{v.version}</div>
                          {v.is_published && <Badge>Published</Badge>}
                          <div className="text-xs text-gray-500">{new Date(v.created_at).toLocaleString()}</div>
                        </div>
                        <div className="flex gap-2">
                          {!v.is_published && (
                            <Button size="sm" onClick={async () => {
                              await fetch(`/api/admin/templates/${id}/versions`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ uiPayload: v.ui_payload, publish: true })
                              })
                            }}>Publish</Button>
                          )}
                          {v.is_published && (
                            <Button size="sm" variant="outline" onClick={async () => {
                              // Rollback: republish this ui_payload as a new version with publish
                              await fetch(`/api/admin/templates/${id}/versions`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ uiPayload: v.ui_payload, publish: true })
                              })
                            }}>Rollback to this</Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          <Card className="sticky top-6 h-fit">
            <CardContent className="p-6">
              {previewData && (
                <>
                  <div className="mb-3 flex items-center gap-2">
                    {(['apple','google','pwa'] as const).map(p => (
                      <button key={p} className={`px-3 py-1.5 rounded-md text-sm border ${activePlatform===p?'bg-white shadow-sm':'bg-gray-50'} border-gray-200`} onClick={()=>setActivePlatform(p)}>{p}</button>
                    ))}
                  </div>
                  <CardLivePreview cardData={previewData as any} defaultPlatform={activePlatform} showControls sticky />
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}


export default function TemplateEditorPage() {
  return (
    <ComponentErrorBoundary fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Template Detail Unavailable</h2>
          <p className="text-gray-600 mb-4">Unable to load the template detail</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            Reload Page
          </button>
        </div>
      </div>
    }>
      <div className={modernStyles.layout.container}>
        <LegacyTemplateEditorPage />
      </div>
    </ComponentErrorBoundary>
  )
}