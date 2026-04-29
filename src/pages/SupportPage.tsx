import { Heart, QrCode, Sparkles } from 'lucide-react';
import { useState } from 'react';

const methods = [
  {
    id: 'alipay',
    label: '支付宝',
    tip: '开源版本未内置个人收款码，请按需配置自己的赞助方式。',
    color: 'from-blue-600 to-sky-500',
  },
  {
    id: 'wechat',
    label: '微信支付',
    tip: '开源版本未内置个人收款码，请按需配置自己的赞助方式。',
    color: 'from-emerald-500 to-green-500',
  },
];

export default function SupportPage() {
  const [active, setActive] = useState(methods[0]);

  return (
    <div className="min-h-[calc(100vh-64px)] px-4 py-16 text-[#1d1d1f] sm:px-6 animate-in fade-in duration-700">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <div className="reveal-1 mx-auto mb-4 inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-1.5 text-sm font-bold text-red-600 border border-red-100 shadow-sm backdrop-blur-md">
            <Heart size={16} className="animate-pulse" /> 赞助支持
          </div>
          <h1 className="reveal-2 text-[42px] font-black tracking-tight leading-tight sm:text-[54px]">
            喜欢 LexFlow？<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">请作者喝杯咖啡</span>
          </h1>
          <p className="reveal-3 mx-auto mt-6 max-w-2xl text-[18px] font-medium leading-relaxed text-[#86868b]">
            每一份心意都将直接用于优化词库、获取更优质的听力素材及维护服务器。感谢您的每一个“续航”举动。
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr]">
          <section className="reveal-1 apple-card flex min-h-[680px] flex-col justify-between p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-inner">
                <Sparkles size={22} />
              </div>
              <div>
                <h2 className="text-[21px] font-black tracking-tight text-[#1d1d1f]">选择支付方式</h2>
                <p className="text-[13px] font-medium text-[#86868b]">选一个你顺手的方式就行</p>
              </div>
            </div>

            <div className="grid gap-3 py-10">
              {methods.map((method) => {
                const selected = active.id === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setActive(method)}
                    className={`group flex min-h-[78px] w-full items-center justify-between gap-4 rounded-[20px] border-2 px-4 py-3 text-left transition-all duration-300 active:scale-95 ${selected ? 'border-blue-500 bg-blue-50/30 shadow-lg shadow-blue-500/5' : 'border-[#f5f5f7] bg-white hover:border-blue-200'}`}
                  >
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${method.color} text-white shadow-lg transition-transform duration-500 ${selected ? 'scale-105 rotate-3' : 'scale-100 opacity-85'}`}>
                      <QrCode size={18} />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="block text-[16px] font-black tracking-tight text-[#1d1d1f]">{method.label}</span>
                        <span className="rounded-full border border-[#e5e7eb] bg-[#fafafa] px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-[#9ca3af]">
                          {method.id}
                        </span>
                      </div>
                      <span className="mt-1 block max-w-[18rem] text-[12px] font-medium leading-snug text-[#86868b]">{method.tip}</span>
                    </div>

                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-black tracking-widest ${selected ? 'border-blue-200 bg-blue-50 text-blue-600' : 'border-[#e5e7eb] bg-white text-[#86868b]'}`}>
                      {selected ? '已选' : '切换'}
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="text-[12px] font-medium leading-relaxed text-[#9ca3af]">
              支付后会显示收款方信息，请确认无误再完成操作。
            </p>
          </section>

          <section className="reveal-2">
            <div className={`apple-card overflow-hidden p-2.5 shadow-2xl transition-all duration-700 ${active.id === 'alipay' ? 'shadow-blue-500/10' : 'shadow-green-500/10'}`}>
              <div className={`relative overflow-hidden rounded-[24px] bg-gradient-to-br ${active.color} p-6 text-white sm:p-8`}>
                {/* Background decorative elements */}
                <div className="absolute top-0 right-0 w-full h-full pointer-events-none opacity-20">
                  <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[100%] bg-white blur-[80px] rounded-full" />
                </div>

                <div className="relative z-10">
                  <div className="mb-7 flex items-center justify-between">
                    <div>
                      <p className="mb-2 text-[12px] font-black uppercase tracking-[0.28em] opacity-80">Support Project</p>
                      <h2 className="text-[34px] font-black tracking-tighter">{active.label}</h2>
                    </div>
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md animate-apple-pop">
                      <Heart size={30} fill="currentColor" className="text-white" />
                    </div>
                  </div>

                  <div className="rounded-[28px] bg-white p-4 shadow-2xl shadow-black/10 animate-in zoom-in-95 duration-500">
                    <div className="flex aspect-[3/4] max-h-[500px] w-full flex-col items-center justify-center rounded-[20px] border-2 border-dashed border-[#d1d5db] bg-[#f9fafb] px-8 text-center text-[#6b7280]">
                      <QrCode size={56} className="mb-5 text-[#9ca3af]" />
                      <p className="text-[18px] font-black text-[#1d1d1f]">赞助二维码未配置</p>
                      <p className="mt-3 text-[13px] font-medium leading-relaxed">
                        请在部署自己的版本时替换为你的收款方式，或移除此页面。
                      </p>
                    </div>
                  </div>

                  <div className="mt-7 text-center">
                    <p className="mb-1 text-[14px] font-black opacity-90">
                      请使用{active.label}扫码支付
                    </p>
                    <p className="text-[12px] font-bold opacity-60">
                      扫码后会显示收款方信息，请确认后再支付。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>

  );
}
