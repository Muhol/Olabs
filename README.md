# Olabs - School & Library Management System

Olabs is a modern, comprehensive school and library management system designed to streamline administrative tasks, manage inventory, and track student and staff activities. Built with a robust tech stack, it features a responsive and aesthetically pleasing dashboard for efficient management.

## 🚀 Features

### 📚 Inventory Management
- **Book Cataloging**: Add, edit, and delete books with detailed metadata.
- **Circulation System**: Track borrowed books, manage returns, and view circulation history.
- **Real-time Status**: Instantly see book availability and borrower details.

### 🎓 Student Management
- **Enrollment**: diverse student profiles with admission numbers and class assignments.
- **Class & Stream Organization**: Create and manage classes and their associated streams.
- **Advanced Filtering**: Quickly find students by class or stream using intuitive UI filters.
- **Activity Tracking**: Monitor borrowing history per student.

### 👥 Staff & Access Control
- **Role-Based Access Control (RBAC)**: Secure access with defined roles:
  - **Super Admin**: Full system access.
  - **Admin**: Administrative capabilities.
  - **Librarian**: Inventory and circulation management.
  - **Teacher**: Class and student oversight.
  - **None/Pending**: default state for new users until verified.
- **User Management**: Administrators can update team roles and permissions directly from the portal.

### 📊 Analytics & Dashboard
- **Visual Insights**: Interactive charts (Recharts) showing inventory distribution and activity.
- **Quick Stats**: At-a-glance metrics for total students, books, and active loans.

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **UI Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/)
- **Authentication**: [Clerk](https://clerk.com/)

### Backend
- **API Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python)
- **Database ORM**: [SQLAlchemy](https://www.sqlalchemy.org/)
- **Data Validation**: [Pydantic](https://docs.pydantic.dev/)

## 🏁 Getting Started

### Prerequisites
- Node.js 18+  
- Python 3.10+
- PostgreSQL (or configured database)

### Installation

#### 1. Clone the Repository
```bash
git clone https://github.com/Muhol/Olabs.git
cd Olabs
```

#### 2. Backend Setup
Navigate to the backend directory and set up the Python environment.

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory with your database and auth configuration.

Run the server:
```bash
uvicorn app.main:app --reload
```
The API will be available at `http://localhost:8000`.

#### 3. Frontend Setup
Navigate to the frontend directory.

```bash
cd ../frontend
npm install
```

Create a `.env.local` file in the `frontend/` directory with your Clerk keys:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

Run the development server:
```bash
npm run dev
```
The application will be available at `http://localhost:3000`.

## 📂 Project Structure

```
Olabs/
├── backend/            # FastAPI application
│   ├── app/            # Application logic (routers, models, services)
│   └── ...
├── frontend/           # Next.js application
│   ├── app/            # App Router pages and layouts
│   ├── components/     # Reusable UI components
│   └── lib/            # API clients and utilities
└── ...
```

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
# Olabs



Tasks to be done (remaining tasks)

1. impementing system logs functionality in the backend 
2. implementing settings in the backend 
3. button to add a stream to a class in the stats card in the students page (done)
4. clicking on a student in the students page should open a modal to view the student's details and borrowing history (done)
5. clearance functionality for clearing students (done)
6. the option to delete a stream in the students page but it should only be available if the stream is empty and can only be done by admin and super admin (done)
7. add an option to delete a class in the students page but it should only be available if the class is empty and can only be done by admin and super admin (done)
8. in the staff page separate the verified and unapproved users into two tabs and also add a search functionality to search for users (done)
9. adding the return function directly in the studantdetails modal (done)
10. promotion of students to the next level
11. updating or assigning a stream to a student should also update the stream column in the students table not just the stream_id column (done)