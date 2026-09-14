# emfls.com AdSense Content Plan

## Final Site Focus

emfls.com 실제 운영 경험을 바탕으로 개인 도메인·DNS, Cloudflare Pages 배포, HTTPS 운영, Search Console/SEO 인프라, AdSense 승인 준비를 설명하는 집중형 가이드 사이트로 운영한다.

## Final Article Set

| # | Cluster | Representative URL | Title | Source Articles | Phase 2C Action |
|---:|---|---|---|---|---|
| 1 | 도메인·DNS | `/articles/personal-domain-website-start-checklist/` | 개인 도메인으로 웹사이트를 시작하기 전에 정해야 할 것들 | personal-domain-website-start-checklist | 실제 emfls.com 시작 기준 보강 |
| 2 | 도메인·DNS | `/articles/gabia-domain-cloudflare-dns/` | 가비아 도메인을 Cloudflare DNS에 연결하는 흐름 | gabia-domain-dns-github-pages | 완료: registrar→nameserver→Cloudflare zone 흐름 |
| 3 | 도메인·DNS | `/articles/cloudflare-dns-setup-for-beginners/` | emfls.com Cloudflare DNS 설정 후 확인하는 순서 | cloudflare-dns-setup-for-beginners | 완료: 설정·검증 순서 재작성 |
| 4 | Cloudflare·배포 | `/articles/why-astro-for-static-content-site/` | Astro + Cloudflare Pages로 emfls.com을 운영하는 구조 | why-astro-for-static-content-site | 완료: 실제 운영 구조 재작성 |
| 5 | Cloudflare·배포 | `/articles/github-to-cloudflare-pages-deployment/` | GitHub 저장소에서 Cloudflare Pages로 emfls.com을 배포하는 방법 | connect-custom-domain-to-github-pages, github-pages-strengths-and-limits | 완료: source→build→production pipeline |
| 6 | HTTPS·사이트 운영 | `/articles/simple-contact-page-for-static-site/` | 정적 사이트에서 문의 기능을 단순하게 시작하는 방법 | simple-contact-page-for-static-site | 실제 문의 운영 기준 보강 |
| 7 | HTTPS·사이트 운영 | `/articles/after-first-deploy-checklist/` | 첫 배포 후 확인해야 할 체크리스트 | after-first-deploy-checklist, why-custom-404-page-matters | 운영 검증 허브로 재작성 |
| 8 | HTTPS·사이트 운영 | `/articles/how-to-check-https-on-custom-domain/` | Cloudflare Pages 개인 도메인의 HTTPS를 진단하는 순서 | how-to-check-https-on-custom-domain | 완료: DNS·인증서·redirect·canonical 진단 순서 |
| 9 | 검색·SEO | `/articles/google-search-console-domain-property-guide/` | emfls.com을 Google Search Console에 등록하는 절차 | google-search-console-domain-property-guide, seo-friendly-title-and-url | 완료: DNS 소유권·sitemap·URL Inspection 절차 |
| 10 | 검색·SEO | `/articles/robots-and-sitemap-basics/` | emfls.com의 robots.txt, sitemap.xml, noindex 역할 구분하기 | robots-and-sitemap-basics | 완료: 실제 파일·역할 분리·배포 후 확인 |
| 11 | AdSense | `/articles/adsense-review-essential-pages/` | 애드센스 심사 전 사이트에 필요한 기본 페이지 | adsense-review-essential-pages, privacy-policy-practical-checklist | 정책·신뢰 페이지 실제 상태 반영 |
| 12 | AdSense | `/articles/adsense-review-final-checklist/` | AdSense 심사 전 최종 체크리스트: emfls.com에서 확인한 항목 | adsense-review-final-checklist, unfinished-site-signals-before-adsense | 완료: 실제 프로젝트 상태형 체크리스트 재작성 |

## Merge Map

| Old URL | Destination URL | Reason | Redirect |
|---|---|---|---|
| `/articles/github-pages-strengths-and-limits/` | `/articles/connect-custom-domain-to-github-pages/` | GitHub Pages 운영·도메인 연결 의도 중복 | 301 in `public/_redirects` |
| `/articles/seo-friendly-title-and-url/` | `/articles/google-search-console-domain-property-guide/` | SEO·색인 인프라 맥락으로 통합 | 301 |
| `/articles/privacy-policy-practical-checklist/` | `/articles/adsense-review-essential-pages/` | 정책·AdSense 필수 페이지 의도 중복 | 301 |
| `/articles/why-custom-404-page-matters/` | `/articles/after-first-deploy-checklist/` | 배포 후 운영 점검 의도 중복 | 301 |
| `/articles/unfinished-site-signals-before-adsense/` | `/articles/adsense-review-final-checklist/` | AdSense 최종 점검 의도 중복 | 301 |
| `/articles/github-pages-vs-wordpress-for-beginners/` | `/articles/why-astro-for-static-content-site/` | 정적 사이트 선택 의도에 통합 | 301 |

기존 7개 카테고리 URL은 5개 새 클러스터 URL로 `public/_redirects`에서 연결한다.

## Cluster Structure

### 도메인·DNS

- personal-domain-website-start-checklist
- gabia-domain-dns-github-pages
- cloudflare-dns-setup-for-beginners

### Cloudflare·배포

- why-astro-for-static-content-site
- connect-custom-domain-to-github-pages

### HTTPS·사이트 운영

- simple-contact-page-for-static-site
- after-first-deploy-checklist
- how-to-check-https-on-custom-domain

### 검색·SEO

- google-search-console-domain-property-guide
- robots-and-sitemap-basics

### AdSense

- adsense-review-essential-pages
- adsense-review-final-checklist

## Index Policy

| Page Type | Index Policy |
|---|---|
| Home | index |
| Representative Article | index |
| Article Index | index |
| Valuable Category | index, 후속 품질 검토 |
| Tag | noindex,follow |
| Search | 별도 검색 URL 없음; 기능 유지 시 noindex,follow |
| HTML Sitemap | noindex,follow |
| 404 | noindex |
| Redirect URL | 301 redirect |
| Privacy/Terms/Disclaimer | 현재 index 유지; 정책 페이지로 접근 가능 |

## Phase 2C Rewrite Queue

| Priority | URL | Action | Main Problem | Required Unique Value |
|---:|---|---|---|---|
| 1 | `/articles/adsense-review-final-checklist/` | REWRITE | AdSense 점검 일반론·공통 템플릿 | emfls.com 공개 상태와 실제 QA 결과 |
| 2 | `/articles/why-astro-for-static-content-site/` | REWRITE | 도구 선택 일반론 | emfls.com의 source/build/deploy 구조 |
| 3 | `/articles/cloudflare-dns-setup-for-beginners/` | REWRITE | DNS 설명 중복 | 실제 Cloudflare 기준 화면·전환 순서 |
| 4 | `/articles/google-search-console-domain-property-guide/` | REWRITE | Search Console 일반론 | emfls.com 속성·sitemap 제출·색인 확인 |
| 5 | `/articles/robots-and-sitemap-basics/` | REWRITE | robots/sitemap 개념 중복 | 실제 생성 파일과 index 정책 |
| 6 | `/articles/how-to-check-https-on-custom-domain/` | REWRITE | HTTPS 점검 일반론 | 실제 canonical·redirect 검증 |
| 7 | `/articles/connect-custom-domain-to-github-pages/` | REWRITE | GitHub/Cloudflare 설명 분산 | 소스 관리와 실제 배포 역할 분리 |
| 8 | `/articles/gabia-domain-dns-github-pages/` | REWRITE | DNS 사례 증거 부족 | 실제 레코드 변경·오류·해결 과정 |
| 9 | `/articles/personal-domain-website-start-checklist/` | REWRITE | 시작 안내 일반론 | emfls.com 의사결정과 운영 범위 |
| 10 | `/articles/after-first-deploy-checklist/` | REWRITE | 체크리스트 템플릿성 | 배포 후 실제 확인 결과 |
| 11 | `/articles/adsense-review-essential-pages/` | REWRITE | 정책 페이지 일반론 | 현재 About/Contact/Privacy 상태 |
| 12 | `/articles/simple-contact-page-for-static-site/` | REWRITE | 정적 문의 일반론 | 실제 문의 수단과 개인정보 흐름 |

## Removed Duplicate Intent

- GitHub Pages 장단점과 개인 도메인 연결을 하나의 배포 대표 글로 통합한다.
- SEO 제목/URL, robots/sitemap, Search Console 글은 Search/SEO 클러스터로 정리한다.
- 404와 첫 배포 후 점검은 HTTPS·사이트 운영 점검 흐름에 통합한다.
- AdSense 필수 페이지, 개인정보 체크리스트, 미완성 신호, 최종 체크리스트는 두 개의 명확한 AdSense 글로 압축한다.

## Phase 2C Rewrite Status

| Article | Status | Quality Check |
|---|---|---|
| AdSense 심사 전 최종 체크리스트: emfls.com에서 확인한 항목 | rewritten | PASS |
| Astro + Cloudflare Pages로 emfls.com을 운영하는 구조 | rewritten | PASS |
| emfls.com Cloudflare DNS 설정 후 확인하는 순서 | rewritten | PASS |
| 나머지 대표 글 | pending | - |

## Phase 2C-2 Rewrite Status

| Article | Status | Quality Check |
|---|---|---|
| emfls.com을 Google Search Console에 등록하는 절차 | rewritten | PASS |
| emfls.com의 robots.txt, sitemap.xml, noindex 역할 구분하기 | rewritten | PASS |
| Cloudflare Pages 개인 도메인의 HTTPS를 진단하는 순서 | rewritten | PASS |
| 나머지 대표 글 | pending | - |

## Phase 2C-3 Rewrite Status

| Article | Status | Quality Check |
|---|---|---|
| GitHub 저장소에서 Cloudflare Pages로 emfls.com을 배포하는 방법 | rewritten | PASS |
| 가비아 도메인을 Cloudflare DNS에 연결하는 흐름 | rewritten | PASS |
| 첫 배포 후 확인해야 할 체크리스트 | rewritten | PASS |
| 남은 대표 글 3개 | pending | - |

## Approval Rationale

## Final Representative Articles — Phase 2C-4

| # | Cluster | Title | URL | Search intent | Status | Original value | Template risk |
|---:|---|---|---|---|---|---|---|
| 1 | 도메인·DNS | emfls.com 개인 도메인 사이트 구축 로드맵 | `/articles/personal-domain-website-start-checklist/` | 개인 도메인 사이트 전체 시작 순서 | rewritten | HIGH | LOW |
| 2 | 도메인·DNS | 가비아 도메인을 Cloudflare DNS에 연결하는 흐름 | `/articles/gabia-domain-cloudflare-dns/` | 등록기관에서 DNS 권한 연결 | rewritten | HIGH | LOW |
| 3 | 도메인·DNS | emfls.com Cloudflare DNS 설정 후 확인하는 순서 | `/articles/cloudflare-dns-setup-for-beginners/` | DNS 설정 후 검증 | rewritten | HIGH | LOW |
| 4 | Cloudflare·배포 | Astro + Cloudflare Pages로 emfls.com을 운영하는 구조 | `/articles/why-astro-for-static-content-site/` | 구성요소와 운영 구조 | rewritten | HIGH | LOW |
| 5 | Cloudflare·배포 | GitHub 저장소에서 Cloudflare Pages로 emfls.com을 배포하는 방법 | `/articles/github-to-cloudflare-pages-deployment/` | source→build→production 배포 | rewritten | HIGH | LOW |
| 6 | HTTPS·사이트 운영 | 첫 배포 후 확인해야 할 체크리스트 | `/articles/after-first-deploy-checklist/` | production QA | rewritten | HIGH | LOW |
| 7 | HTTPS·사이트 운영 | Cloudflare Pages 개인 도메인의 HTTPS를 진단하는 순서 | `/articles/how-to-check-https-on-custom-domain/` | HTTPS·redirect·canonical 진단 | rewritten | HIGH | LOW |
| 8 | 검색·SEO | emfls.com을 Google Search Console에 등록하는 절차 | `/articles/google-search-console-domain-property-guide/` | Search Console 등록·확인 | rewritten | HIGH | LOW |
| 9 | 검색·SEO | emfls.com의 robots.txt, sitemap.xml, noindex 역할 구분하기 | `/articles/robots-and-sitemap-basics/` | 검색 크롤링·색인·발견 구분 | rewritten | HIGH | LOW |
| 10 | AdSense | emfls.com 신뢰 페이지를 구성하는 방법 | `/articles/adsense-review-essential-pages/` | About·Contact·정책 페이지 역할 | rewritten | HIGH | LOW |
| 11 | AdSense | AdSense 심사 전 최종 체크리스트: emfls.com에서 확인한 항목 | `/articles/adsense-review-final-checklist/` | 심사 제출 전 전체 QA | rewritten | HIGH | LOW |

Merged: `simple-contact-page-for-static-site` → `adsense-review-essential-pages` (301)

- 기존 18개 글을 검색 의도가 겹치는 12개 대표 글로 정리한다.
- 기존 34개 태그 아카이브는 탐색용으로 남기되 검색 색인에서는 제외한다.
- 대표 글은 도메인부터 배포·검증·검색·AdSense까지 하나의 운영 흐름을 이룬다.
- 병합 URL은 301 redirect로 기존 유입과 내부 링크 손상을 줄인다.
- XML sitemap에는 대표 canonical 페이지를 중심으로 남긴다.
- 실제 경험과 검증 결과를 Phase 2C에서 대표 글에 집중한다.
- 숫자는 AdSense의 공식 승인 요건이 아니라 사이트 구조 설계 권고다.
