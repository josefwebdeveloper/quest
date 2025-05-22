import { DurationPipe } from './duration.pipe';

describe('DurationPipe', () => {
  let pipe: DurationPipe;

  beforeEach(() => {
    pipe = new DurationPipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should transform 0 minutes to "0h 0m"', () => {
    expect(pipe.transform(0)).toBe('0h 0m');
  });

  it('should transform null or NaN to "0h 0m"', () => {
    expect(pipe.transform(null as unknown as number)).toBe('0h 0m');
    expect(pipe.transform(NaN)).toBe('0h 0m');
    expect(pipe.transform(undefined as unknown as number)).toBe('0h 0m');
  });

  it('should transform minutes to correct hour and minute format', () => {
    // Test pure minutes (no hours)
    expect(pipe.transform(1)).toBe('0h 1m');
    expect(pipe.transform(15)).toBe('0h 15m');
    expect(pipe.transform(59)).toBe('0h 59m');

    // Test hours and minutes
    expect(pipe.transform(60)).toBe('1h 0m');
    expect(pipe.transform(90)).toBe('1h 30m');
    expect(pipe.transform(119)).toBe('1h 59m');
    expect(pipe.transform(120)).toBe('2h 0m');

    // Test larger values
    expect(pipe.transform(600)).toBe('10h 0m');
    expect(pipe.transform(601)).toBe('10h 1m');
    expect(pipe.transform(1440)).toBe('24h 0m'); // A full day
  });
}); 