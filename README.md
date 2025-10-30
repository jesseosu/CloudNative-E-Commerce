AWS Micro E‑Commerce

A cloud‑native e‑commerce demo showing microservices with AWS managed services.

## Architecture
- **Frontend**: React SPA (S3 + CloudFront)
- **Auth**: Amazon Cognito (User Pool + App Client)
- **API**: API Gateway (REST) + Lambda (Node/TS)
- **Data**: DynamoDB tables for products, users, carts, orders
- **Analytics**: Kinesis stream for click/search/add‑to‑cart events
- **IaC**: AWS CDK (TypeScript)

## Quick Start
```bash
# provision
cd infra && npm i && npm run build && npm run deploy
# capture outputs for SPA env

# frontend
cd ../frontend && npm i
cp .env.example .env # create and set VITE_API_URL, VITE_USER_POOL_ID, VITE_USER_POOL_CLIENT_ID
npm run build
# upload dist/* to the S3 bucket created by the stack (or wire CI/CD)
