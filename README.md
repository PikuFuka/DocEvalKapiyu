# DocEvalKapiyu: Automated Faculty Evaluation & Promotion System

DocEvalKapiyu is a sophisticated web application designed to automate the faculty evaluation and promotion process based on the **NBC 461 (National Budget Circular No. 461)** standards. It leverages Machine Learning (BERT) to classify documents and an automated analysis engine to project faculty rank promotions.

## 🚀 Features

### For Faculty
- **Secure Authentication:** Register and login with email verification.
- **Document Upload:** Submit evidence documents via Google Drive links.
- **Automated Classification:** AI-powered classification of documents into KRAs (Key Result Areas), Criteria, and Sub-criteria.
- **Promotion Tracker:** Real-time projection of rank increments based on current scores and NBC 461 weights.
- **Analytics Dashboard:** Visualize evaluation progress and score distributions.

### For Admins
- **Centralized Management:** Oversee all faculty uploads and evaluation statuses.
- **System Monitoring:** Track processing queues and system health.

## 🛠️ Tech Stack

### Backend (Django)
- **Framework:** Django REST Framework (DRF)
- **Database:** PostgreSQL
- **AI/ML:** BERT (Bidirectional Encoder Representations from Transformers) for document classification.
- **Services:**
  - **Analysis Engine:** Implements complex NBC 461 scoring and rank hierarchy logic.
  - **Document Processing:** Extracts and processes text from uploaded documents.
  - **Google Integration:** Seamless interaction with Google Drive and Google Sheets.
  - **Email Service:** Automated SMTP email notifications and verification.

### Frontend (React)
- **Framework:** React.js
- **Routing:** React Router DOM
- **State Management:** Context API (AuthContext)
- **Styling:** CSS3 with responsive design.

### Infrastructure
- **Containerization:** Docker & Docker Compose
- **Environment Management:** Python Decouple for secure configuration.

## 📂 Project Structure

```
├── backend/                # Django REST Framework project
│   ├── api/                # Core application logic (Models, Views, Serializers)
│   │   ├── ml_models/      # BERT model weights and tokenizers
│   │   ├── services/       # Business logic (NBC 461 Engine, ML, Google API)
│   │   └── views/          # API Endpoints (Auth, Upload, Analytics)
│   ├── DocEvalKapiyu/      # Project configuration (Settings, URLs)
│   └── manage.py
├── frontend/               # React.js application
│   ├── src/
│   │   ├── components/     # UI Components (Dashboards, Upload, Auth)
│   │   ├── contexts/       # Global state (Auth)
│   │   └── services/       # API communication layer
│   └── package.json
└── docker-compose.yml      # Orchestration for Backend, Frontend, and DB
```

## ⚙️ Setup & Installation

### Prerequisites
- Docker and Docker Compose
- Google Cloud Service Account (for Drive/Sheets API)
- API Keys for Gemini/Groq (if used for enhanced analysis)

### Environment Variables
Create a `.env` file in the root directory based on `.env.example`:
```env
SECRET_KEY=your_django_secret
DEBUG=True
DB_NAME=docevalkapiyu
DB_USER=postgres
DB_PASSWORD=your_password
EMAIL_HOST_USER=your_email
EMAIL_HOST_PASSWORD=your_app_password
GOOGLE_API_KEY=your_google_api_key
# ... other keys
```

### Running with Docker
```bash
docker-compose up --build
```
The application will be available at:
- **Frontend:** `http://localhost:3000`
- **Backend API:** `http://localhost:8000`

## ⚖️ NBC 461 Implementation
The system automatically applies KRA weights based on the faculty's current rank:
- **Instructor:** KRA I (60%), KRA II (10%), KRA III (20%), KRA IV (10%)
- **Professor:** KRA I (30%), KRA II (40%), KRA III (20%), KRA IV (10%)
- *And other ranks as per Table 2.2 of NBC 461.*

## 📄 License
This project is developed as part of a Thesis. All rights reserved.
