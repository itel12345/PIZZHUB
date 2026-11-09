import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { checkRequestOrigin, isOriginCheckExempt } from "../src/lib/origin";

const base = {
  method: "POST",
  pathname: "/api/cart",
  origin: "http://localhost:3000" as string | null,
  secFetchSite: null as string | null,
  host: "localhost:3000" as string | null,
};

describe("Origin validation (CSRF second layer)", () => {
  it("never blocks safe methods", () => {
    for (const method of ["GET", "HEAD", "OPTIONS"]) {
      assert.equal(checkRequestOrigin({ ...base, method, origin: "https://evil.example" }).ok, true);
    }
  });

  it("allows a same-origin POST", () => {
    assert.equal(checkRequestOrigin(base).ok, true);
  });

  it("blocks a cross-origin POST/PATCH/DELETE", () => {
    for (const method of ["POST", "PATCH", "DELETE", "PUT"]) {
      const r = checkRequestOrigin({ ...base, method, origin: "https://evil.example" });
      assert.equal(r.ok, false, method);
    }
  });

  it("blocks a look-alike host and an Origin of 'null'", () => {
    assert.equal(checkRequestOrigin({ ...base, origin: "http://localhost:3000.evil.example" }).ok, false);
    assert.equal(checkRequestOrigin({ ...base, origin: "null" }).ok, false);
  });

  it("blocks malformed Origins and non-http schemes", () => {
    assert.equal(checkRequestOrigin({ ...base, origin: "not a url" }).ok, false);
    assert.equal(checkRequestOrigin({ ...base, origin: "ftp://localhost:3000" }).ok, false);
  });

  it("without Origin, trusts only Sec-Fetch-Site same-origin/none, else fails closed", () => {
    assert.equal(checkRequestOrigin({ ...base, origin: null, secFetchSite: "same-origin" }).ok, true);
    assert.equal(checkRequestOrigin({ ...base, origin: null, secFetchSite: "none" }).ok, true);
    assert.equal(checkRequestOrigin({ ...base, origin: null, secFetchSite: "cross-site" }).ok, false);
    assert.equal(checkRequestOrigin({ ...base, origin: null, secFetchSite: "same-site" }).ok, false);
    assert.equal(checkRequestOrigin({ ...base, origin: null, secFetchSite: null }).ok, false);
  });

  it("honours X-Forwarded-Host and rejects a mismatched forwarded scheme", () => {
    const behindProxy = { ...base, host: "internal:3000", origin: "https://pizzhub.example", forwardedHost: "pizzhub.example", forwardedProto: "https" };
    assert.equal(checkRequestOrigin(behindProxy).ok, true);
    assert.equal(checkRequestOrigin({ ...behindProxy, forwardedProto: "http" }).ok, false);
  });

  it("accepts an explicitly configured canonical origin (APP_URL)", () => {
    const r = checkRequestOrigin({ ...base, host: "internal", origin: "https://pizzhub.example", allowedOrigins: ["https://pizzhub.example/"] });
    assert.equal(r.ok, true);
  });

  it("exempts ONLY the Paystack webhook path", () => {
    const hook = "/api/checkout/paystack/webhook";
    assert.equal(isOriginCheckExempt(hook), true);
    assert.equal(isOriginCheckExempt(hook + "/"), true);
    assert.equal(checkRequestOrigin({ ...base, pathname: hook, origin: null }).ok, true);
    for (const p of [hook + "-evil", hook + "/x", "/api/checkout/paystack/verify-return", "/api/checkout", "/api/auth/login"]) {
      assert.equal(isOriginCheckExempt(p), false, p);
      assert.equal(checkRequestOrigin({ ...base, pathname: p, origin: null }).ok, false, p);
    }
  });
});
