# Adrian-Technical-Test

This is a full-stack web application for managing users, built to fulfill the requirements of a technical test for a Full-Stack Software Engineer position.

## Project Explanation

This application provides a complete solution for user management. It features a secure backend API built with **Node.js/Express** and a dynamic, responsive frontend built with **Next.js/React**.

Authenticated administrators can perform full **CRUD** (Create, Read, Update, Delete) operations on users. The main dashboard includes real-time **search**, **filtering** by role/status, and **pagination**. The user creation and editing forms are enhanced with **Google Maps API** for address autocompletion and allow for **profile picture uploads**. The system is secured with **JWT-based authentication** and includes **Role-Based Access Control (RBAC)**, ensuring only authorized admins can perform management tasks.

A key technical decision was to use **Next.js** for the frontend to leverage its modern features and align with the job requirements. For the backend, a **controller/service pattern** was used to separate concerns, making the code cleaner and more testable. One challenge was handling `multipart/form-data` (for file uploads) alongside nested JSON data (for user addresses), which was solved by stringifying the nested object on the frontend and parsing it on the backend.

## Technologies Used

* **Backend**: Node.js, Express, MongoDB, Mongoose, JWT, Bcrypt.js, Multer
* **Frontend**: Next.js, React, TypeScript, Tailwind CSS, Axios, Headless UI, React-Icons
* **Database**: MongoDB Atlas
* **APIs**: Google Maps Places API
* **Testing**: Jest, Supertest, React Testing Library, `mongodb-memory-server`

## Setup and Run Instructions

### Prerequisites
* Node.js (v18 or higher)
* npm
* A MongoDB Atlas account connection string
* A Google Maps Platform API Key

### Combined Setup (Single Flow)

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/AdrianGonzalez878/Adrian-Technical-Test.git
    cd Adrian-Technical-Test
    ```

2.  **Setup Backend**:
    * Navigate to the backend directory:
        ```bash
        cd backend
        ```
    * Create a `.env` file and add your secret keys:
        ```
        MONGO_URI=your_mongodb_atlas_connection_string
        JWT_SECRET=your_super_secret_key_for_jwt
        ```
    * Install backend dependencies:
        ```bash
        npm install
        ```
    * **Seed the database** with 50 sample users:
        ```bash
        npm run seed
        ```
    * **Start the backend server** in this terminal:
        ```bash
        node server.js
        ```
        *(The backend is now running on `http://localhost:5001`. Keep this terminal open.)*

3.  **Setup Frontend**:
    * Open a **new terminal**.
    * Navigate to the frontend directory from the project root:
        ```bash
        cd frontend
        ```
    * Create a `.env.local` file and add your Google Maps API key:
        ```
        NEXT_PUBLIC_Maps_API_KEY=your_Maps_api_key
        ```
    * Install frontend dependencies:
        ```bash
        npm install
        ```
    * **Start the frontend application** in this second terminal:
        ```bash
        npm run dev
        ```
        *(The frontend is now available at `http://localhost:3000`.)*

4.  **Access the Application**:
    * Open your web browser and go to `http://localhost:3000`.
    * Log in with the default administrator account:
        * **Email**: `admin@example.com`
        * **Password**: `password123`

        
<img width="1270" height="1256" alt="Captura de pantalla 2025-07-28 a la(s) 7 02 03 p m" src="https://github.com/user-attachments/assets/daa6a6d6-f792-4c68-8b3e-8e4d175d449e" />



<img width="1270" height="1252" alt="Captura de pantalla 2025-07-27 a la(s) 11 25 18 p m" src="https://github.com/user-attachments/assets/6db0a5f5-7dd9-415a-9fcc-85526d434b23" />



<img width="1270" height="1256" alt="Captura de pantalla 2025-07-27 a la(s) 11 26 06 p m" src="https://github.com/user-attachments/assets/f4590e30-5ba5-40a4-8c0e-bd629cf4b158" />

