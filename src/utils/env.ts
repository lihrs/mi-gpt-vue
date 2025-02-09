import globalCatch from "global-cache";

export const kEnvs = (): Partial<{
  MI_USER: string;
  MI_PASS: string;
  MI_DID: string;
  OPENAI_MODEL: string;
  OPENAI_API_KEY: string;
  OPENAI_BASE_URL: string;
  AZURE_OPENAI_API_KEY: string;
  AZURE_OPENAI_DEPLOYMENT: string;
  AUDIO_SILENT: string;
  AUDIO_BEEP: string;
  AUDIO_ACTIVE: string;
  AUDIO_ERROR: string;
  TTS_BASE_URL: string;
  QWEN_ENABLE_SEARCH: boolean;
}> => {
  return globalCatch.get('env') || {};
};

