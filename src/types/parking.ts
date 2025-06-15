
export interface MonthlyPass {
  id: string;
  vehicleNumber: string;
  passType: 'cycle' | 'two-wheeler' | 'three-wheeler' | 'four-wheeler';
  vehicleType: 'cycle' | 'two-wheeler' | 'three-wheeler' | 'four-wheeler';
  ownerName: string;
  ownerPhone: string;
  startDate: Date;
  endDate: Date;
  amount: number;
  status: 'active' | 'expired' | 'suspended';
  lastUsedAt?: Date; // Added for recently used passes feature
}

export interface PassHolder {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
}

export interface ParkingRecord {
  id: string;
  vehicleNumber: string;
  vehicleType: 'two-wheeler' | 'three-wheeler' | 'four-wheeler';
  entryTime: Date;
  exitTime?: Date;
  duration?: number;
  amountDue?: number;
  status: 'active' | 'completed';
  isPassHolder?: boolean;
  passId?: string;
}

