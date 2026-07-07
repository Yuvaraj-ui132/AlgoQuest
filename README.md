<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=180&section=header&text=⚡%20AlgoForge&fontSize=52&fontColor=fff&animation=twinkling&fontAlignY=36&desc=Premium%20DSA%20Dashboard%20for%20Placement%20Preparation&descAlignY=58&descSize=16" />

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-algoquest--9aab0.web.app-6E40C9?style=for-the-badge)](https://algoquest-9aab0.web.app)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)

</div>

---

## 💡 What is AlgoForge?

**AlgoForge** is a premium, in-browser DSA practice dashboard built specifically for placement preparation. It gives you everything in one place — a curated problem bank, a VS Code-quality editor, real-time code execution, and synced progress across devices.

> No LeetCode premium. No switching tabs. Just focused, tracked, and beautiful preparation.

---

## 🚀 Features

| Feature | Description |
|---|---|
| 📋 **Problem Tracker** | Curated DSA questions organized by topic, difficulty & tier |
| 💻 **Monaco Code Editor** | VS Code's engine — syntax highlighting, themes, IntelliSense |
| ⚙️ **Code Runner** | Execute code via Judge0 CE API — see runtime & memory stats |
| 🔥 **Firebase Sync** | Progress saved to Firestore in real-time, across all devices |
| 🔐 **Authentication** | Secure login/signup with Firebase Auth |
| 🌗 **Dark / Light Mode** | Seamless theme toggle with smooth CSS transitions |
| 📊 **Progress Analytics** | Chart.js visualizations — topic-wise and tier-wise breakdowns |
| 🎯 **Placement Focused** | TCS NQT · TCS Digital · Infosys · Wipro · FAANG patterns |

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
| Hosting | Firebase Hosting |
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
├── firebase.json            # Firebase Hosting config
├── firestore.rules          # Firestore security rules
└── README.md
```

---

## ⚡ Getting Started (Local)

> No build step needed — pure HTML/CSS/JS project.

**1. Clone the repository**

```bash
git clone https://github.com/Yuvaraj-ui132/AlgoQuest.git
cd AlgoQuest
```

**2. Run locally**

```bash
npx http-server -p 8000
```

Open [http://localhost:8000](http://localhost:8000) in your browser.

---

## 🔑 Firebase Setup (Self-hosting)

To connect your own Firebase project:

1. Create a project at [Firebase Console](https://console.firebase.google.com/)
2. Enable **Email/Password Auth** under Authentication → Sign-in methods
3. Create a **Firestore Database** (production mode)
4. Paste your config into `js/firebase-config.js`:

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

5. Deploy Firestore rules: `firebase deploy --only firestore:rules`
6. Deploy hosting: `firebase deploy --only hosting`

---

## 🎨 Design Highlights

- ⚡ **Dark-first** Linear/Vercel-inspired aesthetic
- 🪟 Glassmorphism cards with smooth micro-animations
- 🎨 CSS variable-based theming — one-click dark/light switch
- 📱 Fully responsive sidebar navigation
- ✨ Custom scrollbars, focus rings, and hover transitions

---

## 📈 Roadmap

- [ ] GitHub-style contribution heatmap
- [ ] Daily study plan & goal tracking
- [ ] Multi-language support (Python, Java, C++)
- [ ] AI-powered hints & explanations
- [ ] Shareable progress profiles & leaderboard

---

## 👤 Author

**Yuvaraj Murkunde** — [@Yuvaraj-ui132](https://github.com/Yuvaraj-ui132)

---

## 📄 License

Open source under the [MIT License](LICENSE).

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=100&section=footer"/>

*Made with ❤️ and ⚡ for placement warriors*

</div>
