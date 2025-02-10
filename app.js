import { MiGPT } from "./dist/index.cjs";
import fs, { readFileSync } from 'fs';
import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'net';
import globalCatch from "global-cache";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

let miGPTInstance = null;

/**
 * 解析配置字符串的函数
 * @param {string} configStr 配置字符串
 * @returns {Object} 解析后的配置对象
 */
const parseConfig = (configStr) => {
  try {
    // 移除 export default 和结尾的分号
    const jsonStr = configStr
      .replace(/export\s+default\s+/, '')
      .replace(/;$/, '')
      .trim();

    // 使用 JSON.parse 而不是 eval
    try {
      return JSON.parse(jsonStr);
    } catch (parseError) {
      // 如果 JSON.parse 失败，尝试使用 eval（不推荐，但作为后备方案）
      const config = eval(`(${jsonStr})`);
      if (typeof config !== 'object') {
        throw new Error('解析结果不是有效的对象');
      }
      return config;
    }
  } catch (error) {
    throw new Error(`配置解析失败: ${error.message}`);
  }
}

/**
 * 删除.bot.json和.mi.json
*/
const deleteBotAndMiFile = () => {
  //删除.bot.json
  const botJsonPath = './.bot.json'
  console.log(`检查${botJsonPath}`)
  if (fs.existsSync(botJsonPath)) {
    console.log(`存在${botJsonPath}，就删除它`);
    // 文件存在，删除文件
    fs.unlinkSync(botJsonPath);
  }
  //删除.mi.json
  const miJsonPath = './.mi.json'
  console.log(`检查${miJsonPath}`)
  if (fs.existsSync(miJsonPath)) {
    console.log(`存在${miJsonPath}，就删除它`);
    // 文件存在，删除文件
    fs.unlinkSync(miJsonPath);
  }
}

/**
 * 递归地更新 parsedConfig 中的值
 * @param {Object} parsedConfig 解析后的配置对象
 * @param {Object} config 新的配置对象
 */
const updateConfig = (parsedConfig, config) => {
  for (const key in config) {
    if (config.hasOwnProperty(key)) {
      if (typeof config[key] === 'object' && config[key] !== null) {
        if (!parsedConfig[key]) {
          parsedConfig[key] = {};
        }
        updateConfig(parsedConfig[key], config[key]);
      } else {
        parsedConfig[key] = config[key];
      }
    }
  }
}

/**
 * 读取并解析配置文件
 * @param {string} filePath 配置文件路径
 * @returns {Promise<Object>} 解析后的配置对象
 */
const readConfigFile = async (filePath) => {
  const configContent = await fs.promises.readFile(filePath, 'utf8');
  if (!configContent) {
    throw new Error('配置文件为空');
  }
  return parseConfig(configContent);
};

/**
 * 读取并解析配置文件
 * @param {string} filePath 配置文件路径
 * @returns {Promise<Object>} 解析后的配置对象
 */
const readAndParseConfig = async (filePath) => {
  // 如果配置文件不存在，则创建一个示例配置文件
  if (!fs.existsSync(filePath)) {
    const exampleConfig = await fs.promises.readFile('.migpt.example.js', 'utf8');
    await fs.promises.writeFile(filePath, exampleConfig, 'utf8');
  }
  return readConfigFile(filePath);
};

/**
 * 管理端 配置config
 * @param {Object} req 请求对象
 * @param {Object} res 响应对象
 */
app.post('/api/admin/config', async (req, res) => {
  try {
    const config = req.body;
    // 读取配置文件
    const parsedConfig = await readConfigFile('./migpt.js');
    // 使用 config 中的值更新 parsedConfig
    updateConfig(parsedConfig, config);

    // 将更新后的配置格式化为 JavaScript 块格式
    const configContent = `export default ${JSON.stringify(parsedConfig, null, 2)}`;

    // 写入到 migpt.js 配置文件
    await fs.promises.writeFile('./migpt.js', configContent, 'utf8');

    // 如果服务正在运行，需要重启才能生效
    const needRestart = miGPTInstance !== null;

    await restartServer()

    res.setHeader('Content-Type', 'application/json');
    res.json({
      success: true,
      message: '配置已保存,正在重启服务',
      needRestart
    });
  } catch (error) {
    console.error('保存配置失败:', error);
    res.status(500).json({
      error: '保存配置失败: ' + error.message
    });
  }
});
app.get('/api/admin/config', async (req, res) => {
  try {
    const parsedConfig = await readAndParseConfig('./migpt.js');
    //console.log('读取到的配置:', parsedConfig); // 添加调试日志

    res.setHeader('Content-Type', 'application/json');
    res.json({ parsedConfig });
  } catch (error) {
    console.error('读配置失败:', error);
    // 返回更详细的错误信息
    res.status(500).json({
      error: '读取配置失败',
      details: error.message,
      stack: error.stack
    });
  }
});

/**
 * 配置相路由 客户端
 * @param {Object} req 请求对象
 * @param {Object} res 响应对象
 */
app.post('/api/config', async (req, res) => {
  try {
    const config = req.body;

    // 读取配置文件
    const parsedConfig = await readConfigFile('./migpt.js');
    // 使用 config 中的值更新 parsedConfig
    updateConfig(parsedConfig, config);

    // 将更新后的配置格式化为 JavaScript 块格式
    const configContent = `export default ${JSON.stringify(parsedConfig, null, 2)}`;

    // 写入到 migpt.js 配置文件
    await fs.promises.writeFile('./migpt.js', configContent, 'utf8');

    // 如果服务正在运行，需要重启才能生效
    const needRestart = miGPTInstance !== null;

    await restartServer()
    res.setHeader('Content-Type', 'application/json');
    res.json({
      success: true,
      message: '配置已保存,正在重启服务',
      needRestart
    });
  } catch (error) {
    console.error('保存配置失败:', error);
    res.status(500).json({
      error: '保存配置失败: ' + error.message
    });
  }
});
app.get('/api/config', async (req, res) => {
  try {
    const parsedConfig = await readAndParseConfig('./migpt.js');
    const newConfig = {
      bot: parsedConfig['bot'],
      master: parsedConfig['master'],
      speaker: parsedConfig['speaker'],
      systemTemplate: parsedConfig['systemTemplate'],
    }

    //console.log('读取到的配置:', newConfig); // 添加调试日志

    res.setHeader('Content-Type', 'application/json');
    res.json({ newConfig });
  } catch (error) {
    //console.error('读配置失败:', error);
    // 返回更详细的错误信息
    res.status(500).json({
      error: '读取配置失败',
      details: error.message,
      stack: error.stack
    });
  }
});

/**
 * 服务健康检查
 * @returns {Promise<Object>} 健康检查状态
 */
app.get('/api/service/health', (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  // 添加更多的安全检查
  const status = {
    serverRunning: true,
    miGPTRunning: false,
    config: null,
    needConfig: true
  };

  try {
    if (miGPTInstance) {
      status.miGPTRunning = true;

      // 检查配置是否存在且有
      if (miGPTInstance.config &&
        miGPTInstance.config.bot &&
        miGPTInstance.config.master) {
        status.config = {
          botName: miGPTInstance.config.bot.name || '',
          masterName: miGPTInstance.config.master.name || ''
        };
        status.needConfig = false;
      }
    }

    res.json(status);
  } catch (error) {
    console.error('健康检查失败:', error);
    res.json({
      serverRunning: true,
      miGPTRunning: false,
      config: null,
      needConfig: true,
      error: error.message
    });
  }
});


/**
 * 初始化 MiGPT 实例
 * @returns {Promise<Object>} MiGPT 实例
 */
const initMiGPT = async () => {
  try {
    //删除配置文件
    deleteBotAndMiFile()

    console.log('正在初始化 MiGPT 服务...');
    console.log('当前实例状态:', miGPTInstance ? '存在' : '不存在');

    // 1. 如果存在旧实例，先完全清理
    if (miGPTInstance) {
      console.log('清理旧实例...');
      try {
        await miGPTInstance.stop();
        console.log('实例已停止');
      } catch (error) {
        console.error('清理旧实例时出错:', error);
      }
      miGPTInstance = null;
      console.log('等待资源释放...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // 2. 读取最新配置
    console.log('读取配置...');
    const configFile = fs.readFileSync('./migpt.js', 'utf8');
    const configModule = await import(`data:text/javascript,${encodeURIComponent(configFile)}`);
    const freshConfig = configModule.default;

    // 3. 检查配置
    if (!freshConfig.speaker?.userId || !freshConfig.speaker?.password) {
      console.log('\n=== 等待配置 ===');
      console.log('请通过Web界面完成配置');
      console.log('================\n');
      return null;
    }

    let envLines = {};
    // 4. 设置环境变量值
    if (freshConfig['selectedAIService']) {
      const selectedAIServiceConfig = freshConfig[freshConfig['selectedAIService']];
      envLines = {
        OPENAI_API_KEY: selectedAIServiceConfig.apiKey,
        OPENAI_MODEL: selectedAIServiceConfig.model,
        OPENAI_BASE_URL: selectedAIServiceConfig.endpoint.replace('/chat/completions', '')
      }
    }
    // 如果使用自定义 TTS，添加 TTS 配置到环境变量
    if (freshConfig.speaker?.tts === 'custom' && freshConfig.tts?.baseUrl) {
      envLines['TTS_BASE_URL'] = freshConfig.tts.baseUrl;
    }
    globalCatch.set('env', envLines);

    // 5. 创建新实例
    console.log('创建新实例...');
    try {
      const instance = MiGPT.create(freshConfig);

      if (!instance) {
        throw new Error('MiGPT.create() 返回 null');
      }

      // 验证实例
      if (!instance.speaker) {
        throw new Error('实例缺少 speaker 组件');
      }

      // 6. 赋值给全局变量
      miGPTInstance = instance;
      console.log('新实例创建成功');
    } catch (error) {
      console.error('实例创建失败:', error);
      console.error('错误堆栈:', error.stack);
      throw error;
    }

    // 7. 启动服务
    console.log('启动服务...');
    try {
      // 启动运行循环
      if (miGPTInstance.speaker) {
        console.log('启动消息监听...');
        // 初始化服务
        await miGPTInstance.speaker.initMiServices();

        if (!miGPTInstance.speaker.MiNA) {
          throw new Error('MiNA 服务初始化失败');
        }

        // 启动服务（不等待完成）
        miGPTInstance.start().catch(error => {
          throw new Error("消息监听循环出错", error);
        });

        // 等待一小段时间确保服务正常启动
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 检查服务状态
        if (miGPTInstance.speaker.status !== 'running') {
          throw new Error('服务启动异常');
        }

        console.log('消息监听已启动');
      } else {
        throw new Error('Speaker 组件未初始化');
      }
    } catch (error) {
      console.error('启动服务时出错:', error);
      // 清理未完全初始化的实例
      if (miGPTInstance) {
        try {
          await miGPTInstance.stop();
        } catch (stopError) {
          console.error('清理失败的实例时出错:', stopError);
        }
        miGPTInstance = null;
      }
      throw new Error(error.message);
    }
    console.log('服务启动成功');

    console.log('MiGPT 服务初始化完成');
    return miGPTInstance;
  } catch (error) {
    console.error('初始化失败:', error);
    console.error('错误堆栈:', error.stack);
    miGPTInstance = null;
    throw error;
  }
}

/**
 * 服务启动
 * @returns {Promise<Object>} 启动状态
 */
app.post('/api/service/start', async (req, res) => {
  try {
    console.log('\n=== 启动 MiGPT 服务 ===');

    // 1、初始化实例
    const instance = await initMiGPT();

    if (!instance || !instance.speaker) {
      throw new Error('服务初始化失败');
    }

    // 2、检查服务状态
    if (instance.speaker.status !== 'running') {
      throw new Error('服务启动异常');
    }

    console.log('MiGPT 服务启动成功');
    console.log('=====================\n');

    res.json({
      success: true,
      status: {
        serverRunning: true,
        miGPTRunning: true,
        config: {
          botName: instance.config?.bot?.name || '',
          masterName: instance.config?.master?.name || ''
        }
      }
    });
  } catch (error) {
    console.error('启动服务失败:', error);
    if (miGPTInstance) {
      await miGPTInstance.stop();
    }
    miGPTInstance = null;
    res.status(500).json({ error: error.message });
  }
});


/**
 * 服务MiGPT停止
 * @returns {Promise<Object>} 停止状态
 */
const miGPTServiceStop = async () => {
  if (miGPTInstance) {
    console.log('\n=== 正在停止 MiGPT 服务 ===');
    try {
      // 使用 stop() 方法停止服务
      await miGPTInstance.stop();
      console.log('服务已停止');
    } catch (stopError) {
      console.error('停止服务时出错:', stopError);
    }

    // 确保完全清理实例
    miGPTInstance = null;

    // 等待资源释放
    //await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('MiGPT 服务已停止');
    console.log('========================\n');
  }
}

/**
 * 服务停止
 * @returns {Promise<Object>} 停止状态
 */
app.post('/api/service/stop', async (req, res) => {
  try {
    if (!miGPTInstance) {
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({ error: '服务未运行' });
      return;
    }

    await miGPTServiceStop()

    res.json({ success: true });
  } catch (error) {
    console.error('停止服务失败:', error);
    miGPTInstance = null;
    res.status(500).json({ error: '停止服务失败: ' + error.message });
  }
});

/**
 * 服务重启
 * @returns {Promise<Object>} 重启状态
 */
app.post('/api/service/restart', async (req, res) => {
  try {
    console.log('\n=== 正在重启 MiGPT 服务 ===');

    // 1. 停止当前服务
    if (miGPTInstance) {
      await miGPTServiceStop()
    }

    // 2.初始化实例
    const instance = await initMiGPT();

    if (!instance || !instance.speaker) {
      throw new Error('服务初始化失败');
    }

    // 3.检查服务状态
    if (instance.speaker.status !== 'running') {
      throw new Error('服务启动异常');
    }

    console.log('MiGPT 服务重启完成');
    console.log('========================\n');

    // 9. 立即返回状态
    res.json({
      success: true,
      message: 'MiGPT 服务已重启',
      status: {
        serverRunning: true,
        miGPTRunning: true,
        config: {
          botName: instance.config?.bot?.name || '',
          masterName: instance.config?.master?.name || ''
        }
      }
    });
  } catch (error) {
    console.error('重启服务失败:', error);
    miGPTInstance = null;
    res.status(500).json({
      success: false,
      error: '重启服务失败: ' + error.message
    });
  }
});

// 提供 Vue 应用的静态文件
app.use(express.static(path.join(__dirname, 'frontend/dist')));

// 所有其他请求都重定向到 Vue 应用
app.get('*', (req, res) => {
  // 查文件是否存在
  const indexPath = path.join(__dirname, 'frontend/dist', 'index.html');
  if (!fs.existsSync(indexPath)) {
    return res.status(404).send('请先构建前端项目：cd frontend && npm run build');
  }
  res.sendFile(indexPath);
});

// 修改检查端口是否可用的函数
const isPortAvailable = (port) => {
  return new Promise((resolve) => {
    const server = createServer();

    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      }
    });

    server.once('listening', () => {
      server.close();
      resolve(true);
    });

    server.listen(port);
  });
}

// 查找可用端口的函数
const findAvailablePort = async (startPort) => {
  let port = startPort;
  while (!(await isPortAvailable(port))) {
    port++;
    if (port > startPort + 100) { // 多尝试100个端口
      throw new Error('无法找到可用端口');
    }
  }
  return port;
}
let appServer; // 用于存储 HTTP 服务器实例
// 修改启动服务器的代码
const startServer = async () => {
  try {
    const preferredPort = process.env.PORT || 3000;
    const port = await findAvailablePort(preferredPort);

    appServer = app.listen(port, async () => {
      console.log('\n=== 服务器启动信息 ===');
      console.log(`Web 服务运行: http://localhost:${port}`);
      if (port !== preferredPort) {
        console.log(`注意: 端口 ${preferredPort} 已被用，动切换到端口 ${port}`);
      }
      console.log('请通过 Web 界面启动 MiGPT 服务');
      console.log('=====================\n');
    });
  } catch (error) {
    console.error('\n=== 服务器启动失败 ===');
    console.error('错误信息:', error.message);
    console.error('=====================\n');
    process.exit(1);
  }
};

/**
 * 
 * @returns 
 */
const closeServer = async () => {
  console.log('正在关闭服务器...');
  return new Promise((resolve, reject) => {
    if (appServer) {
      console.log('222...');
      appServer.close(() => {
        console.log('333...');
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
}

/**
 * 重启服务器
 */
const restartServer = async () => {
  if (appServer) {
    try {
      await miGPTServiceStop()
      await closeServer()
      console.log('服务器已关闭，正在重启...');
      await startServer();
    } catch (error) {
      console.error('重启服务器失败:', error);
    }
  } else {
    console.log('服务器未运行，直接启动...');
    await startServer();
  }
}

// 启动服务器
startServer();

// 优雅退出
process.on('SIGINT', async () => {
  if (miGPTInstance) {
    console.log('\n=== 正在停止服务 ===');
    console.log('正在关闭 MiGPT 服务...');
    await miGPTInstance.stop();
    miGPTInstance = null;
    console.log('MiGPT 服务已停止');
    console.log('===================\n');
  }
  process.exit(0);
});

// 添加统一的错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    error: err.message || '服务器内部错误'
  });
});
