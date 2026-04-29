export default function TermsPage() {
  return (
    <div className="max-w-[800px] mx-auto px-6 py-20 animate-in fade-in duration-700">
      <div className="mb-16">
        <h1 className="text-[48px] font-black text-[#1d1d1f] tracking-tight mb-4">使用条款</h1>
        <p className="text-[19px] text-[#86868b] font-medium">最后更新日期：2026年4月24日</p>
      </div>
      
      <div className="space-y-16">
        <section>
          <h2 className="text-[28px] font-black text-[#1d1d1f] mb-6 tracking-tight">1. 接受条款</h2>
          <p className="text-[17px] text-[#1d1d1f] leading-relaxed font-medium">
            欢迎使用 LexFlow。通过访问、注册或使用我们的移动应用程序、网站或提供的任何其他服务（统称为“服务”），即表示您同意受本使用条款（“条款”）的约束。如果您不同意这些条款，请立即停止使用我们的服务。
          </p>
        </section>

        <section>
          <h2 className="text-[28px] font-black text-[#1d1d1f] mb-6 tracking-tight">2. 账户注册与安全</h2>
          <p className="text-[17px] text-[#1d1d1f] leading-relaxed font-medium">
            为了访问某些功能，您可能需要创建一个账户。您同意提供准确、完整且最新的信息。您对您账户下发生的所有活动负全部责任，并有责任保护您的账户凭据。如果发现任何未经授权使用账户的情况，请立即通知我们。
          </p>
        </section>

        <section>
          <h2 className="text-[28px] font-black text-[#1d1d1f] mb-6 tracking-tight">3. 用户行为准则</h2>
          <p className="text-[17px] text-[#1d1d1f] leading-relaxed font-medium">
            您同意不会以任何非法方式使用服务，或通过服务传播任何有害、侮辱或侵权的材料。禁止任何试图干扰服务正常运行或绕过我们的安全措施的行为。
          </p>
        </section>

        <section>
          <h2 className="text-[28px] font-black text-[#1d1d1f] mb-6 tracking-tight">4. 知识产权</h2>
          <p className="text-[17px] text-[#1d1d1f] leading-relaxed font-medium">
            LexFlow 提供的所有内容（包括文本、图形、徽标、音频片段、视频 and 软件）均属于 LexFlow 或其许可方的财产，受国际版权、商标及其他知识产权法律保护。未经明确书面许可，严禁复制、分发或商业化利用。
          </p>
        </section>

        <section>
          <h2 className="text-[28px] font-black text-[#1d1d1f] mb-6 tracking-tight">5. 服务的中断与终止</h2>
          <p className="text-[17px] text-[#1d1d1f] leading-relaxed font-medium">
            我们保留随时修改、暂停或终止服务的权利，无论是否提前通知。如果我们认为您违反了本条款，我们可能会单方面终止您的账户访问权限。
          </p>
        </section>

        <section>
          <h2 className="text-[28px] font-black text-[#1d1d1f] mb-6 tracking-tight">6. 免责声明与责任限制</h2>
          <p className="text-[17px] text-[#1d1d1f] leading-relaxed font-medium italic opacity-80">
            服务按“原样”和“可用性”提供，不提供任何形式的保证。在法律允许的最大范围内，LexFlow 不对因使用或无法使用服务而导致的任何直接、间接或附带损害负责。
          </p>
        </section>

        <section>
          <h2 className="text-[28px] font-black text-[#1d1d1f] mb-6 tracking-tight">7. 条款的修改</h2>
          <p className="text-[17px] text-[#1d1d1f] leading-relaxed font-medium">
            我们可能会不时更新本条款。更新后的条款将在发布时生效。继续使用 LexFlow 即表示您接受修改后的条款。
          </p>
        </section>

        <div className="pt-12 border-t border-gray-100 text-center">
          <p className="text-[#86868b] text-[15px] font-medium">
            如果您对这些条款有任何疑问，请联系我们的支持团队。
          </p>
        </div>
      </div>
    </div>
  );
}
