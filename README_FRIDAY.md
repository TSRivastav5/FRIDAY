# 💰 FRIDAY - Financial Resource Intelligent Daily Assistant for You

A modern, mobile-first AI-powered personal finance manager web app that combines the best features of Apple Wallet, Notion, and ChatGPT.

## 🎯 Features

### Core Features
- **💰 Salary Management** - Track salary credits and automatic money allocation
- **📊 Expense Tracking** - Categorize and track all your expenses with visual breakdowns
- **📈 Investment Portfolio** - Manage SIPs, stocks, mutual funds, and ETFs
- **💡 Smart Insights** - AI-driven financial insights and spending patterns
- **💬 FRIDAY AI Assistant** - Chat with your AI financial advisor
- **🎨 Dark/Light Mode** - Beautiful UI with system theme preference

### UI/UX Features
- Mobile-first responsive design optimized for iPhone
- Smooth animations with Framer Motion
- Premium glassmorphism effects
- Bottom navigation for easy access
- Floating chat button with animated notifications
- Real-time expense categorization

## 🧱 Tech Stack

- **Frontend**: React 19 + Vite
- **Styling**: Tailwind CSS with custom design system
- **State Management**: Zustand (lightweight and performant)
- **Animations**: Framer Motion
- **Data Visualization**: Recharts
- **Icons**: Emoji-based icons + Lucide React ready

## 📱 Screen Breakdown

### 1. Home (Dashboard)
- Greeting card with user info and total balance
- Monthly salary status indicator
- Quick action cards for:
  - Salary Credited action
  - Expenses overview
  - Investment summary
  - Bills & EMIs
- FRIDAY's latest insights

### 2. Expenses
- Easy add expense form with categories
- Monthly spending breakdown with pie chart
- Category-wise spending analysis
- Transaction history with delete option
- Empty state when no expenses

### 3. Investments
- Portfolio overview with gain/loss tracking
- Investment comparison chart
- Add new investment form supporting:
  - SIP (Systematic Investment Plans)
  - Stocks
  - Mutual Funds
  - ETFs
  - Savings Accounts
- Individual investment cards with performance

### 4. Insights & Analytics
- Weekly spending trends (line chart)
- Top spending categories ranking
- Smart suggestions from FRIDAY
- Spending alerts and opportunities

### 5. Profile
- User financial stats overview
- Settings for:
  - Dark mode toggle
  - Notifications
  - Budget alerts
- About section
- App version information

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm/yarn

### Installation

1. Navigate to the project directory:
```bash
cd /Users/trishantsrivastav/FRIDAY
```

2. Install dependencies (already done):
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and go to `http://localhost:5174`

The app will be available on your network at the displayed URL. Perfect for testing on actual phones!

## 📦 Project Structure

```
src/
├── components/          # React components
│   ├── BottomNav.jsx
│   ├── DashboardCard.jsx
│   ├── SalaryModal.jsx
│   ├── ExpenseList.jsx
│   ├── ChatWidget.jsx
│   ├── InvestmentCard.jsx
│   ├── BalanceCard.jsx
│   └── UIUtils.jsx
├── pages/              # Page components
│   ├── HomePage.jsx
│   ├── ExpensesPage.jsx
│   ├── InvestmentsPage.jsx
│   ├── InsightsPage.jsx
│   └── ProfilePage.jsx
├── store/              # Zustand store
│   └── financeStore.js
├── data/               # Mock data
│   └── mockData.js
├── utils/              # Utility functions
│   └── helpers.js
├── App.jsx             # Main app component
├── main.jsx            # React entry point
└── index.css           # Global Tailwind styles
```

## 🎨 Design System

### Color Palette
- **Primary**: Indigo (#6366f1)
- **Secondary**: Purple (#a855f7)
- **Success**: Green (#10b981)
- **Warning**: Orange (#f97316)
- **Danger**: Red (#ef4444)

### Design Tokens
- **Border Radius**: 2xl (16px) for cards, 3xl (24px) for modals
- **Shadows**: Premium shadow for elevated elements
- **Backdrop**: Glassmorphism with blur effect
- **Spacing**: Consistent 4px grid system via Tailwind

## 💾 State Management (Zustand)

The app uses a single centralized store for all state:

```javascript
useFinanceStore()
```

### Store Actions
- `addExpense()` - Add new expense
- `deleteExpense()` - Remove expense
- `addInvestment()` - Add investment
- `updateAllocation()` - Update salary allocation
- `addChatMessage()` - Add chat message
- `setActiveTab()` - Change current page
- `toggleDarkMode()` - Toggle theme
- And more...

## 🎬 Animation Details

- **Page Transitions**: Smooth fade + slide animations
- **Card Hover**: Scale up on hover
- **Button Press**: Scale down on tap
- **List Items**: Stagger animation on load
- **Chat Widget**: Spring animation when opening
- **Floating Button**: Subtle bounce animation

## 📱 Mobile Optimization

- Viewport-fit: cover for notch support
- Touch-friendly button sizes (minimum 48px)
- Swipe-ready bottom navigation
- Fixed bottom nav for easy thumb access
- Optimized for both light and dark modes
- System font stack for native feel
- PWA-ready meta tags

## 🔮 Future Enhancements

### Upcoming Features
- [ ] Backend integration with API
- [ ] User authentication with Entra ID
- [ ] Real expense data from bank APIs
- [ ] Real investment portfolio integration
- [ ] WebSocket for real-time AI chat (AI-powered by Azure OpenAI)
- [ ] Push notifications
- [ ] Export reports (PDF)
- [ ] Bill payment reminders
- [ ] SIP calculator
- [ ] Investment recommendations engine
- [ ] Budget vs actual comparison
- [ ] Multi-user support
- [ ] Transaction import from CSV

### Backend Services (When Ready)
- Azure Functions for serverless APIs
- Azure SQL Database for data persistence
- Azure Key Vault for secrets
- Azure AI Services for intelligent chat
- Azure Application Insights for analytics

## 🧪 Mock Data

Currently, the app uses mock data from `src/data/mockData.js`:

- **5 Sample Expenses** - Food, Travel, Shopping, Bills
- **4 Sample Investments** - Diverse portfolio
- **Monthly Salary History** - Tracking
- **Predefined Categories** - With emojis and colors

To replace with real data, update the store initialization and API calls.

## 🛠️ Development

### Running the App
```bash
npm run dev
```

### Building for Production
```bash
npm run build
```

### Preview Build
```bash
npm run preview
```

### Linting
```bash
npm run lint
```

## 🎯 UI/UX Best Practices Used

1. **Mobile-First**: Started with mobile layout, enhanced for larger screens
2. **DarkMode**: Full dark mode support using Tailwind's dark: prefix
3. **Accessibility**: Semantic HTML, proper ARIA labels
4. **Performance**: Lazy loading ready, optimized animations
5. **Feedback**: Visual feedback for all interactive elements
6. **Error Handling**: Empty states and loading indicators

## 📝 Component API

### DashboardCard
```jsx
<DashboardCard
  icon="💰"
  title="Salary Credited"
  value="₹50,000"
  subtitle="This month"
  onClick={handleClick}
  color="indigo"
/>
```

### SalaryModal
Parameters: `isOpen`, `onClose`, `onSubmit`, `currentAllocation`

### ExpenseList
Parameters: `expenses`, `onAddExpense`, `onDeleteExpense`

### ChatWidget
Parameters: `isOpen`, `onClose`, `messages`, `onSendMessage`

## 📜 License

MIT - Feel free to use this as a starter for your personal finance projects!

## 🤝 Contributing

This is a personal project, but feel free to fork and customize it for your needs!

## 🙏 Credits

Built with:
- React & Vite
- Tailwind CSS
- Framer Motion
- Zustand
- Recharts

---

**Made with ❤️ for your financial freedom** 💰
