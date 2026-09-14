# emfls.com AdSense Audit

## Executive Summary

- 저장소는 Astro 6 기반 정적 사이트이며 `https://emfls.com`을 사이트 주소로 설정한다.
- 콘텐츠는 TypeScript 데이터 파일에서 생성되며 공개 글은 18개다.
- 카테고리 7개와 태그 동적 라우트가 있고, 정책·신뢰 페이지도 존재한다.
- `@astrojs/sitemap`으로 `sitemap-index.xml`을 생성하도록 설정되어 있다.
- `public/robots.txt`는 전체 크롤러를 허용한다.
- AdSense 스크립트와 Publisher ID가 공통 레이아웃에 이미 들어 있다.
- `public/ads.txt`는 없다.
- 모든 글 상세 페이지에 `스크린샷 추가 예정` 플레이스홀더가 존재한다.
- 개인정보처리방침은 현재 코드와 달리 GitHub Pages를 운영 호스팅으로 적고, Analytics·AdSense를 향후 추가로 표현한다.
- 의존성 폴더가 없어 공식 빌드는 실행되지 않았다. 패키지 설치는 하지 않았다.

## Tech Stack

| 항목 | 확인 결과 |
|---|---|
| Framework | Astro 6 (`astro` ^6.4.4) |
| Build | `astro build`, 정적 출력 기본값 |
| Content | `src/data/articles.ts`, 보강 데이터 `src/data/articleEnhancements.ts` |
| Pages/layout | `src/pages/`, 공통 `src/layouts/BaseLayout.astro` |
| Deploy config | `astro.config.mjs`에 `site: https://emfls.com`, sitemap integration |
| Cloudflare Pages | 문서/콘텐츠에는 언급되나 별도 Cloudflare 설정 파일은 없음 |
| GitHub Actions | `.github/` 없음 |
| Assets | `public/favicon.svg`, `public/robots.txt`; 이미지 파일 없음 |
| Environment variables | 코드에서 확인되지 않음 |

## Current Public Pages

| 종류 | 개수 | 근거 |
|---|---:|---|
| 일반 콘텐츠 글 | 18 | `src/data/articles.ts`의 article entries |
| 카테고리 페이지 | 7 | `categoryMeta` + `src/pages/categories/[slug].astro` |
| 태그 페이지 | 18 | 글별 tag map에서 생성되는 동적 라우트 |
| 검색 페이지 | 0 | 별도 검색 route 없음; `/articles/` 내 클라이언트 검색 UI만 존재 |
| 홈 | 1 | `src/pages/index.astro` |
| About | 1 | `/about/` |
| Contact | 1 | `/contact/` |
| Privacy | 1 | `/privacy/` |
| Terms | 1 | `/terms/` |
| Editorial Policy | 1 | `/editorial-policy/` |
| Disclaimer | 1 | `/disclaimer/` |
| Content Methodology | 1 | `/content-methodology/` |
| HTML 사이트맵 | 1 | `/site-map/` |
| 404 | 1 | `src/pages/404.astro` |
| 빈/테스트 페이지 | 0 확인 | 별도 route 없음 |
| 자동 생성 페이지 | 글·카테고리·태그 동적 생성 | Astro `getStaticPaths` |

주요 글 slug/title:

| slug | title |
|---|---|
| `personal-domain-website-start-checklist` | 개인 도메인으로 웹사이트를 시작하기 전에 정해야 할 것들 |
| `github-pages-strengths-and-limits` | GitHub Pages가 개인 사이트에 적합한 이유와 한계 |
| `gabia-domain-dns-github-pages` | 가비아 도메인을 GitHub Pages에 연결할 때 확인할 DNS 기록 |
| `why-astro-for-static-content-site` | 정적 사이트 생성기 Astro를 선택할 때의 기준 |
| `adsense-review-essential-pages` | 애드센스 심사 전 사이트에 필요한 기본 페이지 |
| `seo-friendly-title-and-url` | 검색 엔진이 읽기 쉬운 글 URL과 제목 만드는 법 |
| `robots-and-sitemap-basics` | robots.txt와 sitemap.xml의 역할 이해하기 |
| `privacy-policy-practical-checklist` | 개인정보처리방침을 작성할 때 실제로 확인할 항목 |
| `why-custom-404-page-matters` | 404 페이지가 필요한 이유와 좋은 구성 |
| `simple-contact-page-for-static-site` | 정적 사이트에서 문의 기능을 단순하게 시작하는 방법 |
| `after-first-deploy-checklist` | 첫 배포 후 확인해야 할 체크리스트 |
| `unfinished-site-signals-before-adsense` | 애드센스 심사 전에 피해야 할 미완성 신호 |
| `cloudflare-dns-setup-for-beginners` | Cloudflare DNS 설정을 처음 할 때 확인할 순서 |
| `google-search-console-domain-property-guide` | Google Search Console에 새 도메인을 등록하는 방법 |
| `adsense-review-final-checklist` | AdSense 심사 전 최종 체크리스트 |
| `connect-custom-domain-to-github-pages` | GitHub Pages에 개인 도메인을 연결하는 기본 흐름 |
| `how-to-check-https-on-custom-domain` | HTTPS 적용이 제대로 되었는지 확인하는 방법 |
| `github-pages-vs-wordpress-for-beginners` | GitHub Pages와 워드프레스 중 무엇을 선택할까 |

## Content Findings

- **FAIL — 미완성 신호:** `src/pages/articles/[slug].astro:129-134`에서 모든 글에 `스크린샷 추가 예정` 플레이스홀더를 렌더링한다.
- **FAIL — 실제 이미지 부재:** `public/`에는 favicon과 robots.txt만 있고 콘텐츠 이미지는 없다. 글의 스크린샷 설명도 미래형이다.
- **주의 — 템플릿 반복:** 모든 글이 예시·체크리스트·흔한 실수·FAQ·관련 글·공식 문서 섹션을 동일한 컴포넌트 구조로 출력한다.
- **주의 — 유사 주제 중복:** GitHub Pages/Cloudflare Pages/DNS/AdSense 체크리스트 글이 다수이며 실제 경험과 고유 사례의 차이를 추가 검증해야 한다.
- `TODO`, `TBD`, `추가 예정`, `준비 중`, `작성 예정`, `lorem ipsum`은 플레이스홀더 외 공개 문구에서 확인되지 않았다. 검색 결과에는 문서가 제거해야 할 표현을 설명하는 문장도 포함된다.
- 모든 Article 타입에 `title`, `description`, `slug`가 선언되어 있고 18개 항목에 존재한다.
- 관련 글은 카테고리/대체 카테고리에서 최대 3개를 채우므로 구조상 빈 영역은 확인되지 않았다.
- 공식 출처 링크는 enhancement 데이터에서 글별로 제공된다.

## SEO Findings

| 항목 | 상태 | 근거/문제 |
|---|---|---|
| HTTPS canonical | PASS | `BaseLayout.astro`와 config가 HTTPS 사용 |
| canonical domain `https://emfls.com` | PASS | 공통 `siteUrl` 및 `astro.config.mjs` |
| sitemap | PASS | `@astrojs/sitemap`; robots가 sitemap-index 안내 |
| robots.txt | PASS | `User-agent: * Allow: /` |
| Googlebot 차단 | PASS | 차단 규칙 없음 |
| Mediapartners-Google 차단 | PASS | 차단 규칙 없음 |
| ads.txt | FAIL | `public/ads.txt` 없음 |
| favicon | PASS | `public/favicon.svg` 연결 |
| 기본 meta description | PASS | BaseLayout 기본값 존재 |
| 페이지별 unique title | PASS | 페이지/글 제목 조합 확인 |
| 페이지별 description | PASS | BaseLayout prop 및 article metadata |
| Open Graph | PASS | type/site_name/title/description/url |
| Article 구조화 데이터 | PASS | 글 상세에 Article JSON-LD |
| Breadcrumb 구조화 데이터 | PASS | 글 상세에 BreadcrumbList JSON-LD |
| 404 페이지 | PASS | `src/pages/404.astro` |
| 모바일 viewport | PASS | 공통 layout에 viewport |
| 내부 링크 | PASS | header/footer/sitemap/related links |
| 외부 링크 target/rel | PASS | article source links에 `target=_blank`, `rel=nofollow noopener` |

## AdSense Findings

- AdSense 코드 존재: `src/layouts/BaseLayout.astro:25-31`
- 로드 URL: `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=...`
- Publisher ID: `ca-pub-8830********4754`
- `adsbygoogle` 문자열: `src/layouts/BaseLayout.astro:30`에서 확인.
- `pagead.googlesyndication.com`: `src/layouts/BaseLayout.astro:30`에서 확인.
- `google_ad_client`: 별도 확인되지 않음.
- `ca-pub-`: `src/layouts/BaseLayout.astro:30`, `adsense-site-prep.md:104`에서 확인. 문서 파일은 운영 코드가 아님.
- `ads.txt`: `public/ads.txt` 없음. README와 준비 문서에는 승인 후 추가 예정이라고 적혀 있음.

## Trust & Policy Findings

- About: 운영 목적, 주제, 작성자 역할, 이메일, 콘텐츠 기준이 있다. `src/pages/about.astro`.
- Contact: `contact@emfls.com` 이메일이 있다. 폼은 없다. `src/pages/contact.astro`.
- Privacy: 문의 데이터 설명은 있으나 “사이트는 GitHub Pages를 통해 제공”이라고 명시한다. 콘텐츠/보강 데이터는 Cloudflare Pages를 실제 운영으로 설명하므로 충돌 가능성이 있다. 또한 Analytics·AdSense를 “추가되는 경우”로 표현하지만 현재 AdSense 스크립트는 이미 존재한다. `src/pages/privacy.astro:27`.
- Terms: 이용약관과 면책을 하나의 페이지에서 제공한다. 시행일은 있으나 별도 마지막 수정일 표시는 없다. `src/pages/terms.astro`.
- Editorial Policy: 작성·검토·광고 투명성·정정 요청 기준이 있다. `src/pages/editorial-policy.astro`.
- Disclaimer: 일반 정보·외부 링크·문의 및 책임 제한을 설명한다. `src/pages/disclaimer.astro`.
- Content Methodology: 공식 문서 조사, 본문 구성, 경험 기반 보강, 한계를 설명한다. `src/pages/content-methodology.astro`.
- 정책 페이지 전반에 시행일/검토일 표기가 일관되지 않다.

## Automation Risks

- 저장소에 `.github/` 디렉터리와 `scripts/` 디렉터리가 없다. GitHub Actions, cron, Python/Node 자동 생성·발행·리라이트·링크 검사·콘텐츠 QA 자동화는 확인되지 않았다.
- Astro sitemap integration은 빌드 시 사이트맵을 생성한다. 이는 콘텐츠 자동 생성이 아니라 정적 route 산출이다.
- `getStaticPaths`는 18개 글, 7개 카테고리, 태그 route를 빌드 시 생성한다. 대량 생성 로직은 확인되지 않았다.
- 승인 전 저품질 페이지를 다시 생성하는 workflow는 현재 확인되지 않았지만, 데이터 파일에 글을 추가하면 자동으로 상세/카테고리/태그 페이지가 늘어나는 구조다.

## Build Verification

- 의존성 상태: `node_modules` 없음.
- 실행 명령: `npm run build`
- 결과: **FAIL** — `sh: astro: command not found`
- 패키지 설치: 하지 않음.
- lint: **없음** (`package.json`에 lint script 없음).
- test: **없음** (`package.json`에 test script 없음).
- 생성 페이지 수/빌드 경고: 빌드가 시작되지 않아 확인 불가.

## Top 10 Approval Risks

1. 모든 글 상세 페이지에 `스크린샷 추가 예정` 플레이스홀더가 노출됨.
2. `ads.txt`가 없음.
3. 현재 AdSense 스크립트는 있으나 개인정보처리방침은 광고를 미래형으로 설명함.
4. 개인정보처리방침이 실제 Cloudflare Pages 운영과 다르게 GitHub Pages라고 적음.
5. 글 전체가 매우 유사한 템플릿 구조로 구성되어 고유성 검증이 필요함.
6. 콘텐츠 이미지/실제 설정 화면 증거가 전혀 없음.
7. 빌드 검증이 의존성 부재로 완료되지 않음.
8. 정책 페이지의 시행일은 있으나 마지막 수정일 표기가 일관되지 않음.
9. 검색 기능이 별도 페이지가 아니라 클라이언트 UI에 의존하며 접근성/무JS 동작을 추가 검증해야 함.
10. GitHub Pages와 Cloudflare Pages 설명이 글·정책에서 혼재함.

## Recommended Next Phase

1. 실제 배포 환경 기준으로 Privacy 및 운영 호스팅 설명을 정합화한다.
2. 모든 글의 스크린샷 플레이스홀더를 실제 검증 가능한 자료 또는 제거로 결정한다.
3. Publisher ID에 맞는 `ads.txt` 필요성과 실제 광고 상태를 확인한다.
4. 글별 고유성·중복성·정보 깊이를 정적/수동으로 재검토한다.
5. 의존성을 기존 lockfile 기준으로 복원한 뒤 빌드와 출력 route를 검증한다.
6. 생성된 sitemap, canonical, 404, 내부 링크를 실제 배포 주소에서 점검한다.
7. 정책 페이지의 시행일·최종 검토일·Analytics/Cookie/AdSense 설명을 실제 사용 상태에 맞춘다.

