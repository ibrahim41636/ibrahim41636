# Selorin — موقع سيلورين للاستشارات البيئية

موقع ثابت (HTML/CSS/JS بدون أطر عمل) باللغة العربية واتجاه RTL، مبني على هوية سيلورين (Brand Direction v1)، وبهيكل صفحات مشابه لموقع Applus+.

## الصفحات

| الملف | الصفحة | المقابل في Applus+ |
|---|---|---|
| `index.html` | الرئيسية (عرض متحرك، أرقام، حلول محورية، خدمات، قطاعات، أخبار، وظائف) | Home |
| `services.html` | خدماتنا (الرصد، الاستشارات، المختبر) | Services |
| `dust-monitoring.html` | **أجهزة رصد الغبار** — صفحة مستقلة | Service detail |
| `fuel-stations-voc.html` | **نظام رصد VOC الثابت لمحطات الوقود** (PID، متطلبات NCEC) — مع مخطط ومحاكاة تفاعلية | Service detail |
| `industries.html` | القطاعات | Industries |
| `about.html` | من نحن | About us |
| `sustainability.html` | الاستدامة | Sustainability |
| `governance.html` | الحوكمة والجودة + الخصوصية والشروط | Corporate governance |
| `news.html` | الأخبار والمعرفة | Newsroom |
| `careers.html` | الوظائف | Careers |
| `contact.html` | تواصل معنا / اطلب عرض سعر | Contact |

## البنية

```
src/
  partials/   layout, header (قوائم Mega)، footer، sprite الأيقونات
  pages/      محتوى كل صفحة (يبدأ بسطر meta يحدد العنوان والوصف)
  assets/     css / js / img / icons
site.config.json   بيانات التواصل ونقطة استقبال النماذج
build.mjs          يجمع الصفحات في dist/ ويولّد sitemap.xml وفهرس البحث
```

## التشغيل

```bash
node build.mjs          # بناء إلى dist/
npm run dev             # بناء مع مراقبة التغييرات + خادم محلي على 4173
```

## الربط (قبل الإطلاق)

1. **بيانات التواصل**: عدّل `site.config.json` (الهاتف، البريد، واتساب، العنوان، روابط التواصل الاجتماعي). القيم الحالية مأخوذة من بطاقة العمل في دليل الهوية ويجب تأكيدها.
2. **النماذج**: ضع رابط استقبال في `formEndpoint` (مثل Formspree أو Make/Zapier أو API خاص أو CRM). بدون رابط، تفتح النماذج برنامج البريد برسالة جاهزة إلى `email`.
3. **النطاق والاستضافة**: عند الدمج في `main` يُنشر الموقع تلقائياً على GitHub Pages عبر `.github/workflows/deploy.yml` (فعّل Pages من إعدادات المستودع واختر GitHub Actions). اربط النطاق `selorin.com` من إعدادات Pages وعدّل `siteUrl`.
4. **الصور**: الصور الحالية مقتطعة من ملف الهوية؛ استبدلها بصور فعلية للمشاريع والأجهزة بنفس الأسماء داخل `src/assets/img/`.

## التصميم في Figma

ملف Figma «Selorin — Website» (https://www.figma.com/design/dgIZY2N6vhToY5m4GVSWmW) يحتوي على صفحة نظام التصميم (الألوان، الخطوط، الأزرار، البطاقات) وتصاميم الصفحات الرئيسية. القيم في `:root` داخل `main.css` تطابق متغيرات Figma بالأسماء نفسها.
