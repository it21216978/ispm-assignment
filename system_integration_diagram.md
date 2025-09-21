# Departmental Policy Evaluation Platform - System Integration Diagram

This diagram illustrates the comprehensive system integration for the Departmental Policy Evaluation Platform, showing actors, modules, services, onboarding flow, and data flows.

```mermaid
graph TD
    %% Actors (outside system boundary)
    SA[SuperAdmin<br/>- Manages employees, policies, training, performance<br/>- Accesses SuperAdmin dashboard and admin portal]
    E[Employee/User<br/>- Views and completes assignments<br/>- Accesses departmental policies<br/>- Has personal performance tracking]

    %% System Boundary
    subgraph System["Departmental Policy Evaluation Platform"]
        %% Frontend Layer
        subgraph Frontend["Web Frontend"]
            Reg[Shared Registration/Login Page<br/>- Common registration form<br/>- Name, Email, Password]
            subgraph SAPortal["SuperAdmin Portal"]
                SAD[SuperAdmin Dashboard<br/>- Overview and stats]
                Admin[Admin Portal]
                subgraph AdminFuncs["Admin Functions"]
                    EmpMgmt[Employee Management<br/>- Manage employees]
                    PolMgmt[Department Policy Management<br/>- Upload and manage policies]
                    TrainMgmt[Training & Assessment Management<br/>- Create tests per department<br/>- Weekly/monthly assessments]
                    PerfMgmt[Employee Performance Management<br/>- Track scores, completion, compliance]
                end
            end
            subgraph EPortal["Employee Portal"]
                ED[Employee Dashboard<br/>- Assignments, policy references, personal performance]
                Assign[Assignments<br/>- Complete department-specific tests]
                PolRef[Policy References<br/>- View departmental policies]
                PersPerf[Personal Performance<br/>- Track individual scores]
            end
        end

        %% Backend Layer
        subgraph Backend["Backend Services"]
            API[Backend API<br/>- Handles all business logic<br/>- Registration, onboarding, management]
            Auth[Authentication Service<br/>- Login and role-based access<br/>- Invitation-token onboarding]
            Notif[Notification Service<br/>- Invitations, reminders, updates]
            Anal[Analytics Engine<br/>- Process results and data<br/>- Generate performance metrics]
        end

        %% Storage Layer
        subgraph Storage["Persistent Storage"]
            DB[Database<br/>- Users, companies, departments<br/>- Policies, training, assessments, results]
            FS[File Storage<br/>- Policy documents and training materials]
        end

        %% Internal Data Flows
        Reg -->|User registration| API
        API -->|Authenticate| Auth
        Auth -->|Store user| DB
        API -->|Send notifications| Notif
        API -->|Process data| Anal
        Anal -->|Store results| DB
        API -->|Store files| FS
        EmpMgmt -->|CRUD operations| DB
        PolMgmt -->|Upload policies| FS
        PolMgmt -->|Store metadata| DB
        TrainMgmt -->|Store content| DB
        PerfMgmt -->|Query analytics| Anal
        Assign -->|Submit answers| API
        PolRef -->|Retrieve policies| API
        PersPerf -->|Query performance| Anal
    end

    %% External Actor Flows
    SA -->|Registers as first user| Reg
    E -->|Registers via invitation| Reg

    %% Unified Registration & Onboarding Flow
    Reg --> Dec{System Check:<br/>Company exists?}
    Dec -->|No company exists<br/>(First user)| Onboard[Onboarding Wizard<br/>- Fill company details<br/>- Add departments]
    Onboard --> Upgrade[Upgrade User to SuperAdmin<br/>- Link to new company]
    Upgrade --> SAD

    Dec -->|Company exists<br/>(Invited user)| EmpSetup[Employee Setup<br/>- Link via invitation token<br/>- Assign to company/department]
    EmpSetup --> ED

    %% Role-Based Access Flows
    SAD -->|Access admin functions| Admin
    Admin --> AdminFuncs
    ED -->|View assignments| Assign
    ED -->|View policies| PolRef
    ED -->|View performance| PersPerf

    %% Additional Data Flows
    AdminFuncs -->|Policy uploads| FS
    AdminFuncs -->|Training creation| DB
    Assign -->|Test submissions| DB
    Anal -->|Performance calculations| DB
    Notif -->|Invitations| E
    Notif -->|Reminders| E
```

## Diagram Explanation

### Actors
- **SuperAdmin**: First registered user who completes company onboarding and gains administrative privileges.
- **Employee**: Users invited to join existing companies, assigned to departments with limited access.

### Unified Registration & Onboarding Flow
1. All users start with the shared registration page.
2. System checks context:
   - If no company exists → First user onboarding → Upgrade to SuperAdmin.
   - If invited → Direct assignment as Employee.
3. Post-onboarding redirection to appropriate dashboard.

### Core Modules
- **Onboarding & Company Registration**: SuperAdmin-only during initial setup.
- **Employee Management**: Admin portal function for managing users.
- **Department Policy Management**: Upload and manage policy documents.
- **Training & Assessment Management**: Create department-specific tests and training.
- **Employee Performance Management**: Track compliance and scores.
- **SuperAdmin Dashboard**: Overview statistics.
- **Employee Dashboard**: Personal assignments and performance.

### System Components
- **Web Frontend**: Shared registration and role-specific portals.
- **Backend API**: Core business logic and API endpoints.
- **Database**: Relational data storage.
- **File Storage**: Document and media storage.
- **Authentication Service**: Role-based access and invitation handling.
- **Notification Service**: Email/SMS notifications.
- **Analytics Engine**: Data processing for dashboards.

### Key Flows
- Registration → Onboarding decision → Role assignment → Dashboard access.
- SuperAdmin actions flow through admin portal to backend services.
- Employee interactions limited to assignments, policies, and personal data.
- All data persists through database and file storage.
- Analytics drive performance tracking and dashboard updates.