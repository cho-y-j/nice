import { FastifyInstance } from 'fastify';
import { nicepayConfig } from '../config/nicepay.js';
import { config } from '../config/index.js';

export async function testPageRoutes(app: FastifyInstance) {
  app.get('/test', { schema: { hide: true } }, async (request, reply) => {
    const gatewayUrl = `http://localhost:${config.port}`;
    const isProduction = nicepayConfig.mode === 'production';
    const modeLabel = isProduction ? '운영 모드 - 실제 결제됩니다!' : 'SANDBOX MODE - 실제 결제 없음';
    const modeColor = isProduction ? '#d32f2f' : '#e65100';

    return reply
      .header('Content-Type', 'text/html; charset=utf-8')
      .header('Content-Security-Policy', "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;")
      .send(`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NicePay Gateway 테스트</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; color: #333; }
    .header { background: #1a73e8; color: white; padding: 16px 24px; }
    .header h1 { font-size: 18px; font-weight: 600; }
    .header .mode { color: ${isProduction ? '#ffcdd2' : '#fff9c4'}; font-size: 12px; margin-top: 4px; }
    .header nav { margin-top: 8px; }
    .header nav a { color: rgba(255,255,255,0.8); text-decoration: none; font-size: 13px; margin-right: 16px; }
    .header nav a:hover { color: white; }
    .container { max-width: 800px; margin: 0 auto; padding: 20px; }

    /* Tabs */
    .tabs { display: flex; gap: 0; border-bottom: 2px solid #e0e0e0; margin-bottom: 20px; }
    .tab { padding: 12px 20px; font-size: 14px; font-weight: 600; cursor: pointer; border: none; background: none; color: #888; border-bottom: 2px solid transparent; margin-bottom: -2px; }
    .tab:hover { color: #333; }
    .tab.active { color: #1a73e8; border-bottom-color: #1a73e8; }
    .panel { display: none; }
    .panel.active { display: block; }

    /* Form */
    .card { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 16px; }
    .card h2 { font-size: 16px; margin-bottom: 4px; }
    .card p.desc { font-size: 13px; color: #888; margin-bottom: 16px; }
    label { display: block; font-size: 13px; color: #555; margin-top: 12px; font-weight: 500; }
    label:first-child { margin-top: 0; }
    input, select { width: 100%; padding: 10px 12px; margin-top: 4px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; transition: border 0.2s; }
    input:focus, select:focus { border-color: #1a73e8; }
    .row { display: flex; gap: 12px; }
    .row > div { flex: 1; }
    .btn { margin-top: 16px; width: 100%; padding: 14px; border: none; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-primary { background: #1a73e8; color: white; }
    .btn-primary:hover:not(:disabled) { background: #1557b0; }
    .btn-green { background: #2e7d32; color: white; }
    .btn-green:hover:not(:disabled) { background: #1b5e20; }
    .btn-orange { background: #e65100; color: white; }
    .btn-orange:hover:not(:disabled) { background: #bf360c; }
    .btn-red { background: #c62828; color: white; }
    .btn-red:hover:not(:disabled) { background: #b71c1c; }
    .btn-sm { padding: 10px 16px; font-size: 13px; margin-top: 8px; width: auto; }

    /* Log */
    .log-area { margin-top: 20px; }
    .log-area h3 { font-size: 13px; color: #888; margin-bottom: 8px; cursor: pointer; }
    pre { background: #1e1e1e; color: #d4d4d4; padding: 16px; border-radius: 8px; font-size: 12px; overflow-x: auto; white-space: pre-wrap; word-break: break-all; max-height: 300px; overflow-y: auto; font-family: 'SF Mono', Consolas, monospace; }

    /* Result */
    .result { padding: 16px; border-radius: 8px; margin-top: 12px; font-size: 14px; }
    .result.success { background: #e8f5e9; color: #1b5e20; border: 1px solid #a5d6a7; }
    .result.error { background: #fbe9e7; color: #bf360c; border: 1px solid #ffab91; }

    /* Billing list */
    .billing-item { display: flex; align-items: center; justify-content: space-between; padding: 12px; border: 1px solid #e0e0e0; border-radius: 8px; margin-top: 8px; }
    .billing-item .info { font-size: 13px; }
    .billing-item .info .bid { font-weight: 600; font-family: monospace; }
    .billing-item .info .card-info { color: #888; font-size: 12px; }
    .billing-item .actions { display: flex; gap: 8px; }

    /* Payment history */
    .history-item { padding: 12px; border: 1px solid #e0e0e0; border-radius: 8px; margin-top: 8px; }
    .history-item .top { display: flex; justify-content: space-between; align-items: center; }
    .history-item .tid { font-family: monospace; font-size: 12px; color: #888; }
    .history-item .amount { font-weight: 600; }
    .status-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .status-paid { background: #e8f5e9; color: #2e7d32; }
    .status-ready { background: #fff3e0; color: #e65100; }
    .status-cancelled { background: #fce4ec; color: #c62828; }
    .status-failed { background: #efebe9; color: #5d4037; }
  </style>
</head>
<body>
  <div class="header">
    <h1>NicePay Gateway 테스트 콘솔</h1>
    <div class="mode">${modeLabel}</div>
    <nav>
      <a href="/guide">사용 가이드</a>
      <a href="/docs">API 문서 (Swagger)</a>
      <a href="/health">상태 확인</a>
    </nav>
  </div>

  <div class="container">
    <div class="tabs">
      <button class="tab active" onclick="showTab('pay')">일반결제</button>
      <button class="tab" onclick="showTab('easy')">간편결제</button>
      <button class="tab" onclick="showTab('billing')">정기결제 (빌링)</button>
      <button class="tab" onclick="showTab('manage')">결제관리</button>
    </div>

    <!-- ========== 일반결제 ========== -->
    <div id="panel-pay" class="panel active">
      <div class="card">
        <h2>일반결제</h2>
        <p class="desc">신용카드 / 계좌이체 / 가상계좌 / 휴대폰 결제</p>

        <label>결제수단</label>
        <select id="pay-method">
          <option value="card">신용카드</option>
          <option value="directCard">신용카드 (카드사 바로)</option>
          <option value="bank">계좌이체</option>
          <option value="vbank">가상계좌</option>
          <option value="cellphone">휴대폰</option>
        </select>

        <label>상품명</label>
        <input id="pay-goods" value="테스트상품" />

        <div class="row">
          <div>
            <label>금액 (원)</label>
            <input id="pay-amount" type="number" value="1000" />
          </div>
          <div>
            <label>구매자</label>
            <input id="pay-buyer" value="홍길동" />
          </div>
        </div>

        <button class="btn btn-primary" id="payBtn" onclick="doPay('pay')">결제하기</button>
      </div>
    </div>

    <!-- ========== 간편결제 ========== -->
    <div id="panel-easy" class="panel">
      <div class="card">
        <h2>간편결제</h2>
        <p class="desc">카카오페이 / 네이버페이 / 삼성페이 / 통합 간편결제</p>

        <label>결제수단</label>
        <select id="easy-method">
          <option value="cardAndEasyPay">카드 + 간편결제 (통합)</option>
          <option value="kakaopay">카카오페이</option>
          <option value="naverpay">네이버페이</option>
          <option value="samsungpay">삼성페이</option>
        </select>

        <label>상품명</label>
        <input id="easy-goods" value="테스트상품" />

        <div class="row">
          <div>
            <label>금액 (원)</label>
            <input id="easy-amount" type="number" value="1000" />
          </div>
          <div>
            <label>구매자</label>
            <input id="easy-buyer" value="홍길동" />
          </div>
        </div>

        <button class="btn btn-green" id="easyBtn" onclick="doPay('easy')">간편결제하기</button>
      </div>
    </div>

    <!-- ========== 정기결제 (빌링) ========== -->
    <div id="panel-billing" class="panel">
      <div class="card">
        <h2>카드 등록 (빌링키 발급)</h2>
        <p class="desc">카드를 한 번 등록하면 이후 자동 결제 가능 (넷플릭스 방식)</p>

        <div class="row">
          <div>
            <label>카드번호</label>
            <input id="bill-cardNo" placeholder="1234567890123456" maxlength="16" />
          </div>
        </div>

        <div class="row">
          <div>
            <label>유효기간 (월)</label>
            <input id="bill-expMonth" placeholder="12" maxlength="2" />
          </div>
          <div>
            <label>유효기간 (년)</label>
            <input id="bill-expYear" placeholder="28" maxlength="2" />
          </div>
        </div>

        <div class="row">
          <div>
            <label>생년월일 6자리</label>
            <input id="bill-idNo" placeholder="900101" maxlength="6" />
          </div>
          <div>
            <label>카드 비밀번호 앞 2자리</label>
            <input id="bill-cardPw" type="password" placeholder="12" maxlength="2" />
          </div>
        </div>

        <label>카드 소유자</label>
        <input id="bill-buyerName" value="홍길동" />

        <button class="btn btn-primary" id="regBtn" onclick="registerCard()">카드 등록하기</button>
      </div>

      <div class="card">
        <h2>등록된 카드 목록</h2>
        <p class="desc">등록된 빌링키로 결제 또는 삭제할 수 있습니다</p>
        <div id="billing-list"><span style="color:#aaa">등록된 카드가 없습니다</span></div>
      </div>

      <div class="card" id="charge-section" style="display:none">
        <h2>빌링 결제</h2>
        <p class="desc">선택한 카드로 즉시 결제 (결제창 없이 서버에서 바로 처리)</p>

        <div id="charge-bid-display" style="font-size:13px; color:#1a73e8; font-weight:600; margin-bottom:12px;"></div>

        <label>상품명</label>
        <input id="charge-goods" value="월간 구독" />

        <div class="row">
          <div>
            <label>금액 (원)</label>
            <input id="charge-amount" type="number" value="9900" />
          </div>
          <div>
            <label>구매자</label>
            <input id="charge-buyer" value="홍길동" />
          </div>
        </div>

        <button class="btn btn-green" id="chargeBtn" onclick="chargeBilling()">결제하기 (결제창 없음)</button>
      </div>
    </div>

    <!-- ========== 결제관리 ========== -->
    <div id="panel-manage" class="panel">
      <div class="card">
        <h2>결제 조회</h2>
        <p class="desc">TID 또는 주문번호로 결제 상태를 확인합니다</p>

        <div class="row">
          <div>
            <label>TID</label>
            <input id="q-tid" placeholder="nicepay_tid_..." />
          </div>
          <div>
            <label>또는 주문번호</label>
            <input id="q-orderId" placeholder="TEST-..." />
          </div>
        </div>
        <button class="btn btn-primary btn-sm" onclick="queryPayment()">조회</button>
        <div id="query-result"></div>
      </div>

      <div class="card">
        <h2>결제 취소</h2>
        <p class="desc">TID로 결제를 전체 또는 부분 취소합니다</p>

        <label>TID (필수)</label>
        <input id="cancel-tid" placeholder="nicepay_tid_..." />

        <label>취소 사유</label>
        <input id="cancel-reason" value="테스트 취소" />

        <div class="row">
          <div>
            <label>부분취소 금액 (비우면 전체취소)</label>
            <input id="cancel-amount" type="number" placeholder="전체취소" />
          </div>
        </div>

        <button class="btn btn-red" onclick="cancelPayment()">결제 취소</button>
        <div id="cancel-result"></div>
      </div>

      <div class="card">
        <h2>최근 결제 내역</h2>
        <div id="history-list"><span style="color:#aaa">이 세션에서 결제한 내역이 표시됩니다</span></div>
      </div>
    </div>

    <!-- Log -->
    <div class="log-area">
      <h3 onclick="document.getElementById('log').style.display=document.getElementById('log').style.display==='none'?'block':'none'">로그 (클릭하여 열기/닫기)</h3>
      <pre id="log" style="display:none">준비 완료 | 모드: ${nicepayConfig.mode} | ClientID: ${nicepayConfig.clientId}</pre>
    </div>
  </div>

  <!-- NicePay JS SDK -->
  <script src="https://pay.nicepay.co.kr/v1/js/"></script>

  <script>
    var GATEWAY = '${gatewayUrl}';
    var CLIENT_ID = '${nicepayConfig.clientId}';
    var billingKeys = [];
    var selectedBid = null;
    var paymentHistory = [];

    // === Tab ===
    function showTab(name) {
      document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
      document.querySelectorAll('.panel').forEach(function(p) { p.classList.remove('active'); });
      event.target.classList.add('active');
      document.getElementById('panel-' + name).classList.add('active');
    }

    // === Log ===
    function addLog(msg) {
      var log = document.getElementById('log');
      log.textContent += '\\n' + msg;
      log.scrollTop = log.scrollHeight;
    }

    function showResult(elId, success, msg) {
      var el = document.getElementById(elId);
      el.innerHTML = '<div class="result ' + (success ? 'success' : 'error') + '">' + msg + '</div>';
    }

    // === 일반결제 & 간편결제 ===
    function doPay(prefix) {
      var method = document.getElementById(prefix + '-method').value;
      var goodsName = document.getElementById(prefix + '-goods').value;
      var amount = parseInt(document.getElementById(prefix + '-amount').value);
      var buyerName = document.getElementById(prefix + '-buyer').value;
      var orderId = 'TEST-' + Date.now();

      var btn = prefix === 'pay' ? document.getElementById('payBtn') : document.getElementById('easyBtn');
      btn.disabled = true;
      var origText = btn.textContent;
      btn.textContent = '처리 중...';

      addLog('\\n--- ' + method + ' 결제 시작 ---');
      addLog('orderId: ' + orderId + ' / amount: ' + amount);

      fetch(GATEWAY + '/v1/payments/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderId,
          amount: amount,
          goodsName: goodsName,
          method: method,
          returnUrl: GATEWAY + '/v1/payments/approve',
          successUrl: GATEWAY + '/test/result?status=paid',
          failureUrl: GATEWAY + '/test/result?status=fail',
          buyerName: buyerName
        })
      })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (!data.success) {
          addLog('ERROR: ' + JSON.stringify(data.error));
          btn.disabled = false;
          btn.textContent = origText;
          return;
        }
        addLog('prepare OK: ' + data.data.paymentId);
        addLog('NicePay 결제창 호출...');

        AUTHNICE.requestPay({
          clientId: CLIENT_ID,
          method: method,
          orderId: orderId,
          amount: amount,
          goodsName: goodsName,
          returnUrl: GATEWAY + '/v1/payments/approve',
          fnError: function(result) {
            addLog('NicePay ERROR: ' + JSON.stringify(result));
            btn.disabled = false;
            btn.textContent = origText;
          }
        });
      })
      .catch(function(err) {
        addLog('FETCH ERROR: ' + err.message);
        btn.disabled = false;
        btn.textContent = origText;
      });
    }

    // === 빌링: 카드 등록 ===
    function registerCard() {
      var btn = document.getElementById('regBtn');
      btn.disabled = true;
      btn.textContent = '등록 중...';

      var body = {
        orderId: 'BILL-REG-' + Date.now(),
        cardNo: document.getElementById('bill-cardNo').value,
        expMonth: document.getElementById('bill-expMonth').value,
        expYear: document.getElementById('bill-expYear').value,
        idNo: document.getElementById('bill-idNo').value,
        cardPw: document.getElementById('bill-cardPw').value,
        buyerName: document.getElementById('bill-buyerName').value
      };

      addLog('\\n--- 카드 등록 시작 ---');
      addLog('orderId: ' + body.orderId);

      fetch(GATEWAY + '/v1/billing/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        btn.disabled = false;
        btn.textContent = '카드 등록하기';

        if (!data.success) {
          addLog('ERROR: ' + JSON.stringify(data.error || data));
          alert('카드 등록 실패: ' + (data.error ? data.error.message : JSON.stringify(data)));
          return;
        }

        addLog('카드 등록 성공! bid: ' + data.data.bid);
        billingKeys.push(data.data);
        renderBillingList();

        // 입력 초기화
        document.getElementById('bill-cardNo').value = '';
        document.getElementById('bill-expMonth').value = '';
        document.getElementById('bill-expYear').value = '';
        document.getElementById('bill-idNo').value = '';
        document.getElementById('bill-cardPw').value = '';
      })
      .catch(function(err) {
        btn.disabled = false;
        btn.textContent = '카드 등록하기';
        addLog('FETCH ERROR: ' + err.message);
      });
    }

    // === 빌링: 목록 렌더 ===
    function renderBillingList() {
      var el = document.getElementById('billing-list');
      if (billingKeys.length === 0) {
        el.innerHTML = '<span style="color:#aaa">등록된 카드가 없습니다</span>';
        return;
      }
      el.innerHTML = billingKeys.map(function(b) {
        var cardDisplay = b.cardName || b.cardCode || '카드';
        var masked = b.cardNumMasked || '****';
        return '<div class="billing-item">' +
          '<div class="info">' +
            '<div class="bid">BID: ' + b.bid + '</div>' +
            '<div class="card-info">' + cardDisplay + ' ' + masked + '</div>' +
          '</div>' +
          '<div class="actions">' +
            '<button class="btn btn-green btn-sm" onclick="selectBid(\\'' + b.bid + '\\')">결제</button>' +
            '<button class="btn btn-red btn-sm" onclick="expireBid(\\'' + b.bid + '\\')">삭제</button>' +
          '</div>' +
        '</div>';
      }).join('');
    }

    // === 빌링: 결제 선택 ===
    function selectBid(bid) {
      selectedBid = bid;
      document.getElementById('charge-section').style.display = 'block';
      document.getElementById('charge-bid-display').textContent = '선택된 빌링키: ' + bid;
      document.getElementById('charge-section').scrollIntoView({ behavior: 'smooth' });
    }

    // === 빌링: 결제 실행 ===
    function chargeBilling() {
      if (!selectedBid) { alert('빌링키를 선택하세요'); return; }

      var btn = document.getElementById('chargeBtn');
      btn.disabled = true;
      btn.textContent = '결제 처리 중...';

      var body = {
        orderId: 'SUB-' + Date.now(),
        amount: parseInt(document.getElementById('charge-amount').value),
        goodsName: document.getElementById('charge-goods').value,
        buyerName: document.getElementById('charge-buyer').value
      };

      addLog('\\n--- 빌링 결제 ---');
      addLog('bid: ' + selectedBid + ' / amount: ' + body.amount);

      fetch(GATEWAY + '/v1/billing/' + selectedBid + '/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        btn.disabled = false;
        btn.textContent = '결제하기 (결제창 없음)';

        if (!data.success) {
          addLog('ERROR: ' + JSON.stringify(data.error || data));
          alert('빌링 결제 실패: ' + (data.error ? data.error.message : JSON.stringify(data)));
          return;
        }

        addLog('빌링 결제 성공! tid: ' + data.data.tid);
        paymentHistory.unshift({ tid: data.data.tid, orderId: body.orderId, amount: body.amount, status: 'paid', goodsName: body.goodsName, method: 'billing' });
        renderHistory();
        alert('결제 완료! ' + body.amount.toLocaleString() + '원\\nTID: ' + data.data.tid);
      })
      .catch(function(err) {
        btn.disabled = false;
        btn.textContent = '결제하기 (결제창 없음)';
        addLog('FETCH ERROR: ' + err.message);
      });
    }

    // === 빌링: 카드 삭제 ===
    function expireBid(bid) {
      if (!confirm('빌링키 ' + bid + '을(를) 삭제하시겠습니까?')) return;

      addLog('\\n--- 빌링키 삭제 ---');
      addLog('bid: ' + bid);

      fetch(GATEWAY + '/v1/billing/' + bid + '/expire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: 'BILL-DEL-' + Date.now() })
      })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (!data.success) {
          addLog('ERROR: ' + JSON.stringify(data.error || data));
          alert('삭제 실패');
          return;
        }
        addLog('빌링키 삭제 성공');
        billingKeys = billingKeys.filter(function(b) { return b.bid !== bid; });
        if (selectedBid === bid) {
          selectedBid = null;
          document.getElementById('charge-section').style.display = 'none';
        }
        renderBillingList();
      })
      .catch(function(err) { addLog('FETCH ERROR: ' + err.message); });
    }

    // === 결제 조회 ===
    function queryPayment() {
      var tid = document.getElementById('q-tid').value.trim();
      var orderId = document.getElementById('q-orderId').value.trim();

      if (!tid && !orderId) { alert('TID 또는 주문번호를 입력하세요'); return; }

      var url = tid
        ? GATEWAY + '/v1/payments/' + tid
        : GATEWAY + '/v1/payments/find/' + orderId;

      addLog('\\n--- 결제 조회: ' + (tid || orderId) + ' ---');

      fetch(url)
        .then(function(r) { return r.json(); })
        .then(function(data) {
          addLog('조회 결과: ' + JSON.stringify(data).substring(0, 200));
          if (data.success && data.data) {
            var d = data.data;
            showResult('query-result', true,
              '<b>' + d.goodsName + '</b> | ' + (d.amount || 0).toLocaleString() + '원<br>' +
              '상태: <span class="status-badge status-' + d.status + '">' + d.status + '</span><br>' +
              'TID: ' + (d.tid || 'N/A') + '<br>' +
              'orderId: ' + d.orderId + '<br>' +
              '<small>' + JSON.stringify(d, null, 2).substring(0, 500) + '</small>'
            );
          } else {
            showResult('query-result', false, data.error ? data.error.message : '조회 실패');
          }
        })
        .catch(function(err) { showResult('query-result', false, err.message); });
    }

    // === 결제 취소 ===
    function cancelPayment() {
      var tid = document.getElementById('cancel-tid').value.trim();
      if (!tid) { alert('TID를 입력하세요'); return; }

      var reason = document.getElementById('cancel-reason').value;
      var cancelAmt = document.getElementById('cancel-amount').value;

      var body = {
        reason: reason,
        orderId: 'CANCEL-' + Date.now()
      };
      if (cancelAmt) body.cancelAmt = parseInt(cancelAmt);

      addLog('\\n--- 결제 취소 ---');
      addLog('tid: ' + tid + ' / amount: ' + (cancelAmt || '전체'));

      fetch(GATEWAY + '/v1/payments/' + tid + '/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        addLog('취소 결과: ' + JSON.stringify(data).substring(0, 300));
        if (data.success) {
          showResult('cancel-result', true, '취소 성공! 잔액: ' + (data.data.balanceAmt || 0).toLocaleString() + '원');
          // 히스토리 업데이트
          paymentHistory.forEach(function(h) {
            if (h.tid === tid) h.status = 'cancelled';
          });
          renderHistory();
        } else {
          showResult('cancel-result', false, '취소 실패: ' + (data.error ? data.error.message : JSON.stringify(data)));
        }
      })
      .catch(function(err) { showResult('cancel-result', false, err.message); });
    }

    // === 결제 내역 렌더 ===
    function renderHistory() {
      var el = document.getElementById('history-list');
      if (paymentHistory.length === 0) {
        el.innerHTML = '<span style="color:#aaa">이 세션에서 결제한 내역이 표시됩니다</span>';
        return;
      }
      el.innerHTML = paymentHistory.map(function(h) {
        return '<div class="history-item">' +
          '<div class="top">' +
            '<div><b>' + (h.goodsName || h.orderId) + '</b> <span class="status-badge status-' + h.status + '">' + h.status + '</span></div>' +
            '<div class="amount">' + (h.amount || 0).toLocaleString() + '원</div>' +
          '</div>' +
          '<div class="tid">TID: ' + (h.tid || 'N/A') + ' | ' + h.method + '</div>' +
          (h.status === 'paid' ? '<button class="btn btn-red btn-sm" onclick="document.getElementById(\\'cancel-tid\\').value=\\'' + h.tid + '\\';showTab(\\'manage\\');document.querySelectorAll(\\'.tab\\').forEach(function(t){t.classList.remove(\\'active\\')});document.querySelectorAll(\\'.tab\\')[3].classList.add(\\'active\\');">취소하기</button>' : '') +
        '</div>';
      }).join('');
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
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>결제 결과</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 500px; margin: 40px auto; padding: 0 20px; text-align: center; }
    .icon { font-size: 64px; margin-bottom: 8px; }
    .ok { color: #2e7d32; }
    .fail { color: #c62828; }
    h2 { margin-bottom: 16px; }
    .info { background: #f5f5f5; padding: 16px; border-radius: 8px; text-align: left; font-size: 14px; margin: 16px 0; }
    .info div { margin: 4px 0; }
    .info .label { color: #888; font-size: 12px; }
    pre { background: #1e1e1e; color: #d4d4d4; padding: 16px; border-radius: 8px; font-size: 11px; text-align: left; overflow-x: auto; white-space: pre-wrap; word-break: break-all; max-height: 300px; overflow-y: auto; }
    .actions { margin-top: 20px; display: flex; gap: 12px; justify-content: center; }
    .actions a { padding: 10px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; }
    .btn-back { background: #1a73e8; color: white; }
    .btn-cancel { background: #c62828; color: white; }
  </style>
</head>
<body>
  <div class="icon ${query.status === 'paid' ? 'ok' : 'fail'}">${query.status === 'paid' ? '&#10003;' : '&#10007;'}</div>
  <h2>${query.status === 'paid' ? '결제 성공!' : '결제 실패'}</h2>

  <div class="info">
    <div><span class="label">주문번호</span> ${query.orderId || 'N/A'}</div>
    <div><span class="label">TID</span> ${query.tid || 'N/A'}</div>
    <div><span class="label">코드</span> ${query.code || ''} ${query.msg ? decodeURIComponent(query.msg) : ''}</div>
  </div>

  <pre id="detail">로딩 중...</pre>

  <div class="actions">
    <a href="/test" class="btn-back">다시 테스트</a>
  </div>

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
