import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail, LogOut, BookOpen, Clock, Flame, Target,
  TrendingUp, User, Lock, RefreshCw, ShieldCheck, ChevronRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getProgress, getDailyStats } from '../utils/storage';

const T = {
  signOut: '退出登录',
  wordsLearned: '已学单词',
  dayStreak: '连续天数',
  minutesStudied: '学习时长',
  avgAccuracy: '平均准确率',
  learningProgress: '学习进度',
  todayGoal: '今日目标',
  totalVocabulary: '总词量',
  wordsMastered: '个单词已掌握',
  recentActivity: '最近动态',
  learned: '已学',
  reviewed: '已复习',
  noRecords: '还没有学习记录，开始学习吧！',
  continueLearning: '继续学习',
  pickUp: '从上次停下的地方继续',
  signOutTitle: '确认退出？',
  signOutBody: '您的学习数据已安全保存，期待您的下次回归。',
  cancel: '取消',
  confirmSignOut: '安全退出',
};

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const progress = getProgress();
  const stats = getDailyStats();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    // 1. Immediate UI Feedback
    setShowLogoutConfirm(false);
    setIsLoggingOut(true);
    
    // 2. Perform sign out and navigation smoothly
    try {
      // Small delay to let the modal animation finish
      await new Promise(resolve => setTimeout(resolve, 300));
      await signOut();
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  const totalTimeMinutes = stats.reduce((sum, s) => sum + s.timeSpent, 0);
  const totalWords = progress.totalLearned;
  const avgCorrectRate = stats.length > 0
    ? Math.round(stats.reduce((sum, s) => sum + s.correctRate, 0) / stats.length)
    : 0;

  const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'Guest';

  useEffect(() => {
    if (!user && !isLoggingOut) {
      navigate('/login');
    }
  }, [user, navigate, isLoggingOut]);

  if (!user && !isLoggingOut) return null;

  const metrics = [
    { icon: BookOpen, label: '已学单词', value: totalWords, color: '#0071e3' },
    { icon: Flame, label: '连续天数', value: progress.streak, color: '#ff9500' },
    { icon: Clock, label: '学习时长', value: `${totalTimeMinutes}m`, color: '#34c759' },
    { icon: Target, label: '平均准确率', value: `${avgCorrectRate}%`, color: '#af52de' },
  ];

  const accountActions = [
    { label: '个人资料', icon: User, color: '#0071e3', path: '/help/account/profile' },
    { label: '安全性与密码', icon: Lock, color: '#34c759', path: '/help/account/security' },
    { label: '多端同步', icon: RefreshCw, color: '#af52de', path: '/help/account/sync' },
    { label: '偏好设置', icon: ShieldCheck, color: '#ff9500', path: '/help/account/preferences' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 text-[#1d1d1f] relative">
      {/* Loading Overlay for Logout */}
      {isLoggingOut && (
        <div className="fixed inset-0 z-[200] bg-white/80 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in duration-500 text-center">
          <div className="w-12 h-12 border-[3px] border-blue-600/10 border-t-blue-600 rounded-full animate-spin mb-6" />
          <h3 className="text-[20px] font-black text-[#1d1d1f] mb-1">正在安全退出</h3>
          <p className="text-[15px] text-[#86868b] font-medium">正在清理本地缓存并同步数据...</p>
        </div>
      )}

      {/* Profile Header */}
      <section className="apple-card p-8 mb-8 flex flex-col sm:flex-row items-center gap-8">
        <div className="w-24 h-24 bg-gradient-to-br from-[#0071e3] to-[#5856d6] rounded-[32px] flex items-center justify-center text-white text-4xl font-black shadow-xl shadow-blue-500/20">
          {username.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-[32px] font-black tracking-tight">{username}</h1>
          <div className="flex items-center justify-center sm:justify-start gap-2 text-[17px] text-[#86868b] font-medium mt-1">
            <Mail className="w-4 h-4" />
            {user?.email}
          </div>
        </div>
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="px-6 py-3 bg-[#ff3b30]/5 text-[#ff3b30] rounded-full text-[15px] font-black hover:bg-[#ff3b30]/10 transition-all flex items-center gap-2 active:scale-95"
        >
          <LogOut className="w-4 h-4" />
          {T.signOut}
        </button>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Stats Area */}
        <div className="lg:col-span-2 space-y-8">
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-4">
            {metrics.map((m, i) => (
               <div key={i} className="apple-card p-6 text-center group hover:scale-[1.02] transition-transform">
                 <div 
                   className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 mx-auto shadow-inner"
                   style={{ backgroundColor: `${m.color}10`, color: m.color }}
                 >
                   <m.icon className="w-6 h-6" />
                 </div>
                 <p className="text-[28px] font-black tracking-tight">{m.value}</p>
                 <p className="text-[13px] font-bold text-[#86868b] uppercase tracking-widest">{m.label}</p>
               </div>
            ))}
          </div>

          {/* Learning Progress */}
          <section className="apple-card p-8">
            <h2 className="text-[20px] font-black mb-8 flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-[#0071e3]" />
              {T.learningProgress}
            </h2>
            <div className="space-y-8">
              <div>
                <div className="flex justify-between text-[15px] font-bold mb-3">
                  <span className="text-[#86868b] uppercase tracking-wider">{T.todayGoal}</span>
                  <span>{progress.learnedToday} / {progress.dailyGoal}</span>
                </div>
                <div className="h-2.5 bg-[#f5f5f7] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#0071e3] rounded-full transition-all duration-1000 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
                    style={{ width: `${Math.min(100, (progress.learnedToday / (progress.dailyGoal || 1)) * 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[15px] font-bold mb-3">
                  <span className="text-[#86868b] uppercase tracking-wider">词库掌握度</span>
                  <span>{totalWords} / 8000</span>
                </div>
                <div className="h-2.5 bg-[#f5f5f7] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#34c759] rounded-full transition-all duration-1000 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
                    style={{ width: `${Math.min(100, (totalWords / 8000) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar / Account Management Area */}
        <div className="space-y-8">
          <section className="apple-card overflow-hidden">
            <div className="p-6 pb-2 border-b border-[#f5f5f7]">
              <h2 className="text-[14px] font-black tracking-tight text-[#86868b] uppercase tracking-widest">账号设置</h2>
            </div>
            <div className="divide-y divide-[#f5f5f7]">
              {accountActions.map((action, i) => (
                <Link 
                  key={i} 
                  to={action.path}
                  className="flex items-center justify-between p-5 hover:bg-[#f5f5f7] transition-colors no-underline group"
                >
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
                      style={{ backgroundColor: action.color }}
                    >
                      <action.icon size={18} />
                    </div>
                    <span className="text-[16px] font-bold text-[#1d1d1f]">{action.label}</span>
                  </div>
                  <ChevronRight size={18} className="text-[#d2d2d7] group-hover:text-[#1d1d1f] transition-all group-hover:translate-x-1" />
                </Link>
              ))}
            </div>
          </section>

          {/* Quick Start Link */}
          <Link
            to="/vocabulary/learn"
            className="block apple-card p-8 bg-gradient-to-br from-[#0071e3] to-[#5856d6] text-white no-underline hover:shadow-2xl transition-all hover:scale-[1.02] active:scale-95 group"
          >
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <BookOpen className="w-6 h-6" />
            </div>
            <p className="text-[22px] font-black tracking-tight mb-2">{T.continueLearning}</p>
            <p className="text-[15px] font-bold text-white/70">{T.pickUp}</p>
          </Link>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6" onClick={() => setShowLogoutConfirm(false)}>
          <div className="absolute inset-0 bg-black/20 backdrop-blur-md animate-in fade-in duration-300" />
          <div className="relative bg-white rounded-[40px] shadow-2xl max-w-sm w-full p-10 animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-[#ff3b30]/10 rounded-3xl flex items-center justify-center text-[#ff3b30] mb-6 mx-auto">
              <LogOut size={32} />
            </div>
            <h3 className="text-[24px] font-black text-[#1d1d1f] mb-3 tracking-tight text-center">{T.signOutTitle}</h3>
            <p className="text-[17px] text-[#86868b] font-medium leading-relaxed mb-10 text-center">{T.signOutBody}</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleLogout}
                className="w-full py-4 bg-[#ff3b30] text-white rounded-2xl text-[17px] font-black shadow-xl shadow-red-500/20 active:scale-95 transition-all"
              >
                {T.confirmSignOut}
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="w-full py-4 bg-[#f5f5f7] text-[#1d1d1f] rounded-2xl text-[17px] font-bold active:scale-95 transition-all"
              >
                {T.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
