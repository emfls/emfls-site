# EMFLS Guide

개인 도메인, DNS, GitHub Pages, 정적 웹사이트 운영을 다루는 한국어 정보 사이트입니다.

## 로컬 실행

```bash
npm install
npm run dev
```

기본 개발 서버는 Astro 안내에 따라 실행됩니다. 현재 검증에는 `http://127.0.0.1:4321`을 사용했습니다.

## 빌드

```bash
npm run build
```

정적 결과물은 `dist/`에 생성됩니다.

## Cloudflare Pages 배포

GitHub 저장소를 Cloudflare Pages에 연결해 배포하는 것을 기준으로 합니다.

- Framework preset: `Astro`
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: 비워둠

## 도메인 설정

대표 도메인은 `emfls.com`입니다.

- Astro site URL: `https://emfls.com`
- robots sitemap: `https://emfls.com/sitemap-index.xml`

Cloudflare Pages에서 Custom domain으로 `emfls.com`을 연결합니다. 가비아에서 도메인 네임서버를 Cloudflare가 안내하는 네임서버로 변경하면 DNS를 Cloudflare에서 관리할 수 있습니다.

## AdSense 심사 전 남은 작업

- GitHub 원격 저장소에 push.
- Cloudflare Pages 프로젝트 생성.
- Cloudflare Pages 배포 성공 확인.
- `https://emfls.com` HTTPS 접속 확인.
- `www.emfls.com` 처리 방식 확인.
- Google Search Console 도메인 속성 등록.
- 사이트맵 제출.
- 실제 문의 이메일 주소 수신 가능 여부 확인.
- AdSense 사이트 추가 후 제공되는 확인 코드를 `<head>`에 반영.
- 승인 후 실제 게시자 ID로 `ads.txt` 추가.
