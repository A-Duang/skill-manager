import { useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import { useTranslation } from '../../i18n';
import { invoke } from '@tauri-apps/api/core';
import type { SkillDetail, DetectedPlatform } from '../../types';
import { PlatformEditDialog } from '../PlatformEditDialog/PlatformEditDialog';

export function Dashboard() {
  const { platforms, skills, stats, loading, loadAll, setSelectedSkill, setPage } = useAppStore();
  const t = useTranslation();
  const detectedPlatforms = platforms.filter((p) => p.detected);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [editPlatform, setEditPlatform] = useState<DetectedPlatform | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const filteredByPlatform = selectedPlatform
    ? skills.filter((s) => s.agents.includes(selectedPlatform))
    : skills;

  const filteredSkills = filteredByPlatform.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) || s.description.toLowerCase().includes(search.toLowerCase())
  );

  const currentPlatform = selectedPlatform
    ? platforms.find((p) => p.id === selectedPlatform)
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

  const handleEditPlatform = (platform: DetectedPlatform, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditPlatform(platform);
    setEditDialogOpen(true);
  };

  const handleAddPlatform = () => {
    setEditPlatform(null);
    setAddDialogOpen(true);
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[32px] font-bold tracking-tight leading-tight" style={{ color: 'var(--fg)' }}>{t('dashboard.title')}</h1>
          <p className="text-[14px] mt-2" style={{ color: 'var(--fg-secondary)' }}>{t('dashboard.subtitle')}</p>
        </div>
        <button
          onClick={loadAll}
          disabled={loading.platforms || loading.skills}
          className="px-5 py-2 bg-[#007aff] text-white rounded-full text-[13px] font-medium hover:bg-[#0071e3] transition-colors disabled:opacity-40 shadow-sm"
        >
          {loading.platforms || loading.skills ? t('dashboard.refreshing') : t('dashboard.refresh')}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-5">
        <StatCard label={t('dashboard.detectedPlatforms')} value={stats?.detected_platforms ?? 0} total={stats?.total_platforms ?? 0} color="blue" />
        <StatCard label={t('dashboard.installedSkills')} value={stats?.total_skills ?? 0} color="green" />
      </div>

      {/* Detected Platforms */}
      <div>
        <h2 className="text-[17px] font-semibold mb-4" style={{ color: 'var(--fg)' }}>{t('dashboard.platformsSection')}</h2>
        {detectedPlatforms.length === 0 ? (
          <div className="rounded-2xl p-10 text-center shadow-sm" style={{ backgroundColor: 'var(--card)' }}>
            <p className="text-[14px]" style={{ color: 'var(--fg-secondary)' }}>{t('dashboard.noPlatforms')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            {detectedPlatforms.map((platform) => (
              <div
                key={platform.id}
                onClick={() => setSelectedPlatform(selectedPlatform === platform.id ? null : platform.id)}
                className={`rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer relative group ${
                  selectedPlatform === platform.id ? 'ring-2 ring-[#007aff] shadow-md' : ''
                }`}
                style={{ backgroundColor: 'var(--card)' }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xl">{getPlatformIcon(platform.icon)}</span>
                  <span className="text-[14px] font-medium truncate" style={{ color: 'var(--fg)' }}>{platform.name}</span>
                </div>
                <div className="text-[12px] text-[#34c759] font-medium">{t('dashboard.installed')}</div>
                <div className="text-[12px] mt-1" style={{ color: 'var(--fg-tertiary)' }}>{platform.skill_count} {t('dashboard.skillsCount')}</div>
                <button
                  onClick={(e) => handleEditPlatform(platform, e)}
                  className="absolute bottom-2 right-2 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                  style={{ backgroundColor: 'var(--input-bg)', color: 'var(--fg-tertiary)' }}
                  title="⚙"
                >
                  <span className="text-[11px]">⚙</span>
                </button>
              </div>
            ))}
            <div
              onClick={handleAddPlatform}
              className="rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border-2 border-dashed flex flex-col items-center justify-center min-h-[120px]"
              style={{ backgroundColor: 'var(--card)', borderColor: 'var(--separator)' }}
            >
              <span className="text-[24px] mb-2" style={{ color: 'var(--fg-tertiary)' }}>+</span>
              <span className="text-[13px]" style={{ color: 'var(--fg-secondary)' }}>{t('dashboard.addPlatform')}</span>
            </div>
          </div>
        )}
      </div>

      {/* Skills List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-[17px] font-semibold" style={{ color: 'var(--fg)' }}>
              {currentPlatform ? `${currentPlatform.name}${t('dashboard.platformSkills')}` : t('dashboard.allSkills')}
            </h2>
            {currentPlatform && (
              <button onClick={() => setSelectedPlatform(null)} className="px-2.5 py-1 bg-[#e8f2ff] text-[#007aff] text-[12px] font-medium rounded-full hover:bg-[#d0e4ff] transition-colors">
                {t('dashboard.clearFilter')}
              </button>
            )}
          </div>
          <span className="text-[13px]" style={{ color: 'var(--fg-secondary)' }}>{filteredSkills.length} {t('dashboard.skillsCount')}</span>
        </div>

        <div className="mb-5">
          <input
            type="text"
            placeholder={t('dashboard.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-sm px-5 py-2.5 border rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#007aff]/30 focus:border-[#007aff] transition-all"
            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--separator)', color: 'var(--fg)' }}
          />
        </div>

        {filteredSkills.length === 0 ? (
          <div className="rounded-2xl p-10 text-center shadow-sm" style={{ backgroundColor: 'var(--card)' }}>
            <p className="text-[14px]" style={{ color: 'var(--fg-secondary)' }}>
              {selectedPlatform ? t('dashboard.noSkillsForPlatform') : t('dashboard.noSkills')}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl shadow-sm overflow-hidden" style={{ backgroundColor: 'var(--card)' }}>
            {filteredSkills.map((skill, i) => (
              <div
                key={skill.name}
                onClick={() => handleViewDetail(skill)}
                className={`flex items-center justify-between px-7 py-5 cursor-pointer transition-colors ${
                  i < filteredSkills.length - 1 ? 'border-b' : ''
                }`}
                style={{ borderColor: 'var(--separator)' }}
              >
                <div className="min-w-0">
                  <div className="text-[14px] font-medium truncate" style={{ color: 'var(--fg)' }}>{skill.name}</div>
                  <div className="text-[12px] truncate mt-1" style={{ color: 'var(--fg-secondary)' }}>{skill.description || t('dashboard.noDescription')}</div>
                </div>
                <div className="flex gap-2 ml-6 flex-shrink-0">
                  {skill.agents.map((agent) => (
                    <span key={agent} className="px-2.5 py-1 bg-[#e8f2ff] text-[#007aff] text-[11px] font-medium rounded-full">{agent}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <PlatformEditDialog platform={editPlatform} open={editDialogOpen} onClose={() => setEditDialogOpen(false)} />
      <PlatformEditDialog platform={null} open={addDialogOpen} onClose={() => setAddDialogOpen(false)} />
    </div>
  );
}

function StatCard({ label, value, total, color }: { label: string; value: number | string; total?: number; color: 'blue' | 'green' | 'purple' }) {
  const colors = {
    blue: { text: '#007aff' },
    green: { text: '#34c759' },
    purple: { text: '#af52de' },
  };
  const c = colors[color];

  return (
    <div className="rounded-2xl p-7 shadow-sm" style={{ backgroundColor: 'var(--card)' }}>
      <div className="text-[12px] mb-3" style={{ color: 'var(--fg-secondary)' }}>{label}</div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-[36px] font-bold tracking-tight" style={{ color: c.text }}>{value}</span>
        {total !== undefined && <span className="text-[14px]" style={{ color: 'var(--fg-tertiary)' }}>/ {total}</span>}
      </div>
    </div>
  );
}

function getPlatformIcon(icon: string): string {
  const icons: Record<string, string> = {
    claude: '🤖', codex: '⚡', cursor: '🖱️', trae: '🎯',
    windsurf: '🌊', openclaw: '🦞', gemini: '💎', roo: '🦘',
    cline: '🔧', aider: '🛠️', continue: '▶️', 'amazon-q': '📦',
    copilot: '🧑‍💻', opencode: '📖', void: '🕳️', sweep: '🧹',
    'trae-solo': '🎯', workbuddy: '🤝', qclaw: '🦞',
    gptme: '💬', avante: '🚀', codecompanion: '🤝', agentops: '📊',
    folder: '📁',
  };
  return icons[icon] || '📦';
}
