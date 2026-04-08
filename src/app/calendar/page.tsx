"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Gift,
  Star,
  Heart,
  Sparkles,
  Bell,
  Clock,
  Zap,
  Sun,
  Flower2,
  TreePine,
} from "lucide-react";

// 固定节日（阳历）- 按月份分组
const fixedFestivals: Record<number, Array<{ month: number; day: number; name: string; desc: string; color: string }>> = {
  1: [
    { month: 1, day: 1, name: "元旦", desc: "新年招生季", color: "bg-red-100 text-red-600" },
  ],
  2: [
    { month: 2, day: 14, name: "情人节", desc: "亲子活动", color: "bg-pink-100 text-pink-600" },
  ],
  3: [
    { month: 3, day: 8, name: "妇女节", desc: "女神节活动", color: "bg-pink-100 text-pink-600" },
    { month: 3, day: 12, name: "植树节", desc: "环保主题", color: "bg-green-100 text-green-600" },
  ],
  4: [
    { month: 4, day: 4, name: "清明节", desc: "小长假招生", color: "bg-green-100 text-green-600" },
  ],
  5: [
    { month: 5, day: 1, name: "劳动节", desc: "五一促销", color: "bg-red-100 text-red-600" },
    { month: 5, day: 4, name: "青年节", desc: "主题活动", color: "bg-blue-100 text-blue-600" },
    { month: 5, day: 11, name: "母亲节", desc: "感恩活动（5月第2个周日）", color: "bg-pink-100 text-pink-600" },
  ],
  6: [
    { month: 6, day: 1, name: "儿童节", desc: "六一狂欢", color: "bg-orange-100 text-orange-600" },
    { month: 6, day: 15, name: "父亲节", desc: "感恩活动（6月第3个周日）", color: "bg-blue-100 text-blue-600" },
  ],
  7: [
    { month: 7, day: 1, name: "暑假开始", desc: "暑期招生高峰", color: "bg-yellow-100 text-yellow-600" },
  ],
  8: [
    { month: 8, day: 10, name: "七夕节", desc: "主题活动", color: "bg-pink-100 text-pink-600" },
  ],
  9: [
    { month: 9, day: 1, name: "开学季", desc: "秋季招生", color: "bg-blue-100 text-blue-600" },
    { month: 9, day: 10, name: "教师节", desc: "感恩教师", color: "bg-pink-100 text-pink-600" },
  ],
  10: [
    { month: 10, day: 1, name: "国庆节", desc: "十一促销", color: "bg-red-100 text-red-600" },
    { month: 10, day: 31, name: "万圣节", desc: "主题活动", color: "bg-orange-100 text-orange-600" },
  ],
  11: [
    { month: 11, day: 11, name: "双十一", desc: "年度大促", color: "bg-red-100 text-red-600" },
    { month: 11, day: 27, name: "感恩节", desc: "感恩活动（11月第4个周四）", color: "bg-orange-100 text-orange-600" },
  ],
  12: [
    { month: 12, day: 25, name: "圣诞节", desc: "节日活动", color: "bg-red-100 text-red-600" },
    { month: 12, day: 31, name: "跨年夜", desc: "年终活动", color: "bg-purple-100 text-purple-600" },
  ],
};

// 农历节日（按年份分组）
const lunarFestivals: Record<number, Array<{ month: number; day: number; name: string; desc: string; color: string }>> = {
  2026: [
    { month: 1, day: 29, name: "春节", desc: "新春招生", color: "bg-red-100 text-red-600" },
    { month: 2, day: 12, name: "元宵节", desc: "节日活动", color: "bg-orange-100 text-orange-600" },
    { month: 6, day: 19, name: "端午节", desc: "节日活动", color: "bg-green-100 text-green-600" },
    { month: 9, day: 25, name: "中秋节", desc: "节日活动", color: "bg-orange-100 text-orange-600" },
    { month: 10, day: 29, name: "重阳节", desc: "敬老活动", color: "bg-orange-100 text-orange-600" },
  ],
  2027: [
    { month: 2, day: 6, name: "春节", desc: "新春招生", color: "bg-red-100 text-red-600" },
    { month: 2, day: 20, name: "元宵节", desc: "节日活动", color: "bg-orange-100 text-orange-600" },
    { month: 6, day: 9, name: "端午节", desc: "节日活动", color: "bg-green-100 text-green-600" },
    { month: 9, day: 15, name: "中秋节", desc: "节日活动", color: "bg-orange-100 text-orange-600" },
    { month: 10, day: 19, name: "重阳节", desc: "敬老活动", color: "bg-orange-100 text-orange-600" },
  ],
};

const weekDays = ["日", "一", "二", "三", "四", "五", "六"];

export default function CalendarPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<number | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthKey = month + 1;

  // 获取当月天数和第一天是星期几
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  // 获取当月的节日
  const getEventsForMonth = () => {
    const events: Record<number, { name: string; desc: string; color: string }> = {};
    
    // 添加固定节日
    const fixed = fixedFestivals[monthKey];
    if (fixed) {
      fixed.forEach((f) => {
        events[f.day] = { name: f.name, desc: f.desc, color: f.color };
      });
    }

    // 添加农历节日
    const lunar = lunarFestivals[year];
    if (lunar) {
      lunar.forEach((f) => {
        if (f.month === monthKey) {
          events[f.day] = { name: f.name, desc: f.desc, color: f.color };
        }
      });
    }

    return events;
  };

  const events = getEventsForMonth();

  // 获取即将到来的节日
  const getUpcomingEvents = () => {
    const today = new Date();
    const upcoming: { date: string; name: string; desc: string; daysLeft: number }[] = [];
    
    // 检查未来60天内的节日
    for (let i = 0; i < 60; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() + i);
      const checkMonth = checkDate.getMonth() + 1;
      const checkDay = checkDate.getDate();
      const checkYear = checkDate.getFullYear();

      // 检查固定节日
      const fixedList = fixedFestivals[checkMonth];
      if (fixedList) {
        const fixed = fixedList.find((f) => f.day === checkDay);
        if (fixed) {
          upcoming.push({
            date: `${checkMonth}月${checkDay}日`,
            name: fixed.name,
            desc: fixed.desc,
            daysLeft: i,
          });
        }
      }

      // 检查农历节日
      const lunarList = lunarFestivals[checkYear];
      if (lunarList) {
        const lunar = lunarList.find(
          (f) => f.month === checkMonth && f.day === checkDay
        );
        if (lunar) {
          upcoming.push({
            date: `${checkMonth}月${checkDay}日`,
            name: lunar.name,
            desc: lunar.desc,
            daysLeft: i,
          });
        }
      }
    }

    return upcoming.slice(0, 5); // 返回最近5个
  };

  const upcomingEvents = getUpcomingEvents();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDate(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(null);
  };

  // 生成日历格子
  const generateCalendarDays = () => {
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const today = new Date();
  const isToday = (day: number) => {
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")} className="gap-1">
                <ArrowLeft className="w-4 h-4" />
                返回
              </Button>
              <div className="h-4 w-px bg-gray-200" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                  <CalendarIcon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">营销日历</h1>
                  <p className="text-xs text-gray-500">节日热点营销提醒</p>
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={goToToday}>
              今天
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：日历 */}
          <div className="lg:col-span-2">
            <Card className="bg-white border-0 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {year}年{month + 1}月
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={prevMonth}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={nextMonth}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* 星期标题 */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {weekDays.map((day) => (
                    <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* 日期格子 */}
                <div className="grid grid-cols-7 gap-1">
                  {generateCalendarDays().map((day, index) => {
                    const event = day ? events[day] : null;

                    return (
                      <div
                        key={index}
                        onClick={() => day && setSelectedDate(day)}
                        className={`min-h-20 p-1 rounded-lg transition-colors ${
                          day
                            ? selectedDate === day
                              ? "bg-blue-100 border-2 border-blue-500"
                              : isToday(day)
                              ? "bg-blue-50 border border-blue-200"
                              : "hover:bg-gray-50 cursor-pointer"
                            : ""
                        }`}
                      >
                        {day && (
                          <>
                            <div className={`text-sm font-medium mb-1 ${isToday(day) ? "text-blue-600" : "text-gray-900"}`}>
                              {day}
                            </div>
                            {event && (
                              <div className={`text-xs p-1 rounded ${event.color} truncate`}>
                                {event.name}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* 选中日期详情 */}
            {selectedDate && events[selectedDate] && (
              <Card className="bg-white border-0 shadow-sm mt-4">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl ${events[selectedDate].color} flex items-center justify-center`}>
                      <Gift className="w-7 h-7" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{events[selectedDate].name}</h3>
                      <p className="text-sm text-gray-500">{month + 1}月{selectedDate}日 · {events[selectedDate].desc}</p>
                    </div>
                    <Button onClick={() => {
                      router.push("/copywriting");
                    }}>
                      生成内容
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 右侧：即将到来的营销节点 */}
          <div>
            <Card className="bg-white border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-orange-500" />
                  <CardTitle className="text-base">即将到来</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingEvents.map((event, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                  >
                    <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{event.name}</span>
                        <Badge variant="secondary" className="text-xs">{event.date}</Badge>
                      </div>
                      <p className="text-sm text-gray-500">{event.desc}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-orange-600">{event.daysLeft}</div>
                      <div className="text-xs text-gray-500">天后</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* 营销建议 */}
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0 shadow-lg mt-4">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Sparkles className="w-5 h-5 text-white" />
                  <h3 className="font-semibold text-white">营销建议</h3>
                </div>
                <ul className="space-y-2 text-sm text-blue-100">
                  <li>• 提前7天开始预热宣传</li>
                  <li>• 制作节日专属海报和文案</li>
                  <li>• 设置节日限时优惠活动</li>
                  <li>• 结合热点制作短视频</li>
                </ul>
                <Button variant="secondary" size="sm" className="w-full mt-4" onClick={() => router.push("/templates")}>
                  查看节日模板
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
