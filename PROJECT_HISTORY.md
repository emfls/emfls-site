## 2026-09-14 — AdSense Approval Phase 0

- 목적: `emfls.com` AdSense 승인 가능성 평가를 위한 현재 저장소 상태 감사.
- 수행한 조사: Astro/package 설정, 페이지·콘텐츠 데이터, SEO 메타/구조화 데이터, robots/sitemap/ads.txt, 정책 페이지, AdSense 문자열, 자동화 디렉터리와 빌드 상태를 확인했다.
- 생성/수정 파일: `ADSENSE_AUDIT.md`, `PROJECT_HISTORY.md` 생성. 코드와 기존 콘텐츠는 수정하지 않았다.
- 빌드 결과: `npm run build` 실행; `node_modules`가 없어 `astro: command not found`로 실패. 패키지 설치는 하지 않았다.
- 발견한 핵심 위험: 글 전체의 스크린샷 플레이스홀더, ads.txt 부재, 개인정보처리방침의 GitHub Pages/AdSense 미래형 표현, 템플릿 반복, 빌드 미검증.
- 다음 단계: 감사 보고서의 Recommended Next Phase 순서대로 운영 환경·정책 정합성, 플레이스홀더, ads.txt, 콘텐츠 고유성, 빌드를 검증한다.

## 2026-09-14 — AdSense Approval Phase 1

- 목적: 빌드 환경 정상화, 명백한 미완성 요소 제거, 정책 정합성 수정, ads.txt 추가 및 최종 빌드 검증.
- 의존성 복원: `npm ci` 성공. `package-lock.json`을 사용했으며 버전 갱신은 하지 않았다. npm audit에서 취약점 8건이 보고되었다.
- 수정한 정책: `src/pages/privacy.astro`를 Cloudflare Pages/GitHub 역할과 실제 AdSense·Analytics 사용 여부에 맞게 수정하고 최종 검토일을 추가했다.
- 플레이스홀더 처리: `src/pages/articles/[slug].astro`의 전체 글 공통 스크린샷 플레이스홀더 섹션을 제거했다. 가짜 이미지는 만들지 않았다.
- ads.txt: `public/ads.txt` 생성; 기존 코드의 Publisher ID `pub-8830524482034754`를 사용했다.
- AdSense 코드 상태: 공통 layout head에 단일 script로 존재하며 Publisher ID는 일치한다.
- build 결과: `npm run build` 성공; 70개 페이지 생성. `dist/index.html`, `robots.txt`, `ads.txt`, `sitemap-index.xml` 모두 생성되었고 생성 HTML에서 금지 문자열 검색 결과는 없었다.
- lint/test 결과: `package.json`에 lint/test script가 없어 실행하지 않았다.
- 변경 파일: `src/pages/articles/[slug].astro`, `src/layouts/BaseLayout.astro`, `src/pages/articles/index.astro`, `src/pages/privacy.astro`, `src/data/articles.ts`, `src/data/articleEnhancements.ts`, `public/ads.txt`, `ADSENSE_APPROVAL.md`, `PROJECT_HISTORY.md`.
- 남은 문제: npm audit 취약점, 글 콘텐츠의 고유성·깊이, 실제 배포 후 도메인/사이트맵/ads.txt 접근성은 후속 검증이 필요하다.
- 다음 단계: Phase 2에서 콘텐츠 품질과 정보 구조를 재설계하고, 이후 실제 공개 환경에서 최종 QA를 수행한다.

## 2026-09-14 — AdSense Approval Phase 2A

- 목적: 전체 생성 페이지와 기존 18개 콘텐츠의 AdSense 심사 관점 감사.
- production build: 성공.
- 총 생성 페이지: 70.
- article: 18.
- KEEP: 9, REWRITE: 4, MERGE: 5, DELETE: 0.
- KEEP_INDEX: 홈, 글 목록, 18개 글 후보, 신뢰·정책 페이지 후보.
- NOINDEX_KEEP: 34개 태그, HTML 사이트맵, 404 후보.
- REMOVE: 0.
- 주요 중복 문제: DNS/Cloudflare/GitHub Pages, SEO/사이트맵, AdSense 점검 글의 검색 의도와 템플릿 구조 중복.
- 주요 독창성 문제: 실제 운영 사례가 일부 글에 집중되고 다수 글은 공개 일반론 중심.
- npm production audit: registry advisory endpoint 접속 실패로 이번 실행 결과는 UNKNOWN.
- 생성 파일: `ADSENSE_CONTENT_AUDIT.md`.
- 코드/콘텐츠 변경 여부: 없음.
- 다음 단계: Phase 2B에서 대표 글·클러스터·내부 링크와 실제 사례 보강 우선순위를 설계한다.

## 2026-09-14 — AdSense Approval Phase 2B

- 목적: 18개 글을 검색 의도 중심의 대표 콘텐츠 구조로 통합하고 얇은 아카이브의 색인 정책을 정리.
- 기존 article 수: 18.
- 최종 대표 article 수: 12.
- 병합/제거 수: 6개 병합 redirect 대상.
- redirect 수: 12개(기사 6, 기존 카테고리 6).
- 기존 category 수: 7.
- 최종 category 수: 5.
- tag noindex: 23개 실제 생성 tag archive에 적용.
- search noindex: 별도 검색 URL 없음; `/articles/` 내 기능 유지.
- HTML sitemap noindex: 적용.
- 404 noindex: 적용.
- 정책 page index 처리: About/Contact/정책 페이지는 현재 index 유지.
- build: 성공.
- build page count: 51.
- sitemap 상태: XML sitemap 27개 URL 생성; tag·HTML sitemap·redirect 대상 기사는 포함되지 않음.
- broken internal link 상태: 생성 HTML의 정적 article/category/tag 링크는 누락 없음; 목록 JavaScript의 template literal(`/articles/${article.slug}/`)은 정적 경로 검사에서만 false positive로 확인됨. redirect 대상 URL은 `public/_redirects`에 보존.
- 생성 파일: `ADSENSE_CONTENT_PLAN.md`, `public/_redirects`.
- 주요 변경 파일: `src/data/articles.ts`, `src/pages/categories/[slug].astro`, `src/pages/tags/[slug].astro`, `src/pages/site-map.astro`, `src/pages/404.astro`, `src/layouts/BaseLayout.astro`, `astro.config.mjs`, `src/pages/articles/[slug].astro`, `ADSENSE_APPROVAL.md`.
- 다음 단계: Phase 2C 대표 콘텐츠 재작성.

## 2026-09-14 — AdSense Approval Phase 2C-1

- 목적: 대표 콘텐츠 중 AdSense 최종 체크리스트, Astro + Cloudflare 운영 구조, Cloudflare DNS 검증 글 3개를 실제 저장소 사실 중심으로 재작성.
- 사용한 실제 프로젝트 사실: Astro 6 package/build, `astro.config.mjs`의 `https://emfls.com`, GitHub 소스 관리, Cloudflare Pages 운영 설명, `src/pages/`, `src/data/`, `src/layouts/BaseLayout.astro`, `public/robots.txt`, `public/ads.txt`, `public/_redirects`, Phase 1/2 build 결과.
- 확인한 공식 출처: Google AdSense site readiness/program policies, Astro 공식 문서, Cloudflare Pages/DNS 공식 문서, GitHub 공식 문서.
- 재작성 글:
  1. `adsense-review-final-checklist` — AdSense 심사 전 최종 체크리스트: emfls.com에서 확인한 항목
  2. `why-astro-for-static-content-site` — Astro + Cloudflare Pages로 emfls.com을 운영하는 구조
  3. `cloudflare-dns-setup-for-beginners` — emfls.com Cloudflare DNS 설정 후 확인하는 순서
- URL 변경: 없음.
- redirect 추가: 없음.
- 템플릿 반복 검사: 세 글의 본문 구조와 heading sequence를 서로 다르게 구성했으며, 공통 렌더링 섹션은 기존 사이트 구조를 유지했다.
- 사실성 검사: 저장소에서 확인되지 않은 DNS record, Search Console 결과, 수익·승인 결과·장애 경험은 주장하지 않았다.
- build: 성공.
- 생성 페이지: 51.
- 수정 파일: `src/data/articles.ts`, `src/data/articleEnhancements.ts`, `ADSENSE_CONTENT_PLAN.md`, `ADSENSE_APPROVAL.md`, `PROJECT_HISTORY.md`.
- 다음 작업: Phase 2C-2에서 다음 우선순위 대표 글 3개를 재작성한다.

## 2026-09-14 — AdSense Approval Phase 2C-2

- 목적: Search Console / robots·sitemap / HTTPS 대표 콘텐츠 재작성.
- 재작성 글: `google-search-console-domain-property-guide`, `robots-and-sitemap-basics`, `how-to-check-https-on-custom-domain`.
- 사용한 실제 프로젝트 정보: `https://emfls.com` canonical, Cloudflare Pages 운영 설명, `public/robots.txt`, Astro sitemap filter, BaseLayout robots meta, 12개 대표 article과 5개 category build 결과.
- 공식 출처: Google Search Console Help, Google Search Central robots/noindex 문서, Cloudflare Pages custom domains 문서.
- 라이브 emfls.com 검증: `curl -I`와 DNS 조회를 시도했으나 현재 실행 환경에서 `emfls.com` 호스트 확인이 실패했고 DNS 조회도 권한 오류로 완료되지 않았다. 실제 DNS·인증서·HTTP redirect·Search Console 상태는 주장하지 않았다.
- Search Console 사실성 검사: Domain property/URL-prefix, DNS verification, sitemap과 색인 상태를 구분했고 실제 token·색인 결과는 사용하지 않았다.
- robots/noindex 구분 검사: robots.txt는 crawl 안내, noindex는 색인 제외, sitemap은 URL 발견으로 분리했다.
- HTTPS 사실성 검사: 저장소 canonical과 Cloudflare Pages 설명만 사용했으며 실제 DNS record·인증서·redirect 결과는 주장하지 않았다.
- 내부링크: Search Console→robots/sitemap, DNS→HTTPS, Astro/Cloudflare 구조→HTTPS 연결을 확인했다.
- 템플릿 반복 검사: 6개 대표 글의 도입·heading sequence를 비교했고 이번 3개는 절차형·개념 해설형·진단형으로 분리했다.
- build: 성공.
- 생성 페이지: 51.
- sitemap URL 수: 27.
- 수정 파일: `src/data/articles.ts`, `src/data/articleEnhancements.ts`, `ADSENSE_CONTENT_PLAN.md`, `ADSENSE_APPROVAL.md`, `PROJECT_HISTORY.md`.
- 남은 대표 글: 6.
- 다음 작업: Phase 2C-3.

## 2026-09-14 — AdSense Approval Phase 2C-3

- 목적: GitHub Pages 레거시 콘텐츠를 현재 Cloudflare Pages 운영 구조로 전환.
- 재작성 글: `github-to-cloudflare-pages-deployment`, `gabia-domain-cloudflare-dns`, `after-first-deploy-checklist`.
- 기존 URL: `/articles/connect-custom-domain-to-github-pages/`, `/articles/gabia-domain-dns-github-pages/`.
- 신규 URL: `/articles/github-to-cloudflare-pages-deployment/`, `/articles/gabia-domain-cloudflare-dns/`.
- 301 redirect: 두 기존 URL을 신규 대표 URL로 직접 연결.
- redirect chain 검사: 신규 대표 URL로 한 단계 직접 연결.
- 실제 프로젝트 사실: `npm run build`, `dist/`, Astro static output, `https://emfls.com`, `public/robots.txt`, `public/ads.txt`.
- 템플릿 반복 검사: 배포 pipeline형, nameserver 연결형, production QA형으로 분리.
- build: 성공. generated pages: 51. sitemap URLs: 26.
- broken link 검사: 신규 HTML 생성과 old URL 내부 링크 검사 완료; `_redirects` source는 예외.
- 남은 대표 글: 3. 다음 작업: Phase 2C-4.

## 2026-09-14 — AdSense Approval Phase 2C-4

- 목적: 마지막 콘텐츠 재작성 및 Contact 글 병합.
- 기존 대표 article: 12개.
- 최종 대표 article: 11개.
- 재작성: `adsense-review-essential-pages`, `personal-domain-website-start-checklist`.
- 병합: `simple-contact-page-for-static-site`의 문의 내용을 신뢰 페이지 글에 반영.
- 301 redirect: `/articles/simple-contact-page-for-static-site/` → `/articles/adsense-review-essential-pages/`.
- 대표 글 template risk: HIGH 0; 이번 3개는 LOW로 판정.
- 대표 글 original value: LOW/NONE 0으로 판정.
- 검색 의도 중복: 0; 신뢰 페이지와 최종 심사 체크리스트를 분리.
- placeholder: 0.
- broken links: 0.
- categories: 기존 5개 유지.
- tags: noindex 정책 유지.
- build: 성공.
- generated pages: 48.
- sitemap URLs: 25.
- Phase 2C 완료 여부: COMPLETE.
- 다음 단계: Phase 3 Final Site QA.

## 2026-09-14 — AdSense Approval Phase 3A

- 목적: Cloudflare production 배포 전 최종 저장소 QA.
- representative articles: 11; indexable pages: 25.
- build: `npm ci` PASS, `npm run build` PASS; generated pages 48.
- placeholders: 0; broken links: 0; duplicate intent: 명백한 중복 0.
- unsupported claims: 공개 주장 0.
- canonical: indexable 25/25가 `https://emfls.com` 기준이며 sitemap과 불일치 0.
- robots: crawler 허용, Googlebot/Mediapartners-Google 차단 없음.
- sitemap: 25 URLs; tags, HTML sitemap, 404, redirect source 제외.
- ads.txt: 존재; publisher ID는 AdSense code와 일치.
- AdSense code: 공통 layout head에 존재; 페이지당 중복 없음.
- trust pages: About, Contact, Privacy, Terms, Editorial Policy, Disclaimer 확인.
- redirects: 중복·cycle·chain·self redirect 없음.
- automation risk: 대량 자동 생성·AI 자동 발행 workflow 없음.
- production dependency audit: `npm audit --omit=dev`는 registry DNS 실패로 UNKNOWN.
- blocking issues: 없음.
- non-blocking issues: category 본문 길이, npm audit registry 미확인.
- LIVE_QA_REQUIRED: HTTPS/redirect/certificate, pages.dev, live status, live static files, 404 status, mobile rendering, AdSense crawler access.
- Phase 3A verdict: READY_TO_DEPLOY.
- 다음 단계: Phase 3B Cloudflare production 배포 후 live emfls.com QA.

## 2026-09-14 — AdSense Approval Phase 3B

- 목적: Production 배포 및 live AdSense QA.
- Git commit: `4abad48`.
- production branch: `main`.
- push: 성공.
- Cloudflare deployment: live homepage와 대표 글에서 새 콘텐츠 확인; dashboard 배포 기록은 확인하지 않음.
- production version verified: homepage와 대표 article 11개에 Phase 2C 변경 반영.
- HTTPS: apex 200, 유효한 HTTPS 연결 확인.
- HTTP → HTTPS: 301 확인.
- www: HTTP/HTTPS 모두 404; 독립 200 duplicate는 확인되지 않음.
- TLS: tested HTTPS connection valid; 만료일 별도 확인은 하지 않음.
- pages.dev: 실제 hostname 확인 불가, `PAGES_DEV_REVIEW_REQUIRED`.
- representative articles: 11/11 live 200, self canonical, indexable.
- robots.txt: 200, crawler 허용, sitemap 선언.
- sitemap: 200, sitemap-0.xml 25 URLs, tags·HTML sitemap·404·redirect source 제외.
- ads.txt: 저장소와 build output에는 존재하지만 live `/ads.txt`는 404, blocker.
- AdSense code: homepage와 대표 글에서 확인, publisher ID 정합.
- crawler proxy checks: Googlebot·Mediapartners-Google·Google-Display-Ads-Bot 모두 200; `NO_OBVIOUS_UA_BLOCK`.
- redirects: 주요 3개 old URL 직접 301, chain 없음.
- 404: 고유 누락 경로 실제 404.
- tag noindex: sample 확인, noindex 유지.
- HTML sitemap: 200, noindex,follow.
- live broken links: 확인 범위에서 없음.
- mobile: 브라우저 QA 불가.
- placeholders: 확인 범위에서 0.
- blocking issues: live ads.txt 404.
- non-blocking issues: pages.dev hostname, browser rendering, dashboard 확인 불가.
- verdict: `NO_GO`.
- 다음 단계: live ads.txt 원인 해결 후 Phase 3B 재검증.

## 2026-09-14 — AdSense Approval Phase 3B ads.txt Fix

- 목적: production ads.txt 404 blocker 해결.
- root cause: 저장소 증거만으로 미해결; Cloudflare live deployment artifact/project configuration 확인 필요.
- public/ads.txt tracked: 예.
- production commit contained ads.txt: 예, `4abad48`에 포함.
- build output: `dist/ads.txt` 생성, public 파일과 동일.
- redirects 영향: `/ads.txt`와 매칭되는 wildcard 없음.
- Functions 영향: Functions 파일 없음.
- Cloudflare output config: 저장소에서는 Astro static output `dist/` 확인; 실제 Pages dashboard 설정은 확인 불가.
- 수정 파일: `ADSENSE_LIVE_QA.md`, `ADSENSE_APPROVAL.md`, `PROJECT_HISTORY.md` 문서만 갱신.
- commit: 이 Phase 문서 갱신 커밋으로 기록.
- deployment: ads.txt fix deployment는 수행하지 않음; 원인 미확정 상태에서 우회 수정 금지.
- HTTPS ads.txt: 404.
- HTTP ads.txt: 301 → HTTPS, 최종 404.
- Content-Type: 최종 응답은 HTML 404.
- Publisher ID match: 저장소 AdSense code와 `ads.txt` publisher 값 일치.
- crawler checks: ads.txt 404 상태로 성공하지 않음.
- regression check: homepage 200, robots 200, sitemap 200, 대표 article 200, 404 404.
- blocker resolved: 아니오.
- 남은 non-blocking issues: pages.dev hostname, mobile/browser QA.
- 다음 단계: Cloudflare Pages deployment artifact/project build 설정 확인 후 재검증.

## 2026-09-14 — AdSense Approval Phase 3C

- 목적: AdSense 제출 직전 최종 production hardening.
- ads.txt repeated check: 3/3 HTTP 200, `text/plain`.
- production pages.dev: `https://emfls-site.pages.dev/` returns 200; 실제 production duplicate host로 확인.
- hashed preview: `https://42825105.emfls-site.pages.dev/` returns 200, `X-Robots-Tag: noindex`.
- preview X-Robots-Tag: 확인.
- pages.dev redirect: 적용하지 않음; Cloudflare 설정 변경 권한·필요성이 이번 범위에서 확정되지 않아 non-blocking으로 기록.
- mobile QA: 브라우저 자동화 사용 불가.
- HTTPS: apex 200.
- HTTP → HTTPS: 301 → HTTPS 200.
- crawler checks: Mediapartners-Google, Google-Display-Ads-Bot, Googlebot 모두 200.
- robots: 200.
- sitemap: 200, sitemap-0.xml 25 URLs.
- ads.txt: 200, `text/plain`, publisher match.
- AdSense code: live homepage와 대표 article에서 확인.
- canonical: sample pages 모두 `https://emfls.com` self canonical.
- trust pages: About, Contact, Privacy, Terms, Editorial Policy, Disclaimer 200.
- broken links: 확인 범위에서 없음.
- placeholders: 확인 범위에서 없음.
- blocking issues: 없음.
- non-blocking issues: production pages.dev 200 duplicate host, mobile/browser QA 미실행.
- final verdict: `GO_TO_ADSENSE_REVIEW`.
- docs commit: 이번 문서 갱신 커밋 예정.
- next step: 상위 승인 후 AdSense Request review 실행.

## 2026-09-14 — ads.txt Cloudflare Root Cause Investigation

- custom domain ads.txt: 정상화; 일반 URL과 cache-busting URL 모두 HTTP 200.
- cache-busting result: normal 200, query-string 200.
- cf-cache-status: `DYNAMIC`; cache-only 원인은 확정하지 않음.
- actual pages.dev hostname: `42825105.emfls-site.pages.dev`.
- pages.dev homepage: 200.
- pages.dev robots.txt: 200.
- pages.dev ads.txt: 200, `text/plain`.
- production branch: `main`.
- deployed SHA: Cloudflare check run에서 `609c6b8` 확인.
- build command: 저장소 `npm run build`.
- root directory: 저장소 root 기준으로 확인.
- output directory: `dist/`.
- Worker routes: 저장소에서 확인 불가; repository Functions 없음.
- Worker custom domains: 확인 불가.
- Redirect Rules: 확인 불가.
- Rewrite Rules: 확인 불가.
- Origin Rules: 확인 불가.
- Cache Rules: 확인 불가.
- Page Rules: 확인 불가.
- probe used: 사용하지 않음.
- root cause: `RESOLVED_DURING_DIAGNOSIS`; Pages artifact와 custom domain 모두 현재 정상이나 최초 404의 계정/edge 원인은 확정하지 않음.
- change: 코드·Cloudflare 설정 변경 없음.
- final ads.txt: HTTPS 200, `text/plain`, publisher ID 일치.
- crawler checks: Mediapartners-Google·Googlebot 모두 200.
- regression: homepage 200, robots 200, sitemap 200, representative article 200, nonexistent URL 404.
- blocker resolved: 예.

## 2026-09-14 — 대표 콘텐츠 실제 운영 경험 신호 보강

- 목적: AdSense 심사와 장기 검색 신뢰도를 위해 대표 콘텐츠 5개를 실제 emfls.com 운영 기록과 직접 연결.
- 대상 글: `personal-domain-website-start-checklist`, `why-astro-for-static-content-site`, `github-to-cloudflare-pages-deployment`, `after-first-deploy-checklist`, `adsense-review-final-checklist`.
- 추가한 실제 프로젝트 정보: 전체 구축 글에는 `emfls-site` repository와 `src/pages/`, `src/data/`, `src/layouts/BaseLayout.astro`의 역할 경계를 추가했다. Astro 글에는 `package.json`의 `astro build`, `astro.config.mjs`, `npm run build`, `dist/`, `public/robots.txt`, `public/ads.txt`, `public/_redirects`를 연결했다. 배포 글에는 GitHub source/version control → Astro static build → Cloudflare Pages production hosting → `https://emfls.com`의 경계를 명시했다. QA 글에는 HTTPS, HTTP→HTTPS, 대표 article 11개, canonical, robots, sitemap, ads.txt, 404와 redirect chain 확인 기록을 추가했다. AdSense 글에는 publisher 설정, 정책·noindex 구조와 production QA의 blocking issue 없음 기록을 추가했다.
- 이미지: 실제 스크린샷 파일은 없으므로 이미지나 공개 placeholder를 추가하지 않았다.
- 변경 파일: `src/data/articleEnhancements.ts`, `PROJECT_HISTORY.md`.
- 검증: `npm run build` PASS, 48페이지 생성. 대상 5개 article 모두 생성·canonical·Article schema 확인. 실제 프로젝트 신호 포함 확인. placeholder 문자열 검사 0건. 대상 글 내부 링크 검사 0건.
- 남은 문제: 브라우저 모바일 렌더링과 Cloudflare dashboard의 현재 설정은 이번 작업에서 확인하지 않았다.
- 다음 권장 작업: 실제 production 배포 후 대상 글의 공개 본문과 QA 결과가 저장소 기록과 일치하는지 재확인한다.

## 2026-09-14 — 첫 수익형 확장 콘텐츠 작성

- 목적: 기존 주제 범위 안에서 개인 정적 사이트의 실제 운영비 구조를 설명하는 신규 콘텐츠 1개 추가.
- 신규 article: `static-website-running-cost` — `개인 도메인 정적 사이트 운영 비용 총정리`.
- 검색 의도: 도메인·소스 저장소·정적 build·호스팅·DNS의 필수 비용, 무료 범위, 사용량·기능에 따른 추가 비용을 구분해 연간 예산을 분류하려는 사용자 대상.
- 실제 프로젝트 정보: GitHub source/version control → Astro `npm run build` → `dist/` → Cloudflare Pages production hosting/deployment → Cloudflare DNS → `https://emfls.com` 구조와 `package.json`, `astro.config.mjs`, `public/robots.txt`, `public/ads.txt`를 사용했다.
- 가격/플랜 정보 출처: 가비아 `.com` 프로모션 19,800원·일반 가격 26,400원(부가세 포함, `2026-09-14` 확인)을 구분했다. Cloudflare Pages 공식 limits의 Free 한도(월 500 builds, 동시 build 1개, 프로젝트당 custom domain 100개, 파일 20,000개, 단일 asset 25 MiB), Cloudflare DNS Free 제공 및 DNS query 무과금 범위, GitHub 공식 pricing의 Free repository 범위, Netlify Free 300 credits와 Personal $9/month를 공식 페이지 기준으로 반영했다. 가격과 한도는 변경될 수 있음을 명시했다.
- 변경 파일: `src/data/articles.ts`, `src/data/articleEnhancements.ts`, `PROJECT_HISTORY.md`.
- 검증: `npm run build` PASS, 49페이지 생성. 신규 article 생성, title, description, H1, `https://emfls.com/articles/static-website-running-cost/` canonical, Article JSON-LD, `datePublished`, `dateModified`, sitemap URL 포함을 확인했다. 카테고리 기반 관련 글 영역의 내부 article 경로 생성과 기존 대표 article 5개 생성을 확인했다. 본문 placeholder 문자열은 0건이었다.
- 남은 문제: 정적 검사에서 기존 `/articles/${article.slug}/` JavaScript template literal은 실제 동적 링크이므로 broken link false positive가 남는다. 실제 결제 금액과 Cloudflare/GitHub 계정별 사용량은 확인하지 않았다.
- 다음 권장 작업: 가격 변경 여부를 공식 페이지에서 재확인한 뒤, 필요하면 `개인 도메인 갱신 비용` 또는 `Cloudflare Pages 배포 실패 점검` 콘텐츠를 다음 후보로 검토한다.

## 2026-09-14 — Search Console 발견됨·현재 색인되지 않음 진단 콘텐츠 작성

- 목적: Search Console의 `Discovered - currently not indexed` 상태를 색인 거부 사유로 단정하지 않고, 크롤링 전 구조 점검과 크롤링 후 색인 적합성 점검으로 나누어 설명하는 신규 article 추가.
- 신규 article: `search-console-discovered-not-indexed` — `Search Console에서 발견됨 - 현재 색인이 생성되지 않음 해결 순서`.
- 검색 의도: URL이 발견됐지만 아직 크롤링되지 않은 상태의 의미를 이해하고 HTTP, redirect, robots, canonical, sitemap, 내부 링크, 이후 URL Inspection을 순서대로 점검하려는 사용자 대상.
- 기존 글과의 차이: Search Console 등록 글은 속성·sitemap 제출 절차, robots/sitemap 글은 각 파일의 기본 역할에 집중한다. 신규 글은 발견 후 미크롤링 상태의 진단 순서와 크롤링 후 별도 점검 항목을 다룬다.
- 사용한 공식 자료: Google Search Console Page indexing report, URL Inspection tool, Google Search canonicalization, sitemap 및 robots.txt 문서를 사용했다. 공식 자료에 없는 알고리즘 원인이나 색인 보장 표현은 추가하지 않았다.
- 사용한 실제 프로젝트 정보: 저장소와 production QA에서 확인된 `https://emfls.com/articles/personal-domain-website-start-checklist/` 형식의 대표 URL, `https://emfls.com` canonical, `/robots.txt`, `/sitemap-index.xml`, Astro `src/pages/` route, 정적 build 결과를 진단 예시로 사용했다. emfls.com이 해당 Search Console 상태를 겪었다고 주장하지 않았다.
- 변경 파일: `src/data/articles.ts`, `src/data/articleEnhancements.ts`, `PROJECT_HISTORY.md`.
- 검증: `npm run build` PASS, 50페이지 생성. 신규 article 생성, title, description, H1, canonical, Article JSON-LD, `datePublished`, `dateModified`, sitemap URL 포함을 확인했다. 신규 article의 관련 article 링크와 대상 대표 article 6개 생성 회귀를 확인했다. placeholder 문자열 0건, 정적 내부 article 링크 누락 0건, `dist/robots.txt`와 `dist/sitemap-index.xml` 유지 확인.
- 남은 문제: 실제 Search Console 계정 상태와 라이브 URL의 현재 색인 상태는 확인하지 않았다.
- 다음 권장 작업: 실제 Search Console Page indexing report에서 해당 상태가 발생한 URL을 확인할 수 있을 때 이 진단 순서로 live 결과를 대조한다.

## 2026-09-14 — AdSense Approval P0 운영 정합성

- 목적: AdSense 심사 전 글별 수정일, 홈페이지 운영 구조 메시지, 비콘텐츠 페이지의 AdSense 연결 정합성 수정.
- 기존 문제: article 화면과 Article JSON-LD가 전역 `site.reviewedDate`를 사용했고, 홈페이지가 GitHub Pages를 현재 공개 호스팅처럼 설명했으며, `BaseLayout.astro`의 AdSense script가 모든 페이지에 로드됐다.
- 변경 파일: `src/data/site.ts`, `src/data/articles.ts`, `src/pages/index.astro`, `src/pages/articles/[slug].astro`, `src/layouts/BaseLayout.astro`, `src/pages/404.astro`, `src/pages/tags/[slug].astro`, `src/pages/site-map.astro`, `PROJECT_HISTORY.md`.
- 변경 내용: Phase 2C 재작성 이력이 확인되는 대표 article 11개에 `updatedAt: 2026-09-14`를 명시하고 화면·metadata·Article JSON-LD에 동일 값을 사용했다. article fallback은 발행일을 사용하도록 정리하고 전역 수정일을 제거했다. 홈페이지를 GitHub source/version control, Astro static build, Cloudflare Pages production hosting, emfls.com 대표 도메인 구조로 수정했다. `adsEligible` prop 기본값은 `true`로 유지하고 404·tag·HTML sitemap에는 `false`를 전달했다.
- 검증: `npm ci` 후 `npm run build` PASS, 48페이지 생성. 대표 article 2개에서 화면 `최종 검토`와 Article JSON-LD `dateModified`가 모두 `2026-09-14`로 일치함을 확인했다. 홈페이지 title·description·H1이 Cloudflare Pages 운영 구조로 변경된 것을 확인했다. 생성 HTML에서 404·tag·HTML sitemap은 AdSense script 0건, 홈페이지와 일반 article은 각 1건임을 확인했다. `dist/robots.txt`와 `dist/sitemap-index.xml` 생성 및 기존 canonical 생성 경로를 확인했다.
- 남은 문제: 실제 production 배포 후 공개 페이지의 최신 콘텐츠와 브라우저·모바일 표시를 별도 확인해야 한다.
- 다음 권장 작업: build 결과로 대표 article 2개 이상, 홈페이지 메타, 404·tag·HTML sitemap·일반 article의 AdSense script와 robots/sitemap/canonical 회귀를 확인한다.
## 2026-09-14 — Cloudflare Pages 배포 실패 진단 콘텐츠 작성

- 목적: Cloudflare Pages 배포 실패를 정상 배포 사용법과 구분하고, build log부터 로컬 재현·설정·runtime·deploy 결과까지 증상별 확인 순서를 제공한다.
- 신규 article: `cloudflare-pages-build-failure`
- 검색 의도: GitHub 연결 후 Cloudflare Pages build/deploy가 실패했을 때 확인 위치와 판단 기준을 단계적으로 안내한다.
- 기존 글과의 차이: `github-to-cloudflare-pages-deployment`의 정상 배포 흐름을 반복하지 않고, 실패 단계 분류와 원인 진단에 집중했다.
- 사용한 Cloudflare 공식 자료: [Build configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/), [Debugging Pages](https://developers.cloudflare.com/pages/configuration/debugging-pages/), [Build image](https://developers.cloudflare.com/pages/configuration/build-image/), [Git integration](https://developers.cloudflare.com/pages/get-started/git-integration/), [Deploy anything](https://developers.cloudflare.com/pages/framework-guides/deploy-anything/).
- 사용한 실제 프로젝트 정보: `package.json`의 `npm run build`/`astro build`, `astro.config.mjs`의 `https://emfls.com`, Astro build 결과 `dist/`, Node version 고정 파일이 없는 현재 저장소 구조. Cloudflare dashboard의 실제 설정값과 emfls.com의 실제 build failure 이력은 확인된 사실로 사용하지 않았다.
- 변경 파일: `src/data/articles.ts`, `src/data/articleEnhancements.ts`, `PROJECT_HISTORY.md`.
- build 결과: `npm run build` 성공, 총 51개 페이지 생성.
- 검증 결과: 신규 article 생성, title·description·H1·canonical·Article JSON-LD·`datePublished`·`dateModified`·sitemap URL 확인. 관련 article 링크와 기존 대표 article 생성 확인. placeholder 문자열 0건. `dist/robots.txt`, `dist/sitemap-index.xml`, HTML 사이트맵 생성 및 기존 robots/sitemap 필터 구조 확인.
- 남은 문제: 실제 Cloudflare Pages dashboard 설정과 실제 장애 deployment log는 이 작업 범위에서 확인하지 않았다. 내부 관련 글은 기존 템플릿의 category/fallback 규칙에 따른다.
- 다음 권장 작업: production에서 실제 배포 log와 신규 article URL의 200 응답을 별도로 확인한다.

## 2026-09-14 — Article category 탐색 구조 정합성 수정

- 발견된 문제: 공개 article 14개 중 최근 추가된 `static-website-running-cost`, `search-console-discovered-not-indexed`, `cloudflare-pages-build-failure`가 article과 sitemap에는 있었지만 category page 목록에는 표시되지 않았다.
- 원인: `article.category`는 원본 article의 세부 분류와 화면 fallback에 사용되고, `articleCluster`는 상위 topic cluster·category page filtering·category metadata에 사용된다. category page는 `articleCluster`만 필터링하므로 두 필드가 자동 동기화되지 않는다.
- 수정 방식: 기존 cluster를 재사용해 세 slug만 `articleCluster`에 추가했다. 새 category, URL, redirect, article 삭제·병합은 만들지 않았다.
- 신규 cluster 배정: `static-website-running-cost`와 `cloudflare-pages-build-failure` → `Cloudflare·배포`; `search-console-discovered-not-indexed` → `검색·SEO`.
- 변경 파일: `src/data/articles.ts`, `src/pages/articles/[slug].astro`, `PROJECT_HISTORY.md`.
- build 결과: `npm run build` PASS, 51페이지 생성.
- category별 검증 결과: Cloudflare·배포 4개, 검색·SEO 3개, 도메인·DNS 3개, HTTPS·사이트 운영 2개, AdSense 2개가 category page에 표시된다. 공개 article 14개 모두 생성되며 신규 3개도 의도한 category page에 노출된다. 기존 11개 article의 cluster 배정은 변경하지 않았다.
- 회귀 검증: category article 링크의 생성 경로 일치, 신규·기존 canonical, sitemap URL, `dist/robots.txt`, placeholder 0건, 기존 `public/_redirects` 보존을 확인했다.
- 남은 문제: 세부 raw category 분산은 유지되고 있으며, article별 incoming link 수는 균등하지 않다. 다만 이번 검증에서 고립 article은 0개로 확인됐다.
- 다음 권장 작업: article 본문에 이미 존재하는 다음 단계 링크와 category 탐색을 함께 고려해 중요 글의 직접 incoming link를 별도 세션에서 정교화한다.

## 2026-09-14 — 사이트 이전 후 검색 하락 진단 콘텐츠 작성

- 목적: 도메인·호스팅·URL 이전 뒤 검색 노출 변화가 생겼을 때 이전 유형, HTTP 상태, redirect, canonical, sitemap, 내부 링크와 Search Console을 구분해 점검하는 신규 article 추가.
- 신규 article: `site-migration-ranking-drop` — `사이트 이전 후 검색 순위가 떨어질 때 확인할 것`.
- 검색 의도: 사이트 이전 이후 URL·색인·검색 노출 문제가 발생했을 때 기술적 진단 순서를 확인하려는 사용자 대상.
- 기존 article과 역할 차이: DNS·HTTPS·Search Console 등록·robots/sitemap 기본·정상 배포 글을 반복하지 않고, migration 전후 신호 비교와 원인 분리에 집중했다.
- 사용한 Google 공식 자료: [Site moves and migrations](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes), [Changing your web hosting](https://developers.google.com/search/docs/crawling-indexing/site-move-no-url-changes), [Redirects and Google Search](https://developers.google.com/search/docs/crawling-indexing/301-redirects), [Canonicalization](https://developers.google.com/search/docs/crawling-indexing/canonicalization), [Build and submit a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).
- 사용한 실제 프로젝트 정보: GitHub source/version control, Astro static build, Cloudflare Pages production deployment, `https://emfls.com` canonical production domain, `public/_redirects`, `public/robots.txt`, Astro sitemap, article URL 구조와 cluster 기반 related links. emfls.com의 실제 검색 하락·트래픽 손실·복구 결과는 주장하지 않았다.
- 변경 파일: `src/data/articles.ts`, `src/data/articleEnhancements.ts`, `PROJECT_HISTORY.md`.
- build 결과: `npm run build` PASS, 52페이지 생성.
- 검증: 신규 title·description·H1·canonical·Article JSON-LD·`datePublished`·`dateModified`, 검색·SEO category 노출, sitemap URL 포함을 확인했다. 공개 article 15개 생성, broken article link 0개, 자기 자신 링크 0개, placeholder 0건, robots·sitemap·기존 article 회귀 없음.
- 남은 문제: 실제 Search Console 전후 데이터와 라이브 migration 상태는 repository에서 확인하지 않았다.
- 다음 권장 작업: 실제 이전 작업이 발생할 때 URL별 전후 HTTP·redirect·canonical·sitemap 상태표를 작성해 이 글의 진단 순서와 대조한다.

## 2026-09-14 — Cloudflare custom domain·HTTPS 진단 보강

- 목적: Cloudflare Pages custom domain 연결 후 사이트 접속 또는 HTTPS 상태가 정상화되지 않을 때 확인할 범위를 기존 article 안에서 보강.
- 선택한 article과 이유: `how-to-check-https-on-custom-domain`을 선택했다. custom domain 연결, apex/www hostname, 인증서·HTTPS, redirect와 canonical을 한 흐름에서 다루므로 요청 검색 의도와 가장 직접적으로 맞고, DNS 기본 설정·정상 배포 글과 중복이 적다.
- 추가한 진단 범위: Pages Custom domains 등록과 DNS record 분리, apex와 `www` hostname 구분, `pages.dev`·custom domain·build failure 증상 분기, 기존 record·redirect 충돌 확인, 읽기 중심 진단 순서.
- 사용한 Cloudflare 공식 자료: [Pages custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/), [Pages debugging](https://developers.cloudflare.com/pages/configuration/debugging-pages/), [SSL/TLS](https://developers.cloudflare.com/ssl/).
- 사용한 실제 프로젝트 정보: `https://emfls.com` canonical과 GitHub source → Astro static build → Cloudflare Pages production 구조. 실제 Cloudflare dashboard custom domain 상태와 DNS record 값은 확인되지 않아 특정 현재 설정으로 주장하지 않았다.
- 변경 파일: `src/data/articles.ts`, `src/data/articleEnhancements.ts`, `PROJECT_HISTORY.md`.
- build 결과: `npm run build` PASS, 52페이지 생성.
- 검증: 공개 article 15개 생성, 수정 article title·description·H1·canonical·Article JSON-LD·날짜 확인, 관련 Cloudflare article links 확인, category/cluster 노출 확인, broken article link 0개, 자기 자신 링크 0개, sitemap·robots·기존 redirect 구조 회귀 없음, placeholder 0건.
- 남은 문제: 실제 Cloudflare dashboard 상태와 live certificate·DNS 상태는 저장소 검증 범위에 포함되지 않았다.
- 다음 권장 작업: 실제 custom domain 장애가 발생하면 hostname별 DNS·Pages Custom domains·certificate·HTTP response를 한 번에 기록해 production QA와 대조한다.

## 2026-09-14 — 정적 사이트 운영 비용·도메인 갱신 정보 보강

- 목적: `static-website-running-cost`에 도메인 갱신, registrar와 DNS provider의 역할, 반복 비용과 선택 비용의 구분을 추가.
- 보강 article: `static-website-running-cost`.
- 추가한 내용: 첫해 등록 프로모션과 반복 갱신 비용 구분, 만료일·자동 갱신·결제수단·알림 확인, registrar 이전과 nameserver/DNS provider 변경의 차이, 무료 hosting을 사용해도 도메인 비용이 별도라는 비용 구조.
- 가격 정보 처리: 가비아 `.com` 프로모션 19,800원과 일반 등록 가격 26,400원(부가세 포함, `2026-09-14` 확인)은 기존 공식 페이지 기준으로 유지했다. 갱신 가격은 해당 공식 페이지에서 명확한 숫자를 확인하지 못해 추측하지 않고 갱신 시점의 공식 가격을 확인하도록 작성했다.
- 사용한 공식 자료: [가비아 오늘의 도메인 가격](https://domain.gabia.com/regist/today_domain), [Cloudflare DNS FAQ](https://developers.cloudflare.com/dns/faq/), [Cloudflare Pages custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/), 기존 [GitHub pricing](https://github.com/pricing) 출처.
- 실제 emfls.com 구조: GitHub source/version control → Astro static build → Cloudflare Pages hosting/deployment, Cloudflare DNS 관리, `https://emfls.com` 대표 도메인. 실제 영수증·갱신 결제액·개인별 사용량은 만들지 않았다.
- 변경 파일: `src/data/articles.ts`, `src/data/articleEnhancements.ts`, `PROJECT_HISTORY.md`.
- build 결과: `npm run build` PASS, 52페이지 생성.
- 검증: 공개 article 15개, 대상 title·description·H1·canonical·Article JSON-LD·날짜, 비용/갱신 내용과 관련 article links, category/cluster, sitemap, robots, 기존 redirect 구조를 확인했다. broken article link 0개, 자기 자신 링크 0개, placeholder 0건.
- 남은 문제: 실제 registrar 계정의 만료일·자동 갱신·결제 상태와 실제 갱신 가격은 확인하지 않았다.
- 다음 권장 작업: 실제 갱신 시점에 registrar 공식 갱신 금액과 DNS/Pages 상태를 함께 확인해 비용 기록을 갱신한다.

## 2026-09-14 — Repository·Cloudflare Production 일치성 최종 진단

- 목적: 현재 `emfls/emfls-site` repository의 `main` HEAD, Cloudflare Pages production deployment, `https://emfls.com` 응답을 대조하고 필요한 경우에만 배포 복구 여부를 판단.
- GitHub main HEAD: `f914dc56fadb3063816b9365b864aed36984f4c3` (`docs: record final adsense production qa`). 현재 작업 트리에는 이후 변경이 commit되지 않은 상태로 남아 있다.
- Cloudflare production: `emfls-site` Pages project, repository `emfls/emfls-site`, production branch `main`, deployment SHA `f914dc56fadb3063816b9365b864aed36984f4c3`, deployment status success.
- Cloudflare 설정 확인: custom domain `emfls.com`, build command `npm run build`, output directory `dist/`, root directory `/`, framework Astro. 이 값은 Cloudflare API에서 확인했다.
- SHA 일치 여부: 예. production deployment SHA와 GitHub `main` HEAD가 일치하므로 최신 `main`을 다시 배포하지 않았다. 작업 트리의 미커밋 변경을 production에 임의 배포하지 않았다.
- 실제 homepage HTTP: `https://emfls.com/`은 접근 가능했으나 GitHub Pages 문구가 노출되어 현재 repository 작업 트리의 Cloudflare Pages 문구와 불일치했다. 이는 검색 캐시가 아닌 실제 URL fetch 결과로 기록했지만, 해당 응답이 main HEAD와 다른 이유는 확인하지 못했다.
- 최근 article 4개 및 부속 URL: 현재 실행 환경의 DNS resolver가 `emfls.com`을 해석하지 못해 curl 기반 세부 HTTP·header 확인은 불가했다. web fetch에서도 homepage 외 세부 경로는 안전성 제한으로 확인되지 않아 상태를 추정하지 않았다.
- repository build·구조: `npm run build` PASS, 52페이지 생성. 공개 article 15개, 최근 신규 4개, canonical·Article JSON-LD·sitemap·robots·ads.txt 생성 확인. broken article link 0개, 자기 자신 링크 0개.
- AdSense 상태: repository 기준 일반 article·homepage script 유지, 404·tag·HTML sitemap 제외, publisher ID가 `ads.txt`와 일치한다. 실제 AdSense 계정 심사 상태는 확인하지 않았다.
- 다른 프로젝트: Cloudflare 계정에 `emfls-car`, `emfls-pet`, `emfls-home` 등 별도 프로젝트가 보였으나 현재 대상 `emfls-site`와 혼동하거나 수정하지 않았다.
- 배포 수정 여부: 없음. SHA 불일치가 확인되지 않았고, 미커밋 작업 트리를 배포할 권한·근거가 없으므로 Cloudflare project나 deployment를 변경하지 않았다.
- 최종 readiness: `NOT_READY` — repository main과 production SHA는 일치하지만 실제 homepage 응답이 작업 트리 최신 문구와 불일치하고, 주요 live URL을 모두 재검증하지 못했다.
- 다음 권장 작업: 현재 작업 트리 변경을 검토·commit·push한 뒤, 그 commit SHA를 기준으로 Cloudflare Pages production deployment와 주요 live URL을 다시 대조한다.

## 2026-09-14 — Production·AdSense 최종 상태 진단

- 목적: 신규 콘텐츠나 구조 변경 없이 현재 repository build와 emfls.com production 반영 상태, 검색 기본 구조, AdSense 심사 blocker를 최종 점검.
- repository 상태: 공개 article 15개, 기존 cluster 5개와 category page 5개, homepage 최근 글 영역 및 article archive 확인. 현재 build 기준 article-to-article incoming 0개는 없고, 관련 글 구조는 유지된다.
- production 반영 결과: `https://emfls.com/`은 접근 가능했지만 홈페이지 title/H1에 이전 GitHub Pages 운영 문구가 노출되어 repository의 최신 Cloudflare Pages 운영 메시지와 불일치했다. 따라서 repository 최신 상태가 production에 완전히 반영되었다고 확인할 수 없다.
- production 확인 제한: 실행 환경의 DNS resolver가 `emfls.com`을 해석하지 못해 curl로 세부 URL을 반복 확인할 수 없었다. 최근 4개 article, category, About, Contact, Privacy, Editorial Policy, Content Methodology, robots, sitemap, ads.txt의 현재 live 상태는 확인 불가로 기록한다. homepage 결과만으로 나머지 URL의 상태를 추정하지 않았다.
- repository AdSense 상태: 일반 article·homepage는 AdSense script 대상이고 404·tag·HTML sitemap은 `adsEligible=false`로 제외된다. `public/ads.txt`, robots, sitemap, canonical, noindex utility와 redirect 구조가 build에 포함된다. 저장소 기준 명백한 AdSense blocker는 발견되지 않았다.
- 검색 기본 구조: `npm run build` PASS, 52페이지 생성. 공개 article 15개와 최근 신규 4개 생성, canonical·Article JSON-LD·sitemap·robots 확인. broken article link 0개, 자기 자신 링크 0개.
- 콘텐츠 품질: 확인 범위에서 placeholder, 대량 동일 글, 확인되지 않은 emfls.com 장애 주장, 명백한 검색 의도 중복은 발견하지 않았다. article 수 자체를 늘리는 것은 현재 심사 필수 작업으로 판단하지 않았다.
- 변경 파일: `PROJECT_HISTORY.md`만 수정. 코드·콘텐츠·배포 설정은 변경하지 않았다.
- 최종 판정: `NOT_READY` — repository 문제가 아니라 production homepage가 최신 repository 운영 메시지와 불일치하고, production 세부 URL 상태도 현재 환경에서 확인되지 않았다.
- 남은 문제: production deployment가 최신 repository를 반영했는지, 최근 4개 article과 `ads.txt`·robots·sitemap·정책 페이지의 live 상태를 별도 환경에서 확인해야 한다. 실제 AdSense 계정 심사 상태는 repository로 판단하지 않는다.
- 다음 권장 작업: Cloudflare Pages에서 최신 repository commit을 production에 배포한 뒤 `emfls.com`의 homepage와 최근 4개 article부터 다시 확인한다.

## 2026-09-14 — Article 내부 링크 구조 보강

- 목적: 공개 article 14개의 article-to-article 연결을 재계산하고, 고립된 핵심 article을 같은 상위 cluster의 관련 글과 연결했다.
- 수정 전 내부 링크 현황: 모든 article의 자동 related 영역은 3개였지만 raw `article.category`만 비교해 incoming 0개 article이 6개(`after-first-deploy-checklist`, `cloudflare-dns-setup-for-beginners`, `gabia-domain-cloudflare-dns`, `github-to-cloudflare-pages-deployment`, `how-to-check-https-on-custom-domain`, `why-astro-for-static-content-site`)였다. Markdown 형태의 본문 링크는 현재 article template에서 일반 문자열로 렌더링되므로 실제 anchor 집계에서는 related 영역과 분리했다.
- 실제 고립/약한 article: 위 6개가 고립 상태였고, 보강 전 incoming 1~2개인 article도 있었으나 링크 수 균등화는 목표로 삼지 않았다.
- 추가 또는 조정한 링크: `src/pages/articles/[slug].astro`의 related article 조건에 동일 raw category뿐 아니라 동일 `articleCluster`도 포함했다. 이에 따라 도메인·DNS, Cloudflare·배포, HTTPS·사이트 운영 cluster 내부 관련 글이 자동 연결된다.
- 링크 선정 이유: 기존 3개 related 영역과 URL 구조를 유지하면서, 같은 상위 주제 안에서 다음 단계로 이동할 수 있는 글을 우선 연결했다. 자기 자신 링크와 임의의 전체 링크 목록은 추가하지 않았다.
- 변경 파일: `src/pages/articles/[slug].astro`, `PROJECT_HISTORY.md`.
- build 결과: `npm run build` PASS, 51페이지 생성.
- 수정 후 내부 링크 현황: 공개 article 14개, 각 article outgoing related link 3개, incoming 0개 article 0개. incoming 최저는 1개이며, broken article link 0개, 자기 자신 링크 0개다.
- 회귀 검증: 신규·기존 article 생성, canonical, sitemap, category/cluster page 목록, `dist/robots.txt`, 기존 `public/_redirects`, placeholder 0건을 확인했다.
- 남은 문제: 본문 Markdown 링크를 실제 anchor로 렌더링하는 구조는 이번 범위에서 변경하지 않았다. incoming 링크 수는 의미적 중요도에 따라 비균등하다.
- 다음 권장 작업: 필요성이 확인된 글에만 본문 문맥형 링크를 별도 설계하고, 현재 자동 related fallback의 배열 순서 의존성을 추가로 검토한다.
