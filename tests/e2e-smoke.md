1. Deploy CDK stack.
2. Note outputs: ApiUrl, SpaUrl, UserPoolId, UserPoolClientId.
3. In `frontend/.env` (or vite env), set:
   - VITE_API_URL="<ApiUrl>"
   - VITE_USER_POOL_ID="<UserPoolId>"
   - VITE_USER_POOL_CLIENT_ID="<UserPoolClientId>"
4. `npm run build` in frontend, upload `dist` to S3 bucket created by the stack (or automate with CI/CD).
5. Visit SPA URL, sign up, confirm, login.
6. Seed products via POST /product with Authorization header (use a temporary curl with your JWT) or add a quick Admin UI.
7. Add to cart → checkout → verify order response.
8. Click around → analytics events flow into Kinesis stream.
