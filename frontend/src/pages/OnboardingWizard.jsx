import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFinanceStore } from '../store/financeStore';
import { formatCurrency } from '../utils/helpers';
import { ShaderBackground } from '../components/ShaderBackground';

export const OnboardingWizard = () => {
  const store = useFinanceStore();
  const userName = store.user?.name || "Rahul";

  const [step, setStep] = useState('pin'); // 'pin' | 'salary' | 'commitments' | 'investments' | 'summary'
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [isSavingPin, setIsSavingPin] = useState(false);
  const [salary, setSalary] = useState('');
  
  // Custom allocations
  const [emi, setEmi] = useState(0);
  const [rent, setRent] = useState(0);
  const [bills, setBills] = useState(0);
  const [sip, setSip] = useState(0);

  const parsedSalary = parseInt(salary) || 0;
  const totalAllocated = emi + rent + bills + sip;
  const remaining = Math.max(0, parsedSalary - totalAllocated);

  // Future value of a monthly SIP at 12% annual return over 5 years (60 months)
  const monthlyRate = 0.12 / 12;
  const sipFiveYearValue = sip > 0
    ? sip * ((Math.pow(1 + monthlyRate, 60) - 1) / monthlyRate) * (1 + monthlyRate)
    : 0;
  const formatLakhs = (n) => `₹${(n / 100000).toFixed(1)} Lakhs`;

  const handlePinKeyPress = (num) => {
    if (pin.length >= 4 || isSavingPin) return;
    const newVal = pin + num;
    setPin(newVal);
    setPinError('');

    if (newVal.length === 4) {
      setTimeout(async () => {
        setIsSavingPin(true);
        try {
          await store.setPin(newVal);
          setStep('salary');
        } catch (err) {
          setPinError(err.message || 'Could not save PIN — please try again.');
          setPin('');
        } finally {
          setIsSavingPin(false);
        }
      }, 300);
    }
  };

  const handlePinBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleSalarySubmit = () => {
    if (!salary || parseInt(salary) <= 0) {
      alert('Please enter a valid salary amount');
      return;
    }

    setStep('commitments');
  };

  const handleFinalize = async () => {
    store.setSalaryModal(false);
    
    try {
      // 1. Credit salary in backend
      await store.creditSalary(parsedSalary);
      
      // 2. Update allocation presets
      await store.updateAllocation({
        salary: parsedSalary,
        emi,
        rent,
        bills,
        sip,
        travel: 0,
        remaining,
      });

      // 3. Clear locked just in case
      store.setLocked(false);
    } catch (e) {
      console.error("Failed to complete onboarding:", e);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] bg-background text-on-surface flex flex-col justify-between items-stretch px-5 pt-12 pb-10 overflow-y-auto selection:bg-transparent">
      {/* Ambient shader + colored blooms, matching the login screen */}
      <div className="absolute inset-0 opacity-70 pointer-events-none z-0">
        <ShaderBackground />
      </div>
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-primary/15 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-[250px] h-[250px] bg-tertiary-container/15 rounded-full blur-[80px] pointer-events-none"></div>

      {/* Top Banner (Logo/Step Indicator) */}
      <div className="relative flex justify-between items-center z-10 shrink-0">
        <h1 className="text-sm font-black tracking-widest text-primary font-headline">FRIDAY</h1>
        <div className="flex gap-1.5">
          {['pin', 'salary', 'commitments', 'investments', 'summary'].map((s, idx) => {
            const stepsList = ['pin', 'salary', 'commitments', 'investments', 'summary'];
            const currentIdx = stepsList.indexOf(step);
            const isCompleted = stepsList.indexOf(s) < currentIdx;
            const isActive = s === step;
            return (
              <div 
                key={s} 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  isActive ? 'w-5 bg-primary' : isCompleted ? 'w-2 bg-tertiary' : 'w-2 bg-surface-container-high'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative flex-grow flex flex-col justify-center items-center py-6 z-10 w-full max-w-sm mx-auto text-center">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: PIN Setup */}
          {step === 'pin' && (
            <motion.div
              key="step-pin"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full flex flex-col items-center gap-6"
            >
              <div className="space-y-2">
                <h2 className="text-2xl font-bold font-headline">Personal Security</h2>
                <p className="text-xs text-on-surface-variant leading-relaxed px-4">Set a 4-digit security PIN to quickly and securely login to your account next time.</p>
              </div>

              {pinError && (
                <p className="text-[11px] text-error font-semibold uppercase tracking-wider px-4 text-center">{pinError}</p>
              )}
              {isSavingPin && !pinError && (
                <p className="text-[10px] text-on-surface-variant/70 uppercase tracking-wider">Saving PIN…</p>
              )}

              {/* Dot Indicators */}
              <div className="flex gap-4 py-2">
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className={`w-3.5 h-3.5 rounded-full border transition-all duration-200 ${
                      pin.length > idx
                        ? 'bg-primary border-primary scale-110 shadow-[0_0_10px_rgba(26,86,245,0.4)]'
                        : 'border-outline-variant/50 bg-transparent'
                    }`}
                  />
                ))}
              </div>

              {/* Pin Keypad Grid */}
              <div className="grid grid-cols-3 gap-y-4 gap-x-8 w-full max-w-[240px]">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    onClick={() => handlePinKeyPress(num.toString())}
                    disabled={isSavingPin}
                    className="w-14 h-14 rounded-full border border-outline-variant/20 bg-surface-container-low active:bg-primary/20 hover:border-outline-variant/30 flex items-center justify-center font-semibold text-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {num}
                  </button>
                ))}
                <div />
                <button
                  onClick={() => handlePinKeyPress('0')}
                  disabled={isSavingPin}
                  className="w-14 h-14 rounded-full border border-outline-variant/20 bg-surface-container-low active:bg-primary/20 hover:border-outline-variant/30 flex items-center justify-center font-semibold text-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  0
                </button>
                <button
                  onClick={handlePinBackspace}
                  disabled={isSavingPin}
                  className="w-14 h-14 rounded-full flex items-center justify-center text-on-surface-variant active:text-on-surface transition-colors disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-lg">backspace</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Income Setup */}
          {step === 'salary' && (
            <motion.div
              key="step-salary"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full flex flex-col items-center gap-8 text-left"
            >
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold font-headline">Welcome, {userName}!</h2>
                <p className="text-xs text-on-surface-variant leading-relaxed px-4">Let's configure your financial profile. What is your monthly credited salary?</p>
              </div>

              <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-5 w-full flex flex-col gap-2 shadow-inner backdrop-blur-sm">
                <label className="text-[10px] font-semibold text-on-surface-variant/70 uppercase tracking-widest ml-1">Credited Income</label>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-primary">₹</span>
                  <input
                    type="number"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    placeholder="85000"
                    className="w-full bg-transparent border-none text-2xl font-bold text-on-surface focus:ring-0 focus:outline-none p-0"
                    autoFocus
                  />
                </div>
              </div>

              <button
                onClick={handleSalarySubmit}
                className="w-full bg-primary hover:shadow-lg hover:shadow-primary/10 active:scale-[0.98] py-4 rounded-xl font-bold tracking-widest text-xs uppercase transition-all shadow-md mt-4 text-center flex justify-center"
              >
                Continue Setup
              </button>
            </motion.div>
          )}

          {/* STEP 3: Commitments Setup */}
          {step === 'commitments' && (
            <motion.div
              key="step-commitments"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full flex flex-col gap-6 text-left"
            >
              <div>
                <h2 className="text-2xl font-bold font-headline">Fixed Commitments</h2>
                <p className="text-xs text-on-surface-variant leading-relaxed mt-1">Configure your monthly outgoing bills, rent, and active loan EMIs.</p>
              </div>

              {/* Sliders Container */}
              <div className="space-y-4">
                {/* EMI */}
                <div className="bg-surface-container-low border border-outline-variant/20 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-[#FFB038]">Loan EMIs</span>
                    <span className="text-xs font-bold text-on-surface">{formatCurrency(emi)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={parsedSalary * 0.5}
                    step="500"
                    value={emi}
                    onChange={(e) => setEmi(parseInt(e.target.value))}
                    className="w-full h-1 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>

                {/* Rent */}
                <div className="bg-surface-container-low border border-outline-variant/20 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-[#5856D6]">House Rent</span>
                    <span className="text-xs font-bold text-on-surface">{formatCurrency(rent)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={parsedSalary * 0.5}
                    step="500"
                    value={rent}
                    onChange={(e) => setRent(parseInt(e.target.value))}
                    className="w-full h-1 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>

                {/* Bills */}
                <div className="bg-surface-container-low border border-outline-variant/20 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-on-surface-variant">Bills & Utilities</span>
                    <span className="text-xs font-bold text-on-surface">{formatCurrency(bills)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={parsedSalary * 0.2}
                    step="500"
                    value={bills}
                    onChange={(e) => setBills(parseInt(e.target.value))}
                    className="w-full h-1 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center py-2 px-1 text-xs text-on-surface-variant font-semibold border-t border-outline-variant/30 mt-2">
                <span>Total Outgoings:</span>
                <span className="text-on-surface font-bold">{formatCurrency(emi + rent + bills)}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setStep('salary')}
                  className="py-3.5 text-xs font-bold text-on-surface-variant bg-surface-container-low border border-outline-variant/30 rounded-xl hover:bg-surface-container-high active:scale-[0.98] transition-all text-center"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep('investments')}
                  className="py-3.5 text-xs font-bold text-white bg-primary rounded-xl hover:opacity-90 active:scale-[0.98] transition-all text-center"
                >
                  Next Step
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Investments Setup */}
          {step === 'investments' && (
            <motion.div
              key="step-investments"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full flex flex-col gap-6 text-left"
            >
              <div>
                <h2 className="text-2xl font-bold font-headline">Future Savings</h2>
                <p className="text-xs text-on-surface-variant leading-relaxed mt-1">Set your target monthly SIP investment to build compounding wealth.</p>
              </div>

              <div className="bg-surface-container-low border border-outline-variant/20 rounded-xl p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[#34C759]">Target Monthly SIP</span>
                  <span className="text-xs font-bold text-on-surface">{formatCurrency(sip)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={parsedSalary * 0.4}
                  step="500"
                  value={sip}
                  onChange={(e) => setSip(parseInt(e.target.value))}
                  className="w-full h-1 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              <div className="bg-[#34C759]/5 border border-[#34C759]/15 rounded-xl p-3.5 flex gap-3 text-xs leading-relaxed text-on-surface/90">
                <span className="material-symbols-outlined text-[#34C759] text-base shrink-0">energy_savings_leaf</span>
                <p>Investing ₹{sip.toLocaleString('en-IN')} monthly at a conservative 12% annual interest grows to <span className="font-bold text-[#34C759]">{formatLakhs(sipFiveYearValue)}</span> in 5 years!</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4">
                <button
                  onClick={() => setStep('commitments')}
                  className="py-3.5 text-xs font-bold text-on-surface-variant bg-surface-container-low border border-outline-variant/30 rounded-xl hover:bg-surface-container-high active:scale-[0.98] transition-all text-center"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep('summary')}
                  className="py-3.5 text-xs font-bold text-white bg-primary rounded-xl hover:opacity-90 active:scale-[0.98] transition-all text-center"
                >
                  Review Plan
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 5: Summary */}
          {step === 'summary' && (
            <motion.div
              key="step-summary"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full flex flex-col gap-6 text-left"
            >
              <div>
                <h2 className="text-2xl font-bold font-headline">Calibration Summary</h2>
                <p className="text-xs text-on-surface-variant leading-relaxed mt-1">Review your financial structure before activating your protocol.</p>
              </div>

              {/* Summary Card */}
              <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-5 space-y-4 backdrop-blur-sm shadow-xl">
                <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3">
                  <span className="text-xs text-on-surface-variant">Credited Salary</span>
                  <span className="text-sm font-black text-primary">{formatCurrency(parsedSalary)}</span>
                </div>
                <div className="space-y-2.5 text-xs text-on-surface/90">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-error" /> Committed Outgoings</span>
                    <span className="font-semibold">-{formatCurrency(emi + rent + bills)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-tertiary" /> Monthly SIP targets</span>
                    <span className="font-semibold">-{formatCurrency(sip)}</span>
                  </div>
                </div>
                <div className="border-t border-outline-variant/30 pt-3 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-semibold text-on-surface-variant/70 uppercase tracking-widest">Left for you</span>
                    <span className="block text-lg font-black text-[#34C759] mt-0.5">{formatCurrency(remaining)}</span>
                  </div>
                  <span className="material-symbols-outlined text-2xl text-[#34C759]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setStep('investments')}
                  className="py-3.5 text-xs font-bold text-on-surface-variant bg-surface-container-low border border-outline-variant/30 rounded-xl hover:bg-surface-container-high active:scale-[0.98] transition-all text-center"
                >
                  Back
                </button>
                <button
                  onClick={handleFinalize}
                  className="py-3.5 text-xs font-bold text-white bg-gradient-to-r from-primary to-primary-container rounded-xl hover:opacity-90 active:scale-[0.98] transition-all text-center shadow-lg shadow-primary/20"
                >
                  Finalize Setup
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Footer Info */}
      <div className="relative text-center z-10 shrink-0 space-y-2">
        <p className="text-[10px] font-semibold text-on-surface-variant/50 uppercase tracking-widest">
          Protocol Calibration Wizard
        </p>
        <button
          type="button"
          onClick={() => store.logout()}
          className="text-[10px] text-on-surface-variant/70 hover:text-on-surface-variant font-semibold uppercase tracking-widest hover:underline active:scale-95 transition-all"
        >
          Not you? Sign out
        </button>
      </div>
    </div>
  );
};
