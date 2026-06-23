# KavachIQ Frontend

## Setup

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Environment Variables

Create a `.env.local` file:

```
VITE_API_URL=http://localhost:5000/api
```

## Pages

- `/` - Security Dashboard
- `/scans` - Security Scans List
- `/scans/:id` - Scan Details
- `/threats` - Live Threat Intelligence
- `/audit-logs` - Audit Logs & Reports
