# 💰 FRIDAY Salary Workflow - Complete Guide

## Overview

The **Salary Trigger Flow** in FRIDAY is an intelligent, multi-step process that automatically calculates your salary allocation, gets AI-powered personalization, and sends notifications with investment insights.

### The 4-Step Flow

```
Step 1: Input          → Step 2: Review          → Step 3: Adjust          → Step 4: Insights
"₹85,000?"              Smart Auto-Calc            Fine-tune Sliders        ✅ Done + Notifications
```

---

## Step 1: Salary Input 💰

**What happens:**
- User taps "Salary Credited ✅" button on homepage
- Modal opens asking: **"How much was credited?"**
- User enters salary amount (e.g., ₹85,000)
- User taps "Continue"

**Back-end:**
- Uses `aiService.calculateSalaryAllocation()` to auto-calculate default allocation percentages
- Stores salary amount temporarily in component state

---

## Step 2: Smart Allocation Review 🧠

**What happens:**
- Modal shows auto-calculated allocation in visual cards:
  - 💳 EMI: ₹18,000 (21%)
  - 🏠 Rent: ₹12,000 (14%)
  - 📈 SIP: ₹10,000 (12%)
  - 🚗 Travel: ₹6,000 (7%)
  - 💡 Bills: ₹3,500 (4%)
  - **💚 Left for You: ₹35,500** (green highlight)

**User options:**
- "← Back" - Go back and change salary amount
- "Personalize →" - Get AI-powered personalization

**Back-end:**
- Shows allocation breakdown calculated from default percentages
- Ready to fetch Azure OpenAI insights on next step

---

## Step 3: Fine-tune with Sliders 🎚️

**What happens:**
- User can adjust each category with sliders
- Real-time calculation of "Left for You" amount
- Shows AI insight at top (if Azure OpenAI is configured)
- Example insight: *"✨ Allocation personalized based on your profile."*

**User actions:**
- Drag sliders to adjust: EMI, Rent, SIP, Travel, Bills
- See remaining amount update in real-time (green card)
- "← Back" - Return to review
- "Complete ✓" - Move to insights & notifications

**Back-end:**
- `aiService.getSalaryAdvice()` - Calls Azure OpenAI with salary amount
- Returns personalized allocation based on user profile (mocked or real)
- Fallback to default percentages if API unavailable

**What Azure OpenAI does:**
```
Input: ₹85,000 salary
Prompt: "Analyze this salary and provide realistic allocation..."
Output: JSON with analysis + adjusted percentages
```

---

## Step 4: Insights & Notifications 📊

**What happens:**
- Shows summary card with:
  - Total salary credited
  - Money left for you (highlighted)
  
- **Investment Opportunity** card (from MCP/Grow):
  - 📈 "Your ELSS is up 14% this year — consider topping up by ₹2,000"
  - 💰 "Top up ₹2,000" button

- **Notification Status** message:
  - 🔔 "You'll receive notifications for salary & investment updates"

- **Final Button**: "✅ Done" - Accept and close

**Back-end:**
1. `mcpService.queryGrowPortfolio()` - Gets investment recommendations
   - Mock response or real MCP server response
   
2. `notificationService.requestPermission()` - Asks user for notification permission
   
3. **Browser Push Notification #1** (Salary Credit):
   ```
   Title: 💰 Salary Credited: ₹85,000
   Body: Allocated:
         EMI: ₹18,000
         Rent: ₹12,000
         SIP: ₹10,000
         Travel: ₹6,000
         Left for you: ₹35,500
   ```

4. **Browser Push Notification #2** (after 2 seconds - Investment):
   ```
   Title: 📈 Investment Opportunity
   Body: Your ELSS is up 14% this year — consider topping up by ₹2,000
   ```

5. **Store Update**: All allocation data saved to Zustand store + localStorage

---

## Configuration

### Required: Azure OpenAI Setup

To enable AI-powered salary personalization:

1. **Create Azure OpenAI resource** in Azure Portal
2. **Get 3 values:**
   - `VITE_AZURE_OPENAI_KEY` - Your API key
   - `VITE_AZURE_OPENAI_ENDPOINT` - Resource URL (https://xxxxx.openai.azure.com/)
   - `VITE_AZURE_OPENAI_DEPLOYMENT` - Your deployment ID (e.g., "gpt-4" or "gpt-35-turbo")

3. **Create `.env.local` file** in project root:
   ```env
   VITE_AZURE_OPENAI_KEY=your_key_here
   VITE_AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
   VITE_AZURE_OPENAI_DEPLOYMENT=your-deployment-id
   ```

4. **App restart** - Dev server will pick up new variables

### Optional: MCP Server (Grow Integration)

To connect to a real MCP server for investment insights:

```env
VITE_MCP_ENDPOINT=http://localhost:8000/mcp
VITE_GROW_MCP_KEY=your_grow_api_key
```

**Without MCP configured:** Mock responses are used

### Optional: Browser Notifications

Push notifications are enabled by default. Users will be prompted for permission the first time they submit a salary.

To disable:
```env
VITE_ENABLE_NOTIFICATIONS=false
```

---

## Data Flow

```
User Input (₹85,000)
    ↓
Step 1: validateInput()
    ↓
Step 2: aiService.calculateSalaryAllocation()
        → Default allocation (21%, 14%, 12%, 7%, 4%)
    ↓
Step 3: aiService.getSalaryAdvice()
        → Calls Azure OpenAI for personalized suggestion
        → Fallback to defaults if API unavailable
        → User adjusts sliders
    ↓
Step 4: mcpService.queryGrowPortfolio()
        → Gets investment recommendations
        → MCPService returns mock or real response
    ↓
notificationService.requestPermission()
    → Sends 2 push notifications
    ↓
financeStore.updateAllocation() & updateInvestmentInsight()
    → Saves allocation to store
    → Saves MCP insight
    ↓
✅ Modal closes, Dashboard updates
```

---

## Code Architecture

### Services (3 new files)

**`src/services/AIService.js`**
- `calculateSalaryAllocation(salary)` - Default percentages
- `getSalaryAdvice(salary, userProfile)` - Azure OpenAI call
- `getInvestmentInsight(investments)` - Investment analysis
- `analyzeSpending(expenses, categoryTotals)` - Spending tips
- `requestNotificationPermission()` - Static method

**`src/services/MCPService.js`**
- `queryGrowPortfolio(investments)` - Get portfolio insights
- `queryRealGrow(investments)` - Real MCP API call
- `getMockGrowInsight(investments)` - Mock recommendation
- `sendPortfolioSnapshot(portfolio)` - Send data to MCP
- `getStatus()` - Connection status check

**`src/services/NotificationService.js`**
- `requestPermission()` - Ask users for browser notification access
- `notifySalaryCredit(salary, allocation, insight)` - Salary notification
- `notifyInvestmentInsight(insight, amount)` - Investment recommendation
- `notifySpendingAlert(category, percentUsed, budget)` - Spending alerts
- `notifyReminder(title, message, icon)` - Generic reminder
- `showToast(message, type)` - In-app fallback
- `getStatus()` - Notification capability check

### Component (Enhanced)

**`src/components/SalaryModal.jsx`** - Now 4-step flow
- MultiStep state management with AnimatePresence
- Visual cards for allocation review
- Slider inputs with real-time calculations
- Integration with all 3 services
- Notification handling

### Store Updates

**`src/store/financeStore.js`**
- Added: `salaryAllocationHistory[]` - Track all salary credits
- Added: `lastInvestmentInsight{}` - Store latest MCP recommendation
- Updated: `updateAllocation()` - Now tracks history
- New: `updateInvestmentInsight()` - Save MCP insights
- Fixed: Computed methods to properly access state

---

## Fallback Behavior

If Azure OpenAI is **NOT configured**:
- ✅ Default percentages still apply
- ✅ User can adjust sliders
- ✅ Mock investment insight still shown
- ✅ Notifications still work
- ⚠️ No personalized AI analysis

If MCP Server is **NOT configured**:
- ✅ Mock "Grow" recommendations shown
- ⚠️ No real portfolio optimization

If Browser Notifications **NOT supported**:
- ✅ In-app toast notifications shown
- ⚠️ No push notifications

---

## Example Flow with Real Data

```
User taps "Salary Credited ✅"
  ↓
Step 1: User enters ₹85,000
  ↓
Step 2: Shows default allocation
  - EMI: ₹17,850 (21%)
  - Rent: ₹11,900 (14%)
  - SIP: ₹10,200 (12%)
  - Travel: ₹5,950 (7%)
  - Bills: ₹3,400 (4%)
  - Left: ₹35,700
  ↓
[User taps "Personalize →"]
  ↓
Azure OpenAI analyzes and suggests slight adjustments...
  ↓
Step 3: User fine-tunes with sliders
  - Increases SIP to ₹12,000 (wants more investing)
  - Decreases Travel to ₹4,000
  - New "Left": ₹36,200
  ↓
[User taps "Complete ✓"]
  ↓
MCP/Grow analyzes portfolio → "ELSS up 14%..."
  ↓
Step 4: Shows summary
  - Salary: ₹85,000 ✓
  - Left for you: ₹36,200 💚
  - Investment tip: Top up ELSS ₹2,000
  ↓
Browser Notifications sent (2)
  ↓
[User taps "✅ Done"]
  ↓
Modal closes
HomePage updates to show new allocation
Dashboard reflects new "Left for You" amount
```

---

## Testing the Feature

### Manual Testing

1. **Without Azure OpenAI:**
   ```bash
   # Leave VITE_AZURE_OPENAI_KEY unset in .env.local
   npm run dev
   # Tap "Salary Credited ✅"
   # Should use default percentages
   # Should show mock AI insight
   ```

2. **With Azure OpenAI:**
   ```bash
   # Set env vars in .env.local
   npm run dev
   # Tap "Salary Credited ✅"
   # Should fetch real AI analysis
   # Should be more personalized
   ```

3. **Notifications:**
   - Check browser console for logs
   - Accept notification permission when prompted
   - Should see 2 push notifications

### Dev Console Logs

```javascript
// Service initialization
[ServiceName] Initialized with endpoint: ...
[ServiceName] Configuration status: ✅/❌

// API calls
[AIService] Fetching salary advice from Azure OpenAI...
[MCPService] Querying Grow MCP...
[NotificationService] Permission granted: true
```

---

## API Protocol Examples

### Azure OpenAI Request

```bash
POST https://your-resource.openai.azure.com/openai/deployments/gpt-4/chat/completions?api-version=2024-02-15-preview

Headers:
  api-key: your_api_key
  Content-Type: application/json

Body:
{
  "messages": [
    {
      "role": "user",
      "content": "You are a financial advisor. Analyze this salary ₹85,000... Provide allocation breakdown in JSON..."
    }
  ],
  "temperature": 0.7,
  "max_tokens": 500
}

Response:
{
  "choices": [
    {
      "message": {
        "content": "{\n  \"analysis\": \"Based on metropolitan India standards...\",\n  \"emi\": 18000,\n  \"rent\": 12000,\n  \"sip\": 10000,\n  \"travel\": 6000,\n  \"bills\": 3500,\n  \"remaining\": 35500\n}"
      }
    }
  ]
}
```

### MCP/Grow Request (when configured)

```bash
POST http://localhost:8000/mcp/grow/analyze

Headers:
  Authorization: Bearer your_grow_api_key
  Content-Type: application/json

Body:
{
  "holdings": [
    { "name": "SIP Portfolio", "type": "SIP", "invested": 120000, "currentValue": 134400 }
  ],
  "totalInvested": 120000
}

Response:
{
  "recommendation": "Your SIP is up 12% this year — consider increasing monthly amount by ₹1,000",
  "action": "topup",
  "suggestedAmount": 1000,
  "confidence": 0.85
}
```

---

## Environment Variables Reference

| Variable | Required | Example | Purpose |
|----------|----------|---------|---------|
| `VITE_AZURE_OPENAI_KEY` | Optional | `sk-abc123...` | Azure OpenAI API key |
| `VITE_AZURE_OPENAI_ENDPOINT` | Optional | `https://api.openai.azure.com/` | Azure OpenAI endpoint |
| `VITE_AZURE_OPENAI_DEPLOYMENT` | Optional | `gpt-4` | Deployment ID |
| `VITE_MCP_ENDPOINT` | Optional | `http://localhost:8000` | MCP server endpoint |
| `VITE_GROW_MCP_KEY` | Optional | `mcp_token_...` | MCP authentication |
| `VITE_ENABLE_NOTIFICATIONS` | Optional | `true` | Enable push notifications |

---

## Performance Considerations

- **AI API Calls**: ~1-2 seconds (network dependent)
- **MCP Queries**: ~500ms (or mock instantly)
- **Notification Permission**: User interaction (1-2 seconds)
- **Total Flow Duration**: ~5-10 seconds (with all services enabled)

---

## Security Notes

⚠️ **Never commit `.env.local` with real API keys**

- Azure OpenAI keys should be in environment variables only
- If deploying to production, use Azure Key Vault
- Consider using server-side proxy for API calls
- Browser notifications are sandboxed by browser security

---

## Future Enhancements

- [ ] Tax optimization suggestions
- [ ] Monthly budget vs actual comparison
- [ ] Savings goal tracking
- [ ] Multi-currency support
- [ ] Family member profiles with separate allocations
- [ ] Recurring adjustment reminders
- [ ] Export allocation as PDF
- [ ] Share allocation with spouse/advisor

---

## Troubleshooting

**Problem**: Azure OpenAI API returns error
- **Solution**: Check API key, endpoint, deployment ID in `.env.local`
- Open browser DevTools → Console → Look for error message

**Problem**: Notifications not appearing
- **Solution**: Browser may have notifications blocked
- Check browser settings: Settings → Privacy → Notifications
- Try allowing FRIDAY app notifications

**Problem**: Sliders not updating calculated values
- **Solution**: Check JavaScript console for errors
- Refresh the page
- Check if other components are interfering

**Problem**: MCP integration not working
- **Solution**: Leave `VITE_MCP_ENDPOINT` empty to use mock data
- Check MCP server is running on configured endpoint
- Check `VITE_GROW_MCP_KEY` is correct

---

## Support & Documentation

- **Main Docs**: `README_FRIDAY.md`
- **Development**: `DEVELOPMENT.md`
- **Getting Started**: `GETTING_STARTED.md`
- **File Index**: `FILE_INDEX.md`

---

Created with ❤️ as part of the FRIDAY Financial Intelligence System
