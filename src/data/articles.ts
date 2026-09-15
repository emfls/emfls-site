export type Article = {
  title: string;
  slug: string;
  description: string;
  category: string;
  date: string;
  updatedAt?: string;
  readingTime: string;
  readingTimeMinutes?: number;
  authorName?: string;
  tags?: string[];
  summary?: string;
  heroImage?: string;
  series?: string;
  hero: string;
  sections: {
    heading: string;
    body: string[];
  }[];
};

const sourceArticles: Article[] = [
  {
    title: '사이트 이전 후 검색 순위가 떨어질 때 확인할 것',
    slug: 'site-migration-ranking-drop',
    description: '도메인·호스팅·URL을 이전한 뒤 검색 노출이 줄었을 때 redirect, canonical, sitemap, robots와 Search Console을 점검하는 순서입니다.',
    category: '검색·SEO',
    date: '2026-09-14',
    updatedAt: '2026-09-14',
    readingTime: '10분',
    hero: '사이트 이전 후 검색 변화가 생겼다면 순위부터 추측하지 말고 이전 유형과 URL 신호를 먼저 대조합니다.',
    sections: [
      {
        heading: '먼저 어떤 이전인지 구분한다',
        body: [
          '사이트 이전은 같은 도메인에서 호스팅만 바꾸는 경우, framework나 build 환경을 바꾸는 경우, URL 구조를 바꾸는 경우, HTTP에서 HTTPS로 바꾸는 경우, www와 루트 도메인을 바꾸는 경우, 도메인 자체를 바꾸는 경우가 서로 다릅니다. 이전 범위가 클수록 검색 변화의 원인을 한 가지로 단정하기 어렵습니다.',
          'URL이 그대로라면 redirect를 새로 만들기보다 현재 URL의 응답과 canonical을 먼저 확인합니다. URL이 바뀌었다면 이전 URL과 최종 URL의 관계를 표로 만들어 다음 단계의 기준으로 삼습니다.',
        ],
      },
      {
        heading: '1. 기존 URL과 최종 URL의 관계를 확인한다',
        body: [
          '중요 페이지마다 이전 URL, 최종 URL, redirect 도착지, 신규 페이지의 canonical을 기록합니다. 주소가 변경된 경우 Google은 이전 URL에서 새 URL로 연결되는 영구 redirect를 권장하므로, 가장 관련성 높은 새 페이지로 직접 연결되는지 봅니다.',
          '모든 과거 URL을 홈페이지 하나로 보내거나 redirect를 여러 번 거치는 구조는 페이지 의미를 확인하기 어렵게 만들 수 있습니다. 반대로 URL이 바뀌지 않은 호스팅 이전이라면 불필요한 redirect 변경부터 하지 않습니다.',
        ],
      },
      {
        heading: '2. HTTP 상태와 redirect chain을 확인한다',
        body: [
          '주요 이전 전 URL과 신규 URL을 HTTP 도구나 브라우저 개발자 도구로 확인해 200, 301/308, 404 중 무엇을 반환하는지 구분합니다. 기존 중요 URL이 404라면 순위 분석보다 먼저 migration 경로 문제로 분류합니다.',
          'redirect가 있다면 중간 주소를 거치지 않고 최종 URL에 도착하는지 확인합니다. redirect가 정상이어도 검색 결과가 즉시 바뀐다고 보장되는 것은 아니므로, 상태 확인과 재처리 시간을 별도로 기록합니다.',
        ],
      },
      {
        heading: '3. canonical과 sitemap을 최종 URL 기준으로 맞춘다',
        body: [
          '신규 페이지의 `rel="canonical"`이 자기 자신, 이전 URL, 또는 전혀 다른 페이지 중 어디를 가리키는지 확인합니다. redirect와 canonical이 서로 다른 대표 URL을 가리키면 이전 신호를 해석하기 어려워집니다.',
          'sitemap에는 현재 색인되길 원하는 최종 canonical URL을 넣는 방향으로 점검합니다. 이전 URL과 신규 URL을 특별한 이유 없이 함께 남기지 말고, 사이트 내부 링크도 최종 URL을 가리키는지 함께 확인합니다.',
        ],
      },
      {
        heading: '4. 내부 링크와 크롤링 경계를 확인한다',
        body: [
          'navigation, article 본문, related article 영역이 이전 URL을 계속 가리키고 있지 않은지 확인합니다. sitemap에만 남아 있는 URL보다 사이트 안에서 관련 페이지로 자연스럽게 연결되는 구조가 migration 후 점검 대상이 됩니다.',
          '`robots.txt`, `noindex`, X-Robots-Tag가 이전 과정에서 잘못 남았는지도 확인합니다. 다만 이 항목을 모든 검색 하락의 원인으로 단정하지 말고, 실제 응답과 HTML에서 확인되는 신호로만 판단합니다.',
        ],
      },
      {
        heading: '5. Search Console에서 전후 상태를 비교한다',
        body: [
          'Search Console의 Page indexing, URL Inspection, sitemap 상태에서 이전 URL과 최종 URL을 각각 확인합니다. 도메인 자체를 옮겼다면 해당 이전 유형에 맞는 Search Console 속성과 변경 절차를 검토합니다. 실제 emfls.com 계정 데이터나 순위 하락 수치는 이 저장소에서 확인되지 않으므로 만들어내지 않습니다.',
          'URL Inspection의 실시간 테스트가 성공해도 색인이나 검색 순위가 보장되는 것은 아닙니다. 구조를 수정한 뒤에는 sitemap과 내부 링크를 최종 URL 기준으로 정리하고, Google이 다시 크롤링·처리할 시간을 고려합니다.',
        ],
      },
      {
        heading: '6. 이전과 동시에 바뀐 것을 분리한다',
        body: [
          '호스팅만 바꾼 것인지, 아니면 title·본문·URL·내부 링크·canonical·페이지 구조까지 함께 바꾼 것인지 비교합니다. 여러 요소가 동시에 변했다면 검색 변화를 hosting migration 하나의 결과라고 단정할 수 없습니다.',
          '변경 기록과 이전 전후 HTML을 비교해 공통 설정 문제와 특정 페이지 콘텐츠 문제를 나눕니다. 원인을 확인하기 전에 URL을 다시 바꾸거나 content를 대량 수정하는 방식은 권하지 않습니다.',
        ],
      },
    ],
  },
  {
    title: 'Cloudflare Pages 배포 실패 원인별 점검표',
    slug: 'cloudflare-pages-build-failure',
    description: 'Cloudflare Pages와 GitHub 연결 후 배포가 실패할 때 build log, 로컬 재현, command, output directory와 runtime을 순서대로 확인하는 점검표입니다.',
    category: 'Cloudflare·배포',
    date: '2026-09-14',
    updatedAt: '2026-09-14',
    readingTime: '9분',
    hero: '오류 메시지를 먼저 확인하고 repository, build, deploy 단계 중 어디에서 문제가 생겼는지 구분하는 실전 진단 순서입니다.',
    sections: [
      {
        heading: 'Build log부터 확인한다',
        body: [
          'Cloudflare Pages에서 배포가 실패했다면 설정을 무작정 바꾸기 전에 Workers & Pages의 프로젝트에서 Deployments를 열고 해당 배포의 View details와 Build log를 확인합니다. 먼저 repository·dependency 준비, application build, deploy 중 어느 단계에서 멈췄는지 나눠야 다음 확인 위치가 정해집니다.',
          'Cloudflare 공식 문서도 build log의 실제 오류를 출발점으로 삼고, build command·output folder·환경 변수를 application build 오류의 점검 항목으로 안내합니다. 로그를 확인하지 않은 상태에서는 특정 원인을 확정하지 않습니다.',
        ],
      },
      {
        heading: '로컬에서 같은 build를 재현한다',
        body: [
          '로컬에서 먼저 `npm ci`를 실행해 package-lock과 dependency 설치를 재현하고, 이어서 `npm run build`를 실행합니다. emfls.com 저장소는 `package.json`에 `build: astro build`가 정의되어 있으므로 이 두 명령으로 repository와 정적 build 단계를 확인할 수 있습니다.',
          '`npm ci`는 lockfile을 사용하는 이 저장소에서 재현 가능한 방법이라는 뜻이지 모든 Node 프로젝트의 필수 해결책은 아닙니다. 로컬에서도 실패하면 Cloudflare 설정을 바꾸기 전에 install 또는 application build 문제로 분류하고, 로컬은 성공하지만 Pages만 실패하면 build log와 환경 차이를 비교합니다.',
        ],
      },
      {
        heading: 'Build command와 output directory를 대조한다',
        body: [
          'Cloudflare Pages의 build command가 repository의 `package.json` scripts와 같은지 확인합니다. emfls.com의 저장소에서 확인되는 명령은 `npm run build`이며, Cloudflare dashboard의 실제 현재 설정값은 별도로 확인하지 않았으므로 설정되어 있다고 단정하지 않습니다.',
          '그 다음 framework가 실제로 만든 결과 디렉터리를 확인합니다. 이 Astro 프로젝트는 build 결과를 `dist/`에 생성하며 `astro.config.mjs`에는 대표 site `https://emfls.com`이 설정되어 있습니다. `dist/`는 emfls.com의 확인 결과일 뿐 모든 framework의 공통 output directory는 아닙니다.',
        ],
      },
      {
        heading: 'Root directory와 runtime 차이를 점검한다',
        body: [
          'repository가 monorepo이거나 사이트가 하위 폴더에 있다면 Pages의 root directory가 실제 `package.json` 위치와 맞는지 확인합니다. 잘못된 폴더에서 시작하면 command를 찾지 못하거나 엉뚱한 파일을 build할 수 있지만, emfls.com이 그런 문제를 겪었다는 기록은 없습니다.',
          '로컬과 Pages의 Node/runtime이 다르면 dependency 설치나 build 결과가 달라질 수 있습니다. Cloudflare 공식 문서에서 안내하는 `NODE_VERSION`, `.nvmrc`, `.node-version` 같은 지정 방법과 현재 build image의 지원 범위를 확인하되, 특정 버전으로 무조건 바꾸지는 않습니다. 현재 emfls.com 저장소에는 Node version 고정 파일이 확인되지 않습니다.',
        ],
      },
      {
        heading: '환경 변수와 dependency 문제를 로그로 좁힌다',
        body: [
          'build 과정에서 환경 변수를 요구하는 프로젝트라면 Pages의 Environment variables에 필요한 값이 있는지 확인합니다. emfls.com의 현재 정적 build는 저장소에서 확인되는 build secret을 요구하지 않으므로, 이 글에서 실제 누락 사례로 주장하지 않습니다. secret 값은 article이나 repository에 기록하지 않습니다.',
          'install failure라면 package manager와 lockfile의 일치 여부, dependency 버전, runtime 호환성을 오류 메시지와 함께 확인합니다. 원인을 모른 채 dependency를 전부 최신으로 올리거나 lockfile을 삭제하는 방식은 권하지 않습니다.',
        ],
      },
      {
        heading: 'Build 실패와 배포 후 404를 구분한다',
        body: [
          'build command가 0이 아닌 상태로 끝나면 우선 build failure입니다. 반대로 build가 성공해 파일이 업로드된 뒤 공개 URL이 404라면 build 자체의 실패와 다른 문제로 분류하고 output directory, 최상위 정적 파일 구조, 요청한 URL을 따로 확인합니다.',
          '예를 들어 정적 배포 결과에 요청 경로에 맞는 파일이 실제로 생성됐는지 `dist/`에서 확인합니다. Cloudflare Pages 공식 정적 HTML 안내처럼 최상위 `index.html`이 필요한 유형도 있으므로, framework별 결과 구조를 확인한 뒤 판단해야 합니다.',
        ],
      },
    ],
  },
  {
    title: 'Search Console에서 발견됨 - 현재 색인이 생성되지 않음 해결 순서',
    slug: 'search-console-discovered-not-indexed',
    description: 'Search Console의 발견됨 - 현재 색인이 생성되지 않음 상태를 크롤링 전 구조와 크롤링 후 색인 적합성으로 나누어 점검하는 순서입니다.',
    category: '검색·SEO',
    date: '2026-09-14',
    updatedAt: '2026-09-14',
    readingTime: '8분',
    hero: 'URL이 발견됐다는 사실과 색인이 거부됐다는 판단을 섞지 않고, 확인 가능한 신호부터 순서대로 점검합니다.',
    sections: [
      {
        heading: '먼저 상태의 의미를 정확히 해석한다',
        body: [
          'Google 공식 설명에서 `Discovered - currently not indexed`는 Google이 URL을 발견했지만 아직 크롤링하지 않은 상태입니다. 따라서 이 상태만으로 noindex, 콘텐츠 품질, canonical 문제가 확정되었다고 해석하면 안 됩니다.',
          '발견과 크롤링, 크롤링과 색인은 서로 다른 단계입니다. 먼저 Google이 방문할 수 있는 구조인지 확인하고, 실제로 크롤링한 뒤에야 페이지 내용과 색인 적합성을 별도로 판단합니다.',
        ],
      },
      {
        heading: '1. URL과 redirect가 정상인지 확인한다',
        body: [
          '브라우저나 HTTP 도구로 검사할 URL이 실제로 200 응답을 반환하는지 확인합니다. 예를 들어 emfls.com의 저장소·production QA에서 사용하는 대표 URL 형식은 `https://emfls.com/articles/personal-domain-website-start-checklist/`처럼 최종 공개 주소를 기준으로 합니다. 이 예시는 URL 구조 확인용이며, emfls.com이 해당 Search Console 상태를 겪었다는 뜻은 아닙니다.',
          '예전 주소에서 새 주소로 이동한다면 redirect가 최종 URL에서 끝나는지 확인합니다. 여러 redirect를 연속으로 거치거나 존재하지 않는 주소로 끝나면 크롤링 전 접근성 문제로 먼저 분류합니다.',
        ],
      },
      {
        heading: '2. 크롤링 전에 접근 경계를 점검한다',
        body: [
          '`robots.txt`가 검사 대상 URL을 막고 있지 않은지 확인합니다. robots.txt는 crawler가 요청할 수 있는 범위를 제어하는 파일이므로, noindex와 같은 색인 지시로 취급하지 않습니다.',
          '페이지 HTML의 robots meta 또는 X-Robots-Tag도 확인하되, `noindex`는 실제 페이지를 크롤링한 이후 색인에 영향을 주는 별도 신호로 구분합니다. 이 단계에서는 “현재 상태의 직접 원인”이라고 단정하지 않고, 향후 크롤링 후 점검할 항목으로 기록합니다.',
        ],
      },
      {
        heading: '3. canonical과 sitemap 신호를 맞춘다',
        body: [
          '최종 공개 URL의 `rel="canonical"`, redirect 대상, sitemap에 적힌 URL이 서로 다른 주소를 가리키지 않는지 비교합니다. Google은 redirect, canonical link, sitemap을 canonical 선택에 참고하는 신호로 설명하지만, 어느 하나가 색인을 보장한다고 말하지 않습니다.',
          'emfls.com 저장소에서는 `astro.config.mjs`의 site가 `https://emfls.com`이고 XML sitemap은 `https://emfls.com/sitemap.xml`에서 제공됩니다. 실제 점검에서는 sitemap에 최종 canonical URL만 들어 있는지 확인하고, HTML 사이트맵과 redirect source를 같은 대상으로 착각하지 않습니다.',
        ],
      },
      {
        heading: '4. 내부 링크로 발견 가능한 구조인지 본다',
        body: [
          'URL이 sitemap에만 있고 사이트 내부에서 연결되지 않는지, 관련 글·목록·카테고리에서 자연스럽게 접근할 수 있는지 확인합니다. 내부 링크가 있다고 색인이 보장되는 것은 아니지만, 사이트 구조와 URL의 관계를 점검하는 유효한 구조 검사입니다.',
          '정적 Astro 사이트라면 `src/pages/`에서 route가 생성되고, article 데이터와 목록 페이지에서 공개 URL이 연결됩니다. 특정 URL이 실제 build 결과에 생성되는지와 사이트 안에서 링크가 존재하는지를 나누어 확인합니다.',
        ],
      },
      {
        heading: '5. 크롤링 이후의 색인 적합성은 별도로 판단한다',
        body: [
          'Google이 실제로 페이지를 크롤링한 뒤에는 noindex, Google이 선택한 canonical, 중복·유사 콘텐츠, 페이지의 고유성과 가치 같은 항목을 별도의 색인 적합성 문제로 점검할 수 있습니다. 이는 `Discovered` 상태 자체의 확정 원인 목록이 아닙니다.',
          '비슷한 URL이 여러 개라면 어떤 주소를 대표로 삼을지 정하고, 대표 페이지의 내용과 내부 연결을 정리합니다. 페이지를 억지로 늘리거나 제목만 바꾼 유사 글을 추가하는 방식은 해결책으로 보지 않습니다.',
        ],
      },
      {
        heading: '6. URL Inspection과 재확인의 범위를 정한다',
        body: [
          'URL Inspection에서는 Google이 URL을 어떻게 발견했는지, 접근 가능 여부와 보고된 상태를 확인합니다. 다만 실시간 테스트가 성공했다고 색인이 보장되는 것은 아니며, `Discovered - currently not indexed`나 canonical 선택처럼 실시간으로 모두 판단할 수 없는 항목이 있습니다.',
          '구조적 문제를 고친 뒤에는 해당 URL을 다시 확인하고, 색인 요청을 반복 클릭하는 것을 핵심 해결책으로 삼지 않습니다. 크롤링과 색인 결과가 갱신되는 데 시간이 필요한 경우와, 계속되는 접근·redirect·canonical·콘텐츠 문제를 구분해 기록합니다.',
        ],
      },
    ],
  },
  {
    title: '개인 도메인 정적 사이트 운영 비용 총정리',
    slug: 'static-website-running-cost',
    description: '개인 도메인, GitHub, Astro, Cloudflare Pages와 DNS를 이용한 정적 사이트 운영비를 무료·유료·추가 비용으로 구분해 정리합니다.',
    category: 'Cloudflare·배포',
    date: '2026-09-14',
    updatedAt: '2026-09-14',
    readingTime: '9분',
    hero: '정적 사이트는 무료로 시작할 수 있지만 도메인과 사용량·기능에 따른 비용은 따로 계산해야 합니다.',
    sections: [
      {
        heading: '먼저 비용을 세 종류로 나눈다',
        body: [
          '개인 정적 사이트의 운영비는 반드시 발생하는 비용, 현재 무료로 사용할 수 있는 부분, 사용량이나 기능에 따라 추가되는 비용으로 나누어야 합니다. “무료 호스팅”이라는 문장만 보면 도메인 갱신비와 유료 기능 비용을 놓치기 쉽습니다.',
          '이 글의 가격은 확인일 `2026-09-14` 기준입니다. 특히 도메인 프로모션과 무료 플랜의 한도는 바뀔 수 있으므로 결제 전에는 각 공식 가격 페이지에서 다시 확인해야 합니다.',
        ],
      },
      {
        heading: '처음 시작할 때 반드시 계산할 비용',
        body: [
          '대표 도메인을 구매하면 등록 비용이 발생합니다. 가비아의 현재 `.com` 페이지에는 프로모션 가격 19,800원과 일반 가격 26,400원이 함께 표시됩니다(부가세 포함, `2026-09-14` 확인). 19,800원은 이벤트 가격이므로 매년 고정 비용으로 계산하지 말고, 갱신 시점의 정상 가격과 조건을 별도로 확인해야 합니다.',
          '도메인을 제외하면 이 구조에서 소스 저장소, Astro 정적 빌드, Cloudflare Pages 호스팅, Cloudflare DNS와 HTTPS는 무료 범위로 시작할 수 있습니다. 전체 연결 순서는 관련 글에서 이어서 확인할 수 있습니다. 다만 무료라는 말은 무제한이라는 뜻이 아니며, 각 서비스의 정책과 사용량 한도를 함께 봐야 합니다.',
        ],
      },
      {
        heading: '첫해 결제와 매년 반복되는 비용은 다르다',
        body: [
          '개인 도메인은 첫해 등록비만 내고 끝나는 서비스가 아니라 등록 기간을 연장하는 갱신 비용이 반복되는 구조입니다. 가비아 `.com` 페이지에서 확인한 19,800원은 프로모션 등록 가격이고 26,400원은 일반 가격입니다(부가세 포함, `2026-09-14` 확인). 신규 등록 프로모션과 갱신 가격은 다를 수 있으므로 갱신 시점의 공식 가격을 확인해야 하며, 이 글에서는 갱신 가격을 추측해 연간 고정액으로 계산하지 않습니다.',
          '도메인을 정상적으로 같은 registrar에서 갱신하고 nameserver와 DNS 설정을 바꾸지 않았다면, 기존 DNS record를 매년 처음부터 다시 만드는 비용 항목과는 별개입니다. 다만 registrar 정책과 계정 상태에 따라 확인할 사항이 달라질 수 있으므로 만료일, 자동 갱신, 결제수단, 연락처와 알림 수신 상태를 함께 점검합니다.',
        ],
      },
      {
        heading: 'Registrar 이전과 DNS provider 변경을 구분한다',
        body: [
          'registrar는 도메인 소유와 갱신을 관리하고, DNS provider는 nameserver와 DNS record를 관리합니다. 현재 emfls.com 구조에서는 registrar와 Cloudflare DNS의 역할을 나누어 보며, GitHub는 source, Astro는 static build, Cloudflare Pages는 hosting/deployment를 담당합니다.',
          'registrar만 이전하는 경우와 nameserver를 Cloudflare 또는 다른 DNS provider로 변경하는 경우는 확인 범위가 다릅니다. 후자는 기존 record, MX/TXT 같은 필요한 항목, Pages custom domain과 HTTPS를 다시 대조해야 하지만 DNS record가 반드시 사라진다고 단정하지는 않습니다. 실제 설정을 확인하지 않은 상태에서 이전 비용이나 중단 시간을 합산하지 않습니다.',
        ],
      },
      {
        heading: '현재 무료로 사용하는 운영 구조',
        body: [
          'emfls.com은 GitHub에서 소스와 버전을 관리하고, Astro가 `npm run build`로 정적 파일을 만들며, Cloudflare Pages가 production hosting/deployment를 담당합니다. 이 역할 분리는 관련 글에서 더 자세히 설명합니다. Cloudflare DNS는 도메인의 DNS를 관리하고 `https://emfls.com`이 대표 주소가 됩니다.',
          'GitHub Free는 개인 계정에서 public·private repository를 운영할 수 있는 범위를 제공하지만, Actions나 Packages처럼 별도 사용량이 있는 기능은 이 사이트의 필수 운영비로 계산하지 않습니다. Astro 자체도 이 프로젝트에서는 package dependency로 빌드에 사용하며, 별도 호스팅 요금 항목으로 계산하지 않습니다.',
          'Cloudflare Pages Free는 공식 제한상 월 500 builds, 동시 build 1개, 프로젝트당 custom domain 100개, 사이트 파일 20,000개, 단일 asset 25 MiB까지입니다. Cloudflare DNS는 공식 문서상 Free plan에서도 제공되며 DNS query에 별도 요금을 부과하지 않는 범위입니다.',
        ],
      },
      {
        heading: '언제 추가 비용이 생기는가',
        body: [
          '가장 먼저 발생하는 반복 비용은 도메인 갱신입니다. 첫 등록 프로모션과 갱신 가격은 다를 수 있으므로 연간 예산은 프로모션 가격이 아니라 갱신 조건으로 잡는 편이 안전합니다. 이메일 주소가 필요하면 별도 메일 서비스 비용도 추가될 수 있습니다.',
          '무료 정적 호스팅의 한도를 넘는 빌드·파일·asset·동적 기능이 필요하면 상위 플랜이나 다른 제품을 검토해야 합니다. GitHub와 Cloudflare Pages의 역할을 나누어 보는 것이 먼저입니다. 서버 실행, 데이터베이스, 회원 기능, 대용량 파일, 고급 분석을 붙이는 순간에는 정적 사이트의 기본 비용표와 분리해 예상해야 합니다.',
          '비교 참고로 Netlify Free는 공식 가격 페이지에서 월 300 credits의 하드 한도를 안내하고, Personal은 월 9달러입니다. 이 글은 Netlify 요금제 비교가 아니라, 무료 호스팅도 사용량 정책이 있다는 점을 보여주는 참고 사례로만 다룹니다.',
        ],
      },
      {
        heading: 'GitHub Pages와 다른 호스팅을 볼 때의 기준',
        body: [
          'GitHub Pages, Cloudflare Pages, Netlify 모두 정적 사이트를 무료 범위에서 시작할 수 있지만, 실제 선택에서는 custom domain, build 한도, 파일 크기, 배포 방식, 동적 기능 필요 여부를 비교해야 합니다. 서비스 이름만 보고 비용이 0원이라고 결론 내리면 안 됩니다.',
          'emfls.com처럼 GitHub는 source/version control, Astro는 build, Cloudflare Pages는 production hosting이라는 역할 분리가 이미 명확하다면, 서비스를 바꾸기 전에 현재 한도와 실제 필요한 기능부터 계산하는 것이 우선입니다. 상세 서비스 비교는 별도의 비교 글에서 다룰 수 있는 주제입니다.',
        ],
      },
      {
        heading: 'emfls.com 방식으로 예산을 분류하는 법',
        body: [
          '최소 예산은 “도메인 등록·갱신비”와 “선택한 추가 서비스”를 따로 적고, GitHub·Astro·Cloudflare Pages·Cloudflare DNS는 무료 사용 범위와 한도를 확인하는 방식으로 계산합니다. 실제 결제하지 않은 서비스나 이 사이트의 실제 지출 총액은 저장소만으로 알 수 없으므로 합계로 단정하지 않습니다.',
          '예산표를 만들 때는 도메인 첫해 프로모션, 다음 갱신 예상액, 이메일·폼·분석 같은 선택 기능, 무료 플랜을 넘을 가능성이 있는 사용량을 각각 별도 행으로 두면 비용 구조가 선명해집니다. 실제 공개 후 확인 항목은 관련 글에서 이어서 확인할 수 있습니다.',
        ],
      },
    ],
  },
  {
    title: 'emfls.com 개인 도메인 사이트 구축 로드맵',
    slug: 'personal-domain-website-start-checklist',
    description: '도메인 구매부터 DNS, GitHub, Astro, Cloudflare Pages, HTTPS, production QA, 검색 등록과 AdSense 준비까지의 실제 구축 순서입니다.',
    category: '시작 준비',
    date: '2026-06-08',
    updatedAt: '2026-09-14',
    readingTime: '5분',
    hero: '개인 도메인을 산 뒤 무엇을 어떤 순서로 연결할지 emfls.com의 실제 파일과 배포 흐름으로 안내합니다.',
    sections: [
      {
        heading: '1단계 — 도메인과 DNS 기준 정하기',
        body: [
          '대표 주소를 `https://emfls.com`으로 정하고, 가비아 registrar와 Cloudflare DNS의 역할을 분리합니다. nameserver 연결은 별도 도메인 글에서 확인합니다.',
          'DNS 세부 검증은 [emfls.com Cloudflare DNS 설정 후 확인하는 순서](/articles/cloudflare-dns-setup-for-beginners/)를 참고합니다.'
        ],
      },
      {
        heading: '2단계 — 소스와 정적 사이트 준비',
        body: [
          'GitHub repository에서 Astro 소스를 관리하고 `npm run build`로 `dist/` 정적 출력을 만듭니다. 구성 요소의 책임은 [Astro + Cloudflare Pages 운영 구조](/articles/why-astro-for-static-content-site/)에서 설명합니다.',
          '이 단계는 새 기능을 추가하는 과정이 아니라 source, build command, output directory가 실제 설정과 맞는지 확인하는 과정입니다.'
        ],
      },
      {
        heading: '3단계 — 배포와 production 확인',
        body: [
          'Cloudflare Pages에 GitHub repository를 연결하고 build command `npm run build`, output directory `dist/`를 기준으로 배포합니다. [GitHub → Cloudflare Pages 배포 글](/articles/github-to-cloudflare-pages-deployment/)에서 pipeline을 확인합니다.',
          'custom domain과 HTTPS가 연결된 뒤에는 [첫 production 배포 후 점검](/articles/after-first-deploy-checklist/) 순서로 실제 공개 상태를 확인합니다.'
        ],
      },
      {
        heading: '4단계 — 검색·신뢰·심사 준비',
        body: [
          'Search Console Domain property와 sitemap을 연결하고 [robots.txt·sitemap·noindex 역할](/articles/robots-and-sitemap-basics/)을 구분합니다.',
          'About, Contact, Privacy, Terms, Editorial Policy, Disclaimer를 실제 운영 상태에 맞게 정리한 뒤 [AdSense 최종 체크리스트](/articles/adsense-review-final-checklist/)로 넘어갑니다.'
        ],
      },
    ],
  },
  {
    title: 'GitHub Pages가 개인 사이트에 적합한 이유와 한계',
    slug: 'github-pages-strengths-and-limits',
    description: '무료 정적 호스팅의 장점은 분명하지만 서버 기능, 폼 처리, 동적 기능에는 제약이 있습니다.',
    category: 'GitHub Pages',
    date: '2026-06-08',
    readingTime: '6분',
    hero: 'GitHub Pages는 단순한 소개 페이지부터 콘텐츠 중심 사이트까지 안정적으로 운영하기 좋은 정적 호스팅입니다.',
    sections: [
      {
        heading: '장점은 단순함과 안정성',
        body: [
          'GitHub Pages의 가장 큰 장점은 정적 파일을 안정적으로 제공한다는 점입니다. HTML, CSS, JavaScript, 이미지처럼 빌드된 파일만 배포하면 되므로 서버 관리나 런타임 장애를 신경 쓸 일이 적습니다.',
          '개인 도메인을 연결할 수 있고 HTTPS도 제공됩니다. 콘텐츠 사이트나 문서형 웹사이트처럼 서버 데이터베이스가 필요 없는 프로젝트라면 비용 부담 없이 시작하기 좋습니다.'
        ],
      },
      {
        heading: '알아야 할 한계',
        body: [
          'GitHub Pages는 PHP, Node 서버, 데이터베이스를 직접 실행하는 호스팅이 아닙니다. 댓글, 회원가입, 관리자 페이지, 검색 색인 같은 기능은 외부 서비스나 정적 생성 방식으로 해결해야 합니다.',
          '문의 폼도 별도 백엔드가 없으면 바로 메일을 보내기 어렵습니다. 초기에는 이메일 링크 방식으로 시작하고, 필요해지면 Formspree, Netlify Forms 같은 외부 폼 서비스를 검토할 수 있습니다.'
        ],
      },
      {
        heading: '콘텐츠 사이트와의 궁합',
        body: [
          '검색 노출을 목표로 하는 정보 사이트는 빠른 로딩, 명확한 URL, 정적인 HTML 출력이 중요합니다. GitHub Pages는 이런 조건에 잘 맞고, Astro 같은 정적 사이트 생성기를 함께 쓰면 글 관리도 편해집니다.',
          '다만 배포 자동화와 도메인 설정을 처음에 정확히 잡아야 합니다. CNAME 파일, DNS 레코드, GitHub Pages 설정이 맞지 않으면 사이트가 열리지 않거나 HTTPS가 활성화되지 않을 수 있습니다.'
        ],
      },
    ],
  },
  {
    title: '가비아 도메인을 GitHub Pages에 연결할 때 확인할 DNS 기록',
    slug: 'legacy-gabia-domain-dns-source',
    description: '루트 도메인과 www 주소를 모두 쓰려면 A 레코드와 CNAME의 역할을 구분해야 합니다.',
    category: '도메인과 DNS',
    date: '2026-06-08',
    readingTime: '7분',
    hero: 'DNS 설정은 한 번에 눈에 보이지 않기 때문에 기록의 목적을 이해하고 천천히 확인하는 것이 중요합니다.',
    sections: [
      {
        heading: '루트 도메인과 서브도메인',
        body: [
          '`emfls.com`처럼 앞에 아무것도 붙지 않은 주소를 루트 도메인 또는 apex 도메인이라고 부릅니다. `www.emfls.com`은 www라는 서브도메인입니다.',
          'GitHub Pages에서 루트 도메인을 쓰려면 GitHub가 안내하는 A 레코드를 등록하고, www 주소는 보통 CNAME으로 GitHub Pages 기본 주소를 가리키게 합니다.'
        ],
      },
      {
        heading: 'DNS 전파 시간 고려하기',
        body: [
          'DNS를 수정한 뒤 바로 결과가 바뀌지 않는 경우가 많습니다. 브라우저 캐시, 통신사 DNS 캐시, 기존 레코드의 TTL 때문에 몇 분에서 수 시간까지 차이가 날 수 있습니다.',
          '설정을 바꾼 직후에는 여러 번 수정하기보다 현재 레코드가 정확한지 확인하고 기다리는 편이 좋습니다. 성급하게 값을 바꾸면 어떤 변경이 문제였는지 추적하기 어려워집니다.'
        ],
      },
      {
        heading: 'GitHub 저장소의 CNAME 파일',
        body: [
          'GitHub Pages는 저장소 루트 또는 빌드 결과물에 `CNAME` 파일이 있어야 사용자 지정 도메인을 안정적으로 유지합니다. 파일에는 대표 도메인 한 줄만 넣는 것이 일반적입니다.',
          '대표 주소를 `emfls.com`으로 정했다면 CNAME 파일에는 `emfls.com`을 넣습니다. www 주소는 DNS와 GitHub Pages 설정에서 보조적으로 처리합니다.'
        ],
      },
    ],
  },
  {
    title: 'Astro + Cloudflare Pages로 emfls.com을 운영하는 구조',
    slug: 'why-astro-for-static-content-site',
    description: 'GitHub의 Astro 소스가 Cloudflare Pages를 거쳐 emfls.com으로 공개되는 실제 운영 구조를 파일 기준으로 설명합니다.',
    category: '사이트 제작',
    date: '2026-06-08',
    updatedAt: '2026-09-14',
    readingTime: '5분',
    hero: '이 사이트의 배포 흐름은 GitHub 저장소, Astro 빌드, Cloudflare Pages, emfls.com으로 이어집니다.',
    sections: [
      {
        heading: '한 번의 배포가 지나가는 경로',
        body: [
          '현재 저장소의 소스는 GitHub에서 관리하고, `npm run build`가 Astro 정적 출력을 `dist/`에 만듭니다. Cloudflare Pages는 이 빌드 결과를 배포하고 `emfls.com`은 대표 공개 주소로 사용됩니다.',
          'GitHub는 이 프로젝트에서 소스와 버전 관리 역할을 하며, 실제 Pages 배포는 Cloudflare Pages에 맡깁니다.'
        ],
      },
      {
        heading: '파일별 책임을 나누기',
        body: [
          '`src/pages/`는 공개 route, `src/data/articles.ts`는 글 데이터, `src/layouts/BaseLayout.astro`는 title·description·canonical·robots·AdSense head를 담당합니다. `astro.config.mjs`는 `https://emfls.com`과 XML sitemap을 선언합니다.',
          '`public/robots.txt`, `public/ads.txt`, `public/_redirects`는 운영 파일로 빌드 결과에 복사됩니다.'
        ],
      },
      {
        heading: '이 구조의 선택과 한계',
        body: [
          '정적 출력은 글·정책 페이지에 공통 metadata를 적용하기 쉽습니다. 반면 관리자 화면이나 데이터베이스는 이 구조에 포함되지 않아 문의는 현재 이메일 링크로 처리합니다.',
          '배포 문제는 Astro 소스, 빌드 결과, Cloudflare 배포, DNS와 대표 도메인을 분리해 확인해야 합니다.'
        ],
      },
    ],
  },
  {
    title: 'emfls.com 신뢰 페이지를 구성하는 방법',
    slug: 'adsense-review-essential-pages',
    description: 'emfls.com의 About, Contact, Privacy, Terms, Editorial Policy, Disclaimer가 각각 어떤 정보를 제공하는지 실제 페이지 기준으로 설명합니다.',
    category: '운영 기준',
    date: '2026-06-08',
    updatedAt: '2026-09-14',
    readingTime: '6분',
    hero: '좋은 글만큼이나 사이트가 누가 운영하는지, 어떻게 연락할 수 있는지도 중요합니다.',
    sections: [
      {
        heading: '신뢰 페이지의 역할',
        body: [
          'About, Contact, Privacy, Terms, Editorial Policy, Disclaimer는 특정 문서명을 갖추면 승인이 보장되는 장치가 아닙니다. 운영 주체와 연락 방법, 개인정보 처리, 콘텐츠 원칙을 방문자에게 공개하는 역할입니다.',
          'emfls.com에는 이 여섯 route가 실제로 존재하며 footer와 관련 페이지에서 접근할 수 있습니다.'
        ],
      },
      {
        heading: '페이지별 실제 정보',
        body: [
          'About은 사이트 목적과 운영자 정보를, Contact는 `contact@emfls.com` 이메일을 제공합니다. Privacy는 이메일 문의 처리, Cloudflare Pages, GitHub, AdSense, Google Analytics 미사용을 설명합니다.',
          'Terms는 콘텐츠 이용·외부 링크·금지 행위를, Editorial Policy는 작성·검토·광고 투명성을, Disclaimer는 정보 제공 범위와 책임 한계를 안내합니다.'
        ],
      },
      {
        heading: 'Contact와 Privacy 점검',
        body: [
          '현재 Contact는 backend form이 아닌 mailto 링크 방식입니다. 실제 연락 경로를 유지하고, 문의 방식이 바뀌면 Privacy의 수집·보관 설명도 함께 갱신합니다.',
          '이 글은 신뢰 페이지의 목적을 다루며 robots, sitemap, build, 전체 심사 준비는 [AdSense 최종 체크리스트](/articles/adsense-review-final-checklist/)의 범위입니다.'
        ],
      },
      {
        heading: 'footer에서 연결할 항목',
        body: [
          '각 신뢰 페이지가 footer와 About에서 실제로 접근되는지 확인하고, 시행일·최종 검토일·문의 주소가 현재 운영 상태와 맞는지 점검합니다.',
          '법률상 승인 요건을 단정하지 않고, 방문자가 사이트 운영 방식을 확인할 수 있는 공개 정보로 관리합니다.'
        ],
      },
    ],
  },
  {
    title: '검색 엔진이 읽기 쉬운 글 URL과 제목 만드는 법',
    slug: 'seo-friendly-title-and-url',
    description: 'URL, 제목, 설명 문구는 방문자와 검색 엔진이 페이지 내용을 이해하는 첫 단서입니다.',
    category: 'SEO',
    date: '2026-06-08',
    readingTime: '5분',
    hero: '좋은 제목은 클릭을 유도하기 전에 페이지가 무엇을 해결하는지 정확히 말해야 합니다.',
    sections: [
      {
        heading: '제목은 구체적으로 쓰기',
        body: [
          '“좋은 사이트 만드는 법”보다 “GitHub Pages에 개인 도메인을 연결할 때 확인할 DNS 기록”이 더 구체적입니다. 제목이 구체적이면 독자는 필요한 글인지 빠르게 판단할 수 있습니다.',
          '검색 노출을 의식하더라도 과장된 표현이나 반복 키워드를 넣는 것은 도움이 되지 않습니다. 실제 본문에서 다루는 내용을 제목에 담는 것이 가장 안정적입니다.'
        ],
      },
      {
        heading: 'URL은 짧고 의미 있게',
        body: [
          '한글 URL도 가능하지만 운영과 공유 편의성을 고려하면 영어 소문자, 하이픈 조합의 짧은 slug가 다루기 쉽습니다. 대표 글은 `/articles/gabia-domain-cloudflare-dns/`처럼 의미가 드러나는 형태를 사용합니다.',
          '날짜 기반 URL은 뉴스나 일기에는 어울리지만, 오래 읽히는 가이드 글에는 주제 기반 URL이 더 적합한 경우가 많습니다.'
        ],
      },
      {
        heading: '설명 문구는 요약이 아니라 약속',
        body: [
          'description 메타 태그는 검색 결과에서 페이지를 설명하는 데 쓰일 수 있습니다. 본문 전체를 요약하기보다 이 글을 읽으면 무엇을 알 수 있는지 분명히 적는 편이 좋습니다.',
          '모든 페이지에 같은 설명을 넣는 것은 피해야 합니다. 글마다 고유한 제목과 설명을 갖추는 것이 기본입니다.'
        ],
      },
    ],
  },
  {
    title: 'emfls.com의 robots.txt, sitemap.xml, noindex 역할 구분하기',
    slug: 'robots-and-sitemap-basics',
    description: 'robots.txt의 크롤링 규칙, noindex의 색인 제외, XML sitemap의 URL 발견 역할을 emfls.com 구현으로 설명합니다.',
    category: '검색·SEO',
    date: '2026-06-08',
    updatedAt: '2026-09-14',
    readingTime: '5분',
    hero: 'robots.txt, noindex, sitemap은 비슷해 보이지만 검색 크롤링과 색인을 서로 다르게 다룹니다.',
    sections: [
      {
        heading: '세 파일의 역할을 나누기',
        body: [
          '`robots.txt`는 crawler가 요청할 수 있는 경로를 안내하는 파일이고, 페이지를 검색 결과에서 숨기는 장치가 아닙니다. Google 문서처럼 crawl 차단 URL도 주소 자체가 검색 결과에 나타날 수 있습니다.',
          '`noindex`는 HTML을 crawl할 수 있을 때 검색 색인 제외를 지시합니다. sitemap은 검색엔진이 canonical URL을 발견하도록 돕지만 색인을 보장하지 않습니다.'
        ],
      },
      {
        heading: 'emfls.com의 실제 구현',
        body: [
          '`public/robots.txt`는 전체 crawler를 허용하고 `https://emfls.com/sitemap.xml`을 안내합니다. `astro.config.mjs`의 sitemap filter는 태그와 HTML sitemap을 XML sitemap에서 제외합니다.',
          '공통 `BaseLayout.astro`의 robots prop으로 태그·HTML sitemap·404는 `noindex,follow`, 대표 콘텐츠는 `index,follow`가 되도록 구분합니다.'
        ],
      },
      {
        heading: '배포 후 확인 순서',
        body: [
          '대표 URL에서 `/robots.txt`, `/sitemap.xml`, 대표 글의 robots meta를 차례로 확인합니다. 태그와 HTML sitemap이 XML sitemap에 들어가지 않는지도 build output에서 확인합니다.',
          'robots.txt로 noindex 페이지를 동시에 막으면 crawler가 noindex 지시를 읽지 못할 수 있으므로 두 역할을 혼동하지 않습니다.'
        ],
      },
    ],
  },
  {
    title: '개인정보처리방침을 작성할 때 실제로 확인할 항목',
    slug: 'privacy-policy-practical-checklist',
    description: '분석 도구, 광고, 문의 수단, 쿠키 사용 여부를 실제 운영 방식에 맞춰 정리해야 합니다.',
    category: '운영 기준',
    date: '2026-06-08',
    readingTime: '6분',
    hero: '정책 문서는 있어 보이기 위한 장식이 아니라 실제 운영 방식을 설명하는 문서입니다.',
    sections: [
      {
        heading: '수집하는 정보 확인',
        body: [
          '사이트가 방문자의 이름, 이메일, 문의 내용을 받는다면 어떤 경로로 수집하는지 적어야 합니다. 단순 이메일 문의만 받는 경우에도 사용자가 자발적으로 보낸 정보가 처리될 수 있습니다.',
          'Google Analytics나 AdSense를 사용할 예정이라면 쿠키와 광고 식별자에 대한 설명이 필요합니다. 아직 쓰지 않는 도구는 “향후 사용할 수 있음”처럼 모호하게 쓰기보다 실제 적용 시 정책을 갱신하는 편이 낫습니다.'
        ],
      },
      {
        heading: '보관과 삭제 기준',
        body: [
          '문의 이메일은 답변과 분쟁 대응을 위해 일정 기간 보관할 수 있습니다. 정책에는 보관 목적과 삭제 요청 방법을 간단히 적어두는 것이 좋습니다.',
          '개인 사이트라도 개인정보를 받는 순간 관리 책임이 생깁니다. 수집하지 않아도 되는 정보는 처음부터 받지 않는 것이 가장 안전합니다.'
        ],
      },
      {
        heading: '외부 서비스 고지',
        body: [
          '정적 사이트는 보통 GitHub Pages, Google Search Console, Google AdSense, 분석 도구 같은 외부 서비스를 함께 사용합니다. 이들이 쿠키나 접속 로그를 처리할 수 있음을 방문자에게 알려야 합니다.',
          '정책 문서는 법률 문서이므로 중요한 서비스가 추가되거나 문의 방식이 바뀌면 함께 갱신해야 합니다.'
        ],
      },
    ],
  },
  {
    title: '404 페이지가 필요한 이유와 좋은 구성',
    slug: 'why-custom-404-page-matters',
    description: '없는 주소로 들어온 방문자를 글 목록이나 홈으로 안내하면 이탈을 줄이고 사이트 완성도를 높일 수 있습니다.',
    category: '사이트 제작',
    date: '2026-06-08',
    readingTime: '4분',
    hero: '404 페이지는 오류 화면이지만 사이트가 잘 관리되고 있는지 보여주는 작은 접점입니다.',
    sections: [
      {
        heading: '방문자는 실수로 들어올 수 있다',
        body: [
          '주소를 직접 입력하다가 오타가 나거나, 예전 글 주소가 바뀌거나, 외부 사이트에 잘못된 링크가 걸려 있으면 방문자는 404 페이지를 보게 됩니다.',
          '기본 브라우저 오류 화면 대신 사이트 안의 404 페이지를 제공하면 방문자가 홈이나 글 목록으로 이동할 수 있습니다.'
        ],
      },
      {
        heading: '광고 심사 관점의 완성도',
        body: [
          'AdSense 심사는 특정 한 페이지가 아니라 사이트 전체의 품질과 접근성을 함께 봅니다. 깨진 링크와 기본 오류 화면이 많으면 사이트가 미완성처럼 보일 수 있습니다.',
          '404 페이지에는 과한 장식보다 간단한 안내, 홈 링크, 주요 글 목록 링크가 있으면 충분합니다.'
        ],
      },
    ],
  },
  {
    title: '첫 배포 후 확인해야 할 체크리스트',
    slug: 'after-first-deploy-checklist',
    description: 'Cloudflare Pages 정적 배포 뒤 production URL, HTTP 상태, canonical, 대표 페이지, robots, sitemap, ads.txt와 내부 링크를 확인하는 QA 순서입니다.',
    category: '배포와 점검',
    date: '2026-06-08',
    updatedAt: '2026-09-14',
    readingTime: '6분',
    hero: '배포 버튼을 누른 순간 사이트 제작이 끝나는 것이 아니라 공개 점검이 시작됩니다.',
    sections: [
      {
        heading: 'Production URL과 응답 확인',
        body: [
          '대표 도메인으로 접속했을 때 HTTPS가 적용되는지 확인합니다. `http://`로 접속해도 `https://`로 이동하는지, www 주소와 루트 도메인이 의도한 방식으로 연결되는지도 봐야 합니다.',
          '`curl -I https://emfls.com`과 `curl -I http://emfls.com`으로 status와 redirect를 확인합니다. 실제 DNS·인증서 결과는 명령 실행 결과로만 판단합니다.'
        ],
      },
      {
        heading: '대표 페이지와 공개 파일 확인',
        body: [
          '홈, 글 목록, 대표 글, About, Privacy를 `https://emfls.com` 기준으로 열고 BaseLayout의 canonical을 확인합니다.',
          '`/robots.txt`, `/sitemap.xml`, `/ads.txt`가 공개되는지 확인하고, 404 route와 푸터·관련 글 내부 링크도 점검합니다.'
        ],
      },
      {
        heading: '빌드 결과와 색인 정책 확인',
        body: [
          '`npm run build`가 성공하고 `dist/`에 실제 페이지가 생성되는지 확인합니다. 이 프로젝트의 tag/archive 등 유틸리티 페이지는 noindex 정책 대상입니다.',
          '대표 canonical 페이지와 redirect source를 구분하고, 배포 후 점검은 AdSense 신청 절차나 Search Console 등록 절차와 섞지 않습니다.'
        ],
      },
    ],
  },
  {
    title: '애드센스 심사 전에 피해야 할 미완성 신호',
    slug: 'unfinished-site-signals-before-adsense',
    description: '빈 카테고리, 짧은 글, 임시 문구, 깨진 링크는 심사 전에 반드시 제거해야 합니다.',
    category: '운영 기준',
    date: '2026-06-08',
    readingTime: '5분',
    hero: '심사 전 사이트는 완벽하지 않아도 되지만 방문자가 읽고 이동할 수 있는 완성된 상태여야 합니다.',
    sections: [
      {
        heading: '빈 페이지와 공사중 문구',
        body: [
          '임시 문구와 테스트용 안내가 남아 있으면 사이트가 아직 공개할 준비가 되지 않은 것처럼 보입니다. 심사 전에 이런 페이지는 숨기거나 실제 콘텐츠로 채워야 합니다.',
          '카테고리 메뉴를 만들었다면 각 카테고리에 글이 있어야 합니다. 빈 카테고리는 메뉴에서 빼고 나중에 글이 쌓였을 때 추가하는 편이 좋습니다.'
        ],
      },
      {
        heading: '짧고 비슷한 글',
        body: [
          '글 수를 채우기 위해 비슷한 내용을 제목만 바꿔 여러 개로 나누는 것은 좋지 않습니다. 각 글은 독립적인 질문에 답하고, 구체적인 예시나 체크리스트를 포함해야 합니다.',
          '검색 방문자는 한 페이지에서 문제 해결의 실마리를 얻고 싶어 합니다. 내용이 너무 짧으면 바로 이탈하고, 사이트의 신뢰도도 낮아집니다.'
        ],
      },
      {
        heading: '정책 페이지의 실제성',
        body: [
          '개인정보처리방침이나 문의 페이지가 템플릿 문구 그대로라면 신뢰를 주기 어렵습니다. 사이트 운영 방식, 연락처, 사용하는 외부 서비스에 맞게 문구를 조정해야 합니다.',
          'AdSense 심사 전에는 광고 코드만 넣는 것보다 사이트가 독자에게 어떤 가치를 주는지 먼저 완성하는 것이 중요합니다.'
        ],
      },
    ],
  },
  {
    title: 'emfls.com Cloudflare DNS 설정 후 확인하는 순서',
    slug: 'cloudflare-dns-setup-for-beginners',
    description: '개인 도메인을 Cloudflare DNS와 Pages에 연결한 뒤 nameserver, record, HTTPS와 대표 주소를 검증하는 순서입니다.',
    category: '도메인과 DNS',
    date: '2026-06-09',
    updatedAt: '2026-09-14',
    readingTime: '8분',
    hero: 'DNS 문제는 값을 많이 바꾸는 것보다 현재 권한 있는 DNS와 실제 응답을 분리해 확인하는 데서 시작합니다.',
    sections: [
      {
        heading: '1. 변경 전에 권한을 확인한다',
        body: [
          '가비아는 도메인 등록기관이고 Cloudflare는 이 구성에서 DNS를 관리하는 제공자입니다. 현재 nameserver가 어느 제공자를 가리키는지 먼저 확인합니다.',
          '저장소에는 emfls.com의 실제 A/CNAME 값이 기록되어 있지 않으므로 특정 record 값을 사실처럼 제시하지 않습니다.',
        ],
      },
      {
        heading: '2. Pages custom domain을 연결한다',
        body: [
          'Cloudflare Pages의 Custom domains에서 `emfls.com`을 추가한 뒤 연결 상태를 확인합니다. 저장소의 대표 canonical은 `https://emfls.com`입니다.',
          '이전 GitHub Pages용 record가 남아 있다면 현재 Pages 연결과 충돌하는지 확인합니다. 계정 상태와 실제 DNS 값은 저장소만으로 확정할 수 없습니다.',
        ],
      },
      {
        heading: '3. 실제 응답을 비교한다',
        body: [
          '브라우저에서 `https://emfls.com`과 필요하다면 `https://www.emfls.com`을 열어 대표 주소 동작을 확인합니다.',
          '터미널에서는 `dig emfls.com`과 `dig www.emfls.com`으로 DNS 응답을 확인할 수 있습니다. 이 명령은 DNS를 변경하지 않습니다.',
        ],
      },
      {
        heading: '4. HTTPS와 배포 결과를 확인한다',
        body: [
          'Cloudflare Pages 배포가 성공한 뒤 `https://emfls.com`, `/robots.txt`, `/ads.txt`, `/sitemap.xml`을 확인합니다. 저장소의 Phase 2B build 결과는 51페이지였습니다.',
          '문제가 남으면 nameserver, DNS record, Pages custom domain, 인증서, 최신 배포를 순서대로 분리해 확인합니다.',
        ],
      },
    ],
  },
  {
    title: 'emfls.com을 Google Search Console에 등록하는 절차',
    slug: 'google-search-console-domain-property-guide',
    description: 'Domain property를 DNS로 확인한 뒤 sitemap 제출과 URL Inspection까지 이어가는 emfls.com 등록 절차입니다.',
    category: '검색·SEO',
    date: '2026-06-09',
    updatedAt: '2026-09-14',
    readingTime: '8분',
    hero: 'Search Console 등록은 소유권 확인, 사이트맵 제출, 개별 URL 점검을 분리해 진행해야 합니다.',
    sections: [
      {
        heading: '1. 속성 유형을 고른다',
        body: [
          'Domain property는 `emfls.com`처럼 protocol과 path 없이 입력하며 http/https와 하위 도메인을 포함합니다. URL-prefix property는 `https://emfls.com/`처럼 protocol을 포함하고 그 prefix에 해당하는 URL만 다룹니다.',
          '이 프로젝트의 대표 주소는 `https://emfls.com`이고 Cloudflare를 DNS provider로 사용하므로 전체 도메인 범위를 보려면 Domain property가 자연스럽습니다. 실제 계정 속성은 저장소에 없습니다.',
        ],
      },
      {
        heading: '2. DNS로 소유권을 확인한다',
        body: [
          'Search Console이 제공한 TXT verification record를 Cloudflare DNS의 권한 있는 zone에 추가한 뒤 Verify를 누릅니다. token은 계정마다 다르므로 실제 값을 이 글이나 저장소에 적지 않습니다. 예시는 `google-site-verification=예시값`처럼 구분합니다.',
          '소유권 확인 완료는 Google에 사이트를 관리할 권한을 증명한 상태이지 모든 페이지의 색인을 의미하지 않습니다.',
        ],
      },
      {
        heading: '3. sitemap과 URL을 따로 점검한다',
        body: [
          '이 저장소의 XML sitemap URL은 `https://emfls.com/sitemap.xml`입니다. 사람이 읽는 `/site-map/`과 구분해 Search Console에 제출합니다. sitemap은 URL 발견을 돕지만 색인을 보장하지 않습니다.',
          '그 다음 URL Inspection에서 홈, 글 목록, 대표 글의 실제 URL과 canonical, 접근 가능 여부를 확인합니다. 저장소에는 실제 계정의 색인 상태나 마지막 crawl 날짜가 없습니다.',
        ],
      },
      {
        heading: '4. 결과를 다르게 해석한다',
        body: [
          '소유권 확인, sitemap 처리, 개별 URL 색인은 서로 다른 상태입니다. 하나가 완료되었다고 나머지가 자동 완료되었다고 판단하지 않습니다.',
          '현재 프로젝트에서는 `robots.txt`가 공개 크롤링을 허용하고 대표 페이지 canonical은 `https://emfls.com`을 기준으로 합니다. 최종 판단은 실제 Search Console 계정 화면에서 합니다.',
        ],
      },
    ],
  },
  {
    title: 'AdSense 심사 전 최종 체크리스트: emfls.com에서 확인한 항목',
    slug: 'adsense-review-final-checklist',
    description: 'emfls.com 저장소에서 확인한 공개 상태, 콘텐츠 구조, 크롤링, AdSense 연결과 신뢰 페이지 점검 항목입니다.',
    category: '운영 기준',
    date: '2026-06-09',
    updatedAt: '2026-09-14',
    readingTime: '9분',
    hero: '심사 요청 전에는 광고 코드보다 사이트 전체가 공개 상태이고 독자가 운영자와 콘텐츠 목적을 이해할 수 있는지 확인합니다.',
    sections: [
      {
        heading: '현재 프로젝트의 공개 상태',
        body: [
          '현재 저장소는 Astro 정적 출력이며 `astro.config.mjs`의 site 값은 `https://emfls.com`입니다. 소스는 GitHub에서 관리하고 실제 서비스 배포는 Cloudflare Pages를 사용합니다.',
          'Phase 1에서는 공개 글의 스크린샷 플레이스홀더를 제거하고 Privacy를 실제 운영환경에 맞췄으며 `public/ads.txt`를 추가했습니다. Phase 2B에서는 대표 글 12개와 5개 클러스터를 구성했습니다.',
        ],
      },
      {
        heading: '심사 전에 확인할 증거',
        body: [
          'About에는 운영 목적·작성자 역할·문의 주소가 있고 Contact에는 `contact@emfls.com`이 있습니다. Privacy, Terms, Editorial Policy, Disclaimer, Content Methodology는 푸터에서 접근할 수 있습니다.',
          '실제 공개 도메인에서 홈·글 목록·대표 글·정책 링크를 열고 임시 페이지나 잘못된 주소가 남아 있지 않은지 확인합니다. 이메일 수신 여부는 저장소만으로 확정할 수 없습니다.',
        ],
      },
      {
        heading: '콘텐츠와 색인 구조',
        body: [
          '현재 18개 글은 Phase 2B에서 고유 검색 의도 중심의 대표 12개로 압축했고, 6개 기존 article URL은 `public/_redirects`에서 대표 URL로 연결했습니다. 태그 archive는 `noindex,follow`입니다.',
          'XML sitemap은 대표 canonical 페이지 중심으로 생성되며 HTML sitemap과 404는 noindex입니다. 대표 글의 고유한 설명과 실제 운영 근거는 별도로 읽어야 합니다.',
        ],
      },
      {
        heading: '요청 직전 점검 순서',
        body: [
          '1) 대표 도메인 접속, 2) 홈에서 글·정책 이동, 3) 대표 글의 title·description·canonical 확인, 4) robots와 sitemap 확인, 5) ads.txt와 공통 head의 AdSense 코드 확인, 6) redirect 대상 URL 확인 순서로 점검합니다.',
          'Google은 고유하고 관련성 있는 콘텐츠, 명확한 탐색, 정책 준수와 접근 가능한 사이트를 준비 요소로 안내합니다. 이 목록은 승인 보장이나 공식 글자 수 기준이 아닙니다.',
        ],
      },
    ],
  },
  {
    title: 'GitHub 저장소에서 Cloudflare Pages로 emfls.com을 배포하는 방법',
    slug: 'github-to-cloudflare-pages-deployment',
    description: 'GitHub의 Astro 소스를 Cloudflare Pages에 연결하고 npm run build와 dist/ 결과를 emfls.com에 배포하는 흐름입니다.',
    category: 'GitHub Pages',
    date: '2026-06-09',
    updatedAt: '2026-09-14',
    readingTime: '8분',
    hero: 'GitHub는 소스를 관리하고 Astro는 빌드하며 Cloudflare Pages가 정적 결과를 emfls.com에 배포합니다.',
    sections: [
      {
        heading: 'GitHub 저장소와 Astro 프로젝트 확인',
        body: [
          '이 저장소는 Astro 프로젝트이며 `package.json`에 공식 production build 명령으로 `npm run build`가 정의되어 있습니다. 소스와 버전 이력은 GitHub repository에서 관리합니다.',
          '빌드 결과는 `astro.config.mjs`의 static 설정에 따라 `dist/`에 생성됩니다. Cloudflare Pages에 연결하기 전에 저장소에서 이 명령과 출력 경로를 먼저 확인합니다.',
        ],
      },
      {
        heading: 'Cloudflare Pages 연결 흐름',
        body: [
          '공식 연결 흐름은 Cloudflare Pages에서 GitHub repository를 선택하고 production branch, build command, output directory를 지정한 뒤 배포하는 방식입니다. 이 프로젝트의 값은 production branch는 실제 연결 설정을 저장소에서 확인할 수 없으므로 단정하지 않고, build command는 `npm run build`, output directory는 `dist/`입니다.',
          '배포가 완료되면 Cloudflare Pages의 custom domain 기능에서 `emfls.com`을 연결합니다. Dashboard의 실제 상태나 branch 값은 저장소 파일만으로 확인할 수 없습니다.',
        ],
      },
      {
        heading: 'GitHub Pages와 역할 구분',
        body: [
          '현재 emfls.com의 구조에서 GitHub는 source와 version management, Astro는 static site build, Cloudflare Pages는 production hosting/deployment를 담당합니다. GitHub Pages hosting을 사용한다고 해석하면 안 됩니다.',
          '배포 후 실제 동작 검증은 별도 QA 절차입니다. 상세 확인 항목은 [첫 production 배포 후 점검 글](/articles/after-first-deploy-checklist/)에서 다룹니다.',
        ],
      },
      {
        heading: '배포 전후의 최소 확인',
        body: [
          '먼저 로컬 또는 CI에서 `npm run build`가 성공하고 `dist/`가 생성되는지 확인합니다. 이후 Cloudflare Pages 배포 결과와 `https://emfls.com` 접근을 별도로 확인합니다.',
          '이 글은 pipeline 연결을 설명하며, DNS nameserver와 상세 production QA는 각각 관련 글로 분리합니다.',
        ],
      },
    ],
  },
  {
    title: 'Cloudflare Pages 개인 도메인의 HTTPS를 진단하는 순서',
    slug: 'how-to-check-https-on-custom-domain',
    description: 'Cloudflare Pages에 연결한 emfls.com을 DNS, 인증서, HTTP redirect, canonical 순서로 확인하는 진단 가이드입니다.',
    category: 'HTTPS·사이트 운영',
    date: '2026-06-09',
    updatedAt: '2026-09-14',
    readingTime: '7분',
    hero: '사이트가 열려도 HTTPS가 올바른지는 DNS, 인증서, redirect, canonical을 나누어 확인해야 합니다.',
    sections: [
      {
        heading: '증상부터 분리하기',
        body: [
          '`https://emfls.com`이 열리는 것과 HTTP 요청이 HTTPS로 이동하는 것은 별도 결과입니다. `curl -I https://emfls.com`과 `curl -I http://emfls.com`으로 response header를 확인할 수 있습니다.',
          '이 저장소에서 확인된 대표 canonical은 `https://emfls.com`입니다. `www`의 실제 redirect 상태와 인증서 상태는 저장소에 기록되어 있지 않으므로 라이브 응답으로 확인해야 합니다.',
        ],
      },
      {
        heading: 'DNS와 Pages custom domain',
        body: [
          'Cloudflare 공식 절차에서 Pages 프로젝트의 Custom domains에 도메인을 추가하고, apex domain은 Cloudflare zone과 nameserver 설정을 함께 확인합니다. 이 프로젝트의 실제 record 값은 저장소에 없습니다.',
          'DNS record를 추가하는 것과 Pages 프로젝트의 Custom domains에 hostname을 등록하는 것은 별도 단계입니다. 공식 문서도 dashboard에서 custom domain을 먼저 연결하는 절차를 안내하므로, record만 만든 상태를 Pages 연결 완료로 보지 않습니다.',
          'DNS가 다른 대상으로 향하면 Pages가 정상이어도 도메인 접속이 실패할 수 있습니다. 먼저 DNS 응답과 Pages custom domain 상태를 따로 확인합니다. `example.com`과 `www.example.com`은 서로 다른 hostname이므로 한쪽만 설정하고 양쪽이 모두 동작한다고 가정하지 않습니다.',
        ],
      },
      {
        heading: '문제 유형별로 확인 위치를 나눈다',
        body: [
          '`pages.dev` 주소는 열리지만 custom domain만 열리지 않으면 Pages의 Custom domains 등록 상태, 해당 hostname의 DNS record, 기존 충돌 record와 redirect를 먼저 확인합니다. custom domain은 열리지만 HTTPS 경고가 있으면 DNS와 별도로 certificate·SSL/TLS 상태를 확인합니다.',
          'Cloudflare Pages build 자체가 실패한 경우에는 domain 설정이 아니라 deployment의 build log와 build configuration을 확인해야 합니다. 이 프로젝트의 build 진단은 [Cloudflare Pages 배포 실패 원인별 점검표](/articles/cloudflare-pages-build-failure/)에서 분리해 다룹니다.',
          '정상 배포 뒤 production URL과 내부 페이지를 확인하는 순서는 [첫 배포 후 확인해야 할 체크리스트](/articles/after-first-deploy-checklist/)에서 이어서 확인합니다.',
        ],
      },
      {
        heading: '인증서와 redirect',
        body: [
          'Cloudflare Pages custom domain 상태와 SSL/TLS 인증서 발급 상태를 확인한 뒤 HTTP가 HTTPS로 이동하는지 봅니다. 인증서 발급과 redirect 정책은 같은 검사가 아닙니다.',
          'HTTPS 응답이 정상이면 HTML의 canonical이 `https://emfls.com`을 가리키는지 확인합니다. HTTPS는 AdSense 승인을 보장하는 장치가 아니라 정상 접근성과 주소 일관성을 위한 기반입니다.',
        ],
      },
      {
        heading: '진단 순서',
        body: [
          '① 요청한 hostname(apex 또는 www), ② Pages Custom domains 등록, ③ nameserver와 DNS record, ④ 기존 record·redirect 충돌, ⑤ 인증서 상태, ⑥ HTTP→HTTPS response, ⑦ canonical, ⑧ 브라우저와 `curl` 결과 순서로 좁혀갑니다.',
          '이 순서는 DNS를 변경하지 않는 읽기 전용 점검입니다. 한 단계에서 문제가 확인되면 다음 값을 임의로 바꾸기 전에 결과를 기록합니다.',
        ],
      },
    ],
  },
  {
    title: '가비아 도메인을 Cloudflare DNS에 연결하는 흐름',
    slug: 'gabia-domain-cloudflare-dns',
    description: '가비아에서 구매한 emfls.com 도메인을 Cloudflare DNS와 Pages custom domain으로 연결하는 nameserver 중심 절차입니다.',
    category: '도메인·DNS',
    date: '2026-06-09',
    updatedAt: '2026-09-14',
    readingTime: '7분',
    hero: '등록기관, 권한 있는 DNS, Pages custom domain은 서로 다른 역할을 순서대로 연결해야 합니다.',
    sections: [
      { heading: '가비아와 Cloudflare의 역할', body: [
        '가비아는 emfls.com을 구매하고 유지하는 domain registrar입니다. Cloudflare는 이 운영 구조에서 authoritative DNS와 Pages custom domain을 담당합니다.',
        'GitHub는 source repository, Astro는 site generator입니다. 따라서 가비아에서 구매한 도메인이 GitHub Pages에서 직접 호스팅된다고 설명하지 않습니다.',
      ] },
      { heading: 'nameserver를 연결하는 순서', body: [
        'Cloudflare에서 해당 zone에 할당한 nameserver를 확인한 뒤, 가비아 등록기관 화면에서 기존 nameserver를 Cloudflare가 안내한 값으로 변경합니다. 실제 emfls.com nameserver 값은 저장소에 없으므로 이 글에 적지 않습니다.',
        '변경 후에는 Cloudflare에서 zone 활성 상태를 확인하고, Pages custom domain에 `emfls.com`을 연결합니다. 이 과정은 개별 A/CNAME 값을 나열하는 작업과 구분해야 합니다.',
      ] },
      { heading: 'Cloudflare DNS와 Pages 연결', body: [
        'nameserver가 Cloudflare를 가리키면 이후 DNS 기준은 가비아의 개별 레코드 화면이 아니라 Cloudflare DNS zone입니다. Pages custom domain 연결은 그 다음 단계입니다.',
        '현재 사이트의 대표 주소는 `https://emfls.com`이며 실제 record 값과 Dashboard 상태는 저장소만으로 확정할 수 없습니다. 상세 record 확인은 Cloudflare DNS 점검 글로 분리합니다.',
      ] },
      { heading: '연결 후 확인할 경계', body: [
        '등록기관 변경, nameserver 전파, Cloudflare zone 활성화, Pages custom domain 연결은 서로 다른 상태입니다. 한 단계가 완료되었다고 다음 단계까지 완료되었다고 가정하지 않습니다.',
        '최종 production URL과 HTTPS·redirect 검증은 [Cloudflare Pages 개인 도메인의 HTTPS 진단 글](/articles/how-to-check-https-on-custom-domain/)에서 확인합니다.',
      ] },
    ],
  },
  {
    title: 'GitHub Pages와 워드프레스 중 무엇을 선택할까',
    slug: 'github-pages-vs-wordpress-for-beginners',
    description: '초보자가 개인 정보 사이트를 만들 때 GitHub Pages와 WordPress의 장단점을 운영 관점에서 비교합니다.',
    category: '사이트 제작',
    date: '2026-06-09',
    readingTime: '8분',
    hero: '도구 선택은 유행보다 운영 방식, 글 관리, 비용, 필요한 기능을 기준으로 판단해야 합니다.',
    sections: [
      {
        heading: 'GitHub Pages가 맞는 경우',
        body: [
          '글과 문서 중심의 정적 사이트라면 GitHub Pages나 Cloudflare Pages가 잘 맞습니다. 서버 관리가 필요 없고, 코드와 글 변경 이력이 Git으로 남으며, 정적 HTML이라 속도와 안정성이 좋습니다.',
          '다만 마크다운이나 코드 기반 작업이 익숙하지 않다면 처음 진입 장벽이 있습니다. 관리자 화면에서 글을 쓰는 방식이 아니라 파일을 수정하고 배포하는 흐름을 이해해야 합니다.',
        ],
      },
      {
        heading: 'WordPress가 맞는 경우',
        body: [
          '관리자 화면에서 글을 쓰고, 테마와 플러그인을 활용하고, 댓글·회원·검색 같은 기능을 쉽게 붙이고 싶다면 WordPress가 편합니다. 비개발자에게는 글 작성 경험이 더 직관적일 수 있습니다.',
          '대신 호스팅, 보안 업데이트, 플러그인 충돌, 성능 최적화 같은 운영 부담이 생깁니다. 애드센스 심사만을 위해 급하게 만든 WordPress 사이트도 콘텐츠가 얕으면 승인에 유리하지 않습니다.',
        ],
      },
      {
        heading: 'AdSense 관점의 비교',
        body: [
          'AdSense는 어떤 도구를 썼는지보다 사이트의 콘텐츠 품질, 정책 준수, 탐색 가능성, 신뢰 페이지를 봅니다. GitHub Pages든 WordPress든 얇은 글과 빈 카테고리가 많으면 낮은 가치 콘텐츠로 보일 수 있습니다.',
          '정적 사이트는 빠르고 깔끔하지만, 직접 신뢰 페이지와 내부 링크를 구성해야 합니다. WordPress는 구조를 빠르게 만들 수 있지만 기본 테마와 플러그인만으로 품질이 보장되지는 않습니다.',
        ],
      },
      {
        heading: '초기 선택 기준',
        body: [
          '개인 도메인, DNS, 정적 사이트 운영을 배우는 것이 목표라면 GitHub Pages나 Cloudflare Pages가 좋은 학습 경로입니다. 글쓰기와 운영 편의성이 더 중요하고 기술 설정을 줄이고 싶다면 WordPress가 현실적일 수 있습니다.',
          '한 번 선택한 도구를 영원히 써야 하는 것은 아닙니다. 초기에는 콘텐츠를 작고 단단하게 만들고, 방문자와 운영 요구가 늘어나면 이전을 검토해도 됩니다.',
        ],
      },
    ],
  },
];

const representativeSlugs = new Set([
  'site-migration-ranking-drop',
  'cloudflare-pages-build-failure',
  'search-console-discovered-not-indexed',
  'static-website-running-cost',
  'personal-domain-website-start-checklist',
  'gabia-domain-cloudflare-dns',
  'why-astro-for-static-content-site',
  'adsense-review-essential-pages',
  'robots-and-sitemap-basics',
  'after-first-deploy-checklist',
  'cloudflare-dns-setup-for-beginners',
  'google-search-console-domain-property-guide',
  'adsense-review-final-checklist',
  'github-to-cloudflare-pages-deployment',
  'how-to-check-https-on-custom-domain',
]);

export const articles = sourceArticles.filter((article) => representativeSlugs.has(article.slug));

export const categoryMeta: Record<string, { slug: string; description: string }> = {
  '도메인·DNS': { slug: 'domains-dns', description: '개인 도메인과 DNS를 실제 사이트에 연결하고 문제를 해결하는 방법입니다.' },
  'Cloudflare·배포': { slug: 'cloudflare-deployment', description: 'GitHub 저장소에서 Cloudflare Pages로 정적 사이트를 배포하는 흐름입니다.' },
  'HTTPS·사이트 운영': { slug: 'https-operations', description: '배포 후 HTTPS와 실제 서비스 상태를 확인하는 운영 점검입니다.' },
  '검색·SEO': { slug: 'search-seo', description: 'Search Console, sitemap, robots와 색인 상태를 확인하는 방법입니다.' },
  AdSense: { slug: 'adsense', description: 'emfls.com의 AdSense 심사 준비와 운영 품질을 점검합니다.' },
};

export const categoryList = Object.entries(categoryMeta).map(([name, meta]) => ({ name, ...meta }));

export const articleCluster: Record<string, string> = {
  'site-migration-ranking-drop': '검색·SEO',
  'static-website-running-cost': 'Cloudflare·배포',
  'cloudflare-pages-build-failure': 'Cloudflare·배포',
  'personal-domain-website-start-checklist': '도메인·DNS',
  'gabia-domain-cloudflare-dns': '도메인·DNS',
  'cloudflare-dns-setup-for-beginners': '도메인·DNS',
  'why-astro-for-static-content-site': 'Cloudflare·배포',
  'github-to-cloudflare-pages-deployment': 'Cloudflare·배포',
  'after-first-deploy-checklist': 'HTTPS·사이트 운영',
  'how-to-check-https-on-custom-domain': 'HTTPS·사이트 운영',
  'google-search-console-domain-property-guide': '검색·SEO',
  'search-console-discovered-not-indexed': '검색·SEO',
  'robots-and-sitemap-basics': '검색·SEO',
  'adsense-review-essential-pages': 'AdSense',
  'adsense-review-final-checklist': 'AdSense',
};

export function getCategoryBySlug(slug: string) {
  return categoryList.find((category) => category.slug === slug);
}

export function getArticleBySlug(slug: string) {
  return articles.find((article) => article.slug === slug);
}

const tagByCategory: Record<string, string[]> = {
  '시작 준비': ['도메인', '기획', 'AdSense'],
  'GitHub Pages': ['GitHub Pages', '정적 호스팅', '커스텀 도메인'],
  '도메인과 DNS': ['DNS', 'Cloudflare', '도메인'],
  '사이트 제작': ['Astro', '정적 사이트', 'UX'],
  '운영 기준': ['AdSense', '정책', '신뢰도'],
  SEO: ['SEO', 'Search Console', '사이트맵'],
  '배포와 점검': ['Cloudflare Pages', 'HTTPS', '배포'],
};

const tagBySlug: Record<string, string[]> = {
  'personal-domain-website-start-checklist': ['도메인', '기획', '체크리스트'],
  'github-pages-strengths-and-limits': ['GitHub Pages', '정적 호스팅', '한계'],
  'gabia-domain-cloudflare-dns': ['가비아', 'DNS', 'Cloudflare'],
  'why-astro-for-static-content-site': ['Astro', '정적 사이트', 'SEO'],
  'adsense-review-essential-pages': ['AdSense', '필수 페이지', '신뢰도'],
  'seo-friendly-title-and-url': ['SEO', 'URL', '제목'],
  'robots-and-sitemap-basics': ['robots.txt', '사이트맵', 'Search Console'],
  'privacy-policy-practical-checklist': ['개인정보처리방침', 'AdSense', '쿠키'],
  'why-custom-404-page-matters': ['404', 'UX', '정적 사이트'],
  'after-first-deploy-checklist': ['배포', 'HTTPS', 'Search Console'],
  'unfinished-site-signals-before-adsense': ['AdSense', 'Thin Content', '체크리스트'],
  'cloudflare-dns-setup-for-beginners': ['Cloudflare', 'DNS', '가비아'],
  'google-search-console-domain-property-guide': ['Search Console', '사이트맵', 'SEO'],
  'adsense-review-final-checklist': ['AdSense', '체크리스트', '정책'],
  'github-to-cloudflare-pages-deployment': ['GitHub', 'Cloudflare Pages', '배포'],
  'how-to-check-https-on-custom-domain': ['HTTPS', 'Cloudflare', '보안'],
  'github-pages-vs-wordpress-for-beginners': ['GitHub Pages', 'WordPress', '비교'],
};

const iconByCategory: Record<string, string> = {
  '도메인·DNS': 'network',
  'Cloudflare·배포': 'layout',
  'HTTPS·사이트 운영': 'rocket',
  '검색·SEO': 'search',
  AdSense: 'shield',
  '시작 준비': 'compass',
  'GitHub Pages': 'branch',
  '도메인과 DNS': 'network',
  '사이트 제작': 'layout',
  '운영 기준': 'shield',
  SEO: 'search',
  '배포와 점검': 'rocket',
};

export type ArticleMeta = Article & {
  summary: string;
  publishedAt: string;
  updatedAt: string;
  readingTimeMinutes: number;
  authorName: string;
  tags: string[];
  heroImage: string;
  icon: string;
  series: string;
};

export function getReadingTimeMinutes(readingTime: string) {
  const parsed = Number.parseInt(readingTime, 10);
  return Number.isFinite(parsed) ? parsed : 5;
}

export function getArticleMeta(article: Article): ArticleMeta {
  return {
    ...article,
    category: articleCluster[article.slug] ?? article.category,
    summary: article.summary ?? article.description,
    publishedAt: article.date,
    updatedAt: article.updatedAt ?? article.date,
    readingTimeMinutes: article.readingTimeMinutes ?? getReadingTimeMinutes(article.readingTime),
    authorName: article.authorName ?? 'EMFLS 운영자',
    tags: article.tags ?? tagBySlug[article.slug] ?? tagByCategory[article.category] ?? [],
    heroImage: article.heroImage ?? '',
    icon: iconByCategory[articleCluster[article.slug] ?? article.category] ?? 'document',
    series: article.series ?? articleCluster[article.slug] ?? article.category,
  };
}

export const articleMetas = articles.map(getArticleMeta);

export const tagList = Array.from(new Set(articleMetas.flatMap((article) => article.tags))).sort((a, b) =>
  a.localeCompare(b, 'ko'),
);

export function slugifyTag(tag: string) {
  return tag.toLowerCase().trim().replace(/\s+/g, '-');
}

export function getTagBySlug(slug: string) {
  return tagList.find((tag) => slugifyTag(tag) === slug);
}
