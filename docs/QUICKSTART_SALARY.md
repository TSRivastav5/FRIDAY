# ⚡ Quick Start - Salary Workflow

## 🚀 Try It Now (1 minute)

```bash
cd /Users/trishantsrivastav/FRIDAY
npm run dev
```

Open browser: **http://localhost:5174**

**Tap the green button**: "💰 Salary Credited ✅"

You'll see the 4-step flow!

---

## 🧠 Add Azure OpenAI (5 minutes, Optional)

### 1. Get Credentials from Azure Portal
- Create OpenAI resource: https://portal.azure.com
- Go to "Keys and Endpoint"
- Copy your **API Key** and **Endpoint URL**

### 2. Create `.env.local` file
```env
VITE_AZURE_OPENAI_KEY=your_api_key_here
VITE_AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
VITE_AZURE_OPENAI_DEPLOYMENT=gpt-4
```

### 3. Restart Dev Server
```bash
npm run dev
```

Now the salary flow will use real AI! 🧠

---

## 📚 Full Documentation

- **`SALARY_WORKFLOW.md`** - Complete 4-step flow guide
- **`IMPLEMENTATION_SUMMARY.md`** - What was built
- **`.env.example`** - All config options
- **`DEVELOPMENT.md`** - How to customize

---

## 🎯 The 4-Step Flow

1. **Input**: "How much was credited?" → ₹85,000
2. **Review**: Shows auto-calculated allocation (visual cards)
3. **Adjust**: Use sliders to fine-tune (real-time calculation)
4. **Insight**: Shows investment tip + sends notifications

---

## ✨ What You Get

✅ Smart automatic allocation calculation  
✅ Azure OpenAI personalization (if configured)  
✅ Real-time slider adjustments  
✅ MCP investment insights (mocked or real)  
✅ Browser push notifications (2 notifications)  
✅ Smooth animations throughout  
✅ Works offline with defaults  

---

## 🧪 Without Azure OpenAI

- Still works great! ✓
- Uses default percentages: 21% EMI, 14% Rent, 12% SIP, 7% Travel, 4% Bills
- Mock investment insight shown
- Notifications still work

---

## 🔔 Notifications

When you submit the salary, you'll see:
1. **Notification #1**: Salary credited + breakdown
2. **Notification #2** (after 2s): Investment opportunity

Browser will ask for notification permission first time.

---

## 📱 Mobile Testing

```bash
# Get your machine IP:
ifconfig | grep inet

# Then on phone, visit:
# http://YOUR_MACHINE_IP:5174
```

---

## 📝 Changes Summary

**New Files:**
- `src/services/AIService.js` - Azure OpenAI integration
- `src/services/MCPService.js` - MCP/Grow integration
- `src/services/NotificationService.js` - Notifications
- `SALARY_WORKFLOW.md` - Full documentation
- `IMPLEMENTATION_SUMMARY.md` - What was built

**Updated Files:**
- `src/components/SalaryModal.jsx` - Multi-step flow
- `src/store/financeStore.js` - New methods & fields
- `.env.example` - New config options
- `package.json` - Added @azure/openai

---

## ✅ Status

- ✅ Production build passing
- ✅ Zero errors
- ✅ Ready to use
- ✅ Ready for customization

---

**Start now:**
```bash
npm run dev
```

Enjoy! 🎉
