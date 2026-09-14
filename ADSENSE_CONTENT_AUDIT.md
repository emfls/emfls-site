# emfls.com AdSense Content Audit

## Executive Summary

- Phase 2A의 production build는 70페이지를 생성했다.
- 구성은 ARTICLE 18, CATEGORY 7, TAG 34, 홈/글목록/신뢰·정책 9, 404 1이다.
- 34개 태그 페이지는 대부분 200~500자 수준의 목록형 페이지이며 독립 검색 가치는 낮다.
- 18개 글은 본문 추출 기준 약 1,229~2,237자 범위이며 모두 공식 출처 링크와 관련 글 링크를 가진다.
- DNS·Cloudflare·GitHub Pages·배포 점검 글 사이에 검색 의도 중복이 확인됐다.
- 원문 기반의 실제 운영 사례는 일부 글에만 있고, 대부분은 공개 지식 정리 수준이다.
- 글 템플릿은 공통 섹션(예시, 체크리스트, 실수, FAQ, 관련 글, 출처)을 반복한다.
- 이번 단계에서는 분류와 권고만 했으며 본문, URL, 색인 설정은 변경하지 않았다.

## Generated Page Inventory

| Type | Count | Index Recommendation |
|---|---:|---|
| HOME | 1 | KEEP_INDEX |
| ARTICLE | 18 | KEEP_INDEX 후보; 개별 품질 보강 필요 |
| ARTICLE_INDEX | 1 | KEEP_INDEX |
| CATEGORY | 7 | KEEP_INDEX 후보; 얇은 카테고리는 REVIEW |
| TAG | 34 | NOINDEX_KEEP |
| SEARCH | 0 | 별도 URL 없음; 목록 내 클라이언트 검색 |
| TRUST/POLICY | 8 | KEEP_INDEX 또는 REVIEW |
| SITEMAP_HTML | 1 | NOINDEX_KEEP 또는 REVIEW |
| 404 | 1 | NOINDEX_KEEP |
| **TOTAL** | **70** | |

실제 build 출력 기준 파일은 `dist/`에 존재한다. 각 페이지는 공통 layout에서 title, description, canonical, `robots=index, follow`를 생성한다. ARTICLE은 H1 1개, 카테고리 페이지와 태그 페이지도 H1 1개를 가진다.

## Indexability Decisions

| URL/Pattern | Type | Current Indexable | Recommendation | Reason |
|---|---|---|---|---|
| `/` | HOME | yes | KEEP_INDEX | 사이트 주제와 주요 카테고리·글로 연결되는 허브 |
| `/articles/` | ARTICLE_INDEX | yes | KEEP_INDEX | 18개 글 탐색 기능과 설명 제공 |
| `/articles/*/` | ARTICLE | yes | KEEP_INDEX 후보 | 독립 본문, FAQ, 출처, 관련 글 존재; 품질 차이는 후속 판단 |
| `/categories/*/` | CATEGORY | yes | REVIEW | 2~4개 글과 설명이 있으나 목록형 비중이 큼 |
| `/tags/*/` | TAG | yes | NOINDEX_KEEP | 34개 중 다수가 1개 글 연결과 200자대 본문인 얇은 분류 페이지 |
| `/about/`, `/contact/` | TRUST | yes | KEEP_INDEX | 운영 목적·작성자·문의 수단 제공 |
| `/privacy/`, `/terms/`, `/editorial-policy/`, `/disclaimer/`, `/content-methodology/` | POLICY | yes | KEEP_INDEX 후보 | 신뢰·운영 기준 페이지; 심사 접근성 측면에서 유용 |
| `/site-map/` | SITEMAP_HTML | yes | NOINDEX_KEEP | 사용자 탐색용 링크 목록이며 검색 독립 콘텐츠는 아님 |
| `/404.html` | 404 | yes in static output | NOINDEX_KEEP | 오류 안내·복귀용 기능 페이지 |

`robots` 메타는 모든 페이지에서 `index, follow`로 생성된다. 위 권고는 현재 설정을 바꾸라는 실행 지시가 아니라 후속 Phase의 색인 정책 후보이다.

## Article Audit

본문 크기는 생성 HTML에서 태그를 제거하고 paragraph/list 텍스트를 합산한 값이다. 내부 링크는 글 상세에서 공통적으로 글 목록 breadcrumb 1개와 관련 글 3개가 확인되어 4개로 기록했다. 외부 출처는 각 글의 공식 문서 링크 2개 기준이다.

| Slug | Title | Text Size | Sources | Internal Links | Original Value | Template Risk | Verdict |
|---|---|---:|---:|---:|---|---|---|
| `personal-domain-website-start-checklist` | 개인 도메인으로 웹사이트를 시작하기 전에 정해야 할 것들 | 1,891 | 2 | 4 | MEDIUM | HIGH | KEEP |
| `github-pages-strengths-and-limits` | GitHub Pages가 개인 사이트에 적합한 이유와 한계 | 1,856 | 2 | 4 | MEDIUM | HIGH | MERGE |
| `gabia-domain-dns-github-pages` | 가비아 도메인을 GitHub Pages에 연결할 때 확인할 DNS 기록 | 1,792 | 2 | 4 | HIGH | HIGH | KEEP |
| `why-astro-for-static-content-site` | 정적 사이트 생성기 Astro를 선택할 때의 기준 | 1,520 | 2 | 4 | LOW | HIGH | REWRITE |
| `adsense-review-essential-pages` | 애드센스 심사 전 사이트에 필요한 기본 페이지 | 1,482 | 2 | 4 | MEDIUM | HIGH | KEEP |
| `seo-friendly-title-and-url` | 검색 엔진이 읽기 쉬운 글 URL과 제목 만드는 법 | 1,530 | 2 | 4 | LOW | HIGH | REWRITE |
| `robots-and-sitemap-basics` | robots.txt와 sitemap.xml의 역할 이해하기 | 1,740 | 2 | 4 | LOW | HIGH | MERGE |
| `privacy-policy-practical-checklist` | 개인정보처리방침을 작성할 때 실제로 확인할 항목 | 1,521 | 2 | 4 | MEDIUM | HIGH | KEEP |
| `why-custom-404-page-matters` | 404 페이지가 필요한 이유와 좋은 구성 | 1,229 | 2 | 4 | LOW | HIGH | REWRITE |
| `simple-contact-page-for-static-site` | 정적 사이트에서 문의 기능을 단순하게 시작하는 방법 | 1,260 | 2 | 4 | MEDIUM | HIGH | KEEP |
| `after-first-deploy-checklist` | 첫 배포 후 확인해야 할 체크리스트 | 1,538 | 2 | 4 | MEDIUM | HIGH | KEEP |
| `unfinished-site-signals-before-adsense` | 애드센스 심사 전에 피해야 할 미완성 신호 | 1,498 | 2 | 4 | MEDIUM | HIGH | MERGE |
| `cloudflare-dns-setup-for-beginners` | Cloudflare DNS 설정을 처음 할 때 확인할 순서 | 2,237 | 2 | 4 | HIGH | HIGH | KEEP |
| `google-search-console-domain-property-guide` | Google Search Console에 새 도메인을 등록하는 방법 | 2,039 | 2 | 4 | MEDIUM | HIGH | KEEP |
| `adsense-review-final-checklist` | AdSense 심사 전 최종 체크리스트 | 1,870 | 2 | 4 | MEDIUM | HIGH | MERGE |
| `connect-custom-domain-to-github-pages` | GitHub Pages에 개인 도메인을 연결하는 기본 흐름 | 2,215 | 2 | 4 | HIGH | HIGH | MERGE |
| `how-to-check-https-on-custom-domain` | HTTPS 적용이 제대로 되었는지 확인하는 방법 | 1,928 | 2 | 4 | MEDIUM | HIGH | KEEP |
| `github-pages-vs-wordpress-for-beginners` | GitHub Pages와 워드프레스 중 무엇을 선택할까 | 1,940 | 2 | 4 | LOW | HIGH | REWRITE |

정량 수치는 콘텐츠 품질의 공식 기준이 아니라 저장소 비교용 지표다. 모든 글에 FAQ, 체크리스트, 관련 글, 출처 블록이 공통으로 출력된다.

## Similarity Findings

표준 라이브러리 기반 token-set Jaccard 유사도(공통 layout 제외, 생성된 article 본문 기준) 상위 10쌍:

| Similarity | Article A | Article B | 판단 |
|---:|---|---|---|
| 0.288 | `robots-and-sitemap-basics` | `google-search-console-domain-property-guide` | SEO 색인·사이트맵 의도 중복 |
| 0.285 | `cloudflare-dns-setup-for-beginners` | `gabia-domain-dns-github-pages` | DNS 전환·레코드 설정 중복 |
| 0.257 | `connect-custom-domain-to-github-pages` | `gabia-domain-dns-github-pages` | 도메인 연결 절차 중복 |
| 0.247 | `connect-custom-domain-to-github-pages` | `cloudflare-dns-setup-for-beginners` | 배포/도메인 연결 중복 |
| 0.241 | `how-to-check-https-on-custom-domain` | `after-first-deploy-checklist` | 배포 후 점검 중복 |
| 0.233 | `how-to-check-https-on-custom-domain` | `connect-custom-domain-to-github-pages` | 커스텀 도메인·HTTPS 중복 |
| 0.221 | `unfinished-site-signals-before-adsense` | `adsense-review-final-checklist` | 심사 전 점검 중복 |
| 0.220 | `adsense-review-final-checklist` | `adsense-review-essential-pages` | AdSense 준비·신뢰 페이지 중복 |
| 0.219 | `privacy-policy-practical-checklist` | `adsense-review-essential-pages` | 정책 페이지·심사 준비 중복 |
| 0.216 | `connect-custom-domain-to-github-pages` | `github-pages-strengths-and-limits` | GitHub Pages 운영 중복 |

이 점수는 의미 판단을 위한 보조 지표이며, 제목·공통 서술·고유 사례 유무를 함께 확인해야 한다.

반복 문구/구조: 모든 글에서 `실전 점검표`, `흔한 실수`, `자주 묻는 질문`, `관련 글`, `참고한 공식 문서`가 같은 순서로 나온다. 이는 사용자에게 유용할 수 있지만 현재 상태에서는 고유한 본문보다 템플릿이 먼저 보일 위험이 있다.

## Search Intent Clusters

| Cluster | 포함 글 | 대표 글 후보 |
|---|---|---|
| 도메인·DNS·커스텀 도메인 | `personal-domain-website-start-checklist`, `gabia-domain-dns-github-pages`, `cloudflare-dns-setup-for-beginners`, `connect-custom-domain-to-github-pages` | `cloudflare-dns-setup-for-beginners` |
| GitHub Pages·호스팅 선택 | `github-pages-strengths-and-limits`, `connect-custom-domain-to-github-pages`, `github-pages-vs-wordpress-for-beginners` | `github-pages-strengths-and-limits` |
| Astro·정적 사이트 제작 | `why-astro-for-static-content-site`, `simple-contact-page-for-static-site`, `why-custom-404-page-matters` | `why-astro-for-static-content-site` |
| SEO·색인·사이트맵 | `seo-friendly-title-and-url`, `robots-and-sitemap-basics`, `google-search-console-domain-property-guide` | `google-search-console-domain-property-guide` |
| 배포·HTTPS 점검 | `after-first-deploy-checklist`, `how-to-check-https-on-custom-domain` | `how-to-check-https-on-custom-domain` |
| AdSense·정책·신뢰 | `adsense-review-essential-pages`, `privacy-policy-practical-checklist`, `unfinished-site-signals-before-adsense`, `adsense-review-final-checklist` | `adsense-review-final-checklist` |
| 사이트 운영 시작 | `personal-domain-website-start-checklist` | `personal-domain-website-start-checklist` |
| 정보 구조·운영 문서 | `privacy-policy-practical-checklist`, `simple-contact-page-for-static-site`, `why-custom-404-page-matters` | 개별 목적 유지 검토 |

## Original Value Findings

- **HIGH:** `gabia-domain-dns-github-pages`, `cloudflare-dns-setup-for-beginners`, `connect-custom-domain-to-github-pages`는 가비아·Cloudflare·GitHub Pages 역할과 `emfls.com` 흐름을 언급한다. 다만 실제 로그·전후 설정값·검증 결과가 충분한지는 후속 보강이 필요하다.
- **MEDIUM:** 시작 체크리스트, 필수 페이지, Privacy, Contact, 배포 점검, Search Console, AdSense 최종 점검은 사이트 운영 맥락을 일부 포함하지만 일반적인 안내 비중이 높다.
- **LOW:** Astro 선택, SEO 제목/URL, robots/sitemap 기초, 404, WordPress 비교는 공개 문서로 대체 가능한 일반 지식 비중이 높다.
- 저장소에서 직접 확인 가능한 실제 운영 사례는 일부 enhancement 문단에 집중되어 있으며, 18개 글 전체에 균등하게 분포하지 않는다.

## Internal Linking Findings

- 18개 글 모두 article index에서 접근 가능하고, 사이트맵·홈의 카테고리 경로를 통해 간접 접근 가능하다.
- 각 글 상세에는 breadcrumb의 `/articles/` 링크와 관련 글 최대 3개가 있어 고립(orphan) 글은 확인되지 않았다.
- 관련 글은 주로 같은 카테고리 우선이며, 검색 의도가 겹치는 글이 서로 연결되어 중복을 완화하기보다 확장할 수 있다.
- 글 본문 자체의 문맥형 내부 링크는 제한적이다. 대부분의 연결이 하단 related 영역과 태그/공통 내비게이션에 의존한다.

## Site Focus

전체 18개 글은 개인 도메인, DNS, 정적 사이트, GitHub/Cloudflare Pages, Search Console, AdSense 준비라는 중심 주제 안에 있다. WordPress 비교와 Astro 선택은 주변 주제지만 사이트 운영 선택이라는 범위에서 크게 벗어나지는 않는다. 문제는 주제 이탈보다 같은 운영 단계를 여러 글이 나눠 설명하는 중복이다.

## Article Decisions

### KEEP

- `personal-domain-website-start-checklist`
- `gabia-domain-dns-github-pages`
- `adsense-review-essential-pages`
- `privacy-policy-practical-checklist`
- `simple-contact-page-for-static-site`
- `after-first-deploy-checklist`
- `cloudflare-dns-setup-for-beginners`
- `google-search-console-domain-property-guide`
- `how-to-check-https-on-custom-domain`

### REWRITE

- `why-astro-for-static-content-site`
- `seo-friendly-title-and-url`
- `why-custom-404-page-matters`
- `github-pages-vs-wordpress-for-beginners`

### MERGE

- `github-pages-strengths-and-limits`
- `robots-and-sitemap-basics`
- `unfinished-site-signals-before-adsense`
- `adsense-review-final-checklist`
- `connect-custom-domain-to-github-pages`

### DELETE

- 현재 정량 분석만으로 즉시 DELETE 판정을 내린 글은 없음. 위 REWRITE/MERGE 후보를 실제 개정안과 비교한 뒤 판단한다.

## Page Index Decisions

### KEEP_INDEX

- `/`, `/articles/`
- 18개 `/articles/*/` 글: 후속 품질 보강을 전제로 한 후보
- `/about/`, `/contact/`
- `/privacy/`, `/terms/`, `/editorial-policy/`, `/disclaimer/`, `/content-methodology/`: 신뢰 페이지 후보

### NOINDEX_KEEP

- 34개 `/tags/*/`
- `/site-map/`
- `/404.html`

### REMOVE

- 현재 REMOVE 확정 페이지 없음.

### REVIEW

- 7개 `/categories/*/`: 카테고리별 글 수와 독립 설명을 보강할지 후속 결정

## Recommended Approval Site

이는 AdSense 공식 요구 숫자가 아니라 현재 구조를 바탕으로 한 운영 권고다.

- article 수: 우선 18개를 전부 유지하되, 병합·재작성 후 독립 검색 의도가 남는 글만 공개 유지한다.
- indexable page 종류: 홈, 글 목록, 품질이 확인된 독립 글, 실질 설명이 있는 카테고리, About/Contact 및 실제 운영 정책 페이지.
- noindex page 종류: 얇은 태그 목록, 기능성 사이트맵, 오류 안내 페이지.
- 핵심 topic cluster: 도메인/DNS/Cloudflare, 정적 사이트/호스팅, 배포/HTTPS, SEO/Search Console, 운영 정책/AdSense.

## npm production audit

- 명령: `npm audit --omit=dev`
- 결과: registry 보안 advisory endpoint 접속 실패(`getaddrinfo ENOTFOUND registry.npmjs.org`).
- critical/high/moderate/low: **확인 불가(UNKNOWN)**. Phase 1의 이전 `npm audit` 결과 8건(critical 1, high 6, low 1)은 참고 기록으로 남아 있으나, 이번 명령의 production-only 결과로 재확정하지 않았다.
- `npm audit fix`는 실행하지 않았다.

## Phase 2B Priority

1. DNS·Cloudflare·GitHub Pages 글의 실제 검색 의도를 하나의 대표 구조로 설계한다.
2. SEO/Search Console/robots/sitemap 글의 중복 범위를 정한다.
3. AdSense 정책·필수 페이지·최종 체크리스트의 역할을 분리한다.
4. 각 대표 글에 실제 설정값, 전후 상태, 오류·해결 과정을 추가할 수 있는지 원자료를 확인한다.
5. LOW original value 글은 직접 경험 중심으로 재작성할지 판단한다.
6. 공통 FAQ/체크리스트 템플릿을 글 목적에 맞게 차등화한다.
7. 카테고리별 독립 설명과 글 수를 검토한다.
8. 태그 페이지를 색인 대상에서 제외할지 실제 검색 가치와 함께 결정한다.
9. 글 본문 안의 문맥형 내부 링크 설계를 만든다.
10. 개정 후 build, sitemap, canonical 및 전체 페이지 재감사를 수행한다.
