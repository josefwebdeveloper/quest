import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {
  private _isLoading = signal<boolean>(false);
  
  public isLoading = this._isLoading.asReadonly();
  
  show(): void {
    this._isLoading.set(true);
  }
  
  hide(): void {
    this._isLoading.set(false);
  }
} 