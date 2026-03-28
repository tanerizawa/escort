import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// ── Custom metrics ────────────────────────────────────
const errorRate = new Rate('errors');
const loginDuration = new Trend('login_duration');
const registerDuration = new Trend('register_duration');
const listEscortsDuration = new Trend('list_escorts_duration');
const bookingDuration = new Trend('booking_duration');
const chatDuration = new Trend('chat_duration');

// ── Configuration ─────────────────────────────────────
const BASE_URL = __ENV.BASE_URL || 'https://api.areton.id/api';

export const options = {
  scenarios: {
    // Smoke test: small load
    smoke: {
      executor: 'constant-vus',
      vus: 5,
      duration: '1m',
      startTime: '0s',
      tags: { scenario: 'smoke' },
    },
    // Load test: normal traffic
    load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 20 },  // ramp up
        { duration: '5m', target: 20 },  // sustain
        { duration: '2m', target: 50 },  // peak
        { duration: '3m', target: 50 },  // sustain peak
        { duration: '2m', target: 0 },   // ramp down
      ],
      startTime: '1m',
      tags: { scenario: 'load' },
    },
    // Stress test: high traffic
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 },
        { duration: '5m', target: 100 },
        { duration: '2m', target: 0 },
      ],
      startTime: '15m',
      tags: { scenario: 'stress' },
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    http_req_failed: ['rate<0.05'],     // Less than 5% failures
    errors: ['rate<0.1'],               // Custom error rate under 10%
  },
};

// ── Helper functions ──────────────────────────────────
const headers = { 'Content-Type': 'application/json' };

function randomEmail() {
  return `k6_${Date.now()}_${Math.random().toString(36).substring(7)}@test.com`;
}

function randomPhone() {
  return `+628${Math.floor(1000000000 + Math.random() * 9000000000)}`;
}

// ── Main test function ────────────────────────────────
export default function () {
  let accessToken = '';

  group('1. Authentication Flow', () => {
    // Register
    const email = randomEmail();
    const registerPayload = JSON.stringify({
      email,
      password: 'TestPass123!',
      firstName: 'K6',
      lastName: 'LoadTest',
      phone: randomPhone(),
      role: 'CLIENT',
    });

    const registerRes = http.post(`${BASE_URL}/auth/register`, registerPayload, {
      headers,
      tags: { name: 'register' },
    });

    registerDuration.add(registerRes.timings.duration);

    const registerSuccess = check(registerRes, {
      'register: status is 201': (r) => r.status === 201,
      'register: has accessToken': (r) => {
        try {
          const body = JSON.parse(r.body);
          return !!body.data?.accessToken;
        } catch {
          return false;
        }
      },
    });

    if (registerSuccess) {
      try {
        const body = JSON.parse(registerRes.body);
        accessToken = body.data?.accessToken || '';
      } catch {
        // ignore parse error
      }
    }
    errorRate.add(!registerSuccess);

    sleep(0.5);

    // Login
    const loginPayload = JSON.stringify({
      email,
      password: 'TestPass123!',
    });

    const loginRes = http.post(`${BASE_URL}/auth/login`, loginPayload, {
      headers,
      tags: { name: 'login' },
    });

    loginDuration.add(loginRes.timings.duration);

    const loginSuccess = check(loginRes, {
      'login: status is 200': (r) => r.status === 200,
      'login: has accessToken': (r) => {
        try {
          const body = JSON.parse(r.body);
          return !!body.data?.accessToken;
        } catch {
          return false;
        }
      },
    });

    if (loginSuccess) {
      try {
        const body = JSON.parse(loginRes.body);
        accessToken = body.data?.accessToken || accessToken;
      } catch {
        // ignore parse error
      }
    }
    errorRate.add(!loginSuccess);

    sleep(0.5);
  });

  group('2. Browse Escorts', () => {
    // List escorts (public)
    const listRes = http.get(`${BASE_URL}/escorts?page=1&limit=10`, {
      tags: { name: 'list_escorts' },
    });

    listEscortsDuration.add(listRes.timings.duration);

    const listSuccess = check(listRes, {
      'list escorts: status is 200': (r) => r.status === 200,
    });
    errorRate.add(!listSuccess);

    sleep(0.5);

    // Get featured premium listings (public)
    const premiumRes = http.get(`${BASE_URL}/premium/featured`, {
      tags: { name: 'featured_premium' },
    });

    check(premiumRes, {
      'featured premium: status is 200': (r) => r.status === 200,
    });

    sleep(0.3);
  });

  group('3. Authenticated Operations', () => {
    if (!accessToken) return;

    const authHeaders = {
      ...headers,
      Authorization: `Bearer ${accessToken}`,
    };

    // Get profile
    const profileRes = http.get(`${BASE_URL}/users/me`, {
      headers: authHeaders,
      tags: { name: 'get_profile' },
    });

    check(profileRes, {
      'get profile: status is 200': (r) => r.status === 200,
    });

    sleep(0.3);

    // List favorites
    const favRes = http.get(`${BASE_URL}/favorites`, {
      headers: authHeaders,
      tags: { name: 'list_favorites' },
    });

    check(favRes, {
      'list favorites: status is 200': (r) => r.status === 200,
    });

    sleep(0.3);

    // List notifications
    const notifRes = http.get(`${BASE_URL}/notifications`, {
      headers: authHeaders,
      tags: { name: 'list_notifications' },
    });

    check(notifRes, {
      'notifications: status is 200': (r) => r.status === 200,
    });

    sleep(0.3);

    // List chat rooms
    const chatRes = http.get(`${BASE_URL}/chats`, {
      headers: authHeaders,
      tags: { name: 'list_chats' },
    });

    chatDuration.add(chatRes.timings.duration);

    check(chatRes, {
      'list chats: status is 200': (r) => r.status === 200,
    });

    sleep(0.3);

    // List bookings
    const bookingRes = http.get(`${BASE_URL}/bookings`, {
      headers: authHeaders,
      tags: { name: 'list_bookings' },
    });

    bookingDuration.add(bookingRes.timings.duration);

    check(bookingRes, {
      'list bookings: status is 200': (r) => r.status === 200,
    });

    sleep(0.3);
  });

  group('4. OTP Flow', () => {
    const phone = randomPhone();

    const otpRes = http.post(
      `${BASE_URL}/auth/otp/send`,
      JSON.stringify({ phone }),
      { headers, tags: { name: 'otp_send' } },
    );

    check(otpRes, {
      'OTP send: status is 200': (r) => r.status === 200,
    });

    sleep(0.5);
  });

  sleep(1);
}

// ── Teardown ──────────────────────────────────────────
export function handleSummary(data) {
  const summary = {
    timestamp: new Date().toISOString(),
    metrics: {
      http_reqs: data.metrics.http_reqs?.values?.count || 0,
      http_req_duration_p95: data.metrics.http_req_duration?.values?.['p(95)'] || 0,
      http_req_duration_avg: data.metrics.http_req_duration?.values?.avg || 0,
      http_req_failed_rate: data.metrics.http_req_failed?.values?.rate || 0,
      error_rate: data.metrics.errors?.values?.rate || 0,
      login_avg: data.metrics.login_duration?.values?.avg || 0,
      register_avg: data.metrics.register_duration?.values?.avg || 0,
      list_escorts_avg: data.metrics.list_escorts_duration?.values?.avg || 0,
    },
  };

  return {
    'scripts/load-test-results.json': JSON.stringify(summary, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  // k6 built-in text summary
  return '';
}
