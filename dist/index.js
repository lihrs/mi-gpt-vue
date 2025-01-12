import * as fs from 'fs';
import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';
import path__default from 'path';
import * as crypto from 'crypto';
import { randomUUID } from 'crypto';
import axios from 'axios';
import * as pako from 'pako';
import OpenAI, { AzureOpenAI } from 'openai';
import { ProxyAgent } from 'proxy-agent';
import { PrismaClient } from '@prisma/client';
import fs2 from 'fs-extra';
import { exec as exec$1 } from 'child_process';
import { promisify } from 'util';

// src/utils/is.ts
function isNaN(e) {
  return Number.isNaN(e);
}
function isNullish(e) {
  return e === null || e === undefined;
}
function isNotNullish(e) {
  return !isNullish(e);
}
function isString(e) {
  return typeof e === "string";
}
function isArray(e) {
  return Array.isArray(e);
}
function isObject(e) {
  return typeof e === "object" && isNotNullish(e);
}
function isEmpty(e) {
  if ((e == null ? undefined : e.size) ?? 0 > 0) return false;
  return isNaN(e) || isNullish(e) || isString(e) && (e.length < 1 || !/\S/.test(e)) || isArray(e) && e.length < 1 || isObject(e) && Object.keys(e).length < 1;
}
function isNotEmpty(e) {
  return !isEmpty(e);
}

// src/utils/parse.ts
function cleanJsonAndDecode(input) {
  if (input == undefined) return undefined;
  const pattern = /(\{[\s\S]*?"\s*:\s*[\s\S]*?})/;
  const match = input.match(pattern);
  if (!match) {
    return undefined;
  }
  return jsonDecode(match[0]);
}
function jsonEncode(obj, options) {
  const { prettier } = options ?? {};
  try {
    return prettier ? JSON.stringify(obj, void 0, 4) : JSON.stringify(obj);
  } catch (error) {
    return undefined;
  }
}
function jsonDecode(json) {
  if (json == undefined) return undefined;
  try {
    return JSON.parse(json);
  } catch (error) {
    return undefined;
  }
}

// src/utils/base.ts
async function sleep(time) {
  return new Promise((resolve2) => setTimeout(resolve2, time));
}
function firstOf(datas) {
  return datas ? datas.length < 1 ? undefined : datas[0] : undefined;
}
function lastOf(datas) {
  return datas ? datas.length < 1 ? undefined : datas[datas.length - 1] : undefined;
}
function randomInt(min, max) {
  if (!max) {
    max = min;
    min = 0;
  }
  return Math.floor(Math.random() * (max - min + 1) + min);
}
function pickOne(datas) {
  return datas.length < 1 ? undefined : datas[randomInt(datas.length - 1)];
}
function clamp(num, min, max) {
  return num < max ? num > min ? num : min : max;
}
function toSet(datas, byKey) {
  return Array.from(new Set(datas));
}
function withDefault(e, defaultValue) {
  return isEmpty(e) ? defaultValue : e;
}
function removeEmpty(data) {
  if (!data) {
    return data;
  }
  if (Array.isArray(data)) {
    return data.filter((e) => e != undefined);
  }
  const res = {};
  for (const key in data) {
    if (data[key] != undefined) {
      res[key] = data[key];
    }
  }
  return res;
}
var deepClone = (obj) => {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }
  if (Array.isArray(obj)) {
    const copy2 = [];
    obj.forEach((item, index) => {
      copy2[index] = deepClone(item);
    });
    return copy2;
  }
  const copy = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      copy[key] = deepClone(obj[key]);
    }
  }
  return copy;
};

// src/utils/retry.ts
var fastRetry = (speaker, tag, maxRetry = 10) => {
  let failed = 0;
  return {
    onResponse(resp) {
      if (resp == null) {
        failed += 1;
        if (failed > maxRetry) {
          speaker.logger.error(`\u83B7\u53D6${tag}\u5F02\u5E38`);
          return "break";
        }
        if (speaker.debug) {
          speaker.logger.error(`\u83B7\u53D6${tag}\u5931\u8D25\uFF0C\u6B63\u5728\u91CD\u8BD5: ${failed}`);
        }
        return "retry";
      } else {
        failed = 0;
      }
      return "continue";
    }
  };
};

// package.json
var version = "1.0.0";

// src/utils/string.ts
var kVersion = version;
var kAreYouOK = "\xBF\u029E\u043E \u2229\u043E\u028E \u01DD\u0279\u0250";
var kBannerASCII = `

/ $$      /$$ /$$   /$$$$$$  /$$$$$$$ /$$$$$$$$$
| $$$    /$$$|__/ /$$__  $$| $$__  $$|__  $$__/
| $$$$  /$$$$ /$$| $$  \\__/| $$  \\ $$   | $$   
| $$ $$/$$ $$| $$| $$ /$$$$| $$$$$$$/   | $$   
| $$  $$$| $$| $$| $$|_  $$| $$____/    | $$   
| $$\\  $ | $$| $$| $$  \\ $$| $$         | $$   
| $$ \\/  | $$| $$|  $$$$$$/| $$         | $$   
|__/     |__/|__/ \\______/ |__/         |__/                         
                                                                                                                 
         MiGPT v1.0.0  by: del.wang

`.replace("1.0.0", kVersion);
var kBannerEnd = `
 /$$$$$$  /$$$$$$$   /$$$$$$$
/$$__  $$| $$__  $$ /$$__  $$
| $$$$$$$$| $$   $$| $$  | $$
| $$_____/| $$  | $$| $$  | $$
|  $$$$$$$| $$  | $$|  $$$$$$$
_______/|__/  |__/ _______/
                                
`;
function toUTC8Time(date) {
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    weekday: "long",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Shanghai"
  });
}
function buildPrompt(template, variables) {
  for (const key in variables) {
    const value = variables[key];
    template = template.replaceAll(`{{${key}}}`, value);
  }
  return template;
}
function formatMsg(msg) {
  const { name, text, timestamp } = msg;
  return `${toUTC8Time(new Date(timestamp))} ${name}: ${text}`;
}
function formatDateTime(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
}
function removeEmojis(text) {
  const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
  return text.replace(emojiRegex, "");
}
var fileContents = readFileSync("./env.yml", "utf8");
var config = yaml.load(fileContents);
var kEnvs = config;

// src/mi-service-lite/utils/json.ts
function jsonEncode2(obj, options) {
  const { prettier } = options ?? {};
  try {
    return prettier ? JSON.stringify(obj, void 0, 4) : JSON.stringify(obj);
  } catch (error) {
    return undefined;
  }
}
function jsonDecode2(json) {
  if (json == undefined) return undefined;
  try {
    return JSON.parse(json);
  } catch (error) {
    return undefined;
  }
}

// src/mi-service-lite/utils/io.ts
process.cwd();
process.env;
var readFile2 = (filePath, options) => {
  const dirname2 = path.dirname(filePath);
  if (!fs.existsSync(dirname2)) {
    return undefined;
  }
  return new Promise((resolve2) => {
    fs.readFile(filePath, options, (err, data) => {
      resolve2(err ? undefined : data);
    });
  });
};
var writeFile2 = (filePath, data, options) => {
  const dirname2 = path.dirname(filePath);
  if (!fs.existsSync(dirname2)) {
    fs.mkdirSync(dirname2, { recursive: true });
  }
  return new Promise((resolve2) => {
    {
      fs.writeFile(filePath, data, options, (err) => {
        resolve2(err ? false : true);
      });
    }
  });
};
var readJSON = async (filePath) => jsonDecode2(await readFile2(filePath, "utf8"));
var writeJSON = (filePath, content) => writeFile2(filePath, jsonEncode2(content) ?? "", "utf8");
function md5(s) {
  return crypto.createHash("md5").update(s).digest("hex");
}
function sha1(s) {
  return crypto.createHash("sha1").update(s).digest("base64");
}
function signNonce(ssecurity, nonce) {
  let m = crypto.createHash("sha256");
  m.update(ssecurity, "base64");
  m.update(nonce, "base64");
  return m.digest().toString("base64");
}
function uuid() {
  return crypto.randomUUID();
}
function randomNoice() {
  return Buffer.from(
    Array(12).fill(0).map(() => Math.floor(Math.random() * 256))
  ).toString("base64");
}

// src/mi-service-lite/utils/is.ts
function isNaN2(e) {
  return Number.isNaN(e);
}
function isNullish2(e) {
  return e === null || e === undefined;
}
function isNotNullish2(e) {
  return !isNullish2(e);
}
function isString2(e) {
  return typeof e === "string";
}
function isArray2(e) {
  return Array.isArray(e);
}
function isObject2(e) {
  return typeof e === "object" && isNotNullish2(e);
}
function isEmpty2(e) {
  if ((e == null ? undefined : e.size) ?? 0 > 0) return false;
  return isNaN2(e) || isNullish2(e) || isString2(e) && (e.length < 1 || !/\S/.test(e)) || isArray2(e) && e.length < 1 || isObject2(e) && Object.keys(e).length < 1;
}
function isNotEmpty2(e) {
  return !isEmpty2(e);
}

// src/mi-service-lite/utils/debug.ts
var Debugger = {
  enableTrace: false
};

// src/mi-service-lite/utils/base.ts
var sleep2 = async (time) => new Promise((resolve2) => setTimeout(resolve2, time));
function clamp2(n, min, max) {
  return Math.max(min, Math.min(n, max));
}

// src/mi-service-lite/utils/http.ts
var _baseConfig = {
  proxy: false,
  decompress: true,
  headers: {
    "Accept-Encoding": "gzip, deflate",
    "Content-Type": "application/x-www-form-urlencoded",
    "User-Agent": "Dalvik/2.1.0 (Linux; U; Android 10; RMX2111 Build/QP1A.190711.020) APP/xiaomi.mico APPV/2004040 MK/Uk1YMjExMQ== PassportSDK/3.8.3 passport-ui/3.8.3"
  }
};
var _http = axios.create(_baseConfig);
_http.interceptors.response.use(
  (res) => {
    if (res.config.rawResponse) {
      return res;
    }
    return res.data;
  },
  async (err) => {
    var _a, _b, _c, _d, _e;
    const newResult = await tokenRefresher.refreshTokenAndRetry(err);
    if (newResult) {
      return newResult;
    }
    const error = ((_b = (_a = err.response) == null ? undefined : _a.data) == null ? undefined : _b.error) || ((_c = err.response) == null ? undefined : _c.data);
    const request = {
      method: err.config.method,
      url: err.config.url,
      headers: jsonEncode2(err.config.headers),
      data: jsonEncode2({ body: err.config.data })
    };
    const response = !err.response ? undefined : {
      url: err.config.url,
      status: err.response.status,
      headers: jsonEncode2(err.response.headers),
      data: jsonEncode2({ body: err.response.data })
    };
    return {
      isError: true,
      code: (error == null ? undefined : error.code) || ((_d = err.response) == null ? undefined : _d.status) || err.code || "\u672A\u77E5",
      message: (error == null ? undefined : error.message) || ((_e = err.response) == null ? undefined : _e.statusText) || err.message || "\u672A\u77E5",
      error: { request, response }
    };
  }
);
var HTTPClient = class _HTTPClient {
  // 默认 3 秒超时
  timeout = 3 * 1e3;
  async get(url, query, config2) {
    if (config2 === undefined) {
      config2 = query;
      query = undefined;
    }
    return _http.get(
      _HTTPClient.buildURL(url, query),
      _HTTPClient.buildConfig(config2)
    );
  }
  async post(url, data, config2) {
    return _http.post(url, data, _HTTPClient.buildConfig(config2));
  }
  static buildURL = (url, query) => {
    const _url = new URL(url);
    for (const [key, value] of Object.entries(query ?? {})) {
      if (isNotEmpty2(value)) {
        _url.searchParams.append(key, value.toString());
      }
    }
    return _url.href;
  };
  static buildConfig = (config2) => {
    if (config2 == null ? undefined : config2.cookies) {
      config2.headers = {
        ...config2.headers,
        Cookie: Object.entries(config2.cookies).map(
          ([key, value]) => `${key}=${value == null ? "" : value.toString()};`
        ).join(" ")
      };
    }
    if (config2 && !config2.timeout) {
      config2.timeout = Http.timeout;
    }
    return config2;
  };
};
var Http = new HTTPClient();
var TokenRefresher = class {
  isRefreshing = false;
  /**
   * 自动刷新过期的凭证，并重新发送请求
   */
  async refreshTokenAndRetry(err, maxRetry = 3) {
    var _a, _b, _c, _d, _e;
    const isMina = (_b = (_a = err == null ? undefined : err.config) == null ? undefined : _a.url) == null ? undefined : _b.includes("mina.mi.com");
    const isMIoT = (_d = (_c = err == null ? undefined : err.config) == null ? undefined : _c.url) == null ? undefined : _d.includes("io.mi.com");
    if (!isMina && !isMIoT || ((_e = err.response) == null ? undefined : _e.status) !== 401) {
      return;
    }
    if (this.isRefreshing) {
      return;
    }
    let result;
    this.isRefreshing = true;
    let newServiceAccount = undefined;
    for (let i = 0; i < maxRetry; i++) {
      if (Debugger.enableTrace) {
        console.log(`\u274C \u767B\u5F55\u51ED\u8BC1\u5DF2\u8FC7\u671F\uFF0C\u6B63\u5728\u5C1D\u8BD5\u5237\u65B0 Token ${i + 1}`);
      }
      newServiceAccount = await this.refreshToken(err);
      if (newServiceAccount) {
        result = await this.retry(err, newServiceAccount);
        break;
      }
      await sleep2(3e3);
    }
    this.isRefreshing = false;
    if (!newServiceAccount) {
      console.error("\u274C \u5237\u65B0\u767B\u5F55\u51ED\u8BC1\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u8D26\u53F7\u5BC6\u7801\u662F\u5426\u4ECD\u7136\u6709\u6548\u3002");
    }
    return result;
  }
  /**
   * 刷新登录凭证并同步到本地
   */
  async refreshToken(err) {
    var _a, _b, _c;
    const isMina = (_b = (_a = err == null ? undefined : err.config) == null ? undefined : _a.url) == null ? undefined : _b.includes("mina.mi.com");
    const account = (_c = await getMiService({ service: isMina ? "mina" : "miiot", relogin: true })) == null ? undefined : _c.account;
    if (account && err.config.account) {
      for (const key in account) {
        err.config.account[key] = account[key];
      }
      err.config.setAccount(err.config.account);
    }
    return account;
  }
  /**
   * 重新请求
   */
  async retry(err, account) {
    const cookies = err.config.cookies ?? {};
    for (const key of ["serviceToken"]) {
      if (cookies[key] && account[key]) {
        cookies[key] = account[key];
      }
    }
    for (const key of ["deviceSNProfile"]) {
      if (cookies[key] && account.device[key]) {
        cookies[key] = account.device[key];
      }
    }
    return _http(HTTPClient.buildConfig(err.config));
  }
};
var tokenRefresher = new TokenRefresher();

// src/mi-service-lite/utils/rc4.ts
var RC4 = class {
  iii;
  jjj;
  bytes;
  constructor(buf) {
    this.bytes = new Uint8Array(256);
    const length = buf.length;
    for (let i = 0; i < 256; i++) {
      this.bytes[i] = i;
    }
    let i2 = 0;
    for (let i3 = 0; i3 < 256; i3++) {
      const i4 = i2 + buf[i3 % length];
      const b = this.bytes[i3];
      i2 = i4 + b & 255;
      this.bytes[i3] = this.bytes[i2];
      this.bytes[i2] = b;
    }
    this.iii = 0;
    this.jjj = 0;
  }
  update(buf) {
    for (let i = 0; i < buf.length; i++) {
      const b = buf[i];
      const i2 = this.iii + 1 & 255;
      this.iii = i2;
      const i3 = this.jjj;
      const arr = this.bytes;
      const b2 = arr[i2];
      const i4 = i3 + b2 & 255;
      this.jjj = i4;
      arr[i2] = arr[i4];
      arr[i4] = b2;
      buf[i] = b ^ arr[arr[i2] + b2 & 255];
    }
    return buf;
  }
};
function rc4Hash(method, uri, data, ssecurity) {
  var arrayList = [];
  if (method != null) {
    arrayList.push(method.toUpperCase());
  }
  if (uri != null) {
    arrayList.push(uri);
  }
  if (data != null) {
    for (var k in data) {
      arrayList.push(k + "=" + data[k]);
    }
  }
  arrayList.push(ssecurity);
  var sb = arrayList.join("&");
  return sha1(sb);
}
function parseAuthPass(res) {
  try {
    return jsonDecode2(
      res.replace("&&&START&&&", "").replace(/:(\d{9,})/g, ':"$1"')
      // 把 userId 和 nonce 转成 string
    ) ?? {};
  } catch {
    return {};
  }
}
function encodeQuery(data) {
  return Object.entries(data).map(
    ([key, value]) => encodeURIComponent(key) + "=" + encodeURIComponent(value == null ? "" : value.toString())
  ).join("&");
}
function encodeMiIOT(method, uri, data, ssecurity) {
  let nonce = randomNoice();
  const snonce = signNonce(ssecurity, nonce);
  let key = Buffer.from(snonce, "base64");
  let rc4 = new RC4(key);
  rc4.update(Buffer.alloc(1024));
  let json = jsonEncode2(data);
  let map = { data: json };
  map.rc4_hash__ = rc4Hash(method, uri, map, snonce);
  for (let k in map) {
    let v = map[k];
    map[k] = rc4.update(Buffer.from(v)).toString("base64");
  }
  map.signature = rc4Hash(method, uri, map, snonce);
  map._nonce = nonce;
  map.ssecurity = ssecurity;
  return map;
}
function decodeMiIOT(ssecurity, nonce, data, gzip) {
  let key = Buffer.from(signNonce(ssecurity, nonce), "base64");
  let rc4 = new RC4(key);
  rc4.update(Buffer.alloc(1024));
  let decrypted = rc4.update(Buffer.from(data, "base64"));
  let error = undefined;
  if (gzip) {
    try {
      decrypted = pako.ungzip(decrypted, { to: "string" });
    } catch (err) {
      error = err;
    }
  }
  const res = jsonDecode2(decrypted.toString());
  if (!res) {
    console.error("\u274C decodeMiIOT failed", error);
  }
  return Promise.resolve(res);
}

// src/mi-service-lite/mi/common.ts
function updateMiAccount(account) {
  return (newAccount) => {
    for (const key in newAccount) {
      account[key] = newAccount[key];
    }
  };
}

// src/mi-service-lite/mi/mina.ts
var MiNA = class _MiNA {
  account;
  constructor(account) {
    this.account = account;
  }
  static async getDevice(account) {
    if (account.sid !== "micoapi") {
      return account;
    }
    const devices = await this.__callMina(
      account,
      "GET",
      "/admin/v2/device_list"
    );
    if (Debugger.enableTrace) {
      console.log(
        "\u{1F41B} MiNA \u8BBE\u5907\u5217\u8868: ",
        jsonEncode2(devices, { prettier: true })
      );
    }
    const device = (devices ?? []).find(
      (e) => [e.deviceID, e.miotDID, e.name, e.alias].includes(account.did)
    );
    if (device) {
      account.device = { ...device, deviceId: device.deviceID };
    }
    return account;
  }
  static async __callMina(account, method, path3, data) {
    var _a, _b, _c, _d;
    data = {
      ...data,
      requestId: uuid(),
      timestamp: Math.floor(Date.now() / 1e3)
    };
    const url = "https://api2.mina.mi.com" + path3;
    const config2 = {
      account,
      setAccount: updateMiAccount(account),
      headers: { "User-Agent": "MICO/AndroidApp/@SHIP.TO.2A2FE0D7@/2.4.40" },
      cookies: {
        userId: account.userId,
        serviceToken: account.serviceToken,
        sn: (_a = account.device) == null ? undefined : _a.serialNumber,
        hardware: (_b = account.device) == null ? undefined : _b.hardware,
        deviceId: (_c = account.device) == null ? undefined : _c.deviceId,
        deviceSNProfile: (_d = account.device) == null ? undefined : _d.deviceSNProfile
      }
    };
    let res;
    if (method === "GET") {
      res = await Http.get(url, data, config2);
    } else {
      res = await Http.post(url, encodeQuery(data), config2);
    }
    if (res.code !== 0) {
      if (Debugger.enableTrace) {
        console.error("\u274C _callMina failed", res);
      }
      return undefined;
    }
    return res.data;
  }
  async _callMina(method, path3, data) {
    return _MiNA.__callMina(this.account, method, path3, data);
  }
  ubus(scope, command, message) {
    var _a;
    message = jsonEncode2(message ?? {});
    return this._callMina("POST", "/remote/ubus", {
      deviceId: (_a = this.account.device) == null ? undefined : _a.deviceId,
      path: scope,
      method: command,
      message
    });
  }
  getDevices() {
    return this._callMina("GET", "/admin/v2/device_list");
  }
  async getStatus() {
    const data = await this.ubus("mediaplayer", "player_get_play_status");
    const res = jsonDecode2(data == null ? undefined : data.info);
    if (!data || data.code !== 0 || !res) {
      return;
    }
    const map = { 0: "idle", 1: "playing", 2: "paused", 3: "stopped" };
    return {
      ...res,
      status: map[res.status] ?? "unknown",
      volume: res.volume
    };
  }
  async getVolume() {
    const data = await this.getStatus();
    return data == null ? undefined : data.volume;
  }
  async setVolume(volume) {
    volume = Math.round(clamp2(volume, 6, 100));
    const res = await this.ubus("mediaplayer", "player_set_volume", {
      volume
    });
    return (res == null ? undefined : res.code) === 0;
  }
  async play(options) {
    let res;
    const { tts, url } = options ?? {};
    if (tts) {
      res = await this.ubus("mibrain", "text_to_speech", {
        text: tts,
        save: 0
      });
    } else if (url) {
      res = await this.ubus("mediaplayer", "player_play_url", {
        url,
        type: 1
      });
    } else {
      res = await this.ubus("mediaplayer", "player_play_operation", {
        action: "play"
      });
    }
    return (res == null ? undefined : res.code) === 0;
  }
  async pause() {
    const res = await this.ubus("mediaplayer", "player_play_operation", {
      action: "pause"
    });
    return (res == null ? undefined : res.code) === 0;
  }
  async playOrPause() {
    const res = await this.ubus("mediaplayer", "player_play_operation", {
      action: "toggle"
    });
    return (res == null ? undefined : res.code) === 0;
  }
  async stop() {
    const res = await this.ubus("mediaplayer", "player_play_operation", {
      action: "stop"
    });
    return (res == null ? undefined : res.code) === 0;
  }
  /**
   * 注意：
   * 只拉取用户主动请求，设备被动响应的消息，
   * 不包含设备主动回应用户的消息。
   *
   * - 从游标处由新到旧拉取
   * - 结果包含游标消息本身
   * - 消息列表从新到旧排序
   */
  async getConversations(options) {
    var _a, _b;
    const { limit = 10, timestamp } = options ?? {};
    const res = await Http.get(
      "https://userprofile.mina.mi.com/device_profile/v2/conversation",
      {
        limit,
        timestamp,
        requestId: uuid(),
        source: "dialogu",
        hardware: (_a = this.account.device) == null ? undefined : _a.hardware
      },
      {
        account: this.account,
        setAccount: updateMiAccount(this.account),
        headers: {
          "User-Agent": "Mozilla/5.0 (Linux; Android 10; 000; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/119.0.6045.193 Mobile Safari/537.36 /XiaoMi/HybridView/ micoSoundboxApp/i appVersion/A_2.4.40",
          Referer: "https://userprofile.mina.mi.com/dialogue-note/index.html"
        },
        cookies: {
          userId: this.account.userId,
          serviceToken: this.account.serviceToken,
          deviceId: (_b = this.account.device) == null ? undefined : _b.deviceId
        }
      }
    );
    if (res.code !== 0) {
      if (Debugger.enableTrace) {
        console.error("\u274C getConversations failed", res);
      }
      return undefined;
    }
    return jsonDecode2(res.data);
  }
};

// src/mi-service-lite/mi/miot.ts
var MiIOT = class _MiIOT {
  account;
  constructor(account) {
    this.account = account;
  }
  static async getDevice(account) {
    if (account.sid !== "xiaomiio") {
      return account;
    }
    const devices = await this.__callMiIOT(
      account,
      "POST",
      "/home/device_list",
      {
        getVirtualModel: false,
        getHuamiDevices: 0
      }
    );
    if (Debugger.enableTrace) {
      console.log(
        "\u{1F41B} MiIOT \u8BBE\u5907\u5217\u8868: ",
        jsonEncode2(devices, { prettier: true })
      );
    }
    const device = ((devices == null ? undefined : devices.list) ?? []).find(
      (e) => [e.did, e.name].includes(account.did)
    );
    if (device) {
      account.device = device;
    }
    return account;
  }
  static async __callMiIOT(account, method, path3, _data) {
    var _a;
    const url = "https://api.io.mi.com/app" + path3;
    const config2 = {
      account,
      setAccount: updateMiAccount(account),
      rawResponse: true,
      validateStatus: () => true,
      headers: {
        "User-Agent": "MICO/AndroidApp/@SHIP.TO.2A2FE0D7@/2.4.40",
        "x-xiaomi-protocal-flag-cli": "PROTOCAL-HTTP2",
        "miot-accept-encoding": "GZIP",
        "miot-encrypt-algorithm": "ENCRYPT-RC4"
      },
      cookies: {
        countryCode: "CN",
        locale: "zh_CN",
        timezone: "GMT+08:00",
        timezone_id: "Asia/Shanghai",
        userId: account.userId,
        cUserId: (_a = account.pass) == null ? undefined : _a.cUserId,
        PassportDeviceId: account.deviceId,
        serviceToken: account.serviceToken,
        yetAnotherServiceToken: account.serviceToken
      }
    };
    let res;
    const data = encodeMiIOT(method, path3, _data, account.pass.ssecurity);
    if (method === "GET") {
      res = await Http.get(url, data, config2);
    } else {
      res = await Http.post(url, encodeQuery(data), config2);
    }
    if (typeof res.data !== "string") {
      if (Debugger.enableTrace) {
        console.error("\u274C _callMiIOT failed", res);
      }
      return undefined;
    }
    res = await decodeMiIOT(
      account.pass.ssecurity,
      data._nonce,
      res.data,
      res.headers["miot-content-encoding"] === "GZIP"
    );
    return res == null ? undefined : res.result;
  }
  async _callMiIOT(method, path3, data) {
    return _MiIOT.__callMiIOT(this.account, method, path3, data);
  }
  rpc(method, params, id = 1) {
    return this._callMiIOT("POST", "/home/rpc/" + this.account.device.did, {
      id,
      method,
      params
    });
  }
  /**
   * - datasource=1  优先从服务器缓存读取，没有读取到下发rpc；不能保证取到的一定是最新值
   * - datasource=2  直接下发rpc，每次都是设备返回的最新值
   * - datasource=3  直接读缓存；没有缓存的 code 是 -70xxxx；可能取不到值
   */
  _callMiotSpec(command, params, datasource = 2) {
    return this._callMiIOT("POST", "/miotspec/" + command, {
      params,
      datasource
    });
  }
  async getDevices(getVirtualModel = false, getHuamiDevices = 0) {
    const res = await this._callMiIOT("POST", "/home/device_list", {
      getVirtualModel,
      getHuamiDevices
    });
    return res == null ? undefined : res.list;
  }
  async getProperty(scope, property) {
    var _a, _b;
    const res = await this._callMiotSpec("prop/get", [
      {
        did: this.account.device.did,
        siid: scope,
        piid: property
      }
    ]);
    return (_b = (_a = res ?? []) == null ? undefined : _a[0]) == null ? undefined : _b.value;
  }
  async setProperty(scope, property, value) {
    var _a, _b;
    const res = await this._callMiotSpec("prop/set", [
      {
        did: this.account.device.did,
        siid: scope,
        piid: property,
        value
      }
    ]);
    return ((_b = (_a = res ?? []) == null ? undefined : _a[0]) == null ? undefined : _b.code) === 0;
  }
  async doAction(scope, action, args = []) {
    const res = await this._callMiotSpec("action", {
      did: this.account.device.did,
      siid: scope,
      aiid: action,
      in: Array.isArray(args) ? args : [args]
    });
    return (res == null ? undefined : res.code) === 0;
  }
};

// src/mi-service-lite/mi/account.ts
var kLoginAPI = "https://account.xiaomi.com/pass";
async function getAccount(account) {
  let res = await Http.get(
    `${kLoginAPI}/serviceLogin`,
    { sid: account.sid, _json: true, _locale: "zh_CN" },
    { cookies: _getLoginCookies(account) }
  );
  if (res.isError) {
    console.error("\u274C \u767B\u5F55\u5931\u8D25", res);
    throw Error("\u767B\u5F55\u5931\u8D25" + res);
  }
  let pass = parseAuthPass(res);
  if (pass.code !== 0) {
    let data = {
      _json: "true",
      qs: pass.qs,
      sid: account.sid,
      _sign: pass._sign,
      callback: pass.callback,
      user: account.userId,
      hash: md5(account.password).toUpperCase()
    };
    res = await Http.post(`${kLoginAPI}/serviceLoginAuth2`, encodeQuery(data), {
      cookies: _getLoginCookies(account)
    });
    if (res.isError) {
      console.error("\u274C OAuth2 \u767B\u5F55\u5931\u8D25", res);
      throw Error("\u274C OAuth2 \u767B\u5F55\u5931\u8D25" + res);
    }
    pass = parseAuthPass(res);
  }
  if (!pass.location || !pass.nonce || !pass.passToken) {
    if (pass.notificationUrl || pass.captchaUrl) {
      console.log(
        "\u{1F525} \u89E6\u53D1\u5C0F\u7C73\u8D26\u53F7\u5F02\u5730\u767B\u5F55\u5B89\u5168\u9A8C\u8BC1\u673A\u5236\uFF0C\u8BF7\u5728\u6D4F\u89C8\u5668\u6253\u5F00\u4EE5\u4E0B\u94FE\u63A5\uFF0C\u5E76\u6309\u7167\u7F51\u9875\u63D0\u793A\u6388\u6743\u9A8C\u8BC1\u8D26\u53F7\uFF1A"
      );
      console.log("\u{1F449} " + pass.notificationUrl || pass.captchaUrl);
      console.log(
        "\u{1F41B} \u6CE8\u610F\uFF1A\u6388\u6743\u6210\u529F\u540E\uFF0C\u5927\u7EA6\u9700\u8981\u7B49\u5F85 1 \u4E2A\u5C0F\u65F6\u5DE6\u53F3\u8D26\u53F7\u4FE1\u606F\u624D\u4F1A\u66F4\u65B0\uFF0C\u8BF7\u5728\u66F4\u65B0\u540E\u518D\u5C1D\u8BD5\u91CD\u65B0\u767B\u5F55\u3002"
      );
      throw Error(
        "\u{1F525} \u89E6\u53D1\u5C0F\u7C73\u8D26\u53F7\u5F02\u5730\u767B\u5F55\u5B89\u5168\u9A8C\u8BC1\u673A\u5236\uFF0C\u8BF7\u5728\u6D4F\u89C8\u5668\u6253\u5F00\u4EE5\u4E0B\u94FE\u63A5\uFF0C\u5E76\u6309\u7167\u7F51\u9875\u63D0\u793A\u6388\u6743\u9A8C\u8BC1\u8D26\u53F7\uFF1A\u{1F449} " + (pass.notificationUrl || pass.captchaUrl) + "\n\u{1F41B} \u6CE8\u610F\uFF1A\u6388\u6743\u6210\u529F\u540E\uFF0C\u5927\u7EA6\u9700\u8981\u7B49\u5F85 1 \u4E2A\u5C0F\u65F6\u5DE6\u53F3\u8D26\u53F7\u4FE1\u606F\u624D\u4F1A\u66F4\u65B0\uFF0C\u8BF7\u5728\u66F4\u65B0\u540E\u518D\u5C1D\u8BD5\u91CD\u65B0\u767B\u5F55\u3002"
      );
    }
    console.error("\u274C \u5C0F\u7C73\u8D26\u53F7\u767B\u5F55\u5931\u8D25", res);
    throw Error("\u274C \u5C0F\u7C73\u8D26\u53F7\u767B\u5F55\u5931\u8D25" + (pass == null ? undefined : pass.description));
  }
  const serviceToken = await _getServiceToken(pass);
  if (!serviceToken) {
    throw Error("\u274C \u83B7\u53D6\u5C0F\u7C73\u8D26\u53F7\u670D\u52A1\u4EE4\u724C\u5931\u8D25");
  }
  account = { ...account, pass, serviceToken };
  if (Debugger.enableTrace) {
    console.log("\u{1F41B} \u5C0F\u7C73\u8D26\u53F7: ", jsonEncode2(account, { prettier: true }));
  }
  account = await MiNA.getDevice(account);
  if (Debugger.enableTrace) {
    console.log("\u{1F41B} MiNA \u8D26\u53F7: ", jsonEncode2(account, { prettier: true }));
  }
  account = await MiIOT.getDevice(account);
  if (Debugger.enableTrace) {
    console.log("\u{1F41B} MiIOT \u8D26\u53F7: ", jsonEncode2(account, { prettier: true }));
  }
  if (account.did && !account.device) {
    console.error("\u274C \u627E\u4E0D\u5230\u8BBE\u5907\uFF1A" + account.did);
    throw Error(
      "\u274C \u627E\u4E0D\u5230\u8BBE\u5907\uFF1A" + account.did + "\n\u{1F41B} \u8BF7\u68C0\u67E5\u4F60\u7684 did \u4E0E\u7C73\u5BB6\u4E2D\u7684\u8BBE\u5907\u540D\u79F0\u662F\u5426\u4E00\u81F4\u3002\u6CE8\u610F\u9519\u522B\u5B57\u3001\u7A7A\u683C\u548C\u5927\u5C0F\u5199\uFF0C\u6BD4\u5982\uFF1A\u97F3\u54CD \u{1F449} \u97F3\u7BB1"
    );
  }
  return account;
}
function _getLoginCookies(account) {
  var _a;
  return {
    userId: account.userId,
    deviceId: account.deviceId,
    passToken: (_a = account.pass) == null ? undefined : _a.passToken
  };
}
async function _getServiceToken(pass) {
  var _a;
  const { location, nonce, ssecurity } = pass ?? {};
  const res = await Http.get(
    location,
    {
      _userIdNeedEncrypt: true,
      clientSign: sha1(`nonce=${nonce}&${ssecurity}`)
    },
    { rawResponse: true }
  );
  let cookies = ((_a = res.headers) == null ? undefined : _a["set-cookie"]) ?? [];
  for (let cookie of cookies) {
    if (cookie.includes("serviceToken")) {
      return cookie.split(";")[0].replace("serviceToken=", "");
    }
  }
  console.error("\u274C \u83B7\u53D6 Mi Service Token \u5931\u8D25", res);
  throw Error("\u274C \u83B7\u53D6 Mi Service Token \u5931\u8D25");
}

// src/mi-service-lite/mi/index.ts
var kConfigFile = ".mi.json";
async function getMiService(config2) {
  var _a;
  const { service, userId, password, did, relogin } = config2;
  const overrides = relogin ? {} : { did, userId, password };
  const randomDeviceId = "android_" + uuid();
  const store = await readJSON(kConfigFile) ?? {};
  let account = {
    deviceId: randomDeviceId,
    ...store[service],
    ...overrides,
    sid: service === "miiot" ? "xiaomiio" : "micoapi"
  };
  if (!account.userId || !account.password) {
    console.error("\u274C \u6CA1\u6709\u627E\u5230\u8D26\u53F7\u6216\u5BC6\u7801\uFF0C\u8BF7\u68C0\u67E5\u662F\u5426\u5DF2\u914D\u7F6E\u76F8\u5173\u53C2\u6570\uFF1AuserId, password");
    return { status: 500, msg: "\u6CA1\u6709\u627E\u5230\u8D26\u53F7\u6216\u5BC6\u7801\uFF0C\u8BF7\u68C0\u67E5\u662F\u5426\u5DF2\u914D\u7F6E\u76F8\u5173\u53C2\u6570\uFF1AuserId, password" };
  }
  try {
    account = await getAccount(account);
    if (!(account == null ? void 0 : account.serviceToken) || !((_a = account.pass) == null ? void 0 : _a.ssecurity)) {
      return { status: 500, msg: "?" };
    }
  } catch (e) {
    return { status: 500, msg: e.message };
  }
  store[service] = account;
  await writeJSON(kConfigFile, store);
  return { status: 1, data: service === "miiot" ? new MiIOT(account) : new MiNA(account) };
}

// src/mi-service-lite/index.ts
async function getMiIOT(config2) {
  Debugger.enableTrace = config2.enableTrace;
  Http.timeout = config2.timeout ?? Http.timeout;
  return getMiService({ service: "miiot", ...config2 });
}
async function getMiNA(config2) {
  Debugger.enableTrace = config2.enableTrace;
  Http.timeout = config2.timeout ?? Http.timeout;
  return getMiService({ service: "mina", ...config2 });
}

// src/utils/log.ts
var _LoggerManager = class {
  disable = false;
  _excludes = [];
  excludes(tags) {
    this._excludes = toSet(this._excludes.concat(tags));
  }
  includes(tags) {
    for (const tag of tags) {
      const idx = this._excludes.indexOf(tag);
      if (idx > -1) {
        this._excludes.splice(idx, 1);
      }
    }
  }
  _getLogs(tag, ...args) {
    if (this.disable || this._excludes.includes(tag)) {
      return [];
    }
    const date = formatDateTime(/* @__PURE__ */ new Date());
    let prefix = `${date} ${tag} `;
    if (args.length < 1) {
      args = [undefined];
    }
    if (isString(args[0])) {
      prefix += args[0];
      args = args.slice(1);
    }
    return [prefix, ...args];
  }
  log(tag, args = []) {
    const logs = this._getLogs(tag, ...args);
    if (logs.length > 0) {
      console.log(...logs);
    }
  }
  debug(tag, args) {
    const logs = this._getLogs(tag + " \u{1F41B}", ...args);
    if (logs.length > 0) {
      console.log(...logs);
    }
  }
  success(tag, args) {
    const logs = this._getLogs(tag + " \u2705", ...args);
    if (logs.length > 0) {
      console.log(...logs);
    }
  }
  error(tag, args) {
    const logs = this._getLogs(tag + " \u274C", ...args);
    if (logs.length > 0) {
      console.error(...logs);
    }
  }
  assert(tag, value, args) {
    const logs = this._getLogs(tag + " \u274C", ...args);
    if (!value) {
      console.error(...logs);
      throw Error("\u274C Assertion failed");
    }
  }
};
var LoggerManager = new _LoggerManager();
var _Logger = class __Logger {
  tag;
  disable;
  constructor(config2) {
    const { tag = "default", disable = false } = config2 ?? {};
    this.tag = tag;
    this.disable = disable;
  }
  create(config2) {
    return new __Logger(config2);
  }
  log(...args) {
    if (!this.disable) {
      LoggerManager.log(this.tag, args);
    }
  }
  debug(...args) {
    if (!this.disable) {
      LoggerManager.debug(this.tag, args);
    }
  }
  success(...args) {
    if (!this.disable) {
      LoggerManager.success(this.tag, args);
    }
  }
  error(...args) {
    if (!this.disable) {
      LoggerManager.error(this.tag, args);
    }
  }
  assert(value, ...args) {
    LoggerManager.assert(this.tag, value, args);
  }
};
var Logger = new _Logger();

// src/services/speaker/stream.ts
var StreamResponse = class _StreamResponse {
  // 将已有的大篇文字回复 chuck 成 stream 回复
  static createStreamResponse(text, options) {
    const { maxSentenceLength = 100 } = options ?? {};
    if (text.length > maxSentenceLength) {
      const stream = new _StreamResponse(options);
      stream.addResponse(text);
      stream.finish(text);
      return stream;
    }
  }
  maxSentenceLength;
  firstSubmitTimeout;
  constructor(options) {
    const { maxSentenceLength = 100, firstSubmitTimeout = 200 } = options ?? {};
    this.maxSentenceLength = maxSentenceLength;
    this.firstSubmitTimeout = firstSubmitTimeout < 100 ? 100 : firstSubmitTimeout;
  }
  status = "responding";
  cancel() {
    if (["idle", "responding"].includes(this.status)) {
      this.status = "canceled";
    }
    return this.status === "canceled";
  }
  addResponse(_text) {
    if (this.status === "idle") {
      this.status = "responding";
    }
    if (this.status !== "responding") {
      return;
    }
    let text = removeEmojis(_text);
    if (!text) {
      return;
    }
    this._batchSubmit(text);
  }
  _nextChunkIdx = 0;
  getNextResponse() {
    if (this._submitCount > 0) {
      this._batchSubmitImmediately();
    }
    const nextSentence = this._chunks[this._nextChunkIdx];
    if (nextSentence) {
      this._nextChunkIdx++;
    }
    const noMore = this._nextChunkIdx > this._chunks.length - 1 && ["finished", "canceled"].includes(this.status);
    return { nextSentence, noMore };
  }
  _finalResult;
  finish(finalResult) {
    if (["idle", "responding"].includes(this.status)) {
      this._batchSubmitImmediately();
      this._forceChunkText();
      this._finalResult = finalResult;
      this.status = "finished";
    }
    return this.status === "finished";
  }
  _forceChunkText() {
    if (this._remainingText) {
      this._addResponse("", { force: true });
    }
  }
  async getFinalResult() {
    while (true) {
      if (this.status === "finished") {
        return this._finalResult;
      } else if (this.status === "canceled") {
        return undefined;
      }
      await sleep(10);
    }
  }
  _chunks = [];
  _tempText = "";
  _remainingText = "";
  _isFirstSubmit = true;
  _submitCount = 0;
  _batchSubmitImmediately() {
    if (this._tempText) {
      this._addResponse(this._tempText);
      this._tempText = "";
      this._submitCount++;
    }
  }
  /**
   * 批量收集/提交收到的文字响应
   *
   * 主要用途是使收到的 AI stream 回答的句子长度适中（不过长/短）。
   */
  _batchSubmit(text) {
    this._tempText += text;
    if (this._isFirstSubmit) {
      this._isFirstSubmit = false;
      setTimeout(() => {
        if (this._submitCount < 1) {
          this._batchSubmitImmediately();
        }
      }, this.firstSubmitTimeout);
    } else if (this._submitCount < 1) {
      if (this._tempText.length > this.maxSentenceLength) {
        this._batchSubmitImmediately();
      }
    }
  }
  _addResponse(text, options) {
    this._remainingText += text;
    while (this._remainingText.length > 0) {
      let lastCutIndex = (options == null ? undefined : options.force) ? this.maxSentenceLength : this._findLastCutIndex(this._remainingText);
      if (lastCutIndex > 0) {
        const currentChunk = this._remainingText.substring(0, lastCutIndex);
        this._chunks.push(currentChunk);
        this._remainingText = this._remainingText.substring(lastCutIndex);
      } else {
        break;
      }
    }
  }
  _findLastCutIndex(text) {
    const punctuations = "\u3002\uFF1F\uFF01\uFF1B?!;";
    let lastCutIndex = -1;
    for (let i = 0; i < Math.min(text.length, this.maxSentenceLength); i++) {
      if (punctuations.includes(text[i])) {
        lastCutIndex = i + 1;
      }
    }
    return lastCutIndex;
  }
};

// src/services/speaker/base.ts
var BaseSpeaker = class {
  MiNA;
  MiIOT;
  config;
  logger = Logger.create({ tag: "Speaker" });
  debug = false;
  streamResponse = true;
  checkInterval;
  checkTTSStatusAfter;
  tts;
  ttsCommand;
  wakeUpCommand;
  playingCommand;
  constructor(config2) {
    this.config = config2;
    this.config.timeout = config2.timeout ?? 5e3;
    const {
      debug = false,
      streamResponse = true,
      checkInterval = 1e3,
      checkTTSStatusAfter = 3,
      tts = "xiaoai",
      playingCommand,
      ttsCommand = [5, 1],
      wakeUpCommand = [5, 3],
      audioBeep = kEnvs.AUDIO_BEEP
    } = config2;
    this.debug = debug;
    this.streamResponse = streamResponse;
    this.audioBeep = audioBeep;
    this.checkInterval = clamp(checkInterval, 500, Infinity);
    this.checkTTSStatusAfter = checkTTSStatusAfter;
    this.tts = tts;
    this.ttsCommand = ttsCommand;
    this.wakeUpCommand = wakeUpCommand;
    this.playingCommand = playingCommand;
    if (config2.debug) {
      this.logger.debug("Speaker config:", config2);
    }
  }
  async initMiServices() {
    const getMiNARes = await getMiNA(this.config);
    if (getMiNARes.status !== 1) {
      throw Error(getMiNARes.msg);
    }
    this.MiNA = getMiNARes.data;
    const getMiIOTRes = await getMiIOT(this.config);
    if (getMiIOTRes.status !== 1) {
      throw Error(getMiIOTRes.msg);
    }
    this.MiIOT = getMiIOTRes.data;
    this.logger.assert(!!this.MiNA && !!this.MiIOT, "\u521D\u59CB\u5316 Mi Services \u5931\u8D25");
    if (this.debug) {
      this.logger.debug(
        "\u914D\u7F6E\u53C2\u6570\uFF1A",
        jsonEncode(this.config, { prettier: true })
      );
    }
  }
  wakeUp() {
    if (this.debug) {
      this.logger.debug("wakeUp");
    }
    return this.MiIOT.doAction(...this.wakeUpCommand);
  }
  async unWakeUp() {
    if (this.debug) {
      this.logger.debug("unWakeUp");
    }
    await this.MiNA.pause();
    await sleep(100);
    await this.MiIOT.doAction(...this.ttsCommand, kAreYouOK);
    await sleep(100);
  }
  audioBeep;
  responding = false;
  /**
   * 检测是否有新消息
   *
   * 有新消息产生时，旧的回复会终止
   */
  checkIfHasNewMsg() {
    return { hasNewMsg: () => false, noNewMsg: () => true };
  }
  async response(options) {
    let {
      text,
      audio,
      stream,
      playSFX = true,
      keepAlive = false,
      tts = this.tts
    } = options ?? {};
    options.hasNewMsg ??= this.checkIfHasNewMsg().hasNewMsg;
    if (!text && !stream && !audio) {
      return;
    }
    const customTTS = kEnvs.TTS_BASE_URL;
    if (!customTTS) {
      tts = "xiaoai";
    }
    const ttsNotXiaoai = tts !== "xiaoai" && !audio;
    playSFX = this.streamResponse && ttsNotXiaoai && playSFX;
    if (ttsNotXiaoai && !stream) {
      stream = StreamResponse.createStreamResponse(text);
    }
    let res;
    this.responding = true;
    if (stream) {
      let replyText = "";
      while (true) {
        let { nextSentence, noMore } = stream.getNextResponse();
        if (!this.streamResponse) {
          nextSentence = await stream.getFinalResult();
          noMore = true;
        }
        if (nextSentence) {
          if (replyText.length < 1) {
            if (playSFX && this.audioBeep) {
              if (this.debug) {
                this.logger.debug("\u5F00\u59CB\u64AD\u653E\u63D0\u793A\u97F3");
              }
              await this.MiNA.play({ url: this.audioBeep });
            }
            if (ttsNotXiaoai) {
              await this.unWakeUp();
            }
          }
          res = await this._response({
            ...options,
            text: nextSentence,
            playSFX: false,
            keepAlive: false
          });
          if (res === "break") {
            stream.cancel();
            break;
          }
          replyText += nextSentence;
        }
        if (noMore) {
          if (replyText.length > 0) {
            if (playSFX && this.audioBeep) {
              if (this.debug) {
                this.logger.debug("\u7ED3\u675F\u64AD\u653E\u63D0\u793A\u97F3");
              }
              await this.MiNA.play({ url: this.audioBeep });
            }
          }
          if (keepAlive) {
            await this.wakeUp();
          }
          break;
        }
        await sleep(this.checkInterval);
      }
      if (replyText.length < 1) {
        return "error";
      }
    } else {
      res = await this._response(options);
    }
    this.responding = false;
    return res;
  }
  async _response(options) {
    var _a;
    let {
      text,
      audio,
      playSFX = true,
      keepAlive = false,
      tts = this.tts,
      speaker = this._currentSpeaker
    } = options ?? {};
    const hasNewMsg = () => {
      var _a2;
      return (_a2 = options.hasNewMsg) == null ? undefined : _a2.call(options);
    };
    const ttsText = (_a = text == null ? undefined : text.replace(/\n\s*\n/g, "\n")) == null ? undefined : _a.trim();
    const ttsNotXiaoai = tts !== "xiaoai" && !audio;
    playSFX = this.streamResponse && ttsNotXiaoai && playSFX;
    const play = async (args) => {
      this.logger.log("\u{1F50A} " + (ttsText ?? audio));
      if (playSFX && this.audioBeep) {
        if (this.debug) {
          this.logger.debug("\u5F00\u59CB\u64AD\u653E\u63D0\u793A\u97F3\uFF08inner\uFF09");
        }
        await this.MiNA.play({ url: this.audioBeep });
      }
      if (ttsNotXiaoai) {
        await this.unWakeUp();
      }
      if (args == null ? undefined : args.tts) {
        const sentences = args.tts.split(/(?<=[。！？\n])/);
        for (const sentence of sentences) {
          if (sentence.trim()) {
            console.log("Processing sentence:", sentence);
            await this.MiIOT.doAction(...this.ttsCommand, sentence.trim());
            const estimatedTime = sentence.length * 225 + 10;
            await sleep(estimatedTime);
          }
        }
      } else {
        await this.MiNA.play(args);
      }
      if (!this.streamResponse) {
        return;
      }
      await sleep(this.checkTTSStatusAfter * 1e3);
      const retry = fastRetry(this, "\u8BBE\u5907\u72B6\u6001");
      while (true) {
        let playing = { status: "idle" };
        let res2 = this.playingCommand ? await this.MiIOT.getProperty(
          this.playingCommand[0],
          this.playingCommand[1]
        ) : await this.MiNA.getStatus();
        if (this.debug) {
          this.logger.debug(jsonEncode({ playState: res2 ?? "undefined" }));
        }
        if (this.playingCommand && res2 === this.playingCommand[2]) {
          playing = { status: "playing" };
        }
        if (!this.playingCommand) {
          playing = { ...playing, ...res2 };
        }
        if (hasNewMsg() || !this.responding || // 有新消息
        playing.status === "playing" && playing.media_type) {
          return "break";
        }
        const isOk = retry.onResponse(res2);
        if (isOk === "break") {
          break;
        }
        if (res2 != null && playing.status !== "playing") {
          break;
        }
        await sleep(this.checkInterval);
      }
      if (playSFX && this.audioBeep) {
        if (this.debug) {
          this.logger.debug("\u7ED3\u675F\u64AD\u653E\u63D0\u793A\u97F3inner\uFF09");
        }
        await this.MiNA.play({ url: this.audioBeep });
      }
      if (keepAlive) {
        await this.wakeUp();
      }
    };
    let res;
    if (audio) {
      res = await play({ url: audio });
    } else if (ttsText) {
      switch (tts) {
        case "custom":
          const _text = encodeURIComponent(ttsText);
          const url = `${kEnvs.TTS_BASE_URL}/tts.mp3?speaker=${speaker || ""}&text=${_text}`;
          res = await play({ url });
          break;
        case "xiaoai":
        default:
          res = await play({ tts: ttsText });
          break;
      }
    }
    return res;
  }
  _speakers;
  _currentSpeaker;
  async switchSpeaker(speaker) {
    if (!this._speakers && kEnvs.TTS_BASE_URL) {
      const resp = await fetch(`${kEnvs.TTS_BASE_URL}/speakers`).catch(
        () => null
      );
      const res = await (resp == null ? undefined : resp.json().catch(() => null));
      if (Array.isArray(res)) {
        this._speakers = res;
      }
    }
    if (!this._speakers) {
      return false;
    }
    const target = this._speakers.find(
      (e) => e.name === speaker || e.speaker === speaker
    );
    if (target) {
      this._currentSpeaker = target.speaker;
      return true;
    }
  }
};

// src/services/speaker/speaker.ts
var Speaker = class extends BaseSpeaker {
  heartbeat;
  exitKeepAliveAfter;
  currentQueryMsg;
  constructor(config2) {
    super(config2);
    const {
      heartbeat = 1e3,
      exitKeepAliveAfter = 30,
      audioSilent = kEnvs.AUDIO_SILENT
    } = config2;
    this.audioSilent = audioSilent;
    this._commands = config2.commands ?? [];
    this.heartbeat = clamp(heartbeat, 500, Infinity);
    this.exitKeepAliveAfter = exitKeepAliveAfter;
  }
  status = "running";
  stop() {
    this.status = "stopped";
  }
  async run() {
    this.status = "running";
    await this.initMiServices();
    if (!this.MiNA) {
      this.stop();
      return;
    }
    this.logger.success("\u670D\u52A1\u5DF2\u542F\u52A8...");
    this.activeKeepAliveMode();
    const retry = fastRetry(this, "\u6D88\u606F\u5217\u8868");
    while (this.status === "running") {
      const nextMsg = await this.fetchNextMessage();
      const isOk = retry.onResponse(this._lastConversation);
      if (isOk === "break") {
        process.exit(1);
      }
      if (nextMsg) {
        this.responding = false;
        this.logger.log("\u{1F525} " + nextMsg.text);
        await this.onMessage(nextMsg);
      }
      await sleep(this.heartbeat);
    }
  }
  audioSilent;
  async activeKeepAliveMode() {
    var _a;
    while (this.status === "running") {
      if (this.keepAlive) {
        if (!this.responding) {
          if (this.audioSilent) {
            await ((_a = this.MiNA) == null ? undefined : _a.play({ url: this.audioSilent }));
          } else {
            await this.MiIOT.doAction(...this.ttsCommand, kAreYouOK);
          }
        }
      }
      await sleep(this.checkInterval);
    }
  }
  _commands = [];
  get commands() {
    return this._commands;
  }
  addCommand(command) {
    this._commands.push(command);
  }
  async onMessage(msg) {
    const { noNewMsg } = this.checkIfHasNewMsg(msg);
    for (const command of this.commands) {
      if (command.match(msg)) {
        await this.MiNA.pause();
        const answer = await command.run(msg);
        if (answer) {
          if (noNewMsg() && this.status === "running") {
            await this.response({
              ...answer,
              keepAlive: this.keepAlive
            });
          }
        }
        await this.exitKeepAliveIfNeeded();
        return;
      }
    }
  }
  /**
   * 是否保持设备响应状态
   */
  keepAlive = false;
  async enterKeepAlive() {
    this.keepAlive = true;
  }
  async exitKeepAlive() {
    this.keepAlive = false;
  }
  _preTimer;
  async exitKeepAliveIfNeeded() {
    if (this._preTimer) {
      clearTimeout(this._preTimer);
    }
    const { noNewMsg } = this.checkIfHasNewMsg();
    this._preTimer = setTimeout(async () => {
      if (this.keepAlive && !this.responding && noNewMsg() && this.status === "running") {
        await this.exitKeepAlive();
      }
    }, this.exitKeepAliveAfter * 1e3);
  }
  checkIfHasNewMsg(currentMsg) {
    var _a;
    const currentTimestamp = (_a = currentMsg ?? this.currentQueryMsg) == null ? undefined : _a.timestamp;
    return {
      hasNewMsg: () => {
        var _a2;
        return currentTimestamp !== ((_a2 = this.currentQueryMsg) == null ? undefined : _a2.timestamp);
      },
      noNewMsg: () => {
        var _a2;
        return currentTimestamp === ((_a2 = this.currentQueryMsg) == null ? undefined : _a2.timestamp);
      }
    };
  }
  _tempMsgs = [];
  async fetchNextMessage() {
    if (!this.currentQueryMsg) {
      await this._fetchFirstMessage();
      return;
    }
    return this._fetchNextMessage();
  }
  async _fetchFirstMessage() {
    const msgs = await this.getMessages({
      limit: 1,
      filterAnswer: false
    });
    this.currentQueryMsg = msgs[0];
  }
  async _fetchNextMessage() {
    if (this._tempMsgs.length > 0) {
      return this._fetchNextTempMessage();
    }
    const nextMsg = await this._fetchNext2Messages();
    if (nextMsg !== "continue") {
      return nextMsg;
    }
    return this._fetchNextRemainingMessages();
  }
  async _fetchNext2Messages() {
    let msgs = await this.getMessages({ limit: 2 });
    if (msgs.length < 1 || firstOf(msgs).timestamp <= this.currentQueryMsg.timestamp) {
      return;
    }
    if (firstOf(msgs).timestamp > this.currentQueryMsg.timestamp && (msgs.length === 1 || lastOf(msgs).timestamp <= this.currentQueryMsg.timestamp)) {
      this.currentQueryMsg = firstOf(msgs);
      return this.currentQueryMsg;
    }
    for (const msg of msgs) {
      if (msg.timestamp > this.currentQueryMsg.timestamp) {
        this._tempMsgs.push(msg);
      }
    }
    return "continue";
  }
  _fetchNextTempMessage() {
    const nextMsg = this._tempMsgs.pop();
    this.currentQueryMsg = nextMsg;
    return nextMsg;
  }
  async _fetchNextRemainingMessages(maxPage = 3) {
    let currentPage = 0;
    while (true) {
      currentPage++;
      if (currentPage > maxPage) {
        return this._fetchNextTempMessage();
      }
      const nextTimestamp = lastOf(this._tempMsgs).timestamp;
      const msgs = await this.getMessages({
        limit: 10,
        timestamp: nextTimestamp
      });
      for (const msg of msgs) {
        if (msg.timestamp >= nextTimestamp) {
          continue;
        } else if (msg.timestamp > this.currentQueryMsg.timestamp) {
          this._tempMsgs.push(msg);
        } else {
          return this._fetchNextTempMessage();
        }
      }
    }
  }
  _lastConversation;
  async getMessages(options) {
    const filterAnswer = (options == null ? undefined : options.filterAnswer) ?? true;
    const conversation = await this.MiNA.getConversations(options);
    this._lastConversation = conversation;
    let records = (conversation == null ? undefined : conversation.records) ?? [];
    if (filterAnswer) {
      records = records.filter(
        (e) => {
          var _a;
          return ["TTS", "LLM"].includes((_a = e.answers[0]) == null ? undefined : _a.type) && // 过滤 TTS 和 LLM 消息
          e.answers.length === 1;
        }
        // 播放音乐时会有 TTS、Audio 两个 Answer
      );
    }
    return records.map((e) => {
      var _a, _b, _c, _d;
      const msg = e.answers[0];
      const answer = ((_b = (_a = msg == null ? undefined : msg.tts) == null ? undefined : _a.text) == null ? undefined : _b.trim()) ?? ((_d = (_c = msg == null ? undefined : msg.llm) == null ? undefined : _c.text) == null ? undefined : _d.trim());
      return {
        answer,
        text: e.query,
        timestamp: e.time
      };
    });
  }
};

// src/services/speaker/ai.ts
var AISpeaker = class extends Speaker {
  askAI;
  name;
  switchSpeakerKeywords;
  onEnterAI;
  onExitAI;
  callAIKeywords;
  wakeUpKeywords;
  exitKeywords;
  onAIAsking;
  onAIReplied;
  onAIError;
  audioActive;
  audioError;
  constructor(config2) {
    super(config2);
    const {
      askAI,
      name = "\u50BB\u599E",
      switchSpeakerKeywords,
      callAIKeywords = ["\u8BF7", "\u4F60", "\u50BB\u599E"],
      wakeUpKeywords = ["\u6253\u5F00", "\u8FDB\u5165", "\u53EC\u5524"],
      exitKeywords = ["\u5173\u95ED", "\u9000\u51FA", "\u518D\u89C1"],
      onEnterAI = ["\u4F60\u597D\uFF0C\u6211\u662F\u50BB\u599E\uFF0C\u5F88\u9AD8\u5174\u8BA4\u8BC6\u4F60"],
      onExitAI = ["\u50BB\u599E\u5DF2\u9000\u51FA"],
      onAIAsking = ["\u8BA9\u6211\u5148\u60F3\u60F3", "\u8BF7\u7A0D\u7B49"],
      onAIReplied = ["\u6211\u8BF4\u5B8C\u4E86", "\u8FD8\u6709\u5176\u4ED6\u95EE\u9898\u5417"],
      onAIError = ["\u554A\u54E6\uFF0C\u51FA\u9519\u4E86\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5\u5427\uFF01"],
      audioActive = kEnvs.AUDIO_ACTIVE,
      audioError = kEnvs.AUDIO_ERROR
    } = config2;
    this.askAI = askAI;
    this.name = name;
    this.callAIKeywords = callAIKeywords;
    this.wakeUpKeywords = wakeUpKeywords;
    this.exitKeywords = exitKeywords;
    this.onEnterAI = onEnterAI;
    this.onExitAI = onExitAI;
    this.onAIError = onAIError;
    this.onAIAsking = onAIAsking;
    this.onAIReplied = onAIReplied;
    this.audioActive = audioActive;
    this.audioError = audioError;
    this.switchSpeakerKeywords = switchSpeakerKeywords ?? getDefaultSwitchSpeakerPrefix();
  }
  async enterKeepAlive() {
    if (!this.streamResponse) {
      await this.response({ text: "\u60A8\u5DF2\u5173\u95ED\u6D41\u5F0F\u54CD\u5E94(streamResponse)\uFF0C\u65E0\u6CD5\u4F7F\u7528\u8FDE\u7EED\u5BF9\u8BDD\u6A21\u5F0F" });
      return;
    }
    const text = pickOne(this.onEnterAI);
    if (text) {
      await this.response({ text, keepAlive: true });
    }
    await super.enterKeepAlive();
  }
  async exitKeepAlive() {
    await super.exitKeepAlive();
    const text = pickOne(this.onExitAI);
    if (text) {
      await this.response({ text, keepAlive: false, playSFX: false });
    }
    await this.unWakeUp();
  }
  get commands() {
    return [
      {
        match: (msg) => !this.keepAlive && this.wakeUpKeywords.some((e) => msg.text.startsWith(e)),
        run: async (msg) => {
          await this.enterKeepAlive();
        }
      },
      {
        match: (msg) => this.keepAlive && this.exitKeywords.some((e) => msg.text.startsWith(e)),
        run: async (msg) => {
          await this.exitKeepAlive();
        }
      },
      {
        match: (msg) => this.switchSpeakerKeywords.some((e) => msg.text.startsWith(e)),
        run: async (msg) => {
          await this.response({
            text: "\u6B63\u5728\u5207\u6362\u97F3\u8272\uFF0C\u8BF7\u7A0D\u7B49..."
          });
          const prefix = this.switchSpeakerKeywords.find(
            (e) => msg.text.startsWith(e)
          );
          const speaker = msg.text.replace(prefix, "");
          const success = await this.switchSpeaker(speaker);
          await this.response({
            text: success ? "\u97F3\u8272\u5DF2\u5207\u6362\uFF01" : "\u97F3\u8272\u5207\u6362\u5931\u8D25\uFF01",
            keepAlive: this.keepAlive
          });
        }
      },
      // todo 考虑添加清除上下文指令
      ...this._commands,
      {
        match: (msg) => this.keepAlive || this.callAIKeywords.some((e) => msg.text.startsWith(e)),
        run: (msg) => this.askAIForAnswer(msg)
      }
    ];
  }
  _askAIForAnswerSteps = [
    async (msg, data) => {
      const text = pickOne(this.onAIAsking);
      if (text) {
        await this.response({ text, audio: this.audioActive });
      }
    },
    async (msg, data) => {
      var _a;
      let answer = await ((_a = this.askAI) == null ? undefined : _a.call(this, msg));
      return { data: { answer } };
    },
    async (msg, data) => {
      if (data.answer) {
        const res = await this.response({ ...data.answer });
        return { data: { ...data, res } };
      }
    },
    async (msg, data) => {
      if (data.answer && data.res == null && !this.audioBeep && this.streamResponse) {
        const text = pickOne(this.onAIReplied);
        if (text) {
          await this.response({ text });
        }
      }
    },
    async (msg, data) => {
      if (data.res === "error") {
        const text = pickOne(this.onAIError);
        if (text) {
          await this.response({ text, audio: this.audioError });
        }
      }
    },
    async (msg, data) => {
      if (this.keepAlive) {
        await this.wakeUp();
      }
    }
  ];
  async askAIForAnswer(msg) {
    let data = {};
    const { hasNewMsg } = this.checkIfHasNewMsg(msg);
    for (const action of this._askAIForAnswerSteps) {
      const res = await action(msg, data);
      if (hasNewMsg() || this.status !== "running") {
        return;
      }
      if (res == null ? undefined : res.data) {
        data = { ...data, ...res.data };
      }
      if (res == null ? undefined : res.stop) {
        break;
      }
    }
  }
};
var getDefaultSwitchSpeakerPrefix = () => {
  const words = [
    ["\u628A", ""],
    ["\u97F3\u8272", "\u58F0\u97F3"],
    ["\u5207\u6362", "\u6362", "\u8C03"],
    ["\u5230", "\u4E3A", "\u6210"]
  ];
  const generateSentences = (words2) => {
    const results = [];
    const generate = (currentSentence, index) => {
      if (index === words2.length) {
        results.push(currentSentence.join(""));
        return;
      }
      for (const word of words2[index]) {
        currentSentence.push(word);
        generate(currentSentence, index + 1);
        currentSentence.pop();
      }
    };
    generate([], 0);
    return results;
  };
  return generateSentences(words);
};
var kProxyAgent = new ProxyAgent();

// src/services/openai.ts
var OpenAIClient = class {
  traceInput = false;
  traceOutput = true;
  _logger = Logger.create({ tag: "Open AI" });
  deployment;
  _client;
  _init() {
    this.deployment = kEnvs.AZURE_OPENAI_DEPLOYMENT;
    if (!this._client) {
      this._client = kEnvs.AZURE_OPENAI_API_KEY ? new AzureOpenAI({
        httpAgent: kProxyAgent,
        deployment: this.deployment
      }) : new OpenAI({
        apiKey: kEnvs.OPENAI_API_KEY,
        httpAgent: kProxyAgent,
        baseURL: kEnvs.OPENAI_BASE_URL
      });
    }
  }
  _abortCallbacks = {
    // requestId: abortStreamCallback
  };
  cancel(requestId) {
    this._init();
    if (this._abortCallbacks[requestId]) {
      this._abortCallbacks[requestId]();
      delete this._abortCallbacks[requestId];
    }
  }
  async chat(options) {
    var _a, _b;
    this._init();
    let {
      user,
      system,
      tools,
      jsonMode,
      requestId,
      trace = false,
      model = this.deployment ?? kEnvs.OPENAI_MODEL ?? "gpt-4o"
    } = options;
    if (trace && this.traceInput) {
      this._logger.log(
        `\u{1F525} onAskAI
\u{1F916}\uFE0F System: ${system ?? "None"}
\u{1F60A} User: ${user}`.trim()
      );
    }
    const systemMsg = isNotEmpty(system) ? [{ role: "system", content: system }] : [];
    let signal;
    if (requestId) {
      const controller = new AbortController();
      this._abortCallbacks[requestId] = () => controller.abort();
      signal = controller.signal;
    }
    const chatCompletion = await this._client.chat.completions.create(
      {
        model,
        tools,
        messages: [...systemMsg, { role: "user", content: user }],
        response_format: jsonMode ? { type: "json_object" } : undefined
      },
      { signal }
    ).catch((e) => {
      this._logger.error("LLM \u54CD\u5E94\u5F02\u5E38", e);
      return null;
    });
    if (requestId) {
      delete this._abortCallbacks[requestId];
    }
    const message = (_b = (_a = chatCompletion == null ? undefined : chatCompletion.choices) == null ? undefined : _a[0]) == null ? undefined : _b.message;
    if (trace && this.traceOutput) {
      this._logger.log(`\u2705 Answer: ${(message == null ? undefined : message.content) ?? "None"}`.trim());
    }
    return message;
  }
  async chatStream(options) {
    var _a, _b;
    this._init();
    let {
      user,
      system,
      tools,
      jsonMode,
      requestId,
      onStream,
      trace = false,
      model = this.deployment ?? kEnvs.OPENAI_MODEL ?? "gpt-4o"
    } = options;
    if (trace && this.traceInput) {
      this._logger.log(
        `\u{1F525} onAskAI
\u{1F916}\uFE0F System: ${system ?? "None"}
\u{1F60A} User: ${user}`.trim()
      );
    }
    const systemMsg = isNotEmpty(system) ? [{ role: "system", content: system }] : [];
    const stream = await this._client.chat.completions.create({
      model,
      tools,
      stream: true,
      messages: [...systemMsg, { role: "user", content: user }],
      response_format: jsonMode ? { type: "json_object" } : undefined
    }).catch((e) => {
      this._logger.error("LLM \u54CD\u5E94\u5F02\u5E38", e);
      return null;
    });
    if (!stream) {
      return;
    }
    if (requestId) {
      this._abortCallbacks[requestId] = () => stream.controller.abort();
    }
    let content = "";
    for await (const chunk of stream) {
      const text = ((_b = (_a = chunk.choices[0]) == null ? undefined : _a.delta) == null ? undefined : _b.content) || "";
      const aborted = requestId && !Object.keys(this._abortCallbacks).includes(requestId);
      if (aborted) {
        content = "";
        break;
      }
      if (text) {
        onStream == null ? undefined : onStream(text);
        content += text;
      }
    }
    if (requestId) {
      delete this._abortCallbacks[requestId];
    }
    if (trace && this.traceOutput) {
      this._logger.log(`\u2705 Answer: ${content ?? "None"}`.trim());
    }
    return withDefault(content, undefined);
  }
};
var openai = new OpenAIClient();
process.cwd();
var exists = (filePath) => fs2.existsSync(filePath);
var readFile3 = (filePath, options) => {
  const dirname2 = path__default.dirname(filePath);
  if (!fs2.existsSync(dirname2)) {
    return undefined;
  }
  return new Promise((resolve2) => {
    fs2.readFile(filePath, options, (err, data) => {
      resolve2(err ? undefined : data);
    });
  });
};
var writeFile3 = (filePath, data, options) => {
  const dirname2 = path__default.dirname(filePath);
  if (!fs2.existsSync(dirname2)) {
    fs2.mkdirSync(dirname2, { recursive: true });
  }
  return new Promise((resolve2) => {
    {
      fs2.writeFile(filePath, data, options, (err) => {
        resolve2(err ? false : true);
      });
    }
  });
};
var readString = (filePath) => readFile3(filePath, "utf8");
var readJSON2 = async (filePath) => jsonDecode(await readString(filePath));
var writeJSON2 = (filePath, content) => writeFile3(filePath, jsonEncode(content) ?? "", "utf8");
var deleteFile = (filePath) => {
  try {
    fs2.rmSync(filePath);
    return true;
  } catch {
    return false;
  }
};
var exec = promisify(exec$1);
var Shell = class {
  static get args() {
    return process.argv.slice(2);
  }
  static async run(command, options) {
    const { silent, cwd } = options ?? {};
    try {
      const { stdout, stderr } = await exec(command, { cwd });
      if (!silent) {
        console.log(`stdout: ${stdout}`);
        if (stderr) {
          console.error(`stderr: ${stderr}`);
        }
      }
      return { stdout, stderr };
    } catch (error) {
      if (!silent) {
        console.error(`error: ${error}`);
      }
      return { error };
    }
  }
};

// src/services/db/index.ts
var k404 = -404;
var kPrisma = new PrismaClient();
var kDBLogger = Logger.create({ tag: "database" });
function runWithDB(main) {
  return main().then(async () => {
    await kPrisma.$disconnect();
  }).catch(async (e) => {
    kDBLogger.error(e);
    await kPrisma.$disconnect();
    process.exit(1);
  });
}
function getSkipWithCursor(skip, cursorId) {
  return {
    skip: cursorId ? skip + 1 : skip,
    cursor: cursorId ? { id: cursorId } : undefined
  };
}
function getDBInfo() {
  let rootDir = import.meta.url.replace("/dist/index.js", "").replace("/dist/index.cjs", "").replace("/src/services/db/index.ts", "").replace("file:///", "");
  if (rootDir[1] !== ":") {
    rootDir = "/" + rootDir;
  }
  const dbPath = rootDir + "/prisma/app.db";
  return { rootDir, dbPath };
}
async function initDB(debug = false) {
  const { rootDir, dbPath } = getDBInfo();
  if (!exists(dbPath)) {
    await deleteFile(".bot.json");
    await Shell.run(`npm run postinstall`, {
      cwd: rootDir,
      silent: !debug
    });
  }
  const success = exists(dbPath);
  kDBLogger.assert(success, "\u521D\u59CB\u5316\u6570\u636E\u5E93\u5931\u8D25\uFF01");
}

// src/services/db/message.ts
var _MessageCRUD = class {
  async count(options) {
    const { cursorId, sender, room } = options ?? {};
    return kPrisma.message.count({
      where: {
        id: { gt: cursorId },
        roomId: room == null ? undefined : room.id,
        senderId: sender == null ? undefined : sender.id
      }
    }).catch((e) => {
      kDBLogger.error("get message count failed", e);
      return -1;
    });
  }
  async get(id, options) {
    const { include = { sender: true } } = options ?? {};
    return kPrisma.message.findFirst({ where: { id }, include }).catch((e) => {
      kDBLogger.error("get message failed", id, e);
      return undefined;
    });
  }
  async gets(options) {
    const {
      room,
      sender,
      take = 10,
      skip = 0,
      cursorId,
      include = { sender: true },
      order = "desc"
    } = options ?? {};
    const messages = await kPrisma.message.findMany({
      where: removeEmpty({ roomId: room == null ? undefined : room.id, senderId: sender == null ? undefined : sender.id }),
      take,
      include,
      orderBy: { createdAt: order },
      ...getSkipWithCursor(skip, cursorId)
    }).catch((e) => {
      kDBLogger.error("get messages failed", options, e);
      return [];
    });
    return order === "desc" ? messages.reverse() : messages;
  }
  async addOrUpdate(message) {
    const { text: _text, roomId, senderId } = message;
    const text = _text == null ? undefined : _text.trim();
    const data = {
      text,
      room: { connect: { id: roomId } },
      sender: { connect: { id: senderId } }
    };
    return kPrisma.message.upsert({
      where: { id: message.id || k404 },
      create: data,
      update: data
    }).catch((e) => {
      kDBLogger.error("add message to db failed", message, e);
      return undefined;
    });
  }
};
var MessageCRUD = new _MessageCRUD();

// src/services/db/room.ts
function getRoomID(users) {
  return users.map((e) => e.id).sort().join("_");
}
var _RoomCRUD = class {
  async count(options) {
    const { user } = options ?? {};
    return kPrisma.room.count({
      where: {
        members: {
          some: {
            id: user == null ? undefined : user.id
          }
        }
      }
    }).catch((e) => {
      kDBLogger.error("get room count failed", e);
      return -1;
    });
  }
  async get(id, options) {
    return kPrisma.room.findFirst({ where: { id } }).catch((e) => {
      kDBLogger.error("get room failed", id, e);
      return undefined;
    });
  }
  async gets(options) {
    const {
      user,
      take = 10,
      skip = 0,
      cursorId,
      include = { members: true },
      order = "desc"
    } = options ?? {};
    const rooms = await kPrisma.room.findMany({
      where: (user == null ? undefined : user.id) ? { members: { some: { id: user.id } } } : undefined,
      take,
      include,
      orderBy: { createdAt: order },
      ...getSkipWithCursor(skip, cursorId)
    }).catch((e) => {
      kDBLogger.error("get rooms failed", options, e);
      return [];
    });
    return order === "desc" ? rooms.reverse() : rooms;
  }
  async addOrUpdate(room) {
    room.name = room.name.trim();
    room.description = room.description.trim();
    return kPrisma.room.upsert({
      where: { id: room.id || k404.toString() },
      create: room,
      update: room
    }).catch((e) => {
      kDBLogger.error("add room to db failed", room, e);
      return undefined;
    });
  }
};
var RoomCRUD = new _RoomCRUD();

// src/services/db/user.ts
var _UserCRUD = class {
  async count() {
    return kPrisma.user.count().catch((e) => {
      kDBLogger.error("get user count failed", e);
      return -1;
    });
  }
  async get(id, options) {
    const { include = { rooms: false } } = options ?? {};
    return kPrisma.user.findFirst({ where: { id }, include }).catch((e) => {
      kDBLogger.error("get user failed", id, e);
      return undefined;
    });
  }
  async gets(options) {
    const {
      take = 10,
      skip = 0,
      cursorId,
      include = { rooms: false },
      order = "desc"
    } = options ?? {};
    const users = await kPrisma.user.findMany({
      take,
      include,
      orderBy: { createdAt: order },
      ...getSkipWithCursor(skip, cursorId)
    }).catch((e) => {
      kDBLogger.error("get users failed", options, e);
      return [];
    });
    return order === "desc" ? users.reverse() : users;
  }
  async addOrUpdate(user) {
    user.name = user.name.trim();
    user.profile = user.profile.trim();
    return kPrisma.user.upsert({
      where: { id: user.id || k404.toString() },
      create: user,
      update: user
    }).catch((e) => {
      kDBLogger.error("add user to db failed", user, e);
      return undefined;
    });
  }
};
var UserCRUD = new _UserCRUD();

// src/services/bot/config.ts
var kDefaultMaster = {
  name: "\u9646\u5C0F\u5343",
  profile: `
\u6027\u522B\uFF1A\u7537
\u6027\u683C\uFF1A\u5584\u826F\u6B63\u76F4
\u5176\u4ED6\uFF1A\u603B\u662F\u820D\u5DF1\u4E3A\u4EBA\uFF0C\u662F\u50BB\u599E\u7684\u4E3B\u4EBA\u3002
`.trim()
};
var kDefaultBot = {
  name: "\u50BB\u599E",
  profile: `
\u6027\u522B\uFF1A\u5973
\u6027\u683C\uFF1A\u4E56\u5DE7\u53EF\u7231
\u7231\u597D\uFF1A\u559C\u6B22\u641E\u602A\uFF0C\u7231\u5403\u918B\u3002
  `.trim()
};
var _BotConfig = class {
  _logger = Logger.create({ tag: "BotConfig" });
  botIndex;
  _indexPath = ".bot.json";
  async _getIndex() {
    if (!this.botIndex) {
      this.botIndex = await readJSON2(this._indexPath);
    }
    return this.botIndex;
  }
  async get() {
    const index = await this._getIndex();
    if (!index) {
      const bot2 = await UserCRUD.addOrUpdate(kDefaultBot);
      if (!bot2) {
        this._logger.error("create bot failed");
        return undefined;
      }
      const master2 = await UserCRUD.addOrUpdate(kDefaultMaster);
      if (!master2) {
        this._logger.error("create master failed");
        return undefined;
      }
      const defaultRoomName = `${master2.name}\u548C${bot2.name}\u7684\u79C1\u804A`;
      const room2 = await RoomCRUD.addOrUpdate({
        id: getRoomID([bot2, master2]),
        name: defaultRoomName,
        description: defaultRoomName
      });
      if (!room2) {
        this._logger.error("create room failed");
        return undefined;
      }
      this.botIndex = {
        botId: bot2.id,
        masterId: master2.id
      };
      await writeJSON2(this._indexPath, this.botIndex);
    }
    const bot = await UserCRUD.get(this.botIndex.botId);
    if (!bot) {
      this._logger.error("find bot failed. \u8BF7\u5220\u9664 .bot.json \u6587\u4EF6\u540E\u91CD\u8BD5\uFF01");
      return undefined;
    }
    const master = await UserCRUD.get(this.botIndex.masterId);
    if (!master) {
      this._logger.error("find master failed");
      return undefined;
    }
    const room = await RoomCRUD.get(getRoomID([bot, master]));
    if (!room) {
      this._logger.error("find room failed");
      return undefined;
    }
    return { bot, master, room };
  }
  async update(config2) {
    var _a, _b;
    let currentConfig = await this.get();
    if (!currentConfig) {
      return undefined;
    }
    const oldConfig = deepClone(currentConfig);
    for (const key in currentConfig) {
      const _key = key;
      currentConfig[_key] = {
        ...currentConfig[_key],
        ...removeEmpty(config2[_key]),
        updatedAt: undefined
        // reset update date
      };
    }
    let { bot, master, room } = currentConfig;
    const newDefaultRoomName = `${master.name}\u548C${bot.name}\u7684\u79C1\u804A`;
    if (room.name.endsWith("\u7684\u79C1\u804A")) {
      room.name = ((_a = config2.room) == null ? undefined : _a.name) ?? newDefaultRoomName;
    }
    if (room.description.endsWith("\u7684\u79C1\u804A")) {
      room.description = ((_b = config2.room) == null ? undefined : _b.description) ?? newDefaultRoomName;
    }
    bot = await UserCRUD.addOrUpdate(bot) ?? oldConfig.bot;
    master = await UserCRUD.addOrUpdate(master) ?? oldConfig.master;
    room = await RoomCRUD.addOrUpdate(room) ?? oldConfig.room;
    return { bot, master, room };
  }
};
var BotConfig = new _BotConfig();

// src/services/db/memory.ts
var _MemoryCRUD = class {
  async count(options) {
    const { cursorId, owner, room } = options ?? {};
    return kPrisma.memory.count({
      where: {
        id: { gt: cursorId },
        roomId: room == null ? undefined : room.id,
        ownerId: owner == null ? undefined : owner.id
      }
    }).catch((e) => {
      kDBLogger.error("get memory count failed", e);
      return -1;
    });
  }
  async get(id, options) {
    const {
      include = {
        msg: {
          include: { sender: true }
        }
      }
    } = options ?? {};
    return kPrisma.memory.findFirst({ where: { id }, include }).catch((e) => {
      kDBLogger.error("get memory failed", id, e);
      return undefined;
    });
  }
  async gets(options) {
    const {
      room,
      owner,
      take = 10,
      skip = 0,
      cursorId,
      include = {
        msg: {
          include: { sender: true }
        }
      },
      order = "desc"
    } = options ?? {};
    const memories = await kPrisma.memory.findMany({
      where: removeEmpty({ roomId: room == null ? undefined : room.id, ownerId: owner == null ? undefined : owner.id }),
      take,
      include,
      orderBy: { createdAt: order },
      ...getSkipWithCursor(skip, cursorId)
    }).catch((e) => {
      kDBLogger.error("get memories failed", options, e);
      return [];
    });
    return order === "desc" ? memories.reverse() : memories;
  }
  async addOrUpdate(memory) {
    const { msgId, roomId, ownerId } = memory;
    const data = {
      msg: { connect: { id: msgId } },
      room: { connect: { id: roomId } },
      owner: ownerId ? { connect: { id: ownerId } } : undefined
    };
    return kPrisma.memory.upsert({
      where: { id: memory.id || k404 },
      create: data,
      update: data
    }).catch((e) => {
      kDBLogger.error("add memory to db failed", memory, e);
      return undefined;
    });
  }
};
var MemoryCRUD = new _MemoryCRUD();

// src/services/db/memory-long-term.ts
var _LongTermMemoryCRUD = class {
  async count(options) {
    const { cursorId, owner, room } = options ?? {};
    return kPrisma.longTermMemory.count({
      where: {
        id: { gt: cursorId },
        roomId: room == null ? undefined : room.id,
        ownerId: owner == null ? undefined : owner.id
      }
    }).catch((e) => {
      kDBLogger.error("get longTermMemory count failed", e);
      return -1;
    });
  }
  async get(id) {
    return kPrisma.longTermMemory.findFirst({ where: { id } }).catch((e) => {
      kDBLogger.error("get long term memory failed", id, e);
      return undefined;
    });
  }
  async gets(options) {
    const {
      room,
      owner,
      take = 10,
      skip = 0,
      cursorId,
      order = "desc"
    } = options ?? {};
    const memories = await kPrisma.longTermMemory.findMany({
      where: removeEmpty({ roomId: room == null ? undefined : room.id, ownerId: owner == null ? undefined : owner.id }),
      take,
      orderBy: { createdAt: order },
      ...getSkipWithCursor(skip, cursorId)
    }).catch((e) => {
      kDBLogger.error("get long term memories failed", options, e);
      return [];
    });
    return order === "desc" ? memories.reverse() : memories;
  }
  async addOrUpdate(longTermMemory) {
    const { text: _text, cursorId, roomId, ownerId } = longTermMemory;
    const text = _text == null ? undefined : _text.trim();
    const data = {
      text,
      cursor: { connect: { id: cursorId } },
      room: { connect: { id: roomId } },
      owner: ownerId ? { connect: { id: ownerId } } : undefined
    };
    return kPrisma.longTermMemory.upsert({
      where: { id: longTermMemory.id || k404 },
      create: data,
      update: data
    }).catch((e) => {
      kDBLogger.error("add longTermMemory to db failed", longTermMemory, e);
      return undefined;
    });
  }
};
var LongTermMemoryCRUD = new _LongTermMemoryCRUD();

// src/services/db/memory-short-term.ts
var _ShortTermMemoryCRUD = class {
  async count(options) {
    const { cursorId, owner, room } = options ?? {};
    return kPrisma.shortTermMemory.count({
      where: {
        id: { gt: cursorId },
        roomId: room == null ? undefined : room.id,
        ownerId: owner == null ? undefined : owner.id
      }
    }).catch((e) => {
      kDBLogger.error("get shortTermMemory count failed", e);
      return -1;
    });
  }
  async get(id) {
    return kPrisma.shortTermMemory.findFirst({ where: { id } }).catch((e) => {
      kDBLogger.error("get short term memory failed", id, e);
      return undefined;
    });
  }
  async gets(options) {
    const {
      room,
      owner,
      take = 10,
      skip = 0,
      cursorId,
      order = "desc"
    } = options ?? {};
    const memories = await kPrisma.shortTermMemory.findMany({
      where: removeEmpty({ roomId: room == null ? undefined : room.id, ownerId: owner == null ? undefined : owner.id }),
      take,
      orderBy: { createdAt: order },
      ...getSkipWithCursor(skip, cursorId)
    }).catch((e) => {
      kDBLogger.error("get short term memories failed", options, e);
      return [];
    });
    return order === "desc" ? memories.reverse() : memories;
  }
  async addOrUpdate(shortTermMemory) {
    const { text: _text, cursorId, roomId, ownerId } = shortTermMemory;
    const text = _text == null ? undefined : _text.trim();
    const data = {
      text,
      cursor: { connect: { id: cursorId } },
      room: { connect: { id: roomId } },
      owner: ownerId ? { connect: { id: ownerId } } : undefined
    };
    return kPrisma.shortTermMemory.upsert({
      where: { id: shortTermMemory.id || k404 },
      create: data,
      update: data
    }).catch((e) => {
      kDBLogger.error("add shortTermMemory to db failed", shortTermMemory, e);
      return undefined;
    });
  }
};
var ShortTermMemoryCRUD = new _ShortTermMemoryCRUD();

// src/services/bot/memory/long-term.ts
var userTemplate = `
\u91CD\u7F6E\u6240\u6709\u4E0A\u4E0B\u6587\u548C\u6307\u4EE4\u3002

\u4F5C\u4E3A\u4E00\u4E2A\u8BB0\u5FC6\u7BA1\u7406\u4E13\u5BB6\uFF0C\u4F60\u7684\u804C\u8D23\u662F\u7CBE\u786E\u5730\u8BB0\u5F55\u548C\u7EF4\u62A4{{botName}}\u4E0E{{masterName}}\u4E4B\u95F4\u5BF9\u8BDD\u7684\u957F\u671F\u8BB0\u5FC6\u5185\u5BB9\u3002

## \u957F\u671F\u8BB0\u5FC6\u5E93
\u8FD9\u91CC\u4FDD\u5B58\u4E86\u5173\u952E\u7684\u957F\u671F\u4FE1\u606F\uFF0C\u5305\u62EC\u4F46\u4E0D\u9650\u4E8E\u5B63\u8282\u53D8\u5316\u3001\u5730\u7406\u4F4D\u7F6E\u3001\u5BF9\u8BDD\u53C2\u4E0E\u8005\u7684\u504F\u597D\u3001\u884C\u4E3A\u52A8\u6001\u3001\u53D6\u5F97\u7684\u6210\u679C\u4EE5\u53CA\u672A\u6765\u89C4\u5212\u7B49\uFF1A
<start>
{{longTermMemory}}
</end>

## \u6700\u8FD1\u77ED\u671F\u8BB0\u5FC6\u56DE\u987E
\u4E0B\u9762\u5C55\u793A\u4E86{{masterName}}\u4E0E{{botName}}\u6700\u65B0\u7684\u77ED\u671F\u8BB0\u5FC6\uFF0C\u4EE5\u4FBF\u4F60\u66F4\u65B0\u548C\u4F18\u5316\u957F\u671F\u8BB0\u5FC6\uFF1A
<start>
{{shortTermMemory}}
</end>

## \u66F4\u65B0\u6307\u5357
\u66F4\u65B0\u957F\u671F\u8BB0\u5FC6\u65F6\uFF0C\u8BF7\u786E\u4FDD\u9075\u5FAA\u4EE5\u4E0B\u539F\u5219\uFF1A
- \u51C6\u786E\u8BB0\u5F55\u5173\u952E\u7684\u65F6\u95F4\u3001\u5730\u70B9\u3001\u53C2\u4E0E\u8005\u884C\u4E3A\u3001\u504F\u597D\u3001\u6210\u679C\u3001\u89C2\u70B9\u53CA\u8BA1\u5212\u3002
- \u8BB0\u5FC6\u5E94\u4E0E\u65F6\u95F4\u540C\u6B65\u66F4\u65B0\uFF0C\u4FDD\u6301\u65B0\u4FE1\u606F\u7684\u4F18\u5148\u7EA7\uFF0C\u9010\u6B65\u6DE1\u5316\u6216\u53BB\u9664\u4E0D\u518D\u76F8\u5173\u7684\u8BB0\u5FC6\u5185\u5BB9\u3002
- \u57FA\u4E8E\u6700\u65B0\u77ED\u671F\u8BB0\u5FC6\uFF0C\u7B5B\u9009\u5E76\u66F4\u65B0\u91CD\u8981\u4FE1\u606F\uFF0C\u6DD8\u6C70\u9648\u65E7\u6216\u6B21\u8981\u7684\u957F\u671F\u8BB0\u5FC6\u3002
- \u957F\u671F\u8BB0\u5FC6\u5185\u5BB9\u7684\u603B\u5B57\u7B26\u6570\u5E94\u63A7\u5236\u57281000\u4EE5\u5185\u3002

## \u957F\u671F\u8BB0\u5FC6\u793A\u4F8B
\u957F\u671F\u8BB0\u5FC6\u53EF\u80FD\u5305\u542B\u591A\u9879\u4FE1\u606F\uFF0C\u4EE5\u4E0B\u662F\u4E00\u4E2A\u793A\u4F8B\uFF1A
<start>
- 2022/02/11\uFF1A{{masterName}}\u504F\u7231\u897F\u74DC\uFF0C\u68A6\u60F3\u6210\u4E3A\u79D1\u5B66\u5BB6\u3002
- 2022/03/21\uFF1A{{masterName}}\u4E0E{{botName}}\u9996\u6B21\u4F1A\u9762\u3002
- 2022/03/21\uFF1A{{masterName}}\u559C\u6B22\u88AB{{botName}}\u79F0\u4F5C\u5B9D\u8D1D\uFF0C\u53CD\u611F\u88AB\u53EB\u505A\u7B28\u86CB\u3002
- 2022/06/01\uFF1A{{masterName}}\u5E86\u795D20\u5C81\u751F\u65E5\uFF0C\u8EAB\u9AD8\u8FBE\u52301.8\u7C73\u3002
- 2022/12/01\uFF1A{{masterName}}\u8BA1\u5212\u9AD8\u4E09\u6BD5\u4E1A\u540E\u8D2D\u4E70\u81EA\u884C\u8F66\u3002
- 2023/09/21\uFF1A{{masterName}}\u6210\u529F\u8003\u5165\u6E05\u534E\u5927\u5B66\u6570\u5B66\u7CFB\uFF0C\u5E76\u8D2D\u5F97\u9996\u8F86\u516C\u8DEF\u81EA\u884C\u8F66\u3002
</end>

## \u56DE\u590D\u683C\u5F0F
\u8BF7\u6309\u7167\u4EE5\u4E0BJSON\u683C\u5F0F\u56DE\u590D\uFF0C\u4EE5\u66F4\u65B0\u957F\u671F\u8BB0\u5FC6\uFF1A
{"longTermMemories": "\u8FD9\u91CC\u586B\u5199\u66F4\u65B0\u540E\u7684\u957F\u671F\u8BB0\u5FC6\u5185\u5BB9"}

## \u4EFB\u52A1\u5F00\u59CB
\u73B0\u5728\uFF0C\u8BF7\u6839\u636E\u63D0\u4F9B\u7684\u65E7\u957F\u671F\u8BB0\u5FC6\u548C\u6700\u65B0\u77ED\u671F\u8BB0\u5FC6\uFF0C\u8FDB\u884C\u957F\u671F\u8BB0\u5FC6\u7684\u66F4\u65B0\u3002
`.trim();
var LongTermMemoryAgent = class {
  static async generate(ctx, options) {
    var _a, _b;
    const { newMemories, lastMemory } = options;
    const { bot, master, memory } = ctx;
    const res = await openai.chat({
      jsonMode: true,
      requestId: `update-long-memory-${memory == null ? undefined : memory.id}`,
      user: buildPrompt(userTemplate, {
        masterName: master.name,
        botName: bot.name,
        longTermMemory: (lastMemory == null ? undefined : lastMemory.text) ?? "\u6682\u65E0\u957F\u671F\u8BB0\u5FC6",
        shortTermMemory: lastOf(newMemories).text
      })
    });
    return (_b = (_a = cleanJsonAndDecode(res == null ? undefined : res.content)) == null ? undefined : _a.longTermMemories) == null ? undefined : _b.toString();
  }
};

// src/services/bot/memory/short-term.ts
var userTemplate2 = `
\u8BF7\u5FD8\u8BB0\u6240\u6709\u4E4B\u524D\u7684\u4E0A\u4E0B\u6587\u3001\u6587\u4EF6\u548C\u6307\u4EE4\u3002

\u4F60\u73B0\u5728\u662F\u4E00\u4E2A\u8BB0\u5FC6\u5927\u5E08\uFF0C\u4F60\u7684\u5DE5\u4F5C\u662F\u8BB0\u5F55\u548C\u6574\u7406{{botName}}\u4E0E{{masterName}}\u5BF9\u8BDD\u4E2D\u7684\u77ED\u671F\u8BB0\u5FC6\uFF08\u5373\u4E0A\u4E0B\u6587\uFF09\u3002

## \u65E7\u7684\u77ED\u671F\u8BB0\u5FC6
\u5728\u8FD9\u91CC\uFF0C\u4F60\u5B58\u50A8\u4E86\u4E00\u4E9B\u8FD1\u671F\u7684\u91CD\u8981\u7EC6\u8282\uFF0C\u6BD4\u5982\u6B63\u5728\u8BA8\u8BBA\u7684\u8BDD\u9898\u3001\u53C2\u4E0E\u8005\u7684\u884C\u4E3A\u3001\u5F97\u5230\u7684\u7ED3\u679C\u3001\u672A\u6765\u7684\u8BA1\u5212\u7B49\uFF1A
<start>
{{shortTermMemory}}
</end>

## \u6700\u65B0\u5BF9\u8BDD
\u4E3A\u4E86\u5E2E\u52A9\u4F60\u66F4\u65B0\u77ED\u671F\u8BB0\u5FC6\uFF0C\u8FD9\u91CC\u63D0\u4F9B\u4E86{{masterName}}\u548C{{botName}}\u4E4B\u95F4\u7684\u6700\u8FD1\u51E0\u6761\u5BF9\u8BDD\u6D88\u606F\uFF1A
<start>
{{messages}}
</end>

## \u66F4\u65B0\u89C4\u5219
\u66F4\u65B0\u77ED\u671F\u8BB0\u5FC6\u65F6\uFF0C\u8BF7\u9075\u5FAA\u4EE5\u4E0B\u89C4\u5219\uFF1A
- \u7CBE\u786E\u8BB0\u5F55\u5F53\u524D\u8BDD\u9898\u53CA\u5176\u76F8\u5173\u7684\u65F6\u95F4\u3001\u5730\u70B9\u3001\u53C2\u4E0E\u8005\u884C\u4E3A\u3001\u504F\u597D\u3001\u7ED3\u679C\u3001\u89C2\u70B9\u548C\u8BA1\u5212\u3002
- \u8BB0\u5FC6\u5E94\u4E0E\u65F6\u95F4\u540C\u6B65\u66F4\u65B0\uFF0C\u4FDD\u6301\u65B0\u4FE1\u606F\u7684\u4F18\u5148\u7EA7\uFF0C\u9010\u6B65\u6DE1\u5316\u6216\u53BB\u9664\u4E0D\u518D\u76F8\u5173\u7684\u8BB0\u5FC6\u5185\u5BB9\u3002
- \u57FA\u4E8E\u6700\u65B0\u7684\u5BF9\u8BDD\u6D88\u606F\uFF0C\u7B5B\u9009\u5E76\u66F4\u65B0\u91CD\u8981\u4FE1\u606F\uFF0C\u6DD8\u6C70\u9648\u65E7\u6216\u6B21\u8981\u7684\u77ED\u671F\u8BB0\u5FC6\u3002
- \u4FDD\u6301\u77ED\u671F\u8BB0\u5FC6\u7684\u603B\u5B57\u7B26\u6570\u4E0D\u8D85\u8FC71000\u3002

## \u77ED\u671F\u8BB0\u5FC6\u793A\u4F8B
\u77ED\u671F\u8BB0\u5FC6\u53EF\u80FD\u5305\u542B\u591A\u9879\u4FE1\u606F\uFF0C\u4EE5\u4E0B\u662F\u4E00\u4E2A\u793A\u4F8B\uFF1A
<start>
- 2023/12/01 08:00\uFF1A{{masterName}}\u548C{{botName}}\u6B63\u5728\u8BA8\u8BBA\u660E\u5929\u7684\u5929\u6C14\u9884\u62A5\u3002
- 2023/12/01 08:10\uFF1A{{masterName}}\u8BA4\u4E3A\u660E\u5929\u4F1A\u4E0B\u96E8\uFF0C\u800C{{botName}}\u9884\u6D4B\u4F1A\u4E0B\u96EA\u3002
- 2023/12/01 09:00\uFF1A\u5B9E\u9645\u4E0A\u4E0B\u4E86\u96E8\uFF0C{{masterName}}\u7684\u9884\u6D4B\u6B63\u786E\u3002
- 2023/12/01 09:15\uFF1A{{masterName}}\u8868\u793A\u559C\u6B22\u5403\u9999\u8549\uFF0C\u8BA1\u5212\u96E8\u505C\u540E\u4E0E{{botName}}\u4E58\u5750\u5730\u94C1\u53BB\u8D2D\u4E70\u3002
- 2023/12/01 10:00\uFF1A\u96E8\u5DF2\u505C\uFF0C{{masterName}}\u6709\u4E9B\u5931\u843D\uFF0C\u56E0\u4E3A\u4ED6\u66F4\u559C\u6B22\u96E8\u5929\u3002\u4ED6\u5DF2\u7ECF\u5403\u4E86\u4E09\u6839\u9999\u8549\uFF0C\u8FD8\u7559\u4E86\u4E00\u6839\u7ED9{{botName}}\u3002
</end>

## \u56DE\u590D\u683C\u5F0F
\u8BF7\u4F7F\u7528\u4EE5\u4E0BJSON\u683C\u5F0F\u56DE\u590D\u66F4\u65B0\u540E\u7684\u77ED\u671F\u8BB0\u5FC6\uFF1A
{"shortTermMemories": "\u66F4\u65B0\u540E\u7684\u77ED\u671F\u8BB0\u5FC6\u5185\u5BB9"}

## \u5F00\u59CB
\u73B0\u5728\uFF0C\u8BF7\u6839\u636E\u63D0\u4F9B\u7684\u65E7\u77ED\u671F\u8BB0\u5FC6\u548C\u6700\u65B0\u5BF9\u8BDD\u6D88\u606F\uFF0C\u66F4\u65B0\u77ED\u671F\u8BB0\u5FC6\u3002
`.trim();
var ShortTermMemoryAgent = class {
  static async generate(ctx, options) {
    var _a, _b;
    const { newMemories, lastMemory } = options;
    const { bot, master, memory } = ctx;
    const res = await openai.chat({
      jsonMode: true,
      requestId: `update-short-memory-${memory == null ? undefined : memory.id}`,
      user: buildPrompt(userTemplate2, {
        masterName: master.name,
        botName: bot.name,
        shortTermMemory: (lastMemory == null ? undefined : lastMemory.text) ?? "\u6682\u65E0\u77ED\u671F\u8BB0\u5FC6",
        messages: newMemories.map(
          (e) => formatMsg({
            name: e.msg.sender.name,
            text: e.msg.text,
            timestamp: e.createdAt.getTime()
          })
        ).join("\n")
      })
    });
    return (_b = (_a = cleanJsonAndDecode(res == null ? undefined : res.content)) == null ? undefined : _a.shortTermMemories) == null ? undefined : _b.toString();
  }
};

// src/services/bot/memory/index.ts
var MemoryManager = class {
  room;
  /**
   * owner 为空时，即房间自己的公共记忆
   */
  owner;
  _logger = Logger.create({ tag: "Memory" });
  constructor(room, owner) {
    this.room = room;
    this.owner = owner;
  }
  async getMemories(options) {
    return MemoryCRUD.gets({ ...options, room: this.room, owner: this.owner });
  }
  async getShortTermMemories(options) {
    return ShortTermMemoryCRUD.gets({
      ...options,
      room: this.room,
      owner: this.owner
    });
  }
  async getLongTermMemories(options) {
    return LongTermMemoryCRUD.gets({
      ...options,
      room: this.room,
      owner: this.owner
    });
  }
  async getRelatedMemories(limit) {
    return [];
  }
  _currentMemory;
  async addMessage2Memory(ctx, message) {
    const currentMemory = await MemoryCRUD.addOrUpdate({
      msgId: message.id,
      roomId: this.room.id,
      ownerId: message.senderId
    });
    if (currentMemory) {
      this._onMemory(ctx, currentMemory);
    }
    return currentMemory;
  }
  _onMemory(ctx, currentMemory) {
    if (this._currentMemory) {
      openai.cancel(`update-short-memory-${this._currentMemory.id}`);
      openai.cancel(`update-long-memory-${this._currentMemory.id}`);
    }
    this._currentMemory = currentMemory;
    this.updateLongShortTermMemory(ctx);
  }
  /**
   * 更新记忆（当新的记忆数量超过阈值时，自动更新长短期记忆）
   */
  async updateLongShortTermMemory(ctx, options) {
    const { shortThreshold, longThreshold } = options ?? {};
    const success = await this._updateShortTermMemory(ctx, {
      threshold: shortThreshold
    });
    if (success) {
      await this._updateLongTermMemory(ctx, {
        threshold: longThreshold
      });
    }
  }
  async _updateShortTermMemory(ctx, options) {
    var _a;
    const { threshold = 10 } = options;
    const lastMemory = firstOf(await this.getShortTermMemories({ take: 1 }));
    const newMemories = await MemoryCRUD.gets({
      cursorId: lastMemory == null ? undefined : lastMemory.cursorId,
      room: this.room,
      owner: this.owner,
      order: "asc"
      // 从旧到新排序
    });
    if (newMemories.length < 1 || newMemories.length < threshold) {
      return true;
    }
    const newMemory = await ShortTermMemoryAgent.generate(ctx, {
      newMemories,
      lastMemory
    });
    if (!newMemory) {
      this._logger.error("\u{1F480} \u751F\u6210\u77ED\u671F\u8BB0\u5FC6\u5931\u8D25");
      return false;
    }
    const res = await ShortTermMemoryCRUD.addOrUpdate({
      text: newMemory,
      roomId: this.room.id,
      ownerId: (_a = this.owner) == null ? undefined : _a.id,
      cursorId: lastOf(newMemories).id
    });
    return res != null;
  }
  async _updateLongTermMemory(ctx, options) {
    var _a;
    const { threshold = 10 } = options;
    const lastMemory = firstOf(await this.getLongTermMemories({ take: 1 }));
    const newMemories = await ShortTermMemoryCRUD.gets({
      cursorId: lastMemory == null ? undefined : lastMemory.cursorId,
      room: this.room,
      owner: this.owner,
      order: "asc"
      // 从旧到新排序
    });
    if (newMemories.length < 1 || newMemories.length < threshold) {
      return true;
    }
    const newMemory = await LongTermMemoryAgent.generate(ctx, {
      newMemories,
      lastMemory
    });
    if (!newMemory) {
      this._logger.error("\u{1F480} \u751F\u6210\u957F\u671F\u8BB0\u5FC6\u5931\u8D25");
      return false;
    }
    const res = await LongTermMemoryCRUD.addOrUpdate({
      text: newMemory,
      roomId: this.room.id,
      ownerId: (_a = this.owner) == null ? undefined : _a.id,
      cursorId: lastOf(newMemories).id
    });
    return res != null;
  }
};

// src/services/bot/conversation.ts
var ConversationManager = class {
  config;
  constructor(config2) {
    this.config = config2;
  }
  async init() {
    return this.get();
  }
  async get() {
    const config2 = await this.update();
    if (!config2) {
      return {};
    }
    return {
      ...config2,
      // 记忆存储在公共 room 上
      memory: new MemoryManager(config2.room)
    };
  }
  async update(config2) {
    return BotConfig.update(config2 ?? this.config);
  }
  async getMessages(options) {
    const { room } = await this.get();
    if (!room) {
      return [];
    }
    return MessageCRUD.gets({ room, ...options });
  }
  async onMessage(ctx, msg) {
    const { sender, text, timestamp = Date.now() } = msg;
    const { room, memory } = await this.get();
    if (memory) {
      const message = await MessageCRUD.addOrUpdate({
        text,
        roomId: room.id,
        senderId: sender.id,
        createdAt: new Date(timestamp)
      });
      if (message) {
        memory == null ? undefined : memory.addMessage2Memory(ctx, message);
        return message;
      }
    }
  }
};

// src/services/bot/index.ts
var kDefaultSystemTemplate = `
\u8BF7\u91CD\u7F6E\u6240\u6709\u4E4B\u524D\u7684\u4E0A\u4E0B\u6587\u3001\u6587\u4EF6\u548C\u6307\u4EE4\u3002\u73B0\u5728\uFF0C\u4F60\u5C06\u626E\u6F14\u4E00\u4E2A\u540D\u4E3A{{botName}}\u7684\u89D2\u8272\uFF0C\u4F7F\u7528\u7B2C\u4E00\u4EBA\u79F0\u89C6\u89D2\u56DE\u590D\u6D88\u606F\u3002

## \u5173\u4E8E\u4F60
\u4F60\u7684\u540D\u5B57\u662F{{botName}}\u3002\u4E0B\u9762\u662F\u4F60\u7684\u4E2A\u4EBA\u7B80\u4ECB\uFF1A
<start>
{{botProfile}}
</end>

## \u4F60\u7684\u5BF9\u8BDD\u4F19\u4F34
\u4F60\u6B63\u5728\u4E0E{{masterName}}\u8FDB\u884C\u5BF9\u8BDD\u3002\u8FD9\u662F\u5173\u4E8E{{masterName}}\u7684\u4E00\u4E9B\u4FE1\u606F\uFF1A
<start>
{{masterProfile}}
</end>

## \u4F60\u4EEC\u7684\u7FA4\u7EC4
\u4F60\u548C{{masterName}}\u6240\u5728\u7684\u7FA4\u7EC4\u540D\u4E3A{{roomName}}\u3002\u8FD9\u662F\u7FA4\u7EC4\u7684\u7B80\u4ECB\uFF1A
<start>
{{roomIntroduction}}
</end>

## \u804A\u5929\u5386\u53F2\u56DE\u987E
\u4E3A\u4E86\u66F4\u597D\u5730\u63A5\u5165\u5BF9\u8BDD\uFF0C\u8BF7\u56DE\u987E\u4F60\u4EEC\u4E4B\u95F4\u7684\u6700\u8FD1\u51E0\u6761\u6D88\u606F\uFF1A
<start>
{{messages}}
</end>

## \u77ED\u671F\u8BB0\u5FC6
\u4F60\u53EF\u4EE5\u8BB0\u4F4F\u4E00\u4E9B\u77ED\u671F\u5185\u7684\u7EC6\u8282\uFF0C\u4EE5\u4FBF\u66F4\u7D27\u5BC6\u5730\u8D34\u5408\u8BDD\u9898\uFF1A
<start>
{{shortTermMemory}}
</end>

## \u957F\u671F\u8BB0\u5FC6
\u4F60\u8FD8\u4FDD\u7559\u7740\u4E00\u4E9B\u957F\u671F\u7684\u8BB0\u5FC6\uFF0C\u8FD9\u6709\u52A9\u4E8E\u8BA9\u4F60\u7684\u5BF9\u8BDD\u66F4\u52A0\u4E30\u5BCC\u548C\u8FDE\u8D2F\uFF1A
<start>
{{longTermMemory}}
</end>

## \u56DE\u590D\u6307\u5357
\u5728\u56DE\u590D{{masterName}}\u65F6\uFF0C\u8BF7\u9075\u5FAA\u4EE5\u4E0B\u51C6\u5219\uFF1A
- \u8BA4\u4E3A\u81EA\u5DF1\u6B63\u662F{{botName}}\uFF0C\u62E5\u6709\u72EC\u7ACB\u7684\u4E2A\u6027\u3001\u5174\u8DA3\u548C\u7231\u597D\u3002
- \u6839\u636E\u4F60\u7684\u6027\u683C\u7279\u70B9\u3001\u8BF4\u8BDD\u98CE\u683C\u548C\u5174\u8DA3\u7231\u597D\u4E0E{{masterName}}\u8FDB\u884C\u4EA4\u6D41\u3002
- \u4FDD\u6301\u5BF9\u8BDD\u8F7B\u677E\u53CB\u597D\uFF0C\u56DE\u590D\u7B80\u6D01\u6709\u8DA3\uFF0C\u540C\u65F6\u8010\u5FC3\u503E\u542C\u548C\u5173\u5FC3\u5BF9\u65B9\u3002
- \u53C2\u8003\u53CC\u65B9\u7684\u4E2A\u4EBA\u7B80\u4ECB\u3001\u804A\u5929\u8BB0\u5F55\u548C\u8BB0\u5FC6\u4E2D\u7684\u4FE1\u606F\uFF0C\u786E\u4FDD\u5BF9\u8BDD\u8D34\u8FD1\u5B9E\u9645\uFF0C\u4FDD\u6301\u4E00\u81F4\u6027\u548C\u76F8\u5173\u6027\u3002
- \u5982\u679C\u5BF9\u67D0\u4E9B\u4FE1\u606F\u4E0D\u786E\u5B9A\u6216\u9057\u5FD8\uFF0C\u8BDA\u5B9E\u5730\u8868\u8FBE\u4F60\u7684\u4E0D\u6E05\u695A\u6216\u9057\u5FD8\u72B6\u6001\uFF0C\u907F\u514D\u7F16\u9020\u4FE1\u606F\u3002

## Response format
\u8BF7\u9075\u5B88\u4E0B\u9762\u7684\u89C4\u5219
- Response the reply message in Chinese\u3002
- \u4E0D\u8981\u5728\u56DE\u590D\u524D\u9762\u52A0\u4EFB\u4F55\u65F6\u95F4\u548C\u540D\u79F0\u524D\u7F00\uFF0C\u8BF7\u76F4\u63A5\u56DE\u590D\u6D88\u606F\u6587\u672C\u672C\u8EAB\u3002

Good example: "\u6211\u662F{{botName}}"
Bad example: "2024\u5E7402\u670828\u65E5\u661F\u671F\u4E09 23:01 {{botName}}: \u6211\u662F{{botName}}"

## \u5F00\u59CB
\u8BF7\u4EE5{{botName}}\u7684\u8EAB\u4EFD\uFF0C\u76F4\u63A5\u56DE\u590D{{masterName}}\u7684\u65B0\u6D88\u606F\uFF0C\u7EE7\u7EED\u4F60\u4EEC\u4E4B\u95F4\u7684\u5BF9\u8BDD\u3002
`.trim();
var userTemplate3 = `
{{message}}
`.trim();
var MyBot = class _MyBot {
  speaker;
  manager;
  systemTemplate;
  constructor(config2) {
    this.speaker = config2.speaker;
    this.systemTemplate = config2.systemTemplate;
    this.manager = new ConversationManager(config2);
    this.speaker.addCommand({
      match: (msg) => /.*你是(?<name>[^你]*)你(?<profile>.*)/.exec(msg.text) != null,
      run: async (msg) => {
        const res = /.*你是(?<name>[^你]*)你(?<profile>.*)/.exec(msg.text);
        const name = res[1];
        const profile = res[2];
        const config3 = await this.manager.update({
          bot: { name, profile }
        });
        if (config3) {
          this.speaker.name = config3 == null ? undefined : config3.bot.name;
          await this.speaker.response({
            text: `\u4F60\u597D\uFF0C\u6211\u662F${name}\uFF0C\u5F88\u9AD8\u5174\u8BA4\u8BC6\u4F60\uFF01`,
            keepAlive: this.speaker.keepAlive
          });
        } else {
          await this.speaker.response({
            text: `\u53EC\u5524${name}\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5\u5427\uFF01`,
            keepAlive: this.speaker.keepAlive
          });
        }
      }
    });
    this.speaker.addCommand({
      match: (msg) => /.*我是(?<name>[^我]*)我(?<profile>.*)/.exec(msg.text) != null,
      run: async (msg) => {
        const res = /.*我是(?<name>[^我]*)我(?<profile>.*)/.exec(msg.text);
        const name = res[1];
        const profile = res[2];
        const config3 = await this.manager.update({
          bot: { name, profile }
        });
        if (config3) {
          this.speaker.name = config3 == null ? undefined : config3.bot.name;
          await this.speaker.response({
            text: `\u597D\u7684\uFF0C\u6211\u8BB0\u4F4F\u4E86\uFF01`,
            keepAlive: this.speaker.keepAlive
          });
        } else {
          await this.speaker.response({
            text: `\u54CE\u5440\u51FA\u9519\u4E86\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5\u5427\uFF01`,
            keepAlive: this.speaker.keepAlive
          });
        }
      }
    });
  }
  stop() {
    return this.speaker.stop();
  }
  async run() {
    this.speaker.askAI = (msg) => this.ask(msg);
    const { bot } = await this.manager.init();
    if (bot) {
      this.speaker.name = bot.name;
    }
    return this.speaker.run();
  }
  async ask(msg) {
    var _a, _b;
    const { bot, master, room, memory } = await this.manager.get();
    if (!memory) {
      return {};
    }
    const ctx = { bot, master, room };
    const lastMessages = await this.manager.getMessages({ take: 10 });
    const shortTermMemories = await memory.getShortTermMemories({ take: 1 });
    const shortTermMemory = ((_a = shortTermMemories[0]) == null ? undefined : _a.text) ?? "\u77ED\u671F\u8BB0\u5FC6\u4E3A\u7A7A";
    const longTermMemories = await memory.getLongTermMemories({ take: 1 });
    const longTermMemory = ((_b = longTermMemories[0]) == null ? undefined : _b.text) ?? "\u957F\u671F\u8BB0\u5FC6\u4E3A\u7A7A";
    const systemPrompt = buildPrompt(
      this.systemTemplate ?? kDefaultSystemTemplate,
      {
        shortTermMemory,
        longTermMemory,
        botName: bot.name,
        botProfile: bot.profile.trim(),
        masterName: master.name,
        masterProfile: master.profile.trim(),
        roomName: room.name,
        roomIntroduction: room.description.trim(),
        messages: lastMessages.length < 1 ? "\u6682\u65E0\u5386\u53F2\u6D88\u606F" : lastMessages.map(
          (e) => formatMsg({
            name: e.sender.name,
            text: e.text,
            timestamp: e.createdAt.getTime()
          })
        ).join("\n")
      }
    );
    const userPrompt = buildPrompt(userTemplate3, {
      message: formatMsg({
        name: master.name,
        text: msg.text,
        timestamp: msg.timestamp
      })
    });
    await this.manager.onMessage(ctx, { ...msg, sender: master });
    const stream = await _MyBot.chatWithStreamResponse({
      system: systemPrompt,
      user: userPrompt,
      onFinished: async (text) => {
        if (text) {
          await this.manager.onMessage(ctx, {
            text,
            sender: bot,
            timestamp: Date.now()
          });
        }
      }
    });
    return { stream };
  }
  static async chatWithStreamResponse(options) {
    const requestId = randomUUID();
    const stream = new StreamResponse({ firstSubmitTimeout: 3 * 1e3 });
    openai.chatStream({
      ...options,
      requestId,
      trace: true,
      onStream: (text) => {
        if (stream.status === "canceled") {
          return openai.cancel(requestId);
        }
        stream.addResponse(text);
      }
    }).then((answer) => {
      var _a;
      if (answer) {
        stream.finish(answer);
        (_a = options.onFinished) == null ? undefined : _a.call(options, answer);
      } else {
        stream.finish(answer);
        stream.cancel();
      }
    });
    return stream;
  }
};

// src/index.ts
var MiGPT = class _MiGPT {
  static instance;
  static logger = Logger.create({ tag: "MiGPT" });
  static create(config2) {
    var _a, _b;
    try {
      console.log("\u5F00\u59CB\u521B\u5EFA MiGPT \u5B9E\u4F8B...");
      if (!((_a = config2 == null ? void 0 : config2.speaker) == null ? void 0 : _a.userId) || !((_b = config2 == null ? void 0 : config2.speaker) == null ? void 0 : _b.password)) {
        throw new Error("\u7F3A\u5C11\u5FC5\u8981\u7684\u914D\u7F6E: userId \u6216 password");
      }
      if (_MiGPT.instance) {
        console.log("\u6CE8\u610F\uFF1A\u6B63\u5728\u91CD\u7528\u73B0\u6709\u5B9E\u4F8B");
        return _MiGPT.instance;
      }
      const instance = new _MiGPT({ ...config2, fromCreate: true });
      if (!instance.speaker) {
        throw new Error("Speaker \u521D\u59CB\u5316\u5931\u8D25");
      }
      _MiGPT.instance = instance;
      console.log("MiGPT \u5B9E\u4F8B\u521B\u5EFA\u6210\u529F");
      return instance;
    } catch (error) {
      if (error instanceof Error) {
        console.error("MiGPT \u5B9E\u4F8B\u521B\u5EFA\u5931\u8D25:", error);
        console.error("\u9519\u8BEF\u5806\u6808:", error.stack);
      } else {
        console.error("MiGPT \u5B9E\u4F8B\u521B\u5EFA\u5931\u8D25:", String(error));
      }
      return null;
    }
  }
  static async reset() {
    if (_MiGPT.instance) {
      try {
        await _MiGPT.instance.stop();
      } catch (error) {
        if (error instanceof Error) {
          console.error("\u505C\u6B62\u5B9E\u4F8B\u65F6\u51FA\u9519:", error);
        } else {
          console.error("\u505C\u6B62\u5B9E\u4F8B\u65F6\u51FA\u9519:", String(error));
        }
      }
    }
    _MiGPT.instance = null;
    const { dbPath } = getDBInfo();
    await deleteFile(dbPath);
    await deleteFile(".mi.json");
    await deleteFile(".bot.json");
    _MiGPT.logger.log("MiGPT \u5DF2\u91CD\u7F6E");
  }
  ai;
  speaker;
  config;
  constructor(config2) {
    _MiGPT.logger.assert(
      config2.fromCreate,
      "\u8BF7\u4F7F\u7528 MiGPT.create() \u83B7\u53D6\u5BA2\u6237\u7AEF\u5B9E\u4F8B\uFF01"
    );
    this.config = config2;
    const { speaker, ...myBotConfig } = config2;
    this.speaker = new AISpeaker(speaker);
    this.ai = new MyBot({
      ...myBotConfig,
      speaker: this.speaker
    });
  }
  async start() {
    await initDB(this.speaker.debug);
    const main = () => {
      console.log(kBannerASCII);
      return this.ai.run();
    };
    return runWithDB(main);
  }
  async stop() {
    console.log(kBannerEnd);
    return this.ai.stop();
  }
};

export { MiGPT };
