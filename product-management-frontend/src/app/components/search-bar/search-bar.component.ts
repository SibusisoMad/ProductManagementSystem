import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="search-container">
      <div class="search-input-wrapper">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
        <input 
          type="text" 
          class="search-input"
          [placeholder]="placeholder"
          [(ngModel)]="searchTerm"
          (input)="onSearchInput()"
          (keyup.enter)="onSearch()">
        <button 
          *ngIf="searchTerm" 
          class="clear-button"
          (click)="clearSearch()"
          type="button">
          ×
        </button>
      </div>
    </div>
  `,
  styles: [`
    .search-container {
      flex: 1;
      max-width: 400px;
    }

    .search-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      left: 12px;
      width: 20px;
      height: 20px;
      color: #666;
      pointer-events: none;
      z-index: 1;
    }

    .search-input {
      width: 100%;
      padding: 12px 16px 12px 44px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 16px;
      transition: border-color 0.2s, box-shadow 0.2s;
      background: white;
    }

    .search-input:focus {
      outline: none;
      border-color: #3498db;
      box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
    }

    .search-input::placeholder {
      color: #999;
    }

    .clear-button {
      position: absolute;
      right: 12px;
      background: none;
      border: none;
      font-size: 24px;
      color: #666;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: background-color 0.2s;
    }

    .clear-button:hover {
      background-color: #f0f0f0;
      color: #333;
    }

    @media (max-width: 768px) {
      .search-container {
        max-width: none;
      }
    }
  `]
})
export class SearchBarComponent {
  @Input() placeholder: string = 'Search...';
  @Output() searchChange = new EventEmitter<string>();

  searchTerm: string = '';

  onSearchInput(): void {
    this.searchChange.emit(this.searchTerm);
  }

  onSearch(): void {
    this.searchChange.emit(this.searchTerm);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.searchChange.emit('');
  }
}