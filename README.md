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

<!-- 2. implementing settings in the backend  -->
<!-- 10. promotion of students to the next level -->
1. unapproved users should not be visible in the verified tab in the staff page
2. admins can be assigned specific subroles ie timetable manager, finance, teacher, all(ie can do everything an admin can do, but cannot delete other admins),and etc, these roles are assigned by the super admin alone .An admin can be assigned multiple subroles
2. add a model for subjects, migrate the database and create a page to manage subjects which is only accessible to admins (ie creating and deleting subjects and assigning them to students and the teachers who teach the subject)
3. a subject can be compulsory or optional(if optional, students can choose the subjects they want to take)
4. all classes have all the subjects and students can choose the optional subjects they want to take
4. my class should have a tab for subjects and a tab for student of the class if the teacher is assigned to a CLASS/stream eg F1/A and the subjects tab should show the subjects the current user is teaching and clicking on the subject should show the students taking the subject
5. 