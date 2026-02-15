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

 STUDENT MODULE
 1. INITIAL SETUP
    - ADD some fields for the student table called activated and the default is false, another feild called password to store hash password, and profile photo(nullable)
    
    - The initial setup of a student account the student should sign up using the admission number as the username and the password should be the same as the admission number, which they will be required to change after the first login, and the account should be activated after this, and after the account is activated the student should be able to login and use the portal using the admission number and the new password they created 

    - a reset incase a student cannot login or has forgotten the password or maybe another student login into another student's account by mistake, the reset should be done by the admin, where the admin deactivates the account and the set password is set to null so that the student can sign up again

    - all authentication logic should be handled by the backend api not using clerk or any third party auth tool 

    - create a new module called students
    -   the module should use the same backend 
        the module should have the following features:
          - dashboard for the student (Upcoming assignments,Overdue assignments, Attendance percentage,Announcements,Timetable preview (today’s classes),Fee balance,)
          - a view of the subjects the student is taking and the teachers of the subjects(
            clicking on the subject should open a modal to show the 
              - name of the subject
              - name of the teacher
              - Subject performance analytics
              - Subject announcements
              - Course materials (PDF, slides, videos)
              - assignments given to the student in that subject and the results of the assignments
              - results of the term exams
          )
          - a view of the assignments given to the student and the status of the assignment, due date 
          - a view of the results of the assignments
          - a view of the results of the term exams(report card)
