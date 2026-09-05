# Mediora Frontend - Run Guide & Instructions

## 🌐 Quick Access Link
The application is running locally at:
👉 **[http://localhost:5174/](http://localhost:5174/)**

---

## 🚀 How to Run the Code

Since the project files (`package.json`, `src/`, `vite.config.js`) are located directly in your workspace `frontend`:

1. **Open your terminal** in `frontend/`
2. **Install dependencies** (if not already installed):
   ```bash
   npm install
   ```
3. **Start the development server**:
   ```bash
   npm run dev
   ```
4. **Open in browser**:
   - **[http://localhost:5174/](http://localhost:5174/)**

---

## ⚙️ Backend API Configuration

- **API URL**: `http://192.168.83.246:8000`
- Configured in `src/config/env.js` and `src/services/api/client.js`.

---

## 🛠️ Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts Vite local development server |
| `npm run build` | Builds optimized production bundle |
| `npm test` | Runs the Vitest test suite |
| `npm run preview` | Locally previews production build |
