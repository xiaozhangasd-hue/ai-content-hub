import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * AI内容生成
 * POST /api/ai-assistant/generate
 * 
 * 请求体：
 * - sceneId: 场景ID
 * - templateId: 模板ID
 * - prompt: 用户输入的提示词
 * - options: 额外选项（如语言、风格等）
 */
export async function POST(request: NextRequest) {
  try {
    // 验证身份
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload || !payload.merchantId) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const merchantId = payload.merchantId;
    const teacherId = payload.teacherId;

    const body = await request.json();
    const { sceneId, templateId, prompt, options } = body;

    if (!sceneId || !templateId || !prompt) {
      return NextResponse.json({ error: "参数不完整" }, { status: 400 });
    }

    // 场景配置
    const sceneConfigs: Record<string, Record<string, (p: string, opts: Record<string, unknown>) => string>> = {
      recruitment: {
        poster: (p, opts) => `【招生海报】\n\n主题：${p}\n风格：${opts.style || "简约现代"}\n\n设计要点：\n1. 醒目的标题\n2. 课程亮点展示\n3. 优惠信息突出\n4. 联系方式清晰`,
        copywriting: (p, opts) => `【招生宣传文案】\n\n🎯 课程特色：\n${p}\n\n✨ 为什么选择我们？\n• 专业师资团队\n• 小班制教学\n• 个性化辅导\n\n🎁 限时优惠：\n报名立享8折优惠，更有精美礼品相送！\n\n📍 上课地点：[机构名称]\n📞 咨询热线：[联系电话]\n\n${opts.language === "en" ? "English version available upon request." : ""}`,
        video_script: (p, opts) => `【宣传视频脚本】\n\n主题：${p}\n时长：60秒\n\n【开场 0-5秒】\n镜头：机构外观/Logo\n字幕：让每个孩子都能绽放光芒\n\n【课程展示 5-30秒】\n镜头：课堂教学场景\n字幕：专业课程体系，助力成长\n\n【学员风采 30-50秒】\n镜头：学员作品/表演\n字幕：见证成长，收获自信\n\n【结尾 50-60秒】\n镜头：联系方式/二维码\n字幕：立即报名，开启精彩之旅`,
      },
      renewal: {
        reminder: (p, opts) => `【续费提醒】\n\n亲爱的家长您好！\n\n您的孩子${p}的课时即将用完，当前剩余课时不足X节。\n\n为确保孩子学习的连续性，建议您及时续费。现在续费还可享受以下优惠：\n\n🎁 续费优惠：\n• 续费满X课时，赠送X课时\n• 续费满X元，赠送精美礼品一份\n\n⏰ 优惠截止日期：[日期]\n\n如有任何疑问，欢迎随时联系我们！\n\n[机构名称]\n[联系电话]`,
        promotion: (p, opts) => `【续费优惠活动】\n\n🎉 老学员专属福利来啦！\n\n${p}\n\n活动详情：\n• 活动时间：[开始日期] 至 [结束日期]\n• 续费满赠：[具体优惠]\n• 推荐奖励：成功推荐新学员，双方各享优惠\n\n名额有限，先到先得！\n\n📍 [机构名称]\n📞 [联系电话]`,
        poster: (p, opts) => `【续费海报】\n\n主题：${p}\n设计要点：\n1. 突出"续费优惠"字样\n2. 清晰展示优惠内容\n3. 时间紧迫感\n4. 联系方式`,
      },
      festival: {
        greeting: (p, opts) => `【节日祝福】\n\n亲爱的家长和小朋友们：\n\n${p}快乐！🌻\n\n在这个特别的日子里，[机构名称]全体老师祝您和家人：\n\n✨ 幸福美满\n✨ 阖家欢乐\n✨ 万事如意\n\n感谢您一直以来的信任与支持！愿孩子们在我们共同的关爱下，健康快乐地成长！\n\n🎊 [机构名称] 敬上`,
        card: (p, opts) => `【节日贺卡】\n\n主题：${p}\n设计要点：\n1. 温馨的节日氛围\n2. 可爱的卡通元素\n3. 祝福语突出\n4. 机构Logo`,
        poster: (p, opts) => `【节日海报】\n\n主题：${p}\n设计要点：\n1. 节日元素丰富\n2. 色彩温暖明快\n3. 祝福语醒目\n4. 品牌露出`,
      },
      activity: {
        notice: (p, opts) => `【活动通知】\n\n📣 ${p}\n\n亲爱的家长朋友们：\n\n我们将于近期举办精彩活动，诚邀您的参与！\n\n📅 活动时间：[日期] [时间]\n📍 活动地点：[地点]\n👥 参与对象：[对象]\n\n🎯 活动内容：\n[详细介绍活动内容]\n\n💡 温馨提示：\n• 请提前10分钟到场签到\n• 活动名额有限，先报先得\n\n报名方式：\n1. 扫描下方二维码\n2. 联系前台老师\n3. 拨打热线：[电话]\n\n期待您的参与！`,
        poster: (p, opts) => `【活动海报】\n\n主题：${p}\n设计要点：\n1. 活动主题突出\n2. 时间地点清晰\n3. 报名方式醒目\n4. 吸引人的视觉元素`,
        invitation: (p, opts) => `【邀请函】\n\n诚挚邀请\n\n${p}\n\n尊敬的家长：\n\n您好！\n\n我们诚挚地邀请您参加[活动名称]，共同见证孩子们的成长与进步。\n\n📅 时间：[日期] [时间]\n📍 地点：[地点]\n\n活动亮点：\n• [亮点1]\n• [亮点2]\n• [亮点3]\n\n期待您的光临！\n\n[机构名称] 敬邀`,
      },
      summary: {
        feedback: (p, opts) => `【课后反馈】\n\n学员：${p}\n日期：[日期]\n课程：[课程名称]\n\n📚 今日学习内容：\n[具体内容]\n\n✨ 课堂表现：\n• 专注度：⭐⭐⭐⭐⭐\n• 参与度：⭐⭐⭐⭐⭐\n• 完成度：⭐⭐⭐⭐⭐\n\n💪 进步之处：\n[具体描述]\n\n📝 待加强：\n[具体建议]\n\n🏠 课后练习：\n[练习内容]\n\n期待下节课见到更棒的你！`,
        report: (p, opts) => `【学习报告】\n\n学员：${p}\n报告周期：[开始日期] - [结束日期]\n\n📊 出勤统计：\n• 应出勤：X节\n• 实际出勤：X节\n• 出勤率：X%\n\n📈 学习进度：\n• 已完成课时：X节\n• 剩余课时：X节\n• 进度：X%\n\n💯 学习成果：\n[成果展示]\n\n🎯 下阶段目标：\n[目标描述]\n\n💬 老师评语：\n[评语内容]`,
        moment: (p, opts) => `【朋友圈素材】\n\n主题：${p}\n\n文案：\n今天的小可爱们又进步啦！✨\n\n每一份努力都值得被记录\n每一个进步都值得被称赞\n\n[机构名称] 陪伴孩子成长每一天\n\n📷 图片建议：\n1. 课堂精彩瞬间\n2. 学员作品展示\n3. 师生互动场景`,
      },
    };

    // 获取生成函数
    const generateFn = sceneConfigs[sceneId]?.[templateId];
    if (!generateFn) {
      return NextResponse.json({ error: "无效的场景或模板" }, { status: 400 });
    }

    // 生成内容
    const generatedContent = generateFn(prompt, options || {});

    // 保存历史记录
    const history = await prisma.aiAssistantHistory.create({
      data: {
        merchantId,
        teacherId,
        sceneId,
        templateId,
        prompt,
        content: generatedContent,
        options: options ? JSON.stringify(options) : null,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: history.id,
        content: generatedContent,
        sceneId,
        templateId,
        createdAt: history.createdAt,
      },
    });
  } catch (error) {
    console.error("AI内容生成错误:", error);
    return NextResponse.json(
      { error: "生成内容失败" },
      { status: 500 }
    );
  }
}
