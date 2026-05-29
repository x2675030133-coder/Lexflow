import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, User, RefreshCw, Lock, Mail, ChevronRight } from 'lucide-react';

const supportEmail = 'support@example.com';
const loginSupportMailto = `mailto:${supportEmail}?subject=${encodeURIComponent('LexFlow 登录问题反馈')}&body=${encodeURIComponent(
  `你好，LexFlow 支持团队：\n\n我遇到了登录问题，需要协助找回账号。\n\n注册邮箱：\n遇到的问题：\n是否还能访问绑定邮箱：\n\n谢谢。`,
)}`;

export default function AccountManagementPage() {
  const accountItems = [
    {
      title: '修改个人资料',
      desc: '您可以随时更改头像、昵称以及学习目标设置。',
      icon: User,
      color: '#0071e3',
      link: '/help/account/profile'
    },
    {
      title: '安全性与密码',
      desc: '建议定期更换密码，并确保绑定的邮箱地址准确无误。',
      icon: Lock,
      color: '#34c759',
      link: '/help/account/security'
    },
    {
      title: '多端同步',
      desc: '登录 LexFlow 账号后，您的学习记录和生词本将在所有设备间实时同步。',
      icon: RefreshCw,
      color: '#af52de',
      link: '/help/account/sync'
    },
    {
      title: '订阅与偏好',
      desc: '管理您的通知设置、系统主题（深色/浅色模式）以及发音偏好。',
      icon: ShieldCheck,
      color: '#ff9500',
      link: '/help/account/preferences'
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

      <div className="mb-16">
        <h1 className="text-[48px] font-black text-[#1d1d1f] tracking-tight mb-6">账号管理</h1>
        <p className="text-[21px] text-[#86868b] font-medium leading-relaxed max-w-2xl">
          在这里，您可以了解如何安全地管理您的 LexFlow 账号，确保您的学习数据始终安全且保持同步。
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-20">
        {accountItems.map((item, idx) => (
          <Link 
            key={idx} 
            to={item.link}
            className="apple-card p-10 group no-underline transition-all"
          >
            <div className="w-16 h-16 rounded-[22px] flex items-center justify-center mb-8 shadow-sm transition-transform group-hover:scale-110" style={{ backgroundColor: `${item.color}10`, color: item.color }}>
              <item.icon className="w-8 h-8" />
            </div>
            <h3 className="text-[24px] font-black text-[#1d1d1f] mb-4 tracking-tight flex items-center justify-between">
              {item.title}
              <ChevronRight className="w-6 h-6 text-[#d2d2d7] group-hover:text-[#1d1d1f] transition-colors" />
            </h3>
            <p className="text-[17px] text-[#86868b] font-medium leading-relaxed">{item.desc}</p>
          </Link>
        ))}
      </div>

      <div className="bg-[#f5f5f7] rounded-[40px] p-12 border border-[#d2d2d7]/30">
        <div className="flex flex-col md:flex-row gap-12 items-center">
          <div className="shrink-0 w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm">
            <Mail className="w-10 h-10 text-[#0071e3]" />
          </div>
          <div>
            <h2 className="text-[28px] font-black text-[#1d1d1f] mb-4 tracking-tight">遇到登录问题？</h2>
            <p className="text-[18px] text-[#86868b] font-medium leading-relaxed mb-8">
              如果您忘记了密码或无法访问绑定的邮箱，请直接通过邮件联系我们，我们的工程师将协助您找回账号。
            </p>
            <a
              href={loginSupportMailto}
              className="inline-flex px-8 py-4 bg-[#1d1d1f] text-white rounded-[20px] text-[16px] font-bold hover:bg-black transition-all no-underline active:scale-95"
            >
              发送反馈邮件
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
