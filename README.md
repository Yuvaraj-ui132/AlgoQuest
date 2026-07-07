# ⚡ AlgoForge

> **A premium DSA practice dashboard built for placement preparation**  
> *Track problems · Write & run code · Stay on top of your prep*

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Monaco Editor](https://img.shields.io/badge/Monaco_Editor-007ACC?style=for-the-badge&logo=visual-studio-code&logoColor=white)](https://microsoft.github.io/monaco-editor/)

---

## 🚀 Features

- **📋 Problem Tracker** — Curated DSA questions organized by topic, difficulty, and tier (Easy / Medium / Hard)
- **💻 In-Browser Code Editor** — Powered by **Monaco Editor** (same engine as VS Code) with syntax highlighting and theme support
- **⚙️ Code Runner** — Execute code against test cases using the **Judge0 CE API** and see runtime & memory usage
- **🔥 Firebase Sync** — Progress is saved to **Firestore** in real-time across sessions and devices
- **🔐 Authentication** — Secure login / signup powered by **Firebase Auth**
- **🌗 Light / Dark Mode** — Seamless theme toggle with smooth transitions
- **📊 Progress Analytics** — Visual charts showing topic-wise and tier-wise completion stats
- **🎯 Placement Focused** — Covers TCS NQT, TCS Digital, Infosys, Wipro, and general FAANG-style patterns

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, Vanilla CSS, JavaScript (ES6+) |
| Code Editor | Monaco Editor (CDN) |
| Code Execution | Judge0 CE API |
| Authentication | Firebase Auth |
| Database | Cloud Firestore |
| Charts | Chart.js |
| Icons | Font Awesome 6 |

---

## 📁 Project Structure

```
AlgoForge/
├── index.html               # Main application shell
├── css/
│   └── style.css            # Complete design system & component styles
├── js/
│   ├── app.js               # Core application controller
│   ├── compiler.js          # Judge0 API integration & Monaco editor setup
│   ├── firebase.js          # Firebase auth & Firestore sync logic
│   ├── firebase-config.js   # Firebase project configuration
│   └── question-metadata.js # Curated DSA question bank
├── data/
│   ├── questions.json       # Question definitions
│   └── tiers.json           # Tier/difficulty configuration
├── firestore.rules          # Firestore security rules
└── README.md
```

---

## ⚡ Getting Started (Local)

> No build step needed — this is a pure HTML/CSS/JS project.

### 1. Clone the repository

```bash
git clone https://github.com/Yuvaraj-ui132/AlgoQuest.git
cd AlgoQuest
```

### 2. Serve locally

Using `http-server` (recommended):

```bash
npx http-server -p 8000
```

Then open [http://localhost:8000](http://localhost:8000) in your browser.

Or simply open `index.html` directly in your browser.

---

## 🔑 Firebase Setup

This project uses Firebase for authentication and data persistence. To connect your own Firebase project:

1. Go to [Firebase Console](https://console.firebase.google.com/) and create a project
2. Enable **Email/Password Authentication** under Auth → Sign-in methods
3. Create a **Firestore Database** in production mode
4. Copy your Firebase config into `js/firebase-config.js`:

```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

5. Deploy your Firestore rules from `firestore.rules`

---

## 🎨 Design Highlights

- **Dark-first design** with a sleek Linear/Vercel-inspired aesthetic
- Glassmorphism cards and smooth micro-animations
- Fully responsive sidebar navigation
- Custom scrollbars and CSS variable-based theming

---

## 📈 Roadmap

- [ ] GitHub-style contribution heatmap
- [ ] Study plan / daily goal tracking
- [ ] Multi-language support (Python, Java, C++)
- [ ] AI-powered hints
- [ ] Shareable progress profiles

---

## 👤 Author

**Yuvaraj** — [@Yuvaraj-ui132](https://github.com/Yuvaraj-ui132)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">Made with ❤️ and ⚡ for placement warriors</p>
