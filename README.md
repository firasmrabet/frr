# Bedoui Fullstack Application

This project has been restructured for deployment on Render with separate backend and frontend services.

## Project Structure

```
├── backend/                 # Express.js API server
│   ├── server.js           # Main server file
│   ├── package.json        # Backend dependencies
│   ├── templates/          # EJS templates for PDF generation
│   ├── test/              # Backend tests
│   ├── .env.example       # Backend environment variables template
│   └── .gitignore         # Backend gitignore
│
├── frontend/               # React/Vite frontend
│   ├── src/               # React source code
│   ├── public/            # Static assets
│   ├── package.json       # Frontend dependencies
│   ├── vite.config.ts     # Vite configuration
│   ├── tailwind.config.js # Tailwind CSS configuration
│   ├── .env.example       # Frontend environment variables template
│   └── .gitignore         # Frontend gitignore
│
├── render.yaml            # Render deployment configuration
└── README.md              # This file
```

## Deployment on Render

This project is configured for deployment on Render with two separate services:

### Backend Service (bedoui-backend)
- **Type**: Web Service
- **Runtime**: Node.js
- **Root Directory**: `./backend`
- **Build Command**: `npm install`
- **Start Command**: `node server.js`
- **Port**: 5000

### Frontend Service (bedoui-frontend)
- **Type**: Web Service
- **Runtime**: Node.js
- **Root Directory**: `./frontend`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run preview`
- **Port**: Automatically assigned by Render

## Environment Variables

### Backend (.env)
Copy `backend/.env.example` to `backend/.env` and configure:

```env
# Server Configuration
NODE_ENV=production
PORT=5000

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# API Security
API_KEY=your-secure-api-key
ENCRYPTION_KEY=your-encryption-key

# Frontend Configuration
FRONTEND_ORIGIN=https://bedoui-frontend.onrender.com

# Supabase Configuration
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_KEY=your-supabase-anon-key
```

### Frontend (.env)
Copy `frontend/.env.example` to `frontend/.env` and configure:

```env
# API Configuration
VITE_API_KEY=your-api-key
VITE_BACKEND_URL=https://bedoui-backend.onrender.com

# Supabase Configuration
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_KEY=your-supabase-anon-key
```

## Local Development

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Features

- **Quote Management**: Send and manage product quotes
- **PDF Generation**: Automatic PDF generation for quotes
- **Email Integration**: SMTP email sending for notifications
- **Product Management**: Admin interface for managing products
- **User Authentication**: Supabase-based authentication
- **Responsive Design**: Mobile-first responsive design

## Technologies Used

### Backend
- Express.js
- Playwright (PDF generation)
- Nodemailer (Email sending)
- EJS (Template engine)
- Supabase (Database)

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Supabase Client

## Deployment Steps

1. **Fork/Clone this repository**
2. **Create two services on Render:**
   - Backend service pointing to `./backend`
   - Frontend service pointing to `./frontend`
3. **Configure environment variables** in Render dashboard
4. **Deploy both services**
5. **Update CORS settings** in backend to allow frontend domain

## Support

For deployment issues or questions, check the Render documentation or contact support.
