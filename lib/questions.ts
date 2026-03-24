import type { DailyQuestion } from './types';

export const questions: DailyQuestion[] = [
  // =========================================================================
  // Memory (30 questions, ids 1–30)
  // =========================================================================
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
  { id: 11, category: 'memory', text_en: 'What was your favorite holiday as a child?', text_zh: '你小时候最喜欢什么节日？' },
  { id: 12, category: 'memory', text_en: 'What was the first movie you saw in a theater?', text_zh: '你第一次在电影院看的电影是什么？' },
  { id: 13, category: 'memory', text_en: 'What was your neighborhood like growing up?', text_zh: '你小时候住的社区是什么样的？' },
  { id: 14, category: 'memory', text_en: 'What is the best meal someone cooked for you?', text_zh: '别人为你做过最好吃的一顿饭是什么？' },
  { id: 15, category: 'memory', text_en: 'What was your favorite toy as a child?', text_zh: '你小时候最喜欢的玩具是什么？' },
  { id: 16, category: 'memory', text_en: 'What is a lesson your parents taught you?', text_zh: '你父母教你的一个道理是什么？' },
  { id: 17, category: 'memory', text_en: 'What was the first thing you learned to cook?', text_zh: '你学会做的第一道菜是什么？' },
  { id: 18, category: 'memory', text_en: 'Did you have a pet growing up? Tell me about it.', text_zh: '你小时候养过宠物吗？说说看。' },
  { id: 19, category: 'memory', text_en: 'What was your favorite book when you were young?', text_zh: '你年轻时最喜欢的书是什么？' },
  { id: 20, category: 'memory', text_en: 'What was the biggest adventure of your life?', text_zh: '你人生中最大的冒险是什么？' },
  { id: 21, category: 'memory', text_en: 'Who was the teacher who influenced you the most?', text_zh: '对你影响最大的老师是谁？' },
  { id: 22, category: 'memory', text_en: 'What was your favorite game to play with friends?', text_zh: '你最喜欢和朋友一起玩的游戏是什么？' },
  { id: 23, category: 'memory', text_en: 'What was the house you grew up in like?', text_zh: '你长大的那个房子是什么样的？' },
  { id: 24, category: 'memory', text_en: 'What is your favorite memory with your grandparents?', text_zh: '你和祖父母最美好的回忆是什么？' },
  { id: 25, category: 'memory', text_en: 'What was the first car or bike you owned?', text_zh: '你拥有的第一辆车或自行车是什么？' },
  { id: 26, category: 'memory', text_en: 'What was a funny thing that happened at school?', text_zh: '在学校发生过什么有趣的事？' },
  { id: 27, category: 'memory', text_en: 'What was the best birthday party you ever had?', text_zh: '你过过最好的生日派对是哪一次？' },
  { id: 28, category: 'memory', text_en: 'What was the hardest thing you ever had to learn?', text_zh: '你学过的最难的东西是什么？' },
  { id: 29, category: 'memory', text_en: 'What was your favorite place to visit as a kid?', text_zh: '你小时候最喜欢去的地方是哪里？' },
  { id: 30, category: 'memory', text_en: 'What was the most memorable meal from your childhood?', text_zh: '你童年记忆最深的一顿饭是什么？' },

  // =========================================================================
  // Daily (30 questions, ids 31–60)
  // =========================================================================
  { id: 31, category: 'daily', text_en: 'What are you planning to cook today?', text_zh: '今天打算做什么菜？' },
  { id: 32, category: 'daily', text_en: 'Did you go outside today?', text_zh: '今天出门了吗？' },
  { id: 33, category: 'daily', text_en: 'What did you have for breakfast?', text_zh: '今天早餐吃了什么？' },
  { id: 34, category: 'daily', text_en: 'Did you talk to anyone today?', text_zh: '今天有跟谁聊天吗？' },
  { id: 35, category: 'daily', text_en: 'What did you watch on TV today?', text_zh: '今天看了什么电视？' },
  { id: 36, category: 'daily', text_en: 'How did you sleep last night?', text_zh: '昨晚睡得好吗？' },
  { id: 37, category: 'daily', text_en: 'Did you take a walk today?', text_zh: '今天有出去走走吗？' },
  { id: 38, category: 'daily', text_en: 'What are you looking forward to this week?', text_zh: '这周有什么期待的事吗？' },
  { id: 39, category: 'daily', text_en: 'Did you water your plants today?', text_zh: '今天浇花了吗？' },
  { id: 40, category: 'daily', text_en: "What's the weather like from your window?", text_zh: '从窗户看出去天气怎么样？' },
  { id: 41, category: 'daily', text_en: 'What did you have for lunch today?', text_zh: '今天午餐吃了什么？' },
  { id: 42, category: 'daily', text_en: 'Did you read anything interesting today?', text_zh: '今天看到什么有意思的东西吗？' },
  { id: 43, category: 'daily', text_en: 'How is your energy level today?', text_zh: '今天精力怎么样？' },
  { id: 44, category: 'daily', text_en: 'Did you do any exercise today?', text_zh: '今天有运动吗？' },
  { id: 45, category: 'daily', text_en: 'What is your plan for the afternoon?', text_zh: '下午有什么安排？' },
  { id: 46, category: 'daily', text_en: 'Did you take your medicine today?', text_zh: '今天吃药了吗？' },
  { id: 47, category: 'daily', text_en: 'Have you been drinking enough water today?', text_zh: '今天喝了足够的水吗？' },
  { id: 48, category: 'daily', text_en: 'What sounds did you hear this morning?', text_zh: '今天早上你听到了什么声音？' },
  { id: 49, category: 'daily', text_en: 'Did anything surprise you today?', text_zh: '今天有什么让你惊讶的事吗？' },
  { id: 50, category: 'daily', text_en: 'What is one small thing you enjoyed today?', text_zh: '今天有什么小事让你开心？' },
  { id: 51, category: 'daily', text_en: 'Did you see any birds or animals today?', text_zh: '今天有看到什么鸟或动物吗？' },
  { id: 52, category: 'daily', text_en: 'What chores did you do today?', text_zh: '今天做了什么家务？' },
  { id: 53, category: 'daily', text_en: 'Did you listen to music or the radio today?', text_zh: '今天有听音乐或广播吗？' },
  { id: 54, category: 'daily', text_en: 'What are you having for dinner tonight?', text_zh: '今晚吃什么？' },
  { id: 55, category: 'daily', text_en: 'Did you speak to any neighbors today?', text_zh: '今天和邻居说话了吗？' },
  { id: 56, category: 'daily', text_en: 'What time did you wake up this morning?', text_zh: '今天早上几点起床的？' },
  { id: 57, category: 'daily', text_en: 'Is there anything you need from the store?', text_zh: '有什么需要买的东西吗？' },
  { id: 58, category: 'daily', text_en: 'Did you sit in the sun for a bit today?', text_zh: '今天有晒太阳吗？' },
  { id: 59, category: 'daily', text_en: 'What was the best part of your morning?', text_zh: '今天早上最好的部分是什么？' },
  { id: 60, category: 'daily', text_en: 'Did you try anything new today?', text_zh: '今天有尝试什么新事物吗？' },

  // =========================================================================
  // Emotion (20 questions, ids 61–80)
  // =========================================================================
  { id: 61, category: 'emotion', text_en: 'What made you smile recently?', text_zh: '最近有什么让你开心的事？' },
  { id: 62, category: 'emotion', text_en: 'What would you like to say to your kids?', text_zh: '你想对孩子说什么？' },
  { id: 63, category: 'emotion', text_en: "What are you most grateful for today?", text_zh: '今天最感恩什么？' },
  { id: 64, category: 'emotion', text_en: 'What makes you feel peaceful?', text_zh: '什么事情让你感到平静？' },
  { id: 65, category: 'emotion', text_en: "What's the kindest thing someone did for you?", text_zh: '别人为你做过最好的事是什么？' },
  { id: 66, category: 'emotion', text_en: 'Who do you miss the most?', text_zh: '你最想念谁？' },
  { id: 67, category: 'emotion', text_en: "What's your proudest moment?", text_zh: '你最自豪的时刻是什么？' },
  { id: 68, category: 'emotion', text_en: 'What is something that always cheers you up?', text_zh: '什么事情总能让你开心起来？' },
  { id: 69, category: 'emotion', text_en: 'What do you wish you could tell your younger self?', text_zh: '你想对年轻时的自己说什么？' },
  { id: 70, category: 'emotion', text_en: 'What is something you forgave someone for?', text_zh: '你原谅过别人什么事？' },
  { id: 71, category: 'emotion', text_en: 'When do you feel most loved?', text_zh: '什么时候你感到最被爱？' },
  { id: 72, category: 'emotion', text_en: 'What is a worry you have been carrying lately?', text_zh: '最近有什么让你担心的事吗？' },
  { id: 73, category: 'emotion', text_en: 'What person in your life brings you the most joy?', text_zh: '你生活中谁给你带来最多快乐？' },
  { id: 74, category: 'emotion', text_en: 'What is one thing you would like your family to know?', text_zh: '你希望家人知道什么事？' },
  { id: 75, category: 'emotion', text_en: 'What gives you hope?', text_zh: '什么事情给你希望？' },
  { id: 76, category: 'emotion', text_en: 'When was the last time you cried happy tears?', text_zh: '你上次开心到流泪是什么时候？' },
  { id: 77, category: 'emotion', text_en: 'What do you pray or wish for most often?', text_zh: '你最经常祈祷或希望什么？' },
  { id: 78, category: 'emotion', text_en: 'What is a compliment you will never forget?', text_zh: '你永远不会忘记的一句赞美是什么？' },
  { id: 79, category: 'emotion', text_en: 'What is something that scared you but you did anyway?', text_zh: '有什么事让你害怕但还是做了？' },
  { id: 80, category: 'emotion', text_en: 'What does a perfect day look like for you?', text_zh: '你理想中完美的一天是什么样的？' },

  // =========================================================================
  // Fun (20 questions, ids 81–100)
  // =========================================================================
  { id: 81, category: 'fun', text_en: 'If you could travel anywhere, where would you go?', text_zh: '如果能去任何地方旅行，你想去哪？' },
  { id: 82, category: 'fun', text_en: 'What would your superpower be?', text_zh: '如果你有超能力，你想要什么？' },
  { id: 83, category: 'fun', text_en: "What's your favorite season and why?", text_zh: '你最喜欢哪个季节？为什么？' },
  { id: 84, category: 'fun', text_en: 'If you won the lottery, what would you do first?', text_zh: '如果中了彩票，你最先做什么？' },
  { id: 85, category: 'fun', text_en: "What's the funniest thing that happened to you?", text_zh: '你经历过最有趣的事是什么？' },
  { id: 86, category: 'fun', text_en: 'What skill would you like to learn?', text_zh: '你想学什么新技能？' },
  { id: 87, category: 'fun', text_en: "What's your favorite flower?", text_zh: '你最喜欢什么花？' },
  { id: 88, category: 'fun', text_en: 'If you could have dinner with anyone, who would it be?', text_zh: '如果能和任何人吃晚餐，你选谁？' },
  { id: 89, category: 'fun', text_en: 'What is your favorite dessert of all time?', text_zh: '你最喜欢的甜点是什么？' },
  { id: 90, category: 'fun', text_en: 'If you could relive one day, which would it be?', text_zh: '如果能重新过一天，你选哪天？' },
  { id: 91, category: 'fun', text_en: 'What is the most beautiful place you have ever seen?', text_zh: '你见过最美的地方是哪里？' },
  { id: 92, category: 'fun', text_en: 'If you could be any animal, what would you be?', text_zh: '如果你能变成一种动物，你想变成什么？' },
  { id: 93, category: 'fun', text_en: 'What is your favorite thing to do on a rainy day?', text_zh: '下雨天你最喜欢做什么？' },
  { id: 94, category: 'fun', text_en: 'What is the strangest food you have ever tried?', text_zh: '你吃过最奇怪的食物是什么？' },
  { id: 95, category: 'fun', text_en: 'If you could time travel, would you go to the past or future?', text_zh: '如果能穿越时空，你想去过去还是未来？' },
  { id: 96, category: 'fun', text_en: 'What is your favorite thing about where you live?', text_zh: '你最喜欢你住的地方的什么？' },
  { id: 97, category: 'fun', text_en: 'If you could learn any language instantly, which one?', text_zh: '如果能立刻学会一种语言，你选哪种？' },
  { id: 98, category: 'fun', text_en: 'What is the best joke you know?', text_zh: '你知道的最好笑的笑话是什么？' },
  { id: 99, category: 'fun', text_en: 'What would you name a pet dragon?', text_zh: '如果你有一条宠物龙，你会给它取什么名字？' },
  { id: 100, category: 'fun', text_en: 'If you could only eat one food forever, what would it be?', text_zh: '如果你只能吃一种食物，你选什么？' },
];

export function getTodayQuestion(): DailyQuestion {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return questions[dayOfYear % questions.length];
}
