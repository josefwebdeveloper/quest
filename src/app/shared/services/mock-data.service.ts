import { Injectable } from '@angular/core';
import { Worker } from '../models/worker.model';
import { Flight } from '../models/flight.model';

@Injectable({
  providedIn: 'root'
})
export class MockDataService {
  
  /**
   * Generate a list of workers for testing scrolling
   */
  getMockWorkers(count: number = 40): Worker[] {
    const workers: Worker[] = [];
    
    for (let i = 1; i <= count; i++) {
      workers.push({
        id: i,
        name: `Работник ${i}`
      });
    }
    
    return workers;
  }
  
  /**
   * Generate a list of flights for a specific worker
   */
  getMockFlights(workerId: number, count: number = 50): Flight[] {
    const flights: Flight[] = [];
    const cities = ['Москва', 'Санкт-Петербург', 'Сочи', 'Новосибирск', 'Екатеринбург', 
                   'Казань', 'Нижний Новгород', 'Краснодар', 'Владивосток', 'Калининград'];
    const planes = ['Airbus A320', 'Boeing 737', 'Sukhoi Superjet', 'Airbus A380', 'Boeing 777'];
    
    for (let i = 1; i <= count; i++) {
      // Generate random dates
      const fromDate = this.getRandomDate();
      const toDate = this.getNextDate(fromDate);
      
      // Random cities for origin and destination
      const fromIndex = Math.floor(Math.random() * cities.length);
      let toIndex = Math.floor(Math.random() * cities.length);
      
      // Make sure origin and destination are different
      while (toIndex === fromIndex) {
        toIndex = Math.floor(Math.random() * cities.length);
      }
      
      flights.push({
        id: `flight-${workerId}-${i}`,
        from: cities[fromIndex],
        to: cities[toIndex],
        from_date: this.formatDate(fromDate),
        to_date: this.formatDate(toDate),
        plane: planes[Math.floor(Math.random() * planes.length)],
        duration: Math.floor(Math.random() * 300) + 60, // 1-6 hours in minutes
        from_gate: Math.floor(Math.random() * 50) + 1,
        to_gate: Math.floor(Math.random() * 50) + 1
      });
    }
    
    return flights;
  }
  
  /**
   * Generate a random date in the next 30 days
   */
  private getRandomDate(): Date {
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + 30);
    
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  }
  
  /**
   * Get a date 1-8 hours after the given date
   */
  private getNextDate(date: Date): Date {
    const result = new Date(date);
    // Add 1-8 hours
    result.setHours(result.getHours() + Math.floor(Math.random() * 8) + 1);
    return result;
  }
  
  /**
   * Format date as DD/MM/YYYY
   */
  private formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  }
} 