# GitGuard AI — Week 1

Frontend dashboard (React + Tailwind + Docker) for the GitGuard AI project.

## Week 1 Scope
- Simple dashboard UI: Sidebar, Header, Main content
- Sections: Webhook Status, Deployment Status, Logs (mock)
- Docker deployment setup
- Public webhook URL compatibility via `.env`
- Basic logging panel with sample logs

## Run locally
```bash
npm install
npm run dev
```

## Environment
Copy `.env.example` to `.env` and set:
```
VITE_WEBHOOK_URL=https://your-public-webhook-url.example.com/webhook
```

## Docker
```bash
docker compose up --build
```
App will be served at http://localhost:8080
