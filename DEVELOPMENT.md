# 🛠️ FRIDAY Development Workflow Guide

This guide covers common development tasks and best practices for working with FRIDAY.

---

## 📋 Daily Development Workflow

### 1. Start Development
```bash
cd /Users/trishantsrivastav/FRIDAY
npm run dev
```
Access at: `http://localhost:5174`

### 2. Make Changes
- Edit any file in `src/`
- Changes auto-reload instantly (HMR)
- Styling updates in real-time

### 3. Test in Browser
- Test on desktop browser
- Use Chrome DevTools mobile emulation (iPhone 15)
- Or open on actual phone: `http://<your-ip>:5174`

### 4. Commit & Push
```bash
git add .
git commit -m "feat: Add feature name"
git push
```

---

## 🎨 Adding a New Component

### Step 1: Create Component File
```bash
touch src/components/MyComponent.jsx
```

### Step 2: Write Component
```jsx
import { motion } from 'framer-motion';

export const MyComponent = ({ title, onClick }) => {
  return (
    <motion.div
      className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-premium"
      whileHover={{ scale: 1.05 }}
    >
      <h3 className="font-bold">{title}</h3>
      <button onClick={onClick} className="btn-primary mt-4">
        Click Me
      </button>
    </motion.div>
  );
};
```

### Step 3: Export from index.js
Edit `src/components/index.js`:
```javascript
export { MyComponent } from './MyComponent';
```

### Step 4: Use in Page
```jsx
import { MyComponent } from '../components';

export const MyPage = () => {
  const handleClick = () => console.log('Clicked!');
  
  return <MyComponent title="Hello" onClick={handleClick} />;
};
```

---

## 📄 Adding a New Page

### Step 1: Create Page Component
```bash
touch src/pages/MyPage.jsx
```

### Step 2: Create Page
```jsx
import { motion } from 'framer-motion';

export const MyPage = () => {
  return (
    <div className="pb-32 pt-4 px-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-3xl font-bold mb-6">My Page</h1>
        {/* Content here */}
      </motion.div>
    </div>
  );
};
```

### Step 3: Export from pages/index.js
```javascript
export { MyPage } from './MyPage';
```

### Step 4: Add to App.jsx
```jsx
import { MyPage } from './pages';

const renderPage = () => {
  switch (store.activeTab) {
    case 'home':
      return <HomePage />;
    case 'mypage':
      return <MyPage />;
    // ...
  }
};
```

### Step 5: Add to Bottom Navigation
Edit `src/components/BottomNav.jsx`:
```jsx
const tabs = [
  { id: 'home', icon: '🏠', label: 'Home' },
  { id: 'mypage', icon: '⭐', label: 'My Page' },
  // ...
];
```

---

## 🎯 Working with State (Zustand)

### Reading State
```jsx
import { useFinanceStore } from '../store/financeStore';

export const MyComponent = () => {
  const store = useFinanceStore();
  
  return (
    <div>
      <p>Total Balance: {store.totalBalance}</p>
      <p>Expenses: {store.expenses.length}</p>
    </div>
  );
};
```

### Calling Actions
```jsx
const store = useFinanceStore();

// Add expense
store.addExpense({
  id: generateId(),
  category: 'Food',
  amount: 500,
  date: '2026-04-13',
  description: 'Lunch',
});

// Delete expense
store.deleteExpense(1);

// Update allocation
store.updateAllocation({
  salary: 50000,
  emi: 15000,
  // ...
});
```

### Computed Values
```jsx
const store = useFinanceStore();

// Get monthly expenses
const monthlyExpenses = store.getMonthlyExpenses(store);

// Get total
const total = store.getTotalMonthlyExpense(store);

// Get by category
const byCategory = store.getExpensesByCategory(store);

// Investment stats
const investStats = store.getInvestmentStats(store);
```

---

## 🎨 Styling Guidelines

### Use Tailwind Classes
```jsx
<div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-premium hover:shadow-lg transition-all">
  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Title</h3>
  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Description</p>
</div>
```

### Use Component Classes
```jsx
<button className="btn-primary">Save</button>
<button className="btn-secondary">Cancel</button>
<input className="input-field" type="text" />
<div className="glass rounded-2xl p-4">Glass effect</div>
```

### Dark Mode Support
```jsx
// Always add dark: variant for dark mode
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
```

### Responsive Design
```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
```

---

## ✨ Adding Animations

### Page Transition
```jsx
<motion.div
  initial={{ opacity: 0, x: 20 }}
  animate={{ opacity: 1, x: 0 }}
  exit={{ opacity: 0, x: -20 }}
  transition={{ duration: 0.3 }}
>
  Page content
</motion.div>
```

### Hover Effect
```jsx
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
  Click Me
</motion.button>
```

### Stagger List
```jsx
<motion.div>
  {items.map((item, idx) => (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: idx * 0.1 }}
    >
      {item.name}
    </motion.div>
  ))}
</motion.div>
```

### Animating Values
```jsx
<motion.div
  animate={{ width: isOpen ? 100 : 0 }}
  transition={{ duration: 0.5 }}
>
  Content
</motion.div>
```

---

## 📊 Working with Charts

### Pie Chart
```jsx
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Food', value: 400 },
  { name: 'Travel', value: 300 },
];

<ResponsiveContainer width="100%" height={250}>
  <PieChart>
    <Pie data={data} dataKey="value" cx="50%" cy="50%" outerRadius={80}>
      {data.map((entry, idx) => (
        <Cell key={`cell-${idx}`} fill={entry.color} />
      ))}
    </Pie>
  </PieChart>
</ResponsiveContainer>
```

### Bar Chart
```jsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const data = [
  { date: 'Week 1', spending: 1200 },
  { date: 'Week 2', spending: 1800 },
];

<ResponsiveContainer width="100%" height={250}>
  <BarChart data={data}>
    <CartesianGrid />
    <XAxis dataKey="date" />
    <YAxis />
    <Tooltip />
    <Bar dataKey="spending" fill="#6366f1" radius={[8, 8, 0, 0]} />
  </BarChart>
</ResponsiveContainer>
```

### Line Chart
```jsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

<ResponsiveContainer width="100%" height={250}>
  <LineChart data={data}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="date" />
    <YAxis />
    <Tooltip />
    <Legend />
    <Line type="monotone" dataKey="spending" stroke="#6366f1" />
    <Line type="monotone" dataKey="budget" stroke="#10b981" strokeDasharray="5 5" />
  </LineChart>
</ResponsiveContainer>
```

---

## 🧪 Testing Components

### Manual Testing
1. Change to the feature branch
2. Run `npm run dev`
3. Test in browser
4. Test on mobile device
5. Test dark mode
6. Test all interactions

### Checklist Before Commit
- [ ] Component renders without errors
- [ ] Styling looks good in light mode
- [ ] Styling looks good in dark mode
- [ ] Animations are smooth
- [ ] Mobile layout is correct
- [ ] State updates correctly
- [ ] No console errors

---

## 🔍 Debugging Tips

### Browser DevTools
1. Open **DevTools** (F12)
2. Go to **Console** tab to see errors
3. Use **Elements** tab to inspect HTML
4. Use **Network** tab for API calls (future)

### React DevTools
```bash
npm install -D react-devtools
```
Then inspect components and state.

### Zustand DevTools
```javascript
// Add to financeStore.js to debug state
import { devtools } from 'zustand/middleware';

export const useFinanceStore = devtools(create((set) => ({ ... })));
```

### Common Errors
- **"is not exported by"** → Add export in index.js
- **"Cannot read property of undefined"** → Check state initialization
- **CSS not applying** → Clear cache, restart dev server
- **Dark mode not working** → Add `dark:` classes to elements

---

## 🚀 Building for Production

### Pre-build Checklist
```bash
# Check for errors
npm run lint

# Build
npm run build

# Preview build locally
npm run preview
```

### After Building
- Check `dist/` folder created
- Test production build locally
- Deploy to hosting service

### Optimizations
- Remove unused imports
- Lazy load components if over 100KB
- Use dynamic imports for pages
- Minify assets (Vite does automatically)

---

## 📝 Code Style Guidelines

### File Naming
- Components: `PascalCase.jsx` (e.g., `BalanceCard.jsx`)
- Pages: `PascalCase.jsx` + Page suffix (e.g., `HomePage.jsx`)
- Utils: `camelCase.js` (e.g., `helpers.js`)
- Data: `camelCase.js` (e.g., `mockData.js`)

### Component Template
```jsx
import { motion } from 'framer-motion';

export const MyComponent = ({ prop1, prop2, onAction }) => {
  // Logic here
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="..."
    >
      {/* JSX */}
    </motion.div>
  );
};
```

### Formatting
- Use 2-space indentation
- Add blank lines between functions
- Use descriptive variable names
- Add comments for complex logic

---

## 🔗 Useful Command Reference

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run preview          # Preview production build

# Maintenance
npm install              # Install dependencies
npm update               # Update dependencies
npm audit                # Check vulnerabilities

# Cleaning
rm -rf node_modules      # Remove node_modules
npm cache clean --force  # Clear npm cache
rm -rf dist              # Remove build folder
```

---

## 📚 Component Patterns

### Modal Pattern
```jsx
import { AnimatePresence } from 'framer-motion';

export const MyModal = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50"
          onClick={onClose}
        >
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal content */}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
```

### Form Pattern
```jsx
const [formData, setFormData] = useState({ name: '', amount: '' });

const handleChange = (field, value) => {
  setFormData((prev) => ({ ...prev, [field]: value }));
};

const handleSubmit = () => {
  if (formData.name && formData.amount) {
    store.addItem(formData);
    setFormData({ name: '', amount: '' });
  }
};

<input
  value={formData.name}
  onChange={(e) => handleChange('name', e.target.value)}
  className="input-field"
/>
```

### List Pattern
```jsx
{items.length === 0 ? (
  <EmptyState icon="👻" title="No Items" description="Add your first item!" />
) : (
  <div className="space-y-2">
    {items.map((item) => (
      <motion.div key={item.id}>
        {/* Item component */}
      </motion.div>
    ))}
  </div>
)}
```

---

## 💡 Performance Tips

- Use `useCallback` for expensive functions
- Memoize computed values with `useMemo`
- Virtualize long lists (100+ items)
- Lazy load images with `next/image` (when using Next.js)
- Code split large components
- Minimize re-renders with proper state structure

---

**Happy coding! 🚀**

For questions, refer to:
- Component files in `src/components/`
- Page files in `src/pages/`
- Mock data in `src/data/mockData.js`
- Store in `src/store/financeStore.js`
