

<h1 align="center">👛 1p Challenge Automator</h1>
<p align="center">
  Making saving effortless. <br>
  
</p>
<h3>Built using the Starling Bank API.</h3>
<img src="imgs//starling-logo.png" width=150>
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
<i>What's easier than saving a small amount each day and ending up with a lump sum?</i> <b>Getting a slaving machine to do it for you of course!</b> <br><br>
This Python script automates the process of saving by transferring the correct amount into a Starling Savings Goal each day.

When the user enters their challenge start date, the program calculates all the required amounts at once and stores these in a JSON file. Every day, when the script is run, the program transfers the corresponding amount to the savings goal, then marks the transfer as completed in the `amounts.json` file.


---

## ✨ Features

<h3>📅 Configurable challenge start date:</h3>

When the program is first run, you will be asked to set your start date. If needed, you can rerun the `calculateAmounts.py` script to change the start date and recalculate the amounts.

<h3>💷 Automatic daily transfer calculation</h3>

The program checks how many days it has been since your challenge start date and transfers the corresponding amount into the Starling goal.

<h3>🔒 Secure authentication using a Starling Personal Access Token</h3>

Initially, you will need to store this token, which grants access to your account and savings spaces, securely in either a `.env` file (if being used locally), or in a secrets manager (like AWS Secrets Manager), since you do not want this token to end up in the wrong hands. 

<h3>✅ Prevents duplicate transfers</h3>

Once the transfer for a particular day has been completed, the program stores this day's transfer as completed. If the script is accidentally run again on a particular day, no duplicate transfer will occur since the app checks the status of the transfer completion first.

<h3>☁️ Ready for cloud deployment</h3>

This app is ideal for use on AWS or another cloud platform. A guide for how to do this will be done shortly.

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
