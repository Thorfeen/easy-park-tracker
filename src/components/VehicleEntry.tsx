import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Car, Clock, Bike, Truck, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDurationFull } from "@/utils/parkingCharges";

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

  const currentTime = new Date().toLocaleString();
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
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 text-blue-700">
                <Clock className="h-5 w-5" />
                <span className="font-semibold">Current Time:</span>
                <span>{currentTime}</span>
              </div>
            </div>

            {(detectedPass || passTypeMismatch) && (
              <div className={`mb-6 p-4 rounded-lg border ${passTypeMismatch ? "bg-red-50 border-red-200" : "bg-purple-50 border-purple-200"}`}>
                <div className={`flex items-center gap-2 mb-2 ${passTypeMismatch ? "text-red-700" : "text-purple-700"}`}>
                  <CreditCard className="h-5 w-5" />
                  <span className="font-semibold">
                    {passTypeMismatch ? "Pass Type Mismatch!" : "Monthly Pass Detected!"}
                  </span>
                </div>
                <div className="space-y-1 text-sm">
                  {detectedPass && (
                    <>
                      <p><strong>Owner:</strong> {detectedPass.ownerName}</p>
                      <p><strong>Pass Type:</strong> {detectedPass.passType?.toUpperCase?.()}</p>
                      <p><strong>Valid Until:</strong> {detectedPass.endDate ? new Date(detectedPass.endDate).toLocaleDateString() : ""}</p>
                    </>
                  )}
                  {passTypeMismatch ? (
                    <p className="text-red-600 font-medium">
                      Vehicle type does not match the active pass category. Please select: <b>{detectedPass?.passType?.toUpperCase?.() ?? "the correct type"}</b>
                    </p>
                  ) : detectedPass ? (
                    <p className="text-green-600 font-medium">✓ Free parking for pass holders</p>
                  ) : null}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <Label className="text-base font-semibold">Vehicle Type *</Label>
                <div className="flex flex-row flex-wrap gap-6 items-stretch">
                  <RadioGroup
                    value={vehicleType}
                    onValueChange={handleVehicleTypeChange}
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
                  {/* Helmet Card: placed in the same flex row for alignment */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      (vehicleType === 'cycle' || vehicleType === 'two-wheeler')
                        ? setHelmet((h) => !h)
                        : null
                    }
                    className={`
                      flex flex-col items-center justify-center p-4 border rounded-lg transition-all duration-200 gap-2
                      w-36 h-40
                      ${helmet ? 'border-blue-600 bg-blue-50 shadow' : 'hover:bg-gray-50'}
                      ${vehicleType === 'cycle' || vehicleType === 'two-wheeler'
                        ? 'cursor-pointer opacity-100'
                        : 'cursor-not-allowed opacity-40'}
                    `}
                    style={{ minWidth: '144px', maxWidth: '144px', minHeight: '160px', maxHeight: '160px' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path d="M20 21v-2a4 4 0 0 0-4-4h-4a4 4 0 0 0-4 4v2M12 3a6 6 0 0 1 6 6c0 3.314-5.373 6-6 6s-6-2.686-6-6a6 6 0 0 1 6-6z" />
                    </svg>
                    <Label className="font-medium">Helmet</Label>
                    <p className="text-xs text-gray-500 text-center break-words">
                      Add helmet for ₹2/day
                    </p>
                    <div className="mt-2">
                      <input
                        type="checkbox"
                        checked={helmet}
                        disabled={!(vehicleType === 'cycle' || vehicleType === 'two-wheeler')}
                        readOnly
                        className="accent-blue-600 h-5 w-5 outline-none"
                        tabIndex={-1}
                      />
                    </div>
                  </div>
                </div>

                {/* --- Parking Rates Section: visually in a single grid row --- */}
                <div className="mt-6">
                  <span className="block font-semibold text-blue-700 mb-2">Parking Rates:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                    {pricingDetails.map(detail => (
                      <div key={detail.type} className="bg-gray-50 rounded-lg p-2 border border-blue-100">
                        <div className="font-medium text-gray-900">{detail.type}</div>
                        <ul className="pl-4 list-disc space-y-0.5">
                          {detail.rates.map(rate => (
                            <li key={rate} className="text-xs text-gray-700">{rate}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
                {/* --- End Parking Rates Section --- */}
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
