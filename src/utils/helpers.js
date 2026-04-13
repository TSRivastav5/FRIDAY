export const formatCurrency = (amount, decimals = 0) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateShort = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
};

export const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

export const calculateTotalByCategoryName = (expenses, categoryName) => {
  return expenses
    .filter((e) => e.category === categoryName)
    .reduce((sum, e) => sum + e.amount, 0);
};

export const getCategoryColor = (category) => {
  const colors = {
    Food: '#FF6B6B',
    Travel: '#4ECDC4',
    Shopping: '#FFE66D',
    Entertainment: '#95E1D3',
    Bills: '#C7CEEA',
    Health: '#FF8B94',
    Education: '#B4A7D6',
    Other: '#D4A5A5',
  };
  return colors[category] || '#95E1D3';
};

export const getCategoryIcon = (category) => {
  const icons = {
    Food: '🍔',
    Travel: '🚗',
    Shopping: '🛍️',
    Entertainment: '🎬',
    Bills: '📱',
    Health: '🏥',
    Education: '📚',
    Other: '📌',
  };
  return icons[category] || '📌';
};

export const generateId = () => '_' + Math.random().toString(36).substr(2, 9);

export const getMonthName = (monthIndex) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[monthIndex];
};

export const isToday = (date) => {
  const today = new Date();
  const checkDate = new Date(date);
  return (
    checkDate.getDate() === today.getDate() &&
    checkDate.getMonth() === today.getMonth() &&
    checkDate.getFullYear() === today.getFullYear()
  );
};

export const isThisMonth = (date) => {
  const now = new Date();
  const expDate = new Date(date);
  return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
};
