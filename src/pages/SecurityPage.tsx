import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Lock, Mail, Shield, Smartphone } from 'lucide-react';

export default function SecurityPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updating, setUpdating] = useState(false);

  const handleUpdatePassword = () => {
    setUpdating(true);
    setTimeout(() => {
      setUpdating(false);
      alert('密码更新成功');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }, 1500);
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
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-[#86868b] uppercase tracking-wider mb-3">当前密码</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
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
                className="w-full px-6 py-4 rounded-2xl bg-[#f5f5f7] border-2 border-transparent focus:bg-white focus:border-[#0071e3] text-[17px] font-bold outline-none transition-all"
                placeholder="重复输入新密码"
              />
            </div>
            <button
              onClick={handleUpdatePassword}
              disabled={updating}
              className="mt-4 px-8 py-4 bg-[#1d1d1f] text-white rounded-2xl text-[16px] font-bold hover:bg-black transition-all active:scale-95 disabled:opacity-50"
            >
              {updating ? '正在更新...' : '更新密码'}
            </button>
          </div>
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
              <button className="text-[15px] font-bold text-[#0071e3] hover:underline">更改邮箱</button>
            </div>

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
