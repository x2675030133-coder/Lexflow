import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Camera, Save, Target } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getProgress, saveProgress } from '../utils/storage';

export default function EditProfilePage() {
  const { user } = useAuth();
  const [progress, setProgress] = useState(getProgress());
  const [nickname, setNickname] = useState(user?.user_metadata?.username || user?.email?.split('@')[0] || '');
  const [dailyGoal, setDailyGoal] = useState(progress.dailyGoal);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    const next = { ...progress, dailyGoal: dailyGoal };
    saveProgress(next);
    setProgress(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-[800px] mx-auto px-6 py-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <Link
        to="/help/account"
        className="inline-flex items-center gap-2 text-[#86868b] hover:text-[#1d1d1f] transition-colors no-underline text-[15px] font-bold mb-12"
      >
        <ArrowLeft className="w-4 h-4" /> 返回账号管理
      </Link>

      <h1 className="text-[40px] font-black text-[#1d1d1f] tracking-tight mb-12">修改个人资料</h1>

      <div className="space-y-8">
        {/* Avatar Section */}
        <section className="apple-card p-10">
          <h2 className="text-[20px] font-black text-[#1d1d1f] mb-8">更换头像</h2>
          <div className="flex items-center gap-10">
            <div className="relative group">
              <div className="w-24 h-24 bg-[#0071e3] rounded-[28px] flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-blue-500/20">
                {nickname.charAt(0).toUpperCase()}
              </div>
              <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-full shadow-lg border border-[#d2d2d7]/30 flex items-center justify-center text-[#1d1d1f] hover:scale-110 transition-transform">
                <Camera className="w-5 h-5" />
              </button>
            </div>
            <div>
              <button className="px-6 py-3 bg-[#f5f5f7] text-[#1d1d1f] rounded-xl text-sm font-bold hover:bg-[#e8e8ed] transition-colors mb-2">
                上传新头像
              </button>
              <p className="text-xs text-[#86868b] font-medium">支持 JPG、PNG 或 GIF。最大 2MB。</p>
            </div>
          </div>
        </section>

        {/* Nickname Section */}
        <section className="apple-card p-10">
          <h2 className="text-[20px] font-black text-[#1d1d1f] mb-8">基本信息</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-[#86868b] uppercase tracking-wider mb-3">昵称</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-6 py-4 rounded-2xl bg-[#f5f5f7] border-2 border-transparent focus:bg-white focus:border-[#0071e3] text-[17px] font-bold text-[#1d1d1f] outline-none transition-all"
                placeholder="输入你的昵称"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#86868b] uppercase tracking-wider mb-3">电子邮箱</label>
              <input
                type="text"
                value={user?.email || ''}
                disabled
                className="w-full px-6 py-4 rounded-2xl bg-[#f5f5f7] text-[17px] font-bold text-[#1d1d1f]/40 cursor-not-allowed outline-none"
              />
              <p className="mt-2 text-xs text-[#86868b] font-medium">邮箱地址暂不支持自行修改。如需变更请联系技术支持。</p>
            </div>
          </div>
        </section>

        {/* Learning Goal Section */}
        <section className="apple-card p-10">
          <div className="flex items-center gap-3 mb-8">
            <Target className="w-6 h-6 text-[#ff2d55]" />
            <h2 className="text-[20px] font-black text-[#1d1d1f]">学习目标设置</h2>
          </div>
          <div className="space-y-8">
            <div>
              <div className="flex justify-between items-end mb-4">
                <label className="text-sm font-bold text-[#86868b] uppercase tracking-wider">每日学习单词数</label>
                <span className="text-2xl font-black text-[#0071e3]">{dailyGoal} <span className="text-sm text-[#86868b]">词/日</span></span>
              </div>
              <input
                type="range"
                min="5"
                max="200"
                step="5"
                value={dailyGoal}
                onChange={(e) => setDailyGoal(parseInt(e.target.value))}
                className="w-full h-2 bg-[#f5f5f7] rounded-lg appearance-none cursor-pointer accent-[#0071e3]"
              />
              <div className="flex justify-between mt-3 text-xs font-bold text-[#86868b] opacity-40">
                <span>5 词</span>
                <span>100 词</span>
                <span>200 词</span>
              </div>
            </div>
          </div>
        </section>

        <button
          onClick={handleSave}
          disabled={saved}
          className={`w-full py-5 rounded-[24px] flex items-center justify-center gap-3 text-[18px] font-black transition-all active:scale-[0.98] shadow-xl ${
            saved 
            ? 'bg-[#34c759] text-white shadow-green-500/20' 
            : 'bg-[#0071e3] text-white hover:bg-[#0077ed] shadow-blue-500/20'
          }`}
        >
          {saved ? <><Save className="w-5 h-5" /> 已保存</> : '保存所有修改'}
        </button>
      </div>
    </div>
  );
}
