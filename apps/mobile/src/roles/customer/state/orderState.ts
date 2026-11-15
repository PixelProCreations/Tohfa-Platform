// Shared Order State to track items that have proceeded to payment
class OrderStore {
  private orderedNames: Set<string> = new Set([
    'royal gala',
    'green curly lettuce',
    'red tomato',
    'fresh tomatoes',
  ]);
  private listeners: Set<() => void> = new Set();

  isOrdered(productName: string): boolean {
    if (!productName) return false;
    const norm = productName.toLowerCase().trim();
    for (const name of this.orderedNames) {
      if (norm.includes(name) || name.includes(norm)) {
        return true;
      }
    }
    return false;
  }

  addOrderedItems(names: string[]) {
    names.forEach((n) => {
      if (n) this.orderedNames.add(n.toLowerCase().trim());
    });
    this.notify();
  }

  getOrderedList(): string[] {
    return Array.from(this.orderedNames);
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }
}

export const orderStore = new OrderStore();
