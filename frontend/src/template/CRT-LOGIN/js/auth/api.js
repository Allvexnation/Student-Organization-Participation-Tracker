import { API, MOCK, USE_MOCK } from "./config.js";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const httpError = (status, data = {}) =>
  Object.assign(new Error(data.message || `Request failed (${status})`), {
    status,
    data,
  });

async function request(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw httpError(response.status, data);
  return data;
}

const mockRole = (username) =>
  MOCK.accounts[username.trim().toLowerCase().split("@")[0]] ?? null;

export async function lookupRole(username) {
  if (!USE_MOCK) return request(API.lookupRole, { username });
  await wait(MOCK.latency * 0.6);
  return { role: mockRole(username) };
}

export async function login({ username, password }) {
  if (!USE_MOCK) return request(API.login, { username, password });
  await wait(MOCK.latency);
  const role = mockRole(username);
  if (!role || password !== MOCK.password) throw httpError(401);
  return { role };
}

export async function sendResetLink(email) {
  if (!USE_MOCK) return request(API.sendReset, { email });
  await wait(MOCK.latency);
  return { ok: true };
}

export async function verifyCode({ email, code }) {
  if (!USE_MOCK) return request(API.verifyCode, { email, code });
  await wait(MOCK.latency * 0.8);
  if (code !== MOCK.code) throw httpError(422);
  return { ok: true };
}

export async function resetPassword({ email, code, password }) {
  if (!USE_MOCK) return request(API.resetPassword, { email, code, password });
  await wait(MOCK.latency);
  return { ok: true };
}
