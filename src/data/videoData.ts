export interface SubtitleLine {
  id: number;
  startTime: number;
  endTime: number;
  en: string;
  zh: string;
  highlights: string[];
}

export interface VideoLesson {
  id: string;
  title: string;
  episode: number;
  speaker: string;
  category: string;
  thumbnail: string;
  duration: string;
  videoUrl?: string;
  videoSource: 'local' | 'embed' | 'tts';
  subtitles: SubtitleLine[];
}

export const videoLessons: VideoLesson[] = [
  {
    id: 'v001',
    title: 'Gu Ailing on Self-Doubt',
    episode: 132,
    speaker: 'GU Ailing Eileen',
    category: 'Interview',
    thumbnail: '',
    videoUrl: '/videos/gu-ailing-self-doubt.mp4',
    videoSource: 'local',
    duration: '2:35',
    subtitles: [
      {
        id: 1, startTime: 0, endTime: 5,
        en: 'As young women, I think it is easy to doubt.',
        zh: '作为年轻女性，我觉得我们很容易产生怀疑。',
        highlights: ['doubt']
      },
      {
        id: 2, startTime: 5, endTime: 11,
        en: 'And I mean this as in, like, instilled, you know, self-instilled self-doubt.',
        zh: '我的意思是，那种被灌输的、你知道的，自己内心产生的自我怀疑。',
        highlights: ['instilled', 'self-doubt']
      },
      {
        id: 3, startTime: 11, endTime: 17,
        en: 'but also maybe external subtleties and like little micro things that make you doubt yourself.',
        zh: '但也可能来自外界一些微妙的影响，还有那些细微的小事，让你开始怀疑自己。',
        highlights: ['external', 'subtleties', 'micro']
      },
      {
        id: 4, startTime: 17, endTime: 19,
        en: 'and over time make you afraid to try.',
        zh: '久而久之，让你变得害怕去尝试。',
        highlights: ['over time']
      },
      {
        id: 5, startTime: 19, endTime: 25,
        en: "That's why we see rates of young women participating in sports declining.",
        zh: '这就是为什么我们看到年轻女性参与体育运动的比例在下降。',
        highlights: ['participating', 'declining']
      },
      {
        id: 6, startTime: 25, endTime: 31,
        en: "And I think that's something that I want to fight against.",
        zh: '我觉得这是我想要对抗的事情。',
        highlights: ['fight against']
      },
      {
        id: 7, startTime: 31, endTime: 38,
        en: 'I want to show young girls that you can be confident, you can be strong.',
        zh: '我想向年轻女孩们展示，你可以自信，你可以坚强。',
        highlights: ['confident', 'strong']
      },
      {
        id: 8, startTime: 38, endTime: 45,
        en: "And it doesn't matter what anyone else thinks as long as you believe in yourself.",
        zh: '只要你相信自己，别人怎么想并不重要。',
        highlights: ['believe in']
      }
    ]
  },
  {
    id: 'v002',
    title: 'Elon Musk on Innovation',
    episode: 85,
    speaker: 'Elon Musk',
    category: 'Tech Talk',
    thumbnail: '',
    videoUrl: '/videos/elon-musk-innovation.mp4',
    videoSource: 'local',
    duration: '3:12',
    subtitles: [
      {
        id: 1, startTime: 0, endTime: 6,
        en: "When something is important enough, you do it even if the odds are not in your favor.",
        zh: '当一件事足够重要时，即使胜算不大，你也要去做。',
        highlights: ['odds', 'in your favor']
      },
      {
        id: 2, startTime: 6, endTime: 12,
        en: "I think it's very important to have a feedback loop.",
        zh: '我认为有一个反馈循环非常重要。',
        highlights: ['feedback loop']
      },
      {
        id: 3, startTime: 12, endTime: 18,
        en: "where you're constantly thinking about what you've done and how you could be doing it better.",
        zh: '在这个循环中，你不断思考自己做了什么，以及如何做得更好。',
        highlights: ['constantly']
      },
      {
        id: 4, startTime: 18, endTime: 25,
        en: "I think that's the single best piece of advice: constantly think about how you could be doing things better.",
        zh: '我认为这是最好的建议：不断思考如何把事情做得更好。',
        highlights: ['piece of advice']
      },
      {
        id: 5, startTime: 25, endTime: 32,
        en: "And question yourself. People often assume that technology just automatically gets better every year.",
        zh: '并且质疑自己。人们通常认为技术每年都会自动进步。',
        highlights: ['assume', 'automatically']
      },
      {
        id: 6, startTime: 32, endTime: 38,
        en: "But it actually doesn't. It only gets better if smart people work like crazy to make it better.",
        zh: '但实际上并不是。技术只有在聪明人拼命工作的情况下才会进步。',
        highlights: ['work like crazy']
      },
      {
        id: 7, startTime: 38, endTime: 45,
        en: "Persistence is very important. You should not give up unless you are forced to give up.",
        zh: '坚持非常重要。除非你被迫放弃，否则你不应该放弃。',
        highlights: ['persistence', 'give up', 'forced']
      }
    ]
  },
  {
    id: 'v003',
    title: 'Emma Watson on Education',
    episode: 201,
    speaker: 'Emma Watson',
    category: 'Speech',
    thumbnail: '',
    videoUrl: '/videos/emma-watson-education.mp4',
    videoSource: 'local',
    duration: '2:50',
    subtitles: [
      {
        id: 1, startTime: 0, endTime: 7,
        en: "I decided I was a feminist and this seemed uncomplicated to me.",
        zh: '我认定自己是一个女权主义者，这对我来说似乎很简单。',
        highlights: ['feminist', 'uncomplicated']
      },
      {
        id: 2, startTime: 7, endTime: 14,
        en: "But my recent research has shown me that feminism has become an unpopular word.",
        zh: '但我最近的研究表明，女权主义已经成为一个不受欢迎的词。',
        highlights: ['research', 'unpopular']
      },
      {
        id: 3, startTime: 14, endTime: 21,
        en: "Apparently I am among the ranks of women whose expressions are seen as too strong, too aggressive.",
        zh: '显然，我被归入那些言辞被认为过于强硬、过于激进的女性行列。',
        highlights: ['apparently', 'ranks', 'aggressive']
      },
      {
        id: 4, startTime: 21, endTime: 28,
        en: "I think it is right that I should be able to make decisions about my own body.",
        zh: '我认为我应该有权对自己的身体做出决定，这是正确的。',
        highlights: ['decisions']
      },
      {
        id: 5, startTime: 28, endTime: 35,
        en: "I think it is right that women be involved on my behalf in the policies that will affect my life.",
        zh: '我认为女性代表我参与制定将影响我生活的政策，这是正确的。',
        highlights: ['involved', 'on my behalf', 'policies', 'affect']
      },
      {
        id: 6, startTime: 35, endTime: 42,
        en: "I think it is right that socially I am afforded the same respect as men.",
        zh: '我认为在社会上我应该获得与男性同等的尊重，这是正确的。',
        highlights: ['socially', 'afforded', 'respect']
      }
    ]
  },
  {
    id: 'v004',
    title: 'Obama on Dreams and Hard Work',
    episode: 56,
    speaker: 'Barack Obama',
    category: 'Speech',
    thumbnail: '',
    videoUrl: '/videos/obama-dreams.mp4',
    videoSource: 'local',
    duration: '3:20',
    subtitles: [
      {
        id: 1, startTime: 0, endTime: 6,
        en: "If you're walking down the right path and you're willing to keep walking, eventually you'll make progress.",
        zh: '如果你走在正确的道路上，并且愿意继续走下去，最终你会取得进步。',
        highlights: ['path', 'willing', 'progress']
      },
      {
        id: 2, startTime: 6, endTime: 12,
        en: "Making your mark on the world is hard. If it were easy, everybody would do it.",
        zh: '在世界上留下你的印记是困难的。如果很容易，每个人都会去做。',
        highlights: ['mark', 'hard']
      },
      {
        id: 3, startTime: 12, endTime: 18,
        en: "But it's not. It takes patience, it takes commitment, and it comes with plenty of failure along the way.",
        zh: '但事实并非如此。它需要耐心，需要承诺，一路上还伴随着大量的失败。',
        highlights: ['patience', 'commitment', 'failure']
      },
      {
        id: 4, startTime: 18, endTime: 25,
        en: "The real test is not whether you avoid this failure, because you won't.",
        zh: '真正的考验不是你是否能避免失败，因为你无法避免。',
        highlights: ['avoid', 'failure']
      },
      {
        id: 5, startTime: 25, endTime: 32,
        en: "It's whether you let it harden or shame you into inaction, or whether you learn from it.",
        zh: '而是你是否让它使你变得冷硬或羞愧而不作为，还是从中学习。',
        highlights: ['harden', 'shame', 'inaction']
      },
      {
        id: 6, startTime: 32, endTime: 40,
        en: "Whether you choose to persevere. That's what separates the successful from the rest.",
        zh: '你是否选择坚持。这就是成功者与其他人的区别。',
        highlights: ['persevere', 'separates', 'successful']
      }
    ]
  },
  {
    id: 'v005',
    title: 'Steve Jobs on Staying Hungry',
    episode: 42,
    speaker: 'Steve Jobs',
    category: 'Speech',
    thumbnail: '',
    videoUrl: '/videos/steve-jobs-hungry.mp4',
    videoSource: 'local',
    duration: '4:05',
    subtitles: [
      {
        id: 1, startTime: 0, endTime: 7,
        en: "Your time is limited, so don't waste it living someone else's life.",
        zh: '你的时间有限，所以不要浪费时间去过别人的生活。',
        highlights: ['limited', 'waste']
      },
      {
        id: 2, startTime: 7, endTime: 14,
        en: "Don't be trapped by dogma — which is living with the results of other people's thinking.",
        zh: '不要被教条所束缚——那是按照别人的思维方式去生活。',
        highlights: ['trapped', 'dogma', 'results']
      },
      {
        id: 3, startTime: 14, endTime: 21,
        en: "Don't let the noise of others' opinions drown out your own inner voice.",
        zh: '不要让别人的意见淹没了你内心的声音。',
        highlights: ['noise', 'opinions', 'drown out', 'inner voice']
      },
      {
        id: 4, startTime: 21, endTime: 28,
        en: "And most important, have the courage to follow your heart and intuition.",
        zh: '最重要的是，要有勇气追随你的内心和直觉。',
        highlights: ['courage', 'intuition']
      },
      {
        id: 5, startTime: 28, endTime: 35,
        en: "They somehow already know what you truly want to become.",
        zh: '它们不知怎的已经知道你真正想成为什么。',
        highlights: ['somehow', 'truly']
      },
      {
        id: 6, startTime: 35, endTime: 42,
        en: "Everything else is secondary. Stay hungry, stay foolish.",
        zh: '其他一切都是次要的。求知若饥，虚心若愚。',
        highlights: ['secondary', 'stay hungry', 'stay foolish']
      }
    ]
  },
  {
    id: 'v006',
    title: 'Taylor Swift on Songwriting',
    episode: 167,
    speaker: 'Taylor Swift',
    category: 'Interview',
    thumbnail: '',
    videoUrl: '/videos/taylor-swift-songwriting.mp4',
    videoSource: 'local',
    duration: '2:45',
    subtitles: [
      {
        id: 1, startTime: 0, endTime: 6,
        en: "I think the thing about songwriting is that it's incredibly vulnerable.",
        zh: '我认为写歌的关键在于它是非常脆弱的。',
        highlights: ['songwriting', 'incredibly', 'vulnerable']
      },
      {
        id: 2, startTime: 6, endTime: 12,
        en: "You're putting your emotions out there for everyone to see and judge.",
        zh: '你把你的情感展露给所有人去看和评判。',
        highlights: ['emotions', 'judge']
      },
      {
        id: 3, startTime: 12, endTime: 18,
        en: "And that's terrifying, but it's also the most rewarding thing when someone connects with it.",
        zh: '这很可怕，但当有人与之产生共鸣时，这也是最有价值的事情。',
        highlights: ['terrifying', 'rewarding', 'connects']
      },
      {
        id: 4, startTime: 18, endTime: 24,
        en: "I write my best songs when I stop trying to be clever and just be honest.",
        zh: '当我不再试图耍聪明，而只是真诚的时候，我写出了最好的歌曲。',
        highlights: ['clever', 'honest']
      },
      {
        id: 5, startTime: 24, endTime: 30,
        en: "Authenticity resonates more than perfection ever could.",
        zh: '真实比完美更能引起共鸣。',
        highlights: ['authenticity', 'resonates', 'perfection']
      },
      {
        id: 6, startTime: 30, endTime: 36,
        en: "Every song is a snapshot of a feeling. I just try to capture it as truthfully as I can.",
        zh: '每首歌都是一种感觉的快照。我只是尽可能真实地捕捉它。',
        highlights: ['snapshot', 'capture', 'truthfully']
      }
    ]
  },
  {
    id: 'v007',
    title: 'Bill Gates on Climate Change',
    episode: 98,
    speaker: 'Bill Gates',
    category: 'Tech Talk',
    thumbnail: '',
    videoUrl: '/videos/bill-gates-climate.mp4',
    videoSource: 'local',
    duration: '3:30',
    subtitles: [
      {
        id: 1, startTime: 0, endTime: 7,
        en: "Climate change is a really big problem and we need to get to zero emissions.",
        zh: '气候变化是一个非常大的问题，我们需要实现零排放。',
        highlights: ['climate change', 'emissions']
      },
      {
        id: 2, startTime: 7, endTime: 14,
        en: "The key question is, can we innovate our way out of this challenge?",
        zh: '关键问题是，我们能否通过创新来应对这一挑战？',
        highlights: ['innovate', 'challenge']
      },
      {
        id: 3, startTime: 14, endTime: 21,
        en: "I believe we can. But it requires unprecedented collaboration between governments, companies, and individuals.",
        zh: '我相信我们可以。但这需要政府、公司和个人之间前所未有的合作。',
        highlights: ['unprecedented', 'collaboration', 'individuals']
      },
      {
        id: 4, startTime: 21, endTime: 28,
        en: "We need breakthroughs in energy storage, in clean manufacturing, in agriculture.",
        zh: '我们需要在能源储存、清洁制造和农业方面取得突破。',
        highlights: ['breakthroughs', 'energy storage', 'manufacturing', 'agriculture']
      },
      {
        id: 5, startTime: 28, endTime: 35,
        en: "The good news is that young people are incredibly passionate about this issue.",
        zh: '好消息是年轻人对这个问题非常有热情。',
        highlights: ['passionate', 'issue']
      },
      {
        id: 6, startTime: 35, endTime: 42,
        en: "And that gives me enormous optimism about the future.",
        zh: '这让我对未来充满巨大的乐观情绪。',
        highlights: ['enormous', 'optimism']
      }
    ]
  },
  {
    id: 'v008',
    title: 'Oprah on Finding Your Purpose',
    episode: 210,
    speaker: 'Oprah Winfrey',
    category: 'Speech',
    thumbnail: '',
    videoUrl: '/videos/oprah-purpose.mp4',
    videoSource: 'local',
    duration: '3:15',
    subtitles: [
      {
        id: 1, startTime: 0, endTime: 7,
        en: "The key to realizing a dream is to focus not on success but significance.",
        zh: '实现梦想的关键不是关注成功，而是关注意义。',
        highlights: ['realizing', 'significance']
      },
      {
        id: 2, startTime: 7, endTime: 14,
        en: "And then even the small steps and little victories along your path will take on greater meaning.",
        zh: '这样，即使是你道路上的小步骤和小胜利也会具有更大的意义。',
        highlights: ['victories', 'path', 'meaning']
      },
      {
        id: 3, startTime: 14, endTime: 21,
        en: "Everybody has a calling. And your real job in life is to figure out as soon as possible what that is.",
        zh: '每个人都有使命。你一生中真正的工作就是尽快弄清楚那是什么。',
        highlights: ['calling', 'figure out']
      },
      {
        id: 4, startTime: 21, endTime: 28,
        en: "The biggest adventure you can take is to live the life of your dreams.",
        zh: '你能经历的最大冒险就是过上你梦想的生活。',
        highlights: ['adventure', 'dreams']
      },
      {
        id: 5, startTime: 28, endTime: 35,
        en: "Turn your wounds into wisdom. Let your mistakes be your best teachers.",
        zh: '把你的伤痛变成智慧。让你的错误成为你最好的老师。',
        highlights: ['wounds', 'wisdom', 'mistakes', 'teachers']
      },
      {
        id: 6, startTime: 35, endTime: 42,
        en: "You become what you believe. Not what you wish or what you want, but what you truly believe.",
        zh: '你会成为你所相信的。不是你所希望或想要的，而是你真正相信的。',
        highlights: ['become', 'believe', 'truly']
      }
    ]
  },
  {
    id: 'v009',
    title: 'Malala on Education Rights',
    episode: 175,
    speaker: 'Malala Yousafzai',
    category: 'Speech',
    thumbnail: '',
    videoUrl: '/videos/malala-education.mp4',
    videoSource: 'local',
    duration: '2:55',
    subtitles: [
      {
        id: 1, startTime: 0, endTime: 7,
        en: "One child, one teacher, one book, one pen can change the world.",
        zh: '一个孩子、一位老师、一本书、一支笔就能改变世界。',
        highlights: ['change']
      },
      {
        id: 2, startTime: 7, endTime: 14,
        en: "Education is the most powerful weapon which you can use to change the world.",
        zh: '教育是你可以用来改变世界的最强大的武器。',
        highlights: ['powerful', 'weapon']
      },
      {
        id: 3, startTime: 14, endTime: 21,
        en: "We realize the importance of our voices only when we are silenced.",
        zh: '只有当我们被沉默时，我们才意识到自己声音的重要性。',
        highlights: ['realize', 'importance', 'silenced']
      },
      {
        id: 4, startTime: 21, endTime: 28,
        en: "Let us pick up our books and our pens. They are our most powerful weapons.",
        zh: '让我们拿起我们的书和笔。它们是我们最强大的武器。',
        highlights: ['pick up', 'weapons']
      },
      {
        id: 5, startTime: 28, endTime: 35,
        en: "I raise up my voice — not so I can shout, but so that those without a voice can be heard.",
        zh: '我提高我的声音——不是为了喊叫，而是为了让那些没有声音的人被听到。',
        highlights: ['raise up', 'shout', 'heard']
      },
      {
        id: 6, startTime: 35, endTime: 42,
        en: "When the whole world is silent, even one voice becomes powerful.",
        zh: '当整个世界都沉默时，即使一个声音也会变得强大。',
        highlights: ['silent', 'voice', 'powerful']
      }
    ]
  }
];

export const highlightDefinitions: Record<string, { en: string; zh: string; phonetic: string }> = {
  'doubt': { en: 'to feel uncertain or unsure', zh: '怀疑；不确定', phonetic: '/daʊt/' },
  'instilled': { en: 'gradually put (a feeling or idea) into someone\'s mind', zh: '灌输；逐渐培养', phonetic: '/ɪnˈstɪld/' },
  'self-doubt': { en: 'lack of confidence in oneself', zh: '自我怀疑', phonetic: '/ˌself ˈdaʊt/' },
  'external': { en: 'coming from outside', zh: '外部的；外来的', phonetic: '/ɪkˈstɜːrnl/' },
  'subtleties': { en: 'fine or delicate distinctions', zh: '微妙之处；细微差别', phonetic: '/ˈsʌtltiz/' },
  'micro': { en: 'extremely small', zh: '微小的；极小的', phonetic: '/ˈmaɪkroʊ/' },
  'over time': { en: 'gradually; as time passes', zh: '随着时间的推移', phonetic: '/ˌoʊvər ˈtaɪm/' },
  'participating': { en: 'taking part in something', zh: '参与；参加', phonetic: '/pɑːrˈtɪsɪpeɪtɪŋ/' },
  'declining': { en: 'becoming smaller or fewer', zh: '下降；减少', phonetic: '/dɪˈklaɪnɪŋ/' },
  'fight against': { en: 'to struggle to oppose', zh: '与……作斗争', phonetic: '/faɪt əˈɡenst/' },
  'confident': { en: 'feeling sure of yourself', zh: '自信的', phonetic: '/ˈkɒnfɪdənt/' },
  'strong': { en: 'having power and force', zh: '坚强的；强壮的', phonetic: '/strɒŋ/' },
  'believe in': { en: 'to have faith in', zh: '相信；信任', phonetic: '/bɪˈliːv ɪn/' },
  'odds': { en: 'the probability of something happening', zh: '几率；可能性', phonetic: '/ɒdz/' },
  'in your favor': { en: 'to your advantage', zh: '对你有利', phonetic: '/ɪn jɔːr ˈfeɪvər/' },
  'feedback loop': { en: 'a system where output becomes input', zh: '反馈循环', phonetic: '/ˈfiːdbæk luːp/' },
  'constantly': { en: 'all the time; always', zh: '不断地；始终', phonetic: '/ˈkɒnstəntli/' },
  'piece of advice': { en: 'a suggestion or recommendation', zh: '一条建议', phonetic: '/piːs əv ədˈvaɪs/' },
  'assume': { en: 'to accept as true without proof', zh: '假定；认为', phonetic: '/əˈsjuːm/' },
  'automatically': { en: 'by itself; without human help', zh: '自动地', phonetic: '/ˌɔːtəˈmætɪkli/' },
  'work like crazy': { en: 'to work extremely hard', zh: '拼命工作', phonetic: '/wɜːrk laɪk ˈkreɪzi/' },
  'persistence': { en: 'continuing despite difficulty', zh: '坚持；毅力', phonetic: '/pərˈsɪstəns/' },
  'give up': { en: 'to stop trying', zh: '放弃', phonetic: '/ɡɪv ʌp/' },
  'forced': { en: 'made to do something', zh: '被迫的', phonetic: '/fɔːrst/' },
  'feminist': { en: 'a person who supports gender equality', zh: '女权主义者', phonetic: '/ˈfemɪnɪst/' },
  'uncomplicated': { en: 'simple; not complex', zh: '简单的；不复杂的', phonetic: '/ʌnˈkɒmplɪkeɪtɪd/' },
  'research': { en: 'careful study of a subject', zh: '研究；调查', phonetic: '/rɪˈsɜːrtʃ/' },
  'unpopular': { en: 'not liked by many people', zh: '不受欢迎的', phonetic: '/ʌnˈpɒpjələr/' },
  'apparently': { en: 'as it seems; evidently', zh: '显然；据说', phonetic: '/əˈpærəntli/' },
  'ranks': { en: 'positions in a group or organization', zh: '行列；等级', phonetic: '/ræŋks/' },
  'aggressive': { en: 'behaving in a forceful way', zh: '激进的；好斗的', phonetic: '/əˈɡresɪv/' },
  'decisions': { en: 'choices made after consideration', zh: '决定；决策', phonetic: '/dɪˈsɪʒnz/' },
  'involved': { en: 'included; taking part', zh: '参与的；涉及的', phonetic: '/ɪnˈvɒlvd/' },
  'on my behalf': { en: 'representing me; for me', zh: '代表我', phonetic: '/ɒn maɪ bɪˈhɑːf/' },
  'policies': { en: 'plans or rules of an organization', zh: '政策', phonetic: '/ˈpɒləsiz/' },
  'affect': { en: 'to have an influence on', zh: '影响', phonetic: '/əˈfekt/' },
  'socially': { en: 'in relation to society', zh: '在社会上', phonetic: '/ˈsoʊʃəli/' },
  'afforded': { en: 'given; provided', zh: '给予；提供', phonetic: '/əˈfɔːrdɪd/' },
  'respect': { en: 'admiration for someone', zh: '尊重；敬意', phonetic: '/rɪˈspekt/' },
  'path': { en: 'a way or route', zh: '道路；路径', phonetic: '/pæθ/' },
  'willing': { en: 'ready and eager to do something', zh: '愿意的；乐意的', phonetic: '/ˈwɪlɪŋ/' },
  'progress': { en: 'forward movement toward a goal', zh: '进步；进展', phonetic: '/ˈprɒɡres/' },
  'mark': { en: 'a visible impression or trace', zh: '印记；痕迹', phonetic: '/mɑːrk/' },
  'hard': { en: 'requiring great effort; difficult', zh: '困难的；艰难的', phonetic: '/hɑːrd/' },
  'commitment': { en: 'dedication to a cause or activity', zh: '承诺；投入', phonetic: '/kəˈmɪtmənt/' },
  'failure': { en: 'lack of success', zh: '失败', phonetic: '/ˈfeɪljər/' },
  'avoid': { en: 'to keep away from', zh: '避免；躲避', phonetic: '/əˈvɔɪd/' },
  'harden': { en: 'to become or make hard', zh: '变硬；使坚硬', phonetic: '/ˈhɑːrdn/' },
  'shame': { en: 'a feeling of disgrace', zh: '羞耻；耻辱', phonetic: '/ʃeɪm/' },
  'inaction': { en: 'lack of action or activity', zh: '不作为；无行动', phonetic: '/ɪnˈækʃn/' },
  'persevere': { en: 'to continue despite difficulty', zh: '坚持不懈', phonetic: '/ˌpɜːrsɪˈvɪr/' },
  'separates': { en: 'divides or distinguishes', zh: '分开；区分', phonetic: '/ˈsepəreɪts/' },
  'successful': { en: 'achieving desired results', zh: '成功的', phonetic: '/səkˈsesfl/' },
  'limited': { en: 'restricted in size or amount', zh: '有限的', phonetic: '/ˈlɪmɪtɪd/' },
  'waste': { en: 'to use carelessly or to no purpose', zh: '浪费', phonetic: '/weɪst/' },
  'trapped': { en: 'caught and unable to escape', zh: '被困住的', phonetic: '/træpt/' },
  'dogma': { en: 'a set of beliefs held by a group', zh: '教条；信条', phonetic: '/ˈdɒɡmə/' },
  'noise': { en: 'unwanted sound or interference', zh: '噪音；干扰', phonetic: '/nɔɪz/' },
  'drown out': { en: 'to make inaudible by being louder', zh: '淹没（声音）', phonetic: '/draʊn aʊt/' },
  'inner voice': { en: 'one\'s personal intuition', zh: '内心的声音', phonetic: '/ˈɪnər vɔɪs/' },
  'courage': { en: 'the ability to face danger or difficulty', zh: '勇气', phonetic: '/ˈkɜːrɪdʒ/' },
  'intuition': { en: 'instinctive understanding', zh: '直觉', phonetic: '/ˌɪntjuˈɪʃn/' },
  'somehow': { en: 'in a way that is not known', zh: '不知怎地', phonetic: '/ˈsʌmhaʊ/' },
  'truly': { en: 'in a truthful or sincere way', zh: '真正地', phonetic: '/ˈtruːli/' },
  'secondary': { en: 'less important; of second rank', zh: '次要的', phonetic: '/ˈsekənderi/' },
  'stay hungry': { en: 'keep wanting to learn and achieve more', zh: '求知若饥', phonetic: '/steɪ ˈhʌŋɡri/' },
  'stay foolish': { en: 'remain open-minded and humble', zh: '虚心若愚', phonetic: '/steɪ ˈfuːlɪʃ/' },
  'songwriting': { en: 'the activity of composing songs', zh: '歌曲创作', phonetic: '/ˈsɒŋraɪtɪŋ/' },
  'incredibly': { en: 'to a great degree; extremely', zh: '极其；难以置信地', phonetic: '/ɪnˈkredəbli/' },
  'vulnerable': { en: 'exposed to being hurt emotionally', zh: '脆弱的；易受伤的', phonetic: '/ˈvʌlnərəbl/' },
  'emotions': { en: 'strong feelings such as joy or sadness', zh: '情感；情绪', phonetic: '/ɪˈmoʊʃnz/' },
  'judge': { en: 'to form an opinion about', zh: '评判；判断', phonetic: '/dʒʌdʒ/' },
  'terrifying': { en: 'causing extreme fear', zh: '令人恐惧的', phonetic: '/ˈterɪfaɪɪŋ/' },
  'rewarding': { en: 'providing satisfaction or gratification', zh: '有价值的；值得的', phonetic: '/rɪˈwɔːrdɪŋ/' },
  'connects': { en: 'establishes a link or relationship', zh: '连接；产生共鸣', phonetic: '/kəˈnekts/' },
  'clever': { en: 'quick to understand and learn', zh: '聪明的', phonetic: '/ˈklevər/' },
  'honest': { en: 'free of deceit; truthful', zh: '诚实的；真诚的', phonetic: '/ˈɒnɪst/' },
  'authenticity': { en: 'the quality of being genuine', zh: '真实性；真诚', phonetic: '/ˌɔːθenˈtɪsəti/' },
  'resonates': { en: 'evokes a feeling of shared emotion', zh: '引起共鸣', phonetic: '/ˈrezəneɪts/' },
  'perfection': { en: 'the state of being perfect', zh: '完美', phonetic: '/pərˈfekʃn/' },
  'snapshot': { en: 'a brief impression or summary', zh: '快照；瞬间记录', phonetic: '/ˈsnæpʃɒt/' },
  'capture': { en: 'to record or preserve accurately', zh: '捕捉；记录', phonetic: '/ˈkæptʃər/' },
  'truthfully': { en: 'in an honest and accurate way', zh: '真实地', phonetic: '/ˈtruːθfəli/' },
  'climate change': { en: 'long-term shift in global temperatures', zh: '气候变化', phonetic: '/ˈklaɪmət tʃeɪndʒ/' },
  'emissions': { en: 'substances released into the atmosphere', zh: '排放', phonetic: '/ɪˈmɪʃnz/' },
  'innovate': { en: 'to introduce new methods or ideas', zh: '创新', phonetic: '/ˈɪnəveɪt/' },
  'challenge': { en: 'a difficult task that tests ability', zh: '挑战', phonetic: '/ˈtʃælɪndʒ/' },
  'unprecedented': { en: 'never done or known before', zh: '前所未有的', phonetic: '/ʌnˈpresɪdentɪd/' },
  'collaboration': { en: 'working jointly with others', zh: '合作；协作', phonetic: '/kəˌlæbəˈreɪʃn/' },
  'individuals': { en: 'single human beings', zh: '个人', phonetic: '/ˌɪndɪˈvɪdʒuəlz/' },
  'breakthroughs': { en: 'important discoveries or achievements', zh: '突破', phonetic: '/ˈbreɪkθruːz/' },
  'energy storage': { en: 'capturing energy for later use', zh: '能源储存', phonetic: '/ˈenərdʒi ˈstɔːrɪdʒ/' },
  'manufacturing': { en: 'the production of goods', zh: '制造业', phonetic: '/ˌmænjuˈfæktʃərɪŋ/' },
  'agriculture': { en: 'the practice of farming', zh: '农业', phonetic: '/ˈæɡrɪkʌltʃər/' },
  'passionate': { en: 'having very strong feelings', zh: '热情的；充满激情的', phonetic: '/ˈpæʃənət/' },
  'issue': { en: 'an important topic or problem', zh: '问题；议题', phonetic: '/ˈɪʃuː/' },
  'enormous': { en: 'very large in size or quantity', zh: '巨大的', phonetic: '/ɪˈnɔːrməs/' },
  'optimism': { en: 'hopefulness about the future', zh: '乐观', phonetic: '/ˈɒptɪmɪzəm/' },
  'realizing': { en: 'becoming aware of; achieving', zh: '实现；意识到', phonetic: '/ˈriːəlaɪzɪŋ/' },
  'significance': { en: 'the quality of being important', zh: '意义；重要性', phonetic: '/sɪɡˈnɪfɪkəns/' },
  'victories': { en: 'acts of winning or succeeding', zh: '胜利', phonetic: '/ˈvɪktəriz/' },
  'meaning': { en: 'what is meant by something; purpose', zh: '意义；含义', phonetic: '/ˈmiːnɪŋ/' },
  'calling': { en: 'a strong urge toward a particular vocation', zh: '使命；天职', phonetic: '/ˈkɔːlɪŋ/' },
  'figure out': { en: 'to understand or solve', zh: '弄清楚；想出', phonetic: '/ˈfɪɡər aʊt/' },
  'adventure': { en: 'an exciting or daring experience', zh: '冒险', phonetic: '/ədˈventʃər/' },
  'dreams': { en: 'cherished aspirations or goals', zh: '梦想', phonetic: '/driːmz/' },
  'wounds': { en: 'injuries to feelings or body', zh: '伤痛；创伤', phonetic: '/wuːndz/' },
  'mistakes': { en: 'actions that are wrong or misguided', zh: '错误', phonetic: '/mɪˈsteɪks/' },
  'teachers': { en: 'those who instruct or guide', zh: '老师', phonetic: '/ˈtiːtʃərz/' },
  'become': { en: 'to begin to be', zh: '成为', phonetic: '/bɪˈkʌm/' },
  'change': { en: 'to make or become different', zh: '改变', phonetic: '/tʃeɪndʒ/' },
  'powerful': { en: 'having great power or influence', zh: '强大的', phonetic: '/ˈpaʊərfl/' },
  'weapon': { en: 'a thing used to cause harm', zh: '武器', phonetic: '/ˈwepən/' },
  'realize': { en: 'to become aware of something', zh: '意识到', phonetic: '/ˈriːəlaɪz/' },
  'importance': { en: 'the state of being important', zh: '重要性', phonetic: '/ɪmˈpɔːrtns/' },
  'silenced': { en: 'made to be quiet; suppressed', zh: '被沉默的', phonetic: '/ˈsaɪlənst/' },
  'pick up': { en: 'to lift or take something', zh: '拿起；捡起', phonetic: '/pɪk ʌp/' },
  'weapons': { en: 'tools used in fighting', zh: '武器', phonetic: '/ˈwepənz/' },
  'raise up': { en: 'to lift or elevate', zh: '举起；提高', phonetic: '/reɪz ʌp/' },
  'shout': { en: 'to say something very loudly', zh: '喊叫', phonetic: '/ʃaʊt/' },
  'heard': { en: 'perceived by the ear', zh: '被听到的', phonetic: '/hɜːrd/' },
  'silent': { en: 'making no sound; quiet', zh: '沉默的', phonetic: '/ˈsaɪlənt/' },
  'voice': { en: 'the sound produced in speech', zh: '声音', phonetic: '/vɔɪs/' },
};
