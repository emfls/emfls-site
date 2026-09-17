# emfls-site Tasks

## 2026-09-17 P0 AdSense Audit remediation

- [x] 공개 article 상세 템플릿의 미완성 스크린샷 placeholder 제거 상태 확인
- [x] Privacy의 실제 hosting / source 관리 / GA4 / AdSense 설명 대조
- [x] 공개 AdSense 체크리스트의 과거 article 수·완료 주장 제거
- [x] 내부 링크 소스에서 legacy article URL 직접 참조 여부 확인
- [x] 홈페이지·카테고리 카드 읽기 시간 `분분` 중복 표시 수정
- [x] Production fresh HTTP QA — apex/SEO 파일/404 및 `www → apex` 301 확인

이번 작업은 P0 네 가지와 회귀 검증으로 제한한다. URL 구조, 레이아웃, 콘텐츠 대량 생성, 다른 `emfls-*` 저장소는 변경하지 않는다.

## Next Codex Action · Production DNS/HTTP QA

- Apex `https://emfls.com/`, `/privacy/`, `/articles/`, `/site-map/`은 fresh web 확인에서 정상 콘텐츠를 반환했다.
- `https://www.emfls.com/`은 emfls-site가 아닌 다른 사이트를 반환했다. Cloudflare DNS/Pages dashboard의 실제 custom domain·redirect 설정 확인 없이는 수정하지 않는다.
- `/sitemap.xml`, `/robots.txt`, `/ads.txt`, 404, canonical의 최종 fresh QA는 `www` 문제와 함께 재확인한다.
- Cloudflare Dashboard는 로그인 화면으로 확인되어 `emfls.com` zone 레코드, Pages Custom Domain, 연결 origin을 확인하지 못했다. 로그인 후 해당 세 항목을 확인하고 최소 변경한다.
- 실제 zone 확인: apex `emfls.com`은 `CNAME → emfls-site.pages.dev`(프록시됨). 변경 전 `www`는 `CNAME → emfls.github.io`였고 다른 사이트를 반환했다.
- 변경 완료: `www`를 `emfls-site.pages.dev`로 교체하고 Pages Custom Domain을 활성화했다. `emfls.github.io` 프로젝트와 URL 자체는 유지했다.
- Redirect Rule 완료: `https://www.* → https://${1}`, 301, query string 유지. 다른 EMFLS 서브도메인 레코드는 변경하지 않았다.
- fresh QA: apex `/` 200, `www` 루트·`/privacy/`·대표 article path는 동일 path의 apex로 301; `/privacy/`, `/articles/`, `/site-map/`, `/sitemap.xml`, `/robots.txt`, `/ads.txt` 200; 임의 경로 404; 대표 article canonical은 `https://emfls.com/articles/adsense-review-final-checklist/`; live sitemap/home에 `www.emfls.com` 참조 0건.

## 2026-09-17 Strict re-audit remediation

- [x] GA4 production 사용 상태와 공개 문구 정합성 수정
- [x] Privacy의 GA4·AdSense·광고 파트너·광고 설정 안내 보강
- [x] 공개 Phase/build/article 수 등 오래된 내부 사실 제거
- [x] article enhancement의 검증 자료를 실제 템플릿에 렌더링
- [x] build / stale-string / canonical / sitemap / 내부 링크 검사
- [ ] Production 재배포 후 fresh URL 및 Desktop 1440px / Mobile 390px visual QA

대표 first-party 보강 대상은 `cloudflare-dns-setup-for-beginners`, `custom-domain-https-troubleshooting`, `first-production-deployment-qa`, `github-to-cloudflare-pages`, `adsense-review-final-checklist`이며, 실제 `www.emfls.com` 오배치·DNS 교체·Pages 연결·301·path/query 유지·fresh QA 결과를 확인된 범위에서 검증 자료로 반영했다. 새 이미지 자산은 실제 Dashboard를 가장하지 않기 위해 생성하지 않았다.
