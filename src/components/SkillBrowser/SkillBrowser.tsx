import { useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import { invoke } from '@tauri-apps/api/core';
import type { SkillDetail } from '../../types';

export function SkillBrowser() {
  const { skills, loading, loadSkills, openInstallDialog, setSelectedSkill, setPage, selectedPlatformFilter, setPlatformFilter, platforms } = useAppStore();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  const filteredByPlatform = selectedPlatformFilter
    ? skills.filter((s) => s.agents.includes(selectedPlatformFilter))
    : skills;

  const filteredSkills = filteredByPlatform.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) || s.description.toLowerCase().includes(search.toLowerCase())
  );

  const currentPlatform = selectedPlatformFilter
    ? platforms.find((p) => p.id === selectedPlatformFilter)
    : null;

  const handleViewDetail = async (skill: { name: string; agents: string[] }) => {
    if (skill.agents.length > 0) {
      try {
        const detail = await invoke<SkillDetail>('get_skill_detail', { platform: skill.agents[0], skillName: skill.name });
        setSelectedSkill(detail);
        setPage('skills');
      } catch (e) { console.error('Failed to load skill detail:', e); }
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="flex items-center gap-4">
            <h1 className="text-[32px] font-bold tracking-tight text-[#1d1d1f] leading-tight">Skills</h1>
            {currentPlatform && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#e8f2ff] rounded-full">
                <span className="text-[13px] font-medium text-[#007aff]">{currentPlatform.name}</span>
                <button onClick={() => setPlatformFilter(null)} className="text-[#007aff] hover:text-[#0056b3] text-[14px] font-medium ml-1">×</button>
              </div>
            )}
          </div>
          <p className="text-[14px] text-[#86868b] mt-2">{filteredSkills.length} 个{currentPlatform ? `${currentPlatform.name} 的` : '已安装的'} Skill</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-[#f0f0f2] rounded-xl p-1">
            <button onClick={() => setViewMode('card')} className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${viewMode === 'card' ? 'bg-white text-[#1d1d1f] shadow-sm' : 'text-[#86868b]'}`}>网格</button>
            <button onClick={() => setViewMode('list')} className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${viewMode === 'list' ? 'bg-white text-[#1d1d1f] shadow-sm' : 'text-[#86868b]'}`}>列表</button>
          </div>
          <button onClick={loadSkills} disabled={loading.skills} className="px-5 py-2 bg-[#007aff] text-white rounded-full text-[13px] font-medium hover:bg-[#0071e3] disabled:opacity-40 transition-colors shadow-sm">
            {loading.skills ? '刷新中...' : '刷新'}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input type="text" placeholder="搜索 Skill..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full max-w-sm px-5 py-2.5 bg-white border border-[#d2d2d7] rounded-xl text-[14px] text-[#1d1d1f] placeholder-[#aeaeb2] focus:outline-none focus:ring-2 focus:ring-[#007aff]/30 focus:border-[#007aff] transition-all" />
      </div>

      {/* Skills */}
      <div className="flex-1 overflow-auto">
        {filteredSkills.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-72">
            <span className="text-5xl mb-4">📦</span>
            <p className="text-[#86868b] text-[14px]">暂无已安装的 Skill</p>
          </div>
        ) : viewMode === 'card' ? (
          <div className="grid grid-cols-3 gap-5">
            {filteredSkills.map((skill) => (
              <div key={skill.name} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer" onClick={() => handleViewDetail(skill)}>
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-[15px] font-semibold text-[#1d1d1f] truncate">{skill.name}</h3>
                  <span className="text-[12px] text-[#aeaeb2] flex-shrink-0 ml-3">{skill.agents.length} 平台</span>
                </div>
                <p className="text-[13px] text-[#86868b] mb-4 line-clamp-2 leading-relaxed">{skill.description || '暂无描述'}</p>
                <div className="flex flex-wrap gap-2">
                  {skill.agents.slice(0, 3).map((agent) => (
                    <span key={agent} className="px-2.5 py-1 bg-[#e8f2ff] text-[#007aff] text-[11px] font-medium rounded-full">{agent}</span>
                  ))}
                  {skill.agents.length > 3 && <span className="px-2.5 py-1 bg-[#f2f2f7] text-[#aeaeb2] text-[11px] font-medium rounded-full">+{skill.agents.length - 3}</span>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {filteredSkills.map((skill, i) => (
              <div key={skill.name} className={`flex items-center justify-between px-7 py-5 cursor-pointer hover:bg-[#fafafa] transition-colors ${i < filteredSkills.length - 1 ? 'border-b border-[#e5e5ea]' : ''}`} onClick={() => handleViewDetail(skill)}>
                <div className="min-w-0">
                  <h3 className="text-[14px] font-medium text-[#1d1d1f] truncate">{skill.name}</h3>
                  <p className="text-[12px] text-[#86868b] truncate mt-1">{skill.description || '暂无描述'}</p>
                </div>
                <div className="flex items-center gap-4 ml-6 flex-shrink-0">
                  <div className="flex gap-2">
                    {skill.agents.slice(0, 3).map((agent) => (
                      <span key={agent} className="px-2.5 py-1 bg-[#e8f2ff] text-[#007aff] text-[11px] font-medium rounded-full">{agent}</span>
                    ))}
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); openInstallDialog(skill.name); }} className="px-4 py-1.5 bg-[#007aff] text-white rounded-full text-[12px] font-medium hover:bg-[#0071e3] shadow-sm">安装</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
