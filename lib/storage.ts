// Generic localStorage service for CRUD operations

export class StorageService<T extends { id: string }> {
  private key: string;

  constructor(key: string) {
    this.key = key;
  }

  private getStorage(): T[] {
    if (typeof window === "undefined") return [];
    const data = localStorage.getItem(this.key);
    return data ? JSON.parse(data) : [];
  }

  private setStorage(data: T[]): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(this.key, JSON.stringify(data));
  }

  getAll(): T[] {
    return this.getStorage();
  }

  getById(id: string): T | undefined {
    return this.getStorage().find((item) => item.id === id);
  }

  create(item: T): T {
    const data = this.getStorage();
    data.push(item);
    this.setStorage(data);
    return item;
  }

  update(id: string, updates: Partial<T>): T | undefined {
    const data = this.getStorage();
    const index = data.findIndex((item) => item.id === id);
    if (index === -1) return undefined;
    data[index] = { ...data[index], ...updates };
    this.setStorage(data);
    return data[index];
  }

  delete(id: string): boolean {
    const data = this.getStorage();
    const filtered = data.filter((item) => item.id !== id);
    if (filtered.length === data.length) return false;
    this.setStorage(filtered);
    return true;
  }

  seed(items: T[]): void {
    if (this.getStorage().length === 0) {
      this.setStorage(items);
    }
  }

  reset(items: T[]): void {
    this.setStorage(items);
  }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}