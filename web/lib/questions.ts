// 100 daily questions for parent check-ins
// Categories: memory (30%), daily (30%), emotion (20%), fun (20%)

export interface DailyQuestion {
  id: number
  text: string
  category: 'memory' | 'daily' | 'emotion' | 'fun'
}

const questions: DailyQuestion[] = [
  // === MEMORY (30 questions) ===
  { id: 1, text: 'What is your favorite childhood memory?', category: 'memory' },
  { id: 2, text: 'What was the name of your first pet?', category: 'memory' },
  { id: 3, text: 'What was your favorite subject in school?', category: 'memory' },
  { id: 4, text: 'Do you remember the first movie you saw in a theater?', category: 'memory' },
  { id: 5, text: 'What was your favorite game to play as a child?', category: 'memory' },
  { id: 6, text: 'What is the best vacation you ever took?', category: 'memory' },
  { id: 7, text: 'Who was your best friend growing up?', category: 'memory' },
  { id: 8, text: 'What was the first song you remember loving?', category: 'memory' },
  { id: 9, text: 'What was your favorite holiday tradition as a kid?', category: 'memory' },
  { id: 10, text: 'Do you remember your first day of school?', category: 'memory' },
  { id: 11, text: 'What was the first job you ever had?', category: 'memory' },
  { id: 12, text: 'What was your favorite toy as a child?', category: 'memory' },
  { id: 13, text: 'What was the best birthday party you ever had?', category: 'memory' },
  { id: 14, text: 'Do you remember a teacher who made a big impact on you?', category: 'memory' },
  { id: 15, text: 'What was the neighborhood like where you grew up?', category: 'memory' },
  { id: 16, text: 'What is the proudest moment of your life?', category: 'memory' },
  { id: 17, text: 'What was your wedding day like?', category: 'memory' },
  { id: 18, text: 'What was the first car you owned?', category: 'memory' },
  { id: 19, text: 'Do you remember a funny family story?', category: 'memory' },
  { id: 20, text: 'What was your favorite book growing up?', category: 'memory' },
  { id: 21, text: 'What was the best gift you ever received?', category: 'memory' },
  { id: 22, text: 'Tell me about a place that was special to you as a child.', category: 'memory' },
  { id: 23, text: 'What was your favorite home-cooked meal growing up?', category: 'memory' },
  { id: 24, text: 'What did you want to be when you grew up?', category: 'memory' },
  { id: 25, text: 'Who was your hero when you were young?', category: 'memory' },
  { id: 26, text: 'What was the funniest thing that happened at a family gathering?', category: 'memory' },
  { id: 27, text: 'Do you remember learning to ride a bike or swim?', category: 'memory' },
  { id: 28, text: 'What was the best advice someone gave you?', category: 'memory' },
  { id: 29, text: 'What is a tradition you started in our family?', category: 'memory' },
  { id: 30, text: 'What was the happiest day of your life?', category: 'memory' },

  // === DAILY (30 questions) ===
  { id: 31, text: 'What did you have for breakfast today?', category: 'daily' },
  { id: 32, text: 'Did you go outside today? What did you see?', category: 'daily' },
  { id: 33, text: 'Did you talk to anyone today?', category: 'daily' },
  { id: 34, text: 'How did you sleep last night?', category: 'daily' },
  { id: 35, text: 'What are you looking forward to this week?', category: 'daily' },
  { id: 36, text: 'Did you take your medications today?', category: 'daily' },
  { id: 37, text: 'What was the best part of your day?', category: 'daily' },
  { id: 38, text: 'Did you drink enough water today?', category: 'daily' },
  { id: 39, text: 'What did you watch on TV today?', category: 'daily' },
  { id: 40, text: 'Did you go for a walk today?', category: 'daily' },
  { id: 41, text: 'Is there anything you need from the store?', category: 'daily' },
  { id: 42, text: 'How is the weather where you are?', category: 'daily' },
  { id: 43, text: 'Did you read anything interesting today?', category: 'daily' },
  { id: 44, text: 'What did you have for lunch?', category: 'daily' },
  { id: 45, text: 'Did you do any exercise today?', category: 'daily' },
  { id: 46, text: 'Is there anything you need help with?', category: 'daily' },
  { id: 47, text: 'What are you having for dinner tonight?', category: 'daily' },
  { id: 48, text: 'Did you call or visit any friends today?', category: 'daily' },
  { id: 49, text: 'How is your energy level today?', category: 'daily' },
  { id: 50, text: 'Did anything surprising happen today?', category: 'daily' },
  { id: 51, text: 'Are you comfortable at home? Too hot or cold?', category: 'daily' },
  { id: 52, text: 'Did you do any hobbies today?', category: 'daily' },
  { id: 53, text: 'Did you listen to any music today?', category: 'daily' },
  { id: 54, text: 'What is one thing you accomplished today?', category: 'daily' },
  { id: 55, text: 'Did you have any appointments today?', category: 'daily' },
  { id: 56, text: 'Is there anything bothering you today?', category: 'daily' },
  { id: 57, text: 'Did you spend any time in the garden or outdoors?', category: 'daily' },
  { id: 58, text: 'What is your plan for tomorrow?', category: 'daily' },
  { id: 59, text: 'Did you do any cooking today?', category: 'daily' },
  { id: 60, text: 'How are you feeling physically today?', category: 'daily' },

  // === EMOTION (20 questions) ===
  { id: 61, text: 'What made you smile today?', category: 'emotion' },
  { id: 62, text: 'Is there anything worrying you right now?', category: 'emotion' },
  { id: 63, text: 'What are you grateful for today?', category: 'emotion' },
  { id: 64, text: 'Do you feel loved and supported?', category: 'emotion' },
  { id: 65, text: 'What would make today even better?', category: 'emotion' },
  { id: 66, text: 'Is there someone you are missing right now?', category: 'emotion' },
  { id: 67, text: 'What is something that brings you peace?', category: 'emotion' },
  { id: 68, text: 'Do you feel like you have enough company?', category: 'emotion' },
  { id: 69, text: 'What is one thing you love about your life right now?', category: 'emotion' },
  { id: 70, text: 'Is there anything you wish you could change today?', category: 'emotion' },
  { id: 71, text: 'What gives you the most comfort?', category: 'emotion' },
  { id: 72, text: 'Do you feel safe and secure at home?', category: 'emotion' },
  { id: 73, text: 'What is your biggest hope right now?', category: 'emotion' },
  { id: 74, text: 'Is there something you have been wanting to say?', category: 'emotion' },
  { id: 75, text: 'What is a kind thing someone did for you recently?', category: 'emotion' },
  { id: 76, text: 'Do you have any worries about the future?', category: 'emotion' },
  { id: 77, text: 'What activity always lifts your spirits?', category: 'emotion' },
  { id: 78, text: 'How do you feel about the changes in your life?', category: 'emotion' },
  { id: 79, text: 'Is there anyone you would like to reconnect with?', category: 'emotion' },
  { id: 80, text: 'What is the most important thing in your life?', category: 'emotion' },

  // === FUN (20 questions) ===
  { id: 81, text: 'If you could travel anywhere right now, where would you go?', category: 'fun' },
  { id: 82, text: 'What is your all-time favorite movie?', category: 'fun' },
  { id: 83, text: 'If you could have dinner with anyone, who would it be?', category: 'fun' },
  { id: 84, text: 'What is your favorite season and why?', category: 'fun' },
  { id: 85, text: 'If you won the lottery, what would you do first?', category: 'fun' },
  { id: 86, text: 'What is the best meal you have ever eaten?', category: 'fun' },
  { id: 87, text: 'Do you prefer sunrise or sunset?', category: 'fun' },
  { id: 88, text: 'What is your favorite flower?', category: 'fun' },
  { id: 89, text: 'If you could learn any new skill, what would it be?', category: 'fun' },
  { id: 90, text: 'What is your favorite thing about our family?', category: 'fun' },
  { id: 91, text: 'Beach vacation or mountain retreat?', category: 'fun' },
  { id: 92, text: 'What is the funniest joke you know?', category: 'fun' },
  { id: 93, text: 'What is your favorite animal?', category: 'fun' },
  { id: 94, text: 'If you could relive one day, which would it be?', category: 'fun' },
  { id: 95, text: 'What is a food you could eat every day?', category: 'fun' },
  { id: 96, text: 'Do you prefer mornings or evenings?', category: 'fun' },
  { id: 97, text: 'What is the most beautiful place you have visited?', category: 'fun' },
  { id: 98, text: 'What talent do you wish you had?', category: 'fun' },
  { id: 99, text: 'What is a song that always makes you happy?', category: 'fun' },
  { id: 100, text: 'If you could send a message to your younger self, what would you say?', category: 'fun' },
]

/**
 * Returns the daily question based on day-of-year.
 * Cycles through all 100 questions over the year.
 */
export function getTodayQuestion(): DailyQuestion {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  const diff = now.getTime() - start.getTime()
  const oneDay = 1000 * 60 * 60 * 24
  const dayOfYear = Math.floor(diff / oneDay)
  const index = dayOfYear % questions.length
  return questions[index]
}

export function getQuestionById(id: number): DailyQuestion | undefined {
  return questions.find((q) => q.id === id)
}

export default questions
