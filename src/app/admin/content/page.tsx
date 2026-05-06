'use client'

import { useState } from 'react'
import { 
  BookOpen, HelpCircle, Layout, 
  FileText, Sparkles, MessageSquare, Megaphone
} from 'lucide-react'
import BlogManager from './components/BlogManager'
import HelpCenterManager from './components/HelpCenterManager'
import BannerManager from './components/BannerManager'
import AnnouncementManager from './components/AnnouncementManager'

const tabs = [
  { id: 'blog', label: 'Tin Tức & Blog', icon: FileText, description: 'Bài viết chia sẻ kiến thức & tin tức' },
  { id: 'help', label: 'FAQ & Hướng Dẫn', icon: HelpCircle, description: 'Trung tâm trợ giúp & hướng dẫn' },
  { id: 'banner', label: 'Banner Marketing', icon: Layout, description: 'Quản lý banner quảng bá trang chủ' },
  { id: 'announcement', label: 'Thông Báo Hệ Thống', icon: Megaphone, description: 'Thông báo, bảo trì & cập nhật' },
]

export default function ContentHubPage() {
  const [activeTab, setActiveTab] = useState('blog')

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="px-2 py-0.5 bg-purple-100 text-purple-600 text-[9px] font-black uppercase tracking-widest rounded-md">
              CMS Engine
            </div>
            <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase tracking-widest">
              <Sparkles size={12} className="text-amber-500" />
              SmartBuild Content Platform
            </div>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
            Quản Lý <span className="text-purple-600 italic">Nội Dung</span>
          </h1>
          <p className="text-sm text-slate-400 font-bold mt-1 tracking-wide uppercase">
            Hệ thống quản trị truyền thông & hỗ trợ tập trung
          </p>
        </div>

        <div className="flex items-center gap-4 text-slate-400">
            <div className="text-right hidden sm:block">
                <div className="text-[10px] font-black uppercase tracking-tighter">Bài viết mới tuần này</div>
                <div className="text-xl font-black text-slate-900">+12 bài</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100">
                <MessageSquare size={20} />
            </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative group p-6 rounded-[32px] border transition-all duration-500 overflow-hidden ${
                isActive 
                ? 'bg-purple-600 border-purple-600 shadow-2xl shadow-purple-500/30' 
                : 'bg-white border-slate-100 hover:border-purple-200 shadow-sm'
              }`}
            >
              <div className="relative z-10 flex items-center gap-4">
                <div className={`p-3 rounded-2xl transition-colors duration-500 ${
                  isActive ? 'bg-white/20 text-white' : 'bg-purple-50 text-purple-600 group-hover:bg-purple-100'
                }`}>
                  <tab.icon size={24} />
                </div>
                <div className="text-left">
                  <div className={`text-lg font-black uppercase tracking-tight ${isActive ? 'text-white' : 'text-slate-900'}`}>
                    {tab.label}
                  </div>
                  <div className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? 'text-white/70' : 'text-slate-400'}`}>
                    {tab.description}
                  </div>
                </div>
              </div>

              {isActive && (
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              )}
            </button>
          )
        })}
      </div>

      {/* Content Area */}
      <div className="bg-white/50 backdrop-blur-sm rounded-[40px] border border-white p-2 shadow-sm min-h-[600px]">
        <div className="bg-white rounded-[36px] border border-slate-100 p-8 shadow-sm">
          {activeTab === 'blog' && <BlogManager />}
          {activeTab === 'help' && <HelpCenterManager />}
          {activeTab === 'banner' && <BannerManager />}
          {activeTab === 'announcement' && <AnnouncementManager />}
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 py-4">
        <div className="h-px bg-slate-100 flex-1" />
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
          <Layout size={14} className="text-purple-400" />
          Content Management System v2.0
        </div>
        <div className="h-px bg-slate-100 flex-1" />
      </div>
    </div>
  )
}
