import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Headphones, Layout, BarChart3, Rocket, CheckCircle2 } from 'lucide-react';

export default function BeginnersGuidePage() {
  const steps = [
    {
      title: '第一步：选择你的词书',
      desc: '在“背单词”板块，你可以根据自己的水平选择合适的词库。LexFlow 会根据艾宾浩斯记忆曲线为你自动规划复习。',
      icon: BookOpen,
      color: '#0071e3'
    },
    {
      title: '第二步：沉浸式听力训练',
      desc: '不仅是听，还要练。进入“听力口语”，通过逐句复读、填空练习来提升你的语感。',
      icon: Headphones,
      color: '#5856d6'
    },
    {
      title: '第三步：深度双语阅读',
      desc: '“双语阅读”精选时事新闻与文化故事。点击单词即刻查询，让阅读不再充满阻碍。',
      icon: Layout,
      color: '#ff2d55'
    },
    {
      title: '第四步：关注你的成长',
      desc: '查看“学习统计”，每一分钟的努力都会被记录。精美的图表会告诉你哪里进步了，哪里需要加强。',
      icon: BarChart3,
      color: '#af52de'
    }
  ];

  return (
    <div className="max-w-[1000px] mx-auto px-6 py-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <Link
        to="/help"
        className="inline-flex items-center gap-2 text-[#86868b] hover:text-[#1d1d1f] transition-colors no-underline text-[15px] font-bold mb-12"
      >
        <ArrowLeft className="w-4 h-4" /> 返回帮助中心
      </Link>

      <div className="mb-20">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0071e3]/10 text-[#0071e3] text-sm font-black mb-6">
          <Rocket className="w-4 h-4" /> 新手上手
        </div>
        <h1 className="text-[48px] font-black text-[#1d1d1f] tracking-tight mb-6">欢迎来到 LexFlow</h1>
        <p className="text-[21px] text-[#86868b] font-medium leading-relaxed max-w-2xl">
          这是一个为你精心设计的语言学习空间。通过以下四个简单的步骤，开启你高效且优雅的英语学习之旅。
        </p>
      </div>

      <div className="grid gap-8 mb-20">
        {steps.map((step, idx) => (
          <div key={idx} className="apple-card p-10 flex flex-col md:flex-row gap-10 items-start md:items-center reveal-on-scroll">
            <div className="w-20 h-20 rounded-[28px] flex items-center justify-center shrink-0 shadow-lg" style={{ backgroundColor: `${step.color}10`, color: step.color }}>
              <step.icon className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-[26px] font-black text-[#1d1d1f] mb-4 tracking-tight">{step.title}</h3>
              <p className="text-[18px] text-[#86868b] font-medium leading-relaxed">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#1d1d1f] rounded-[48px] p-12 md:p-20 text-center text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#0071e3] blur-[120px] opacity-20 -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#af52de] blur-[120px] opacity-20 -ml-32 -mb-32"></div>
        
        <CheckCircle2 className="w-20 h-20 text-[#34c759] mx-auto mb-10" />
        <h2 className="text-[34px] font-black mb-6 tracking-tight">准备好了吗？</h2>
        <p className="text-[20px] text-white/60 font-medium mb-12 max-w-xl mx-auto">
          现在就去设置你的第一个学习目标，感受从未如此丝滑的学习体验。
        </p>
        <Link 
          to="/vocabulary" 
          className="inline-flex items-center gap-2 px-10 py-5 bg-white text-black rounded-[24px] text-[18px] font-black hover:scale-105 transition-transform no-underline"
        >
          立即开始背词
        </Link>
      </div>
    </div>
  );
}
