import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Car, Clock, Bike, Truck, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VehicleEntryProps {
  onAddEntry: (vehicleNumber: string, vehicleType: 'cycle' | 'two-wheeler' | 'three-wheeler' | 'four-wheeler', toastCallback?: (args: { title: string, description: string, variant?: string }) => void) => boolean | void;
  onBack: () => void;
  findActivePass: (vehicleNumber: string, vehicleType?: 'cycle' | 'two-wheeler' | 'three-wheeler' | 'four-wheeler') => any | null;
  onUpdatePassLastUsedAt: (passId: string) => void;
  findActiveVehicle: (vehicleNumber: string) => any | null;
}

const VehicleEntry = ({ onAddEntry, onBack, findActivePass, onUpdatePassLastUsedAt, findActiveVehicle }: VehicleEntryProps) => {
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleType, setVehicleType] = useState<'cycle' | 'two-wheeler' | 'three-wheeler' | 'four-wheeler'>('two-wheeler');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detectedPass, setDetectedPass] = useState<any | null>(null);
  const [passTypeMismatch, setPassTypeMismatch] = useState(false);
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
    const result = onAddEntry(vehicleNumber, vehicleType, safeToastCallback);

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
              <div className="space-y-2">
                <Label htmlFor="vehicleNumber" className="text-base font-semibold">
                  Vehicle Number *
                </Label>
                <Input
                  id="vehicleNumber"
                  type="text"
                  value={vehicleNumber}
                  onChange={handleVehicleNumberChange}
                  placeholder="Enter vehicle number (e.g., ABC-1234)"
                  className="text-lg py-3 px-4"
                  disabled={isSubmitting}
                />
                <p className="text-sm text-gray-600">
                  Enter the complete vehicle number including any letters and numbers
                </p>
              </div>

              <div className="space-y-4">
                <Label className="text-base font-semibold">Vehicle Type *</Label>
                <RadioGroup
                  value={vehicleType}
                  onValueChange={handleVehicleTypeChange}
                  className="flex flex-row gap-6 flex-wrap"
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

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Entry Details:</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Entry time will be automatically recorded</li>
                  <li>• Vehicle will be marked as active in the system</li>
                  {detectedPass && !passTypeMismatch ? (
                    <li className="text-green-600 font-medium">• Free parking for monthly pass holders</li>
                  ) : (
                    <li>• Parking charges: ₹24 for first 6 hours, then ₹10 per hour</li>
                  )}
                  {passTypeMismatch && (
                    <li className="text-red-600 font-medium">• The vehicle type does not match the pass type</li>
                  )}
                </ul>
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
