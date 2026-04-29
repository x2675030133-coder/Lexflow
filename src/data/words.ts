import type { Word } from './types';

const rawWords: Word[] = [
  {
    id: 'w001', word: 'abandon', phonetic: '/əˈbændən/',
    partOfSpeech: ['v.', 'n.'],
    definitions: [
      { en: 'to leave somebody/something that you are responsible for', zh: '抛弃；放弃；遗弃' },
      { en: 'to stop doing something, especially before it is finished', zh: '中止；放弃（想法或做法）' }
    ],
    examples: [
      { en: 'The baby was abandoned by its mother.', zh: '那个婴儿被母亲遗弃了' },
      { en: 'They had to abandon the match because of rain.', zh: '他们因为下雨不得不中止比赛' }
    ],
    imageQuery: 'abandoned building',
    etymology: 'a-(away) + bandon(控制)  放弃控制  抛弃',
    etymologyParts: [
      { part: 'a-', type: 'prefix', meaning: '离开 away' },
      { part: 'bandon', type: 'root', meaning: '控制 control' }
    ],
    collocations: [
      { en: 'abandon hope', zh: '放弃希望' },
      { en: 'abandon ship', zh: '弃船' },
      { en: 'completely abandon', zh: '彻底放弃' },
      { en: 'abandon a plan', zh: '放弃计划' }
    ],
    synonyms: ['desert', 'forsake', 'give up'],
    antonyms: ['keep', 'maintain', 'continue'],
    memoryTip: '谐音"一本蛋"——一本书上画了个蛋，被人抛弃'
  },
  {
    id: 'w002', word: 'ability', phonetic: '/əˈbɪləti/',
    partOfSpeech: ['n.'],
    definitions: [
      { en: 'the fact that somebody/something is able to do something', zh: '能力；才' },
      { en: 'a level of skill or intelligence', zh: '才智；本' }
    ],
    examples: [
      { en: 'She has the ability to solve complex problems.', zh: '她有解决复杂问题的能力' },
      { en: 'Students of mixed abilities need different approaches.', zh: '能力参差不齐的学生需要不同的教学方法' }
    ],
    imageQuery: 'superhero power strength',
    etymology: 'abil(able 能够) + ity(名词后缀)  能力',
    etymologyParts: [
      { part: 'abil', type: 'root', meaning: '能够 able' },
      { part: '-ity', type: 'suffix', meaning: '名词后缀' }
    ],
    collocations: [
      { en: 'ability to do', zh: '做……的能力' },
      { en: 'natural ability', zh: '天赋' },
      { en: 'demonstrate ability', zh: '展示能力' }
    ],
    synonyms: ['capability', 'capacity', 'talent'],
    antonyms: ['inability', 'incapacity'],
    memoryTip: 'able(能够) + ity  能够做到  能力'
  },
  {
    id: 'w003', word: 'absorb', phonetic: '/əbˈzɔːrb/',
    partOfSpeech: ['v.'],
    definitions: [
      { en: 'to take in a liquid, gas, or other substance', zh: '吸收（液体、气体等' },
      { en: 'to interest somebody very much', zh: '吸引（注意力）；使全神贯' }
    ],
    examples: [
      { en: 'The sponge absorbed all the water.', zh: '海绵吸收了所有的水' },
      { en: 'She was completely absorbed in her book.', zh: '她完全沉浸在她的书中' }
    ],
    imageQuery: 'sponge absorbing water',
    etymology: 'ab-(加强) + sorb(   吸收',
    etymologyParts: [
      { part: 'ab-', type: 'prefix', meaning: '加强' },
      { part: 'sorb', type: 'root', meaning: ' suck' }
    ],
    collocations: [
      { en: 'absorb knowledge', zh: '吸收知识' },
      { en: 'fully absorbed', zh: '全神贯注' },
      { en: 'absorb information', zh: '吸收信息' }
    ],
    synonyms: ['soak up', 'take in', 'engross'],
    antonyms: ['emit', 'release', 'repel'],
    memoryTip: '吸收(absorb)就像海绵一样，把知识都吸进'
  },
  {
    id: 'w004', word: 'adventure', phonetic: '/ədˈventʃər/',
    partOfSpeech: ['n.', 'v.'],
    definitions: [
      { en: 'an unusual, exciting or dangerous experience, journey or activity', zh: '冒险；冒险经历；奇遇' },
      { en: 'excitement and willingness to take risks', zh: '冒险精神' }
    ],
    examples: [
      { en: 'The trip to Africa was a great adventure.', zh: '非洲之行是一次了不起的冒险' },
      { en: 'She was always looking for adventure.', zh: '她总是在寻找冒险' }
    ],
    imageQuery: 'adventure exploration mountain',
    etymology: 'ad-(去往) + vent(  + ure  去到来到  冒险',
    etymologyParts: [
      { part: 'ad-', type: 'prefix', meaning: '去往 toward' },
      { part: 'vent', type: 'root', meaning: ' come' },
      { part: '-ure', type: 'suffix', meaning: '名词后缀' }
    ],
    collocations: [
      { en: 'adventure story', zh: '冒险故事' },
      { en: 'go on an adventure', zh: '去冒' },
      { en: 'adventure tourism', zh: '探险旅游' }
    ],
    synonyms: ['expedition', 'quest', 'journey'],
    antonyms: ['boredom', 'routine'],
    memoryTip: '想象自己 ad)冒险(venture)的场'
  },
  {
    id: 'w005', word: 'beautiful', phonetic: '/ˈbjuːtɪfl/',
    partOfSpeech: ['adj.'],
    definitions: [
      { en: 'having beauty; pleasing to the senses or to the mind', zh: '美丽的；美好' },
      { en: 'very good or skillful', zh: '出色的；极好' }
    ],
    examples: [
      { en: 'What a beautiful sunset!', zh: '多美的日落啊' },
      { en: 'That was a beautiful goal.', zh: '那是个漂亮的进球' }
    ],
    imageQuery: 'beautiful sunset landscape',
    etymology: 'beauty(  + ful(充满   充满美的  美丽',
    etymologyParts: [
      { part: 'beauti', type: 'root', meaning: ' beauty' },
      { part: '-ful', type: 'suffix', meaning: '充满 full of' }
    ],
    collocations: [
      { en: 'beautiful scenery', zh: '美丽的风' },
      { en: 'absolutely beautiful', zh: '绝对美丽' },
      { en: 'beautiful weather', zh: '好天' }
    ],
    synonyms: ['gorgeous', 'stunning', 'attractive'],
    antonyms: ['ugly', 'hideous', 'unattractive'],
    memoryTip: 'beauty(美丽) + ful(充满) = 充满美丽'
  },
  {
    id: 'w006', word: 'challenge', phonetic: '/ˈtʃælɪndʒ/',
    partOfSpeech: ['n.', 'v.'],
    definitions: [
      { en: 'a new or difficult task that tests ability and skill', zh: '挑战；艰巨的任务' },
      { en: 'to question whether something is true or legal', zh: '质疑；质' }
    ],
    examples: [
      { en: 'Finding a solution to this problem is a real challenge.', zh: '找到这个问题的解决方案是一个真正的挑战' },
      { en: 'She challenged the decision in court.', zh: '她在法庭上质疑了这一决定' }
    ],
    imageQuery: 'challenge competition climbing',
    etymology: 'challenge 源自拉丁 calumnia(诽谤)  挑战',
    synonyms: ['dare', 'contest', 'test'],
    antonyms: ['ease', 'simplicity'],
    memoryTip: ' cha) l) leng) ge)  查了零几个挑'
  },
  {
    id: 'w007', word: 'determine', phonetic: '/dɪˈtɜːrmɪn/',
    partOfSpeech: ['v.'],
    definitions: [
      { en: 'to discover the facts about something', zh: '确定；查明；测定' },
      { en: 'to make something happen in a particular way', zh: '决定；影' }
    ],
    examples: [
      { en: 'An investigation was carried out to determine the cause.', zh: '进行了调查以确定原因' },
      { en: 'Hard work will determine your success.', zh: '努力工作将决定你的成功' }
    ],
    imageQuery: 'determination focus decision',
    etymology: 'de-(完全) + termin(界限) + e  完全定界  决定',
    etymologyParts: [
      { part: 'de-', type: 'prefix', meaning: '完全 completely' },
      { part: 'termin', type: 'root', meaning: '界限 boundary' }
    ],
    collocations: [
      { en: 'determine the cause', zh: '确定原因' },
      { en: 'determine the outcome', zh: '决定结果' },
      { en: 'be determined to', zh: '决心' }
    ],
    synonyms: ['decide', 'resolve', 'establish'],
    antonyms: ['hesitate', 'waver'],
    memoryTip: 'de(  + term(学期) + ine  这个学期的目标已经确定了'
  },
  {
    id: 'w008', word: 'environment', phonetic: '/ɪnˈvaɪrənmənt/',
    partOfSpeech: ['n.'],
    definitions: [
      { en: 'the natural world in which people, animals and plants live', zh: '自然环境；生态环' },
      { en: 'the conditions that affect the behavior of somebody/something', zh: '环境；客观环' }
    ],
    examples: [
      { en: 'We must protect the environment.', zh: '我们必须保护环境' },
      { en: 'A good working environment is essential.', zh: '良好的工作环境至关重要' }
    ],
    imageQuery: 'nature environment green forest',
    etymology: 'environ(包围) + ment(名词后缀)  周围的事  环境',
    etymologyParts: [
      { part: 'environ', type: 'root', meaning: '包围 surround' },
      { part: '-ment', type: 'suffix', meaning: '名词后缀' }
    ],
    collocations: [
      { en: 'protect the environment', zh: '保护环境' },
      { en: 'working environment', zh: '工作环境' },
      { en: 'natural environment', zh: '自然环境' }
    ],
    synonyms: ['surroundings', 'habitat', 'setting'],
    antonyms: [],
    memoryTip: ' environ) ment)  被环境所包围'
  },
  {
    id: 'w009', word: 'frequency', phonetic: '/ˈfriːkwənsi/',
    partOfSpeech: ['n.'],
    definitions: [
      { en: 'the rate at which something happens or is repeated', zh: '频率；频' },
      { en: 'the number of times that a wave is produced in a given period', zh: '（物理）频率' }
    ],
    examples: [
      { en: 'The frequency of his visits increased.', zh: '他来访的频率增加了' },
      { en: 'High-frequency sounds cannot be heard by humans.', zh: '人类听不到高频声音' }
    ],
    imageQuery: 'radio frequency wave',
    etymology: 'frequent(频繁  + cy(名词后缀)  频率',
    etymologyParts: [
      { part: 'frequent', type: 'root', meaning: '频繁 frequent' },
      { part: '-cy', type: 'suffix', meaning: '名词后缀' }
    ],
    collocations: [
      { en: 'high frequency', zh: '高频' },
      { en: 'low frequency', zh: '低频' },
      { en: 'frequency of use', zh: '使用频率' }
    ],
    synonyms: ['rate', 'occurrence', 'regularity'],
    antonyms: ['rarity', 'infrequency'],
    memoryTip: 'free(自由) + quency  自由出现的频'
  },
  {
    id: 'w010', word: 'generous', phonetic: '/ˈdʒenərəs/',
    partOfSpeech: ['adj.'],
    definitions: [
      { en: 'willing to give money, help, kindness more than is usual or expected', zh: '慷慨的；大方' },
      { en: 'more than is necessary; abundant', zh: '丰富的；充裕' }
    ],
    examples: [
      { en: 'She is very generous with her time.', zh: '她非常慷慨地付出自己的时间' },
      { en: 'He gave a generous donation to charity.', zh: '他向慈善机构慷慨捐款' }
    ],
    imageQuery: 'generous giving charity',
    etymology: 'gener(产生) + ous(形容词后缀)  不断产出  慷慨',
    etymologyParts: [
      { part: 'gener', type: 'root', meaning: '产生 produce' },
      { part: '-ous', type: 'suffix', meaning: '形容词后缀' }
    ],
    collocations: [
      { en: 'generous donation', zh: '慷慨捐赠' },
      { en: 'generous offer', zh: '慷慨的提' },
      { en: 'generous with', zh: '对……慷' }
    ],
    synonyms: ['liberal', 'charitable', 'benevolent'],
    antonyms: ['stingy', 'miserly', 'selfish'],
    memoryTip: '将军(gener)很大 ous)  慷慨'
  },
  {
    id: 'w011', word: 'hesitate', phonetic: '/ˈhezɪteɪt/',
    partOfSpeech: ['v.'],
    definitions: [
      { en: 'to be slow to speak or act because you feel uncertain or nervous', zh: '犹豫；迟疑；顾虑' },
      { en: 'to be unwilling to do something because you think it may be wrong', zh: '不愿意；有顾' }
    ],
    examples: [
      { en: "Don't hesitate to ask if you need help.", zh: '如果需要帮助，请不要犹豫' },
      { en: 'She hesitated before answering the question.', zh: '她在回答问题之前犹豫了一下' }
    ],
    imageQuery: 'hesitation crossroads thinking',
    etymology: 'hesit(黏住) + ate  黏住了不  犹豫',
    synonyms: ['pause', 'waver', 'falter'],
    antonyms: ['decide', 'resolve', 'act'],
    memoryTip: 'he(  + sit(  + ate(   他坐着吃饭时犹豫不'
  },
  {
    id: 'w012', word: 'imagine', phonetic: '/ɪˈmædʒɪn/',
    partOfSpeech: ['v.'],
    definitions: [
      { en: 'to form a picture in your mind of what something might be like', zh: '想象；设' },
      { en: 'to believe something that is not true', zh: '误以为；胡乱猜想' }
    ],
    examples: [
      { en: 'Imagine a world without war.', zh: '想象一个没有战争的世界' },
      { en: 'I can imagine how you feel.', zh: '我能想象你的感受' }
    ],
    imageQuery: 'imagination creative thinking',
    etymology: 'imag(形象) + ine  在脑中形成形  想象',
    synonyms: ['envision', 'visualize', 'picture'],
    antonyms: [],
    memoryTip: 'image(图像) + ine  在脑中产生图  想象'
  },
  {
    id: 'w013', word: 'knowledge', phonetic: '/ˈnɒlɪdʒ/',
    partOfSpeech: ['n.'],
    definitions: [
      { en: 'information, understanding and skills gained through education or experience', zh: '知识；学问；了解' },
      { en: 'awareness or familiarity gained by experience of a fact or situation', zh: '认识；知' }
    ],
    examples: [
      { en: 'She has a wide knowledge of history.', zh: '她有广博的历史知识' },
      { en: 'To my knowledge, he has never been late.', zh: '据我所知，他从未迟到过' }
    ],
    imageQuery: 'knowledge books library wisdom',
    etymology: 'know(知道) + ledge  知道的东  知识',
    synonyms: ['wisdom', 'learning', 'understanding'],
    antonyms: ['ignorance', 'stupidity'],
    memoryTip: 'know(知道) + ledge(架子)  知识放在架子'
  },
  {
    id: 'w014', word: 'magnificent', phonetic: '/mæɡˈnɪfɪsnt/',
    partOfSpeech: ['adj.'],
    definitions: [
      { en: 'extremely attractive and impressive', zh: '壮丽的；宏伟的；华丽' },
      { en: 'very good; excellent', zh: '极好的；出色' }
    ],
    examples: [
      { en: 'The view from the mountain was magnificent.', zh: '从山上看到的景色非常壮丽' },
      { en: 'She gave a magnificent performance.', zh: '她的表演精彩绝伦' }
    ],
    imageQuery: 'magnificent palace grand architecture',
    etymology: 'magn(  + ific(  + ent  做得很大  壮丽',
    synonyms: ['splendid', 'grand', 'majestic'],
    antonyms: ['modest', 'ordinary', 'plain'],
    memoryTip: 'magni(放大) + ficent  被放大的  壮丽'
  },
  {
    id: 'w015', word: 'necessary', phonetic: '/ˈnesəsəri/',
    partOfSpeech: ['adj.'],
    definitions: [
      { en: 'that is needed for a purpose or a reason', zh: '必要的；必需' },
      { en: 'that must exist or happen and cannot be avoided', zh: '不可避免' }
    ],
    examples: [
      { en: 'Is it really necessary to spend so much?', zh: '真的有必要花那么多钱吗？' },
      { en: 'A good diet is necessary for health.', zh: '均衡的饮食对健康是必要的' }
    ],
    imageQuery: 'essential needs water food',
    etymology: 'ne-(  + cess(让步) + ary  不可让步  必要',
    synonyms: ['essential', 'required', 'vital'],
    antonyms: ['unnecessary', 'optional', 'dispensable'],
    memoryTip: ' ne) ces) sary)必要的食'
  },
  {
    id: 'w016', word: 'opportunity', phonetic: '/ˌɒpərˈtjuːnəti/',
    partOfSpeech: ['n.'],
    definitions: [
      { en: 'a time when a particular situation makes it possible to do or achieve something', zh: '机会；时' },
      { en: 'a chance for employment or promotion', zh: '就业机会；晋升机' }
    ],
    examples: [
      { en: 'This is a golden opportunity for us.', zh: '这对我们来说是一个黄金机会' },
      { en: 'There are plenty of opportunities for promotion.', zh: '有很多晋升的机会' }
    ],
    imageQuery: 'opportunity door opening light',
    etymology: 'op-(朝向) + port(港口) + unity  朝向港口  机会来临',
    synonyms: ['chance', 'occasion', 'opening'],
    antonyms: ['misfortune', 'obstacle'],
    memoryTip: 'op(  + port(港口) + unity(统一)  哦！港口统一了，机会来了'
  },
  {
    id: 'w017', word: 'patience', phonetic: '/ˈpeɪʃns/',
    partOfSpeech: ['n.'],
    definitions: [
      { en: 'the ability to wait, or to continue doing something despite difficulties', zh: '耐心；忍耐力' },
      { en: 'the ability to accept delay, trouble, or suffering without getting angry', zh: '容忍；克' }
    ],
    examples: [
      { en: 'Learning a language requires patience.', zh: '学习一门语言需要耐心' },
      { en: 'She lost her patience with the naughty children.', zh: '她对那些淘气的孩子失去了耐心' }
    ],
    imageQuery: 'patience waiting calm meditation',
    etymology: 'pati(忍受) + ence(名词后缀)  忍受的能  耐心',
    synonyms: ['tolerance', 'endurance', 'perseverance'],
    antonyms: ['impatience', 'intolerance'],
    memoryTip: 'patient(病人)  病人需要耐心(patience)等待康复'
  },
  {
    id: 'w018', word: 'revolution', phonetic: '/ˌrevəˈluːʃn/',
    partOfSpeech: ['n.'],
    definitions: [
      { en: 'a great change in conditions, ways of working, beliefs', zh: '革命；巨' },
      { en: 'a complete circular movement around a point', zh: '旋转；公' }
    ],
    examples: [
      { en: 'The Industrial Revolution changed the world.', zh: '工业革命改变了世界' },
      { en: 'The Earth makes one revolution around the Sun each year.', zh: '地球每年绕太阳公转一周' }
    ],
    imageQuery: 'revolution change uprising',
    etymology: 're-(再次) + volut(  + ion  再次转变  革命',
    synonyms: ['rebellion', 'upheaval', 'transformation'],
    antonyms: ['stagnation', 'stability'],
    memoryTip: 're(  + volution(旋转)  世界再次旋转  革命'
  },
  {
    id: 'w019', word: 'significant', phonetic: '/sɪɡˈnɪfɪkənt/',
    partOfSpeech: ['adj.'],
    definitions: [
      { en: 'large or important enough to have an effect or to be noticed', zh: '重大的；显著的；有意义的' },
      { en: 'having a special or secret meaning', zh: '有特殊含义的' }
    ],
    examples: [
      { en: 'There has been a significant increase in sales.', zh: '销售额有了显著增长' },
      { en: 'She gave him a significant look.', zh: '她意味深长地看了他一眼' }
    ],
    imageQuery: 'significant important milestone',
    etymology: 'sign(标记) + ific(  + ant  做出标记  重要',
    synonyms: ['important', 'notable', 'meaningful'],
    antonyms: ['insignificant', 'minor', 'trivial'],
    memoryTip: 'sign(签名)  需要签名的文件一定是重要 significant)'
  },
  {
    id: 'w020', word: 'technology', phonetic: '/tekˈnɒlədʒi/',
    partOfSpeech: ['n.'],
    definitions: [
      { en: 'scientific knowledge used in practical ways in industry', zh: '技术；科技' },
      { en: 'machinery or equipment developed from scientific knowledge', zh: '技术设备；技术手' }
    ],
    examples: [
      { en: 'Modern technology has transformed our lives.', zh: '现代科技改变了我们的生活' },
      { en: 'The company invests heavily in new technology.', zh: '该公司大量投资于新技术' }
    ],
    imageQuery: 'technology innovation digital',
    etymology: 'techno(技  + logy(学科)  技艺的学科  技',
    synonyms: ['innovation', 'engineering', 'science'],
    antonyms: [],
    memoryTip: 'tech(技  + no + logy(   学习技  科技'
  },
  {
    id: 'w021', word: 'universal', phonetic: '/ˌjuːnɪˈvɜːrsl/',
    partOfSpeech: ['adj.'],
    definitions: [
      { en: 'done by or involving all the people in the world', zh: '全世界的；普遍的' },
      { en: 'true or right at all times and in all places', zh: '通用的；万能' }
    ],
    examples: [
      { en: 'Music is a universal language.', zh: '音乐是一种通用的语言' },
      { en: 'There is universal agreement on this issue.', zh: '在这个问题上大家意见一致' }
    ],
    imageQuery: 'universal globe world unity',
    etymology: 'uni-(一) + vers(  + al  转成一体的  普遍',
    synonyms: ['global', 'worldwide', 'general'],
    antonyms: ['local', 'particular', 'specific'],
    memoryTip: 'universe(宇宙)  宇宙级别  普遍 universal)'
  },
  {
    id: 'w022', word: 'volunteer', phonetic: '/ˌvɒlənˈtɪər/',
    partOfSpeech: ['n.', 'v.'],
    definitions: [
      { en: 'a person who does a job without being paid for it', zh: '志愿者；义务工作' },
      { en: 'to offer to do something without being forced to do it', zh: '自愿做；主动提供' }
    ],
    examples: [
      { en: 'She works as a volunteer at the hospital.', zh: '她在医院做志愿者' },
      { en: 'He volunteered to help clean up after the party.', zh: '他主动提出帮忙在聚会后清理' }
    ],
    imageQuery: 'volunteer helping community',
    etymology: 'volunt(自愿) + eer(   自愿的人  志愿',
    synonyms: ['helper', 'assistant', 'contributor'],
    antonyms: ['conscript', 'draftee'],
    memoryTip: 'volunt(自愿) + eer  自愿参与的人  志愿'
  },
  {
    id: 'w023', word: 'wisdom', phonetic: '/ˈwɪzdəm/',
    partOfSpeech: ['n.'],
    definitions: [
      { en: 'the ability to make sensible decisions and give good advice', zh: '智慧；才' },
      { en: 'the knowledge that a society or culture has gained over a long period of time', zh: '学问；知' }
    ],
    examples: [
      { en: 'She spoke with great wisdom.', zh: '她说话充满了智慧' },
      { en: 'The wisdom of the ancients still guides us today.', zh: '古人的智慧至今仍在指引我们' }
    ],
    imageQuery: 'wisdom owl ancient book',
    etymology: 'wis(知道) + dom(状   知道的状  智慧',
    synonyms: ['sagacity', 'insight', 'intelligence'],
    antonyms: ['foolishness', 'stupidity', 'ignorance'],
    memoryTip: 'wise(聪明  + dom(王国)  聪明的王  智慧'
  },
  {
    id: 'w024', word: 'extraordinary', phonetic: '/ɪkˈstrɔːrdnəri/',
    partOfSpeech: ['adj.'],
    definitions: [
      { en: 'very unusual, special, or surprising', zh: '非凡的；特别的；惊人' },
      { en: 'not normal or ordinary; greater or better than usual', zh: '不寻常的；非一般的' }
    ],
    examples: [
      { en: 'She has an extraordinary talent for music.', zh: '她有非凡的音乐才能' },
      { en: 'What an extraordinary coincidence!', zh: '多么不可思议的巧合！' }
    ],
    imageQuery: 'extraordinary amazing spectacular',
    etymology: 'extra-(超出) + ordinary(普通的)  超出普通的  非凡',
    etymologyParts: [
      { part: 'extra-', type: 'prefix', meaning: '超出 beyond' },
      { part: 'ordinary', type: 'root', meaning: '普通的 ordinary' }
    ],
    collocations: [
      { en: 'extraordinary talent', zh: '非凡的才' },
      { en: 'extraordinary achievement', zh: '非凡的成' },
      { en: 'truly extraordinary', zh: '真正非凡' }
    ],
    synonyms: ['remarkable', 'exceptional', 'phenomenal'],
    antonyms: ['ordinary', 'common', 'normal'],
    memoryTip: 'extra(额外  + ordinary(普通的)  超出普通的  非凡'
  },
  {
    id: 'w025', word: 'enthusiasm', phonetic: '/ɪnˈθjuːziæzəm/',
    partOfSpeech: ['n.'],
    definitions: [
      { en: 'a strong feeling of excitement and interest in something', zh: '热情；热忱；热心' },
      { en: 'something that arouses a strong feeling of interest', zh: '引起热情的事' }
    ],
    examples: [
      { en: 'She showed great enthusiasm for the project.', zh: '她对这个项目表现出了极大的热情' },
      { en: 'His enthusiasm is infectious.', zh: '他的热情是有感染力的' }
    ],
    imageQuery: 'enthusiasm excited happy energy',
    etymology: 'en-(在内) + thus(  + iasm  神在内心激  热情',
    etymologyParts: [
      { part: 'en-', type: 'prefix', meaning: '在内 within' },
      { part: 'thus', type: 'root', meaning: ' god' },
      { part: '-iasm', type: 'suffix', meaning: '状态后缀' }
    ],
    collocations: [
      { en: 'great enthusiasm', zh: '极大的热' },
      { en: 'show enthusiasm', zh: '表现出热' },
      { en: 'enthusiasm for', zh: '对……的热情' }
    ],
    synonyms: ['passion', 'eagerness', 'zeal'],
    antonyms: ['apathy', 'indifference', 'boredom'],
    memoryTip: 'en(进入) + thusi(  + asm  进入热的状  热情'
  },
  {
    id: 'w026', word: 'compromise', phonetic: '/ˈkɒmprəmaɪz/',
    partOfSpeech: ['n.', 'v.'],
    definitions: [
      { en: 'an agreement made between two sides in which each side gives up some demands', zh: '妥协；折中；和解' },
      { en: 'to weaken a position or reputation', zh: '损害；危' }
    ],
    examples: [
      { en: 'They reached a compromise after long negotiations.', zh: '经过长时间谈判，他们达成了妥协' },
      { en: 'This decision could compromise our safety.', zh: '这个决定可能会危及我们的安全' }
    ],
    imageQuery: 'compromise handshake agreement',
    etymology: 'com-(共同) + promise(承诺)  共同承诺  妥协',
    etymologyParts: [
      { part: 'com-', type: 'prefix', meaning: '共同 together' },
      { part: 'promise', type: 'root', meaning: '承诺 promise' }
    ],
    collocations: [
      { en: 'reach a compromise', zh: '达成妥协' },
      { en: 'willing to compromise', zh: '愿意妥协' },
      { en: 'compromise on', zh: '在……上妥协' }
    ],
    synonyms: ['settlement', 'agreement', 'concession'],
    antonyms: ['dispute', 'disagreement', 'conflict'],
    memoryTip: 'com(共同) + promise(承诺)  大家共同做出承诺  妥协'
  },
  {
    id: 'w027', word: 'demonstrate', phonetic: '/ˈdemənstreɪt/',
    partOfSpeech: ['v.'],
    definitions: [
      { en: 'to show something clearly by giving proof or evidence', zh: '证明；论证；展示' },
      { en: 'to show and explain how something works or is done', zh: '演示；示' }
    ],
    examples: [
      { en: 'The experiment demonstrates the principle of gravity.', zh: '这个实验证明了重力原理' },
      { en: 'Let me demonstrate how to use this tool.', zh: '让我来演示如何使用这个工具' }
    ],
    imageQuery: 'demonstration presentation showing',
    etymology: 'de-(加强) + monstr(展示) + ate  充分展示  证明',
    etymologyParts: [
      { part: 'de-', type: 'prefix', meaning: '加强 intensify' },
      { part: 'monstr', type: 'root', meaning: '展示 show' },
      { part: '-ate', type: 'suffix', meaning: '动词后缀' }
    ],
    collocations: [
      { en: 'demonstrate ability', zh: '展示能力' },
      { en: 'clearly demonstrate', zh: '清楚地证' },
      { en: 'demonstrate how', zh: '演示如何' }
    ],
    synonyms: ['show', 'prove', 'illustrate'],
    antonyms: ['hide', 'conceal', 'disprove'],
    memoryTip: 'demo(演示) + nstrate  做演  展示；证'
  },
  {
    id: 'w028', word: 'perspective', phonetic: '/pərˈspektɪv/',
    partOfSpeech: ['n.'],
    definitions: [
      { en: 'a particular attitude towards something; a way of thinking about something', zh: '观点；视角；看法' },
      { en: 'the ability to think about problems and decisions in a reasonable way', zh: '洞察力；判断' }
    ],
    examples: [
      { en: 'Try to see the problem from a different perspective.', zh: '试着从不同的角度看待这个问题' },
      { en: 'Travelling gives you a new perspective on life.', zh: '旅行给你一个看待生活的新视角' }
    ],
    imageQuery: 'perspective viewpoint vision angle',
    etymology: 'per-(通过) + spect(  + ive  通过观看  视角',
    etymologyParts: [
      { part: 'per-', type: 'prefix', meaning: '通过 through' },
      { part: 'spect', type: 'root', meaning: ' look' },
      { part: '-ive', type: 'suffix', meaning: '形容 名词后缀' }
    ],
    collocations: [
      { en: 'from a perspective', zh: '从某个角' },
      { en: 'gain perspective', zh: '获得视角' },
      { en: 'different perspective', zh: '不同的视' }
    ],
    synonyms: ['viewpoint', 'outlook', 'standpoint'],
    antonyms: [],
    memoryTip: 'per(通过) + spect(  + ive  通过看到  视角'
  },
  {
    id: 'w029', word: 'accomplish', phonetic: '/əˈkɒmplɪʃ/',
    partOfSpeech: ['v.'],
    definitions: [
      { en: 'to succeed in doing or completing something', zh: '完成；实现；达到' },
      { en: 'to achieve something', zh: '做成；办' }
    ],
    examples: [
      { en: 'She accomplished all her goals for the year.', zh: '她完成了今年所有的目标' },
      { en: 'What do you hope to accomplish by doing this?', zh: '你希望通过这样做达到什么目的？' }
    ],
    imageQuery: 'accomplish achievement success trophy',
    etymology: 'ac-(  + com-(完全) + plish(填满)  完全填满  完成',
    etymologyParts: [
      { part: 'ac-', type: 'prefix', meaning: ' to' },
      { part: 'com-', type: 'prefix', meaning: '完全 completely' },
      { part: 'plish', type: 'root', meaning: '填满 fill' }
    ],
    collocations: [
      { en: 'accomplish a goal', zh: '实现目标' },
      { en: 'accomplish a task', zh: '完成任务' },
      { en: 'accomplish nothing', zh: '一事无' }
    ],
    synonyms: ['achieve', 'complete', 'fulfill'],
    antonyms: ['fail', 'abandon', 'neglect'],
    memoryTip: 'a + com(完全) + plish(完成)  全部完成  实现'
  },
  {
    id: 'w030', word: 'phenomenon', phonetic: '/fɪˈnɒmɪnən/',
    partOfSpeech: ['n.'],
    definitions: [
      { en: 'a fact or an event in nature or society that can be observed', zh: '现象；事' },
      { en: 'a person or thing that is very successful or impressive', zh: '非凡的人（或事物' }
    ],
    examples: [
      { en: 'Globalization is a worldwide phenomenon.', zh: '全球化是一个世界性的现象' },
      { en: 'The band was a phenomenon in the 1990s.', zh: '这个乐队 0年代是一个奇迹' }
    ],
    imageQuery: 'phenomenon aurora nature wonder',
    etymology: 'pheno-(显示) + menon(事物)  显示出来的事  现象',
    synonyms: ['occurrence', 'event', 'marvel'],
    antonyms: [],
    memoryTip: 'phone(电话) + no + men(   电话里没有人是个奇怪现'
  },
  {
    id: 'w031', word: 'appreciate', phonetic: '/əˈpriːʃieɪt/',
    partOfSpeech: ['v.'],
    definitions: [
      { en: 'to recognize the good qualities of somebody/something', zh: '欣赏；赏' },
      { en: 'to be grateful for something', zh: '感激；感' }
    ],
    examples: [
      { en: 'I really appreciate your help.', zh: '我非常感谢你的帮助' },
      { en: 'You should appreciate the beauty of nature.', zh: '你应该欣赏大自然的美' }
    ],
    imageQuery: 'appreciate grateful thankful',
    etymology: 'ap-(  + preci(价  + ate  去认识价  欣赏',
    etymologyParts: [
      { part: 'ap-', type: 'prefix', meaning: ' toward' },
      { part: 'preci', type: 'root', meaning: '价 value' },
      { part: '-ate', type: 'suffix', meaning: '动词后缀' }
    ],
    collocations: [
      { en: 'deeply appreciate', zh: '深深感激' },
      { en: 'appreciate the beauty', zh: '欣赏' },
      { en: 'appreciate your help', zh: '感谢你的帮助' }
    ],
    synonyms: ['value', 'cherish', 'be grateful'],
    antonyms: ['depreciate', 'disregard', 'undervalue'],
    memoryTip: 'a + price(价格) + ate  给出价值评  欣赏'
  },
  {
    id: 'w032', word: 'brilliant', phonetic: '/ˈbrɪliənt/',
    partOfSpeech: ['adj.'],
    definitions: [
      { en: 'extremely clever or impressive', zh: '杰出的；才华横溢' },
      { en: 'very bright; shining intensely', zh: '明亮的；灿烂' }
    ],
    examples: [
      { en: 'She is a brilliant scientist.', zh: '她是一位杰出的科学家' },
      { en: 'The diamond sparkled with brilliant light.', zh: '钻石闪耀着灿烂的光芒' }
    ],
    imageQuery: 'brilliant light shining diamond',
    etymology: 'brill(闪耀) + iant  闪耀  杰出',
    synonyms: ['outstanding', 'exceptional', 'dazzling'],
    antonyms: ['dull', 'mediocre', 'dim'],
    memoryTip: '宝石(brill)闪耀(iant)  像宝石一样闪耀  杰出'
  },
  {
    id: 'w033', word: 'consequence', phonetic: '/ˈkɒnsɪkwəns/',
    partOfSpeech: ['n.'],
    definitions: [
      { en: 'a result or effect of an action or condition', zh: '结果；后' },
      { en: 'importance or relevance', zh: '重要性；重大' }
    ],
    examples: [
      { en: 'You must accept the consequences of your actions.', zh: '你必须承担你行为的后果' },
      { en: 'The matter is of no consequence.', zh: '这件事无关紧要' }
    ],
    imageQuery: 'consequence domino effect chain',
    etymology: 'con-(共同) + sequ(跟随) + ence  跟随而来  结果',
    etymologyParts: [
      { part: 'con-', type: 'prefix', meaning: '共同 together' },
      { part: 'sequ', type: 'root', meaning: '跟随 follow' },
      { part: '-ence', type: 'suffix', meaning: '名词后缀' }
    ],
    collocations: [
      { en: 'as a consequence', zh: '因此；结' },
      { en: 'face consequences', zh: '面对后果' },
      { en: 'serious consequences', zh: '严重后果' }
    ],
    synonyms: ['result', 'outcome', 'effect'],
    antonyms: ['cause', 'origin', 'source'],
    memoryTip: 'con + sequence(序列)  按序列发生的  后果'
  },
  {
    id: 'w034', word: 'efficient', phonetic: '/ɪˈfɪʃnt/',
    partOfSpeech: ['adj.'],
    definitions: [
      { en: 'doing something well and thoroughly with no waste of time, money, or energy', zh: '高效的；有效率的' },
      { en: 'working well with minimum effort or waste', zh: '效率高的；节约的' }
    ],
    examples: [
      { en: 'She is very efficient at her job.', zh: '她工作效率很高' },
      { en: 'This machine is more energy efficient.', zh: '这台机器更加节能' }
    ],
    imageQuery: 'efficient productivity organized',
    etymology: 'ef-(  + fic(  + ient  做出来的  有效率的',
    etymologyParts: [
      { part: 'ef-', type: 'prefix', meaning: ' out' },
      { part: 'fic', type: 'root', meaning: ' make' },
      { part: '-ient', type: 'suffix', meaning: '形容词后缀' }
    ],
    collocations: [
      { en: 'highly efficient', zh: '高效' },
      { en: 'energy efficient', zh: '节能' },
      { en: 'cost efficient', zh: '经济高效' }
    ],
    synonyms: ['productive', 'effective', 'competent'],
    antonyms: ['inefficient', 'wasteful', 'unproductive'],
    memoryTip: 'effect(效果) + ient  有效果的  高效'
  },
  {
    id: 'w035', word: 'influence', phonetic: '/ˈɪnfluəns/',
    partOfSpeech: ['n.', 'v.'],
    definitions: [
      { en: 'the effect that somebody/something has on the way a person thinks or behaves', zh: '影响；影响力' },
      { en: 'to have an effect on the way somebody thinks or behaves', zh: '影响；感' }
    ],
    examples: [
      { en: 'Parents have a huge influence on their children.', zh: '父母对孩子有巨大的影响' },
      { en: "Don't let others influence your decision.", zh: '不要让别人影响你的决定' }
    ],
    imageQuery: 'influence leadership impact',
    etymology: 'in-(进入) + flu(  + ence  流入内心  影响',
    etymologyParts: [
      { part: 'in-', type: 'prefix', meaning: '进入 into' },
      { part: 'flu', type: 'root', meaning: ' flow' },
      { part: '-ence', type: 'suffix', meaning: '名词后缀' }
    ],
    collocations: [
      { en: 'have influence on', zh: '对……有影响' },
      { en: 'under the influence', zh: '在影响下' },
      { en: 'strong influence', zh: '强烈影响' }
    ],
    synonyms: ['impact', 'effect', 'sway'],
    antonyms: [],
    memoryTip: 'in(进入) + flu(流感) + ence  像流感一样传播影'
  },
  {
    id: 'w036', word: 'gradually', phonetic: '/ˈɡrædʒuəli/',
    partOfSpeech: ['adv.'],
    definitions: [
      { en: 'slowly, over a long period of time', zh: '逐渐地；逐步' },
      { en: 'in a way that happens or develops slowly', zh: '渐进' }
    ],
    examples: [
      { en: 'The weather gradually improved.', zh: '天气逐渐好转' },
      { en: 'She gradually became more confident.', zh: '她逐渐变得更加自信' }
    ],
    imageQuery: 'gradual sunrise slow change',
    etymology: 'gradu(  + al + ly  一步一步地  逐渐',
    synonyms: ['slowly', 'steadily', 'progressively'],
    antonyms: ['suddenly', 'abruptly', 'immediately'],
    memoryTip: 'graduate(毕业)  像毕业一样逐渐(gradually)成长'
  },
  {
    id: 'w037', word: 'desperate', phonetic: '/ˈdespərət/',
    partOfSpeech: ['adj.'],
    definitions: [
      { en: 'feeling that you have no hope and are ready to do anything', zh: '绝望的；不顾一切的' },
      { en: 'very serious or extreme', zh: '极其严重的；极度' }
    ],
    examples: [
      { en: 'He was desperate to find a job.', zh: '他不顾一切地想找到一份工作' },
      { en: 'The situation is desperate.', zh: '形势非常严峻' }
    ],
    imageQuery: 'desperate hopeless struggle',
    etymology: 'de-(否定) + sper(希望) + ate  没有希望  绝望',
    etymologyParts: [
      { part: 'de-', type: 'prefix', meaning: '否定 not' },
      { part: 'sper', type: 'root', meaning: '希望 hope' },
      { part: '-ate', type: 'suffix', meaning: '形容词后缀' }
    ],
    collocations: [
      { en: 'desperate situation', zh: '绝望的处' },
      { en: 'desperate attempt', zh: '孤注一掷的尝试' },
      { en: 'desperate for', zh: '迫切需' }
    ],
    synonyms: ['hopeless', 'frantic', 'urgent'],
    antonyms: ['hopeful', 'calm', 'content'],
    memoryTip: 'de(去掉) + sper(希望) + ate  去掉希望  绝望'
  },
  {
    id: 'w038', word: 'inevitable', phonetic: '/ɪnˈevɪtəbl/',
    partOfSpeech: ['adj.'],
    definitions: [
      { en: 'that you cannot avoid or prevent', zh: '不可避免的；必然' },
      { en: 'so frequently experienced or seen that it is expected', zh: '照例必有的；惯常' }
    ],
    examples: [
      { en: 'Change is inevitable in a growing company.', zh: '变化在一个成长中的公司是不可避免的' },
      { en: 'The inevitable happened  it rained.', zh: '意料之中的事发生了——下雨了' }
    ],
    imageQuery: 'inevitable destiny fate',
    etymology: 'in-(  + evit(避免) + able  不能避免  不可避免',
    etymologyParts: [
      { part: 'in-', type: 'prefix', meaning: ' not' },
      { part: 'evit', type: 'root', meaning: '避免 avoid' },
      { part: '-able', type: 'suffix', meaning: '能……的' }
    ],
    collocations: [
      { en: 'inevitable result', zh: '必然结果' },
      { en: 'seem inevitable', zh: '似乎不可避免' },
      { en: 'virtually inevitable', zh: '几乎不可避免' }
    ],
    synonyms: ['unavoidable', 'inescapable', 'certain'],
    antonyms: ['avoidable', 'preventable', 'uncertain'],
    memoryTip: 'in(  + evit(exit，  + able  逃不掉的  不可避免'
  },
  {
    id: 'w039', word: 'sufficient', phonetic: '/səˈfɪʃnt/',
    partOfSpeech: ['adj.'],
    definitions: [
      { en: 'enough for a particular purpose; as much as you need', zh: '足够的；充足' }
    ],
    examples: [
      { en: 'Is $100 sufficient for the trip?', zh: '100美元够旅行用吗？' },
      { en: 'We have sufficient evidence to prove the case.', zh: '我们有足够的证据来证明这个案件' }
    ],
    imageQuery: 'sufficient enough full cup',
    etymology: 'suf-(  + fic(  + ient  在下面做好了  足够',
    synonyms: ['enough', 'adequate', 'ample'],
    antonyms: ['insufficient', 'inadequate', 'lacking'],
    memoryTip: 'su(  + fficient  苏先生觉得这些已经足够了'
  },
  {
    id: 'w040', word: 'vocabulary', phonetic: '/vəˈkæbjələri/',
    partOfSpeech: ['n.'],
    definitions: [
      { en: 'all the words that a person knows or uses', zh: '词汇；词汇量' },
      { en: 'a list of words with their meanings', zh: '词汇表；词典' }
    ],
    examples: [
      { en: 'Reading helps to expand your vocabulary.', zh: '阅读有助于扩大你的词汇量' },
      { en: 'She has a rich vocabulary.', zh: '她的词汇量很丰富' }
    ],
    imageQuery: 'vocabulary words dictionary reading',
    etymology: 'vocab(  + ulary  能叫出来  词汇',
    synonyms: ['lexicon', 'terminology', 'glossary'],
    antonyms: [],
    memoryTip: 'vocal(声音) + bury(   把声音埋进脑  记住词汇'
  },
  {
    id: 'w041', word: 'ambiguous', phonetic: '/æmˈbɪɡjuəs/',
    partOfSpeech: ['adj.'],
    definitions: [
      { en: 'open to more than one interpretation; not having one obvious meaning', zh: '模棱两可的；含糊不清' }
    ],
    examples: [
      { en: 'The question was ambiguous and confusing.', zh: '这个问题模棱两可，令人困惑' },
      { en: 'His reply was deliberately ambiguous.', zh: '他的回答故意含糊不清' }
    ],
    imageQuery: 'ambiguous optical illusion',
    etymology: 'ambi-(两边) + ig(驱动) + uous  被两边驱  模棱两可',
    synonyms: ['vague', 'unclear', 'equivocal'],
    antonyms: ['clear', 'definite', 'unambiguous'],
    memoryTip: 'ambi(两个) + guous  两个意思都  模棱两可'
  },
  {
    id: 'w042', word: 'authentic', phonetic: '/ɔːˈθentɪk/',
    partOfSpeech: ['adj.'],
    definitions: [
      { en: 'of undisputed origin; genuine', zh: '真正的；真实的；可信' },
      { en: 'based on facts; accurate', zh: '可靠的；准确' }
    ],
    examples: [
      { en: 'Is this an authentic painting by Picasso?', zh: '这是毕加索的真迹吗？' },
      { en: 'She gave an authentic account of what happened.', zh: '她真实地讲述了所发生的事情' }
    ],
    imageQuery: 'authentic genuine artifact',
    etymology: 'auth(自己) + entic  自己  真实',
    synonyms: ['genuine', 'real', 'original'],
    antonyms: ['fake', 'counterfeit', 'false'],
    memoryTip: 'author(作   作者亲手写  真实 authentic)'
  },
  {
    id: 'w043', word: 'beneficial', phonetic: '/ˌbenɪˈfɪʃl/',
    partOfSpeech: ['adj.'],
    definitions: [
      { en: 'resulting in good; favorable or advantageous', zh: '有益的；有利' }
    ],
    examples: [
      { en: 'Exercise is beneficial to your health.', zh: '锻炼有益于你的健康' },
      { en: 'The new policy will be beneficial for everyone.', zh: '新政策将对每个人都有益' }
    ],
    imageQuery: 'beneficial healthy lifestyle',
    etymology: 'bene-(  + fic(  + ial  做好事的  有益',
    etymologyParts: [
      { part: 'bene-', type: 'prefix', meaning: ' good' },
      { part: 'fic', type: 'root', meaning: ' make' },
      { part: '-ial', type: 'suffix', meaning: '形容词后缀' }
    ],
    collocations: [
      { en: 'beneficial effect', zh: '有益的效' },
      { en: 'mutually beneficial', zh: '互利' },
      { en: 'beneficial to health', zh: '有益健康' }
    ],
    synonyms: ['advantageous', 'helpful', 'favorable'],
    antonyms: ['harmful', 'detrimental', 'damaging'],
    memoryTip: 'bene(  + ficial  好的效果  有益'
  },
  {
    id: 'w044', word: 'catastrophe', phonetic: '/kəˈtæstrəfi/',
    partOfSpeech: ['n.'],
    definitions: [
      { en: 'an event causing great damage or suffering', zh: '灾难；灾祸；大祸' }
    ],
    examples: [
      { en: 'The oil spill was an environmental catastrophe.', zh: '石油泄漏是一场环境灾难' },
      { en: 'Losing the data was a catastrophe for the company.', zh: '丢失数据对公司来说是一场灾难' }
    ],
    imageQuery: 'catastrophe disaster destruction',
    etymology: 'cata-(向下) + strophe(   向下翻转  灾难',
    synonyms: ['disaster', 'calamity', 'tragedy'],
    antonyms: ['blessing', 'fortune', 'miracle'],
    memoryTip: 'cat(  + a + strophe  猫打翻了一  灾难'
  },
  {
    id: 'w045', word: 'diligent', phonetic: '/ˈdɪlɪdʒənt/',
    partOfSpeech: ['adj.'],
    definitions: [
      { en: 'having or showing care and effort in one\'s work or duties', zh: '勤奋的；刻苦' }
    ],
    examples: [
      { en: 'She is a diligent student who always completes her homework.', zh: '她是一个总是完成作业的勤奋学生' },
      { en: 'Diligent practice is the key to mastery.', zh: '勤奋练习是掌握技能的关键' }
    ],
    imageQuery: 'diligent student studying hard',
    etymology: 'di-(加强) + lig(选择) + ent  认真选择  勤奋',
    synonyms: ['industrious', 'hardworking', 'assiduous'],
    antonyms: ['lazy', 'idle', 'negligent'],
    memoryTip: 'dili(地里) + gent(   在地里干活的  勤奋'
  },
  {
    id: 'w046', word: 'elaborate', phonetic: '/ɪˈlæbərət/',
    partOfSpeech: ['adj.', 'v.'],
    definitions: [
      { en: 'involving many carefully arranged parts; detailed', zh: '精心制作的；详尽' },
      { en: 'to develop or present in further detail', zh: '详细阐述；详细说' }
    ],
    examples: [
      { en: 'She prepared an elaborate dinner for the guests.', zh: '她为客人准备了一顿精心制作的晚餐' },
      { en: 'Could you elaborate on that point?', zh: '你能详细说明那一点吗' }
    ],
    imageQuery: 'elaborate design detailed artwork',
    etymology: 'e-(  + labor(劳动) + ate  精心劳动做出  精心制作',
    synonyms: ['detailed', 'intricate', 'complex'],
    antonyms: ['simple', 'plain', 'basic'],
    memoryTip: 'e + labor(劳动) + ate  付出劳动精心  精心制作'
  },
  {
    id: 'w047', word: 'fundamental', phonetic: '/ˌfʌndəˈmentl/',
    partOfSpeech: ['adj.', 'n.'],
    definitions: [
      { en: 'forming a necessary base or core; of central importance', zh: '基本的；根本' },
      { en: 'a basic principle, rule, or law', zh: '基本原理；基础' }
    ],
    examples: [
      { en: 'There are fundamental differences between the two approaches.', zh: '两种方法之间存在根本性差异' },
      { en: 'Learning the fundamentals is essential.', zh: '学习基础知识至关重要' }
    ],
    imageQuery: 'fundamental foundation building blocks',
    etymology: 'fund(基底) + a + ment + al  基底  基本',
    synonyms: ['basic', 'essential', 'primary'],
    antonyms: ['secondary', 'minor', 'peripheral'],
    memoryTip: 'fund(基金) + amental  像基金一样是基本  基本'
  },
  {
    id: 'w048', word: 'guarantee', phonetic: '/ˌɡærənˈtiː/',
    partOfSpeech: ['n.', 'v.'],
    definitions: [
      { en: 'a formal promise or assurance that something will be done', zh: '保证；担保；保修' },
      { en: 'to provide a formal promise or assurance', zh: '保证；担' }
    ],
    examples: [
      { en: 'The product comes with a two-year guarantee.', zh: '该产品附带两年保修' },
      { en: 'I can guarantee that you will enjoy the show.', zh: '我保证你会喜欢这个节目' }
    ],
    imageQuery: 'guarantee promise badge',
    etymology: 'guarant(保护) + ee  保护  保证',
    synonyms: ['promise', 'assurance', 'warranty'],
    antonyms: [],
    memoryTip: ' gua) ran) tee)  挂上牌子保证质量'
  },
  {
    id: 'w049', word: 'hypothesis', phonetic: '/haɪˈpɒθəsɪs/',
    partOfSpeech: ['n.'],
    definitions: [
      { en: 'a proposed explanation made on limited evidence as a starting point', zh: '假说；假' }
    ],
    examples: [
      { en: 'The scientist tested her hypothesis through experiments.', zh: '科学家通过实验验证了她的假设' },
      { en: 'This is just a hypothesis, not a proven fact.', zh: '这只是一个假说，不是已证实的事实' }
    ],
    imageQuery: 'hypothesis scientific experiment',
    etymology: 'hypo-(下面) + thesis(论点)  放在下面的论  假说',
    synonyms: ['theory', 'assumption', 'proposition'],
    antonyms: ['fact', 'proof', 'certainty'],
    memoryTip: 'hypo(低于) + thesis(论文)  低于论文级别  假说'
  },
  {
    id: 'w050', word: 'implement', phonetic: '/ˈɪmplɪment/',
    partOfSpeech: ['v.', 'n.'],
    definitions: [
      { en: 'to put a plan or system into operation', zh: '实施；执行；落实' },
      { en: 'a tool or instrument for working', zh: '工具；器' }
    ],
    examples: [
      { en: 'The government plans to implement new policies.', zh: '政府计划实施新政策' },
      { en: 'Farm implements include plows and tractors.', zh: '农具包括犁和拖拉机' },
      { en: 'The school implemented a new attendance system.', zh: '学校实施了一套新的考勤制度。' }
    ],
    imageQuery: 'implement execute plan action',
    etymology: 'im-(进入) + ple(填满) + ment  填满进去  实施',
    synonyms: ['execute', 'carry out', 'apply'],
    antonyms: ['ignore', 'neglect', 'abandon'],
    memoryTip: 'im(进入) + ple(  + ment  让计划充分执  实施'
  },
  {
    id: 'w051', word: 'justify', phonetic: '/ˈdʒʌstɪfaɪ/',
    partOfSpeech: ['v.'],
    definitions: [
      { en: 'to show or prove to be right or reasonable', zh: '证明……有理；为……辩' },
      { en: 'to be a good reason for', zh: '是……的正当理由' }
    ],
    examples: [
      { en: 'How can you justify spending so much money?', zh: '你怎么能证明花这么多钱是合理的' },
      { en: 'The end does not justify the means.', zh: '目的不能为手段辩护' }
    ],
    imageQuery: 'justice justification courtroom',
    etymology: 'just(公正) + ify(   使公  证明有理',
    synonyms: ['defend', 'vindicate', 'validate'],
    antonyms: ['condemn', 'accuse', 'blame'],
    memoryTip: 'just(公正  + ify(   使之变得公正  证明有理'
  },
  {
    id: 'w052', word: 'legitimate', phonetic: '/lɪˈdʒɪtɪmət/',
    partOfSpeech: ['adj.'],
    definitions: [
      { en: 'conforming to the law or to rules', zh: '合法的；正当' },
      { en: 'able to be defended with logic; reasonable', zh: '合理的；合情合理' }
    ],
    examples: [
      { en: 'Is this a legitimate business?', zh: '这是一家合法的企业吗？' },
      { en: 'She has a legitimate reason for being absent.', zh: '她有正当的缺席理由' }
    ],
    imageQuery: 'legitimate legal official stamp',
    etymology: 'legit(法律) + imate  符合法律  合法',
    synonyms: ['lawful', 'legal', 'valid'],
    antonyms: ['illegal', 'illegitimate', 'unlawful'],
    memoryTip: 'legit(合法) + imate  合法  legitimate'
  },
  {
    id: 'w053', word: 'manipulate', phonetic: '/məˈnɪpjuleɪt/',
    partOfSpeech: ['v.'],
    definitions: [
      { en: 'to handle or control in a skillful manner', zh: '操纵；控制；操作' },
      { en: 'to influence someone cleverly or unscrupulously', zh: '操纵；摆' }
    ],
    examples: [
      { en: 'He tried to manipulate the data to get better results.', zh: '他试图操纵数据以获得更好的结果' },
      { en: "Don't let anyone manipulate you into doing something wrong.", zh: '不要让任何人操纵你做错事' }
    ],
    imageQuery: 'manipulate control puppet strings',
    etymology: 'mani(  + pul(  + ate  用手  操纵',
    synonyms: ['control', 'influence', 'exploit'],
    antonyms: ['liberate', 'release', 'free'],
    memoryTip: 'mani(  + pulate  用手操纵  操纵'
  },
  {
    id: 'w054', word: 'negotiate', phonetic: '/nɪˈɡoʊʃieɪt/',
    partOfSpeech: ['v.'],
    definitions: [
      { en: 'to try to reach an agreement by discussion', zh: '谈判；协' },
      { en: 'to find a way through or around something', zh: '通过；越' }
    ],
    examples: [
      { en: 'The two countries are negotiating a peace treaty.', zh: '两国正在谈判一项和平条约' },
      { en: 'She carefully negotiated the narrow mountain road.', zh: '她小心地通过了狭窄的山路' }
    ],
    imageQuery: 'negotiate business meeting handshake',
    etymology: 'neg-(否定) + oti(休闲) + ate  不休  忙于谈判',
    synonyms: ['discuss', 'bargain', 'mediate'],
    antonyms: ['refuse', 'reject', 'ignore'],
    memoryTip: 'neg(  + otiate  双方  ，然后开始谈'
  },
  {
    id: 'w055', word: 'obligation', phonetic: '/ˌɒblɪˈɡeɪʃn/',
    partOfSpeech: ['n.'],
    definitions: [
      { en: 'something that you must do because of a law, rule, or promise', zh: '义务；责任；职责' }
    ],
    examples: [
      { en: 'You have an obligation to pay your taxes.', zh: '你有义务缴纳税款' },
      { en: 'Parents have an obligation to care for their children.', zh: '父母有义务照顾子女' }
    ],
    imageQuery: 'obligation duty responsibility contract',
    etymology: 'ob-(朝向) + lig(  + ation  被绑住的  义务',
    synonyms: ['duty', 'responsibility', 'commitment'],
    antonyms: ['freedom', 'choice', 'option'],
    memoryTip: 'ob + ligation(   被道德法律绑  义务'
  },
  {
    id: 'w056', word: 'paradox', phonetic: '/ˈpærədɒks/',
    partOfSpeech: ['n.'],
    definitions: [
      { en: 'a statement that seems contradictory but may be true', zh: '悖论；自相矛盾的' }
    ],
    examples: [
      { en: 'It is a paradox that standing is more tiring than walking.', zh: '站着比走路更累，这是一个悖论' },
      { en: 'The paradox of choice: more options can lead to less satisfaction.', zh: '选择的悖论：更多的选项可能导致更少的满足感' }
    ],
    imageQuery: 'paradox impossible stairs illusion',
    etymology: 'para-(超越) + dox(观点)  超越常规观点  悖论',
    synonyms: ['contradiction', 'anomaly', 'puzzle'],
    antonyms: ['truth', 'certainty', 'consistency'],
    memoryTip: 'para(旁边) + dox(观点)  旁边有矛盾的观点  悖论'
  },
  {
    id: 'w057', word: 'reluctant', phonetic: '/rɪˈlʌktənt/',
    partOfSpeech: ['adj.'],
    definitions: [
      { en: 'unwilling and hesitant; disinclined', zh: '不情愿的；勉强的' }
    ],
    examples: [
      { en: 'He was reluctant to admit his mistake.', zh: '他不愿意承认自己的错误' },
      { en: 'She gave a reluctant smile.', zh: '她勉强笑了笑' }
    ],
    imageQuery: 'reluctant hesitant unwilling',
    etymology: 're-(  + luct(挣扎) + ant  反抗挣扎  不情愿的',
    synonyms: ['unwilling', 'hesitant', 'disinclined'],
    antonyms: ['willing', 'eager', 'enthusiastic'],
    memoryTip: 're(反复) + luct(  + ant  反复被拉也不愿去  不情愿的'
  },
  {
    id: 'w058', word: 'sophisticated', phonetic: '/səˈfɪstɪkeɪtɪd/',
    partOfSpeech: ['adj.'],
    definitions: [
      { en: 'having a lot of experience and knowledge of the world', zh: '老练的；见多识广' },
      { en: 'highly developed and complex', zh: '复杂精密的；先进' }
    ],
    examples: [
      { en: 'She has very sophisticated taste in music.', zh: '她在音乐方面有非常高雅的品味' },
      { en: 'The system uses sophisticated technology.', zh: '该系统使用了先进的技术' }
    ],
    imageQuery: 'sophisticated elegant technology',
    etymology: 'sophist(智  + icated  像智者一样的  老练',
    synonyms: ['refined', 'cultured', 'advanced'],
    antonyms: ['naive', 'simple', 'unsophisticated'],
    memoryTip: 'sophist(哲学  + icated  像哲学家一样世  老练'
  },
  {
    id: 'w059', word: 'thorough', phonetic: '/ˈθɜːroʊ/',
    partOfSpeech: ['adj.'],
    definitions: [
      { en: 'complete with regard to every detail; not superficial', zh: '彻底的；全面的；详尽' }
    ],
    examples: [
      { en: 'The police made a thorough investigation.', zh: '警方进行了彻底的调查' },
      { en: 'She is very thorough in her work.', zh: '她工作非常细致' }
    ],
    imageQuery: 'thorough investigation detail',
    etymology: 'through(通过) 的古英语形式  从头到尾通过  彻底',
    synonyms: ['complete', 'comprehensive', 'exhaustive'],
    antonyms: ['superficial', 'careless', 'incomplete'],
    memoryTip: 'thorough  through  从头到尾穿过  彻底'
  },
  {
    id: 'w060', word: 'unanimous', phonetic: '/juˈnænɪməs/',
    partOfSpeech: ['adj.'],
    definitions: [
      { en: 'fully in agreement; with everyone agreeing', zh: '全体一致的；无异议' }
    ],
    examples: [
      { en: 'The committee was unanimous in its decision.', zh: '委员会的决定是一致的' },
      { en: 'There was unanimous support for the proposal.', zh: '该提案获得了一致支持' }
    ],
    imageQuery: 'unanimous agreement vote unity',
    etymology: 'un-(一) + anim(心灵) + ous  一条心  全体一致的',
    synonyms: ['united', 'agreed', 'collective'],
    antonyms: ['divided', 'disagreed', 'split'],
    memoryTip: 'uni(统一) + animo(  + us  所有人同心  全体一致的'
  },
  {
    id: 'w061', word: 'versatile', phonetic: '/ˈvɜːrsətl/',
    partOfSpeech: ['adj.'],
    definitions: [
      { en: 'able to adapt or be adapted to many different functions', zh: '多才多艺的；多功能的' }
    ],
    examples: [
      { en: 'She is a versatile actress who can play many roles.', zh: '她是一位多才多艺的女演员，能扮演多种角色' },
      { en: 'This is a versatile tool with many uses.', zh: '这是一个用途广泛的多功能工具' }
    ],
    imageQuery: 'versatile multi-purpose talent',
    etymology: 'vers(  + atile  能转向各方面  多才多艺',
    synonyms: ['adaptable', 'flexible', 'multifaceted'],
    antonyms: ['limited', 'inflexible', 'specialized'],
    memoryTip: 'vers(  + atile  能转换各种角  多才多艺'
  },
  {
    id: 'w062', word: 'withstand', phonetic: '/wɪðˈstænd/',
    partOfSpeech: ['v.'],
    definitions: [
      { en: 'to remain undamaged or unaffected by; to resist', zh: '承受；经受住；抵' }
    ],
    examples: [
      { en: 'The bridge was designed to withstand earthquakes.', zh: '这座桥被设计成能承受地震' },
      { en: 'She had to withstand a lot of criticism.', zh: '她不得不承受很多批评' }
    ],
    imageQuery: 'withstand resistance strength shield',
    etymology: 'with-(对抗) + stand(站立)  站在对面抵抗  抵挡',
    synonyms: ['resist', 'endure', 'survive'],
    antonyms: ['yield', 'surrender', 'collapse'],
    memoryTip: 'with(  + stand(   站着和困难对  承受'
  },
  {
    id: 'w063', word: 'yield', phonetic: '/jiːld/',
    partOfSpeech: ['v.', 'n.'],
    definitions: [
      { en: 'to produce or provide a result, gain, or financial return', zh: '产生；产出；带来' },
      { en: 'to give way to pressure or demands', zh: '屈服；让' }
    ],
    examples: [
      { en: 'The investment yielded a high return.', zh: '这项投资带来了高回报' },
      { en: 'He refused to yield to pressure.', zh: '他拒绝屈服于压力' }
    ],
    imageQuery: 'yield harvest produce',
    etymology: '源自古英 gieldan(支付)  产出；让',
    synonyms: ['produce', 'generate', 'surrender'],
    antonyms: ['resist', 'withhold', 'deny'],
    memoryTip: '一(yi) e) ld)树产出很多果  yield  产出'
  },
  {
    id: 'w064', word: 'zealous', phonetic: '/ˈzeləs/',
    partOfSpeech: ['adj.'],
    definitions: [
      { en: 'having or showing great energy or enthusiasm', zh: '热心的；热情的；狂热' }
    ],
    examples: [
      { en: 'She was a zealous supporter of the cause.', zh: '她是这项事业的热心支持者' },
      { en: 'His zealous efforts paid off.', zh: '他的热忱努力得到了回报' }
    ],
    imageQuery: 'zealous passionate enthusiastic',
    etymology: 'zeal(热情) + ous  充满热情  热心',
    synonyms: ['enthusiastic', 'passionate', 'fervent'],
    antonyms: ['apathetic', 'indifferent', 'lukewarm'],
    memoryTip: 'zeal(热情) + ous  充满热情  热心'
  },
  {
    id: 'w065', word: 'contemplate', phonetic: '/ˈkɒntəmpleɪt/',
    partOfSpeech: ['v.'],
    definitions: [
      { en: 'to think about something carefully for a long time', zh: '沉思；深思熟' },
      { en: 'to look at something thoughtfully', zh: '注视；凝' }
    ],
    examples: [
      { en: 'She sat contemplating the meaning of life.', zh: '她坐着沉思生命的意义' },
      { en: 'He contemplated changing his career.', zh: '他考虑换一份工作' }
    ],
    imageQuery: 'contemplate thinking meditation',
    etymology: 'con-(共同) + templ(  + ate  在庙里沉  深',
    synonyms: ['consider', 'ponder', 'meditate'],
    antonyms: ['ignore', 'disregard', 'neglect'],
    memoryTip: 'con + temple(寺庙)  在寺庙里沉  深思熟'
  },
  {
    id: 'w066', word: 'diversity', phonetic: '/daɪˈvɜːrsəti/',
    partOfSpeech: ['n.'],
    definitions: [
      { en: 'the state of being different or having variety', zh: '多样性；差异' },
      { en: 'inclusion of different types of people', zh: '多元' }
    ],
    examples: [
      { en: 'Cultural diversity enriches society.', zh: '文化多样性丰富了社会' },
      { en: 'The company values diversity in the workplace.', zh: '公司重视工作场所的多元化' }
    ],
    imageQuery: 'diversity multicultural people',
    etymology: 'di-(分开) + vers(  + ity  转向不同方向  多样',
    synonyms: ['variety', 'range', 'multiplicity'],
    antonyms: ['uniformity', 'sameness', 'homogeneity'],
    memoryTip: 'diverse(多样  + ity  多样'
  },
  {
    id: 'w067', word: 'empathy', phonetic: '/ˈempəθi/',
    partOfSpeech: ['n.'],
    definitions: [
      { en: 'the ability to understand and share the feelings of another', zh: '同理心；共情能力' }
    ],
    examples: [
      { en: 'A good doctor should have empathy for patients.', zh: '一个好医生应该对病人有同理心' },
      { en: 'She showed great empathy towards the homeless.', zh: '她对无家可归者表现出了极大的同情' }
    ],
    imageQuery: 'empathy compassion understanding',
    etymology: 'em-(进入) + pathy(感情)  进入他人的感  同理',
    etymologyParts: [
      { part: 'em-', type: 'prefix', meaning: '进入 into' },
      { part: 'pathy', type: 'root', meaning: '感情 feeling' }
    ],
    collocations: [
      { en: 'show empathy', zh: '表现出同理心' },
      { en: 'lack of empathy', zh: '缺乏同理' },
      { en: 'empathy for', zh: '对……的同理' }
    ],
    synonyms: ['compassion', 'understanding', 'sympathy'],
    antonyms: ['apathy', 'indifference', 'callousness'],
    memoryTip: 'em(进入) + path(感情) + y  进入别人的感  同理'
  },
  {
    id: 'w068', word: 'flourish', phonetic: '/ˈflɜːrɪʃ/',
    partOfSpeech: ['v.', 'n.'],
    definitions: [
      { en: 'to grow or develop in a healthy or vigorous way', zh: '繁荣；兴旺；茂盛' },
      { en: 'to wave something around to attract attention', zh: '挥动；炫耀' }
    ],
    examples: [
      { en: 'The business flourished under her leadership.', zh: '在她的领导下，企业蓬勃发展' },
      { en: 'Plants flourish in a warm, sunny environment.', zh: '植物在温暖、阳光充足的环境中茂盛生长' }
    ],
    imageQuery: 'flourish growth prosperity garden',
    etymology: 'flour(  + ish  像花一样绽  繁荣',
    synonyms: ['thrive', 'prosper', 'bloom'],
    antonyms: ['decline', 'wither', 'languish'],
    memoryTip: 'flour(面粉/  + ish  像花一样盛开  繁荣'
  },
  {
    id: 'w069', word: 'gratitude', phonetic: '/ˈɡrætɪtjuːd/',
    partOfSpeech: ['n.'],
    definitions: [
      { en: 'the quality of being thankful; readiness to show appreciation', zh: '感激；感' }
    ],
    examples: [
      { en: 'She expressed her gratitude with a warm smile.', zh: '她用温暖的微笑表达了感激之情' },
      { en: 'I owe you a debt of gratitude.', zh: '我欠你一份人情' }
    ],
    imageQuery: 'gratitude thankful heart',
    etymology: 'grat(感谢) + itude(状   感谢的状  感激',
    synonyms: ['thankfulness', 'appreciation', 'gratefulness'],
    antonyms: ['ingratitude', 'ungratefulness'],
    memoryTip: 'grate(感恩  + itude  感恩的状  感激'
  },
  {
    id: 'w070', word: 'integrity', phonetic: '/ɪnˈteɡrəti/',
    partOfSpeech: ['n.'],
    definitions: [
      { en: 'the quality of being honest and having strong moral principles', zh: '正直；诚实；道德操守' },
      { en: 'the state of being whole and undivided', zh: '完整性；完好' }
    ],
    examples: [
      { en: 'She is a woman of great integrity.', zh: '她是一个非常正直的女人' },
      { en: 'The structural integrity of the building was compromised.', zh: '建筑物的结构完整性受到了损害' }
    ],
    imageQuery: 'integrity honesty trust',
    etymology: 'integr(完整) + ity  人格的完  正直',
    etymologyParts: [
      { part: 'integr', type: 'root', meaning: '完整 whole' },
      { part: '-ity', type: 'suffix', meaning: '名词后缀' }
    ],
    collocations: [
      { en: 'personal integrity', zh: '个人操守' },
      { en: 'structural integrity', zh: '结构完整' },
      { en: 'maintain integrity', zh: '保持正直' }
    ],
    synonyms: ['honesty', 'honor', 'morality'],
    antonyms: ['dishonesty', 'corruption', 'deceit'],
    memoryTip: 'integer(整数)  完整的、不分裂  正直(integrity)'
  }
];

export const words: Word[] = rawWords;

export function getRandomOptions(currentWord: Word, count: number = 3): Word[] {
  const others = words.filter(w => w.id !== currentWord.id);
  const shuffled = others.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}




