/**
 * 创建测试账号脚本
 * 运行命令: npx tsx scripts/create-test-accounts.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('开始创建测试账号...\n');

  // 1. 创建平台管理员
  const platformAdminPassword = await bcrypt.hash('admin123', 10);
  const platformAdmin = await prisma.platformAdmin.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: platformAdminPassword,
      name: '平台管理员',
      role: 'super_admin',
      isActive: true,
    },
  });
  console.log('✅ 平台管理员账号创建成功:');
  console.log('   账号: admin');
  console.log('   密码: admin123');
  console.log('   登录后跳转: /admin\n');

  // 2. 创建商家/校长账号
  const merchantPassword = await bcrypt.hash('123456', 10);
  const merchant = await prisma.merchant.upsert({
    where: { phone: '13800000001' },
    update: {},
    create: {
      phone: '13800000001',
      password: merchantPassword,
      name: '张校长',
      institution: '星艺艺术培训中心',
      category: '艺术',
      city: '北京',
    },
  });
  console.log('✅ 商家/校长账号创建成功:');
  console.log('   账号: 13800000001');
  console.log('   密码: 123456');
  console.log('   登录后跳转: /dashboard\n');

  // 3. 为商家创建校区
  const campus = await prisma.campus.upsert({
    where: { id: 'test-campus-1' },
    update: { merchantId: merchant.id },
    create: {
      id: 'test-campus-1',
      merchantId: merchant.id,
      name: '总校区',
      address: '北京市朝阳区xxx街道',
      phone: '010-12345678',
      status: 'active',
    },
  });
  
  // 创建第二个校区
  const campus2 = await prisma.campus.upsert({
    where: { id: 'test-campus-2' },
    update: { merchantId: merchant.id },
    create: {
      id: 'test-campus-2',
      merchantId: merchant.id,
      name: '分校区',
      address: '北京市海淀区xxx街道',
      phone: '010-87654321',
      status: 'active',
    },
  });

  // 4. 创建老师账号
  const teacherPassword = await bcrypt.hash('123456', 10);
  const teacher = await prisma.teacher.upsert({
    where: { username: 'teacher001' },
    update: {},
    create: {
      merchantId: merchant.id,
      campusId: campus.id,
      username: 'teacher001',
      password: teacherPassword,
      name: '李老师',
      phone: '13800000002',
      subjects: '钢琴,音乐',
      status: 'active',
      accountRole: 'teacher',
    },
  });
  console.log('✅ 老师账号创建成功:');
  console.log('   账号: teacher001');
  console.log('   密码: 123456');
  console.log('   登录后跳转: /teacher\n');

  // 5. 创建校区管理员账号（登录到商家后台 /dashboard）
  const adminPassword = await bcrypt.hash('123456', 10);
  const admin = await prisma.admin.upsert({
    where: { username: 'manager001' },
    update: {},
    create: {
      username: 'manager001',
      password: adminPassword,
      name: '王主管',
      role: 'campus_manager',
      campusId: campus.id,
      isActive: true,
    },
  });
  console.log('✅ 校区管理员账号创建成功:');
  console.log('   账号: manager001');
  console.log('   密码: 123456');
  console.log('   登录后跳转: /dashboard (与校长共用商家后台)\n');

  // 6. 创建测试家长账号
  const parent = await prisma.parent.upsert({
    where: { phone: '13800000003' },
    update: {},
    create: {
      phone: '13800000003',
      name: '测试家长',
    },
  });
  console.log('✅ 家长账号创建成功:');
  console.log('   手机号: 13800000003');
  console.log('   说明: 通过小程序登录\n');

  console.log('========================================');
  console.log('所有测试账号创建完成！');
  console.log('========================================\n');
  
  console.log('账号汇总表:');
  console.log('┌────────────────┬──────────────┬──────────┬─────────────────┐');
  console.log('│ 角色           │ 账号         │ 密码     │ 访问路径        │');
  console.log('├────────────────┼──────────────┼──────────┼─────────────────┤');
  console.log('│ 平台管理员     │ admin        │ admin123 │ /admin          │');
  console.log('│ 商家/校长      │ 13800000001  │ 123456   │ /dashboard      │');
  console.log('│ 校区管理员     │ manager001   │ 123456   │ /dashboard      │');
  console.log('│ 老师           │ teacher001   │ 123456   │ /teacher        │');
  console.log('│ 家长(小程序)   │ 13800000003  │ -        │ 小程序登录      │');
  console.log('└────────────────┴──────────────┴──────────┴─────────────────┘');
  console.log('');
  console.log('💡 说明: 校区管理员和校长共用 /dashboard 商家后台');
}

main()
  .catch((e) => {
    console.error('创建账号失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
