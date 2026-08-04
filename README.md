# Explainable AI (XAI)-Based Smart Loan Recommendation & Credit Risk System

[![Python](https://img.shields.io/badge/Python-3.11%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![XGBoost](https://img.shields.io/badge/XGBoost-0.9658_AUC-green.svg)](https://xgboost.readthedocs.io/)
[![SHAP](https://img.shields.io/badge/SHAP-TreeExplainer-orange.svg)](https://shap.readthedocs.io/)
[![DiCE](https://img.shields.io/badge/DiCE-Counterfactual_Recourse-purple.svg)](https://github.com/interpretable-ml/DiCE)
[![License](https://img.shields.io/badge/License-MIT-brightgreen.svg)](LICENSE)

An enterprise-grade, patentable Explainable Artificial Intelligence (XAI) platform designed to eliminate the "black-box" nature of automated credit scoring and loan underwriting.

Developed for the **Idea Lab** curriculum, this system provides a **dual-portal architecture**:
1. **Customer Portal**: Provides loan eligibility probability, multi-bank matching, interactive recourse sandboxing, and actionable step-by-step approval roadmaps via **Diverse Counterfactual Explanations (DiCE)**.
2. **Bank Underwriter Portal**: Provides credit risk probability scoring, local feature importance breakdowns via **SHAP** and **LIME**, and institutional compliance audit logging.

---

## Technical Overview & Patent Innovations

Standard machine learning models fail to explain why a customer was rejected or how they can become eligible. Standard counterfactual algorithms often generate unrealistic recommendations (e.g., "reduce age" or "double income in 7 days"). This platform introduces three novel algorithmic workflows:

### 1. AFRO-DiCE: Actionable & Feasible Recourse Optimization Engine
* **Constraint Matrix**: Locks **Immutable Features** ($\delta_{\text{Age}} = 0$, $\delta_{\text{PastDefaults}} = 0$) and enforces non-decreasing constraints on credit history.
* **Velocity Bounds**: Restricts parameter perturbations to realistic rate-of-change limits (e.g., CIBIL score growth bounded at max $+30$ pts / 90 days; debt reduction bounded by disposable income).
* **Phased Roadmaps**: Renders actionable **30-90-180 Day Step-by-Step Approval Plans**.

### 2. Multi-Lender Pareto Approval Frontier (ML-PAF)
* Evaluates applicant feature vectors simultaneously against $N$ distinct institutional risk profiles (e.g., Apex National Bank, Premier Credit, Horizon NBFC).
* Calculates the **Pareto Frontier of Minimal Parameter Modifications**, showing the fastest approval route across competing lenders.

### 3. Interactive Real-Time Recourse Sandbox & Stability Shield
* Allows applicants to adjust hypothetical sliders (Tenure, Down Payment, Credit Card Utilization) with real-time SHAP force plot recalculations.
* Evaluates local Lipschitz continuity around counterfactual trajectories to prevent fragile or volatile approval claims.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            REACT FRONTEND (Vite)                            │
│  ┌─────────────────────────────────────┐   ┌─────────────────────────────┐  │
│  │           Customer Portal           │   │         Bank Portal         │  │
│  │ - Eligibility & Risk Estimator      │   │ - Credit Risk Dashboard     │  │
│  │ - Actionable DiCE Roadmap UI        │   │ - Applicant Queue & Scoring │  │
│  │ - Interactive Recourse Sandbox      │   │ - SHAP/LIME Explainability  │  │
│  └──────────────────┬──────────────────┘   └──────────────┬──────────────┘  │
└─────────────────────┼─────────────────────────────────────┼─────────────────┘
                      │ REST API / JSON                     │
                      ▼                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            FASTAPI BACKEND SERVICE                          │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    API Gateway & Validation Router                    │  │
│  │  - JWT Authentication (Customer & Bank Roles)                         │  │
│  │  - Pydantic Input/Output Schema Enforcement                           │  │
│  └──────────────────┬─────────────────────────────────┬──────────────────┘  │
│                     │                                 │                     │
│                     ▼                                 ▼                     │
│  ┌────────────────────────────────────┐    ┌─────────────────────────────┐  │
│  │    Business Logic & DB Router      │    │    ML & XAI Engine Module    │  │
│  │  - Application Management          │    │  - XGBoost Classifier       │  │
│  │  - Multi-Bank Ranking Engine       │    │  - SHAP Tree/Kernel Explainer│  │
│  │  - Compliance Audit Logger         │    │  - DiCE Counterfactual Plan │  │
│  └──────────────────┬─────────────────┘    └──────────────┬──────────────┘  │
└─────────────────────┼─────────────────────────────────────┼─────────────────┘
                      │ SQLAlchemy ORM                      │ Model Artifacts (.joblib)
                      ▼                                     ▼
┌───────────────────────────────────────┐    ┌─────────────────────────────────┐
│     PostgreSQL / SQLite Database      │    │     Serialized Model Storage    │
│ (Users, Applications, Bank Criteria)  │    │  (xgboost_model, preprocessor)  │
└───────────────────────────────────────┘    └─────────────────────────────────┘
```

---

## Machine Learning & XAI Performance

The baseline credit scoring model is an **XGBoost Classifier** trained on tabular credit default data, augmented with dynamic financial ratios (`DTI`, `Loan-to-Income`).

| Metric | Score | Performance Level |
| :--- | :--- | :--- |
| **Accuracy** | **89.40%** | Production Ready |
| **Precision** | **89.61%** | Low False Positive Rate |
| **Recall** | **87.71%** | Robust Default Detection |
| **F1 Score** | **88.65%** | Balanced Classification |
| **ROC-AUC** | **0.9658** | State-of-the-Art Discrimination |

---

## Repository Structure

```
Explainable-Loan-Advisor/
├── ml_engine/                  # Machine Learning & XAI Engine
│   ├── data/
│   │   ├── generate_dataset.py # Underwriting dataset synthesizer
│   │   └── loader.py           # Dynamic Kaggle/LendingClub CSV loader
│   ├── artifacts/              # Serialized model binaries (model.joblib, preprocessor.joblib)
│   ├── preprocessing.py        # Feature engineering & scaling pipeline
│   ├── train.py                # Model training & metric logging script
│   └── explainers.py           # SHAP, LIME, and DiCE counterfactual wrappers
├── backend/                    # FastAPI Backend Service
│   ├── app/
│   │   ├── core/config.py      # Application settings
│   │   ├── db/                 # Database engine & ORM models
│   │   ├── schemas/loan.py     # Pydantic validation schemas
│   │   ├── services/           # ML Inference & Multi-Bank match engine
│   │   └── api/                # API Routers (Auth, Customer, Bank, XAI)
│   └── main.py                 # FastAPI application entry point
├── requirements.txt            # Python dependencies
├── .gitignore                  # Git exclusion rules
└── README.md                   # System documentation
```

---

## Setup & Running Instructions

### Prerequisites
* Python 3.11+
* Git

### 1. Clone Repository & Install Dependencies
```bash
git clone https://github.com/Pra26nav/Explainable-Loan-Advisor.git
cd Explainable-Loan-Advisor
pip install -r requirements.txt
```

### 2. Train Machine Learning Model
```bash
python -m ml_engine.train
```

### 3. Launch FastAPI Backend Server
```bash
python -m backend.main
```

### 4. Interactive API Documentation
Navigate to `http://127.0.0.1:8000/docs` to test endpoints via Swagger UI.

---

## Primary API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Register new Customer or Bank Officer account |
| `POST` | `/api/v1/auth/login` | Authenticate user and issue JWT token |
| `POST` | `/api/v1/customer/apply` | Submit application, run risk prediction, compute bank matches & XAI |
| `POST` | `/api/v1/customer/sandbox` | Real-time parametric slider simulation without persisting data |
| `GET`  | `/api/v1/bank/queue` | Retrieve all applicant requests for underwriter review |
| `POST` | `/api/v1/bank/decision/{id}` | Underwriter manual approval/rejection decision with notes |
| `GET`  | `/api/v1/xai/shap/{id}` | Fetch SHAP feature contribution breakdown for an application |
| `GET`  | `/api/v1/xai/dice/{id}` | Fetch DiCE counterfactual approval roadmap |

---

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
