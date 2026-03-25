# FamilyPing — 产品需求文档 (PRD)

> 版本: 1.0 | 日期: 2026-03-24 | 作者: Claude Code CEO Review
> 状态: DRAFT — 待用户调研验证后进入开发

---

## 一、产品概述

### 1.1 一句话定义

FamilyPing 是一款帮助成年子女每天了解独居父母生活状态的移动应用。

### 1.2 核心价值主张

> "不是追踪妈妈在哪，而是知道妈妈今天过得怎么样。"

- **对子女（付费决策者）：** 每天一条推送，确认父母安好。不用记得打电话，不用担心"万一出事了我不知道"。
- **对父母（使用者）：** 每天看天气、看孩子的消息、回答一个有趣的问题。check-in 是顺手的事，不是义务。

### 1.3 目标用户

| 角色 | 画像 | 核心需求 |
|------|------|---------|
| **主用户（子女）** | 35-55岁，有独居/半独居老年父母，不住在一起 | 每天知道父母没事；当行为模式变化时被提醒 |
| **父用户（父母）** | 65-85岁，独居或老两口住，有智能手机 | 看天气、看孩子消息、感觉被惦记 |
| **协作用户（兄弟姐妹）** | 子女的同辈亲属 | 一起关注父母，分担焦虑 |

### 1.4 市场验证依据

| 信号 | 数据 |
|------|------|
| 竞品验证 | Snug Safety 累计 2000万次 check-in，证明每日报平安需求真实存在 |
| 市场规模 | 全球老年护理 APP 市场 $4.58B (2024)，CAGR 13.92% |
| 照护者数量 | 美国 5300万非正式照护者（大部分为成年子女） |
| 竞品弱点 | 现有 check-in APP 无一提供家庭协作 + AI 洞察 |
| 付费意愿 | Snug 付费版 $9.99/月 有人买单 |

### 1.5 竞品对标

```
                    追踪位置        每日check-in       家庭协作        AI洞察
Life360             ✅ 核心          ❌                 ✅ Circle       ❌
Snug Safety         ❌              ✅ 核心             ❌             ❌
SteadiDay           ❌              ❌                 ❌             ❌
ElderCheck Now      ✅              ✅                 ❌             ❌
FamilyPing          ❌ 不做         ✅ 核心             ✅ 核心        ✅ V2.0+
```

**FamilyPing 的差异化定位：**
- 不做位置追踪（隐私敏感，Life360 已垄断）
- 把 check-in 从"老人的义务"变成"家庭的连接仪式"
- 子女驱动获客（而非老人自己下载）
- AI 洞察层（V2.0 起）是无人做过的蓝海

---

## 二、产品路线图

```
Phase 0          V1.0              V1.5              V2.0              V2.5              V3.0
用户调研         核心产品           家庭协作+工具       健康感知           AI大脑            AI语音
2-3周           6-8周             3-4周              4-5周             3-4周             6-8周
─────────────────────────────────────────────────────────────────────────────────────────────→
                上架App Store      裂变引擎           HealthKit接入      AI洞察引擎        护城河
                前10个家庭试用     100家庭            500家庭           1000家庭          2000家庭
```

**总计: 约 25-32 周（6-8 个月）**

---

## 三、Phase 0 — 用户调研（第 1-3 周）

### 3.1 目标

验证三个核心假设：
1. 子女确实存在"每天想知道父母是否 OK"的持续焦虑
2. 父母愿意每天配合做一个简单操作
3. 子女愿意为此付费 $4.99/月

### 3.2 调研方法

| 步骤 | 行动 | 产出 |
|------|------|------|
| 发帖招募 | Reddit (r/AgingParents, r/CaregiverSupport) + Facebook 照护者群组 | 20+ 条真实回复 |
| 深度访谈 | 找 5-8 个有独居父母的成年子女进行 30 分钟电话/视频 | 访谈笔记 |
| Landing Page | Carrd.co 单页 + $50 Facebook 广告 | 转化率数据 |

### 3.3 访谈问题（精确版）

```
必问（5个）：
1. "你现在用什么方式确认父母没事？多久一次？"
2. "上次你特别担心父母的时候，发生了什么？你做了什么？"
3. "如果有个APP能每天告诉你妈妈今天的状态（心情、活跃度），
    这个信息对你有价值吗？值多少钱？"
4. "如果帮你妈装了这个APP，她需要每天按一次按钮。
    你觉得她会坚持多久？什么情况下她会停止？"
5. "你有兄弟姐妹吗？你们怎么分担照顾父母的责任？"

追问（按情况选用）：
- "你试过什么APP或工具吗？为什么用/不用了？"
- "你妈妈的手机是什么品牌？她平时用手机做什么？"
- "如果妈妈这周步数突然下降了40%，你想知道吗？"
```

### 3.4 通过/不通过标准

| 标准 | 通过 | 不通过 |
|------|------|--------|
| 焦虑真实性 | ≥ 3/5 人描述了具体的担心场景 | 所有人说"还好，不太担心" |
| 父母配合度 | ≥ 3/5 人认为父母会坚持 2 周以上 | 多数人说"我妈不会用" |
| 付费意愿 | ≥ 2/5 人表示愿意付 $3-5/月 | 无人表示愿意付费 |
| Landing Page | 转化率 ≥ 12%（100 访客中 12 人留邮箱） | 转化率 < 8% |

**不通过 → 停止开发，重新评估方向。通过 → 进入 V1.0 开发。**

---

## 四、V1.0 — 核心产品（第 4-11 周）

### 4.1 功能清单

#### 4.1.1 注册与配对系统

| 功能 | 优先级 | 描述 |
|------|--------|------|
| 子女注册 | P0 | 手机号 + 短信验证码，无密码。选择角色"Family Member" |
| 创建家庭 | P0 | 注册后自动创建家庭，生成 6 位邀请码 |
| 邀请父母（短信深链接） | P0 | 输入父母手机号 → 系统发短信 → 父母点链接 → 下载 APP → 自动配对 |
| 父母零输入注册 | P0 | 点击邀请链接后，手机号已验证，家庭已绑定。只需选 check-in 时间 |
| 邀请家人（付费） | P1 | 生成邀请链接/码，兄弟姐妹扫码加入家庭。免费版提示升级 |

**配对流程图：**

```
子女手机                          父母手机
─────────                        ─────────
注册 → 输入父母手机号
  │
  ▼
Twilio 发送短信 ──────────────→ 收到短信
  │                               │
  │                               ▼
  │                          点击链接
  │                               │
  │                               ▼
  │                          App Store → 下载
  │                               │
  │                               ▼
  │                          APP 自动识别邀请码
  │                               │
  │                               ▼
  │                          选 check-in 时间
  │                               │
  │                               ▼
子女收到推送 ←─────────────── 配对完成 ✅
"Mom is now connected!"
```

#### 4.1.2 父母端 — 晨间仪式主页

| 功能 | 优先级 | 描述 |
|------|--------|------|
| 天气显示 | P0 | 自动定位，大字显示今日天气、温度、降雨概率 |
| 子女消息 | P0 | 显示子女发来的最新一条文字消息 |
| 心情 check-in | P0 | 三个大按钮：😊 Great / 😐 OK / 😔 Not great。**按下即完成 check-in** |
| 每日一问 | P1 | check-in 后弹出一个温暖的问题，可文字回答或跳过 |
| SOS 紧急按钮 | P0 | 长按 3 秒 → 获取 GPS → 推送给全家人 + 可选拨打 911 |
| 提醒通知 | P0 | 到设定时间推送提醒。文案不是"请check-in"而是"今天天气不错☀️点这看看" |

**父母端界面规格：**

```
设计原则：
  - 所有文字 ≥ 20pt（正文），≥ 28pt（标题）
  - 按钮最小触摸面积 64×64pt
  - 颜色对比度 ≥ 7:1（WCAG AAA）
  - 首屏不滚动，所有核心功能一屏展示
  - 无 Tab Bar、无汉堡菜单、无手势操作
  - 背景色：白色或浅米色（不是暗色主题）

首屏布局（自上而下）：
  ┌──────────────────────────┐
  │ 问候语 + 日期            │  28pt, 黑色
  │ 天气卡片                 │  带图标, 大字
  │ 子女消息（如有）          │  带💌图标
  │ 心情选择（3个大按钮）     │  64pt emoji + 文字
  │ SOS 按钮                 │  红色, 底部固定
  └──────────────────────────┘
```

#### 4.1.3 子女端 — 家庭状态面板

| 功能 | 优先级 | 描述 |
|------|--------|------|
| 今日状态卡 | P0 | 父母名字 + check-in 状态 + 心情 + 时间 |
| 7 天日历 | P0 | 本周每天的 check-in 状态（✅/⚠️/—）|
| 历史记录 | P0 | 不限天数的 check-in 历史列表（免费版也不限）|
| 趋势统计 | P1 | 平均 check-in 时间、连续天数、心情分布 |
| 未 check-in 提醒 | P0 | 三级提醒机制（见下文）|
| 发消息给父母 | P0 | 文字消息输入框，发送后出现在父母晨间仪式主页 |
| 一键拨打 | P0 | 直接调用系统电话拨打父母号码 |
| 每日一问回答展示 | P1 | 父母回答的每日一问，以卡片形式展示 |
| 邀请家人入口 | P1 | 可见但需付费才能使用 |
| 设置页 | P0 | 修改提醒时间、通知偏好、账户管理 |

**子女端界面布局：**

```
  ┌──────────────────────────────────┐
  │  FamilyPing          Sarah  👤  │
  ├──────────────────────────────────┤
  │                                  │
  │  Mom                             │
  │  ✅ Checked in at 9:15 AM        │
  │  Feeling: 😊 Great               │
  │                                  │
  │  ┌─ This Week ────────────────┐  │
  │  │ Mo✅ Tu✅ We✅ Th⚠️ Fr✅ Sa-- │  │
  │  └────────────────────────────┘  │
  │                                  │
  │  ⏱ Avg check-in: 9:22 AM        │
  │  🔥 Streak: 12 days              │
  │                                  │
  │  📝 Today's answer:              │
  │  "I made beef stew, your         │
  │   favorite recipe!"              │
  │                                  │
  │  ┌──────────┐  ┌──────────┐     │
  │  │ 📞 Call  │  │ 💬 Message│     │
  │  └──────────┘  └──────────┘     │
  │                                  │
  │  ┌──────────────────────────┐   │
  │  │ 👨‍👩‍👧 Invite family (PRO)   │   │
  │  └──────────────────────────┘   │
  │                                  │
  └──────────────────────────────────┘
```

#### 4.1.4 未 check-in 三级提醒

```
时间轴：假设父母设定 check-in 时间为上午 9:00

09:00  第一级 → 父母收到推送
       文案："Good morning! 68°F and sunny today ☀️"
       不提 check-in，给打开理由

09:30  第二级 → 父母收到第二次推送（如果仍未 check-in）
       文案："Sarah sent you a message 💌"
       仍然不说"你忘了"，给另一个打开理由

11:00  第三级 → 子女收到推送
       文案："Mom hasn't checked in yet today"
       子女可选：📞 Call / 💬 Send message / ✕ Dismiss
```

#### 4.1.5 每日一问题库

```
类别分布：
  - 回忆类 (30%): "最开心的旅行是哪次？" "你第一份工作是什么？"
  - 日常类 (30%): "今天打算做什么菜？" "今天出门了吗？"
  - 情感类 (20%): "最近有什么让你开心的事？" "你想对孩子说什么？"
  - 轻松类 (20%): "如果能去任何地方旅行，你想去哪？"

V1.0 需要准备 100 个问题，不重复使用 3 个月。
问题存在本地（不调 API），按天轮换。
父母可以：文字回答 / 跳过。
回答推送给子女，存入数据库。
```

### 4.2 技术架构

```
┌─────────────────────────────────────────────────────────────┐
│                        移动端                                │
│   React Native + Expo (Custom Dev Client)                    │
│   ┌──────────────┐     ┌──────────────┐                     │
│   │  父母端界面   │     │  子女端界面   │                     │
│   │  (大字体模式) │     │  (标准界面)  │                     │
│   └──────┬───────┘     └──────┬───────┘                     │
│          └────────┬───────────┘                              │
│                   ▼                                          │
│          Zustand (状态管理)                                   │
│                   │                                          │
└───────────────────┼──────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│                      Supabase                                │
│   ┌──────────┐  ┌───────────┐  ┌───────────┐               │
│   │ Auth     │  │ Database  │  │ Realtime  │               │
│   │ (Phone)  │  │ (Postgres)│  │ (WebSocket)│              │
│   └──────────┘  └───────────┘  └───────────┘               │
│   ┌──────────────────┐  ┌────────────────┐                  │
│   │ Edge Functions   │  │ Storage        │                  │
│   │ (定时检查+推送)   │  │ (照片, V1.5)  │                  │
│   └──────────────────┘  └────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    第三方服务                                 │
│   Twilio (短信)  │  Expo Push (推送)  │  OpenWeatherMap     │
│   $0.0079/条     │  免费              │  免费层 1000次/天    │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 数据库设计

```sql
-- ==================== 核心表 ====================

-- 家庭
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'My Family',
  invite_code TEXT UNIQUE NOT NULL,  -- 6位随机码
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'family', 'smart', 'premium')),
  plan_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 用户
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id),
  role TEXT NOT NULL CHECK (role IN ('parent', 'family')),
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  checkin_time TIME,                    -- 父母：每日 check-in 提醒时间
  alert_delay_minutes INT DEFAULT 120,  -- 超过多久未 check-in 通知子女
  push_token TEXT,
  avatar_emoji TEXT DEFAULT '👤',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMPTZ
);

-- Check-in 记录
CREATE TABLE checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  mood TEXT NOT NULL CHECK (mood IN ('great', 'ok', 'not_great')),
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- 每日一问
  question_id INT,                 -- 问题编号
  question_answer TEXT,            -- 回答内容
  -- 计算字段（由后端填充）
  checkin_delay_minutes INT,       -- 比设定时间晚了多少分钟
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引: 查询某用户的 check-in 历史
CREATE INDEX idx_checkins_user_date ON checkins(user_id, checked_in_at DESC);

-- SOS 事件
CREATE TABLE sos_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  location_address TEXT,            -- 反向地理编码的地址
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  notes TEXT
);

-- 家庭消息
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id),
  sender_id UUID NOT NULL REFERENCES users(id),
  recipient_role TEXT CHECK (recipient_role IN ('parent', 'family', 'all')),
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'voice', 'photo')),
  media_url TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引: 查询某家庭的消息
CREATE INDEX idx_messages_family ON messages(family_id, created_at DESC);

-- ==================== V2.0+ 扩展表（预留，V1.0 不实现）====================

-- 每日指标（V2.0 HealthKit 接入后使用）
CREATE TABLE daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  date DATE NOT NULL,
  steps INT,
  active_hours INT,
  checkin_time TIME,
  mood TEXT,
  sleep_minutes INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 异常事件（V2.0 异常检测后使用）
CREATE TABLE anomalies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  date DATE NOT NULL,
  type TEXT NOT NULL,      -- 'steps_low', 'inactive', 'late_checkin', 'mood_change'
  severity TEXT NOT NULL,  -- 'watch', 'alert'
  metric_value DOUBLE PRECISION,
  baseline_value DOUBLE PRECISION,
  deviation DOUBLE PRECISION,
  notified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 4.4 API 端点（Supabase Edge Functions）

```
POST   /functions/v1/send-invite        发送邀请短信给父母
POST   /functions/v1/checkin             父母提交 check-in
GET    /functions/v1/family-status       获取家庭所有成员状态
POST   /functions/v1/send-message        发送家庭消息
POST   /functions/v1/sos                 触发 SOS 紧急事件
POST   /functions/v1/resolve-sos         标记 SOS 已解决
GET    /functions/v1/checkin-history      获取 check-in 历史
GET    /functions/v1/daily-question       获取今日问题
POST   /functions/v1/answer-question      提交问题回答

-- 定时任务（Supabase pg_cron）
CRON   check-unchecked-parents           每 30 分钟检查未 check-in 的父母
CRON   send-morning-reminder             每天按用户设定时间发送提醒
```

### 4.5 推送通知矩阵

| 触发事件 | 接收人 | 推送标题 | 推送内容 |
|---------|--------|---------|---------|
| 到 check-in 时间 | 父母 | Good morning! ☀️ | "68°F and sunny today. Tap to see your weather." |
| +30分钟未 check-in | 父母 | 💌 New message | "Sarah sent you a message. Tap to read." |
| +2小时未 check-in | 子女 | ⚠️ Mom | "Mom hasn't checked in yet today." |
| 父母完成 check-in | 子女 | Mom is OK ✅ | "Checked in at 9:15 AM · Feeling great 😊" |
| SOS 触发 | 全家 | 🚨 EMERGENCY | "Mom pressed SOS. Location: 123 Main St." |
| 子女发消息 | 父母 | 💌 From Sarah | "Love you mom! Had a great day..." |
| 父母回答每日一问 | 子女 | 📝 Mom answered | "'I made beef stew, your favorite recipe!'" |
| 连续 N 天 check-in | 子女 | 🔥 Streak! | "Mom has checked in 7 days in a row!" |

### 4.6 付费模型

```
┌──────────────────────────────────────────────────────────────┐
│  FREE（永久免费）                                            │
│  ├── 1 位父母 + 1 位子女                                     │
│  ├── 不限历史记录                                            │
│  ├── 每日 check-in + 心情 + SOS                              │
│  ├── 天气 + 子女消息 + 每日一问                               │
│  └── 基础推送通知                                            │
├──────────────────────────────────────────────────────────────┤
│  FAMILY（$4.99/月 | $39.99/年）                              │
│  ├── 无限家庭成员（兄弟姐妹都能加入）← 核心付费驱动力         │
│  ├── 多位父母（最多 4 位）                                   │
│  ├── 地理围栏通知（到家/离家）                                │
│  ├── 语音消息 + 照片分享                                     │
│  ├── 家庭私聊频道（子女间讨论，父母看不到）                    │
│  └── 电量低提醒                                              │
├──────────────────────────────────────────────────────────────┤
│  SMART（$9.99/月 | $79.99/年）                               │
│  ├── Family 所有功能                                         │
│  ├── 步数 / 活跃度追踪（HealthKit / Health Connect）          │
│  ├── 异常检测 + 智能提醒                                     │
│  ├── 每周 AI 摘要                                            │
│  ├── 趋势分析图表                                            │
│  └── 对话式查询（"妈妈上周怎么样？"）                         │
├──────────────────────────────────────────────────────────────┤
│  PREMIUM（$14.99/月 | $119.99/年）                           │
│  ├── Smart 所有功能                                          │
│  ├── AI 语音来电（每天 1 次，3-5 分钟）                       │
│  ├── 通话摘要 + 情绪追踪                                     │
│  ├── 回忆录 + 家庭记忆册                                     │
│  └── 关注点追踪（"膝盖疼"被提到几次）                         │
└──────────────────────────────────────────────────────────────┘
```

**付费转化设计逻辑：**

```
Day 1:    子女注册 → 帮父母设置 → 免费版，1对1
Day 3:    父母连续3天check-in → 子女收到 "🔥 3-day streak!"
Day 7:    子女养成习惯 → 免费版够用
Day 14:   子女在家庭群聊提到 → 哥哥想加入
          → 打开APP → "Upgrade to Family to invite your brother"
          → 💰 付费发生
          → 付费原因是"爱"，不是"功能限制"
```

### 4.7 技术栈

| 层 | 技术 | 理由 |
|---|------|------|
| 移动端框架 | React Native + Expo | 一套代码双平台，vibe coding 友好 |
| 状态管理 | Zustand | 轻量，比 Redux 简单 |
| 后端 | Supabase | Auth + DB + Realtime + Edge Functions + Storage 一站式 |
| 数据库 | PostgreSQL (Supabase) | 关系型，适合家庭-用户-记录结构 |
| 推送 | Expo Notifications | 统一 iOS/Android 推送 |
| 短信 | Twilio | 邀请短信，$0.0079/条 |
| 天气 | OpenWeatherMap | 免费层 1000次/天，足够 |
| 支付 | RevenueCat | 统一 Apple/Google 订阅管理 |
| AI (V2.0+) | DeepSeek API | 成本极低，约 $0.001/次摘要 |
| 语音 (V3.0) | Twilio + Deepgram + Edge TTS | 拨号 + STT + TTS |
| OCR (V1.5) | Google Cloud Vision | 免费层 1000次/月 |

### 4.8 运营成本预估

| 阶段 | 月成本 | 明细 |
|------|--------|------|
| V1.0 (50家庭) | ~$30 | Supabase免费层 + Apple开发者$8/月 |
| V1.5 (100家庭) | ~$50 | Supabase Pro $25 + Twilio |
| V2.0 (500家庭) | ~$100 | + DeepSeek API |
| V2.5 (1000家庭) | ~$200 | AI调用增加 |
| V3.0 (2000家庭) | ~$800 | Twilio语音 + Deepgram |

### 4.9 V1.0 上线标准

| 标准 | 要求 |
|------|------|
| App Store 审核 | iOS + Android 双端通过 |
| 隐私政策 | 上线前完成，律师审核 |
| 试用家庭 | 10 个家庭试用 2 周 |
| 父母 check-in 率 | > 60%（10个父母中6个每天都按）|
| 崩溃率 | < 1% |
| 配对成功率 | > 80%（10个邀请中8个成功完成）|

---

## 五、V1.5 — 家庭协作 + 日常工具（第 12-15 周）

### 5.1 新增功能

| 功能 | 端 | 描述 | 付费层 |
|------|---|------|--------|
| 语音消息 | 双端 | 长按录音 → 发全家 | Family |
| 照片分享 | 双端 | 大按钮拍照 → 一键发家庭相册 | Family |
| 家庭私聊频道 | 子女端 | 兄弟姐妹讨论父母状况，父母看不到 | Family |
| 地理围栏通知 | 子女端 | 父母到家/离家 → 子女收通知 | Family |
| 电量低提醒 | 子女端 | 父母手机 < 15% → 子女收通知 | Family |
| 简化电话簿 | 父母端 | 只显示家人 + 急救号码，大头像大按钮 | Free |
| Apple Watch | 父母端 | 2个按钮（check-in + SOS），约200行Swift | Free |
| AI 放大镜 | 父母端 | 拍照 → OCR → 大字朗读 | Free |

### 5.2 验证标准

| 指标 | 目标 |
|------|------|
| 活跃家庭 | 100+ |
| 家庭平均成员数 | > 2.5（裂变在发生）|
| 父母 check-in 率 | > 70% |
| 付费用户 | 15+ |
| MRR | > $75 |

---

## 六、V2.0 — 健康感知 + 异常检测（第 16-20 周）

### 6.1 新增功能

| 功能 | 端 | 描述 | 付费层 |
|------|---|------|--------|
| 步数追踪 | 父母端(后台) | 接 Apple HealthKit / Google Health Connect | Smart |
| 活跃度心跳 | 父母端(后台) | 每小时上报"手机是否在使用" | Smart |
| 步数趋势 | 子女端 | "妈妈今天 2,847 步，比上周均值低 40%" | Smart |
| 活跃度面板 | 子女端 | "妈妈今天手机活跃了 6 次，正常" | Smart |
| 异常检测引擎 | 后端 | 步数/活跃度偏离基线 → 告警 | Smart |
| 每周 AI 摘要 | 子女端 | 一段话总结本周父母状况 | Smart |
| 紧急医疗卡 | 父母端 | 血型/过敏/常用药，锁屏可查看 | Free |

### 6.2 异常检测算法

```
数据采集（父母端后台静默运行）：
├── 步数：每小时从 HealthKit 读取
├── 活跃度：每小时上报是否解锁使用过手机
└── 上报到 Supabase → daily_metrics 表

异常检测（Supabase Edge Function 每天跑一次）：
├── 计算过去 14 天的基线（平均值 + 标准差）
├── 今天的数据 vs 基线
├── 偏离 > 1.5σ → severity: 'watch'
├── 偏离 > 2.0σ → severity: 'alert'
└── alert 级别 → 推送给子女

误报控制：
├── 前 14 天为学习期，不触发告警
├── 周末/节假日单独计算基线
├── 天气极端时（暴雨/极寒）降低告警敏感度
└── 子女可标记"已知原因"关闭某次告警
```

### 6.3 验证标准

| 指标 | 目标 |
|------|------|
| 活跃家庭 | 500+ |
| 步数授权率 | > 60% |
| 异常检测准确率 | > 80%（不能狼来了太多）|
| Smart Plan 转化率 | > 15% |
| MRR | > $1,500 |

---

## 七、V2.5 — AI 大脑（第 21-24 周）

### 7.1 新增功能

| 功能 | 端 | 描述 | 付费层 |
|------|---|------|--------|
| AI 每日洞察 | 子女端 | 自然语言描述今日状况 + 建议 | Smart |
| 行动建议卡 | 子女端 | "建议今天打个电话，问问膝盖" | Smart |
| 天气关怀提醒 | 子女端 | "本周降温 10°C，确认妈妈暖气正常" | Smart |
| 对话式查询 | 子女端 | "妈妈上周睡眠怎么样？" → AI 回答 | Smart |
| 心情日记 | 父母端 | check-in 时写一句话感想 | Free |
| 回忆问答升级 | 父母端 | AI 根据历史回答生成个性化问题 | Free |
| 家庭记忆册 | 双端 | 父母的回答 + 照片汇集成册 | Smart |

### 7.2 AI 洞察系统

```
每天晚上 10 点，Supabase Edge Function 触发：

输入（喂给 DeepSeek）：
├── 今日 check-in 时间 + 心情
├── 今日步数 vs 7 天均值
├── 今日活跃度 vs 基线
├── 天气数据
├── "每日一问"的回答（如有）
├── 过去 7 天的趋势
└── 是否有异常事件

输出 JSON：
{
  "status": "good | watch | concern",
  "summary": "Mom had a quiet but good day...",
  "insights": ["Steps lower than usual", "Mentioned knee pain"],
  "suggestion": {
    "action": "call | message | none",
    "reason": "She mentioned knee pain twice this week",
    "priority": "low | medium | high"
  },
  "weather_alert": null | "Temperature dropping 15°F tomorrow"
}

成本：DeepSeek API ~$0.001/次 → 每用户每月 ~$0.03
```

### 7.3 验证标准

| 指标 | 目标 |
|------|------|
| 活跃家庭 | 1,000+ |
| AI 洞察打开率 | > 50% |
| 建议行动执行率 | > 30%（子女真的打了电话）|
| 回忆问答参与率 | > 40% |
| MRR | > $5,000 |

---

## 八、V3.0 — AI 语音来电（第 25-32 周）

### 8.1 核心功能

每天定时，AI 给父母打一通 3-5 分钟的电话。AI 记住所有历史对话，像一个记得你说过什么的老朋友。通话结束后自动生成摘要推送给子女。

### 8.2 技术架构

```
Twilio (拨号)
  → Deepgram Streaming STT (~300ms)
  → DeepSeek (理解 + 生成回复 ~500ms)
  → Edge TTS 或 ElevenLabs (~200ms)
  → Twilio (播放)

总延迟: ~1秒 — 自然对话的正常停顿

成本/次通话（5分钟）：
  Twilio:    $0.05
  Deepgram:  $0.03
  DeepSeek:  $0.01
  TTS:       $0.02
  合计:      ~$0.11/次 → $3.30/月/用户
```

### 8.3 AI 记忆系统

```sql
CREATE TABLE conversation_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  topic TEXT NOT NULL,           -- "knee pain", "grandson birthday"
  sentiment TEXT,                -- "positive", "concerned", "neutral"
  mentioned_at TIMESTAMPTZ NOT NULL,
  context TEXT NOT NULL,         -- "said knee is getting better today"
  mention_count INT DEFAULT 1,
  first_mentioned_at TIMESTAMPTZ,
  last_mentioned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 8.4 子女端新增

| 功能 | 描述 |
|------|------|
| 通话摘要卡 | 情绪评分 + 关键内容 + 关注点 |
| 情绪趋势曲线 | 30 天通话情绪可视化 |
| 关注点追踪 | "膝盖疼"被提到几次？趋势如何？|
| 精华片段回听 | AI 标记的重要片段，30 秒回听 |
| 代传话 | 子女输入 → AI 在下次通话中转达 |

### 8.5 验证标准

| 指标 | 目标 |
|------|------|
| 活跃家庭 | 2,000+ |
| AI 来电接听率 | > 70% |
| 平均通话时长 | > 3 分钟 |
| Premium 转化率 | > 10% |
| MRR | > $15,000 |

---

## 九、风险登记簿

| # | 风险 | 概率 | 影响 | 缓解方案 |
|---|------|------|------|---------|
| 1 | **父母端留存低** — 老人不愿每天按按钮 | 高 | 致命 | 晨间仪式设计（天气+消息+一问），让check-in成为副产品 |
| 2 | **配对流程失败** — 短信链接不生效或老人不会操作 | 中 | 高 | 备用方案：二维码配对；子女远程设置模式 |
| 3 | **App Store 拒审** — 后台位置权限被拒 | 中 | 中 | V1.0 不用后台位置，地理围栏放 V1.5，提前了解审核要求 |
| 4 | **HIPAA 合规** — 接入 HealthKit 可能触发 | 低 | 高 | V1.0 不接健康数据；V2.0 前找律师确认 |
| 5 | **AI 语音质量** — 延迟高或语音不自然 | 中 | 中 | V3.0 前先做技术验证 POC；准备降级方案（文字AI替代） |
| 6 | **免费→付费转化低** — 免费版够用不想升级 | 中 | 高 | 付费驱动力是"邀请家人"而非功能限制；监控转化漏斗 |
| 7 | **竞品跟进** — Snug 加入家庭功能 | 低 | 中 | 先发优势+习惯壁垒+家庭关系链=迁移成本 |

---

## 十、关键指标 (KPIs)

### 10.1 北极星指标

**每日活跃家庭数 (DAF)** — 一个家庭中至少有一个父母 check-in 且至少一个子女查看了状态。

### 10.2 分层指标

| 层 | 指标 | V1.0目标 | V2.0目标 | V3.0目标 |
|---|------|---------|---------|---------|
| 获客 | 新注册家庭/周 | 5 | 20 | 50 |
| 激活 | 配对成功率 | > 80% | > 85% | > 90% |
| 留存 | 父母 7 日 check-in 率 | > 60% | > 70% | > 75% |
| 留存 | 父母 30 日 check-in 率 | > 50% | > 60% | > 65% |
| 留存 | 子女 7 日查看率 | > 80% | > 85% | > 85% |
| 收入 | 付费转化率 | > 5% | > 12% | > 15% |
| 收入 | MRR | $200 | $1,500 | $15,000 |
| 裂变 | 家庭平均成员数 | 2.0 | 2.5 | 3.0 |
| 满意度 | App Store 评分 | > 4.5 | > 4.5 | > 4.5 |

### 10.3 杀死指标（Kill Metrics）

如果以下任一指标持续 4 周，重新评估产品方向：
- 父母 30 日 check-in 率 < 30%
- 子女 7 日查看率 < 50%
- 配对成功率 < 50%
- 0 个付费用户（上线 60 天后）

---

## 十一、合规与法律

| 事项 | 状态 | 行动 |
|------|------|------|
| 隐私政策 | 待完成 | V1.0 上线前用 Termly.io 生成，律师审核 |
| 服务条款 | 待完成 | 同上 |
| CCPA (加州) | 需遵守 | 隐私政策中包含 CCPA 条款 |
| GDPR (欧洲) | V1.0 只面向美国，暂不触发 | 如进入欧洲市场再处理 |
| HIPAA | V1.0 不触发（不收集健康数据）| V2.0 接入 HealthKit 前找律师确认 |
| Apple 开发者 | 待申请 | $99/年，审核约 1-2 周 |
| Google Play | 待申请 | $25 一次性 |
| 律师咨询 | 待完成 | 上线前花 $300-500 做 30 分钟咨询 |

---

## 十二、上线前检查清单

```
Phase 0 完成：
  □ 5-8 人深度访谈完成
  □ 通过/不通过标准达标
  □ Landing Page 转化率 > 12%

开发完成：
  □ iOS 版本通过 TestFlight 测试
  □ Android 版本通过内部测试
  □ 10 个家庭完成 2 周试用
  □ 父母 check-in 率 > 60%
  □ 配对成功率 > 80%
  □ 崩溃率 < 1%

合规完成：
  □ 隐私政策上线
  □ 服务条款上线
  □ 律师咨询完成
  □ Apple 开发者账号激活
  □ Google Play 开发者账号激活

上架准备：
  □ App Store 截图（6.7" + 6.1"）
  □ App Store 描述（英文）
  □ App Store 关键词优化
  □ App 图标设计
  □ 提交审核
```

---

## 附录 A：每日一问题库（V1.0 需准备 100 题）

```
回忆类（30题）：
  1. What's your happiest memory with your children?
  2. What was your first job?
  3. Where did you go on your honeymoon?
  4. What was your favorite subject in school?
  5. What's the best gift you've ever received?
  ...（续）

日常类（30题）：
  1. What did you have for breakfast today?
  2. Did you go outside today?
  3. What are you planning to cook this week?
  4. Did you talk to anyone today?
  5. What did you watch on TV last night?
  ...（续）

情感类（20题）：
  1. What made you smile recently?
  2. What do you want your grandchildren to know?
  3. What are you grateful for today?
  4. If you could give your children one piece of advice, what would it be?
  5. What's the kindest thing someone did for you recently?
  ...（续）

轻松类（20题）：
  1. If you could travel anywhere, where would you go?
  2. What's your favorite season and why?
  3. What song always makes you happy?
  4. What's the funniest thing that happened to you?
  5. If you could have dinner with anyone, who would it be?
  ...（续）
```

---

## 附录 B：推送通知文案库

```
晨间提醒（第一级，到 check-in 时间）：
  - "Good morning! ☀️ It's 68°F and sunny today."
  - "Rise and shine! 🌤 Perfect weather for a walk today."
  - "Good morning! Sarah is thinking of you 💕"
  - "Happy [Monday]! Your weather: 72°F, partly cloudy."

温和催促（第二级，+30分钟）：
  - "💌 Sarah sent you a message! Tap to read."
  - "☀️ Don't miss today's weather — tap to see!"
  - "📝 Today's question is waiting for you!"

子女端提醒（第三级，+2小时）：
  - "⚠️ Mom hasn't checked in yet today."
  - "Mom usually checks in by now. Everything OK?"

里程碑庆祝：
  - "🔥 Mom checked in 7 days in a row!"
  - "🎉 Mom's longest streak: 30 days! She's amazing."
  - "📊 This week: Mom checked in every day. Feeling great 4/7 days."
```

---

*文档结束 — FamilyPing PRD v1.0*
*生成日期: 2026-03-24*
*下一步: 完成 Phase 0 用户调研，验证核心假设*
