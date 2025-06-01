# Database Schema Overview

Below is the Mermaid ERD diagram for the project's database schema, based on the current setup.

```mermaid
erDiagram
    USERS {
        string id PK
        string username
        string hashed_password
        string territory_id
    }
    PATIENTS {
        string id PK
        string name
        string encrypted_PHI
        string territory_id
        string user_id FK "References the user who owns the patient record"
    }
    ORDERS {
        string id PK
        string patient_id FK "References the patient"
        string user_id FK "References the user"
        string status
        string territory_id
    }
    IVR_LOGS {
        string id PK
        string call_id
        string user_input
        string response
        string user_id FK "References the user"
    }
    ANALYTICS_LOGS {
        string id PK
        string timestamp
        string user_id FK "References the user"
        string aggregated_metrics
    }
    REPORTS {
        string id PK
        string analytics_logs_id FK "References analytics logs"
    }
    NOTIFICATIONS {
        string id PK
        string user_id FK "References the user"
        string message
        string status
    }
    COMPLIANCE_LOGS {
        string id PK
        string check_type
        string result
        string timestamp
        string user_id FK "References the user"
    }
    SECURITY_LOGS {
        string id PK
        string event_type
        string timestamp
        string user_id FK "References the user"
    }
    USERS ||--o{ PATIENTS : has
    USERS ||--o{ ORDERS : places
    USERS ||--o{ IVR_LOGS : interacts
    USERS ||--o{ ANALYTICS_LOGS : generates
    ANALYTICS_LOGS ||--o{ REPORTS : contributes_to
    USERS ||--o{ NOTIFICATIONS : receives
    USERS ||--o{ COMPLIANCE_LOGS : triggers
    USERS ||--o{ SECURITY_LOGS : involves
```

This diagram visualizes the relationships between the key tables in the database. 