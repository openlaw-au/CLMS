# CLMS UX Audit — 약속 vs. 현실

> **이 문서의 목적**
> 랜딩페이지에서 유저에게 한 약속을 하나씩 따라가면서, 실제 앱에서 그 약속이 지켜지는지 검증한다. 끊기는 지점을 찾고, 디자이너가 "이 화면을 어떻게 고쳐야 하는지" 판단할 수 있게 한다.
>
> 기술 스펙이 아니다. 코드는 근거로만 인용한다. 읽는 사람은 디자이너.

---

## 이 앱의 타겟 유저

### Sarah Chen — Barrister, Owen Dixon East

**하루:** 오전 7시에 CLMS 확인, 9시~5시 법정, 저녁에 다음 날 심리 준비. 앱을 쓸 수 있는 시간은 아침 30분, 저녁 2시간.

**핵심 업무:** 법정 제출 전에 Table of Authorities를 만든다. 챔버 소장 서적에서 관련 책을 찾고, JADE에서 판례와 법률을 찾고, 각각의 정확한 위치(chapter, section, paragraph)를 기록해서, AGLC4 형식의 PDF로 출력한다.

**현재 방식:** Word 문서를 열고, JADE 웹사이트에서 판례를 검색하고, 챔버 서가를 직접 걸어 다니며 책을 확인하고, 하나씩 수작업으로 타이핑한다. AGLC4 형식 맞추기에만 30분~1시간.

**CLMS에 기대하는 것:** 이 과정을 10분으로 줄여주는 것.

### Rebecca Torres — Clerk, Owen Dixon Chambers

**하루:** 8명 바리스터의 도서 대출을 관리하고, 신규 도서를 카탈로그에 등록하고, 연체 도서를 추적한다. 물리적으로 3개 층에 걸쳐 13권(향후 수백 권)을 관리.

**핵심 업무:** "누가 뭘 빌려갔는지" 추적, 대출 승인/거부, 신규 도서 등록 시 메타데이터(subject, jurisdiction 등)를 입력해서 바리스터의 검색을 돕는다.

**현재 방식:** Excel 스프레드시트 + 이메일 + 전화.

**CLMS에 기대하는 것:** 스프레드시트를 대체할 수 있는 시스템. 단, 스프레드시트보다 느리면 안 된다.

---

## AGLC4: 디자이너가 알아야 할 것

AGLC4 = Australian Guide to Legal Citation, 4th Edition.

**한 줄 요약:** 호주 법조계의 참고문헌 형식 규칙. 법정에 자료를 제출할 때 이 형식을 따라야 한다.

**왜 중요한가:** 바리스터는 심리 전에 **Table of Authorities** (인용 자료 목록)를 만든다. 이 목록의 형식이 AGLC4. Word에서 수작업으로 맞추는 게 반복적인 시간 낭비. CLMS가 이걸 자동으로 해주면 킬러 피처.

**형식 예시:**

```
TABLE OF AUTHORITIES

A. Cases
Palmer v Cross [2019] FCA 221, [45]-[48]
       ↑ 당사자                    ↑ pinpoint (참조할 단락)

B. Legislation
Evidence Act 1995 (Cth) s 135
       ↑ 법률명              ↑ pinpoint (참조할 조항)

C. Books
J D Heydon, Cross on Evidence
(LexisNexis Butterworths, 5th ed, 2004) ch 4
       ↑ 저자, 제목, 출판 정보           ↑ pinpoint (참조할 챕터)
```

**"Pinpoint"이 핵심이다.** "이 책 전체"가 아니라 "이 책의 4장"을 cite해야 판사가 뭘 읽어야 하는지 안다. Pinpoint 없는 authority list는 court-ready가 아니다.

디자인 관점에서 기억할 것:
- 3가지 타입(판례/법률/서적)마다 형식이 다르다
- 각 타입에 pinpoint 위치가 다르다 (서적: ch/para, 판례: paragraph, 법률: section)
- CLMS의 AGLC formatter가 이미 이 형식을 처리한다. **UI에서 할 일은 유저가 pinpoint를 입력할 수 있게 하는 것뿐이다**

---

## Part 1: Barrister 약속 검증

### 약속 ①: "One Search, Every Resource"

**랜딩페이지 카피:**
> "Finding a book means checking three locations and sending a message hoping someone replies. CLMS connects your physical catalogue with JADE in one place."
> - Books, case law, and legislation in one place
> - Filter by location and practice area
> - JADE integration

**리뷰 카드:**
> James Chen: "One search found the textbook and the JADE authority. Used to take me half a day."

#### 실제 경험

Sarah가 `/app/search`에서 "evidence"를 입력한다.

**동작하는 것:**
- 챔버 도서와 JADE 결과가 함께 나온다 ✅
- 결과 카운터: "N results across books and JADE" ✅
- Source 필터: All / Books only / JADE only ✅
- Subject, Jurisdiction, Availability 필터 ✅

**약속과 다른 것:**

**1) "Filter by practice area"는 조건부로만 동작한다.**

Subject 필터는 clerk이 enrichment한 책에만 작동한다. 13권 중 2권만 enriched. 나머지 11권은 Subject 필터에 안 잡힌다. Subject 필터를 클릭하면 2개 옵션만 나온다 (Evidence, Equity).

이건 의도된 설계(IX-5 value loop)이고 기능적으로 맞지만, **유저 입장에서는 "Filter by practice area"라고 약속해놓고 대부분의 책이 필터에 안 잡히는 상태**다.

UX 질문: 첫 사용 시 Subject 필터가 거의 비어 있다면, 유저가 "필터가 고장났다"고 생각하지 않을까? 현재 disabled 상태에서 "Filters available when your clerk enriches the catalogue" 메시지가 나오지만, 부분적으로 채워진 상태(11권 중 2권만 enriched)에서는 이 메시지가 안 나온다. 필터가 동작은 하는데 대부분의 책이 빠지는 상태.

**고려할 개선:** 필터 옵션 옆에 "(2 of 13 books)" 같은 coverage 표시. 유저가 "왜 결과가 적지?"를 이해할 수 있게.

**2) 검색 결과의 기본 정렬이 relevance가 아니라 type-alternating이다.**

Book과 JADE 결과가 번갈아 나온다 (book → jade → book → jade). Sarah가 "evidence"를 검색하면:

```
1. 📖 Cross on Evidence           (book)
2. ⚖️ Evidence Act 1995           (jade)
3. 📖 Spencer's Evidence Law      (book)
4. ⚖️ Dasreef v Hawchar           (jade)
```

Sarah는 보통 "빌릴 책"을 찾거나 "cite할 판례"를 찾지, 둘을 동시에 훑지 않는다. 인터리브 정렬은 두 타입을 공평하게 보여주지만, 어느 쪽 작업이든 시각적 노이즈가 된다.

Source 필터에서 "Books only" / "JADE only"를 선택하면 해결되지만, **기본값**에서 이 마찰이 있다.

UX 질문: 기본 정렬을 "Books first, then JADE" (그룹핑)으로 바꾸면 스캔이 쉬워지지 않을까? 또는 결과를 두 섹션으로 나누기?

**3) 검색 컨텍스트가 페이지 전환 시 날아간다.**

Sarah가 "evidence" 검색 → Subject: Evidence 필터 → 결과 확인 → 책 상세를 보려고 다른 페이지로 이동 → 다시 Search로 돌아오면 → **검색어, 필터 전부 리셋**. 처음부터 다시 타이핑.

filters는 컴포넌트 로컬 state(`useState`)라서 unmount 시 사라진다.

데모에서는 문제 없다 (한 방향으로만 이동). 하지만 실제 사용에서는 "검색 → 대출 요청 → 검색으로 돌아와서 다음 항목 추가" 같은 왕복이 빈번하다.

---

### 약속 ②: "Court-Ready Citations"

**랜딩페이지 카피:**
> "Every court submission needs an authority list, but compiling one the night before is still the norm. Build yours as you research, not after."
> - Authority lists with drag reorder
> - AGLC format export
> - One-click PDF

**리뷰 카드:**
> Sarah Park: "Exported my AGLC authority list in two clicks. Night-before panic is officially over."

**이것이 CLMS의 킬러 피처다.** 스프레드시트가 절대 못 하는 것. 이 약속이 지켜지면 제품이 팔린다. 안 지켜지면 존재 이유가 없다.

#### 실제 경험: Sarah가 내일 심리를 위해 Authority List를 만든다

**필요한 단계:**

```
① 새 리스트 생성 ("Chen v Minister [2026]")
② 검색하면서 관련 authority를 이 리스트에 추가
③ 각 항목에 pinpoint 입력 (ch 4, s 135, [45]-[48])
④ AGLC4 PDF export
```

**① 리스트 생성 — ❌ 불가능**

`/app/lists`에 "+ New List" 버튼이 있다. 클릭하면 아무 일도 안 일어난다. onClick 핸들러가 없다. Sarah는 새 케이스를 위한 리스트를 만들 방법이 없다.

기존 3개 mock 리스트(Smith v Jones, Re Thompson Trust, Building Corp Appeal)만 사용할 수 있다.

**② 올바른 리스트에 추가 — ⚠️ 제한적**

검색 결과에서 [+ Authority List]를 클릭하면 **항상 첫 번째 리스트**에 추가된다. Sarah에게 3개 리스트가 있어도 선택할 수 없다.

```javascript
const targetList = lists[0];  // 항상 첫 번째
```

스펙에서 "2+ lists → 선택 flyout"이라고 했지만, 구현에서 빠졌다.

**③ Pinpoint 입력 — ❌ 불가능**

"Cross on Evidence"를 리스트에 추가하면 `pageRange: null`로 저장된다. 이후 어디에서도 이 값을 편집할 수 없다. BarristerListsPage(리스트 상세)와 AuthorityListDrawer(하단 드로어) 모두 읽기 전용.

mock 데이터에는 `pageRange: '4.1-4.35'` 같은 값이 pre-populated 되어 있어서, 기존 리스트를 export하면 멋지게 나온다. 하지만 **유저가 직접 만든 리스트의 항목은 전부 pinpoint 없이 export된다.**

AGLC formatter는 이미 pageRange를 처리한다:
```javascript
if (item.pageRange) parts.push(item.pageRange);  // "ch 4" 출력
```
**포맷터는 준비됐다. 입력 UI만 없다.**

**④ AGLC4 PDF export — ✅ 동작함**

[Export AGLC PDF] 클릭 → 새 탭에 인쇄용 HTML. A. Cases → B. Legislation → C. Books 순서로 자동 분류. 형식 정확.

**⑤ 약속된 drag reorder — ❌ 없음**

랜딩페이지에 "Authority lists with drag reorder"라고 적혀 있지만, 리스트 항목의 순서를 바꾸는 기능은 없다. 추가된 순서대로만 표시.

#### 판정

```
약속: "Build yours as you research, not after."
       "Exported my AGLC authority list in two clicks."

현실: 리스트 생성 불가 / 리스트 선택 불가 / pinpoint 입력 불가
      → "Build"할 수가 없다.
      → Export는 되지만 court-ready가 아니다 (pinpoint 없음).
```

**이 약속은 현재 지켜지지 않고 있다.** 가치 사슬의 핵심이 끊겨 있다. 검색(①)과 export(④)는 동작하지만, 중간 단계(리스트 생성 → 올바른 리스트에 추가 → pinpoint 입력)가 빠져서 end-to-end 결과물이 나오지 않는다.

**이게 가장 시급한 수정 대상이다.**

---

### 약속 ③: "Library in Your Pocket"

**랜딩페이지 카피:**
> "You're in court and need to check if a book is available before heading back to chambers. CLMS works from your phone."
> - Barcode scanning
> - Mobile check-in/out
> - Mobile-friendly interface

#### 실제 경험

앱은 desktop-only로 설계되었다 (계획서에 "모바일 반응형은 Phase 3 이후"로 명시). BookDetailPanel 같은 슬라이드인 패널은 데스크톱 레이아웃만 구현.

바코드 스캔: ScanPage가 존재하지만 대출 반납에서 "Return via Scan"은 실제 카메라를 열지 않고 즉시 반납 처리.

#### 판정

```
약속: 모바일에서 검색, 대출, 반납
현실: Desktop-only. 모바일 미대응.
```

**프로토타입 범위에서 예상된 한계.** 하지만 랜딩페이지에 이 약속이 있으므로, 데모 시 "mobile support is in Phase 3"이라고 미리 말해야 한다. 또는 랜딩페이지에서 이 카드를 "Coming Soon" 배지와 함께 표시.

---

## Part 2: Clerk 약속 검증

### 약속 ④: "Every Book Accounted For"

**랜딩페이지 카피:**
> "Chambers lending runs on the honour system. Someone takes a book and it vanishes for weeks. CLMS adds the tracking that the honour system is missing."
> - Request and approval workflow
> - Automated overdue reminders
> - "Who has this book?" One click

**리뷰 카드:**
> David Liu: "Overdue reminders go out automatically. I stopped chasing people."

#### 실제 경험: 대출 승인 플로우

**동작하는 것:**

Barrister가 Search에서 [Request Loan] → Clerk의 `/app/loans` Pending 탭에 나타남 → [Approve] → 14일 due date → Active 탭으로 이동. 깔끔하게 동작한다 ✅

[Deny] → 모달에서 사유 입력 → denied. ✅

"Who has this book?" → Catalogue에서 책 상태(Available/On Loan) + 대출자 이름 확인 가능 ✅

**약속과 다른 것:**

**1) "Automated overdue reminders"는 자동이 아니다.**

리뷰 카드에서 David Liu가 "Overdue reminders go out automatically. I stopped chasing people."라고 했다. 실제로는:

- Clerk이 Overdue 탭에서 수동으로 [Send Reminder] 클릭
- 클릭하면 `reminderSentAt` timestamp만 기록
- 실제로 이메일이나 알림이 가지 않음
- Toast: "Reminder sent to Marcus Webb" (실제로는 안 보냄)

"Automated"이 아니라 "Manual, and it doesn't actually send anything." 프로토타입이니 실제 발송은 기대 안 하지만, "자동"이라는 약속과 수동 클릭 경험의 괴리가 있다.

**UX 수정 제안:**
- 토스트를 "Reminder recorded"로 변경 (정직한 메시지)
- [Send Reminder] 클릭 후 버튼을 "Reminded · just now"로 전환 (disabled) + 마지막 리마인드 시간 표시
- 프로토타입에서도 "이 버튼을 누르면 실 서비스에서 이메일이 간다"는 의도를 시각적으로 보여줄 수 있다

**2) Barrister가 자기 연체를 모른다.**

Marcus가 12일 연체 중인데, Barrister 대시보드에 연체 표시가 없다.

대시보드 stat 카드: Active Loans / Due This Week / Authority Lists. "Overdue"가 없다.

Marcus가 연체 사실을 알려면 `/app/loans`에 가서 Overdue 탭을 직접 열어야 한다. Clerk이 "Reminder sent"를 눌러도 Marcus에게 도달하는 건 아무것도 없다.

**UX 수정 제안:**
- Barrister 대시보드에 Overdue stat 카드 추가 (빨간색, 0이면 숨김)
- 연체 도서가 있으면 대시보드 최상단에 경고 배너: "1 book overdue. Return or extend to avoid escalation."

**3) 연체 에스컬레이션 경로가 없다.**

Overdue 탭에 "Escalated" 배지 (8일+ 연체)가 보이지만, 순전히 장식이다. 에스컬레이션이 무엇을 의미하는지 (벌금? 대출 정지? 상급 clerk 보고?) 정의되지 않았고, 해당 액션도 없다.

이건 프로토타입 범위에서 OK. 하지만 배지가 있으니 유저는 "뭔가 일어나겠지"라고 기대한다. 배지 자체를 없애거나, 툴팁으로 "In production: automatic escalation email after 7 days"을 보여주는 게 정직하다.

---

### 약속 ⑤: "Add Books in Seconds"

**랜딩페이지 카피:**
> "A retiring barrister donates fifty books. Without CLMS, that's an afternoon of manual entry. With it, scan the ISBN and everything auto-fills."
> - ISBN auto-cataloguing
> - Multi-location assignment
> - Practice area categorisation

**리뷰 카드:**
> Margaret Thompson: "Scanned 50 donated books in under an hour. The old way would've taken me a full week."

#### 실제 경험: Rebecca가 5권을 등록한다

**ISBN Lookup의 현재 상태:**

[Add Book] → ISBN 입력 → [Look up] → 500ms shimmer → 폼 자동 채움.

자동 채움 결과:
```
Title:     Looked Up Title      ← generic mock
Author:    Auto Author          ← generic mock
Edition:   1st
Publisher: Publisher
Location:  Owen Dixon East
Floor:     3
```

**"everything auto-fills"가 아니다.** ISBN lookup이 매번 같은 더미 데이터를 반환한다. Rebecca는 6개 필드를 전부 수동으로 고쳐야 한다. ISBN lookup이 없는 것과 동일한 경험.

실 API가 연결되면 해결되지만, **데모에서 "ISBN scan → auto-fill magic"을 보여줄 수 없다.**

**UX 수정 제안:**
- ISBN별로 다른 mock 데이터를 반환하게 수정. `isbnResults.js`에 이미 8개 mock 책이 있다 (`getNextMockBook()`). 이걸 lookup에 연결하면 매번 다른 실감나는 데이터가 나온다.
- 데모에서: ISBN 입력 → 실제 법률 서적 제목이 채워지는 것을 보여줄 수 있다.

**Add Book과 Enrich가 별도 플로우인 문제:**

새 책 등록: AddBookFlow 모달 → Save → 닫힘.
Enrichment: 테이블에서 찾기 → BookDetailPanel → Save → 닫힘.

문을 두 번 열고 닫는다. "방금 추가한 책"을 테이블에서 다시 찾는 불필요한 단계가 있다.

50권을 등록+enrichment하면 100번 문을 여닫는다.

**UX 수정 제안:**
- AddBookFlow 모달에 접이식 Enrichment 섹션 추가.
- ISBN lookup → 필드 확인 → (optional) enrichment → 한 번에 Save.
- 기존 BookDetailPanel은 **이미 등록된 책의 편집**용으로 유지.

**"Practice area categorisation" 약속 — Subject가 single-select**

랜딩페이지에 "Practice area categorisation"이 약속되어 있다. 현재 enrichment의 Subject 필드가 이에 해당한다.

문제: **Subject가 single-select.** Cross on Evidence는 Evidence 서적이지만 Criminal Law와 Civil Procedure에도 관련된다. Rebecca는 하나만 선택할 수 있다. Barrister가 "Criminal"로 필터링하면 이 책이 안 나온다.

비교: 같은 패널에서 Jurisdiction은 이미 multi-select 칩 토글이다. Subject만 단일 `<select>`인 이유가 없다.

이건 단순 UI 변경이 아니라 **데이터 모델 변경**(string → string[])이다. 영향: BookDetailPanel, FilterPillBar, CataloguePage 테이블, SearchResultCard, mock 데이터.

---

### 약속 ⑥: "Built for Chambers"

**랜딩페이지 카피:**
> "Not every member should have the same access. Barristers search and borrow. Clerks manage inventory. CLMS enforces this by role."
> - Role-based permissions
> - Share Authority Lists with colleagues
> - Multi-location structure

#### 실제 경험

**동작하는 것:**
- Barrister와 Clerk이 다른 네비게이션을 본다 ✅
- Clerk만 Catalogue, Members, Locations, Reports를 볼 수 있다 ✅
- 여러 location(East/West, Floor별)으로 도서 관리 ✅

**약속과 다른 것:**

**1) "Share Authority Lists with colleagues" — 공유 기능이 없다.**

Authority List는 현재 mock 데이터에 전체 공개 상태(모든 barrister가 같은 3개 리스트를 본다). "공유"라기보다 "전부 공유됨, 비공개 불가". 유저별 리스트 분리가 없고, 특정 동료에게 공유하는 기능도 없다.

프로토타입 범위에서 OK. 실 서비스에서 유저별 리스트 + 공유 기능 필요.

**2) Role switching UI가 앱에 없다.**

AppShell에 role을 표시하지만 전환 버튼이 없다. 데모에서 Clerk ↔ Barrister 전환을 보여줘야 하는데, 앱 내에서 전환할 방법이 없다.

현재 role은 AppContext에 저장되고 localStorage에서 persist. 하지만 UI에서 변경할 수 있는 컨트롤이 없다.

**UX 수정 제안 (데모용):**
- AppShell 하단이나 프로필 영역에 role switcher 추가.
- 실 서비스에서는 불필요하지만(유저가 role을 직접 바꾸지 않으므로), 데모에서는 필수.

---

## Part 3: IX-5 Value Loop — 이 앱의 존재 이유

### 무엇인가

Clerk이 카탈로그의 책에 metadata(Subject, Jurisdiction 등)를 추가하면 → Barrister의 검색 필터가 자동으로 풍부해진다.

이건 "기능"이 아니라 **두 역할 간의 가치 교환 루프**다. Clerk의 30초 작업(enrichment)이 Barrister의 매 검색마다 시간을 절약한다.

### 현재 동작 상태

기술적으로 동작한다 ✅. Clerk이 BookDetailPanel에서 Subject: "Criminal"을 저장하면, booksMock이 in-place로 변경되고, Barrister의 FilterPillBar가 매 렌더마다 booksMock에서 옵션을 derive하므로 "Criminal (1)" 필터가 나타난다.

### 하지만 데모에서 주의할 점

**Subject single-select 문제가 여기서 가치를 깎는다.**

Cross on Evidence가 Evidence와 Criminal 둘 다에 관련되지만 하나만 선택 가능. 즉, Clerk이 Evidence로 태깅하면 Criminal 필터에 안 나온다. 반대도 마찬가지.

Multi-select면: Evidence와 Criminal 둘 다 태깅 → 두 필터 모두에서 발견 가능. Enrichment의 가치가 2배.

**데모 스크립트에서 설득력 있는 책 선택이 중요하다.**

현재 mock에는 Criminal과 명확히 연관되면서 제목에 "Criminal"이 없는 책이 없다. Dal Pont은 법조윤리 책이지 형법 책이 아니다.

Mock에 Odgers' Uniform Evidence Law (evidence 교재이지만 형사 소송에서 가장 많이 인용)를 추가하면 데모 내러티브가 성립: "제목은 'Evidence'인데, 실제로는 형사법정에서 핵심 교재. Enrichment로 이 연결을 만들면 Criminal로 검색해도 찾을 수 있게 됩니다."

---

## Part 4: 빠진 약속 — 랜딩에 없지만 앱에 있어야 하는 것

랜딩페이지가 약속하지 않았지만, 유저가 자연스럽게 기대하는 것들.

### "내가 뭘 놓쳤지?" — 로그인 후 상태 변화 알림

Sarah가 아침 7시에 로그인한다. 어젯밤 Clerk이 대출을 승인했고, 누가 책을 반납했고, 새 책이 추가됐다. **대시보드에서 "마지막 방문 이후 변경사항"을 보여줘야 한다.**

현재 대시보드에는 이 개념이 없다. Stat 카드는 현재 상태만 보여주고, "어제 2권이 추가됐다"는 변화를 알려주지 않는다.

프로토타입 범위에서는 대기. 하지만 실 서비스에서는 핵심 기능.

### "동시에 같은 책을 요청하면?" — 경합 상태

3명이 동시에 Cross on Evidence를 요청하면? 현재는 전부 pending으로 들어간다. Clerk이 하나를 approve하면 나머지 2건은 어떻게 되나? 자동 deny? Hold queue로 이동?

현재: 아무 처리 없음. 3건 다 pending, 3건 다 approve 가능. 같은 책이 3명에게 "active" 상태.

이것도 프로토타입에서는 OK. 하지만 앱의 핵심 가치("Every Book Accounted For")와 충돌하는 시나리오.

---

## Part 5: 수정 우선순위

### 왜 이 순서인가

CLMS의 차별화 3가지:
1. JADE 통합 검색 — **동작한다**
2. AGLC4 authority list — **끊겨 있다 (가장 시급)**
3. Enrichment → Filter 루프 — **동작하지만 single-select가 가치를 제한**

**#2를 먼저 고쳐야 한다.** Authority list가 end-to-end로 동작하면, 이 제품의 킬러 피처가 데모 가능해진다. Sarah Park의 리뷰 카드 — "Exported my AGLC authority list in two clicks. Night-before panic is officially over." — 가 진짜가 된다.

### Tier 1: Authority List End-to-End (킬러 피처 복구)

| 순서 | 작업 | 왜 이 순서 | 예상 |
|------|------|-----------|------|
| 1 | 리스트 생성 | 이것 없으면 리스트 선택도 의미 없음 | 30분 |
| 2 | 리스트 선택 flyout | 1에서 만든 리스트에 검색에서 추가할 수 있어야 | 1-2h |
| 3 | Pinpoint 인라인 편집 | 이것 없으면 export가 court-ready 아님 | 2-3h |

**완료 테스트:** Sarah가 새 리스트 생성 → 검색에서 올바른 리스트에 추가 → pinpoint 입력 → AGLC4 PDF에 pinpoint 포함.

### Tier 2: Enrichment 품질 (데모 설득력)

| 순서 | 작업 | 왜 | 예상 |
|------|------|---|------|
| 4 | Subject multi-select | 데이터 모델 변경, IX-5 데모 설득력 | 2-3h |
| 5 | 데모용 mock 책 추가 | Odgers' Evidence Law | 5분 |
| 6 | ISBN lookup 개선 | `isbnResults.js` mock을 lookup에 연결 | 30분 |
| 7 | 토스트 카피 수정 | "Clerk notified" → "Loan requested" 등 | 5분 |

**완료 테스트:** 데모 스크립트(Clerk enrich → Barrister filter) 실행 시 논리적 결함 없음. Subject multi-select로 "Evidence이면서 Criminal인 책" 가능.

### Tier 3: UX 개선 (제품 품질)

| 순서 | 작업 | 왜 | 예상 |
|------|------|---|------|
| 8 | Add Book + Enrich 통합 | 5권 등록에 문 10번 여닫기 → 5번으로 | 2-3h |
| 9 | Barrister 대시보드 Overdue | 연체 바리스터가 자기 상태를 모름 | 30분 |
| 10 | Role switcher (데모용) | Clerk ↔ Barrister 전환 UI | 30분 |
| 11 | Reminder 버튼 상태 전환 | "Send Reminder" → "Reminded · 2min ago" | 30분 |

### Tier 4: 대기

| 항목 | 이유 |
|------|------|
| 검색 필터 페이지 전환 시 persist | URL params 또는 context 리팩터 필요. 데모에선 무관 |
| Drag reorder (authority list) | 랜딩에 약속됨. 하지만 pinpoint가 더 중요 |
| Mobile 반응형 | Phase 3+ 계획대로 |
| Hold queue / 경합 처리 | 실 서비스에서 필요. 데모 범위 밖 |
| 알림 시스템 | 프로토타입 범위 밖. 토스트 카피 수정으로 충분 |
| "Return via Scan" 라벨 | "Return Book"으로 바꾸면 끝 |

---

## Part 6: 회귀 테스트 — 수정 후 이것만 확인

매 수정 세션 후 이 2개를 end-to-end로 돌린다.

### 테스트 A: Authority List (킬러 피처)

```
1. /app/lists → [+ New List] → "Test Case [2026]" 입력 → [Create]
2. /app/search → "evidence" 검색
3. Cross on Evidence → [+ Authority List] → flyout → "Test Case [2026]" 선택
4. Evidence Act 1995 → [+ Authority List] → "Test Case [2026]"
5. /app/lists → "Test Case [2026]" 상세
6. Cross on Evidence → reference 클릭 → "ch 4" 입력 → Enter
7. Evidence Act → reference 클릭 → "s 135" 입력 → Enter
8. [Export AGLC PDF]
9. 새 탭 확인:
   - B. Legislation: Evidence Act 1995 (Cth) s 135  ← pinpoint ✅
   - C. Books: ...Cross on Evidence... ch 4  ← pinpoint ✅
```

**통과 = 킬러 피처 동작.**

### 테스트 B: IX-5 Value Loop

```
1. Clerk → /app/catalogue → 아무 unenriched 책 클릭
2. Subject: [Criminal] [Evidence] → [Save]
3. Barrister → /app/search → "evidence"
4. [Subject ▼] → "Criminal" 옵션 존재 확인 → 선택
5. enrich한 책만 필터링되는지 확인
```

**통과 = enrichment 루프 동작.**

---

## 부록: 약속 vs. 현실 요약 테이블

| 랜딩페이지 약속 | 현실 | 판정 |
|----------------|------|------|
| "Books, case law, and legislation in one place" | 검색 동작, 결과 혼합 표시 | ✅ 지켜짐 |
| "Filter by location and practice area" | Location 필터 없음(!), Subject 부분적 | ⚠️ 부분 |
| "JADE integration" | Mock JADE 결과 6개 | ✅ 지켜짐 (mock 범위) |
| "Authority lists with drag reorder" | 리스트 생성 불가, drag reorder 없음 | ❌ 안 지켜짐 |
| "AGLC format export" | Export 동작, 하지만 pinpoint 입력 불가 | ⚠️ 반쪽 |
| "One-click PDF" | Export → 새 탭 HTML → 브라우저 인쇄 | ⚠️ 2클릭 |
| "Barcode scanning" | ScanPage 존재, Return에서는 미연결 | ⚠️ 부분 |
| "Mobile check-in/out" | Desktop-only | ❌ 안 지켜짐 |
| "Mobile-friendly interface" | Desktop-only | ❌ 안 지켜짐 |
| "Request and approval workflow" | 동작함 | ✅ 지켜짐 |
| "Automated overdue reminders" | 수동 클릭, 실제 발송 없음 | ❌ 안 지켜짐 |
| "Who has this book? One click" | Catalogue에서 확인 가능 | ✅ 지켜짐 |
| "ISBN auto-cataloguing" | ISBN lookup이 generic mock 반환 | ⚠️ 껍데기만 |
| "Multi-location assignment" | 동작함 | ✅ 지켜짐 |
| "Practice area categorisation" | Single-select, 가치 제한 | ⚠️ 부분 |
| "Role-based permissions" | 동작함 | ✅ 지켜짐 |
| "Share Authority Lists" | 전체 공유, 개인/선택 공유 없음 | ⚠️ 부분 |
| "Multi-location structure" | 트리 구조 동작함 | ✅ 지켜짐 |
| "Cross-chambers collaboration" | 미구현 | ❌ 안 지켜짐 |
| "Full audit trail" | 미구현 | ❌ 안 지켜짐 |
