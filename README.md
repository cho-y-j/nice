# NicePay 결제 게이트웨이

NicePay API를 래핑한 독립 결제 마이크로서비스입니다.
어떤 프로젝트(Next.js, Spring Boot, Flutter 등)에서든 REST API로 결제를 연동할 수 있습니다.

## 지원 기능

- 신용카드 / 계좌이체 / 가상계좌 / 휴대폰 / 카카오페이 / 네이버페이 / 삼성페이
- 결제 취소 (전체/부분)
- 빌링 (정기결제)
- 웹훅 수신 및 로그
- Swagger API 문서 자동 생성

## 빠른 시작

```bash
git clone https://github.com/cho-y-j/nice.git
cd nice
npm install
cp .env.example .env  # .env 파일 편집하여 NicePay 키 입력
npm run dev
```

- 서버: http://localhost:3100
- API 문서: http://localhost:3100/docs
- 테스트 페이지: http://localhost:3100/test

## 연동 가이드

→ [docs/USAGE_GUIDE.md](docs/USAGE_GUIDE.md) 참고

## 기술 스택

Node.js + TypeScript + Fastify + Drizzle ORM + SQLite
