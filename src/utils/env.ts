import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';
// 读取 YAML 配置文件
const fileContents = readFileSync('./data.yml', 'utf8');
// 解析 YAML 文件内容为 JavaScript 对象
const config = yaml.load(fileContents);

console.log(1111)
console.log(config)

export const kEnvs: Partial<{
  MI_USER: string;
  MI_PASS: string;
  MI_DID: string;
  OPENAI_MODEL: string;
  OPENAI_API_KEY: string;
  AZURE_OPENAI_API_KEY: string;
  AZURE_OPENAI_DEPLOYMENT: string;
}> = config as any;
