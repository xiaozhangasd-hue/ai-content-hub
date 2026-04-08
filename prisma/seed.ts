import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始播种数据...');

  // 1. 创建平台管理员账号
  const platformPassword = await bcrypt.hash('admin123', 10);
  const platformAdmin = await prisma.platformAdmin.upsert({
    where: { username: 'platform' },
    update: {},
    create: {
      username: 'platform',
      password: platformPassword,
      name: '平台管理员',
      role: 'super_admin',
      isActive: true,
    },
  });
  console.log('✅ 平台管理员账号已创建:', platformAdmin.username);

  // 2. 创建商家账号
  const merchantPassword = await bcrypt.hash('merchant123', 10);
  const merchant = await prisma.merchant.upsert({
    where: { phone: '13800138001' },
    update: {},
    create: {
      phone: '13800138001',
      password: merchantPassword,
      name: '张校长',
      institution: '星光艺术培训中心',
      category: '艺术',
      subjects: '美术,舞蹈,钢琴',
      city: '北京市朝阳区',
    },
  });
  console.log('✅ 商家账号已创建:', merchant.phone);

  // 创建商家的校区
  const campus = await prisma.campus.upsert({
    where: { id: 'campus-001' },
    update: {},
    create: {
      id: 'campus-001',
      merchantId: merchant.id,
      name: '总校区',
      address: '北京市朝阳区xxx路xxx号',
      phone: '010-12345678',
      status: 'active',
    },
  });
  console.log('✅ 校区已创建:', campus.name);

  // 3. 创建老师子账号
  const teacherPassword = await bcrypt.hash('teacher123', 10);
  const teacher = await prisma.teacher.upsert({
    where: { username: 'teacher01' },
    update: {},
    create: {
      merchantId: merchant.id,
      campusId: campus.id,
      name: '李老师',
      phone: '13800138002',
      subjects: '美术',
      status: 'active',
      // 子账号登录信息
      username: 'teacher01',
      password: teacherPassword,
      accountRole: 'teacher',
    },
  });
  console.log('✅ 老师子账号已创建:', teacher.username);

  // 创建课程模板
  const courseTemplate = await prisma.courseTemplate.upsert({
    where: { id: 'course-001' },
    update: {},
    create: {
      id: 'course-001',
      merchantId: merchant.id,
      name: '少儿美术基础班',
      category: '美术',
      totalHours: 20,
      duration: 45,
      price: 2000,
    },
  });
  console.log('✅ 课程模板已创建:', courseTemplate.name);

  // 创建班级
  const classItem = await prisma.class.upsert({
    where: { id: 'class-001' },
    update: {},
    create: {
      id: 'class-001',
      merchantId: merchant.id,
      campusId: campus.id,
      name: '周六美术1班',
      courseTemplateId: courseTemplate.id,
      teacherId: teacher.id,
      capacity: 12,
      status: 'active',
    },
  });
  console.log('✅ 班级已创建:', classItem.name);

  // 创建测试学生（用于小程序家长端测试）
  const student = await prisma.student.upsert({
    where: { id: 'student-001' },
    update: {},
    create: {
      id: 'student-001',
      merchantId: merchant.id,
      campusId: campus.id,
      name: '小明',
      gender: 'male',
      birthDate: new Date('2018-05-20'),
      parentName: '张先生',
      parentPhone: '13800138000', // 家长手机号，用于自动绑定
      note: '测试学生',
    },
  });
  console.log('✅ 学生已创建:', student.name);

  // 创建学生班级关联
  const enrollment = await prisma.enrollment.upsert({
    where: { id: 'enrollment-001' },
    update: {},
    create: {
      id: 'enrollment-001',
      studentId: student.id,
      classId: classItem.id,
      remainingHours: 12.5,
      totalHours: 20,
      status: 'active',
    },
  });
  console.log('✅ 学员报名已创建，剩余课时:', enrollment.remainingHours);

  // 创建测试课程
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lesson = await prisma.lesson.upsert({
    where: { id: 'lesson-001' },
    update: {},
    create: {
      id: 'lesson-001',
      classId: classItem.id,
      date: today,
      startTime: '14:00',
      endTime: '15:30',
      topic: '水彩画基础',
      status: 'scheduled',
    },
  });
  console.log('✅ 课程已创建:', lesson.topic);

  // 创建课堂点评
  const feedback = await prisma.feedback.upsert({
    where: { id: 'feedback-001' },
    update: {},
    create: {
      id: 'feedback-001',
      lessonId: lesson.id,
      studentId: student.id,
      teacherId: teacher.id,
      content: '今天表现很棒，色彩搭配有进步，继续加油！',
      images: JSON.stringify(['https://picsum.photos/400/300']),
      ratings: JSON.stringify({ focus: 5, creativity: 4, skill: 5, expression: 4, cooperation: 5 }),
      tags: JSON.stringify(['认真听讲', '有创意', '进步明显']),
    },
  });
  console.log('✅ 课堂点评已创建');

  // 创建成长档案
  const growthRecord = await prisma.growthRecord.upsert({
    where: { id: 'growth-001' },
    update: {},
    create: {
      id: 'growth-001',
      studentId: student.id,
      type: 'work',
      title: '水彩画作品《春天的花》',
      content: '本周学习了水彩晕染技法，小明掌握得很好，色彩搭配很有创意。',
      media: JSON.stringify([{ type: 'image', url: 'https://picsum.photos/400/300' }]),
      recordDate: today,
      tags: JSON.stringify(['美术', '水彩']),
    },
  });
  console.log('✅ 成长档案已创建:', growthRecord.title);

  // 创建充值套餐
  const existingPackages = await prisma.rechargePackage.count();
  if (existingPackages === 0) {
    await prisma.rechargePackage.createMany({
      data: [
        {
          merchantId: merchant.id,
          name: '10课时包',
          hours: 10,
          price: 1000,
          originalPrice: 1200,
          gift: 0,
          description: '有效期6个月',
          sortOrder: 1,
        },
        {
          merchantId: merchant.id,
          name: '20课时包',
          hours: 20,
          price: 1800,
          originalPrice: 2400,
          gift: 2,
          description: '赠送2课时，有效期12个月',
          sortOrder: 2,
        },
        {
          merchantId: merchant.id,
          name: '50课时包',
          hours: 50,
          price: 4000,
          originalPrice: 6000,
          gift: 8,
          description: '赠送8课时，有效期24个月',
          sortOrder: 3,
        },
      ],
    });
    console.log('✅ 充值套餐已创建');
  }

  // 创建会员套餐
  const plan = await prisma.membershipPlan.upsert({
    where: { id: 'plan-001' },
    update: {},
    create: {
      id: 'plan-001',
      name: '基础版',
      price: 299,
      yearlyPrice: 2999,
      features: 'AI文案生成,AI图片生成,客户管理,教务系统',
      limits: '{"dailyAiCount": 100}',
      isActive: true,
      sortOrder: 1,
    },
  });
  console.log('✅ 会员套餐已创建:', plan.name);

  console.log('\n🎉 数据播种完成！');
  console.log('\n📝 测试账号信息：');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔑 平台管理员：');
  console.log('   账号：platform');
  console.log('   密码：admin123');
  console.log('   功能：总后台管理');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🏛️ 商家（校长）：');
  console.log('   账号：13800138001');
  console.log('   密码：merchant123');
  console.log('   功能：完整教务系统');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👨‍🏫 老师（子账号）：');
  console.log('   账号：teacher01');
  console.log('   密码：teacher123');
  console.log('   功能：精简版工作台');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
