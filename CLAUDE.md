# CLMS Project

Chambers Library Management System — 호주 법률 전문가를 위한 도서관 관리 시스템 랜딩페이지.

## Tech Stack
- Single-file HTML (`index.html`)
- Tailwind CSS (CDN)
- Iconify (Solar Linear icon set)
- Fonts: Playfair Display (serif headings), Inter (sans body)

## Design Rules
**반드시 [DESIGN_RULES.md](./DESIGN_RULES.md)를 따를 것.**

핵심 요약:
- **Icon + Text**: 항상 수직 중앙 정렬 (`flex items-center` 또는 `inline-block align-middle`)
- **Spacing**: 4px 배수 시스템 (Tailwind 스케일만 사용, 임의 px 금지)
- **Colors**: `:root` 디자인 토큰 사용 (하드코딩 hex 금지, SVG fill 제외)
- **Semantic HTML**: `header > nav`, `main > section`, 카드는 `article`, `footer`
- **Copy**: em dash(—) 금지, 마침표/쉼표로 대체
- **Copy**: 메인 콘텐츠에 특정 챔버 실명 사용 금지 (리뷰 카드에서만 허용)
- **Card Component**: `.card` / `.card-icon` / `.card-title` / `.card-desc` / `.card-checks` / `.card-check` 클래스 사용
