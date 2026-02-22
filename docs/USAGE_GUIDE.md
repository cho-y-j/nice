# NicePay 결제 게이트웨이 연동 가이드

## 목차

1. [아키텍처 개요](#1-아키텍처-개요)
2. [게이트웨이 서버 실행](#2-게이트웨이-서버-실행)
3. [결제 연동 (3단계)](#3-결제-연동-3단계)
4. [Next.js 연동 예제](#4-nextjs-연동-예제)
5. [Spring Boot 연동 예제](#5-spring-boot-연동-예제)
6. [HTML/바닐라 JS 연동](#6-html바닐라-js-연동)
7. [Flutter/모바일 웹뷰 연동](#7-flutter모바일-웹뷰-연동)
8. [결제 취소/환불](#8-결제-취소환불)
9. [빌링 (정기결제)](#9-빌링-정기결제)
10. [웹훅 설정](#10-웹훅-설정)
11. [배포](#11-배포)
12. [API 레퍼런스 요약](#12-api-레퍼런스-요약)
13. [트러블슈팅](#13-트러블슈팅)

---

## 1. 아키텍처 개요

```
┌──────────────────┐     ┌──────────────────┐     ┌─────────────┐
│  내 앱/웹 서버    │     │  결제 게이트웨이   │     │   NicePay   │
│  (Next.js 등)    │     │  localhost:3100   │     │   API 서버   │
└────────┬─────────┘     └────────┬─────────┘     └──────┬──────┘
         │                        │                       │
    ① POST /v1/payments/prepare   │                       │
         │ ──────────────────────→│                       │
         │    sdkParams 반환       │                       │
         │ ←──────────────────────│                       │
         │                        │                       │
    ② 프론트에서 AUTHNICE.requestPay(sdkParams) 호출       │
         │ ──────────────────────────────────────────────→│
         │                  결제창 표시 → 고객 결제         │
         │                        │                       │
    ③ NicePay가 returnUrl로 POST  │                       │
         │                        │←──────────────────────│
         │                        │  서명검증 + 금액검증    │
         │                        │  승인 API 호출 ───────→│
         │                        │←── 승인 결과 ──────────│
         │                        │  DB 저장              │
         │  302 리다이렉트 (성공/실패 URL)                  │
         │ ←──────────────────────│                       │
```

**핵심**: 내 앱은 ①번(prepare API 호출)만 하면 됩니다. 나머지는 게이트웨이가 처리합니다.

---

## 2. 게이트웨이 서버 실행

### 설치

```bash
cd nice
npm install
```

### .env 설정

```env
PORT=3100
HOST=0.0.0.0
NODE_ENV=production
LOG_LEVEL=info

# NicePay 키 (본인 가맹점 키)
NICEPAY_CLIENT_ID=R2_89b0448a77264cbd9e0f7ccd6a1421f7
NICEPAY_SECRET_KEY=dc2fa52d9880444eaa54820455bb9370
NICEPAY_MODE=production

# DB
DB_URL=./data/gateway.db

# API 키 (내 앱에서 게이트웨이 호출 시 사용)
API_KEYS=my-secret-api-key-1234

# 기본 리다이렉트 URL
DEFAULT_SUCCESS_URL=https://myapp.com/payment/success
DEFAULT_FAILURE_URL=https://myapp.com/payment/failure
```

### 실행

```bash
# 개발 모드 (자동 재시작)
npm run dev

# 운영 모드
npm run build && npm start

# Docker
docker compose up -d
```

서버가 실행되면:
- API: http://localhost:3100
- Swagger 문서: http://localhost:3100/docs
- 테스트 페이지: http://localhost:3100/test

---

## 3. 결제 연동 (3단계)

어떤 언어/프레임워크든 결제 연동은 **3단계**입니다.

### 단계 1: 서버에서 결제 준비 (prepare)

내 앱의 **백엔드**에서 게이트웨이에 결제 준비를 요청합니다.

```
POST http://게이트웨이주소:3100/v1/payments/prepare
Content-Type: application/json

{
  "orderId": "ORDER-20260223-001",     ← 내 앱의 주문번호 (유니크)
  "amount": 50000,                      ← 결제금액 (원)
  "goodsName": "프리미엄 플랜 1개월",     ← 상품명
  "method": "card",                     ← 결제수단
  "returnUrl": "http://게이트웨이주소:3100/v1/payments/approve",
  "successUrl": "https://myapp.com/payment/success",  ← 성공 시 이동할 URL
  "failureUrl": "https://myapp.com/payment/failure",  ← 실패 시 이동할 URL
  "buyerName": "홍길동",
  "buyerEmail": "user@example.com",
  "buyerTel": "01012345678"
}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "paymentId": "pay_abc123",
    "orderId": "ORDER-20260223-001",
    "amount": 50000,
    "status": "ready",
    "sdkParams": {
      "clientId": "R2_...",
      "method": "card",
      "orderId": "ORDER-20260223-001",
      "amount": 50000,
      "goodsName": "프리미엄 플랜 1개월",
      "returnUrl": "http://게이트웨이주소:3100/v1/payments/approve",
      "buyerName": "홍길동"
    },
    "sdkUrl": "https://pay.nicepay.co.kr/v1/js/"
  }
}
```

### 단계 2: 프론트엔드에서 결제창 열기

응답받은 `sdkParams`를 그대로 NicePay JS SDK에 전달합니다.

```html
<script src="https://pay.nicepay.co.kr/v1/js/"></script>
<script>
  // 서버에서 받은 sdkParams를 그대로 전달
  AUTHNICE.requestPay({
    ...sdkParams,
    fnError: function(result) {
      alert('결제 오류: ' + result.errorMsg);
    }
  });
</script>
```

### 단계 3: 결제 결과 처리

결제가 완료되면 고객이 `successUrl`로 리다이렉트됩니다.

```
https://myapp.com/payment/success?orderId=ORDER-20260223-001&status=paid&tid=nicepay_tid_123
```

내 앱에서 결제 상태를 확인하려면:

```
GET http://게이트웨이주소:3100/v1/payments/{tid}
```

또는 주문번호로:

```
GET http://게이트웨이주소:3100/v1/payments/find/{orderId}
```

**끝입니다!** 이 3단계가 전부입니다.

---

## 4. Next.js 연동 예제

### 서버 액션 (app/actions/payment.ts)

```typescript
'use server';

const GATEWAY_URL = process.env.PAYMENT_GATEWAY_URL || 'http://localhost:3100';

export async function createPayment(orderId: string, amount: number, goodsName: string) {
  const res = await fetch(`${GATEWAY_URL}/v1/payments/prepare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId,
      amount,
      goodsName,
      method: 'card',
      returnUrl: `${GATEWAY_URL}/v1/payments/approve`,
      successUrl: `${process.env.NEXT_PUBLIC_URL}/payment/success`,
      failureUrl: `${process.env.NEXT_PUBLIC_URL}/payment/failure`,
    }),
  });

  const data = await res.json();
  if (!data.success) throw new Error(data.error?.message);
  return data.data;  // { sdkParams, sdkUrl, paymentId, ... }
}

export async function getPaymentStatus(tid: string) {
  const res = await fetch(`${GATEWAY_URL}/v1/payments/${tid}`);
  return res.json();
}
```

### 결제 버튼 컴포넌트 (app/components/PayButton.tsx)

```tsx
'use client';

import { createPayment } from '@/actions/payment';
import Script from 'next/script';
import { useState } from 'react';

declare global {
  interface Window { AUTHNICE: any; }
}

export default function PayButton({ orderId, amount, goodsName }: {
  orderId: string;
  amount: number;
  goodsName: string;
}) {
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    setLoading(true);
    try {
      const { sdkParams } = await createPayment(orderId, amount, goodsName);

      window.AUTHNICE.requestPay({
        ...sdkParams,
        fnError: (result: any) => {
          alert('결제 오류: ' + result.errorMsg);
          setLoading(false);
        },
      });
    } catch (err: any) {
      alert('오류: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <>
      <Script src="https://pay.nicepay.co.kr/v1/js/" strategy="lazyOnload" />
      <button onClick={handlePay} disabled={loading}>
        {loading ? '처리 중...' : `${amount.toLocaleString()}원 결제하기`}
      </button>
    </>
  );
}
```

### 결제 성공 페이지 (app/payment/success/page.tsx)

```tsx
import { getPaymentStatus } from '@/actions/payment';

export default async function PaymentSuccess({ searchParams }: {
  searchParams: { orderId?: string; tid?: string; status?: string };
}) {
  const { tid } = searchParams;
  let payment = null;

  if (tid) {
    const res = await getPaymentStatus(tid);
    payment = res.data;
  }

  return (
    <div>
      <h1>결제 완료!</h1>
      {payment && (
        <div>
          <p>주문번호: {payment.orderId}</p>
          <p>금액: {payment.amount.toLocaleString()}원</p>
          <p>승인번호: {payment.approveNo}</p>
        </div>
      )}
    </div>
  );
}
```

### Next.js .env.local

```env
PAYMENT_GATEWAY_URL=http://localhost:3100
NEXT_PUBLIC_URL=http://localhost:3000
```

---

## 5. Spring Boot 연동 예제

### PaymentService.java

```java
@Service
public class PaymentService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final String gatewayUrl = "http://localhost:3100";

    public Map<String, Object> prepare(String orderId, int amount, String goodsName) {
        Map<String, Object> body = new HashMap<>();
        body.put("orderId", orderId);
        body.put("amount", amount);
        body.put("goodsName", goodsName);
        body.put("method", "card");
        body.put("returnUrl", gatewayUrl + "/v1/payments/approve");
        body.put("successUrl", "http://localhost:8080/payment/success");
        body.put("failureUrl", "http://localhost:8080/payment/failure");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        ResponseEntity<Map> res = restTemplate.postForEntity(
            gatewayUrl + "/v1/payments/prepare",
            new HttpEntity<>(body, headers),
            Map.class
        );

        return (Map<String, Object>) res.getBody().get("data");
    }

    public Map<String, Object> getStatus(String tid) {
        ResponseEntity<Map> res = restTemplate.getForEntity(
            gatewayUrl + "/v1/payments/" + tid,
            Map.class
        );
        return (Map<String, Object>) res.getBody().get("data");
    }
}
```

### PaymentController.java

```java
@Controller
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    @GetMapping("/checkout")
    public String checkout(Model model) {
        String orderId = "ORD-" + System.currentTimeMillis();
        Map<String, Object> data = paymentService.prepare(orderId, 50000, "프리미엄 플랜");

        model.addAttribute("sdkParams", data.get("sdkParams"));
        model.addAttribute("sdkUrl", data.get("sdkUrl"));
        return "checkout";
    }

    @GetMapping("/payment/success")
    public String success(@RequestParam String tid, Model model) {
        Map<String, Object> payment = paymentService.getStatus(tid);
        model.addAttribute("payment", payment);
        return "payment-success";
    }
}
```

### checkout.html (Thymeleaf)

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <script th:src="${sdkUrl}"></script>
</head>
<body>
    <button onclick="pay()">결제하기</button>

    <script th:inline="javascript">
        var sdkParams = [[${sdkParams}]];

        function pay() {
            AUTHNICE.requestPay({
                clientId: sdkParams.clientId,
                method: sdkParams.method,
                orderId: sdkParams.orderId,
                amount: sdkParams.amount,
                goodsName: sdkParams.goodsName,
                returnUrl: sdkParams.returnUrl,
                buyerName: sdkParams.buyerName,
                fnError: function(result) {
                    alert('결제 오류: ' + result.errorMsg);
                }
            });
        }
    </script>
</body>
</html>
```

---

## 6. HTML/바닐라 JS 연동

가장 단순한 형태:

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://pay.nicepay.co.kr/v1/js/"></script>
</head>
<body>
  <button onclick="pay()">결제하기</button>

  <script>
    async function pay() {
      // 1) prepare
      const res = await fetch('http://localhost:3100/v1/payments/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: 'ORD-' + Date.now(),
          amount: 1000,
          goodsName: '테스트 상품',
          method: 'card',
          returnUrl: 'http://localhost:3100/v1/payments/approve',
          successUrl: window.location.origin + '/success.html',
          failureUrl: window.location.origin + '/fail.html',
        })
      });
      const { data } = await res.json();

      // 2) 결제창 열기
      AUTHNICE.requestPay({
        ...data.sdkParams,
        fnError: function(result) {
          alert('에러: ' + result.errorMsg);
        }
      });
    }
  </script>
</body>
</html>
```

---

## 7. Flutter/모바일 웹뷰 연동

모바일 앱에서는 WebView로 결제 페이지를 띄우는 방식입니다.

```dart
// 1) prepare API 호출 (Dart)
final response = await http.post(
  Uri.parse('http://게이트웨이:3100/v1/payments/prepare'),
  headers: {'Content-Type': 'application/json'},
  body: jsonEncode({
    'orderId': 'ORD-${DateTime.now().millisecondsSinceEpoch}',
    'amount': 50000,
    'goodsName': '프리미엄 플랜',
    'method': 'card',
    'returnUrl': 'http://게이트웨이:3100/v1/payments/approve',
    'successUrl': 'https://myapp.com/payment/success',
    'failureUrl': 'https://myapp.com/payment/failure',
  }),
);

final sdkParams = jsonDecode(response.body)['data']['sdkParams'];

// 2) WebView에서 결제 페이지 로드
// 게이트웨이의 /test 페이지를 WebView로 열거나,
// 자체 HTML을 WebView에 로드하여 AUTHNICE.requestPay() 호출
```

---

## 8. 결제 취소/환불

### 전체 취소

```bash
curl -X POST http://localhost:3100/v1/payments/{tid}/cancel \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "고객 요청 취소",
    "orderId": "ORDER-20260223-001"
  }'
```

### 부분 취소

```bash
curl -X POST http://localhost:3100/v1/payments/{tid}/cancel \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "부분 환불",
    "orderId": "ORDER-20260223-001-C1",
    "cancelAmt": 10000
  }'
```

### 가상계좌 환불 (계좌 정보 필수)

```bash
curl -X POST http://localhost:3100/v1/payments/{tid}/cancel \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "가상계좌 환불",
    "orderId": "ORDER-20260223-001-C1",
    "refundAccount": "1234567890",
    "refundBankCode": "004",
    "refundHolder": "홍길동"
  }'
```

---

## 9. 빌링 (정기결제)

### 카드 등록

```bash
curl -X POST http://localhost:3100/v1/billing/register \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "BILL-REG-001",
    "cardNo": "5361123456781234",
    "expYear": "28",
    "expMonth": "12",
    "idNo": "900101",
    "cardPw": "12",
    "buyerName": "홍길동"
  }'
```

응답에서 `bid` (빌링키)를 저장해둡니다.

### 정기 결제 (매월 과금 등)

```bash
curl -X POST http://localhost:3100/v1/billing/{bid}/charge \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "SUB-202602-001",
    "amount": 29900,
    "goodsName": "월간 구독"
  }'
```

### 카드 삭제

```bash
curl -X POST http://localhost:3100/v1/billing/{bid}/expire \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "BILL-DEL-001"
  }'
```

---

## 10. 웹훅 설정

NicePay 관리자 페이지에서 웹훅 URL을 등록합니다:

```
https://내도메인.com:3100/v1/webhooks/nicepay
```

웹훅이 오면 자동으로:
- 서명 검증
- 결제 상태 DB 업데이트
- 로그 저장

웹훅 로그 확인:

```bash
curl http://localhost:3100/v1/webhooks/logs?orderId=ORDER-001
```

### 로컬 테스트 (ngrok)

```bash
ngrok http 3100
# https://abc123.ngrok.io 주소를 NicePay 관리자에 등록
```

---

## 11. 배포

### Docker (추천)

```bash
docker compose up -d
```

### PM2

```bash
npm run build
pm2 start dist/index.js --name nicepay-gateway
```

### 운영 체크리스트

- [ ] `.env`에 운영 NicePay 키 설정
- [ ] `NICEPAY_MODE=production`
- [ ] `API_KEYS`를 안전한 값으로 변경
- [ ] HTTPS 설정 (nginx 리버스 프록시)
- [ ] NicePay 관리자에서 웹훅 URL 등록
- [ ] 방화벽에서 NicePay 웹훅 IP 허용: `121.133.126.86`, `121.133.126.87`

---

## 12. API 레퍼런스 요약

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/health` | 서비스 상태 |
| POST | `/v1/payments/prepare` | 결제 준비 |
| POST | `/v1/payments/approve` | NicePay 인증 결과 수신 (자동) |
| GET | `/v1/payments/:tid` | TID로 결제 조회 |
| GET | `/v1/payments/find/:orderId` | 주문번호로 결제 조회 |
| POST | `/v1/payments/:tid/cancel` | 결제 취소/환불 |
| POST | `/v1/billing/register` | 빌링키 등록 |
| POST | `/v1/billing/:bid/charge` | 빌링 결제 |
| POST | `/v1/billing/:bid/expire` | 빌링키 삭제 |
| POST | `/v1/webhooks/nicepay` | NicePay 웹훅 수신 (자동) |
| GET | `/v1/webhooks/logs` | 웹훅 로그 조회 |

전체 API 스키마: http://localhost:3100/docs

---

## 13. 트러블슈팅

### "clientId가 유효하지 않습니다"
- `.env`의 `NICEPAY_CLIENT_ID`가 정확한지 확인
- Server 승인 모델용 키인지 확인 (R2_ 접두사)

### 결제창이 안 뜸
- 브라우저 팝업 차단 해제 (Safari는 기본 차단)
- CSP 헤더에 `pay.nicepay.co.kr` 허용 필요

### 결제 성공 후 리다이렉트 안 됨
- `successUrl`, `failureUrl`이 올바른지 확인
- 게이트웨이 서버가 실행 중인지 확인

### 망취소 발생
- 승인 API 타임아웃 시 자동으로 망취소 실행
- 서버 로그에서 `NETWORK_CANCELLED` 확인
- NicePay API 서버 상태 확인

### 금액 변조 감지
- `AMOUNT_MISMATCH` 에러 = prepare 시 금액과 결제 시 금액이 다름
- 프론트에서 금액을 변경하면 자동 차단됨
