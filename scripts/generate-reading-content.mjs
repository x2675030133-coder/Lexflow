import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '..');
const SRC_OUTPUT_FILE = path.join(ROOT, 'src', 'data', 'generatedReading.ts');
const SRC_META_FILE = path.join(ROOT, 'src', 'data', 'generatedReadingMeta.ts');
const PUBLIC_OUTPUT_FILE = path.join(ROOT, 'public', 'data', 'generated-reading.json');
const PUBLIC_META_FILE = path.join(ROOT, 'public', 'data', 'generated-reading-meta.json');
const SERVER_OUTPUT_FILE = path.join(ROOT, 'server', 'data', 'generated-reading.json');
const SERVER_META_FILE = path.join(ROOT, 'server', 'data', 'generated-reading-meta.json');
const PUBLIC_DATA_DIR = path.join(ROOT, 'public', 'data');

const TARGET_ARTICLE_COUNT = Math.max(Number.parseInt(process.env.READING_TARGET_ARTICLE_COUNT || '300', 10) || 300, 1);
const BATCH_INDEX = Math.max(Number.parseInt(process.env.READING_BATCH_INDEX || '0', 10) || 0, 0);
const DEFAULT_SCHEDULE_HOUR = Math.max(0, Math.min(Number.parseInt(process.env.READING_GENERATION_HOUR || '2', 10) || 2, 23));
const DEFAULT_SCHEDULE_MINUTE = Math.max(0, Math.min(Number.parseInt(process.env.READING_GENERATION_MINUTE || '0', 10) || 0, 59));
const BATCH_SIZE = 50;
const WORD_LIST_EXCLUDE = new Set(['metadata.json', 'generated-reading.json', 'generated-reading-meta.json']);

function cleanZhDefinition(value) {
  return String(value || '')
    .replace(/^\s*(?:n|v|vt|vi|adj|adv|prep|conj|pron|art|num|int|abbr|aux|det|pl|a|r|c|i|s)\.\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function buildDefinitionZhLookup() {
  const lookup = new Map();
  const files = await fs.readdir(PUBLIC_DATA_DIR).catch(() => []);

  for (const file of files.filter((name) => name.endsWith('.json') && !WORD_LIST_EXCLUDE.has(name)).sort()) {
    const fullPath = path.join(PUBLIC_DATA_DIR, file);
    const words = JSON.parse(await fs.readFile(fullPath, 'utf8'));
    if (!Array.isArray(words)) continue;

    for (const wordRecord of words) {
      const key = String(wordRecord?.word || '').toLowerCase().trim();
      if (!key || lookup.has(key)) continue;
      const definitions = Array.isArray(wordRecord?.definitions) ? wordRecord.definitions : [];
      const zh = cleanZhDefinition(definitions.find((definition) => definition?.zh)?.zh);
      if (zh) lookup.set(key, zh);
    }
  }

  return lookup;
}

const themes = [
  {
    key: 'ai-study',
    category: 'education',
    source: 'LexFlow Studio',
    titleEn: 'AI Study Habits',
    titleZh: 'AI 学习习惯',
    focusEn: 'AI Study Habits',
    focusZh: 'AI 学习习惯',
    places: [
      { shortEn: 'at Home', shortZh: '在家', fullEn: 'at home', fullZh: '在家里' },
      { shortEn: 'in Class', shortZh: '在课堂', fullEn: 'in class', fullZh: '在课堂上' },
      { shortEn: 'on a Break', shortZh: '在休息时', fullEn: 'on a break', fullZh: '在休息时间' },
      { shortEn: 'on the Weekend', shortZh: '在周末', fullEn: 'on the weekend', fullZh: '在周末' },
      { shortEn: 'before Sleep', shortZh: '睡前', fullEn: 'before sleep', fullZh: '睡前' },
    ],
    goals: [
      { shortEn: 'build a Routine', shortZh: '养成习惯', en: 'build a routine', zh: '养成习惯' },
      { shortEn: 'review Words', shortZh: '复习单词', en: 'review words', zh: '复习单词' },
      { shortEn: 'track Progress', shortZh: '记录进度', en: 'track progress', zh: '记录进度' },
      { shortEn: 'stay Consistent', shortZh: '保持稳定', en: 'stay consistent', zh: '保持稳定' },
      { shortEn: 'learn Faster', shortZh: '学得更快', en: 'learn faster', zh: '学得更快' },
    ],
    details: [
      {
        en: 'A short AI prompt can turn a difficult topic into a clear reading plan with a few simple steps.',
        zh: '一个简短的 AI 提示，就能把难题变成清晰的阅读计划，只需要几个简单步骤。',
      },
      {
        en: 'Learners can let the app suggest a topic, then read it twice to notice sentence patterns and vocabulary.',
        zh: '学习者可以先让应用推荐话题，再读两遍，去留意句型和词汇。',
      },
    ],
    vocabulary: [
      { word: 'prompt', definition: 'a short instruction that tells an AI what to do', phonetic: '/prɑːmpt/' },
      { word: 'feedback', definition: 'information that helps you improve', phonetic: '/ˈfiːdˌbæk/' },
      { word: 'accuracy', definition: 'how correct something is', phonetic: '/ˈækjərəsi/' },
      { word: 'schedule', definition: 'a planned list of times and tasks', phonetic: '/ˈskedʒuːl/' },
      { word: 'habit', definition: 'something you do regularly', phonetic: '/ˈhæbɪt/' },
      { word: 'review', definition: 'to study again', phonetic: '/rɪˈvjuː/' },
    ],
  },
  {
    key: 'ev-city',
    category: 'technology',
    source: 'LexFlow Studio',
    titleEn: 'Electric Cars and City Life',
    titleZh: '电动车与城市生活',
    focusEn: 'Electric Cars and City Life',
    focusZh: '电动车与城市生活',
    places: [
      { shortEn: 'in a Busy Street', shortZh: '在繁忙街道', fullEn: 'in a busy street', fullZh: '在繁忙街道上' },
      { shortEn: 'near a Charging Station', shortZh: '在充电站旁', fullEn: 'near a charging station', fullZh: '在充电站旁边' },
      { shortEn: 'for a Family Trip', shortZh: '家庭出行', fullEn: 'for a family trip', fullZh: '用于家庭出行' },
      { shortEn: 'in the Morning Rush', shortZh: '在早高峰', fullEn: 'in the morning rush', fullZh: '在早高峰时段' },
      { shortEn: 'in a Quiet Neighborhood', shortZh: '在安静社区', fullEn: 'in a quiet neighborhood', fullZh: '在安静社区里' },
    ],
    goals: [
      { shortEn: 'save Energy', shortZh: '节省能源', en: 'save energy', zh: '节省能源' },
      { shortEn: 'reduce Noise', shortZh: '减少噪音', en: 'reduce noise', zh: '减少噪音' },
      { shortEn: 'cut Emissions', shortZh: '减少排放', en: 'cut emissions', zh: '减少排放' },
      { shortEn: 'improve Range', shortZh: '提高续航', en: 'improve range', zh: '提高续航' },
      { shortEn: 'make Travel Easier', shortZh: '让出行更轻松', en: 'make travel easier', zh: '让出行更轻松' },
    ],
    details: [
      {
        en: 'A charging network makes driving feel less stressful, especially when people travel across a large city.',
        zh: '充电网络会让驾驶不那么焦虑，尤其是在大城市里长距离出行时。',
      },
      {
        en: 'For language learners, this topic brings in practical words about transport, planning, and everyday movement.',
        zh: '对英语学习者来说，这个话题能带来很多实用词汇，比如交通、计划和日常移动。',
      },
    ],
    vocabulary: [
      { word: 'battery', definition: 'a device that stores electric power', phonetic: '/ˈbætəri/' },
      { word: 'range', definition: 'how far a vehicle can travel before it needs power', phonetic: '/reɪndʒ/' },
      { word: 'charging', definition: 'putting electricity into a battery', phonetic: '/ˈtʃɑːrdʒɪŋ/' },
      { word: 'efficient', definition: 'using little time or energy', phonetic: '/ɪˈfɪʃənt/' },
      { word: 'traffic', definition: 'the cars and people moving on roads', phonetic: '/ˈtræfɪk/' },
      { word: 'emission', definition: 'a gas or substance sent into the air', phonetic: '/ɪˈmɪʃən/' },
    ],
  },
  {
    key: 'podcast-listening',
    category: 'education',
    source: 'LexFlow Studio',
    titleEn: 'Podcast Listening Habits',
    titleZh: '播客听力习惯',
    focusEn: 'Podcast Listening Habits',
    focusZh: '播客听力习惯',
    places: [
      { shortEn: 'on the Bus', shortZh: '在公交上', fullEn: 'on the bus', fullZh: '在公交车上' },
      { shortEn: 'during Commute Time', shortZh: '通勤时', fullEn: 'during commute time', fullZh: '在通勤时间' },
      { shortEn: 'while Cleaning', shortZh: '打扫时', fullEn: 'while cleaning', fullZh: '在打扫的时候' },
      { shortEn: 'before Work', shortZh: '上班前', fullEn: 'before work', fullZh: '在上班之前' },
      { shortEn: 'before Bed', shortZh: '睡前', fullEn: 'before bed', fullZh: '在睡前' },
    ],
    goals: [
      { shortEn: 'hear New Words', shortZh: '听新词', en: 'hear new words', zh: '听到新词' },
      { shortEn: 'train the Ear', shortZh: '训练耳朵', en: 'train the ear', zh: '训练听觉' },
      { shortEn: 'follow the Main Idea', shortZh: '抓住主旨', en: 'follow the main idea', zh: '抓住主旨' },
      { shortEn: 'repeat Important Lines', shortZh: '重复重点句', en: 'repeat important lines', zh: '重复重点句子' },
      { shortEn: 'build Confidence', shortZh: '建立信心', en: 'build confidence', zh: '建立信心' },
    ],
    details: [
      {
        en: 'Short listening sessions can make English sound more natural because the ear gets used to rhythm and stress.',
        zh: '短时听力练习会让英语听起来更自然，因为耳朵会慢慢适应节奏和重音。',
      },
      {
        en: 'A good podcast article helps learners move between listening, reading, and speaking without changing the topic.',
        zh: '一篇好的播客文章能让学习者在听、读、说之间来回切换，而不用换话题。',
      },
    ],
    vocabulary: [
      { word: 'episode', definition: 'one part of a podcast or series', phonetic: '/ˈepɪsoʊd/' },
      { word: 'transcript', definition: 'a written record of spoken words', phonetic: '/ˈtrænskrɪpt/' },
      { word: 'accent', definition: 'the way a person pronounces language', phonetic: '/ˈæksent/' },
      { word: 'commute', definition: 'to travel regularly between home and work or school', phonetic: '/kəˈmjuːt/' },
      { word: 'rhythm', definition: 'a regular repeated pattern', phonetic: '/ˈrɪðəm/' },
      { word: 'confidence', definition: 'a feeling that you can do something well', phonetic: '/ˈkɑːnfɪdəns/' },
    ],
  },
  {
    key: 'school-reading',
    category: 'education',
    source: 'LexFlow Studio',
    titleEn: 'Reading in the Classroom',
    titleZh: '课堂中的阅读',
    focusEn: 'Reading in the Classroom',
    focusZh: '课堂中的阅读',
    places: [
      { shortEn: 'in the Library', shortZh: '在图书馆', fullEn: 'in the library', fullZh: '在图书馆里' },
      { shortEn: 'during Group Work', shortZh: '小组合作', fullEn: 'during group work', fullZh: '在小组合作中' },
      { shortEn: 'after the Lesson', shortZh: '课后', fullEn: 'after the lesson', fullZh: '在课后' },
      { shortEn: 'before the Exam', shortZh: '考试前', fullEn: 'before the exam', fullZh: '在考试前' },
      { shortEn: 'in a Small Class', shortZh: '小班课堂', fullEn: 'in a small class', fullZh: '在小班课堂里' },
    ],
    goals: [
      { shortEn: 'understand a Paragraph', shortZh: '理解段落', en: 'understand a paragraph', zh: '理解一个段落' },
      { shortEn: 'summarize Ideas', shortZh: '概括想法', en: 'summarize ideas', zh: '概括想法' },
      { shortEn: 'answer Questions', shortZh: '回答问题', en: 'answer questions', zh: '回答问题' },
      { shortEn: 'notice Key Words', shortZh: '留意关键词', en: 'notice key words', zh: '留意关键词' },
      { shortEn: 'practice Speaking', shortZh: '练习口语', en: 'practice speaking', zh: '练习口语' },
    ],
    details: [
      {
        en: 'Teachers often choose short bilingual texts so that students can connect ideas without getting lost in long sentences.',
        zh: '老师常会选择短一些的双语文本，这样学生能在不迷失于长句的情况下把想法连起来。',
      },
      {
        en: 'A well-structured lesson can move from reading to speaking and then back to reading again for review.',
        zh: '一堂结构清晰的课，可以先读，再说，最后回到阅读中复习。',
      },
    ],
    vocabulary: [
      { word: 'paragraph', definition: 'a group of sentences about one idea', phonetic: '/ˈpærəɡræf/' },
      { word: 'summary', definition: 'a short statement of the main points', phonetic: '/ˈsʌməri/' },
      { word: 'question', definition: 'something you ask to get information', phonetic: '/ˈkwestʃən/' },
      { word: 'classroom', definition: 'a room where lessons happen', phonetic: '/ˈklæsruːm/' },
      { word: 'teacher', definition: 'a person who helps people learn', phonetic: '/ˈtiːtʃər/' },
      { word: 'comprehension', definition: 'the ability to understand written or spoken language', phonetic: '/ˌkɑːmprɪˈhenʃən/' },
    ],
  },
  {
    key: 'climate-city',
    category: 'environment',
    source: 'LexFlow Studio',
    titleEn: 'Climate Plans for Cities',
    titleZh: '城市气候计划',
    focusEn: 'Climate Plans for Cities',
    focusZh: '城市气候计划',
    places: [
      { shortEn: 'by the River', shortZh: '在河边', fullEn: 'by the river', fullZh: '在河边' },
      { shortEn: 'during Hot Summers', shortZh: '炎热夏天', fullEn: 'during hot summers', fullZh: '在炎热的夏天' },
      { shortEn: 'after Heavy Rain', shortZh: '暴雨之后', fullEn: 'after heavy rain', fullZh: '在大雨之后' },
      { shortEn: 'near the Coast', shortZh: '沿海地区', fullEn: 'near the coast', fullZh: '在沿海附近' },
      { shortEn: 'in a Crowded District', shortZh: '拥挤城区', fullEn: 'in a crowded district', fullZh: '在拥挤的城区里' },
    ],
    goals: [
      { shortEn: 'prevent Floods', shortZh: '防洪', en: 'prevent floods', zh: '防止洪水' },
      { shortEn: 'cool Streets', shortZh: '降温街道', en: 'cool streets', zh: '让街道降温' },
      { shortEn: 'save Water', shortZh: '节约用水', en: 'save water', zh: '节约用水' },
      { shortEn: 'protect Trees', shortZh: '保护树木', en: 'protect trees', zh: '保护树木' },
      { shortEn: 'build Resilience', shortZh: '提升韧性', en: 'build resilience', zh: '提升韧性' },
    ],
    details: [
      {
        en: 'City planners need simple ideas that can work in real streets, not only in long reports.',
        zh: '城市规划者需要能真正落地的简单方案，而不只是长篇报告里的想法。',
      },
      {
        en: 'This topic gives learners useful words about weather, design, safety, and community decisions.',
        zh: '这个话题会给学习者带来天气、设计、安全和社区决策等方面的实用词汇。',
      },
    ],
    vocabulary: [
      { word: 'resilience', definition: 'the ability to recover after difficulty', phonetic: '/rɪˈzɪliəns/' },
      { word: 'drainage', definition: 'the system that carries away water', phonetic: '/ˈdreɪnɪdʒ/' },
      { word: 'shade', definition: 'an area protected from direct sunlight', phonetic: '/ʃeɪd/' },
      { word: 'coast', definition: 'the land next to the sea', phonetic: '/koʊst/' },
      { word: 'district', definition: 'an area of a city or country', phonetic: '/ˈdɪstrɪkt/' },
      { word: 'adapt', definition: 'to change in order to fit new conditions', phonetic: '/əˈdæpt/' },
    ],
  },
  {
    key: 'remote-work',
    category: 'technology',
    source: 'LexFlow Studio',
    titleEn: 'Remote Work Communication',
    titleZh: '远程工作沟通',
    focusEn: 'Remote Work Communication',
    focusZh: '远程工作沟通',
    places: [
      { shortEn: 'in a Home Office', shortZh: '在家庭办公室', fullEn: 'in a home office', fullZh: '在家庭办公室里' },
      { shortEn: 'during a Video Call', shortZh: '视频会议中', fullEn: 'during a video call', fullZh: '在视频通话中' },
      { shortEn: 'after Lunch', shortZh: '午饭后', fullEn: 'after lunch', fullZh: '午饭后' },
      { shortEn: 'before the Deadline', shortZh: '截止日前', fullEn: 'before the deadline', fullZh: '在截止日期前' },
      { shortEn: 'across Time Zones', shortZh: '跨时区', fullEn: 'across time zones', fullZh: '跨越不同的时区' },
    ],
    goals: [
      { shortEn: 'share Updates', shortZh: '分享进度', en: 'share updates', zh: '分享进度' },
      { shortEn: 'ask Clear Questions', shortZh: '提出清晰问题', en: 'ask clear questions', zh: '提出清晰问题' },
      { shortEn: 'plan Tasks', shortZh: '安排任务', en: 'plan tasks', zh: '安排任务' },
      { shortEn: 'reduce Confusion', shortZh: '减少混乱', en: 'reduce confusion', zh: '减少混乱' },
      { shortEn: 'keep the Team Moving', shortZh: '推动团队前进', en: 'keep the team moving', zh: '让团队继续前进' },
    ],
    details: [
      {
        en: 'Short messages and clear agendas help remote teams avoid long back-and-forth conversations.',
        zh: '简短消息和清晰议程能帮助远程团队避免来回拉扯的长对话。',
      },
      {
        en: 'For readers, this is a useful topic because it shows how modern work changes everyday English.',
        zh: '对读者来说，这个话题很有用，因为它展示了现代工作如何改变日常英语。',
      },
    ],
    vocabulary: [
      { word: 'agenda', definition: 'a list of things to discuss or do', phonetic: '/əˈdʒendə/' },
      { word: 'collaboration', definition: 'working together with others', phonetic: '/kəˌlæbəˈreɪʃən/' },
      { word: 'deadline', definition: 'the latest time when something should be done', phonetic: '/ˈdedlaɪn/' },
      { word: 'update', definition: 'new information about a situation', phonetic: '/ˈʌpdeɪt/' },
      { word: 'message', definition: 'a short piece of information sent to someone', phonetic: '/ˈmesɪdʒ/' },
      { word: 'clarity', definition: 'the quality of being easy to understand', phonetic: '/ˈklærəti/' },
    ],
  },
  {
    key: 'health-habit',
    category: 'culture',
    source: 'LexFlow Studio',
    titleEn: 'Health and Daily Habits',
    titleZh: '健康与日常习惯',
    focusEn: 'Health and Daily Habits',
    focusZh: '健康与日常习惯',
    places: [
      { shortEn: 'in the Morning', shortZh: '早晨', fullEn: 'in the morning', fullZh: '在早晨' },
      { shortEn: 'after Work', shortZh: '下班后', fullEn: 'after work', fullZh: '在下班后' },
      { shortEn: 'at the Gym', shortZh: '在健身房', fullEn: 'at the gym', fullZh: '在健身房里' },
      { shortEn: 'during a Walk', shortZh: '散步时', fullEn: 'during a walk', fullZh: '在散步时' },
      { shortEn: 'on Busy Days', shortZh: '忙碌日子里', fullEn: 'on busy days', fullZh: '在忙碌的日子里' },
    ],
    goals: [
      { shortEn: 'sleep Better', shortZh: '睡得更好', en: 'sleep better', zh: '睡得更好' },
      { shortEn: 'eat Well', shortZh: '吃得更好', en: 'eat well', zh: '吃得更健康' },
      { shortEn: 'move More', shortZh: '多运动', en: 'move more', zh: '多活动身体' },
      { shortEn: 'stay Balanced', shortZh: '保持平衡', en: 'stay balanced', zh: '保持平衡' },
      { shortEn: 'feel Less Stress', shortZh: '减轻压力', en: 'feel less stress', zh: '感到更少压力' },
    ],
    details: [
      {
        en: 'Small actions often matter more than big promises when people try to improve their health.',
        zh: '当人们想改善健康时，小动作往往比大承诺更重要。',
      },
      {
        en: 'A reading article about health can stay practical by giving examples that fit a normal daily routine.',
        zh: '一篇健康主题的阅读文章，如果能举出贴近日常生活的例子，就会更实用。',
      },
    ],
    vocabulary: [
      { word: 'routine', definition: 'a regular way of doing things', phonetic: '/ruːˈtiːn/' },
      { word: 'balance', definition: 'a healthy or steady state', phonetic: '/ˈbæləns/' },
      { word: 'stress', definition: 'mental or physical pressure', phonetic: '/stres/' },
      { word: 'exercise', definition: 'physical activity to keep the body strong', phonetic: '/ˈeksərsaɪz/' },
      { word: 'recovery', definition: 'the process of getting well again', phonetic: '/rɪˈkʌvəri/' },
      { word: 'energy', definition: 'the power to do work or activity', phonetic: '/ˈenərdʒi/' },
    ],
  },
  {
    key: 'book-club',
    category: 'culture',
    source: 'LexFlow Studio',
    titleEn: 'Books and Reading Clubs',
    titleZh: '书籍与读书会',
    focusEn: 'Books and Reading Clubs',
    focusZh: '书籍与读书会',
    places: [
      { shortEn: 'in a Bookstore', shortZh: '在书店', fullEn: 'in a bookstore', fullZh: '在书店里' },
      { shortEn: 'at the Library', shortZh: '在图书馆', fullEn: 'at the library', fullZh: '在图书馆里' },
      { shortEn: 'during a Club Meeting', shortZh: '读书会中', fullEn: 'during a club meeting', fullZh: '在读书会活动中' },
      { shortEn: 'on a Rainy Day', shortZh: '雨天', fullEn: 'on a rainy day', fullZh: '在下雨天' },
      { shortEn: 'before a Holiday', shortZh: '假期前', fullEn: 'before a holiday', fullZh: '在假期之前' },
    ],
    goals: [
      { shortEn: 'share Thoughts', shortZh: '分享想法', en: 'share thoughts', zh: '分享想法' },
      { shortEn: 'finish a Chapter', shortZh: '读完一章', en: 'finish a chapter', zh: '读完一章' },
      { shortEn: 'notice Style', shortZh: '留意风格', en: 'notice style', zh: '留意写作风格' },
      { shortEn: 'talk About a Story', shortZh: '讨论故事', en: 'talk about a story', zh: '讨论一个故事' },
      { shortEn: 'remember Quotes', shortZh: '记住句子', en: 'remember quotes', zh: '记住摘句' },
    ],
    details: [
      {
        en: 'Reading clubs make English feel social, because the same page can lead to different opinions and questions.',
        zh: '读书会会让英语变得更有社交感，因为同一页内容可以引出不同观点和问题。',
      },
      {
        en: 'A bilingual article about books gives learners a calm topic with plenty of useful words and sentence patterns.',
        zh: '关于书籍的双语文章，会给学习者一个安静又有很多实用词汇和句型的话题。',
      },
    ],
    vocabulary: [
      { word: 'chapter', definition: 'one section of a book', phonetic: '/ˈtʃæptər/' },
      { word: 'quote', definition: 'words taken from a text or speech', phonetic: '/kwoʊt/' },
      { word: 'genre', definition: 'a type of book, film, or music', phonetic: '/ˈʒɑːnrə/' },
      { word: 'discussion', definition: 'a conversation about a topic', phonetic: '/dɪˈskʌʃən/' },
      { word: 'style', definition: 'the way something is written or done', phonetic: '/staɪl/' },
      { word: 'library', definition: 'a place where books are kept for reading', phonetic: '/ˈlaɪbreri/' },
    ],
  },
  {
    key: 'culture-art',
    category: 'culture',
    source: 'LexFlow Studio',
    titleEn: 'Culture and Art in Everyday Life',
    titleZh: '日常生活中的文化与艺术',
    focusEn: 'Culture and Art in Everyday Life',
    focusZh: '日常生活中的文化与艺术',
    places: [
      { shortEn: 'at a Museum', shortZh: '在博物馆', fullEn: 'at a museum', fullZh: '在博物馆里' },
      { shortEn: 'in a Gallery', shortZh: '在画廊', fullEn: 'in a gallery', fullZh: '在画廊里' },
      { shortEn: 'during a Festival', shortZh: '在节日活动中', fullEn: 'during a festival', fullZh: '在节日活动中' },
      { shortEn: 'on a City Street', shortZh: '在城市街道', fullEn: 'on a city street', fullZh: '在城市街道上' },
      { shortEn: 'inside a Theater', shortZh: '在剧院内', fullEn: 'inside a theater', fullZh: '在剧院里' },
    ],
    goals: [
      { shortEn: 'understand Tradition', shortZh: '了解传统', en: 'understand tradition', zh: '了解传统' },
      { shortEn: 'see New Ideas', shortZh: '看到新想法', en: 'see new ideas', zh: '看到新的想法' },
      { shortEn: 'compare Styles', shortZh: '比较风格', en: 'compare styles', zh: '比较风格' },
      { shortEn: 'talk About Art', shortZh: '谈论艺术', en: 'talk about art', zh: '谈论艺术' },
      { shortEn: 'enjoy a Show', shortZh: '欣赏演出', en: 'enjoy a show', zh: '欣赏一场演出' },
    ],
    details: [
      {
        en: 'Art topics help learners connect language with real objects, colors, people, and places.',
        zh: '艺术话题能帮助学习者把语言和真实的物品、颜色、人物、地点联系起来。',
      },
      {
        en: 'Culture articles are useful because they feel rich, but they still stay close to everyday speaking and reading.',
        zh: '文化类文章很有用，因为内容丰富，但又和日常口语与阅读保持很近的距离。',
      },
    ],
    vocabulary: [
      { word: 'tradition', definition: 'something passed from the past to the present', phonetic: '/trəˈdɪʃən/' },
      { word: 'gallery', definition: 'a place where art is shown', phonetic: '/ˈɡæləri/' },
      { word: 'festival', definition: 'a special public celebration', phonetic: '/ˈfestɪvl/' },
      { word: 'theater', definition: 'a place for performances', phonetic: '/ˈθiːətər/' },
      { word: 'design', definition: 'the way something is planned and made', phonetic: '/dɪˈzaɪn/' },
      { word: 'expression', definition: 'the act of showing feelings or ideas', phonetic: '/ɪkˈspreʃən/' },
    ],
  },
  {
    key: 'science-lab',
    category: 'education',
    source: 'LexFlow Studio',
    titleEn: 'Science and Simple Experiments',
    titleZh: '科学与简单实验',
    focusEn: 'Science and Simple Experiments',
    focusZh: '科学与简单实验',
    places: [
      { shortEn: 'in a Lab', shortZh: '在实验室', fullEn: 'in a lab', fullZh: '在实验室里' },
      { shortEn: 'in a Classroom', shortZh: '在教室', fullEn: 'in a classroom', fullZh: '在教室里' },
      { shortEn: 'at Home', shortZh: '在家', fullEn: 'at home', fullZh: '在家里' },
      { shortEn: 'after School', shortZh: '放学后', fullEn: 'after school', fullZh: '在放学后' },
      { shortEn: 'during a Project', shortZh: '项目中', fullEn: 'during a project', fullZh: '在项目进行时' },
    ],
    goals: [
      { shortEn: 'observe Changes', shortZh: '观察变化', en: 'observe changes', zh: '观察变化' },
      { shortEn: 'test an Idea', shortZh: '测试想法', en: 'test an idea', zh: '测试一个想法' },
      { shortEn: 'collect Data', shortZh: '收集数据', en: 'collect data', zh: '收集数据' },
      { shortEn: 'explain Results', shortZh: '解释结果', en: 'explain results', zh: '解释结果' },
      { shortEn: 'ask Why', shortZh: '追问原因', en: 'ask why', zh: '追问为什么' },
    ],
    details: [
      {
        en: 'An experiment article works well when it explains one idea step by step and keeps the language clear.',
        zh: '一篇实验主题的文章，如果能一步一步解释一个想法，并保持语言清晰，就很合适。',
      },
      {
        en: 'Science vocabulary often repeats in reports, classrooms, and discussions, so learners can recycle it easily.',
        zh: '科学词汇常常会在报告、课堂和讨论里反复出现，因此学习者很容易反复使用。',
      },
    ],
    vocabulary: [
      { word: 'experiment', definition: 'a test to see what happens', phonetic: '/ɪkˈsperɪmənt/' },
      { word: 'result', definition: 'the thing that happens after an action or test', phonetic: '/rɪˈzʌlt/' },
      { word: 'data', definition: 'information collected for study', phonetic: '/ˈdeɪtə/' },
      { word: 'observe', definition: 'to watch carefully', phonetic: '/əbˈzɜːrv/' },
      { word: 'hypothesis', definition: 'an idea that can be tested', phonetic: '/haɪˈpɑːθəsɪs/' },
      { word: 'method', definition: 'a way of doing something', phonetic: '/ˈmeθəd/' },
    ],
  },
  {
    key: 'food-kitchen',
    category: 'culture',
    source: 'LexFlow Studio',
    titleEn: 'Food and Cooking Habits',
    titleZh: '食物与烹饪习惯',
    focusEn: 'Food and Cooking Habits',
    focusZh: '食物与烹饪习惯',
    places: [
      { shortEn: 'in the Kitchen', shortZh: '在厨房', fullEn: 'in the kitchen', fullZh: '在厨房里' },
      { shortEn: 'at Breakfast', shortZh: '在早餐时', fullEn: 'at breakfast', fullZh: '在早餐时' },
      { shortEn: 'during Dinner', shortZh: '晚餐时', fullEn: 'during dinner', fullZh: '在晚餐时' },
      { shortEn: 'at a Market', shortZh: '在市场', fullEn: 'at a market', fullZh: '在市场里' },
      { shortEn: 'on a Weekend', shortZh: '周末', fullEn: 'on a weekend', fullZh: '在周末' },
    ],
    goals: [
      { shortEn: 'follow a Recipe', shortZh: '跟着食谱', en: 'follow a recipe', zh: '跟着食谱做' },
      { shortEn: 'pick Fresh Food', shortZh: '选新鲜食材', en: 'pick fresh food', zh: '挑选新鲜食材' },
      { shortEn: 'eat More Slowly', shortZh: '吃得更慢', en: 'eat more slowly', zh: '吃得更慢一些' },
      { shortEn: 'share a Meal', shortZh: '分享一餐', en: 'share a meal', zh: '分享一顿饭' },
      { shortEn: 'save Time', shortZh: '节省时间', en: 'save time', zh: '节省时间' },
    ],
    details: [
      {
        en: 'Cooking stories are useful because they connect language with real objects, ingredients, and steps.',
        zh: '烹饪类故事很有用，因为它把语言和真实的物品、食材、步骤联系起来。',
      },
      {
        en: 'A food topic also feels warm and familiar, which helps learners stay relaxed while reading.',
        zh: '食物话题往往温暖又熟悉，这会帮助学习者在阅读时保持放松。',
      },
    ],
    vocabulary: [
      { word: 'ingredient', definition: 'one of the things used to make food', phonetic: '/ɪnˈɡriːdiənt/' },
      { word: 'recipe', definition: 'instructions for cooking a dish', phonetic: '/ˈresəpi/' },
      { word: 'portion', definition: 'an amount of food for one person', phonetic: '/ˈpɔːrʃən/' },
      { word: 'flavor', definition: 'the taste of food or drink', phonetic: '/ˈfleɪvər/' },
      { word: 'fresh', definition: 'newly made or recently picked', phonetic: '/freʃ/' },
      { word: 'meal', definition: 'food eaten at a particular time', phonetic: '/miːl/' },
    ],
  },
  {
    key: 'travel-route',
    category: 'news',
    source: 'LexFlow Studio',
    titleEn: 'Travel and Transportation',
    titleZh: '旅行与交通',
    focusEn: 'Travel and Transportation',
    focusZh: '旅行与交通',
    places: [
      { shortEn: 'at the Station', shortZh: '在车站', fullEn: 'at the station', fullZh: '在车站里' },
      { shortEn: 'on a Train', shortZh: '在火车上', fullEn: 'on a train', fullZh: '在火车上' },
      { shortEn: 'at the Airport', shortZh: '在机场', fullEn: 'at the airport', fullZh: '在机场里' },
      { shortEn: 'on the Road', shortZh: '在路上', fullEn: 'on the road', fullZh: '在路上' },
      { shortEn: 'in a New City', shortZh: '在新城市', fullEn: 'in a new city', fullZh: '在新城市里' },
    ],
    goals: [
      { shortEn: 'find a Route', shortZh: '找路线', en: 'find a route', zh: '找到路线' },
      { shortEn: 'buy a Ticket', shortZh: '买票', en: 'buy a ticket', zh: '购买票' },
      { shortEn: 'arrive on Time', shortZh: '准时到达', en: 'arrive on time', zh: '准时到达' },
      { shortEn: 'avoid Delays', shortZh: '避免延误', en: 'avoid delays', zh: '避免延误' },
      { shortEn: 'travel Comfortably', shortZh: '舒适出行', en: 'travel comfortably', zh: '舒适地旅行' },
    ],
    details: [
      {
        en: 'Travel articles help learners practice useful words that appear in signs, announcements, and simple conversations.',
        zh: '旅行类文章能帮助学习者练习常见词汇，这些词会出现在路牌、通知和简单对话里。',
      },
      {
        en: 'This topic is easy to revisit because everyone has some experience with movement, planning, and waiting.',
        zh: '这个话题很容易反复学习，因为每个人都对出行、计划和等待有一些经验。',
      },
    ],
    vocabulary: [
      { word: 'route', definition: 'the way from one place to another', phonetic: '/ruːt/' },
      { word: 'ticket', definition: 'a piece of paper or digital pass for travel or entry', phonetic: '/ˈtɪkɪt/' },
      { word: 'delay', definition: 'a later time than planned', phonetic: '/dɪˈleɪ/' },
      { word: 'journey', definition: 'a trip from one place to another', phonetic: '/ˈdʒɜːrni/' },
      { word: 'station', definition: 'a place where trains or buses stop', phonetic: '/ˈsteɪʃən/' },
      { word: 'comfort', definition: 'a pleasant feeling of ease', phonetic: '/ˈkʌmfərt/' },
    ],
  },
];

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 56);
}

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function escapeTs(value) {
  return JSON.stringify(value, null, 2);
}

function toPhonetic(word) {
  return `/${String(word || '').toLowerCase().replace(/[^a-z0-9]+/g, '') || 'word'}/`;
}

function normalizeZhContext(value) {
  return String(value || '')
    .trim()
    .replace(/^在/, '')
    .replace(/时候$/, '')
    .replace(/时$/, '');
}

function withDefinitionZh(item, definitionZhLookup) {
  const definitionZh = definitionZhLookup.get(normalizeText(item.word).toLowerCase());
  return definitionZh ? { ...item, definitionZh } : item;
}

function buildSharedVocabulary(theme, definitionZhLookup) {
  return [
    {
      word: 'context',
      definition: `the words and ideas around ${theme.focusZh} that make it easier to understand`,
      phonetic: '/ˈkɑːntekst/',
    },
    {
      word: 'detail',
      definition: `a small piece of information that adds meaning to ${theme.focusZh}`,
      phonetic: '/ˈdiːteɪl/',
    },
    {
      word: 'pattern',
      definition: `a repeated form that helps learners notice how ${theme.focusZh} works`,
      phonetic: '/ˈpætərn/',
    },
    {
      word: 'routine',
      definition: `a regular way of doing something that supports ${theme.focusZh}`,
      phonetic: '/ruːˈtiːn/',
    },
    {
      word: 'review',
      definition: `to study or read again in order to understand ${theme.focusZh} better`,
      phonetic: '/rɪˈvjuː/',
    },
    {
      word: 'progress',
      definition: `forward movement that shows a learner is getting better at ${theme.focusZh}`,
      phonetic: '/ˈprɑːɡres/',
    },
  ].map((item) => withDefinitionZh(item, definitionZhLookup));
}

function buildVocabulary(theme, definitionZhLookup) {
  return [
    ...theme.vocabulary.map((item) => ({
      word: normalizeText(item.word),
      definition: normalizeText(item.definition),
      phonetic: normalizeText(item.phonetic || toPhonetic(item.word)),
    })).map((item) => withDefinitionZh(item, definitionZhLookup)),
    ...buildSharedVocabulary(theme, definitionZhLookup),
  ].slice(0, 12);
}

function buildParagraphs(theme, place, goal, detail, articleNumber) {
  return [
    {
      en: `${theme.focusEn} matters when people want to ${goal.en}.`,
      zh: `${theme.focusZh} 在人们想要${goal.zh}时很重要。`,
    },
    {
      en: `When people study ${place.fullEn}, the topic feels concrete because learners can connect it with daily life.`,
      zh: `当人们在${normalizeZhContext(place.fullZh)}的时候，这个话题会变得更具体，因为学习者能把它和日常生活联系起来。`,
    },
    {
      en: detail.en,
      zh: detail.zh,
    },
    {
      en: `The article also shows that a small habit can be easier to keep than a perfect plan that never starts.`,
      zh: `这篇文章还说明，一个小习惯往往比一个迟迟不开始的完美计划更容易坚持。`,
    },
    {
      en: `Learners can read the piece once for the main idea and a second time for vocabulary and sentence patterns.`,
      zh: `学习者可以先读一遍抓主旨，再读一遍看词汇和句型。`,
    },
    {
      en: `That makes the text useful for both practice and review, which is exactly what a reading library should do.`,
      zh: `这让文章既适合练习，也适合复习，而这正是阅读库应该做到的。`,
    },
    {
      en: `Try underlining the key verb, the clearest example, and one line that would still make sense if read alone.`,
      zh: `可以试着划出关键词、最清楚的例子，以及单独读出来仍然说得通的一句话。`,
    },
    {
      en: `Article ${articleNumber} keeps the language smooth, the topic practical, and the bilingual format easy to return to later.`,
      zh: `第 ${articleNumber} 篇文章把语言写得顺畅，把话题做得实用，也让双语格式便于之后再回来看。`,
    },
  ];
}

function buildArticle(theme, place, goal, detail, detailIndex, variantIndex, batchIndex, globalIndex, definitionZhLookup) {
  const detailLabelEn = normalizeText(detail.en).split(' ').slice(0, 4).join(' ');
  const detailLabelZh = normalizeText(detail.zh).replace(/[。！？]/g, '').slice(0, 10);
  const titleEn = `${theme.titleEn}: ${goal.shortEn} ${place.shortEn} ${detailLabelEn}`;
  const titleZh = `${theme.titleZh}：${goal.shortZh}${place.shortZh}${detailLabelZh || `第${detailIndex + 1}种`}`;
  const date = new Date(Date.UTC(2026, 3, 1) + globalIndex * 86400000).toISOString().slice(0, 10);

  return {
    id: `${slugify(theme.key)}-${String(batchIndex).padStart(2, '0')}-${String(variantIndex + 1).padStart(3, '0')}`,
    titleEn: normalizeText(titleEn),
    titleZh: normalizeText(titleZh),
    category: theme.category,
    date,
    source: theme.source,
    sourceUrl: `https://lexflow.icu/reading/${slugify(theme.key)}/${batchIndex}/${variantIndex + 1}`,
    paragraphs: buildParagraphs(theme, place, goal, detail, variantIndex + 1),
    vocabulary: buildVocabulary(theme, definitionZhLookup),
  };
}

function buildArticlePool(batchIndex, definitionZhLookup) {
  const pool = [];

  for (let placeIndex = 0; placeIndex < themes[0].places.length; placeIndex += 1) {
    for (let goalIndex = 0; goalIndex < themes[0].goals.length; goalIndex += 1) {
      for (let detailIndex = 0; detailIndex < themes[0].details.length; detailIndex += 1) {
        themes.forEach((theme, themeIndex) => {
          const place = theme.places[placeIndex];
          const goal = theme.goals[goalIndex];
          const detail = theme.details[detailIndex];
          const variantIndex = themeIndex * BATCH_SIZE + placeIndex * 10 + goalIndex * 2 + detailIndex;
          const globalIndex = batchIndex * TARGET_ARTICLE_COUNT + pool.length;
          pool.push(buildArticle(theme, place, goal, detail, detailIndex, variantIndex, batchIndex, globalIndex, definitionZhLookup));
        });
      }
    }
  }

  const start = (batchIndex * TARGET_ARTICLE_COUNT) % pool.length;
  return Array.from({ length: TARGET_ARTICLE_COUNT }, (_, index) => pool[(start + index) % pool.length]);
}

function buildMeta(articles, batchIndex) {
  return {
    generatedAt: new Date().toISOString(),
    articleCount: articles.length,
    sourceMode: 'fallback',
    provider: 'template',
    sourceBriefCount: 0,
    sourceNames: [...new Set(articles.map((article) => article.source).filter(Boolean))],
    targetArticleCount: TARGET_ARTICLE_COUNT,
    batchIndex,
    generationSchedule: {
      hour: DEFAULT_SCHEDULE_HOUR,
      minute: DEFAULT_SCHEDULE_MINUTE,
      label: `每天 ${String(DEFAULT_SCHEDULE_HOUR).padStart(2, '0')}:${String(DEFAULT_SCHEDULE_MINUTE).padStart(2, '0')}`,
    },
  };
}

function renderTypeScript(articles) {
  return `import type { Article } from './articles';\n\nexport const generatedReading: Article[] = ${escapeTs(articles)};\n`;
}

function renderMetaTypeScript(meta) {
  return `export interface GeneratedReadingMeta {
  generatedAt: string;
  articleCount: number;
  sourceMode: 'model' | 'fallback';
  provider: string;
  sourceBriefCount: number;
  sourceNames: string[];
  targetArticleCount?: number;
  batchIndex?: number;
  generationSchedule?: {
    hour: number;
    minute: number;
    label: string;
  };
}

export const generatedReadingMeta: GeneratedReadingMeta = ${escapeTs(meta)};
`;
}

async function writeOutputs(articles, meta) {
  await fs.mkdir(path.dirname(SRC_OUTPUT_FILE), { recursive: true });
  await fs.mkdir(path.dirname(PUBLIC_OUTPUT_FILE), { recursive: true });
  await fs.mkdir(path.dirname(SERVER_OUTPUT_FILE), { recursive: true });

  const json = JSON.stringify(articles, null, 2);
  const metaJson = JSON.stringify(meta, null, 2);

  await Promise.all([
    fs.writeFile(SRC_OUTPUT_FILE, renderTypeScript(articles), 'utf8'),
    fs.writeFile(SRC_META_FILE, renderMetaTypeScript(meta), 'utf8'),
    fs.writeFile(PUBLIC_OUTPUT_FILE, json, 'utf8'),
    fs.writeFile(PUBLIC_META_FILE, metaJson, 'utf8'),
    fs.writeFile(SERVER_OUTPUT_FILE, json, 'utf8'),
    fs.writeFile(SERVER_META_FILE, metaJson, 'utf8'),
  ]);
}

async function main() {
  const definitionZhLookup = await buildDefinitionZhLookup();
  const articles = buildArticlePool(BATCH_INDEX, definitionZhLookup);
  const meta = buildMeta(articles, BATCH_INDEX);

  await writeOutputs(articles, meta);
  console.log(`Wrote ${articles.length} generated reading articles to ${path.relative(ROOT, SRC_OUTPUT_FILE)}`);
}

await main();
