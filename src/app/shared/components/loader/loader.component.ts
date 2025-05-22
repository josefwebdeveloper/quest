import { Component, inject } from '@angular/core';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LoaderService } from '../../services/loader.service';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  template: `
    @if (loaderService.isLoading()) {
      <div class="loader-container">
        <mat-spinner></mat-spinner>
      </div>
    }
    `,
  styles: [`
    .loader-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: rgba(255, 255, 255, 0.5);
      z-index: 1000;
    }
  `]
})
export class LoaderComponent {
  loaderService = inject(LoaderService);
} 