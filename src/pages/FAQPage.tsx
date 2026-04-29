import { Link } from 'react-router-dom';
import { ArrowLeft, HelpCircle, ChevronDown, MessageSquare } from 'lucide-react';
import { useState } from 'react';

export default function FAQPage() {
  const faqs = [
    {
      q: 'LexFlow 是免费使用的吗？',
      a: 'LexFlow 提供基础功能的免费使用。我们致力于为全球学习者提供高质量的教育资源。'
    },
    {
      q: '如何设置每日学习目标？',
      a: '在“学习统计”页面的右上角，或者“设置”页面中，您可以随时修改每日新词数目标。建议初学者从每天 20 个单词开始。'
    },
    {
      q: 'LexFlow 的记忆算法是如何工作的？',
      a: '我们使用的是经过优化的艾宾浩斯记忆曲线（Spaced Repetition System）。系统会根据您在练习中的表现（正确率、耗时等），自动推导出该单词下一次出现的最佳时间点。'
    },
    {
      q: '支持哪些设备？',
      a: '目前 LexFlow 完全适配桌面端和移动端浏览器。我们建议在 iPad 或桌面显示器上使用双语阅读功能，以获得最佳的排版体验。'
    },
    {
      q: '如何反馈内容错误？',
      a: '在每一个单词的详情页或者文章的页脚处，都有一个“报错”按钮。点击后您可以提交具体的问题，我们的编辑团队会定期核对。'
    },
    {
      q: '我的个人数据会被泄露吗？',
      a: 'LexFlow 采用端到端加密和严格的数据隐私政策。您的所有学习记录仅作为提升您个人算法效率使用，绝不会出售给第三方。'
    }
  ];

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <div className="max-w-[1000px] mx-auto px-6 py-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <Link
        to="/help"
        className="inline-flex items-center gap-2 text-[#86868b] hover:text-[#1d1d1f] transition-colors no-underline text-[15px] font-bold mb-12"
      >
        <ArrowLeft className="w-4 h-4" /> 返回帮助中心
      </Link>

      <div className="mb-16">
        <h1 className="text-[48px] font-black text-[#1d1d1f] tracking-tight mb-6 flex items-center gap-6">
          <div className="w-16 h-16 rounded-[22px] bg-[#ff9500]/10 flex items-center justify-center text-[#ff9500]">
            <HelpCircle className="w-8 h-8" />
          </div>
          常见问题
        </h1>
        <p className="text-[21px] text-[#86868b] font-medium leading-relaxed max-w-2xl">
          在这里，我们整理了用户最关心的一些问题。如果没能找到答案，请随时联系我们的技术支持。
        </p>
      </div>

      <div className="grid gap-6 mb-20">
        {faqs.map((faq, idx) => {
          const isActive = activeIndex === idx;
          return (
            <div 
              key={idx} 
              className={`apple-card overflow-hidden transition-all duration-500 ${isActive ? 'ring-2 ring-[#0071e3] ring-inset' : ''}`}
            >
              <button 
                onClick={() => setActiveIndex(isActive ? null : idx)}
                className="w-full p-10 flex items-center justify-between text-left group"
              >
                <span className="text-[20px] font-bold text-[#1d1d1f] pr-8">{faq.q}</span>
                <ChevronDown className={`w-6 h-6 text-[#d2d2d7] group-hover:text-[#1d1d1f] transition-all duration-500 ${isActive ? 'rotate-180' : ''}`} />
              </button>
              <div className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${isActive ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="px-10 pb-10">
                  <div className="h-[1px] bg-[#d2d2d7]/30 mb-8"></div>
                  <p className="text-[18px] text-[#86868b] font-medium leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-[#0071e3] rounded-[48px] p-12 md:p-20 text-center text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white blur-[120px] opacity-20 -mr-32 -mt-32"></div>
        
        <MessageSquare className="w-16 h-16 mx-auto mb-8" />
        <h2 className="text-[34px] font-black mb-6 tracking-tight">没找到你的问题？</h2>
        <p className="text-[20px] text-white/80 font-medium mb-12 max-w-xl mx-auto">
          别担心，直接联系我们的产品经理，我们将为您提供最详细的指导。
        </p>
        <button className="px-10 py-5 bg-white text-[#0071e3] rounded-[24px] text-[18px] font-black hover:scale-105 transition-transform no-underline">
          提交工单
        </button>
      </div>
    </div>
  );
}
