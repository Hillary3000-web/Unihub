# UniHub 🎓

A full-stack university student portal for managing academic results, sharing study materials, and broadcasting announcements. Built with **Django REST Framework** (backend) and **React + Vite** (frontend).

---

## Features

| Feature | Description |
|---|---|
| **JWT Authentication** | Secure login/register with role-based access (Student & Course Advisor) |
| **Student Dashboard** | View personal results, GPA/CGPA summary, and semester breakdown |
| **Advisor Dashboard** | Upload results via Excel/PDF, manage courses, and post announcements |
| **Result Management** | Bulk upload student scores from `.xlsx` or `.pdf` files with automatic grade calculation |
| **Resource Hub** | Share and download study materials — past questions, lecture notes, etc. |
| **Announcements** | Priority-based announcement system (Normal / Important / Urgent) |

---

## Tech Stack

### Backend
- **Python 3.12** / **Django 6.0**
- Django REST Framework + SimpleJWT
- PostgreSQL (production) / SQLite (development)
- File parsing: `pdfplumber`, `pandas`, `openpyxl`
- Deployment: **Render** (Gunicorn + WhiteNoise)

### Frontend
- **React 18** with React Router v6
- Vite build tool
- Tailwind CSS
- Axios for API calls
- Deployment: **Vercel**

---

## Project Structure

```
Unihub/
├── backend/          # Django project settings & root URL config
├── users/            # Custom user model, auth views (register, login, logout, me)
├── results/          # Courses, results, study materials, announcements
├── frontend/         # React SPA (Vite)
│   └── src/
│       ├── pages/    # Login, Register, StudentDashboard, AdvisorDashboard, ResourceHub
│       ├── context/  # Auth context (JWT token management)
│       ├── api/      # Axios instance & API helpers
│       └── components/
├── build.sh          # Render build script
├── requirements.txt  # Python dependencies
├── runtime.txt       # Python version for Render
└── manage.py
```

---

## Getting Started

### Prerequisites

- Python 3.12+
- Node.js 18+
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/Hillary3000-web/Unihub.git
cd Unihub
```

### 2. Backend Setup

```bash
# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate        # Linux/macOS
venv\Scripts\activate           # Windows

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create a superuser (Course Advisor)
python manage.py createsuperuser

# Start the dev server
python manage.py runserver
```

The API will be available at `http://localhost:8000/api/`.

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The app will be available at `http://localhost:5173/`.

---

## API Endpoints

### Authentication (`/api/auth/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register/` | Register a new user |
| POST | `/api/auth/login/` | Login (returns JWT) |
| POST | `/api/auth/student-login/` | Student login by matric number |
| POST | `/api/auth/logout/` | Logout (blacklists refresh token) |
| POST | `/api/auth/token/refresh/` | Refresh access token |
| GET | `/api/auth/me/` | Get current user profile |

### Results & Resources (`/api/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/courses/` | List all courses |
| GET | `/api/results/me/` | Get current student's results |
| GET | `/api/results/all/` | Get all results (Advisor only) |
| POST | `/api/results/upload/` | Upload results via Excel |
| POST | `/api/results/upload-pdf/` | Upload results via PDF |
| GET | `/api/materials/` | List study materials |
| POST | `/api/materials/upload/` | Upload a study material |
| DELETE | `/api/materials/<id>/delete/` | Delete a study material |
| GET | `/api/announcements/` | List announcements |
| POST | `/api/announcements/create/` | Create an announcement |
| GET/PUT/DELETE | `/api/announcements/<id>/` | Manage a single announcement |

---

## Auth Flow

```
Advisor registers (name + staff ID + password)
  → Advisor logs in (staff ID + password)
    → Uploads PDF/Excel results
      → Student accounts auto-created from result data
        → Student logs in (matric number only)
          → Student Dashboard (results, CGPA, announcements)
```

---

## Environment Variables

Set these on Render (backend) and Vercel (frontend):

### Backend (Render)

| Variable | Description |
|----------|-------------|
| `SECRET_KEY` | Random 50+ character string |
| `DEBUG` | `False` |
| `ALLOWED_HOSTS` | `your-app.onrender.com` |
| `DATABASE_URL` | Auto-set when you add a Render PostgreSQL instance |
| `CORS_ALLOWED_ORIGINS` | `https://your-frontend.vercel.app` |
| `CSRF_TRUSTED_ORIGINS` | `https://your-frontend.vercel.app` |

### Frontend (Vercel)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Full backend URL, e.g. `https://your-app.onrender.com/api` |

---

## Deployment

### Backend → Render

1. Connect the GitHub repo to a new **Web Service** on Render.
2. Set the **Build Command** to `bash build.sh`.
3. Set the **Start Command** to `gunicorn backend.wsgi:application`.
4. Add a **PostgreSQL** database (auto-sets `DATABASE_URL`).
5. Add the remaining environment variables from the table above.

### Frontend → Vercel

1. Import the repo on Vercel and set the **Root Directory** to `frontend`.
2. The build command (`npm run build`) and output directory (`dist`) will be auto-detected.
3. Add the `VITE_API_URL` environment variable pointing to your Render backend.

### Free-Plan Notes

| Constraint | Impact |
|------------|--------|
| **Spins down after 15 min idle** | First request after idle takes ~30–50s (cold start) |
| **No persistent disk** | Uploaded files (`/media/`) are lost on redeploy — consider Cloudinary/S3 for file storage |
| **PostgreSQL free tier** | 1 GB storage, expires after 90 days |
| **512 MB RAM** | Sufficient for Django + Gunicorn |

---

## License

This project is for educational purposes.
