
import { Bike, Car, Truck } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

type VehicleType = 'cycle' | 'two-wheeler' | 'three-wheeler' | 'four-wheeler';

interface VehicleTypeSelectorProps {
  value: VehicleType;
  onChange: (value: VehicleType) => void;
}

const vehicleTypes = [
  { value: 'cycle' as const, label: 'Cycle', icon: Bike, description: 'Bicycle only' },
  { value: 'two-wheeler' as const, label: 'Two Wheeler', icon: Bike, description: 'Motorcycles, Scooters' },
  { value: 'three-wheeler' as const, label: 'Three Wheeler', icon: Car, description: 'Auto-rickshaws, Three-wheeled vehicles' },
  { value: 'four-wheeler' as const, label: 'Four Wheeler', icon: Truck, description: 'Cars, SUVs, Trucks' }
];

const VehicleTypeSelector = ({ value, onChange }: VehicleTypeSelectorProps) => (
  <div className="flex flex-row flex-wrap gap-6 items-stretch">
    <RadioGroup
      value={value}
      onValueChange={onChange}
      className="flex flex-row flex-wrap gap-6 items-stretch"
    >
      {vehicleTypes.map((type) => {
        const Icon = type.icon;
        return (
          <div
            key={type.value}
            className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer w-36 h-40 transition-all duration-200 gap-2"
            style={{ minWidth: '144px', maxWidth: '144px', minHeight: '160px', maxHeight: '160px' }}
          >
            <RadioGroupItem value={type.value} id={type.value} />
            <div className="flex flex-col items-center mt-2">
              <Icon className="h-8 w-8 text-gray-600 mb-1" />
              <Label htmlFor={type.value} className="font-medium cursor-pointer">
                {type.label}
              </Label>
              <p className="text-xs text-gray-500 text-center break-words">
                {type.description}
              </p>
            </div>
          </div>
        );
      })}
    </RadioGroup>
  </div>
);

export default VehicleTypeSelector;
