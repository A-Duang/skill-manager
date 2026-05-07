import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../stores/appStore';
import { useTranslation } from '../../i18n';
import { invoke } from '@tauri-apps/api/core';
import type { SkillDetail } from '../../types';

export function MatrixView() {
  const { platforms, skills, loading, loadSkills, openInstallDialog, openBatchInstallDialog, setSelectedSkill, setPage, openSyncDialog } = useAppStore();
  const t = useTranslation();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'installed' | 'not-installed'>('all');
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set());
  const [hiddenPlatforms, setHiddenPlatforms] = useState<Set<string>>(new Set());
  const [columnsOpen, setColumnsOpen] = useState(false);
  const columnsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (columnsRef.current && !columnsRef.current.contains(e.target as Node)) setColumnsOpen(false);
    };
    if (columnsOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [columnsOpen]);

  const detectedPlatforms = platforms.filter((p) => p.detected);
  const visiblePlatforms = detectedPlatforms.filter((p) => !hiddenPlatforms.has(p.id));
  const filteredSkills = skills.filter((skill) => {
    if (search && !skill.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === 'installed') return skill.agents.length > 0;
    if (filter === 'not-installed') return skill.agents.length === 0;
    return true;
  });

  const toggleSkillSelection = (name: string) => {
    setSelectedSkills((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  const togglePlatform = (id: string) => {
    setHiddenPlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleCellClick = async (skillName: string, platformId: string) => {
    try {
      const detail = await invoke<SkillDetail>('get_skill_detail', { platform: platformId, skillName });
      setSelectedSkill(detail);
      setPage('skills');
    } catch {
      openInstallDialog(skillName);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-[32px] font-bold tracking-tight leading-tight" style={{ color: 'var(--fg)' }}>{t('matrix.title')}</h1>
          <p className="text-[14px] mt-2" style={{ color: 'var(--fg-secondary)' }}>{t('matrix.subtitle')}</p>
        </div>
        <button onClick={loadSkills} disabled={loading.skills} className="px-5 py-2 bg-[#007aff] text-white rounded-full text-[13px] font-medium hover:bg-[#0071e3] disabled:opacity-40 transition-colors shadow-sm">
          {loading.skills ? t('dashboard.refreshing') : t('dashboard.refresh')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex rounded-xl p-1" style={{ backgroundColor: 'var(--input-bg)' }}>
          {(['all', 'installed', 'not-installed'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${filter === f ? 'bg-[#007aff] text-white shadow-sm' : ''}`}
              style={filter !== f ? { color: 'var(--fg-secondary)' } : undefined}>
              {f === 'all' ? t('matrix.all') : f === 'installed' ? t('matrix.installed') : t('matrix.notInstalled')}
            </button>
          ))}
        </div>
        <input type="text" placeholder={t('dashboard.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="w-60 px-4 py-2 border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[#007aff]/30 focus:border-[#007aff] transition-all" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--separator)', color: 'var(--fg)' }} />
        <button onClick={openSyncDialog} className="px-4 py-2 rounded-xl text-[13px] font-medium border transition-colors hover:bg-[#007aff]/10" style={{ borderColor: 'var(--separator)', color: 'var(--fg-secondary)' }}>
          {t('sync.title')}
        </button>
        <div ref={columnsRef} className="relative">
          <button onClick={() => setColumnsOpen(!columnsOpen)} className="px-4 py-2 rounded-xl text-[13px] font-medium border transition-colors hover:bg-[#007aff]/10" style={{ borderColor: 'var(--separator)', color: 'var(--fg-secondary)' }}>
            {t('matrix.columns')} <span className="ml-1 text-[11px]" style={{ color: 'var(--fg-tertiary)' }}>{visiblePlatforms.length}/{detectedPlatforms.length}</span>
          </button>
          {columnsOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl shadow-lg z-50 border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--separator)' }}>
              <div className="flex items-center justify-between px-4 py-2 border-b" style={{ borderColor: 'var(--separator)' }}>
                <button onClick={() => setHiddenPlatforms(new Set())} className="text-[11px] font-medium" style={{ color: '#007aff' }}>{t('matrix.selectAll')}</button>
                <button onClick={() => setHiddenPlatforms(new Set(detectedPlatforms.map((p) => p.id)))} className="text-[11px] font-medium" style={{ color: '#007aff' }}>{t('matrix.deselectAll')}</button>
              </div>
              <div className="py-1 max-h-60 overflow-auto">
                {detectedPlatforms.map((p) => (
                  <label key={p.id} className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-[#007aff]/5 transition-colors">
                    <input type="checkbox" checked={!hiddenPlatforms.has(p.id)} onChange={() => togglePlatform(p.id)} className="w-4 h-4 rounded accent-[#007aff]" />
                    <span className="text-[13px]" style={{ color: 'var(--fg)' }}>{p.name}</span>
                    <span className="ml-auto text-[11px]" style={{ color: 'var(--fg-tertiary)' }}>{p.skill_count}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Matrix Table */}
      <div className="flex-1 overflow-auto rounded-2xl shadow-sm" style={{ backgroundColor: 'var(--card)' }}>
        <table className="w-full">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--separator)' }}>
              <th className="sticky left-0 text-left px-7 py-5 text-[11px] font-semibold uppercase tracking-wider min-w-[220px]" style={{ backgroundColor: 'var(--card)', color: 'var(--fg-secondary)' }}>Skill</th>
              {visiblePlatforms.map((p) => (
                <th key={p.id} className="px-5 py-5 text-center min-w-[110px]">
                  <div className="text-[13px] font-semibold" style={{ color: 'var(--fg)' }}>{p.name}</div>
                  <div className="text-[11px] font-normal mt-1" style={{ color: 'var(--fg-tertiary)' }}>{p.skill_count} {t('dashboard.skillsCount')}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredSkills.map((skill) => (
              <tr key={skill.name} className="border-b last:border-0 transition-colors" style={{ borderColor: 'var(--separator)' }}>
                <td className="sticky left-0 bg-inherit px-7 py-4">
                  <div className="flex items-center gap-4">
                    <input type="checkbox" checked={selectedSkills.has(skill.name)} onChange={() => toggleSkillSelection(skill.name)} className="w-4 h-4 rounded accent-[#007aff]" />
                    <div className="min-w-0">
                      <div className="text-[14px] font-medium truncate" style={{ color: 'var(--fg)' }}>{skill.name}</div>
                      <div className="text-[12px] truncate max-w-[200px] mt-0.5" style={{ color: 'var(--fg-secondary)' }}>{skill.description}</div>
                    </div>
                  </div>
                </td>
                {visiblePlatforms.map((p) => {
                  const isInstalled = skill.agents.includes(p.id);
                  return (
                    <td key={p.id} className="px-5 py-4 text-center">
                      <button onClick={() => handleCellClick(skill.name, p.id)} className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto transition-all duration-150 ${isInstalled ? 'bg-[#e8f9ed] text-[#34c759] hover:scale-110' : 'hover:bg-[#e5e5ea]'}`}
                        style={!isInstalled ? { backgroundColor: 'var(--input-bg)', color: 'var(--fg-tertiary)' } : undefined}>
                        <span className="text-[12px]">{isInstalled ? '✓' : '—'}</span>
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Batch Actions */}
      {selectedSkills.size > 0 && (
        <div className="mt-5 px-7 py-4 rounded-2xl shadow-sm flex items-center justify-between" style={{ backgroundColor: 'var(--card)' }}>
          <span className="text-[14px]" style={{ color: 'var(--fg-secondary)' }}>{t('matrix.selected')} <span className="font-semibold" style={{ color: 'var(--fg)' }}>{selectedSkills.size}</span> {t('dashboard.skillsCount')}</span>
          <button onClick={() => openBatchInstallDialog(Array.from(selectedSkills))} className="px-5 py-2 bg-[#007aff] text-white rounded-full text-[13px] font-medium hover:bg-[#0071e3] transition-colors shadow-sm">{t('matrix.installSelected')}</button>
        </div>
      )}
    </div>
  );
}
