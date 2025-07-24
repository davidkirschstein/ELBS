# ELBS
Electronic Logbook System(pilot hour tracking system)

Aviation Project Setup and Run Instructions
This project consists of two components: a backend (backend_aviation) and a frontend (frontend_aviation). The backend handles data processing and API services, while the frontend provides a user interface. The project integrates pre-trained AI modules hosted on a cloud server for advanced reporting and analytics, delivering insights like predictive maintenance and performance trends.
Prerequisites

Node.js: Install Node.js (v16 or higher) from nodejs.org.
npm: Included with Node.js for package management.
Git: Required to clone the repository. Download from git-scm.com.
Expo Go: Install the Expo Go app on your iOS or Android device from the App Store or Google Play Store to scan QR codes for testing the frontend.

Setup Instructions

Clone the Repository:

Clone the project:git clone <repository-url>


Navigate to the project root:cd <project-folder>




Install Dependencies:

Run in the project root:npm install




Set Up the Backend:

Navigate to the backend folder:cd backend_aviation


Install backend dependencies:npm install


Start the backend server:node server.js

The backend runs on http://localhost:3000 (or as configured).
Note: The backend connects to cloud-hosted AI modules pre-trained on aviation datasets, enabling real-time analytics for operational insights.


Set Up the Frontend:

Open a new terminal and navigate to the frontend folder:cd frontend_aviation


Install frontend dependencies:npm install


Start the frontend development server:npm run dev

This generates a QR code in the terminal.
Open the Expo Go app on your phone, ensure it’s on the same Wi-Fi network as your computer, and scan the QR code to load the app on your device.
The frontend runs on http://localhost:5173 (or as configured) and displays data from the backend’s AI-driven analytics.


Access the Application:

On your phone, view the app via Expo Go after scanning the QR code.
Alternatively, access http://localhost:5173 in a browser.
The app visualizes analytics from the cloud-based AI modules.



Additional Notes

AI Integration: The project uses pre-trained AI models on a cloud server for reporting and analytics, eliminating local training needs.
Environment Variables: Set required variables (e.g., API keys) in a .env file in backend_aviation. Check .env.example.
Troubleshooting: Ensure devices are on the same Wi-Fi for QR code scanning. If the QR code fails, try npx expo start --tunnel for a tunnel connection.

Running in Production

Use node server.js for the backend (node server.js) and build the frontend (npm run build).
Ensure cloud AI module APIs are accessible via backend endpoints.
