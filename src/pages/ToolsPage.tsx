import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ExternalLink, Sparkles, Volume2 } from 'lucide-react';
import { toolCategories } from '../data/tools';

export default function ToolsPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const elements = entry.target.querySelectorAll('.reveal-on-scroll');
            elements.forEach((el) => el.classList.add('is-visible'));
          }
        });
      },
      { threshold: 0.1 },
    );

    if (containerRef.current) {
      const sections = containerRef.current.querySelectorAll('.reveal-section');
      sections.forEach((section) => observer.observe(section));
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 reveal-1">
        <h1 className="mb-2 text-3xl font-bold text-[#1d1d1f]">学习工具导航</h1>
        <p className="font-medium text-[#000000]">
          精选英语学习工具和资源，方便你查词、听力、阅读和写作练习。
        </p>
      </div>

      <section className="reveal-section mb-12 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Link
          to="/pronunciation"
          className="reveal-on-scroll group rounded-[32px] border border-[#d2d2d7]/60 bg-white p-6 no-underline shadow-[0_16px_40px_rgba(0,0,0,0.05)] transition-all hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)]"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-blue-50 text-blue-600 transition-transform group-hover:scale-110">
              <Volume2 className="h-8 w-8" />
            </div>
            <span className="rounded-full bg-[#f5f5f7] px-3 py-2 text-[12px] font-black uppercase tracking-[0.2em] text-[#86868b]">
              Pronunciation
            </span>
          </div>
          <h2 className="mt-6 text-[30px] font-black tracking-tight text-[#1d1d1f]">音标发音</h2>
          <p className="mt-3 max-w-xl text-[17px] font-medium leading-relaxed text-[#636366]">
            44 个音素、例词、口型提示和最小对立练习放在同一页。
          </p>
          <div className="mt-8 inline-flex items-center gap-2 text-[15px] font-black text-blue-600 transition-all group-hover:gap-3">
            进入练习
            <ArrowRight className="h-4 w-4" />
          </div>
        </Link>

        <div className="reveal-on-scroll rounded-[32px] border border-[#d2d2d7]/60 bg-white/85 p-6 shadow-[0_16px_40px_rgba(0,0,0,0.05)]">
          <div className="mb-4 flex items-center gap-2 text-[13px] font-black uppercase tracking-[0.22em] text-[#86868b]">
            <Sparkles className="h-4 w-4 text-blue-600" />
            一屏摘要
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ['44', '音素'],
              ['5', '分类'],
              ['10', '最小对立'],
            ].map(([value, label]) => (
              <div key={label} className="rounded-[24px] bg-[#f5f5f7] p-4">
                <div className="text-[30px] font-black tracking-tight text-[#1d1d1f]">{value}</div>
                <div className="mt-2 text-[13px] font-black uppercase tracking-[0.18em] text-[#86868b]">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="space-y-10">
        {toolCategories.map((category) => (
          <section key={category.id} className="reveal-section">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-[#1d1d1f] reveal-on-scroll">
              <span className="text-2xl">{category.icon}</span>
              {category.name}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {category.tools.map((tool, index) => (
                <a
                  key={index}
                  href={tool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group rounded-2xl border border-gray-100 bg-white p-5 no-underline transition-all hover:border-blue-200 hover:shadow-lg reveal-on-scroll delay-${((index % 4) + 1) * 100}`}
                >
                  <div className="mb-3 flex items-start justify-between">
                    <span className="text-3xl">{tool.icon}</span>
                    <ExternalLink className="h-4 w-4 text-gray-300 transition-colors group-hover:text-blue-500" />
                  </div>
                  <h3 className="mb-1 font-bold text-[#1d1d1f] transition-colors group-hover:text-blue-600">{tool.name}</h3>
                  <p className="text-sm font-medium text-[#000000]">{tool.desc}</p>
                </a>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
