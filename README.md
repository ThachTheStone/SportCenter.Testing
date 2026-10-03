<div align="center">

![Laravel](https://img.shields.io/badge/Laravel-FF2D20?style=flat-square&logo=laravel&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=flat-square&logo=mysql&logoColor=white)

# VIP Sport Center

**Full-stack sports center management platform — Laravel REST API + React 18 frontend.**

</div>

---

## Overview

VIP Sport Center pairs a **Laravel API back end** with a **React 18 + Tailwind CSS front end**, offering a modern SPA experience for sports center management.

## Features

- 🏠 **Public Landing Page** with services and pricing
- 🔐 **JWT Authentication** for clients and admins
- 👤 **Client Portal** — profile, membership, session booking
- 🛠️ **Admin Dashboard** — full CRUD for clients, subscriptions, activities
- 📊 **Physical Assessment Tracking**
- 💳 **Payment Management**

## Tech Stack

| Layer | Technology |
|---|---|
| Back End | Laravel REST API |
| Front End | React 18 + Vite |
| Styling | Tailwind CSS |
| Database | MySQL 8 |

## Installation

```bash
git clone https://github.com/zinnewassim/sportcenter.git && cd sportcenter
composer install && cp .env.example .env && php artisan key:generate
php artisan migrate --seed && php artisan serve
npm install && npm run dev
```

---
**Author:** [Wassim Azinne](https://github.com/zinnewassim)
