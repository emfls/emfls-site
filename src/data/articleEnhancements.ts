export type ArticleEnhancement = {
  example: {
    title: string;
    paragraphs: string[];
  };
  screenshot: {
    title: string;
    caption: string;
  };
  checklist: string[];
  mistakes: string[];
  faqs: {
    question: string;
    answer: string;
  }[];
  sources: {
    name: string;
    url: string;
  }[];
};

const defaultSources = [
  { name: 'Google Search Central documentation', url: 'https://developers.google.com/search/docs' },
  { name: 'Google AdSense Help', url: 'https://support.google.com/adsense/' },
];

export const articleEnhancements: Record<string, ArticleEnhancement> = {
  'personal-domain-website-start-checklist': {
    example: {
      title: 'emfls.com을 기준으로 본 시작 순서',
      paragraphs: [
        '이 사이트는 먼저 대표 도메인을 `emfls.com`으로 정하고, GitHub 저장소 이름과 Cloudflare Pages 프로젝트 이름을 `emfls-site`로 맞췄습니다. 이렇게 이름을 맞춰두면 Search Console, AdSense, 사이트맵, 배포 로그를 확인할 때 어떤 프로젝트를 보고 있는지 헷갈릴 가능성이 줄어듭니다.',
        '처음부터 글 주제를 넓게 잡지 않고 개인 도메인, DNS, 정적 사이트 배포, 검색 등록으로 좁힌 것도 같은 이유입니다. 심사 전에는 빈 카테고리를 늘리는 것보다 서로 연결되는 글을 충분히 채우는 편이 더 안정적입니다.',
      ],
    },
    screenshot: {
      title: '준비할 스크린샷',
      caption: '도메인, 배포 프로젝트, Search Console 속성, AdSense 등록 주소가 모두 같은 대표 도메인을 기준으로 맞춰진 화면을 캡처하면 추후 점검에 도움이 됩니다.',
    },
    checklist: [
      '대표 도메인을 `루트 도메인` 또는 `www` 중 하나로 정한다.',
      '사이트 주제를 한 문장으로 설명할 수 있는지 확인한다.',
      '심사 전에 빈 카테고리와 테스트 페이지가 남아 있지 않게 한다.',
      '문의, 개인정보처리방침, 편집 정책 같은 신뢰 페이지를 먼저 만든다.',
    ],
    mistakes: [
      '도메인을 산 직후 글 없이 AdSense부터 신청하는 것.',
      '대표 도메인을 정하지 않고 `www`, 루트 도메인, 임시 배포 주소를 섞어 쓰는 것.',
      '카테고리를 많이 만들고 실제 글은 1~2개만 넣는 것.',
    ],
    faqs: [
      {
        question: '도메인을 먼저 사야 하나요, 사이트를 먼저 만들어야 하나요?',
        answer: '가능하면 사이트 주제와 대표 주소 정책을 먼저 정한 뒤 도메인을 연결하는 편이 좋습니다. 이미 도메인을 샀다면 대표 도메인, 사이트명, 카테고리를 먼저 고정하세요.',
      },
      {
        question: '초기 글은 몇 개 정도가 적당한가요?',
        answer: '정답은 없지만 얇은 글 30개보다 완성도 있는 글 10~15개가 낫습니다. 각 글은 독립적인 질문에 답하고 내부 링크로 이어져야 합니다.',
      },
      {
        question: '사이트 주제를 나중에 바꿔도 되나요?',
        answer: '가능하지만 심사 직전에는 큰 변경을 피하는 것이 좋습니다. 검색 엔진과 AdSense가 사이트의 목적을 파악할 시간을 주는 편이 안전합니다.',
      },
    ],
    sources: [
      { name: 'AdSense eligibility requirements', url: 'https://support.google.com/adsense/answer/9724' },
      { name: 'Make sure your site is ready for AdSense', url: 'https://support.google.com/adsense/answer/7299563' },
    ],
  },
  'github-pages-strengths-and-limits': {
    example: {
      title: 'GitHub Pages를 쓸 때와 Cloudflare Pages로 옮길 때',
      paragraphs: [
        'GitHub Pages는 저장소에서 바로 정적 사이트를 공개하기 쉽다는 장점이 있습니다. 다만 도메인과 DNS까지 한 번에 관리하려면 Cloudflare Pages가 더 편한 경우도 있습니다. 이 사이트도 코드는 GitHub에 두고, 실제 배포와 도메인 연결은 Cloudflare Pages로 처리했습니다.',
        '핵심은 둘 중 하나가 무조건 좋다는 결론이 아니라, 사이트 목적에 맞춰 역할을 나누는 것입니다. GitHub는 코드 이력과 협업에 강하고, Cloudflare는 도메인, DNS, CDN, HTTPS 관리가 한 화면에 모인다는 장점이 있습니다.',
      ],
    },
    screenshot: {
      title: '준비할 스크린샷',
      caption: 'GitHub 저장소 화면, Pages 배포 로그, Cloudflare Pages 배포 로그를 나란히 비교하면 각 서비스의 역할 차이를 설명하기 좋습니다.',
    },
    checklist: [
      '서버 기능이 필요한지 먼저 확인한다.',
      '정적 HTML만 있으면 충분한지 판단한다.',
      '문의 폼, 댓글, 검색 기능은 외부 서비스가 필요한지 검토한다.',
      '배포 후 HTTPS와 커스텀 도메인 상태를 확인한다.',
    ],
    mistakes: [
      'GitHub Pages에서 서버 코드를 실행할 수 있다고 오해하는 것.',
      '빌드 결과물 경로를 잘못 지정해 빈 페이지를 배포하는 것.',
      '도메인 설정과 저장소 설정을 동시에 여러 번 바꾸는 것.',
    ],
    faqs: [
      {
        question: 'GitHub Pages만으로 AdSense 심사가 가능한가요?',
        answer: '가능합니다. 다만 도메인, 콘텐츠 품질, 필수 페이지, 정책 준수가 더 중요합니다. 호스팅 자체보다 사이트 완성도가 심사에 더 큰 영향을 줍니다.',
      },
      {
        question: 'Cloudflare Pages로 바꾸면 GitHub가 필요 없나요?',
        answer: '아닙니다. GitHub는 코드 저장소로 계속 쓰고, Cloudflare Pages가 저장소를 읽어 자동 배포하는 방식으로 함께 사용할 수 있습니다.',
      },
      {
        question: '동적 기능이 필요하면 어떻게 해야 하나요?',
        answer: '정적 사이트에서는 외부 폼, 댓글 서비스, 검색 서비스, 서버리스 함수를 조합해야 합니다. 처음에는 기능을 줄이고 콘텐츠 완성도를 먼저 확보하는 편이 좋습니다.',
      },
    ],
    sources: [
      { name: 'GitHub Pages documentation', url: 'https://docs.github.com/pages' },
      { name: 'Cloudflare Pages documentation', url: 'https://developers.cloudflare.com/pages/' },
    ],
  },
  'gabia-domain-dns-github-pages': {
    example: {
      title: '가비아에서 Cloudflare로 DNS 관리를 넘긴 사례',
      paragraphs: [
        '기존에는 가비아 DNS에 GitHub Pages용 A 레코드 4개와 `www -> emfls.github.io` CNAME이 있었습니다. Cloudflare를 사용하기로 한 뒤에는 가비아에서 개별 DNS 레코드를 수정하는 대신 네임서버를 Cloudflare가 안내한 값으로 변경했습니다.',
        '이 차이를 이해하는 것이 중요합니다. 네임서버를 바꾸면 이후 DNS의 기준은 가비아 레코드 화면이 아니라 Cloudflare DNS 화면입니다. 가비아에서 CNAME을 계속 수정하면 실제 적용 위치를 착각할 수 있습니다.',
      ],
    },
    screenshot: {
      title: '준비할 스크린샷',
      caption: '가비아 네임서버 변경 화면과 Cloudflare DNS 레코드 화면을 각각 캡처하면 “레코드 수정”과 “네임서버 변경”의 차이를 설명하기 좋습니다.',
    },
    checklist: [
      '현재 도메인의 네임서버가 어디를 가리키는지 확인한다.',
      'Cloudflare를 쓰는 경우 가비아 DNS 레코드가 아니라 Cloudflare DNS를 기준으로 본다.',
      '루트 도메인과 `www` 도메인이 같은 사이트로 연결되는지 확인한다.',
      'DNS 변경 후 바로 판단하지 말고 전파 시간을 둔다.',
    ],
    mistakes: [
      'Cloudflare 네임서버로 바꾼 뒤에도 가비아 DNS 레코드를 수정하는 것.',
      '루트 도메인 `@`에 일반 CNAME을 넣으려다 오류를 만드는 것.',
      '예전 GitHub Pages 레코드와 새 Pages 레코드를 동시에 남겨두는 것.',
    ],
    faqs: [
      {
        question: '가비아에서 A 레코드를 직접 바꾸면 안 되나요?',
        answer: 'Cloudflare 네임서버를 쓰기로 했다면 가비아의 개별 DNS 레코드는 더 이상 기준이 아닙니다. Cloudflare DNS에서 관리해야 합니다.',
      },
      {
        question: 'DNS 전파는 얼마나 걸리나요?',
        answer: '몇 분 안에 반영되는 경우도 있지만 보통 1~2시간, 길면 24시간까지 걸릴 수 있습니다. 변경 직후에는 여러 번 수정하지 말고 상태를 확인하세요.',
      },
      {
        question: 'www 주소도 꼭 연결해야 하나요?',
        answer: '필수는 아니지만 사용자가 `www`를 붙여 접속할 수 있으므로 연결하거나 대표 도메인으로 리디렉션하는 것이 좋습니다.',
      },
    ],
    sources: [
      { name: 'Cloudflare DNS documentation', url: 'https://developers.cloudflare.com/dns/' },
      { name: 'GitHub Pages custom domain documentation', url: 'https://docs.github.com/pages/configuring-a-custom-domain-for-your-github-pages-site' },
    ],
  },
  'why-astro-for-static-content-site': {
    example: {
      title: 'Astro로 글과 정책 페이지를 함께 관리한 방식',
      paragraphs: [
        '이 사이트는 글 데이터를 TypeScript 파일에 두고, Astro 동적 라우트가 각 글 상세 페이지를 정적 HTML로 생성합니다. 그래서 Cloudflare Pages에서는 `npm run build` 후 `dist` 폴더만 배포하면 됩니다.',
        '반복되는 헤더, 푸터, SEO 메타 태그, AdSense 확인 코드, 구조화 데이터는 공통 레이아웃에서 관리합니다. 페이지가 늘어나도 기본 신뢰 신호를 빠뜨릴 가능성이 줄어듭니다.',
      ],
    },
    screenshot: {
      title: '준비할 스크린샷',
      caption: 'Astro 프로젝트 구조, `src/pages`, `src/layouts`, `src/data` 폴더를 보여주는 화면은 정적 사이트가 어떻게 생성되는지 설명하는 데 유용합니다.',
    },
    checklist: [
      '정적 HTML 생성이 가능한 구조인지 확인한다.',
      '공통 SEO 태그를 레이아웃에서 관리한다.',
      '글 상세 페이지가 빌드 시 모두 생성되는지 확인한다.',
      '배포 서비스의 출력 폴더를 `dist`로 설정한다.',
    ],
    mistakes: [
      '빌드 명령은 맞지만 출력 폴더를 잘못 지정하는 것.',
      '공통 레이아웃이 아닌 개별 페이지에 중요한 메타 태그를 흩어놓는 것.',
      '동적 서버 기능이 필요한 요구사항을 정적 사이트에 억지로 넣는 것.',
    ],
    faqs: [
      {
        question: 'Astro는 블로그에만 쓰나요?',
        answer: '아닙니다. 문서 사이트, 정보 사이트, 랜딩 페이지, 콘텐츠 허브처럼 정적 HTML이 중요한 사이트에 잘 맞습니다.',
      },
      {
        question: 'WordPress보다 Astro가 항상 좋은가요?',
        answer: '아닙니다. 관리자 화면과 댓글, 회원 기능이 중요하면 WordPress가 편할 수 있습니다. 빠른 정적 콘텐츠와 코드 기반 관리가 중요하면 Astro가 적합합니다.',
      },
      {
        question: 'AdSense 코드도 Astro에 넣을 수 있나요?',
        answer: '가능합니다. 공통 레이아웃의 head 영역에 넣으면 모든 정적 페이지에 같은 확인 코드가 포함됩니다.',
      },
    ],
    sources: [
      { name: 'Astro documentation', url: 'https://docs.astro.build/' },
      { name: 'Cloudflare Pages Astro guide', url: 'https://developers.cloudflare.com/pages/framework-guides/deploy-an-astro-site/' },
    ],
  },
  'adsense-review-essential-pages': {
    example: {
      title: '심사 전 추가한 신뢰 페이지',
      paragraphs: [
        '이 사이트는 기본 소개, 문의, 개인정보처리방침 외에 편집 정책, 콘텐츠 작성 기준, 면책 고지를 추가했습니다. 목적은 단순히 페이지 수를 늘리는 것이 아니라 사이트가 어떤 기준으로 운영되는지 검토자가 확인할 수 있게 하는 것입니다.',
        '특히 기술 정보 사이트는 오래된 설정값이나 외부 서비스 정책 변경이 생길 수 있습니다. 그래서 최종 검토일과 공식 문서 링크를 글마다 제공하는 구조를 만들었습니다.',
      ],
    },
    screenshot: {
      title: '준비할 스크린샷',
      caption: '푸터에 소개, 문의, 개인정보처리방침, 편집 정책, 면책 고지 링크가 모두 보이는 화면을 캡처하면 사이트 완성도를 점검하기 쉽습니다.',
    },
    checklist: [
      '소개 페이지에서 사이트 목적과 운영자를 설명한다.',
      '문의 페이지에서 실제 연락 가능한 이메일을 제공한다.',
      '개인정보처리방침에 문의 이메일과 광고/분석 도구 가능성을 반영한다.',
      '편집 정책과 면책 고지로 정보의 범위와 한계를 설명한다.',
    ],
    mistakes: [
      '정책 페이지를 템플릿 문구 그대로 두는 것.',
      '문의 이메일이 실제로 수신되지 않는 것.',
      '광고 심사 전에도 공사중 페이지를 메뉴에 남겨두는 것.',
    ],
    faqs: [
      {
        question: '개인 사이트에도 편집 정책이 필요한가요?',
        answer: '법적으로 항상 필요한 것은 아니지만 정보 사이트의 신뢰도를 높이는 데 도움이 됩니다. 어떤 기준으로 글을 쓰고 수정하는지 설명할 수 있습니다.',
      },
      {
        question: '문의 폼이 꼭 있어야 하나요?',
        answer: '꼭 폼일 필요는 없습니다. 초기에는 실제 수신 가능한 이메일 주소와 문의 가능 범위를 명확히 적는 것으로 충분합니다.',
      },
      {
        question: '면책 고지는 이용약관과 다른가요?',
        answer: '겹치는 부분은 있지만 면책 고지는 정보 제공 범위와 책임 제한을 더 직접적으로 설명합니다. 기술 설정 글에는 특히 유용합니다.',
      },
    ],
    sources: [
      { name: 'AdSense Program policies', url: 'https://support.google.com/adsense/answer/48182' },
      { name: 'Make sure your site is ready for AdSense', url: 'https://support.google.com/adsense/answer/7299563' },
    ],
  },
  'seo-friendly-title-and-url': {
    example: {
      title: '이 사이트의 URL 작성 방식',
      paragraphs: [
        '이 사이트는 글 URL을 `/articles/seo-friendly-title-and-url/`처럼 영어 소문자와 하이픈으로 구성합니다. 한글 제목은 본문과 검색 결과에서 충분히 전달하고, URL은 공유와 관리가 쉬운 형태로 유지합니다.',
        '제목은 “SEO 설정”처럼 넓게 쓰지 않고 “검색 엔진이 읽기 쉬운 글 URL과 제목 만드는 법”처럼 독자가 얻을 결과를 드러내는 방식으로 작성합니다.',
      ],
    },
    screenshot: {
      title: '준비할 스크린샷',
      caption: '브라우저 주소창, 글 H1, 검색 결과에 표시될 title/description을 함께 보여주면 URL과 제목의 역할 차이를 설명하기 좋습니다.',
    },
    checklist: [
      'H1은 페이지마다 하나만 사용한다.',
      'URL slug는 짧고 의미 있는 영어 소문자와 하이픈으로 만든다.',
      'title과 description은 글마다 다르게 작성한다.',
      '본문 내용과 맞지 않는 과장 키워드를 넣지 않는다.',
    ],
    mistakes: [
      '모든 글 description을 같은 문장으로 두는 것.',
      '제목에 키워드를 반복해서 어색하게 만드는 것.',
      '나중에 URL을 자주 바꿔 기존 색인과 외부 링크를 잃는 것.',
    ],
    faqs: [
      {
        question: '한글 URL은 SEO에 불리한가요?',
        answer: '반드시 불리한 것은 아닙니다. 다만 공유, 로그 확인, 인코딩 문제를 고려하면 영어 slug가 관리하기 편한 경우가 많습니다.',
      },
      {
        question: '제목에 키워드를 몇 번 넣어야 하나요?',
        answer: '횟수보다 정확성이 중요합니다. 제목은 검색엔진보다 먼저 독자가 읽는 문장이라는 점을 기준으로 작성하세요.',
      },
      {
        question: 'URL을 바꾸면 어떻게 해야 하나요?',
        answer: '가능하면 바꾸지 않는 것이 좋습니다. 바꿔야 한다면 리디렉션과 내부 링크 수정, 사이트맵 갱신을 함께 처리해야 합니다.',
      },
    ],
    sources: [
      { name: 'Google Search Central SEO starter guide', url: 'https://developers.google.com/search/docs/fundamentals/seo-starter-guide' },
      { name: 'Google title links documentation', url: 'https://developers.google.com/search/docs/appearance/title-link' },
    ],
  },
  'robots-and-sitemap-basics': {
    example: {
      title: 'HTML 사이트맵과 XML 사이트맵을 구분한 사례',
      paragraphs: [
        '이 사이트에는 사람이 보는 `/site-map/` 페이지와 검색 엔진에 제출하는 `/sitemap-index.xml` 파일이 따로 있습니다. Search Console에는 HTML 페이지가 아니라 XML 사이트맵을 제출해야 합니다.',
        '`sitemap-index.xml`은 실제 URL을 모두 직접 담는 파일이 아니라 `sitemap-0.xml` 같은 하위 사이트맵을 가리키는 목차일 수 있습니다. Google은 인덱스 파일을 읽고 하위 사이트맵을 따라갑니다.',
      ],
    },
    screenshot: {
      title: '준비할 스크린샷',
      caption: 'Search Console에서 HTML 사이트맵 제출 오류와 XML 사이트맵 제출 성공 화면을 비교하면 초보자가 자주 겪는 혼동을 줄일 수 있습니다.',
    },
    checklist: [
      '`robots.txt`가 사이트맵 XML 주소를 가리키는지 확인한다.',
      'Search Console에는 `/sitemap-index.xml`을 제출한다.',
      '사람용 사이트맵과 검색엔진용 XML 사이트맵을 구분한다.',
      '빌드 후 `dist`에 사이트맵이 생성되는지 확인한다.',
    ],
    mistakes: [
      'Search Console에 `/site-map/` 같은 HTML 페이지를 제출하는 것.',
      '`robots.txt`에서 실제 존재하지 않는 사이트맵 주소를 안내하는 것.',
      '사이트맵 인덱스에 글 URL이 직접 안 보인다고 오류로 착각하는 것.',
    ],
    faqs: [
      {
        question: 'sitemap-index.xml에 글 URL이 안 보이면 문제인가요?',
        answer: '아닙니다. 사이트맵 인덱스는 하위 사이트맵 위치를 알려주는 파일입니다. 실제 URL은 `sitemap-0.xml` 같은 하위 파일에 들어갈 수 있습니다.',
      },
      {
        question: 'robots.txt가 없으면 색인이 안 되나요?',
        answer: '반드시 그런 것은 아니지만, 공개 사이트라면 허용 정책과 사이트맵 위치를 명확히 제공하는 것이 좋습니다.',
      },
      {
        question: '사이트맵 제출 후 발견된 페이지가 0으로 나옵니다.',
        answer: '제출 직후에는 0으로 보일 수 있습니다. 사이트맵 형식이 맞고 URL이 접속된다면 Google이 처리할 시간을 두고 다시 확인하세요.',
      },
    ],
    sources: [
      { name: 'Google sitemap documentation', url: 'https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview' },
      { name: 'Google robots.txt documentation', url: 'https://developers.google.com/search/docs/crawling-indexing/robots/intro' },
    ],
  },
  'privacy-policy-practical-checklist': {
    example: {
      title: 'AdSense 코드 삽입 후 개인정보처리방침에서 확인할 부분',
      paragraphs: [
        'AdSense 확인 코드를 넣으면 Google 광고 스크립트가 사이트 head에 포함됩니다. 실제 광고 게재 전이라도 향후 광고 서비스와 쿠키 사용 가능성을 개인정보처리방침에서 설명하는 것이 좋습니다.',
        '문의 이메일만 받는 사이트라도 사용자가 보낸 이메일 주소와 문의 내용은 개인정보가 될 수 있습니다. 수집하지 않는 정보는 받지 않는 것이 가장 단순한 관리 방식입니다.',
      ],
    },
    screenshot: {
      title: '준비할 스크린샷',
      caption: '개인정보처리방침에서 문의 이메일, 외부 서비스, 광고 관련 문구가 보이는 부분을 캡처해 정책 점검 자료로 남길 수 있습니다.',
    },
    checklist: [
      '회원가입, 댓글, 문의 폼, 이메일 문의 중 실제 사용하는 수집 경로만 적는다.',
      'AdSense, Analytics 등 외부 서비스 사용 여부를 반영한다.',
      '삭제 요청 연락처를 명확히 둔다.',
      '정책 시행일과 변경 가능성을 표시한다.',
    ],
    mistakes: [
      '사용하지 않는 서비스를 정책에 무작정 나열하는 것.',
      '문의 이메일을 받으면서 개인정보를 전혀 수집하지 않는다고 쓰는 것.',
      '광고나 분석 도구를 추가한 뒤 정책을 갱신하지 않는 것.',
    ],
    faqs: [
      {
        question: '이메일 문의만 받아도 개인정보처리방침이 필요한가요?',
        answer: '방문자가 이메일 주소와 문의 내용을 보내는 구조라면 처리 기준을 안내하는 것이 좋습니다.',
      },
      {
        question: 'AdSense 승인 전에도 광고 관련 문구를 넣어야 하나요?',
        answer: '광고 스크립트를 삽입했거나 광고 서비스를 사용할 예정이라면 쿠키와 외부 서비스 가능성을 설명하는 편이 안전합니다.',
      },
      {
        question: '정책 문서는 얼마나 자주 수정해야 하나요?',
        answer: '문의 방식, 광고 서비스, 분석 도구, 데이터 보관 기준이 바뀔 때마다 함께 갱신해야 합니다.',
      },
    ],
    sources: [
      { name: 'Google AdSense privacy and cookie policies', url: 'https://support.google.com/adsense/answer/1348695' },
      { name: 'Google Publisher Policies', url: 'https://support.google.com/publisherpolicies/answer/10502938' },
    ],
  },
  'why-custom-404-page-matters': {
    example: {
      title: '정적 사이트에서 404가 생기는 흔한 상황',
      paragraphs: [
        '정적 사이트는 글 slug를 바꾸거나 배포 경로를 바꾸면 예전 주소가 바로 404가 될 수 있습니다. 검색엔진에 이미 노출된 주소라면 방문자가 오류 화면을 볼 수 있습니다.',
        '이 사이트는 404 페이지에서 홈으로 이동하는 버튼과 최근 글 링크를 제공합니다. 단순 오류 메시지만 보여주는 대신 방문자가 다음 행동을 선택할 수 있게 만드는 것이 목적입니다.',
      ],
    },
    screenshot: {
      title: '준비할 스크린샷',
      caption: '존재하지 않는 URL로 접속했을 때 404 페이지가 사이트 디자인 안에서 표시되고 홈/글 링크가 보이는 화면을 캡처합니다.',
    },
    checklist: [
      '존재하지 않는 URL에서 커스텀 404가 보이는지 확인한다.',
      '404 페이지에 홈과 글 목록 링크를 제공한다.',
      '내부 링크 중 404로 이어지는 경로가 없는지 점검한다.',
      'URL slug 변경은 가능하면 피한다.',
    ],
    mistakes: [
      '기본 브라우저 오류 화면만 노출하는 것.',
      '404 페이지에서 다시 깨진 링크로 보내는 것.',
      '글 URL을 자주 바꾸면서 리디렉션을 고려하지 않는 것.',
    ],
    faqs: [
      {
        question: '404 페이지가 있어도 검색 순위가 오르나요?',
        answer: '직접적인 순위 상승 요소로 보기보다는 사용자 경험과 사이트 완성도를 높이는 기본 장치로 이해하는 것이 좋습니다.',
      },
      {
        question: '모든 404를 홈으로 리디렉션하면 되나요?',
        answer: '권장하지 않습니다. 실제로 없는 페이지는 404 상태를 유지하고, 사용자가 이동할 수 있는 링크를 제공하는 편이 더 명확합니다.',
      },
      {
        question: '정적 사이트에서도 404 페이지를 만들 수 있나요?',
        answer: '가능합니다. Astro에서는 `src/pages/404.astro`를 만들면 정적 404 페이지가 생성됩니다.',
      },
    ],
    sources: [
      { name: 'Google HTTP status codes documentation', url: 'https://developers.google.com/search/docs/crawling-indexing/http-network-errors' },
      { name: 'Astro pages documentation', url: 'https://docs.astro.build/en/basics/astro-pages/' },
    ],
  },
  'simple-contact-page-for-static-site': {
    example: {
      title: 'mailto 링크로 시작한 문의 페이지',
      paragraphs: [
        '이 사이트는 초기 문의 수단으로 `contact@emfls.com` 이메일 링크를 사용합니다. 별도 백엔드가 없는 정적 사이트에서는 이 방식이 가장 단순하고, 개인정보 처리 범위도 명확합니다.',
        '문의 폼을 도입하면 이름, 이메일, 문의 내용, 스팸 방지 정보가 외부 서비스로 전달될 수 있습니다. 애드센스 심사 전에는 복잡한 폼보다 실제 연락 가능한 경로를 명확히 두는 것이 우선입니다.',
      ],
    },
    screenshot: {
      title: '준비할 스크린샷',
      caption: '문의 페이지에서 이메일 주소와 문의 가능 범위가 보이는 화면을 캡처해 운영자 연락 가능성을 확인합니다.',
    },
    checklist: [
      '실제로 수신 가능한 이메일 주소를 사용한다.',
      '문의 유형과 답변 가능 범위를 적는다.',
      '광고 클릭 요청이나 정책 위반 요청은 받지 않는다고 명시한다.',
      '폼을 쓰는 경우 개인정보처리방침을 함께 갱신한다.',
    ],
    mistakes: [
      '없는 이메일 주소를 적어두는 것.',
      '문의 폼을 붙이고 개인정보 수집 항목을 설명하지 않는 것.',
      '스팸 방지 없이 공개 폼을 운영하는 것.',
    ],
    faqs: [
      {
        question: '문의 폼이 없으면 신뢰도가 낮아지나요?',
        answer: '반드시 그렇지는 않습니다. 실제로 연락 가능한 이메일과 명확한 문의 안내가 있으면 초기 사이트에는 충분할 수 있습니다.',
      },
      {
        question: '이메일 주소를 공개하면 스팸이 늘지 않나요?',
        answer: '가능성이 있습니다. 방문자가 늘어나면 폼 서비스나 별도 문의 주소, 스팸 필터를 검토할 수 있습니다.',
      },
      {
        question: 'AdSense 심사에 문의 페이지가 꼭 필요한가요?',
        answer: '공식적으로 모든 사이트에 같은 형식이 강제되는 것은 아니지만, 연락 가능한 운영자 정보는 신뢰 신호로 도움이 됩니다.',
      },
    ],
    sources: [
      { name: 'AdSense site readiness guide', url: 'https://support.google.com/adsense/answer/7299563' },
      { name: 'MDN mailto links', url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Creating_links#email_links' },
    ],
  },
  'after-first-deploy-checklist': {
    example: {
      title: 'Cloudflare Pages 첫 배포 후 확인한 순서',
      paragraphs: [
        '이 사이트는 GitHub에 push한 뒤 Cloudflare Pages가 자동으로 빌드하도록 구성했습니다. 배포가 끝난 뒤에는 먼저 `pages.dev` 임시 주소가 열리는지 확인하고, 그다음 `emfls.com` 커스텀 도메인 연결을 확인했습니다.',
        'AdSense 확인 코드처럼 head에 들어가는 값은 push 후 바로 확인하지 말고 Cloudflare 배포가 끝났는지 먼저 봐야 합니다. 배포가 끝나기 전에 AdSense에서 확인을 누르면 실패할 수 있습니다.',
      ],
    },
    screenshot: {
      title: '준비할 스크린샷',
      caption: 'Cloudflare Pages 배포 성공 화면, 커스텀 도메인 활성화 화면, 실제 사이트 HTTPS 접속 화면을 순서대로 캡처합니다.',
    },
    checklist: [
      '빌드 로그가 성공인지 확인한다.',
      '`pages.dev` 임시 주소가 열리는지 확인한다.',
      '커스텀 도메인 HTTPS 접속을 확인한다.',
      'robots.txt와 sitemap-index.xml이 공개되는지 확인한다.',
      'AdSense 확인 코드는 최신 배포 후 검증한다.',
    ],
    mistakes: [
      'GitHub push만 보고 배포가 끝났다고 착각하는 것.',
      '빌드 출력 폴더를 잘못 입력하는 것.',
      '도메인 활성화 전 Search Console과 AdSense 확인을 서두르는 것.',
    ],
    faqs: [
      {
        question: 'Cloudflare Pages 배포는 얼마나 걸리나요?',
        answer: '작은 정적 사이트는 보통 1~3분이면 끝납니다. 다만 첫 연결이나 도메인 인증은 더 걸릴 수 있습니다.',
      },
      {
        question: '배포 성공인데 도메인이 안 열립니다.',
        answer: 'Pages 배포와 DNS/도메인 연결은 별도입니다. 임시 주소가 열리는지 먼저 확인하고, 커스텀 도메인 상태와 DNS를 확인하세요.',
      },
      {
        question: '사이트맵은 언제 제출하나요?',
        answer: '대표 도메인에서 `sitemap-index.xml`이 정상으로 열린 뒤 제출하는 것이 좋습니다.',
      },
    ],
    sources: [
      { name: 'Cloudflare Pages deployments', url: 'https://developers.cloudflare.com/pages/configuration/deployments/' },
      { name: 'Google Search Console sitemap report', url: 'https://support.google.com/webmasters/answer/7451001' },
    ],
  },
  'unfinished-site-signals-before-adsense': {
    example: {
      title: '심사 전 제거해야 할 신호를 실제로 점검하는 방법',
      paragraphs: [
        'AdSense 심사 전에는 홈에서 시작해 모든 메뉴, 푸터, 글 카드, 관련 글 링크를 직접 눌러보는 것이 좋습니다. 빌드가 성공해도 빈 페이지, 임시 문구, 오래된 링크가 남아 있을 수 있습니다.',
        '이 사이트는 신뢰 페이지를 추가한 뒤 사이트맵 페이지에도 해당 링크를 넣었습니다. 정책 페이지를 만들어놓고 어디에서도 접근할 수 없다면 검토자가 발견하기 어렵기 때문입니다.',
      ],
    },
    screenshot: {
      title: '준비할 스크린샷',
      caption: '홈, 글 목록, 글 상세, 정책 페이지, 404 페이지가 모두 정상적으로 이어지는 흐름을 캡처해 심사 전 점검 자료로 남깁니다.',
    },
    checklist: [
      '공사중, 테스트, lorem ipsum 문구를 제거한다.',
      '빈 카테고리를 메뉴에서 숨긴다.',
      '모든 푸터 링크가 실제 페이지로 연결되는지 확인한다.',
      '글마다 고유한 FAQ와 관련 글 링크가 있는지 확인한다.',
      '모바일에서 텍스트와 버튼이 겹치지 않는지 확인한다.',
    ],
    mistakes: [
      '글 수를 늘리려고 비슷한 문장을 반복하는 것.',
      '정책 페이지는 만들었지만 내비게이션에서 연결하지 않는 것.',
      'Search Console 오류를 해결하지 않은 채 심사를 요청하는 것.',
    ],
    faqs: [
      {
        question: '글이 몇 개면 미완성으로 보이지 않나요?',
        answer: '개수보다 완성도가 중요합니다. 각 글이 독립적인 문제를 해결하고, 메뉴와 내부 링크가 자연스럽게 연결되어야 합니다.',
      },
      {
        question: '이미 AdSense 신청했는데 글을 수정해도 되나요?',
        answer: '가능합니다. 다만 큰 구조 변경이나 도메인 변경은 피하고, 콘텐츠 품질과 신뢰 페이지 보강 위주로 수정하는 것이 좋습니다.',
      },
      {
        question: 'AI로 쓴 글은 무조건 거절되나요?',
        answer: '도구 자체보다 결과물이 문제입니다. 반복적이고 얕은 내용, 출처 없는 일반론, 실제 경험이 없는 글은 낮은 가치로 보일 수 있습니다.',
      },
    ],
    sources: [
      { name: 'AdSense Program policies', url: 'https://support.google.com/adsense/answer/48182' },
      { name: 'Google helpful content guidance', url: 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content' },
    ],
  },
  'cloudflare-dns-setup-for-beginners': {
    example: {
      title: '가비아에서 Cloudflare로 기준 화면이 바뀌는 순간',
      paragraphs: [
        '가비아에서 Cloudflare 네임서버로 변경한 뒤 Cloudflare Overview에 `Your domain is now protected by Cloudflare`가 표시되면 DNS 기준은 Cloudflare입니다. 이후 가비아의 개별 DNS 레코드 수정 화면은 실제 서비스 기준이 아닐 수 있습니다.',
        '이 상태에서 Pages의 Custom domains에 `emfls.com`을 추가하면 Cloudflare가 필요한 연결을 안내합니다. 기존 GitHub Pages 레코드가 남아 있으면 충돌을 정리한 뒤 Pages 대상 레코드로 맞춥니다.',
      ],
    },
    screenshot: {
      title: '준비할 스크린샷',
      caption: 'Cloudflare 도메인 Active 화면, DNS 레코드 목록, Pages Custom domains 연결 상태를 순서대로 캡처합니다.',
    },
    checklist: [
      'Cloudflare Overview에서 도메인이 Active인지 확인한다.',
      'DNS 메뉴에서 예전 GitHub Pages 레코드가 남아 있는지 본다.',
      'Pages 프로젝트의 Custom domains에서 루트 도메인을 추가한다.',
      '`www` 주소도 사용할지 결정하고 별도로 연결한다.',
    ],
    mistakes: [
      'Cloudflare 활성화 후에도 가비아 DNS 레코드를 계속 수정하는 것.',
      '예전 GitHub Pages A 레코드와 Cloudflare Pages 연결을 동시에 유지하는 것.',
      '도메인 전파 중에 설정을 여러 번 바꿔 원인을 추적하기 어렵게 만드는 것.',
    ],
    faqs: [
      {
        question: 'Cloudflare를 쓰면 가비아는 더 이상 필요 없나요?',
        answer: '도메인 등록기관은 여전히 가비아입니다. 다만 네임서버를 Cloudflare로 바꾸면 DNS 관리는 Cloudflare에서 합니다.',
      },
      {
        question: '주황색 구름은 켜야 하나요?',
        answer: 'Pages 연결에서는 Cloudflare 안내를 따르는 것이 좋습니다. 일반적으로 프록시를 통해 HTTPS, 캐시, 보안 기능을 함께 사용할 수 있습니다.',
      },
      {
        question: 'DNS 변경 후 바로 AdSense 확인을 눌러도 되나요?',
        answer: '대표 도메인이 실제 사이트로 열리고 최신 배포가 반영된 뒤 확인하는 것이 안전합니다.',
      },
    ],
    sources: [
      { name: 'Cloudflare DNS documentation', url: 'https://developers.cloudflare.com/dns/' },
      { name: 'Cloudflare Pages custom domains', url: 'https://developers.cloudflare.com/pages/configuration/custom-domains/' },
    ],
  },
  'google-search-console-domain-property-guide': {
    example: {
      title: 'HTML 사이트맵 오류를 XML 사이트맵 제출로 고친 사례',
      paragraphs: [
        'Search Console에 `/site-map/`을 제출하면 HTML 페이지라서 오류가 납니다. 이 사이트는 사람이 보는 사이트맵과 검색 엔진용 XML 사이트맵을 분리했고, Search Console에는 `/sitemap-index.xml`을 제출하는 방식으로 정리했습니다.',
        '사이트맵 인덱스에는 실제 글 URL이 바로 보이지 않을 수 있습니다. 대신 `sitemap-0.xml` 같은 하위 사이트맵 위치가 들어 있고, Google은 그 파일을 따라가 URL 목록을 읽습니다.',
      ],
    },
    screenshot: {
      title: '준비할 스크린샷',
      caption: 'Search Console의 사이트맵 제출 화면, HTML 사이트맵 오류, XML 사이트맵 정상 제출 화면을 비교합니다.',
    },
    checklist: [
      '도메인 속성 또는 URL 접두어 속성을 목적에 맞게 선택한다.',
      '소유권 확인이 완료되었는지 확인한다.',
      '`sitemap-index.xml`을 제출한다.',
      '홈과 대표 글을 URL 검사로 확인한다.',
    ],
    mistakes: [
      'HTML 사이트맵 페이지를 XML 사이트맵으로 제출하는 것.',
      '도메인 활성화 전 Search Console 검증을 반복하는 것.',
      '색인 상태가 즉시 바뀌지 않는다고 사이트 구조를 계속 바꾸는 것.',
    ],
    faqs: [
      {
        question: '도메인 속성과 URL 접두어 중 무엇이 좋나요?',
        answer: 'Cloudflare DNS를 관리한다면 도메인 속성이 전체 도메인을 보기 좋습니다. 특정 HTTPS 주소만 빠르게 확인하려면 URL 접두어도 사용할 수 있습니다.',
      },
      {
        question: '사이트맵 제출 성공이면 바로 색인되나요?',
        answer: '아닙니다. 사이트맵 제출은 URL 발견을 돕는 단계이며, 색인 여부는 콘텐츠 품질과 Google 판단에 따라 달라집니다.',
      },
      {
        question: '발견된 페이지가 0이면 실패인가요?',
        answer: '제출 직후에는 0일 수 있습니다. 형식이 맞고 URL이 열리면 시간을 두고 다시 확인하세요.',
      },
    ],
    sources: [
      { name: 'Search Console Help', url: 'https://support.google.com/webmasters/' },
      { name: 'Google sitemaps documentation', url: 'https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview' },
    ],
  },
  'adsense-review-final-checklist': {
    example: {
      title: '심사 직전 emfls.com에서 확인한 기준',
      paragraphs: [
        '이 사이트는 AdSense 확인 코드를 공통 head에 넣고, Cloudflare Pages 배포가 끝난 뒤 확인을 진행하는 흐름으로 구성했습니다. 코드가 저장소에 들어갔더라도 실제 배포가 끝나기 전에는 AdSense가 확인하지 못할 수 있습니다.',
        '또한 소개, 문의, 개인정보처리방침, 편집 정책, 작성 기준, 면책 고지를 푸터와 사이트맵에서 접근 가능하게 배치했습니다. 심사자는 한 페이지가 아니라 사이트 전체 완성도를 볼 수 있기 때문입니다.',
      ],
    },
    screenshot: {
      title: '준비할 스크린샷',
      caption: 'AdSense 확인 코드 화면, 실제 HTML head에 코드가 들어간 화면, Cloudflare Pages 최신 배포 성공 화면을 함께 보관합니다.',
    },
    checklist: [
      '대표 도메인 HTTPS 접속이 정상인지 확인한다.',
      'AdSense 코드가 최신 배포 HTML head에 들어갔는지 확인한다.',
      '정책/신뢰 페이지가 푸터에서 접근 가능한지 확인한다.',
      '글마다 고유한 예시, FAQ, 출처가 있는지 확인한다.',
      'Search Console에 XML 사이트맵을 제출한다.',
    ],
    mistakes: [
      '광고 코드만 넣고 콘텐츠와 정책 페이지를 보강하지 않는 것.',
      '임시 배포 주소와 심사 도메인을 섞어 쓰는 것.',
      '짧은 글을 많이 만들어 콘텐츠 수만 늘리는 것.',
    ],
    faqs: [
      {
        question: 'AdSense 신청 후에도 글을 수정해도 되나요?',
        answer: '가능합니다. 심사 중에는 사이트 안정성을 유지하면서 품질 보강, 오타 수정, 내부 링크 개선 위주로 수정하는 것이 좋습니다.',
      },
      {
        question: '승인 전 광고 자리를 만들어야 하나요?',
        answer: '필수는 아닙니다. 승인 전에는 광고 배치보다 콘텐츠 품질과 사이트 신뢰도를 먼저 갖추는 것이 안전합니다.',
      },
      {
        question: 'Search Console 색인이 부족하면 무조건 거절되나요?',
        answer: '무조건은 아니지만, 주요 페이지 접근과 사이트맵 제출은 심사 전 기본 점검으로 처리하는 것이 좋습니다.',
      },
    ],
    sources: [
      { name: 'AdSense site readiness guide', url: 'https://support.google.com/adsense/answer/7299563' },
      { name: 'AdSense Program policies', url: 'https://support.google.com/adsense/answer/48182' },
    ],
  },
  'connect-custom-domain-to-github-pages': {
    example: {
      title: 'GitHub Pages 기준에서 Cloudflare Pages 기준으로 바꾼 이유',
      paragraphs: [
        '처음에는 GitHub Pages용 A 레코드와 CNAME 파일을 준비했지만, 최종 운영은 Cloudflare Pages로 정리했습니다. 이유는 도메인, DNS, HTTPS, 배포 상태를 Cloudflare에서 한 번에 관리하는 편이 초보자에게 더 명확했기 때문입니다.',
        '이런 변경을 할 때는 예전 GitHub Pages용 설정을 계속 남겨두지 않는 것이 중요합니다. 배포 기준이 바뀌면 README, DNS, AdSense 등록 주소, sitemap 기준 URL도 함께 맞춰야 합니다.',
      ],
    },
    screenshot: {
      title: '준비할 스크린샷',
      caption: 'GitHub Pages custom domain 화면과 Cloudflare Pages custom domain 화면을 비교하면 두 방식의 차이를 설명하기 좋습니다.',
    },
    checklist: [
      '어떤 서비스가 실제 배포를 담당하는지 먼저 정한다.',
      'GitHub Pages를 쓰면 CNAME 파일과 GitHub Pages 설정을 확인한다.',
      'Cloudflare Pages를 쓰면 GitHub Pages 전용 설정을 제거한다.',
      '대표 도메인 기준으로 canonical과 sitemap을 맞춘다.',
    ],
    mistakes: [
      'GitHub Pages와 Cloudflare Pages 설정을 동시에 활성화해 충돌을 만드는 것.',
      'CNAME 파일이 필요 없는 배포 방식에서도 계속 유지하는 것.',
      '심사 도메인과 실제 공개 도메인을 다르게 두는 것.',
    ],
    faqs: [
      {
        question: 'GitHub Pages와 Cloudflare Pages를 같이 써도 되나요?',
        answer: '코드 저장소는 GitHub, 배포는 Cloudflare Pages로 역할을 나누는 것은 좋습니다. 다만 두 서비스가 동시에 같은 도메인을 배포 대상으로 잡으면 혼란이 생깁니다.',
      },
      {
        question: 'CNAME 파일은 언제 필요한가요?',
        answer: 'GitHub Pages에서 사용자 지정 도메인을 직접 쓸 때 필요합니다. Cloudflare Pages 배포만 쓴다면 필수는 아닙니다.',
      },
      {
        question: '기존 emfls.github.io 주소는 어떻게 하나요?',
        answer: '심사 도메인을 `emfls.com`으로 정했다면 공개 링크와 SEO 설정은 `emfls.com` 기준으로 통일하는 것이 좋습니다.',
      },
    ],
    sources: [
      { name: 'GitHub Pages custom domains', url: 'https://docs.github.com/pages/configuring-a-custom-domain-for-your-github-pages-site' },
      { name: 'Cloudflare Pages custom domains', url: 'https://developers.cloudflare.com/pages/configuration/custom-domains/' },
    ],
  },
  'how-to-check-https-on-custom-domain': {
    example: {
      title: 'AdSense 확인 전 HTTPS를 확인한 순서',
      paragraphs: [
        'AdSense 확인 코드를 넣은 뒤 바로 확인 버튼을 누르기보다 먼저 `https://emfls.com`에서 실제 최신 사이트가 열리는지 확인했습니다. 이어서 사이트맵과 주요 글 URL이 모두 HTTPS로 열리는지 봤습니다.',
        'HTTPS가 정상이어도 Cloudflare 배포가 아직 이전 버전이면 head에 새 코드가 없을 수 있습니다. 그래서 배포 성공 로그와 실제 페이지 소스 확인을 함께 보는 것이 좋습니다.',
      ],
    },
    screenshot: {
      title: '준비할 스크린샷',
      caption: '주소창의 HTTPS 표시, Cloudflare SSL/TLS 상태, 실제 페이지 소스의 AdSense 코드 위치를 캡처합니다.',
    },
    checklist: [
      '`https://emfls.com`이 경고 없이 열리는지 확인한다.',
      '`http://emfls.com`이 HTTPS로 이동하는지 확인한다.',
      '`www` 주소 처리 방식을 확인한다.',
      '브라우저 콘솔에 혼합 콘텐츠 경고가 없는지 본다.',
    ],
    mistakes: [
      'HTTP 주소를 Search Console이나 AdSense 기준 주소로 쓰는 것.',
      '인증서 발급 중인데 설정을 반복 변경하는 것.',
      '외부 이미지나 스크립트를 HTTP로 불러오는 것.',
    ],
    faqs: [
      {
        question: 'HTTPS 자물쇠만 보이면 충분한가요?',
        answer: '기본 조건은 충족하지만 http 리디렉션, www 주소, 사이트맵 URL, canonical URL도 같은 기준인지 확인해야 합니다.',
      },
      {
        question: '인증서 발급은 얼마나 걸리나요?',
        answer: '서비스와 DNS 상태에 따라 다르지만 보통 몇 분에서 몇 시간 걸릴 수 있습니다. 도메인 인증 상태를 함께 확인하세요.',
      },
      {
        question: '혼합 콘텐츠는 왜 문제인가요?',
        answer: 'HTTPS 페이지 안에서 HTTP 리소스를 불러오면 보안 경고가 생기고 사용자 신뢰와 브라우저 동작에 영향을 줄 수 있습니다.',
      },
    ],
    sources: [
      { name: 'Cloudflare SSL/TLS documentation', url: 'https://developers.cloudflare.com/ssl/' },
      { name: 'Google HTTPS documentation', url: 'https://developers.google.com/search/docs/advanced/security/https' },
    ],
  },
  'github-pages-vs-wordpress-for-beginners': {
    example: {
      title: 'emfls.com이 정적 사이트를 선택한 이유',
      paragraphs: [
        '이 사이트는 회원 기능이나 복잡한 관리자 화면보다 빠른 정적 HTML, 명확한 URL, Git 기반 변경 이력이 더 중요했습니다. 그래서 WordPress 대신 Astro와 Cloudflare Pages 조합을 선택했습니다.',
        '반대로 글을 자주 쓰지만 코드 수정이 부담스럽고, 관리자 화면에서 미디어와 플러그인을 다루고 싶다면 WordPress가 더 현실적일 수 있습니다. 애드센스 관점에서는 도구보다 콘텐츠 완성도가 우선입니다.',
      ],
    },
    screenshot: {
      title: '준비할 스크린샷',
      caption: '정적 사이트의 GitHub 저장소 구조와 WordPress 관리자 글쓰기 화면을 비교하면 운영 방식 차이를 설명하기 좋습니다.',
    },
    checklist: [
      '코드 기반 관리가 가능한지 판단한다.',
      '관리자 화면과 플러그인이 필요한지 확인한다.',
      '호스팅 비용과 유지보수 부담을 비교한다.',
      'AdSense 심사용 필수 페이지를 직접 구성할 수 있는지 본다.',
    ],
    mistakes: [
      '도구만 바꾸면 AdSense 승인이 쉬워진다고 생각하는 것.',
      'WordPress 플러그인을 많이 설치해 성능과 보안을 망치는 것.',
      '정적 사이트를 선택하고도 글 관리 방식을 정하지 않는 것.',
    ],
    faqs: [
      {
        question: '초보자는 WordPress가 더 낫나요?',
        answer: '관리자 화면으로 글을 쓰고 싶다면 WordPress가 편합니다. 도메인, Git, 배포를 배우고 싶다면 정적 사이트도 좋은 선택입니다.',
      },
      {
        question: 'AdSense는 WordPress가 더 잘 승인되나요?',
        answer: '도구 자체보다 콘텐츠 품질, 정책 준수, 사이트 완성도가 중요합니다. 어떤 도구든 얕은 콘텐츠는 위험합니다.',
      },
      {
        question: '나중에 WordPress로 옮길 수 있나요?',
        answer: '가능하지만 URL 구조와 리디렉션, 이미지, 메타데이터 이전을 고려해야 합니다. 초기에 URL 정책을 안정적으로 잡아두는 것이 좋습니다.',
      },
    ],
    sources: [
      { name: 'GitHub Pages documentation', url: 'https://docs.github.com/pages' },
      { name: 'WordPress documentation', url: 'https://wordpress.org/documentation/' },
    ],
  },
};

export function getArticleEnhancement(slug: string): ArticleEnhancement {
  return articleEnhancements[slug] ?? {
    example: {
      title: '실전 적용 예시',
      paragraphs: ['이 글의 내용을 실제 사이트에 적용할 때는 변경한 값과 확인한 화면을 함께 기록하는 것이 좋습니다.'],
    },
    screenshot: {
      title: '준비할 스크린샷',
      caption: '설정 전후 화면과 오류 메시지를 함께 캡처해두면 나중에 원인을 추적하기 쉽습니다.',
    },
    checklist: ['대표 도메인 기준으로 접속을 확인한다.', '변경 전후 값을 기록한다.', '공식 문서를 함께 확인한다.'],
    mistakes: ['한 번에 여러 설정을 바꾸는 것.', '배포 완료 전에 결과를 판단하는 것.'],
    faqs: [
      {
        question: '바로 적용되지 않으면 실패인가요?',
        answer: '아닙니다. DNS, 배포, 검색 색인은 지연될 수 있으므로 상태와 시간을 함께 확인해야 합니다.',
      },
    ],
    sources: defaultSources,
  };
}
