# دليل المطور الجديد لمشروع Nexa Dashboard

هذا الملف يعطيك خريطة سريعة للمشروع حتى تبدأ التطوير بثقة. المشروع عبارة عن لوحة تحكم مبنية بـ React وTypeScript وVite، وتتواصل مع Backend عبر REST API.

## 1. تشغيل المشروع محليا

المتطلبات الحالية:

```powershell
node -v
npm -v
```

المشروع يقبل:

```json
"node": ">=20.0.0",
"npm": ">=10.0.0 <12.0.0"
```

أوامر العمل اليومية:

```powershell
npm i
npm run dev
npm run build
npm run lint
npm run test
```

سيرفر التطوير يعمل افتراضيا على:

```text
http://localhost:3000
```

## 2. ملفات البيئة

ملفات البيئة الموجودة:

- `.env`: إعدادات التطوير المحلية.
- `.env.example`: قالب القيم المطلوبة.
- `.env.prod`: إعدادات الإنتاج.

أهم القيم التي يقرأها المشروع من `src/config/env.ts`:

```text
VITE_API_BASE_URL
VITE_APP_NAME
VITE_REVERB_APP_ID
VITE_REVERB_KEY
VITE_REVERB_SECRET
VITE_REVERB_HOST
VITE_REVERB_PORT
VITE_REVERB_SCHEME
VITE_GOOGLE_MAPS_API_KEY
```

ملاحظة مهمة: إذا لم تكن `VITE_API_BASE_URL` موجودة، التطبيق سيرمي خطأ عند التشغيل.

## 3. الصورة الكبيرة للمشروع

نقاط الدخول الأساسية:

- `src/main.tsx`: يبدأ تطبيق React.
- `src/app/App.tsx`: يعرّف صفحات التطبيق والراوتات.
- `src/app/providers.tsx`: يجمع Providers الأساسية مثل Router وReact Query وAuth وTheme وi18n.
- `src/routes/routes.ts`: يحتوي كل مسارات التطبيق في كائن واحد اسمه `ROUTES`.

المكتبات المهمة:

- React 19 للواجهة.
- React Router للتنقل.
- TanStack Query لإدارة بيانات السيرفر والكاش.
- Axios للطلبات.
- Zustand لبعض الحالات العامة مثل Toast والعملة.
- i18next للترجمة.
- Tailwind CSS 4 للتصميم.
- Vitest للاختبارات.

## 4. بنية المجلدات

```text
src/
  app/              إعداد التطبيق والـ Providers
  components/       مكونات مشتركة بين أكثر من ميزة
  config/           إعدادات عامة مثل env وnavigation وconstants
  contexts/         Contexts مثل Auth وTheme
  features/         ميزات التطبيق الرئيسية
  hooks/            Hooks مشتركة
  lib/              أدوات البنية التحتية مثل axios وqueryClient
  locales/          ملفات الترجمة
  routes/           تعريف المسارات
  stores/           Zustand stores
  styles/           CSS عام
  test-utils/       أدوات مساعدة للاختبارات
  types/            أنواع TypeScript عامة
  utils/            دوال مساعدة عامة
```

أغلب الشغل اليومي سيكون داخل `src/features`.

## 5. نمط الميزة Feature Pattern

كل ميزة غالبا لها نفس التقسيم:

```text
features/example/
  api/          دوال الاتصال بالـ Backend وتحويل البيانات
  hooks/        React Query hooks للقراءة والتعديل
  pages/        صفحات مرتبطة بالراوتات
  components/   مكونات خاصة بهذه الميزة
```

مثال واضح موجود في:

```text
src/features/regions/
  api/regionsApi.ts
  hooks/useRegions.ts
  pages/RegionsPage.tsx
  pages/RegionDetailPage.tsx
```

## 6. كيف تتحرك البيانات داخل التطبيق

المسار المعتاد للبيانات:

```text
Page Component
  -> Feature Hook
  -> Feature API Service
  -> apiClient
  -> Backend
```

مثال من المناطق:

- `RegionsPage.tsx` يعرض الصفحة.
- `useRegions.ts` يحتوي hooks مثل `useRegionsPage` و`useCreateZone`.
- `regionsApi.ts` ينفذ طلبات HTTP مثل `/api/v1/admin/zones`.
- `src/lib/axios.ts` يضيف التوكن واللغة ويتعامل مع أخطاء الشبكة.

## 7. التعامل مع الـ API

العميل المركزي موجود في:

```text
src/lib/axios.ts
```

وظائفه:

- استخدام `VITE_API_BASE_URL` في الإنتاج.
- في التطوير، Vite proxy يحول `/api` إلى قيمة `VITE_API_BASE_URL`.
- إرسال `Accept-Language` حسب اللغة المحفوظة.
- إرسال `Authorization: Bearer <token>` عند وجود توكن.
- التحويل إلى `/login` عند انتهاء الجلسة.
- إظهار Toast عام لأخطاء الشبكة وأخطاء السيرفر.

ملف `vite.config.ts` يضبط proxy:

```ts
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: env.VITE_API_BASE_URL,
      changeOrigin: true,
    },
  },
}
```

## 8. المصادقة والصلاحيات

المصادقة موجودة في:

```text
src/contexts/AuthContext.tsx
src/features/auth/
```

حماية الصفحات تتم عبر:

```text
src/features/auth/components/ProtectedRoute.tsx
```

في `src/app/App.tsx` ستجد صفحات داخل `ProtectedRoute`، وبعضها يحتاج صلاحيات محددة مثل:

```text
orders.view
orders.manage
customers.view
suppliers.view
products.view
trips.view
drivers.view
settings.manage
reports.view
```

إذا أضفت صفحة جديدة، غالبا ستحتاج:

1. إضافة route في `src/routes/routes.ts`.
2. إضافة lazy import في `src/app/App.tsx`.
3. وضع الصفحة تحت `ProtectedRoute` المناسب.
4. إضافة عنصر في navigation إذا كانت الصفحة تحتاج ظهورا في القائمة.

## 9. الترجمة واللغات

ملفات الترجمة:

```text
src/locales/ar.json
src/locales/en.json
src/locales/he.json
src/locales/ru.json
```

الإعداد الأساسي في:

```text
src/i18n.ts
```

عند إضافة نص جديد في الواجهة، الأفضل إضافته إلى ملفات الترجمة واستخدام `useTranslation`.

## 10. إدارة بيانات السيرفر

React Query مضبوط في:

```text
src/lib/queryClient.ts
```

الإعدادات الحالية:

- `staleTime`: خمس دقائق افتراضيا.
- `gcTime`: ثلاثون دقيقة.
- `retry`: مرتان للقراءات.
- `mutations.retry`: صفر.

في كل ميزة، يفضل تعريف query keys واضحة مثل:

```ts
export const regionKeys = {
  all: ['regions'] as const,
  pageData: () => [...regionKeys.all, 'page-data'] as const,
  detail: (id: number) => [...regionKeys.all, 'detail', id] as const,
};
```

بعد أي mutation، استخدم `invalidateQueries` لتحديث البيانات المتأثرة.

## 11. المكونات المشتركة

المكونات العامة موجودة في:

```text
src/components/ui/
```

أمثلة:

- `Button`
- `Input`
- `Modal`
- `Table`
- `Pagination`
- `Tabs`
- `Badge`
- `Toast`
- `ErrorState`
- `EmptyState`

قبل بناء مكون جديد، ابحث هل يوجد مكون مناسب في `components/ui` أو داخل نفس الميزة.

## 12. أسلوب TypeScript في المشروع

المشروع يستخدم إعدادات صارمة في `tsconfig.app.json`:

- `strict: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noImplicitReturns: true`

هذا يعني أن الكود يجب أن يكون نظيفا من المتغيرات غير المستخدمة وأن يرجع قيما واضحة من الدوال.

استخدم alias `@` للاستيراد من `src`:

```ts
import { apiClient } from '@/lib/axios';
import { Button } from '@/components/ui/Button';
```

## 13. مثال عملي: إضافة Endpoint جديد

إذا أردت إضافة عملية جديدة داخل ميزة المناطق:

1. عرّف نوع البيانات في `src/features/regions/api/regionsApi.ts`.
2. أضف دالة API داخل `regionsApi`.
3. أضف hook في `src/features/regions/hooks/useRegions.ts`.
4. استخدم hook داخل الصفحة أو المكون.
5. أضف رسائل Toast وترجمات عند النجاح أو الفشل.
6. شغل `npm run build` للتأكد من الأنواع والبناء.

مثال مبسط:

```ts
// api file
archiveZone: async (id: number): Promise<void> => {
  await apiClient.post(`/api/v1/admin/zones/${id}/archive`);
}
```

```ts
// hooks file
export function useArchiveZone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => regionsApi.archiveZone(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: regionKeys.pageData() });
    },
  });
}
```

## 14. أين أبدأ كمطور جديد؟

ابدأ بهذا الترتيب:

1. شغل المشروع محليا بـ `npm run dev`.
2. اقرأ `src/app/App.tsx` لفهم الصفحات والصلاحيات.
3. اقرأ `src/lib/axios.ts` لفهم الاتصال بالـ Backend.
4. اقرأ ميزة واحدة كاملة مثل `src/features/regions`.
5. افتح `src/components/ui` لمعرفة المكونات الجاهزة.
6. جرّب تعديل بسيط في صفحة قائمة، ثم شغل `npm run build`.

## 15. ملاحظات مهمة قبل التعديل

- لا تكرر منطق الاتصال بالـ API داخل الصفحات؛ ضعه في `features/*/api`.
- لا تجعل الصفحة مسؤولة عن تفاصيل backend raw fields؛ استخدم mapping داخل api service عند الحاجة.
- استخدم React Query للقراءات والتعديلات بدل state يدوي لبيانات السيرفر.
- حافظ على route constants داخل `src/routes/routes.ts`.
- أضف النصوص الجديدة في ملفات الترجمة.
- بعد أي تعديل مهم، شغل `npm run build`.

## 16. أوامر مفيدة

```powershell
# تشغيل التطوير
npm run dev

# بناء الإنتاج وفحص TypeScript ضمنيا عبر Vite
npm run build

# تشغيل ESLint
npm run lint

# تشغيل الاختبارات
npm run test

# البحث في الملفات بسرعة
rg "regionsApi" src
rg --files src/features/regions
```

## 17. ملخص سريع جدا

المشروع Dashboard إداري. كل مجال عمل له feature مستقلة. الصفحات لا تتصل بالـ Backend مباشرة في الغالب، بل تستخدم hooks، والـ hooks تستخدم services داخل `api`. الاتصال المركزي يمر عبر `apiClient`. الصلاحيات والراوتات معرفة في `App.tsx` و`routes.ts`. عند إضافة شيء جديد، اتبع نفس النمط الموجود في أقرب feature مشابهة.
