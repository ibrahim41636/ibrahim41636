# دليل تحسين حسابات سيلورين على المنصات (البحث والتحويل)

**الغرض:** نصوص جاهزة للنسخ واللصق، بالعربية والإنجليزية، لكل حساب رسمي لسيلورين، مع شرح موجز لسبب كل اختيار. الهدف أن يظهر الحساب عند البحث بكلمات الخدمة (داخل المنصة وفي جوجل)، وأن ينتقل الزائر بخطوة واحدة إلى صفحة الخدمة المناسبة أو إلى نموذج الطلب.

**آخر تحديث:** 2026-10-20 · **المسؤول:** مدير التواصل الاجتماعي · **المرجع الملزم:** `docs/content-guide.md`

> **قواعد لا استثناء فيها عند تعديل أي نص في هذا الملف:**
> 1. لا ندّعي اعتمادًا أو ترخيصًا أو تسجيلًا لدى أي جهة، ولا نذكر عملاء أو عدد مشاريع أو سنوات خبرة أو حجم فريق أو أسعارًا أو مدد تنفيذ مضمونة أو جوائز أو شراكات.
> 2. لا نستخدم عبارات المبالغة («الرائدة»، «الأفضل»، «الأولى»، «لا مثيل لها»، «حلول متكاملة في مكان واحد»)، ولا علامات التعجب، ولا الرموز التعبيرية في النصوص الرسمية.
> 3. نصف **الخدمة وطريقة العمل وما يستلمه العميل** فقط. إذا احتاج نص إلى معلومة غير متوفرة نكتب `[CONTENT REQUIRED: …]` ولا نخمّن.
> 4. الحدود المذكورة لعدد الأحرف هي الحدود المعتمدة في هذا الدليل، وقد عُدّت جميع النصوص آليًا (انظر القسم 13). المنصات تغيّر حدودها أحيانًا؛ إذا رفض الحقل النص فاختصروا من آخره ولا تحذفوا الكلمة المفتاحية.

---

## 0. الثوابت (تُنسخ كما هي في كل حساب)

| البند | القيمة |
|---|---|
| الاسم العربي | سيلورين للاستشارات والخدمات البيئية |
| الاسم الإنجليزي | Selorin Environmental Advisory & Services |
| الاسم المختصر | Selorin / سيلورين |
| الموقع | https://selorin.co (العربية: https://selorin.co/ar/) |
| البريد | sales@selorin.co |
| الهاتف وواتساب | +966 55 015 6887 (رابط واتساب: https://wa.me/966550156887) |
| النطاق الجغرافي | المملكة العربية السعودية (الموقع يذكر: الرياض، جدة، مكة المكرمة، المدينة المنورة، الدمام والخبر، الجبيل، ينبع، تبوك ونيوم، أبها، القصيم، حائل، جازان) |
| العنوان وساعات العمل | `[CONTENT REQUIRED: العنوان الوطني المسجل وساعات العمل الرسمية]` |

**الوصف المرجعي (Positioning)** الذي تُبنى عليه كل النصوص: سيلورين تحوّل المتطلبات النظامية والبيانات البيئية إلى قرارات واضحة يمكن الدفاع عنها، وتجمع التصاريح والامتثال والدراسات البيئية والرصد الميداني والاستدامة والطاقة المتجددة تحت فريق واحد مسؤول.

---

## 1. توحيد الاسم والمعرّف (Handle)

### 1.1 الوضع الحالي (من `src/i18n/ui.ts`)

| المنصة | الرابط الحالي في الموقع | الملاحظة |
|---|---|---|
| لينكد إن | `linkedin.com/company/selorin/` | جيد، يُبقى عليه |
| إنستغرام | `instagram.com/selorin5/` | الرقم 5 لا يحمل معنى ويُضعف التذكر والبحث |
| تيك توك | `tiktok.com/@selorin86` | الرقم 86 لا يحمل معنى، ولا يطابق إنستغرام |
| إكس | غير مضاف | يُنشأ ويُضاف |
| يوتيوب | غير مضاف | يُنشأ ويُضاف |
| فيسبوك | غير موجود في إعدادات الموقع | يُضاف مفتاح `facebook` عند الإنشاء |

### 1.2 التوصية

- **معرّف واحد في كل المنصات** بهذا الترتيب حسب التوفر: `selorin` ← `selorin_sa` ← `selorinsa`. نحجز الخيار نفسه في كل المنصات حتى لو توفر الخيار الأول في بعضها فقط؛ التطابق أهم من القِصر.
- اخترنا الشرطة السفلية (_) بدل النقطة لأنها مقبولة في أغلب المنصات (إكس مثلًا لا يقبل النقطة). تأكدوا من التوفر في جميع المنصات **قبل** تغيير أي معرّف.
- **الاسم الظاهر (Display name):** يبدأ دائمًا بـ «سيلورين» أو «Selorin» يليه وصف بكلمة مفتاحية (مثال: «سيلورين | استشارات بيئية»). الاسم الظاهر يدخل في البحث داخل إنستغرام وتيك توك وإكس، أما المعرّف فثابت للهوية.
- **في ملف جوجل التجاري فقط:** الاسم هو الاسم التجاري الفعلي كما في السجل واللافتة، دون أي كلمات مفتاحية مضافة.
- الصورة الرمزية واحدة في كل المنصات: `avatar-800.png`.

### 1.3 خطوات التغيير (بالترتيب)

1. احجزوا المعرّف الجديد في المنصات التي لم تُنشأ بعد (إكس، يوتيوب، فيسبوك).
2. غيّروا معرّفي إنستغرام وتيك توك. الروابط القديمة قد تتوقف عن العمل بعد التغيير، لذلك:
3. حدّثوا كائن `social` في `src/i18n/ui.ts` في اليوم نفسه (أضيفوا `x` و`youtube` و`facebook`)، فهو يغذي رأس الموقع وتذييله وصفحة «آخر المستجدات» وبيانات `sameAs` المهيكلة في `src/lib/schema.ts`.
4. حدّثوا أي رابط مطبوع (ملف الشركة PDF `selorin-company-profile.pdf`، التوقيعات البريدية، العروض).

---

## 2. نظام روابط UTM

كل رابط في أي حساب يحمل ثلاث معاملات ثابتة، ويطابق `utm_source` القيم المستخدمة في `src/lib/social.ts` (`CHANNEL_INFO`) حتى تظهر الطلبات في تقرير القمع داخل لوحة الإدارة:

- `utm_source`: `linkedin` · `instagram` · `tiktok` · `youtube` · `x` · `facebook` · `google_business` · `whatsapp`
- `utm_medium=social` دائمًا
- `utm_campaign=bio` لكل روابط الحسابات الدائمة (السيرة، الأزرار، الوصف، المنشور المثبت)
- `utm_content` (اختياري) لتمييز موضع الرابط: `button`، `pinned`، `about`، `highlight`، `catalogue_<service-id>`، `product_<group>`

| الحساب | الرابط الأساسي |
|---|---|
| إنستغرام | https://selorin.co/ar/?utm_source=instagram&utm_medium=social&utm_campaign=bio |
| تيك توك | https://selorin.co/ar/?utm_source=tiktok&utm_medium=social&utm_campaign=bio |
| إكس | https://selorin.co/ar/?utm_source=x&utm_medium=social&utm_campaign=bio |
| لينكد إن (حقل الموقع) | https://selorin.co/ar/?utm_source=linkedin&utm_medium=social&utm_campaign=bio |
| لينكد إن (الزر) | https://selorin.co/ar/request/?utm_source=linkedin&utm_medium=social&utm_campaign=bio&utm_content=button |
| يوتيوب | https://selorin.co/ar/?utm_source=youtube&utm_medium=social&utm_campaign=bio |
| فيسبوك | https://selorin.co/ar/?utm_source=facebook&utm_medium=social&utm_campaign=bio |
| ملف جوجل التجاري (الموقع) | https://selorin.co/ar/?utm_source=google_business&utm_medium=social&utm_campaign=bio |
| واتساب للأعمال | https://selorin.co/ar/?utm_source=whatsapp&utm_medium=social&utm_campaign=bio |

**قاعدة صفحة الخدمة:** لأي رابط يخص خدمة بعينها نستبدل `/ar/` بمسار الخدمة، مثل:
`https://selorin.co/ar/services/solar-energy-systems/?utm_source=instagram&utm_medium=social&utm_campaign=bio&utm_content=highlight`

**ملاحظة:** رابط واتساب `wa.me` لا يحمل UTM، والموقع يسجّل نقرات واتساب بحدث `whatsapp_click` مستقل.

---

## 3. الصور الجاهزة (`docs/marketing/brand-assets/`)

| الملف | الاستخدام | ملاحظة عند الرفع |
|---|---|---|
| `avatar-800.png` | الصورة الرمزية في كل المنصات بلا استثناء | الشعار داخل دائرة، فلا يُقص عند العرض الدائري |
| `linkedin-cover-1128x191.png` | غلاف صفحة لينكد إن | النص في الجهة اليمنى، بعيدًا عن موضع الشعار أسفل اليسار |
| `x-header-1500x500.png` | ترويسة إكس | تحققوا على الجوال من أن الصورة الرمزية لا تغطي النص |
| `facebook-cover-1640x624.png` | غلاف صفحة فيسبوك | راجعوا العرض على الجوال والحاسب بعد الرفع |
| `youtube-banner-2560x1440.png` | لافتة قناة يوتيوب | النص داخل المنطقة الوسطى الآمنة فيظهر على التلفاز والجوال |
| `google-business-cover-1024x576.png` | صورة الغلاف في ملف جوجل التجاري | جوجل قد يختار صورة أخرى للعرض؛ ارفعوا أيضًا صورًا ميدانية حقيقية (القسم 10.7) |

**ملاحظة للتصميم:** الأغلفة تذكر «تصاريح وامتثال · دراسات بيئية · رصد وقياس · استدامة · طاقة متجددة» (حُدّثت في 2026-10-25). لإعادة توليدها: `npm run social:images -- --profiles` بعد حذف الملف القديم.

---

## 4. الكلمات المفتاحية المعتمدة للحسابات

مأخوذة من `docs/seo-keywords-sa.md` حتى لا تتعارض الحسابات مع الموقع. نستخدم في كل سيرة كلمة عامة واحدة على الأقل وكلمتين من الخدمات.

| المجموعة | العربية | الإنجليزية |
|---|---|---|
| عامة | استشارات بيئية، مكتب استشارات بيئية، خدمات بيئية للمنشآت | environmental consultancy Saudi Arabia, environmental services |
| التصاريح والامتثال | التصريح البيئي، الامتثال البيئي، التدقيق البيئي، الفحص البيئي النافي للجهالة | environmental permit, environmental compliance, environmental audit, due diligence |
| الدراسات | دراسة تقييم الأثر البيئي، خطة الإدارة البيئية | EIA, environmental management plan |
| الرصد | الرصد البيئي، قياس جودة الهواء، قياس الغبار، قياس الضوضاء، تحليل المياه | environmental monitoring, air quality, dust monitoring, noise, water quality |
| النفايات | إدارة النفايات، الاقتصاد الدائري | waste management, circular economy |
| الاستدامة والمناخ | الحوكمة البيئية والاجتماعية والمؤسسية (ESG)، البصمة الكربونية، الحياد الصفري، تقييم دورة الحياة | ESG, GHG inventory, carbon footprint, net zero, LCA |
| المباني | المباني الخضراء، مستدام، LEED | green buildings, Mostadam, LEED |
| الطاقة المتجددة | الطاقة الشمسية، تخزين الطاقة بالبطاريات، شواحن السيارات الكهربائية | solar PV, battery storage, EV charging |

---

## 5. لينكد إن (صفحة الشركة)

**لماذا يهم:** جمهورنا الأساسي (مديرو البيئة والسلامة، مديرو المشاريع، المشتريات، الملاك) يبحث ويقيّم المستشارين هنا. السطر التعريفي (Tagline) يظهر تحت اسم الصفحة، والنبذة (About) هي أول نص يقرؤه من يفتح الصفحة لتقييمنا، لذلك نضع فيهما كلمات الخدمات كما يبحث عنها العميل.

**الإعدادات:**
- الاسم: `Selorin Environmental Advisory & Services`، وإذا أتاحت الصفحة خيار إضافة لغة (Manage languages) نضيف العربية بالاسم «سيلورين للاستشارات والخدمات البيئية» والسطر التعريفي والنبذة العربيين أدناه.
- الموقع الإلكتروني: رابط لينكد إن (حقل الموقع) في القسم 2.
- القطاع (Industry): اختاروا الأقرب من القائمة، مثل `Environmental Services`.
- الموقع الجغرافي: `[CONTENT REQUIRED: العنوان المسجل]`.
- الشعار `avatar-800.png` والغلاف `linkedin-cover-1128x191.png`.

### 5.1 السطر التعريفي (الحد 120 حرفًا)

بأسلوب صفحات الشركات الكبرى (مثل PwC): الغاية أولًا ثم الكلمات التي يُبحث بها. الإنجليزية لغة الصفحة الأساسية، والعربية تُضاف من Manage languages.

الإنجليزية:

```text
Turning environmental requirements into clear decisions | Environmental advisory & renewable energy in Saudi Arabia
```

> عدد الأحرف: **115** من 120

العربية:

```text
نحوّل المتطلبات البيئية إلى قرارات واضحة | استشارات بيئية وطاقة متجددة في المملكة العربية السعودية
```

> عدد الأحرف: **98** من 120

### 5.2 النبذة About (الحد 2000 حرف)

البنية: الغاية، ثم من نحن، ثم الممارسات السبع كما في الموقع، ثم القطاعات، ثم الصلة برؤية 2030 ومبادرة السعودية الخضراء، ثم الدعوة إلى الإجراء.

الإنجليزية:

```text
Selorin helps organizations in Saudi Arabia grow responsibly. We turn environmental requirements and data into clear decisions that our clients can defend to regulators, investors and the communities around them.

We are an environmental advisory and services firm. One accountable team brings regulatory, technical and field expertise together across seven practices:

• Permitting & Compliance: environmental permits, compliance management, environmental records and reporting, audits and environmental due diligence.
• Environmental Studies: environmental impact assessment (EIA) and environmental management plans for construction and operation.
• Monitoring & Measurement: ambient air and emissions, dust (PM10 and PM2.5), fuel station VOC, noise and vibration, water and wastewater.
• Waste & Circular Economy: waste management plans and records, and circular economy roadmaps.
• Sustainability, ESG & Climate: ESG advisory, GHG and carbon accounting, net zero roadmaps, sustainability strategy and life cycle assessment.
• Sustainable Buildings & Infrastructure: green building advisory and support through Mostadam, LEED and Envision.
• Renewable Energy: solar PV systems, battery energy storage, EV charging stations, feasibility studies, and operation and maintenance.

We serve industry and manufacturing, construction, real estate, energy and utilities, oil and gas, mining, logistics, healthcare, hospitality, food and beverage, infrastructure and the public sector, from project concept through operation.

Our work helps clients contribute to the environmental goals of Saudi Vision 2030 and the Saudi Green Initiative.

Request a consultation: selorin.co/request
sales@selorin.co | +966 55 015 6887
```

> عدد الأحرف: **1714** من 2000

العربية:

```text
تساعد سيلورين المنشآت والمشاريع في المملكة العربية السعودية على النمو بمسؤولية. نحوّل المتطلبات النظامية والبيانات البيئية إلى قرارات واضحة يمكن الدفاع عنها أمام الجهات المختصة والمستثمرين والمجتمع المحيط.

سيلورين شركة استشارات وخدمات بيئية، يجمع فيها فريق واحد مسؤول الخبرة التنظيمية والفنية والميدانية في سبعة مجالات:

• التصاريح والامتثال: التصاريح البيئية، وإدارة الامتثال، والسجلات والتقارير البيئية، والتدقيق البيئي، والفحص البيئي النافي للجهالة.
• الدراسات البيئية: تقييم الأثر البيئي (EIA)، وخطط الإدارة البيئية للإنشاء والتشغيل.
• الرصد والقياس: جودة الهواء والانبعاثات، والغبار (PM10 وPM2.5)، والمركبات العضوية المتطايرة في محطات الوقود، والضوضاء والاهتزازات، والمياه ومياه الصرف.
• النفايات والاقتصاد الدائري: خطط إدارة النفايات وسجلاتها، وخرائط طريق الاقتصاد الدائري.
• الاستدامة والحوكمة والمناخ: استشارات ESG، وحصر انبعاثات غازات الاحتباس الحراري، وخرائط الحياد الصفري، واستراتيجيات الاستدامة، وتقييم دورة الحياة.
• المباني والبنية التحتية المستدامة: استشارات المباني الخضراء، والدعم خلال أنظمة مستدام وLEED وEnvision.
• الطاقة المتجددة: أنظمة الطاقة الشمسية، وتخزين الطاقة بالبطاريات، ومحطات شحن السيارات الكهربائية، ودراسات الجدوى، والتشغيل والصيانة.

نخدم الصناعة والتصنيع، والإنشاءات، والتطوير العقاري، والطاقة والمرافق، والنفط والغاز، والتعدين، والخدمات اللوجستية، والرعاية الصحية، والضيافة، والأغذية والمشروبات، والبنية التحتية، والقطاع الحكومي، من فكرة المشروع حتى تشغيله.

ويساعد عملنا عملاءنا على الإسهام في المستهدفات البيئية لرؤية السعودية 2030 ومبادرة السعودية الخضراء.

اطلب استشارة: selorin.co/ar/request
sales@selorin.co | +966 55 015 6887
```

> عدد الأحرف: **1569** من 2000

### 5.2.1 المنشور التعريفي المثبّت

الإنجليزية (يُثبّت عبر Feature on top):

```text
Meet Selorin.

Environmental requirements in Saudi Arabia keep growing, and so does the data behind them. Our job is to turn both into clear decisions for facilities and projects.

One accountable team for:
• Environmental permits and compliance
• EIA and environmental management plans
• Air, dust, noise and water monitoring
• Waste and circular economy
• ESG, carbon accounting and net zero
• Green buildings: Mostadam and LEED
• Solar PV, battery storage and EV charging

Follow the page for practical guides in English and Arabic, or tell us about your project:
https://selorin.co/request/?utm_source=linkedin&utm_medium=social&utm_campaign=bio&utm_content=pinned

#Selorin #SaudiArabia #Sustainability #EnvironmentalCompliance
```

> عدد الأحرف: **732** من 3000

العربية:

```text
تعرّف على سيلورين.

تتزايد المتطلبات البيئية في المملكة، وتتزايد معها البيانات التي تقوم عليها. عملنا أن نحوّلهما إلى قرارات واضحة للمنشآت والمشاريع.

فريق واحد مسؤول عن:
• التصاريح البيئية والامتثال
• تقييم الأثر البيئي وخطط الإدارة البيئية
• رصد الهواء والغبار والضوضاء والمياه
• النفايات والاقتصاد الدائري
• ESG والبصمة الكربونية والحياد الصفري
• المباني الخضراء: مستدام وLEED
• الطاقة الشمسية وتخزين الطاقة وشواحن السيارات الكهربائية

تابعوا الصفحة لأدلة عملية بالعربية والإنجليزية، أو أخبرونا عن مشروعكم:
https://selorin.co/ar/request/?utm_source=linkedin&utm_medium=social&utm_campaign=bio&utm_content=pinned

#سيلورين #السعودية #الاستدامة #الامتثال_البيئي
```

> عدد الأحرف: **662** من 3000

### 5.3 التخصصات (Specialties)

تُدخل بالترتيب (الأهم أولًا). إذا رفضت المنصة العدد فاحذفوا من آخر القائمة.

```text
Environmental Permitting
Environmental Compliance
Environmental Impact Assessment
Environmental Management Plans
Environmental Audits
Environmental Due Diligence
Environmental Monitoring
Air Quality Monitoring
Dust Monitoring
Noise Monitoring
Water Quality Monitoring
Fuel Station VOC Monitoring
Waste Management
ESG Advisory
GHG and Carbon Accounting
Net Zero Advisory
Green Building Advisory
Solar Energy Systems
Battery Energy Storage
EV Charging Stations
```

النسخة العربية (للنسخة العربية من الصفحة إن توفرت، أو في نهاية النبذة العربية):

```text
التصاريح البيئية، الامتثال البيئي، تقييم الأثر البيئي، خطط الإدارة البيئية، التدقيق البيئي، الفحص البيئي النافي للجهالة، الرصد البيئي، رصد جودة الهواء، رصد الغبار، رصد الضوضاء، رصد جودة المياه، رصد المركبات العضوية المتطايرة، إدارة النفايات، الحوكمة البيئية والاجتماعية والمؤسسية، البصمة الكربونية، الحياد الصفري، المباني الخضراء، الطاقة الشمسية، تخزين الطاقة، شواحن السيارات الكهربائية
```

### 5.4 الزر المخصص (Custom button)

- **نص الزر:** `Contact us` (تواصل معنا). نفضّله على «Visit website» لأنه يقود إلى نموذج الطلب مباشرة.
- **الرابط:** `https://selorin.co/ar/request/?utm_source=linkedin&utm_medium=social&utm_campaign=bio&utm_content=button`
- إذا أظهرت إحصاءات المتابعين أن أغلبهم يستخدم الواجهة الإنجليزية، استبدلوا `/ar/request/` بـ `/request/` مع إبقاء بقية المعاملات.

---

## 6. إنستغرام

**لماذا يهم:** **حقل الاسم** يظهر بجانب المعرّف في نتائج البحث داخل إنستغرام، لذلك نضع فيه الكلمة المفتاحية، ونترك للسيرة مهمة الشرح والدعوة إلى الإجراء. ويجب أن يكون الحساب **احترافيًا (تجاريًا)** ومربوطًا بصفحة فيسبوك، وهو شرط أيضًا للنشر الآلي (انظر `docs/social-funnel-ar.md`).

### 6.1 حقل الاسم (يُفضّل 30 حرفًا أو أقل)

```text
سيلورين | استشارات بيئية
```

> عدد الأحرف: **24** من 30

بديل إنجليزي إذا كان الجمهور المستهدف من الحساب إنجليزيًا:

```text
Selorin Environmental Advisory
```

> عدد الأحرف: **30** من 30

### 6.2 السيرة (الحد 150 حرفًا)

العربية (المعتمدة):

```text
استشارات بيئية وطاقة متجددة في السعودية
التصاريح والامتثال | الدراسات والرصد | ESG والكربون
الطاقة الشمسية وشواحن السيارات
اطلب استشارة من الرابط
```

> عدد الأحرف: **145** من 150

الإنجليزية (للمرجع أو لحساب إنجليزي مستقبلي):

```text
Environmental advisory and renewables in Saudi Arabia
Permits | EIA | Monitoring | ESG and carbon
Solar PV and EV charging
Request a consultation
```

> عدد الأحرف: **145** من 150

### 6.3 الرابط والأزرار

- **الرابط الأساسي:** `https://selorin.co/ar/?utm_source=instagram&utm_medium=social&utm_campaign=bio`
- إذا أتاح الحساب أكثر من رابط، أضيفوا بالترتيب:
  1. «اطلب استشارة» ← `https://selorin.co/ar/request/?utm_source=instagram&utm_medium=social&utm_campaign=bio&utm_content=request`
  2. «الطاقة الشمسية» ← `https://selorin.co/ar/services/solar-energy-systems/?utm_source=instagram&utm_medium=social&utm_campaign=bio&utm_content=solar`
  3. «التصريح البيئي» ← `https://selorin.co/ar/services/environmental-permitting/?utm_source=instagram&utm_medium=social&utm_campaign=bio&utm_content=permit`
- **أزرار التواصل:** البريد sales@selorin.co، الاتصال وواتساب +966 55 015 6887.
- **التصنيف:** اختاروا أقرب تصنيف يصف الاستشارات البيئية من القائمة، وأظهروه في الملف.

### 6.4 القصص المميزة (Highlights)

عشرة عناوين قصيرة بالترتيب، بأغلفة موحدة بلون الهوية (أخضر داكن ورمز بخط فاتح). كل قصة مميزة تنتهي بشريحة فيها رابط الخدمة (ملصق رابط) بالصيغة المذكورة في القسم 2 مع `utm_content=highlight`.

| العنوان على الغلاف | المحتوى | صفحة الوجهة |
|---|---|---|
| خدماتنا | المجموعات السبع للخدمات في 7 شرائح | `/ar/services/` |
| التصاريح | ما يلزم قبل طلب التصريح، والفرق بين التصريح والامتثال | `/ar/services/environmental-permitting/` |
| الدراسات | متى يحتاج المشروع تقييم أثر بيئي أو خطة إدارة بيئية | `/ar/services/environmental-impact-assessment/` |
| الرصد | الهواء، الغبار، الضوضاء، المياه، محطات الوقود | `/ar/services/environmental-monitoring/` |
| النفايات | التصنيف والسجلات والاقتصاد الدائري | `/ar/services/waste-management/` |
| ESG والكربون | حصر الانبعاثات، الحياد الصفري، تقارير ESG | `/ar/services/esg-advisory/` |
| مباني خضراء | مستدام وLEED والتصميم المبكر | `/ar/services/sustainable-buildings/` |
| طاقة شمسية | الأنظمة الشمسية والتخزين والصيانة | `/ar/services/solar-energy-systems/` |
| شحن السيارات | شواحن المنازل والمباني والمواقع التجارية | `/ar/services/ev-charging-stations/` |
| تواصل معنا | البريد، الهاتف، واتساب، نموذج الطلب | `/ar/request/` |

---

## 7. تيك توك

**لماذا يهم:** نتعامل مع تيك توك بوصفه مكانًا لإجابات قصيرة عن أسئلة محددة («وش هو التصريح البيئي؟»، «هل الطاقة الشمسية مجدية؟»). لذلك نكتب الكلمة المفتاحية في الاسم والسيرة، وفي النص على الشاشة ووصف المقطع.

### 7.1 الاسم

```text
سيلورين | استشارات بيئية
```

> عدد الأحرف: **24** من 30

### 7.2 السيرة (الحد 80 حرفًا)

العربية:

```text
استشارات بيئية وطاقة شمسية في السعودية: تصاريح، رصد، شواحن سيارات
```

> عدد الأحرف: **65** من 80

الإنجليزية:

```text
Environmental advisory and solar in Saudi Arabia: permits, monitoring, EV
```

> عدد الأحرف: **73** من 80

### 7.3 الرابط

- `https://selorin.co/ar/?utm_source=tiktok&utm_medium=social&utm_campaign=bio`
- إذا لم يظهر حقل الموقع، حوّلوا الحساب إلى **حساب أعمال**. وإن بقي الحقل غير متاح فلا تكتبوا الرابط في السيرة على حساب الكلمات المفتاحية؛ ضعوه في التعليق المثبت على كل فيديو.

---

## 8. يوتيوب

**لماذا يهم:** يوتيوب مكان طبيعي لأسئلة «كيف» («كيف يُقاس الغبار في موقع إنشائي؟»). اسم القناة ووصفها وقوائم التشغيل تبني فهرسًا منظمًا لكل مجموعة خدمات، وكل مقطع يقود إلى صفحة خدمة واحدة.

### 8.1 الاسم والمعرّف

- **اسم القناة:** `Selorin | سيلورين`
- **المعرّف:** `@selorin` (أو البديل الموحد من القسم 1).
- الصورة الرمزية `avatar-800.png`، واللافتة `youtube-banner-2560x1440.png`.
- **الروابط في القناة:** الموقع (رابط يوتيوب في القسم 2)، واتساب `https://wa.me/966550156887`، لينكد إن.
- إذا أتاحت إعدادات القناة إضافة ترجمة للاسم والوصف، نضيف الوصف الإنجليزي ترجمةً والعربي لغةً أساسية.

### 8.2 وصف القناة (الحد 1000 حرف)

العربية:

```text
قناة سيلورين للاستشارات والخدمات البيئية: شروحات عملية للمنشآت والمشاريع في المملكة العربية السعودية حول التصاريح البيئية والامتثال، ودراسات تقييم الأثر البيئي (EIA)، والرصد البيئي للهواء والغبار والضوضاء والمياه، وإدارة النفايات، والحوكمة البيئية والاجتماعية والمؤسسية (ESG) والبصمة الكربونية، والمباني الخضراء، والطاقة الشمسية وتخزين الطاقة وشواحن السيارات الكهربائية.

ستجد هنا:
- مقاطع قصيرة تجيب عن سؤال واحد في أقل من دقيقة.
- شروحات أطول لخطوات العمل والمستندات المطلوبة وطريقة القياس في الموقع.
- قوائم تشغيل لكل مجموعة خدمات.

نشرح المنهجية وما يستلمه العميل، ولا نقدم استشارة خاصة بمنشأتك في التعليقات. لطلب استشارة:
selorin.co | sales@selorin.co | +966 55 015 6887
```

> عدد الأحرف: **675** من 1000

الإنجليزية:

```text
Selorin Environmental Advisory & Services: practical explainers for facilities and projects in Saudi Arabia on environmental permits and compliance, environmental impact assessment (EIA), air, dust, noise and water monitoring, waste management, ESG and carbon accounting, green buildings, and solar PV, battery storage and EV charging.

On this channel:
- Shorts that answer one question in under a minute.
- Longer explainers on the steps, the documents needed and how we measure on site.
- A playlist for each service group.

We explain methods and deliverables; we do not give site-specific advice in the comments. To request a consultation:
selorin.co | sales@selorin.co | +966 55 015 6887
```

> عدد الأحرف: **693** من 1000

### 8.3 كلمات القناة المفتاحية (Channel keywords)

```text
سيلورين, Selorin, استشارات بيئية, التصريح البيئي, الامتثال البيئي, تقييم الأثر البيئي, الرصد البيئي, جودة الهواء, رصد الغبار, قياس الضوضاء, تحليل المياه, إدارة النفايات, الاقتصاد الدائري, ESG, البصمة الكربونية, الحياد الصفري, المباني الخضراء, مستدام, LEED, الطاقة الشمسية, تخزين الطاقة, شواحن السيارات الكهربائية, environmental consultancy Saudi Arabia, environmental permit, EIA, environmental monitoring, solar PV Saudi Arabia, EV charging
```

### 8.4 قوائم التشغيل (واحدة لكل مجموعة خدمات)

وصف كل قائمة يبدأ بجملة تعريفية فيها الكلمة المفتاحية، ثم رابط المجموعة. صيغة الرابط: `?utm_source=youtube&utm_medium=social&utm_campaign=bio&utm_content=playlist_<group>`.

| # | العنوان العربي | العنوان الإنجليزي | الخدمات المشمولة | الرابط الأساسي |
|---|---|---|---|---|
| 1 | التصاريح والامتثال البيئي | Environmental permits and compliance | التصاريح، الامتثال، السجلات والتقارير، التدقيق، الفحص النافي للجهالة | `/ar/services/environmental-permitting/` |
| 2 | الدراسات البيئية: تقييم الأثر وخطط الإدارة | Environmental studies: EIA and EMPs | تقييم الأثر البيئي، خطط الإدارة البيئية | `/ar/services/environmental-impact-assessment/` |
| 3 | الرصد والقياس البيئي | Environmental monitoring | الرصد البيئي، الهواء، الغبار، محطات الوقود، الضوضاء، المياه | `/ar/services/environmental-monitoring/` |
| 4 | إدارة النفايات والاقتصاد الدائري | Waste and circular economy | إدارة النفايات، الاقتصاد الدائري | `/ar/services/waste-management/` |
| 5 | الاستدامة والمناخ وESG | Sustainability, climate and ESG | ESG، حصر الانبعاثات، الحياد الصفري، الاستدامة، تقييم دورة الحياة | `/ar/services/esg-advisory/` |
| 6 | المباني المستدامة والخضراء | Sustainable and green buildings | المباني المستدامة، استشارات المباني الخضراء | `/ar/services/sustainable-buildings/` |
| 7 | الطاقة الشمسية والتخزين وشحن السيارات | Solar, storage and EV charging | الأنظمة الشمسية، البطاريات، الشواحن، الجدوى، التشغيل والصيانة | `/ar/services/solar-energy-systems/` |
| 8 | أسئلة في دقيقة | One-minute answers | كل الـShorts، مرتبة من الأحدث | `/ar/` |

مثال وصف قائمة (رقم 3):

```text
الرصد البيئي هو قياس منتظم لجودة الهواء والغبار والضوضاء والمياه وفق اشتراطات التصريح البيئي. في هذه القائمة نشرح مواقع القياس والمعدات والتقارير الدورية.
https://selorin.co/ar/services/environmental-monitoring/?utm_source=youtube&utm_medium=social&utm_campaign=bio&utm_content=playlist_monitoring
```

### 8.5 استراتيجية المقاطع القصيرة (Shorts)

1. **سؤال واحد لكل مقطع**، مكتوب كما يبحث عنه الناس، ويظهر نصًا على الشاشة في أول ثانيتين (مثل: «وش يلزمك قبل طلب التصريح البيئي؟»). العنوان = السؤال + الكلمة المفتاحية.
2. **المدة** بين 30 و60 ثانية، عمودي، مع نص عربي مدمج في الفيديو حتى يُفهم المقطع دون صوت.
3. **مقطع = خدمة واحدة**، وفي الوصف رابط صفحة الخدمة بصيغة UTM مع `utm_content=short_<service-id>`، وربط المقطع بالفيديو الطويل المناسب أو قائمة التشغيل.
4. **مصدر المقاطع:** منشورات التقويم التي تحمل `video: true` في خطة الحملة، فتُنشر المادة نفسها على تيك توك وإنستغرام (Reels) ويوتيوب. في الحملة الحالية تسعة مقاطع، وكل منها يُضاف إلى قائمة التشغيل المذكورة:

   | التاريخ | الخدمة | قائمة التشغيل (8.4) |
   |---|---|---|
   | 2026-10-26 | أنظمة الطاقة الشمسية | 7 |
   | 2026-10-27 | رصد الغبار | 3 |
   | 2026-10-29 | محطات شحن السيارات الكهربائية | 7 |
   | 2026-11-02 | أنظمة تخزين الطاقة بالبطاريات | 7 |
   | 2026-11-08 | استشارات الحياد الصفري | 5 |
   | 2026-11-15 | المباني المستدامة | 6 |
   | 2026-11-16 | تشغيل وصيانة مشاريع الطاقة المتجددة | 7 |
   | 2026-11-18 | الاقتصاد الدائري | 4 |
   | 2026-11-24 | استشارات الاستدامة | 5 |

   أي رقم أو نظام يرد في منشور التقويم الأصلي (الحقل `claim`) لا يُنقل إلى المقطع إلا إذا تحقق منه المحرر من مصدره الرسمي.
5. **الإيقاع:** مقطعان أسبوعيًا كحد أدنى، يتناوبان بين المجموعات السبع حتى تتغطى كل الخدمات خلال شهرين تقريبًا.
6. **لا أرقام ولا أنظمة** في المقطع إلا إذا وردت في مصدر رسمي فتحه الكاتب وذكره في الوصف. المحتوى المنهجي («كيف نقيس»، «ماذا تجهّز») لا يحتاج إحصاءات.
7. **من يظهر في المقطع:** مهندس أو مختص من الفريق بموافقته، في موقع حقيقي أو مع معدات حقيقية. لا لقطات لمواقع عملاء دون موافقة مكتوبة.

---

## 9. إكس (تويتر سابقًا)

### 9.1 الاسم الظاهر (يُفضّل 50 حرفًا أو أقل)

```text
سيلورين | استشارات بيئية وطاقة متجددة
```

> عدد الأحرف: **37** من 50

### 9.2 السيرة (الحد 160 حرفًا)

العربية:

```text
استشارات بيئية وطاقة متجددة في السعودية: التصاريح والامتثال، تقييم الأثر البيئي، الرصد، ESG والبصمة الكربونية، الطاقة الشمسية وشواحن السيارات الكهربائية.
```

> عدد الأحرف: **153** من 160

الإنجليزية:

```text
Environmental advisory and renewable energy in Saudi Arabia: permits and compliance, EIA, monitoring, ESG and carbon, solar PV and EV charging.
```

> عدد الأحرف: **143** من 160

- **الموقع الجغرافي:** المملكة العربية السعودية
- **الرابط:** `https://selorin.co/ar/?utm_source=x&utm_medium=social&utm_campaign=bio`
- الترويسة `x-header-1500x500.png`.

### 9.3 المنشور المثبت (الحد 280 حرفًا، والرابط محسوب بطوله الكامل)

عددنا الرابط بطوله الكامل احتياطًا، فيبقى المنشور ضمن الحد أيًا كانت طريقة احتساب المنصة للروابط. يُرفق بالمنشور تصميم من منشورات الحملة الحالية (صورة 1080×1350) حتى لا يظهر نصًا فقط.

العربية:

```text
سيلورين للاستشارات والخدمات البيئية
للمنشآت والمشاريع في المملكة:
- التصاريح والامتثال البيئي
- تقييم الأثر البيئي والرصد
- ESG والبصمة الكربونية
- الطاقة الشمسية وشواحن السيارات
https://selorin.co/ar/services/?utm_source=x&utm_medium=social&utm_campaign=bio&utm_content=pinned
```

> عدد الأحرف: **277** من 280

الإنجليزية (منشور ثانٍ في السلسلة نفسها، أو بديل إن قررتم حسابًا إنجليزيًا):

```text
Selorin Environmental Advisory & Services
For facilities and projects in Saudi Arabia:
- Permits and compliance
- EIA and monitoring
- ESG and carbon
- Solar PV and EV charging
https://selorin.co/services/?utm_source=x&utm_medium=social&utm_campaign=bio&utm_content=pinned
```

> عدد الأحرف: **272** من 280

---

## 10. فيسبوك (الصفحة)

- **اسم الصفحة:** سيلورين للاستشارات والخدمات البيئية
- **اسم المستخدم:** المعرّف الموحد (القسم 1).
- **التصنيف:** اختاروا أقرب تصنيف للاستشارات البيئية من القائمة، ويمكن إضافة تصنيف للطاقة الشمسية إن وُجد.
- **زر الإجراء:** «إرسال رسالة واتساب» على الرقم +966 55 015 6887، أو «تواصل معنا» برابط `https://selorin.co/ar/request/?utm_source=facebook&utm_medium=social&utm_campaign=bio&utm_content=button`.
- **الموقع الإلكتروني:** رابط فيسبوك في القسم 2. الغلاف `facebook-cover-1640x624.png`.
- **ملاحظة:** حساب إنستغرام التجاري يُربط بهذه الصفحة.

### 10.1 النبذة القصيرة (Intro، يُفضّل 100 حرف أو أقل)

```text
استشارات بيئية وطاقة متجددة للمنشآت والمشاريع في المملكة العربية السعودية
```

> عدد الأحرف: **73** من 100

```text
Environmental advisory and renewable energy for facilities and projects in Saudi Arabia
```

> عدد الأحرف: **87** من 100

### 10.2 النبذة التفصيلية (About)

العربية:

```text
سيلورين للاستشارات والخدمات البيئية تساعد المنشآت والمشاريع في المملكة العربية السعودية على فهم متطلباتها البيئية والوفاء بها وإثباتها. نعدّ طلبات التصاريح البيئية ونتابعها، وندعم الامتثال البيئي والتدقيق والسجلات، ونعدّ دراسات تقييم الأثر البيئي (EIA) وخطط الإدارة البيئية، وننفذ برامج رصد الهواء والغبار والضوضاء والمياه والمركبات العضوية المتطايرة في محطات الوقود. ونقدم كذلك خدمات إدارة النفايات والاقتصاد الدائري، واستشارات الحوكمة البيئية والاجتماعية والمؤسسية (ESG) والبصمة الكربونية والحياد الصفري وتقييم دورة الحياة، والمباني المستدامة، وأنظمة الطاقة الشمسية وتخزين الطاقة بالبطاريات ومحطات شحن السيارات الكهربائية وتشغيلها وصيانتها.
للتواصل: sales@selorin.co | +966 55 015 6887
```

الإنجليزية:

```text
Selorin Environmental Advisory & Services helps facilities and projects in Saudi Arabia understand, meet and demonstrate their environmental obligations. We prepare and follow through environmental permit applications, support compliance, audits and records, prepare environmental impact assessments (EIA) and environmental management plans, and run air, dust, noise, water and fuel station VOC monitoring programmes. We also provide waste management and circular economy services, ESG, carbon accounting, net zero and life cycle assessment advisory, sustainable building advice, and solar PV, battery storage and EV charging systems with their operation and maintenance.
Contact: sales@selorin.co | +966 55 015 6887
```

---

## 11. ملف جوجل التجاري (Google Business Profile)

**لماذا يهم:** هو ما يظهر عند البحث المحلي («مكتب استشارات بيئية في الرياض») وفي خرائط جوجل. اكتمال البيانات ودقتها وانتظام النشر والرد على التقييمات أمور نتحكم فيها بالكامل.

### 11.1 البيانات الأساسية

| الحقل | القيمة |
|---|---|
| اسم النشاط | `[CONTENT REQUIRED: الاسم كما في السجل التجاري واللافتة]`، ولا تُضاف إليه كلمات مثل «استشارات بيئية الرياض» |
| الموقع والعنوان | `[CONTENT REQUIRED: العنوان الوطني]`. إذا لم يكن هناك مكتب يستقبل العملاء، يُخفى العنوان وتُحدد مناطق الخدمة |
| مناطق الخدمة | المدن المذكورة في الموقع: الرياض، جدة، مكة المكرمة، المدينة المنورة، الدمام، الخبر، الجبيل، ينبع، تبوك، أبها، القصيم، حائل، جازان |
| ساعات العمل | `[CONTENT REQUIRED: ساعات العمل الرسمية]` |
| الهاتف | +966 55 015 6887 |
| الموقع | `https://selorin.co/ar/?utm_source=google_business&utm_medium=social&utm_campaign=bio` |
| رابط المواعيد/الطلب | `https://selorin.co/ar/request/?utm_source=google_business&utm_medium=social&utm_campaign=bio&utm_content=appointment` |
| الشعار والغلاف | `avatar-800.png` و`google-business-cover-1024x576.png` |

### 11.2 وصف النشاط (الحد 750 حرفًا، بلا روابط ولا أرقام هاتف)

الوصف في الملف بلغة واحدة؛ نعتمد العربية لأن أغلب البحث المحلي بالعربية، ونحتفظ بالإنجليزية للمرجع.

العربية (المعتمدة):

```text
سيلورين للاستشارات والخدمات البيئية تخدم المنشآت والمشاريع في المملكة العربية السعودية في الرياض وجدة والدمام وسائر المناطق. نعدّ طلبات التصاريح البيئية ونتابعها، وندعم الامتثال البيئي والتدقيق والسجلات، ونعدّ دراسات تقييم الأثر البيئي وخطط الإدارة البيئية، وننفذ رصد الهواء والغبار والضوضاء والمياه والمركبات العضوية المتطايرة في محطات الوقود. ونقدم إدارة النفايات والاقتصاد الدائري، واستشارات ESG والبصمة الكربونية والحياد الصفري، والمباني الخضراء وأنظمة مستدام وLEED، وأنظمة الطاقة الشمسية وتخزين الطاقة وشواحن السيارات الكهربائية وصيانتها. نبدأ بفهم نشاطكم وموقعكم، ونسلّم مستندات وتقارير واضحة جاهزة للجهات المختصة.
```

> عدد الأحرف: **620** من 750

الإنجليزية:

```text
Selorin Environmental Advisory & Services supports facilities and projects in Saudi Arabia, in Riyadh, Jeddah, Dammam and across the Kingdom. We prepare and follow through environmental permit applications, support environmental compliance, audits and records, prepare environmental impact assessments and environmental management plans, and monitor air, dust, noise, water and fuel station VOC. We also provide waste management and circular economy services, ESG, carbon accounting and net zero advisory, green building support through Mostadam and LEED, and solar PV, battery storage and EV charging systems with their maintenance. We start from your activity and site, and deliver clear documents and reports ready for the relevant authorities.
```

> عدد الأحرف: **747** من 750

### 11.3 التصنيفات

التصنيف الأساسي هو أقوى إشارة في البحث المحلي، فنختاره لما نريد أن يجدنا به أغلب العملاء. أسماء التصنيفات تُختار من قائمة جوجل كما هي؛ ابحثوا بالكلمات التالية واختاروا المطابق الموجود فعلًا:

| النوع | ابحثوا عن | السبب |
|---|---|---|
| **أساسي** | `Environmental consultant` (استشاري بيئي) | يطابق أغلب الخدمات (22 من 27: كل ما عدا مجموعة الطاقة المتجددة) والكلمة العامة «مكتب استشارات بيئية» |
| ثانوي | `Solar energy` (مقاول/شركة طاقة شمسية) | خدمات الأنظمة الشمسية والتخزين والتشغيل والصيانة |
| ثانوي | `Electric vehicle charging` (مقاول/تركيب محطات شحن) | خدمة محطات شحن السيارات الكهربائية |
| ثانوي | `Energy` أو `Renewable energy` (استشارات أو معدات الطاقة) | دراسات الجدوى لمشاريع الطاقة المتجددة |
| ثانوي | `Consultant` أو `Environmental` (منظمة/خدمات بيئية) | يغطي الاستدامة وESG إن لم يوجد تصنيف أدق |

> لا نضيف تصنيفًا لخدمة لا نقدمها فعلًا، ولا تصنيف «مختبر» لأننا لا نذكر أي اعتماد مختبري.

### 11.4 قائمة الخدمات (الخدمات الـ27 كاملة)

تُدخل في قسم «الخدمات» تحت التصنيف الأقرب، بالاسم العربي ووصف قصير. الوصف مأخوذ من نصوص الموقع المعتمدة.

**التصاريح والامتثال**

| الخدمة | Service | الوصف المختصر |
|---|---|---|
| التصاريح البيئية | Environmental Permitting | نخطط لطلبات التصاريح البيئية ونعدّها ونتابعها حتى تمضي المشاريع والعمليات على أساس نظامي واضح. |
| الامتثال البيئي | Environmental Compliance | نساعدكم على فهم التزاماتكم البيئية والوفاء بها وإثباتها يومًا بيوم، والتعامل مع التفتيش والإشعارات بثقة. |
| السجلات والتقارير البيئية | Environmental Records and Reporting | ننظّم البيانات والسجلات والتقارير الدورية لتكون المعلومات المطلوبة مكتملة ومتسقة وسهلة الوصول. |
| التدقيق البيئي | Environmental Audits | نختبر الأداء البيئي مقابل معايير محددة، ونقدم ملاحظات مدعومة بالأدلة ومرتبة حسب الأولوية. |
| الفحص البيئي النافي للجهالة | Environmental Due Diligence | نكشف المخاطر والالتزامات البيئية المرتبطة بالموقع أو المنشأة قبل الالتزام بالصفقة. |

**الدراسات البيئية**

| الخدمة | Service | الوصف المختصر |
|---|---|---|
| تقييم الأثر البيئي | Environmental Impact Assessment | دراسة منهجية مبنية على الأدلة تكشف مخاطر المشروع مبكرًا وتمنح الجهة المراجعة أساسًا واضحًا لقرارها. |
| خطط الإدارة البيئية | Environmental Management Plans | خطط تحوّل التزامات الموافقة إلى إجراءات ميدانية ومسؤوليات محددة وسجلات يمكن المحافظة عليها. |

**الرصد والقياس**

| الخدمة | Service | الوصف المختصر |
|---|---|---|
| الرصد البيئي | Environmental Monitoring | برامج رصد مصممة وفق اشتراطات التصريح البيئي، ببيانات ميدانية موثوقة وتقارير دورية جاهزة للتقديم. |
| رصد جودة الهواء | Air Quality Monitoring | رصد للهواء المحيط وانبعاثات المصادر يوضح أثر العمليات وموقعكم من المعايير المعمول بها. |
| رصد الغبار | Dust Monitoring | رصد فوري للغبار يربط قراءات الجسيمات بإجراءات ميدانية قبل أن يتحول إلى شكوى أو مخالفة. |
| رصد المركبات العضوية المتطايرة في محطات الوقود | Fuel Station VOC Monitoring | رصد مستمر وآمن ذاتيًا يشمل التوريد والتركيب والصيانة وفق منهجية الرصد واشتراطات التصريح. |
| رصد الضوضاء | Noise Monitoring | قياس للضوضاء والاهتزازات يوضح أثر الموقع على الجوار والعاملين والإجراءات اللازمة. |
| رصد جودة المياه | Water Quality Monitoring | رصد للمياه ومياه الصرف بنتائج موثوقة عن التصريف وإعادة الاستخدام، وتقارير جاهزة لمتطلبات التصريح. |

**النفايات والاقتصاد الدائري**

| الخدمة | Service | الوصف المختصر |
|---|---|---|
| إدارة النفايات | Waste Management | تعرّف على أنواع نفاياتك وطريقة التعامل معها ووجهتها، مع سجلات تصمد أمام التفتيش. |
| الاقتصاد الدائري | Circular Economy | تحديد مواضع تسرب المواد والقيمة من العمليات، وخارطة طريق عملية لإبقائها قيد الاستخدام. |

**الاستدامة والمناخ**

| الخدمة | Service | الوصف المختصر |
|---|---|---|
| استشارات الحوكمة البيئية والاجتماعية والمؤسسية (ESG) | ESG Advisory | إفصاحات ESG يمكن تتبّعها إلى بيانات موثوقة وحوكمة واضحة. |
| حصر الانبعاثات والمحاسبة الكربونية | GHG and Carbon Accounting | حصر مؤسسي للانبعاثات بحدود واضحة ومنهجيات موثقة وبيانات يمكن الدفاع عنها. |
| استشارات الحياد الصفري | Net Zero Advisory | تحويل خط أساس الانبعاثات إلى مستهدفات خفض واقعية وخارطة طريق محددة التكاليف. |
| استشارات الاستدامة | Sustainability Advisory | استراتيجية استدامة تنطلق من أولويات العمل بمستهدفات ومسؤوليات وإجراءات واضحة. |
| تقييم دورة الحياة | Life Cycle Assessment | قياس الأثر البيئي للمنتج على امتداد دورة حياته لتوجيه التصميم والتوريد والادعاءات البيئية. |

**المباني المستدامة**

| الخدمة | Service | الوصف المختصر |
|---|---|---|
| المباني المستدامة | Sustainable Buildings | إدماج الأداء البيئي في قرارات التصميم مبكرًا، حين يكون تحسين الطاقة والمياه والمواد أقل كلفة. |
| استشارات المباني الخضراء | Green Building Advisory | دعم منظّم عبر مستدام أو LEED أو Envision، بتخطيط مبكر للنقاط وأدلة مكتملة. |

**الطاقة المتجددة**

| الخدمة | Service | الوصف المختصر |
|---|---|---|
| أنظمة الطاقة الشمسية | Solar Energy Systems | أنظمة بحجم الاستهلاك الفعلي، مصممة لحرارة المملكة وغبارها، من الزيارة الميدانية حتى الربط بالشبكة. |
| أنظمة تخزين الطاقة بالبطاريات | Battery Energy Storage Systems | تخزين بحجم يخدم غرضًا واضحًا: الطاقة الاحتياطية أو خفض الذروة أو الاستفادة أكثر من الطاقة الشمسية. |
| محطات شحن السيارات الكهربائية | EV Charging Stations | شحن يناسب القدرة الكهربائية للموقع ومستخدميه ونموه، مع إمكانية تشغيله بالطاقة الشمسية. |
| دراسات الجدوى والدراسات البيئية لمشاريع الطاقة المتجددة | Renewable Energy Feasibility & Environmental Studies | إجابات واضحة قبل الاستثمار: إنتاج الموقع، وتكلفة المشروع، والموافقات البيئية المطلوبة. |
| تشغيل وصيانة مشاريع الطاقة المتجددة | Renewable Energy Operation & Maintenance | تنظيف وفحوص ومعالجة أعطال وتقارير أداء تبقي المحطات الشمسية والبطاريات والشواحن تعمل كما صُممت. |

### 11.5 المنتجات (Products)

نستخدم قسم المنتجات لعرض مجموعات الخدمات السبع بصورة وزر «معرفة المزيد»، **دون سعر** (لا نذكر أسعارًا). صيغة الرابط: `?utm_source=google_business&utm_medium=social&utm_campaign=bio&utm_content=product_<group>`.

| اسم المنتج | الفئة | الوصف | الرابط | الصورة المقترحة |
|---|---|---|---|---|
| التصاريح والامتثال البيئي | التصاريح والامتثال | إعداد طلبات التصاريح البيئية ومتابعتها، ودعم الامتثال والسجلات والتدقيق والفحص النافي للجهالة. | `/ar/services/environmental-permitting/` | مستندات ونماذج (دون بيانات عميل) |
| الدراسات البيئية | الدراسات | دراسات تقييم الأثر البيئي (EIA) وخطط الإدارة البيئية للإنشاء والتشغيل. | `/ar/services/environmental-impact-assessment/` | زيارة ميدانية لموقع مشروع |
| الرصد البيئي | الرصد والقياس | رصد الهواء والغبار والضوضاء والمياه والمركبات العضوية المتطايرة، مع تقارير دورية. | `/ar/services/environmental-monitoring/` | جهاز رصد في الموقع |
| إدارة النفايات | النفايات | تصنيف النفايات وسجلاتها وخطط إدارتها وخارطة الاقتصاد الدائري. | `/ar/services/waste-management/` | منطقة تخزين نفايات منظمة |
| ESG والبصمة الكربونية | الاستدامة والمناخ | حصر الانبعاثات، والحياد الصفري، وإفصاحات ESG، وتقييم دورة الحياة. | `/ar/services/ghg-carbon-accounting/` | رسم بياني من تقرير نموذجي |
| المباني الخضراء | المباني | إدماج الأداء البيئي في التصميم، والدعم خلال مستدام وLEED وEnvision. | `/ar/services/green-building-advisory/` | مبنى أو مخطط تصميم |
| الطاقة الشمسية والتخزين وشحن السيارات | الطاقة المتجددة | أنظمة شمسية، وبطاريات تخزين، ومحطات شحن، ودراسات جدوى، وتشغيل وصيانة. | `/ar/services/solar-energy-systems/` | ألواح شمسية أو شاحن مركّب |

### 11.6 الأسئلة والأجوبة المقترحة

> **تنبيه:** جوجل يغيّر هذا القسم من حين لآخر، وقد لا يظهر في ملفنا أصلًا. تحققوا أولًا من وجوده في الملف على الخرائط وفي البحث. إذا لم يكن متاحًا، فلا يضيع هذا المحتوى: يُستخدم في منشورات الملف (القسم 11.7) وفي الأسئلة الشائعة بصفحات الخدمات وفي الردود السريعة على واتساب، حتى تجد أي ميزة إجابة آلية في الخرائط معلومات صحيحة عنا. إذا كان القسم متاحًا، نطرح السؤال من حساب الشركة صراحة ونجيب عنه، ولا نطلب من أحد طرح أسئلة نيابة عنا.

| # | السؤال | الإجابة |
|---|---|---|
| 1 | هل تساعدون في استخراج التصريح البيئي لمنشأة قائمة؟ | نعم. نراجع نشاط المنشأة وموقعها، ونحدد المستندات والدراسات المطلوبة، ونعدّ ملف الطلب ونتابع ملاحظات الجهة المختصة حتى صدور القرار. |
| 2 | ما الذي أحتاج تجهيزه قبل التواصل معكم بخصوص التصريح؟ | السجل التجاري، ووصف النشاط والطاقة الإنتاجية، وموقع المنشأة، وأي تصاريح أو دراسات سابقة. وإن لم تتوفر كلها نبدأ بما لديكم ونحدد الناقص. |
| 3 | متى يحتاج المشروع إلى دراسة تقييم أثر بيئي؟ | يعتمد ذلك على تصنيف النشاط وحجمه وموقعه وفق نظام البيئة ولوائحه التنفيذية. نراجع بيانات المشروع ونوضح نوع الدراسة المطلوبة قبل البدء. |
| 4 | هل تنفذون الرصد البيئي داخل الموقع؟ | نعم. نصمم برنامج الرصد وفق اشتراطات التصريح، ونقيس الهواء أو الغبار أو الضوضاء أو المياه في الموقع، ونسلّم تقارير دورية واضحة. |
| 5 | هل تغطون مدنًا خارج الرياض؟ | نخدم المنشآت والمشاريع في مختلف مناطق المملكة، منها جدة والدمام والجبيل وينبع. أرسلوا موقع المشروع لنحدد ترتيبات الزيارة الميدانية. |
| 6 | هل تركّبون أنظمة طاقة شمسية للمنازل والمنشآت التجارية؟ | نعم. نصمم النظام بحسب الاستهلاك الفعلي وطبيعة السطح أو الموقع، مع مراعاة الحرارة والغبار، وننفذه من الزيارة الميدانية حتى الربط بالشبكة. |
| 7 | هل تقدمون شواحن السيارات الكهربائية للمباني والمجمعات السكنية؟ | نعم. نقيّم القدرة الكهربائية للموقع وعدد المستخدمين المتوقع، ونقترح عدد الشواحن ونوعها، مع خيار ربطها بالطاقة الشمسية. |
| 8 | هل تعدّون تقارير ESG وحصر البصمة الكربونية؟ | نعم. نحدد حدود الحصر ونجمع البيانات وفق بروتوكول غازات الاحتباس الحراري (GHG Protocol)، ونبني إفصاحات ESG يمكن تتبّعها إلى بيانات موثوقة. |
| 9 | كم تكلفة الخدمة؟ | تختلف التكلفة بحسب نوع الخدمة وحجم المنشأة ونطاق العمل. أرسلوا تفاصيل طلبكم عبر نموذج الطلب في موقعنا لنعدّ عرضًا محددًا. |
| 10 | كيف أطلب استشارة؟ | عبر نموذج الطلب في موقعنا، أو بالبريد الإلكتروني، أو بالاتصال أو واتساب على الرقم المدرج في الملف. |

النسخة الإنجليزية (للأسئلة 1 و4 و6 و9، إن رغبتم في إضافة أسئلة إنجليزية):

| Question | Answer |
|---|---|
| Can you help an existing facility obtain its environmental permit? | Yes. We review the facility's activity and location, identify the documents and studies required, prepare the application and follow up on the authority's comments until a decision is issued. |
| Do you carry out on-site environmental monitoring? | Yes. We design the monitoring programme around your permit conditions, measure air, dust, noise or water on site and deliver clear periodic reports. |
| Do you install solar PV systems for homes and businesses? | Yes. We size the system to actual consumption and the roof or site, allow for heat and dust, and deliver it from site survey to grid connection. |
| How much does the service cost? | It depends on the service, the size of the facility and the scope. Send your details through the request form on our website and we will prepare a specific proposal. |

### 11.7 إيقاع النشر

مركز النشر في الموقع ينشر المقالات تلقائيًا على قناة `google_business` (انظر `docs/social-funnel-ar.md`). المنشورات اليدوية أدناه **تكمّله ولا تكرره**: منشور يدوي واحد أسبوعيًا، بصورة حقيقية وزر «معرفة المزيد» يقود إلى صفحة الخدمة مع `utm_content=post_<service-id>`.

| الأسبوع | نوع المنشور | الموضوع | مثال |
|---|---|---|---|
| 1 | تحديث (Update) | خدمة من التصاريح أو الدراسات | «ما الذي تجهّزه قبل طلب التصريح البيئي» |
| 2 | تحديث بصورة ميدانية | خدمة رصد، مع المدينة دون اسم العميل، **لعمل منفذ فعلًا وبموافقة العميل فقط** | «رصد الضوضاء في موقع إنشائي: كيف نختار مواقع القياس وما يتضمنه التقرير» |
| 3 | تحديث | الطاقة الشمسية أو التخزين أو الشحن | «كيف نحدد حجم النظام الشمسي من فاتورة الكهرباء» |
| 4 | تحديث أو فعالية (Event) | الاستدامة أو المباني الخضراء، أو مشاركة في فعالية حقيقية مؤكدة | «ما الفرق بين حصر الانبعاثات وخطة الحياد الصفري» |

قواعد: لا نستخدم نوع «عرض» (Offer) إلا لعرض حقيقي معتمد كتابيًا من الإدارة؛ لا أرقام هاتف داخل نص المنشور؛ كل منشور يذكر خدمة واحدة ومدينة واحدة إن وُجدت.

### 11.8 قائمة الصور المطلوبة

صور حقيقية فقط (لا صور مخزنة جاهزة)، بموافقة من يظهر فيها، ودون بيانات أو شعارات عملاء:

1. الشعار (`avatar-800.png`) والغلاف (`google-business-cover-1024x576.png`).
2. واجهة المكتب من الخارج مع اللافتة (إن وُجد مكتب يستقبل العملاء).
3. مساحة العمل من الداخل.
4. الفريق أثناء العمل (2–3 صور).
5. معدات رصد الغبار أو جودة الهواء منصوبة في موقع.
6. أخذ عينات المياه أو قياس الضوضاء.
7. زيارة ميدانية لموقع مشروع (مهندس بمعدات السلامة).
8. نظام شمسي منفذ (سطح أو موقف مظلل) بموافقة المالك.
9. شاحن سيارة كهربائية مركّب.
10. صفحة من تقرير نموذجي بعد حجب أي بيانات عميل.
11. فيديو قصير (15–30 ثانية) من الموقع.

> صور الموقع مثل `hq.jpg` و`signage.jpg` و`station.jpg` و`handheld.jpg` و`engineer.jpg` تُرفع فقط إذا كانت صورًا فعلية لسيلورين وفريقها ومعداتها. `[CONTENT REQUIRED: تأكيد مصدر هذه الصور]`

### 11.9 طلب التقييمات

بعد تسليم كل مشروع، يُرسل رابط التقييم من ملف جوجل مع هذا النص (دون أي مقابل أو حافز):

```text
شكرًا لثقتكم في سيلورين. إذا رغبتم في مشاركة تجربتكم، يسعدنا تقييمكم على جوجل، ويفيد غيركم أن تذكروا الخدمة التي حصلتم عليها والمدينة.
```

ونرد على كل تقييم خلال أيام عمل قليلة، بنص يشكر ويذكر الخدمة دون كشف أي تفاصيل عن العميل.

---

## 12. واتساب للأعمال

- **اسم النشاط:** سيلورين للاستشارات والخدمات البيئية
- **التصنيف:** أقرب تصنيف للخدمات المهنية أو الاستشارات.
- **البريد:** sales@selorin.co · **الموقع:** `https://selorin.co/ar/?utm_source=whatsapp&utm_medium=social&utm_campaign=bio`
- **العنوان وساعات العمل:** `[CONTENT REQUIRED]` (انظر القسم 0).
- **الصورة:** `avatar-800.png`.

### 12.1 النبذة (About، يُفضّل 139 حرفًا أو أقل)

```text
استشارات بيئية وطاقة متجددة في السعودية. أرسل نوع الخدمة ومدينة المشروع وسنرد عليك.
```

> عدد الأحرف: **83** من 139

```text
Environmental advisory and renewable energy in Saudi Arabia. Send the service you need and the project city.
```

> عدد الأحرف: **108** من 139

### 12.2 وصف النشاط (Business description، يُفضّل 512 حرفًا أو أقل)

```text
سيلورين للاستشارات والخدمات البيئية تخدم المنشآت والمشاريع في المملكة العربية السعودية: التصاريح البيئية والامتثال، ودراسات تقييم الأثر البيئي وخطط الإدارة البيئية، ورصد الهواء والغبار والضوضاء والمياه، وإدارة النفايات، واستشارات ESG والبصمة الكربونية، والمباني الخضراء، وأنظمة الطاقة الشمسية وتخزين الطاقة وشواحن السيارات الكهربائية. تصفح الكتالوج لاختيار الخدمة، أو أرسل لنا وصفًا مختصرًا لطلبك.
```

> عدد الأحرف: **397** من 512

```text
Selorin Environmental Advisory & Services supports facilities and projects in Saudi Arabia: environmental permits and compliance, EIA and environmental management plans, air, dust, noise and water monitoring, waste management, ESG and carbon accounting, green buildings, and solar PV, battery storage and EV charging. Browse the catalogue to choose a service, or send us a short description of your request.
```

> عدد الأحرف: **407** من 512

### 12.3 الرسائل الآلية والردود السريعة

رسالة الترحيب:

```text
مرحبًا بك في سيلورين للاستشارات والخدمات البيئية. لنخدمك بسرعة، أرسل: نوع الخدمة، ومدينة المشروع أو المنشأة، ونوع النشاط. ويمكنك تصفح خدماتنا من الكتالوج.
```

رسالة خارج أوقات العمل:

```text
شكرًا لتواصلك مع سيلورين. وصلت رسالتك خارج أوقات العمل، وسيتواصل معك أحد المختصين في أقرب يوم عمل. يمكنك أيضًا إرسال طلبك عبر الموقع: selorin.co/ar/request/
```

الردود السريعة:

| الاختصار | النص |
|---|---|
| `/تصريح` | لتحديد متطلبات التصريح البيئي نحتاج: السجل التجاري، ووصف النشاط، وموقع المنشأة، وأي تصاريح أو دراسات سابقة. |
| `/رصد` | أرسل نوع الرصد المطلوب (هواء، غبار، ضوضاء، مياه، محطة وقود)، وموقع المشروع، وهل الرصد مطلوب في اشتراطات التصريح. |
| `/شمسي` | لتقدير النظام الشمسي نحتاج: نوع المبنى، والمدينة، وصورة من آخر فواتير الكهرباء، ومساحة السطح أو الموقع المتاحة تقريبًا. |
| `/شاحن` | أرسل نوع الموقع (منزل، مبنى، مجمع، موقع تجاري)، وعدد السيارات المتوقع، والقدرة الكهربائية المتاحة إن كانت معروفة. |
| `/عرض` | لإعداد عرض محدد، يرجى تعبئة نموذج الطلب: selorin.co/ar/request/ |

### 12.4 عناصر الكتالوج (27 عنصرًا)

لكل عنصر: **الاسم** (العمود الأول)، **الوصف** (العمود الثاني)، **رمز العنصر** = معرّف الخدمة، **السعر: يُترك فارغًا**، **الرابط**: `https://selorin.co<المسار>?utm_source=whatsapp&utm_medium=social&utm_campaign=bio&utm_content=catalogue_<المعرّف>`، **الصورة**: صورة الخدمة من الموقع أو صورة ميدانية حقيقية.

| اسم العنصر | الوصف | رمز العنصر | المسار |
|---|---|---|---|
| التصاريح البيئية | إعداد طلب التصريح البيئي ومتابعته حتى صدور القرار. | environmental-permitting | `/ar/services/environmental-permitting/` |
| الامتثال البيئي | فهم الالتزامات البيئية والوفاء بها وإثباتها، والاستعداد للتفتيش. | environmental-compliance | `/ar/services/environmental-compliance/` |
| السجلات والتقارير البيئية | تنظيم البيانات والسجلات والتقارير الدورية المطلوبة. | environmental-records | `/ar/services/environmental-records/` |
| التدقيق البيئي | تقييم الأداء البيئي مقابل معايير محددة بملاحظات مرتبة حسب الأولوية. | environmental-audits | `/ar/services/environmental-audits/` |
| الفحص البيئي النافي للجهالة | كشف المخاطر والالتزامات البيئية للموقع أو المنشأة قبل الصفقة. | environmental-due-diligence | `/ar/services/environmental-due-diligence/` |
| تقييم الأثر البيئي | دراسة منهجية تكشف مخاطر المشروع وتدعم قرار الجهة المراجعة. | environmental-impact-assessment | `/ar/services/environmental-impact-assessment/` |
| خطط الإدارة البيئية | تحويل الالتزامات إلى إجراءات ميدانية ومسؤوليات وسجلات. | environmental-management-plans | `/ar/services/environmental-management-plans/` |
| الرصد البيئي | برنامج رصد وفق اشتراطات التصريح بتقارير دورية. | environmental-monitoring | `/ar/services/environmental-monitoring/` |
| رصد جودة الهواء | رصد الهواء المحيط وانبعاثات المصادر. | air-quality-monitoring | `/ar/services/air-quality-monitoring/` |
| رصد الغبار | رصد فوري للجسيمات مرتبط بإجراءات ضبط في الموقع. | dust-monitoring | `/ar/services/dust-monitoring/` |
| رصد الأبخرة في محطات الوقود | رصد مستمر للمركبات العضوية المتطايرة، توريد وتركيب وصيانة. | fuel-station-voc-monitoring | `/ar/services/fuel-station-voc-monitoring/` |
| رصد الضوضاء | قياس الضوضاء والاهتزازات وأثرها على الجوار والعاملين. | noise-monitoring | `/ar/services/noise-monitoring/` |
| رصد جودة المياه | رصد المياه ومياه الصرف وتقارير جاهزة لمتطلبات التصريح. | water-quality-monitoring | `/ar/services/water-quality-monitoring/` |
| إدارة النفايات | تصنيف النفايات وطريقة التعامل معها ووجهتها، مع سجلات واضحة. | waste-management | `/ar/services/waste-management/` |
| الاقتصاد الدائري | خارطة طريق لإبقاء المواد والقيمة قيد الاستخدام. | circular-economy | `/ar/services/circular-economy/` |
| استشارات ESG | إفصاحات ESG مبنية على بيانات موثوقة وحوكمة واضحة. | esg-advisory | `/ar/services/esg-advisory/` |
| حصر الانبعاثات والبصمة الكربونية | حصر مؤسسي للانبعاثات بحدود ومنهجيات موثقة. | ghg-carbon-accounting | `/ar/services/ghg-carbon-accounting/` |
| استشارات الحياد الصفري | مستهدفات خفض واقعية وخارطة طريق محددة التكاليف. | net-zero-advisory | `/ar/services/net-zero-advisory/` |
| استشارات الاستدامة | استراتيجية استدامة بمستهدفات ومسؤوليات وإجراءات واضحة. | sustainability-advisory | `/ar/services/sustainability-advisory/` |
| تقييم دورة الحياة | قياس الأثر البيئي للمنتج عبر دورة حياته. | life-cycle-assessment | `/ar/services/life-cycle-assessment/` |
| المباني المستدامة | إدماج أداء الطاقة والمياه والمواد في التصميم المبكر. | sustainable-buildings | `/ar/services/sustainable-buildings/` |
| استشارات المباني الخضراء | الدعم خلال مستدام وLEED وEnvision. | green-building-advisory | `/ar/services/green-building-advisory/` |
| أنظمة الطاقة الشمسية | نظام بحجم الاستهلاك، من الزيارة الميدانية حتى الربط بالشبكة. | solar-energy-systems | `/ar/services/solar-energy-systems/` |
| تخزين الطاقة بالبطاريات | تخزين للطاقة الاحتياطية أو خفض الذروة أو تعظيم الاستفادة من الطاقة الشمسية. | battery-energy-storage | `/ar/services/battery-energy-storage/` |
| شواحن السيارات الكهربائية | شواحن تناسب قدرة الموقع ومستخدميه، مع خيار الطاقة الشمسية. | ev-charging-stations | `/ar/services/ev-charging-stations/` |
| جدوى مشاريع الطاقة المتجددة | إنتاج الموقع والتكلفة والموافقات البيئية قبل الاستثمار. | renewable-energy-feasibility | `/ar/services/renewable-energy-feasibility/` |
| تشغيل وصيانة الطاقة المتجددة | تنظيف وفحوص ومعالجة أعطال وتقارير أداء. | renewable-operations-maintenance | `/ar/services/renewable-operations-maintenance/` |

**تجميع الكتالوج (Collections):** التصاريح والامتثال · الدراسات البيئية · الرصد والقياس · النفايات · الاستدامة والمناخ · المباني المستدامة · الطاقة المتجددة.

للعملاء الذين يكتبون بالإنجليزية تُستخدم أسماء الخدمات الإنجليزية من القسم 11.4 مع المسار الإنجليزي (`/services/<id>/`) في الرد، ويبقى الكتالوج عربيًا.

---

## 13. التحقق من عدد الأحرف

عُدّت النصوص آليًا (كل حرف ومسافة وسطر جديد = حرف واحد، والروابط بطولها الكامل). يُعاد العد بعد أي تعديل، ويمكن استخدام الأمر أدناه من جذر المستودع:

```bash
python3 -c "import sys; print(len(sys.stdin.read().rstrip('\n')))" < نص.txt
```

| الحقل | اللغة | العدد | الحد |
|---|---|---|---|
| 5.1 السطر التعريفي (الحد 120 حرفًا) | AR | 92 | 120 |
| 5.1 السطر التعريفي (الحد 120 حرفًا) | EN | 108 | 120 |
| 5.2 النبذة About (الحد 2000 حرف) | AR | 1675 | 2000 |
| 5.2 النبذة About (الحد 2000 حرف) | EN | 1851 | 2000 |
| 6.1 حقل الاسم (يُفضّل 30 حرفًا أو أقل) | AR | 24 | 30 |
| 6.1 حقل الاسم (يُفضّل 30 حرفًا أو أقل) | EN | 30 | 30 |
| 6.2 السيرة (الحد 150 حرفًا) | AR | 145 | 150 |
| 6.2 السيرة (الحد 150 حرفًا) | EN | 145 | 150 |
| 7.1 الاسم | AR | 24 | 30 |
| 7.2 السيرة (الحد 80 حرفًا) | AR | 65 | 80 |
| 7.2 السيرة (الحد 80 حرفًا) | EN | 73 | 80 |
| 8.2 وصف القناة (الحد 1000 حرف) | AR | 675 | 1000 |
| 8.2 وصف القناة (الحد 1000 حرف) | EN | 693 | 1000 |
| 9.1 الاسم الظاهر (يُفضّل 50 حرفًا أو أقل) | AR | 37 | 50 |
| 9.2 السيرة (الحد 160 حرفًا) | AR | 153 | 160 |
| 9.2 السيرة (الحد 160 حرفًا) | EN | 143 | 160 |
| 9.3 المنشور المثبت (الحد 280 حرفًا، والرابط محسوب بطوله الكامل) | AR | 277 | 280 |
| 9.3 المنشور المثبت (الحد 280 حرفًا، والرابط محسوب بطوله الكامل) | EN | 272 | 280 |
| 10.1 النبذة القصيرة (Intro، يُفضّل 100 حرف أو أقل) | AR | 73 | 100 |
| 10.1 النبذة القصيرة (Intro، يُفضّل 100 حرف أو أقل) | EN | 87 | 100 |
| 11.2 وصف النشاط (الحد 750 حرفًا، بلا روابط ولا أرقام هاتف) | AR | 620 | 750 |
| 11.2 وصف النشاط (الحد 750 حرفًا، بلا روابط ولا أرقام هاتف) | EN | 747 | 750 |
| 12.1 النبذة (About، يُفضّل 139 حرفًا أو أقل) | AR | 83 | 139 |
| 12.1 النبذة (About، يُفضّل 139 حرفًا أو أقل) | EN | 108 | 139 |
| 12.2 وصف النشاط (Business description، يُفضّل 512 حرفًا أو أقل) | AR | 397 | 512 |
| 12.2 وصف النشاط (Business description، يُفضّل 512 حرفًا أو أقل) | EN | 407 | 512 |

---

## 14. قائمة المراجعة الشهرية للحسابات

تُنفذ في أول أحد من كل شهر، وتُسجل نتيجتها في سجل التغييرات أسفل هذا الملف.

**الهوية والاتساق**
- [ ] الاسم والمعرّف والصورة الرمزية متطابقة في كل المنصات، ومطابقة للقسم 1.
- [ ] روابط `social` في `src/i18n/ui.ts` تعمل وتطابق الحسابات الفعلية (رأس الموقع وتذييله وصفحة المستجدات).
- [ ] لا توجد حسابات منتحلة باسم سيلورين (بحث بالاسم العربي والإنجليزي في كل منصة)، والإبلاغ عنها إن وُجدت.

**الروابط والقياس**
- [ ] فتح كل رابط في الحسابات للتأكد من أنه يعمل ويحمل UTM الصحيح (القسم 2).
- [ ] مراجعة تقرير القمع في لوحة الإدارة: عدد الطلبات من كل `utm_source`، وتسجيل أي مصدر لم يأتِ منه طلب لمراجعة سيرته ورابطه.
- [ ] التأكد من أن كل صفحة خدمة مذكورة في الكتالوج والمنتجات ما زالت موجودة بالمسار نفسه.

**المحتوى والادعاءات**
- [ ] قراءة كل سيرة ووصف ومنشور مثبت: لا ادعاء اعتماد أو عملاء أو أرقام أو أسعار، ولا عبارات مبالغة ولا علامات تعجب.
- [ ] إذا أُضيفت خدمة إلى الموقع أو عُدلت، تحديث: قائمة خدمات جوجل، والمنتجات، وكتالوج واتساب، والتخصصات في لينكد إن، والقصص المميزة.
- [ ] تحديث المنشور المثبت في إكس والقصص المميزة في إنستغرام إذا تغيرت أولويات الحملة في التقويم.
- [ ] حذف أي منشور «عرض» أو «فعالية» انتهى موعده في ملف جوجل.

**ملف جوجل التجاري**
- [ ] مراجعة «التعديلات المقترحة» من جوجل أو المستخدمين وقبول الصحيح فقط.
- [ ] الرد على كل تقييم جديد، ورفع 2–4 صور حقيقية جديدة.
- [ ] التأكد من نشر 4 منشورات يدوية في الشهر (القسم 11.7) دون تكرار مقالات النشر الآلي.
- [ ] مراجعة ساعات العمل، وإضافة ساعات خاصة للإجازات الرسمية والمواسم.

**الأمان والوصول**
- [ ] مراجعة قائمة المسؤولين في كل حساب وإزالة من غادر الفريق.
- [ ] التحقق من تفعيل التحقق بخطوتين في كل الحسابات.
- [ ] تجديد مفاتيح النشر الآلي قبل انتهائها (توكن لينكد إن صلاحيته 60 يومًا وفق `docs/social-funnel-ar.md`).

**المرئيات**
- [ ] فحص ظهور الأغلفة والصورة الرمزية على الجوال والحاسب بعد أي تحديث من المنصات.

---

## سجل التغييرات

- 2026-10-20: إنشاء الدليل. لم تُضف أي أرقام أو أنظمة مؤرخة لأن النصوص تعتمد على وصف الخدمات وطريقة العمل فقط.
- 2026-10-20 (مراجعة): أعيد عدّ كل النصوص آليًا؛ اختُصر المنشور المثبت في إكس ليبقى ضمن 280 حرفًا والرابط محسوب بطوله الكامل؛ صُحح عدد الخدمات التي يغطيها التصنيف الأساسي في جوجل (22 من 27)؛ حُذفت عبارات عامة عن سلوك المستخدمين في المنصات لم نتحقق منها من مصدر؛ صار قسم الأسئلة والأجوبة في جوجل مشروطًا بظهوره في الملف؛ أضيف جدول المقاطع القصيرة من تقويم الحملة.
- 2026-10-25: نصوص لينكد إن بأسلوب صفحات الشركات الكبرى (غاية، ممارسات سبع، قطاعات، دعوة إلى الإجراء) بالإنجليزية والعربية، ومنشور تعريفي مثبّت؛ الأغلفة تذكر الطاقة المتجددة؛ معرّف إكس الرسمي @selorinco ويُقترح توحيده في بقية المنصات؛ حُدّث وصف قناة يوتيوب وكلماتها المفتاحية آليًا عبر Make. نسخة جاهزة للنسخ بأزرار لكل منصة في صفحة «دليل حسابات سيلورين».
