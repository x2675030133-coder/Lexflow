import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Lock, Mail, Shield, Smartphone } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { translateAuthError } from '../utils/authErrors';

export default function SecurityPage() {
  const { user, isConfigured } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [changingEmail, setChangingEmail] = useState(false);
  const [emailUpdating, setEmailUpdating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [emailMessage, setEmailMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleUpdatePassword = async () => {
    setMessage(null);

    const email = user?.email;

    if (!isConfigured) {
      setMessage({ type: 'error', text: 'Supabase 尚未配置，无法更新密码。' });
      return;
    }

    if (!email) {
      setMessage({ type: 'error', text: '请先登录后再修改密码。' });
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage({ type: 'error', text: '请完整填写当前密码、新密码和确认密码。' });
      return;
    }

    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: '新密码至少需要 8 位字符。' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: '两次输入的新密码不一致。' });
      return;
    }

    if (currentPassword === newPassword) {
      setMessage({ type: 'error', text: '新密码不能和当前密码相同。' });
      return;
    }

    setUpdating(true);

    try {
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });

      if (verifyError) {
        setMessage({ type: 'error', text: translateAuthError(verifyError.message) || '当前密码不正确。' });
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setMessage({ type: 'error', text: translateAuthError(updateError.message) || '密码更新失败，请稍后重试。' });
        return;
      }

      setMessage({ type: 'success', text: '密码已更新成功，下次登录请使用新密码。' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateEmail = async () => {
    setEmailMessage(null);

    const currentEmail = user?.email;
    const normalizedEmail = newEmail.trim().toLowerCase();

    if (!isConfigured) {
      setEmailMessage({ type: 'error', text: 'Supabase 尚未配置，无法更改邮箱。' });
      return;
    }

    if (!currentEmail) {
      setEmailMessage({ type: 'error', text: '请先登录后再更改邮箱。' });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setEmailMessage({ type: 'error', text: '请输入正确的新邮箱地址。' });
      return;
    }

    if (normalizedEmail === currentEmail.toLowerCase()) {
      setEmailMessage({ type: 'error', text: '新邮箱不能和当前邮箱相同。' });
      return;
    }

    if (!emailPassword) {
      setEmailMessage({ type: 'error', text: '请输入当前密码以确认身份。' });
      return;
    }

    setEmailUpdating(true);

    try {
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: currentEmail,
        password: emailPassword,
      });

      if (verifyError) {
        setEmailMessage({ type: 'error', text: translateAuthError(verifyError.message) || '当前密码不正确。' });
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        email: normalizedEmail,
      });

      if (updateError) {
        setEmailMessage({ type: 'error', text: translateAuthError(updateError.message) || '邮箱更改失败，请稍后重试。' });
        return;
      }

      setEmailMessage({ type: 'success', text: '验证邮件已发送，请到新邮箱确认后完成更改。' });
      setNewEmail('');
      setEmailPassword('');
    } finally {
      setEmailUpdating(false);
    }
  };

  return (
    <div className="max-w-[800px] mx-auto px-6 py-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <Link
        to="/help/account"
        className="inline-flex items-center gap-2 text-[#86868b] hover:text-[#1d1d1f] transition-colors no-underline text-[15px] font-bold mb-12"
      >
        <ArrowLeft className="w-4 h-4" /> 返回账号管理
      </Link>

      <div className="flex items-center gap-5 mb-12">
        <div className="w-16 h-16 rounded-[22px] bg-[#34c759]/10 flex items-center justify-center text-[#34c759]">
          <Shield className="w-8 h-8" />
        </div>
        <h1 className="text-[40px] font-black text-[#1d1d1f] tracking-tight">安全性与密码</h1>
      </div>

      <div className="space-y-8">
        {/* Password Section */}
        <section className="apple-card p-10">
          <h2 className="text-[20px] font-black text-[#1d1d1f] mb-8 flex items-center gap-3">
            <Lock className="w-5 h-5 text-[#0071e3]" /> 修改登录密码
          </h2>
          <form className="space-y-6" onSubmit={(event) => {
            event.preventDefault();
            void handleUpdatePassword();
          }}>
            <div>
              <label className="block text-sm font-bold text-[#86868b] uppercase tracking-wider mb-3">当前密码</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full px-6 py-4 rounded-2xl bg-[#f5f5f7] border-2 border-transparent focus:bg-white focus:border-[#0071e3] text-[17px] font-bold outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#86868b] uppercase tracking-wider mb-3">新密码</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full px-6 py-4 rounded-2xl bg-[#f5f5f7] border-2 border-transparent focus:bg-white focus:border-[#0071e3] text-[17px] font-bold outline-none transition-all"
                placeholder="至少 8 位字符"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#86868b] uppercase tracking-wider mb-3">确认新密码</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full px-6 py-4 rounded-2xl bg-[#f5f5f7] border-2 border-transparent focus:bg-white focus:border-[#0071e3] text-[17px] font-bold outline-none transition-all"
                placeholder="重复输入新密码"
              />
            </div>
            {message && (
              <p className={`text-sm font-bold ${message.type === 'success' ? 'text-[#34c759]' : 'text-[#ff3b30]'}`}>
                {message.text}
              </p>
            )}
            <button
              type="submit"
              disabled={updating}
              className="mt-4 px-8 py-4 bg-[#1d1d1f] text-white rounded-2xl text-[16px] font-bold hover:bg-black transition-all active:scale-95 disabled:opacity-50"
            >
              {updating ? '正在更新...' : '更新密码'}
            </button>
          </form>
        </section>

        {/* Security Options */}
        <section className="apple-card p-10">
          <h2 className="text-[20px] font-black text-[#1d1d1f] mb-8">安全设置</h2>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-6 bg-[#f5f5f7] rounded-3xl">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#0071e3] shadow-sm">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[17px] font-bold text-[#1d1d1f]">邮箱验证</p>
                  <p className="text-sm text-[#86868b] font-medium">用于找回密码和接收重要通知</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setChangingEmail((value) => !value);
                  setEmailMessage(null);
                }}
                className="text-[15px] font-bold text-[#0071e3] hover:underline"
              >
                {changingEmail ? '收起' : '更改邮箱'}
              </button>
            </div>

            {changingEmail && (
              <form
                className="space-y-5 rounded-3xl border border-[#d2d2d7]/50 bg-white/70 p-6"
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleUpdateEmail();
                }}
              >
                <div>
                  <label className="block text-sm font-bold text-[#86868b] uppercase tracking-wider mb-3">当前邮箱</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-6 py-4 rounded-2xl bg-[#f5f5f7] text-[17px] font-bold text-[#1d1d1f]/50 cursor-not-allowed outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#86868b] uppercase tracking-wider mb-3">新邮箱</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(event) => setNewEmail(event.target.value)}
                    autoComplete="email"
                    className="w-full px-6 py-4 rounded-2xl bg-[#f5f5f7] border-2 border-transparent focus:bg-white focus:border-[#0071e3] text-[17px] font-bold outline-none transition-all"
                    placeholder="输入新的邮箱地址"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#86868b] uppercase tracking-wider mb-3">当前密码</label>
                  <input
                    type="password"
                    value={emailPassword}
                    onChange={(event) => setEmailPassword(event.target.value)}
                    autoComplete="current-password"
                    className="w-full px-6 py-4 rounded-2xl bg-[#f5f5f7] border-2 border-transparent focus:bg-white focus:border-[#0071e3] text-[17px] font-bold outline-none transition-all"
                    placeholder="用于确认身份"
                  />
                </div>
                {emailMessage && (
                  <p className={`text-sm font-bold ${emailMessage.type === 'success' ? 'text-[#34c759]' : 'text-[#ff3b30]'}`}>
                    {emailMessage.text}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={emailUpdating}
                  className="px-8 py-4 bg-[#1d1d1f] text-white rounded-2xl text-[16px] font-bold hover:bg-black transition-all active:scale-95 disabled:opacity-50"
                >
                  {emailUpdating ? '正在发送...' : '发送验证邮件'}
                </button>
              </form>
            )}

            <div className="flex items-center justify-between p-6 bg-[#f5f5f7] rounded-3xl opacity-50">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#86868b] shadow-sm">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[17px] font-bold text-[#1d1d1f]">手机绑定</p>
                  <p className="text-sm text-[#86868b] font-medium">尚未开启，增加账号安全等级</p>
                </div>
              </div>
              <button className="text-[15px] font-bold text-[#0071e3] hover:underline">立即绑定</button>
            </div>
          </div>
        </section>

        {/* Sessions */}
        <div className="p-8 text-center">
          <p className="text-sm text-[#86868b] font-medium mb-4">
            觉得账号有异常？您可以强制退出所有其他设备的登录。
          </p>
          <button className="text-sm font-bold text-[#ff3b30] hover:underline">
            退出所有其他设备
          </button>
        </div>
      </div>
    </div>
  );
}
