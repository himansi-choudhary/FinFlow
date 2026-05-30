# 💸 FinFlow — Smart Expense Tracker

> A premium fintech-style expense tracker built with vanilla HTML, CSS, and JavaScript. No frameworks. No build tools. Just open and use.

![HTML](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=flat&logo=chartdotjs&logoColor=white)

---

## ✨ Features

### Core
- ➕ Add, edit, and delete **income & expense** transactions
- 📊 **Dashboard** with total balance, income, expenses, and savings rate
- 📅 **Monthly summary** with previous/next month navigation
- 🗂️ **Transaction history** with search, filter, and sort
- 🏷️ **Categories** — Food, Travel, Shopping, Bills, Entertainment, and more

### Charts & Analytics
- 🍩 **Donut / Pie chart** — spending by category
- 📈 **Bar chart** — income vs expenses over 3/6/12 months
- 📉 **Trend line chart** — daily spending over 30/60/90 days
- 🔍 **Expense insights** — top category, month-over-month comparison, savings rate

### Budget & Goals
- 🎯 **Category budgets** with visual progress bars and over-limit warnings
- 💰 **Savings goal tracker** with target amount, saved amount, and deadline
- ⚠️ Budget warning banner when approaching limits

### Bonus
- 🔁 **Recurring expenses** manager (weekly / monthly / yearly)
- 📤 **Export to CSV** — download all transactions
- 📥 **Import from CSV** — bulk upload transactions
- 🌍 **Currency selector** — USD, EUR, GBP, INR, JPY, CAD, AUD
- 🌙 **Dark / Light mode** toggle with persistence
- 💾 **LocalStorage** — all data saved in the browser, no backend needed

---

## 🗂️ Project Structure

```
finflow/
├── index.html   # App structure & all pages/modals
├── style.css    # Full UI — dark/light themes, responsive layout
├── script.js    # All logic — state, charts, storage, modals
└── README.md
```

---

## 🚀 Getting Started

No installation or build step required.

```bash
# Clone the repo
git clone https://github.com/your-username/finflow.git

# Open in browser
cd finflow
open index.html
```

Or just **download the ZIP**, extract it, and double-click `index.html`.

---

## 📱 Responsive Design

Fully responsive across all screen sizes:
- 🖥️ Desktop — sidebar navigation + multi-column grid
- 📱 Mobile — hamburger menu, stacked cards, scrollable tables

---

## 📦 Dependencies (CDN — no install needed)

| Library | Purpose |
|---|---|
| [Chart.js 4](https://www.chartjs.org/) | All charts |
| [Lucide Icons](https://lucide.dev/) | UI icons |
| [Google Fonts](https://fonts.google.com/) | Syne + DM Sans |

---

## 📸 Pages Overview

| Page | Description |
|---|---|
| **Dashboard** | Balance cards, pie & bar charts, monthly summary, recent transactions |
| **Transactions** | Full table with search, filter by type/category/month, sort, pagination |
| **Analytics** | Trend chart, donut chart, expense insights, category breakdown |
| **Budget & Goals** | Set monthly category budgets, track savings goals |
| **Recurring** | Manage subscriptions and repeating bills |

---

## 📄 CSV Format

For importing, your CSV should follow this structure:

```
Date,Description,Type,Category,Amount,Note
2024-03-01,Groceries,expense,Food,45.50,Weekly shop
2024-03-02,Salary,income,Salary,3000,March salary
```

---

## 🛠️ Tech Stack

- **HTML5** — semantic structure
- **CSS3** — custom properties, grid, flexbox, animations
- **Vanilla JavaScript** — no frameworks, modular and well-commented
- **Chart.js** — interactive charts
- **LocalStorage** — client-side data persistence

---

## 📝 License

MIT — free to use, modify, and distribute.

---

> Built with ❤️ using only vanilla web technologies.
