export interface LearningTool {
  name: string;
  url: string;
  desc: string;
  icon: string;
}

export interface ToolCategory {
  id: string;
  name: string;
  icon: string;
  tools: LearningTool[];
}

export const toolCategories: ToolCategory[] = [
  {
    id: 'study-materials',
    name: '词典与参考',
    icon: '📚',
    tools: [
      { name: 'Cambridge Dictionary', url: 'https://dictionary.cambridge.org/', desc: '剑桥词典，权威英语释义', icon: '📘' },
      { name: 'Oxford Learner\'s Dictionaries', url: 'https://www.oxfordlearnersdictionaries.com/', desc: '牛津学习者词典', icon: '📙' },
      { name: 'Collins Dictionary', url: 'https://www.collinsdictionary.com/', desc: '柯林斯词典，地道英式英语', icon: '📗' },
      { name: 'Longman Dictionary', url: 'https://www.ldoceonline.com/', desc: '朗文当代英语词典', icon: '📕' },
    ],
  },
  {
    id: 'basic-learning',
    name: '基础学习',
    icon: '🧩',
    tools: [
      { name: 'BBC Learning English', url: 'https://www.bbc.co.uk/learningenglish', desc: 'BBC 英语学习频道', icon: '🎙️' },
      { name: 'VOA Learning English', url: 'https://learningenglish.voanews.com/', desc: 'VOA 慢速英语', icon: '📻' },
      { name: 'Duolingo', url: 'https://www.duolingo.com/', desc: '多邻国，游戏化学英语', icon: '🦉' },
      { name: 'Khan Academy', url: 'https://www.khanacademy.org/', desc: '可汗学院免费课程', icon: '🧠' },
    ],
  },
  {
    id: 'listening',
    name: '听力训练',
    icon: '🎧',
    tools: [
      { name: 'TED Talks', url: 'https://www.ted.com/', desc: 'TED 演讲，提升听力和思维', icon: '🎤' },
      { name: 'ESLPod', url: 'https://www.eslpod.com/', desc: '英语播客与精听材料', icon: '🎧' },
      { name: 'Elllo', url: 'https://www.elllo.org/', desc: '海量英语听力材料', icon: '🔊' },
      { name: 'Lyrics Training', url: 'https://lyricstraining.com/', desc: '通过歌曲歌词学英语', icon: '🎵' },
    ],
  },
  {
    id: 'reading',
    name: '阅读理解',
    icon: '📖',
    tools: [
      { name: 'News in Levels', url: 'https://www.newsinlevels.com/', desc: '分级新闻阅读', icon: '🗞️' },
      { name: 'Breaking News English', url: 'https://breakingnewsenglish.com/', desc: '新闻英语阅读训练', icon: '🔎' },
      { name: 'ReadTheory', url: 'https://readtheory.org/', desc: '阅读理解练习平台', icon: '📑' },
      { name: 'Project Gutenberg', url: 'https://www.gutenberg.org/', desc: '免费英文电子书', icon: '📚' },
    ],
  },
  {
    id: 'writing',
    name: '写作工具',
    icon: '✍️',
    tools: [
      { name: 'Grammarly', url: 'https://www.grammarly.com/', desc: '智能语法检查工具', icon: '✅' },
      { name: 'Ludwig.guru', url: 'https://ludwig.guru/', desc: '英语例句搜索引擎', icon: '🔎' },
      { name: 'Hemingway Editor', url: 'https://hemingwayapp.com/', desc: '英文写作简化工具', icon: '📝' },
      { name: 'Thesaurus', url: 'https://www.thesaurus.com/', desc: '同义词词典', icon: '🔤' },
    ],
  },
  {
    id: 'exam',
    name: '考试专区',
    icon: '📝',
    tools: [
      { name: 'IELTS Online Tests', url: 'https://ieltsonlinetests.com/', desc: '雅思在线模拟测试', icon: '🧪' },
      { name: 'TOEFL Resources', url: 'https://www.toeflresources.com/', desc: '托福备考资源', icon: '🎯' },
      { name: 'Magoosh', url: 'https://magoosh.com/', desc: 'GRE / GMAT / TOEFL 备考', icon: '🎓' },
      { name: 'Quizlet', url: 'https://quizlet.com/', desc: '在线单词卡片学习', icon: '🃏' },
    ],
  },
  {
    id: 'games',
    name: '英语游戏',
    icon: '🎮',
    tools: [
      { name: 'Wordle', url: 'https://www.nytimes.com/games/wordle/', desc: '每日猜单词游戏', icon: '🟩' },
      { name: 'Scrabble GO', url: 'https://www.scrabblegames.info/', desc: '拼字游戏', icon: '🔡' },
      { name: 'Vocabulary.com', url: 'https://www.vocabulary.com/', desc: '游戏化背单词', icon: '🏆' },
      { name: 'FluentU', url: 'https://www.fluentu.com/', desc: '通过视频学英语', icon: '🎬' },
    ],
  },
];
