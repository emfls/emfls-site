## 2026-09-17 — AdSense approval audit remediation

- 목적: 최신 Notion P0 감사 지시에 따라 공개 placeholder, Privacy 운영 정합성, 공개 숫자 모순, legacy 내부 링크를 bounded하게 재점검.
- 변경 파일: `src/data/articles.ts`, `TASKS.md`, `PROJECT_HISTORY.md`.
- 변경 내용: 공개 AdSense 체크리스트의 과거 고정 article 수·완료 주장을 최신 build 기준 확인 문구로 교체했다. 공개 article 템플릿에 placeholder 렌더링이 없는 것을 확인했다.
- Privacy: `src/pages/privacy.astro`의 Cloudflare Pages/GitHub source/GA4/AdSense 설명이 현재 코드 구조와 일치해 변경하지 않았다.
- Redirect/link: `public/_redirects`의 inbound redirect는 유지하고, 소스의 내부 링크에 legacy article href가 없는 것을 확인했다.
- 검증: `npm run build` PASS, 52페이지 생성. `dist` placeholder 0건, legacy article href 0건, `dist/sitemap.xml` 29개 URL, `dist/ads.txt` 존재, `dist/robots.txt`의 sitemap URL 정합성을 확인했다.
- Live QA: `emfls.com` DNS 해석 실패로 fresh HTTP 확인 불가. 미확인 상태를 유지한다.
- 상태: `READY_FOR_REVIEW` — Production fresh HTTP QA 후 최종 관제 리뷰 필요.

## 2026-09-17 — Next Codex Action · reading time display fix

- Notion의 Owner Request에 따라 홈페이지 카드에서 `10분분`처럼 표시되는 읽기 시간 중복을 재현했다.
- `src/pages/articles/[slug].astro`가 이미 숫자형 `readingTimeMinutes`를 가진 `articleMeta`를 사용하도록 수정해 `N분` 한 번만 표시한다.
- 후속 build에서 homepage/category 카드에 남은 `N분분`을 확인해 `src/components/ArticleCard.astro`도 동일한 숫자형 meta 포맷으로 통일했다.
- 재검증: `npm run build` PASS, 생성물 `분분` 0건, sitemap 29개 URL, `git diff --check` PASS.
- Fresh Production QA: web fresh 확인에서 `https://emfls.com/`, `/privacy/`, `/articles/`, `/site-map/`은 정상 콘텐츠를 반환했다. `https://www.emfls.com/`은 다른 사이트(“모여봐요 주식의 숲”)를 반환해 canonical/redirect 불일치 blocker를 재현했다.
- DNS 조치: Cloudflare dashboard의 실제 zone/Pages custom domain 상태를 확인할 수 없어 DNS는 변경하지 않았다. `/sitemap.xml`, `/robots.txt`, `/ads.txt`, 404의 최종 QA는 `www` 설정 확인 후 재실행한다.
- Cloudflare Dashboard 접근 결과: 로그인 화면으로 중단. zone/Pages 내부 상태를 추측하지 않으며, `www`가 연결된 다른 origin 식별 전에는 어떤 DNS/redirect도 변경하지 않는다.

## 2026-09-17 — www origin confirmed; change held for impact review

- Cloudflare `emfls.com` zone: apex는 `CNAME → emfls-site.pages.dev`(프록시됨).
- 기존 `www` 레코드는 `CNAME → emfls.github.io`이며, `emfls-site` Pages Custom Domain에는 `emfls.com`만 활성 상태다.
- Cloudflare의 `emfls-site` Custom Domain 추가 화면이 제안한 최소 DNS 변경은 기존 `www → emfls.github.io`를 `www → emfls-site.pages.dev`로 교체하는 것이다.
- 영향: 이 변경은 다른 프로젝트 `emfls.github.io`의 현재 `www.emfls.com` 공개 진입점을 끊고 emfls-site로 이동시킨다. 프로젝트 삭제는 아니지만 영향이 명확하므로 사용자 확인 전 변경하지 않았다.
- 상태: `BLOCKED_FOR_IMPACT_CONFIRMATION`; 확인 후 DNS 변경, www 301 규칙/Pages 동작 설정, 전체 fresh QA를 진행한다.
- Production 홈페이지에서도 중복 표기를 확인했으며, DNS/HTTP 및 이후 전체 URL Live QA는 별도 fresh resolver 검증이 필요하다.

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

## 2026-09-14 — GitHub·Cloudflare Production 배포 일치성 복구

- 목적: 검증 완료된 `emfls-site` 작업 트리를 `emfls/emfls-site`의 `main`에 반영하고 Cloudflare Pages production과 대조.
- Git 상태: repository `emfls-site`, remote `https://github.com/emfls/emfls-site.git`, branch `main`. 기존 HEAD `f914dc56fadb3063816b9365b864aed36984f4c3`에서 새 commit `0b162cbb8af2f4fe077f173098a9808f2f894237`로 commit/push했다.
- 변경 검토: 현재 프로젝트의 homepage 운영 메시지, article 날짜·콘텐츠·cluster, AdSense utility 제어, category·related 구조, `PROJECT_HISTORY.md` 변경만 포함했다. 다른 `emfls-*` repository/project는 수정하거나 commit하지 않았다.
- 보안 검토: untracked 파일 없음, `.env`·private key·credential 파일 없음, diff whitespace 오류 없음. 문서의 공개 publisher ID와 URL은 기존 프로젝트 구성값이며 비밀 credential로 취급되는 값은 발견하지 않았다.
- 로컬 검증: `npm run build` PASS, 52페이지 생성. 공개 article 15개, 신규 article 4개, homepage Cloudflare Pages 문구, category/cluster, broken article link 0개, 자기 자신 링크 0개, canonical·sitemap·robots·ads.txt, 404/tag/site-map AdSense script 제외를 확인했다.
- GitHub push: `origin/main` push 성공. force push나 history rewrite는 사용하지 않았다.
- Cloudflare production: project `emfls-site`, repository `emfls/emfls-site`, branch `main`, build command `npm run build`, output `dist/`, root `/`, custom domain `emfls.com`. 새 production deployment `9f112888-a372-457b-8c78-9d25f82e9350`가 build/deploy success이고 commit `0b162cbb8af2f4fe077f173098a9808f2f894237`를 반영했다. custom domain API status도 active다.
- SHA 일치: GitHub `main` HEAD와 Cloudflare production deployment/canonical deployment SHA가 일치한다.
- 실제 homepage: web fetch에서는 여전히 GitHub Pages 문구가 반환되었으나, 현재 실행 환경의 직접 DNS/curl 확인은 실패했고 해당 fetch가 새 deployment 전환 전 결과인지 확정하지 못했다. 따라서 live homepage 최신 문구는 확인 불가로 기록하고 검색 cache라고 단정하지 않았다.
- 최근 article 4개·신뢰 페이지·robots·sitemap·ads.txt: Cloudflare API deployment 성공은 확인했지만 현재 환경의 DNS와 web fetch 제한으로 각 URL의 HTTP status, canonical, content-type을 모두 직접 확인하지 못했다.
- 배포 수정 여부: 예. 검증된 `main` commit을 push해 기존 Pages project에서 자동 production deployment가 성공했다. project 삭제·재생성이나 설정 변경은 하지 않았다.
- 최종 AdSense readiness: `NOT_READY` 유지. repository와 Cloudflare SHA는 정상 일치하지만 실제 live homepage와 주요 URL의 최신 응답을 이 환경에서 완전히 확인하지 못했다.
- 다음 권장 작업: 일반 브라우저 또는 DNS가 정상인 환경에서 `emfls.com` homepage·최근 article 4개·`robots.txt`·sitemap·`ads.txt`의 HTTP와 최신 문구를 한 번에 재확인한다.

## 2026-09-15 — Google Analytics 4 연결

- 목적: `emfls/emfls-site`의 일반 public page에 GA4를 정확히 연결하고 Privacy 문구를 실제 사용 상태와 일치시킨다.
- Measurement ID: `G-01CGEVVYHL`.
- 기존 Analytics/GTM 존재 여부: repository 검색 결과 기존 `gtag`, `GTM-*`, `google-analytics.com`, `googletagmanager.com`, `dataLayer` 설치는 없었다. 기존 AdSense script만 존재했다.
- 설치 위치: 공통 `src/layouts/BaseLayout.astro`의 `<head>`에 Google 공식 `gtag.js` async script와 `dataLayer`·`gtag('js')`·`gtag('config')` 초기화를 1회 추가했다. 수동 `page_view`와 SPA router는 추가하지 않았다.
- Privacy 변경: `src/pages/privacy.astro`의 “Google Analytics는 사용하지 않습니다” 문구를 GA4 사용 가능성, 방문·이용 관련 정보 처리, Google 개인정보·파트너 사이트 안내로 수정했다.
- 변경 파일: `src/layouts/BaseLayout.astro`, `src/pages/privacy.astro`, `PROJECT_HISTORY.md`.
- build 결과: `npm run build` PASS, 52페이지 생성.
- 중복 태그 검증: 생성된 homepage·대표 article·Privacy에서 GA4 script 1개와 config 1개 확인. 별도 GTM/GA measurement ID 중복 없음.
- 회귀 검증: 공개 article 15개, broken article link 0개, 자기 자신 링크 0개, canonical·sitemap·robots·ads.txt 정상. AdSense script는 일반 page에 유지되고 404·tag·HTML sitemap에서 기존 제외 상태를 유지했다.
- Cloudflare production: commit/push 완료. production deployment `42933779-6ab7-4bc3-b715-c90caadf4ff3`가 build/deploy success이며 commit `4279ded729bf6a0981ae1aae7e204aade82601ec`를 반영했다. custom domain project는 기존 `emfls-site`다.
- SHA 상태: 확인 시점에 GA4 commit과 Cloudflare canonical deployment SHA가 일치했다.
- live tag: 현재 실행 환경의 DNS/web fetch 제한으로 `https://emfls.com` HTML의 GA4 ID는 확인 불가. 로컬 generated HTML에서는 확인했다.
- GA4 Realtime: Analytics 계정 접근 및 Realtime 수신은 확인하지 못했다. `태그 설치 검증 완료 / GA4 Realtime 수신은 사용자 확인 필요`로 구분한다.
- 다음 권장 작업: 사용자가 Analytics Realtime에서 `G-01CGEVVYHL` 수신 여부를 확인한다.

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
## 2026-09-17 — www canonical host migration and Production QA

- 변경 전: Cloudflare `emfls.com` zone의 `www`는 `CNAME → emfls.github.io`였고, `www.emfls.com`에서 별도 주식 사이트가 반환됐다. apex는 `CNAME → emfls-site.pages.dev`였으며 nameserver는 `michael.ns.cloudflare.com`, `molly.ns.cloudflare.com`이다.
- 변경: `www` DNS를 `emfls-site.pages.dev`로 교체하고 `emfls-site` Pages Custom Domain에 `www.emfls.com`을 추가했다. 기존 `emfls.github.io` 프로젝트와 `https://emfls.github.io/`는 건드리지 않았다.
- redirect: Cloudflare Single Redirect Rule `https://www.* → https://${1}`, 301, query string 유지를 배포했다. 다른 EMFLS 서브도메인 DNS는 변경하지 않았다.
- fresh QA (2026-09-17): apex `/` 200; www `/`, `/privacy/`, 대표 article path가 동일 path의 apex로 301; `/privacy/`, `/articles/`, `/site-map/`, `/sitemap.xml`, `/robots.txt`, `/ads.txt` 200; 임의 경로 404. 대표 article canonical은 `https://emfls.com/articles/adsense-review-final-checklist/`이며 live sitemap/home에 `www.emfls.com` 참조가 없음을 확인했다.
- 상태: `READY_FOR_REVIEW`.

## 2026-09-15 — XML sitemap 공개 URL 정리

- 목적: 공개 sitemap entry point를 `/sitemap-index.xml`에서 `/sitemap.xml`로 통일.
- 기존 구조: `@astrojs/sitemap`이 build 후 `dist/sitemap-index.xml`과 `dist/sitemap-0.xml`을 생성했고, `public/robots.txt`가 index 파일을 선언했다.
- 구현: `astro build` 뒤 작은 Node postbuild script가 `dist/sitemap-0.xml`을 `dist/sitemap.xml`로 이름 변경하고 기존 index·원본 파일을 제거하도록 구성했다. `astro.config.mjs`의 기존 filter는 변경하지 않았다.
- 변경 파일: `package.json`, `scripts/normalize-sitemap.mjs`, `public/robots.txt`, `README.md`, `src/data/articles.ts`, `src/data/articleEnhancements.ts`, `PROJECT_HISTORY.md`.
- build 결과: `npm run build` PASS, 52페이지 생성.
- sitemap 검증: `dist/sitemap.xml` 정상 XML, 공개 URL 29개 포함. tag page와 HTML site-map 제외 유지. `dist/sitemap-index.xml`·`dist/sitemap-0.xml`은 최종 산출물에 없음.
- robots: `Sitemap: https://emfls.com/sitemap.xml`로 변경.
- 회귀 검증: canonical·GA4·AdSense 구조는 변경하지 않았으며 diff check PASS. live sitemap과 robots HTTP 응답은 push 후 production에서 별도 확인 필요.
- production: commit `48dbfb55ceb731ac916921a3ad3a5dba1195afa3` push 후 Cloudflare Pages `emfls-site` production deployment `579a2f4f-5fb2-4cf5-9d68-d2b69ce1f2b0` build/deploy success. production branch `main`, build command `npm run build`, output `dist` 확인.
- live sitemap/robots: 현재 실행 환경에서 live HTTP 응답은 아직 확인하지 못함.
- 다음 권장 작업: push 후 Cloudflare Pages deployment와 `https://emfls.com/sitemap.xml`, `/robots.txt`의 HTTP/XML 응답을 확인하고 Search Console에 새 sitemap URL을 제출한다.
## 2026-09-15 — 실제 브라우저 기준 디자인 QA

- 목적: 로컬 production build와 실제 브라우저 렌더링을 기준으로 전체 디자인 완성도와 후속 polish 우선순위를 점검.
- 확인 범위: homepage, article archive, Cloudflare category, 대표 article 2개, Contact, 전역 CSS, ArticleCard, article detail template.
- 검증: `npm run build` PASS, 52페이지 생성. 데스크톱 Chrome과 좁은 모바일형 브라우저에서 실제 화면 확인.
- 주요 발견: P0 없음. P1은 article 본문 시각 계층, 미사용 screenshot 데이터, 반복 카드 visual, 일반 focus-visible 부재, Contact 빈 공간으로 기록했다.
- 산출물: `DESIGN_AUDIT.md`.
- 제한: 현재 브라우저 환경에서 정확한 1440×900·1024×768·768×1024·390×844·320×700 viewport를 각각 고정한 검증은 확인 불가로 기록했다. 320px은 후속 확인이 필요하다.
- 변경하지 않은 범위: CSS, article, 이미지, URL, SEO, GA4, AdSense, sitemap, robots.
- 다음 권장 작업: 정확한 responsive viewport 재검증 후 Batch 1의 typography·spacing·focus 개선 여부를 별도 결정한다.
## 2026-09-15 — 디자인 QA Batch 1

- 목적: `DESIGN_AUDIT.md`의 Batch 1 범위인 typography, spacing, responsive, keyboard focus만 개선.
- 변경 파일: `src/layouts/BaseLayout.astro`, `DESIGN_AUDIT.md`, `PROJECT_HISTORY.md`.
- typography: homepage hero H1과 article H1을 분리하고 선택적 `text-wrap`, article paragraph `overflow-wrap`, 모바일 metadata/본문 line-height를 조정.
- spacing/responsive: 모바일 hero·section·simple page·article shell·header/body 간격을 압축하고 40~44px 조작 영역을 보강.
- focus: 링크·버튼·form control·summary에 공통 `:focus-visible` outline 추가.
- build: `npm run build` PASS, 52페이지 생성.
- 브라우저 검증: 데스크톱 및 좁은 모바일형 실제 렌더링에서 homepage H1, article H1, metadata, 본문 줄바꿈, 가로 overflow, Tab focus를 확인. 정확한 1440×900·1024×768·768×1024·390×844·320×700 고정 viewport는 현재 도구 제한으로 확인 불가.
- 보호 항목: article 내용, URL, category/cluster, canonical, JSON-LD, sitemap, robots, GA4, AdSense는 변경하지 않았다.
- 남은 문제: Batch 2 article 본문 visual hierarchy, screenshot 데이터 사용 여부, 카드 visual 반복, Contact 빈 공간, 정확한 320px 검증.
- 다음 권장 작업: Batch 2에서 article example 영역만 별도 검토.

## 2026-09-15 — 디자인 QA Batch 2

- 목적: article 본문에서 example, checklist, mistakes, FAQ, related, sources의 역할을 공통 디자인 체계 안에서 더 명확하게 구분.
- 변경 파일: `src/pages/articles/[slug].astro`, `src/layouts/BaseLayout.astro`, `DESIGN_AUDIT.md`, `PROJECT_HISTORY.md`.
- 변경 내용: example에 실제 프로젝트 사례를 위한 subtle accent를 적용하고, checklist는 비인터랙티브 scan 목록으로 보강했다. mistakes는 약한 warning surface로, related와 sources는 compact link panel로 정리했다. FAQ의 native `details`/`summary`, 외부 링크의 `target`·`rel`, related 선정 로직은 유지했다.
- 보호한 범위: article 내용, URL, SEO, GA4, AdSense, sitemap, robots, category/cluster, related 선정 로직은 변경하지 않았다. 실제 screenshot 파일이 없어 screenshot 데이터는 렌더링하지 않았다.
- 검증: `npm run build` PASS, 52페이지 및 공개 article 15개 생성. 대표 article 5개를 실제 브라우저에서 확인했고 example/checklist/FAQ/related/sources 구조, 하단 영역, Tab focus-visible을 확인했다. 생성 HTML에서 canonical·Article JSON-LD·GA4·AdSense, sitemap·robots와 utility AdSense 제외 구조를 점검했다.
- viewport 결과: 좁은 모바일형 렌더링과 하단 checklist를 확인했으나 현재 브라우저 도구에서 정확한 390×844·320×700 고정은 확인 불가하여 PASS로 기록하지 않았다.
- 남은 문제: 실제 screenshot 데이터, 반복 카드 visual, Contact 빈 공간, 정확한 320px 측정.
- 다음 권장 작업: Batch 3에서 homepage·card·category·trust page visual을 별도 검토한다.

## 2026-09-15 — 디자인 QA Batch 3

- 목적: Homepage, ArticleCard, category, About, Contact, 정책·신뢰 페이지의 시각적 완성도를 높이고 Batch 1·2에서 남은 카드 반복과 Contact 빈 공간을 보강.
- 변경 파일: `src/layouts/BaseLayout.astro`, `src/components/ArticleCard.astro`, `src/pages/index.astro`, `src/pages/categories/[slug].astro`, `src/pages/about.astro`, `src/pages/contact.astro`, `src/pages/privacy.astro`, `src/pages/terms.astro`, `src/pages/editorial-policy.astro`, `src/pages/content-methodology.astro`, `src/pages/disclaimer.astro`, `DESIGN_AUDIT.md`.
- Homepage: 기존 palette와 구조를 유지하면서 주요 범위를 topic link list로 정리했다.
- Card: 기존 category/icon을 이용해 accent를 변주하고 category·title·summary·수정일·읽는 시간을 우선 노출했다. detail metadata와 SEO는 변경하지 않았다.
- Category: 기존 description과 카드 목록을 유지하고 글 수와 권장 읽기 흐름을 compact summary로 표시했다.
- About/Contact: 운영자·투명성 panel과 이메일 contact card·정책 링크를 추가해 짧은 페이지의 목적을 명확히 했다.
- Policy/trust: 다섯 정책 페이지에 공통 trust-page 문서형 폭과 heading rhythm을 적용했다. 내용은 재작성하지 않았다.
- 보호 범위: AI 이미지·screenshot, URL, category/cluster, related 로직, SEO metadata·canonical·JSON-LD, sitemap·robots, GA4·AdSense, dependency는 변경하지 않았다.
- 검증: `npm run build` PASS, 52페이지 및 공개 article 15개 생성. 실제 브라우저에서 homepage, category, Contact, Editorial Policy를 확인했고 article link broken 0건, self link 0건, sitemap 29개 URL, canonical·GA4·AdSense 회귀 없음을 확인했다.
- 모바일 결과: 현재 도구에서 정확한 320·390 고정 viewport는 확인 불가하여 PASS로 기록하지 않았다. 좁은 화면 CSS 분기와 overflow 방지 구조는 확인했다.
- 남은 문제: 실제 screenshot 데이터와 정확한 모바일 viewport 재검증.
- 다음 권장 작업: 실제 screenshot/이미지 자산이 확보된 경우에만 Batch 4 이미지 계획을 재검토한다.

## 2026-09-15 — Final Visual QA

- 목적: Batch 1~3 이후 전체 사이트를 실제 렌더링과 build 결과 기준으로 점검하고 디자인 작업 종료 가능 여부를 판정.
- 확인 범위: Homepage, article archive, 5개 대표 article의 전체 흐름, category 유형, About, Contact, Privacy, Terms, Editorial Policy, Content Methodology, Disclaimer, footer와 좁은 모바일형 화면.
- 결과: P0 없음. title wrap, metadata, example/checklist/mistakes/FAQ/related/sources, cards, category summary, Contact CTA, 정책 문서 계층과 확인 범위의 overflow를 점검했다.
- 점수: 기존 72/100에서 82/100. Homepage 86, Article readability 82, Cards 84, Mobile 76, Typography 80, Visual assets 68, Trust pages 86, Accessibility 86, Consistency 88.
- 최종 판정: `DESIGN_READY_WITH_MINOR_ISSUES`. 남은 항목은 실제 screenshot 데이터와 정확한 320·390 고정 viewport 미검증, 선택적인 hero branded visual 전환 검토다.
- 이미지 판단: AI illustration은 현재 불필요하다. 실제 screenshot은 원본이 확보될 때만 추가한다. Unsplash hero는 현재 유지하고 장기적으로 self-host 또는 branded illustration 전환을 권장한다.
- 검증: `npm run build` PASS, 52페이지·article 15개. broken article link 0, self article link 0, canonical 51개, sitemap 29개 URL, robots·GA4·AdSense 유지.
- 다음 권장 작업: 디자인 구현은 종료하고 실제 screenshot/visual 자산이 생길 때만 Batch 4를 검토한다. 이후에는 콘텐츠와 검색·운영 데이터 관찰을 우선한다.
## 2026-09-16 — LIVE 9 regression: production guard 정합성 수정

- 목적: `emfls-site`의 GA4와 AdSense가 custom production domain에서만 로드되는지 최신 Network QA 기준으로 정합화.
- `src/layouts/BaseLayout.astro`의 외부 스크립트 직접 삽입을 hostname guard 기반 동적 삽입으로 변경했다. `emfls.com`에서만 GA4 `G-01CGEVVYHL`과 AdSense publisher script가 로드된다.
- 콘텐츠, 디자인, URL, canonical, sitemap, robots, ads.txt는 변경하지 않았다.
- `npm install` 및 `npm run build` PASS. Astro static 52 pages와 sitemap normalization을 확인했고 `git diff --check` PASS.
- Production fresh HTTP와 외부 Search Console/Naver/Daum/IndexNow 상태는 이 실행환경에서 확인하지 못했으므로 완료로 기록하지 않는다.

## 2026-09-17 — STRICT_REAUDIT factual consistency and first-party evidence

- P0 수정: `src/pages/privacy.astro`에 실제 GA4 사용, AdSense/Google·제3자 광고 파트너의 쿠키·유사 기술 및 광고 측정/개인화 가능성, Google 광고 설정 안내를 현재 코드와 과장 없이 맞췄다.
- P0 수정: `src/data/articles.ts`에서 `Google Analytics 미사용`, 조건형 미래 표현, Phase 1/2B 및 과거 build/article 수 문구를 독자-facing 현재 설명으로 교체했다.
- P1 수정: `src/pages/articles/[slug].astro`가 `articleEnhancements.screenshot`의 검증 자료를 실제 렌더링하도록 연결했다. `src/data/articleEnhancements.ts`의 미완성 제목을 `검증 자료`로 정리했다.
- First-party 근거: DNS 오배치(`www CNAME → emfls.github.io`), apex Pages 연결, `www` Pages Custom Domain, Cloudflare Single Redirect 301, path/query 유지와 fresh HTTP 결과를 관련 flagship 글의 검증 자료에 반영했다. 실제 Dashboard를 위장하는 이미지나 새 AI 이미지 자산은 만들지 않았다.
- 검증: `npm run build` PASS — 52 pages; stale 공개 표현 검색 후 의도된 일반 문맥만 잔존; `git diff --check` 및 canonical/sitemap/internal-link 검사 예정.
- 남은 작업: 최신 변경을 Production에 배포한 뒤 대표 글·Privacy의 fresh HTTP QA 및 Desktop 1440px/Mobile 390px visual QA.
- 상태: `READY_FOR_REVIEW` (Production 재배포·최종 fresh QA 전).

## 2026-09-23 — P2-01 Web Games Common Layout & Design Tokens

- source main SHA: `102bd92d6582d711dd66215280d42421726603cd`.
- implementation branch: `pivot/web-games-mvp`.
- implementation commit: `63c6ef93404ea2e8ff5b6e1fc3ffa5921db5bc37`.
- 생성 파일: `src/layouts/GameLayout.astro`, `src/styles/game-tokens.css`, `src/styles/game-shell.css`.
- 범위: English-only 공통 문서 shell, `https://emfls.com` canonical/metadata contract, 공통 navigation/footer, accessibility foundation, shared design tokens와 shell CSS.
- Home 본문, game route, legacy source, redirect, dependency, AdSense, analytics, Cloudflare, DNS, Production은 변경하지 않았다.
- `git diff --check`: PASS.
- `npm run build`: PASS — 기존 52개 페이지 생성.
- 다음 작업: P2-02 Home shell.

## 2026-09-24 — P2-06 Game Site Trust Pages

- branch: `pivot/web-games-mvp`.
- previous HEAD: `35f24f751d27877506b6d0e598c29df7f0ed5d6d`.
- implementation commit: `32aeaf9fd8b02b7cb5e1dc833a00c9537af0f8c9`.
- 변경 파일: `src/pages/about.astro`, `src/pages/contact.astro`, `src/pages/privacy.astro`, `src/pages/terms.astro`, `src/styles/trust-pages.css`.
- `/about/`, `/contact/`, `/privacy/`, `/terms/`를 `GameLayout` 기반의 English-only 신뢰 페이지로 갱신했다. About에는 EMFLS Games identity와 `/games/`, `/contact/` 링크를, Contact에는 `contact@emfls.com` mailto와 Privacy/Terms 링크를 제공한다.
- Privacy는 현재 동작에 맞춰 계정·로그인·등록·cloud save·leaderboard·payment profile을 전제하지 않고, Google Analytics와 Google AdSense가 게임 페이지에 없음을 명시했다. Terms는 브라우저 게임 이용, 결과의 비보장, acceptable use, original content, external links, 변경 및 문의 기준을 통합했다.
- `/disclaimer/` redirect는 이 작업에서 구현하지 않았다. 향후 browser storage, analytics, advertising 또는 기타 data behavior가 추가되기 전 Privacy 재검토가 필요하다.
- `git diff --check`: PASS.
- `npm run build`: PASS — 57 pages generated.
- Browser QA: `/about/`, `/privacy/` desktop 1440px PASS; `/contact/`, `/terms/` mobile 390px PASS. Console: `NOT_RUN — console inspection unavailable`.
- Production, Cloudflare, DNS, main, legacy pages, redirects, dependencies unchanged.
- 다음 작업: P2-07 — full shell mobile/desktop QA.

## 2026-09-24 — P2-07 Full Shell QA

- branch: `pivot/web-games-mvp`.
- base HEAD: `dad6ff31ca3825a6b58ba6ebaf10d320d6b9f11a`.
- QA-only 범위로 source product 파일은 수정하지 않았다. 임시 `GameDetailFrame` fixture는 생성 후 검증하고 삭제했다.
- `git diff --check`: PASS. `npm run build`: PASS — 57 pages generated, Astro error/warning 없음.
- QA routes: Home, `/games/`, four game category routes, About, Contact, Privacy, Terms, `/site-map/`, custom 404, and temporary GameDetailFrame fixture.
- Desktop 1440px와 mobile 390px 기준으로 core shell, header/footer, trust pages, category pages, Games index, and fixture rendering을 확인했다. 320px compact QA는 별도 실행하지 않았다.
- `/games/` initial count 8; filter matrix verified by games data and runtime logic: All 8, Puzzle 3, Arcade 3, Reflex 3, Strategy 4, Solo 7, Local 2 Player 1, Strategy + Solo 3, Strategy + Local 2 Player 1, Puzzle + Local 2 Player 0, reset 8. `aria-pressed`, zero-result state, hidden-card behavior, and 8 intentional unresolved game detail links are present.
- Category membership verified: Puzzle — Mirror Drift, Twin Ledger, Field Bloom; Arcade — Pulse Junction, Orbit Slip, Glass Bloom; Reflex — Pulse Junction, Orbit Slip, Signal Sweep; Strategy — Gravity Pact, Twin Ledger, Field Bloom, Glass Bloom.
- Trust pages verified as English-only GameLayout pages with expected copy, links, metadata, and footer. GameDetailFrame fixture verified breadcrumb, H1, description, Mode, Session, game stage, How to Play, Controls, Scoring, Related Games, Back to all games, canonical, and VideoGame schema.
- Metadata verified for core game routes: absolute trailing-slash canonicals, unique English titles/descriptions, expected robots, and matching OG URLs. Structured data verified for Home WebSite, Games CollectionPage/ItemList, categories CollectionPage/ItemList, and fixture VideoGame. No fake ratings, reviews, offers, or player counts.
- ISSUE P2-07-01 — MAJOR. Route `/site-map/`, all viewports. Expected final English GameLayout game sitemap with Home, Games, 8 games, 4 categories, About, Contact, Privacy, Terms and no legacy links. Actual legacy BaseLayout Korean `EMFLS Guide` sitemap with articles, tags, Webmaster links, and legacy footer. Recommended next microtask: P2-07-FIX — migrate `/site-map/` to the final game-site IA contract only.
- ISSUE P2-07-02 — MAJOR. Custom 404, all viewports. Expected English GameLayout 404 with real 404 status, noindex, Home and Games CTAs, and no legacy article recommendations. Actual legacy Korean BaseLayout page with recent article list and no Games CTA. Recommended next microtask: P2-07-FIX — replace custom 404 with the final game-site 404 shell.
- Accessibility checks: skip links, heading hierarchy, keyboard-native filter controls, `aria-pressed`, fixture button/link structure, and focus-visible styles are present in source; console inspection unavailable. Horizontal overflow was not observed in the inspected desktop/mobile shell states.
- P2-07 QA PARTIAL — fixes required. Production unchanged.

## 2026-09-24 — P2-07-FIX Site Map and 404

- branch: `pivot/web-games-mvp`.
- previous HEAD: `feb48ce0ec93d81f806e743be406315240fde1cd`.
- implementation commit: `1ab8e69c78828930dd0604322aeeea62ce1f7b22`.
- ISSUE P2-07-01 fixed: `/site-map/` now uses the English `GameLayout`, `noindex, follow`, and the exact 18-destination final IA contract: Home, Games, 8 games from `games.ts`, 4 categories from `gameCategories.ts`, and About/Contact/Privacy/Terms. Legacy article, tag, guide, and disclaimer links are absent.
- ISSUE P2-07-02 fixed: custom 404 now uses the English GameLayout with Page Not Found copy, Home and Games CTAs, no article recommendations, `noindex, follow`, and no forced canonical or `og:url`.
- `GameLayout.astro` changed only to support `canonical={null}`. Existing canonical strings remain unchanged for Home, Games, Puzzle, About, Contact, Privacy, and Terms.
- HTTP QA: `/` 200, `/games/` 200, `/site-map/` 200, `/this-route-does-not-exist-p2-07-fix/` 404.
- Browser QA: Site Map and custom 404 loaded in the English GameLayout at desktop/mobile-capable local preview. 1440px and 390px verified; 320px: NOT_RUN. Horizontal overflow was not observed. Console: `NOT_RUN — console inspection unavailable`.
- `git diff --check`: PASS. `npm run build`: PASS — 57 pages generated.
- Production, main, legacy source, redirects, dependencies, Cloudflare, and DNS unchanged.

## 2026-09-24 — P3-G01-A Pulse Junction Implementation Plan

- branch: `pivot/web-games-mvp`.
- base HEAD: `b64b5b09fedc6f20bb84910636b9c918cfe60b1a`.
- Planning-only result: canonical route `/games/pulse-junction/`; no route, game code, CSS, fixture, data, dependency, or product source was created or modified.
- Frozen contract: Pulse Junction, Reflex/Arcade, Solo, 30–60 sec, mobile portrait primary, exactly 20 rounds, normalized pulse radius 0.08→1.00, target range 0.35–0.82, Perfect `<=0.025`, Good `>0.025 && <=0.060`, Miss `>0.060`, 360ms feedback, 3×650ms countdown.
- Frozen implementation constants: difficulty blocks Learn 0.46, Vary 0.50–0.60, Pressure 0.58–0.70 with acceleration `-0.06/0/+0.06`, Read 0.66–0.78 with `0/+0.05`, Final 0.74–0.88 with `0/+0.04/+0.08`; decoys 0/0/0/1/1–2 with bounded separation rules and injected deterministic RNG.
- Frozen scoring order: judge, increment combo for Perfect/Good, calculate updated-combo multiplier, then score. Tiers are ×1.00, ×1.25, ×1.50, ×1.75, ×2.00; theoretical all-Perfect maximum is 2,850 points.
- Frozen state/input behavior: IDLE, COUNTDOWN, ACTIVE, FEEDBACK, PAUSED, RESULT; visibility pause restarts the current round after Resume countdown; pointer/Space input is deduplicated, guarded, timestamp-aware, and outside-canvas clicks are ignored; resize preserves normalized state; DPR is capped at 2.
- Future file ownership: route `src/pages/games/pulse-junction.astro`; UI `src/components/games/PulseJunctionGame.astro`; CSS `src/styles/games/pulse-junction.css`; modules `types.ts`, `logic.ts`, `rng.ts`, `renderer.ts`, `input.ts`, `storage.ts`, `controller.ts` under `src/games/pulse-junction/`.
- Future phase split: B shell/state structure; C core mechanic/RNG/renderer; D input/pause/resize; E scoring/result/storage; F responsive/visual polish; G full QA. No audio, ads, analytics, Related Games, or framework dependency in B–G.
- Storage plan: optional `emfls:pulse-junction:best:v1` with best score/combo only, safe try/catch. Privacy must be re-audited before production if storage ships; Privacy was not modified in A.
- Verification: `git diff --check` PASS; `npm run build` PASS — 57 pages; `/games/pulse-junction/` absent; dependency diff empty; product source unchanged. Production unchanged.

## 2026-09-24 — P2-02 Home Shell

- branch: `pivot/web-games-mvp`.
- base previous HEAD: `fa6bd3bea0a5de8361b312ba063f34f3de59709e`.
- implementation commit: `46be1cf209dfbfbef9f8941ce0a5aab8d62f052c`.
- 변경 파일: `src/pages/index.astro`, `src/styles/home.css`.
- Home sections: product-first hero, product promises, four featured games, four categories, and a short Pick/Play/Restart guide.
- English-only Home과 `GameLayout` 사용을 확인했다. planned game/category route 링크는 P2-03~P2-05 전까지 unresolved 상태가 의도된 것이다.
- `git diff --check`: PASS.
- `npm run build`: PASS — 52 pages generated.
- Browser QA: desktop 1440px PASS, mobile 390px PASS. Console-specific inspection was not separately available; no visible blocking browser error occurred.
- Production unchanged.

## 2026-09-24 — P3-G01-B Pulse Junction State Shell

- branch: `pivot/web-games-mvp`.
- previous HEAD: `323d110ff5c1013fa6227538f688c9d3f090f02c`.
- implementation commit: `c5d434b33a4dc3a1a34dd8ae02526d6489e66104`.
- created `/games/pulse-junction/` using the existing `games.ts` lookup and `GameDetailFrame`; canonical and inherited `VideoGame` schema are correct. Related Games remains deferred.
- added `PulseJunctionGame.astro`, token-based game CSS, structural types/constants, and a scoped controller. The shell includes blank Canvas, Round/Score/Combo HUD, IDLE, COUNTDOWN, ACTIVE, FEEDBACK, PAUSED, and RESULT panels with Start/Resume/Play Again controls.
- implemented only the structural IDLE → COUNTDOWN → ACTIVE flow with 3/2/1 at 650ms steps and duplicate Start protection. No pulse rendering, target/decoy, gameplay input, judgement, scoring, combo, RNG, storage, visibility pause, resize gameplay, audio, ads, or analytics was added.
- intentionally did not create `logic.ts`, `rng.ts`, `renderer.ts`, `input.ts`, or `storage.ts`; the other 7 game routes remain unresolved.
- `git diff --check`: PASS. `npm run build`: PASS — 58 pages generated. Forbidden-pattern/static checks PASS. Browser route/shell structure PASS at local preview; Start interaction and console: `NOT_RUN — console inspection unavailable` because the connected browser surface did not expose button interaction/console APIs. 320px: NOT_RUN.
- Production unchanged.
- next task: P3-G01-C — Pulse Junction core mechanic / RNG / renderer only.

## 2026-09-24 — P3-G01-C Pulse Junction Core Mechanic

- branch: `pivot/web-games-mvp`.
- previous HEAD: `fcc3115b74a1f09fe8d04d17da4dfb8f92fde8c7`.
- implementation commit: `69ea7ab89a07f07f0bf308b8dbc133521e251488`.
- added pure judgement/motion/difficulty logic, injected and seeded RNG, bounded target/decoy generation, and token-based Canvas Target/Pulse/Decoy renderer.
- difficulty blocks, exact thresholds, frame-rate-independent elapsed motion, analytic/binary-search pulse end time, decoy separation/retry, and 20-round config generation follow the frozen contract.
- controller now runs the ACTIVE `requestAnimationFrame` loop, automatic Miss at pulse end, 360ms FEEDBACK, fresh next-round generation through round 20, structural RESULT, and Play Again mechanic reset. No gameplay input, scoring/combo, storage, pause, audio, analytics, or ads were added.
- temporary pure assertion fixture passed judgement boundaries, difficulty boundaries, seeded RNG reproducibility/range, round config ranges, decoy constraints, motion monotonicity/clamps, and pulse end-time checks, then was deleted.
- runtime QA: no-input session progressed through round 20 to RESULT with Score/Combo remaining 0; Play Again returned to COUNTDOWN at round 1. Console errors: 0. Desktop 1440 and mobile 390 route checks passed; 320px: NOT RUN. Direct decoy visual observation: NOT RUN.
- `git diff --check`: PASS. `npm run build`: PASS — 58 pages. `input.ts` and `storage.ts` remain absent. Production unchanged.
- next task: P3-G01-D — Pulse Junction mobile pointer / desktop click + Space input only.

## 2026-09-24 — P3-G01-C Type Import Fix

- branch: `pivot/web-games-mvp`.
- previous HEAD: `67ad69f9f9d9194c77e63d6557925918104eb5c7`.
- implementation commit: `2519cf6466dfe22cf7c4e2ce3ad9f05977395882`.
- root cause: `controller.ts` imported `RoundConfig` from `rng.ts`, although ownership and export are in `types.ts`. `RandomSource` remains owned by `rng.ts`.
- corrected imports only; no runtime or gameplay behavior changed. `rng.ts`, `types.ts`, and all mechanic modules remain otherwise unchanged.
- existing semantic checker: `NOT_RUN — no existing semantic type-check command/dependency`.
- runtime sanity: route loaded, Start entered COUNTDOWN, 3→2→1→ACTIVE behavior remained functional, first automatic Miss occurred, round progression continued, and console errors were 0.
- `git diff --check`: PASS. `npm run build`: PASS — 58 pages. Production unchanged.
- P3-G01-C FINAL PASS. Next task: P3-G01-D — Pulse Junction mobile pointer / desktop click + Space input only.

## 2026-09-24 — P3-G01-B Controller Fix

- branch: `pivot/web-games-mvp`.
- previous HEAD: `9de0457db8524e37333875b42861d605e351bad8`.
- implementation commit: `cc69de2165e0bd04871f24f67eea26bb9543538b`.
- root cause: controller compared six `GameState` values with five overlay panels. ACTIVE intentionally has no overlay because Canvas and HUD remain visible while all overlays are hidden.
- validation now requires exactly the five overlay states `IDLE`, `COUNTDOWN`, `FEEDBACK`, `PAUSED`, and `RESULT`, with no duplicate or unexpected panel values. The unused frontmatter controller import was removed; the client script import remains.
- fresh preview runtime: initial IDLE; Start → COUNTDOWN with 3, then 2, then 1, then ACTIVE after 1950ms; ACTIVE kept Canvas/HUD and hid all overlays. Rapid duplicate Start produced one countdown chain and one ACTIVE transition. Console errors: 0.
- responsive runtime checks: 1440px, 390px, and 320px all had no horizontal overflow. `git diff --check`: PASS. `npm run build`: PASS — 58 pages.
- gameplay mechanic, input, judgement, scoring, RNG, storage, and rendering remain absent. Production unchanged.
- P3-G01-B FINAL PASS. Next task: P3-G01-C — Pulse Junction core mechanic / RNG / renderer only.
- 다음 작업: P2-03 — `/games/` index shell only.

## 2026-09-24 — P2-03 Games Index Shell

- branch: `pivot/web-games-mvp`.
- previous HEAD: `bdc5acf2da2a537380ccb7af15b2776e70290ad1`.
- implementation commit: `6bf95620ac8fd4d3cc20abee2d308f370804bb7d`.
- 변경 파일: `src/pages/games/index.astro`, `src/styles/games-index.css`, `src/data/games.ts`.
- shared catalog: 8 games; Puzzle 3, Arcade 3, Reflex 3, Strategy 4; Solo 7, Local 2 Player 1.
- `/games/`는 GameLayout 기반으로 8개 카드를 initial HTML에 정적으로 렌더링하고, category/mode plain client filtering, result count, zero-result empty state를 제공한다.
- no-JS 카드 렌더, CollectionPage/ItemList schema, English-only metadata를 확인했다.
- game detail/category 링크는 P2-04~P2-05 전까지 unresolved 상태가 의도된 것이다. `/categories/two-player/`는 생성하거나 링크하지 않았다.
- `git diff --check`: PASS.
- `npm run build`: PASS — 53 pages generated.
- Browser QA: desktop 1440px PASS, mobile 390px PASS. Console: `NOT_RUN — console inspection unavailable`.
- Production unchanged.
- 다음 작업: P2-04 — game detail common frame only.

## 2026-09-24 — P2-04 Game Detail Common Frame

- branch: `pivot/web-games-mvp`.
- previous HEAD: `f3cda785a9b1cfb497bc722886726c8131eedbc5`.
- implementation commit: `c4c302b0a47a72ecd7a3cfd2947fdab1c7969a12`.
- 생성 파일: `src/components/GameDetailFrame.astro`, `src/styles/game-detail.css`.
- `GameDetailFrame`은 `GameLayout`을 composition하고 `GameMeta`를 재사용한다. breadcrumb, game header, mode/session metadata, accessible game stage, How to Play/Controls/Scoring slots, optional Related Games slot, Back to all games 링크를 제공한다.
- `VideoGame` JSON-LD는 전달받은 `GameMeta`와 visible description에서만 생성하며 canonical은 `game.href`를 사용한다.
- 임시 compile fixture와 browser fixture를 사용했고 검증 후 삭제했다. 실제 game detail route와 gameplay logic은 생성하지 않았다.
- fixture build: PASS — 54 pages. final `npm run build`: PASS — 53 pages.
- final `git diff --check`: PASS.
- Browser QA: fixture mobile 390px structure PASS; desktop fixture `NOT_RUN — not separately captured`. Console: `NOT_RUN — console inspection unavailable`.
- Production unchanged.
- 다음 작업: P2-05 — category routes only.

## 2026-09-24 — P2-05 Game Category Routes

- branch: `pivot/web-games-mvp`.
- previous HEAD: `fcd0b0a1c4b9c436b3adfc99d395a979a7bdc284`.
- implementation commit: `2d0b3631b64ddfe212974a03f33466a1de176e9c`.
- 4개 static route 생성: `/categories/puzzle/`, `/categories/arcade/`, `/categories/reflex/`, `/categories/strategy/`.
- `GameCategoryPage.astro`가 `GameLayout`과 shared `games.ts`를 재사용하고, `gameCategories.ts`는 `GameCategory` type만 재사용한다.
- category membership: Puzzle 3, Arcade 3, Reflex 3, Strategy 4. 각 page는 initial HTML game cards, breadcrumb, category-specific intro, canonical game href, CollectionPage/ItemList schema를 제공한다.
- 기존 `src/pages/categories/[slug].astro`와 legacy categories는 변경하지 않았다. `/categories/two-player/`와 실제 game detail route도 생성하지 않았다.
- `git diff --check`: PASS.
- `npm run build`: PASS — 57 pages generated.
- Browser QA: Puzzle/Strategy desktop 1440px PASS; Arcade/Reflex mobile 390px PASS. Console: `NOT_RUN — console inspection unavailable`.
- Production unchanged.
- 다음 작업: P2-06 — About / Contact / Privacy / Terms update only.

## 2026-09-23 — P2-01 Review Fix

- review fix commit: `8d50a72ba891256cb90c322c86c66a8108d09cb6`.
- `game-shell.css`의 box-sizing reset과 reduced-motion selector를 `*`, `*::before`, `*::after`로 통일했다.
- 공통 색상 4개를 `game-tokens.css`의 semantic token으로 이동했다: primary hover, on primary, footer text, footer link.
- `GameLayout.astro` 및 legacy source, redirects, dependencies, Cloudflare, DNS, Production은 변경하지 않았다.
- `git diff --check`: PASS.
- `npm run build`: PASS — 기존 52개 페이지 생성.
- 다음 작업: P2-02 Home shell.
## 2026-09-25 — P3-G01-D Pulse Junction Gameplay Input

- branch: `pivot/web-games-mvp`.
- previous HEAD: `40267a9491dfc27008f33f4a6094cee4ad26acf6`.
- implementation commit: `eb92398` (`feat: add Pulse Junction gameplay input`).
- added `input.ts` with Pointer Events-only Canvas input, primary-pointer tracking, multi-touch suppression, Space input with interactive-target guard, timestamp normalization, resize/orientation cancellation, and complete listener cleanup.
- updated `controller.ts` with earliest timestamp arbitration, exact input-time motion/judgement using `judgeRadii()`, pulse-end race handling, one judgement per round, preserved automatic Miss flow, and ACTIVE/FEEDBACK visibility pause.
- Resume preserves the current round/config and restarts the Pulse after 3→2→1; score, combo, storage, audio, ads, and analytics remain unchanged/absent.
- added scoped Canvas `touch-action: none` and `user-select: none`.
- source-level QA confirmed no `touchstart`, `mousedown`, gameplay click listener, duplicated judgement thresholds, scoring, combo, storage, audio, ads, or analytics. Runtime browser QA was not run in this environment.
- `git diff --check`: PASS. `npm run build`: PASS — 58 pages generated. Production unchanged.
- next task: P3-G01-E.
## 2026-09-25 — P3-G01-D Runtime Verification

- branch: `pivot/web-games-mvp`; base HEAD: `b022a7aae5efdca372d9a3bfcad3cc43be062006`.
- no product source modifications and no temporary QA files retained.
- local preview loaded `/games/pulse-junction/`; initial IDLE shell showed Round 1 / 20, Score 0, Combo 0. Start button activation and 3→2→1 countdown were observed; automatic round progression reached later rounds with Miss feedback and Score/Combo remaining 0.
- Canvas coordinate pointer injection, Space key injection, viewport resizing, visibility lifecycle simulation, and console inspection were unavailable through the connected browser automation surface. Mobile 390 pointer, button Space guards, active visibility pause/resume, resize/orientation, multi-touch, pointer+Space arbitration, and pulse-end precision remain NOT_RUN.
- `git diff --check`: PASS. `npm run build`: PASS — 58 pages generated. Production unchanged.
- P3-G01-D remains PARTIAL; do not advance to P3-G01-E. Next: P3-G01-D-VERIFY retry with browser controls that expose pointer coordinates, keyboard events, visibility, and viewport emulation.
## 2026-09-25 — P3-G01-D Headless Runtime Verification

- base HEAD: `82346122a484a4823b9d4fb64faf5570951de53f` on `pivot/web-games-mvp`.
- capability: existing Google Chrome headless binary with built-in Node 24 WebSocket/CDP; Playwright and Puppeteer were not resolvable. No dependency was installed.
- product source was unchanged. Temporary CDP scripts under `/tmp` were deleted before completion.
- Desktop 1440×900: Start → 3→2→1→ACTIVE, Canvas PointerEvent produced one feedback and one round transition; rapid pointer/multi-touch and pointer+Space produced one judgement per round. Outside-Canvas input did not judge.
- Mobile 390×844: Canvas PointerEvent produced one feedback, one round transition, and no horizontal overflow.
- Space gameplay produced one feedback and `defaultPrevented: true`; Start button-targeted Space remained IDLE with no feedback. Score and Combo remained `0`.
- ACTIVE visibility simulation produced PAUSED with unchanged round and no Miss/advance; visible state remained PAUSED; Resume produced COUNTDOWN and ACTIVE on the same round. Resize/orientation events preserved ACTIVE state and round.
- CDP Runtime/Log capture reported no page exception, console error, or unhandled blocking runtime error. Precise pulse-end race, FEEDBACK-hidden pause, orientation viewport rotation, and stale-pointer-across-pause were not separately exercised.
- initial/final `git diff --check`: PASS. initial/final `npm run build`: PASS — 58 pages. Production unchanged.
- P3-G01-D FINAL PASS. Next: P3-G01-E.
## 2026-09-25 — P3-G01-E Pulse Junction Scoring and Best Stats

- branch: `pivot/web-games-mvp`; previous HEAD: `4ef00741846e992810844d9271ec3f2ad6752c79`.
- implementation adds `SessionStats`/`BestStats`, pure scoring in `logic.ts`, safe versioned `storage.ts`, delayed FEEDBACK commit, HUD/result updates, independent Best Score/Best Combo, and full Play Again session reset. `input.ts`, RNG, renderer, mechanics, route, and privacy page were not modified.
- scoring contract: Perfect 100, Good 60, Miss 0; combo increments before multiplier; tiers 1.00 / 1.25 / 1.50 / 1.75 / 2.00. Pure assertions passed for all-Perfect 2850, all-Good 1710, Miss reset/maxCombo preservation, independent best maxima, malformed storage, invalid values, and throwing storage.
- pending judgement is committed only after the 360ms FEEDBACK timer; FEEDBACK hidden→PAUSED discards the pending outcome and Resume replays the same round without double scoring.
- Chrome headless + Node/CDP runtime QA: successful Perfect reached Score 100 / Combo 1; 20 immediate Miss rounds reached RESULT with Score 0, Miss 20, Max Combo 0; Play Again reset session fields; valid best preload showed 1234 / 9; malformed preload safely fell back to 0 / 0; pause/resume preserved committed HUD values.
- privacy.astro was intentionally unchanged. Privacy Policy must be reviewed/updated before optional browser storage behavior ships to Production.
- temporary QA fixtures/scripts were deleted. `git diff --check`: PASS. `npm run build`: PASS — 58 pages. Production unchanged.
- next task: P3-G01-F.
## 2026-09-25 — P3-G01-F Pulse Junction Responsive and Visual Polish

- branch: `pivot/web-games-mvp`; previous HEAD: `a5e753a387b15aefb1c91f8345532deb2b0ff3bc`.
- renderer now separates logical CSS size from Canvas backing size, uses `DPR_CAP` 2, synchronizes only on size/DPR changes, projects normalized geometry with stable `0.42` max-radius basis, and cleans up ResizeObserver/resize/orientation listeners.
- added game-local max width, compact 320px HUD/result layout, overflow-safe overlays, semantic Perfect/Good/Miss visual treatments with retained text, modest feedback motion, and reduced-motion suppression for decorative animation only. No audio was added.
- Chrome headless + Node/CDP QA: DPR1 backing 638×638 for 638 CSS px; DPR2 backing 1276×1276; DPR3 reported devicePixelRatio 3 but remained capped at 1276×1276. 1440, 390, and 320 layouts had no horizontal overflow; 320 RESULT exposed all seven fields and Play Again. Resize/orientation-like transitions preserved ACTIVE and round. Reduced-motion feedback reported animation `none`; console exceptions were 0.
- input, logic, RNG, storage, types, route, privacy, scoring, pause, and storage semantics remain unchanged. Temporary QA scripts were deleted.
- `git diff --check`: PASS. `npm run build`: PASS — 58 pages. Production unchanged.
- next task: P3-G01-G.
## 2026-09-25 — P3-G01-F Motion Token Fix

- branch: `pivot/web-games-mvp`; previous HEAD: `8f76c17c4712a981eac6163c3522f9fba34f04c6`.
- root cause: feedback animation referenced undefined `--game-motion-duration-standard` and `--game-motion-easing-standard` names with fallbacks instead of the shared motion-token contract.
- corrected only `pulse-junction.css` to use `var(--game-motion-normal)` and `var(--game-motion-ease)`. Keyframes, outcome colors/text, reduced-motion rule, and 360ms gameplay feedback timing were unchanged.
- Chrome/CDP sanity: normal feedback reported animation name `pulse-junction-feedback-in`, shared token resolved to `.2s`/200ms and shared easing; reduced motion reported animation `none`; route and gameplay feedback loaded with zero runtime exceptions.
- renderer, controller behavior, input, scoring, storage, DPR, responsive layout, and all other protected files remain unchanged.
- `git diff --check`: PASS. `npm run build`: PASS — 58 pages. Production unchanged.
- P3-G01-F FINAL PASS. Next: P3-G01-G.
## 2026-09-25 — P3-G01-G Final QA — FIX REQUIRED

- branch: `pivot/web-games-mvp`; base HEAD: `8038444d1dc421e3cba0c8ecf20f828b4aa84cef`.
- QA-only execution used existing Google Chrome headless with Node 24 WebSocket/CDP. Product source was not modified; temporary QA script was deleted.
- confirmed defect: stale pointer across visibility pause. Reproduction: ACTIVE → Canvas `pointerdown` with `pointerId=1` without release → hidden/`visibilitychange` → PAUSED → visible → Resume → 3→2→1→ACTIVE → new primary Canvas `pointerdown` with `pointerId=2`. Expected one new judgement/FEEDBACK; actual state remained ACTIVE with no feedback because `activePointerId` was not cleared by the visibility-pause path. Likely source area: `src/games/pulse-junction/input.ts` plus controller pause integration. Severity: HIGH; blocks completion.
- Initial baseline `git diff --check`: PASS. `npm run build`: PASS — 58 pages. No dependency or product changes. Production unchanged.
- P3-G01-G remains incomplete. Next: P3-G01-G-FIX — stale pointer across pause only.
## 2026-09-25 — P3-G01-G Stale Pointer Pause Fix

- branch: `pivot/web-games-mvp`; previous HEAD: `69f1966e2d3609e6e4787ca4ed523448f5c6fe88`.
- root cause: `activePointerId` in the existing input module survived visibility pause because the controller did not call its existing `input.cancelPointer()` API.
- controller visibility pause now cancels pointer ownership for ACTIVE and FEEDBACK pauses. `input.ts` was unchanged.
- exact stale-pointer repro now passed without releasing pointerId 1: hidden → PAUSED → Resume → new pointerId 2 produced FEEDBACK. Normal pointer, mobile 390 pointer/multi-touch, Space, ACTIVE pause, and FEEDBACK pause regressions passed; runtime exceptions were 0.
- `git diff --check`: PASS. `npm run build`: PASS — 58 pages. Product scope was limited to `controller.ts`; Production unchanged.
- P3-G01-G-FIX targeted defect PASS. Full G completion QA remains required. Next: P3-G01-G-VERIFY.
## 2026-09-25 — P3-G01-G Verification — FIX REQUIRED

- Pulse Junction 최종 QA를 `pivot/web-games-mvp`에서 수행했다. 제품 소스는 수정하지 않았고, 임시 QA 검증 파일은 실행 후 제거했다.
- 정적 검증: route/metadata/VideoGame JSON-LD, 접근성 기본 구조, 공개 카피, 20-round result schema, threshold/difficulty/RNG/motion 로직을 확인했다.
- 브라우저 검증: desktop/mobile/320px overflow, pointer/touch, Space, multi-input dedupe, pointer+Space dedupe, stale pointer pause/resume, ACTIVE/FEEDBACK pause, 20회 Miss 결과, localStorage best, Play Again, reduced-motion 및 responsive 상태 보존을 확인했다.
- 필수 stale-pointer 재현: pointerId 1 미해제 → hidden pause → visible/resume → pointerId 2 입력 후 정상 FEEDBACK을 확인했다.
- 검증: `git diff --check` PASS, `npm run build` PASS, 58페이지 생성. 핵심 Pulse Junction 런타임 JS exception은 없었으나 브라우저 console에 반복된 404 리소스 오류 7건이 확인되어 console-errors gate를 PASS 처리하지 않았다.
- 상태: `P3-G01-G INCOMPLETE` — `P3-G01-G-FIX-2 REQUIRED`.
- 후속: 404 리소스의 정확한 요청 대상을 확인하고 허용 범위 내 수정 후 P3-G01-G를 재검증한다.
## 2026-09-26 — P3-G01-G 404 Resource Fix

- branch: `pivot/web-games-mvp`; previous HEAD: `8838a9bfbb665c6c80d16ce0c66032b74a0dcc7c`.
- CDP Network capture before fix: `http://127.0.0.1:4325/favicon.ico`, path `/favicon.ico`, status `404`, method `GET`, resource type `Other`, 5 occurrences across 5 clean reloads. No other 4xx/5xx resources were captured.
- root cause confirmed: `GameLayout.astro` lacked an explicit icon declaration, so the browser fallback requested `/favicon.ico`; that file does not exist. Existing intended asset `public/favicon.svg` was present.
- minimal fix: added exactly `<link rel="icon" href="/favicon.svg" type="image/svg+xml" />` to `src/layouts/GameLayout.astro`. No new asset was created and `BaseLayout.astro` was unchanged.
- targeted after-fix CDP Network capture: 5 reloads produced zero page-caused 404/5xx requests; `/favicon.svg` returned `200`; no `/favicon.ico` request remained.
- smoke QA: route, title, H1, canonical, VideoGame schema, favicon link, Start, ACTIVE, pointer FEEDBACK, Space path, and runtime exceptions passed. Metadata behavior was preserved.
- 검증: `git diff --check` PASS, `npm run build` PASS, 58 pages. Dependencies, game source, scoring, input, storage, renderer, DPR, responsive behavior, privacy, redirects, Cloudflare, DNS, Production은 변경하지 않았다.
- 상태: `P3-G01-G-FIX-2 targeted issue PASS`.
- 다음 단계: `P3-G01-G-VERIFY-2 — final short completion verification after 404 fix`.
## 2026-09-26 — P3-G01-G Final Completion Verification

- branch: `pivot/web-games-mvp`; base HEAD: `cc0fa0a52ea636050b3e8513dd71d7fb6366e5de`.
- QA-only verification completed with Chrome headless, Node 24, and CDP. Product source remained unchanged; temporary QA scripts were removed before completion.
- Network/console: 5 clean reloads plus Start, gameplay, pause/resume, and result smoke produced 0 page-caused 404s, 0 5xx, `/favicon.svg` 200, no `/favicon.ico` request, 0 runtime exceptions, and 0 blocking console/log errors.
- Gameplay: countdown, desktop/mobile pointer, Space, keyboard Start-to-gameplay Space, pointer+Space dedupe, multi-touch, stale-pointer regression, ACTIVE pause, FEEDBACK pause, delayed score commit, positive score, and 20-round RESULT passed.
- Session/state: Play Again mouse and keyboard, valid/invalid best storage, 320px responsive layout, DPR 1/2/3 cap, resize/orientation, reduced motion, and multi-session smoke passed.
- Accessibility/metadata: `lang=en`, one H1, skip link, accessible canvas/buttons, live regions, result `dl/dt/dd`, focus indicators, canonical, VideoGame JSON-LD, and favicon metadata passed.
- 검증: `git diff --check` PASS, `npm run build` PASS, 58 pages. Privacy browser-storage policy review remains a pre-Production follow-up.
- 상태: `P3-G01-G FINAL PASS` — `Pulse Junction COMPLETE`.
- Production/main/Cloudflare/DNS는 변경하지 않았다.
- 다음 단계: `P3-G02-A — Mirror Drift final specification / route / file implementation plan only`.
## 2026-09-26 — P3-G02-A Mirror Drift Final Specification / Route / File Implementation Plan

- branch: `pivot/web-games-mvp`; base HEAD: `308b3474036bb2c64b1d7c174c211be6c246293b`.
- planning-only task. Product source, route, game code, CSS, dependencies, main, redirects, Cloudflare, DNS, and Production were not modified.
- catalog contract confirmed in `src/data/games.ts`: `Mirror Drift`, slug `mirror-drift`, href `/games/mirror-drift/`, Puzzle, Solo, `1–2 min`, with the frozen mirrored-point description.
- pre-B route/file state confirmed absent: `src/pages/games/mirror-drift.astro`, `src/components/games/MirrorDriftGame.astro`, `src/games/mirror-drift/`, and `src/styles/games/mirror-drift.css`. Build remains 58 pages before P3-G02-B.
- frozen MVP: 12 fixed stages; normalized A/B reflection `B = -A`; Canvas plus HTML HUD; mobile portrait primary; circle/AABB static obstacles; swept A and B collision; 150ms target hold; 8–18 second stage limits; no RNG, audio, external assets, account, server, analytics, or Related Games.
- geometry contract: `DOT_RADIUS=0.035`, `TARGET_RADIUS=0.075`, effective center tolerance `0.040`; board clamp accounts for dot radius; `targetB=-targetA`, `startB=-startA`; contact counts as collision; A and B never collide with each other; collision uses continuous swept segment tests against expanded circles/AABBs.
- timing/state contract: ACTIVE alone consumes monotonic attempt time; collision/timeout records one strike with collision winning same-frame ties; retries reset stage timer/start while preserving accumulated strikes; target hold must remain continuously valid for 150ms; clear commits once before feedback.
- score/result contract: stage score is `max(100, 500 + min(500, floor(remainingMs/100)*5) - 100*stageStrikes)`; Fastest Clear is the lowest ACTIVE elapsed time of a successful attempt in the session; RESULT shows Total Score, Total Strikes, Fastest Clear, Best Score, and Fewest Strikes.
- storage contract: key `emfls:mirror-drift:best:v1`; shape `{score:number, fewestStrikes:number|null}`; safe validation and try/catch; only completed 12-stage sessions update independent best values; Play Again resets session/stage/drag/timer while preserving bests.
- input/lifecycle contract: Pointer Events only; 44px acquisition area; pointer offset preserved; pointer capture and one active pointer; pointercancel/lost capture has no strike; active orientation change cancels drag and restarts stage; hidden ACTIVE/transient states pause without auto-resume; Resume restarts the appropriate intro and cannot double-score clear feedback.
- frozen states/timing: `IDLE`, `STAGE_INTRO`, `ACTIVE`, `FAIL_FEEDBACK`, `CLEAR_FEEDBACK`, `PAUSED`, `RESULT`; intro 600ms, target hold 150ms, fail/clear feedback 400ms, DPR cap 2.
- frozen ownership plan: route `src/pages/games/mirror-drift.astro`; UI `src/components/games/MirrorDriftGame.astro`; CSS `src/styles/games/mirror-drift.css`; modules `types.ts`, `stages.ts`, `geometry.ts`, `logic.ts`, `renderer.ts`, `input.ts`, `storage.ts`, `controller.ts` under `src/games/mirror-drift/`; no `rng.ts`.
- frozen sequence: P3-G02-B shell/state structure only; C fixed stages/geometry/renderer/timer core; D pointer drag/capture/offset/multi-touch/pause lifecycle; E strikes/scoring/result/storage; F responsive/DPR/accessibility polish; G complete solvability and regression QA.
- privacy follow-up: optional Mirror Drift browser best storage requires Privacy Policy review/update before Production; no Privacy change in A.
- status: `P3-G02-A PLAN RECORDED`.
- next: `P3-G02-B — Mirror Drift empty route / UI shell / state structure only`.
## 2026-09-26 — P3-G02-B Mirror Drift Game Shell

- branch: `pivot/web-games-mvp`; previous HEAD: `7dee7bb272ceabc2b04c4f840665103349fd52a2`; implementation: `a99888c8cfe0a7b6463e00e4254ab1c99deb7c97`.
- added canonical `/games/mirror-drift/` by reusing the existing catalog record and `GameDetailFrame`; public game copy is English only and no Related Games slot was added.
- added the empty Canvas shell, accessible name, Stage/Score/Strikes/Time HUD, seven state type values, and six overlay panels; ACTIVE deliberately has no panel.
- shell flow: IDLE Start enters `STAGE_INTRO` for 600ms then ACTIVE; duplicate Start is ignored. Resume and Play Again handlers exist only for future states and no fail/clear/pause/result state is naturally reachable yet.
- no mechanics added: no reflection geometry, stage data, obstacles, input, timer, target hold, strikes, scoring, storage, renderer, visibility/orientation lifecycle, analytics, ads, or audio.
- runtime QA: desktop, 390px, and 320px had readable shell/no horizontal overflow; Start transition passed; title/canonical/VideoGame schema/accessibility structure passed; page-caused 404/5xx, runtime exception, and blocking console error counts were zero.
- validation: `git diff --check` PASS, `npm run build` PASS, 59 pages. Production unchanged.
- status: `P3-G02-B implemented`.
- next: `P3-G02-C — fixed stages / pure geometry / swept collision / renderer / timer-target-hold core only`.
## 2026-09-26 — P3-G02-C Mirror Drift Core Geometry

- branch: `pivot/web-games-mvp`; previous HEAD: `87aea28e47913486889c2f990fa5c4401b0a1400`; implementation: `a8721b3c4996ab9682634c586cc400d687cd2df8`.
- added 12 literal fixed stages with IDs 1–12, phases `LEARN`, `SPLIT`, `CORRIDOR`, `OFFSET`, `PRECISION`, `FINAL`, fixed 8–18 second limits, and `solutionPathA` for every stage. No generator or RNG exists.
- geometry: normalized [-1, 1] board, `B=-A`, `DOT_RADIUS=0.035`, `TARGET_RADIUS=0.075`, effective target tolerance `0.040`, board clamp, target containment, circle/bar contact collision, continuous swept segment tests, and explicit A+B pair collision results. A/B never collide with each other.
- fixed-stage validator passed all 12 stages and temporary negative assertions for bad time, wrong solution endpoint, colliding solution, out-of-bounds start, and ID/order mismatch.
- timer/hold core: monotonic `performance.now()` attempt timing, remaining-time helper/display, continuous 150ms target hold with reset on exit, and 149ms/150ms boundary assertions. At timer zero C remains ACTIVE with no strike/failure transition; timeout commit is deferred to P3-G02-E.
- renderer: Canvas-only normalized projection with solid A, hollow B, corresponding targets, static circle/bar obstacles, center marker, relationship line, and hold highlight. Solution paths are not rendered. No DPR backing synchronization yet.
- controller now prepares Stage 1, starts one ACTIVE rAF loop after the existing intro, renders the fixed model, updates Time, and cleans up timeout/rAF/renderer. No pointer input, capture, visibility/orientation lifecycle, failure commit, scoring, result logic, or storage was added.
- runtime QA: initial IDLE, Stage Intro, ACTIVE rendering, decreasing time, unchanged A/B/score/strikes/stage, desktop/390/320 sanity, and zero page-caused 404/5xx/runtime/console errors passed.
- validation: `git diff --check` PASS, `npm run build` PASS, 59 pages. Temporary QA route/scripts were deleted. Production unchanged.
- status: `P3-G02-C implemented`.
- next: `P3-G02-D — Mirror Drift Pointer drag / capture / offset / multi-touch / swept movement integration / pause-orientation lifecycle only`.
## 2026-09-26 — P3-G02-D Mirror Drift Drag Input and Lifecycle

- 목적: `pivot/web-games-mvp`의 Mirror Drift P3-G02-D 범위인 Pointer Events 드래그 입력, pointer capture, 다중 터치 배제, 충돌 후보 거부, pause/resize/orientation lifecycle을 구현했다.
- 구현 커밋: `790fccf` (`feat: add Mirror Drift drag input`).
- 변경 파일: `src/games/mirror-drift/input.ts`, `src/games/mirror-drift/controller.ts`, `src/styles/games/mirror-drift.css`.
- 입력 계약: A dot만 primary pointer로 취득하고 최소 44 CSS px hit target을 적용했다. client 좌표를 정규화 좌표로 변환하고 pointer offset을 보존하며, pointer capture와 pointerup/pointercancel/lostpointercapture/manual cancel/destroy 정리를 구현했다. `touch-action: none`은 Mirror Drift canvas에만 적용했다.
- 이동 계약: 기존 clamp와 A+B swept collision helper를 사용한다. 충돌 후보는 마지막 안전 위치를 유지한 채 drag를 계속하고, B-only 및 tunneling 후보도 같은 경로에서 거부한다. strike/fail/scoring/storage/stage progression은 구현하지 않았다.
- lifecycle: `visibilitychange` hidden에서 ACTIVE/STAGE_INTRO를 PAUSED로 전환하고 자동 재개하지 않는다. active drag 중 resize/orientationchange는 pointer를 취소하고 STAGE_INTRO부터 재시작하며, 비드래그 resize는 상태를 유지한다. 숨겨진 Mirror Drift overlay가 canvas 입력을 가리지 않도록 scoped `[hidden]` display rule을 추가했다.
- 검증: `git diff --check` PASS, `npm run build` PASS, 59페이지 생성. 로컬 브라우저에서 실제 Pointer Events/capture, pointerup/cancel, multi-touch rejection, collision rejection, visibility pause/resume, resize/orientation restart, 390/320 viewport overflow 및 console/network 오류 부재를 확인했다.
- 상태: P3-G02-D 구현 완료. 다음 단계는 P3-G02-E다.
## 2026-09-26 — P3-G02-E Mirror Drift Scoring and Results

- branch: `pivot/web-games-mvp`.
- previous HEAD: `541f55fd8470d27ac76fcd850c9adc958f4e86e5`.
- implementation: `efeb89792386789ceb3599145e75019af3fdb0af` (`feat: add Mirror Drift scoring and results`).
- 변경 파일: `src/games/mirror-drift/types.ts`, `src/games/mirror-drift/logic.ts`, `src/games/mirror-drift/storage.ts`, `src/games/mirror-drift/controller.ts`.
- failure/strikes: `COLLISION`과 `TIMEOUT`만 strike reason으로 사용한다. collision이 timeout보다 우선하며, 실패당 한 번만 `stageStrikes`와 cumulative `totalStrikes`를 증가시킨다. collision은 `Hit`, timeout은 `Time`이고 FAIL feedback은 `FAIL_FEEDBACK_MS` 400ms다. retry는 같은 stage이며 stageStrikes/totalStrikes/session score를 보존한다.
- clear/scoring: `TARGET_HOLD_MS` 150ms를 연속 만족하면 clear를 한 번 commit한다. logical clear timestamp는 hold 시작 + 150ms이며, clear timestamp가 deadline 이전 또는 정확히 같으면 CLEAR, 이후면 TIMEOUT이다. stage score는 `max(100, 500 + min(500, floor(remainingMs / 100) * 5) - 100 * stageStrikes)` 고정식이다. clear score는 session score에 누적하고, 성공한 ACTIVE elapsed만 Fastest Clear 후보로 사용한다. CLEAR feedback은 400ms이며 `+stageScore`를 표시한다.
- progression/result: stage 1→12를 진행하고 새 stage에서만 stageStrikes를 0으로 reset한다. stage 12 clear feedback 뒤 stage 13 없이 RESULT로 간다. RESULT에는 Total Score, Total Strikes, Fastest Clear, Best Score, Fewest Strikes를 표시한다. Play Again은 session/stage를 초기화하고 best stats는 보존한다.
- storage: key는 `emfls:mirror-drift:best:v1`, JSON shape은 `{ score, fewestStrikes }`뿐이다. score/fewestStrikes 검증, malformed JSON, undefined storage, getItem/setItem throw를 모두 안전 fallback/no-op 처리한다. Best Score와 Fewest Strikes는 독립적으로 비교하며, 완료된 12-stage session의 RESULT 경로에서만 저장한다. session 복원은 하지 않는다.
- lifecycle: ACTIVE/STAGE_INTRO/FAIL_FEEDBACK/CLEAR_FEEDBACK pause continuation을 명시적으로 구분했다. FAIL pause는 같은 stage retry, CLEAR pause는 clear된 stage를 replay하지 않고 다음 stage 또는 RESULT로 이어간다. pointercancel/lost capture/resize/orientation은 기존처럼 no-strike다. feedback timer와 intro/rAF/input/renderer/listener cleanup을 통합했다.
- 검증: pure scoring/storage assertions PASS, 실제 브라우저에서 timeout/collision/feedback/strike dedupe, FAIL/CLEAR visibility pause, pointercancel/resize, under-150ms hold reset, 150ms clear, 두 번의 실제 12-stage session, RESULT, valid/malformed preload, reload, Play Again, page-caused 404/5xx/runtime/console 오류를 확인했다. 최종 `git diff --check` PASS, `npm run build` PASS, 59 pages.
- 금지 범위 유지: `input.ts`, `stages.ts`, `geometry.ts`, `renderer.ts`, component, CSS, route, shared layout/tokens, Pulse Junction, dependency, DPR/responsive polish, audio, ads, analytics, Related Games는 수정하지 않았다.
- 상태: P3-G02-E implemented. Privacy pre-Production storage follow-up remains pending. 다음 단계는 P3-G02-F — Mirror Drift responsive / DPR / accessibility / feedback visual polish only.
## 2026-09-26 — P3-G02-F Mirror Drift Responsive Rendering Polish

- branch: `pivot/web-games-mvp`; previous HEAD: `c3ac2473fb3f31e323d64bc215270128b7806f95`; implementation: `23b1842` (`feat: polish Mirror Drift responsive rendering`).
- changed only `src/games/mirror-drift/renderer.ts`, `src/styles/games/mirror-drift.css`, and `src/components/games/MirrorDriftGame.astro`.
- renderer now separates CSS logical dimensions from backing-store dimensions, caps effective DPR at `DPR_CAP`, synchronizes through `ResizeObserver` plus resize/orientation listeners, rerenders the latest model after size changes, and cleans up observers/listeners on destroy. Dot and target radii use `DOT_RADIUS` and `TARGET_RADIUS`; target hold progress is shown as a success arc for both targets.
- feedback polish uses danger/success/primary semantic tokens, the existing motion tokens, and a reduced-motion rule that disables feedback decoration without disabling the game. Stage intro and failure are atomic polite status regions; clear feedback is one atomic polite status wrapper without nested live regions. Canvas aria-label and native Start/Resume/Play Again controls were preserved.
- responsive CSS keeps the game surface within its container, allows overlay scrolling, and switches the result grid to one column at the narrowest breakpoint so all five metrics remain reachable with Play Again.
- validation: `git diff --check` PASS; `npm run build` PASS — 59 pages; changed-file scope PASS. Local browser smoke confirmed the English route, 320px-scale shell, Start → Stage Intro → ACTIVE transition, and zero observed runtime errors. The connected compact browser did not expose a held-pointer interaction long enough to complete all 12 stages, so the actual 320px RESULT reachability, DPR 1/2 backing-size measurements, and reduced-motion runtime gate remain unverified in this pass.
- status: `P3-G02-F IMPLEMENTED; FINAL QA PARTIAL`.
- next: complete the local capable-browser verification for DPR, responsive RESULT reachability, feedback states, and reduced motion before marking P3-G02-F final PASS.
## 2026-09-26 — P3-G02-F Final Browser Verification

- branch: `pivot/web-games-mvp`; verification base HEAD: `627e34f7a8af62e5ebba9ae7cbe55ab83c386f3e`.
- QA-only verification used Google Chrome headless `Chrome/154.0.8037.57`, Node 24 built-in WebSocket, and Chrome DevTools Protocol. Product source remained unchanged; the temporary QA harness and Chrome profile were removed.
- DPR: at device DPR1, CSS `638×638`, backing `638×638`, ratio `1×`; at DPR2, CSS `638×638`, backing `1276×1276`, ratio `2×`; at device DPR3, CSS `638×638`, backing `1276×1276`, effective ratio `2×`, confirming the cap. Stage 1 cleared through actual Pointer Events at DPR1, DPR2, and DPR3 with no strikes.
- renderer/runtime: steady ACTIVE backing-size mutation count was `0`. Non-drag resize `390×844 → 844×390 → 390×844` preserved ACTIVE, stage `1 / 12`, score `0`, strikes `0`, timer progression, A normalized position `(-0.55,-0.75)`, and B reflection `(0.55,0.75)`. Active-drag resize canceled the drag and restarted `STAGE_INTRO` at stage 1 with no strike. Orientation resync preserved the active state and reflection.
- visual/motion: both target progress arcs were observed before the 150ms clear. Normal Intro used `mirror-drift-feedback-in` at `0.2s`; normal `Hit` resolved to `rgb(180, 69, 69)` with approximately 399ms FAIL feedback; normal CLEAR resolved to `rgb(38, 122, 88)` with approximately 387ms feedback. Reduced motion set Intro/FAIL/CLEAR decorative animation to `none` while Intro remained approximately 626ms, FAIL approximately 376ms, and CLEAR approximately 411ms.
- full session: the actual Stage 1→12 solution paths reached RESULT with Total Score `12000`, Total Strikes `0`, Fastest Clear `0.4 s`, Best Score `12000`, and Fewest Strikes `0`.
- RESULT responsive: 1440px had all fields and Play Again visible with document `scrollWidth/clientWidth` `1425/1425`; 390px had all fields and Play Again visible with `375/375`; 320px used a one-column result grid with overlay `clientHeight/scrollHeight` `284/447`, scroll `0→163`, and Play Again reachable at viewport rect `430.4–474.4`. The 320px document reported `scrollWidth/clientWidth` `320/305` from the existing document minimum width and vertical scrollbar; game surface right edge was `303px`, so no material Mirror Drift overflow was present. At 320px, Play Again keyboard activation entered ACTIVE stage 1 and an actual safe pointer move produced A `(-0.55,-0.75)` / B `(0.55,0.75)` with zero strikes.
- accessibility: canvas label remained `Mirror Drift game area` with no tabindex; Intro, FAIL, and CLEAR had the required atomic polite status semantics with one CLEAR live wrapper; Result retained `dl` with five `dt` and five `dd`; Start, Resume, and Play Again keyboard activation passed. Focus-visible styling was an orange `3px` solid outline on all three native buttons.
- storage/network: `emfls:mirror-drift:best:v1` remained the only key with shape `{\"score\":12000,\"fewestStrikes\":0}` across Play Again and reload. Captured page-caused 4xx/5xx requests: `0`; runtime exceptions: `0`; console errors: `0`; Log errors: `0`.
- final validation: `git diff --check` PASS; `npm run build` PASS — 59 pages; dependencies unchanged; product source unchanged; main, Cloudflare, DNS, and Production unchanged.
- status: `P3-G02-F FINAL PASS`. Privacy pre-Production storage follow-up remains pending.
- next: `P3-G02-G — Mirror Drift full final QA`.
## 2026-09-26 — P3-G02-G Mirror Drift Final Completion QA

- branch: `pivot/web-games-mvp`; base HEAD: `b5c799cee8ac112aef517dda2233ba1dbbac7e43`.
- QA-only completion used Google Chrome headless, Node 24 built-in WebSocket, and Chrome DevTools Protocol. Product source, route source, shared shell, dependencies, `main`, redirects, Cloudflare, DNS, and Production were not modified. Temporary QA scripts, outputs, Chrome profiles, and screenshots were removed before completion.
- route/metadata: `/games/mirror-drift/`, English `lang`, one `Mirror Drift` H1, canonical `https://emfls.com/games/mirror-drift/`, `index, follow`, valid `VideoGame` JSON-LD, and English public copy passed. No Related Games, account, ads, analytics, audio, or external game requests were present.
- stages/geometry: all 12 fixed IDs and phases `LEARN`, `SPLIT`, `CORRIDOR`, `OFFSET`, `PRECISION`, `FINAL` passed the actual validator. Pure and runtime gates passed for reflection, target tolerance `0.040`, circle/bar contact and swept tunneling collision, B-only collision, solution paths, and score/hold/deadline boundary logic.
- input/lifecycle: A-only acquisition, pointer offset, capture, outside-canvas drag, multi-touch rejection, pointerup, pointercancel, lost capture, stale-pointer recovery, active/intro/fail/clear/Stage 12 clear pause, resume continuation, resize/orientation, and duplicate-start protection passed with no strike or double-clear regressions.
- failure/progression: collision and timeout feedback/strike dedupe, collision-over-timeout priority, under-150ms hold reset, 150ms clear, Stage 1→12 progression, no Stage 13, clean session, dirty recovery path, RESULT, Play Again, and multi-session regression passed. Clean RESULT was Total Score `12000`, Total Strikes `0`, Fastest Clear observed, Best Score `12000`, Fewest Strikes `0`.
- storage: key `emfls:mirror-drift:best:v1`, valid/malformed/independent-best paths, safe failure behavior, reload preload, and write timing passed. A clean 12-stage session produced exactly one best-stat write at RESULT.
- responsive/accessibility: DPR1/2/3 cap, 1440px, 390px, 320px, orientation, game-surface overflow, native keyboard activation, focus indicator, canvas name, live-region semantics, result `dl` semantics, reduced motion, and non-color visual distinction passed. At 320px the document scrollbar/min-width was pre-existing; the game surface remained within the client width.
- network/console: page-caused 4xx/5xx `0`, runtime exceptions `0`, `console.error` `0`, and Log errors `0`.
- validation: `git diff --check` PASS; `npm run build` PASS — 59 pages; allowed final change is this history entry only. Privacy Policy browser-storage review remains a pre-Production follow-up.
- status: `P3-G02-G FINAL PASS` — `Mirror Drift COMPLETE`.
- next: `P3-G03-A — Gravity Pact final specification / route / file implementation plan only`.
## 2026-09-26 — P3-G03-A Gravity Pact Final Implementation Plan

- branch: `pivot/web-games-mvp`; base HEAD: `1c1199d03ca64b54e9e67dbbd990400518d523ec`.
- planning-only task. Product source, routes, components, CSS, dependencies, shared shell, catalog, Pulse Junction, Mirror Drift, main, redirects, Cloudflare, DNS, and Production remain unchanged.
- catalog identity is frozen from `src/data/games.ts`: `Gravity Pact`, slug `gravity-pact`, href `/games/gravity-pact/`, description `Take turns choosing gravity and move every token on the shared board.`, category `Strategy`, mode `Local 2 Player`, session `2–4 min`. The canonical route is `/games/gravity-pact/`; English-only, no language switcher, no Related Games until P4-01.
- current route/component/CSS/module paths are absent. Future B is expected to add exactly one detail route and raise the build from 59 to 60 pages; A adds no route.
- product identity is a local two-player short strategy board game for two people sharing one screen, mobile portrait primary and desktop secondary. It uses a DOM Grid, with no login, account, server, external API, external art, external audio, AI, online multiplayer, ads, analytics, or persistence.
- public copy meaning is frozen. How to Play: `Players take turns choosing a direction. Every active token — yours and your opponent's — tries to move one cell in that screen direction. Guide all three of your tokens into your goal cells before your opponent does.` Controls: `Mobile: use the shared arrow pad below the board. Desktop: use the arrow pad or the Arrow Keys. Directions are always relative to the screen.` Scoring: each matching token scores 1 and leaves the board; first to 3 wins; simultaneous 3 is a draw; after 30 legal moves or stalemate, higher score wins and ties draw.
- board contract: `BOARD_SIZE = 5`; rows/columns are 0–4; row 0 is top, row 4 bottom, col 0 left, col 4 right; screen-relative directions are UP row -1, DOWN row +1, LEFT col -1, RIGHT col +1. Player types are `A | B`; exactly three active tokens per player.
- starts are fixed: A `(4,1)`, `(4,3)`, `(3,2)`; B `(0,1)`, `(0,3)`, `(1,2)`. Goals are A `(0,0)`, `(0,2)`, `(0,4)` and B `(4,0)`, `(4,2)`, `(4,4)`. A scores only on A goals and B only on B goals; opponent goals are passable non-scoring cells; starts/goals can never be blocked.
- movement contract: the selected direction applies globally to every active A and B token; each moves 0 or 1 cell; tokens cannot overlap, enter blocks, leave the board, push, swap, jump, or be selected individually. Resolve leading edge before trailing edge: UP/DOWN row order toward the leading edge, LEFT/RIGHT col order toward the leading edge; ties use the secondary coordinate ascending. Vacated-cell chains may advance one cell; a blocked leading token prevents trailing displacement. A direction is legal iff at least one token changes cell; illegal input causes no movement, score, turn increment, switch, animation, or fake feedback.
- movement/scoring order is fixed: receive direction → calculate deterministic whole-board resolution → determine legal/illegal → freeze result → resolve simultaneous scoring after all movement → remove all scored tokens simultaneously → update scores → evaluate 3-point win/draw → evaluate turn limit → switch player once → calculate next legal directions → resolve stalemate if none. Scored tokens remain in `afterMoveTokens` for presentation before removal and never move again in the same turn.
- layouts: exactly six literal layouts with IDs 1–6, each 0–4 valid blocked cells, no duplicates, in-board coordinates, no start/goal overlap, and 180-degree symmetry `(row,col) → (4-row,4-col)`. No procedural generation. Each layout must have at least two initial legal directions and reachable scoring possibilities for both players; P3-G03-G also checks both starters for trivial forced-win bias. Development witness sequences remain QA-only and are not public.
- selection/randomness: first layout is uniform among six valid layouts; rematch chooses uniformly among the other five and never immediately repeats; first starter is 50:50 A/B; each rematch starter is the opposite of the previous match's starter, independent of winner/loser/last mover. Use `type RandomSource = () => number` with default `Math.random`; no seed or persistence.
- scoring/terminal contract: scores remain 0–3; simultaneous scoring is allowed; after scoring, A=3 and B=3 is highest-priority `Draw`, otherwise the player at 3 wins. `MAX_TURNS = 30` counts legal moves only. On legal move 30, movement → scoring → 3-point terminal priority → score-based A/B/Draw turn-limit result. Stalemate at the beginning of a turn ends without adding a turn and resolves by score.
- state machine is exactly `IDLE`, `MATCH_INTRO`, `TURN`, `MOVING`, `SCORE_FEEDBACK`, `PAUSED`, `RESULT`. `MATCH_INTRO_MS = 700`; normal move presentation `MOVE_MS = 220`; reduced-motion presentation `REDUCED_MOVE_MS = 80`; score feedback `SCORE_FEEDBACK_MS = 400`. Logic is fully resolved before animation; animation/transition events never determine rules. Non-scoring flow is TURN → MOVING → TURN; scoring flow adds SCORE_FEEDBACK; terminal flow goes directly to RESULT; immediate stalemate is TURN → RESULT.
- lifecycle contract: hidden TURN pauses without changing board/player/score/turns/layout; hidden MOVING cancels visuals but retains one immutable pending resolution, and Resume snaps/commits it exactly once without replay; hidden SCORE_FEEDBACK pauses after score commit and Resume advances directly to TURN; visibility alone never auto-resumes. TURN resize/orientation preserves logical state; MOVING resize/orientation snaps and commits the frozen resolution once. Start is accepted only from IDLE; Play Again clears match state, excludes the previous layout, flips the previous starter, and enters MATCH_INTRO.
- input contract: mobile uses real 44×44+ arrow buttons below the board; desktop supports the same pad plus ArrowUp/Down/Left/Right; directions remain screen-relative. Ignore `event.repeat`; prevent active recognized arrow page scrolling; guard input/textarea/select/contenteditable and unrelated links/buttons; accept directions only in TURN; ignore during all other states; double input during MOVING cannot create another move; Space/Enter/WASD are not gameplay shortcuts.
- renderer/accessibility contract: DOM 5×5 grid, no Canvas/DPR logic. A uses a circle with inner dot; B uses a diamond with inner line; goals reuse those non-color motifs; blocks use hatch/wall/crosshatch structure; current turn is exposed as text (`Player A Turn`/`Player B Turn`); HUD exposes A/B scores, Turns N/30, and Layout 1–6. Native buttons, focus, live/status semantics, reduced motion, and non-color distinctions are required.
- file ownership is frozen: route `src/pages/games/gravity-pact.astro`; component `src/components/games/GravityPactGame.astro`; CSS `src/styles/games/gravity-pact.css`; modules `types.ts`, `layouts.ts`, `movement.ts`, `logic.ts`, `input.ts`, `renderer.ts`, `controller.ts` under `src/games/gravity-pact/`. `types.ts` owns domain types/constants; `layouts.ts` owns six literal layouts/validator/witnesses; `movement.ts` owns pure one-cell deterministic movement/legal directions; `logic.ts` owns scoring/terminal/player/random selection; `input.ts` owns button/arrow normalization, guards, repeat/input lock, cleanup; `renderer.ts` owns DOM presentation/snap; `controller.ts` owns orchestration, immutable pending moves, timing, lifecycle, result, cleanup. Do not create `storage.ts`, `rng.ts`, `audio.ts`, or `network.ts`.
- microtask boundaries are fixed: B route/GameDetailFrame shell, empty 5×5 board, HUD, direction pad, seven panels, structural controls, controller skeleton, and shell types only; C literal layouts/validator/pure movement/legal directions/witness QA only; D pad/Arrow Keys/guards/DOM renderer/220ms movement/input lock/basic non-scoring turns/visibility/orientation movement lifecycle only; E scoring/removal/3-point win/draw/maxTurns/stalemate/random selection/feedback/RESULT/Play Again only; F responsive/reduced-motion/accessibility/non-color visual polish only; G full six-layout/local-two-player/fairness/regression QA only.
- verification after this planning entry must show exactly `PROJECT_HISTORY.md` changed, `git diff --check` PASS, `npm run build` PASS with 59 pages, Gravity Pact route still absent, and no dependency changes. Commit is `docs: plan Gravity Pact implementation`; push only `pivot/web-games-mvp`.
- status: `P3-G03-A PLAN RECORDED`.
- next: `P3-G03-B — Gravity Pact route / shell / seven-state DOM structure only`.

## 2026-09-26 — P3-G03-B Gravity Pact Game Shell

- branch: `pivot/web-games-mvp`; previous HEAD: `9965f398af2d8ad1d416236fc1f2cbc08dcaf300`; implementation: `7a909a116e4a93f257ecc3a65947ef54626fadd2` (`feat: add Gravity Pact game shell`).
- created the canonical `/games/gravity-pact/` route using the `games.ts` catalog lookup and `GameDetailFrame`. H1, title, canonical, English-only public copy, Strategy metadata, and VideoGame JSON-LD are catalog/frame-driven. No Related Games slot was added.
- created `GravityPactGame.astro` with root hooks `data-gravity-pact` and `data-state`, a 5×5 empty DOM Grid with exactly 25 cells, row/column structure 0–4, no token/goal/block data, HUD fields for Player A, Player B, Turns, and Layout, visible turn status, and a shared direction pad of four native buttons.
- all direction buttons are real 44×44px minimum controls and remain natively disabled in B. No direction handlers, Arrow Key handlers, keyboard gameplay, movement, legal-direction calculation, layout data, token positions, goals, blocks, randomness, scoring, terminal logic, visibility lifecycle, orientation lifecycle, storage, audio, ads, analytics, or Related Games were added.
- added the exact seven-state union `IDLE`, `MATCH_INTRO`, `TURN`, `MOVING`, `SCORE_FEEDBACK`, `PAUSED`, `RESULT`, plus `BOARD_SIZE = 5`, `MAX_TURNS = 30`, `MATCH_INTRO_MS = 700`, `MOVE_MS = 220`, `REDUCED_MOVE_MS = 80`, and `SCORE_FEEDBACK_MS = 400`.
- controller scope is shell-only: required element validation with an explicit error, state/panel synchronization, structural HUD/result synchronization, Start accepted only from IDLE, placeholder Layout 1 and Player A, one 700ms intro timeout into TURN, duplicate Start guard, structural Resume from PAUSED, structural Play Again from RESULT, and timeout/listener cleanup. Placeholder starter/layout are not real selection or rematch logic; those remain deferred to E.
- responsive shell uses shared game tokens, a square 5×5 grid, 4-column desktop HUD, 2×2 mobile HUD, non-blocking TURN/MOVING/SCORE_FEEDBACK status structure, overlay panels for IDLE/MATCH_INTRO/PAUSED/RESULT, native result `dl/dt/dd`, and no focusable empty cells.
- runtime QA with Chrome headless, Node 24, and CDP passed initial IDLE, one Start flow, duplicate Start activation, 700ms MATCH_INTRO → TURN, disabled direction clicks, unhandled Arrow Keys, 1440×900, 390×844, and 320×700. Board remained square, controls remained visible, and horizontal overflow was absent at all three viewports. Page-caused 404/5xx responses, runtime exceptions, and console errors were all 0.
- implementation validation: temporary TDD shell contract observed RED on the absent route, then GREEN after the five product files were added. `git diff --check` PASS; `npm run build` PASS — 60 pages, exactly one new route versus A; dependencies unchanged. Temporary QA files and browser profile were removed.
- product files are exactly `src/pages/games/gravity-pact.astro`, `src/components/games/GravityPactGame.astro`, `src/styles/games/gravity-pact.css`, `src/games/gravity-pact/types.ts`, and `src/games/gravity-pact/controller.ts`; no C/D/E/F/G modules were created.
- status: `P3-G03-B IMPLEMENTED`.
- next: `P3-G03-C — six fixed layouts / validator / deterministic global movement / legal directions / witness QA only`.

## 2026-09-26 — P3-G03-C Gravity Pact Movement Core

- branch: `pivot/web-games-mvp`; previous HEAD: `2e5848d8b994927dacb44a5116283174e31578bf`; implementation: `bc547269a08b69f4887bbc3464e39b5dc1e24add` (`feat: add Gravity Pact movement core`).
- product maturity remains `SHELL`. C adds pure domain mechanics only; no controller, route, component, CSS, DOM token rendering, input integration, or browser gameplay was added.
- expanded `types.ts` with `Direction` (`UP`, `DOWN`, `LEFT`, `RIGHT`), stable `DIRECTIONS`, `Cell`, exact token IDs `A1`–`A3`/`B1`–`B3`, `Token`, `BoardLayoutId`, `BoardLayout`, `TokenMove`, and pre-scoring `MoveResolution`. Existing seven states and timing/board constants remain unchanged.
- exact shared starts: A `(4,1)`, `(4,3)`, `(3,2)`; B `(0,1)`, `(0,3)`, `(1,2)`. Exact goals: A `(0,0)`, `(0,2)`, `(0,4)`; B `(4,0)`, `(4,2)`, `(4,4)`. Initial token order is `A1`, `A2`, `A3`, `B1`, `B2`, `B3`.
- exact six layouts: L1 `[]`; L2 `[(2,2)]`; L3 `[(2,1),(2,3)]`; L4 `[(1,1),(3,3)]`; L5 `[(1,0),(3,4),(1,4),(3,0)]`; L6 `[(2,0),(2,4),(1,3),(3,1)]`. All have 0–4 blocks, exact IDs/order, no start/goal collision, and 180-degree symmetry. All six have four initial legal directions.
- `layouts.ts` exports immutable starts, goals, initial tokens, layouts, exact twelve development witnesses, structural layout validation, and witness validation. Validator covers count/order, coordinate format, duplicates, block count, starts/goals, symmetry, and initial legal directions through the actual movement engine.
- `movement.ts` is pure and browser-independent. It provides board bounds, deterministic cell keys/deltas, malformed-state assertions, global A+B movement, one-cell maximum movement, positional leading-edge order (`UP` row asc/col asc; `DOWN` row desc/col asc; `LEFT` col asc/row asc; `RIGHT` col desc/row asc), vacated-cell chains, block/edge/occupancy protection, immutable snapshots, legal resolution, and stable `UP/DOWN/LEFT/RIGHT` legal-direction reuse.
- scoring is intentionally not part of C. Tokens landing on goals remain in `afterMoveTokens`; no score delta, removal, winner/draw, max-turn, stalemate, randomness, or rematch logic exists.
- exact witness sequences validated: L1 A `DOWN UP LEFT LEFT UP UP UP`, B `UP DOWN LEFT LEFT DOWN DOWN DOWN`; L2 A `UP UP LEFT UP UP RIGHT`, B `DOWN DOWN LEFT DOWN DOWN RIGHT`; L3 A `UP LEFT UP RIGHT UP UP`, B `DOWN LEFT DOWN RIGHT DOWN DOWN`; L4 A `LEFT UP RIGHT UP UP`, B `LEFT LEFT DOWN DOWN DOWN`; L5 A `UP UP UP LEFT UP RIGHT`, B `DOWN DOWN DOWN LEFT DOWN RIGHT`; L6 A `LEFT LEFT UP UP UP`, B `LEFT DOWN RIGHT DOWN DOWN`. Every step is legal, prefix states have no matching goal, occupancy stays unique, each move has Manhattan distance 1, and expected final scoring IDs pass: A `A2/A2/A1/A3/A2/A3`, B `B2/B2/B1/B3/B2/B3` for layouts 1–6.
- pure QA rejected wrong count/order, outside/non-integer/duplicate blocks, blocked starts/goals, more than four blocks, missing rotational partner, and fewer-than-two-initial-legal-direction fixtures. Custom chain, three-token chain, blocked chain, edge chain, block collision, mixed A+B movement, all four ordering cases, malformed token state, and input immutability checks passed.
- runtime shell regression passed after C: Gravity Pact remains IDLE → 700ms MATCH_INTRO → TURN with 25 empty cells, no token/goal/block data, four disabled direction buttons, and Arrow Keys unhandled. Page-caused 404/5xx responses, runtime exceptions, and console errors were all 0.
- validation: temporary pure-QA and browser harnesses were deleted; `git diff --check` PASS; `npm run build` PASS — 60 pages; no new route; dependencies unchanged; controller/route/component/CSS unchanged; Production/main/Cloudflare/DNS unchanged.
- status: `P3-G03-C IMPLEMENTED; MATURITY REMAINS SHELL`.
- next: `P3-G03-D — direction buttons / Arrow Keys / DOM renderer / movement animation / input lock / visibility-orientation movement lifecycle only`.

## 2026-09-27 — P3-G03-D Gravity Pact Interactive Movement

- branch: `pivot/web-games-mvp`; previous HEAD: `c03afc208b6db91fa06843f4d0717b45ecc9a9d8`; implementation: `7357d345b8637b13e4c573ad1218b7e61d8ad1f6` (`feat: add Gravity Pact interactive movement`).
- product maturity remains `SHELL`; the fixed Layout 1 / Player A placeholder now renders the six goals and six active tokens in the existing 5×5 DOM Grid. A tokens use a circle/inner dot, B tokens use a diamond/inner line, goals use the same structural motifs with dashed goal outlines, and blocks use a hatch pattern. The token layer is presentation-only and the logical source remains the immutable controller token snapshots.
- added `src/games/gravity-pact/input.ts` for native direction-button clicks, ArrowUp/Down/Left/Right mapping, repeat suppression, editable/unrelated-interactive guards, TURN-only input lock, legal-direction checks, page-scroll prevention for handled arrows, and listener cleanup.
- added `src/games/gravity-pact/renderer.ts` for `BoardLayout` goal/block cell marking, token positioning from logical row/column coordinates, frozen `MoveResolution` animation, snap/cancel behavior, all-six-layout support, and renderer cleanup. No renderer-derived gameplay state or movement legality was introduced.
- integrated the existing `resolveMovement()` and `getLegalDirections()` engine. Legal directions enable native buttons; illegal directions remain disabled. A legal move freezes `MoveResolution` before animation, uses `MOVE_MS` 220ms or `REDUCED_MOVE_MS` 80ms from `matchMedia`, increments legal turns once, and switches A↔B once. Illegal input, duplicate input during MOVING, and all scoring/removal/result behavior remain inactive.
- lifecycle integration: hidden TURN enters PAUSED without changing logical state and requires Resume; hidden MOVING cancels its timer/visual transition while retaining the immutable pending resolution; Resume snaps and commits it exactly once without replay. Resize/orientation during TURN preserves state; during MOVING it snaps and commits once, with duplicate resize/orientation events unable to double-commit. Cleanup clears intro/move timers, input, renderer, visibility, viewport, and shell listeners.
- QA: temporary actual-module/browser QA passed initial IDLE → MATCH_INTRO → TURN, six tokens/goals, legal button movement, global A+B movement, ArrowLeft movement, repeat guard, unrelated-control guard, TURN pause/resume, MOVING pause/resume, stale-timer protection, resize/orientation single commit, reduced-motion short movement, score/result inactivity, and renderer Layout 1/2/5/6 block counts. Temporary QA route and scripts were deleted before commit.
- validation: `git diff --check` PASS; `npm run build` PASS — 60 pages; dependencies unchanged; no new route; final product diff is exactly the five D files. Pulse Junction, Mirror Drift, games catalog, shared shell, main, Cloudflare, DNS, and Production remain unchanged.
- status: `P3-G03-D IMPLEMENTED; MATURITY REMAINS SHELL`.
- next: `P3-G03-E — Gravity Pact scoring / simultaneous removal / win-draw / maxTurns / stalemate / match selection / SCORE_FEEDBACK / RESULT / Play Again`.

## 2026-09-27 — P3-G03-E Gravity Pact Complete Match Loop

- branch: `pivot/web-games-mvp`; previous HEAD: `0754342c575ce7f89db771f24c752aa1123bc971`.
- implementation: `aad016c2a180d3b099d439cdc57fd2f336e35d53` (`feat: complete Gravity Pact match loop`).
- changed product files: `src/games/gravity-pact/logic.ts`, `src/games/gravity-pact/types.ts`, and `src/games/gravity-pact/controller.ts` only. Temporary QA artifacts were removed before the history change.
- maturity advanced from `SHELL` to `PLAYABLE` because an actual browser controller match started, committed moves, reached RESULT, and Play Again started a valid non-repeating rematch. `QA_PASS`, `RELEASE_READY`, and `COMPLETE` were not claimed.
- scoring scans the complete post-movement snapshot, supports same-player multi-score and simultaneous A+B score, removes all scored tokens together after movement, rejects score overflow above 3, and exposes actual `+delta` feedback for `SCORE_FEEDBACK_MS = 400`.
- terminal rules cover A3 win, B3 win, simultaneous A3/B3 draw, score comparison at `MAX_TURNS = 30`, 30th-turn three-point priority, and score-based stalemate without an extra turn.
- match selection uses six-layout uniform initial selection, 50:50 initial starter, exact layout-then-starter random call order, finite `[0,1)` RNG validation, one-draw rematch selection from the other five layouts, and opposite rematch starter. No persistence was added.
- RESULT exposes outcome, final A score, final B score, and turns used. Play Again resets the match, excludes the immediate previous layout, and alternates the starter.
- lifecycle preserves TURN pause, commits hidden MOVING exactly once without replaying feedback, sends hidden SCORE_FEEDBACK directly to TURN on Resume, and commits resize/orientation MOVING scoring once. RESULT input is locked and stale timers are guarded.
- pure QA passed scoring/removal, multi-token, simultaneous score, terminal, random-boundary, invalid-RNG, and six-layout terminal-path checks. Browser QA passed first match RESULT, raw result fields, actual scoring/token removal, feedback, Play Again, two rematches, RESULT input lock, hidden MOVING scoring, hidden MOVING terminal Resume, hidden SCORE_FEEDBACK, resize commit-once, and cleanup.
- responsive smoke passed on the actual Gravity Pact route at `1440×900`, `390×844`, and `320×700`: controls remained present and document horizontal overflow was absent. Local browser console error/warning capture was empty; no page-caused 404/5xx was observed in the QA run.
- validation: `git diff --check` PASS; `npm run build` PASS — 60 pages; dependencies unchanged; main, Cloudflare, DNS, and Production unchanged.
- status: `P3-G03-E implemented`; Gravity Pact maturity: `PLAYABLE`.
- next: `P3-G03-F — Gravity Pact responsive / reduced-motion / accessibility / visual polish only`.

## 2026-09-27 — P3-G03-F Gravity Pact Responsive and Accessibility Polish

- branch: `pivot/web-games-mvp`; previous HEAD: `3022c91a9d67dcbaee52116cbb5183fcab06cb41`; implementation: `3a245f9829d7d12e55047bdb14f2a347ab347d06` (`feat: polish Gravity Pact responsive UI`).
- changed only `src/components/games/GravityPactGame.astro`, `src/styles/games/gravity-pact.css`, and `src/games/gravity-pact/renderer.ts`. `GameLayout.astro`, the route, controller/input/logic/types/layouts/movement modules, shared shell, other games, dependencies, redirects, and production systems remain unchanged.
- responsive polish keeps the game root and board width-safe with `min-width: 0`, preserves a square 5×5 board, keeps the desktop HUD at four columns and mobile HUD at 2×2, uses the requested `clamp(1.75rem, 13%, 4rem)` token width, scrollable overlays, and a one-column result grid at `22rem` and below.
- board accessibility adds the visible English key `Circle: Player A`, `Diamond: Player B`, and `Striped: Blocked`; the board preserves `aria-label="Gravity Pact board"` and now references `gravity-pact-board-key`. The renderer labels all 25 gridcells with human rows/columns and current goals, blocks, tokens, or empty state, synchronizing on initial render, snap/scoring, rematch, resize, and cleanup without adding cell tabindex stops.
- live-region semantics use one atomic polite SCORE_FEEDBACK status and atomic polite PAUSED and RESULT announcements; RESULT keeps the existing `dl/dt/dd` metrics and Play Again remains outside the result announcement. Native controls and direction focus-visible styling use the existing semantic focus token with a 3px outline and 2px offset.
- visual polish preserves the A circle/dot, B diamond/line, goal motifs, and block hatch; enabled directions are visually distinct from disabled directions; score feedback uses the success token and pause uses the warning token. Decorative feedback motion uses existing motion tokens, while reduced motion disables only F decorative animations/transitions and core controller movement remains 220ms normal / 80ms reduced.
- browser QA passed on the actual route at 1440×900, 390×844, and 320×700 for board/HUD/control sizing, labels, board description, resize label persistence, keyboard Start and Arrow movement, focus-visible outline, Play Again, pause/resume, score feedback, RESULT semantics, and empty error/warn console capture. The 320px game root remained within the client width; the 15px document gutter observed there belongs to the existing shared page shell and was not changed.
- controller fixture QA passed normal 220ms movement, reduced 80ms movement, pause/resume regression, actual score feedback and token-removal label synchronization, atomic live regions, complete match RESULT, locked result controls, native Play Again, and reduced-motion functional movement. F remains `PLAYABLE`; `QA_PASS`, `RELEASE_READY`, and `COMPLETE` are not claimed.
- validation: `git diff --check` PASS; `npm run build` PASS — 60 pages; temporary contract/browser QA artifacts were removed; protected-file diff is clean. Production, main, Cloudflare, DNS, redirects, legacy, storage, audio, ads, and analytics were not changed.
- status: `P3-G03-F implemented / FINAL PASS`; maturity remains `PLAYABLE`.
- next: `P3-G03-G — Gravity Pact full final QA`.

## 2026-09-27 — P3-G03-G Gravity Pact Final Completion QA

- branch: `pivot/web-games-mvp`; verified base HEAD: `3d68c6a5569d045b6112465bc0994d3555d1b1ca`.
- final QA only. No product source, route, component, CSS, game module, public asset, dependency, config, redirect, shared shell, legacy file, main branch, Cloudflare, DNS, or Production file/state was changed. The only persistent file change from this task is this history entry.
- product source audit covered `src/pages/games/gravity-pact.astro`, `src/components/games/GravityPactGame.astro`, `src/styles/games/gravity-pact.css`, and all eight Gravity Pact modules under `src/games/gravity-pact/`; the final product diff remained empty before this history entry.
- route and metadata QA passed: canonical `/games/gravity-pact/`, English-only `Gravity Pact` H1/title/copy, `Strategy`, `Local 2 Player`, `2–4 min`, `index, follow`, `VideoGame` JSON-LD with `Web Browser`, `Strategy`, and `en`, no `Coming Soon`, `Under construction`, or `Related Games` copy, exact 25-cell DOM grid, and no Canvas.
- exact board QA passed: 5×5 coordinates, fixed A/B starts and goals, exactly six literal layouts with required counts, no start/goal collisions, and 180-degree symmetry. All twelve development witnesses passed with the expected scoring token IDs.
- movement QA passed: stable `UP/DOWN/LEFT/RIGHT` ordering, global A+B one-cell movement, vacated-cell chains, blocked/edge/occupancy protection, no overlap, malformed-state guards, illegal-direction no-op behavior, immutability, and no individual-token movement.
- scoring and terminal QA passed: single/multi/simultaneous scoring, simultaneous removal, score bounds, three-point priority, draw, legal-move-only 30-turn limit, score-based turn-limit result, stalemate, result metrics, locked RESULT controls, and Play Again reset.
- pure QA passed all six layouts, both starters, all twelve witnesses, terminal paths, random boundary/call-order/invalid-RNG checks, rematch exclusion, opposite-starter alternation, score reachability for both players, and fairness sanity. Symmetric minimum scoring lengths were observed for every layout: L1 `7/7`, L2 `6/6`, L3 `6/6`, L4 `5/5`, L5 `6/6`, L6 `5/5`; both players can score in every layout. Terminal sanity records were L1 B/15, L2 B/11, L3 B/8, L4 A/9, L5 A/11, L6 B/9 under the deterministic QA paths; this is not a game-theoretic balance claim.
- actual in-app browser controller QA passed fresh IDLE/accessibility board, Start and two random selections, MATCH_INTRO → TURN, normal 220ms movement, reduced 80ms movement, normal scoring/removal/feedback, TURN/MOVING/SCORE_FEEDBACK pause and Resume, resize/orientation commit-once behavior, six-layout terminal paths for both starters, six consecutive matches/rematches with non-repeating layouts and alternating starters, and cleanup.
- actual `/games/gravity-pact/` browser match passed from Start through a real Layout 5 match to `RESULT` (`Player A Wins`, `3–0`, 11 turns), then `Play Again` reset to zeroed metrics and selected Layout 3 with the opposite starter. A second real Layout 3 path reached `RESULT` (`Player B Wins`, `0–3`, 8 turns).
- accessibility QA passed native button controls, live/status semantics, result `dl/dt/dd`, board `aria-describedby`, all 25 non-empty gridcell labels, no focusable empty cells, Arrow Key movement, unrelated-interactive Arrow guard, and keyboard focus-visible direction styling (`3px` outline, `2px` offset). No storage, audio, ads, analytics, or persistence calls were found in the scoped product source.
- responsive/motion QA passed actual route measurements at `1440×900`, `390×844`, and `320×700`: square board/cells, visible 44×44 controls, correct desktop/mobile HUD columns, labels preserved, and no horizontal overflow beyond the client width. Actual RESULT at `320×700` had a scrollable overlay (`323px` client / `479px` content) and the `Play Again` button remained reachable after scrolling. Reduced-motion movement remained functional at `80ms`; normal movement remained `220ms`.
- route-only CDP network/console QA observed only successful `200` responses, zero page-caused 4xx/5xx responses, zero runtime exceptions, zero console errors, and zero log errors. The separate headless full controller harness exceeded its 120-second harness timeout; the equivalent in-app browser controller suite completed PASS, so the timeout is recorded as a QA-tool limitation and not as a product defect.
- validation: `git diff --check` PASS; `npm run build` PASS — 60 pages; dependencies unchanged; no allowed product file changed; final pre-history `git status --short` and `git diff --name-only` were empty.
- status: `P3-G03-G FINAL PASS`.
- `Gravity Pact QA_PASS`.
- `Gravity Pact COMPLETE`.
- maturity: `PLAYABLE`; release readiness is not claimed by this task.
- next: `P3-G04-A — Orbit Slip final specification / route / file implementation plan only`.

## 2026-09-27 — P3-G04-A Orbit Slip Final Implementation Plan

- branch: `pivot/web-games-mvp`; start HEAD: `3abf9861f30d8c590e03ce98a2fd0360a7f2f90b`; verified `origin` is `https://github.com/emfls/emfls-site.git`; start worktree clean.
- planning-only: no Orbit Slip product source, route, component, CSS, game module, dependency, config, redirect, catalog, or shared-shell change. `PROJECT_HISTORY.md` is the only persistent file changed. Orbit Slip maturity remains `SPEC`; site-level `RELEASE_READY: NO`.
- current state verified: catalog contains exactly `Orbit Slip`, slug `orbit-slip`, href `/games/orbit-slip/`, description `Adjust your orbit radius and slip through gaps without touching the barriers.`, primary category `Arcade`, categories `Arcade` + `Reflex`, mode `Solo`, session `30–90 sec`. `/games/orbit-slip/` is canonical, English-only, uses `GameDetailFrame`, and has no Related Games section until P4. Its route, component, CSS, and module directory are absent. Current build is 60 pages; B is expected to add exactly one route for 61 pages. Pulse Junction, Mirror Drift, and Gravity Pact are COMPLETE; this does not change site RELEASE_READY.
- identity: MVP is one Solo Arcade/Reflex continuous-survival game, mobile portrait first and desktop second, session target 30–90 seconds, Canvas world with HTML HUD and native buttons. No install, login, server, external API, external images/music, ads, leaderboard, multilingual mode, or persisted session state. No independent obstacle rotation, moving center, 3D, power-ups, shield, lives, continue, separate modes, or unrestricted procedural obstacle shapes.
- route contract: `src/pages/games/orbit-slip.astro` resolves catalog entry by `slug === 'orbit-slip'`, passes that `GameMeta` to `GameDetailFrame`, and never duplicates the metadata type or catalog values. Public copy meaning is fixed: How to Play — `Your point orbits the center automatically. Move only its orbit radius inward or outward to slip through the open radial corridor in each incoming gate. Survive as long as you can without touching a barrier.` Controls — `Mobile: drag inward or outward relative to the center. Desktop: drag with the mouse, or hold Up/W to move outward and Down/S to move inward.` Scoring — `You earn 1 point for every 0.1 seconds survived and 50 points for every gate you clear. A single barrier hit ends the run.` Punctuation may be normalized without changing meaning.
- polar model: center `(0,0)`; `progressAngle` is unwrapped and monotonically increases only during ACTIVE; `theta = wrap(START_ANGLE + progressAngle, TAU)` is presentation-only. Freeze `START_ANGLE = -Math.PI / 2`, `TAU = 2*Math.PI`. Collision, ordering, passage, and fairness use unwrapped angles. Radius values are normalized game-radius units; freeze `MIN_RADIUS=0.28`, `MAX_RADIUS=0.82`, `START_RADIUS=0.55`, `PLAYER_SIZE=0.025`, `RADIUS_SENSITIVITY=1.0`, `MAX_RADIAL_SPEED=0.70` units/second. Clamp both `radius` and `targetRadius` inclusively to `[MIN_RADIUS, MAX_RADIUS]`.
- automatic motion: during each ACTIVE substep, `progressAngle += angularSpeed(activeMs) * dtSeconds`; user input never changes angle. Actual radius approaches target by `sign(target-radius) * min(abs(target-radius), MAX_RADIAL_SPEED*dtSeconds)` with no easing overshoot. Keyboard target integration is `clamp(targetRadius + radialIntent*MAX_RADIAL_SPEED*dtSeconds)`; actual radius still uses the same capped follow helper, so keyboard and pointer share the same actual radial speed cap.
- angular speed is piecewise constant by active survival time: `0 <= t < 15s: 0.80`, `15 <= t < 30s: 0.95`, `30 <= t < 45s: 1.10`, `45 <= t < 60s: 1.20`, `t >= 60s: 1.28 rad/s`; never exceed `1.28`, and add no random acceleration or other speed spikes. Threshold selection uses active time, not wall-clock time.
- pointer contract: accept one primary pointer from the Canvas during ACTIVE; ignore all additional pointers until ownership is released; capture the accepted `pointerId`, and continue tracking outside Canvas. Let `gameRadiusPx = min(canvas CSS width, canvas CSS height)/2`; for every accepted move with a finite positive game radius, `deltaRInput = (currentDistanceFromCanvasCenter - previousDistanceFromCanvasCenter)/gameRadiusPx`, then `targetRadius = clamp(targetRadius + deltaRInput*RADIUS_SENSITIVITY)`, then update previous distance. A zero/non-finite game radius ignores the move. On pointerdown, initialize previous distance and emit no delta. Never set radius from absolute pointer location. A click/zero-distance drag changes no radius. `pointerup` releases ownership; `pointercancel` or abnormal `lostpointercapture` releases ownership, keeps current target, adds no delta, and neither pauses nor restarts; a new `pointerdown` is required. Input owns normalized deltas; controller/motion owns target clamping.
- keyboard contract: hold `ArrowUp` or `W` for outward `+1`; hold `ArrowDown` or `S` for inward `-1`; both held or neither held means `0`. `keydown.repeat` changes no edge state; `keyup` clears that key. Left, Right, Space, Enter, and all other keys have no gameplay action. Canvas is keyboard-focusable (`tabindex="0"`) and has an accessible name/instructions; focus Canvas on entry to ACTIVE after each fresh/resume countdown. Only handle these keys when focus is on Canvas/within its game input context and not on `input`, `textarea`, `select`, `option`, contenteditable, unrelated button, or unrelated link. Clear pressed state on blur, visibility pause, HIT_FEEDBACK, RESULT, and teardown; blur alone clears intent and does not pause. Radial input is accepted only in ACTIVE; ignore it in IDLE, COUNTDOWN, PAUSED, HIT_FEEDBACK, and RESULT.
- gate data model: `GateTemplate` has literal numeric `id`, `safeRMin`, `safeRMax`, and `corridorClass`; `SafeCorridor` stores geometric bounds and derived usable center bounds; `ObstacleArc` has stable `id`, unwrapped `angleStart/angleEnd`, and `rMin/rMax`; `Gate` has monotonic numeric session `id`, unwrapped angle bounds, safe bounds, the derived obstacle array, `passed`, `templateId`, and QA metadata `corridorClass`/`requiredRadialDistance`. Inner obstacle is `[MIN_RADIUS,safeRMin]` and outer obstacle `[safeRMax,MAX_RADIUS]`, omitting empty bands; both use the exact Gate angular interval. Renderer and collision consume these same obstacle values.
- corridor semantics: geometric open corridor is `[safeRMin,safeRMax]`; center-safe interval is `[usableRMin,usableRMax] = [safeRMin+PLAYER_SIZE,safeRMax-PLAYER_SIZE]`. Reject if `usableRMin > usableRMax`. Fairness calculations always use this center-safe interval. Geometric corridor widths must be at least `0.22` for `0–15s`, `0.18` for `15–30s`, and `0.15` from 30s onward; never below `0.15`; never shrink a literal template.
- exactly 12 literal templates, no procedural template construction: T1 `[0.39,0.71]`, width `.32`, CENTER; T2 `[0.28,0.50]`, `.22`, INNER; T3 `[0.60,0.82]`, `.22`, OUTER; T4 `[0.32,0.54]`, `.22`, INNER; T5 `[0.56,0.78]`, `.22`, OUTER; T6 `[0.42,0.68]`, `.26`, CENTER; T7 `[0.35,0.57]`, `.22`, CENTER; T8 `[0.53,0.75]`, `.22`, CENTER; T9 `[0.30,0.48]`, `.18`, INNER; T10 `[0.62,0.80]`, `.18`, OUTER; T11 `[0.38,0.55]`, `.17`, CENTER; T12 `[0.55,0.72]`, `.17`, CENTER. Phase eligibility is based on literal geometric width: before 15s only width `>=.22`; from 15s to before 30s width `>=.18`; at/after 30s width `>=.15`.
- corridor translation is a uniform candidate offset in `[-0.025,+0.025)`; preserve width and reject rather than clamp if translated bounds leave `[MIN_RADIUS,MAX_RADIUS]`. Select templates uniformly among phase-eligible templates. Generated thickness and non-first start-to-start spacing are uniform samples within their phase ranges: thickness `[0.12,0.22]` radians; spacing `[0.85,1.10)` before 15s, `[0.72,0.95)` from 15 to before 30s, `[0.62,0.85)` from 30 to before 45s, `[0.55,0.78)` from 45s onward. First gate starts exactly `current progressAngle + 1.10` (satisfies the required minimum), uses the initial reachable center interval `[START_RADIUS,START_RADIUS]`, and does not sample a spacing value.
- fairness: required radial distance is zero for overlapping usable intervals, otherwise the gap between nearest endpoints. Previous reachability interval is the immediately preceding planned Gate's usable interval; for the first Gate it is `[START_RADIUS,START_RADIUS]`. Previous passage angle is prior Gate `angleEnd + SAFETY_MARGIN`, or current progress for the first Gate. Candidate approach angle is `candidate.angleStart - MAX_ANGULAR_PADDING`, where `MAX_ANGULAR_PADDING = asin(min(1,PLAYER_SIZE/MIN_RADIUS))`; this conservative, radius-independent bound accounts for collision padding at every legal radius. `deltaAngle = max(0, candidateApproachAngle - previousPassageAngle)`. `availableTime = deltaAngle / getAngularSpeed(activeMs)` using the candidate generation active-time phase. Accept only when `requiredRadialDistance <= MAX_RADIAL_SPEED*availableTime*0.80`; exactly `.80` safety factor. Store computed `requiredRadialDistance` on Gate QA metadata. No wrapped-angle arithmetic is permitted here.
- difficulty-pattern fairness: `LARGE_SHIFT_THRESHOLD=.16`; a large shift is exactly `requiredRadialDistance >= .16` between consecutive usable intervals, not midpoint delta. Its direction is outward when the candidate interval lies above the prior interval, inward when it lies below; overlapping intervals have zero shift. Reject a third consecutive large shift in the same direction; a non-large or opposite-direction shift resets that same-direction run. Separately classify each usable interval midpoint `<=.42` INNER, `>=.68` OUTER, otherwise CENTER. An INNER↔OUTER transition is an extreme switch; reject a third consecutive extreme switch. A CENTER transition resets the consecutive extreme-switch count.
- bounded generator: each next Gate gets at most 20 candidates; invalid template, translated bounds, fairness inequality, same-direction large-shift run, and extreme-switch run all reject that candidate. Fix per-attempt RNG consumption order as eligible template selection, corridor translation, thickness, then spacing (spacing is omitted for first Gate); all numeric draws use validated `0 <= r < 1`, numeric interpolation is `min + r*(max-min)`, and selection uses `floor(r*n)`. After 20 rejected candidates, deterministic fallback is T1, zero translation, minimum thickness `.12`, and maximum spacing in the current phase (first Gate keeps its fixed `+1.10`); validate structural bounds and center-safe interval. Fallback consumes no more RNG. Generate monotonically increasing Gate IDs from 1 per session. Maintain at least two unpassed logical Gates ahead; normally retain 4–7 and never more than 7. Remove passed Gates only when safely behind player. Renderer may hide a farther Gate only when it is more than `TAU` ahead and its wrapped angular interval overlaps a nearer rendered Gate; visibility filtering cannot alter Gate generation or fairness.
- collision: player radial interval is `[radius-PLAYER_SIZE,radius+PLAYER_SIZE]`; inclusive interval contact is collision. Radial non-overlap means no collision. `angularPadding = asin(min(1,PLAYER_SIZE/max(radius,0.05)))`. On radial overlap, collision occurs when unwrapped `progressAngle` is inclusively within `[obstacle.angleStart-angularPadding, obstacle.angleEnd+angularPadding]`. No independently authored hitboxes or renderer-only Arc geometry. Gate passage is exactly once when `progressAngle > gate.angleEnd + SAFETY_MARGIN`, with `SAFETY_MARGIN=.03rad`.
- simulation: one ACTIVE `requestAnimationFrame` loop; no second gameplay interval. Cap each elapsed frame delta to `MAX_FRAME_DELTA_MS=100`; split into substeps no larger than `MAX_SIM_STEP_MS=16.667ms`. Each ACTIVE substep order is keyboard target intent → capped actual radius follow → candidate unwrapped angle advance → candidate activeMs advance → collision check → if clear, newly passed Gate processing → maintain generator lookahead → safely remove passed Gates. Collision wins over a Gate pass in the same substep: do not award `+50` for that Gate. Commit collision once, cancel gameplay rAF, clear pointer and keys, freeze progress/time/score/Gates/RNG, enter HIT_FEEDBACK, and make no further simulation updates.
- score and result: `score = floor(activeMs/100) + gatesPassed*50`; no combo/multiplier. Display Time as one decimal seconds (for example `37.4 s`), store milliseconds internally. A single barrier hit ends the run; no lives/shield/continue. HIT_FEEDBACK lasts `400ms`, then RESULT; it does not accept pause and may finish while hidden. RESULT has exactly Score, Survival Time, Gates Passed, Best Score, Best Time; Best Time is longest survival, not fastest. Active HUD has exactly Score, Time, Gates and no Best fields. Store only completed RESULT sessions; `Best Score=max(previous,sessionScore)` and `Best Time=max(previous,activeMs)` independently.
- storage contract: only key `emfls:orbit-slip:best:v1`; JSON object exactly `{bestScore:number,bestTimeMs:number}`, each a safe integer `>=0`. `storage.ts` owns safe acquisition/get/parse/validation/write. Any access, read, parse, shape, or write failure must not block play and exposes fallback best stats `{bestScore:0,bestTimeMs:0}` for that result. No other Orbit Slip storage key and no session/progress persistence.
- six and only six states: `IDLE`, `COUNTDOWN`, `ACTIVE`, `PAUSED`, `HIT_FEEDBACK`, `RESULT`. Start accepted only in IDLE; duplicate activation creates one countdown, session seed, and generator initialization. Countdown displays 3, 2, 1 for 1000ms each (3000ms total) and runs no gameplay simulation. If visibility becomes hidden during COUNTDOWN, freeze its current number and remaining step duration while keeping state COUNTDOWN; on visible, continue the remaining countdown and never start ACTIVE while hidden. Play Again accepted only in RESULT and creates one fully reset new session, new seed/PRNG, fresh Gate sequence, then COUNTDOWN. Resume from PAUSED uses the same logical run, gates, stats, radius, target radius, and PRNG state, then COUNTDOWN; it does not reset or reseed. Reset `lastFrameTime` immediately before ACTIVE resumes; hidden/countdown wall time never enters delta.
- visibility and resize: hidden during ACTIVE immediately enters PAUSED and freezes progressAngle, radius, targetRadius, activeMs, score, gatesPassed, Gate list, and RNG state; cancels rAF, pointer ownership, and keyboard intent. Returning visible remains PAUSED. Resume is explicit and uses 3/2/1 countdown. ACTIVE resize/orientation enters PAUSED, cancels active pointer/key intent, and preserves normalized logical state; PAUSED resize only updates Canvas pixel transform and stays PAUSED. Collision committed before pause handling continues HIT_FEEDBACK→RESULT and cannot become resumable. Clear key state on blur; blur itself is not a pause transition.
- RNG: `rng.ts` is the only module allowed to call `Math.random`; production obtains one unsigned 32-bit session seed once when a new session is accepted, then uses Mulberry32. Seed input is an integer in `[0,2^32-1]` (including zero); each output is unsigned state divided by `2^32` and therefore `[0,1)`. C/G inject explicit seeds. Same seed and same input sequence must reproduce template selection, translations, spacing, thickness, and Gate order. Resume preserves the same generator closure/state; Play Again makes a new seed. No generator retry loop exceeds 20 candidates.
- Canvas and visual language: `renderer.ts` owns a 2D Canvas, logical CSS dimensions separate from backing dimensions, render scale `min(devicePixelRatio,2)`, `DPR_CAP=2`, and backing allocation only on resize/size/DPR change, never per frame. Draw center point and subtle MIN/MAX orbit bounds; player is a small point with short travel-direction trail. Barrier Arcs use structural hatch/thickness/pattern plus color, never color alone. Do not directly color the safe corridor as the answer. Upcoming gates are lower opacity than the nearest gate but readable. Canvas is square/as square as practical on mobile portrait, does not overlap HUD, and uses `touch-action:none` for active radial drag. Reduced motion may simplify decorative trail/hit presentation only; it never changes simulation, controls, or timing. Main HTML buttons Start Game, Resume, Play Again are each at least 44×44 CSS px. Keep retained gates at most 7; decorative particles are optional with a strict small cap; avoid heavy stacked blur/shadow on many arcs.
- file ownership: route `src/pages/games/orbit-slip.astro`; component `src/components/games/OrbitSlipGame.astro`; CSS `src/styles/games/orbit-slip.css`; modules `src/games/orbit-slip/types.ts`, `constants.ts`, `motion.ts`, `templates.ts`, `rng.ts`, `generator.ts`, `collision.ts`, `input.ts`, `renderer.ts`, `storage.ts`, `controller.ts`. No `physics.ts`, `audio.ts`, or `network.ts`. `types.ts` owns `GameState`, `GateTemplate`, `Gate`, `ObstacleArc`, `SafeCorridor`, `PlayerMotionState`, `SessionStats`, `BestStats`, RNG and generator interfaces; no DOM. `constants.ts` owns every frozen numeric radius/speed/timing/spacing/corridor/DPR/substep/generator/score constant; no mutable state. `motion.ts` owns angular-speed phase lookup, clamping/target helpers, capped radius follow, angle advance/wrapping, and delta/substep helpers; no DOM/generator. `templates.ts` owns 12 literals, validator, phase eligibility; no RNG. `rng.ts` owns Mulberry32, seed validation/production session seed, normalized random primitives; sole `Math.random` owner. `generator.ts` owns candidates, spacing/translation/thickness, fairness/reachability, shift/zig-zag limits, 20-attempt fallback, lookahead, IDs; no Canvas. `collision.ts` owns inclusive radial/angular formulas and Gate collision; no rendering. `input.ts` owns pointer ownership/relative distance/capture/cancel, key state/guard/input lock/cleanup; no motion physics. `renderer.ts` owns Canvas/DPR/orbit/player/trail/Gate/future-opacity/hit drawing and teardown; no fairness/collision decisions. `storage.ts` owns the one key and safe best load/save/update; no controller state. `controller.ts` owns six-state lifecycle/countdown/session reset/single rAF/substeps/active time/generator orchestration/collision-before-pass/scoring/pause/hit/result/storage completion/cleanup; it must call motion/generator/collision/storage helpers rather than duplicate their formulas.
- cross-module interfaces fixed for B–G: `createOrbitSlipController(root: HTMLElement, options?: OrbitSlipControllerOptions): () => void`; test options may inject a uint32 seed and storage adapter, while production seed creation remains in `rng.ts`. `createOrbitSlipInput({root,canvas,isActive,getGameRadiusPx,onRadialDelta,onRadialIntent})` returns `{getRadialIntent,cancelPointer,clearKeyboard,destroy}`. `createOrbitSlipRenderer(canvas)` returns `{resize,render,destroy}` and accepts the exact `Gate[]` used by collision. `createSeededRandom(seed:uint32): RandomSource`; `validateGateTemplates(templates): ValidationResult`; `getEligibleGateTemplates(activeMs): readonly GateTemplate[]`; `generateNextGate(context,random): GateGenerationResult`; `getAngularPadding(radius): number`; `collidesWithGate(progressAngle,radius,gate): boolean`; `loadBestStats(storage?): BestStats`; `saveBestStats(stats,storage?): boolean`. Domain coordinates/angles remain normalized/unwrapped; DOM/Canvas pixel conversion stays in input/renderer.
- B→G plan and gates: **B** creates only the canonical route, GameDetailFrame copy, component shell, Score/Time/Gates HUD, Canvas shell, exactly six structural panels, Start/Resume/Play Again, COUNTDOWN structure, and controller skeleton; no motion/templates/RNG/generator/collision/real input/active loop/score/storage. Verify 61 pages, one route only, structure/state guards and shell controls; commit `feat: add Orbit Slip game shell`. **C** adds types/constants/motion, 12 literal templates and validators, Mulberry32, bounded generator/fairness, and pure collision; no controller integration/browser gameplay. Verify every boundary/template/phase/fallback/fairness/collision formula, injected-seed reproducibility and no hidden randomness; commit `feat: add Orbit Slip deterministic game core`. **D** integrates relative pointer/mouse + hold keyboard, Canvas/DPR baseline, automatic angle/radius, generated Gate lookahead, collision detection, one ACTIVE rAF/substeps, hidden pause/explicit countdown resume/resize lifecycle; collision can be observed for QA but does not yet award Gate score/end in RESULT/save. Verify input guards/pointer cancel/speed caps/delta substeps/collision geometry/lifecycle; commit `feat: add Orbit Slip movement and collision`. **E** adds Gate pass scoring, collision priority, HIT_FEEDBACK, RESULT, independent Best Score/Best Time persistence and full new-session Play Again seed; only after real Start→collision→Result→Play Again browser PASS may maturity become PLAYABLE. Verify score/terminal/storage failure; commit `feat: complete Orbit Slip match loop`. **F** changes presentation only: responsive 1440/390/320, DPR1/2/3 cap, Canvas crispness, focus/live semantics, non-color danger patterns, result reachability, reduced decorative motion, visual polish; no mechanics. Verify screenshots/measurements and keyboard/touch accessibility; commit `feat: polish Orbit Slip responsive UI`. **G** performs full generator/fairness/seed/survival/collision/score/pause/storage/input/accessibility/responsive regression only; source defects become a separately authorized fix task, not an unplanned G patch. Verify all specified test matrix and build; final QA status is recorded separately and does not imply site RELEASE_READY.
- minimum test coverage pinned to owners: C pure tests cover all 12 exact template values and rejection fixtures, phase boundaries, usable-center intervals, translation boundary rejection, every spacing/speed threshold, first Gate baseline, fairness inequality, both pattern-run limits, exactly 20 rejected candidates then deterministic fallback, lookahead/max-retained and Gate IDs, same-seed replay, radial/angular inclusive contact and unwrapped angles. D tests cover relative drag/no snap/ownership/capture/cancel/lost capture/extra pointers, clamping, opposing/same-direction held keys, repeat/editable/unrelated-target guards, capped radius follow, frame cap/substep split, Gate tunneling and pause/resize/delta reset. E tests cover strict Gate pass threshold/once-only, collision-over-pass on same substep, `floor(activeMs/100)+50*gatesPassed`, hit freeze/400ms/result fields, independently maximized bests, malformed/throwing storage and duplicate Start/Play Again. F/G cover normal/reduced motion, DPR1/2/3, responsive/320 RESULT reachability, focus/live semantics, hidden elapsed exclusion, deterministic same seed, randomized different-seed sanity, full browser survival/result/rematch and clean network/console. Repository has no test script or existing test files; use temporary pure/browser QA harnesses under `/private/tmp` with installed tooling, remove them before each phase handoff, and do not add a testing dependency solely for this game.
- verification for A: `git diff --name-only` must be exactly `PROJECT_HISTORY.md`; `git diff --check` PASS; `npm run build` PASS with 60 pages; Orbit route remains absent; dependencies unchanged; no product source changed. Commit only the history record as `docs: plan Orbit Slip implementation`; push only `pivot/web-games-mvp`. `main`, legacy, redirects, Cloudflare, DNS, Production, and all three completed games stay unchanged.
- status: `P3-G04-A PLAN COMPLETE`; Orbit Slip maturity remains `SPEC`; site `RELEASE_READY: NO`.
- next: `P3-G04-B — Orbit Slip route / HUD / Canvas / six-state shell only`.

## 2026-09-27 — P3-G04-B Orbit Slip Shell

- branch: `pivot/web-games-mvp`; starting HEAD: `72cdae04bf234f66a2f0ab5c9031498f8e10f076`; origin verified as `https://github.com/emfls/emfls-site.git`.
- files changed: `src/pages/games/orbit-slip.astro`, `src/components/games/OrbitSlipGame.astro`, `src/styles/games/orbit-slip.css`, `src/games/orbit-slip/controller.ts`, and this history entry.
- route: created `/games/orbit-slip/`; resolves the existing `orbit-slip` catalog entry and passes it directly to `GameDetailFrame`. Frozen English How to Play, Controls, and Scoring copy is included; Related Games is absent.
- shell: root exposes its current state; exactly six panels/states exist — `IDLE`, `COUNTDOWN`, `ACTIVE`, `PAUSED`, `HIT_FEEDBACK`, `RESULT`. One accessible, focusable Canvas and the neutral Score / Time / Gates HUD are present. Start, Resume, and Play Again are native buttons. The controller guards those actions, displays 3 / 2 / 1 on one 1000ms timer chain, enters ACTIVE after 3000ms, resets neutral values, and cleans up its listeners/timer on destroy.
- deliberately not implemented: playable motion, templates, RNG, gates/generation/fairness, collision, pointer or keyboard gameplay input, Canvas drawing, active frame loop, scoring, hit-to-result lifecycle, and persistence/storage. No additional game modules or dependencies were added.
- verification: temporary controller QA passed for all six panels, initial state/HUD, single-chain countdown timing/duplicate Start guard, ACTIVE entry, and cleanup. Forbidden-feature audit found no `Math.random`, storage, animation loop, RNG/template/generator/collision, input, or scoring implementation in Orbit Slip source. Built `/games/orbit-slip/` output verified for catalog metadata, canonical URL, frozen copy, one Canvas, six panels, controls, and absence of placeholder/Related Games copy. Pulse Junction, Mirror Drift, and Gravity Pact output pages all built successfully.
- `npm run build`: PASS; exactly 61 pages generated (60 before this route). `git diff --check`: PASS. Scope stayed within the four shell files and `PROJECT_HISTORY.md`; catalog, shared shell, completed games, redirects, and dependencies were unchanged.
- maturity: `SHELL`, not `PLAYABLE`; site `RELEASE_READY: NO`.
- next: `P3-G04-C — Orbit Slip deterministic polar motion / 12 templates / Mulberry32 RNG / bounded generator + fairness / collision pure core only`.

## 2026-09-27 — P3-G04-C Orbit Slip Deterministic Core

- branch: `pivot/web-games-mvp`; starting HEAD: `5b2e3b94deb604f0a0d310b331178fe36ecea4c4`.
- files changed: `src/games/orbit-slip/types.ts`, `constants.ts`, `motion.ts`, `templates.ts`, `rng.ts`, `generator.ts`, `collision.ts`, and this history entry.
- core: added the six-state DOM-free types, frozen motion/simulation constants and helpers, twelve literal Gate templates with phase eligibility/validation, seeded Mulberry32 and validated random helpers, and a bounded 20-attempt Gate generator with translation/center-safe checks, fairness reachability, pattern limits, deterministic fallback, monotonic IDs, lookahead and safe pruning. Gate obstacles are derived from the same geometric corridor bounds used by pure inclusive radial/angular collision checks.
- deliberately not implemented: controller integration, browser gameplay, pointer/keyboard input, Canvas rendering, active animation loop, scoring, hit/result lifecycle, or storage. No dependency or route changes.
- verification: temporary pure-core Node harness passed all 18 contract subtests covering frozen values, all templates and phase boundaries, motion/frame stepping, seed-zero Mulberry32 reproducibility and random validation, candidate draw order/rejection, first-Gate setup, phase spacing/thickness, exact fairness threshold, 20-rejection fallback, both sequence-pattern limits, pruning/lookahead/IDs, same-seed replay, inclusive collision and unwrapped angles, and pure module ownership of `Math.random`.
- `git diff --check`: PASS. `npm run build`: PASS; exactly 61 pages generated. Local standalone `tsc` is unavailable and no type-check dependency was added; Astro build and runtime-imported pure tests passed.
- Orbit Slip remains a structural shell plus deterministic core, not `PLAYABLE`; site `RELEASE_READY: NO`.
- status: `P3-G04-C PASS`.
- next: `P3-G04-D — integrate motion, input, rendering, collision observation, and pause/resume lifecycle`.

## 2026-09-27 — P3-G04-D Orbit Slip Movement and Collision

- branch: `pivot/web-games-mvp`; starting HEAD: `dab8b8a34f8f646e21d4afa85a514be6a56a4c17`.
- files changed: `src/games/orbit-slip/input.ts`, `renderer.ts`, `controller.ts`, `src/styles/games/orbit-slip.css`, and this history entry.
- input/rendering: relative center-distance pointer deltas with primary-pointer capture/cancel/lost-capture handling; Canvas-focused Up/W and Down/S holds with opposing-key neutrality and blur/pause cleanup; 2D renderer uses the same Gate obstacle values as collision, a DPR-2-capped backing store updated only on resize, orbit bounds/player/trail, and non-color radial barrier hatching. Canvas radial touch handling is enabled.
- ACTIVE/lifecycle: connected the pure motion/RNG/generator/collision core to one rAF loop with 100ms frame cap and <=16.667ms substeps. Keyboard target intent, capped radius follow, unwrapped angle/time advance, collision priority, one-time strict Gate passage, lookahead, and safe pruning run in frozen order. Hidden/viewport changes pause and clear live input; visible alone does not resume; countdown preserves its hidden-step remainder; explicit resume retains the same run and excludes hidden/countdown wall time. Collision is observable and freezes in the existing HIT_FEEDBACK shell state; no full terminal timer/result is added here.
- deliberately deferred to E: survival/Gate scoring, 400ms result flow, result statistics, storage, and a true new-session Play Again. Orbit Slip maturity remains `SHELL`.
- verification: temporary input/renderer harness passed relative-delta/no-snap, pointer ownership/cancel/lost-capture, opposing keys/repeats, DPR cap/backing allocation, resize and shared obstacle geometry. Deterministic controller harness passed countdown visibility freeze/remainder, duplicate Start guard, canvas focus, one rAF, 100ms cap/substeps, keyboard radius-speed cap/blur clearing, hidden and resize pause, pointer/key clearing, visible-without-resume, normalized-state/time retention, no hidden-time leak, and once-only collision freeze. Local browser at `/games/orbit-slip/` showed the Canvas and gates, then a no-input collision at `2.6 s`; the HUD stayed frozen and the browser console had no errors.
- `git diff --check`: PASS. `npm run build`: PASS; exactly 61 pages generated. No dependency changes; local standalone `tsc` is unavailable. Changes stayed within the four D implementation/style files and `PROJECT_HISTORY.md`.
- status: `P3-G04-D PASS`.
- next: `P3-G04-E — Gate-pass scoring, terminal result, safe best-stat storage, and new-session Play Again`.

## 2026-09-27 — P3-G04-E Orbit Slip Match Loop

- branch: `pivot/web-games-mvp`; starting HEAD: `034ab3602b77c356e75288caf5e4d8de73ee0085`.
- files changed: `src/games/orbit-slip/controller.ts`, `src/games/orbit-slip/storage.ts`, and this history entry.
- match loop: score is `floor(activeMs / 100) + gatesPassed * 50`; a Gate is awarded once only after the strict passage threshold, and collision takes precedence over a same-substep passage. A collision cancels the frame loop, clears live input, freezes active time, shows `HIT_FEEDBACK` for 400ms, then renders the five required result metrics.
- best stats: only `emfls:orbit-slip:best:v1` is read/written, with exact `{bestScore, bestTimeMs}` safe non-negative integer fields. Score and time maxima update independently. Storage access, parsing, shape, and write failures safely fall back to zero stats without blocking the match. No session, Gate, radius, or RNG state is persisted.
- rematch: Play Again is accepted only in RESULT and initializes a fresh seeded session, Gate set, zeroed HUD/metrics, and countdown; duplicate actions during countdown do not create another session.
- verification: temporary deterministic Node harnesses passed all nine reported tests, including score formula, Gate once-only/collision priority, hit freeze and 400ms timing, result metrics, independently retained best score/time, malformed/throwing storage, hidden-after-hit remaining outside PAUSED, fresh random seed and reset, and completing a result when storage writes throw. Actual local browser flow reached Gate progression and collision, displayed all five result fields, then Play Again began a zeroed fresh countdown/session; no console errors were observed. Browser keypresses were issued, but radial displacement itself could not be confirmed with the available browser controls; the production input/controller movement behavior was covered by the P3-G04-D deterministic harness.
- `git diff --check`: PASS. `npm run build`: PASS; exactly 61 pages generated. No dependency changes; standalone `tsc` remains unavailable. Temporary QA harnesses are outside the repository and will be removed before handoff.
- maturity: `PLAYABLE` — the real browser Start → collision → Result → Play Again loop is complete; see the radial-input measurement limitation above. Site `RELEASE_READY: NO`.
- status: `P3-G04-E PASS`.
- next: `P3-G04-F — responsive presentation, accessibility, and reduced-motion polish only`.

## 2026-09-27 — P3-G04-F Orbit Slip Responsive and Accessibility Polish

- branch: `pivot/web-games-mvp`; starting HEAD: `9b553990f4361b27b3e51cc9bafd7848642719d4`.
- files changed: `src/components/games/OrbitSlipGame.astro`, `src/games/orbit-slip/renderer.ts`, and this history entry. `src/styles/games/orbit-slip.css` was inspected and left unchanged because browser measurements showed no layout defect.
- accessible Canvas description now directly states that the point moves automatically, inward/outward drag behavior, Up/W outward and Down/S inward holds, and barrier avoidance; the existing visible Controls section remains consistent.
- reduced motion: the renderer consults `prefers-reduced-motion` and omits only the decorative trail when requested. The player, center, Gates, controller, angular/radial movement, countdown, collisions, scoring, and timers remain unchanged. The media query list is retained once and its live `matches` value is read per rendered frame; backing dimensions do not reallocate frame-to-frame.
- responsive browser QA at `1440×900`, `390×844`, and `320×700`: `scrollWidth === clientWidth` at every target (1440, 390, and 320 respectively). At 320px the active Canvas measured `284×284` inside the 286px bordered surface. At both mobile sizes, the five-field RESULT content and 44px Play Again control remained reachable without an internally trapped overlay or horizontal overflow.
- DPR browser QA at 320px: DPR 1 produced a 284px Canvas backing store; DPR 2 produced 568px for the 284px CSS Canvas; DPR 3 also produced 568px, confirming the scale cap of 2. Temporary DevTools viewport/DPR/reduced-motion overrides were reset after QA.
- accessibility QA: Canvas has an accessible name and linked direct instructions; keyboard entry focuses the Canvas; focus-visible uses a 3px focus outline; native Start/Play Again controls measured 44px high; countdown is a polite atomic status; RESULT exposes exactly five `dt/dd` pairs. Computed contrast ratios: primary text 13.91:1, secondary text 5.45:1, button text 6.16:1, focus indicator 3.65:1 against the tested adjacent surfaces. Existing barriers retain radial hatching as a non-color cue.
- reduced-motion browser emulation was enabled on the local page and the match still reached RESULT at 320×700/DPR 3; the deterministic renderer regression test verified that reduced mode removes only trail strokes while keeping the player/center drawing, media-preference changes, capped DPR 3 backing size, and stable backing dimensions across renders. Rendered-output test verified the direct Canvas instructions.
- browser console showed two duplicate local `GET /favicon.ico` 404 messages from the dev server and no game JavaScript/runtime exception. The favicon request is outside this presentation-only Orbit Slip stage and remains an explicitly noted repository QA issue, not silently treated as a clean console.
- verification: temporary F tests passed 2/2; `git diff --check`: PASS; `npm run build`: PASS; exactly 61 pages generated. No dependencies, mechanics, route metadata, shared shell, or unrelated files changed. Temporary harness is outside the repository and will be removed before G.
- maturity: `PLAYABLE`; site `RELEASE_READY: NO`.
- status: `P3-G04-F PASS`.
- next: `P3-G04-G — comprehensive final QA, audit first`.

## 2026-09-27 — P3-G04-G Orbit Slip Final QA

- branch: `pivot/web-games-mvp`; starting HEAD: `ad7ff083ee661058c3ea55df23f306c03d821ead`.
- files changed: `PROJECT_HISTORY.md` only. Final audit found no reproducible Orbit Slip product defect, so no game source or style file was changed.
- generator/survival: temporary deterministic Node QA passed 24 seeds through 60 seconds each with at least 30 safely passed Gates per run; all generated runs kept finite ordered geometry, two or more unpassed Gates ahead, and at most seven retained Gates. The audit also checked 80 sampled successive candidates against the frozen conservative fairness inequality, phase spacing/thickness bounds, translations, and 20-attempt ceiling; sequence checks found no three same-direction large shifts or two consecutive extreme switches. Forty-eight-Gate replays matched for seed 0 and `0xffffffff`, while seed 1 diverged.
- collision/score/storage: inclusive radial and angular contacts, unwrapped angles, collision-over-pass priority, strict one-time passage, and `floor(activeMs/100) + 50*gatesPassed` passed. Exact storage shape, independent best-score/time maxima, malformed/unsafe records, read failures, and write failures all returned the required safe behavior.
- input/lifecycle: pointer-relative movement, primary-pointer ownership, mouse-button and multipointer guards, up/cancel/lost-capture cleanup, opposing/same-direction/repeated keys, blur/focusout clearing, and teardown passed. Controller checks covered all six panels and action guards, 3/2/1 countdown, hidden countdown remainder, hidden ACTIVE pause, explicit resume, resize/orientation pause, blur without pause, collision freeze, hidden HIT_FEEDBACK→RESULT at 400ms, storage failure, one-time new-session seed, and rAF/timer/listener cleanup. A seeded run resumed after a 60-second hidden interval and matched uninterrupted collision state within floating-point tolerance, including Gate replenishment.
- renderer/accessibility: DPR 1/2/3 behavior remained capped at 2; backing allocation occurred only on size/scale changes. Reduced motion omitted only the decorative trail while retaining player, center, orbit and Gate geometry. Built Orbit Slip output retained its accessible Canvas name/instructions, six states, and exactly five result pairs. Existing F responsive measurements at 1440, 390 and 320 CSS pixels, including the 320px RESULT reachability and no horizontal overflow, remain the applicable browser evidence; no CSS changed in G.
- route/regression: built Orbit Slip, Pulse Junction, Mirror Drift, and Gravity Pact outputs matched their catalog titles, English document language, canonical route, H1, and VideoGame JSON-LD; Orbit Slip retained one Canvas, no Related Games or placeholder copy, and the expected catalog fields.
- browser smoke: local Orbit Slip RESULT → Play Again countdown → RESULT completed twice with all five result metrics exposed. The previously recorded automatic local `GET /favicon.ico` 404 remains a site-level asset issue outside Orbit Slip scope; this run produced no separate game runtime failure. No production URL was accessed.
- verification: temporary G harness passed 14/14 tests; `npm run build` PASS with 61 pages; `git diff --check` PASS; no dependency, catalog, shared-shell, redirect, or other source changes. Orbit Slip remains `PLAYABLE`; site remains `RELEASE_READY: NO`.
- remote delivery: the initial sandboxed pre-push check could not resolve `github.com`. After scoped network permission was granted, live remote `pivot/web-games-mvp` was confirmed at the expected parent `ad7ff083ee661058c3ea55df23f306c03d821ead`; the normal fast-forward push succeeded and post-push `git ls-remote` verified `61538e3a2a131dadca211a7b51866c1bfb56c9a9`. No force push or alternate DNS/remote path was used.
- status: `P3-G04-G FINAL PASS`; branch push verified at `61538e3a2a131dadca211a7b51866c1bfb56c9a9`.
- next: `P3-G05-A` — not started.

## 2026-09-27 — P3-G05-A Twin Ledger Final Specification and File Plan

- branch: `pivot/web-games-mvp`; start local HEAD: `a8f1c0a0df8276939649320cfc516350369f736a`; worktree was clean. `origin` is `https://github.com/emfls/emfls-site.git`; the cached `origin/pivot/web-games-mvp` ref matched the start HEAD. A live `git ls-remote` probe failed with `Could not resolve host: github.com`; remote delivery is therefore pending, not inferred from the cached ref.
- planning-only: `PROJECT_HISTORY.md` is the only persistent file changed. No Twin Ledger product source, route, component, CSS, catalog, dependency, configuration, redirect, shared shell, or completed-game source was changed. The Twin Ledger route and module directory are absent. Baseline build remains 61 pages; Twin Ledger is not yet implemented. Site `RELEASE_READY = NO`.
- authoritative identity is the existing catalog entry (`slug: twin-ledger`, `/games/twin-ledger/`, `Strategy`, `['Strategy', 'Puzzle']`, `Solo`, `1–3 min`, and its existing description); do not edit `games.ts` or redefine `GameMeta`. The route will find by slug, pass the catalog object to `GameDetailFrame`, inherit its title/description/canonical/robots/OG/VideoGame JSON-LD behavior, and omit Related Games until P4. English public copy: How to Play — `Place each signed number into the Left or Right Ledger. Keep the absolute difference between the ledger totals within the turn's hard limit through all 18 turns. Earn points for balance; a Breach scores no turn points but does not end the session.` Controls — `Tap Left Ledger or Right Ledger to place the current tile. On desktop, press Left Arrow or A for Left, or Right Arrow or D for Right.` Scoring — `Exact (0): 120 points; Stable (1–2): 90; Tense (3–4): 55; Danger (5 through the turn's hard limit): 20; Breach (above the hard limit): 0. Exact and Stable build the combo; Tense, Danger, and Breach reset it. The combo multiplier applies to that turn's points, up to ×1.50. Complete all 18 turns for the breach-count and final-difference bonuses.`
- frozen data contract: `Tile = Readonly<{ id: string; baseValue: number; weight: 1 | 2 }>`; sequence IDs are `tl-01`…`tl-18`, unique within a session. `Phase = 'LEARN' | 'PLAN' | 'PRESSURE'`; `Zone = 'EXACT' | 'STABLE' | 'TENSE' | 'DANGER' | 'BREACH'`; `PlacementSide = 'LEFT' | 'RIGHT'`; `GameState = 'IDLE' | 'TURN' | 'RESOLVING' | 'FEEDBACK' | 'PAUSED' | 'RESULT'`. `GameSession` owns state, uint32 seed, immutable 18-tile sequence, `turn` as the count of committed placements (0–18), both totals, absolute difference, current zone, combo/maxCombo, exact/breach counts, sum of turn points, current/next tile (`null` only when no such tile exists), the last placement, the last four placements in chronological order, and nullable final result. Initial totals are zero and zone is EXACT. Result fields are exactly Score (turn points plus both bonuses), Final Difference, Exact Count, Breach Count, Max Combo, and Best Score; Best Max Combo is stored independently but not exposed as an extra RESULT field. Render negative values with a visible minus sign and HEAVY with explicit `×2`; the one preview surface says `Final turn` when turn 18 has no future tile and `Sequence complete` after the last placement, never an undefined/null label. Recent visual history is exactly four placements; the full sequence remains data-only.
- phase and balance contract: turns 1–6 use `{+1,+2,+3,+4}`, weight 1, hard limit 8; turns 7–12 use `{+2,+3,+4,+5,-2,-3}`, weight 1, with exactly 1 or 2 negatives, hard limit 7; turns 13–18 use `{+2,+3,+4,+5,+6,-2,-3,-4}`, at most 2 negatives, hard limit 6. Exactly two HEAVY tiles occur in turns 14–18, never adjacent, both positive weight 2 with base +2 or +3 (effective +4/+6); turn 13 is never HEAVY. Zone boundaries after placement are Exact 0, Stable 1–2, Tense 3–4, Danger 5 through that turn's hard limit inclusive, Breach above the limit. Zone text/shape/icon supplies a non-color cue.
- scoring order: determine the post-placement zone; Exact increments exactCount and Exact/Stable increments combo, while all other zones set combo to zero; update maxCombo; select the multiplier from this newly updated combo for the same turn (0–1 ×1.00, 2–3 ×1.10, 4–5 ×1.20, 6–7 ×1.30, 8–9 ×1.40, 10+ ×1.50); compute `Math.round(basePoints × multiplier)` (positive JS half-up behavior); add once to turn-points total; Breach increments breachCount and never ends play. On the 18th committed placement, compute once `finalScore = turnPoints + breachBonus + differenceBonus`, with breach bonus 0→500, 1→250, 2→100, 3+→0 and final-difference bonus 0→300, 1–2→150, otherwise 0. A pure result helper derives both bonuses from inputs and does not mutate/add to score, so repeated calculation cannot double-apply them.
- timing and transaction: accept a placement only in TURN; synchronously acquire the input lock, commit side total/difference/zone/score/combo/counts, consume exactly one tile, advance `turn`, append/cap history, and compute final result on turn 18 before exposing RESOLVING. This synchronous acceptance is the sole logical commit point; timer/animation callbacks only change presentation state. RESOLVING lasts exactly 120ms, then FEEDBACK exactly 300ms; both timers are presentation-only and unchanged for reduced motion. FEEDBACK advances to TURN if `turn < 18`, otherwise RESULT. `visibilitychange` to hidden immediately pauses TURN, RESOLVING, or FEEDBACK and clears/invalidate timers. Resume from a pre-commit TURN keeps the same tile/totals; resume after a committed RESOLVING/FEEDBACK snaps to TURN for the already-advanced next tile, or RESULT if `turn === 18`; never replay a transaction/animation and becoming visible alone never resumes. A session-generation nonce invalidates stale callbacks across rematches. Six and only six lifecycle states/panels; failed start validation remains IDLE with an inline status message, not an ERROR state.
- RNG/generator: uint32 seed contract is integer `0…4,294,967,295` inclusive; same seed and implementation version produce the exact same 18 tiles and generation diagnostics. Pure game modules receive an injected seed and contain no ambient randomness. Browser seed acquisition uses one `crypto.getRandomValues(Uint32Array(1))` draw; only if unavailable/throws, use exactly one `Math.random()` draw mapped by `floor(x × 2^32)`. Seeded stream is Mulberry32 using state increment `0x6d2b79f5` and the standard 32-bit mix; `drawInt(n)` uses rejection sampling with `limit = floor(2^32/n) × n`, rejects words `>= limit` by consuming the next word, and returns `word % n`; `n=1` returns 0 without consuming. One stream continues across rejected candidates (never rewind). Per candidate draw order: phase-2 negative count `1 + drawInt(2)`; phase-3 negative count `drawInt(3)`; one `drawInt(6)` selecting from legal HEAVY pairs `[(14,16),(14,17),(14,18),(15,17),(15,18),(16,18)]`; then fill Learn, Plan, Pressure in turn order. Learn draws one value index per tile from `[1,2,3,4]`. For each non-HEAVY Plan/Pressure tile, choose sign conditionally from remaining slots/negative count (skip the draw when forced), then choose from sorted sign pool (`[-3,-2]` / `[2,3,4,5]`; Pressure `[-4,-3,-2]` / `[2,3,4,5,6]`); each HEAVY slot draws from `[2,3]`. Candidate-level structural/DP rejection consumes every draw already made and generation continues on the same stream. Exactly 50 full attempts; after attempt 50, return a literal static fallback validated by the same validator and consume no further RNG. Constraints: a baseValue cannot occur three turns consecutively regardless of weight; negative tiles cannot occur three consecutively; HEAVY cannot be adjacent; fully identical adjacent tiles (same baseValue and weight) are forbidden. For side pressure, using all DP-reachable safe differences before a turn, that turn is globally forced LEFT/RIGHT only if every state has exactly that one safe side; reject any run of 3+ consecutive turns globally forced to the same side (runs do not reset at phase boundaries).
- fallback literal, in turn order (`baseValue × weight`; omitted weight is 1): `+1, +2, +1, +2, +1, +2, -2, +3, -3, +4, +5, +2, +3, +2×2, -2, +3×2, +4, +5`. It contains two Plan negatives, one Pressure negative, and two legal nonadjacent Pressure HEAVY tiles. Inline Node harness checked all 18 phase/weight/count/adjacency rules and the same frozen DP recurrence: post-turn safe-state counts are `2,4,5,7,8,8,8,7,8,8,7,7,6,6,6,6,6,7`; every pre-turn reachable safe state has at least one in-limit side, no dead-end state occurs, the final safe set has 7 states, and no global forced-side run occurs. This pre-implementation harness is not tracked; C must encode the same fallback and add permanent regression coverage.
- Difference-DP semantics: signed state is `D = leftTotal - rightTotal`, start `S0={0}`. For tile effective value `v`, expand `D+v` (LEFT) and `D-v` (RIGHT), retain only integers with `abs(Dnext) <= L_t`, and deduplicate by numeric state after each turn. Before every one of the 18 turns, every currently reachable safe state must have at least one safe side for that turn; a single dead-end state rejects the sequence even if other paths survive. Empty next set rejects immediately; acceptance requires a nonempty safe set after turn 18. Final-turn states need no later continuation check. Return diagnostics `{valid, reason, failedTurn, reachableCountsByTurn, deadEndCount, forcedSideRun}`; validator is pure/UI-free and is the exact acceptance validator used for both generated candidates and fallback.
- input/storage/accessibility contract: use native Left/Right placement buttons; button and keyboard paths call the same synchronous lock. Keyboard maps ArrowLeft/A and ArrowRight/D case-insensitively; ignore repeats, IME composition, Ctrl/Alt/Meta-modified events, and targets in editable or interactive contexts (`input`, `textarea`, `select`, `option`, `[contenteditable]`, `a`, `button`, `[role=button]`). Only prevent default for an accepted game shortcut during TURN. Storage key `emfls:twin-ledger:best:v1`; exact JSON shape `{bestScore, bestMaxCombo}` with only those own keys. Validate each field independently as a non-negative safe integer; wrong object shape/malformed JSON yields both zero, a bad field in an otherwise exact shape yields zero only for that field. Storage getter/read/write failures never block play; read failure gives in-memory zeros, completed run still updates both in-memory maxima independently, and write failure leaves those maxima available for the current result/session. Persist only these two bests, never a current session. Native controls and visible focus; minimum targets 44×44 CSS px; restrained atomic polite status only for critical feedback/result; signed numbers and HEAVY labels announced in text. Reduced motion simplifies/omits decorative movement without changing state durations, game logic, score, or generation.
- repository/test finding: current `package.json` has no `check` script and no test dependency. To honor G's required `npm run check` without adding a dependency, C will add a documented built-in Node test script (`node --experimental-strip-types --test`) and permanent focused `.mjs` tests for Twin Ledger pure modules. Node `v24.15.0` successfully imported an existing `.ts` pure module with `--experimental-strip-types`. Temporary DOM/browser harnesses remain outside the repository; no QA harness is tracked unless it is part of this intentional regression suite.
- frozen file plan: B creates only `src/pages/games/twin-ledger.astro`, `src/components/games/TwinLedgerGame.astro`, `src/styles/games/twin-ledger.css`, and a six-panel structural `src/games/twin-ledger/controller.ts`; shell actions remain non-gameplay. C creates `src/games/twin-ledger/types.ts`, `constants.ts`, `rng.ts`, `fairness.ts`, `sequence.ts`, `logic.ts`, permanent `tests/twin-ledger/*.test.mjs`, and the no-dependency `package.json` check script. D adds `input.ts` and completes `controller.ts` plus a DOM rendering helper only if controller separation proves useful; it integrates placement, render state, visibility pause, and timer cleanup but not storage. E adds `storage.ts` and integrates score/result/finalization/rematch. F may change only Twin Ledger component/CSS/renderer/input for responsive/accessibility/reduced-motion polish; no math/generator changes absent a separately demonstrated regression. G is QA-only; each proven product defect gets its own `P3-G05-G-FIX-XX` regression+minimal Twin Ledger source fix+history commit, then full G is rerun. No shared-shell/catalog/route-config/dependency/redirect/legacy/protected-project edits.
- exact gates/subjects: A history-only, `git diff --check`, `npm run build`=61 pages, route absent, clean commit `docs: plan Twin Ledger implementation`; B build=62 plus exact six-panel/metadata/no-Related audit, `feat: add Twin Ledger game shell`; C `npm run check`, fallback/DP/math/generator tests, build=62, `feat: add Twin Ledger deterministic game core`; D controller/input deterministic and browser evidence for one-time signed/HEAVY placement, lock, pause/resume, cleanup, build=62, `feat: add Twin Ledger placement controls`; E actual browser Start→18 placements→RESULT→Play Again→fresh TURN plus score/bonus/storage/Breach continuation, build=62, `feat: complete Twin Ledger match loop` and only then maturity PLAYABLE; F browser measurements `1440×900`, `390×844`, `320×700`, overflow/44px/accessibility/reduced-motion checks, `feat: polish Twin Ledger responsive UI`; G comprehensive specified route/state/seed/DP/input/scoring/pause/storage/responsive/browser/regression audit, `npm run check`, `npm run build`=62, `git diff --check`, final QA-only `docs: complete Twin Ledger final QA`, maturity COMPLETE, QA_PASS, site `RELEASE_READY = NO`. Every stage has its own history entry, commit, clean checkpoint, normal push attempt and remote proof when DNS permits. No G06 work.
- A verification before commit: `git diff --check` PASS; `npm run build` PASS at 61 pages; Twin Ledger route remains absent; no dependency changes; only this history file differs. `P3-G05-A PASS` locally. Push is `REMOTE_PENDING` after the documented DNS failure; retry at B and later clean checkpoints without repeated network hammering.
- next: `P3-G05-B — Twin Ledger route / DOM shell / exactly six-state structure`.

## 2026-09-27 — P3-G05-B Twin Ledger Route and Six-State Shell

- branch: `pivot/web-games-mvp`; starting HEAD: `b7913ec6b998aa2dd39ad8b430fa69f1a55108fc`; A commit is pushed and its remote SHA was verified.
- created the canonical `/games/twin-ledger/` route through the existing catalog slug and `GameDetailFrame`; no catalog value or shared layout changed. Built output has English metadata, catalog description, canonical, H1, and VideoGame JSON-LD; no Related Games or placeholder copy.
- created the DOM/CSS shell with Left/Right ledger areas, turn/difference/zone/score-combo HUD, current tile, exactly one next-preview surface, balance-meter shell, Start/Left/Right/Resume/Play Again controls, and exactly the six A-frozen panels. The controller only validates/mounts those six panels in IDLE; buttons are structural/inert at B, with placement disabled. No generator, scoring, storage, keyboard gameplay, transactions, pause lifecycle, or result calculation leaked into B.
- TDD static-route contract: temporary Node test failed before implementation because the built route was absent, then passed against the generated page for route metadata, unique canonical/H1, VideoGame JSON-LD, one preview marker, six unique panels, structural controls, and no Related Games/placeholder. Temporary harness is outside the repository.
- verification: `git diff --check` PASS; `npm run build` PASS — 62 pages; four completed game routes remain in the build; route is generated exactly once; dependencies and catalog unchanged. Maturity remains `SHELL`.
- status: `P3-G05-B PASS`.
- next: `P3-G05-C — deterministic pure core, bounded sequence generation, fairness DP, and scoring math`.

## 2026-09-27 — P3-G05-C Twin Ledger Deterministic Pure Core

- branch: `pivot/web-games-mvp`; starting HEAD: `03adb45549f7789d4014a3c9376899215bb73d00`; B is pushed and its remote SHA was verified.
- created pure types/constants/RNG/fairness/sequence/scoring modules under `src/games/twin-ledger/`, four permanent dependency-free Node test files under `tests/twin-ledger/`, and a `package.json` `check` script using Node's built-in test runner. No dependency or lockfile change. Browser input/lifecycle, storage, and UI integration remain deferred to D/E; maturity remains `SHELL`.
- ruling clarifying A's side-pressure metric: A initially defined a direction as forced only when every reachable safe difference required that same direction. Root-cause analysis showed the DP set is symmetric around zero: `D` and `-D` are both reachable and their LEFT/RIGHT safety choices mirror, so that global predicate can never be true. C therefore supersedes that predicate with path-level detection: track each reachable `(difference, prior forced side, run)`; when a state has exactly one in-limit side, continue that forced-side run, reset it when both sides are safe, and reject any safe path reaching 3 consecutive same-side forced turns. A's inline harness fallback remains valid under this stronger rule (18 turns, 7 final safe states, zero DP dead-ends, max forced run 2). Cost if this conservative rejection is wrong: the generator could reject a sequence that still has other less-constrained safe paths, raising retries/fallback frequency; it never rejects user play or changes scoring.
- DP diagnostic precedence is explicit: if a turn produces no safe next state, report `NO_SAFE_PATH`; if some states survive but any reachable pre-turn state has no safe side, report `DEAD_END`. The DP deduplicates signed integer differences each turn, checks all reachable pre-turn states including the final placement, requires a nonempty final safe set, and tracks forced-side streaks without enumerating exponential histories.
- generator contract is implemented as frozen: Mulberry32 uint32 stream, unbiased rejection-sampled bounded integers, one stream across candidate rejections, 50 attempts, sorted/phase-ordered pools, exact negative and HEAVY selection, and no random draws on static fallback. The literal fallback is passed through the same sequence+DP validator. Logic provides effective signed values, phase zone boundaries, post-update combo multipliers, rounded per-turn points, counts, and pure final bonus calculation.
- TDD: 17 built-in Node tests cover phase pools/boundaries, tile and HEAVY validation, every zone/multiplier band, round semantics, combo reset/update, exact/breach counts, both final bonuses, DP safe/no-path/dead-end/dedup/final/signed/HEAVY/path-force behavior, fallback, phase/negative/HEAVY/adjacency constraints, 100 deterministic seeds, 50-attempt fallback, invalid RNG words, and no hidden random calls. `npm run check` PASS — 17/17. `git diff --check` PASS. `npm run build` PASS — exactly 62 pages; all four completed game routes remain present. Temporary browser harnesses are not part of this stage.
- status: `P3-G05-C PASS`; Twin Ledger remains `SHELL`; site `RELEASE_READY = NO`.
- next: `P3-G05-D — input, one-time placement transaction, DOM updates, and pause/resume lifecycle`.

## 2026-09-27 — P3-G05-D Twin Ledger Input, Placement, and Pause Lifecycle

- branch: `pivot/web-games-mvp`; starting HEAD: `70598a6227358eb8aa0b7a6a54aa9c746a53ae25`; C is pushed and its remote SHA was verified.
- connected the generated, already-validated 18-tile sequence to the six-state controller. One synchronous `commitPlacement` applies the signed/weighted value, selected total, difference, zone, turn increment, current/next advancement, and chronological recent history capped at four. The RESOLVING state locks the shared click/keyboard path immediately; timer phases use A's exact 120ms + 300ms durations, and invalidated callbacks cannot resume after pause or cleanup. D leaves score/combo display neutral and Play Again disabled for E; it adds no storage.
- added case-insensitive ArrowLeft/A and ArrowRight/D shortcuts with repeat, composition, and Ctrl/Alt/Meta guards; editable/interactive focus is excluded. Negative values and HEAVY multipliers are textual, not color-only. The meter updates its accessible values and visual fill; session-generation errors remain in IDLE with an accessible inline message. A route return through browser Back reinitializes a clean IDLE controller; `astro:before-swap`/`pagehide` cleanup removes listeners and invalidates timers.
- corrected the Astro component's missing opening frontmatter delimiter, which had exposed its CSS import as visible page text. Added a compact, token-styled recent history list. No other game, shared layout, catalog, route config, dependency, redirect, legacy, or production file changed.
- TDD: new dependency-free input/controller tests first failed on the absent exports, then passed after implementation. `npm run check` PASS — 23/23, including signed and HEAVY placement, one-time transaction guard, chronological four-item history, turn-18/no-turn-19 handling, shortcut guards, and pause/resume state semantics for TURN, RESOLVING, FEEDBACK, and final RESULT.
- local browser evidence: `/games/twin-ledger/` starts with one current and one next tile; native button and keyboard placement update totals; double-click commits once; unrelated focused navigation links do not consume shortcuts; generated negative and HEAVY cues are explicit; full session reaches `18 / 18` RESULT with both placement buttons and Play Again disabled, `Sequence complete`, and exactly four chronological recent entries. Local route navigation during a live turn clears the old controller; Back returns to `IDLE` with a newly attached controller.
- visibility-event limitation: the in-app browser and isolated Chrome QA tab both remained in `TURN` when switched to a separate blank tab, and hiding the browser did not change page state; these automation surfaces did not deliver a document `visibilitychange` event. Pause/resume transition semantics are covered by deterministic tests, but dispatch of the native hidden event was not independently confirmed in a real foreground/background browser window.
- verification: `git diff --check` PASS; `npm run build` PASS — exactly 62 pages; no dependencies or lockfiles changed. Maturity remains `SHELL`; site `RELEASE_READY = NO`.
- status: `P3-G05-D PASS` with the native visibility-stimulus limitation above.
- next: `P3-G05-E — scoring, result finalization, storage, and Play Again`.

## 2026-09-27 — P3-G05-E Twin Ledger Scoring, Results, Storage, and Rematch

- branch: `pivot/web-games-mvp`; starting HEAD: `d602ff577b530f8328393dc5265e3af9649c4d23`; D is pushed and its remote SHA was verified.
- connected the pure C scoring resolver to the same synchronous placement transaction: each accepted tile updates zone, combo/max combo, exact/breach counts, turn points, and score once. Breach scores zero for that turn but does not end play. On the committed 18th tile, both frozen bonuses and the exact six-field result are calculated once before RESOLVING; timers still only advance presentation and final-turn Resume can go straight to RESULT.
- added `storage.ts` using only `emfls:twin-ledger:best:v1` and exact `{bestScore,bestMaxCombo}` JSON. Getter/read/parse/write failures safely fall back or preserve in-memory results; each non-negative safe-integer field validates and updates independently. Only final best stats are persisted—never an in-progress session. Play Again is enabled only in RESULT, generates a fresh seed/sequence, resets gameplay fields and history, and preserves the best stats in memory.
- TDD: storage/controller tests first failed for absent scoring/storage integration, then passed. `npm run check` PASS — 31/31, including unavailable and throwing storage, malformed/wrong-shape JSON, negative/unsafe fields, independent bests, Breach continuation, turn-18 bonuses exactly once, and post-result match guard. `git diff --check` PASS. `npm run build` PASS — exactly 62 pages.
- actual local browser: completed Start → 18 committed placements → RESULT → Play Again → fresh TURN. Score changed on placements; Breach occurred repeatedly without ending the match; negative and both HEAVY cues rendered as text. The run ended at turn points 838, final difference 1, five Breaches, max combo 3; the 150-point final-difference bonus produced RESULT score/best score 988. Result exposed exactly Score, Final Difference, Exact Count, Breach Count, Max Combo, Best Score. Rematch showed turn 0/18, zero totals/difference/score/combo, Exact zone, a fresh current/next pair, empty history, and Play Again disabled.
- fixed a browser-discovered missing `getEffectiveValue` import in HEAVY tile rendering; the first attempt halted at a HEAVY placement, and the complete 18-turn run above passed after correction with no new runtime error.
- maturity: Twin Ledger `PLAYABLE`; site `RELEASE_READY = NO`. No dependency/lockfile, route, catalog, shared-shell, legacy, redirect, DNS, Cloudflare, or Production changes.
- status: `P3-G05-E PASS`.
- next: `P3-G05-F — responsive, accessibility, reduced-motion, and visual polish only`.

## 2026-09-28 — P3-G05-F Twin Ledger Responsive and Visual Polish

- branch: `pivot/web-games-mvp`; starting HEAD: `ab4cd5d7e03082e44fd6a0d2360a2cd3b9243844`; E is pushed and locally matches `origin/pivot/web-games-mvp`.
- polished only `src/styles/games/twin-ledger.css`: differentiated Left/Right ledgers and actions, enlarged high-contrast current tile, outlined next preview, recent placement chips, signed difference/zone emphasis, a segmented responsive balance meter with warning/danger escalation, concise CSS-only placement feedback, and visible focus on the keyboard-focused game root. No game logic, score, sequence, transaction, timer, or storage behavior changed.
- responsive QA covered 1440×900, 390×844, and 320×700. The first 320px pass exposed a real horizontal scrollbar: the shared `html { min-width: 320px }` exceeded the 305px content width after the classic vertical scrollbar. Corrected only the Twin Ledger stylesheet with `:root:has(.twin-ledger) { min-width: 0 }`; the 320px RESULT view then showed no horizontal scrollbar and kept all six result metrics and the 44px Play Again control reachable. No shared-shell source was changed. Earlier 390px and desktop measurements showed no horizontal overflow; the route-scoped exception does not alter those breakpoints.
- keyboard focus-visible styling is explicit on the root and descendants; both placement controls remain at least 44px high. Actual gameplay showed Exact/Tense/Danger/Breach labels and risk meter escalation, while 18-turn RESULT remained ordinary document content with no trapping overlay. Reduced-motion CSS removes decorative transitions/feedback animation without any game-timing callback; this browser session did not emulate the OS reduced-motion preference.
- verification: `npm run check` PASS — 31/31; `npm run build` PASS — exactly 62 pages; `git diff --check` PASS. Only Twin Ledger CSS and this history entry changed; no dependency, route, shared shell, completed-game, legacy, redirect, Cloudflare, DNS, or Production changes.
- status: `P3-G05-F PASS`; Twin Ledger remains `PLAYABLE`; site `RELEASE_READY = NO`.
- next: `P3-G05-G — comprehensive final QA, QA first`.

## 2026-09-28 — P3-G05-G Twin Ledger Comprehensive Final QA

- branch: `pivot/web-games-mvp`; G started from F commit `9ebdb7341cbaad460e6bbcb8bc542fc38d369271`. QA began with a clean worktree; no product source was changed during G.
- contracts: the built `/games/twin-ledger/` route has one English H1/title, catalog description/identity, trailing-slash canonical, and `VideoGame` JSON-LD; exactly the six specified state panels; semantic six-pair `<dl>` result; no Related Games or placeholder copy. The five built game routes (Pulse Junction, Mirror Drift, Gravity Pact, Orbit Slip, Twin Ledger) retain English metadata, canonicals, and VideoGame JSON-LD.
- generator/fairness: tested 1,000 deterministic seeds plus uint32 boundary seeds 0 and 4,294,967,295. Every sequence was 18 tiles, deterministic, contract-valid, and accepted by its own production Difference-DP validator. 102/1,000 seeds used the permitted fallback only after all 50 candidate attempts; both production and validator diagnostics agreed. Known no-path, dead-end, signed/HEAVY, final-turn, and forced-side cases remain covered by regression tests.
- state/scoring/input/storage: exercised legal and illegal placement, pause, and resume helpers across all six states; only TURN accepts a placement; TURN/RESOLVING/FEEDBACK pause, committed phases resume without replay, and final committed resume yields RESULT. The 31-test suite covers phase pools/limits, all zones, scoring/combo/bonuses, generation/DP/fallback, input guards, and storage failure/validation cases. Actual local browser actions verified ArrowRight and A/D keyboard placement, rapid duplicate suppression, native click through the same transaction, link-focus shortcut guard, RESULT → Play Again, and a clean new Start after leaving/back navigation. Leaving during RESOLVING and returning after 500ms produced a fresh IDLE session; no stale timer advanced it.
- responsive/accessibility: checked 1440×900, 390×844, and 320×700. At 320px a visible horizontal scrollbar exposed the common 320px html minimum-width conflict with a 305px content viewport; the route-scoped Twin Ledger override removed the scrollbar without changing shared CSS. The mobile RESULT remained ordinary scrollable content with all six metrics and the 44×44 Play Again target reachable. Signed negatives, explicit HEAVY `×2`, text zone labels including Breach, four recent-placement entries, and polite placement feedback were present in the actual accessibility tree. CSS focus-visible and reduced-motion rules are present in the built route-only stylesheet.
- runtime/regression: actual local 18-turn play reached RESULT and rematched; route leave/back and an in-flight timer cleanup were exercised. Dev-server route requests returned HTTP 200. The in-app browser did not provide a native hidden-document visibility stimulus or reduced-motion emulation, and its interface did not expose browser-console retrieval; those specific stimuli remain unverified here. Pause/resume transition behavior is covered by pure tests and controller inspection; reduced-motion CSS is confirmed in the built asset. No production route was accessed.
- verification: `npm run check` PASS — 31/31; `npm run build` PASS — exactly 62 pages; all five game routes were inspected in built output. No dependency, lockfile, other game, GameLayout/shared shell, catalog, route configuration, redirect, legacy, Cloudflare, DNS, or Production file changed. No Game 6 work began.
- status: `P3-G05-G FINAL PASS`; Twin Ledger `QA_PASS`; Twin Ledger `COMPLETE`; maturity `PLAYABLE`; site `RELEASE_READY = NO`.
- remote note: the F normal push returned a successful fast-forward response for `9ebdb73`; the subsequent independent `git ls-remote` check could not resolve `github.com`. Final G push/remote status is reported separately from this local QA verdict.
- next: `P3-G06-A` only as a separate authorized task; not started here.

## 2026-09-28 — P3-G06-A Signal Sweep Final Specification and File Plan

- branch: `pivot/web-games-mvp`; starting HEAD: `008aed6fb0e56d5255c1beed28574af35a85b618`; initial worktree clean. The local tracking ref matched this SHA and `origin` is `https://github.com/emfls/emfls-site.git`. Initial live `git ls-remote` could not resolve `github.com`; remote delivery is pending and is not inferred from the tracking ref.
- source review: read the complete P0-11-G06 Signal Sweep contract, existing catalog entry and GameDetailFrame contract, current Twin Ledger route/component/pure-module/test conventions, TASKS.md, and current project history. Catalog metadata is already authoritative; Signal Sweep route/source is absent. Baseline is 62 built pages and the existing dependency-free Node test runner; no package changes are planned.
- scope: A is planning-only; this record is its sole persistent change. No route, component, CSS, game module, test, config, dependency, completed-game, shared-shell, legacy, redirect, production, Cloudflare, or DNS change. Signal Sweep route remains absent; site RELEASE_READY remains NO.
- public contract: canonical route `/games/signal-sweep/`; locate the existing `games.ts` object by `slug === 'signal-sweep'` and pass it to GameDetailFrame without editing catalog metadata. Inherit title, description, canonical, robots/OG, and VideoGame JSON-LD from the existing frame; public language is English; do not render Related Games or placeholder copy. Frozen How to Play: “Read the rule, then tap every matching symbol before time runs out. Correct picks stay selected; wrong picks cost points but do not end the round. Clear all 15 rounds to finish.” Controls: “Tap or click each matching tile. Keyboard: Tab to a tile, then press Enter or Space.” Scoring: “Each correct tile: +100. CLEAR bonus: +200, multiplied by the clean streak at round start (×1.00 at streak 0–1, ×1.10 at 2–3, ×1.20 at 4–5, ×1.30 at 6+), plus floor(time left in 100ms units) ×2 (maximum +160). Wrong tile: −50; score never drops below 0. TIMEOUT adds no extra penalty. The streak multiplier affects only a CLEAR bonus.”
- symbol contract: immutable `SymbolData = { id, shape, fill, mark, colorFamily }`; domains in stable order are shape `circle, triangle, square, diamond`, fill `solid, striped, hollow`, mark `none, dot, line, cross`, and color token IDs/names `coral/Coral`, `teal/Teal`, `violet/Violet`, `amber/Amber`. CSS tokens map respectively to `#B5473C`, `#147B80`, `#6941A5`, `#9A5B00`; color is always supplementary and never a sole rule. Canonical visual tuple order is shape/fill/mark/colorFamily; stable tile IDs are session/round/attempt/kind/ordinal IDs and are not random. SVG geometry, fill/pattern, mark, CSS color, evaluator attributes, and accessible name are all derived from this same record. Accessible label pattern: “Coral striped triangle with a dot”; omit the final clause for mark=none. Reject target/distractor pairs that have no shape/fill/mark difference, so color alone can never distinguish a correct tile from a distractor.
- rule/evaluator contract: immutable expression AST is the single source for both short English text and evaluator behavior; no separately-authored rule sentence or predicate. The frozen registry has 17 stable IDs: Tier 1 `T1_SHAPE`, `T1_FILL`, `T1_MARK`; Tier 2 `T2_SHAPE_FILL`, `T2_SHAPE_MARK`, `T2_FILL_MARK`; Tier 3 `T3_NOT_SHAPE_AND_FILL`, `T3_NOT_FILL_AND_MARK`, `T3_NOT_MARK_AND_COLOR_AND_SHAPE`; Tier 4 `T4_SHAPE_OR_FILL`, `T4_SHAPE_FILL_OR_MARK`, `T4_COLOR_SHAPE_OR_FILL`; Tier 5 `T5_NOT_SHAPE_FILL_MARK`, `T5_NOT_FILL_SHAPE_COLOR`, `T5_OR_SHAPE_FILL_MARK`, `T5_OR_COLOR_SHAPE_FILL`, `T5_OR_MARK_FILL_SHAPE`. All conditions are equality atoms, with only the specified Tier 3/Tier 5 conjunction templates permitting one NOT. OR has two AND branches, no NOT, at most three total atoms, and every color-bearing branch also contains a non-color atom. Negative mark parameters exclude the none value to keep generated English natural. Stable parameter domains follow the symbol order above. Rule text is rendered from AST atoms using the fixed English lexicon and “Find every symbol that …”; OR text says “matches either … or …”. Store and validate the same registry ID as template, text source, and evaluator source. Validate OR branch non-identity by comparing their truth vectors across all 192 attribute tuples; reject color-only rules, any expression over three atoms, and any unsupported nesting.
- tiers: rounds 1–3 use one positive non-color atom and 3–5 targets; rounds 4–6 use two-atom AND and 2–5 targets; rounds 7–9 use exactly one NOT in a two/three-atom AND and 2–5 targets; rounds 10–12 use two non-identical OR branches and 3–6 targets; rounds 13–15 use either AND with exactly one NOT or a two-branch OR and 3–6 targets. Board sizes are 12/16/18/20/24 for the five respective three-round bands. Validator requires at least six distractors, correct tier size/target bounds, all targets true, all distractors false, unique valid IDs, no target/distractor visual ambiguity, no tuple over three occurrences, matching template/text/evaluator IDs, and the near-miss minimum.
- RNG/generation: generator version 1 uses Mulberry32 over unsigned 32-bit seeds and rejection-sampled unbiased `drawInt`; `drawInt(1)` returns zero without consuming a word. Acquire one session seed from one `crypto.getRandomValues(Uint32Array(1))` draw; if unavailable/throwing, use exactly one validated `Math.random()` draw; no clock-derived or hidden randomness. Generate all 15 rounds up front from one session stream. Per candidate, draw in this order: sorted tier-template index; template parameters in AST order and stable domain order; target count uniformly within tier bounds; target tuples in board-generation order from lexicographically enumerated matching tuples whose tuple count remains below three; required near-miss tuples; remaining false distractors; then descending Fisher–Yates board shuffle. A bounded draw with one possible value consumes no random word. Rendering, evaluation, validation, IDs, and diagnostics consume no randomness. Every rejection preserves all consumed words and continues the same session stream; maximum 30 candidates per round. A near miss is false under the rule, differs from a true target in exactly one referenced rule attribute, and that changed attribute is shape/fill/mark; every distractor also differs from every target on at least one non-color attribute. Require `nearMissCount >= ceil(distractorCount / 2)`. Same seed plus generator version reproduces rules, full boards/order/IDs, target positions, diagnostics, and fallback decisions.
- validated fallback: after 30 rejected candidates for round i, build that round with the isolated deterministic fallback seed `0x5eed0000 + (i - 1)`, candidate attempt ceiling 30, and the exact production validator; this does not consume or rewind the session RNG. If fallback also fails validation, safely remain in IDLE with an accessible generation message (no ERROR state). The same production-candidate/validator harness checked all 15 fallback seeds; each passed on its first candidate. Frozen (template, target count, board size, near-miss count) by round: R1 (T1_SHAPE,3,12,9), R2 (T1_FILL,3,12,9), R3 (T1_FILL,4,12,8), R4 (T2_SHAPE_MARK,5,16,9), R5 (T2_FILL_MARK,4,16,11), R6 (T2_SHAPE_FILL,4,16,10), R7 (T3_NOT_FILL_AND_MARK,5,18,11), R8 (T3_NOT_SHAPE_AND_FILL,4,18,12), R9 (T3_NOT_SHAPE_AND_FILL,3,18,9), R10 (T4_SHAPE_FILL_OR_MARK,4,20,9), R11 (T4_COLOR_SHAPE_OR_FILL,3,20,10), R12 (T4_COLOR_SHAPE_OR_FILL,5,20,13), R13 (T5_NOT_FILL_SHAPE_COLOR,4,24,13), R14 (T5_OR_MARK_FILL_SHAPE,6,24,13), R15 (T5_OR_SHAPE_FILL_MARK,4,24,12). Permanent C tests must pin these seeds, full validity, and production-validator parity.
- scoring/statistics: award +100 synchronously once per newly selected target; a target cannot be toggled or re-awarded. Each distinct native click on a distractor adds one mistake and applies −50 with immediate floor clamp at zero; no time-based debounce, and only native button `click` is observed so pointer/touch synthesis is not handled twice. CLEAR-only time bonus samples remaining time at the accepted final-target event timestamp and is `min(160, floor(max(0, remainingMs)/100) * 2)`; apply clear bonus then time bonus exactly once. Capture streak at round start; its band multiplies only that round’s CLEAR bonus with `Math.round(200 * multiplier)`; current-round cleanliness only increments streak after resolution for the next round. Any mistake or TIMEOUT resets streak to zero; TIMEOUT has no extra penalty. Per-round accuracy is correct/(correct+mistakes), zero denominator = 0. Average Accuracy is the arithmetic mean of all 15 unrounded per-round ratios; display as nearest whole percent via `Math.round(ratio * 100)`. Result fields are exactly Score, Correct Targets, Mistakes, Clean Rounds, Average Accuracy, Best Score.
- clock/lifecycle: use `performance.now()`; deadline is ACTIVE-entry time plus that round’s duration (8000/7500/7000/6500/6000ms); bounded timer text refresh is 100ms and never determines outcome. Input timestamps are monotonic event timestamps; normalize only a legacy epoch-style timestamp against `performance.timeOrigin`, otherwise fall back to the current monotonic sample. A final-target input with timestamp strictly less than deadline wins; timestamp equal to or after deadline loses. Deadline callback records the logical deadline and schedules one zero-delay arbitration task so already queued pre-deadline native click events can be compared by timestamp; all later/equal inputs lose. Wrong feedback is 250ms; normal rule preview is 900ms; ROUND_FEEDBACK is 450ms. Exactly six states: IDLE, RULE_PREVIEW, ACTIVE, ROUND_FEEDBACK, PAUSED, RESULT; CLEAR/TIMEOUT are ROUND_FEEDBACK outcome data. Preview pause restarts the same rule for 600ms on explicit Resume, with ACTIVE timer not yet started. ACTIVE pause stores exact nonnegative deadline remainder and same rule/board/selection/mistakes; Resume shows same rule 600ms then starts that remainder. If deadline has already elapsed, TIMEOUT resolves before pause. ROUND_FEEDBACK pause preserves its remaining presentation time and already-committed outcome; explicit Resume continues that remainder, then goes once to next round’s 900ms preview or to RESULT after R15, never replays scoring. Visibility return alone never resumes; visibility hidden and orientation change pause any live phase. Generation nonce invalidates stale timer/animation callbacks on transition, pause, remount, and cleanup.
- storage: only `emfls:signal-sweep:best:v1`, exact JSON keys `bestScore` and `bestCleanRounds`, each independently accepted only as a nonnegative safe integer. Missing/malformed/wrong-shape reads yield zero maxima; if one field is invalid, preserve the other valid field independently. Getter/read/parse/write exceptions never block play; keep in-memory maxima when persistence fails and do not persist a session. Update both bests independently; persist only on RESULT.
- files/gates: B creates only `src/pages/games/signal-sweep.astro`, `src/components/games/SignalSweepGame.astro`, `src/styles/games/signal-sweep.css`, and a structural six-state `src/games/signal-sweep/controller.ts`; expected build 63 pages, no randomized/gameplay behavior. C creates `types.ts`, `constants.ts`, `rng.ts`, `symbols.ts`, `rules.ts`, `generator.ts`, `validator.ts`, `scoring.ts`, plus permanent dependency-free `tests/signal-sweep/*.test.mjs`; no package/dependency change. D creates `input.ts` and `timer.ts`, integrates the controller and native button/SVG symbol view (add `src/components/games/SignalSymbol.astro` only for shared inline-SVG rendering), and implements real board/input/lifecycle but not best-stat persistence. E adds `storage.ts`, integrates full score/streak/result/Play Again, and proves the full 15-round browser loop; only after E PASS maturity becomes PLAYABLE. F may alter only Signal Sweep component/view/CSS for responsive/accessibility/reduced-motion polish, not game math. G is QA-first/history-only absent a reproducible defect; any product fix is a separately numbered minimal fix with regression test and full G rerun. Every stage has its own history record, exact starting HEAD, scoped checks, check/build/diff validation, clean commit, and normal push attempt.
- stage subjects: A `docs: plan Signal Sweep implementation`; B `feat: add Signal Sweep game shell`; C `feat: add Signal Sweep deterministic game core`; D `feat: add Signal Sweep round controls`; E `feat: complete Signal Sweep match loop`; F `feat: polish Signal Sweep responsive UI`; G `docs: complete Signal Sweep final QA`. Do not modify `games.ts`, GameDetailFrame/GameLayout/shared shell, package/config/dependencies, completed games, legacy/redirects, main, production, Cloudflare, or DNS; do not start Field Bloom.
- A proof: an in-memory pure-JS feasibility harness exercised the 17 frozen template IDs and shared AST-derived evaluator/text identity model, all 15 fallback seeds against the same candidate checks, 1,000 uint32 session seeds with exact 15-round deterministic replay, and seed boundaries 0 and `0xffffffff`. All fallback rounds validated, all 1,000 sessions reproduced exactly, and both boundaries produced 15-round plans. This is A feasibility evidence only; permanent regression suite, implementation/browser evidence, and final G seed audit remain owned by later gates.
- A verification: `npm run check` PASS — 31/31; `npm run build` PASS — exactly 62 pages; `/games/signal-sweep/` remains absent from generated output; `git diff --check` PASS. `git diff --name-only` is exactly `PROJECT_HISTORY.md`; no dependency or package change. Local A gate PASS. Push status is assessed separately at the clean commit checkpoint.
- status: `P3-G06-A PASS` locally; live remote proof remains pending after the recorded DNS failure.
- next: P3-G06-B only after A verification and clean commit.

## 2026-09-28 — P3-G06-B Signal Sweep Route and Six-State Shell

- branch: `pivot/web-games-mvp`; B starting HEAD: `ebeb9f9790042e5f5ad954dc2a559e6adeaa4371`; worktree clean. A's normal push returned a successful fast-forward response, but the independent post-push live lookup again failed to resolve `github.com`; remote SHA remains unverified independently.
- changed only `src/pages/games/signal-sweep.astro`, `src/components/games/SignalSweepGame.astro`, `src/styles/games/signal-sweep.css`, `src/games/signal-sweep/controller.ts`, and this history record.
- route: existing catalog object located by `signal-sweep` slug and passed directly to GameDetailFrame. Built route inherits English title/description, canonical, robots/OG, and VideoGame JSON-LD. Frozen How to Play/Controls/Scoring copy is present; no Related Games or placeholder/Coming Soon/Under Construction copy.
- shell: structural HUD/rule surface, responsive board container with no fake/randomized tiles, Start/Resume/Play Again controls, six panels exactly IDLE/RULE_PREVIEW/ACTIVE/ROUND_FEEDBACK/PAUSED/RESULT, and a controller that validates those six panels and mounts IDLE only. No generator, rule evaluator, random source, timer, selection, score/streak, pause lifecycle, storage, or 15-round gameplay was added; maturity remains SHELL.
- TDD: temporary out-of-repository shell contract test failed before implementation for missing route/component, then passed 2/2 after the shell was added. Built HTML contract check passed for exactly one canonical, English title/H1/catalog description, VideoGame JSON-LD, exactly six panels, no Related/placeholder copy, and all five previously completed game routes.
- verification: `npm run check` PASS — existing suite 31/31; `npm run build` PASS — exactly 63 pages and one `/games/signal-sweep/` output; `git diff --check` PASS. No dependency/config/catalog/shared-shell/legacy/redirect/completed-game change.
- status: `P3-G06-B PASS` locally; normal push and later bounded remote verification are due at this stage's clean commit checkpoint.
- next: P3-G06-C — deterministic symbols/rules/generator/validator/scoring core.

## 2026-09-28 — P3-G06-C Signal Sweep Deterministic Core

- branch: `pivot/web-games-mvp`; C starting HEAD: `90f264c7c296b9a13742557cefba563d501ea58a`; implementation commit: `581d0ef36a913ee32f9822c4797cdb63a042d319` (`feat: add Signal Sweep deterministic game core`).
- scope: added only the eight planned pure modules under `src/games/signal-sweep/` and six permanent Node test files under `tests/signal-sweep/`; no route, component, CSS, controller, catalog, package/config, legacy, redirect, completed-game, shared-shell, main, or production change. Signal Sweep maturity remains `SHELL`; site `RELEASE_READY = NO`.
- core: immutable four-attribute symbol model and color palette; stable 17-template registry with AST-derived English and evaluator; constrained tier grammar, NOT/OR/color/branch validation, near-miss predicate, and deterministic diagnostics. Mulberry32 uint32 source uses unbiased rejection-sampled bounded draws and a single explicit session-seed fallback path. Generator creates the complete 15-round plan from one stream, maintains the A-frozen draw order and tuple limits, retains consumed stream words on rejected candidates, caps at 30, and uses isolated fallback seeds with the same production validator. Scoring helpers implement the frozen target/mistake/bonus/streak/accuracy semantics.
- permanent C coverage: 29 tests cover every template ID and symbol domain, template/evaluator/text identity, truth witnesses and OR distinction, malformed/color-only/near-miss validation, five board-size and target-bound bands, deterministic replay and seed boundaries, 100 full uint32-derived sessions, all 15 frozen fallback summaries, 30-attempt fallback isolation, no hidden randomness, and score/streak/accuracy boundaries.
- verification: `npm run check` PASS — 60/60 total tests (29 Signal Sweep C tests plus 31 existing tests); `npm run build` PASS — exactly 63 static pages including the already-created B shell route; `git diff --check` and staged diff check PASS. Staged and committed file list matched the C allowance exactly.
- remote: normal `git push origin pivot/web-games-mvp` returned successful fast-forward `90f264c..581d0ef`. The one bounded independent `git ls-remote` immediately afterward failed because `github.com` could not be resolved; remote SHA confirmation remains pending and is not inferred from local tracking state.
- status: `P3-G06-C PASS` locally; browser gameplay is not part of C and remains unclaimed. Implementation commit is locally clean and push was accepted, while independent remote verification is pending.
- next: P3-G06-D — real board/input/timer/pause lifecycle only.

## 2026-09-28 — P3-G06-D Signal Sweep Round Controls

- branch: `pivot/web-games-mvp`; D starting HEAD: `1a0f1a243b80d2a39dac7651c597f3e2802e0d9e`; implementation commit: `b69c79cd651bca38a13c508e1a55b0bc43346890` (`feat: add Signal Sweep round controls`).
- scope: added the monotonic input-time and deadline timer helpers, integrated the deterministic 15-round plan into the native button/SVG board and six-state controller, and added route-scoped rendering and lifecycle teardown. Added permanent fake-clock, input, timer, and controller tests. No score/streak/result persistence or Play Again loop was added; those remain E. No dependency, catalog, shared-shell, completed-game, redirect, legacy, `main`, Cloudflare, DNS, or production change. Signal Sweep maturity remains `SHELL`; site `RELEASE_READY = NO`.
- behavior: one seed and validated plan per session; 900ms preview locks tiles; active targets select once while repeat selection is ignored; each distractor click registers a mistake and short `Not a match.` feedback without ending the round. Only native click is handled. The monotonic deadline, timestamp normalization, strict pre-deadline CLEAR rule, and zero-delay deadline arbitration keep outcome independent of display refresh. Manual/visibility/orientation pause preserve rule, board, selections, mistakes, and remaining time; explicit Resume re-previews for 600ms. Feedback pause resumes its remaining display time. Pagehide/Astro swap/unmount cancel timers, listeners, and stale callbacks.
- permanent D coverage: 12 focused tests cover double Start, preview lock, selection/retap, distractors, countdown and boundary arbitration, CLEAR/TIMEOUT, preview/active/feedback pause and resume, preservation of board/selection/remainder, hidden-time exclusion, orientation/visibility event paths, and cleanup/stale timers. Full `npm run check` PASS — 72/72 tests including prior suites. `npm run build` PASS — exactly 63 pages. `git diff --check` and staged diff check PASS.
- browser QA: local `/games/signal-sweep/` showed the 12/18-tile native board with accessible symbol labels and inline SVGs; at desktop test viewport, tile height measured 130px. Direct clicks selected a matching tile once, repeat activation did not toggle it, and a distractor showed `Not a match.` without ending ACTIVE. Manual pause held the same round, board, and displayed 2.2s remainder through an additional 1.1s wait; explicit Resume restored ACTIVE with the same selected tile. No browser warning/error logs were returned. Native backgrounding/orientation stimuli and a browser-completed full round were not independently exercised; deterministic controller tests cover those transitions and full match completion is E scope.
- remote: C's history commit was still locally ahead at D start after its push was rejected by DNS. No D push has yet been attempted at this history checkpoint; normal push and bounded remote verification remain due after the separate history commit.
- status: `P3-G06-D PASS` locally; implementation commit is locally verified. Maturity remains `SHELL`.
- next: `P3-G06-E` — scoring, streak, result, best-only storage, rematch, and full 15-round browser loop.
- remote follow-up: after the separate D history commit, normal `git push origin pivot/web-games-mvp` returned a successful fast-forward `581d0ef..7f16ee1`. An independent `git ls-remote` verified `pivot/web-games-mvp` at `7f16ee1f9ebf74e40e684d1559540e1b54bedba5`.

## 2026-09-28 — P3-G06-E Signal Sweep Match Loop

- branch: `pivot/web-games-mvp`; E starting HEAD: `6025f3ef1af66bb72007080c9387aac07ec02cdb`; implementation commit: `e25d78d211c3f1244c1370f6283790db38a503b5` (`feat: complete Signal Sweep match loop`).
- scope: integrated the existing scoring helpers into the controller, added best-only storage, exact six-field result rendering, and RESULT-only Play Again. Changed only `src/games/signal-sweep/controller.ts`, `src/games/signal-sweep/storage.ts`, `src/components/games/SignalSweepGame.astro`, two permanent E test files, and this record. No session/progress persistence or unrelated site/production configuration was added.
- scoring/statistics: each newly selected target adds 100 exactly once; each distinct mistake subtracts 50 with a zero floor. CLEAR applies the captured round-start streak multiplier bonus plus event-timestamp remaining-time bonus once; TIMEOUT adds no missing-target penalty. Per-round accuracy is correct/(correct+mistakes), empty rounds are 0, session average uses all 15 unrounded ratios. Clean rounds and streak update once at resolution; mistakes and TIMEOUT reset streak. RESULT exposes exactly Score, Correct Targets, Mistakes, Clean Rounds, Average Accuracy, and Best Score.
- storage/rematch: only `emfls:signal-sweep:best:v1` is accessed, with exact `{bestScore,bestCleanRounds}` JSON. Each safe nonnegative integer maximum updates independently. Missing, malformed, wrong-shape/field, unavailable, getter/read/write failures do not block the result; maxima remain in memory on write failure. Persistence happens once at RESULT, not during the session. Play Again is accepted only in RESULT, acquires a new seed and validated plan, resets all match totals, and preserves best maxima.
- permanent E coverage: 9 focused tests cover synchronous correct/mistake scoring, zero floor, single bonus application, streak/time bands across all 15 clean rounds, timeout without penalty, exact 15-round result/accuracy, fresh rematch, independent best updates, exact storage shape, absent/malformed/wrong-shape/invalid fields, native getter/read/write failures, and in-memory maxima after failed persistence. Full `npm run check` PASS — 81/81 tests. `npm run build` PASS — exactly 63 static pages. `git diff --check` PASS.
- browser QA: local game visibly changed score on correct/mistake input; an incorrect pick showed `Not a match.` while ACTIVE continued. A complete 15-round browser session reached RESULT with Score 5354, Correct Targets 30, Mistakes 1, Clean Rounds 6, Average Accuracy 46%, and Best Score 5354. Rounds 1–7 were explicitly cleared by native tile clicks; later active rounds elapsed to their normal TIMEOUT transitions while browser control was between bounded calls, then the session reached round 15 RESULT. RESULT → Play Again produced a different session seed/board, `1 / 15`, zero score, and RULE_PREVIEW/ACTIVE. Browser error/warning log was empty. This browser context exposed no `window.localStorage`; persistence success is therefore supported by deterministic storage tests rather than claimed as live-browser evidence. No production URL was used.
- maturity: `PLAYABLE` after the actual browser full-session RESULT and rematch path; site `RELEASE_READY = NO`.
- remote: E implementation commit is local at this history checkpoint; normal push and bounded independent SHA verification remain due after the separate E history commit. D's remote HEAD was independently verified at `6025f3ef1af66bb72007080c9387aac07ec02cdb`.
- status: `P3-G06-E PASS` locally.
- next: `P3-G06-F` — responsive/accessibility/reduced-motion/visual polish only; do not change game math.
- remote follow-up: after the separate E history commit, normal push returned successful fast-forward `6025f3e..a1991c2`; independent `git ls-remote` verified `pivot/web-games-mvp` at `a1991c2f1ac09f33b960687f5cf08230f0d7744b`.

## 2026-09-28 — P3-G06-F Signal Sweep Responsive and Accessibility Polish

- branch: `pivot/web-games-mvp`; F starting HEAD: `fd736561782a3df4b6ebef0a2fc596a4bbf6e8fb`; implementation commit: `ba6f719f845a80e0496e0ee8b6a9af8782e9111b` (`feat: polish Signal Sweep responsive UI`).
- scope: changed only the Signal Sweep component, controller presentation, and route-scoped CSS. No generator, rule evaluator, timer arithmetic, score/streak semantics, shared shell, route metadata, catalog, other game, dependency, redirect, or production configuration changed.
- observed defect and correction: at 320px, clicking Start scrolled the page to the low-positioned button and left the HUD/rule above the viewport. On widths through 48rem, Start, Resume, and Play Again now align the game surface at the top without animation; root scroll margin preserves breathing room. At 320px after Start, game top was 16px, HUD 32–117px, rule 137–250px, and board began at 331px, all within the 700px viewport. At 390px the analogous HUD/rule/board positions were 32–116px, 136–250px, and 331px.
- visual/accessibility polish: correct selections retain the visible ✓; an incorrect tile now also shows a non-color × while the polite `Not a match.` status remains. The timer changes to a restrained danger color only in the final 2 seconds. ROUND_FEEDBACK CLEAR uses a success accent and TIMEOUT a danger accent; no shake or other animation was introduced. Native button keyboard Enter activation selected a tile and updated score; focus-visible matched on the focused tile. Accessible names continued to expose shape, fill, mark, and color; native controls stayed usable.
- responsive evidence: at `320×700`, the actual 24-symbol tier rendered 3 columns × 8 rows in a 204px board; each tile measured at least 62.66px square and board height was 557.38px, with ordinary page scrolling and no inner scroll trap. At `390×844`, tiles measured 81px square in three columns. At `1440×900`, tiles measured 130px square in four columns. For all three sizes `documentElement.scrollWidth <= innerWidth` (320/320, 375/390, 1425/1440); at the mobile Start checkpoint rule, timer, score, and board were visible together. The six-metric RESULT remains normal-flow content reachable by page scroll, not a modal/overlay.
- reduced motion/performance: Signal Sweep CSS has no animation or transition to remove; new game alignment is instant and does not change any preview, active, feedback, or gameplay duration. Board nodes are replaced only when the round key changes; timer refresh does not replace the 24-tile board. No Canvas or continuous animation loop was introduced.
- verification: `npm run check` PASS — 81/81; `npm run build` PASS — exactly 63 pages; `git diff --check` PASS. Local browser logs contained no warnings/errors. Exact staged files were the component, controller presentation, and Signal Sweep CSS only. Site `RELEASE_READY = NO`.
- maturity: `PLAYABLE`; F does not claim G's comprehensive QA gate.
- remote: F implementation commit is local at this history checkpoint; normal push and bounded independent SHA verification remain due after the separate F history commit. E's remote HEAD was independently verified at `fd736561782a3df4b6ebef0a2fc596a4bbf6e8fb`.
- status: `P3-G06-F PASS` locally.
- next: `P3-G06-G` — comprehensive QA-first audit; keep source read-only unless a reproducible Signal Sweep defect appears.
- remote follow-up: after the separate F history commit, normal push returned successful fast-forward `fd73656..ac6d75b`; independent `git ls-remote` verified `pivot/web-games-mvp` at `ac6d75be7cb06392aed901a2f947fe6d9b42fe90`.

## 2026-09-28 — P3-G06-G Signal Sweep Comprehensive Final QA

- branch: `pivot/web-games-mvp`; G started at local HEAD `114b564a59929257f04ff255c3ce65e1c58dd626`, with a clean worktree. `origin` is `https://github.com/emfls/emfls-site.git`. The F history push returned success and the tracking ref matched; a fresh G-start `git ls-remote` failed with `Could not resolve host: github.com`, so no live remote SHA is inferred.
- scope/verdict: QA-first audit found no reproducible Signal Sweep product defect; no G-FIX stage was needed and no product/test source was changed. This final QA record is the sole G change. Signal Sweep `QA_PASS = YES`, `COMPLETE = YES`, maturity `PLAYABLE`; site `RELEASE_READY = NO`.
- route: local `/games/signal-sweep/` rendered title `Signal Sweep — Play Free in Your Browser | EMFLS Games`, one H1 `Signal Sweep`, trailing-slash canonical `https://emfls.com/games/signal-sweep/`, and the catalog description in the page and `VideoGame` JSON-LD. JSON-LD identifies Web Browser, Reflex, English, and the same canonical URL. Browser accessibility inspection found no Related Games section, placeholder form controls, or non-English game copy.
- states/grammar: controller and rendered shell contain exactly `IDLE`, `RULE_PREVIEW`, `ACTIVE`, `ROUND_FEEDBACK`, `PAUSED`, `RESULT`; controller enforces one panel for each. The 81-test suite covers state-legal input, preview lock, state transitions, repeated activation, timer boundaries, and stale callback cleanup. All 17 rule templates remain tier-bound; AST-rendered text, template/text/evaluator IDs, and evaluation agree. Tests cover color-only rejection, permitted atom/NOT/OR limits, invalid nesting, and non-identical OR truth vectors over all 192 symbol tuples.
- deterministic generator: swept 1,002 seeds (1,000 deterministic uint32 values plus 0 and `0xffffffff`) × 15 rounds = 15,030 rounds; every seed replay matched exactly and every round passed the production validator, with correct tier board sizes/target bounds, at least six distractors, evaluator/target agreement, IDs, tuple cap, visual ambiguity, and near-miss checks. Validator failures: 0. Natural fallback frequency: 0/15,030. Candidate attempts: 15,029 first-attempt accepts and one second-attempt accept (maximum two). Every tier reached its frozen target-count bounds. Observed tier-5 template counts ranged 554–646 across five templates; this is sample evidence only, not a claim of perfect fairness.
- fallback: intentionally generated all 15 frozen fallback rounds and ran each through the exact production validator; all 15 passed. Permanent tests also force all 30 normal candidates to reject, confirm validated fallback use and preservation of the main RNG stream, and pin the frozen fallback diagnostics.
- browser/input/match: real local browser at 320×700 verified Start → ACTIVE, native keyboard Enter target selection (+100), rapid duplicate activation without a second award, a distinct wrong tile (−50, `Not a match.`, ACTIVE continues), and completion of the remaining visible-rule targets to CLEAR. Manual pause during feedback held the same round through a wait; explicit Resume returned to ACTIVE. An actual UI session cleared rounds 1–12 and reached round 13 with 24 tiles, then completed rounds 13–15 through normal TIMEOUT/result flow: no 16th round, one RESULT panel, and exactly six result fields (Score 8726, Correct Targets 44, Mistakes 0, Clean Rounds 12, Average Accuracy 80%, Best Score 8726). Play Again reset to round 1, score 0, and RULE_PREVIEW. Deterministic tests separately cover just-before/equal/after deadline, final-target arbitration, manual/visibility/orientation pause semantics, storage validation/failures, scoring, streak, accuracy, and full 15-round statistics.
- responsive/accessibility/runtime: browser measurements showed no horizontal overflow at 1440×900 (1425px document width), 390×844 (375px), or 320×700 (320px). The actual 24-tile 320px board used three columns, 204px board width, 557.38px height, and minimum 62.66px tile size; board overflow remained visible and the document used ordinary vertical scrolling. Native button labels expose color/fill/shape/mark; correct ✓ and wrong × indicators supplement color, focus-visible styling and polite status/result semantics are present, and result content is a normal-flow definition list. Signal Sweep CSS has no animation/transition; timer urgency and CLEAR/TIMEOUT feedback remain visibly differentiated. Browser error/warning logs were empty. The browser tooling could not create a genuine native hidden-document or physical orientation-change stimulus; those two lifecycle paths are covered by deterministic controller event tests, not claimed as live-device evidence.
- regression/protection: final build contains the six game routes (Pulse Junction, Mirror Drift, Gravity Pact, Orbit Slip, Twin Ledger, Signal Sweep); the 81-test suite passes including existing completed-game regression tests. No completed-game source, shared shell, catalog, dependency, redirect, legacy, `main`, Production, Cloudflare, or DNS configuration was changed; no `emfls.github.io` access occurred and P3-G07 did not start.
- verification: `npm run check` PASS — 81/81; `npm run build` PASS — exactly 63 pages; `git diff --check` PASS; G diff scope is exactly `PROJECT_HISTORY.md`.
- remote checkpoint: the normal F history push returned success through `114b564`, but G-start independent remote lookup could not resolve `github.com`. G's normal push and independent post-push verification are reported at its delivery checkpoint.
- status: `P3-G06-G FINAL PASS`; Signal Sweep `QA_PASS`, `COMPLETE`, `PLAYABLE`; site `RELEASE_READY = NO`.
- next: `P3-G07-A — Field Bloom final specification / route / file implementation plan`; not started by this task.

## 2026-09-28 — P3-G07-A Field Bloom Final Specification and File Plan

- branch: `pivot/web-games-mvp`; starting HEAD `96f9a75000b426d8796f0797e0f399a936c81918`; worktree clean. The local `origin/pivot/web-games-mvp` tracking ref matched the starting HEAD. This designated checkout is the only registered worktree. No reset, stash, branch switch, or other-worktree operation was performed.
- source review: read the complete P0-11-G07 Field Bloom Notion specification, this repository's `TASKS.md` and project history, catalog, `GameDetailFrame.astro`, Signal Sweep route/component/controller tests, and package scripts. The catalog already contains the exact Field Bloom name, slug, href, description, categories, mode, and session metadata; there is no Field Bloom route or product source. `GameDetailFrame` supplies canonical/title/VideoGame JSON-LD from the catalog object. Baseline `npm run check` passed 81/81; `npm run build` passed at exactly 63 pages.
- scope: A is planning-only. This entry is the sole tracked change; no product source, route, test, package/config/dependency, completed-game, shared-shell, legacy, redirect, or production-related file was changed. Site maturity/release status remains unchanged; `RELEASE_READY = NO`.
- route/copy: B owns `/games/field-bloom/`, resolves `games.find(({ slug }) => slug === 'field-bloom')`, passes that existing object to `GameDetailFrame`, and does not change `games.ts`. Canonical/title/description/robots/OG/VideoGame JSON-LD are inherited from the frame; public UI is English and has no Related Games or placeholder copy. Frozen copy: How to Play — “Place energy pieces on the grid. Every target must receive exactly its shown number of activations, and forbidden cells must stay untouched. Solve a fixed puzzle with any unused pieces left over.” Controls — “Tap or click an unused piece to select it, then tap or click a legal cell to place it. Select it again to deselect. Use Undo to remove the latest placement; Reset clears this attempt. Keyboard: Tab to a control, then press Enter or Space.” Scoring — “Earn 3 stars with no Undo and at most par pieces; earn 2 stars with at most par + 1 piece and no more than 2 Undos; every other solved attempt earns 1 star. Time does not affect stars.”
- types/data: coordinates are zero-based `(row, col)`; omitted grid cells are neutral. `CellRequirement = 'neutral' | 'goal1' | 'goal2' | 'forbidden'`; stored requirement records contain only constrained kinds. `PieceType = 'H3' | 'V3' | 'CROSS5' | 'X5'`. `PieceInstance = { pieceInstanceId, pieceType }`; `Placement = { pieceInstanceId, pieceType, row, col }`; `PuzzleDefinition = { id, rows, cols, requirements, inventory, parPieces, knownSolution }`. `CellEvaluation = { row, col, requirement, activationCount, status }`, where status is `neutral | under | satisfied | overcharged | violation`. `BoardEvaluation = { activationCounts, cells, underCount, overchargedCount, forbiddenViolationCount, solved }`. `PuzzleSession = { state, puzzleId, placements, selectedPieceInstanceId, undoCount, elapsedActiveMs, result }`. `StoredProgress = { version: 1, unlockedThrough, puzzles }`; each sparse known-ID record has exactly `{ bestStars: 1 | 2 | 3 | null, bestTimeMs: nonnegative safe integer | null }`. `GameState` is exactly `LEVEL_SELECT | PUZZLE_INTRO | PLAYING | SOLVE_FEEDBACK | PAUSED`.
- masks (the single immutable source for legality/evaluation/preview/rendering): H3 `[(0,-1),(0,0),(0,1)]`; V3 `[(-1,0),(0,0),(1,0)]`; CROSS5 `[(-1,0),(0,-1),(0,0),(0,1),(1,0)]`; X5 `[(-1,-1),(-1,1),(0,0),(1,-1),(1,1)]`. No rotation.
- fixed puzzle dataset contract: exactly the following ordered IDs `fb-01`…`fb-12`; each grid row is literal and has `.` neutral, `1` goal1, `2` goal2, `x` forbidden. Inventory entries are `pieceInstanceId:PieceType`; solutions are `pieceInstanceId@row,col`; solution type is the type of its referenced inventory instance. All entries are zero-based and all inventory IDs are unique within their puzzle.
  - `fb-01`, 4×4, par 1; grid `.... / 111. / .... / ....`; inventory `fb01-h3-1:H3`; solution `fb01-h3-1@1,1`.
  - `fb-02`, 4×4, par 1; grid `..1. / ..1. / ..1. / ....`; inventory `fb02-v3-1:V3, fb02-h3-1:H3`; solution `fb02-v3-1@1,2`.
  - `fb-03`, 4×4, par 1; grid `.1.. / 111. / .1.. / ....`; inventory `fb03-cross5-1:CROSS5, fb03-h3-1:H3`; solution `fb03-cross5-1@1,1`.
  - `fb-04`, 5×5, par 2; grid `..... / 111.. / ...1. / ..111 / ...1.`; inventory `fb04-h3-1:H3, fb04-v3-1:V3, fb04-cross5-1:CROSS5`; solution `fb04-h3-1@1,1; fb04-cross5-1@3,3`.
  - `fb-05`, 5×5, par 1; grid `..... / 111.. / ..... / ....x / .....`; inventory `fb05-h3-1:H3, fb05-v3-1:V3`; solution `fb05-h3-1@1,1`.
  - `fb-06`, 5×5, par 1; grid `..... / ..1.. / .111. / ..1.. / x....`; inventory `fb06-cross5-1:CROSS5, fb06-h3-1:H3, fb06-v3-1:V3`; solution `fb06-cross5-1@2,2`.
  - `fb-07`, 5×5, par 1; grid `.x... / .1.1. / ..1.. / .1.1. / .....`; inventory `fb07-x5-1:X5, fb07-h3-1:H3, fb07-cross5-1:CROSS5`; solution `fb07-x5-1@2,2`.
  - `fb-08`, 5×5, par 2; grid `1.1.. / .1... / 1.1.. / ..111 / xx...`; inventory `fb08-x5-1:X5, fb08-h3-1:H3, fb08-v3-1:V3, fb08-cross5-1:CROSS5`; solution `fb08-x5-1@1,1; fb08-h3-1@3,3`.
  - `fb-09`, 5×5, par 2; grid `.1... / .1... / 121.. / ..... / ....x`; inventory `fb09-h3-1:H3, fb09-v3-1:V3, fb09-cross5-1:CROSS5`; solution `fb09-h3-1@2,1; fb09-v3-1@1,1`.
  - `fb-10`, 5×5, par 2; grid `..... / 1221. / ..... / ....x / .....`; inventory `fb10-h3-1:H3, fb10-h3-2:H3, fb10-v3-1:V3`; solution `fb10-h3-1@1,1; fb10-h3-2@1,2`.
  - `fb-11`, 6×6, par 5; grid `xx..1. / 111.1. / ...11. / .1.2.1 / 11111. / .1.1.1`; inventory `fb11-h3-1:H3, fb11-v3-1:V3, fb11-cross5-1:CROSS5, fb11-x5-1:X5, fb11-v3-2:V3`; solution `fb11-h3-1@1,1; fb11-v3-1@1,4; fb11-cross5-1@4,1; fb11-x5-1@4,4; fb11-v3-2@3,3`.
  - `fb-12`, 6×6, par 5; grid `x...1. / 111.1. / ....1. / ..1212 / .1111. / x.11.1`; inventory `fb12-h3-1:H3, fb12-v3-1:V3, fb12-cross5-1:CROSS5, fb12-x5-1:X5, fb12-h3-2:H3`; solution `fb12-h3-1@1,1; fb12-v3-1@1,4; fb12-cross5-1@4,2; fb12-x5-1@4,4; fb12-h3-2@3,4`.
- progression: 1–2 are 4×4 H3/V3 goal1 lessons; 3–4 introduce CROSS5 on 4×4/5×5 with goal1; 5–6 are 5×5 and introduce forbidden; 7–8 are 5×5 with X5 plus forbidden; 9–10 are 5×5 with goal2 (and retain forbidden); 11–12 are 6×6, use all four types and goal1/goal2/forbidden. No random/procedural content. Puzzle labels are “Puzzle 1” through “Puzzle 12”; there are no invented custom titles.
- validator: `validatePuzzleSet` returns stable `{ code, puzzleId, path, message }` diagnostics for `DUPLICATE_PUZZLE_ID`, `INVALID_PUZZLE_ID_ORDER`, `INVALID_DIMENSIONS`, `INVALID_REQUIREMENT_COORDINATE`, `DUPLICATE_REQUIREMENT_COORDINATE`, `INVALID_REQUIREMENT_KIND`, `NO_CONSTRAINED_CELLS`, `MISSING_GOAL_REQUIREMENT`, `EMPTY_INVENTORY`, `DUPLICATE_PIECE_INSTANCE_ID`, `INVALID_PIECE_TYPE`, `UNKNOWN_SOLUTION_PIECE`, `DUPLICATE_SOLUTION_PIECE`, `SOLUTION_PIECE_TYPE_MISMATCH`, `ILLEGAL_SOLUTION_CENTER`, `SOLUTION_CENTER_REUSED`, `KNOWN_SOLUTION_NOT_SOLVED`, `PAR_BELOW_SOLUTION_LENGTH`, and `PROGRESSION_CONTRACT_VIOLATION`. A catalog-level `assertValidPuzzleSet` throws a descriptive error during build/initialization; invalid fixed content never becomes a playable fallback or a sixth game state.
- pure core: one mask table drives legal-center enumeration, placement legality, recompute-from-all-placements activation counts, per-cell status, violation summary, solved result, known-solution validation, and hover/committed-effect coordinates. Used pieces, repeated centers, or any off-board mask cell are illegal; forbidden centers, goal overcharge, and temporary forbidden activation remain legal unsolved moves. Neutral cells are excluded from win checks. Inventory remaining does not prevent solve.
- attempt/input: `LEVEL_SELECT → PUZZLE_INTRO → PLAYING`; Start Puzzle creates exactly one fresh attempt and starts timing. Select toggles the same unused piece off; another unused piece replaces selection; used-piece selection is ignored. A board action without selection is a no-op. Legal placement consumes once, clears selection, recomputes the whole board, then evaluates solve synchronously. Illegal placement mutates nothing, preserves selection, and gives non-color invalid feedback. Undo removes only the latest placement, restores its instance, clears selection, recomputes, and increments `undoCount`; empty Undo is ignored. Reset keeps the puzzle and active timer, clears all placements/selection, recomputes, and increments `undoCount` even on an already-empty board. Undo/Reset are ignored after the synchronous solve lock.
- solve/results: in the same accepted placement transaction, recompute → mark solved and lock input → capture rounded elapsed active milliseconds → calculate pieces used/stars/result once → update independent bests and unlock in memory → transition to `SOLVE_FEEDBACK`; no animation callback controls logic or timing. Three stars require `piecesUsed <= parPieces && undoCount === 0`; two require `piecesUsed <= parPieces + 1 && undoCount <= 2`; otherwise one. Time never affects stars. Best Stars is independent max; Best Time is independent minimum milliseconds and ties retain the previous value. Display elapsed/best time as `m:ss`, flooring to whole seconds. Puzzle 12 shows overall completion and has no Puzzle 13. Result controls: Retry Puzzle → same puzzle intro; Next Puzzle → next puzzle intro only for 1–11; Level Select → selector. Each new attempt starts with empty placements, full inventory, zero undo/time, and no selection.
- selector/storage: Puzzle 1 starts unlocked; all 12 may be listed, but only `number <= unlockedThrough` is enabled. Solving any unlocked puzzle at 1–3 stars unlocks the next, capped at 12; replay/lower stars never relock or lower bests. Selector shows best stars/time when present. Storage key is exactly `emfls:field-bloom:progress:v1`; JSON top-level keys are exactly `{ version: 1, unlockedThrough: 1..12, puzzles: { [knownPuzzleId]: { bestStars, bestTimeMs } } }`; puzzle records are sparse, `bestStars` is null or integer 1–3, `bestTimeMs` is null or nonnegative safe integer, and both metrics are updated independently. Unknown IDs are dropped; invalid root/JSON returns defaults; invalid unlock resets to 1; an invalid metric is normalized to null while a valid sibling/other record is retained; empty records are dropped. Getter/read/write failures preserve gameplay and in-memory progress; no attempt/board/placement/undo/timer state is stored.
- lifecycle/timer: exactly five normal states, no ERROR/RESULT/IDLE/ANIMATING sixth state. Only PLAYING can enter PAUSED (manual, hidden-document, or orientation change); LEVEL_SELECT, PUZZLE_INTRO, and SOLVE_FEEDBACK stay in their current states when hidden. Resume is explicit and returns to the same PLAYING attempt, preserving selection/placements/evaluation/undo. Visible does not auto-resume. Use injectable monotonic `performance.now()` time; the timer starts at Start Puzzle, accumulates only PLAYING intervals, captures on pause/resume/solve, and displays whole-second `m:ss`. Hidden/paused/intro/feedback/selector time is excluded. Page hide/Astro swap destroys listeners/timers; returning creates a fresh selector, with no partial attempt restored. Timer callbacks are attempt-generation guarded and use a bounded 250ms presentation cadence.
- responsive/accessibility: DOM grid, CSS/SVG-only effects, mobile portrait first; no external assets. Support 4×4–6×6 and QA at 1440×900, 390×844, 320×700 with actual 4×4/5×5/6×6 puzzles; avoid horizontal overflow and inner-scroll traps, preserve usable cells and 44px interactive controls. Native inventory/buttons, one roving-tabindex board grid (arrow keys move, Enter/Space places), selected `aria-pressed`, disabled used pieces, text requirement/count/status names, polite invalid/status feedback, visible focus, and non-color `1/2`, check, `!`, X cues. Reduced motion affects decoration only.
- file ownership: B `src/pages/games/field-bloom.astro`, `src/components/games/FieldBloomGame.astro`, `src/styles/games/field-bloom.css` (five static state surfaces only); C `src/games/field-bloom/{types,masks,puzzles,evaluator,validator,logic,progress}.ts` and `tests/field-bloom/{masks,evaluator,validator,logic,progress}.test.mjs`; D adds `timer.ts`, `controller.ts`, `input.ts` and `controller.test.mjs`; E adds `storage.ts` and `storage.test.mjs` plus `integration.test.mjs`; F may change only Field Bloom component/CSS and focused accessibility tests if necessary; G is read-only unless a numbered, reproduced Field Bloom fix is required. No RNG/generator file, catalog edit, shared-shell change, or dependency.
- A proof harness used the literal 12 grids, inventory IDs, solutions, and exact four masks above. It checked ordering, dimensions, coordinates, inventory identity/type, unique solution instances/centers, mask bounds, progression, `parPieces`, exact requirement counts, and solved status. All 12 passed; solution lengths are 1,1,1,2,1,1,1,2,2,2,5,5. No `parPieces` minimality claim is made.
- verification: after recording the plan, `git diff --check`, `npm run check` (81/81), and `npm run build` (63 pages; Field Bloom route still absent) must pass; `git diff --name-only` must be exactly `PROJECT_HISTORY.md`. A normal push is attempted after the A commit; live remote SHA is reported only if actually verified.
- status: `P3-G07-A PASS` after the above checks and its separate commit; Field Bloom remains unimplemented and site `RELEASE_READY = NO`.
- next: `P3-G07-B — route / five-state DOM shell only`; do not implement data, masks, evaluator, placement, Undo/Reset logic, stars, unlock, storage, timer, or preview in B.

## 2026-09-28 — P3-G07-B Field Bloom Static Shell

- branch: `pivot/web-games-mvp`; B starting HEAD: `bd5217fc4c830d3c84530014bb456b6849039c43`; implementation commit: `c7adae2` (`feat: add Field Bloom game shell`).
- scope: added only `src/pages/games/field-bloom.astro`, `src/components/games/FieldBloomGame.astro`, `src/styles/games/field-bloom.css`, and `tests/field-bloom/shell.test.mjs`. The route resolves the existing catalog item and `GameDetailFrame`; the component contains exactly the five frozen static panel surfaces. Selector labels are generic Puzzle 1–12, and gameplay controls remain disabled. No puzzle data, controller, timer, placement, persistence, random generation, catalog, shared-shell, dependency, legacy, redirect, or production changes.
- content/metadata: retained the frozen English how-to-play, controls, and scoring guide. Static output has the exact `/games/field-bloom/` canonical, one Field Bloom H1, catalog-backed title and VideoGame JSON-LD, all five panels, and no related-games or placeholder block.
- verification: focused shell checks PASS (3/3); full `npm run check` PASS (84/84); `npm run build` PASS (exactly 64 static pages); `git diff --check` and staged scope audit PASS. The local browser showed the title, guide, and selector. Its 938px capture showed the game panel continuing beyond the right edge; exact viewport and `scrollWidth` were unavailable, so this is recorded for measurement during F rather than claimed as a confirmed overflow defect. No browser console assertion is claimed.
- status: `P3-G07-B PASS`; Field Bloom remains a static shell and site `RELEASE_READY = NO`.
- remote: normal push succeeded through `3e6ca53629bedb08b42c1c80f16b7355986e22c3` (`bd5217f..3e6ca53`). A subsequent independent `git ls-remote` could not resolve `github.com`; the accepted push is confirmed by Git's push response, but independent SHA verification remains unavailable.
- next: `P3-G07-C — fixed puzzle data, masks, evaluator, validation, placement logic, and progress model only`.

## 2026-09-28 — P3-G07-C Field Bloom Deterministic Puzzle Core

- branch: `pivot/web-games-mvp`; C starting HEAD: `a0f218536ded6f8e9832037050adaed07de5a352`; implementation commit: `8bd32115f22bda426074057d01ae6181ea937608` (`feat: add Field Bloom deterministic puzzle core`).
- scope: added only `src/games/field-bloom/{types,masks,puzzles,evaluator,validator,logic,progress}.ts` and `tests/field-bloom/{masks,evaluator,validator,logic,progress}.test.mjs`. B route/component/style and all unrelated site/game files remain unchanged. No browser controller/session integration, timer, storage adapter, random/procedural puzzle generator, dependency, catalog, shared-shell, legacy, redirect, or production change.
- fixed content: encoded the twelve A-approved literal grids, IDs, dimensions, piece-instance inventories, pars, and ordered known solutions. The small grid decoder only translates those fixed symbols into constrained-cell records; it has no random or puzzle-generation path. Module initialization invokes the fail-fast puzzle-set validator.
- core APIs: one deeply frozen `PIECE_MASKS` table feeds `getPieceCells`, `getLegalCenters`, `checkPlacementLegality`, and full recomputation through `calculateActivationCounts` / `evaluateBoard`. Evaluation derives row-major cell status and under/overcharge/forbidden summary from the entire placement list; neutral cells do not constrain solving. Forbidden-center and overcharging placements remain legal but cannot produce SOLVED. `calculateStars` uses the frozen 3/2/1 thresholds; `createInitialProgress`, `isPuzzleUnlocked`, and `recordPuzzleResult` implement monotonic unlock plus independent best-stars / fastest-time updates.
- validation: stable `{ code, puzzleId, path, message }` diagnostics cover the A-frozen ID order, dimensions, coordinates/kinds, inventory IDs/types, known-solution references/type/center legality/uniqueness/solved result, par bound, and tier progression. The fixed set's twelve known solutions pass validation and evaluate to SOLVED; no claim that authored par is mathematically minimal.
- verification: Field Bloom-focused suite PASS (22/22 including the B shell); full `npm run check` PASS (103/103); `npm run build` PASS (exactly 64 static pages); `git diff --check` and staged 12-file scope audit PASS. Optional `astro check` was not run because the installed CLI requested adding missing `@astrojs/check` and TypeScript dependencies; no dependency was installed or changed. C required checks passed without that optional tool.
- maturity/status: `P3-G07-C PASS`; maturity remains `SHELL`, no browser gameplay is claimed, and site `RELEASE_READY = NO`.
- remote: normal push succeeded through `4a62d69be58fb5ccd1348f12591f1031db5659e0` (`3e6ca53..4a62d69`), including the docs-only B remote note `a0f2185`, C implementation, and C history. A subsequent independent `git ls-remote` again failed because `github.com` did not resolve; the push response confirms acceptance, but no independent live-ref SHA is claimed.
- next: `P3-G07-D — timer, controller, native input, and lifecycle behavior only`; consume the C APIs without changing the fixed dataset or shared shell.

## 2026-09-28 — P3-G07-D Field Bloom Puzzle Controls

- branch: `pivot/web-games-mvp`; D starting HEAD: `05ffdeaedb006ac0d592c6e70a9c16f9d3659024`; implementation commit: `057405e` (`feat: add Field Bloom puzzle controls`).
- scope: added the active-time timer, native delegated input, five-state controller, and permanent controller tests; wired the existing Field Bloom shell and route-scoped styles to the controller. Changed only `src/games/field-bloom/{timer,controller,input}.ts`, `src/components/games/FieldBloomGame.astro`, `src/styles/games/field-bloom.css`, and `tests/field-bloom/controller.test.mjs`. The fixed C puzzle set and shared/site shell are unchanged. No result persistence, unlock advancement, best-record storage, dependency, legacy, redirect, `main`, Cloudflare, DNS, or production change; maturity remains `SHELL` and site `RELEASE_READY = NO`.
- behavior: selected-piece placement uses the existing C legality/evaluator APIs and recomputes the full board. Illegal edge feedback preserves the attempt; synchronous solve locks input. Undo restores the latest piece; Reset clears the attempt and increments undo count, including for an empty board. Timer uses monotonic active intervals, bounded 250ms refresh, whole-second `m:ss`, and excludes paused/hidden time. Manual, hidden-document, and orientation pauses require explicit Resume; stale timers/listeners are cleaned up across pagehide/Astro swap.
- permanent D coverage: 13 focused controller/input/timer tests; full `npm run check` PASS — 116/116 tests. `npm run build` PASS — exactly 64 static pages. `git diff --check` and staged diff checks PASS; the six-file implementation commit scope matched the D allowance.
- browser QA: on local `/games/field-bloom/`, Puzzle 1 opened its briefing and 4×4 board. Native input selected H3, showed accessible illegal-edge feedback without placing, accepted a legal placement, updated counts and used inventory, and Undo restored the piece. Reset on an empty board incremented the undo count; Pause/Resume preserved the elapsed active time; the known solution reached `SOLVE_FEEDBACK` with Next Puzzle still disabled. No production URL was used. Exact responsive viewport measurements, lifecycle stimuli, and browser console-log inspection are not claimed here; responsive QA is F scope.
- remote: normal push and independent remote-ref verification remain due after the separate D history commit.
- status: `P3-G07-D PASS` locally; no unlock/storage/result progression is claimed.
- next: `P3-G07-E — puzzle progression, stars, results, and best-only progress storage`.

## 2026-09-28 — P3-G07-E Field Bloom Puzzle Loop

- branch: `pivot/web-games-mvp`; E starting HEAD: `0558a93ddaaf92c456adb1e8eb311c71944bea0e`; implementation commit: `b98a85ebbb146686581506ef6b60fe3778ba2ab6` (`feat: complete Field Bloom puzzle loop`).
- scope: integrated the frozen star and progression functions with the D solve transaction; added the exact-key/schema best-and-unlock storage adapter, visible six-field result, selector best records, and final-puzzle completion message. Added permanent all-12 session integration and storage failure/validation tests. Changed only `src/games/field-bloom/controller.ts`, `src/games/field-bloom/storage.ts`, `src/components/games/FieldBloomGame.astro`, `tests/field-bloom/integration.test.mjs`, and `tests/field-bloom/storage.test.mjs`. No dependencies, fixed puzzle data, shared shell, other game, legacy, redirect, `main`, Cloudflare, DNS, or production configuration changed.
- transaction/storage: a solved placement freezes active time, calculates 1–3 stars, updates independent best stars and fastest time, advances unlock monotonically through Puzzle 12, attempts one safe write, then enters `SOLVE_FEEDBACK`. Persistence key is exactly `emfls:field-bloom:progress:v1`; only `{version,unlockedThrough,puzzles}` and sparse known-ID `{bestStars,bestTimeMs}` records are stored. Invalid JSON/root defaults safely; invalid unlock resets to 1; unknown IDs and empty/extra-key records drop; invalid metrics normalize independently; storage getter/read/write failures do not block play. No attempt, board, placement, undo, selection, or timer is persisted.
- permanent E coverage: all twelve fixed `knownSolution` sequences pass through the real session selection/placement path, check results and unlocks, reject duplicate solve, and cap at Puzzle 12. Retry/replay reset attempt state while retaining progress; a lower-star, faster replay keeps best stars and independently improves best time. Storage tests cover absent storage, malformed/wrong roots, unknown IDs, partial invalid metrics, invalid unlock range, unsafe/negative values, getter/read/write failures, and exact serialized key/schema. Full `npm run check` PASS — 125/125; `npm run build` PASS — exactly 64 pages; `git diff --check` and staged scope checks PASS.
- browser QA: local `/games/field-bloom/` was played through real native selector, Start, inventory, and board clicks for all 12 puzzles, including 5×5 Puzzle 5 with a forbidden cell and 6×6 Puzzle 12 with goal-2 requirements. Puzzle 1 showed all six result fields and enabled Next; Level Select showed the next puzzle unlocked and the best record; final completion showed all 12 complete, 3 stars, 5 pieces, 0 undos, and Next disabled. The full selector and best records survived a page reload, while the in-progress board did not. Browser console-log inspection and responsive viewport QA are not claimed; F owns responsive QA. No production URL was used.
- maturity/status: `P3-G07-E PASS`; Field Bloom maturity is `PLAYABLE`; site `RELEASE_READY = NO`.
- remote: normal push and independent remote-ref verification remain due after the separate E history commit.
- next: `P3-G07-F — responsive, accessibility, reduced-motion, and visual polish only`; do not change game math or puzzle data.

## 2026-09-28 — P3-G07-F Field Bloom Responsive and Accessibility Polish

- branch: `pivot/web-games-mvp`; F starting HEAD: `4a8c9cfb02962cd24edebfd58239bdba6d895f9f`; implementation commit: `3e229513f4b7fabe5fa5b299b766116705c3f5e7` (`feat: polish Field Bloom responsive UI`).
- scope: changed only `src/games/field-bloom/controller.ts`, `src/games/field-bloom/input.ts`, `src/styles/games/field-bloom.css`, and the two Field Bloom controller/shell tests. Added non-color under-state cue, requirement/piece-type presentation metadata, compact level best labels with accessible puzzle progress names, visible star glyphs with a spoken rating, keyboard-focus bloom preview, differentiated requirement/charge/piece states, visible selection, and narrow-screen spacing. Kept all fixed puzzle data, masks, evaluator, star thresholds, unlock/storage behavior, route/shared shell, dependencies, other games, legacy, redirects, `main`, Cloudflare, DNS, and production unchanged.
- responsive proof: local browser measurements found no horizontal overflow at 1440×900, 390×844, or 320×700. At 390×844 the 5×5 board's cells measured at least 54.2px and controls remained visible. At 390×844 the 6×6 board's cells measured at least 44.5px. At 320×700 the 6×6 board rendered 36 cells at 42×44px, document `scrollWidth` equaled `clientWidth` (305px after the 15px scrollbar), the level selector used two columns, and Undo/Reset/Pause ended at y=669.6 within the viewport; no internal scroll trap was found.
- accessibility/browser proof: native Enter selected H3 and Space placed it on the 6×6 board; the cell became satisfied, Undo enabled, and Reset cleared counts/restored inventory. The 5×5 forbidden-cell representative remained PLAYING after forbidden activation, Undo restored its zero-activation state, and a real solve reached the six-field result view. A separate 4×4 keyboard solve displayed three star glyphs with `aria-label="3 stars"`; existing bests remained intact. Reduced-motion emulation reported `matchMedia('(prefers-reduced-motion: reduce)').matches === true`; the scoped CSS removes cell transition and preview glow only. Live computed style under that emulation was not captured because browser input timed out while its DevTools panel was attached; timer/scoring logic and state transitions are covered by deterministic tests and were not changed. Native hidden/orientation stimuli and browser-console log inspection are not claimed.
- verification: full `npm run check` PASS — 127/127 tests; `npm run build` PASS — exactly 64 static pages, no CSS syntax warning after correcting an extra closing brace found by the initial build; `git diff --check` PASS; implementation staged scope was exactly the five Field Bloom files above.
- maturity/status: `P3-G07-F PASS`; Field Bloom remains `PLAYABLE`; site `RELEASE_READY = NO`.
- remote: both F commits were normally pushed; independent `git ls-remote` verified `pivot/web-games-mvp` at history commit `58ab9ad32ce059d4f3e6ef02c9a59320f4502388` before G began.
- next: `P3-G07-G — read-only-first comprehensive final QA; only reproducible numbered Field Bloom fixes may change product code`.

## 2026-09-28 — P3-G07-G Field Bloom Comprehensive Final QA

- branch: `pivot/web-games-mvp`; G started at F history commit `58ab9ad32ce059d4f3e6ef02c9a59320f4502388`, independently verified as the remote branch head. G began read-only; a stricter audit of the A-frozen 44×44 interactive-control target later reproduced one narrow-board sizing defect, recorded and fixed as `P3-G07-G-FIX-01` below. No other Field Bloom defect was reproduced.
- route/build audit: generated `/games/field-bloom/` has English document language, title `Field Bloom — Play Free in Your Browser | EMFLS Games`, H1 `Field Bloom`, the catalog description, canonical `https://emfls.com/games/field-bloom/`, and matching `VideoGame` JSON-LD name/URL/description. It contains exactly the five allowed panel states, no Related Games section, and no placeholder copy. All seven completed game routes (Pulse Junction, Mirror Drift, Gravity Pact, Orbit Slip, Twin Ledger, Signal Sweep, Field Bloom) were generated and their titles/H1s inspected.
- puzzle proof: the four production masks remain H3 `[(0,-1),(0,0),(0,1)]`, V3 `[(-1,0),(0,0),(1,0)]`, CROSS5 `[(-1,0),(0,-1),(0,0),(0,1),(1,0)]`, and X5 `[(-1,-1),(-1,1),(0,0),(1,-1),(1,1)]`. Existing production validator/session tests pass all twelve ordered fixed definitions, progression constraints, and all twelve knownSolution sequences through the production evaluator. A separate bounded DFS with independently written masks/count rules found a solution for every fixed puzzle (143,855 visited states total); this is existence evidence only, not a `parPieces` minimality proof. Source audit found no Field Bloom runtime RNG or procedural puzzle generation.
- lifecycle/logic proof: the shell exposes only `LEVEL_SELECT`, `PUZZLE_INTRO`, `PLAYING`, `SOLVE_FEEDBACK`, `PAUSED`. The passing suite covers all piece masks/legal centers and edge/corner/duplicate-center cases; forbidden activation and overcharge; placement/use/unused-inventory solve; latest-only Undo and restoration; repeated/empty Reset and recomputation; solve lock; 1/2/3-star boundaries with no time input; active/hidden/pause/retry timer semantics; monotonic unlock capped at Puzzle 12; replay best-star/best-time independence; and malformed/throwing storage.
- local browser evidence: at 1440×900, a real keyboard solve of 4×4 Puzzle 1 reached the six-field result with three visible stars and a spoken `3 stars` label. At 390×844, 5×5 Puzzle 5 accepted a legal placement that activated its forbidden cell while remaining PLAYING; Undo restored zero activations, and a later real solve reached results without replacing its existing 3-star/0:00 best. At 320×700, the initial 6×6 measurement exposed 42×44px cells; after FIX-01, all 36 cells measured 44×44px, `scrollWidth` equaled the 305px client width, and Undo/Reset/Pause remained within the viewport. Enter/Space placement still satisfied a target and Reset cleared activations/restored inventory. The full three-viewport measurement record is in P3-G07-F above. No production URL was opened.
- accessibility/runtime limits: reduced-motion emulation was enabled and `matchMedia('(prefers-reduced-motion: reduce)').matches` returned true; the scoped rule only removes cell transition and preview glow. The emulated active-cell computed style could not be captured after DevTools input timed out. Hidden-tab/orientation stimuli were not generated natively; those semantics are supported by deterministic controller/timer tests. Browser-console logs were not inspected. These are evidence limits, not reproduced product defects.
- final verification: `npm run check` PASS — 127/127 tests; `npm run build` PASS — exactly 64 pages, no CSS syntax warning; `git diff --check` PASS. No dependency, legacy, redirect, `main`, Cloudflare, DNS, or production changes.
- completion: `P3-G07-G FINAL PASS`; Field Bloom `QA_PASS = YES`, `COMPLETE = YES`, maturity `PLAYABLE`; site remains `RELEASE_READY = NO`. No par-minimality claim.
- next: `P3-G08-A — Glass Bloom final specification / route / file implementation plan`; do not begin it in this task.

### P3-G07-G-FIX-01 — Keep 6×6 Cells at 44px on 320px Viewport

- evidence: on the required 320×700 viewport, the active 6×6 board had 36 cells measuring 42×44px. The board was horizontally contained, but each cell button was 2px short of the A-frozen 44×44 interactive target.
- root cause: the shared outer `.container` leaves 16px margins per side at 320px, constraining the Field Bloom board to 259px; six equal columns with 1px gaps therefore measured 42px wide. The cell rule already protected the 44px height but had no minimum width.
- fix: implementation commit `ec5efba` (`fix: keep Field Bloom narrow cells at 44px`) changes only `src/styles/games/field-bloom.css` and `tests/field-bloom/shell.test.mjs`. Under the Field Bloom-only `max-width: 22rem` rule the component gains 10px via `width: calc(100% + 10px)` and `margin-inline: -5px`; 6-column cells use `min-width: 44px`. Shared shell, route, game math, data, state, storage, and other files remain unchanged.
- regression: the shell contract test was first run against the old CSS and failed; it now asserts the scoped width expansion and 44px cell minimum. Focused shell tests pass 5/5.
- post-fix browser QA: at 320×700 the 6×6 board spans x=18..287 (269px), all 36 cells measure exactly 44×44px, root `scrollWidth` equals its 305px client width, and Undo/Reset/Pause end at y=669.6 within the viewport. Real Enter/Space placement still satisfies the target and Reset restores zero activations. At 390×844, 6×6 cells remain at least 44.5×44.5px with no overflow; 5×5 forbidden gameplay and 4×4 keyboard solve were also rerun after the fix.
- verification: after the fix, `npm run check` PASS — 127/127; `npm run build` PASS — exactly 64 pages, no CSS warning; `git diff --check` PASS. Full G was rerun with no further product issue; native hidden/orientation and console-inspection limits remain as stated above.

## 2026-09-28 — P3-G08-A Glass Bloom Final Specification and Implementation Plan

- branch/base: `pivot/web-games-mvp`, A began from clean HEAD `64b02b013595dfdc19b88ffa1256826334336024`. This is planning only; only this history file is changed. The Glass Bloom catalog entry already exists, `GameDetailFrame.astro` is the shared route frame, and the Glass Bloom route remains absent. No product source/test/config/dependency file is created or changed.
- route/content: B will add only `/games/glass-bloom/`, reuse the catalog and shared frame, render the Option 1 hierarchy, provide English How to Play/Controls/Scoring, and omit Related Games. Frozen copy: “Grow your crystal to raise its pot, but each growth carries a break risk. Bank at any time to add the current pot to your score. If the crystal shatters, its unbanked pot is lost.”; “Select Grow or Bank, or use Space to Grow and Enter to Bank. Pause and resume whenever needed. You can take as long as you want to decide.”; “Banked points are added to your total with a bonus that grows after consecutive banks, up to 20%. A break resets that streak. Finish all 8 crystals to record the session.”
- immutable game data/fairness: 8 Crystals; stage pots `[100,180,300,500,800,1250,1900,2800]`; base risks for Grow from Stages 1–7 `[5,10,18,28,40,55,70]`; Crystal modifiers `[0,0,2,2,4,4,6,6]` percentage points. The sole `getBreakRisk(stage, crystalIndex)` result drives text/band/cracks and Grow threshold. Break iff `roll < risk / 100`; equality is safe; max risk 76%; Stage 8 Grow is disabled/illegal with no risk display and no RNG. Bands: Low <15%, Moderate 15–29%, High 30–49%, Severe >=50%.
- types/RNG/transactions: `Stage` and `CrystalIndex` are the literal union 1–8; `GrowOutcome` is `SAFE | SHATTERED`; `RoundOutcome` is `BANKED | SHATTERED`; `RiskBand` is `LOW | MODERATE | HIGH | SEVERE`; lifecycle is exactly `IDLE`, `CRYSTAL_INTRO`, `DECISION`, `GROW_RESOLVING`, `BANK_RESOLVING`, `ROUND_FEEDBACK`, `PAUSED`, `RESULT`. Outcomes/pause metadata are data, not extra states. The session snapshot holds lifecycle/paused-from metadata, session generation, crystal index, stage, pot, total score, current/best bank streak, successful-bank/break counts, highest reached stage, committed grow/round outcome presentation data, and the deterministic RNG stream; no redundant displayed-risk value is persisted. `BestStats` is exactly `{bestScore, highestStageReached}`. Use uint32-seeded Mulberry32, seed zero valid; acquire one secure seed per session with `crypto.getRandomValues`, with one `Math.random` call only as seed-acquisition fallback. Only an accepted legal Grow consumes exactly one sample; Bank, invalid/duplicate actions, Stage 8, pause/resume and animation consume none. Same seed/action sequence reproduces outcomes; Play Again is RESULT-only with a fresh seed. Synchronously accept/lock the first valid Grow or Bank; resolve/commit once before presentation and ignore input until DECISION. Session/crystal-generation-guarded timers cannot own scoring/RNG or mutate a newer session.
- pot, scoring and stats: Grow success advances exactly one stage and loads its literal table pot. Bank award is `Math.round(pot * (1 + min(pre-bank streak, 4) * 0.05))`; add score and increment successful-bank/streak stats once, then update best streak. A Break discards only unbanked pot, increments breaks and resets streak; banked total survives. Session `highestStage` tracks the maximum reached across its Crystals, starting at 1. At RESULT only, update best score and all-time highest stage independently. Storage is `emfls:glass-bloom:best:v1` with exact `{bestScore, highestStageReached}`, nonnegative safe-integer score and stage 0–8 (`0` means unsolved); malformed/missing/throwing storage defaults safely and cannot block play. Never persist partial session, seed or RNG.
- presentation/lifecycle: hierarchy is Total Score, Crystal N / 8, Stage, SVG/CSS crystal, Break Risk, If Safe, textual band, primary Grow and secondary Bank; `If Safe` is the exact next-stage pot. Stage 8 copy: `Maximum Stage · Bank to secure 2,800`. Frozen feedback: `Grown — Stage {stage} · Pot {pot}`, `Shattered — Pot lost`, `Banked +{award}`, result heading `Session Complete`. Timings: intro 350ms, safe Grow 450ms, Break 650ms, Bank 400ms, round feedback 500ms. Reduced motion removes nonessential movement but keeps logical timing/state transitions. Manual and hidden-tab Pause work from all live states; becoming visible does not auto-resume. Resume restores the unmodified Decision or continues the already committed timed result exactly once; no reroll, re-award, duplicate stats or duplicate Crystal advance. Native controls are at least 44×44px; Space/Enter hotkeys apply only outside native-control/editable contexts and ignore repeat/composition/modifiers.
- mathematical audit: one-step expected next-pot comparison `(1-risk) × next-pot` versus Bank pot is 171 vs 100 at Stage 1/5%, 576 vs 500 at Stage 4/28%, and 840 vs 1,900 at Stage 7/70%. At Stage 5 on Crystal 8, 54% survival gives 675 vs Bank 800. Thus early Grow can be attractive while late Grow is materially worse; frozen P0 tables remain unchanged. An inline deterministic proof passed all 8 pots, 56 legal stage/Crystal risks, strict 5% threshold equality, 76% maximum, capped bank multiplier, representative EV and reproducible Mulberry32 sequence with zero seed. A first exact-float assertion exposed only binary floating representation (`840.0000000000001`); rerunning the same check with a `1e-9` comparison tolerance passed.
- verification: `npm run check` PASS — 127/127; `npm run build` PASS — exactly 64 pages; Glass Bloom route remains absent; `git diff --check` PASS; changed-file audit is exactly `PROJECT_HISTORY.md`. No `main`, other game, legacy, redirect, dependency, Cloudflare, DNS, or Production change. Site `RELEASE_READY = NO`.
- next: after A's gates and separate planning commit pass, continue with `P3-G08-B — route/UI shell/exact eight states only`.

## 2026-09-28 — P3-G08-B Glass Bloom Route and Static Shell

- branch/base: `pivot/web-games-mvp`; B started at A history commit `971ba3a5fc3d42ec7305b482300cc027465d3139`. Implementation commit: `1c380abd85ecac55663362f45522006b180ad986` (`feat: add Glass Bloom game shell`).
- scope: added the one `/games/glass-bloom/` route through the existing catalog record and `GameDetailFrame`; added the static `GlassBloomGame.astro` component, scoped crystal/HUD/action styles, and six permanent shell tests. Changed only `src/pages/games/glass-bloom.astro`, `src/components/games/GlassBloomGame.astro`, `src/styles/games/glass-bloom.css`, and `tests/glass-bloom/shell.test.mjs`; this entry is the separate B history change. No catalog/shared-frame/completed-game/legacy/redirect/config/dependency changes.
- shell contract: exposes Total Score, Crystal 1 / 8, Stage 1, Unbanked 100, exact initial Break Risk 5%, If Safe 180, textual Low band, and an inline code-drawn crystal SVG following Option 1 hierarchy. It contains exactly the eight A-frozen panels with IDLE alone initially visible, frozen Stage 8 copy, English A guide text, and no Related Games or placeholder content. All controls are static and disabled at B so the shell cannot imply working gameplay; no script, RNG, risk calculation, score transaction, progression, storage, keyboard gameplay, or full pause lifecycle was added.
- verification: the six new shell tests first failed because route/component/styles were absent, then passed 6/6 after implementation. Full `npm run check` PASS — 133/133; `npm run build` PASS — exactly 65 static pages; built route audit confirms one canonical `/games/glass-bloom/`, correct title/H1/VideoGame schema and exactly eight panels; `git diff --check` PASS. Local in-app browser accessibility tree confirmed catalog metadata, guide copy, SVG image label, score/risk surfaces, and disabled shell controls. No production URL or deployment was used.
- maturity/status: `P3-G08-B PASS`; Glass Bloom maturity is `SHELL`, not playable; site remains `RELEASE_READY = NO`.
- next: `P3-G08-C — deterministic DOM-independent risk/RNG/bank/session pure core only`; do not wire browser gameplay in C.

## 2026-09-28 — P3-G08-C Glass Bloom Deterministic Pure Core

- branch/base: `pivot/web-games-mvp`; C began at B history commit `ecf486db29b3e0610535e1867c5406391deb17df`. Implementation commit: `c43e373` (`feat: add Glass Bloom deterministic game core`).
- scope: added exact game/session types and frozen tables, the single Stage/Crystal risk and risk-band source, uint32 Mulberry32 seed/step utilities, immutable Grow/Bank/Crystal/result transitions, and 15 permanent pure-core tests. The implementation change is exactly the five `src/games/glass-bloom/{types,constants,risk,rng,logic}.ts` files plus `tests/glass-bloom/core.test.mjs`; no route, component, CSS, controller, storage, catalog, shared shell, other game, or dependency changed.
- rules proof: all 56 legal Stage/Crystal risks derive from the frozen base/modifier tables; risk is strict `<` (5% equality safe); Stage 8 returns no Grow risk. Seeds 0 and `0xffffffff` are valid; session RNG is deterministic and outputs `[0,1)`. Only accepted legal Grow advances one seeded word. Bank, invalid actions and Stage 8 Grow do not. Secure seed acquisition uses one crypto draw and only falls back to one validated Math.random seed draw when needed.
- session proof: safe Grow commits one stage/table-pot advance without ending the Crystal; Break commits once, clears only the unbanked pot, preserves total banked score and resets streak. Bank uses pre-bank streak, `Math.round`, updates award/streak/best/success count once and ends the Crystal. Eight completed Crystals end at RESULT with no ninth; identical seed/action strategy reproduces the full session.
- test-first/debug record: the initial new suite failed before the pure-core files existed. The first implementation attempt then exposed Node's requirement for explicit `.ts` internal import extensions; the error was traced and fixed following the existing Signal Sweep module convention, with no runner/config/dependency change. Focused tests pass 15/15; full `npm run check` PASS — 148/148; `npm run build` PASS — exactly 65 pages, including Glass Bloom and all seven prior games; `git diff --check` PASS; changed-file audit matched the C allowlist. C requires no browser QA.
- maturity/status: `P3-G08-C PASS`; maturity remains `SHELL`, not playable; site `RELEASE_READY = NO`.
- next: `P3-G08-D — real input, Grow/Bank, Crystal flow and pause lifecycle`; C remains DOM/browser independent.
