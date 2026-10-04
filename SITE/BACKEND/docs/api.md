# توثيق واجهات برمجة التطبيقات (API Documentation) - Thenith Backend

دليل شامل ومُحدَّث لكافة مسارات الـ API في النظام مع توضيح الوظيفة، طرق الإرسال (HTTP Methods)، المصادقة (Authentication)، ومحتوى الطلب والاستجابة مع معايير الأمان وحماية خصوصية البيانات.

---

## جدول المحتويات (Table of Contents)

- [معلومات المصادقة والأمان العامة](#معلومات-المصادقة-والأمان-العامة)
- [🛡️ لوحة تحكم الأدمن (مشروع مستقل في admin-dashboard)](#لوحة-تحكم-الأدمن-admin-dashboard-project)
- [مسارات المستخدمين والواجهة العامة (User & Public Routes)](#مسارات-المستخدمين-والواجهة-العامة-user--public-routes)
  - [فحص الحالة العامة](#فحص-الحالة-العامة-health-check)
  - [المصادقة والحساب](#المصادقة-والحساب-auth)
  - [اللوحة الشخصية](#اللوحة-الشخصية-panel)
  - [لوحة تحكم المستخدم](#لوحة-تحكم-المستخدم-dashboard)
  - [البطاقات الرقمية](#البطاقات-الرقمية-cards)
  - [المواعيد والتوظيف](#المواعيد-والتوظيف-appointments--hire)
  - [الخطط والاشتراكات](#الخطط-والاشتراكات-plans--subscriptions)
  - [منتجات المتجر العامة](#منتجات-المتجر-العامة-products)
  - [محادثات الدعم الفني العامة](#محادثات-الدعم-الفني-العامة-support)
  - [رفع الصور والملفات](#رفع-الصور-والملفات-upload)
  - [التحليلات والتتبع](#التحليلات-والتتبع-analytics)
  - [الملفات الشخصية العامة](#الملفات-الشخصية-العامة-public-profiles)

---

## معلومات المصادقة والأمان العامة

- **Base URL**: `http://localhost:4000` (أو رابط النطاق في الإنتاج)
- **Headers المطلوبة**:
  - `Content-Type: application/json`
  - للمسارات المحمية: `Authorization: Bearer <access_token>`
  - لمسارات لوحة تحكم الأدمن: `Authorization: Bearer <admin_token>`
- **الكوكيز (HttpOnly Cookies)**:
  - `refreshToken`: يتم حفظه في كوكي آمن مشفر لاسترجاع الجلسة وتجديد التوكن في `/api/auth/session` و `/api/auth/refresh`.
  - `visitorId`: كوكي جلسة الزائر المشفر لحجز المواعيد وإرسال طلبات التوظيف ومتابعتها بأمان.
- **حماية البيانات الحساسة (Zero Data Leakage)**:
  - كافة المسارات العامة تخضع لـ Allowlist Projection صارم، ولا تُرجع أي بيانات خاصة بأصحاب البطاقات أو عملائهم (مثل طلبات التوظيف، المواعيد، المعرفات الداخلية، أو الإحصائيات).

---

# قسم 2: مسارات المستخدمين والواجهة العامة (User & Public Routes)

> 💡 **ملاحظة:** المسارات التالية تخدم واجهة المستخدم العادي (Dashboard / User Panel / Public Profile) والزوار، وليست مخصصة للوحة تحكم الأدمن.

---

### فحص الحالة العامة (Health Check)

#### `GET /api/health`

- **الوصف**: فحص عمل الخادم والتأكد من استجابته.
- **Response**: `{"ok": true}`

---

### المصادقة والحساب (Auth)

المسار الأساسي: `/api/auth` (خاضع لـ Rate Limiting)

#### `POST /api/auth/request-code`

- **الوصف**: طلب كود تحقق (OTP) عبر البريد الإلكتروني.
- **Body**: `{"email": "user@example.com", "purpose": "login" | "register"}`
- **Response**: `{"ok": true, "expiresInSeconds": 600}`

#### `POST /api/auth/verify-code`

- **الوصف**: التحقق من كود الـ OTP. في حالة تسجيل الدخول يرجع `accessToken` و `user` و `subscription` ويضبط الكوكي الآمن، وفي حالة التسجيل يرجع `verificationToken`.
- **Body**: `{"email": "user@example.com", "code": "123456", "purpose": "login" | "register"}`

#### `POST /api/auth/complete-registration`

- **الوصف**: إتمام إنشاء الحساب بعد التحقق من كود الـ OTP بنجاح.
- **Body**:
  ```json
  {
    "verificationToken": "eyJhbGci...",
    "name": "Full Name",
    "phone": "01000000000",
    "address": "Cairo, Egypt"
  }
  ```

#### `POST /api/auth/register`

- **الوصف**: تسجيل حساب تقليدي بالبريد وكلمة المرور.
- **Body**: `{"name": "Full Name", "email": "user@example.com", "password": "password123"}`

#### `POST /api/auth/login`

- **الوصف**: تسجيل الدخول التقليدي بالبريد وكلمة المرور.
- **Body**: `{"email": "user@example.com", "password": "password123"}`

#### `GET /api/auth/session`

- **الوصف**: استرجاع الجلسة الحالية وتجديد الـ Access Token تلقائياً باستخدام الكوكي الآمن `refreshToken`.
- **Response**:
  ```json
  {
    "authenticated": true,
    "user": { "id": "...", "name": "...", "email": "...", "role": "user" },
    "accessToken": "...",
    "subscription": { ... }
  }
  ```

#### `POST /api/auth/refresh`

- **الوصف**: تجديد توكن الوصول المنتهي يدويًا.

#### `POST /api/auth/logout`

- **الوصف**: تسجيل الخروج وحذف كوكي الـ refresh token وإلغاء صلاحية الجلسة.

#### `GET /api/auth/me`

- **الوصف**: جلب بيانات المستخدم الحالي المسجل وحالة اشتراكه.
- **المصادقة**: مطلوب Bearer Token.

#### `PATCH /api/auth/me`

- **الوصف**: تعديل بيانات الملف الشخصي للمستخدم الحالي (الاسم، الهاتف، العنوان، واسم المستخدم مع فحص توفره وصلاحية الخطة `customLink`).
- **المصادقة**: مطلوب Bearer Token.

#### `DELETE /api/auth/me`

- **الوصف**: حذف حساب المستخدم المسجل وبياناته نهائياً (البطاقات، الاشتراكات، والرموز).
- **المصادقة**: مطلوب Bearer Token.

#### `POST /api/auth/check-username`

- **الوصف**: التحقق من توفر اسم مستخدم (Username) محدد قبل حفظه.
- **المصادقة**: مطلوب Bearer Token.
- **Body**: `{"username": "custom_name"}`
- **Response**: `{"available": true}`

#### `POST /api/auth/google`

- **الوصف**: تسجيل الدخول أو إنشاء حساب سريع عبر Google OAuth Token (One Tap / Sign In with Google).
- **Body**: يدعم كلاً من `{"credential": "<google_id_token>"}` أو `{"token": "<google_id_token>"}`.

---

### اللوحة الشخصية (Panel)

المسار الأساسي: `/api/panel` (محمي بالمصادقة واشتراك نشط)

#### `GET /api/panel/profile`

- **الوصف**: استرجاع بيانات البروفايل الخاص بالمستخدم للوحة التحكم (الاسم، البريد، الهاتف، العنوان، واسم المستخدم).

#### `PATCH /api/panel/profile`

- **الوصف**: تحديث الاسم ورقم الهاتف والعنوان واسم المستخدم (مع التحقق من صلاحية الخطة لاسم المستخدم ومنع التكرار).
- **Body**: `{"name": "...", "phone": "...", "address": "...", "username": "..."}`

#### `GET /api/panel/links`

- **الوصف**: جلب روابط البطاقة الرقمية النشطة حالياً للمستخدم.

#### `PATCH /api/panel/links`

- **الوصف**: حفظ وإعادة ترتيب روابط البطاقة النشطة (مع تطبيق الحد الأقصى للروابط بحسب خطة الاشتراك).
- **Body**: `{"links": [{"title": "LinkedIn", "url": "https://...", "icon": "linkedin"}]}`

---

### لوحة تحكم المستخدم (Dashboard)

المسار الأساسي: `/api/dashboard` (محمي بالمصادقة واشتراك نشط)

#### `GET /api/dashboard`

- **الوصف**: جلب ملخص شامل لبيانات لوحة تحكم المستخدم (البطاقات التابعة للمالك، الإحصائيات، المواعيد الأخيرة، وطلبات التوظيف الواردة للمالك فقط).

#### `GET /api/dashboard/stream`

- **الوصف**: بث إشعارات آنية عبر Server-Sent Events (SSE) لتحديث اللوحة فور وصول طلبات أو مواعيد جديدة.

#### `PATCH /api/dashboard/active-card`

- **الوصف**: تعيين البطاقة النشطة الافتراضية للمستخدم.
- **Body**: `{"cardId": "65b8c..."}`

#### `DELETE /api/dashboard/cards/:cardId/requests/:requestId`

- **الوصف**: حذف طلب توظيف/تواصل وارد على بطاقة محددة.

#### `PUT /api/dashboard/cards/:cardId/requests/:requestId/read`

- **الوصف**: تحديد طلب توظيف/تواصل كمقروء.

#### `DELETE /api/dashboard/cards/:cardId/appointments/:appointmentId`

- **الوصف**: حذف موعد مسجل على بطاقة محددة.

#### `PUT /api/dashboard/cards/:cardId/appointments/:appointmentId/read`

- **الوصف**: تحديد موعد محجوز كمقروء.

---

### البطاقات الرقمية (Cards)

المسار الأساسي: `/api/cards`

#### `GET /api/cards/public/:cardId`

- **الوصف**: جلب بيانات بطاقة معقمة ومصممة للعرض العام فقط (محمية بالكامل وخالية من أي بيانات عملاء أو طلبات أو مواعيد أو معرفات داخلية).

#### `GET /api/cards`

- **الوصف**: استرجاع قائمة جميع البطاقات الرقمية التي يملكها المستخدم مع فحص حدود الخطة.
- **المصادقة**: مطلوب Bearer Token.

#### `POST /api/cards`

- **الوصف**: إنشاء بطاقة رقمية جديدة (مع التحقق من الحد الأقصى لعدد البطاقات `maxCards` المسموح به في خطة المستخدم).
- **المصادقة**: مطلوب Bearer Token.
- **Body**: `{"name": "Work Card"}`

#### `PATCH /api/cards/:cardId`

- **الوصف**: تعديل محتوى وتصميم وإعدادات بطاقة محددة للمستخدم (الاسم، البيانات الشخصية، الروابط، جهات الاتصال، نوع الإجراء form/calendar).
- **المصادقة**: مطلوب Bearer Token.

#### `PATCH /api/cards/:cardId/links/reorder`

- **الوصف**: إعادة ترتيب الروابط داخل البطاقة (متاح لمشتركي خطة Pro فقط).
- **Body**: `{"linkIds": ["id1", "id2"]}`

#### `DELETE /api/cards/:cardId`

- **الوصف**: حذف بطاقة محددة للمستخدم.

---

### المواعيد والتوظيف (Appointments & Hire)

المسار خاضع لـ Rate Limiting لحماية الخادم من الهجمات المكررة.

#### `POST /api/appointments/:cardId`

- **الوصف**: حجز موعد جديد من قبل الزائر على بطاقة مستخدم مفعلة بنظام التقويم.
- **Body**:
  ```json
  {
    "name": "Client Name",
    "phone": "01000000000",
    "email": "client@mail.com",
    "startTime": "2026-10-01T14:00:00.000Z",
    "message": "Project Discussion",
    "durationMinutes": 60
  }
  ```
  _(يمكن بدلاً من `startTime` إرسال الحقلين: `"date": "2026-10-01", "time": "14:00"`)_
- **Response**: كائن موعد معقم وخالٍ من أي كوكيز أو معرفات زوار داخلية.

#### `GET /api/appointments/:cardId/availability`

- **الوصف**: استرجاع الأوقات المحجوزة وغير المتاحة على البطاقة لشهر وسنة محددين.
- **Query**: `?year=2026&month=10`
- **Response**: `{"bookedSlots": {"2026-10-01": ["14:00"]}}`

#### `GET /api/appointments/:cardId/my-appointments`

- **الوصف**: جلب المواعيد المحجوزة للزائر صاحب الجلسة الحالية (`visitorId`).

#### `DELETE /api/appointments/:appointmentId`

- **الوصف**: إلغاء موعد مسجل من قبل الزائر صاحب الحجز.

#### `POST /api/hire/:cardId`

- **الوصف**: إرسال طلب توظيف أو تقديم مشروع لصاحب البطاقة (مع التحقق التلقائي من عدم تجاوز الحد الشهري للبطاقة `monthlyBusinessRequests`).
- **Body**:
  ```json
  {
    "name": "Recruiter Name",
    "phone": "01000000000",
    "email": "recruiter@corp.com",
    "message": "تفاصيل المشروع والطلب المطلوب..."
  }
  ```
  _(يدعم الحقل `"details"` كبديل لـ `"message"`)_
- **Response**: كائن الطلب المعقم بدون أي بيانات داخلية.

#### `GET /api/hire/:cardId/my-requests`

- **الوصف**: استعراض طلبات التوظيف التي أرسلها الزائر صاحب الجلسة الحالية.

#### `DELETE /api/hire/:requestId`

- **الوصف**: حذف طلب توظيف أرسله الزائر.

---

### الخطط والاشتراكات (Plans & Subscriptions)

#### `GET /api/plans`

- **الوصف**: استعراض كافة الخطط المتاحة وأسعارها ومميزاتها وحدودها (`maxCards`, `maxLinks`, `monthlyBusinessRequests`, الخ).

#### `GET /api/subscription`

- **الوصف**: استرجاع تفاصيل خطة المستخدم الحالية، تاريخ التجديد، والميزات المتاحة وحدود الاستهلاك.
- **المصادقة**: مطلوب Bearer Token.

#### `GET /api/subscription/status`

- **الوصف**: فحص سريع لحالة اشتراك المستخدم الحالية (Active, Trial, Expired).

#### `POST /api/subscription/cancel`

- **الوصف**: إلغاء الاشتراك التلقائي في نهاية الفترة الحالية والعودة للباقة المجانية.

---

### منتجات المتجر العامة (Products)

المسار الأساسي: `/api/products` (متاح للجميع)

#### `GET /api/products`

- **الوصف**: استعراض جميع المنتجات المتاحة للشراء في المتجر ببيانات معقمة.

#### `GET /api/products/:id`

- **الوصف**: استرجاع تفاصيل منتج معين بالمعرف الخاص به.

---

### محادثات الدعم الفني العامة (Support)

المسار الأساسي: `/api/support`

#### `POST /api/support/init`

- **الوصف**: بدء جلسة محادثة دعم فني جديدة للزائر أو المستخدم المسجل.
- **Body**: `{"name": "Visitor", "email": "visitor@example.com"}`

#### `GET /api/support/:id/messages`

- **الوصف**: جلب رسائل محادثة دعم فني محددة للمالك أو الزائر صاحب الجلسة.

#### `POST /api/support/:id/messages`

- **الوصف**: إرسال رسالة جديدة في محادثة الدعم (يقبل `"content"` أو `"text"`).
- **Body**: `{"content": "أحتاج لمساعدة في الاشتراك"}`

---

### رفع الصور والملفات (Upload)

المسار الأساسي: `/api/upload` (محمي بالمصادقة واشتراك نشط)

#### `POST /api/upload/base64?field=avatar|cover`

- **الوصف**: رفع صورة بصيغة Base64 لحفظها على خادم Cloudinary واسترجاع الرابط المباشر.
- **التحقق الأمني**:
  - يتم فحص حجم الصورة (أقصى حد 5MB) ونوع الامتداد (JPEG, PNG, WebP).
  - إذا كان المعامل `field=cover`، يتم التحقق برمجياً من امتلاك المستخدم لخطة مدفوعة تتيح ميزة `coverImage` ومنع الرفع لغير المشتركين.
- **Query أو Body**: `field=avatar` أو `field=cover`.
- **Body**: يدعم كلاً من `{"imageData": "data:image/jpeg;base64,..."}` أو `{"image": "..."}`.
- **Response**: `{"url": "https://res.cloudinary.com/..."}`

---

### التحليلات والتتبع (Analytics)

المسار الأساسي: `/api/analytics` (متاح للعامة ومحمي بـ Rate Limiting)

#### `POST /api/analytics/:cardId/visit`

- **الوصف**: تسجيل زيارة بروفايل أو بطاقة رقمية لحساب عدد المشاهدات وتحديد دولة الزائر جغرافياً.

#### `POST /api/analytics/:cardId/click`

- **الوصف**: تسجيل نقرة على رابط داخل بطاقة رقمية محددة.
- **Body**: يدعم التحديد بمعرف الرابط `{"linkId": "link_123"}` أو برابط الـ URL مباشرة `{"linkUrl": "https://..."}`.

---

### الملفات الشخصية العامة (Public Profiles)

المسارات: `/public/:identifier` أو `/p/:identifier` أو `/:identifier`

#### `GET /p/:identifier` أو `GET /:identifier`

- **الوصف**: استرجاع بيانات الملف الشخصي العام أو البطاقة بالاسم المخصص أو الـ `publicId` لعرضه للزوار.
- **الحماية والأمان**:
  - يتم تطبيق فحص قيود البطاقات المسموحة للخطة (`maxCards`) وإخفاء البطاقات الزائدة تلقائياً.
  - تطبيق قيود الروابط (`maxLinks`) واقتصار الروابط على الحد المسموح فقط.
  - حجب صورة الغلاف إذا كانت الخطة مجانية.
  - **حظر شامل لأي تسريب بيانات**: لا ترجع أي طلبات توظيف، مواعيد محجوزة، إحصائيات، أو معرفات داخلية نهائياً.
- **Response Example**:
  ```json
  {
    "id": "a1b2c3",
    "publicId": "a1b2c3",
    "name": "Ahmed Mohamed",
    "personal": {
      "fullName": "Ahmed Mohamed",
      "title": "Software Engineer",
      "company": "Tech Corp",
      "bio": "Full-stack developer...",
      "avatar": "https://res.cloudinary.com/..."
    },
    "contacts": [
      { "id": "c1", "type": "phone", "value": "+201000000000", "primary": true }
    ],
    "links": [
      { "id": "l1", "title": "GitHub", "url": "https://github.com/..." }
    ],
    "actionType": "form",
    "removeBranding": false,
    "verifiedBadge": false,
    "profileUrl": "https://domain.com/p/ahmed"
  }
  ```

#### `POST /public/contact`

- **الوصف**: إرسال رسالة تواصل عامة لصاحب الموقع أو الدعم العام عبر نموذج التواصل السريع.
- **Body**:
  ```json
  {
    "name": "Visitor Name",
    "email": "visitor@example.com",
    "phone": "01000000000",
    "subject": "Inquiry",
    "message": "Hello, I want to connect!"
  }
  ```
- **Response**: `{"success": true, "message": "تم إرسال رسالتك بنجاح."}`
