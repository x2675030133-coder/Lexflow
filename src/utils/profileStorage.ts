import { getActiveScope, readScopedJson, writeScopedJson } from './scopedStorage';

export const PROFILE_CHANGED_EVENT = 'el-profile-changed';
const PROFILE_STORAGE_KEY = 'el_user_profile';

export interface StoredProfile {
  avatarDataUrl?: string;
}

export function getStoredProfile(scope: string | null | undefined = getActiveScope()): StoredProfile {
  return readScopedJson<StoredProfile>(PROFILE_STORAGE_KEY, {}, scope);
}

export function getStoredAvatar(scope: string | null | undefined = getActiveScope()): string {
  return getStoredProfile(scope).avatarDataUrl || '';
}

export function saveStoredProfile(profile: StoredProfile, scope: string | null | undefined = getActiveScope()): void {
  writeScopedJson(PROFILE_STORAGE_KEY, profile, scope);
  try {
    window.dispatchEvent(new Event(PROFILE_CHANGED_EVENT));
  } catch {
    // Ignore non-browser environments.
  }
}
