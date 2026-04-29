import { useEffect, useRef } from 'react';
import { ExternalLink } from 'lucide-react';
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
      { threshold: 0.1 }
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
        <p className="text-[#000000] font-medium">精选英语学习工具和资源，方便你查词、听力、阅读和写作练习。</p>
      </div>

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
                  <p className="text-sm text-[#000000] font-medium">{tool.desc}</p>
                </a>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
