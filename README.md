# Voice App React

Responsive React app with voice mode that:

- accepts spoken user commands,
- sends recognized text to a backend REST endpoint,
- returns both spoken and text responses.

## Requirements

- Node.js LTS
- Modern browser with Speech Recognition support (Chrome or Edge recommended)

## Setup

Install dependencies:

```bash
npm install
```

Start backend API:

```bash
npm run dev:server
```

In another terminal, start frontend:

```bash
npm run dev
```

Frontend runs on Vite default port (usually `5173`) and calls backend at `http://localhost:4000`.

## Sequence Diagram

See the dedicated interaction flow diagram here:

[`docs/voice-sequence.md`](docs/voice-sequence.md)

## Deployment (GitHub Pages)

This repo includes a workflow at `.github/workflows/deploy.yml` that builds the frontend on every push to `main` and deploys `dist` to GitHub Pages.

Expected site URL:

`https://moodaye.github.io/voice-app-react/`

In GitHub repo settings, ensure Pages source is set to **GitHub Actions**.

## API

### `POST /api/voice-command`

Request body:

```json
{
	"query": "what is my account balance"
}
```

Response body:

```json
{
	"reply": "Your checking account balance is $2540.34 and your savings account balance is $10420.76."
}
```

### `GET /api/health`

Returns API health status.

## Environment override

To point frontend to another backend URL, create `.env` and set:

```bash
VITE_API_BASE_URL=http://your-backend-host:4000
```
