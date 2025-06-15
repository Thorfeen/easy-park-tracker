import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Car, Clock, Bike, Truck, CreditCard, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDurationFull } from "@/utils/parkingCharges";
import VehicleTypeSelector from "./vehicle-entry/VehicleTypeSelector";
import HelmetSelector from "./vehicle-entry/HelmetSelector";
import PassDetectionBanner from "./vehicle-entry/PassDetectionBanner";
import ParkingRatesGrid from "./vehicle-entry/ParkingRatesGrid";
import { format } from "date-fns";

interface VehicleEntryProps {
  onAddEntry: (vehicleNumber: string, vehicleType: 'cycle' | 'two-wheeler' | 'three-wheeler' | 'four-wheeler', helmet: boolean, toastCallback?: (args: { title: string, description: string, variant?: string }) => void) => boolean | void;
  onBack: () => void;
  findActivePass: (vehicleNumber: string, vehicleType?: 'cycle' | 'two-wheeler' | 'three-wheeler' | 'four-wheeler') => any | null;
  onUpdatePassLastUsedAt: (passId: string) => void;
  findActiveVehicle: (vehicleNumber: string) => any | null;
}

const pricingDetails = [
  {
    type: "Cycle",
    rates: [
      "0–2 hrs: ₹5",
      "2–6 hrs: ₹5",
      "6–12 hrs: ₹10",
      "12–24 hrs: ₹15",
      ">24 hrs: ₹20/day",
      "Monthly: ₹300",
      "Helmet (optional): ₹2/day"
    ]
  },
  {
    type: "Two-Wheeler",
    rates: [
      "0–6 hrs: ₹10",
      "6–12 hrs: ₹30",
      "12–24 hrs: ₹40",
      ">24 hrs: ₹40/day",
      "Monthly: ₹600",
      "Helmet (optional): ₹2/day"
    ]
  },
  {
    type: "Three-Wheeler",
    rates: [
      "0–6 hrs: ₹30",
      "6–12 hrs: ₹60",
      "12–24 hrs: ₹80",
      ">24 hrs: ₹80/day",
      "Monthly: ₹1200"
    ]
  },
  {
    type: "Four-Wheeler",
    rates: [
      "0–6 hrs: ₹40",
      "6–24 hrs: ₹80",
      ">24 hrs: ₹80/day",
      "Monthly: ₹1500"
    ]
  }
];

const VehicleEntry = ({
  onAddEntry,
  onBack,
  findActivePass,
  onUpdatePassLastUsedAt,
  findActiveVehicle,
}: VehicleEntryProps) => {
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleType, setVehicleType] = useState<'cycle' | 'two-wheeler' | 'three-wheeler' | 'four-wheeler'>('two-wheeler');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detectedPass, setDetectedPass] = useState<any | null>(null);
  const [passTypeMismatch, setPassTypeMismatch] = useState(false);
  const [helmet, setHelmet] = useState(false);
  const { toast } = useToast();

  // Helper to safely call toast callback
  const safeToastCallback = ({
    title,
    description,
    variant,
  }: {
    title: string;
    description: string;
    variant?: string;
  }) => {
    // only accept "default" or "destructive"
    const allowedVariant = variant === "destructive" ? "destructive" : "default";
    toast({
      title,
      description,
      variant: allowedVariant,
    });
  };

  const resetState = () => {
    setVehicleNumber("");
    setVehicleType('two-wheeler');
    setDetectedPass(null);
    setPassTypeMismatch(false);
    setHelmet(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!vehicleNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter a vehicle number",
        variant: "destructive",
      });
      return;
    }

    if (!vehicleType) {
      toast({
        title: "Error",
        description: "Please select a vehicle type",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    // Pass the safeToastCallback in onAddEntry for granular error feedback
    const result = onAddEntry(vehicleNumber, vehicleType, helmet, safeToastCallback);

    if (result === false) {
      setIsSubmitting(false);
      return;
    }

    // If a pass was detected and used, update its lastUsedAt
    if (detectedPass && detectedPass.id) {
      onUpdatePassLastUsedAt(detectedPass.id);
    }

    toast({
      title: "Success!",
      description: `${vehicleType.replace('-', ' ')} ${vehicleNumber.toUpperCase()} has been registered successfully`,
      variant: "default",
    });
    resetState();
    setIsSubmitting(false);
  };

  // Enhanced pass detection: Also sets type mismatch flag
  const checkForPass = (vehicleNumber: string, vehicleType: typeof vehicleTypes[number]["value"]) => {
    if (vehicleNumber.trim().length >= 3) {
      const pass = findActivePass(vehicleNumber, vehicleType);
      const anyPass = findActivePass(vehicleNumber);

      setDetectedPass(pass || anyPass || null);
      setPassTypeMismatch(!!(anyPass && (!pass || anyPass.vehicleType !== vehicleType)));
    } else {
      setDetectedPass(null);
      setPassTypeMismatch(false);
    }
  };

  const handleVehicleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setVehicleNumber(value);
    checkForPass(value, vehicleType);
  };

  const handleVehicleTypeChange = (value: 'cycle' | 'two-wheeler' | 'three-wheeler' | 'four-wheeler') => {
    setVehicleType(value);
    checkForPass(vehicleNumber, value);
    // Reset helmet option if changed to unsupported type
    if (value !== 'cycle' && value !== 'two-wheeler') {
      setHelmet(false);
    }
  };

  // Format current time and date in 12-hour format and readable date
  const currentTime = format(new Date(), "hh:mm a");
  const currentDate = format(new Date(), "MMMM d, yyyy");

  const vehicleTypes = [
    { value: 'cycle' as const, label: 'Cycle', icon: Bike, description: 'Bicycle only' },
    { value: 'two-wheeler' as const, label: 'Two Wheeler', icon: Bike, description: 'Motorcycles, Scooters' },
    { value: 'three-wheeler' as const, label: 'Three Wheeler', icon: Car, description: 'Auto-rickshaws, Three-wheeled vehicles' },
    { value: 'four-wheeler' as const, label: 'Four Wheeler', icon: Truck, description: 'Cars, SUVs, Trucks' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="mb-6 hover:bg-white/50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="bg-white shadow-xl">
          <CardHeader className="text-center bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
            <div className="flex justify-center mb-4">
              <Car className="h-16 w-16" />
            </div>
            <CardTitle className="text-2xl">Vehicle Entry</CardTitle>
            <CardDescription className="text-blue-100">
              Register a new vehicle arrival
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            {/* Date and Time in single line */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-blue-700">
                {/* Single line: Date (calendar icon+label+value), then Time (clock icon+label+value) */}
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  <span className="font-semibold">Date:</span>
                  <span>{currentDate}</span>
                  <span className="mx-3 hidden sm:inline-block">|</span>
                  <Clock className="h-5 w-5" />
                  <span className="font-semibold">Time:</span>
                  <span>{currentTime}</span>
                </div>
              </div>
            </div>
            {/* Monthly Pass/Mismatch banner */}
            <PassDetectionBanner detectedPass={detectedPass} passTypeMismatch={passTypeMismatch} />

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <Label className="text-base font-semibold">Vehicle Type *</Label>
                <div className="flex flex-row flex-wrap gap-6 items-stretch">
                  {/* Vehicle types */}
                  <VehicleTypeSelector value={vehicleType} onChange={handleVehicleTypeChange} />
                  {/* Helmet checkbox card */}
                  <HelmetSelector helmet={helmet} setHelmet={setHelmet} vehicleType={vehicleType} />
                </div>
                {/* Parking Rates row grid */}
                <ParkingRatesGrid />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 text-lg font-semibold"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Processing..." : "Submit Entry"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VehicleEntry;

// WARNING: This file is getting long. Please consider asking for a refactor into smaller components!
