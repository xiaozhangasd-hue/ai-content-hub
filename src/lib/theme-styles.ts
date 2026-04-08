// 主题相关的样式映射
// 使用方式: theme === 'dark' ? styles.dark.xxx : styles.light.xxx

export const themeStyles = {
  // 页面背景
  pageBg: {
    dark: "bg-gradient-to-br from-[#0a0e1a] via-[#0d1425] to-[#0a1628]",
    light: "bg-gradient-to-br from-slate-50 via-white to-blue-50/30",
  },
  
  // 导航背景
  headerBg: {
    dark: "bg-[#0d1425]/80 backdrop-blur-md",
    light: "bg-white/80 backdrop-blur-md",
  },
  
  // 卡片背景
  cardBg: {
    dark: "bg-white/[0.03] backdrop-blur-sm",
    light: "bg-white/80 backdrop-blur-sm",
  },
  
  // 卡片边框
  cardBorder: {
    dark: "border-white/5",
    light: "border-gray-200/50",
  },
  
  // 文字颜色 - 主标题
  textPrimary: {
    dark: "text-white",
    light: "text-gray-900",
  },
  
  // 文字颜色 - 正文
  textSecondary: {
    dark: "text-gray-300",
    light: "text-gray-600",
  },
  
  // 文字颜色 - 辅助
  textMuted: {
    dark: "text-gray-400",
    light: "text-gray-500",
  },
  
  // 文字颜色 - 描述
  textDesc: {
    dark: "text-gray-500",
    light: "text-gray-400",
  },
  
  // 输入框背景
  inputBg: {
    dark: "bg-white/5 border-white/10",
    light: "bg-gray-50 border-gray-200",
  },
  
  // 按钮样式 (ghost变体)
  ghostBtn: {
    dark: "text-gray-400 hover:text-white hover:bg-white/5",
    light: "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
  },
  
  // 分隔线
  divider: {
    dark: "bg-white/10",
    light: "bg-gray-200",
  },
  
  // 光晕效果颜色
  glowColors: {
    dark: {
      blue: "bg-blue-500/15",
      purple: "bg-purple-500/10", 
      cyan: "bg-cyan-500/10",
      pink: "bg-pink-500/10",
      emerald: "bg-emerald-500/10",
      amber: "bg-amber-500/10",
    },
    light: {
      blue: "bg-blue-400/20",
      purple: "bg-purple-400/20",
      cyan: "bg-cyan-400/20", 
      pink: "bg-pink-400/20",
      emerald: "bg-emerald-400/20",
      amber: "bg-amber-400/20",
    }
  },
  
  // 状态标签
  badge: {
    dark: {
      blue: "bg-blue-500/20 text-blue-400",
      green: "bg-emerald-500/20 text-emerald-400",
      red: "bg-red-500/20 text-red-400",
      amber: "bg-amber-500/20 text-amber-400",
      purple: "bg-purple-500/20 text-purple-400",
    },
    light: {
      blue: "bg-blue-100 text-blue-700",
      green: "bg-green-100 text-green-700",
      red: "bg-red-100 text-red-700",
      amber: "bg-amber-100 text-amber-700",
      purple: "bg-purple-100 text-purple-700",
    }
  }
};

// 获取主题样式的辅助函数
export function getThemeStyle(
  theme: 'dark' | 'light',
  styleMap: { dark: string; light: string }
): string {
  return styleMap[theme];
}
