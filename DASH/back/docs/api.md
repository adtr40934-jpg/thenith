# توثيق مسارات لوحة تحكم الأدمن (Admin Dashboard API)

> 🛡️ **ملاحظة أمنية هامة (ADMIN ACCESS ONLY):**
> هذا الملف مخصص **حصرياً** لتوثيق مسارات **لوحة تحكم الأدمن (Admin Dashboard)**.
> جميع المسارات الموضحة هنا محمية وتتطلب صلاحيات الإدارة العليا (`superadmin` أو حساب مستخدم بدور `admin`).
> يجب إرسال توكن الأدمن في ترويسة الطلب لجميع العمليات:
> `Authorization: Bearer <admin_token>` (باستثناء مسار تسجيل الدخول الإداري).

---

## جدول المحتويات (Table of Contents)

1. [المصادقة وتسجيل دخول الأدمن](#1-المصادقة-وتسجيل-دخول-الأدمن)
2. [إحصائيات النظام والاشتراكات](#2-إحصائيات-النظام-والاشتراكات)
3. [إدارة المستخدمين (Users Management)](#3-إدارة-المستخدمين-users-management)
4. [إدارة الكروت الذكية وبرمجة NFC (Smart Physical Cards & NFC Provisioning)](#4-إدارة-الكروت-الذكية-وبرمجة-nfc-smart-physical-cards--nfc-provisioning)
5. [إدارة المتجر والمنتجات والطلبات (Store & Orders)](#5-إدارة-المتجر-والمنتجات-والطلبات-store--orders)
6. [إدارة الخطط والكوبونات (Plans & Coupons)](#6-إدارة-الخطط-والكوبونات-plans--coupons)
7. [إعدادات النظام وصفحة الهبوط (Settings)](#7-إعدادات-النظام-وصفحة-الهبوط-settings)
8. [رسائل التواصل ومحادثات الدعم الفني (Messages & Support)](#8-رسائل-التواصل-ومحادثات-الدعم-الفني-messages--support)
9. [سجلات التدقيق الأمني (Audit Logs)](#9-سجلات-التدقيق-الأمني-audit-logs)
10. [رفع الوسائط الخاصة بالإدارة (Upload)](#10-رفع-الوسائط-الخاصة-بالإدارة-upload)

---

## معلومات عامة وطريقة التشغيل (General Info & Setup)

- **Base URL**: `http://localhost:4001/api/admin`
- **Dedicated Port**: `4001` (قابلة للتغيير عبر متغير `ADMIN_PORT` في `.env`)
- **أمر التشغيل المحلي (Development)**:
  ```bash
  npm run dev:admin
  ```
- **أمر التشغيل المباشر**:
  ```bash
  npm run start:admin
  ```
- **Content-Type**: `application/json`
- **Authentication**: `Authorization: Bearer <token>`
- **Rate Limiting**: مفعل على مسار تسجيل الدخول لحماية لوحة الإدارة من هجمات القوة الغاشمة (Brute-Force).

---

### 1. المصادقة وتسجيل دخول الأدمن

#### `POST /api/admin/login`

- **الوصف**: تسجيل الدخول للوحة تحكم الأدمن باستخدام بيانات الاعتماد الإدارية.
- **الحماية**: محمي بـ Rate Limiting ومقارنة آمنة ضد هجمات التوقيت (`crypto.timingSafeEqual`).
- **Body**:
  ```json
  {
    "username": "admin",
    "password": "strong-admin-password"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "token": "eyJhbGciOi...",
    "user": {
      "username": "admin",
      "role": "superadmin"
    }
  }
  ```
- **Response (401 Unauthorized)**:
  ```json
  {
    "error": "Invalid admin credentials"
  }
  ```

---

### 2. إحصائيات النظام والاشتراكات

#### `GET /api/admin/subscriptions/stats`

- **الوصف**: جلب إحصائيات الاشتراكات وتوزيعها حسب الحالة (`active`, `trialing`, `expired`, `cancelled`, `pending`) وتوزيعها حسب الخطط (`free`, `pro`, إلخ).
- **المصادقة**: مطلوب توكن الأدمن.
- **Response (200 OK)**:
  ```json
  {
    "statusCounts": {
      "active": 45,
      "trialing": 5,
      "expired": 8,
      "cancelled": 2,
      "pending": 0
    },
    "planCounts": [
      { "_id": "free", "count": 30 },
      { "_id": "pro", "count": 15 }
    ]
  }
  ```

#### `GET /api/admin/stats`

- **الوصف**: إحصائيات عامة للنظام (إجمالي المستخدمين، عدد البطاقات، رسائل التواصل، والمستخدمين الجدد خلال آخر 30 يوماً).
- **المصادقة**: مطلوب توكن الأدمن.
- **Response (200 OK)**:
  ```json
  {
    "totalUsers": 120,
    "totalCards": 145,
    "totalMessages": 38,
    "newUsersLast30Days": 24
  }
  ```

---

### 3. إدارة المستخدمين (Users Management)

#### `GET /api/admin/users`

- **الوصف**: استرجاع قائمة المستخدمين مع دعم البحث والترقيم والفلترة.
- **Query Parameters**:
  - `page` (اختياري، الافتراضي: 1)
  - `limit` (اختياري، الافتراضي: 10)
  - `search` (اختياري، للبحث بالاسم أو البريد الإلكتروني)
  - `role` (اختياري: `user`, `admin`)
  - `status` (اختياري: `active`, `banned`)
- **Response (200 OK)**:
  ```json
  {
    "users": [
      {
        "_id": "65b8c...",
        "name": "User Name",
        "email": "user@example.com",
        "role": "user",
        "isActive": true,
        "createdAt": "2026-09-01T12:00:00.000Z"
      }
    ],
    "pagination": { "page": 1, "limit": 10, "total": 120, "totalPages": 12 }
  }
  ```

#### `POST /api/admin/users`

- **الوصف**: إنشاء مستخدم جديد يدوياً وتعيين كلمة مرور وخطة له بواسطة الإدارة.
- **Body**:
  ```json
  {
    "name": "Ahmed Ali",
    "email": "ahmed@example.com",
    "password": "SecurePassword123",
    "role": "user",
    "planKey": "free"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "user": {
      "_id": "65b8c...",
      "name": "Ahmed Ali",
      "email": "ahmed@example.com",
      "role": "user"
    }
  }
  ```

#### `PATCH /api/admin/users/:id`

- **الوصف**: تعديل بيانات حساب مستخدم معين (الاسم، البريد، الدور، رقم الهاتف، العنوان).
- **Body**:
  ```json
  {
    "name": "Updated Name",
    "phone": "01012345678",
    "role": "admin"
  }
  ```

#### `PATCH /api/admin/users/:id/ban`

- **الوصف**: حظر أو إلغاء حظر حساب مستخدم.
- **Body**:
  ```json
  {
    "isActive": false
  }
  ```

#### `PATCH /api/admin/users/:id/plan`

- **الوصف**: ترقية أو تغيير خطة اشتراك مستخدم مباشرة.
- **Body**:
  ```json
  {
    "planKey": "pro"
  }
  ```

#### `DELETE /api/admin/users/:id`

- **الوصف**: حذف مستخدم وكافة بطاقاته وبياناته نهائياً من النظام.
- **Response (200 OK)**: `{"message": "User deleted successfully"}`

#### `GET /api/admin/users/:id/cards`

- **الوصف**: استرجاع جميع البطاقات الرقمية التابعة لمستخدم معين.
- **Response (200 OK)**: `{"cards": [...]}`

---

### 4. إدارة الكروت الذكية وبرمجة NFC (Smart Physical Cards & NFC Provisioning)

#### `GET /api/admin/cards`
- **الوصف**: استرجاع قائمة الكروت الذكية (Physical Cards) مع دعم الفلترة، البحث، والترقيم، وحالة حماية NFC.
- **Query Parameters**:
  - `page` (افتراضي: 1)
  - `limit` (افتراضي: 10، الحد الأقصى: 100)
  - `search` (بحث في `cardId` أو `publicId`)
  - `status` (`unclaimed`, `claimed`, `disabled`)
  - `color` (`black`, `white`, `gold`, `silver`, `custom`)
  - `cardType` (`standard`, `metal`, `bamboo`, `pvc`, `matte`)
  - `distributionType` (`sale`, `gift`, `sample`, `corporate`)
  - `nfcProtectionStatus` (`pending_setup`, `locked`, `unlocked`, `error`)
  - `batchId` (فلترة حسب معرف الدفعة)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "670f...",
        "cardId": "THN-A1B2C3",
        "publicId": "7k9x2m1q",
        "cardPassword": "••••••",
        "targetUrl": "https://thenith.com/c/7k9x2m1q",
        "status": "unclaimed",
        "cardType": "standard",
        "color": "black",
        "nfcProtectionStatus": "pending_setup",
        "nfcChipType": "NTAG215",
        "isReadyForDistribution": false
      }
    ],
    "pagination": { "page": 1, "limit": 10, "total": 45, "totalPages": 5 }
  }
  ```

#### `POST /api/admin/cards`
- **الوصف**: إنشاء كارت ذكي فيزيائي جديد فردي مع توليد معرّف وكلمة مرور فريدة (6 خانات Hex).
- **Body**:
  ```json
  {
    "cardType": "standard",
    "color": "black",
    "distributionType": "sale",
    "nfcChipType": "NTAG215",
    "targetUrl": "https://thenith.com/c/custom-id",
    "cardPassword": "A4B92C",
    "batchId": "670e..."
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "card": {
      "_id": "670f...",
      "cardId": "THN-D9E8F7",
      "publicId": "p2n5r8t1",
      "cardPassword": "A4B92C",
      "status": "unclaimed",
      "nfcChipType": "NTAG215",
      "nfcProtectionStatus": "pending_setup"
    }
  }
  ```

#### `POST /api/admin/cards/bulk`
- **الوصف**: توليد دفعة كروت ذكية متعددة دفعة واحدة مع أرقام تسلسلية وبيانات تشفير فريدة.
- **Body**:
  ```json
  {
    "quantity": 50,
    "cardType": "metal",
    "color": "black",
    "distributionType": "sale",
    "nfcChipType": "NTAG215",
    "batchName": "Batch-October-2026"
  }
  ```

#### `GET /api/admin/cards/stats`
- **الوصف**: إحصائيات شاملة للكروت والمخزون وحالات حماية NFC (تجهيز، مقفول، بانتظار الربط، أخطاء).
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "stats": {
      "totalCards": 250,
      "unclaimedCards": 180,
      "claimedCards": 65,
      "disabledCards": 5,
      "readyForDistribution": 140,
      "nfcSetupPending": 40,
      "nfcErrors": 0,
      "nfcLocked": 140
    }
  }
  ```

#### `GET /api/admin/cards/:id`
- **الوصف**: جلب التفاصيل الشاملة للكارت الفيزيائي بواسطة `_id` أو `cardId` أو `publicId`.

#### `PATCH /api/admin/cards/:id`
- **الوصف**: تعديل خصائص الكارت الفيزيائي أو الرابط المستهدف `targetUrl`.

#### `PATCH /api/admin/cards/:id/status`
- **الوصف**: تغيير حالة الكارت (`unclaimed`, `claimed`, `disabled`).

#### `POST /api/admin/cards/:id/unlink`
- **الوصف**: إلغاء ربط الكارت الفيزيائي بالمستخدم والبروفايل وإعادته متاحاً للربط مجدداً (`unclaimed`).

#### `DELETE /api/admin/cards/:id`
- **الوصف**: حذف الكارت الذكي نهائياً وسجل أمان الـ NFC وسجلات النشاط المرتبطة به.

#### `GET /api/admin/cards/:id/qr`
- **الوصف**: استخراج رمز QR للكارت بصيغة SVG أو Data URL PNG.
- **Query Parameters**: `format` (`svg`, `png`), `download` (`true`, `false`)

#### `GET /api/admin/cards/:id/logs`
- **الوصف**: استرجاع سجل النشاطات والعمليات الخاصة بهذا الكارت (إنشاء، برمجة، قفل، فحص، إلغاء ربط).

#### `POST /api/admin/cards/:id/nfc/provision`
- **الوصف**: بدء جلسة برمجة NFC وتوليد خطة التكوين وتوكن الجلسة وكلمة المرور المشفرة.
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "session": {
      "sessionToken": "a8f3b9c02d1e...",
      "expiresAt": "2026-10-15T22:30:00.000Z",
      "cardId": "THN-A1B2C3",
      "publicId": "7k9x2m1q",
      "cardPassword": "A4B92C",
      "staticUrl": "https://thenith.com/c/7k9x2m1q",
      "chipType": "NTAG215",
      "provisioningPlan": {
        "targetUrl": "https://thenith.com/c/7k9x2m1q",
        "ndefPayload": { "recordType": "url", "data": "https://thenith.com/c/7k9x2m1q" },
        "protectionConfiguration": {
          "method": "NTAG_PASSWORD_AUTH",
          "auth0Page": "0xE3",
          "protMode": "WRITE_ONLY_PROTECTED"
        }
      }
    }
  }
  ```

#### `POST /api/admin/cards/:id/nfc/verify`
- **الوصف**: التحقق من اكتمال كتابة الرابط وتفعيل قفل كلمة المرور وتحديث حالة الكارت إلى `locked`.
- **Body**:
  ```json
  {
    "readUrl": "https://thenith.com/c/7k9x2m1q",
    "hardwareUid": "04:5A:88:2E:1B:6F",
    "writeVerified": true,
    "protectionVerified": true,
    "password": "A4B92C"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "result": {
      "valid": true,
      "hardwareUid": "04:5A:88:2E:1B:6F",
      "status": "locked",
      "verifiedAt": "2026-10-15T22:15:30.000Z"
    }
  }
  ```

#### `POST /api/admin/cards/:id/nfc/simulate-test`
- **الوصف**: محاكاة واختبار دورة حياة برمجة وقفل الكارت برمجياً لاختبار الواجهات والتكامل دون قارئ فيزيائي.

#### `GET /api/admin/card-batches`
- **الوصف**: استعراض دفعات التصنيع المجمعة وإحصائيات الكروت المربوطة والموزعة بكل دفعة.

#### `POST /api/admin/card-batches`
- **الوصف**: تسجيل دفعة تصنيع جديدة للكروت في المخزن.

---

### 5. إدارة المتجر والمنتجات والطلبات (Store & Orders)

#### `GET /api/admin/store/stats`

- **الوصف**: إحصائيات المتجر (إجمالي الإيرادات، عدد الطلبات المكتملة، متوسط قيمة الطلب).
- **Response (200 OK)**:
  ```json
  {
    "totalRevenue": 15400,
    "completedOrders": 85,
    "pendingOrders": 6
  }
  ```

#### `GET /api/admin/products`

- **الوصف**: استعراض كافة المنتجات المعروضة في المتجر.

#### `POST /api/admin/products`

- **الوصف**: إضافة منتج جديد إلى المتجر.
- **Body**:
  ```json
  {
    "name": "NFC Metal Card",
    "description": "Custom engraved metal card",
    "price": 49.99,
    "stock": 100,
    "image": "https://res.cloudinary.com/...",
    "isActive": true
  }
  ```

#### `PUT /api/admin/products/:id`

- **الوصف**: تحديث بيانات منتج (السعر، المخزون، الوصف، الصورة).

#### `DELETE /api/admin/products/:id`

- **الوصف**: حذف منتج من المتجر.

#### `GET /api/admin/orders`

- **الوصف**: استعراض كافة طلبات الشراء الواردة من المستخدمين مع تفاصيل المشتري والشحن.

#### `PATCH /api/admin/orders/:id/status`

- **الوصف**: تغيير حالة طلب معين.
- **Body**:
  ```json
  {
    "status": "processing" // options: pending, processing, shipped, delivered, cancelled
  }
  ```

---

### 6. إدارة الخطط والكوبونات (Plans & Coupons)

#### `GET /api/admin/plans`

- **الوصف**: استعراض كافة خطط الاشتراك في النظام مع الأسعار والميزات والحدود.

#### `POST /api/admin/plans`

- **الوصف**: إنشاء خطة اشتراك جديدة.
- **Body**:
  ```json
  {
    "key": "business",
    "name": "Business Plan",
    "price": { "monthly": 49, "yearly": 490 },
    "features": { "customDomain": true, "analytics": true },
    "limits": { "maxCards": 10 }
  }
  ```

#### `PUT /api/admin/plans/:id`

- **الوصف**: تعديل ميزات وأسعار الخطة.

#### `DELETE /api/admin/plans/:id`

- **الوصف**: حذف خطة اشتراك.

#### `GET /api/admin/coupons`

- **الوصف**: عرض قائمة كوبونات الخصم الفعالة والمنتهية.

#### `POST /api/admin/coupons`

- **الوصف**: إنشاء كود خصم جديد.
- **Body**:
  ```json
  {
    "code": "LAUNCH2026",
    "discountType": "percentage",
    "discountValue": 25,
    "expiresAt": "2026-12-31T23:59:59Z",
    "maxUses": 200
  }
  ```

#### `PUT /api/admin/coupons/:id`

- **الوصف**: تعديل تفاصيل الكوبون أو تمديد صلاحيته.

#### `DELETE /api/admin/coupons/:id`

- **الوصف**: حذف كوبون خصم.

---

### 7. إعدادات النظام وصفحة الهبوط (Settings)

#### `GET /api/admin/settings/store`

- **الوصف**: استرجاع إعدادات المتجر (العملة، بوابات الدفع، خيارات الشحن).

#### `PUT /api/admin/settings/store`

- **الوصف**: تحديث إعدادات المتجر.

#### `GET /api/admin/settings/landing`

- **الوصف**: استرجاع محتوى وأقسام ونصوص صفحة الهبوط (Landing Page).

#### `PUT /api/admin/settings/landing`

- **الوصف**: حفظ التعديلات على صفحة الهبوط.

#### `PUT /api/admin/settings`

- **الوصف**: تحديث الإعدادات العامة للمنصة.

---

### 8. رسائل التواصل ومحادثات الدعم الفني (Messages & Support)

#### `GET /api/admin/messages`

- **الوصف**: استعراض الرسائل الواردة عبر نموذج الاتصال في البروفايلات العامة أو الموقع.

#### `PATCH /api/admin/messages/:id/read`

- **الوصف**: تحديد رسالة واردة كمقروءة (`isRead: true`).

#### `DELETE /api/admin/messages/:id`

- **الوصف**: حذف رسالة واردة.

#### `GET /api/admin/conversations`

- **الوصف**: استعراض كافة محادثات الدعم الفني المباشرة.

#### `GET /api/admin/conversations/:id/messages`

- **الوصف**: استرجاع الرسائل داخل محادثة دعم فني محددة.

#### `POST /api/admin/conversations/:id/messages`

- **الوصف**: إرسال رد من موظف الدعم الفني للعميل في المحادثة.
- **Body**:
  ```json
  {
    "text": "مرحباً، تم حل المشكلة بنجاح."
  }
  ```

#### `PUT /api/admin/conversations/:id/status`

- **الوصف**: تغيير حالة المحادثة (`open`, `in_progress`, `closed`).

---

### 9. سجلات التدقيق الأمني (Audit Logs)

#### `GET /api/admin/audit/logs`

- **الوصف**: استعراض سجلات التدقيق الأمني للعمليات الحساسة مع عنوان الـ IP والمدينة ونوع الحدث ومستوى الخطورة.
- **Query Parameters**: `page`, `limit`, `severity`, `action`

#### `GET /api/admin/audit/stats`

- **الوصف**: إحصائيات النشاط الأمني والعمليات المشبوهة أو المحظورة.

---

### 10. رفع الوسائط الخاصة بالإدارة (Upload)

#### `POST /api/admin/upload`

- **الوصف**: رفع الصور والملفات الخاصة بالإدارة إلى Cloudinary.
- **Body**:
  ```json
  {
    "base64": "data:image/png;base64,iVBORw0KGgo...",
    "folder": "admin_assets"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "url": "https://res.cloudinary.com/.../admin_assets/image.png"
  }
  ```
