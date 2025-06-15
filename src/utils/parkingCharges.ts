
export type VehicleType = 'cycle' | 'two-wheeler' | 'three-wheeler' | 'four-wheeler';

interface ParkingChargeResult {
  amount: number;
  breakdown: string[];
}

export function calculateParkingCharges(
  vehicleType: VehicleType,
  entryTime: Date,
  exitTime: Date
): ParkingChargeResult {
  const msInHour = 1000 * 60 * 60;
  const msInDay = msInHour * 24;
  const totalMs = exitTime.getTime() - entryTime.getTime();
  let remainingMs = totalMs;

  let breakdown: string[] = [];
  let amount = 0;

  if (remainingMs <= 0) {
    breakdown.push('Invalid duration (0 hours): ₹0');
    return { amount: 0, breakdown };
  }

  const add = (desc: string, cost: number) => {
    if (cost > 0) breakdown.push(`${desc}: ₹${cost}`);
    amount += cost;
  };

  if (vehicleType === 'cycle') {
    // Cycles
    // 0–2 hrs: ₹5; 2–6 hrs: ₹5; 6–12 hrs: ₹10; 12–24 hrs: ₹15; Daily: ₹20/day
    if (remainingMs <= msInHour * 2) {
      add('0–2 hrs', 5);
    } else if (remainingMs <= msInHour * 6) {
      add('2–6 hrs', 5);
    } else if (remainingMs <= msInHour * 12) {
      add('6–12 hrs', 10);
    } else if (remainingMs <= msInHour * 24) {
      add('12–24 hrs', 15);
    } else {
      // >24 hrs: ₹20/day
      const days = Math.floor(remainingMs / msInDay);
      add(`${days} day(s)`, days * 20);
      remainingMs -= days * msInDay;
      if (remainingMs > 0) {
        // For leftover time in last partial day
        if (remainingMs <= msInHour * 2) {
          add('0–2 hrs (extra day)', 5);
        } else if (remainingMs <= msInHour * 6) {
          add('2–6 hrs (extra day)', 5);
        } else if (remainingMs <= msInHour * 12) {
          add('6–12 hrs (extra day)', 10);
        } else if (remainingMs <= msInHour * 24) {
          add('12–24 hrs (extra day)', 15);
        }
      }
    }
  } else if (vehicleType === 'two-wheeler') {
    // Two-Wheeler
    // 0–6 hrs: ₹10; 6–12 hrs: ₹30; 12–24 hrs: ₹40; Daily: ₹40/day
    if (remainingMs <= msInHour * 6) {
      add('0–6 hrs', 10);
    } else if (remainingMs <= msInHour * 12) {
      add('6–12 hrs', 30);
    } else if (remainingMs <= msInHour * 24) {
      add('12–24 hrs', 40);
    } else {
      // >24 hrs: ₹40/day
      const days = Math.floor(remainingMs / msInDay);
      add(`${days} day(s)`, days * 40);
      remainingMs -= days * msInDay;
      if (remainingMs > 0) {
        if (remainingMs <= msInHour * 6) {
          add('0–6 hrs (extra day)', 10);
        } else if (remainingMs <= msInHour * 12) {
          add('6–12 hrs (extra day)', 30);
        } else if (remainingMs <= msInHour * 24) {
          add('12–24 hrs (extra day)', 40);
        }
      }
    }
  } else if (vehicleType === 'three-wheeler') {
    // Three-Wheeler
    // 0–6 hrs: ₹30; 6–12 hrs: ₹60; 12–24 hrs: ₹80; Daily: ₹80/day
    if (remainingMs <= msInHour * 6) {
      add('0–6 hrs', 30);
    } else if (remainingMs <= msInHour * 12) {
      add('6–12 hrs', 60);
    } else if (remainingMs <= msInHour * 24) {
      add('12–24 hrs', 80);
    } else {
      // >24 hrs: ₹80/day
      const days = Math.floor(remainingMs / msInDay);
      add(`${days} day(s)`, days * 80);
      remainingMs -= days * msInDay;
      if (remainingMs > 0) {
        if (remainingMs <= msInHour * 6) {
          add('0–6 hrs (extra day)', 30);
        } else if (remainingMs <= msInHour * 12) {
          add('6–12 hrs (extra day)', 60);
        } else if (remainingMs <= msInHour * 24) {
          add('12–24 hrs (extra day)', 80);
        }
      }
    }
  } else if (vehicleType === 'four-wheeler') {
    // Four-Wheeler
    // 0–6 hrs: ₹40; 6–24 hrs: ₹80; Daily: ₹80/day
    if (remainingMs <= msInHour * 6) {
      add('0–6 hrs', 40);
    } else if (remainingMs <= msInHour * 24) {
      add('6–24 hrs', 80);
    } else {
      const days = Math.floor(remainingMs / msInDay);
      add(`${days} day(s)`, days * 80);
      remainingMs -= days * msInDay;
      if (remainingMs > 0) {
        if (remainingMs <= msInHour * 6) {
          add('0–6 hrs (extra day)', 40);
        } else if (remainingMs <= msInHour * 24) {
          add('6–24 hrs (extra day)', 80);
        }
      }
    }
  }

  return { amount, breakdown };
}

// Utility for formatting duration
export function formatDurationFull(hours: number): string {
  if (hours <= 0) return "0 hours";
  const d = Math.floor(hours / 24);
  const h = hours % 24;
  let result = [];
  if (d > 0) result.push(`${d} day${d > 1 ? "s" : ""}`);
  if (h > 0) result.push(`${h} hour${h > 1 ? "s" : ""}`);
  return result.join(" ");
}
