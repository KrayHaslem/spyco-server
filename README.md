# spyco-server

Full-stack Spyco PO System - Flask API serving a React client, deployable to Heroku.

## Project Structure

```
spyco-server/
├── client/           # React client (Vite + TypeScript)
├── server/           # Flask API
├── Procfile          # Heroku process definition
├── runtime.txt       # Python version
├── requirements.txt  # Python dependencies
└── package.json      # Node.js build scripts
```

## Local Development

### Prerequisites

- Python 3.12+
- Node.js 20.x
- PostgreSQL

### Initial Setup

1. Install Python dependencies:

   ```bash
   pip install -r requirements.txt
   ```

2. Install client dependencies:

   ```bash
   cd client && rm -rf node_modules && npm install
   ```

3. Create `.env` file in the `server/` directory (copy from `.env.example`):

   ```bash
   cp .env.example server/.env
   ```

   Then edit `server/.env` with your database credentials and JWT secret.

### Option A: Development Mode (Separate Servers)

Run the client and API as separate processes with hot-reloading. The Vite dev server proxies API requests to Flask.

**Terminal 1 - Flask API:**

```bash
cd server && python app.py
```

**Terminal 2 - React Dev Server:**

```bash
cd client && npm run dev
```

Access the app at `http://localhost:5173` (Vite dev server with hot-reload).

### Option B: Production-Like Mode (Single Server)

Build the React client and have Flask serve everything from a single server. This mimics the Heroku production environment.

```bash
# Build the React client
cd client && npm run build

# Start Flask (serves both static files and API)
cd ../server && python app.py
```

Access the app at `http://localhost:5001` (Flask serving everything).

> **Note:** Port 5001 is used instead of 5000 because macOS AirPlay Receiver uses port 5000.

## Heroku Deployment

### Initial Setup

```bash
# Create Heroku app
heroku create your-app-name

# Add buildpacks (order matters: Node first, then Python)
heroku buildpacks:add --index 1 heroku/nodejs
heroku buildpacks:add --index 2 heroku/python

# Add Heroku Postgres
heroku addons:create heroku-postgres:essential-0

# Set environment variables
heroku config:set JWT_SECRET_KEY=your-secret-key
heroku config:set JWT_ALGORITHM=HS256
heroku config:set FLASK_ENV=production
heroku config:set CLIENT_URL=https://your-app.herokuapp.com

# If using SMS features (ClickSend)
heroku config:set CLICKSEND_USERNAME=your-username
heroku config:set CLICKSEND_API_KEY=your-api-key
```

### Deploy

```bash
git push heroku main
```

### Useful Commands

```bash
# View logs
heroku logs --tail

# Open the app
heroku open

# Run database migrations (if needed)
heroku run python server/db_migrate.py

# Access Heroku shell
heroku run bash
```

## Environment Variables

| Variable             | Description                                       | Required      |
| -------------------- | ------------------------------------------------- | ------------- |
| `DATABASE_URL`       | PostgreSQL connection string (auto-set by Heroku) | Yes           |
| `JWT_SECRET_KEY`     | Secret key for JWT tokens                         | Yes           |
| `JWT_ALGORITHM`      | JWT algorithm (default: HS256)                    | No            |
| `FLASK_ENV`          | Flask environment (production/development)        | No            |
| `CLIENT_URL`         | Production URL for SMS links                      | Yes (for SMS) |
| `CLICKSEND_USERNAME` | ClickSend API username                            | For SMS       |
| `CLICKSEND_API_KEY`  | ClickSend API key                                 | For SMS       |
