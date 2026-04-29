import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Smartphone, Laptop, Download, Upload, CheckCircle2 } from 'lucide-react';

export default function SyncPage() {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState('刚刚');

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setLastSync('刚刚');
    }, 2000);
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
        <div className="w-16 h-16 rounded-[22px] bg-[#af52de]/10 flex items-center justify-center text-[#af52de]">
          <RefreshCw className={`w-8 h-8 ${syncing ? 'animate-spin' : ''}`} />
        </div>
        <div>
          <h1 className="text-[40px] font-black text-[#1d1d1f] tracking-tight">多端同步</h1>
          <p className="text-[17px] text-[#86868b] font-medium">上次同步时间：{lastSync}</p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Sync Action */}
        <section className="apple-card p-12 text-center">
          <div className="max-w-xs mx-auto">
            <h2 className="text-[24px] font-black text-[#1d1d1f] mb-4">保持数据最新</h2>
            <p className="text-[16px] text-[#86868b] font-medium mb-10 leading-relaxed">
              LexFlow 会在您每次完成学习后自动同步，您也可以在此手动触发强制同步。
            </p>
            <button
              onClick={handleSync}
              disabled={syncing}
              className={`w-full py-5 rounded-[24px] flex items-center justify-center gap-3 text-[18px] font-black transition-all active:scale-[0.98] shadow-xl ${
                syncing ? 'bg-[#f5f5f7] text-[#86868b]' : 'bg-[#1d1d1f] text-white hover:bg-black shadow-black/10'
              }`}
            >
              <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? '正在同步数据...' : '立即同步'}
            </button>
          </div>
        </section>

        {/* Linked Devices */}
        <section className="apple-card p-10">
          <h2 className="text-[20px] font-black text-[#1d1d1f] mb-8">已关联的设备</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-6 bg-[#f5f5f7] rounded-3xl border border-[#0071e3]/10">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#1d1d1f] shadow-sm">
                  <Laptop className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-[17px] font-bold text-[#1d1d1f]">Windows PC</p>
                    <span className="px-2 py-0.5 bg-[#0071e3]/10 text-[#0071e3] text-[10px] font-black rounded uppercase">当前设备</span>
                  </div>
                  <p className="text-sm text-[#86868b] font-medium">Edge 浏览器 · 上海, 中国</p>
                </div>
              </div>
              <CheckCircle2 className="w-6 h-6 text-[#34c759]" />
            </div>

            <div className="flex items-center justify-between p-6 bg-[#f5f5f7] rounded-3xl">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#1d1d1f] shadow-sm">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[17px] font-bold text-[#1d1d1f]">iPhone 15 Pro</p>
                  <p className="text-sm text-[#86868b] font-medium">Safari 浏览器 · 2小时前</p>
                </div>
              </div>
              <button className="text-[14px] font-bold text-[#ff3b30] hover:underline">移除</button>
            </div>
          </div>
        </section>

        {/* Data Portability */}
        <section className="apple-card p-10">
          <h2 className="text-[20px] font-black text-[#1d1d1f] mb-8">数据迁移</h2>
          <div className="grid grid-cols-2 gap-4">
            <button className="p-8 bg-[#f5f5f7] rounded-[32px] text-center group hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-[#d2d2d7]/30">
              <Download className="w-8 h-8 text-[#0071e3] mx-auto mb-4 group-hover:scale-110 transition-transform" />
              <p className="font-black text-[#1d1d1f]">导出数据</p>
              <p className="text-xs text-[#86868b] mt-1">JSON 格式备份</p>
            </button>
            <button className="p-8 bg-[#f5f5f7] rounded-[32px] text-center group hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-[#d2d2d7]/30">
              <Upload className="w-8 h-8 text-[#af52de] mx-auto mb-4 group-hover:scale-110 transition-transform" />
              <p className="font-black text-[#1d1d1f]">导入数据</p>
              <p className="text-xs text-[#86868b] mt-1">从备份文件恢复</p>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
