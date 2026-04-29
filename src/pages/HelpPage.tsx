import { Link } from 'react-router-dom';
import { BookOpen, ChevronRight, LifeBuoy, Mail, MessageCircle, Search, ShieldCheck } from 'lucide-react';

const supportEmail = 'support@example.com';
const supportMailto = `mailto:${supportEmail}?subject=${encodeURIComponent('LexFlow 支持请求')}&body=${encodeURIComponent(
  `你好，LexFlow 支持团队：\n\n我需要帮助，请尽快联系我。\n\n我的邮箱：${supportEmail}\n\n谢谢。`,
)}`;

export default function HelpPage() {
  const categories = [
    {
      title: '新手指南',
      desc: '了解 LexFlow 的核心功能，快速开始你的语言学习之旅。',
      icon: BookOpen,
      color: '#0071e3',
      link: '/help/guide',
    },
    {
      title: '账号管理',
      desc: '有关账号安全、个人资料设置及订阅管理的问题。',
      icon: ShieldCheck,
      color: '#34c759',
      link: '/help/account',
    },
    {
      title: '常见问题',
      desc: '查看我们整理的最常见疑问及其详细解答。',
      icon: LifeBuoy,
      color: '#ff9500',
      link: '/help/faq',
    },
  ];

  return (
    <div className="mx-auto max-w-[1000px] px-6 py-20 animate-in fade-in duration-700">
      <div className="mb-16 text-center">
        <h1 className="mb-4 text-[48px] font-black tracking-tight text-[#1d1d1f]">帮助中心</h1>
        <p className="text-[21px] font-medium text-[#86868b]">需要帮助吗？我们在这里为你解答。</p>
      </div>

      <div className="relative mx-auto mb-20 max-w-2xl">
        <Search className="absolute left-6 top-1/2 h-6 w-6 -translate-y-1/2 text-[#86868b]" />
        <input
          type="text"
          placeholder="搜索你的问题..."
          className="h-16 w-full rounded-[20px] border border-[#d2d2d7]/30 bg-white pl-16 pr-8 text-[18px] font-medium outline-none transition-all shadow-sm focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/5"
        />
      </div>

      <div className="mb-20 grid gap-8 md:grid-cols-3">
        {categories.map((cat) => (
          <Link
            key={cat.title}
            to={cat.link}
            className="group rounded-[32px] border border-[#d2d2d7]/30 bg-white p-10 shadow-sm transition-all duration-500 no-underline hover:-translate-y-1 hover:shadow-xl"
          >
            <div
              className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl transition-colors"
              style={{ backgroundColor: `${cat.color}10`, color: cat.color }}
            >
              <cat.icon className="h-7 w-7" />
            </div>
            <h3 className="mb-3 flex items-center justify-between text-[22px] font-black tracking-tight text-[#1d1d1f]">
              {cat.title}
              <ChevronRight className="h-5 w-5 text-[#d2d2d7] transition-colors group-hover:text-[#1d1d1f]" />
            </h3>
            <p className="text-[16px] font-medium leading-relaxed text-[#86868b]">{cat.desc}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-[40px] border border-[#d2d2d7]/30 bg-white p-12 shadow-sm">
          <MessageCircle className="mb-8 h-16 w-16 text-[#0071e3]" />
          <h2 className="mb-4 text-[34px] font-black tracking-tight text-[#1d1d1f]">联系支持团队</h2>
          <p className="mb-8 text-[19px] font-medium leading-relaxed text-[#86868b]">
            如果页面里的联系按钮没有反应，你可以直接通过邮箱联系支持团队。点下面的按钮会打开你的邮件客户端，并自动填好收件人。
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <a
              href={supportMailto}
              className="inline-flex items-center gap-2 rounded-full bg-[#0071e3] px-8 py-4 text-[16px] font-black text-white no-underline shadow-xl shadow-blue-500/20 transition-all hover:bg-[#0077ed] active:scale-95"
            >
              <Mail className="h-4.5 w-4.5" />
              发邮件给支持团队
            </a>
            <a
              href={`mailto:${supportEmail}`}
              className="inline-flex items-center gap-2 rounded-full border border-[#d2d2d7] bg-white px-6 py-4 text-[15px] font-black text-[#1d1d1f] no-underline transition-all hover:bg-[#f5f5f7]"
            >
              {supportEmail}
            </a>
          </div>
        </div>

        <div className="rounded-[40px] border border-[#d2d2d7]/30 bg-gradient-to-br from-[#f5f5f7] to-white p-12 shadow-sm">
          <div className="mb-4 inline-flex rounded-full bg-blue-50 px-4 py-2 text-[12px] font-black uppercase tracking-widest text-blue-600">
            Support Email
          </div>
          <h2 className="mb-4 text-[28px] font-black tracking-tight text-[#1d1d1f]">我们会直接回复到这个邮箱</h2>
          <p className="mb-8 text-[17px] font-medium leading-relaxed text-[#86868b]">
            收件地址已设为 <span className="font-black text-[#1d1d1f]">{supportEmail}</span>。你也可以在邮件里描述具体问题、附上截图或账号信息，方便我们更快处理。
          </p>
          <div className="rounded-[28px] border border-[#d2d2d7]/40 bg-white p-6">
            <p className="text-[14px] font-black uppercase tracking-widest text-[#86868b]">提示</p>
            <p className="mt-2 text-[16px] font-medium leading-relaxed text-[#1d1d1f]">
              点击按钮后，系统会先打开你的默认邮件客户端，不会直接发送邮件。你确认内容后再发出就行。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
