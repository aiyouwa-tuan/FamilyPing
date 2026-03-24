import type { DailyQuestion } from './types';

export const questions: DailyQuestion[] = [
  // Memory (30%)
  { id: 1, category: 'memory', text_en: "What was the happiest trip you've ever taken?", text_zh: '你去过最开心的旅行是哪次？' },
  { id: 2, category: 'memory', text_en: 'What was your first job?', text_zh: '你第一份工作是什么？' },
  { id: 3, category: 'memory', text_en: 'What did you love to do as a child?', text_zh: '你小时候最喜欢做什么？' },
  { id: 4, category: 'memory', text_en: 'What is your favorite family tradition?', text_zh: '你最喜欢的家庭传统是什么？' },
  { id: 5, category: 'memory', text_en: 'Who was your best friend growing up?', text_zh: '你小时候最好的朋友是谁？' },
  { id: 6, category: 'memory', text_en: 'What was your favorite subject in school?', text_zh: '你上学时最喜欢什么科目？' },
  { id: 7, category: 'memory', text_en: 'What was the best gift you ever received?', text_zh: '你收到过最好的礼物是什么？' },
  { id: 8, category: 'memory', text_en: 'What song reminds you of your youth?', text_zh: '哪首歌让你想起年轻时候？' },
  { id: 9, category: 'memory', text_en: 'What was your wedding day like?', text_zh: '你的婚礼那天是什么样的？' },
  { id: 10, category: 'memory', text_en: "What's your earliest childhood memory?", text_zh: '你最早的童年记忆是什么？' },

  // Daily (30%)
  { id: 11, category: 'daily', text_en: 'What are you planning to cook today?', text_zh: '今天打算做什么菜？' },
  { id: 12, category: 'daily', text_en: 'Did you go outside today?', text_zh: '今天出门了吗？' },
  { id: 13, category: 'daily', text_en: 'What did you have for breakfast?', text_zh: '今天早餐吃了什么？' },
  { id: 14, category: 'daily', text_en: 'Did you talk to anyone today?', text_zh: '今天有跟谁聊天吗？' },
  { id: 15, category: 'daily', text_en: 'What did you watch on TV today?', text_zh: '今天看了什么电视？' },
  { id: 16, category: 'daily', text_en: 'How did you sleep last night?', text_zh: '昨晚睡得好吗？' },
  { id: 17, category: 'daily', text_en: 'Did you take a walk today?', text_zh: '今天有出去走走吗？' },
  { id: 18, category: 'daily', text_en: 'What are you looking forward to this week?', text_zh: '这周有什么期待的事吗？' },
  { id: 19, category: 'daily', text_en: 'Did you water your plants today?', text_zh: '今天浇花了吗？' },
  { id: 20, category: 'daily', text_en: "What's the weather like from your window?", text_zh: '从窗户看出去天气怎么样？' },

  // Emotion (20%)
  { id: 21, category: 'emotion', text_en: 'What made you smile recently?', text_zh: '最近有什么让你开心的事？' },
  { id: 22, category: 'emotion', text_en: 'What would you like to say to your kids?', text_zh: '你想对孩子说什么？' },
  { id: 23, category: 'emotion', text_en: "What are you most grateful for today?", text_zh: '今天最感恩什么？' },
  { id: 24, category: 'emotion', text_en: 'What makes you feel peaceful?', text_zh: '什么事情让你感到平静？' },
  { id: 25, category: 'emotion', text_en: "What's the kindest thing someone did for you?", text_zh: '别人为你做过最好的事是什么？' },
  { id: 26, category: 'emotion', text_en: 'Who do you miss the most?', text_zh: '你最想念谁？' },
  { id: 27, category: 'emotion', text_en: "What's your proudest moment?", text_zh: '你最自豪的时刻是什么？' },

  // Fun (20%)
  { id: 28, category: 'fun', text_en: 'If you could travel anywhere, where would you go?', text_zh: '如果能去任何地方旅行，你想去哪？' },
  { id: 29, category: 'fun', text_en: 'What would your superpower be?', text_zh: '如果你有超能力，你想要什么？' },
  { id: 30, category: 'fun', text_en: "What's your favorite season and why?", text_zh: '你最喜欢哪个季节？为什么？' },
  { id: 31, category: 'fun', text_en: 'If you won the lottery, what would you do first?', text_zh: '如果中了彩票，你最先做什么？' },
  { id: 32, category: 'fun', text_en: "What's the funniest thing that happened to you?", text_zh: '你经历过最有趣的事是什么？' },
  { id: 33, category: 'fun', text_en: 'What skill would you like to learn?', text_zh: '你想学什么新技能？' },
  { id: 34, category: 'fun', text_en: "What's your favorite flower?", text_zh: '你最喜欢什么花？' },
];

export function getTodayQuestion(): DailyQuestion {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return questions[dayOfYear % questions.length];
}
