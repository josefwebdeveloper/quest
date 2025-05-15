import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {
  // Global loader state
  private _isLoading = signal<boolean>(false);
  
  // Public readonly accessor
  public isLoading = this._isLoading.asReadonly();
  
  // Show the global loader
  show(): void {
    this._isLoading.set(true);
    console.log('Global loader shown');
  }
  
  // Hide the global loader
  hide(): void {
    this._isLoading.set(false);
    console.log('Global loader hidden');
  }
} 