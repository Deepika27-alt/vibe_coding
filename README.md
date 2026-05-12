# Workflow Platform

A powerful, full-stack workflow automation platform built with React 18, Material UI v6, NestJS, Prisma, and PostgreSQL. This platform enables organizations to design, execute, and monitor complex business processes through a visual interface.

## 🚀 Key Features

### 🎨 Workflow Studio (Visual Designer)
*   **Drag-and-Drop Editor**: Build complex workflows visually using a React Flow-powered designer.
*   **Rich Node Ecosystem**: 
    *   **Start/End Nodes**: Define process boundaries.
    *   **Form Tasks**: Create interactive forms for user input.
    *   **Notifications**: Configure automated system alerts.
    *   **SLA Nodes**: Set time-based constraints and deadlines.
    *   **Conditional Logic**: Create branching paths based on form data.
*   **Form Builder**: Define dynamic fields (Text, Number, Date, Select, etc.) for each task.

### ⚙️ Workflow Engine
*   **State-Driven Execution**: Robust engine to handle workflow transitions and state persistence.
*   **Automated Transitions**: seamless movement between nodes based on user actions or system events.
*   **Concurrent Flows**: Support for complex branching and parallel execution paths.

### 📥 Work Portal (End-User Interface)
*   **Unified Inbox**: A central hub for users to view and action their assigned tasks.
*   **Task Execution**: Interactive task detail views with dynamic forms and file upload support.
*   **My Requests**: Real-time tracking of workflows initiated by the user.
*   **Service Catalogue**: A searchable directory of available workflow templates to initiate.

### 🛠️ Admin Console
*   **User Management**: Full CRUD operations for users, including status toggling (Active/Inactive).
*   **RBAC (Role-Based Access Control)**: Granular permission management and role assignments.
*   **Audit Logging**: Comprehensive system-wide audit trail with filtering and export capabilities.
*   **Analytics Dashboard**: Visual insights into workflow performance, bottleneck identification, and completion metrics.
*   **System Settings**: Global configuration for platform-wide parameters.

### ⏱️ SLA & Notifications
*   **SLA Monitoring**: Automated tracking of task deadlines with visual indicators.
*   **Notification System**: Real-time system notifications to keep users informed of new assignments and status updates.

## 🏗️ Project Structure

- `apps/web`: Modern React frontend built with Vite, TypeScript, and Material UI v6.
- `apps/api`: Scalable NestJS backend with Prisma ORM.
- `packages/shared-types`: Shared TypeScript interfaces and DTOs for type safety across the stack.

## 🛠️ Prerequisites

- **Node.js**: 18+
- **npm**: 9+
- **PostgreSQL**: A running instance of PostgreSQL database.

## 🚀 Getting Started

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Configure Environment**
    Copy `apps/api/.env.example` to `apps/api/.env` and configure your PostgreSQL connection string and other service credentials.

3.  **Database Migration**
    ```bash
    cd apps/api
    npx prisma db push
    ```

4.  **Run Development Servers**
    ```bash
    npm run dev
    ```
    * Frontend: `http://localhost:5173`
    * Backend API: `http://localhost:3000`
