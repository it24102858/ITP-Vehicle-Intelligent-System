#  Vehicle Intelligent System

A full-stack vehicle marketplace with role-based dashboards, JWT authentication, and MongoDB Atlas.

---

## 📁 Project Structure

```
vehicle-system/
├── backend/
│   ├── config/db.js              # MongoDB connection
│   ├── middleware/auth.js         # JWT protect + role guards
│   ├── models/
│   │   ├── User.js               # User schema (buyer/seller/admin)
│   │   ├── Company.js            # Company/role schema
│   │   └── Vehicle.js            # Vehicle listing schema
│   ├── routes/
│   │   ├── auth.js               # /api/auth/* (login, register, seed-admin)
│   │   ├── admin.js              # /api/admin/* (stats, users, companies, vehicles)
│   │   └── vehicles.js           # /api/vehicles/* (CRUD marketplace)
│   ├── server.js
│   ├── .env
│   └── package.json
└── frontend/
    ├── public/index.html
    ├── src/
    │   ├── context/AuthContext.js # Global auth state
    │   ├── utils/api.js           # Axios instance with JWT
    │   ├── pages/
    │   │   ├── AuthPage.js        # Login + Register (single form)
    │   │   ├── MarketplacePage.js # Buyer/Seller marketplace
    │   │   └── AdminDashboard.js  # Full admin panel
    │   ├── App.js                 # Router + protected routes
    │   ├── index.js
    │   └── index.css              # Global dark automotive theme
    ├── .env
    └── package.json
```

---

## ⚙️ Setup

### 1. MongoDB Atlas
1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com) → Create free cluster
2. Create a database user (username + password)
3. Whitelist your IP (or use 0.0.0.0/0 for dev)
4. Copy the **Connection String** (looks like `mongodb+srv://...`)

### 2. Backend Setup
```bash
cd backend
npm install

# Edit .env — paste your MongoDB connection string:
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/vehicle_system?retryWrites=true&w=majority
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
ADMIN_EMAIL=admin@vehicle.com
ADMIN_PASSWORD=Admin123!
PORT=5000

# Start backend
npm run dev        # development (nodemon)
npm start          # production
```

### 3. Seed Admin Account
After starting the backend, run this once (in a new terminal or browser/Postman):
```bash
curl -X POST http://localhost:5000/api/auth/seed-admin
```
Or visit: `http://localhost:5000/api/auth/seed-admin` with POST method in Postman.

### 4. Frontend Setup
```bash
cd frontend
npm install

# Edit .env if your backend runs on a different port:
REACT_APP_API_URL=http://localhost:5000/api

# Start frontend
npm start
```

---

## 🔐 Default Credentials

| Role  | Email                | Password  |
|-------|----------------------|-----------|
| Admin | admin@vehicle.com    | Admin123! |

Register any buyer/seller accounts through the UI.

---

## 🗺️ Page Routing

| Path          | Access              | Description                        |
|---------------|---------------------|------------------------------------|
| `/login`      | Public              | Login + Register form              |
| `/marketplace`| Buyer, Seller       | Browse & list vehicles             |
| `/admin`      | Admin only          | Full admin dashboard               |

---

## 📡 API Endpoints

### Auth
| Method | Route                      | Access  | Description          |
|--------|----------------------------|---------|----------------------|
| POST   | /api/auth/register         | Public  | Register buyer/seller|
| POST   | /api/auth/login            | Public  | Login any user       |
| GET    | /api/auth/me               | Private | Get current user     |
| POST   | /api/auth/seed-admin       | Public  | Create admin (once)  |

### Admin (requires admin JWT)
| Method | Route                        | Description               |
|--------|------------------------------|---------------------------|
| GET    | /api/admin/stats             | Dashboard statistics      |
| GET    | /api/admin/users             | List all users            |
| PATCH  | /api/admin/users/:id/toggle  | Activate/deactivate user  |
| DELETE | /api/admin/users/:id         | Delete user               |
| GET    | /api/admin/companies         | List all companies/roles  |
| POST   | /api/admin/companies         | Create company + role     |
| PUT    | /api/admin/companies/:id     | Update company            |
| DELETE | /api/admin/companies/:id     | Delete company            |
| GET    | /api/admin/vehicles          | View all listings         |

### Vehicles (marketplace)
| Method | Route                          | Access        | Description       |
|--------|--------------------------------|---------------|-------------------|
| GET    | /api/vehicles                  | Public        | Browse vehicles   |
| GET    | /api/vehicles/:id              | Public        | Vehicle detail    |
| POST   | /api/vehicles                  | Seller/Admin  | Create listing    |
| PUT    | /api/vehicles/:id              | Seller/Admin  | Update listing    |
| DELETE | /api/vehicles/:id              | Seller/Admin  | Delete listing    |
| GET    | /api/vehicles/seller/my-listings | Seller      | My listings       |

---

## 🏢 Company Role Types

| Type                | Description                                |
|---------------------|--------------------------------------------|
| service_provider    | Vehicle maintenance & repair companies     |
| delivery_management | Transport & delivery logistics             |
| inspection          | Pre-purchase vehicle inspection services   |
| insurance           | Auto insurance providers                   |
| order_management    | Order processing & fulfillment companies   |

---

## 🛠️ VS Code Setup

### Recommended Extensions
Install these from the Extensions panel (Ctrl+Shift+X):
- **ES7+ React/Redux/React-Native snippets** — `dsznajder.es7-react-js-snippets`
- **Prettier** — `esbenp.prettier-vscode`
- **ESLint** — `dbaeumer.vscode-eslint`
- **MongoDB for VS Code** — `mongodb.mongodb-vscode`
- **REST Client** — `humao.rest-client` (test APIs directly in VS Code)
- **Thunder Client** — `rangav.vscode-thunder-client` (Postman alternative)
- **GitLens** — `eamodio.gitlens`

### `.vscode/settings.json` (create in root)
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.tabSize": 2,
  "emmet.includeLanguages": { "javascript": "javascriptreact" },
  "files.associations": { "*.js": "javascriptreact" }
}
```

### Run Both Servers
Install `concurrently` in root for convenience:
```bash
# From project root
npm init -y
npm install concurrently
```

Add to root `package.json`:
```json
{
  "scripts": {
    "dev": "concurrently \"cd backend && npm run dev\" \"cd frontend && npm start\"",
    "install:all": "cd backend && npm i && cd ../frontend && npm i"
  }
}
```

Then run everything with: `npm run dev`

---

## 🔒 Security Notes
- Passwords hashed with **bcryptjs** (salt rounds: 12)
- **JWT tokens** expire in 7 days
- Admin role cannot be registered via API — only seeded
- Admin account cannot be deleted or deactivated via dashboard
- All `/api/admin/*` routes require valid admin JWT

---

## 🚀 Tech Stack

| Layer     | Technology                              |
|-----------|-----------------------------------------|
| Frontend  | React 18, React Router v6, Axios        |
| Styling   | Custom CSS (Bebas Neue + DM Sans fonts) |
| Backend   | Node.js, Express 4                      |
| Database  | MongoDB Atlas (Mongoose ODM)            |
| Auth      | JWT (jsonwebtoken) + bcryptjs           |
| Toasts    | react-toastify                          |
