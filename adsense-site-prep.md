# AdSense 심사 통과용 사이트 제작 준비 메모

작성일: 2026-06-08

## 목표

- `emfls.com`을 GitHub Pages에 연결해 AdSense 심사용 독립 웹사이트로 제작한다.
- 기존 `emfls.github.io`에서 반복 탈락한 원인을 줄이기 위해 콘텐츠, 구조, 정책, 기술 설정을 먼저 정리한다.

## 2026-06-08 진행 결정

- 사이트 주제: 개인 웹사이트, 도메인, DNS, GitHub Pages 운영 가이드.
- 사이트 성격: 초보자가 자신의 도메인으로 정적 웹사이트를 만들고 운영하는 과정을 설명하는 실용 정보 사이트.
- 기술 방향: Astro 기반 정적 사이트.
- 대표 도메인: 우선 `https://emfls.com` 기준으로 설정.
- 초기 제작 범위: 홈, 글 목록, 글 상세, 소개, 문의, 개인정보처리방침, 이용약관/면책, 사이트맵, robots.txt.

## 2026-06-08 제작 완료 메모

- Astro 6 기반 정적 사이트 구조 생성.
- 초기 글 12개 작성:
  - 시작 준비
  - GitHub Pages
  - 도메인과 DNS
  - 사이트 제작
  - 운영 기준
  - SEO
  - 배포와 점검
- 필수 페이지 생성:
  - 홈
  - 글 목록
  - 글 상세
  - 소개
  - 문의
  - 개인정보처리방침
  - 이용약관 및 면책 고지
  - 사이트맵
  - 404
- SEO/배포 파일 생성:
  - `astro.config.mjs`의 site 값을 `https://emfls.com`으로 설정.
  - `public/robots.txt` 작성.
  - Astro sitemap 통합으로 `sitemap-index.xml` 생성.
  - Cloudflare Pages 배포 기준으로 README 작성.
- 검증:
  - `npm run build` 성공.
  - `npm audit --omit=dev` 결과 취약점 0건.
  - 데스크톱 1280px에서 홈/글 상세 DOM 확인.
  - 모바일 390px에서 가로 스크롤 및 넘침 요소 없음 확인.
  - 브라우저 콘솔 오류 없음.

## 2026-06-08 Cloudflare Pages 기준 변경

- GitHub는 코드 저장소로만 사용하고, 실제 배포는 Cloudflare Pages에서 진행하는 방식으로 변경.
- GitHub Pages 전용 파일 제거:
  - `.github/workflows/deploy.yml`
  - 루트 `CNAME`
  - `public/CNAME`
- Cloudflare Pages 설정값:
  - Framework preset: Astro
  - Build command: `npm run build`
  - Build output directory: `dist`
  - Custom domain: `emfls.com`

## 2026-06-08 GitHub 저장소 생성

- GitHub 계정: `emfls`
- 저장소: `emfls-site`
- URL: https://github.com/emfls/emfls-site
- 공개 여부: Public
- 기본 브랜치: `main`
- 첫 커밋: `Initial Astro site for EMFLS Guide`
- 원격 이름: `origin`

## 다음 작업

- Cloudflare Pages에서 GitHub 저장소 `emfls/emfls-site` 연결.
- 빌드 설정:
  - Framework preset: Astro
  - Build command: `npm run build`
  - Build output directory: `dist`
- 첫 배포 성공 후 Custom domain에 `emfls.com` 추가.
- 가비아에서 Cloudflare가 안내하는 네임서버로 변경.

## 2026-06-08 Cloudflare Pages 연결 진행

- 사용자가 Cloudflare Pages에서 GitHub 저장소 `emfls/emfls-site` 연결 및 빌드 설정을 완료했다고 확인.
- 다음 확인 대상:
  - Cloudflare Pages 첫 배포 성공 여부.
  - 임시 주소 `emfls-site.pages.dev` 접속 가능 여부.
  - Custom domain `emfls.com` 연결.
  - 가비아 네임서버를 Cloudflare 네임서버로 변경.

## 2026-06-08 Cloudflare 도메인 활성화 확인

- Cloudflare Overview 화면에서 `Your domain is now protected by Cloudflare` 상태 확인.
- 의미: 가비아 네임서버 변경이 Cloudflare까지 반영되어 도메인이 Active 상태로 전환됨.
- 다음 단계:
  - Pages 프로젝트 `emfls-site`의 Custom domains에서 `emfls.com` 연결.
  - DNS 화면에서 기존 GitHub Pages 대상 레코드가 Pages 대상으로 정리되었는지 확인.

## 2026-06-08 AdSense 확인 코드 삽입

- AdSense 사이트 소유권 확인 화면에서 제공된 코드 삽입.
- 게시자 ID: `ca-pub-8830524482034754`
- 적용 파일: `src/layouts/BaseLayout.astro`
- 적용 위치: 모든 페이지 공통 `<head>` 영역.
- 검증: `npm run build` 성공.

## 2026-06-09 AdSense 심사용 신뢰 신호 1차 보강

- ChatGPT 리뷰 문서와 콘텐츠 로드맵을 검토하고 우선순위 1차 개선 반영.
- About 페이지 보강:
  - 운영자 역할
  - 사이트 작성 목적
  - 문의 이메일
  - 콘텐츠 작성 기준
  - 투명성 안내
- 신규 신뢰 페이지 추가:
  - `/editorial-policy/`
  - `/content-methodology/`
  - `/disclaimer/`
- 모든 글 상세 페이지 보강:
  - Breadcrumb 표시
  - 작성자 정보
  - 작성일 및 최종 검토일
  - 실전 점검표
  - 흔한 실수 섹션
  - FAQ 섹션
  - 관련 글 링크
  - 공식 문서 출처 링크
- 구조화 데이터 추가:
  - 홈: WebSite, Organization schema
  - 글 상세: Article, BreadcrumbList, FAQPage schema
- 사이트맵 HTML 페이지에 신규 정책 페이지 링크 추가.
- 검증:
  - `npm run build` 성공.
  - 23개 정적 페이지 생성.
  - `npm audit --omit=dev` 취약점 0건.

## 2026-06-09 기존 글 12개 본문 깊이 1차 보강

- 글별 보강 데이터 파일 추가: `src/data/articleEnhancements.ts`
- 각 글마다 고유하게 추가한 항목:
  - 실전 적용 예시
  - 준비할 스크린샷 자리와 설명
  - 실전 점검표
  - 흔한 실수
  - 글별 FAQ 3개
  - 글별 공식 문서 출처
- 기존 글 상세 템플릿의 공통 FAQ를 제거하고 글별 FAQ를 사용하도록 변경.
- FAQPage 구조화 데이터도 글별 FAQ 기준으로 생성되도록 수정.
- 샘플 HTML에서 다음 항목 출력 확인:
  - `emfls.com을 기준으로 본 시작 순서`
  - `HTML 사이트맵과 XML 사이트맵을 구분한 사례`
  - `Cloudflare Pages 첫 배포 후 확인한 순서`
- 검증:
  - `npm run build` 성공.
  - 23개 정적 페이지 생성.
  - `npm audit --omit=dev` 취약점 0건.

## 2026-06-09 신규 핵심 글 6개 추가

- 콘텐츠 로드맵 기준으로 AdSense 심사와 검색 접근성에 영향이 큰 글 6개 우선 추가.
- 추가한 글:
  - Cloudflare DNS 설정을 처음 할 때 확인할 순서
  - Google Search Console에 새 도메인을 등록하는 방법
  - AdSense 심사 전 최종 체크리스트
  - GitHub Pages에 개인 도메인을 연결하는 기본 흐름
  - HTTPS 적용이 제대로 되었는지 확인하는 방법
  - GitHub Pages와 워드프레스 중 무엇을 선택할까
- 신규 글에도 개별 보강 데이터 추가:
  - 실전 사례
  - 스크린샷 자리
  - 점검표
  - 흔한 실수
  - FAQ
  - 공식 출처
- 검증:
  - `npm run build` 성공.
  - 29개 정적 페이지 생성.
  - 신규 글이 `dist/sitemap-0.xml`, 글 목록, HTML 사이트맵에 반영됨 확인.
  - `npm audit --omit=dev` 취약점 0건.

## 2026-06-09 주제 클러스터/카테고리 페이지 추가

- 내부 링크와 크롤링 구조 강화를 위해 카테고리별 글 모음 페이지 추가.
- 추가한 카테고리 URL:
  - `/categories/getting-started/`
  - `/categories/github-pages/`
  - `/categories/domains-dns/`
  - `/categories/site-building/`
  - `/categories/operations-policy/`
  - `/categories/seo/`
  - `/categories/deployment-checks/`
- 홈의 주요 범위를 카테고리 페이지 링크로 변경.
- 글 목록 상단의 카테고리 태그를 링크로 변경.
- HTML 사이트맵에 주제별 글 모음 섹션 추가.
- 검증:
  - `npm run build` 성공.
  - 36개 정적 페이지 생성.
  - 카테고리 URL이 `dist/sitemap-0.xml`, 홈, 글 목록, HTML 사이트맵에 반영됨 확인.
  - `npm audit --omit=dev` 취약점 0건.

## 2026-06-09 글 목록 운영형 UX 개선

- `/articles/`를 단순 카드 나열에서 운영형 글 탐색 페이지로 개편.
- 추가 기능:
  - 글 검색 입력창.
  - 최신순, 오래된순, 읽는 시간 짧은순, 읽는 시간 긴순 정렬.
  - 카테고리 필터.
  - 태그 필터.
  - 9개 단위 페이지네이션.
  - 검색/정렬/필터/페이지 상태를 URL 쿼리 파라미터에 유지.
  - 필터 초기화 버튼.
- 글 목록 상단을 초보 → 운영 흐름의 로드맵 형태로 재구성.
- 카드 UI 개선:
  - 카테고리별 기본 시각 아이콘 추가.
  - 작성자, 발행일, 최종 수정일, 읽는 시간 표시.
  - 태그 표시.
- 데이터 모델 보강:
  - `tags`
  - `summary`
  - `publishedAt`
  - `updatedAt`
  - `readingTimeMinutes`
  - `authorName`
  - `heroImage`
  - `series`
- 태그 페이지 추가:
  - `/tags/{tag}/`
  - 각 태그 페이지에 canonical과 메타 설명 적용.
  - HTML 사이트맵과 XML 사이트맵에 태그 페이지 반영.
- 글 상세 상단에도 태그 페이지 링크 추가.
- 검증:
  - `npm run build` 성공.
  - 70개 정적 페이지 생성.
  - `/articles/` 산출 HTML에서 검색 UI, 정렬, 필터, 페이지네이션, 클라이언트 카드 템플릿 확인.
  - 태그 URL이 HTML 사이트맵과 `dist/sitemap-0.xml`에 반영됨 확인.
  - `npm audit --omit=dev` 취약점 0건.

## 제작 전 확인할 내용

### 1. 사이트 주제와 포지셔닝

- 한 문장으로 설명 가능한 명확한 주제 선정.
- 너무 넓은 잡블로그보다 특정 독자, 문제, 카테고리가 분명한 사이트가 유리하다.
- 예: 생활 정보 전체보다는 `초보자를 위한 개인 블로그/웹사이트 운영 가이드`, `디지털 생산성 도구 사용법`, `도메인/호스팅/블로그 운영 기록`처럼 좁히기.

### 2. 콘텐츠 계획

- AdSense는 고유하고 유용한 콘텐츠를 요구하므로, 자동 생성 느낌이나 짧은 글 위주의 사이트는 피한다.
- 심사 전 최소 15~30개 정도의 독립적인 글을 준비하는 것을 목표로 한다.
- 각 글은 문제 정의, 직접 설명, 예시, 체크리스트, 결론을 갖춘 완성형 글로 작성한다.
- 복붙, 번역투, 다른 사이트 요약 수준의 글은 제외한다.
- 카테고리는 3~5개 이하로 시작하고, 빈 카테고리가 생기지 않게 한다.

### 3. 필수 페이지

- 홈
- 소개 / About
- 문의 / Contact
- 개인정보처리방침 / Privacy Policy
- 이용약관 또는 면책 고지 / Terms 또는 Disclaimer
- 사이트맵 / Sitemap
- 카테고리 또는 글 목록

### 4. UX와 내비게이션

- 모든 주요 페이지에 헤더 내비게이션과 푸터를 둔다.
- 모바일에서도 메뉴, 글 목록, 본문, 문의 페이지가 깨지지 않아야 한다.
- 존재하지 않는 링크, 빈 페이지, 공사중 문구를 심사 전에 제거한다.
- 광고 영역은 심사 전 과하게 배치하지 않고, 콘텐츠와 구분 가능하게 설계한다.

### 5. 정책 리스크

- 성인, 도박, 불법 다운로드, 저작권 침해, 혐오, 폭력, 의료/금융 오해 가능 콘텐츠는 피한다.
- “광고 클릭 부탁”, “후원하려면 광고 클릭” 같은 문구는 금지한다.
- 본인 광고 클릭, 반복 새로고침, 트래픽 구매, 자동화 방문 유도는 금지한다.
- 광고처럼 보이는 다운로드 버튼, 메뉴처럼 보이는 광고 배치, 오해를 부르는 UI를 피한다.

### 6. 도메인 / GitHub Pages 설정

- GitHub Pages 저장소 또는 별도 저장소 배포 방식을 결정한다.
- `emfls.com`과 `www.emfls.com` 중 대표 도메인을 정하고 리디렉션 정책을 정한다.
- 가비아 DNS에서 GitHub Pages용 A 레코드와 CNAME을 설정한다.
- 저장소에 `CNAME` 파일을 추가한다.
- HTTPS 강제 적용을 확인한다.

### 7. AdSense 연결 준비

- AdSense 사이트 추가 시 `emfls.com`으로 등록한다.
- HTML `<head>`에 AdSense 확인 코드 또는 메타 태그를 넣을 수 있게 구조를 잡는다.
- 승인 후 `ads.txt` 파일을 루트에 추가한다.
- 심사 중에도 사이트가 공개 접근 가능해야 한다.

### 8. SEO / 검색 접근성

- `robots.txt` 작성.
- `sitemap.xml` 생성.
- 각 페이지에 고유한 title, description, canonical URL 적용.
- 404 페이지 제공.
- Google Search Console에 도메인 속성 등록.

### 9. 기술 선택

- GitHub Pages와 궁합이 좋은 정적 사이트를 우선 고려한다.
- 후보:
  - 순수 HTML/CSS/JS: 단순하지만 글 관리가 번거롭다.
  - Astro: 정적 사이트, 블로그, SEO, 성능 측면에서 적합하다.
  - Jekyll: GitHub Pages 기본 지원이 좋지만 커스터마이징 경험은 다소 낡을 수 있다.
- 현재 목적에는 Astro 기반 정적 블로그/콘텐츠 사이트가 가장 현실적이다.

### 10. 제작 전 필요한 사용자 결정

- 사이트 주제
- 글 카테고리
- 사이트 이름 / 브랜드 톤
- 운영자 소개 문구
- 문의 이메일
- 개인정보처리방침에 들어갈 운영자/연락처 정보
- 대표 도메인: `emfls.com` 또는 `www.emfls.com`
- 기존 `emfls.github.io`를 유지할지, 새 저장소로 분리할지

## 공식 참고 문서

- Google AdSense eligibility requirements: https://support.google.com/adsense/answer/9724
- Make sure your site's pages are ready for AdSense: https://support.google.com/adsense/answer/7299563
- AdSense Program policies: https://support.google.com/adsense/answer/48182
- Owning the site you want to use to participate in AdSense: https://support.google.com/adsense/answer/91205
- Connect your site to AdSense: https://support.google.com/adsense/answer/7584263
- AdSense site management: https://support.google.com/adsense/answer/12131223
