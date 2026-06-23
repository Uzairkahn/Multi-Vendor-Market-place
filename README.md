# Multi-Vendor Marketplace Platform

A full-stack marketplace platform that connects customers with service providers. Customers can browse services, submit project requests, track project progress, and leave reviews, while providers manage services, handle client requests, and maintain professional profiles. Administrators can monitor platform-wide statistics through a dedicated dashboard.

## Features

### Customer Features

- User Registration & Login
- Browse Available Services
- Search and Filter Services
- Submit Service Requests
- Track Project Status
- Submit Reviews and Ratings
- Customer Dashboard

### Provider Features

- User Registration & Login
- Provider Profile Management
- Profile Picture Upload (Cloudinary)
- Create Services
- Edit Services
- Delete Services
- Manage Client Requests
- Update Project Status
- View Reviews & Ratings
- Provider Dashboard

### Admin Features

- User Statistics
- Provider Statistics
- Service Statistics
- Request Statistics
- Admin Dashboard

### Security Features

- JWT Authentication
- Role-Based Access Control (Customer, Provider, Admin)
- Protected API Routes
- Authorization Middleware
- Secure Password Hashing

## Technology Stack

### Frontend

- HTML5
- CSS3
- Bootstrap 5
- JavaScript (ES6)

### Backend

- Node.js
- Express.js

### Database

- MongoDB Atlas
- Mongoose ODM

### Cloud Services

- Cloudinary (Image Upload & Storage)

### Authentication

- JSON Web Tokens (JWT)

## System Roles

### Customer
Customers can browse services, request projects, track progress, and submit reviews.

### Provider
Providers can manage their services, accept client requests, update project status, and maintain their professional profile.

### Admin
Administrators can monitor platform statistics including users, services, providers, and project requests.

## Project Workflow

<img width="1024" height="1536" alt="ChatGPT Image Jun 23, 2026, 05_09_37 PM" src="https://github.com/user-attachments/assets/02f9d4bb-b8fe-4a38-9b6e-52ba89a26ead" />

## Installation Guide

### Clone Repository

```bash
git clone <repository-url>
cd FSWD-1-Marketplace
```

### Install Backend Dependencies

```bash
cd backend
npm install
```

### Environment Variables

Create a file at:

```bash
backend/.env
```

Add the following values:

```env
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-url>/<database-name>
JWT_SECRET=your_jwt_secret
PORT=5000
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### Start Backend Server

```bash
npm run dev
```

Application runs at:

```txt
http://localhost:5000
```

> Note: Open the app through the Express server, not via `file:///`. The frontend relies on `/api/...` calls and needs the same origin.

## Project Structure

```
FSWD-1-Marketplace
│
├── backend
│   ├── config
│   ├── controllers
│   ├── middleware
│   ├── models
│   ├── routes
│   ├── server.js
│
├── frontend
│   ├── assets
│   ├── css
│   ├── js
│   ├── admin-dashboard.html
│   ├── customer-dashboard.html
│   ├── index.html
│   ├── login.html
│   ├── provider-dashboard.html
│   ├── register.html
│   ├── services.html
│
├── README.md
└── .gitignore
```

## API Endpoints

### Health

- `GET /api/health` — API health check

### Auth

- `POST /api/auth/register` — Register a customer or provider
- `POST /api/auth/login` — Login and receive a JWT

### Provider Profiles

- `GET /api/provider-profiles/me` — Get the logged-in provider profile
- `POST /api/provider-profiles/me/photo` — Upload profile picture for the logged-in provider
- `POST /api/provider-profiles` — Create/update provider profile
- `PUT /api/provider-profiles/me` — Update the logged-in provider profile
- `GET /api/provider-profiles/:providerId` — Get public provider profile by provider ID

### Services

- `GET /api/services` — List services, supports optional `search` and `category`
- `POST /api/services` — Create a service as provider/admin
- `GET /api/services/:id` — Get service details
- `PUT /api/services/:id` — Update a service as owner/admin
- `DELETE /api/services/:id` — Delete a service as owner/admin

### Requests

- `POST /api/requests` — Create a service request
- `GET /api/requests` — Get requests for the current user
- `PUT /api/requests/:id/status` — Update request status

### Reviews

- `POST /api/reviews` — Add a provider review
- `GET /api/reviews/provider/:id` — Get provider reviews and rating summary

### Admin

- `GET /api/admin/stats` — Get platform statistics for admin users

## Database Schema Summary

- `User` — name, email, password, role
- `ProviderProfile` — user, profile photo, bio, skills, experience, pricing, portfolio items
- `Service` — title, description, category, price, delivery time, provider reference
- `Request` — customer, service, requirements, budget, deadline, status
- `Review` — provider, customer, rating, feedback

## Project Status

✅ Authentication System Completed

✅ Customer Dashboard Completed

✅ Provider Dashboard Completed

✅ Admin Dashboard Completed

✅ Service Management Completed

✅ Request Management Completed

✅ Reviews & Ratings Completed

✅ MongoDB Atlas Integration Completed

✅ Cloudinary Integration Completed

✅ Role-Based Access Control Completed

## Future Enhancements

- Real-time notifications and chat
- Payment gateway integration
- Advanced analytics and reporting
- Service recommendation engine
- Mobile-friendly PWA experience

## Author

**Uzair Khan**

BS Computer Science Graduate

GitHub: [https://github.com/Uzairkahn](https://github.com/Uzairkahn)

LinkedIn: [https://www.linkedin.com/in/uzair-khan-616048385/](https://www.linkedin.com/in/uzair-khan-616048385/)
