/**
 * 海报模板数据
 * 每个模板包含背景配置和预设元素
 */

export interface PosterTemplateElement {
  type: 'text' | 'image' | 'rect' | 'circle';
  props: Record<string, any>;
}

export interface PosterTemplate {
  id: string;
  name: string;
  category: 'recruit' | 'activity' | 'course' | 'festival' | 'simple';
  description: string;
  thumbnail: string; // 模板预览图（渐变色或背景色描述）
  width: number;
  height: number;
  background: {
    type: 'color' | 'gradient' | 'image';
    value: string;
  };
  elements: PosterTemplateElement[];
}

// 预设颜色
const COLORS = {
  primary: '#6366f1', // 靛蓝
  secondary: '#ec4899', // 粉红
  accent: '#f59e0b', // 琥珀
  success: '#10b981', // 翠绿
  warning: '#f97316', // 橙色
  blue: '#3b82f6',
  purple: '#8b5cf6',
  pink: '#ec4899',
  red: '#ef4444',
  orange: '#f97316',
  yellow: '#eab308',
  green: '#22c55e',
  teal: '#14b8a6',
  cyan: '#06b6d4',
  white: '#ffffff',
  black: '#000000',
  gray: '#6b7280',
  lightGray: '#f3f4f6',
  darkGray: '#374151',
};

// 字体预设
const FONTS = {
  title: 'bold 48px "Microsoft YaHei", "PingFang SC", sans-serif',
  subtitle: '32px "Microsoft YaHei", "PingFang SC", sans-serif',
  body: '24px "Microsoft YaHei", "PingFang SC", sans-serif',
  small: '18px "Microsoft YaHei", "PingFang SC", sans-serif',
};

export const POSTER_TEMPLATES: PosterTemplate[] = [
  // ========== 简约风格 ==========
  {
    id: 'simple-gradient-1',
    name: '简约渐变-蓝紫',
    category: 'simple',
    description: '简约渐变背景，适合各类宣传',
    thumbnail: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    width: 750,
    height: 1334,
    background: {
      type: 'gradient',
      value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    elements: [
      {
        type: 'text',
        props: {
          text: '点击编辑标题',
          left: 60,
          top: 200,
          fontSize: 64,
          fontWeight: 'bold',
          fill: '#ffffff',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
      {
        type: 'text',
        props: {
          text: '点击编辑副标题',
          left: 60,
          top: 290,
          fontSize: 36,
          fill: 'rgba(255,255,255,0.9)',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
      {
        type: 'rect',
        props: {
          left: 60,
          top: 360,
          width: 120,
          height: 6,
          fill: '#ffffff',
          rx: 3,
          ry: 3,
        },
      },
      {
        type: 'text',
        props: {
          text: '联系电话：138-xxxx-xxxx',
          left: 60,
          top: 1100,
          fontSize: 28,
          fill: '#ffffff',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
      {
        type: 'text',
        props: {
          text: '地址：点击编辑地址',
          left: 60,
          top: 1150,
          fontSize: 24,
          fill: 'rgba(255,255,255,0.8)',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
    ],
  },
  {
    id: 'simple-gradient-2',
    name: '简约渐变-粉橙',
    category: 'simple',
    description: '温暖渐变背景，适合艺术类机构',
    thumbnail: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    width: 750,
    height: 1334,
    background: {
      type: 'gradient',
      value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    },
    elements: [
      {
        type: 'text',
        props: {
          text: '春季招生',
          left: 60,
          top: 200,
          fontSize: 72,
          fontWeight: 'bold',
          fill: '#ffffff',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
      {
        type: 'text',
        props: {
          text: '限时优惠 · 名额有限',
          left: 60,
          top: 300,
          fontSize: 32,
          fill: 'rgba(255,255,255,0.9)',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
      {
        type: 'text',
        props: {
          text: '报名热线：138-xxxx-xxxx',
          left: 60,
          top: 1100,
          fontSize: 28,
          fill: '#ffffff',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
    ],
  },
  {
    id: 'simple-gradient-3',
    name: '简约渐变-青绿',
    category: 'simple',
    description: '清新渐变背景，适合体育类机构',
    thumbnail: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    width: 750,
    height: 1334,
    background: {
      type: 'gradient',
      value: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    },
    elements: [
      {
        type: 'text',
        props: {
          text: '暑期集训营',
          left: 60,
          top: 200,
          fontSize: 68,
          fontWeight: 'bold',
          fill: '#ffffff',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
      {
        type: 'text',
        props: {
          text: '专业教练 · 科学训练',
          left: 60,
          top: 300,
          fontSize: 32,
          fill: 'rgba(255,255,255,0.9)',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
      {
        type: 'text',
        props: {
          text: '咨询热线：138-xxxx-xxxx',
          left: 60,
          top: 1100,
          fontSize: 28,
          fill: '#ffffff',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
    ],
  },

  // ========== 招生海报 ==========
  {
    id: 'recruit-art-1',
    name: '艺术招生-蓝色',
    category: 'recruit',
    description: '艺术培训机构招生海报',
    thumbnail: 'linear-gradient(180deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%)',
    width: 750,
    height: 1334,
    background: {
      type: 'gradient',
      value: 'linear-gradient(180deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%)',
    },
    elements: [
      {
        type: 'text',
        props: {
          text: '2025',
          left: 60,
          top: 100,
          fontSize: 48,
          fill: 'rgba(255,255,255,0.6)',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
      {
        type: 'text',
        props: {
          text: '春季艺术招生',
          left: 60,
          top: 180,
          fontSize: 64,
          fontWeight: 'bold',
          fill: '#ffffff',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
      {
        type: 'text',
        props: {
          text: '钢琴 | 舞蹈 | 美术 | 声乐',
          left: 60,
          top: 280,
          fontSize: 28,
          fill: 'rgba(255,255,255,0.9)',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
      {
        type: 'rect',
        props: {
          left: 60,
          top: 350,
          width: 200,
          height: 4,
          fill: '#fbbf24',
          rx: 2,
          ry: 2,
        },
      },
      {
        type: 'text',
        props: {
          text: '专业师资 · 小班教学 · 环境优美',
          left: 60,
          top: 400,
          fontSize: 26,
          fill: 'rgba(255,255,255,0.85)',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
      {
        type: 'text',
        props: {
          text: '前50名报名享8折优惠',
          left: 60,
          top: 500,
          fontSize: 32,
          fontWeight: 'bold',
          fill: '#fbbf24',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
      {
        type: 'text',
        props: {
          text: '报名热线',
          left: 60,
          top: 1050,
          fontSize: 24,
          fill: 'rgba(255,255,255,0.7)',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
      {
        type: 'text',
        props: {
          text: '138-xxxx-xxxx',
          left: 60,
          top: 1090,
          fontSize: 36,
          fontWeight: 'bold',
          fill: '#ffffff',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
      {
        type: 'text',
        props: {
          text: '地址：点击编辑详细地址',
          left: 60,
          top: 1160,
          fontSize: 22,
          fill: 'rgba(255,255,255,0.7)',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
    ],
  },
  {
    id: 'recruit-sport-1',
    name: '体育招生-活力橙',
    category: 'recruit',
    description: '体育培训机构招生海报',
    thumbnail: 'linear-gradient(180deg, #f97316 0%, #ea580c 100%)',
    width: 750,
    height: 1334,
    background: {
      type: 'gradient',
      value: 'linear-gradient(180deg, #f97316 0%, #ea580c 100%)',
    },
    elements: [
      {
        type: 'text',
        props: {
          text: '少儿体适能',
          left: 60,
          top: 180,
          fontSize: 68,
          fontWeight: 'bold',
          fill: '#ffffff',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
      {
        type: 'text',
        props: {
          text: '暑期特训营',
          left: 60,
          top: 280,
          fontSize: 48,
          fill: 'rgba(255,255,255,0.95)',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
      {
        type: 'rect',
        props: {
          left: 60,
          top: 360,
          width: 180,
          height: 6,
          fill: '#fbbf24',
          rx: 3,
          ry: 3,
        },
      },
      {
        type: 'text',
        props: {
          text: '专业教练团队',
          left: 60,
          top: 420,
          fontSize: 28,
          fill: '#ffffff',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
      {
        type: 'text',
        props: {
          text: '科学训练体系',
          left: 60,
          top: 470,
          fontSize: 28,
          fill: '#ffffff',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
      {
        type: 'text',
        props: {
          text: '全面提升体能',
          left: 60,
          top: 520,
          fontSize: 28,
          fill: '#ffffff',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
      {
        type: 'text',
        props: {
          text: '报名即送运动装备一套',
          left: 60,
          top: 620,
          fontSize: 32,
          fontWeight: 'bold',
          fill: '#fef3c7',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
      {
        type: 'text',
        props: {
          text: '咨询热线：138-xxxx-xxxx',
          left: 60,
          top: 1100,
          fontSize: 28,
          fill: '#ffffff',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
    ],
  },

  // ========== 活动海报 ==========
  {
    id: 'activity-trial-1',
    name: '体验课活动',
    category: 'activity',
    description: '免费体验课活动海报',
    thumbnail: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    width: 750,
    height: 1334,
    background: {
      type: 'gradient',
      value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    elements: [
      {
        type: 'circle',
        props: {
          left: 550,
          top: 80,
          radius: 80,
          fill: '#fbbf24',
        },
      },
      {
        type: 'text',
        props: {
          text: '免费',
          left: 555,
          top: 110,
          fontSize: 36,
          fontWeight: 'bold',
          fill: '#ffffff',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
          originX: 'center',
        },
      },
      {
        type: 'text',
        props: {
          text: '体验课',
          left: 555,
          top: 150,
          fontSize: 24,
          fill: '#ffffff',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
          originX: 'center',
        },
      },
      {
        type: 'text',
        props: {
          text: '周末体验课',
          left: 60,
          top: 200,
          fontSize: 64,
          fontWeight: 'bold',
          fill: '#ffffff',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
      {
        type: 'text',
        props: {
          text: '邀您零距离感受',
          left: 60,
          top: 290,
          fontSize: 36,
          fill: 'rgba(255,255,255,0.9)',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
      {
        type: 'rect',
        props: {
          left: 60,
          top: 360,
          width: 150,
          height: 5,
          fill: '#fbbf24',
          rx: 2,
          ry: 2,
        },
      },
      {
        type: 'text',
        props: {
          text: '活动时间：每周六/日',
          left: 60,
          top: 420,
          fontSize: 26,
          fill: '#ffffff',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
      {
        type: 'text',
        props: {
          text: '活动地点：点击编辑地址',
          left: 60,
          top: 470,
          fontSize: 26,
          fill: '#ffffff',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
      {
        type: 'text',
        props: {
          text: '适合年龄：4-12岁',
          left: 60,
          top: 520,
          fontSize: 26,
          fill: '#ffffff',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
      {
        type: 'text',
        props: {
          text: '预约热线：138-xxxx-xxxx',
          left: 60,
          top: 1100,
          fontSize: 28,
          fontWeight: 'bold',
          fill: '#ffffff',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
    ],
  },
  {
    id: 'activity-open-day',
    name: '开放日活动',
    category: 'activity',
    description: '机构开放日活动海报',
    thumbnail: 'linear-gradient(180deg, #0ea5e9 0%, #0284c7 100%)',
    width: 750,
    height: 1334,
    background: {
      type: 'gradient',
      value: 'linear-gradient(180deg, #0ea5e9 0%, #0284c7 100%)',
    },
    elements: [
      {
        type: 'text',
        props: {
          text: '校园开放日',
          left: 60,
          top: 200,
          fontSize: 68,
          fontWeight: 'bold',
          fill: '#ffffff',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
      {
        type: 'text',
        props: {
          text: '诚邀您莅临参观',
          left: 60,
          top: 300,
          fontSize: 36,
          fill: 'rgba(255,255,255,0.9)',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
      {
        type: 'text',
        props: {
          text: '时间：xxxx年x月x日',
          left: 60,
          top: 420,
          fontSize: 28,
          fill: '#ffffff',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
      {
        type: 'text',
        props: {
          text: '地址：点击编辑地址',
          left: 60,
          top: 470,
          fontSize: 28,
          fill: '#ffffff',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
      {
        type: 'text',
        props: {
          text: '预约电话：138-xxxx-xxxx',
          left: 60,
          top: 1100,
          fontSize: 28,
          fontWeight: 'bold',
          fill: '#ffffff',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
    ],
  },

  // ========== 课程介绍 ==========
  {
    id: 'course-piano',
    name: '钢琴课程',
    category: 'course',
    description: '钢琴课程介绍海报',
    thumbnail: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
    width: 750,
    height: 1334,
    background: {
      type: 'gradient',
      value: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
    },
    elements: [
      {
        type: 'text',
        props: {
          text: '钢琴',
          left: 60,
          top: 180,
          fontSize: 80,
          fontWeight: 'bold',
          fill: '#ffffff',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
      {
        type: 'text',
        props: {
          text: '一对一精品课程',
          left: 60,
          top: 290,
          fontSize: 36,
          fill: 'rgba(255,255,255,0.9)',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
      {
        type: 'rect',
        props: {
          left: 60,
          top: 360,
          width: 180,
          height: 4,
          fill: '#c4b5fd',
          rx: 2,
          ry: 2,
        },
      },
      {
        type: 'text',
        props: {
          text: '适合年龄：4岁以上',
          left: 60,
          top: 420,
          fontSize: 26,
          fill: '#e0e7ff',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
      {
        type: 'text',
        props: {
          text: '课程时长：45分钟/节',
          left: 60,
          top: 470,
          fontSize: 26,
          fill: '#e0e7ff',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
      {
        type: 'text',
        props: {
          text: '教学特色：',
          left: 60,
          top: 550,
          fontSize: 28,
          fontWeight: 'bold',
          fill: '#c4b5fd',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
      {
        type: 'text',
        props: {
          text: '• 专业音乐学院师资',
          left: 60,
          top: 600,
          fontSize: 24,
          fill: '#e0e7ff',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
      {
        type: 'text',
        props: {
          text: '• 因材施教，定制化教学',
          left: 60,
          top: 645,
          fontSize: 24,
          fill: '#e0e7ff',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
      {
        type: 'text',
        props: {
          text: '• 定期举办学员音乐会',
          left: 60,
          top: 690,
          fontSize: 24,
          fill: '#e0e7ff',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
      {
        type: 'text',
        props: {
          text: '预约试听：138-xxxx-xxxx',
          left: 60,
          top: 1100,
          fontSize: 28,
          fontWeight: 'bold',
          fill: '#ffffff',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
    ],
  },
  {
    id: 'course-dance',
    name: '舞蹈课程',
    category: 'course',
    description: '舞蹈课程介绍海报',
    thumbnail: 'linear-gradient(180deg, #be185d 0%, #db2777 50%, #ec4899 100%)',
    width: 750,
    height: 1334,
    background: {
      type: 'gradient',
      value: 'linear-gradient(180deg, #be185d 0%, #db2777 50%, #ec4899 100%)',
    },
    elements: [
      {
        type: 'text',
        props: {
          text: '少儿舞蹈',
          left: 60,
          top: 180,
          fontSize: 72,
          fontWeight: 'bold',
          fill: '#ffffff',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
      {
        type: 'text',
        props: {
          text: '中国舞 | 芭蕾 | 街舞',
          left: 60,
          top: 280,
          fontSize: 32,
          fill: 'rgba(255,255,255,0.9)',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
      {
        type: 'rect',
        props: {
          left: 60,
          top: 350,
          width: 200,
          height: 4,
          fill: '#fdf2f8',
          rx: 2,
          ry: 2,
        },
      },
      {
        type: 'text',
        props: {
          text: '塑造优雅气质',
          left: 60,
          top: 420,
          fontSize: 28,
          fill: '#ffffff',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
      {
        type: 'text',
        props: {
          text: '培养艺术修养',
          left: 60,
          top: 470,
          fontSize: 28,
          fill: '#ffffff',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
      {
        type: 'text',
        props: {
          text: '增强身体协调性',
          left: 60,
          top: 520,
          fontSize: 28,
          fill: '#ffffff',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
      {
        type: 'text',
        props: {
          text: '咨询热线：138-xxxx-xxxx',
          left: 60,
          top: 1100,
          fontSize: 28,
          fontWeight: 'bold',
          fill: '#ffffff',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
    ],
  },

  // ========== 节日海报 ==========
  {
    id: 'festival-newyear',
    name: '新年活动',
    category: 'festival',
    description: '新年促销活动海报',
    thumbnail: 'linear-gradient(180deg, #dc2626 0%, #b91c1c 100%)',
    width: 750,
    height: 1334,
    background: {
      type: 'gradient',
      value: 'linear-gradient(180deg, #dc2626 0%, #b91c1c 100%)',
    },
    elements: [
      {
        type: 'text',
        props: {
          text: '2025',
          left: 60,
          top: 120,
          fontSize: 56,
          fill: '#fef08a',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
      {
        type: 'text',
        props: {
          text: '新年大促',
          left: 60,
          top: 200,
          fontSize: 72,
          fontWeight: 'bold',
          fill: '#ffffff',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
      {
        type: 'text',
        props: {
          text: '限时特惠',
          left: 60,
          top: 300,
          fontSize: 48,
          fill: '#fef08a',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
      {
        type: 'text',
        props: {
          text: '报名享新年专属优惠',
          left: 60,
          top: 400,
          fontSize: 32,
          fill: '#ffffff',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
      {
        type: 'text',
        props: {
          text: '活动时间：即日起至x月x日',
          left: 60,
          top: 480,
          fontSize: 26,
          fill: 'rgba(255,255,255,0.9)',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
      {
        type: 'text',
        props: {
          text: '咨询热线：138-xxxx-xxxx',
          left: 60,
          top: 1100,
          fontSize: 28,
          fontWeight: 'bold',
          fill: '#ffffff',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
    ],
  },
  {
    id: 'festival-children',
    name: '六一儿童节',
    category: 'festival',
    description: '六一儿童节活动海报',
    thumbnail: 'linear-gradient(135deg, #f472b6 0%, #a78bfa 50%, #60a5fa 100%)',
    width: 750,
    height: 1334,
    background: {
      type: 'gradient',
      value: 'linear-gradient(135deg, #f472b6 0%, #a78bfa 50%, #60a5fa 100%)',
    },
    elements: [
      {
        type: 'text',
        props: {
          text: '六一',
          left: 60,
          top: 160,
          fontSize: 80,
          fontWeight: 'bold',
          fill: '#ffffff',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
      {
        type: 'text',
        props: {
          text: '儿童节特惠',
          left: 60,
          top: 270,
          fontSize: 48,
          fill: '#fef08a',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
      {
        type: 'rect',
        props: {
          left: 60,
          top: 350,
          width: 200,
          height: 5,
          fill: 'rgba(255,255,255,0.6)',
          rx: 2,
          ry: 2,
        },
      },
      {
        type: 'text',
        props: {
          text: '报名享专属折扣',
          left: 60,
          top: 420,
          fontSize: 32,
          fill: '#ffffff',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
      {
        type: 'text',
        props: {
          text: '赠送精美礼品',
          left: 60,
          top: 470,
          fontSize: 32,
          fill: '#ffffff',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
      {
        type: 'text',
        props: {
          text: '咨询热线：138-xxxx-xxxx',
          left: 60,
          top: 1100,
          fontSize: 28,
          fontWeight: 'bold',
          fill: '#ffffff',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
    ],
  },
  {
    id: 'festival-mothers',
    name: '母亲节',
    category: 'festival',
    description: '母亲节活动海报',
    thumbnail: 'linear-gradient(180deg, #fda4af 0%, #fb7185 50%, #f43f5e 100%)',
    width: 750,
    height: 1334,
    background: {
      type: 'gradient',
      value: 'linear-gradient(180deg, #fda4af 0%, #fb7185 50%, #f43f5e 100%)',
    },
    elements: [
      {
        type: 'text',
        props: {
          text: '母亲节',
          left: 60,
          top: 180,
          fontSize: 72,
          fontWeight: 'bold',
          fill: '#ffffff',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
      {
        type: 'text',
        props: {
          text: '感恩献礼',
          left: 60,
          top: 280,
          fontSize: 48,
          fill: '#fef08a',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
      {
        type: 'text',
        props: {
          text: '母女同行，一人免单',
          left: 60,
          top: 400,
          fontSize: 32,
          fill: '#ffffff',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
      {
        type: 'text',
        props: {
          text: '给妈妈最好的礼物',
          left: 60,
          top: 460,
          fontSize: 28,
          fill: 'rgba(255,255,255,0.9)',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
      {
        type: 'text',
        props: {
          text: '咨询热线：138-xxxx-xxxx',
          left: 60,
          top: 1100,
          fontSize: 28,
          fontWeight: 'bold',
          fill: '#ffffff',
          fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        },
      },
    ],
  },
];

// 获取模板分类
export const TEMPLATE_CATEGORIES = [
  { id: 'all', name: '全部', icon: '📋' },
  { id: 'simple', name: '简约风格', icon: '🎨' },
  { id: 'recruit', name: '招生海报', icon: '📢' },
  { id: 'activity', name: '活动宣传', icon: '🎉' },
  { id: 'course', name: '课程介绍', icon: '📚' },
  { id: 'festival', name: '节日促销', icon: '🎊' },
];

// 根据分类筛选模板
export function getTemplatesByCategory(category: string): PosterTemplate[] {
  if (category === 'all') return POSTER_TEMPLATES;
  return POSTER_TEMPLATES.filter(t => t.category === category);
}
