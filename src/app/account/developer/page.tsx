'use client'

import { useState, useEffect, useCallback } from 'react'
import { Key, Webhook, Copy, Eye, EyeOff, Trash2, Plus, Globe, Check, AlertCircle, Code } from 'lucide-react'
import Header from '@/components/Header'
import toast from 'react-hot-toast'

interface ApiToken {
  id: string
  name: string
  tokenPrefix: string
  scopes: string[]
  lastUsedAt: string | null
  createdAt: string
}

interface WebhookEp {
  id: string
  url: string
  events: string[]
  isActive: boolean
  description: string
  lastTriggeredAt: string | null
  failureCount: number
}

const AVAILABLE_EVENTS = [
  'order.created', 'order.confirmed', 'order.shipped',
  'order.delivered', 'order.cancelled', 'payment.received',
  'quote.accepted', 'quote.replied',
]

const AVAILABLE_SCOPES = ['read:orders', 'read:products', 'read:invoices', 'write:quotes']

export default function DeveloperPage() {
  const [tokens, setTokens] = useState<ApiToken[]>([])
  const [webhooks, setWebhooks] = useState<WebhookEp[]>([])
  const [activeTab, setActiveTab] = useState<'tokens' | 'webhooks'>('tokens')
  const [newToken, setNewToken] = useState<{ rawToken: string; id: string } | null>(null)
  const [showCreateToken, setShowCreateToken] = useState(false)
  const [tokenName, setTokenName] = useState('')
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['read:orders', 'read:products'])
  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookDesc, setWebhookDesc] = useState('')
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['order.created', 'order.delivered'])
  const [loading, setLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const fetchTokens = useCallback(async () => {
    const res = await fetch('/api/v1/developer/tokens')
    if (res.ok) setTokens((await res.json()).tokens || [])
  }, [])

  const fetchWebhooks = useCallback(async () => {
    const res = await fetch('/api/v1/developer/webhooks')
    if (res.ok) setWebhooks((await res.json()).webhooks || [])
  }, [])

  useEffect(() => {
    fetchTokens()
    fetchWebhooks()
  }, [fetchTokens, fetchWebhooks])

  async function createToken() {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/developer/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tokenName, scopes: selectedScopes }),
      })
      const data = await res.json()
      setNewToken({ rawToken: data.token.rawToken, id: data.token.id })
      setShowCreateToken(false)
      setTokenName('')
      fetchTokens()
      toast.success('Đã tạo API Token!')
    } catch {
      toast.error('Có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  async function revokeToken(id: string) {
    await fetch(`/api/v1/developer/tokens?id=${id}`, { method: 'DELETE' })
    fetchTokens()
    toast.success('Đã thu hồi token')
  }

  async function createWebhook() {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/developer/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webhookUrl, events: selectedEvents, description: webhookDesc }),
      })
      if (res.ok) {
        setWebhookUrl('')
        setWebhookDesc('')
        fetchWebhooks()
        toast.success('Đã thêm Webhook Endpoint!')
      }
    } catch {
      toast.error('Có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  async function deleteWebhook(id: string) {
    await fetch(`/api/v1/developer/webhooks?id=${id}`, { method: 'DELETE' })
    fetchWebhooks()
    toast.success('Đã xóa webhook')
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
    toast.success('Đã sao chép!')
  }

  return (
    <div className="min-h-screen bg-slate-950 font-sans">
      <Header />

      <div className="max-w-5xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-xs font-bold uppercase tracking-widest mb-4">
            <Code className="w-3 h-3" />Developer Portal
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Tích hợp & API</h1>
          <p className="text-slate-500 mt-2">Kết nối SmartBuild với hệ thống ERP/Kế toán của bạn thông qua REST API và Webhooks.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-white/5 p-1 rounded-xl w-fit">
          {(['tokens', 'webhooks'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === tab
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'tokens' ? '🔑 API Tokens' : '🔗 Webhooks'}
            </button>
          ))}
        </div>

        {/* One-time token display */}
        {newToken && (
          <div className="mb-6 p-5 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-amber-400 font-bold mb-2">⚠️ Lưu token này ngay! Bạn sẽ không thể xem lại.</p>
                <div className="flex items-center gap-2 bg-slate-900 rounded-xl p-3 font-mono text-sm text-slate-200 border border-white/10">
                  <span className="flex-1 truncate">{newToken.rawToken}</span>
                  <button onClick={() => copyToClipboard(newToken.rawToken, 'raw')} className="p-1.5 hover:bg-white/10 rounded-lg">
                    {copiedId === 'raw' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                  </button>
                </div>
                <button onClick={() => setNewToken(null)} className="mt-3 text-xs text-slate-500 hover:text-slate-400">Đã lưu, đóng thông báo</button>
              </div>
            </div>
          </div>
        )}

        {/* API Tokens Tab */}
        {activeTab === 'tokens' && (
          <div className="space-y-4">
            {/* Base URL info */}
            <div className="p-5 bg-white/[0.02] border border-white/10 rounded-2xl">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Base URL</p>
              <div className="flex items-center gap-2 font-mono text-sm text-indigo-300">
                <Globe className="w-4 h-4" />
                {process.env.NEXT_PUBLIC_APP_URL || 'https://smartbuild.vn'}/api/v1
              </div>
              <p className="text-xs text-slate-600 mt-2">Thêm header: <code className="text-slate-400">Authorization: Bearer {'<'}your_token{'>'}</code></p>
            </div>

            <div className="flex justify-between items-center">
              <h2 className="text-white font-bold">API Tokens ({tokens.length})</h2>
              <button
                onClick={() => setShowCreateToken(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-all"
              >
                <Plus className="w-4 h-4" /> Tạo Token
              </button>
            </div>

            {/* Create form */}
            {showCreateToken && (
              <div className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                <input
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  placeholder="Tên token (VD: MISA Integration)"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500"
                />
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Phạm vi quyền</p>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_SCOPES.map((scope) => (
                      <button
                        key={scope}
                        onClick={() => setSelectedScopes(prev =>
                          prev.includes(scope) ? prev.filter(s => s !== scope) : [...prev, scope]
                        )}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                          selectedScopes.includes(scope)
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'border-white/10 text-slate-400 hover:border-white/30'
                        }`}
                      >
                        {scope}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={createToken}
                    disabled={!tokenName || loading}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl disabled:opacity-50 transition-all"
                  >
                    {loading ? 'Đang tạo...' : 'Tạo Token'}
                  </button>
                  <button onClick={() => setShowCreateToken(false)} className="px-5 py-2.5 text-slate-400 font-bold text-sm">Huỷ</button>
                </div>
              </div>
            )}

            {/* Token list */}
            {tokens.length === 0 ? (
              <div className="text-center py-16 text-slate-600">
                <Key className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Chưa có API token nào.</p>
              </div>
            ) : (
              tokens.map((token) => (
                <div key={token.id} className="p-5 bg-white/[0.02] border border-white/10 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-white font-bold">{token.name}</p>
                    <p className="text-sm font-mono text-slate-500 mt-1">{token.tokenPrefix}••••••••</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {token.scopes.map(s => (
                        <span key={s} className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[10px] font-bold rounded-md">{s}</span>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => revokeToken(token.id)} className="p-2 text-slate-600 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Webhooks Tab */}
        {activeTab === 'webhooks' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-white font-bold">Webhook Endpoints ({webhooks.length})</h2>
            </div>

            {/* Create webhook form */}
            <div className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-4">
              <h3 className="text-white font-bold">Thêm Endpoint Mới</h3>
              <input
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://your-erp.com/api/webhook"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-mono outline-none focus:border-indigo-500"
              />
              <input
                value={webhookDesc}
                onChange={(e) => setWebhookDesc(e.target.value)}
                placeholder="Mô tả (VD: MISA Webhook)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500"
              />
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Sự kiện đăng ký</p>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_EVENTS.map((event) => (
                    <button
                      key={event}
                      onClick={() => setSelectedEvents(prev =>
                        prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]
                      )}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                        selectedEvents.includes(event)
                          ? 'bg-green-600 border-green-600 text-white'
                          : 'border-white/10 text-slate-400 hover:border-white/30'
                      }`}
                    >
                      {event}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={createWebhook}
                disabled={!webhookUrl || !selectedEvents.length || loading}
                className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold text-sm rounded-xl disabled:opacity-50 transition-all"
              >
                <Plus className="w-4 h-4 inline mr-2" />
                {loading ? 'Đang lưu...' : 'Thêm Webhook'}
              </button>
            </div>

            {/* Webhook list */}
            {webhooks.length === 0 ? (
              <div className="text-center py-10 text-slate-600">
                <Webhook className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Chưa có webhook nào.</p>
              </div>
            ) : (
              webhooks.map((wh) => (
                <div key={wh.id} className="p-5 bg-white/[0.02] border border-white/10 rounded-2xl">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${wh.isActive ? 'bg-green-400' : 'bg-slate-600'}`} />
                        <p className="font-mono text-sm text-white truncate">{wh.url}</p>
                      </div>
                      {wh.description && <p className="text-xs text-slate-500 mb-2">{wh.description}</p>}
                      <div className="flex flex-wrap gap-1">
                        {wh.events.map(e => (
                          <span key={e} className="px-2 py-0.5 bg-green-500/10 text-green-400 text-[10px] font-bold rounded-md">{e}</span>
                        ))}
                      </div>
                      {wh.failureCount > 0 && (
                        <p className="text-xs text-red-400 mt-2">⚠️ {wh.failureCount} lần thất bại liên tiếp</p>
                      )}
                    </div>
                    <button onClick={() => deleteWebhook(wh.id)} className="p-2 text-slate-600 hover:text-red-400 transition-colors ml-4">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
