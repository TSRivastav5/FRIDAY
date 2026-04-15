export const mockExpenses = [
  { id: 1, category: 'Food', amount: 450, date: '2026-04-13', description: 'Lunch at Café' },
  { id: 2, category: 'Travel', amount: 200, date: '2026-04-13', description: 'Uber to office' },
  { id: 3, category: 'Shopping', amount: 1200, date: '2026-04-12', description: 'New shoes' },
  { id: 4, category: 'Bills', amount: 500, date: '2026-04-11', description: 'Electricity bill' },
  { id: 5, category: 'Food', amount: 350, date: '2026-04-11', description: 'Dinner' },
  { id: 6, category: 'Travel', amount: 150, date: '2026-04-10', description: 'Auto rickshaw' },
  { id: 7, category: 'Entertainment', amount: 300, date: '2026-04-10', description: 'Movie tickets' },
  { id: 8, category: 'Food', amount: 550, date: '2026-04-09', description: 'Groceries' },
  { id: 9, category: 'Shopping', amount: 800, date: '2026-04-08', description: 'Tech accessories' },
  { id: 10, category: 'Travel', amount: 100, date: '2026-04-08', description: 'Metro card recharge' },
];

export const mockInvestments = [
  {
    id: 1,
    name: 'Axis Bank SIP',
    type: 'SIP',
    amount: 5000,
    currentValue: 5200,
    date: '2026-01-15',
    months: 3,
  },
  {
    id: 2,
    name: 'TCS Stock',
    type: 'Stock',
    amount: 25000,
    currentValue: 26500,
    date: '2026-02-01',
  },
  {
    id: 3,
    name: 'HDFC Mutual Fund',
    type: 'Mutual Fund',
    amount: 10000,
    currentValue: 10800,
    date: '2026-03-10',
  },
  {
    id: 4,
    name: 'Nifty 50 ETF',
    type: 'ETF',
    amount: 3000,
    currentValue: 3150,
    date: '2026-04-01',
  },
];

export const mockSalaryHistory = [
  { month: 'January', amount: 50000, allocated: true },
  { month: 'February', amount: 50000, allocated: true },
  { month: 'March', amount: 50000, allocated: true },
  { month: 'April', amount: 50000, allocated: false },
];

export const salaryAllocationTemplate = {
  emi: 0.30, // 30% - EMI/Loans
  rent: 0.20, // 20% - Rent
  travel: 0.06, // 6% - Travel & Commute
  utilities: 0.04, // 4% - Utilities & Subscriptions
  food: 0.15, // 15% - Food & Groceries
  sip: 0.20, // 20% - SIP/Investments
  savings: 0.05, // 5% - Emergency Savings
};

export const expenseCategories = [
  { id: 'Food', name: 'Food 🍔', color: '#FF6B6B', icon: '🍔' },
  { id: 'Travel', name: 'Travel 🚗', color: '#4ECDC4', icon: '🚗' },
  { id: 'Shopping', name: 'Shopping 🛍️', color: '#FFE66D', icon: '🛍️' },
  { id: 'Entertainment', name: 'Entertainment 🎬', color: '#95E1D3', icon: '🎬' },
  { id: 'Bills', name: 'Bills 📱', color: '#C7CEEA', icon: '📱' },
  { id: 'Health', name: 'Health 🏥', color: '#FF8B94', icon: '🏥' },
  { id: 'Education', name: 'Education 📚', color: '#B4A7D6', icon: '📚' },
  { id: 'Other', name: 'Other 📌', color: '#D4A5A5', icon: '📌' },
];

export const investmentTypes = [
  { id: 'SIP', name: 'Systematic Investment Plan', icon: '📈' },
  { id: 'Stock', name: 'Stocks', icon: '📊' },
  { id: 'Mutual Fund', name: 'Mutual Funds', icon: '💼' },
  { id: 'ETF', name: 'Exchange Traded Funds', icon: '🔄' },
  { id: 'Savings', name: 'Savings Account', icon: '🏦' },
  { id: 'Crypto', name: 'Cryptocurrency', icon: '₿' },
];

export const fridayInsights = [
  {
    id: 1,
    title: 'Spending Pattern Alert',
    message: 'You spent 25% more on food this month compared to last month.',
    type: 'warning',
    icon: '📊',
  },
  {
    id: 2,
    title: 'Investment Opportunity',
    message: 'Your SIP investments have gained 4.2% this quarter. Keep it up!',
    type: 'success',
    icon: '📈',
  },
  {
    id: 3,
    title: 'Savings Goal',
    message: 'You can increase your SIP by ₹2,000 without affecting your lifestyle.',
    type: 'info',
    icon: '💡',
  },
  {
    id: 4,
    title: 'Travel Optimization',
    message: 'Consider switching to a monthly travel pass to save ₹500/month.',
    type: 'info',
    icon: '🚗',
  },
];

export const fridayResponses = [
  {
    query: 'How much should I invest?',
    response: 'Based on your salary of ₹50,000 and current expenses, I recommend investing 20-25% of your monthly income. That would be ₹10,000-₹12,500. Start with a diversified SIP approach.',
  },
  {
    query: 'Can I afford a phone worth ₹30,000?',
    response: 'With your current balance of ₹42,500 and monthly allocation, you can afford it, but I recommend using EMI to spread the cost over 12 months at ~₹2,500/month to maintain your lifestyle.',
  },
  {
    query: 'Where should I invest?',
    response: 'For your age and risk profile, I suggest: 50% in Nifty 50 ETF, 30% in Mutual Funds, and 20% in individual stocks. Start with ₹5,000-₹10,000 monthly SIPs.',
  },
  {
    query: 'How much am I overspending?',
    response: 'You spent ₹4,700 this month on food, which is 10% higher than your allocated ₹4,200. Consider meal planning to save ~₹500 monthly.',
  },
];

export const generateId = () => '_' + Math.random().toString(36).substr(2, 9);
