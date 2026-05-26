// ============================================================
// 🌐 FRIDAY API Client (Connects Frontend ↔ Backend)
// ============================================================

const API_BASE =
  import.meta.env.VITE_API_URL || "https://friday-xrjt.onrender.com/api";

class FridayAPI {
  constructor() {
    this.token = localStorage.getItem("friday_token");
  }

  async _fetch(endpoint, options = {}) {
    const headers = {
      "Content-Type": "application/json",
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
    };

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        this.logout();
      }
      throw new Error(data.error || "Something went wrong");
    }

    return data;
  }

  get(url) {
    return this._fetch(url);
  }
  post(url, body) {
    return this._fetch(url, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }
  put(url, body) {
    return this._fetch(url, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }
  del(url) {
    return this._fetch(url, { method: "DELETE" });
  }

  // Auth
  async login(email, password) {
    const data = await this.post("/auth/login", { email, password });
    this.token = data.token;
    localStorage.setItem("friday_token", data.token);
    localStorage.setItem("friday_user", JSON.stringify(data.user));
    return data;
  }

  async loginPin(email, pin) {
    const data = await this.post("/auth/login-pin", { email, pin });
    this.token = data.token;
    localStorage.setItem("friday_token", data.token);
    localStorage.setItem("friday_user", JSON.stringify(data.user));
    return data;
  }

  async updatePin(pin) {
    return this.put("/auth/pin", { pin });
  }

  async register(name, email, password) {
    const data = await this.post("/auth/register", {
      name,
      email,
      password,
    });
    this.token = data.token;
    localStorage.setItem("friday_token", data.token);
    localStorage.setItem("friday_user", JSON.stringify(data.user));
    return data;
  }

  logout() {
    this.token = null;
    localStorage.removeItem("friday_token");
    localStorage.removeItem("friday_user");
  }

  deleteAccount() {
    return this.del("/auth/delete-account");
  }

  isLoggedIn() {
    return !!this.token;
  }

  getUser() {
    try {
      return JSON.parse(localStorage.getItem("friday_user"));
    } catch {
      return null;
    }
  }

  // Salary
  creditSalary(amount) {
    return this.post("/ai/salary-credited", { amount });
  }
  getSalaryHistory() {
    return this.get("/salary");
  }
  getCurrentSalary() {
    return this.get("/salary/current");
  }
  updateAllocation(id, allocation, paidAllocations) {
    return this.put(`/salary/${id}/allocation`, { allocation, paidAllocations });
  }
  deleteSalary(id) {
    return this.del(`/salary/${id}`);
  }

  // Expenses
  getExpenses(params = {}) {
    const q = new URLSearchParams(params).toString();
    return this.get(`/expenses?${q}`);
  }
  addExpense(expense) {
    return this.post("/expenses", expense);
  }
  deleteExpense(id) {
    return this.del(`/expenses/${id}`);
  }
  getExpenseSummary(month) {
    return this.get(`/expenses/summary?month=${month}`);
  }

  // Investments
  getInvestments() {
    return this.get("/investments");
  }
  addInvestment(inv) {
    return this.post("/investments", inv);
  }
  updateInvestment(id, data) {
    return this.put(`/investments/${id}`, data);
  }
  deleteInvestment(id) {
    return this.del(`/investments/${id}`);
  }
  clearAllInvestments() {
    return this.del("/investments/clear/all-assets");
  }
  syncGrowwPortfolio() {
    return this.post("/investments/sync-groww");
  }
  getMarketQuote(symbol) {
    return this.get(`/investments/market/quote/${symbol}`);
  }

  // AI
  chatWithFriday(message) {
    return this.post("/ai/chat", { message });
  }
  getInvestmentAdvice(budget) {
    return this.post("/ai/investment-advice", { budget });
  }
  getSpendingAnalysis() {
    return this.get("/ai/spending-analysis");
  }
  getPortfolioReview() {
    return this.get("/ai/portfolio-review");
  }
  getChatHistory() {
    return this.get("/ai/chat-history");
  }
  getTelemetryInsight() {
    return this.get("/ai/telemetry-insight");
  }

  // Family
  addFamilyMember(data) {
    return this.post("/auth/family/add", data);
  }
  getFamilyMembers() {
    return this.get("/auth/family");
  }

  // Profile
  updateProfile(profile) {
    return this.put("/auth/profile", {
      financialProfile: profile,
    });
  }

  // ─── Push Notifications ────────────────────────────────────────────────────
  getVapidPublicKey() {
    return this.get("/push/vapid-public-key");
  }

  subscribeToPush(subscription) {
    return this.post("/push/subscribe", { subscription });
  }

  unsubscribeFromPush(endpoint) {
    return this.post("/push/unsubscribe", { endpoint });
  }
}

export const api = new FridayAPI();
export default api;