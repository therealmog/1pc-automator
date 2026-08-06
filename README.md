

<h1 align="center">👛 1p Challenge Automator</h1>
<p align="center">
  Making saving effortless. <br>
  
</p>
<h3>Built using the Starling Bank API.</h3>
<p align="left">
  <img src="https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white">
  <a href="https://developer.starlingbank.com/docs" target="_blank"><img src="https://img.shields.io/badge/API-Starling-00B5E2"></a>
  <img src="https://img.shields.io/badge/Status-Active-success">
</p>

---
## 👛 What's the 1p challenge?
<p align="left">For someone who doesn't have a lot of money to spare each month, the idea of putting aside a lump sum can be difficult. </p>
  <ul>
    <li>They may lack the motivation to save - they have the money now, so why bother saving?</li>
    <li>It may not be financially viable for them at that moment in time to put the money aside, but they still want to save.</li>
  </ul>
<p align="left">The 1p challenge is designed to help someone save incrementally, where the amounts they save grow over time. <br></br></p>
<p align="center">  
  <b>On day 1</b>: Save 1p <i>(cmon that's easy!)</i><br>
  <b>On day 2</b>: Save 2p <i>(really?)</i><br>
  <b>On day 3</b>: Save 3p <i>(this saving business is a breeze!)</i><br>
  <i><h3 align="center">100 DAYS LATER...</h3></i>
  <p align="center"><b>On day 103</b>: Save 103p <i>(um, this still feels easy?)</i><br></p>
  <h3 align="center">At Day 103, they have £53.05 saved. And it was easy.</h3>
</p>
  
</p>

---
## 📖 Overview
<i>What's easier than saving a small amount each day and ending up with a lump sum?</i> <b>Getting a slaving machine to do it for you!</b> <br><br>
This Python script automates this savings challenge by transferring the correct amount into a Starling Savings Goal each day.

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
