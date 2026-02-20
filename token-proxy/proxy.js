/**
 * B2C Token Proxy
 *
 * Azure AD B2C requires the `scope` parameter in the token exchange POST body
 * to issue an access_token. The Go golang.org/x/oauth2 library (used by
 * oauth2-proxy) does NOT send scope in the token request — only in the
 * authorize request. This proxy sits between oauth2-proxy and B2C's token
 * endpoint, adding the scope before forwarding the request.
 *
 * Environment variables:
 *   B2C_TOKEN_HOST  — B2C hostname (default: teamhitorib2c.b2clogin.com)
 *   B2C_API_SCOPE   — Full API scope URI (required)
 *   PORT            — Listen port (default: 8888)
 */

const http = require("http");
const https = require("https");

const PORT = parseInt(process.env.PORT || "8888", 10);
const B2C_HOST = process.env.B2C_TOKEN_HOST || "teamhitorib2c.b2clogin.com";
const API_SCOPE = process.env.B2C_API_SCOPE || "";

if (!API_SCOPE) {
  console.error("[token-proxy] ERROR: B2C_API_SCOPE is not set. Exiting.");
  process.exit(1);
}

const FULL_SCOPE = `openid offline_access ${API_SCOPE}`;

const server = http.createServer((req, res) => {
  const chunks = [];

  req.on("data", (chunk) => chunks.push(chunk));
  req.on("end", () => {
    let body = Buffer.concat(chunks).toString();

    // Append scope to form-encoded POST body if not already present
    if (req.method === "POST" && !body.includes("scope=")) {
      body += `&scope=${encodeURIComponent(FULL_SCOPE)}`;
      console.log(`[token-proxy] Added scope to token request: ${FULL_SCOPE}`);
    }

    // Forward headers, replacing Host and Content-Length
    const fwdHeaders = { ...req.headers };
    fwdHeaders["host"] = B2C_HOST;
    fwdHeaders["content-length"] = Buffer.byteLength(body).toString();
    // Remove transfer-encoding since we know the full body length
    delete fwdHeaders["transfer-encoding"];

    const options = {
      hostname: B2C_HOST,
      port: 443,
      path: req.url,
      method: req.method,
      headers: fwdHeaders,
    };

    const proxyReq = https.request(options, (proxyRes) => {
      // Collect response for logging
      const resChunks = [];
      proxyRes.on("data", (c) => resChunks.push(c));
      proxyRes.on("end", () => {
        const resBody = Buffer.concat(resChunks).toString();

        // Log response status (avoid logging full tokens in production)
        try {
          const parsed = JSON.parse(resBody);
          const keys = Object.keys(parsed);
          console.log(
            `[token-proxy] B2C responded ${proxyRes.statusCode} — keys: [${keys.join(", ")}]`
          );
          if (parsed.error) {
            console.error(
              `[token-proxy] B2C error: ${parsed.error} — ${parsed.error_description || ""}`
            );
          }
        } catch {
          console.log(
            `[token-proxy] B2C responded ${proxyRes.statusCode} (non-JSON)`
          );
        }

        // Forward response to oauth2-proxy
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        res.end(resBody);
      });
    });

    proxyReq.on("error", (err) => {
      console.error(`[token-proxy] Proxy error: ${err.message}`);
      res.writeHead(502);
      res.end("Bad Gateway");
    });

    proxyReq.write(body);
    proxyReq.end();
  });
});

server.listen(PORT, () => {
  console.log(`[token-proxy] Listening on :${PORT}`);
  console.log(`[token-proxy] Forwarding to https://${B2C_HOST}`);
  console.log(`[token-proxy] Scope: ${FULL_SCOPE}`);
});
