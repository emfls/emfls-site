# EMFLS Guide 디자인 QA

검사 대상: `emfls/emfls-site` 로컬 build 및 개발 서버

검사일: 2026-09-15

## 검사 범위와 방법

- `npm run build`: PASS, 52개 페이지 생성.
- 로컬 Astro 개발 서버: `http://127.0.0.1:4322/`에서 실행.
- 실제 브라우저 렌더링: 데스크톱 Chrome 화면과 좁은 모바일형 인앱 브라우저 화면에서 확인.
- 확인 페이지: `/`, `/articles/`, `/categories/cloudflare-deployment/`, `/articles/cloudflare-pages-build-failure/`, `/articles/static-website-running-cost/`, `/contact/`.
- article 템플릿과 전체 전역 CSS, `ArticleCard.astro`, `articleEnhancements.ts`를 코드와 렌더링 결과로 대조.
- 정확한 1440×900, 1024×768, 768×1024, 390×844, 320×700 viewport를 각각 고정하는 브라우저 기능은 현재 환경에서 사용할 수 없어, 해당 수치별 PASS로 기록하지 않는다. 좁은 화면에서 390px 전후의 실제 줄바꿈과 overflow를 확인했고, 320px은 별도 확인 필요로 남긴다.

## Executive Summary

현재 디자인 완성도는 **72/100**으로 평가한다. 기본 palette와 레이아웃은 일관되고 실제 콘텐츠 탐색 흐름도 명확하다. 다만 article이 많은 사이트에서 핵심인 본문 시각 계층과 카드 차별화가 약하고, 키보드 focus 표현이 부족하다.

| 영역 | 점수 | 판단 |
| --- | ---: | --- |
| Homepage | 78 | hero 메시지와 범위 안내는 명확하지만 외부 stock hero와 반복 카드가 브랜드 고유성을 약화시킴 |
| Article readability | 68 | 폭·행간은 안정적이나 긴 본문이 대부분 같은 문단 흐름으로 이어짐 |
| Cards | 69 | 정보 구조는 완결됐지만 동일 gradient와 아이콘으로 시각적 구분이 약함 |
| Mobile | 70 | 좁은 화면에서 기본 흐름은 유지되나 header·filter·긴 제목·metadata가 빠르게 길어짐 |
| Typography | 74 | 제목 대비는 좋지만 한국어 제목의 줄바꿈 제어와 긴 파일명/URL 표현이 더 필요함 |
| Visual assets | 62 | hero 외에는 의미 있는 visual이 없고 hero는 외부 Unsplash generic image에 의존 |
| Trust pages | 75 | Contact와 정책 페이지는 읽기 쉽지만 짧은 페이지의 빈 공간과 문서형 계층을 더 다듬을 수 있음 |
| Accessibility | 66 | skip link와 기본 semantic 구조는 있으나 `:focus-visible`, 링크·summary focus 시각 피드백이 부족함 |
| Consistency | 82 | deep teal, mint, cream, yellow와 rounded card 체계가 일관됨 |

## P0

현재 즉시 수정하지 않으면 사용성을 직접 해치는 P0는 **0개**다. 페이지가 깨지거나 핵심 탐색이 불가능한 문제는 실제 화면에서 확인되지 않았다.

## P1

### P1-1. Article 본문이 긴 텍스트 블록 중심으로 반복됨

- 화면: `/articles/cloudflare-pages-build-failure/`, `/articles/static-website-running-cost/` 및 전체 article detail.
- 근거: H2와 문단은 정상적으로 렌더링되지만, 실제 화면에서는 `H2 → 문단 → 문단` 흐름이 길게 반복된다. 작성자 box·check-list·callout을 제외하면 중요한 프로젝트 사실과 일반 설명의 시각적 우선순위가 크게 다르지 않다.
- 권장: 다음 디자인 batch에서 `articleEnhancements.example`을 실제 확인 box로 분리하고, 파일 경로·명령어·판단 결과를 짧은 강조 block으로 표현한다. 본문 내용이나 URL은 이번 감사에서 수정하지 않는다.
- 관련 파일: `src/pages/articles/[slug].astro`, `src/layouts/BaseLayout.astro`, `src/data/articleEnhancements.ts`.

### P1-2. `screenshot` 데이터가 실제 화면에 사용되지 않음

- 근거: `src/data/articleEnhancements.ts`에는 각 글의 `screenshot` title/caption이 있으나 `src/pages/articles/[slug].astro`에서는 `enhancement.screenshot`을 렌더링하지 않는다. 실제 이미지가 없는 상태에서 빈 placeholder가 노출되지는 않지만, 데이터와 화면 구조가 불일치한다.
- 권장: 실제 screenshot 자산이 확보된 글에만 별도 figure를 도입하거나, 자산이 생기기 전에는 screenshot 데이터를 editorial planning 용도로 명확히 분리한다. 가짜 이미지나 공개 placeholder는 만들지 않는다.
- 관련 파일: `src/data/articleEnhancements.ts`, `src/pages/articles/[slug].astro`.

### P1-3. ArticleCard가 모든 category에서 거의 같은 visual을 사용함

- 화면: homepage 최근 글, `/articles/`, `/categories/cloudflare-deployment/`.
- 근거: 카드마다 동일한 teal gradient와 단일 기호 아이콘 체계를 사용한다. 데스크톱 category 화면에서 3개 카드가 나란히 보일 때 내용보다 visual이 먼저 반복되어 각 글의 성격 차이가 약하다.
- 권장: palette는 유지하고 category 또는 article intent별로 아이콘 배경의 작은 변주, label hierarchy, 정보 우선순위만 검토한다. 전체 카드 디자인을 바꾸거나 이미지를 일괄 추가할 필요는 없다.
- 관련 파일: `src/components/ArticleCard.astro`, `src/layouts/BaseLayout.astro`.

### P1-4. Keyboard focus 상태가 충분히 드러나지 않음

- 근거: 전역 CSS에 `.skip-link:focus`는 있으나 일반 링크, 버튼, `summary`, form control을 위한 명시적 `:focus-visible` 스타일이 없다. hover만으로는 키보드 사용자가 현재 위치를 알기 어렵다.
- 권장: 색 대비가 충분한 2px 이상 outline과 offset을 공통 focus rule로 추가하고, 기존 palette를 유지한다.
- 관련 파일: `src/layouts/BaseLayout.astro`.

### P1-5. Contact 페이지의 짧은 콘텐츠와 넓은 빈 공간

- 화면: `/contact/`.
- 근거: 데스크톱 화면에서 제목·이메일·응답 안내 뒤에 큰 여백이 이어진 뒤 footer가 시작된다. 짧은 문의 페이지의 목적 자체는 분명하지만, 페이지가 미완성처럼 보일 여지가 있다.
- 권장: 내용을 억지로 늘리지 않고 연락 목적, 답변 범위, 관련 정책 링크를 하나의 compact contact panel로 묶거나 footer 위치를 페이지 길이에 맞게 조정한다.
- 관련 파일: `src/pages/contact.astro`, `src/layouts/BaseLayout.astro`.

## P2

### P2-1. 외부 Unsplash hero의 브랜드 독창성과 성능 점검

홈페이지 hero는 외부 Unsplash URL을 background image로 사용한다. 현재 overlay 덕분에 텍스트 대비는 유지되지만, generic 개발자 사진이 사이트의 실제 운영 경험을 직접 설명하지는 않는다. 변경한다면 먼저 CSS/SVG 흐름도 또는 실제 emfls.com 운영 구조를 표현하는 자체 visual을 검토하고, 이미지가 필요할 때만 self-hosted WebP/AVIF와 명시적 크기·loading 정책을 정한다.

### P2-2. 모바일 header와 filter의 수직 길이

좁은 실제 화면에서 header는 세로로 안정적으로 쌓이지만, `/articles/`의 category·tag chip가 긴 필터 영역을 만든다. 기능상 문제는 아니며, 320px에서 chip wrap과 첫 카드 도달 시간을 별도로 확인한 뒤 필요할 때만 접기/요약 UI를 검토한다.

### P2-3. Article metadata와 카드 metadata가 정보량이 많음

article header와 카드 모두 작성일·수정일·작성자·읽는 시간을 보여준다. 신뢰성에는 도움이 되지만 모바일에서는 제목과 lead보다 metadata가 빠르게 길어진다. 1차 polish에서는 날짜·읽는 시간을 우선하고 작성자 정보는 상세 페이지 중심으로 남기는 방안을 검토한다.

### P2-4. 긴 한국어 제목과 영어 식별자의 줄바꿈

현재 제목은 모바일에서 읽을 수 있지만 긴 글 제목은 4줄 이상으로 늘어날 수 있다. `word-break: keep-all`을 전역 적용하면 URL·영문 식별자에 부작용이 생길 수 있으므로, h1/h2와 code/path 표현을 분리한 선택적 규칙으로 실제 320px 결과를 본 뒤 적용한다.

## 확인된 장점

- deep teal header/footer, mint accent, cream background, yellow accent의 색 체계가 homepage·category·article에서 일관된다.
- 390px 전후 화면에서도 navigation, hero CTA, category 설명, 카드가 가로 overflow 없이 세로 흐름으로 전환된다.
- article header의 breadcrumb·category·H1·lead·metadata 순서가 자연스럽고, 작성자 trust box와 checklist/callout이 본문 중간의 변화를 제공한다.
- category page는 클러스터 설명과 3열 카드 grid가 데스크톱에서 균형 있게 보인다.
- Contact와 정책 페이지는 과도한 장식 없이 읽기 쉬운 문서 방향을 유지한다.

## Image Plan

아직 이미지는 생성하지 않는다. 현재 판단상 필요한 후보는 다음과 같다.

| 우선순위 | 사용 위치 | 판정 | 목적 | 권장 비율 | alt 방향 |
| --- | --- | --- | --- | --- | --- |
| 1 | Homepage hero | AI illustration 또는 CSS/SVG visual | 개인 도메인 → GitHub → Astro → Cloudflare Pages 흐름을 브랜드 고유 visual로 표현 | 16:7 | 개인 도메인 정적 사이트 운영 흐름 |
| 2 | Cloudflare 배포 cluster | CSS/SVG visual 우선 | 정상 배포와 실패 진단의 단계를 구분 | 3:2 | GitHub에서 Cloudflare Pages로 이어지는 배포 흐름 |
| 3 | Search/SEO cluster | CSS/SVG visual 우선 | robots·sitemap·canonical·Search Console 관계 설명 | 3:2 | 검색 크롤링과 색인 점검 신호 |

### 생성하지 않을 이미지

- Cloudflare dashboard, Search Console, AdSense 화면: 실제 screenshot이 필요하며 AI로 만들지 않는다.
- 실제 production QA나 결제·분석 대시보드: 확인 가능한 원본이 없으므로 가짜 화면을 만들지 않는다.
- 모든 article에 반복 hero를 추가하는 방식: 정보 가치와 성능 이득이 불명확하다.

## Real Screenshot Plan

실제 screenshot이 확보될 때만 다음 위치를 검토한다.

- Cloudflare Pages build log: `cloudflare-pages-build-failure`의 진단 예시.
- Search Console URL Inspection/색인 상태: `search-console-discovered-not-indexed`의 공식 도구 설명.
- 실제 repository 구조와 `dist/` build 결과: Astro 운영 구조 글의 확인 box.
- AdSense·정책·ads.txt QA: 승인 결과나 계정 내부 데이터가 아니라 저장소/실제 공개 URL 확인 화면만 사용.

현재 저장소에는 위 용도의 실제 screenshot 파일이 확인되지 않았으므로 공개 화면에 placeholder를 추가하지 않는다.

## Batch Plan

### Batch 1 — Typography / spacing / responsive

1. 정확한 320px·390px·768px viewport로 title wrap, filter chip, metadata, footer를 다시 측정한다.
2. 선택적 `word-break`/`text-wrap` 규칙과 article mobile padding을 실제 화면 기준으로 결정한다.
3. 공통 `:focus-visible` 규칙을 추가하고 keyboard tab 순서를 다시 검사한다.

### Batch 2 — Article body visual hierarchy

1. 실제 프로젝트 확인 지점과 example 문단을 별도 box로 표현한다.
2. code/path/command 문장을 일반 paragraph와 구분한다.
3. related article와 공식 문서 목록을 현재 텍스트 목록과 compact card 중 어느 쪽이 더 읽기 좋은지 비교한다.

### Batch 3 — Homepage / cards / categories / trust pages

1. 카드 gradient와 icon 변주를 최소 범위로 검토한다.
2. Contact의 빈 공간을 콘텐츠 증량 없이 compact panel로 개선할지 결정한다.
3. article 수가 적은 category의 intro·grid 균형을 확인한다.

### Batch 4 — Image generation / integration

1. Image Plan의 homepage 1개 후보만 먼저 실제 필요성을 재평가한다.
2. 실제 screenshot과 AI illustration을 혼동하지 않도록 출처·alt·loading을 정한다.
3. 생성 이미지가 없으면 CSS/SVG visual로 종료한다.

## 이번 감사에서 수정하지 않은 항목

- CSS, article 내용, 이미지, URL, SEO 구조, GA4, AdSense, sitemap, robots는 수정하지 않았다.
- 감사 결과 문서만 추가할 예정이며, 구현은 별도 승인된 후속 batch에서 진행한다.

## Batch 1 완료 기록

### 수정 완료

- `src/layouts/BaseLayout.astro`만 수정했다.
- Homepage H1은 기존 visual hierarchy를 유지하면서 article H1과 분리했다. homepage hero는 `clamp(2.15rem, 4.5vw, 4.5rem)`, article H1은 `clamp(2rem, 3.4vw, 3.5rem)`으로 조정했다.
- 제목에는 선택적으로 `text-wrap: balance`, lead에는 `text-wrap: pretty`를 적용했다. article 문단에는 `overflow-wrap: break-word`를 적용해 긴 식별자와 URL이 화면 밖으로 나가지 않도록 했다.
- 모바일 breakpoint에서 hero 최소 높이를 380px에서 340px로, section/simple page/article shell의 vertical padding을 40px로 압축했다. article header/body gap도 모바일에서 줄였다.
- article metadata는 정보는 유지하고 모바일 gap과 글자 크기만 조정했다.
- nav link, filter chip, FAQ summary의 조작 영역을 최소 40~44px 수준으로 보강했다.
- `:where(a, button, input, select, textarea, summary):focus-visible` 공통 규칙을 추가했다. mouse click의 상시 outline은 만들지 않았다.

### Batch 1 검증

- `npm run build`: PASS, 52페이지 생성.
- 데스크톱 브라우저: homepage hero H1, article H1, article 본문 폭과 spacing을 실제 화면에서 확인. homepage H1과 article H1이 과도하게 같은 크기로 보이지 않는다.
- 좁은 화면 브라우저: header, hero CTA, article 제목, metadata wrap, 본문 줄바꿈을 실제 화면에서 확인. 가로 overflow는 확인되지 않았다.
- keyboard focus: Tab 이동 시 skip link에 노란 outline이 실제 표시되는 것을 확인.
- 1440×900, 1024×768, 768×1024, 390×844, 320×700: 현재 브라우저 도구에서 정확한 viewport 고정 기능을 사용할 수 없어 각각의 PASS는 기록하지 않는다. 데스크톱 및 좁은 모바일형 렌더링은 확인했으며, 정확한 320px 재검증은 남은 항목이다.
- canonical·JSON-LD·sitemap·robots·GA4·AdSense: HTML 구조를 변경하지 않았으며 build 회귀 없음.

### 남은 우선순위

- P1: article example/trust 정보의 별도 시각 box, 실제 screenshot 데이터와 렌더링 구조 정합성, 카드 visual 반복, Contact 빈 공간.
- P2: 외부 hero image, 정확한 320px에서의 filter/metadata 측정, 관련 글·공식 문서 목록 polish.

### 다음 Batch

Batch 2에서 article 본문의 실제 프로젝트 확인 영역과 example presentation을 별도 검토한다. 이미지나 가짜 screenshot은 추가하지 않는다.

## Batch 2 완료 기록

### 수정 완료

- `src/pages/articles/[slug].astro`에서 example, checklist, related, sources 영역에 역할을 드러내는 최소한의 class와 의미 구조를 추가했다. article 내용, related 선정 로직, URL, SEO 구조는 변경하지 않았다.
- `src/layouts/BaseLayout.astro`에서 공통 radius·spacing·typography를 유지한 채 example에는 subtle accent surface, checklist에는 비인터랙티브 체크 표시, mistakes에는 약한 warning surface, related와 sources에는 compact link panel을 적용했다.
- FAQ는 기존 native `details`/`summary` 구조를 유지했고, sources는 외부 링크 표시와 `target`·`rel`을 유지했다.
- 실제 screenshot 파일이 없으므로 screenshot 데이터는 렌더링하지 않았고 P1 미해결 항목으로 남겼다.

### Batch 2 검증

- `npm run build`: PASS, 52페이지 생성, 공개 article 15개 생성.
- 대표 article 5개(`static-website-running-cost`, `search-console-discovered-not-indexed`, `cloudflare-pages-build-failure`, `site-migration-ranking-drop`, `how-to-check-https-on-custom-domain`)의 실제 브라우저 렌더링과 접근성 트리를 확인했다.
- checklist·example·related·sources의 역할 분리, native FAQ, 하단 compact 목록, 하단 영역의 가로 overflow 없음, Tab 이동 시 focus-visible outline을 확인했다.
- 정확한 고정 viewport를 제공하지 않는 현재 브라우저 도구로 인해 390×844와 320×700의 수치 고정 PASS는 기록하지 않는다. 좁은 모바일형 렌더링은 확인했으며 320px 정확 재검증은 미해결이다.
- 생성 HTML에서 대표 article canonical·Article JSON-LD·GA4·AdSense를 확인했고, sitemap·robots 및 404/HTML site-map의 AdSense 제외 구조를 확인했다. 실제 article 경로 대상 링크와 자기 자신 링크에 회귀는 없었다.

### 남은 우선순위

- P1: 실제 screenshot 데이터 확보 및 렌더링 정합성, 카드 visual 반복, Contact 빈 공간.
- P2: 정확한 320px viewport 재검증과 필요 시 관련 글·공식 문서 목록의 추가 polish.

### 다음 Batch

Batch 3에서 homepage·card·category·trust page visual을 별도 검토한다. screenshot은 실제 원본이 확보될 때만 진행한다.
