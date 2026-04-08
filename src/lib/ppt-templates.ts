/**
 * PPT模板系统
 * 支持多种布局和风格
 */

// 布局类型
export type SlideLayoutType = 
  | 'cover'           // 封面页
  | 'toc'             // 目录页
  | 'section'         // 章节标题页
  | 'text-only'       // 纯文字页
  | 'text-image'      // 文字+图片（左文右图）
  | 'image-text'      // 图片+文字（左图右文）
  | 'two-column'      // 双栏布局
  | 'three-column'    // 三栏布局
  | 'quote'           // 引用/金句页
  | 'list'            // 列表页
  | 'features'        // 特点/优势展示
  | 'comparison'      // 对比页
  | 'timeline'        // 时间线
  | 'chart'           // 图表页
  | 'image-full'      // 全图页
  | 'summary'         // 总结页
  | 'ending';         // 结束页

// 主题风格
export interface PPTTheme {
  id: string;
  name: string;
  description: string;
  category: 'education' | 'business' | 'creative' | 'minimal' | 'tech';
  colors: {
    primary: string;      // 主色
    secondary: string;    // 辅色
    accent: string;       // 强调色
    background: string;   // 背景色
    text: string;         // 正文色
    title: string;        // 标题色
    subtitle: string;     // 副标题色
  };
  fonts: {
    title: string;
    body: string;
  };
  borderRadius: number;
}

// 预设主题
export const PPT_THEMES: Record<string, PPTTheme> = {
  // 教育培训风格
  'education-blue': {
    id: 'education-blue',
    name: '教育蓝',
    description: '专业教育风格，适合培训课件',
    category: 'education',
    colors: {
      primary: '1A5276',
      secondary: '3498DB',
      accent: 'E74C3C',
      background: 'FFFFFF',
      text: '2C3E50',
      title: '1A5276',
      subtitle: '5D6D7E',
    },
    fonts: {
      title: 'Microsoft YaHei',
      body: 'Microsoft YaHei',
    },
    borderRadius: 4,
  },
  'education-green': {
    id: 'education-green',
    name: '教育绿',
    description: '清新教育风格，适合幼儿园、小学',
    category: 'education',
    colors: {
      primary: '1E8449',
      secondary: '27AE60',
      accent: 'F39C12',
      background: 'F0FFF0',
      text: '1D3C30',
      title: '1E8449',
      subtitle: '5D7E6A',
    },
    fonts: {
      title: 'Microsoft YaHei',
      body: 'Microsoft YaHei',
    },
    borderRadius: 8,
  },
  'education-warm': {
    id: 'education-warm',
    name: '温馨橙',
    description: '温馨亲子风格，适合艺术类培训',
    category: 'education',
    colors: {
      primary: 'D35400',
      secondary: 'E67E22',
      accent: '9B59B6',
      background: 'FFFBF0',
      text: '5D4E37',
      title: 'D35400',
      subtitle: '7D6E57',
    },
    fonts: {
      title: 'Microsoft YaHei',
      body: 'Microsoft YaHei',
    },
    borderRadius: 12,
  },

  // 商务风格
  'business-dark': {
    id: 'business-dark',
    name: '商务深蓝',
    description: '专业商务风格，适合企业培训',
    category: 'business',
    colors: {
      primary: '1B4F72',
      secondary: '2874A6',
      accent: 'F39C12',
      background: 'FFFFFF',
      text: '2C3E50',
      title: '1B4F72',
      subtitle: '5D6D7E',
    },
    fonts: {
      title: 'Microsoft YaHei',
      body: 'Microsoft YaHei',
    },
    borderRadius: 0,
  },
  'business-light': {
    id: 'business-light',
    name: '商务简约',
    description: '简约商务风格，适合汇报演示',
    category: 'business',
    colors: {
      primary: '2C3E50',
      secondary: '34495E',
      accent: '3498DB',
      background: 'F8F9FA',
      text: '2C3E50',
      title: '2C3E50',
      subtitle: '7F8C8D',
    },
    fonts: {
      title: 'Microsoft YaHei',
      body: 'Microsoft YaHei',
    },
    borderRadius: 2,
  },

  // 创意风格
  'creative-purple': {
    id: 'creative-purple',
    name: '创意紫',
    description: '时尚创意风格，适合艺术、设计类',
    category: 'creative',
    colors: {
      primary: '8E44AD',
      secondary: '9B59B6',
      accent: 'E74C3C',
      background: 'FDFEFE',
      text: '34495E',
      title: '8E44AD',
      subtitle: '7D6E9E',
    },
    fonts: {
      title: 'Microsoft YaHei',
      body: 'Microsoft YaHei',
    },
    borderRadius: 16,
  },
  'creative-colorful': {
    id: 'creative-colorful',
    name: '多彩活力',
    description: '活力四射风格，适合活动、促销',
    category: 'creative',
    colors: {
      primary: 'E74C3C',
      secondary: 'F39C12',
      accent: '3498DB',
      background: 'FFFFFF',
      text: '2C3E50',
      title: 'E74C3C',
      subtitle: '7F8C8D',
    },
    fonts: {
      title: 'Microsoft YaHei',
      body: 'Microsoft YaHei',
    },
    borderRadius: 20,
  },

  // 极简风格
  'minimal-white': {
    id: 'minimal-white',
    name: '极简白',
    description: '极简主义风格，适合高端展示',
    category: 'minimal',
    colors: {
      primary: '2C3E50',
      secondary: '34495E',
      accent: 'E74C3C',
      background: 'FFFFFF',
      text: '2C3E50',
      title: '2C3E50',
      subtitle: '95A5A6',
    },
    fonts: {
      title: 'Microsoft YaHei',
      body: 'Microsoft YaHei',
    },
    borderRadius: 0,
  },

  // 科技风格
  'tech-blue': {
    id: 'tech-blue',
    name: '科技蓝',
    description: '科技感风格，适合技术培训',
    category: 'tech',
    colors: {
      primary: '0D47A1',
      secondary: '1976D2',
      accent: '00BCD4',
      background: 'FAFAFA',
      text: '37474F',
      title: '0D47A1',
      subtitle: '607D8B',
    },
    fonts: {
      title: 'Microsoft YaHei',
      body: 'Microsoft YaHei',
    },
    borderRadius: 4,
  },
};

// 幻灯片数据结构
export interface SlideData {
  layout: SlideLayoutType;
  title: string;
  subtitle?: string;
  content?: SlideContent;
  imageUrl?: string;
  imagePrompt?: string;
  notes?: string;
}

// 幻灯片内容
export interface SlideContent {
  // 文本内容
  paragraphs?: string[];
  // 列表项
  items?: string[];
  // 双栏内容
  leftColumn?: string[];
  rightColumn?: string[];
  // 三栏内容
  columns?: string[][];
  // 引用内容
  quote?: string;
  author?: string;
  // 时间线数据
  timeline?: { time: string; event: string }[];
  // 特点展示
  features?: { icon?: string; title: string; description: string }[];
  // 对比数据
  comparison?: { label: string; left: string; right: string }[];
  // 图表数据
  chartData?: { labels: string[]; values: number[] };
  // 章节列表（用于目录）
  sections?: { number: number; title: string }[];
}

// 内容分析结果
export interface ContentAnalysis {
  title: string;
  subtitle?: string;
  category: 'education' | 'business' | 'creative' | 'technical' | 'general';
  structure: {
    type: 'linear' | 'hierarchical' | 'modular';
    sections: ContentSection[];
  };
  suggestedTheme: string;
  estimatedSlides: number;
}

export interface ContentSection {
  title: string;
  level: number;
  content: string[];
  keyPoints: string[];
  suggestedLayout: SlideLayoutType;
}

// 获取推荐主题
export function getRecommendedTheme(category: string): string {
  const themeMap: Record<string, string> = {
    education: 'education-blue',
    business: 'business-dark',
    creative: 'creative-purple',
    technical: 'tech-blue',
    general: 'minimal-white',
  };
  return themeMap[category] || 'minimal-white';
}

// 获取推荐布局
export function getRecommendedLayout(
  contentType: string,
  contentLength: number,
  hasImage: boolean
): SlideLayoutType {
  if (contentType === 'title') return 'cover';
  if (contentType === 'toc') return 'toc';
  if (contentType === 'section') return 'section';
  if (contentType === 'quote') return 'quote';
  if (contentType === 'summary') return 'summary';
  
  if (hasImage) {
    return contentLength > 3 ? 'text-image' : 'image-full';
  }
  
  if (contentLength <= 2) return 'text-only';
  if (contentLength <= 4) return 'list';
  if (contentLength <= 6) return 'features';
  
  return 'two-column';
}

// 获取主题配置
export function getTheme(themeId: string): PPTTheme {
  return PPT_THEMES[themeId] || PPT_THEMES['minimal-white'];
}

// 获取所有主题列表
export function getThemeList(): { id: string; name: string; category: string }[] {
  return Object.values(PPT_THEMES).map(t => ({
    id: t.id,
    name: t.name,
    category: t.category,
  }));
}
