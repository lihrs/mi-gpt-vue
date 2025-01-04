<template>
  <div class="config-page">
    <el-card class="config-card">
      <div slot="header" class="card-header">
        <div class="header-content">
          <h2 class="title">MiGPT 智能管家配置中心</h2>
          <div class="service-controls">
            <el-tag
              :type="serviceStatus.serverRunning ? 'success' : 'danger'"
              class="status-tag"
            >
              <i
                :class="
                  serviceStatus.serverRunning
                    ? 'el-icon-success'
                    : 'el-icon-error'
                "
              ></i>
              服务器: {{ serviceStatus.serverRunning ? "运行中" : "已停止" }}
            </el-tag>
            <el-tag
              :type="serviceStatus.miGPTRunning ? 'success' : 'warning'"
              class="status-tag"
            >
              <i
                :class="
                  serviceStatus.miGPTRunning
                    ? 'el-icon-success'
                    : 'el-icon-warning'
                "
              ></i>
              MiGPT: {{ serviceStatus.miGPTRunning ? "运行中" : "未启动" }}
            </el-tag>

            <el-button-group class="control-buttons">
              <el-button
                type="success"
                icon="el-icon-video-play"
                :loading="isStarting"
                :disabled="
                  serviceStatus.miGPTRunning || isStarting || isRestarting
                "
                v-if="!serviceStatus.miGPTRunning"
                @click="startService"
              >
                启动
              </el-button>
              <template   v-if="serviceStatus.miGPTRunning">
                <el-button
                  type="danger"
                  icon="el-icon-video-pause"
                  :loading="isStopping"
                  :disabled="
                  !serviceStatus.miGPTRunning || isStopping || isRestarting
                "
                  @click="stopService"
                >
                  停止
                </el-button>
                <el-button
                  type="warning"
                  icon="el-icon-refresh"
                  :loading="isRestarting"
                  :disabled="isRestarting"
                  @click="restartService"
                >
                  重启
                </el-button>
              </template>
            </el-button-group>

            <el-popover placement="bottom" width="400" trigger="click">
              <div class="guide-content">
                <h3>智能管家启动指南</h3>
                <div
                  v-for="(step, index) in guideSteps"
                  :key="index"
                  class="guide-step"
                >
                  <h4>{{ step.title }}</h4>
                  <p>{{ step.content }}</p>
                  <el-input
                    v-if="step.command"
                    :value="step.command"
                    readonly
                    size="small"
                  >
<!--                    <el-button
                      slot="append"
                      icon="el-icon-document-copy"
                      @click="copyCommand(step.command)"
                      >复制</el-button
                    >-->
                  </el-input>
                </div>
                <el-alert class="mt-4" type="info" :closable="false" show-icon>
                  <template slot="title"
                    >提示：修改配置后需要重启服务才能生效</template
                  >
                </el-alert>
              </div>
              <el-button slot="reference" type="primary" icon="el-icon-question"
                >使用指南</el-button
              >
            </el-popover>
          </div>
        </div>
      </div>

      <el-tabs v-model="activeTab">
        <el-tab-pane name="basic">
          <span slot="label">
            <i class="fas fa-cogs"></i>
            基础配置
          </span>
          <el-form
            ref="configForm"
            :model="config"
            label-width="120px"
            class="config-form"
          >
            <el-collapse accordion>
              <el-collapse-item title="智能助手配置" name="1">
                <el-form-item
                  label="助手名称"
                  :rules="[
                    {
                      required: true,
                      message: '请输入智能助手名称',
                      trigger: 'blur',
                    },
                  ]"
                >
                  <el-input
                    v-model="config.bot.name"
                    placeholder="例如：小美"
                  ></el-input>
                </el-form-item>
                <el-form-item label="助手简介">
                  <el-input
                    type="textarea"
                    v-model="config.bot.profile"
                    :rows="4"
                    placeholder="请描述智能助手的性格、特点等"
                  ></el-input>
                  <div class="form-tip">建议包含性别、性格、专长等特征</div>
                </el-form-item>
              </el-collapse-item>

              <el-collapse-item title="用户配置" name="2">
                <el-form-item
                  label="用户名称"
                  :rules="[
                    {
                      required: true,
                      message: '请输入用户名称',
                      trigger: 'blur',
                    },
                  ]"
                >
                  <el-input
                    v-model="config.master.name"
                    placeholder="您的称呼"
                  ></el-input>
                </el-form-item>
                <el-form-item label="用户简介">
                  <el-input
                    type="textarea"
                    v-model="config.master.profile"
                    :rows="4"
                    placeholder="请描述您的兴趣、习惯等"
                  ></el-input>
                  <div class="form-tip">有助于智能助手更好地为您服务</div>
                </el-form-item>
              </el-collapse-item>

              <el-collapse-item title="账号设置" name="3">
                <el-form-item
                  label="小米ID"
                  :rules="[
                    {
                      required: true,
                      message: '请输入小米ID',
                      trigger: 'blur',
                    },
                  ]"
                >
                  <el-input v-model="config.speaker.userId">
                    <template slot="append">
                      <el-tooltip
                        content="请在小米账号的「个人信息」-「小米 ID」中查看"
                        placement="top"
                      >
                        <i class="el-icon-question"></i>
                      </el-tooltip>
                    </template>
                  </el-input>
                </el-form-item>
                <el-form-item
                  label="账号密码"
                  :rules="[
                    {
                      required: true,
                      message: '请输入账号密码',
                      trigger: 'blur',
                    },
                  ]"
                >
                  <el-input
                    v-model="config.speaker.password"
                    type="password"
                    show-password
                  ></el-input>
                </el-form-item>
                <el-form-item
                  label="设备名称"
                  :rules="[
                    {
                      required: true,
                      message: '请输入设备名称',
                      trigger: 'blur',
                    },
                  ]"
                >
                  <el-input v-model="config.speaker.did">
                    <template slot="append">
                      <el-tooltip
                        content="小爱音箱 DID 或在米家中设置的名称"
                        placement="top"
                      >
                        <i class="el-icon-question"></i>
                      </el-tooltip>
                    </template>
                  </el-input>
                </el-form-item>
              </el-collapse-item>

              <el-collapse-item title="高级设置" name="6">
                <el-form-item label="调用AI键词" class="keyword-select">
                  <el-select
                    v-model="config.speaker.callAIKeywords"
                    multiple
                    allow-create
                    filterable
                    default-first-option
                    placeholder="请输入或选择关键词"
                  >
                    <el-option
                      v-for="word in ['请', '你', '智能助手']"
                      :key="word"
                      :label="word"
                      :value="word"
                    ></el-option>
                  </el-select>
                  <div class="form-tip">支持自定义添加，按回车确认</div>
                </el-form-item>

                <el-form-item label="唤醒关键词" class="keyword-select">
                  <el-select
                    v-model="config.speaker.wakeUpKeywords"
                    multiple
                    allow-create
                    filterable
                    default-first-option
                    placeholder="请输入或选择唤醒关键词"
                  >
                    <el-option
                      v-for="word in ['打开', '进入', '激活']"
                      :key="word"
                      :label="word"
                      :value="word"
                    ></el-option>
                  </el-select>
                  <div class="form-tip">支持自定义添加，按回车确认</div>
                </el-form-item>

                <el-form-item label="退出关键词" class="keyword-select">
                  <el-select
                    v-model="config.speaker.exitKeywords"
                    multiple
                    allow-create
                    filterable
                    default-first-option
                    placeholder="请输入或选择退出关键词"
                  >
                    <el-option
                      v-for="word in ['关闭', '退出', '再见']"
                      :key="word"
                      :label="word"
                      :value="word"
                    ></el-option>
                  </el-select>
                  <div class="form-tip">支持自定义添加，按回车确认</div>
                </el-form-item>

                <el-form-item label="进入提示语" class="keyword-select">
                  <el-select
                    v-model="config.speaker.onEnterAI"
                    multiple
                    allow-create
                    filterable
                    default-first-option
                    placeholder="请输入或选择入提示语"
                  >
                    <el-option
                      v-for="text in ['您好，我是您的智能助手']"
                      :key="text"
                      :label="text"
                      :value="text"
                    ></el-option>
                  </el-select>
                  <div class="form-tip">支持自定义添加，按回车确认</div>
                </el-form-item>

                <el-form-item label="退出提示语" class="keyword-select">
                  <el-select
                    v-model="config.speaker.onExitAI"
                    multiple
                    allow-create
                    filterable
                    default-first-option
                    placeholder="请输入或选择退出提示语"
                  >
                    <el-option
                      v-for="text in ['再见，期待下次为您服务']"
                      :key="text"
                      :label="text"
                      :value="text"
                    ></el-option>
                  </el-select>
                  <div class="form-tip">支持自定义添加，按回车确认</div>
                </el-form-item>

                <el-form-item label="AI思考提示语" class="keyword-select">
                  <el-select
                    v-model="config.speaker.onAIAsking"
                    multiple
                    allow-create
                    filterable
                    default-first-option
                    placeholder="请输入或选择AI思考提示语"
                  >
                    <el-option
                      v-for="text in ['让我思考一下']"
                      :key="text"
                      :label="text"
                      :value="text"
                    ></el-option>
                  </el-select>
                  <div class="form-tip">支持自定义添加，按回车确认</div>
                </el-form-item>

                <el-form-item label="AI回答提示语" class="keyword-select">
                  <el-select
                    v-model="config.speaker.onAIReplied"
                    multiple
                    allow-create
                    filterable
                    default-first-option
                    placeholder="请输入或选择AI回答提示语"
                  >
                    <el-option
                      v-for="text in ['我的回答是']"
                      :key="text"
                      :label="text"
                      :value="text"
                    ></el-option>
                  </el-select>
                  <div class="form-tip">支持自定义添加，按回车确认</div>
                </el-form-item>

                <el-form-item label="AI错误提示语" class="keyword-select">
                  <el-select
                    v-model="config.speaker.onAIError"
                    multiple
                    allow-create
                    filterable
                    default-first-option
                    placeholder="请输入或选择AI错误提示语"
                  >
                    <el-option
                      v-for="text in ['抱歉，我遇到了一些问题']"
                      :key="text"
                      :label="text"
                      :value="text"
                    ></el-option>
                  </el-select>
                  <div class="form-tip">支持自定义添加，按回车确认</div>
                </el-form-item>
                <div class="continuous-dialog-settings">
                  <el-form-item label="连续对话">
                    <el-switch
                      v-model="config.speaker.streamResponse"
                    ></el-switch>
                    <div class="form-tip">启用后持连续对话功能</div>
                  </el-form-item>

                  <el-row :gutter="20">
                    <el-col :span="12">
                      <el-form-item label="自动退出时间">
                        <el-input-number
                          v-model="config.speaker.exitKeepAliveAfter"
                          :min="1"
                          :max="60"
                          :step="1"
                          controls-position="right"
                        ></el-input-number>
                        <div class="form-tip">无响应自动退出（秒）</div>
                      </el-form-item>
                    </el-col>
                    <el-col :span="12">
                      <el-form-item label="检测延迟">
                        <el-input-number
                          v-model="config.speaker.checkTTSStatusAfter"
                          :min="1"
                          :max="10"
                          :step="1"
                          controls-position="right"
                        ></el-input-number>
                        <div class="form-tip">开始检测延迟（秒）</div>
                      </el-form-item>
                    </el-col>
                  </el-row>

                  <el-row :gutter="20">
                    <el-col :span="12">
                      <el-form-item label="检测间隔">
                        <el-input-number
                          v-model="config.speaker.checkInterval"
                          :min="500"
                          :max="5000"
                          :step="100"
                          controls-position="right"
                        ></el-input-number>
                        <div class="form-tip">播放态检测间隔（毫秒）</div>
                      </el-form-item>
                    </el-col>
                    <el-col :span="12">
                      <el-form-item label="请求超时">
                        <el-input-number
                          v-model="config.speaker.timeout"
                          :min="1000"
                          :max="30000"
                          :step="1000"
                          controls-position="right"
                        ></el-input-number>
                        <div class="form-tip">网络请求超时（毫秒）</div>
                      </el-form-item>
                    </el-col>
                  </el-row>

                  <el-row :gutter="20">
                    <el-col :span="12">
                      <el-form-item label="调试模式">
                        <el-switch v-model="config.speaker.debug"></el-switch>
                        <div class="form-tip">启用调试日志输出</div>
                      </el-form-item>
                    </el-col>
                    <el-col :span="12">
                      <el-form-item label="跟踪日志">
                        <el-switch
                          v-model="config.speaker.enableTrace"
                        ></el-switch>
                        <div class="form-tip">跟踪 Mi Service 日志</div>
                      </el-form-item>
                    </el-col>
                  </el-row>
                </div>
              </el-collapse-item>

            </el-collapse>
          </el-form>
        </el-tab-pane>
      </el-tabs>

      <div class="form-actions">
        <el-button type="primary" @click="saveConfig"> 保存配置 </el-button>
      </div>
    </el-card>
  </div>
</template>

<script>
import {
  aiServices,
  devicePresets,
  systemTemplate,
  variableList,
} from "./templates";
import {
  ttsEngines,
  getDefaultEngine,
  addEngine,
  removeEngine,
} from "./ttsEngines";

export default {
  name: "ConfigPage",
  data() {
    return {
      config: {
        bot: {
          name: "",
          profile: "",
        },
        master: {
          name: "",
          profile: "",
        },
        speaker: {
          userId: "",
          password: "",
          did: "",
          ttsCommand: [1, 2, 3, 4, 5],
          wakeUpCommand: [1, 2, 3, 4, 5],
          playingCommand: [],
          callAIKeywords: [],
          wakeUpKeywords: [],
          exitKeywords: [],
          onEnterAI: [],
          onExitAI: [],
          onAIAsking: [],
          onAIReplied: [],
          onAIError: [],
          tts: "xiaoai",
          streamResponse: false,
          exitKeepAliveAfter: 10,
          checkTTSStatusAfter: 3,
          checkInterval: 1000,
          timeout: 10000,
          debug: false,
          enableTrace: false,
          switchSpeakerKeywords: [],
        },
        systemTemplate: systemTemplate
      },
      configContent: "",
      activeTab: "basic",
      selectedAIService: "",
      aiServices,
      devicePresets,
      isPreviewMode: false,
      isStarting: false,
      isStopping: false,
      isRestarting: false,
      serviceStatus: {
        serverRunning: false,
        miGPTRunning: false,
      },
      guideSteps: [
        {
          title: "1. 配置基础信息",
          content:
            '在"基础配置"中设置智能助手名称、用户信息、小米账号和音箱配置等基本参数。',
        },
        // {
        //   title: "2. 配置 AI 服务",
        //   content:
        //     '在"AI服务配置"中选择并配置 AI 服务提供商（如 OpenAI、智谱等），填写相关的 API 密钥和接口信息。',
        // },
        {
          title: "2. 启动服务",
          content:
            '完成配置后，点击顶部的"启动"按钮运行 MiGPT 服务。服务启动后，状态标签会显示为"运行中"。',
        },
        {
          title: "3. 开始使用",
          content:
            '对着小爱音箱说"小爱同学"，等待回应后说出带有触发词的指令，如"请帮我查询天气"。',
          command: "小爱同学 + 请/你/智能助手 + 问题内容",
        },
        {
          title: "注意事项",
          content:
            "1. 修改配置后需要重启服务才能生效\n2. 确保网络连接稳定\n3. 检查音箱是否正常连接",
        },
      ],
      variableTableData: variableList,
      selectedTTSEngine: "xiaoai",
      ttsEngines,
    };
  },
  methods: {
    async startService() {
      try {
        this.isStarting = true;
        console.log("[Frontend] 开始启动服务...");
        const response = await fetch("/api/service/start", { method: "POST" });
        const data = await response.json();
        if (data.success) {
          this.$message.success("服务启动成功");
          if (data.status) {
            this.serviceStatus = data.status;
          }
        } else {
          this.$message.error("服务启动失败: " + data.error);
        }
      } catch (error) {
        console.error("启动服务失败:", error);
        this.$message.error("启动服务失败: " + error.message);
      } finally {
        this.isStarting = false;
        await this.checkServiceHealth();
      }
    },
    async stopService() {
      try {
        this.isStopping = true;
        console.log("开始停止服务...");
        const response = await fetch("/api/service/stop", { method: "POST" });
        const data = await response.json();
        if (data.success) {
          this.$message.success("服务停止成功");
          await this.checkServiceHealth();
        } else {
          this.$message.error("服务停止失败: " + data.error);
        }
      } catch (error) {
        console.error("停止服务失败:", error);
        this.$message.error("停止服务失败: " + error.message);
      } finally {
        this.isStopping = false;
      }
    },
    async restartService() {
      try {
        this.isRestarting = true;
        console.log("开始重启服务...");
        const response = await fetch("/api/service/restart", {
          method: "POST",
        });
        const data = await response.json();
        if (data.success) {
          this.$message.success("服务重启完成");
          if (data.status) {
            this.serviceStatus = data.status;
          }
        } else {
          this.$message.error("服务重启失败: " + data.error);
        }
      } catch (error) {
        console.error("重启服务失败:", error);
        this.$message.error("重启服务失败: " + error.message);
      } finally {
        this.isRestarting = false;
        await this.checkServiceHealth();
      }
    },
    copyCommand(command) {
      this.$copyText(command).then(
        () => {
          this.$message.success("命令已复制到剪贴板");
        },
        () => {
          this.$message.error("复制命令失败");
        }
      );
    },
    async loadConfig() {
      try {
        const response = await fetch("/api/config");
        const data = await response.json();
        if (data.newConfig) {
          // 更新整个配置对象
          Object.keys(data.newConfig).forEach((key) => {
            this.$set(this.config, key, data.newConfig[key]);
          });

          // 确保 systemTemplate 存在
          if (!this.config.systemTemplate) {
            this.$set(this.config, "systemTemplate", systemTemplate);
          }

          // 同步到 JSON 编辑器
          this.syncConfigToJson();
        }
      } catch (error) {
        console.error("加载配置失败:", error);
        this.$message.error("加载配置失败: " + error.message);
      }
    },
    async saveConfig() {
      try {
        // 同时验证基础配置表单和 AI 配置表单
        const [basicValid] = await Promise.all([
          this.$refs.configForm.validate(),
          // this.$refs.aiForm.validate(),
        ]);

        if (!basicValid) {
          this.$message.error("请填写必填项");
          return;
        }

        // 创建配置的副本
        const configToSave = JSON.parse(JSON.stringify(this.config));

        // 处理模板变量替换
        const variables = {
          "{{botName}}": configToSave.bot.name || "未设置",
          "{{botProfile}}": configToSave.bot.profile || "未设置",
          "{{masterName}}": configToSave.master.name || "未设置",
          "{{masterProfile}}": configToSave.master.profile || "未设置",
          "{{currentTime}}": new Date().toLocaleTimeString(),
          "{{currentDate}}": new Date().toLocaleDateString(),
          "{{currentHour}}": new Date().getHours().toString(),
          "{{roomName}}": "默认群组",
          "{{roomIntroduction}}": "这是一个默认群组",
          "{{messages}}": "暂无历史消息",
          "{{shortTermMemory}}": "暂无短期记忆",
          "{{longTermMemory}}": "暂无长期记忆",
        };

        let processedTemplate = configToSave.systemTemplate;

        // 替换所有变量为实际值
        Object.entries(variables).forEach(([key, value]) => {
          const regex = new RegExp(
            key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
            "g"
          );
          processedTemplate = processedTemplate.replace(regex, value);
        });

        // 更新要保存的配置中模板
        configToSave.systemTemplate = processedTemplate;

        const response = await fetch("/api/config", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(configToSave),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "保存失败");
        }

        this.$message.success("配置保存成功");

        // 重新加载配置以确保显示正确的内容
        await this.loadConfig();

        // 同步到 JSON 编辑器
        this.syncConfigToJson();
      } catch (error) {
        console.error("保存配置失败:", error);
        this.$message.error("保存配置失败: " + error.message);
      }
    },
    syncConfigToJson() {
      this.configContent = JSON.stringify(this.config, null, 2);
    },
    async checkServiceHealth() {
      try {
        const response = await fetch("/api/service/health");
        const data = await response.json();
        this.serviceStatus = data;
      } catch (error) {
        console.error("服务健康检查失败:", error);
        this.$message.error("服务健康检查失败: " + error.message);
      }
    },
  },
  async created() {
    await this.loadConfig();
    // 初始检查一次服务状态
    await this.checkServiceHealth();

    // 设置定时器前先清除可能存在的旧定时器
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // 设置新的定时器，每30秒检查一次
    this.healthCheckInterval = setInterval(this.checkServiceHealth, 30000);
  },
  beforeDestroy() {
    // 组件销毁前清除定时器
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  },
};
</script>

<style>
@import "./style.css";
</style>
