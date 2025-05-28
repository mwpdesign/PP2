import type { LogisticsOrder } from '../types/order';

class SharedOrderStore {
  private orders: LogisticsOrder[] = [];
  private listeners: (() => void)[] = [];

  addOrder(order: LogisticsOrder): void {
    this.orders.push(order);
    this.notifyListeners();
  }

  getOrders(): LogisticsOrder[] {
    return [...this.orders]; // Return a copy to prevent direct mutations
  }

  updateOrderStatus(orderId: string, status: string): void {
    const orderIndex = this.orders.findIndex(o => o.id === orderId);
    if (orderIndex !== -1) {
      this.orders[orderIndex] = {
        ...this.orders[orderIndex],
        status: status as LogisticsOrder['status']
      };
      this.notifyListeners();
    }
  }

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }
}

export const sharedOrderStore = new SharedOrderStore(); 