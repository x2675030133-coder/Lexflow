import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Bell, Volume2 } from 'lucide-react';
import { getSettings, saveSettings } from '../utils/settings';
import type { AppSettings } from '../utils/settings';

export default function PreferencesPage() {
  const [settings, setSettings] = useState<AppSettings>(getSettings());

  const updateSetting = (newSettings: Partial<AppSettings>) => {
    const next = saveSettings(newSettings);
    setSettings(next);
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
        <div className="w-16 h-16 rounded-[22px] bg-[#ff9500]/10 flex items-center justify-center text-[#ff9500]">
          <Bell className="w-8 h-8" />
        </div>
        <h1 className="text-[40px] font-black text-[#1d1d1f] tracking-tight">偏好设置</h1>
      </div>

      <div className="space-y-8">
        <section className="apple-card p-10">
          <h2 className="text-[20px] font-black text-[#1d1d1f] mb-8 flex items-center gap-3">
            <Bell className="w-5 h-5 text-[#0071e3]" /> 界面说明
          </h2>
          <div className="rounded-[28px] bg-[#f5f5f7] px-6 py-5">
            <p className="text-[17px] font-bold text-[#1d1d1f]">当前网站已固定为浅色外观</p>
            <p className="mt-2 text-[14px] font-medium text-[#6e6e73] leading-relaxed">
              主题切换功能已经移除，页面会统一使用浅色模式，避免深色状态下的文字发白和卡片发虚。
            </p>
          </div>
        </section>

        <section className="apple-card p-10">
          <h2 className="text-[20px] font-black text-[#1d1d1f] mb-8 flex items-center gap-3">
            <Volume2 className="w-5 h-5 text-[#34c759]" /> 发音偏好
          </h2>

          <div className="grid grid-cols-2 gap-4 mb-8">
            {(['us', 'uk'] as const).map((acc) => (
              <button
                key={acc}
                onClick={() => updateSetting({ accent: acc })}
                className={`p-6 rounded-[28px] border-2 text-left transition-all active:scale-95 ${
                  settings.accent === acc ? 'border-[#0071e3] bg-[#0071e3]/5' : 'border-transparent bg-[#f5f5f7] hover:bg-[#e8e8ed]'
                }`}
              >
                <div className="flex flex-col">
                  <span className="text-[17px] font-black text-[#1d1d1f]">
                    {acc === 'us' ? '美式英语 (US)' : '英式英语 (UK)'}
                  </span>
                  <span className="text-[13px] text-[#86868b] font-medium mt-1">
                    默认单词与句子发音
                  </span>
                </div>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between p-6 bg-[#f5f5f7] rounded-3xl">
            <div>
              <p className="text-[17px] font-bold text-[#1d1d1f]">复习提醒</p>
              <p className="text-sm text-[#86868b] font-medium">每天 20:00 提醒我复习</p>
            </div>
            <div
              className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-colors ${
                settings.notifications ? 'bg-[#34c759]' : 'bg-[#d2d2d7]'
              }`}
              onClick={() => updateSetting({ notifications: !settings.notifications })}
            >
              <div
                className={`w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${
                  settings.notifications ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </div>
          </div>
        </section>

        <div className="p-8 text-center space-y-4">
          <button
            onClick={() => {
              if (window.confirm('确定要恢复默认设置吗？')) {
                localStorage.removeItem('el_settings');
                window.location.reload();
              }
            }}
            className="text-sm font-bold text-[#0071e3] hover:underline"
          >
            恢复默认设置
          </button>
        </div>
      </div>
    </div>
  );
}
