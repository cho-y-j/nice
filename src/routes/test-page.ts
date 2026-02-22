import { FastifyInstance } from 'fastify';
import { nicepayConfig } from '../config/nicepay.js';
import { config } from '../config/index.js';

export async function testPageRoutes(app: FastifyInstance) {
  // NicePay 공식 샘플 그대로 적용한 테스트 결제 페이지
  app.get('/test', { schema: { hide: true } }, async (request, reply) => {
    const gatewayUrl = `http://localhost:${config.port}`;

    return reply
      .header('Content-Type', 'text/html; charset=utf-8')
      .header('Content-Security-Policy', "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;")
      .send(`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NicePay 테스트 결제</title>
  <style>
    body { font-family: sans-serif; max-width: 500px; margin: 40px auto; padding: 0 20px; }
    h1 { font-size: 20px; margin-bottom: 4px; }
    .sandbox { color: #e65100; font-size: 13px; margin-bottom: 24px; }
    label { display: block; font-size: 13px; color: #555; margin-top: 12px; }
    input, select { width: 100%; padding: 8px; margin-top: 4px; border: 1px solid #ccc; border-radius: 6px; font-size: 14px; }
    button { margin-top: 20px; width: 100%; padding: 14px; background: #1a73e8; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; }
    button:hover { background: #1557b0; }
    pre { background: #222; color: #eee; padding: 12px; border-radius: 6px; font-size: 11px; overflow-x: auto; margin-top: 16px; white-space: pre-wrap; word-break: break-all; max-height: 400px; overflow-y: auto; }
  </style>
</head>
<body>
  <h1>NicePay Gateway 테스트</h1>
  <div class="sandbox">SANDBOX MODE - 실제 결제 없음</div>

  <label>결제수단</label>
  <select id="method">
    <option value="card">신용카드</option>
    <option value="bank">계좌이체</option>
    <option value="vbank">가상계좌</option>
    <option value="cellphone">휴대폰</option>
  </select>

  <label>상품명</label>
  <input id="goodsName" value="나이스페이-상품" />

  <label>금액 (원)</label>
  <input id="amount" type="number" value="1004" />

  <label>구매자</label>
  <input id="buyerName" value="홍길동" />

  <button onclick="pay()">결제하기</button>

  <pre id="log">준비 완료
ClientID: ${nicepayConfig.clientId}
SDK: ${nicepayConfig.sdk}
</pre>

  <!-- NicePay JS SDK (공식 URL) -->
  <script src="https://pay.nicepay.co.kr/v1/js/"></script>

  <script>
    var log = document.getElementById('log');
    function addLog(msg) { log.textContent += '\\n' + msg; log.scrollTop = log.scrollHeight; }

    function pay() {
      var orderId = Math.random().toString(16).substr(2, 8);
      var amount = parseInt(document.getElementById('amount').value);
      var goodsName = document.getElementById('goodsName').value;
      var method = document.getElementById('method').value;
      var buyerName = document.getElementById('buyerName').value;

      addLog('\\n--- 결제 시작 ---');
      addLog('orderId: ' + orderId);
      addLog('amount: ' + amount);

      // 1) prepare API 호출
      fetch('${gatewayUrl}/v1/payments/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderId,
          amount: amount,
          goodsName: goodsName,
          method: method,
          returnUrl: '${gatewayUrl}/v1/payments/approve',
          successUrl: '${gatewayUrl}/test/result?status=paid',
          failureUrl: '${gatewayUrl}/test/result?status=fail',
          buyerName: buyerName
        })
      })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (!data.success) {
          addLog('ERROR: ' + JSON.stringify(data));
          return;
        }
        addLog('prepare 성공: ' + data.data.paymentId);
        addLog('SDK 호출 중...');

        // 2) NicePay 결제창 호출 (공식 샘플과 동일)
        AUTHNICE.requestPay({
          clientId: '${nicepayConfig.clientId}',
          method: method,
          orderId: orderId,
          amount: amount,
          goodsName: goodsName,
          returnUrl: '${gatewayUrl}/v1/payments/approve',
          fnError: function(result) {
            addLog('NicePay 에러: ' + JSON.stringify(result));
          }
        });
      })
      .catch(function(err) {
        addLog('fetch 에러: ' + err.message);
      });
    }
  </script>
</body>
</html>`);
  });

  // 결제 결과 페이지
  app.get('/test/result', { schema: { hide: true } }, async (request, reply) => {
    const query = request.query as Record<string, string>;
    const gatewayUrl = `http://localhost:${config.port}`;

    return reply
      .header('Content-Type', 'text/html; charset=utf-8')
      .header('Content-Security-Policy', "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;")
      .send(`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>결제 결과</title>
  <style>
    body { font-family: sans-serif; max-width: 500px; margin: 40px auto; padding: 0 20px; text-align: center; }
    .ok { color: green; font-size: 48px; }
    .fail { color: red; font-size: 48px; }
    pre { background: #222; color: #eee; padding: 12px; border-radius: 6px; font-size: 11px; text-align: left; overflow-x: auto; white-space: pre-wrap; word-break: break-all; }
    a { display: inline-block; margin-top: 20px; padding: 10px 24px; background: #1a73e8; color: white; text-decoration: none; border-radius: 6px; }
  </style>
</head>
<body>
  <div class="${query.status === 'paid' ? 'ok' : 'fail'}">${query.status === 'paid' ? 'OK' : 'FAIL'}</div>
  <h2>${query.status === 'paid' ? '결제 성공!' : '결제 실패'}</h2>
  <p>orderId: ${query.orderId || 'N/A'}</p>
  <p>tid: ${query.tid || 'N/A'}</p>
  <p>code: ${query.code || ''} ${query.msg ? decodeURIComponent(query.msg) : ''}</p>
  <pre id="detail">로딩 중...</pre>
  <a href="/test">다시 테스트</a>

  <script>
    var tid = '${query.tid || ''}';
    if (tid) {
      fetch('${gatewayUrl}/v1/payments/' + tid)
        .then(function(r) { return r.json(); })
        .then(function(d) { document.getElementById('detail').textContent = JSON.stringify(d, null, 2); })
        .catch(function(e) { document.getElementById('detail').textContent = e.message; });
    } else {
      document.getElementById('detail').textContent = 'TID 없음';
    }
  </script>
</body>
</html>`);
  });
}
