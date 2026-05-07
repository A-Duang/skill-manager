export interface DetectedPlatform {
  id: string;
  name: string;
  icon: string;
  detected: boolean;
  skill_dir: string;
  skill_count: number;
}

export interface InstalledSkill {
  name: string;
  description: string;
  agents: string[];
  paths: Record<string, string>;
}

export interface SkillDetail {
  name: string;
  description: string;
  agents: string[];
  paths: Record<string, string>;
  content: string | null;
}

export interface AppStats {
  total_platforms: number;
  detected_platforms: number;
  total_skills: number;
}

export interface CopySkillResult {
  success: boolean;
  skill_name: string;
  files_copied: number;
  platforms_completed: string[];
  errors: string[];
}

export interface SyncResult {
  success: boolean;
  total_skills: number;
  files_copied: number;
  skills_synced: string[];
  skills_skipped: string[];
  platforms_completed: string[];
  errors: string[];
}

export interface GitHubSkill {
  name: string;
  description: string;
  path: string;
  repo: string;
}

export type Page = 'dashboard' | 'skills' | 'platforms' | 'matrix' | 'market' | 'settings';

export interface CustomSkillDir {
  name: string;
  path: string;
}

export interface CustomPlatform {
  id: string;
  name: string;
  icon: string;
  skill_path: string;
}

export interface AppConfig {
  default_scope: string;
  custom_skill_dirs: CustomSkillDir[];
  enabled_platforms: string[];
  theme: string;
  language: string;
  platform_overrides: Record<string, string>;
  custom_platforms: CustomPlatform[];
  github_token: string;
}
