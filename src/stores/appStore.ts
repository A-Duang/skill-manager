import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import type { DetectedPlatform, InstalledSkill, AppStats, Page, SkillDetail, AppConfig } from '../types';

interface AppState {
  // Navigation
  currentPage: Page;
  setPage: (page: Page) => void;

  // Selected skill for detail view
  selectedSkill: SkillDetail | null;
  setSelectedSkill: (skill: SkillDetail | null) => void;

  // Data
  platforms: DetectedPlatform[];
  skills: InstalledSkill[];
  stats: AppStats | null;
  config: AppConfig;
  selectedPlatformFilter: string | null;
  setPlatformFilter: (platformId: string | null) => void;

  // Loading states
  loading: {
    platforms: boolean;
    skills: boolean;
    stats: boolean;
  };

  // Actions
  loadPlatforms: () => Promise<void>;
  loadSkills: () => Promise<void>;
  loadStats: () => Promise<void>;
  loadAll: () => Promise<void>;
  loadConfig: () => Promise<void>;
  saveConfig: (config: AppConfig) => Promise<void>;

  // Install dialog
  installDialogOpen: boolean;
  installDialogSkill: string | null;
  installDialogSkills: string[];
  installDialogGithub: { repo: string; path: string } | null;
  openInstallDialog: (skillName?: string) => void;
  openBatchInstallDialog: (skillNames: string[]) => void;
  openGithubInstallDialog: (repo: string, path: string) => void;
  closeInstallDialog: () => void;

  // Sync dialog
  syncDialogOpen: boolean;
  openSyncDialog: () => void;
  closeSyncDialog: () => void;
}

const defaultConfig: AppConfig = {
  default_scope: 'global',
  custom_skill_dirs: [],
  enabled_platforms: [],
  theme: 'light',
  language: 'zh',
  platform_overrides: {},
  custom_platforms: [],
  github_token: '',
};

export const useAppStore = create<AppState>((set, get) => ({
  currentPage: 'dashboard',
  setPage: (page) => set({ currentPage: page }),

  selectedSkill: null,
  setSelectedSkill: (skill) => set({ selectedSkill: skill }),

  platforms: [],
  skills: [],
  stats: null,
  config: defaultConfig,
  selectedPlatformFilter: null,
  setPlatformFilter: (platformId) => set({ selectedPlatformFilter: platformId }),

  loading: {
    platforms: false,
    skills: false,
    stats: false,
  },

  loadPlatforms: async () => {
    set((s) => ({ loading: { ...s.loading, platforms: true } }));
    try {
      const platforms = await invoke<DetectedPlatform[]>('scan_platforms');
      set({ platforms });
    } catch (e) {
      console.error('Failed to load platforms:', e);
    } finally {
      set((s) => ({ loading: { ...s.loading, platforms: false } }));
    }
  },

  loadSkills: async () => {
    set((s) => ({ loading: { ...s.loading, skills: true } }));
    try {
      const skills = await invoke<InstalledSkill[]>('list_installed_skills');
      set({ skills });
    } catch (e) {
      console.error('Failed to load skills:', e);
    } finally {
      set((s) => ({ loading: { ...s.loading, skills: false } }));
    }
  },

  loadStats: async () => {
    set((s) => ({ loading: { ...s.loading, stats: true } }));
    try {
      const stats = await invoke<AppStats>('get_stats');
      set({ stats });
    } catch (e) {
      console.error('Failed to load stats:', e);
    } finally {
      set((s) => ({ loading: { ...s.loading, stats: false } }));
    }
  },

  loadConfig: async () => {
    try {
      const config = await invoke<AppConfig>('load_config');
      set({ config });
    } catch (e) {
      console.error('Failed to load config:', e);
    }
  },

  saveConfig: async (config: AppConfig) => {
    try {
      await invoke('save_config', { config });
      set({ config });
    } catch (e) {
      console.error('Failed to save config:', e);
    }
  },

  loadAll: async () => {
    const state = get();
    await Promise.all([
      state.loadPlatforms(),
      state.loadSkills(),
      state.loadStats(),
      state.loadConfig(),
    ]);
  },

  installDialogOpen: false,
  installDialogSkill: null,
  installDialogSkills: [],
  installDialogGithub: null,
  openInstallDialog: (skillName) =>
    set({ installDialogOpen: true, installDialogSkill: skillName || null, installDialogSkills: [], installDialogGithub: null }),
  openBatchInstallDialog: (skillNames) =>
    set({ installDialogOpen: true, installDialogSkill: null, installDialogSkills: skillNames, installDialogGithub: null }),
  openGithubInstallDialog: (repo, path) =>
    set({ installDialogOpen: true, installDialogSkill: null, installDialogSkills: [], installDialogGithub: { repo, path } }),
  closeInstallDialog: () =>
    set({ installDialogOpen: false, installDialogSkill: null, installDialogSkills: [], installDialogGithub: null }),

  syncDialogOpen: false,
  openSyncDialog: () => set({ syncDialogOpen: true }),
  closeSyncDialog: () => set({ syncDialogOpen: false }),
}));
