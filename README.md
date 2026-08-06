<p align="center">
  <img src="assets/starling-logo.png" alt="Starling Bank Logo" width="90">
</p>

<h1 align="left">Starling 1p Challenge Automator</h1>
![Python](https://img.shields.io/badge/Python-3.11-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![Status](https://img.shields.io/badge/Status-Active-success)

<p align="center">
  Automatically completes the classic 1p savings challenge using the Starling Bank API.
</p>

---

## 📖 Overview

The **Starling 1p Challenge Automator** is a Python application that automates the popular 1p savings challenge by transferring the correct amount into a Starling Savings Goal each day.

Rather than manually calculating and transferring the amount every day, the application:

- Determines today's challenge amount based on a configurable start date.
- Uses the Starling API to transfer the correct amount.
- Records completed transfers to prevent duplicates.
- Can be scheduled to run automatically (e.g. with AWS Lambda or Task Scheduler).

---

## ✨ Features

- 📅 Configurable challenge start date
- 💷 Automatic daily transfer calculation
- 🔒 Secure authentication using a Starling Personal Access Token
- ✅ Prevents duplicate transfers
- ☁️ Ready for cloud deployment

---

## 📸 Screenshots

### Main Application

<p align="center">
  <img src="assets/main.png" width="700">
</p>

---

### Successful Transfer

<p align="center">
  <img src="assets/success.png" width="700">
</p>

---

### Project Structure

<p align="center">
  <img src="assets/structure.png" width="700">
</p>

---

## 🛠 Technologies Used

- Python
- Starling Bank API
- Requests
- Python Dotenv
- JSON

---

## 🚀 Future Improvements

- AWS Lambda deployment
- Automatic email or Discord notifications
- Progress dashboard
- Logging and analytics
- Unit tests

---

## ⚠ Disclaimer

This project is an independent personal project and is **not affiliated with or endorsed by Starling Bank**.

Use at your own risk.
