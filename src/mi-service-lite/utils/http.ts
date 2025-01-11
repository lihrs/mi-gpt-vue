import axios, { AxiosRequestConfig, CreateAxiosDefaults } from "axios";
import { isNotEmpty } from "./is";
import { Debugger } from "./debug";
import { sleep } from "./base";
import { getMiService } from "../mi";
import { MiAccount } from "../mi/types";
import { jsonEncode } from "./json";

const _baseConfig: CreateAxiosDefaults = {
  proxy: false,
  decompress: true,
  headers: {
    "Accept-Encoding": "gzip, deflate",
    "Content-Type": "application/x-www-form-urlencoded",
    "User-Agent":
      "Dalvik/2.1.0 (Linux; U; Android 10; RMX2111 Build/QP1A.190711.020) APP/xiaomi.mico APPV/2004040 MK/Uk1YMjExMQ== PassportSDK/3.8.3 passport-ui/3.8.3",
  },
};

const _http = axios.create(_baseConfig);

interface HttpError {
  isError: true;
  error: any;
  code: string;
  message: string;
}

type RequestConfig = AxiosRequestConfig<any> & {
  account?: MiAccount;
  setAccount?: (newAccount: any) => void;
  rawResponse?: boolean;
  cookies?: Record<string, string | number | boolean | undefined>;
};

_http.interceptors.response.use(
  (res: any) => {
    if (res.config.rawResponse) {
      return res;
    }
    return res.data;
  },
  async (err) => {
    // 401 登录凭证过期后，自动刷新 token
    const newResult = await tokenRefresher.refreshTokenAndRetry(err);
    if (newResult) {
      return newResult;
    }
    const error = err.response?.data?.error || err.response?.data;
    const request = {
      method: err.config.method,
      url: err.config.url,
      headers: jsonEncode(err.config.headers),
      data: jsonEncode({ body: err.config.data }),
    };
    const response = !err.response
      ? undefined
      : {
          url: err.config.url,
          status: err.response.status,
          headers: jsonEncode(err.response.headers),
          data: jsonEncode({ body: err.response.data }),
        };
    return {
      isError: true,
      code: error?.code || err.response?.status || err.code || "未知",
      message:
        error?.message || err.response?.statusText || err.message || "未知",
      error: { request, response },
    };
  }
);

class HTTPClient {
  // 默认 3 秒超时
  timeout = 3 * 1000;

  async get<T = any>(
    url: string,
    query?:
      | Record<string, string | number | boolean | undefined>
      | RequestConfig,
    config?: RequestConfig
  ): Promise<T | HttpError> {
    if (config === undefined) {
      config = query;
      query = undefined;
    }
    return _http.get<T>(
      HTTPClient.buildURL(url, query),
      HTTPClient.buildConfig(config)
    ) as any;
  }

  async post<T = any>(
    url: string,
    data?: any,
    config?: RequestConfig
  ): Promise<T | HttpError> {
    return _http.post<T>(url, data, HTTPClient.buildConfig(config)) as any;
  }

  static buildURL = (url: string, query?: Record<string, any>) => {
    const _url = new URL(url);
    for (const [key, value] of Object.entries(query ?? {})) {
      if (isNotEmpty(value)) {
        _url.searchParams.append(key, value.toString());
      }
    }
    return _url.href;
  };

  static buildConfig = (config?: RequestConfig) => {
    if (config?.cookies) {
      config.headers = {
        ...config.headers,
        Cookie: Object.entries(config.cookies)
          .map(
            ([key, value]) => `${key}=${value == null ? "" : value.toString()};`
          )
          .join(" "),
      };
    }
    if (config && !config.timeout) {
      config.timeout = Http.timeout; // 默认超时时间为 3 秒
    }
    return config;
  };
}

export const Http = new HTTPClient();

class TokenRefresher {
  isRefreshing = false;

  /**
   * 自动刷新过期的凭证，并重新发送请求
   */
  async refreshTokenAndRetry(err: any, maxRetry = 3) {
    const isMina = err?.config?.url?.includes("mina.mi.com");
    const isMIoT = err?.config?.url?.includes("io.mi.com");
    if ((!isMina && !isMIoT) || err.response?.status !== 401) {
      return;
    }
    if (this.isRefreshing) {
      return;
    }
    let result: any;
    this.isRefreshing = true;
    let newServiceAccount = undefined;
    for (let i = 0; i < maxRetry; i++) {
      if (Debugger.enableTrace) {
        console.log(`❌ 登录凭证已过期，正在尝试刷新 Token ${i + 1}`);
      }
      newServiceAccount = await this.refreshToken(err);
      if (newServiceAccount) {
        // 刷新成功，重新请求
        result = await this.retry(err, newServiceAccount);
        break;
      }
      // 隔 3 秒后重试
      await sleep(3000);
    }
    this.isRefreshing = false;
    if (!newServiceAccount) {
      console.error("❌ 刷新登录凭证失败，请检查账号密码是否仍然有效。");
    }
    return result;
  }

  /**
   * 刷新登录凭证并同步到本地
   */
  async refreshToken(err: any) {
    const isMina = err?.config?.url?.includes("mina.mi.com");
    const account: any = (
      await getMiService({ service: isMina ? "mina" : "miiot", relogin: true })
    )?.account;
    if (account && err.config.account) {
      // 更新登录凭证
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
  async retry(err: any, account: any) {
    // 更新 cookies
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
    // 重新请求
    return _http(HTTPClient.buildConfig(err.config)!);
  }
}

const tokenRefresher = new TokenRefresher();
