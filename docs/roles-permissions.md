# Roles & permissions

Generated from `src/data/platform.ts`. Enforced server-side on every request; per-record checks add ownership, assignment and NDA status (e.g. `opportunity.read.full` also requires a signed NDA for that opportunity).

- **Pub** = Public visitor / زائر
- **Res** = Researcher / scientist / باحث / عالم
- **Uni** = University / research centre / جامعة / مركز أبحاث
- **Tech** = Technology provider / مزوّد تقنية
- **Corp** = Corporate client / عميل مؤسسي
- **Inv** = Investor / مستثمر
- **SciR** = Scientific reviewer / مراجع علمي
- **TecR** = Technical reviewer / مراجع فني
- **ComR** = Commercial reviewer / مراجع تجاري
- **IC** = Investment committee / لجنة الاستثمار
- **Adm** = Administrator / مسؤول النظام
- **SA** = Super administrator / المسؤول الأعلى

| Permission | Pub | Res | Uni | Tech | Corp | Inv | SciR | TecR | ComR | IC | Adm | SA |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| `analytics.read` |  |  |  |  |  |  |  |  |  |  | ● | ● |
| `audit.read` |  |  |  |  |  |  |  |  |  |  | ● | ● |
| `challenge.create` |  |  |  |  | ● |  |  |  |  |  |  | ● |
| `challenge.read.all` |  |  |  |  |  |  |  |  |  |  | ● | ● |
| `challenge.read.own` |  |  |  |  | ● |  |  |  |  |  |  | ● |
| `committee.decide` |  |  |  |  |  |  |  |  |  | ● |  | ● |
| `content.manage` |  |  |  |  |  |  |  |  |  |  | ● | ● |
| `dataroom.manage` |  |  |  |  |  |  |  |  |  |  | ● | ● |
| `dataroom.read` |  |  |  |  |  | ● |  |  |  |  |  | ● |
| `due-diligence.request` |  |  |  |  |  | ● |  |  |  |  |  | ● |
| `meeting.request` |  | ● | ● | ● | ● | ● |  |  |  |  |  | ● |
| `message.send` |  | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● |
| `nda.manage` |  |  |  |  |  |  |  |  |  |  | ● | ● |
| `nda.request` |  |  |  |  | ● | ● |  |  |  |  |  | ● |
| `nda.sign` |  | ● | ● | ● | ● | ● |  |  |  |  |  | ● |
| `opportunity.manage` |  |  |  |  |  |  |  |  |  |  | ● | ● |
| `opportunity.read.full` |  |  |  |  |  | ● |  |  |  | ● | ● | ● |
| `opportunity.read.teaser` | ● |  |  |  |  | ● |  |  |  |  |  | ● |
| `opportunity.save` |  |  |  |  |  | ● |  |  |  |  |  | ● |
| `pilot.manage` |  |  |  |  |  |  |  |  |  |  | ● | ● |
| `pilot.read.own` |  | ● | ● | ● | ● |  |  |  |  |  |  | ● |
| `proposal.create` |  | ● | ● | ● |  |  |  |  |  |  |  | ● |
| `proposal.read.own` |  | ● | ● | ● |  |  |  |  |  |  |  | ● |
| `public.read` | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● |
| `review.read.assigned` |  |  |  |  |  |  | ● | ● | ● | ● |  | ● |
| `review.score.commercial` |  |  |  |  |  |  |  |  | ● |  |  | ● |
| `review.score.scientific` |  |  |  |  |  |  | ● |  |  |  |  | ● |
| `review.score.technical` |  |  |  |  |  |  |  | ● |  |  |  | ● |
| `role.manage` |  |  |  |  |  |  |  |  |  |  |  | ● |
| `service-request.create` | ● | ● | ● | ● | ● |  |  |  |  |  |  | ● |
| `settings.manage` |  |  |  |  |  |  |  |  |  |  |  | ● |
| `solution.create` |  | ● | ● | ● |  |  |  |  |  |  |  | ● |
| `solution.read.all` |  |  |  |  |  |  |  |  |  |  | ● | ● |
| `solution.read.confidential` |  |  |  |  |  |  | ● | ● | ● | ● | ● | ● |
| `solution.read.own` |  | ● | ● | ● |  |  |  |  |  |  |  | ● |
| `solution.read.public-profile` | ● | ● | ● | ● | ● |  |  |  |  |  |  | ● |
| `solution.update.own` |  | ● | ● | ● |  |  |  |  |  |  |  | ● |
| `user.manage` |  |  |  |  |  |  |  |  |  |  | ● | ● |
| `user.verify` |  |  |  |  |  |  |  |  |  |  | ● | ● |
