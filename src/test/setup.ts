import '@testing-library/jest-dom'

class LocalStorageStub {
  private store: Record<string, string> = {}
  getItem = (k: string) => this.store[k] ?? null
  setItem = (k: string, v: string) => { this.store[k] = v }
  removeItem = (k: string) => { delete this.store[k] }
  clear = () => { this.store = {} }
}

Object.defineProperty(window, 'localStorage', { value: new LocalStorageStub() })
Object.defineProperty(window, 'sessionStorage', { value: new LocalStorageStub() })
