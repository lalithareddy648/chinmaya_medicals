# Chinmaya Medicals

A full-stack pharmacy and medicine management web application built to
make medicine browsing, ordering, and store inventory management easier.

**GitHub Repository:**
https://github.com/lalithareddy648/chinmaya_medicals

## Overview

Chinmaya Medicals is a pharmacy web application designed for customers
and store administrators. Customers can browse available medicines and
view their prices, while the admin can manage medicine listings and
inventory.

The application also includes discounted pricing and stock updates to
help keep product availability accurate.

## Features

### Customer Features

-   Browse the medicines available in the store.
-   View medicine prices and discounted prices.
-   See product availability based on stock.
-   Customer tracking information is available for store-side reference.

### Admin Features

-   Add new medicine listings.
-   Delete medicine listings.
-   Manage medicine stock.
-   Stock quantity is reduced when an order is placed.
-   Products with no remaining stock can be shown as out of stock.

### Pricing

-   Supports discounted medicine prices.
-   The application uses a 15% discount on the listed price.

## Tech Stack

-   **Frontend:** React
-   **Backend:** Node.js, Express.js
-   **Database:** MongoDB
-   **Authentication:** JSON Web Token (JWT)
-   **API Testing:** Thunder Client
-   **Deployment:** Vercel
-   **Mobile/PWA enhancement:** Progressive Web App (PWA) and Capacitor
    Android app support are part of the project's recent development
    work.

## Repository Structure

``` text
chinmaya_medicals/
├── .github/
│   └── workflows/
├── api/
├── backend/
├── frontend/
├── .gitignore
├── package-lock.json
├── package.json
└── vercel.json
```

## Getting Started

### Prerequisites

Make sure the following are installed:

-   Node.js and npm
-   MongoDB (local instance or MongoDB Atlas)
-   Git

### Clone the Repository

``` bash
git clone https://github.com/lalithareddy648/chinmaya_medicals.git
cd chinmaya_medicals
```

### Install Dependencies

Install dependencies in the relevant application folders:

``` bash
cd backend
npm install
```

``` bash
cd ../frontend
npm install
```

If your deployment or API configuration uses the `api` folder, review
its package configuration and environment requirements before running it
separately.

### Environment Configuration

Create the environment file required by the backend and configure the
values used by your project. Typical settings may include:

``` env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

Use the exact variable names referenced in your source code. Do not
commit real credentials, database connection strings, or secret keys to
GitHub.

### Run the Application

Start the backend using the script defined in `backend/package.json`
(commonly `npm start` or `npm run dev`).

Start the frontend using the script defined in `frontend/package.json`
(commonly `npm start` or `npm run dev`).

The exact commands depend on the scripts configured in each package
file.

## Project Purpose

This project demonstrates the development of a full-stack pharmacy
application, combining a customer-facing medicine catalogue with
administrative inventory management.

## Future Enhancements

-   Improve medicine search and filtering.
-   Add medicine expiry-date alerts.
-   Improve order and inventory reporting.
-   Continue enhancing the installable PWA and Android experience.

## Author

**Lalitha Reddy**

------------------------------------------------------------------------

If you find this project useful, feel free to explore the repository and
the live application.
