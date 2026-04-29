const AUTH_ERROR_MAP: Record<string, string> = {
  'Invalid login credentials': '邮箱或密码错误，请检查后重试。',
  'Email not confirmed': '邮箱还未验证，请先完成邮箱验证。',
  'User already registered': '这个邮箱已经注册过了。',
  'Signup disabled': '当前暂不允许注册，请稍后再试。',
  'Unable to validate email address: invalid format': '邮箱格式不正确，请检查后重试。',
  'For security purposes, you can only request this once every 60 seconds': '发送太频繁了，请 60 秒后再试。',
  'The new password should be different from the old password': '新密码不能和旧密码相同。',
  'User not found': '未找到该账号，请先注册。',
};

const AUTH_ERROR_PATTERNS: Array<[RegExp, string]> = [
  [/invalid login credentials/i, '邮箱或密码错误，请检查后重试。'],
  [/email not confirmed/i, '邮箱还未验证，请先完成邮箱验证。'],
  [/user already registered/i, '这个邮箱已经注册过了。'],
  [/signup disabled/i, '当前暂不允许注册，请稍后再试。'],
  [/rate limit|too many requests|frequency limited/i, '操作太频繁了，请稍后再试。'],
  [/confirm.*email/i, '请先完成邮箱验证。'],
  [/535.*login fail/i, '邮箱登录失败，请检查授权码、SMTP 服务或邮箱状态。'],
  [/password.*incorrect|wrong password/i, '邮箱或密码错误，请检查后重试。'],
];

function normalizeMessage(message: unknown) {
  if (!message) return '';
  if (typeof message === 'string') return message;
  if (message instanceof Error) return message.message || '';
  if (typeof message === 'object') {
    const anyMessage = message as { message?: unknown; error?: unknown; msg?: unknown };
    return String(anyMessage.message ?? anyMessage.error ?? anyMessage.msg ?? '');
  }
  return String(message);
}

export function translateAuthError(message?: unknown) {
  const text = normalizeMessage(message).trim();
  if (!text) return null;

  const exact = AUTH_ERROR_MAP[text];
  if (exact) return exact;

  for (const [pattern, translated] of AUTH_ERROR_PATTERNS) {
    if (pattern.test(text)) {
      return translated;
    }
  }

  return text;
}
