// content-sources.ts — Free API content aggregator (no API keys needed)

// ─── Type ────────────────────────────────────────────────────────────────────

export interface AudioContent {
  id: string;
  title: string;
  description?: string;
  category: 'wellness' | 'audiobook' | 'exercise' | 'radio' | 'meditation' | 'brain_game';
  source_type: 'rss' | 'api' | 'tts_generated' | 'uploaded';
  source_url?: string;
  text_content?: string;
  audio_url?: string;
  duration_seconds: number;
  thumbnail_url?: string | null;
  language?: string;
}

// ─── LibriVox API — free public domain audiobooks ────────────────────────────

export async function fetchLibriVoxBooks(limit = 20): Promise<AudioContent[]> {
  const res = await fetch(
    `https://librivox.org/api/feed/audiobooks?format=json&limit=${limit}`,
  );
  if (!res.ok) throw new Error(`LibriVox API ${res.status}`);
  const data = await res.json();
  return (data.books ?? []).map((book: any) => ({
    id: `librivox-${book.id}`,
    title: book.title,
    description: book.description?.substring(0, 200),
    category: 'audiobook' as const,
    source_type: 'api' as const,
    source_url: book.url_librivox,
    audio_url: book.url_rss, // RSS feed with chapter audio URLs
    duration_seconds: parseInt(book.totaltime_secs) || 0,
    thumbnail_url: null,
    language: book.language || 'English',
  }));
}

// ─── Radio Browser API — free worldwide radio stations ───────────────────────

export async function fetchRadioStations(
  country = 'US',
  limit = 20,
): Promise<AudioContent[]> {
  const res = await fetch(
    `https://de1.api.radio-browser.info/json/stations/bycountrycodeexact/${country}?limit=${limit}&order=clickcount&reverse=true&hidebroken=true`,
  );
  if (!res.ok) throw new Error(`Radio Browser API ${res.status}`);
  const stations = await res.json();
  return stations.map((s: any) => ({
    id: `radio-${s.stationuuid}`,
    title: s.name,
    description: `${s.country} · ${s.tags || 'Radio'}`,
    category: 'radio' as const,
    source_type: 'api' as const,
    source_url: s.homepage,
    audio_url: s.url_resolved || s.url,
    duration_seconds: 0, // live stream
    thumbnail_url: s.favicon || null,
    language: s.language || 'english',
  }));
}

// ─── iTunes Podcast Search API — free, no key needed ─────────────────────────

export async function searchPodcasts(
  term: string,
  limit = 20,
): Promise<AudioContent[]> {
  const res = await fetch(
    `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=podcast&limit=${limit}`,
  );
  if (!res.ok) throw new Error(`iTunes API ${res.status}`);
  const data = await res.json();
  return (data.results ?? []).map((p: any) => ({
    id: `podcast-${p.collectionId}`,
    title: p.collectionName,
    description: p.artistName,
    category: 'wellness' as const,
    source_type: 'api' as const,
    source_url: p.collectionViewUrl,
    audio_url: p.feedUrl, // RSS feed
    duration_seconds: 0,
    thumbnail_url: p.artworkUrl600 || p.artworkUrl100,
    language: p.primaryGenreName || 'Health',
  }));
}

// ─── Seed meditation scripts (self-created, no copyright) ────────────────────

export function getMeditationScripts(): AudioContent[] {
  return [
    {
      id: 'meditation-1',
      title: 'Gentle Morning Relaxation',
      description: 'A gentle 5-minute morning relaxation to start your day with peace.',
      category: 'meditation',
      source_type: 'tts_generated',
      text_content: `Welcome to your morning relaxation. Find a comfortable position and gently close your eyes. Take a deep breath in through your nose... hold it for a moment... and slowly exhale through your mouth. Feel the tension leaving your body with each breath. You are safe. You are loved. Your family is thinking of you right now. Take another deep breath... As you breathe in, imagine warm golden sunlight filling your body from head to toe. This warmth is the love of your family surrounding you. With each exhale, release any worry or tension. You don't need to carry anything right now. Just be here, in this moment. The day ahead is full of small joys waiting for you. A warm cup of tea. Sunlight through the window. The sound of birds. Your family's messages on your phone. Take one more deep breath... and when you're ready, slowly open your eyes. You are ready for a beautiful day.`,
      duration_seconds: 300,
    },
    {
      id: 'meditation-2',
      title: 'Evening Wind-Down for Better Sleep',
      description: 'Reflect on the good moments of your day before sleep.',
      category: 'meditation',
      source_type: 'tts_generated',
      text_content: `Welcome to your evening wind-down. You've made it through another beautiful day. Let's take a moment to appreciate it. Settle into your bed or chair, and let your body relax. Think about one thing that made you smile today. Maybe it was a message from your family. Maybe it was a delicious meal. Maybe it was simply the warmth of the sun. Hold that memory gently, like a precious gift. Now think of one person you're grateful for. Picture their face. Feel the love between you. Even if they're far away, that love is always here, always real. Take a slow, deep breath... and as you exhale, whisper to yourself: today was a good day. Tomorrow, your family will be thinking of you again. You are never alone. Rest well. Sweet dreams.`,
      duration_seconds: 300,
    },
    {
      id: 'meditation-3',
      title: 'Gentle Body Relaxation (Seated)',
      description: 'Progressive muscle relaxation for better sleep.',
      category: 'meditation',
      source_type: 'tts_generated',
      text_content: `Let's do a gentle body relaxation. Start by wiggling your toes... now let them rest. Feel your feet becoming heavy and warm. Move up to your ankles... your calves... let them sink into the bed. Your knees... your thighs... completely relaxed. Take a breath. Now your hips and lower back... release any tightness there. Your stomach... let it be soft. Your chest rises and falls gently with each breath. Your shoulders... let them drop away from your ears. Down your arms... your elbows... your wrists... your fingers. Let your hands be open and soft. Now your neck... your jaw... unclench your teeth. Your cheeks... your eyes... your forehead. Smooth and calm. Your whole body is heavy, warm, and peaceful. You are floating on a cloud of comfort. Stay here as long as you like. There is nowhere to be. Nothing to do. Just rest.`,
      duration_seconds: 360,
    },
    {
      id: 'meditation-4',
      title: '10-Minute Seated Stretches',
      description: '10-minute seated stretching routine you can do in any chair.',
      category: 'exercise',
      source_type: 'tts_generated',
      text_content: `Welcome to seated stretches for seniors. All you need is a sturdy chair. Sit up tall with your feet flat on the floor. Let's begin. First, neck rolls. Very slowly, drop your chin to your chest. Now roll your head to the right... tilt your right ear toward your shoulder. Hold for a breath. Roll back through center... and to the left. Left ear toward left shoulder. Hold. Roll back to center. Do this two more times, nice and slow. Next, shoulder shrugs. Lift both shoulders up toward your ears... hold... and drop them down. Again, lift... hold... and release. One more time. Now, seated cat-cow. Place your hands on your knees. As you breathe in, arch your back, push your chest forward, look up slightly. As you breathe out, round your back, tuck your chin, pull your belly in. In... arch and open. Out... round and curl. Three more times at your own pace. Wonderful. Now, gentle twist. Place your right hand on your left knee. Look over your left shoulder. Hold for three breaths. Come back to center. Left hand on right knee. Look over your right shoulder. Three breaths. Back to center. Finally, seated forward fold. Slowly walk your hands down your legs toward the floor. Let your head hang heavy. Take three deep breaths here. Slowly roll back up, one vertebra at a time. You did it! Your body thanks you.`,
      duration_seconds: 600,
    },
    {
      id: 'meditation-5',
      title: 'Gentle Walking Guide for Seniors',
      description: 'A mindful walking practice for your daily stroll.',
      category: 'exercise',
      source_type: 'tts_generated',
      text_content: `This is a gentle walking guide for seniors. You can do this anywhere — in your garden, around the block, or even in your living room. Begin walking at a comfortable pace. Not too fast, not too slow. Just natural. Now, bring your attention to your feet. Feel each step. Heel... ball... toes. Heel... ball... toes. The ground is solid beneath you, supporting you. Notice the air on your skin. Is it warm? Cool? Can you feel a breeze? What do you hear? Birds? Cars? Leaves? Just notice, without judging. Now look around you. What colors do you see? Pick one thing that's beautiful — a flower, a cloud, a color on a building. Appreciate it for a moment. Keep walking. With each step, think: I am here. I am alive. I am loved. If your mind wanders to worries or tasks, gently bring it back to your feet. Heel... ball... toes. You are doing something wonderful for your body right now. Every step is a gift of health. Walk for as long as feels good. When you're ready to stop, stand still for a moment. Take one deep breath. Smile. You did great today.`,
      duration_seconds: 480,
    },
  ];
}

// ─── Wellness articles (self-created, no copyright) ──────────────────────────

export function getWellnessArticles(): AudioContent[] {
  return [
    {
      id: 'wellness-1',
      title: 'Better Sleep Tips for Seniors',
      description: 'Simple tips for better sleep as you age.',
      category: 'wellness',
      source_type: 'tts_generated',
      text_content: `Sleep is one of the most important things you can do for your health. As we get older, our sleep patterns change, and that's perfectly normal. Here are some simple tips for better rest. First, try to go to bed and wake up at the same time every day, even on weekends. Your body loves routine. Second, make your bedroom cool and dark. A slightly cool room helps you sleep deeper. Third, avoid screens for at least 30 minutes before bed. The blue light from phones and TVs tells your brain it's still daytime. Instead, try reading a book or listening to calming music. Fourth, limit caffeine after noon. That afternoon coffee might be keeping you up at night. Fifth, if you can't sleep after 20 minutes, get up and do something quiet until you feel sleepy again. Don't lie in bed feeling frustrated. And remember, a short nap during the day is perfectly fine — just keep it under 30 minutes so it doesn't interfere with nighttime sleep. Sweet dreams!`,
      duration_seconds: 180,
    },
    {
      id: 'wellness-2',
      title: 'Staying Healthy After 65',
      description: 'How much water do you really need each day?',
      category: 'wellness',
      source_type: 'tts_generated',
      text_content: `Water is essential for every cell in your body. As we age, our sense of thirst can decrease, which means we might not drink enough even when our body needs it. Dehydration can cause headaches, confusion, dizziness, and even falls. So how much water should you drink? A good rule of thumb is about 6 to 8 glasses a day. But you don't have to drink it all at once. Keep a water bottle nearby and take sips throughout the day. If plain water feels boring, try adding a slice of lemon, cucumber, or a few berries for natural flavor. Herbal tea counts too! Foods like watermelon, oranges, cucumbers, and soup also contribute to your daily water intake. One easy way to check if you're hydrated: look at the color of your urine. Pale yellow means you're doing great. Dark yellow means drink more water. Your body will thank you for every sip.`,
      duration_seconds: 150,
    },
    {
      id: 'wellness-3',
      title: 'Keep Your Mind Sharp: Brain Games for Seniors',
      description: 'Keep your mind sharp with these simple daily activities.',
      category: 'wellness',
      source_type: 'tts_generated',
      text_content: `Your brain is like a muscle — the more you use it, the stronger it stays. Here are some fun and easy ways to keep your mind sharp every day. Try crossword puzzles or word searches. They challenge your vocabulary and memory. Learn something new each week — a word in another language, a historical fact, or how something works. Tell stories from your past to your family. Recalling details and putting them in order exercises your memory beautifully. Play card games or board games. They require strategy, counting, and social interaction — all great for your brain. Try using your non-dominant hand for simple tasks like brushing your teeth or stirring your coffee. This creates new neural pathways. Read every day, even if it's just for 15 minutes. And here's a fun one: try to remember your grocery list without writing it down. Start with 3 items and work your way up. The goal isn't perfection — it's the practice that matters. Every time you challenge your brain, you're investing in your future self.`,
      duration_seconds: 180,
    },
  ];
}
