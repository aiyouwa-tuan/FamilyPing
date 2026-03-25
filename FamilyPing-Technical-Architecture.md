# FamilyPing — 技术架构设计 & 开发计划

> 版本: 1.0 | 日期: 2026-03-24 | 来源: /plan-eng-review
> 覆盖范围: V1.0 → V3.0 全版本

---

## 一、系统架构总览

```
┌─────────────────────────────────────────────────────────────────────┐
│                         客户端层                                     │
│                                                                     │
│   ┌─────────────────┐           ┌─────────────────┐                │
│   │   父母端 APP    │           │   子女端 APP     │                │
│   │  (大字体模式)   │           │  (标准界面)      │                │
│   │                 │           │                  │                │
│   │  React Native   │           │  React Native    │                │
│   │  + Expo         │           │  + Expo          │                │
│   └────────┬────────┘           └────────┬─────────┘                │
│            │        同一个APP，角色切换     │                         │
│            └────────────┬────────────────┘                          │
│                         │                                           │
│   ┌─────────────────────┴─────────────────────┐                    │
│   │         Expo Custom Dev Client             │                    │
│   │  (V2.0起需要，因为HealthKit原生模块)       │                    │
│   └─────────────────────┬─────────────────────┘                    │
│                         │                                           │
│   ┌─────────────────┐   │   ┌──────────────┐                      │
│   │  Apple Watch    │   │   │  V3.0:       │                      │
│   │  (V1.5, Swift)  │   │   │  AI来电入口  │                      │
│   │  200行SwiftUI   │   │   │  (标准电话)  │                      │
│   └────────┬────────┘   │   └──────┬───────┘                      │
│            └─────┬──────┘          │                               │
└──────────────────┼─────────────────┼───────────────────────────────┘
                   │                 │
                   ▼                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                        网络层                                     │
│                                                                  │
│   HTTPS (REST)          WebSocket           PSTN (电话)          │
│   ────────────          ─────────           ──────────           │
│   Supabase API          Supabase            Twilio              │
│   + Edge Functions      Realtime            Voice API           │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                   │                 │                │
                   ▼                 ▼                ▼
┌──────────────────────────────────────────────────────────────────┐
│                        后端层 (Supabase)                          │
│                                                                  │
│   ┌──────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐   │
│   │   Auth   │  │ PostgreSQL│  │ Realtime  │  │  Storage  │   │
│   │  (Phone) │  │    DB     │  │ (WebSocket│  │  (照片/   │   │
│   │          │  │           │  │  推送)    │  │   语音)   │   │
│   └──────────┘  └───────────┘  └───────────┘  └───────────┘   │
│                                                                  │
│   ┌──────────────────────────────────────────────────────┐      │
│   │              Edge Functions (Deno)                     │      │
│   │                                                       │      │
│   │  V1.0: checkin / invite / sos / message / reminder    │      │
│   │  V2.0: anomaly-detect / weekly-summary                │      │
│   │  V2.5: daily-insight / query-ai                       │      │
│   │  V3.0: voice-call-orchestrator                        │      │
│   └──────────────────────────────────────────────────────┘      │
│                                                                  │
│   ┌──────────────────────────────────────────────────────┐      │
│   │              pg_cron (定时任务)                        │      │
│   │                                                       │      │
│   │  每30分钟: check_unchecked_parents()                  │      │
│   │  每天按用户时间: send_morning_reminder()               │      │
│   │  V2.0 每天22:00: run_anomaly_detection()              │      │
│   │  V2.5 每天22:00: generate_daily_insights()            │      │
│   └──────────────────────────────────────────────────────┘      │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│                     第三方服务层                                   │
│                                                                  │
│   V1.0:                                                          │
│   ├── Twilio SMS ($0.0079/条) — 邀请短信                         │
│   ├── Expo Push (免费) — iOS/Android推送通知                      │
│   ├── OpenWeatherMap (免费层) — 天气数据                          │
│   └── RevenueCat — 订阅管理                                      │
│                                                                  │
│   V1.5:                                                          │
│   └── Google Cloud Vision (免费层1000次/月) — OCR放大镜           │
│                                                                  │
│   V2.0:                                                          │
│   ├── Apple HealthKit — 步数/心率/睡眠                           │
│   ├── Google Health Connect — Android同等数据                     │
│   └── DeepSeek API (~$0.001/次) — 每周AI摘要                     │
│                                                                  │
│   V2.5:                                                          │
│   └── DeepSeek API — 每日洞察/对话查询                            │
│                                                                  │
│   V3.0:                                                          │
│   ├── Twilio Voice ($0.05/5分钟通话) — 拨号                      │
│   ├── Deepgram ($0.03/5分钟) — 实时STT                           │
│   └── Edge TTS / ElevenLabs ($0.02/5分钟) — TTS                  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 二、数据模型演进

### V1.0 核心表（6张）

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  families   │────<│    users     │────<│   checkins   │
│             │     │              │     │              │
│  id         │     │  id          │     │  id          │
│  name       │     │  family_id   │     │  user_id     │
│  invite_code│     │  role        │     │  mood        │
│  plan       │     │  name        │     │  checked_in_at│
│  plan_expires│    │  phone       │     │  question_id │
│             │     │  timezone    │     │  question_ans│
│             │     │  checkin_time│     │  delay_mins  │
│             │     │  alert_delay │     │              │
│             │     │  push_token  │     └──────────────┘
│             │     │              │
│             │     └──────┬───────┘     ┌──────────────┐
│             │            │────────────<│  sos_events  │
│             │            │             │              │
│             │            │             │  id          │
│             │            │             │  user_id     │
│             │            │             │  triggered_at│
│             │            │             │  location    │
│             │            │             │  resolved    │
│             │            │             └──────────────┘
│             │            │
│             │────────────│────────────<┌──────────────┐
└─────────────┘            │             │  messages    │
                           │             │              │
                           │             │  id          │
                           │             │  family_id   │
                           │             │  sender_id   │
                           │             │  content     │
                           │             │  type        │
                           │             │  media_url   │
                           │             └──────────────┘
```

### V2.0 新增表（2张）

```sql
-- 每日指标（HealthKit/Health Connect数据 + 行为数据）
daily_metrics (
  id, user_id, date,
  steps, active_hours, checkin_time, mood, sleep_minutes,
  UNIQUE(user_id, date)
)

-- 异常事件
anomalies (
  id, user_id, date,
  type,          -- 'steps_low' | 'inactive' | 'late_checkin' | 'mood_decline'
  severity,      -- 'watch' | 'alert'
  metric_value, baseline_value, deviation,
  notified
)
```

### V2.5 新增表（2张）

```sql
-- AI洞察
daily_insights (
  id, user_id, date,
  status,        -- 'good' | 'watch' | 'concern'
  summary,       -- 自然语言摘要
  insights,      -- JSONB: [{text, type}]
  suggestion,    -- JSONB: {action, reason, priority}
  weather_alert
)

-- 每周摘要
weekly_summaries (
  id, user_id, week_start,
  summary_text, highlights JSONB
)
```

### V3.0 新增表（2张）

```sql
-- AI通话记录
voice_calls (
  id, user_id,
  started_at, ended_at, duration_seconds,
  transcript,         -- 全文转录
  summary,            -- AI生成摘要
  mood_score,         -- 1-10
  key_topics JSONB,   -- [{topic, sentiment, context}]
  highlights JSONB    -- [{timestamp, text, importance}]
)

-- 对话记忆（跨通话持久化）
conversation_memory (
  id, user_id,
  topic, sentiment, context,
  mention_count, first_mentioned_at, last_mentioned_at
)
```

### 数据模型演进总结

```
V1.0: 6张表 — families, users, checkins, sos_events, messages, (questions本地)
V2.0: +2张表 — daily_metrics, anomalies
V2.5: +2张表 — daily_insights, weekly_summaries
V3.0: +2张表 — voice_calls, conversation_memory
────────────────────────────────────────
总计: 12张表，渐进式增加，无需重构现有表
```

---

## 三、项目目录结构

```
familyping/
├── app/                          # Expo Router (文件系统路由)
│   ├── _layout.tsx               # 根布局：角色路由分发
│   ├── index.tsx                 # 启动页：检查登录状态
│   │
│   ├── (auth)/                   # 认证流程
│   │   ├── welcome.tsx           # 欢迎页（选择角色）
│   │   ├── login.tsx             # 手机号+验证码登录
│   │   ├── register.tsx          # 注册（子女创建家庭）
│   │   └── join.tsx              # 加入家庭（父母/兄弟姐妹通过邀请码）
│   │
│   ├── (parent)/                 # 父母端页面
│   │   ├── _layout.tsx           # 父母端布局（无Tab Bar）
│   │   ├── home.tsx              # 晨间仪式主页
│   │   ├── magnifier.tsx         # AI放大镜 (V1.5)
│   │   ├── weather.tsx           # 天气详情
│   │   ├── phonebook.tsx         # 简化电话簿 (V1.5)
│   │   ├── medical-card.tsx      # 紧急医疗卡 (V2.0)
│   │   └── settings.tsx          # 父母端设置
│   │
│   ├── (family)/                 # 子女端页面
│   │   ├── _layout.tsx           # 子女端布局（底部Tab Bar）
│   │   ├── dashboard.tsx         # 家庭状态面板（Tab 1）
│   │   ├── history.tsx           # 历史记录
│   │   ├── messages.tsx          # 消息（Tab 2）
│   │   ├── insights.tsx          # AI洞察 (V2.5, Tab 3)
│   │   ├── calls.tsx             # 通话摘要 (V3.0)
│   │   ├── memory-book.tsx       # 家庭记忆册 (V2.5)
│   │   ├── invite.tsx            # 邀请家人
│   │   ├── settings.tsx          # 子女端设置（含远程设置父母提醒）
│   │   └── paywall.tsx           # 付费墙
│   │
│   └── (shared)/                 # 共享页面
│       ├── sos-active.tsx        # SOS激活状态页
│       └── profile.tsx           # 个人资料
│
├── components/
│   ├── parent/                   # 父母端专用组件（大字体）
│   │   ├── MoodSelector.tsx      # 心情选择（3个大按钮）
│   │   ├── SOSButton.tsx         # SOS紧急按钮
│   │   ├── WeatherCard.tsx       # 大字天气卡片
│   │   ├── MessageBubble.tsx     # 子女消息气泡
│   │   └── DailyQuestion.tsx     # 每日一问
│   │
│   ├── family/                   # 子女端专用组件
│   │   ├── ParentStatusCard.tsx  # 父母状态卡片
│   │   ├── WeekCalendar.tsx      # 7天check-in日历
│   │   ├── TrendChart.tsx        # 趋势图表 (Recharts/Victory)
│   │   ├── InsightCard.tsx       # AI洞察卡片 (V2.5)
│   │   ├── CallSummaryCard.tsx   # 通话摘要卡片 (V3.0)
│   │   └── AnomalyBanner.tsx     # 异常告警条 (V2.0)
│   │
│   └── shared/                   # 共享组件
│       ├── BigButton.tsx         # 大按钮（父母端复用）
│       ├── LoadingSpinner.tsx
│       └── ErrorBoundary.tsx
│
├── lib/
│   ├── supabase.ts               # Supabase客户端初始化
│   ├── auth.ts                   # 认证逻辑（手机号登录）
│   ├── notifications.ts          # Expo Push推送封装
│   ├── store.ts                  # Zustand状态管理
│   ├── health.ts                 # HealthKit/HealthConnect统一接口 (V2.0)
│   ├── ai.ts                     # DeepSeek API调用封装 (V2.5)
│   ├── questions.ts              # 每日一问题库（本地）
│   ├── geofence.ts               # 地理围栏逻辑 (V1.5)
│   └── types.ts                  # TypeScript类型定义
│
├── supabase/
│   ├── migrations/               # 数据库迁移（按版本编号）
│   │   ├── 001_v1_core.sql       # V1.0核心表
│   │   ├── 002_v2_metrics.sql    # V2.0指标表
│   │   ├── 003_v25_insights.sql  # V2.5洞察表
│   │   └── 004_v3_voice.sql      # V3.0语音表
│   │
│   └── functions/                # Edge Functions
│       ├── checkin/              # V1.0
│       ├── send-invite/          # V1.0
│       ├── sos/                  # V1.0
│       ├── send-message/         # V1.0
│       ├── check-unchecked/      # V1.0 (定时)
│       ├── morning-reminder/     # V1.0 (定时)
│       ├── anomaly-detect/       # V2.0 (定时)
│       ├── weekly-summary/       # V2.0 (定时)
│       ├── daily-insight/        # V2.5 (定时)
│       ├── query-ai/             # V2.5
│       └── voice-orchestrator/   # V3.0
│
├── watch/                        # Apple Watch (V1.5)
│   └── FamilyPingWatch/         # SwiftUI，约200行
│       ├── ContentView.swift
│       └── WatchConnectivity.swift
│
├── assets/                       # 图标、字体
├── app.json                      # Expo配置
├── eas.json                      # EAS Build配置
├── package.json
└── tsconfig.json
```

---

## 四、关键技术决策与理由

### 4.1 为什么Expo而不是裸React Native

```
                    Expo (Custom Dev Client)    裸React Native
────────────────────────────────────────────────────────────────
OTA更新              ✅ expo-updates             ❌ 需要CodePush
推送通知             ✅ expo-notifications       ❌ 手动配置FCM/APNS
构建发布             ✅ EAS Build (云端)          ❌ 本地Xcode/Gradle
双端打包             ✅ 一条命令                  ❌ 分别打包
原生模块             ✅ Custom Dev Client支持     ✅ 原生支持
HealthKit            ✅ expo-health (社区包)      ✅ react-native-health
文件系统路由         ✅ expo-router               ❌ 需要react-navigation
一个人维护难度       ✅ 低                        ❌ 高

结论：Expo Custom Dev Client是最佳选择。
  - V1.0用Expo Go快速开发（不需要原生模块）
  - V1.5起切到Custom Dev Client（加Watch+HealthKit）
  - 一个人的项目，维护成本是第一考量
```

### 4.2 为什么Supabase而不是Firebase

```
                    Supabase                    Firebase
────────────────────────────────────────────────────────────────
数据库               PostgreSQL (关系型)          Firestore (文档型)
实时                 Realtime (WebSocket)         Realtime DB
认证                 ✅ 手机号登录               ✅ 手机号登录
Edge Functions       ✅ Deno                      ✅ Cloud Functions
存储                 ✅ S3兼容                    ✅ Cloud Storage
定时任务             ✅ pg_cron (数据库内)         ❌ 需要Cloud Scheduler
SQL查询              ✅ 原生SQL                   ❌ 需要特殊查询语法
数据关系             ✅ 外键+JOIN (天然适合家庭关系) ❌ 需要反范式化
免费层               50,000行，500MB存储          1GiB Firestore
自托管可能性         ✅ 开源可自托管              ❌ 不可能
价格增长             线性可预测                   用量计费不可控

结论：Supabase。
  - 家庭→用户→check-in 是典型关系型数据，PostgreSQL天然合适
  - pg_cron做定时任务（检查未check-in）不需要额外服务
  - 免费层足够V1.0-V1.5使用
  - SQL查询+JOIN对异常检测（V2.0）很关键
```

### 4.3 状态管理：为什么Zustand

```
Zustand vs Redux vs Context:
  - Redux: 对这个规模的APP太重，boilerplate太多
  - Context: 性能问题（任何状态变化都触发整树re-render）
  - Zustand: 极简、性能好、一个人维护最合适

状态分层设计：
  ┌─ authStore ─────────────────────────────────┐
  │  user, family, role, isAuthenticated         │
  └──────────────────────────────────────────────┘
  ┌─ checkinStore ──────────────────────────────┐
  │  todayCheckin, streak, history               │
  └──────────────────────────────────────────────┘
  ┌─ familyStore ───────────────────────────────┐
  │  members, parentStatuses, messages           │
  └──────────────────────────────────────────────┘
  ┌─ settingsStore ─────────────────────────────┐
  │  notifications, checkinTime, alertDelay      │
  └──────────────────────────────────────────────┘
  ┌─ metricsStore ──────────────────────────────┐  (V2.0+)
  │  steps, activeHours, anomalies, insights     │
  └──────────────────────────────────────────────┘
```

### 4.4 推送通知架构

```
推送通知是这个APP的核心基础设施。必须V1.0就做对。

架构：
┌──────────────┐
│  触发事件    │
│              │
│  check-in    │──→ Supabase Edge Function ──→ Expo Push API ──→ 设备
│  SOS         │         │
│  未check-in  │         ├── 查询users表获取push_token
│  新消息      │         ├── 构造推送payload
│  里程碑      │         └── 调用 https://exp.host/--/api/v2/push/send
│              │
└──────────────┘

关键设计决策：

1. 推送token管理
   - 用户打开APP时注册/更新push_token到users表
   - token变化（APP重装/更新后）自动更新
   - 批量推送用Expo的批量API（一次最多100个token）

2. 推送时机控制
   - 所有定时推送按用户timezone发送
   - pg_cron每分钟跑一次，查询当前UTC时间对应的用户
   - SQL: WHERE checkin_time = (NOW() AT TIME ZONE timezone)::time

3. 推送可靠性
   - Expo Push有receipt机制，可以检查是否成功送达
   - 失败的推送记录到push_failures表，每天重试一次
   - token失效(DeviceNotRegistered)时自动清除

4. 未check-in检测（最关键的推送）
   - pg_cron每30分钟运行check_unchecked_parents()
   - 查询：所有今天应该check-in但还没有的父母
   - 按alert_delay_minutes判断是否该通知子女
   - 三级提醒：父母提醒→父母再提醒→子女提醒
```

### 4.5 认证与安全

```
认证流程（无密码，手机号验证码）：

子女注册：
  手机号 → Twilio发验证码 → 验证 → 创建Supabase auth user
  → 创建family记录 → 创建user记录(role='family')

父母加入（通过邀请链接）：
  点击链接 → 提取invite_code → 验证码验证手机号
  → 查找family → 创建user记录(role='parent')

安全考虑：
  ✅ Supabase RLS (Row Level Security) — 每张表都要设
  ✅ 用户只能读自己family的数据
  ✅ 父母不能看到family_chat频道
  ✅ SOS只有同family的人能看到
  ✅ 所有API通过Supabase auth JWT验证

RLS策略示例：
  -- users表：只能看到同family的人
  CREATE POLICY "users_same_family" ON users
    FOR SELECT USING (
      family_id = (SELECT family_id FROM users WHERE id = auth.uid())
    );

  -- checkins表：只能看到同family的check-in
  CREATE POLICY "checkins_same_family" ON checkins
    FOR SELECT USING (
      user_id IN (
        SELECT id FROM users WHERE family_id = (
          SELECT family_id FROM users WHERE id = auth.uid()
        )
      )
    );
```

---

## 五、关键数据流

### 5.1 每日Check-in流程（最核心的流程）

```
父母端                    Supabase                     子女端
────────                  ────────                     ────────
按😊按钮
  │
  ├──→ POST /checkin ──→ Edge Function
  │                       │
  │                       ├── INSERT checkins表
  │                       │   (user_id, mood, checked_in_at,
  │                       │    question_id, delay_minutes)
  │                       │
  │                       ├── 查询同family所有子女的push_token
  │                       │
  │                       ├── 发送推送通知给每个子女
  │                       │   title: "Mom is OK ✅"
  │                       │   body: "Checked in at 9:15 AM · Feeling great 😊"
  │                       │
  │                       ├── 计算streak(连续天数)
  │                       │   如果是里程碑(7/30/100天) → 额外推送
  │                       │
  │                       └── 返回 { success: true, streak: 12 }
  │
  ├── 显示 "✅ Sent!"
  │
  ├── 弹出每日一问
  │   (可选回答)
  │
  │   如果回答了:
  │   POST /checkin/answer ──→ UPDATE checkins SET question_answer
  │                            └── 推送给子女 "📝 Mom answered today's question"
  │                                                    │
  │                                                    ▼
  │                                              Realtime监听
  │                                              checkins表变化
  │                                                    │
  │                                                    ▼
  │                                              自动刷新状态面板
  │                                              显示：✅ 9:15 AM 😊
```

### 5.2 未Check-in提醒流程

```
时间线（假设父母设定check-in时间为09:00）：

08:55  pg_cron触发 morning_reminder()
       │
       ├── 查询：所有checkin_time在当前5分钟窗口内的父母
       │   WHERE checkin_time BETWEEN (NOW() - 5min) AND (NOW() + 5min)
       │   AND timezone对应当前UTC
       │
       └── 给父母发推送（第一级）
           "Good morning! 68°F and sunny today ☀️"

09:25  pg_cron触发 check_unchecked()
       │
       ├── 查询：今天应该check-in但还没有的父母
       │   WHERE date = TODAY
       │   AND user_id NOT IN (SELECT user_id FROM checkins WHERE date = TODAY)
       │   AND (NOW() - checkin_time) > 25 minutes
       │
       └── 给父母发推送（第二级）
           "💌 Sarah sent you a message! Tap to read."
           (即使没有新消息也这么说 — 父母打开APP后会看到check-in界面)

11:00  pg_cron触发 check_unchecked()
       │
       ├── 查询：今天应该check-in但还没有 + 超过alert_delay的父母
       │   AND (NOW() - checkin_time) > alert_delay_minutes
       │
       └── 给每个子女发推送（第三级）
           "⚠️ Mom hasn't checked in yet today"
           actions: [📞 Call] [💬 Message] [✕ Dismiss]
```

### 5.3 V2.0 异常检测流程

```
每天22:00 UTC，pg_cron触发 anomaly_detection():

  Step 1: 收集今日数据
  ┌────────────────────────────────────────────┐
  │  SELECT步数, 活跃度, check-in时间, 心情    │
  │  FROM daily_metrics                        │
  │  WHERE date = TODAY AND user_id = ?        │
  └────────────────────┬───────────────────────┘
                       │
  Step 2: 计算基线     ▼
  ┌────────────────────────────────────────────┐
  │  SELECT AVG(steps), STDDEV(steps),         │
  │         AVG(active_hours), STDDEV(...)     │
  │  FROM daily_metrics                        │
  │  WHERE date BETWEEN (TODAY-14) AND (TODAY-1)│
  │  AND user_id = ?                           │
  │  -- 排除异常天（如已知的旅行/住院）         │
  └────────────────────┬───────────────────────┘
                       │
  Step 3: 比较偏离度   ▼
  ┌────────────────────────────────────────────┐
  │  deviation = (今日值 - 均值) / 标准差       │
  │                                            │
  │  IF deviation > 1.5σ → severity = 'watch'  │
  │  IF deviation > 2.0σ → severity = 'alert'  │
  │                                            │
  │  检查多个维度：                              │
  │  ├── 步数偏低 (steps_low)                  │
  │  ├── 活跃度偏低 (inactive)                 │
  │  ├── check-in偏晚 (late_checkin)           │
  │  └── 连续3天心情😔 (mood_decline)          │
  └────────────────────┬───────────────────────┘
                       │
  Step 4: 存储 + 通知  ▼
  ┌────────────────────────────────────────────┐
  │  INSERT INTO anomalies (...)               │
  │                                            │
  │  IF severity = 'alert':                    │
  │    推送给所有子女：                          │
  │    "⚠️ Mom's steps today: 847 (avg: 3,200)"│
  │                                            │
  │  IF severity = 'watch':                    │
  │    不推送，但子女端面板显示黄色标记          │
  └────────────────────────────────────────────┘
```

### 5.4 V3.0 AI语音来电流程

```
每天14:00（按父母timezone），Edge Function触发：

  ┌──────────────┐
  │ Twilio拨号   │──→ 父母手机响铃 ──→ 父母接听
  └──────┬───────┘
         │
         ▼
  ┌────────────────────────────────────────────────────────┐
  │                 实时对话循环                             │
  │                                                        │
  │  父母说话 ──→ Deepgram STT (streaming, ~300ms)         │
  │                     │                                   │
  │                     ▼                                   │
  │              文字送入DeepSeek                            │
  │              + conversation_memory (上下文)              │
  │              + 子女代传话 (如有)                         │
  │                     │                                   │
  │                     ▼ (~500ms)                          │
  │              AI生成回复文字                              │
  │                     │                                   │
  │                     ▼                                   │
  │              Edge TTS 转语音 (~200ms)                   │
  │                     │                                   │
  │                     ▼                                   │
  │              Twilio播放给父母 ←──── 父母听到AI说话       │
  │                                                        │
  │  循环持续3-5分钟，或父母挂断                            │
  └────────────────────────┬───────────────────────────────┘
                           │
                           ▼ 通话结束后
  ┌────────────────────────────────────────────────────────┐
  │  后处理 (异步Edge Function):                            │
  │                                                        │
  │  1. 保存完整transcript到voice_calls表                   │
  │  2. DeepSeek生成通话摘要                                │
  │  3. 提取关键话题 → 更新conversation_memory              │
  │  4. 计算情绪评分 (1-10)                                 │
  │  5. 标记高亮片段                                        │
  │  6. 推送摘要给子女                                      │
  │     "📞 Today's call with Mom (4:32)"                   │
  │     "😊 Mood: Positive | Knee improving ✅"             │
  └────────────────────────────────────────────────────────┘
```

---

## 六、开发任务分解（Sprint级别）

### V1.0 — 核心产品（6-8周）

```
Sprint 1 (Week 1-2): 项目搭建 + 认证 + 数据库
──────────────────────────────────────────────
  □ Expo项目初始化 (expo init)
  □ 安装核心依赖 (expo-router, zustand, @supabase/supabase-js)
  □ Supabase项目创建 + 数据库迁移 001_v1_core.sql
  □ RLS策略设置（6张表全部设好）
  □ Supabase Phone Auth配置
  □ Twilio账号+短信模板
  □ 认证流程：welcome → login → register → join
  □ authStore (Zustand)
  □ 角色路由分发 (_layout.tsx: parent端 vs family端)

Sprint 2 (Week 3-4): 父母端核心 + Check-in
──────────────────────────────────────────────
  □ 父母端晨间仪式主页
  □ MoodSelector组件 (3个大按钮)
  □ WeatherCard组件 (OpenWeatherMap API)
  □ MessageBubble组件 (显示子女消息)
  □ SOSButton组件 (长按3秒+GPS)
  □ DailyQuestion组件 + 100题本地题库
  □ Edge Function: checkin (含streak计算)
  □ Edge Function: sos (含位置反向地理编码)
  □ checkinStore (Zustand)

Sprint 3 (Week 5-6): 子女端 + 推送通知
──────────────────────────────────────────────
  □ 子女端家庭状态面板
  □ ParentStatusCard组件
  □ WeekCalendar组件 (7天视图)
  □ 历史记录页面 (列表+日历视图)
  □ 趋势统计 (平均时间、streak、心情分布)
  □ 消息发送功能
  □ Edge Function: send-message
  □ Expo Push通知配置 (iOS+Android)
  □ Edge Function: morning-reminder (定时)
  □ Edge Function: check-unchecked (定时)
  □ 推送通知矩阵实现 (8种通知类型)

Sprint 4 (Week 7-8): 邀请配对 + 付费 + 上架
──────────────────────────────────────────────
  □ Edge Function: send-invite (Twilio短信+深链接)
  □ 邀请码配对流程 (join.tsx)
  □ RevenueCat集成 (Apple+Google订阅)
  □ 付费墙页面 (paywall.tsx)
  □ 付费状态检查 (家庭成员数限制)
  □ App Store截图+描述+关键词
  □ 隐私政策页面
  □ TestFlight内测 (10个家庭)
  □ Bug修复+性能优化
  □ 提交App Store + Google Play审核
```

### V1.5 — 家庭协作+工具（3-4周）

```
Sprint 5 (Week 9-10): 家庭协作
──────────────────────────────────
  □ 语音消息 (expo-av录音+Supabase Storage)
  □ 照片分享 (expo-image-picker+Storage)
  □ 家庭私聊频道 (子女间消息，父母不可见)
  □ 邀请家人完整流程 (付费功能)
  □ messages表增加channel字段 ('family_chat' | 'all')
  □ RLS策略更新 (父母看不到family_chat)

Sprint 6 (Week 11-12): 工具+Watch
──────────────────────────────────
  □ 地理围栏 (expo-location foreground+background)
  □ 电量低检测+推送
  □ 简化电话簿 (父母端)
  □ AI放大镜 (expo-camera + Google Vision API)
  □ Apple Watch App (SwiftUI, ~200行)
  □ WatchConnectivity桥接
  □ 切换到Expo Custom Dev Client
```

### V2.0 — 健康感知（4-5周）

```
Sprint 7 (Week 13-14): HealthKit + 数据采集
──────────────────────────────────
  □ 数据库迁移 002_v2_metrics.sql
  □ react-native-health (iOS HealthKit)
  □ react-native-health-connect (Android)
  □ lib/health.ts 统一抽象层
  □ 后台步数采集 (每小时同步到daily_metrics)
  □ 活跃度心跳 (后台任务每小时上报)
  □ 紧急医疗卡页面

Sprint 8 (Week 15-17): 异常检测 + AI摘要
──────────────────────────────────
  □ Edge Function: anomaly-detect (定时，每天22:00)
  □ 异常检测算法实现 (σ偏离)
  □ 误报控制逻辑 (14天学习期、周末基线)
  □ AnomalyBanner组件 (子女端)
  □ 步数趋势图 (TrendChart组件)
  □ 活跃度面板
  □ Edge Function: weekly-summary (DeepSeek API)
  □ 每周摘要卡片 (子女端)
```

### V2.5 — AI大脑（3-4周）

```
Sprint 9 (Week 18-19): AI洞察引擎
──────────────────────────────────
  □ 数据库迁移 003_v25_insights.sql
  □ Edge Function: daily-insight (每天22:00)
  □ DeepSeek prompt模板设计
  □ InsightCard组件 (子女端)
  □ 行动建议卡 (打电话/发消息)
  □ 天气关怀提醒逻辑

Sprint 10 (Week 20-21): 对话查询 + 记忆册
──────────────────────────────────
  □ Edge Function: query-ai
  □ 对话式查询界面 (子女端)
  □ 心情日记 (父母端check-in时可写)
  □ 回忆问答升级 (AI个性化问题)
  □ 家庭记忆册页面 (memory-book.tsx)
  □ 记忆册导出 (生成PDF，可选)
```

### V3.0 — AI语音来电（6-8周）

```
Sprint 11 (Week 22-24): 语音基础设施
──────────────────────────────────
  □ 数据库迁移 004_v3_voice.sql
  □ Twilio Voice账号配置
  □ Deepgram账号配置
  □ Edge TTS或ElevenLabs配置
  □ Edge Function: voice-orchestrator
  □ 实时对话循环实现 (STT→LLM→TTS)
  □ 延迟优化 (目标<1秒)
  □ conversation_memory 读写逻辑

Sprint 12 (Week 25-27): 通话后处理 + 子女端
──────────────────────────────────
  □ 通话摘要生成 (DeepSeek)
  □ 关键话题提取+记忆更新
  □ 情绪评分算法
  □ 高亮片段标记
  □ CallSummaryCard组件
  □ 情绪趋势曲线 (30天)
  □ 关注点追踪面板
  □ 代传话功能
  □ 精华片段回听 (音频裁剪)

Sprint 13 (Week 28-29): 优化+收尾
──────────────────────────────────
  □ 语音质量优化 (降噪、打断处理)
  □ AI人格一致性调优
  □ Premium付费层接入RevenueCat
  □ 全面QA测试
  □ 性能优化 (APP启动速度、内存)
  □ App Store更新提交
```

---

## 七、关键风险与缓解

### 7.1 技术风险

```
┌──────────────────────────────────────────────────────────────────┐
│ 风险                         │ 概率 │ 影响 │ 缓解方案            │
├──────────────────────────────┼──────┼──────┼─────────────────────┤
│ Expo Go → Custom Dev Client  │  高  │  中  │ V1.0就用Custom Dev  │
│ 切换带来的构建问题            │      │      │ Client，避免后期迁移│
│                              │      │      │                     │
│ iOS后台位置权限被拒           │  中  │  高  │ V1.0不用后台位置    │
│                              │      │      │ V1.5用前台位置+     │
│                              │      │      │ significant-change  │
│                              │      │      │ monitoring          │
│                              │      │      │                     │
│ Supabase Edge Function       │  中  │  中  │ 保持函数小而简单    │
│ 冷启动延迟(~1秒)             │      │      │ check-in延迟可接受  │
│                              │      │      │ SOS走客户端直接拨号  │
│                              │      │      │                     │
│ V3.0语音延迟>2秒             │  中  │  高  │ 先做POC验证延迟     │
│ 导致对话不自然               │      │      │ 用streaming模式     │
│                              │      │      │ 降级方案：文字AI    │
│                              │      │      │                     │
│ HealthKit权限弹窗吓到老人    │  中  │  中  │ 子女远程帮父母授权  │
│                              │      │      │ 或引导页说明        │
│                              │      │      │                     │
│ 推送通知不稳定               │  低  │  高  │ 推送是核心功能      │
│ (APNs/FCM偶尔延迟)          │      │      │ 加receipt检查       │
│                              │      │      │ 子女端也轮询一次    │
└──────────────────────────────┴──────┴──────┴─────────────────────┘
```

### 7.2 架构决策：V1.0就用Custom Dev Client

```
PRD原方案：V1.0用Expo Go，V1.5切到Custom Dev Client
我的建议：V1.0就用Custom Dev Client

原因：
  1. Expo Go → Custom Dev Client迁移有breaking changes
  2. V1.0如果用Expo Go调试得很爽，切换后发现某些东西不兼容
  3. Custom Dev Client的开发体验已经很好了（热重载正常工作）
  4. 唯一的代价是第一次构建多花10分钟

风险：
  Custom Dev Client需要先运行expo prebuild → 生成ios/android目录
  每次加新原生模块需要重新构建（约3-5分钟）
  但这是一次性的，不影响日常TypeScript/React开发
```

---

## 八、部署与发布策略

```
开发环境：
  本地开发 → Expo Dev Server → Custom Dev Client (手机)

测试环境：
  EAS Build → TestFlight (iOS) / Internal Testing (Android)
  Supabase免费层 (开发/测试共用，数据量小)

生产环境：
  EAS Build → App Store / Google Play
  Supabase Pro ($25/月，V1.5起)

OTA更新策略：
  JS代码变更 → expo-updates → 用户下次打开APP自动更新
  原生代码变更 → 必须重新提交App Store审核

CI/CD (推荐但V1.0可手动)：
  GitHub Actions → EAS Build → TestFlight/Internal → 手动发布
  V2.0起可以加自动发布
```

---

## 九、成本模型（详细版）

```
                    V1.0      V1.5      V2.0      V2.5      V3.0
                   50家庭    100家庭   500家庭   1000家庭  2000家庭
────────────────────────────────────────────────────────────────────
Supabase            $0        $25       $25       $25       $75
Apple Developer     $8        $8        $8        $8        $8
Twilio SMS          $2        $5        $15       $20       $25
Expo Push           $0        $0        $0        $0        $0
OpenWeatherMap      $0        $0        $0        $0        $0
RevenueCat          $0        $0        $0        $0        $0*
Google Vision       $0        $0        $0        $0        $0
DeepSeek API        —         —         $10       $30       $50
Twilio Voice        —         —         —         —         $500
Deepgram STT        —         —         —         —         $200
TTS                 —         —         —         —         $100
────────────────────────────────────────────────────────────────────
月成本合计          $10       $38       $58       $83       $958
MRR目标            $200      $500     $1,500    $5,000    $15,000
毛利率              95%       92%       96%       98%       94%

* RevenueCat: 月收入 < $2,500 免费
```

---

文档到此结束。这是一个从V1.0到V3.0的完整技术蓝图——架构、数据模型、数据流、任务分解、风险、成本全部覆盖。
