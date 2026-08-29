# Company Assets Tracker

A web-based asset management system developed as a DBMS mini-project.

The main purpose of this project is to help a company keep track of its assets and manage which employee is using which asset. The system also keeps records of asset returns and maintenance history.

Instead of managing these records manually or using separate spreadsheets, this project provides a centralized database system where all the information can be managed in one place.

---

## About the Project

In a company, assets such as laptops, monitors, printers, mobile phones, and other equipment are regularly assigned to employees. When these records are maintained manually, it can become difficult to know:

- Which assets are currently available
- Which employee is using a particular asset
- When an asset was assigned or returned
- Which assets are under maintenance
- How many assets belong to a particular category

The Company Asset Tracker is designed to solve these problems by connecting a web interface with a PostgreSQL relational database.

The administrator can manage employees, departments, assets, assignments, and maintenance records through the system.

---

## Main Features

### Employee Management

The system allows the administrator to:

- Add new employees
- View employee details
- Update employee information
- Delete employee records
- Associate employees with departments

### Asset Management

The system can be used to:

- Add company assets
- View available and assigned assets
- Update asset information
- Delete asset records
- Categorize different types of assets
- Track the current condition and status of assets

### Asset Assignment

An asset can be assigned to an employee and the assignment can be recorded in the database.

The system keeps information about:

- Which asset was assigned
- Which employee received it
- The date of assignment
- The date of return
- The current assignment status

The assignment table also helps preserve the history of asset usage.

### Maintenance Records

Maintenance information can be recorded for assets that require repair or servicing.

The system stores:

- The asset involved
- The issue or problem
- Maintenance date
- Completion date
- Maintenance status
- Maintenance cost
- Additional remarks

### Dashboard

The dashboard provides a quick overview of the asset records, such as:

- Total number of assets
- Available assets
- Assigned assets
- Assets under maintenance
- Total employees

---

## Technology Stack

The project is divided into three main parts:

```text
┌──────────────────────────┐
│        FRONTEND          │
│  HTML | CSS | Bootstrap  │
│    Vanilla JavaScript    │
└────────────┬─────────────┘
             │
             │ REST API
             ▼
┌──────────────────────────┐
│         BACKEND          │
│     Node.js + Express    │
└────────────┬─────────────┘
             │
             │ SQL Queries
             ▼
┌──────────────────────────┐
│        DATABASE          │
│        PostgreSQL        │
└──────────────────────────┘
```

| Layer    | Technology                              |
|----------|------------------------------------------|
| Frontend | HTML, CSS, Bootstrap, Vanilla JavaScript |
| Backend  | Node.js, Express                        |
| Database | PostgreSQL                              |

---

## Database Design (Overview)

The system is built around the following core entities:

- **Employees** — employee details, linked to a department
- **Departments** — organizational grouping for employees
- **Assets** — company equipment with category, condition, and status
- **Assignments** — records linking assets to employees, with assignment/return dates and status
- **Maintenance** — repair/service records linked to assets, including cost and status



## Usage

Once the application is running, the administrator can log in and:

1. Set up departments and add employees
2. Add company assets and categorize them
3. Assign assets to employees and track assignment status
4. Log maintenance records when an asset needs repair
5. View the dashboard for a quick summary of all asset activity

---

## Project Status

This project is developed as part of a DBMS mini-project and is under active development. Feedback and contributions are welcome.

---

## License

This project is open source. Feel free to use, modify, and distribute it for educational purposes.

---

## Author

Developed as a DBMS mini-project.
