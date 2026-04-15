/**
 * NotificationService - Browser Push Notifications
 * Handles sending notifications for salary credits, insights, and reminders
 */

class NotificationService {
  constructor() {
    this.isSupported = 'Notification' in window;
    this.isEnabled = false;
    this.init();
  }

  async init() {
    if (!this.isSupported) {
      console.warn('Browser does not support notifications');
      return;
    }

    if (Notification.permission === 'granted') {
      this.isEnabled = true;
    }
  }

  /**
   * Request notification permission from user
   */
  async requestPermission() {
    if (!this.isSupported) {
      console.warn('Notifications not supported');
      return false;
    }

    if (Notification.permission === 'granted') {
      this.isEnabled = true;
      return true;
    }

    if (Notification.permission === 'denied') {
      console.warn('Notifications have been denied by user');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        this.isEnabled = true;
        return true;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }

    return false;
  }

  /**
   * Send salary credited notification with breakdown
   */
  async notifySalaryCredit(salaryAmount, allocation, aiInsight) {
    if (!this.isEnabled) {
      console.log('[Notification] Salary credited:', { salaryAmount, allocation });
      return;
    }

    const title = `💰 Salary Credited: ₹${salaryAmount.toLocaleString('en-IN')}`;
    const allocationText = `
EMI: ₹${allocation.emi}
Rent: ₹${allocation.rent}
SIP: ₹${allocation.sip}
Travel: ₹${allocation.travel}
Left for you: ₹${allocation.remaining}`;

    const options = {
      icon: '💰',
      badge: '💰',
      tag: 'salary-credit',
      body: `Allocated:\n${allocationText}`,
      requireInteraction: true,
      actions: [
        { action: 'open', title: '👁️ Review Details' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    };

    try {
      const notification = new Notification(title, options);

      notification.onclick = () => {
        window.focus();
        notification.close();
        // Trigger in-app modal or navigation if needed
        window.dispatchEvent(
          new CustomEvent('notification-action', {
            detail: { action: 'open', type: 'salary' },
          })
        );
      };
    } catch (error) {
      console.error('Notification error:', error);
    }
  }

  /**
   * Send investment insight notification
   */
  async notifyInvestmentInsight(insight, amount = 0) {
    if (!this.isEnabled) {
      console.log('[Notification] Investment insight:', insight);
      return;
    }

    const title = '📈 Investment Opportunity';
    const options = {
      icon: '📈',
      badge: '📈',
      tag: 'investment-insight',
      body: insight,
      requireInteraction: true,
      actions: [
        { action: 'invest', title: '💰 Act Now' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    };

    try {
      const notification = new Notification(title, options);

      notification.onclick = () => {
        window.focus();
        notification.close();
        window.dispatchEvent(
          new CustomEvent('notification-action', {
            detail: {
              action: 'invest',
              type: 'investment',
              amount,
            },
          })
        );
      };
    } catch (error) {
      console.error('Notification error:', error);
    }
  }

  /**
   * Send spending alert notification
   */
  async notifySpendingAlert(category, percentUsed, monthlyBudget) {
    if (!this.isEnabled) {
      console.log('[Notification] Spending alert:', { category, percentUsed });
      return;
    }

    const icon = percentUsed > 100 ? '🚨' : '⚠️';
    const title = `${icon} ${category} Budget Alert`;

    const options = {
      icon,
      badge: icon,
      tag: `spending-${category}`,
      body:
        percentUsed > 100
          ? `Oops! You've spent ₹${Math.ceil(monthlyBudget * (percentUsed / 100 - 1))} over budget.`
          : `${percentUsed}% of your budget used. ₹${Math.ceil(monthlyBudget * (percentUsed / 100))} spent.`,
      requireInteraction: false,
    };

    try {
      new Notification(title, options);
    } catch (error) {
      console.error('Notification error:', error);
    }
  }

  /**
   * Send generic reminder notification
   */
  async notifyReminder(title, message, icon = '🔔') {
    if (!this.isEnabled) {
      console.log(`[Notification] ${title}:`, message);
      return;
    }

    const options = {
      icon,
      badge: icon,
      tag: `reminder-${Date.now()}`,
      body: message,
      requireInteraction: false,
    };

    try {
      new Notification(title, options);
    } catch (error) {
      console.error('Notification error:', error);
    }
  }

  /**
   * In-app toast notification (doesn't require permission)
   * Used as fallback or supplementary UI
   */
  showToast(message, type = 'info') {
    const event = new CustomEvent('show-toast', {
      detail: { message, type },
    });
    window.dispatchEvent(event);
  }

  /**
   * Get notification status
   */
  getStatus() {
    return {
      supported: this.isSupported,
      enabled: this.isEnabled,
      permission: this.isSupported ? Notification.permission : 'N/A',
    };
  }
}

export const notificationService = new NotificationService();
