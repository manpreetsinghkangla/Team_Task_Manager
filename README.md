# TaskFlow — Team Task Manager

A full-stack team task management app built with React, Node.js, Express, and MongoDB. Features role-based access control, Kanban board, real-time task tracking, and team collaboration.

---

## 🚀 Features

- **Authentication** — JWT-based signup/login with secure password hashing
- **Projects** — Create, manage, and delete projects with custom colors
- **Kanban Board** — Drag-free board with To Do / In Progress / Review / Done columns
- **Task Management** — Create tasks with title, description, assignee, priority, due date, and tags
- **Role-Based Access** — Admin vs Member permissions per project
- **Team Management** — Invite members by email, assign roles, remove members
- **My Tasks** — Personal task view with overdue/due-soon filtering
- **Dashboard** — Overview stats: total, in-progress, overdue, completed tasks
- **Responsive** — Works on desktop and mobile

---

## 🛠 Tech Stack

| Layer     | Technology          |
|-----------|---------------------|
| Frontend  | React 18, Vite, React Router v6, CSS Modules |
| Backend   | Node.js, Express.js |
| Database  | MongoDB + Mongoose  |
| Auth      | JWT + bcryptjs      |
| Validation| express-validator   |

---

## 📦 Installation & Local Setup

### Prerequisites
- Node.js 18+
- MongoDB (local or MongoDB Atlas)

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd team-task-manager
npm install          # installs root concurrently
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure Environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/teamtaskmanager
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
CLIENT_URL=http://localhost:5173
```

### 3. Run Development Servers

```bash
# From root — runs both backend and frontend
npm run dev

# Or separately:
npm run dev:backend    # http://localhost:5000
npm run dev:frontend   # http://localhost:5173
```

---

## 🚂 Deploy on Railway

### Backend

1. Create a new Railway project
2. Add a **MongoDB** plugin (or use MongoDB Atlas)
3. Deploy the `backend/` folder as a service
4. Set environment variables:
   - `MONGODB_URI` — from Railway MongoDB or Atlas
   - `JWT_SECRET` — strong random string
   - `CLIENT_URL` — your frontend URL
   - `PORT` — Railway sets this automatically

### Frontend

1. Add another service from the `frontend/` folder
2. Set build command: `npm run build`
3. Set start command: `npx serve dist`
4. Add env variable:
   - Update `vite.config.js` proxy target to your backend Railway URL

**Or** use a static host (Vercel/Netlify) for the frontend with the backend on Railway.

---

## 📁 Project Structure

```
team-task-manager/
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   ├── Project.js
│   │   └── Task.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── projects.js
│   │   ├── tasks.js
│   │   └── users.js
│   ├── middleware/
│   │   └── auth.js
│   ├── server.js
│   └── .env.example
└── frontend/
    └── src/
        ├── context/AuthContext.jsx
        ├── pages/
        │   ├── AuthPage.jsx
        │   ├── Dashboard.jsx
        │   ├── ProjectsPage.jsx
        │   ├── ProjectDetail.jsx
        │   └── MyTasksPage.jsx
        ├── components/Layout.jsx
        ├── utils/api.js
        └── App.jsx
```

---

## 🔐 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | All user's projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Get project |
| PUT | `/api/projects/:id` | Update project (admin) |
| DELETE | `/api/projects/:id` | Delete project (admin) |
| POST | `/api/projects/:id/members` | Add member (admin) |
| DELETE | `/api/projects/:id/members/:userId` | Remove member (admin) |
| PUT | `/api/projects/:id/members/:userId/role` | Change role (admin) |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks?project=:id` | Project tasks |
| GET | `/api/tasks/my` | My assigned tasks |
| GET | `/api/tasks/dashboard` | Dashboard stats |
| POST | `/api/tasks` | Create task |
| GET | `/api/tasks/:id` | Get task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task (admin) |

---

## 🎨 Role Permissions

| Action | Admin | Member |
|--------|-------|--------|
| Create/edit/delete tasks | ✅ | ❌ |
| Update task status | ✅ | ✅ |
| Assign tasks | ✅ | ❌ |
| Add/remove members | ✅ | ❌ |
| Edit project | ✅ | ❌ |
| Delete project | ✅ | ❌ |

---

## 📄 License

MIT
