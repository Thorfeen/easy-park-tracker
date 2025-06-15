
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
  <RadioGroup
    value={value}
    onValueChange={onChange}
    className="flex flex-row gap-4 items-center"
  >
    {vehicleTypes.map((type) => {
      const Icon = type.icon;
      return (
        <Label
          key={type.value}
          htmlFor={type.value}
          className={`flex flex-row items-center px-4 py-2 border rounded-lg cursor-pointer transition-all duration-200 gap-2 ${
            value === type.value
              ? "border-blue-500 bg-blue-50 shadow"
              : "border-gray-200 bg-white hover:bg-gray-50"
          }`}
          style={{ minWidth: "210px" }}
        >
          <RadioGroupItem
            value={type.value}
            id={type.value}
            className="mr-2"
          />
          <Icon className="h-7 w-7 text-gray-600 mx-2" />
          <div className="flex flex-col justify-center">
            <span className="font-medium">{type.label}</span>
            <span className="text-xs text-gray-500">{type.description}</span>
          </div>
        </Label>
      );
    })}
  </RadioGroup>
);

export default VehicleTypeSelector;

