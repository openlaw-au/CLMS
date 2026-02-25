# CLMS Design Rules

이 문서는 CLMS 프로젝트의 UI 일관성을 유지하기 위한 디자인 규칙입니다.
코드를 작성하거나 수정할 때 반드시 따릅니다.

---

## 1. Icon + Text Alignment

아이콘과 텍스트가 함께 쓰일 때 **항상 수직 중앙 정렬**합니다.

### Inline (텍스트 흐름 내)
```html
<iconify-icon icon="..." class="inline-block align-middle mr-1"></iconify-icon>
<span class="align-middle">텍스트</span>
```

### Flex 컨테이너
```html
<div class="flex items-center gap-2">
    <iconify-icon icon="..."></iconify-icon>
    텍스트
</div>
```

### 규칙 요약
- `inline-block align-middle` 또는 `flex items-center` 중 하나를 반드시 사용
- 아이콘만 단독으로 배치하는 경우는 예외
- 아이콘과 텍스트 사이 간격: `gap-2` (8px) 또는 `mr-1` (4px) — 컨텍스트에 따라 선택

---

## 2. Spacing System (4px Grid)

모든 간격은 **4의 배수**로 지정합니다. Tailwind 유틸리티 기준:

| Tailwind | px  | 용도 예시 |
|----------|-----|-----------|
| `1`      | 4   | 아이콘-텍스트 간격 (inline) |
| `2`      | 8   | 아이콘-텍스트 간격 (flex), 리스트 항목 간격 |
| `3`      | 12  | 소형 패딩 |
| `4`      | 16  | 기본 패딩, 섹션 내 요소 간격 |
| `6`      | 24  | 중간 패딩, 카드 내부 |
| `8`      | 32  | 카드 패딩 (p-8) |
| `10`     | 40  | 버튼 좌우 패딩 |
| `12`     | 48  | 섹션 간 간격 |
| `16`     | 64  | 섹션 타이틀-콘텐츠 간격 |
| `20`     | 80  | 히어로 상하 패딩 (모바일) |
| `24`     | 96  | 섹션 상하 패딩 |
| `32`     | 128 | 히어로 상하 패딩 (데스크톱) |

### 규칙 요약
- 임의 값(`px-[13px]` 등) 사용 금지 — Tailwind 스케일만 사용
- 홀수 Tailwind 단위(`p-5`, `p-7` 등)는 가능하면 피하고, 짝수 단위 우선
- `gap`, `padding`, `margin` 모두 동일 규칙 적용

---

## 3. Color Tokens

색상은 `:root`에 정의된 CSS 커스텀 프로퍼티를 사용합니다.
하드코딩 hex 값 사용을 금지합니다 (SVG fill 속성 제외).

```
--color-primary        브랜드 주황
--color-primary-hover  호버 상태
--color-text           본문 텍스트
--color-bg             페이지 배경
--color-bg-dark        푸터 배경
--color-surface        흰색 표면
--color-surface-subtle 카드 배경 (#F4F5F7)
```

Tailwind 기본 유틸리티(`bg-white`, `text-slate-600` 등)는 그대로 사용 가능.
커스텀 브랜드 색상만 `var(--color-*)` 토큰으로 참조합니다.

---

## 4. Semantic HTML

- 페이지 네비게이션: `<header>` > `<nav>`
- 콘텐츠 영역: `<main>` > `<section>`
- 독립 콘텐츠 카드: `<article>`
- 페이지 하단: `<footer>`

---

## 5. Copy: Em Dash 금지

본문 카피에 **em dash(—)를 사용하지 않습니다.**
마침표, 쉼표, 또는 문장 구조 변경으로 대체합니다.

```
❌ "One system — two workflows"
✅ "One system. Two workflows."
✅ "One system, two workflows"
```

---

## 6. Copy: 챔버 실명 사용 제한

- **메인 콘텐츠**(히어로, 피처, 트러스트, CTA 등)에서는 **특정 챔버 이름 사용 금지**
- "chambers", "your chambers" 등 일반 명칭만 사용
- **리뷰/테스티모니얼 카드**에서만 호주에서 널리 알려진 챔버 이름 허용

---

## 7. Card Component

피처/밸류 카드는 **CSS 컴포넌트 클래스**를 사용합니다. Tailwind 인라인 대신 `.card` 시스템으로 통일.

### 사용 가능한 클래스
| 클래스 | 역할 |
|---|---|
| `.card` | 카드 컨테이너 (배경, 라운딩, 패딩, 보더) |
| `.card-icon` | 아이콘 래퍼 (48x48, 흰 배경, 라운딩) |
| `.card-title` | 카드 제목 (serif, bold) |
| `.card-desc` | 카드 설명 텍스트 |
| `.card-checks` | 체크 리스트 `<ul>` |
| `.card-check` | 체크 항목 `<li>` (flex + gap) |

### 기본 카드 (설명만)
```html
<article class="card">
    <div class="card-icon">
        <iconify-icon icon="solar:..." width="24" height="24"></iconify-icon>
    </div>
    <h3 class="card-title">제목</h3>
    <p class="card-desc">설명</p>
</article>
```

### 체크리스트 카드
```html
<article class="card">
    <div class="card-icon">
        <iconify-icon icon="solar:..." width="24" height="24"></iconify-icon>
    </div>
    <h3 class="card-title">제목</h3>
    <p class="card-desc">설명</p>
    <ul class="card-checks">
        <li class="card-check"><iconify-icon icon="solar:check-circle-linear" class="text-emerald-500 shrink-0" width="16" height="16"></iconify-icon>항목</li>
    </ul>
</article>
```

### 규칙 요약
- 새 섹션에 카드를 추가할 때 반드시 `.card` 컴포넌트 사용
- 아이콘 색상은 `.card-icon iconify-icon`에서 `--color-primary`로 자동 적용
- `<article>` 태그 사용 (시맨틱 HTML 규칙 준수)
