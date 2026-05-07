import { useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import { useTranslation } from '../../i18n';
import { invoke } from '@tauri-apps/api/core';
import type { GitHubSkill } from '../../types';

export function Market() {
  const { openGithubInstallDialog } = useAppStore();
  const t = useTranslation();
  const [repoUrl, setRepoUrl] = useState('');
  const [skills, setSkills] = useState<GitHubSkill[]>([]);
  const [fetching, setFetching] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetch = async () => {
    if (!repoUrl.trim()) return;
    setFetching(true);
    setError(null);
    setFetched(false);
    try {
      const result = await invoke<GitHubSkill[]>('fetch_github_skills', { repoUrl: repoUrl.trim() });
      setSkills(result);
      setFetched(true);
    } catch (e) {
      setError(String(e));
      setSkills([]);
    } finally {
      setFetching(false);
    }
  };

  const handleInstall = (skill: GitHubSkill) => {
    openGithubInstallDialog(skill.repo, skill.path);
  };

  return (
    <div className="h-full overflow-auto">
      <div className="mb-10">
        <h1 className="text-[32px] font-bold tracking-tight leading-tight" style={{ color: 'var(--fg)' }}>{t('market.title')}</h1>
        <p className="text-[14px] mt-2" style={{ color: 'var(--fg-secondary)' }}>{t('market.subtitle')}</p>
      </div>

      {/* Repo input */}
      <div className="flex gap-4 mb-10">
        <input
          type="text"
          placeholder={t('market.repoPlaceholder')}
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
          className="flex-1 max-w-lg px-5 py-3 border rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#007aff]/30 focus:border-[#007aff] transition-all"
          style={{ backgroundColor: 'var(--card)', borderColor: 'var(--separator)', color: 'var(--fg)' }}
        />
        <button onClick={handleFetch} disabled={fetching || !repoUrl.trim()} className="px-8 py-3 bg-[#007aff] text-white rounded-full text-[14px] font-medium hover:bg-[#0071e3] disabled:opacity-40 transition-colors shadow-sm">
          {fetching ? t('market.fetching') : t('market.fetch')}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-8 px-7 py-5 bg-[#ffe8e6] rounded-2xl text-[#ff3b30] text-[14px]">
          <span className="font-semibold">{t('market.fetchError')}</span>
          <span className="mx-2">—</span>
          <span>{error}</span>
        </div>
      )}

      {/* Results */}
      {fetched && !error && (
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-5">
            <h2 className="text-[17px] font-semibold" style={{ color: 'var(--fg)' }}>{t('market.searchResults')}</h2>
            <span className="text-[13px] px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--fg-tertiary)' }}>
              {skills.length} {t('market.skillsFound')}
            </span>
          </div>
          {skills.length === 0 ? (
            <div className="rounded-2xl shadow-sm p-7 text-center" style={{ backgroundColor: 'var(--card)' }}>
              <p className="text-[14px]" style={{ color: 'var(--fg-secondary)' }}>{t('market.noSkills')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-5">
              {skills.map((skill) => (
                <div key={skill.path} className="rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col" style={{ backgroundColor: 'var(--card)' }}>
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-[15px] font-semibold" style={{ color: 'var(--fg)' }}>{skill.name}</h3>
                    <span className="text-[11px] px-2 py-0.5 rounded-full flex-shrink-0 ml-2" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--fg-tertiary)' }}>{skill.repo}</span>
                  </div>
                  <p className="text-[13px] flex-1 leading-relaxed mb-5" style={{ color: 'var(--fg-secondary)' }}>{skill.description}</p>
                  <button
                    onClick={() => handleInstall(skill)}
                    className="w-full py-2.5 bg-[#007aff] text-white rounded-full text-[13px] font-medium hover:bg-[#0071e3] transition-colors shadow-sm"
                  >
                    {t('market.install')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
