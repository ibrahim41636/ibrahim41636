# تطبيقات سيلورين على iPhone وAndroid

التطبيقان في مجلد `app/`، مبنيان بـ Capacitor. يفتح كل منهما موقع `selorin.co/ar/` داخل تطبيق أصلي له أيقونة وشاشة بداية خاصة به. أي تعديل على الموقع يظهر في التطبيقين فوراً، ولا يحتاج تحديثاً من المتجر.

| البند | القيمة |
|---|---|
| معرّف التطبيق (Bundle ID / Package) | `co.selorin.app` |
| الاسم | سيلورين (Android بالعربية) · Selorin (iOS) |
| الصفحة الأولى | `https://selorin.co/ar/?utm_source=app` |
| بدون إنترنت | صفحة «لا يوجد اتصال» من داخل التطبيق |

## البناء التلقائي

يعمل سير العمل `.github/workflows/mobile.yml` في GitHub Actions عند كل تعديل على `app/`، ويمكن تشغيله يدوياً:
GitHub ← Actions ← Mobile apps ← Run workflow.

- **Android:** ينتج ملف APK للتجربة، وملف AAB للرفع إلى Google Play. تجدهما في أسفل صفحة التشغيل تحت Artifacts.
- **iOS:** يتحقق أن مشروع Xcode يُبنى دون أخطاء. نسخة المتجر تحتاج حساب Apple، وخطواتها في القسم 2.

### تجربة التطبيق على Android الآن
1. حمّل ملف `selorin-android-…` من Artifacts وفك الضغط عنه.
2. انقل `app-debug.apk` إلى الجوال وافتحه، ووافق على «التثبيت من مصادر غير معروفة».

## 1) نشر Android على Google Play

1. أنشئ حساب مطوّر في play.google.com/console. الرسوم 25 دولاراً تُدفع مرة واحدة، وحساب «منظمة» يحتاج رقم D-U-N-S.
2. أنشئ **مفتاح الرفع** (upload key) مرة واحدة على جهازك:
   ```
   keytool -genkeypair -v -keystore selorin-upload.jks -alias selorin -keyalg RSA -keysize 2048 -validity 10000
   ```
   احتفظ بالملف وكلمتي المرور في مكان آمن. ضياعهما يعني طلب إعادة تعيين المفتاح من Google.
3. في GitHub افتح Settings ← Secrets and variables ← Actions ← New repository secret، وأضف:
   - `ANDROID_KEYSTORE_BASE64`: ناتج الأمر `base64 -w0 selorin-upload.jks` (في macOS: `base64 -i selorin-upload.jks`)
   - `ANDROID_KEYSTORE_PASSWORD`
   - `ANDROID_KEY_ALIAS`: `selorin`
   - `ANDROID_KEY_PASSWORD`
4. شغّل سير العمل من جديد، فيصبح ملف AAB موقّعاً. ارفعه في Play Console ← Create app ← Internal testing أولاً، ثم Production.
5. متطلبات صفحة المتجر:
   - رابط سياسة الخصوصية: `https://selorin.co/ar/legal/privacy/`
   - لقطات شاشة للجوال
   - أيقونة 512×512، وهي `app/assets/icon-only.png` بعد تصغيرها
   - استبيان «أمان البيانات»: التطبيق يجمع الاسم والبريد والجوال عبر نموذج الطلب لغرض التواصل فقط

## 2) نشر iOS على App Store

1. سجّل في Apple Developer Program من developer.apple.com. الرسوم 99 دولاراً سنوياً، وحساب الشركة يحتاج رقم D-U-N-S.
2. أنشئ التطبيق في App Store Connect بالمعرّف `co.selorin.app`.
3. أنشئ مفتاح API من App Store Connect ← Users and Access ← Integrations، بصلاحية App Manager. ثم أضف إلى GitHub Secrets:
   - `APPSTORE_KEY_ID`
   - `APPSTORE_ISSUER_ID`
   - `APPSTORE_KEY_P8`: محتوى ملف ‎.p8
   - `APPLE_TEAM_ID`

   بعدها نضيف خطوة التوقيع والرفع إلى TestFlight في سير العمل.
4. **تنبيه مراجعة Apple (البند 4.2):** ترفض Apple التطبيقات التي تكتفي بعرض موقع. لذلك نضيف قبل الإرسال ميزات أصلية:
   - إشعارات فورية عند تغيّر حالة الطلب
   - مشاركة رقم الطلب
   - صفحة الطلبات محفوظة على الجهاز

## تعديل التطبيق

- **الأيقونة وشاشة البداية:** عدّل الصور في `app/assets/` ثم نفّذ داخل `app/`:
  ```
  npm run assets && npx cap sync
  ```
- **الصفحة الأولى والإعدادات:** في `app/capacitor.config.json`.
- **رقم الإصدار:**
  - Android: يأخذه تلقائياً من رقم التشغيل في GitHub Actions.
  - iOS: يُضبط من حقل `MARKETING_VERSION` في Xcode.
