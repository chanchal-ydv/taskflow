# TaskFlow - Team Task Manager

A full-stack, responsive SaaS application built to help teams organize projects, assign tasks, and track productivity with role-based access control.

## 🚀 Live Demo
[**View Live Application Here**](https://your-railway-url.up.railway.app)

* **Admin:** chiragraoabc@gmail.com | Pass: Ckydv@1
* **Member:** rahul123@gmail.com | Pass: rahul123

## ✨ Key Features
* **Role-Based Access Control:** Distinct experiences and permissions for 'Admins' and 'Members'.
* **Dynamic Dashboard:** Real-time KPI calculations for Active Tasks, Overdue Tasks, and Team Productivity.
* **Task Management:** Admins can create projects and assign tasks; Members can update task statuses.
* **Modern UI/UX:** Built with a custom, responsive CSS Grid layout featuring smooth transitions, tabbed navigation, and visual feedback mechanisms.

## 🛠 Tech Stack
* **Frontend:** Vanilla JavaScript, HTML5, CSS3 (No heavy frameworks, ensuring blazing fast load times).
* **Backend:** Node.js, Express.js.
* **Database:** MongoDB (NoSQL) hosted on MongoDB Atlas.
* **Authentication:** JWT (JSON Web Tokens) & Bcrypt.js for secure password hashing.
* **Deployment:** Railway.app.

## ⚙️ Local Setup Instructions
1. Clone the repository: `git clone https://github.com/chanchal-ydv/taskflow.git`
2. Install dependencies: `npm install`
3. Create a `.env` file in the root directory and add your credentials:
   ```env
   PORT=3000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_secret_key
4. Start the server: node server.js
5. Open http://localhost:3000 in your browser.