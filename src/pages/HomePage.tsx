import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, BookOpen, Headphones, Play, Sparkles } from 'lucide-react';

const featureCards = [
  {
    icon: BookOpen,
    title: '高效背单词',
    text: '基于艾宾浩斯记忆曲线，科学规划复习时间，让记忆更牢固。',
    to: '/vocabulary',
    color: '#0071e3'
  },
  {
    icon: Headphones,
    title: '听力口语',
    text: '精选真实语境素材，沉浸式练习，告别中式英语。',
    to: '/listening',
    color: '#5856d6'
  },
  {
    icon: Sparkles,
    title: '双语阅读',
    text: '海量原版文章，实时查词，在阅读中提升语感。',
    to: '/reading',
    color: '#34c759'
  },
  {
    icon: BarChart3,
    title: '学习统计',
    text: '全维度记录学习成长轨迹，进度一目了然。',
    to: '/dashboard',
    color: '#ff9500'
  },
];

export default function HomePage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const elements = entry.target.querySelectorAll('.reveal-on-scroll');
            elements.forEach((el, i) => {
              setTimeout(() => {
                el.classList.add('is-visible');
              }, i * 100); // Faster, snappier stagger
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    if (containerRef.current) {
      const sections = containerRef.current.querySelectorAll('.reveal-section');
      sections.forEach((section) => observer.observe(section));
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="text-[#1d1d1f]">
      {/* Hero Section */}
      <section className="relative px-4 py-28 sm:py-40 overflow-hidden">
        <div className="mx-auto max-w-5xl text-center relative z-10">
          <div className="reveal-1 mx-auto mb-10 inline-flex items-center gap-2 rounded-full bg-blue-50/50 px-5 py-2 text-sm font-bold text-blue-600 border border-blue-100/50 shadow-sm backdrop-blur-md">
            <Sparkles size={16} className="animate-pulse" /> 体验最优雅的学习方式
          </div>
          <h1 className="reveal-2 heading-hero text-[#1d1d1f]">
            让英语学习<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">更简单，更直观</span>
          </h1>
          <p className="reveal-3 mx-auto mt-10 max-w-2xl text-[21px] font-medium leading-relaxed text-[#86868b]">
            基于记忆曲线与情境教学，为您量身定制学习路径。<br className="hidden sm:block" />
            让每一个单词、每一句听力都成为您的直觉。
          </p>
          <div className="reveal-4 mt-14 flex flex-wrap justify-center gap-6">
            <Link to="/vocabulary" className="apple-button-primary rounded-full bg-[#0071e3] px-12 py-5 text-[18px] font-black text-white shadow-2xl shadow-blue-500/30 hover:scale-[1.05] active:scale-95 transition-all">
              开始学习
            </Link>
            <Link to="/register" className="rounded-full bg-white/60 border border-[#d2d2d7]/50 px-12 py-5 text-[18px] font-black text-[#1d1d1f] backdrop-blur-xl transition-all hover:scale-[1.05] hover:bg-white hover:border-[#d2d2d7] active:scale-95 shadow-sm">
              立即加入
            </Link>
          </div>
        </div>
        
        {/* Hero Background Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10 opacity-30 pointer-events-none">
          <div className="absolute top-[10%] left-[10%] w-[40%] h-[40%] bg-blue-200 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[10%] right-[10%] w-[40%] h-[40%] bg-purple-100 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
      </section>

      {/* Stats Section */}
      <section className="mx-auto max-w-6xl px-4 py-20 reveal-section">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3">
          {[
            ['8000+', '精选词汇'],
            ['40+', '主题分类'],
            ['8+', '学习模式'],
          ].map(([value, label]) => (
            <div key={label} className="reveal-on-scroll apple-card p-10 text-center group">
              <div className="text-5xl font-black tracking-tight text-[#1d1d1f] group-hover:scale-110 transition-transform duration-500">{value}</div>
              <div className="mt-3 text-[14px] font-bold text-[#86868b] uppercase tracking-[0.2em]">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="mx-auto max-w-6xl px-4 pb-32 reveal-section">
        <div className="text-center mb-20 reveal-on-scroll">
          <h2 className="heading-section text-[#1d1d1f]">探索全方位功能</h2>
          <p className="text-[20px] font-medium text-[#86868b]">专为追求卓越的英语学习者设计</p>
        </div>
        <div className="grid gap-10 md:grid-cols-2">
          {featureCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.title} to={card.to} className="group apple-card p-12 flex flex-col items-start text-left reveal-on-scroll">
                <div 
                  className="mb-10 flex h-20 w-20 items-center justify-center rounded-[24px] text-white shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500"
                  style={{ background: card.color, boxShadow: `${card.color}44 0 12px 30px` }}
                >
                  <Icon size={40} />
                </div>
                <h3 className="text-[32px] font-black tracking-tight text-[#1d1d1f] mb-5">{card.title}</h3>
                <p className="text-[18px] font-medium leading-relaxed text-[#86868b] mb-10">{card.text}</p>
                <div className="mt-auto flex items-center gap-3 text-[16px] font-black text-[#0071e3] group-hover:gap-5 transition-all duration-300">
                  立即体验 <Play size={16} fill="currentColor" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-5xl px-4 mb-32 reveal-section">
        <div className="reveal-on-scroll rounded-[64px] bg-gradient-to-br from-blue-50/80 to-indigo-50/80 border border-white p-16 sm:p-28 text-center relative overflow-hidden shadow-2xl shadow-blue-500/5 backdrop-blur-sm">
          <div className="absolute top-0 left-0 w-full h-full opacity-60 pointer-events-none">
             <div className="absolute top-[-40%] left-[-20%] w-[80%] h-[120%] bg-blue-200 blur-[120px] rounded-full animate-pulse" />
             <div className="absolute bottom-[-40%] right-[-20%] w-[80%] h-[120%] bg-indigo-200 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '3s' }} />
          </div>
          <h2 className="text-4xl sm:text-6xl font-black tracking-tight mb-8 text-[#1d1d1f] relative z-10">准备好开启新篇章了吗？</h2>
          <p className="text-[22px] text-[#86868b] font-medium mb-14 max-w-xl mx-auto relative z-10 leading-relaxed">
            加入 LexFlow，体验科技与美学完美结合的语言学习之旅。
          </p>
          <Link to="/vocabulary" className="inline-flex items-center gap-4 rounded-full bg-[#1d1d1f] px-14 py-6 text-[18px] font-black text-white transition-all hover:scale-[1.05] hover:bg-black shadow-2xl shadow-black/20 relative z-10 active:scale-95">
            开启您的旅程 <Play size={20} fill="currentColor" />
          </Link>
        </div>
      </section>
    </div>
  );
}

