# PRD: Authority List & Enrichment 핵심 플로우 개선

> **문서 목적:** 현재 CLMS 앱의 end-to-end 유저 플로우를 검증하고, 핵심 가치 제안이 동작하기 위해 필요한 설계 변경을 정의한다.
>
> **독자:** 디자이너, 프론트엔드 개발자
>
> **현재 날짜:** 2026-03-04

---

## 1. 배경: CLMS가 스프레드시트를 이기는 3가지 이유

Rebecca(Clerk)는 Owen Dixon Chambers의 13권 도서를 관리한다. Sarah(Barrister)는 법정 준비에 필요한 자료를 찾고 인용 목록을 만든다.

Google Sheet로 Title, Borrower, Due Date, Status 칼럼을 만들면 5분이면 된다. 대부분의 문제가 풀린다. CLMS가 존재할 이유는 스프레드시트가 **못 하는** 3가지에 달려 있다:

| # | 차별화 포인트 | 설명 | 현재 상태 |
|---|-------------|------|----------|
| 1 | **JADE 통합 검색** | 챔버 소장 도서 + 호주 법률 데이터베이스(JADE)를 한 번에 검색 | 동작함 (mock) |
| 2 | **AGLC4 자동 생성** | Authority List를 법정 제출 형식으로 원클릭 PDF 생성 | 반쯤 동작함 |
| 3 | **Enrichment → Filter 루프** | Clerk의 메타데이터 작업이 Barrister의 검색 필터를 만든다 | 동작함 (IX-5) |

**#2가 가장 위험하다.** 검색은 되고, enrichment 루프도 돌지만, Authority List 플로우가 중간에 끊겨 있어서 법정 제출 가능한 결과물이 나오지 않는다. 이 PRD는 이 문제를 해결한다.

---

## 2. AGLC4란 무엇인가

AGLC4 = Australian Guide to Legal Citation, 4th Edition. 멜버른 대학교 법대가 발행하는 호주 법률 인용 표준.

쉽게 말하면 **호주 법조계의 참고문헌 형식 규칙**이다. APA/MLA 스타일이 학술 논문에 있듯, AGLC가 법률 문서에 있다. 판례, 법률, 서적을 법정에 제출할 때 반드시 이 형식을 따라야 한다.

### 유형별 형식 예시

**판례 (Case):**
```
Palmer v Cross [2019] FCA 221, [45]-[48]
─────────────  ────  ───  ───  ────────
당사자명        연도   법원  번호  참조 단락 ← 이게 pinpoint
```

**법률 (Legislation):**
```
Evidence Act 1995 (Cth) s 135
──────────────────  ───  ────
법률명 + 연도       관할권  조항 ← 이게 pinpoint
```

**서적 (Book):**
```
J D Heydon, Cross on Evidence (LexisNexis Butterworths, 5th ed, 2004) ch 4
─────────  ─────────────────  ─────────────────────────────────────  ────
저자       제목                출판사, 판, 연도                       챕터 ← 이게 pinpoint
```

### 왜 이게 중요한가

바리스터는 법정 심리 전에 **Table of Authorities** (인용 자료 목록)를 만들어야 한다. 형식:

```
TABLE OF AUTHORITIES

A. Cases
Palmer v Cross [2019] FCA 221, [45]-[48]
Smith v The Queen [2001] HCA 50

B. Legislation
Evidence Act 1995 (Cth) s 135

C. Books
J D Heydon, Cross on Evidence (LexisNexis Butterworths, 5th ed, 2004) ch 4
```

이걸 Word에서 수작업으로 맞추는 게 바리스터의 반복적인 시간 낭비 포인트다. CLMS가 검색 → 수집 → 원클릭 AGLC4 PDF를 해주면, 이 시간이 사라진다. **이게 CLMS의 킬러 피처다.**

### "Pinpoint"이란?

인용에서 **정확한 위치**를 가리키는 참조. "이 책" 전체가 아니라 "이 책의 4장", "이 판례의 45-48단락".

- 서적: `ch 4` (chapter), `[4.1]-[4.35]` (paragraph range)
- 판례: `[45]-[48]` (paragraph), `at 221` (page)
- 법률: `s 135` (section), `pt 3` (part), `div 2` (division)

Court-ready 문서가 되려면 pinpoint가 있어야 한다. "Cross on Evidence" 전체를 cite하는 건 의미가 없다. "Cross on Evidence **ch 4**"를 cite해야 판사가 뭘 읽어야 하는지 안다.

---

## 3. 현재 상태: 어디가 끊겨 있는가

### 시나리오: Sarah가 내일 심리를 위해 Authority List를 만든다

```
Sarah의 목표:
  hearsay exception 관련 authority를 수집해서
  court-ready AGLC4 Table of Authorities를 만든다.

필요한 단계:
  ① 검색 → ② 리스트 선택/생성 → ③ 항목 추가 → ④ pinpoint 입력 → ⑤ AGLC4 export

현재 앱에서:
  ① 검색                    ✅ 동작함
  ② 리스트 선택/생성         ❌ 리스트 선택 UI 없음, 생성 버튼 미연결
  ③ 항목 추가               ⚠️ 동작하지만 항상 첫 번째 리스트에 추가됨
  ④ pinpoint 입력            ❌ 입력/편집 UI가 어디에도 없음
  ⑤ AGLC4 export            ✅ 동작함 (pinpoint 있으면 출력됨)
```

**가치 사슬이 ②와 ④에서 끊긴다.** ①과 ⑤는 잘 동작하지만, 중간이 빠져서 end-to-end 결과물이 court-ready가 아니다.

### 구체적으로 무엇이 빠졌는가

#### Gap A: Authority List 생성 불가

`BarristerListsPage.jsx`의 "+ New List" 버튼:
```jsx
<Button size="sm" variant="secondary">   // ← onClick 핸들러 없음
  <Icon name="solar:add-circle-linear" size={16} />
  New List
</Button>
```
클릭해도 아무 일도 안 일어난다. Sarah가 새 케이스를 시작하면 리스트를 만들 방법이 없다.

#### Gap B: 리스트 선택 불가 (2+ 리스트일 때)

`BarristerSearchPage.jsx`의 "Add to List" 핸들러:
```javascript
const handleAddToList = async (item, type) => {
  const lists = await getLists();
  const targetList = lists[0];  // ← 항상 첫 번째 리스트
  await addItem(targetList.id, newItem);
};
```
Sarah에게 3개 리스트가 있어도 항상 첫 번째에 추가된다. 다른 리스트를 선택할 방법이 없다.

#### Gap C: Pinpoint 입력 불가

검색에서 추가 시:
```javascript
const newItem = {
  type: type === 'jade' ? item.type : 'book',
  title: item.title,
  citation: item.citation || null,
  pageRange: null,           // ← 항상 null
};
```

Authority List 상세 보기(`BarristerListsPage.jsx`)와 하단 Drawer(`AuthorityListDrawer.jsx`) 모두 **읽기 전용**. 편집 UI가 없다.

Mock 데이터에는 `pageRange: '4.1-4.35'`, `pageRange: 'Ch 12'` 같은 값이 pre-populated 되어 있어서 export하면 멋지게 나오지만, 유저가 이 값을 입력하는 경로가 없다.

AGLC formatter는 pageRange를 제대로 처리한다:
```javascript
// aglcFormatter.js - formatBook()
if (item.pageRange) parts.push(item.pageRange);  // "ch 4" 등
// formatCase()
if (item.pageRange) out += `, ${item.pageRange}`;  // "[45]-[48]" 등
```
**포맷팅은 준비돼 있다. 입력 UI만 없다.**

#### Gap D: Subject가 Single-Select

`BookDetailPanel.jsx`:
```jsx
const [subject, setSubject] = useState('');  // String, 배열 아님
<select value={subject} onChange={(e) => setSubject(e.target.value)}>
```

Cross on Evidence는 Evidence가 주요 subject지만 Criminal Law와 Civil Procedure에도 관련된다. 하나만 선택할 수 있으므로, Barrister가 "Criminal"로 필터링하면 이 책이 안 나온다.

비교: Jurisdiction은 이미 multi-select 칩 토글로 구현되어 있다:
```jsx
const [jurisdictions, setJurisdictions] = useState([]);  // 배열
```
Subject만 single-select인 이유가 없다. **데이터 모델 변경**이 필요하다 (string → string[]).

#### Gap E: Barrister 대시보드에 연체 표시 없음

`BarristerDashboardPage.jsx`의 stat 카드:
```jsx
['Active Loans', loans.length, ...],
['Due This Week', dueSoon.length, ...],
['Authority Lists', lists.length, ...],
```

"Due This Week"은 기한 7일 이내 도서만 표시. **이미 연체된 도서는 안 보인다.** Marcus가 12일 연체인데 대시보드에서 경고를 못 본다.

#### Gap F: Add Book과 Enrich가 별도 플로우

새 책 등록 과정:
1. [Add Book] → AddBookFlow 모달 → ISBN 입력 → 필드 수정 → [Save] → 모달 닫힘
2. 테이블에서 새 책 행 클릭 → BookDetailPanel 슬라이드인 → Enrichment 입력 → [Save] → 패널 닫힘

**문을 두 번 열고 닫아야 한다.** 한 화면에서 끝나면 클릭이 절반으로 줄고, "방금 추가한 책을 테이블에서 다시 찾기"라는 불필요한 단계가 사라진다.

---

## 4. 개선 설계

### 4.1. Authority List 생성 (Gap A 해결)

**위치:** BarristerListsPage — "+ New List" 버튼

**인터랙션:**
```
[+ New List] 클릭
  ↓
인라인 폼 등장 (리스트 목록 최상단):
┌────────────────────────────────────────┐
│ List Name:  [Palmer v Minister [2026]] │
│ Case Ref:   [Palmer v Minister [2026]  │
│              NSWSC ____]               │
│ [Cancel]  [Create]                     │
└────────────────────────────────────────┘
  ↓
[Create] 클릭 → 리스트 생성 → 상세 보기로 전환
Toast: "Palmer v Minister [2026] created"
```

**설계 결정:**
- 모달이 아니라 **인라인 폼**. 리스트 목록 위에 카드 형태로 나타남. 이유: 리스트 생성은 가벼운 행위. 모달은 과하다.
- 필수 필드: List Name만. Case Ref는 optional (없으면 export에서 생략).
- 생성 후 바로 상세 보기로 전환 (빈 리스트, "Start by searching for authorities" 안내).

**서비스 변경:**
```javascript
// authorityListsService.js — 추가
export async function createList(name, caseRef = '') {
  const newList = { id: `al${Date.now()}`, name, caseRef, items: [] };
  authorityListsMock.push(newList);
  return newList;
}
```

### 4.2. Search & List-Building Workflow (Gap B, redesigned)

> **Decision record:** APP-003

The disconnected search/list-editing flow is solved with **two search paths**.

#### Path 1: Header Search (Casual)

- Header search bar with autosuggest (chambers books + JADE)
- Click result → modal with details + "Add to List" button
- "Add to List" → flyout dropdown (pick existing list or create new)
- No list context — for quick one-off additions from any page

#### Path 2: Search Page (List-Building Session)

- Entry: `/app/lists` → select list → [Add Items] → `/app/search?listId=xxx`
- Top context bar shows active list: name, case ref, item count
- Search results have [+] button — single tap adds directly to active list (no modal/flyout)
- Added items show checkmark badge
- AuthorityListDrawer removed — context bar replaces it
- [Done] or back → returns to list detail view

```
List-building flow:
  /app/lists → select list → [Add Items]
    → /app/search?listId=al1
    → top bar: "Adding to: Smith v Jones [2024] (3 items)"
    → search "evidence" → tap [+] → instant add, count updates
    → [Done] → return to /app/lists detail view
    → edit pinpoint, usage, part inline

Casual search flow:
  Any page → header search → autosuggest → click → modal
    → [Add to List] → flyout to pick list → Toast → continue working
```

**Design decisions:**
- Search page behavior branches on `listId` query param:
  - With `listId`: focused mode (context bar, direct add, no modal)
  - Without `listId`: casual mode (modal with list picker, same as current)
- AuthorityListDrawer removed from search page. Eliminates duplicate list-management UI in cramped space.
- Detailed list editing (pinpoint, usage, part) stays on BarristerListsPage where space is available.

### 4.3. Authority Usage Types — To Be Read / Referred To (Gap C-1, NEW)

> **Decision record:** APP-002

**배경:** 호주 법원은 List of Authorities를 두 파트로 요구한다:
- **Part A — To be read**: 구술 변론에서 구절을 읽을 authorities (pinpoint 필수)
- **Part B — Referred to**: 인용하지만 법정에서 읽지 않을 authorities (citation만)

Federal Court (GPN-AUTH)와 NSW Supreme Court 템플릿 모두 이 구조를 따른다.

**데이터 모델 변경:**
```javascript
// authority list item에 usage 필드 추가
{
  id: 'item1',
  type: 'case',
  title: 'Palmer v Cross',
  citation: '[2019] NSWCA 58',
  pageRange: '[45]-[48]',
  usage: 'read',        // 'read' | 'referred'  ← NEW
}
```

**Default:** System auto-assigns based on item type + court structure. No usage picker at add-time.

| Court | Item Type | Default Part | Default Usage |
|---|---|---|---|
| VIC | case | Part A (read) | `read` |
| VIC | legislation | Part A (read) | `read` |
| VIC | book | Part C (textbooks) | `read` |
| Federal | case/book | Part 1 (authorities) | `read` |
| Federal | legislation | Part 2 (legislation) | `referred` |

**UI:**
- Authority list detail view (BarristerListsPage): Read/Ref toggle per item (segmented control)
- Changing part auto-updates usage via `getDefaultUsage(part, courtStructure)`
- Adding from search: no usage picker — determined by `getDefaultUsage`
- AuthorityListDrawer: usage badge display (to be removed from search page per APP-003)

**Export 변경:**
- AGLC4 export가 usage별로 그룹화:
  - Part A: Cases/Legislation/Books to be read (pinpoint 포함)
  - Part B: Cases/Legislation/Books referred to (citation만)

**"Export Ready" 로직 변경:**
- 기존: 모든 항목에 pinpoint 필요
- 변경: `usage: 'read'` 항목만 pinpoint 필요. `usage: 'referred'`는 항상 완료 상태.

**Book availability와의 독립성:**
- Book의 대출 상태(available/on-loan)는 authority list와 무관
- 물리적으로 책을 갖고 있지 않아도 authority list에 추가 가능
- 검색 결과 카드에서 availability와 authority list는 별개로 표시

### 4.4. Pinpoint 인라인 편집 (Gap C 해결, 번호 조정)

**위치:** BarristerListsPage — 리스트 상세 보기의 각 항목

**현재:**
```
1. Cross on Evidence                    [Book]
   4.1-4.35
```
읽기 전용.

**변경 후:**
```
1. Cross on Evidence                    [Book]
   Reference: [ch 4           ]  ← 클릭하면 편집 가능
```

**인터랙션:**
```
항목의 reference 영역 클릭
  ↓
텍스트가 인라인 input으로 전환:
  [ch 4          ]  ← 자유 텍스트, placeholder "e.g. ch 4, [45]-[48], s 135"
  ↓
Enter 또는 blur → 저장
  → authorityListsService.updateItem(listId, itemId, { pageRange: value })
  ↓
input이 다시 텍스트로 전환
```

**설계 결정:**
- **자유 텍스트 입력**. source-aware 에디터(book이면 ch/para, legislation이면 s/pt/div)는 과하다. AGLC formatter가 이미 타입별 출력을 처리하므로, 유저가 "ch 4"든 "[45]-[48]"이든 직접 타이핑하면 된다.
- 인라인 편집 패턴: 클릭하면 input으로 전환, blur/Enter로 저장. 별도 "Edit" 버튼 불필요.
- placeholder로 형식 힌트 제공: `"e.g. ch 4, [45]-[48], s 135"`
- 빈 상태에서도 저장 가능 (pinpoint 없는 citation도 유효).

**AuthorityListDrawer에도 동일 적용:**
- 하단 drawer의 항목 목록에서도 pageRange 클릭 시 인라인 편집.
- 단, drawer는 공간이 좁으므로 input 너비를 제한 (max-w-[120px]).

**서비스 변경:**
```javascript
// authorityListsService.js — 추가
export async function updateItem(listId, itemId, patch) {
  const list = authorityListsMock.find((l) => l.id === listId);
  const item = list?.items.find((i) => i.id === itemId);
  if (item) Object.assign(item, patch);
  return item;
}
```

### 4.5. Subject Multi-Select (Gap D 해결)

**현재:** `<select>` 단일 선택, string으로 저장

**변경 후:** Jurisdiction과 동일한 **칩 토글 패턴**

```
Subject:
  [Administrative Law] [Banking & Finance] [Commercial] [Constitutional]
  [Contract] [Corporations] [Criminal] [Employment] [Environmental]
  [Equity] [✓ Evidence] [Family] [Human Rights] [Immigration]
  [Indigenous] [Insurance] [IP] [Property] [Tort]
```

선택된 칩: 파란 배경 + 흰 텍스트 + × 버튼 (Jurisdiction과 동일).

**데이터 모델 변경:**
```
enrichment.subject: string → string[]

Before: { subject: 'Evidence' }
After:  { subject: ['Evidence', 'Criminal'] }
```

**영향받는 코드:**
- `BookDetailPanel.jsx`: useState('') → useState([]), select → 칩 토글
- `FilterPillBar.jsx`: `b.enrichment?.subject === filters.subject` → `b.enrichment?.subject?.includes(filters.subject)`
- `ClerkCataloguePage.jsx`: 테이블의 Subject 열에 `book.enrichment?.subject` → `book.enrichment?.subject?.join(', ')`
- `SearchResultCard.jsx`: subject 표시 로직
- `booksService.js`: enrichBook()은 이미 spread로 저장하므로 변경 불필요
- `books.js` mock: b1의 `subject: 'Evidence'` → `subject: ['Evidence']`, b4의 `subject: 'Equity'` → `subject: ['Equity']`

### 4.6. Barrister 대시보드 연체 표시 (Gap E 해결)

**현재 stat 카드 3개:**
```
[Active Loans: N]  [Due This Week: N]  [Authority Lists: N]
```

**변경 후 stat 카드 4개:**
```
[Active Loans: N]  [Overdue: N]  [Due This Week: N]  [Authority Lists: N]
                    ↑ 빨간색, 0이면 숨김 또는 grey
```

**인터랙션:**
- Overdue 카드 클릭 → `/app/loans` (Overdue 탭으로 이동)
- 0이면: 카드 자체를 숨기거나, 숫자를 회색으로 표시 (경고 느낌 없이)
- 1+이면: 빨간 아이콘 + 빨간 숫자, 시각적 긴급감

**코드 변경:** `BarristerDashboardPage.jsx`에서 loans를 `overdue` status로 필터링하는 로직 추가.

### 4.7. Add Book + Enrich 통합 (Gap F 해결)

**현재:** AddBookFlow(모달) → 닫힘 → 테이블에서 찾기 → BookDetailPanel(패널)

**변경 후:** AddBookFlow 모달 안에 enrichment 섹션 추가

```
┌─ Add Book ──────────────────────────────────┐
│                                              │
│ ISBN: [978-0-409-343953  ] [Look up]         │
│                                              │
│ ─── Book Details ───                         │
│ Title:     [Cross on Evidence    ]           │
│ Author:    [J.D. Heydon          ]           │
│ Edition:   [12th                  ]          │
│ Publisher: [LexisNexis            ]          │
│ Location:  [Owen Dixon East       ]          │
│ Floor:     [5                     ]          │
│                                              │
│ ─── Enrichment (optional) ───                │
│ Subject:      [Evidence ✕] [Criminal ✕]      │
│ Jurisdiction: [Federal ✕]                    │
│ Resource Type:[Monograph          ▼]         │
│ Tags:         [hearsay ✕] [+]               │
│                                              │
│ [Cancel]          [Save to Catalogue]        │
└──────────────────────────────────────────────┘
```

**설계 결정:**
- Enrichment 섹션은 "optional" 라벨 + 접힘 상태로 시작. 화살표 클릭하면 펼쳐짐.
- 이유: ISBN만 빠르게 등록하고 나중에 enrich하는 워크플로우도 유효. 강제하지 않는다.
- [Save to Catalogue] 하나로 book details + enrichment 동시 저장.
- 기존 BookDetailPanel은 **기존 책 편집용으로 유지**. AddBookFlow는 **새 책 등록 + 초기 enrichment용**.

---

## 5. 토스트 메시지 카피 수정

현재 앱의 여러 토스트가 실제 동작과 불일치하는 메시지를 보여준다. 프로토타입이므로 실제 알림이 없는 건 당연하지만, 메시지가 거짓말하면 안 된다.

| 현재 메시지 | 문제 | 수정 |
|------------|------|------|
| "Loan requested · Clerk notified" | 실제 알림 없음 | "Loan requested" |
| "Approved · Borrower notified" | 실제 알림 없음 | "Loan approved" |
| "Denied · Borrower notified" | 실제 알림 없음 | "Loan denied" |
| "Reminder sent to Marcus Webb" | 실제 발송 없음 | "Reminder recorded" → 버튼 상태를 "Reminded · just now"로 전환 |

**예외:** 이건 5초짜리 문자열 변경이다. 설계 결함이 아니라 카피 오류.

---

## 6. 데모 스크립트 (IX-5) 수정

### 데모용 책 선택 문제

이전 스크립트에서 "Dal Pont on Lawyers' Professional Responsibility"를 Subject: "Criminal"로 enrich하라고 했다. 하지만 Dal Pont은 법조 윤리 교재다. Neal이나 Michael이 호주 법학을 아는 사람이라면 명백히 틀린 enrichment라서 데모 신뢰도가 떨어진다.

**해결:** mock 데이터에 데모용 책 1권 추가.

```javascript
// books.js — 추가
{
  id: 'b14',
  title: "Odgers' Uniform Evidence Law",
  author: 'Stephen Odgers',
  edition: '18th',
  publisher: 'Thomson Reuters',
  isbn: '978-0-455-24651-2',
  location: 'Owen Dixon East',
  floor: '5',
  status: 'available',
  practiceArea: 'Evidence',      // 제목은 "Evidence"
  jurisdiction: 'Federal',
  borrower: null,
  dueDate: null,
  enrichment: null,              // 아직 unenriched
}
```

이 책은 evidence 교재지만 **형사 소송에서 가장 많이 인용되는 교재**다. Subject: ["Criminal", "Evidence"]로 enrich하는 건 방어 가능하다. 데모 내러티브: "제목은 'Evidence'인데, 실제로는 형사법정에서 가장 많이 쓰입니다. Enrichment로 이 연결을 만들어주면 Criminal로 검색해도 찾을 수 있게 됩니다."

### 수정된 데모 스크립트

**[0:00-0:30] 문제 제시**

Barrister 역할. `/app/search`에서 "criminal" 검색.
→ 결과 나옴 (practiceArea 매칭).
→ [Subject ▼] 필터 클릭 → disabled: "Filters available when your clerk enriches the catalogue"
→ "제목에 'criminal'이 있는 책은 찾았지만, **evidence 교재인데 형사 소송에서 핵심적인 책**은 빠져 있습니다."

**[0:30-1:30] Clerk의 작업**

역할 전환. `/app/catalogue` → ISBN Only 탭.
→ "Odgers' Uniform Evidence Law" 클릭 → BookDetailPanel.
→ Subject: [Criminal] [Evidence] 선택 (multi-select 칩).
→ Jurisdiction: [Federal] → [Save].
→ Toast: "Odgers' Uniform Evidence Law enriched"
→ 배지: ISBN Only → Enriched ✓

**[1:30-2:30] 가치 확인**

역할 전환. `/app/search` → "evidence" 검색.
→ [Subject ▼] 클릭 → **"Criminal (1)" 옵션 등장!**
→ "Criminal" 선택 → Odgers' 책만 필터링.
→ "제목은 'Evidence'인데 Criminal로 찾을 수 있게 됐습니다. Rebecca가 30초 만에 만든 연결입니다."

**[2:30] 마무리**

"Rebecca가 10권을 enrich하면 Subject 옵션이 8-9개 생깁니다. 수백 권이면 이 필터 없이는 검색이 불가능합니다. **카탈로그가 클수록 enrichment의 가치가 커집니다.**"

---

## 7. 우선순위 수정 계획

### Tier 1: Authority List 플로우 복구 (데모 필수)

이 3개가 끝나야 시나리오 1 (법정 준비)이 end-to-end로 동작한다.

| 순서 | Gap | 작업 | 예상 시간 |
|------|-----|------|----------|
| 1st | A: 리스트 생성 | BarristerListsPage에 인라인 생성 폼 + createList 서비스 | 30분 |
| 2nd | B: 리스트 선택 | SearchResultCard에 flyout 드롭다운 + 분기 로직 (0/1/2+) | 1-2시간 |
| 3rd | C-1: Usage Types | Authority list item에 usage 필드(read/referred) + 토글 UI + export 그룹화 (APP-002) | 2-3시간 |
| 4th | C: Pinpoint 편집 | BarristerListsPage + AuthorityListDrawer에 인라인 input + updateItem 서비스 | 2-3시간 |

**완료 기준:** Sarah가 새 리스트를 만들고 → 검색에서 올바른 리스트에 추가하고 → pinpoint(ch 4 등)를 입력하고 → AGLC4 PDF를 export해서 court-ready 문서가 나온다.

### Tier 2: Enrichment 구조 개선 (데모 품질)

| 순서 | Gap | 작업 | 예상 시간 |
|------|-----|------|----------|
| 4th | D: Subject multi-select | BookDetailPanel 칩 토글 + 데이터 모델 string→array + FilterPillBar 매칭 로직 수정 | 2-3시간 |
| 5th | 데모 책 추가 | books.js에 Odgers 추가 | 5분 |
| 6th | 토스트 카피 | 4개 메시지 문자열 변경 | 5분 |

**완료 기준:** 데모 스크립트(시나리오 4)가 논리적 결함 없이 실행 가능. Subject multi-select로 "Evidence이면서 Criminal인 책"이 가능.

### Tier 3: UX 개선 (제품 품질)

| 순서 | Gap | 작업 | 예상 시간 |
|------|-----|------|----------|
| 7th | F: Add+Enrich 통합 | AddBookFlow에 접이식 enrichment 섹션 추가 | 2-3시간 |
| 8th | E: Barrister 대시보드 연체 | stat 카드 추가 + overdue 필터링 | 30분 |

### Tier 4: 대기 (지금 안 해도 됨)

| Gap | 이유 |
|-----|------|
| 필터 상태 페이지 전환 시 리셋 | 데모에서는 문제 없음. 일상 사용 시 개선 필요하지만 URL params 또는 context 리팩터 필요 |
| "Return via Scan" 라벨 | 라벨을 "Return Book"으로 변경하면 끝. 실제 스캔은 Phase 2+ |
| Hold queue | 빈 배열. 데모에서 Holds 탭을 보여주지 않으면 됨 |
| 동일 유저 요청+승인 | 프로토타입 한계. 실 서버에서 identity 분리 |
| 알림 시스템 | 프로토타입 범위 밖. 토스트 카피 수정으로 충분 |

---

## 8. 검증 시나리오 (수정 후 회귀 테스트)

매 수정 세션 후 이 2개 시나리오를 end-to-end로 돌린다.

### 회귀 테스트 1: Authority List End-to-End

```
1. Barrister로 로그인
2. /app/lists → [+ New List] → "Test Case [2026]" 입력 → [Create]
3. /app/search → "evidence" 검색
4. Cross on Evidence 카드 → [+ Authority List] → flyout에서 "Test Case [2026]" 선택
5. Evidence Act 1995 카드 → [+ Authority List] → "Test Case [2026]" 선택
6. /app/lists → "Test Case [2026]" 클릭
7. Cross on Evidence 항목의 reference 클릭 → "ch 4" 입력 → Enter
8. Evidence Act 항목의 reference 클릭 → "s 135" 입력 → Enter
9. [Export AGLC PDF] 클릭
10. 새 탭에서 확인:
    - B. Legislation: Evidence Act 1995 (Cth) s 135 ← pinpoint 있음
    - C. Books: ...Cross on Evidence... ch 4 ← pinpoint 있음
```

**통과 기준:** 10단계 전부 클릭 가능하고, export PDF에 pinpoint가 포함된다.

### 회귀 테스트 2: IX-5 Value Loop

```
1. Clerk로 전환
2. /app/catalogue → Odgers' Uniform Evidence Law 클릭
3. Subject: [Criminal] [Evidence] → [Save]
4. Barrister로 전환
5. /app/search → "evidence" 검색
6. [Subject ▼] → "Criminal (1)" 옵션 확인 → 선택
7. Odgers' 책만 필터링되는지 확인
```

**통과 기준:** Step 6에서 "Criminal" 옵션이 존재하고, Step 7에서 정확히 1권만 표시.

---

## 부록: 갭 요약 (수정된 심각도)

| # | Gap | 심각도 | 판단 기준 |
|---|-----|--------|----------|
| A | Authority List 생성 불가 | **Critical** | 새 케이스 작업 자체가 불가 |
| B | 리스트 선택 불가 (2+ 리스트) | **Critical** | 여러 케이스 동시 준비 불가 |
| C | Pinpoint 입력/편집 UI 없음 | **Critical** | AGLC4 export가 court-ready 아님 |
| D | Subject single-select | **Critical** | 데이터 모델 변경 필요, enrichment 가치 제한 |
| E | Barrister 대시보드 연체 미표시 | **Medium** | 긴급 정보 누락이지만 Loans 탭에서는 보임 |
| F | Add Book + Enrich 별도 플로우 | **Medium** | 동작은 하지만 비효율적 |
| G | 토스트 카피 불일치 | **Low** | 5초 문자열 수정 |
| H | 필터 상태 리셋 | **데모 Low / 제품 High** | 데모에서는 무관, 일상 사용 시 컨텍스트 손실 |
| I | ISBN lookup generic mock | **Low** | 실제 API 연결 시 자동 해결 |
| J | Return via Scan 라벨 misleading | **Low** | 라벨 변경만으로 해결 |
