import { useRef, useState, type ChangeEvent } from 'react';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Camera, Save, Target } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { translateAuthError } from '../utils/authErrors';
import { getStoredAvatar, PROFILE_CHANGED_EVENT, saveStoredProfile } from '../utils/profileStorage';
import { getProgress, saveProgress } from '../utils/storage';

export default function EditProfilePage() {
  const { user, isConfigured } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [progress, setProgress] = useState(getProgress());
  const [nickname, setNickname] = useState(user?.user_metadata?.username || user?.email?.split('@')[0] || '');
  const [avatarDataUrl, setAvatarDataUrl] = useState(() => getStoredAvatar(user?.email));
  const [dailyGoal, setDailyGoal] = useState(progress.dailyGoal);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const refresh = () => {
      const nextProgress = getProgress();
      setProgress(nextProgress);
      setDailyGoal(nextProgress.dailyGoal);
    };

    refresh();
    window.addEventListener('storage', refresh);
    window.addEventListener('el-progress-changed', refresh as EventListener);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('el-progress-changed', refresh as EventListener);
    };
  }, []);

  useEffect(() => {
    setNickname(user?.user_metadata?.username || user?.email?.split('@')[0] || '');
    setAvatarDataUrl(getStoredAvatar(user?.email));
  }, [user?.email, user?.user_metadata?.username]);

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setError('');

    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
      setError('头像只支持 JPG、PNG 或 GIF 格式。');
      event.target.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('头像文件不能超过 2MB。');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatarDataUrl(String(reader.result || ''));
    };
    reader.onerror = () => {
      setError('头像读取失败，请重新选择图片。');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    const nextNickname = nickname.trim();
    setError('');

    if (!nextNickname) {
      setError('昵称不能为空。');
      return;
    }

    setSaving(true);

    const next = { ...progress, dailyGoal: dailyGoal };
    saveProgress(next);
    setProgress(next);

    saveStoredProfile({ avatarDataUrl }, user?.email);

    if (isConfigured) {
      const { error: updateError } = await supabase.auth.updateUser({
        data: { username: nextNickname },
      });

      if (updateError) {
        setSaving(false);
        setError(translateAuthError(updateError.message) || '个人资料保存失败，请稍后重试。');
        return;
      }
    }

    window.dispatchEvent(new Event(PROFILE_CHANGED_EVENT));
    setSaving(false);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
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
              <div className="w-24 h-24 bg-[#0071e3] rounded-[28px] flex items-center justify-center overflow-hidden text-white text-3xl font-black shadow-xl shadow-blue-500/20">
                {avatarDataUrl ? (
                  <img src={avatarDataUrl} alt="头像预览" className="h-full w-full object-cover" />
                ) : (
                  nickname.charAt(0).toUpperCase()
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-full shadow-lg border border-[#d2d2d7]/30 flex items-center justify-center text-[#1d1d1f] hover:scale-110 transition-transform"
              >
                <Camera className="w-5 h-5" />
              </button>
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 bg-[#f5f5f7] text-[#1d1d1f] rounded-xl text-sm font-bold hover:bg-[#e8e8ed] transition-colors mb-2"
              >
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
              <p className="mt-2 text-xs text-[#86868b] font-medium">
                邮箱地址可在
                <Link to="/help/account/security" className="mx-1 font-black text-[#0071e3] no-underline hover:underline">
                  安全性与密码
                </Link>
                页面更改。
              </p>
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

        {error && <p className="text-center text-sm font-bold text-[#ff3b30]">{error}</p>}

        <button
          onClick={handleSave}
          disabled={saved || saving}
          className={`w-full py-5 rounded-[24px] flex items-center justify-center gap-3 text-[18px] font-black transition-all active:scale-[0.98] shadow-xl ${
            saved 
            ? 'bg-[#34c759] text-white shadow-green-500/20' 
            : 'bg-[#0071e3] text-white hover:bg-[#0077ed] shadow-blue-500/20'
          }`}
        >
          {saved ? <><Save className="w-5 h-5" /> 已保存</> : saving ? '正在保存...' : '保存所有修改'}
        </button>
      </div>
    </div>
  );
}
