# Mock Auth Proxy (Local Dev Only)

This nginx config simulates OAuth2-Proxy for local development.
It injects a fake `X-Auth-Request-Access-Token` JWT header into all
requests before proxying to the Portal and API.

## How it works

1. `nginx.conf` adds a static JWT header to every proxied request
2. The JWT payload contains mock user claims (admin user, active status)
3. Portal and API decode the JWT as usual — they don't know it's fake

## Accessing the local dev environment

- **Portal:** `http://localhost:8080` (via mock-auth proxy)
- **API docs:** `http://localhost:8000/api/docs` (direct, no auth)

## Changing the mock user

Edit the JWT in `nginx.conf`. The payload is base64url-encoded JSON.
Use https://jwt.io to decode/encode.
