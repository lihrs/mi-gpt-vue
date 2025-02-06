import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';
// 读取 YAML 配置文件
const fileContents = readFileSync('./env.yml', 'utf8');
// 解析 YAML 文件内容为 JavaScript 对象
const config = yaml.load(fileContents);

export const kEnvs: Partial<{
  MI_USER: string;
  MI_PASS: string;
  MI_DID: string;
  OPENAI_MODEL: string;
  OPENAI_API_KEY: string;
  OPENAI_BASE_URL: string;
  AZURE_OPENAI_API_KEY: string;
  AZURE_OPENAI_DEPLOYMENT: string;
  AUDIO_SILENT:string;
  AUDIO_BEEP:string;
  AUDIO_ACTIVE:string;
  AUDIO_ERROR:string;
  TTS_BASE_URL:string;
  QWEN_ENABLE_SEARCH: boolean;
}> = {
  ...config,
  QWEN_ENABLE_SEARCH: config.QWEN_ENABLE_SEARCH === 'true'
} as any;
