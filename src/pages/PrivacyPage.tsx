export default function PrivacyPage() {
  return (
    <div className="max-w-[800px] mx-auto px-6 py-20 animate-in fade-in duration-700">
      <div className="mb-16">
        <h1 className="text-[48px] font-black text-[#1d1d1f] tracking-tight mb-4">隐私政策</h1>
        <p className="text-[19px] text-[#86868b] font-medium">最后更新日期：2026年4月24日</p>
      </div>
      
      <div className="space-y-16">
        <section>
          <h2 className="text-[28px] font-black text-[#1d1d1f] mb-6 tracking-tight">1. 信息收集</h2>
          <p className="text-[17px] text-[#1d1d1f] leading-relaxed font-medium">
            我们致力于保护您的个人隐私。我们收集的信息仅限于为您提供优质服务所必需的范围。这包括：
          </p>
          <ul className="mt-6 space-y-4 text-[17px] text-[#1d1d1f] font-medium">
            <li className="flex gap-3"><span className="text-[#0071e3] font-bold">•</span> <strong>账户信息：</strong> 电子邮箱地址、用户名及加密后的密码。</li>
            <li className="flex gap-3"><span className="text-[#0071e3] font-bold">•</span> <strong>学习数据：</strong> 学习进度、掌握的单词、听力练习记录及准确率统计。</li>
            <li className="flex gap-3"><span className="text-[#0071e3] font-bold">•</span> <strong>设备信息：</strong> IP 地址、设备类型及操作系统版本，用于保障账户安全及优化体验。</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[28px] font-black text-[#1d1d1f] mb-6 tracking-tight">2. 信息的使用方式</h2>
          <p className="text-[17px] text-[#1d1d1f] leading-relaxed font-medium">
            我们处理您的信息是为了：
          </p>
          <ul className="mt-6 space-y-4 text-[17px] text-[#1d1d1f] font-medium">
            <li className="flex gap-3"><span className="text-[#0071e3] font-bold">•</span> 提供并维护 LexFlow 的核心学习功能。</li>
            <li className="flex gap-3"><span className="text-[#0071e3] font-bold">•</span> 在您的多个设备之间同步学习状态。</li>
            <li className="flex gap-3"><span className="text-[#0071e3] font-bold">•</span> 个性化您的学习计划，推荐适合的练习内容。</li>
            <li className="flex gap-3"><span className="text-[#0071e3] font-bold">•</span> 发送重要的服务通知、安全警报及更新。</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[28px] font-black text-[#1d1d1f] mb-6 tracking-tight">3. 数据安全与存储</h2>
          <p className="text-[17px] text-[#1d1d1f] leading-relaxed font-medium">
            我们采用多层次的安全措施，包括 SSL/TLS 加密技术，来保护您的数据。您的个人信息存储在安全、受限访问的服务器上。我们将根据提供服务所需的时间保留您的信息，除非您要求注销账户。
          </p>
        </section>

        <section>
          <h2 className="text-[28px] font-black text-[#1d1d1f] mb-6 tracking-tight">4. 第三方服务与共享</h2>
          <p className="text-[17px] text-[#1d1d1f] leading-relaxed font-medium">
            LexFlow 绝不会将您的个人身份信息出售给第三方。我们可能会与协助我们运营服务的可信合作伙伴共享脱敏后的数据，这些合作伙伴同样受严格的隐私义务约束。
          </p>
        </section>

        <section>
          <h2 className="text-[28px] font-black text-[#1d1d1f] mb-6 tracking-tight">5. 您的权利</h2>
          <p className="text-[17px] text-[#1d1d1f] leading-relaxed font-medium">
            您有权随时访问、更正或删除您的个人信息。您可以通过应用内的设置页面管理您的偏好，或通过联系我们请求永久注销账户及其关联的所有数据。
          </p>
        </section>

        <div className="pt-12 border-t border-gray-100 text-center">
          <p className="text-[#86868b] text-[15px] font-medium">
            如果您对隐私政策有任何疑问，请垂询我们的支持团队。
          </p>
        </div>
      </div>
    </div>
  );
}
