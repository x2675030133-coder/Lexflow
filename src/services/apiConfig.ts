export type AppConfig = {
  hasLiveNewsKeys: boolean;
  hasTranslationKey: boolean;
  hasDeepSeekKey: boolean;
};

const defaultConfig: AppConfig = {
  hasLiveNewsKeys: false,
  hasTranslationKey: false,
  hasDeepSeekKey: false,
};

let cachedConfig: AppConfig | null = null;

export async function fetchAppConfig(forceRefresh = false): Promise<AppConfig> {
  if (!forceRefresh && cachedConfig) {
    return cachedConfig;
  }

  const response = await fetch('/api/config');
  if (!response.ok) {
    throw new Error('Failed to load app config');
  }

  const config = { ...defaultConfig, ...(await response.json()) } as AppConfig;
  cachedConfig = config;
  return config;
}
