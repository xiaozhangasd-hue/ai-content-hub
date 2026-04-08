# 小程序对接文档

## 一、概述

### 1.1 接口基础信息

| 项目 | 说明 |
|------|------|
| 基础地址 | `{COZE_PROJECT_DOMAIN_DEFAULT}/api` |
| 数据格式 | JSON |
| 字符编码 | UTF-8 |
| 认证方式 | Bearer Token（JWT） |

### 1.2 认证说明

登录成功后，后续请求需在 Header 中携带 Token：

```
Authorization: Bearer <token>
```

Token 有效期：**7天**

---

## 二、登录认证模块

### 2.1 发送验证码

**请求**
```
POST /api/auth/send-code
Content-Type: application/json

{
  "phone": "13800138000"
}
```

**响应**
```json
{
  "success": true,
  "message": "验证码已发送"
}
```

### 2.2 验证码登录（家长端）

**请求**
```
POST /api/auth/login
Content-Type: application/json

{
  "phone": "13800138000",
  "code": "123456"
}
```

**响应**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "role": "parent",
  "user": {
    "id": "cmn2v5sk30000tffwerdd75gb",
    "phone": "13800138000",
    "name": "张先生",
    "children": [
      {
        "id": "cmn2v5sk30000xxx",
        "name": "小明",
        "avatar": "https://...",
        "age": 6
      }
    ]
  },
  "bindChildRequired": false
}
```

**字段说明**
| 字段 | 说明 |
|------|------|
| bindChildRequired | 是否需要绑定孩子（首次登录为 true） |

### 2.3 绑定孩子信息

首次登录且系统未找到关联孩子时调用。

**请求**
```
POST /api/mini/auth/bind-child
Authorization: Bearer <token>
Content-Type: application/json

{
  "childName": "小明",
  "childBirthDate": "2018-05-20",
  "relationship": "father"  // father/mother/grandfather/grandmother/other
}
```

**响应**
```json
{
  "success": true,
  "message": "绑定成功，等待机构确认",
  "status": "pending"
}
```

---

## 三、首页模块

### 3.1 获取首页数据

**请求**
```
GET /api/mini/home?childId=xxx
Authorization: Bearer <token>
```

**响应**
```json
{
  "child": {
    "id": "cmn2v5sk30000xxx",
    "name": "小明",
    "avatar": "https://...",
    "campus": "总校区"
  },
  "todaySchedule": {
    "hasClass": true,
    "lesson": {
      "id": "lesson-001",
      "className": "周六美术1班",
      "teacher": "李老师",
      "date": "2024-01-20",
      "startTime": "14:00",
      "endTime": "15:30",
      "classroom": "A教室",
      "topic": "水彩画基础"
    }
  },
  "hoursSummary": {
    "totalHours": 20,
    "remainingHours": 12.5,
    "warningLevel": "normal"  // normal/low/critical
  },
  "latestFeedback": {
    "id": "feedback-001",
    "date": "2024-01-18",
    "className": "周六美术1班",
    "teacher": "李老师",
    "content": "今天表现很棒，色彩搭配有进步...",
    "images": ["https://..."],
    "liked": false
  },
  "unreadCount": {
    "feedbacks": 2,
    "notices": 1,
    "growth": 0
  }
}
```

---

## 四、孩子信息模块

### 4.1 获取孩子列表

**请求**
```
GET /api/mini/children
Authorization: Bearer <token>
```

**响应**
```json
{
  "children": [
    {
      "id": "cmn2v5sk30000xxx",
      "name": "小明",
      "avatar": "https://...",
      "birthDate": "2018-05-20",
      "gender": "male",
      "campus": "总校区",
      "enrollments": [
        {
          "classId": "class-001",
          "className": "周六美术1班",
          "remainingHours": 12.5,
          "status": "active"
        }
      ]
    }
  ]
}
```

### 4.2 获取孩子详情

**请求**
```
GET /api/mini/children/:childId
Authorization: Bearer <token>
```

**响应**
```json
{
  "id": "cmn2v5sk30000xxx",
  "name": "小明",
  "avatar": "https://...",
  "birthDate": "2018-05-20",
  "gender": "male",
  "phone": "13800138002",
  "parentName": "张先生",
  "parentPhone": "13800138000",
  "campus": {
    "id": "campus-001",
    "name": "总校区",
    "address": "北京市朝阳区xxx路xxx号",
    "phone": "010-12345678"
  },
  "enrollments": [
    {
      "classId": "class-001",
      "className": "周六美术1班",
      "courseName": "少儿美术基础班",
      "teacher": {
        "id": "teacher-001",
        "name": "李老师",
        "phone": "13800138002"
      },
      "remainingHours": 12.5,
      "totalHours": 20,
      "joinDate": "2024-01-01"
    }
  ]
}
```

---

## 五、课表模块

### 5.1 获取周课表

**请求**
```
GET /api/mini/schedule?childId=xxx&weekStart=2024-01-15
Authorization: Bearer <token>
```

**响应**
```json
{
  "weekStart": "2024-01-15",
  "weekEnd": "2024-01-21",
  "schedule": {
    "monday": [],
    "tuesday": [],
    "wednesday": [],
    "thursday": [],
    "friday": [],
    "saturday": [
      {
        "id": "lesson-001",
        "className": "周六美术1班",
        "teacher": "李老师",
        "date": "2024-01-20",
        "startTime": "14:00",
        "endTime": "15:30",
        "classroom": "A教室",
        "topic": "水彩画基础",
        "status": "scheduled"
      }
    ],
    "sunday": []
  }
}
```

### 5.2 获取课程详情

**请求**
```
GET /api/mini/lessons/:lessonId
Authorization: Bearer <token>
```

**响应**
```json
{
  "id": "lesson-001",
  "className": "周六美术1班",
  "courseName": "少儿美术基础班",
  "teacher": {
    "id": "teacher-001",
    "name": "李老师",
    "avatar": "https://...",
    "phone": "13800138002"
  },
  "date": "2024-01-20",
  "startTime": "14:00",
  "endTime": "15:30",
  "classroom": "A教室",
  "topic": "水彩画基础",
  "status": "scheduled",
  "note": "请带水彩笔",
  "classmates": [
    { "id": "s1", "name": "小红", "avatar": "https://..." },
    { "id": "s2", "name": "小刚", "avatar": "https://..." }
  ]
}
```

---

## 六、课时管理模块

### 6.1 获取课时余额

**请求**
```
GET /api/mini/hours?childId=xxx
Authorization: Bearer <token>
```

**响应**
```json
{
  "childId": "cmn2v5sk30000xxx",
  "childName": "小明",
  "enrollments": [
    {
      "classId": "class-001",
      "className": "周六美术1班",
      "remainingHours": 12.5,
      "totalHours": 20,
      "usedHours": 7.5,
      "warningLevel": "normal"
    }
  ],
  "totalRemaining": 12.5
}
```

### 6.2 获取课时明细

**请求**
```
GET /api/mini/hours/records?childId=xxx&classId=xxx&page=1&pageSize=20
Authorization: Bearer <token>
```

**响应**
```json
{
  "records": [
    {
      "id": "record-001",
      "type": "deduction",
      "hours": 1.5,
      "description": "周六美术1班 - 水彩画基础",
      "date": "2024-01-20",
      "balance": 12.5
    },
    {
      "id": "record-002",
      "type": "recharge",
      "hours": 10,
      "amount": 1000,
      "paymentType": "wechat",
      "description": "课时充值",
      "date": "2024-01-15",
      "balance": 14
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 35,
    "totalPages": 2
  }
}
```

---

## 七、课堂点评模块

### 7.1 获取点评列表

**请求**
```
GET /api/mini/feedbacks?childId=xxx&page=1&pageSize=10
Authorization: Bearer <token>
```

**响应**
```json
{
  "feedbacks": [
    {
      "id": "feedback-001",
      "lessonId": "lesson-001",
      "className": "周六美术1班",
      "teacher": {
        "id": "teacher-001",
        "name": "李老师",
        "avatar": "https://..."
      },
      "date": "2024-01-20",
      "content": "今天表现很棒，色彩搭配有进步，继续加油！",
      "images": [
        "https://xxx.com/img1.jpg",
        "https://xxx.com/img2.jpg"
      ],
      "ratings": {
        "focus": 5,
        "creativity": 4,
        "skill": 5,
        "expression": 4,
        "cooperation": 5
      },
      "tags": ["认真听讲", "有创意", "进步明显"],
      "liked": false,
      "parentComment": null
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 25
  }
}
```

### 7.2 点赞点评

**请求**
```
POST /api/mini/feedbacks/:feedbackId/like
Authorization: Bearer <token>
```

**响应**
```json
{
  "success": true,
  "liked": true
}
```

### 7.3 家长评论

**请求**
```
POST /api/mini/feedbacks/:feedbackId/comment
Authorization: Bearer <token>
Content-Type: application/json

{
  "comment": "谢谢李老师的鼓励，小明回家很开心！"
}
```

**响应**
```json
{
  "success": true,
  "comment": "谢谢李老师的鼓励，小明回家很开心！"
}
```

---

## 八、成长档案模块

### 8.1 获取成长档案列表

**请求**
```
GET /api/mini/growth?childId=xxx&type=all&page=1&pageSize=20
Authorization: Bearer <token>
```

**参数说明**
| 参数 | 说明 |
|------|------|
| type | all/work/milestone/feedback/report |

**响应**
```json
{
  "records": [
    {
      "id": "growth-001",
      "type": "work",
      "title": "水彩画作品《春天的花》",
      "content": "本周学习了水彩晕染技法...",
      "media": [
        { "type": "image", "url": "https://..." }
      ],
      "recordDate": "2024-01-20",
      "tags": ["美术", "水彩"],
      "className": "周六美术1班",
      "teacher": "李老师"
    },
    {
      "id": "growth-002",
      "type": "milestone",
      "title": "完成10节课程",
      "content": "恭喜小明完成少儿美术基础班第一阶段学习！",
      "media": [],
      "recordDate": "2024-01-15",
      "tags": ["里程碑"]
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 15
  }
}
```

### 8.2 获取成长档案详情

**请求**
```
GET /api/mini/growth/:growthId
Authorization: Bearer <token>
```

**响应**
```json
{
  "id": "growth-001",
  "type": "work",
  "title": "水彩画作品《春天的花》",
  "content": "本周学习了水彩晕染技法，小明掌握得很好...",
  "media": [
    { "type": "image", "url": "https://...", "thumbnail": "https://..." },
    { "type": "video", "url": "https://...", "thumbnail": "https://...", "duration": 30 }
  ],
  "recordDate": "2024-01-20",
  "tags": ["美术", "水彩"],
  "className": "周六美术1班",
  "teacher": {
    "id": "teacher-001",
    "name": "李老师",
    "avatar": "https://..."
  },
  "feedback": {
    "id": "feedback-001",
    "content": "色彩搭配有进步...",
    "ratings": { "focus": 5, "creativity": 4 }
  },
  "shareUrl": "https://xxx.com/share/growth/growth-001"
}
```

---

## 九、请假模块

### 9.1 提交请假申请

**请求**
```
POST /api/mini/leave
Authorization: Bearer <token>
Content-Type: application/json

{
  "childId": "cmn2v5sk30000xxx",
  "classId": "class-001",
  "startDate": "2024-01-27",
  "endDate": "2024-01-27",
  "reason": "家中有事"
}
```

**响应**
```json
{
  "success": true,
  "leaveId": "leave-001",
  "status": "pending",
  "message": "请假申请已提交，等待审批"
}
```

### 9.2 获取请假记录

**请求**
```
GET /api/mini/leave?childId=xxx&status=all
Authorization: Bearer <token>
```

**响应**
```json
{
  "leaves": [
    {
      "id": "leave-001",
      "className": "周六美术1班",
      "startDate": "2024-01-27",
      "endDate": "2024-01-27",
      "reason": "家中有事",
      "status": "approved",
      "approver": "张校长",
      "approvedAt": "2024-01-25 10:30:00",
      "createdAt": "2024-01-25 09:00:00"
    }
  ]
}
```

---

## 十、消息通知模块

### 10.1 获取消息列表

**请求**
```
GET /api/mini/notifications?childId=xxx&type=all&page=1
Authorization: Bearer <token>
```

**参数说明**
| 参数 | 说明 |
|------|------|
| type | all/feedback/notice/hours/leave |

**响应**
```json
{
  "notifications": [
    {
      "id": "notif-001",
      "type": "feedback",
      "title": "新的课堂点评",
      "content": "李老师发布了新的课堂点评",
      "data": {
        "feedbackId": "feedback-001",
        "className": "周六美术1班"
      },
      "isRead": false,
      "createdAt": "2024-01-20 16:30:00"
    },
    {
      "id": "notif-002",
      "type": "hours",
      "title": "课时预警",
      "content": "周六美术1班课时余额不足5节，请及时充值",
      "data": {
        "classId": "class-001",
        "remainingHours": 4.5
      },
      "isRead": true,
      "createdAt": "2024-01-19 10:00:00"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 35
  }
}
```

### 10.2 标记已读

**请求**
```
POST /api/mini/notifications/:notificationId/read
Authorization: Bearer <token>
```

**响应**
```json
{
  "success": true
}
```

---

## 十一、在线充值模块

### 11.1 获取可充值课时包

**请求**
```
GET /api/mini/recharge/packages?classId=xxx
Authorization: Bearer <token>
```

**响应**
```json
{
  "packages": [
    {
      "id": "pkg-001",
      "name": "10课时包",
      "hours": 10,
      "price": 1000,
      "originalPrice": 1200,
      "gift": 0,
      "description": "有效期6个月"
    },
    {
      "id": "pkg-002",
      "name": "20课时包",
      "hours": 20,
      "price": 1800,
      "originalPrice": 2400,
      "gift": 2,
      "description": "赠送2课时，有效期12个月"
    }
  ]
}
```

### 11.2 创建充值订单

**请求**
```
POST /api/mini/recharge/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "childId": "cmn2v5sk30000xxx",
  "classId": "class-001",
  "packageId": "pkg-002"
}
```

**响应**
```json
{
  "success": true,
  "orderId": "order-001",
  "paymentParams": {
    "timeStamp": "1705737600",
    "nonceStr": "xxx",
    "package": "prepay_id=xxx",
    "signType": "RSA",
    "paySign": "xxx"
  }
}
```

### 11.3 查询订单状态

**请求**
```
GET /api/mini/recharge/orders/:orderId
Authorization: Bearer <token>
```

**响应**
```json
{
  "orderId": "order-001",
  "status": "paid",
  "hours": 22,
  "amount": 1800,
  "paidAt": "2024-01-20 15:30:00",
  "createdAt": "2024-01-20 15:28:00"
}
```

---

## 十二、错误码说明

| 错误码 | 说明 |
|--------|------|
| 400 | 请求参数错误 |
| 401 | 未登录或 Token 过期 |
| 403 | 无权限访问 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

**错误响应格式**
```json
{
  "error": "错误信息描述",
  "code": "ERROR_CODE"
}
```

---

## 十三、Websocket 实时通知（可选）

### 连接地址
```
wss://{COZE_PROJECT_DOMAIN_DEFAULT}/ws/mini?token=xxx
```

### 消息格式
```json
{
  "type": "feedback",
  "data": {
    "childId": "xxx",
    "feedbackId": "feedback-001",
    "title": "新的课堂点评",
    "content": "李老师发布了新的课堂点评"
  },
  "timestamp": "2024-01-20T16:30:00Z"
}
```

---

## 十四、数据字典

### 学生性别
| 值 | 说明 |
|----|------|
| male | 男 |
| female | 女 |

### 课程状态
| 值 | 说明 |
|----|------|
| scheduled | 已排课 |
| ongoing | 上课中 |
| completed | 已结束 |
| cancelled | 已取消 |

### 请假状态
| 值 | 说明 |
|----|------|
| pending | 待审批 |
| approved | 已通过 |
| rejected | 已拒绝 |

### 课时预警级别
| 值 | 说明 |
|----|------|
| normal | 正常（>5节） |
| low | 预警（3-5节） |
| critical | 紧急（<3节） |

### 家长关系
| 值 | 说明 |
|----|------|
| father | 父亲 |
| mother | 母亲 |
| grandfather | 爷爷/外公 |
| grandmother | 奶奶/外婆 |
| other | 其他 |

---

## 十五、联调环境

| 项目 | 值 |
|------|------|
| 接口地址 | https://your-domain.dev.coze.site/api |
| 测试账号 | 13800138000 |
| 测试验证码 | 123456 |

---

## 十六、需要后台新增的接口

以下接口需要在后台新增，用于小程序对接：

| 接口 | 方法 | 说明 | 状态 |
|------|------|------|------|
| `/api/auth/send-code` | POST | 发送验证码 | 需新增 |
| `/api/mini/auth/bind-child` | POST | 绑定孩子 | 需新增 |
| `/api/mini/home` | GET | 首页数据聚合 | 需新增 |
| `/api/mini/children` | GET | 孩子列表 | 需新增 |
| `/api/mini/children/:id` | GET | 孩子详情 | 需新增 |
| `/api/mini/schedule` | GET | 周课表 | 需新增 |
| `/api/mini/lessons/:id` | GET | 课程详情 | 需新增 |
| `/api/mini/hours` | GET | 课时余额 | 需新增 |
| `/api/mini/hours/records` | GET | 课时明细 | 需新增 |
| `/api/mini/feedbacks` | GET | 点评列表 | 需新增 |
| `/api/mini/feedbacks/:id/like` | POST | 点赞点评 | 需新增 |
| `/api/mini/feedbacks/:id/comment` | POST | 家长评论 | 需新增 |
| `/api/mini/growth` | GET | 成长档案列表 | 需新增 |
| `/api/mini/growth/:id` | GET | 成长档案详情 | 需新增 |
| `/api/mini/leave` | POST/GET | 请假申请/记录 | 需新增 |
| `/api/mini/notifications` | GET | 消息列表 | 需新增 |
| `/api/mini/notifications/:id/read` | POST | 标记已读 | 需新增 |
| `/api/mini/recharge/packages` | GET | 充值套餐 | 需新增 |
| `/api/mini/recharge/orders` | POST | 创建订单 | 需新增 |
| `/api/mini/recharge/orders/:id` | GET | 订单状态 | 需新增 |

---

*文档版本: v1.0*
*更新时间: 2024-01-20*

## 十七、测试账号

### 家长测试账号

| 项目 | 值 |
|------|------|
| 手机号 | 13800138000 |
| 验证码 | 调用发送验证码接口获取（开发环境会返回 devCode） |

### 关联的测试学生

| 项目 | 值 |
|------|------|
| 学生姓名 | 小明 |
| 所属校区 | 总校区 |
| 所在班级 | 周六美术1班 |
| 剩余课时 | 12.5 节 |

### 测试数据说明

系统已预置以下测试数据：
- 学生「小明」的 parentPhone 设置为 13800138000
- 使用该手机号登录小程序会自动关联该学生
- 已创建今日课程、课堂点评、成长档案等测试数据
