import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Car, Clock, ScanLine, Bike, Truck, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMobileDetection } from "@/hooks/use-mobile-detection";
import VehicleScanner from "./VehicleScanner";

interface VehicleEntryProps {
  onAddEntry: (vehicleNumber: string, vehicleType: 'two-wheeler' | 'three-wheeler' | 'four-wheeler') => void;
  onBack: () => void;
  findActivePass: (vehicleNumber: string) => any | null;
}

const VehicleEntry = ({ onAddEntry, onBack, findActivePass }: VehicleEntryProps) => {
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleType, setVehicleType] = useState<'two-wheeler' | 'three-wheeler' | 'four-wheeler'>('two-wheeler');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [detectedPass, setDetectedPass] = useState<any | null>(null);
  const { toast } = useToast();
  const isMobile = useMobileDetection();

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
    
    try {
      onAddEntry(vehicleNumber, vehicleType);
      toast({
        title: "Success!",
        description: `${vehicleType.replace('-', ' ')} ${vehicleNumber.toUpperCase()} has been registered successfully`,
      });
      setVehicleNumber("");
      setVehicleType('two-wheeler');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to register vehicle. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkForPass = (vehicleNumber: string) => {
    if (vehicleNumber.trim().length >= 3) {
      const pass = findActivePass(vehicleNumber);
      setDetectedPass(pass);
    } else {
      setDetectedPass(null);
    }
  };

  const handleVehicleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setVehicleNumber(value);
    checkForPass(value);
  };

  const handleScanResultWithPassCheck = (scannedNumber: string) => {
    setVehicleNumber(scannedNumber);
    setShowScanner(false);
    checkForPass(scannedNumber);
    toast({
      title: "Scan Complete!",
      description: `Vehicle number ${scannedNumber} detected`,
    });
  };

  const handleScanClick = () => {
    setShowScanner(true);
  };

  if (showScanner) {
    return (
      <VehicleScanner
        onScanResult={handleScanResultWithPassCheck}
        onBack={() => setShowScanner(false)}
        title="Scan Vehicle Entry"
        description="Scan license plate for new vehicle arrival"
      />
    );
  }

  const currentTime = new Date().toLocaleString();

  const vehicleTypes = [
    {
      value: 'two-wheeler' as const,
      label: 'Two Wheeler',
      icon: Bike,
      description: 'Motorcycles, Scooters, Bicycles'
    },
    {
      value: 'three-wheeler' as const,
      label: 'Three Wheeler',
      icon: Car,
      description: 'Auto-rickshaws, Three-wheeled vehicles'
    },
    {
      value: 'four-wheeler' as const,
      label: 'Four Wheeler',
      icon: Truck,
      description: 'Cars, SUVs, Trucks'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
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

            {detectedPass && (
              <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 text-purple-700 mb-2">
                  <CreditCard className="h-5 w-5" />
                  <span className="font-semibold">Monthly Pass Detected!</span>
                </div>
                <div className="space-y-1 text-sm">
                  <p><strong>Owner:</strong> {detectedPass.ownerName}</p>
                  <p><strong>Pass Type:</strong> {detectedPass.passType.toUpperCase()}</p>
                  <p><strong>Valid Until:</strong> {detectedPass.endDate.toLocaleDateString()}</p>
                  <p className="text-green-600 font-medium">✓ Free parking for pass holders</p>
                </div>
              </div>
            )}

            {isMobile && (
              <div className="mb-6">
                <Button
                  onClick={handleScanClick}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-4 text-lg font-semibold"
                >
                  <ScanLine className="h-6 w-6 mr-2" />
                  Scan License Plate
                </Button>
                <p className="text-center text-sm text-gray-500 mt-2">
                  Recommended for quick entry
                </p>
                
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">Or enter manually</span>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="vehicleNumber" className="text-base font-semibold">
                  Vehicle Number *
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="vehicleNumber"
                    type="text"
                    value={vehicleNumber}
                    onChange={handleVehicleNumberChange}
                    placeholder="Enter vehicle number (e.g., ABC-1234)"
                    className="text-lg py-3 px-4 flex-1"
                    disabled={isSubmitting}
                  />
                  {!isMobile && (
                    <Button
                      type="button"
                      onClick={handleScanClick}
                      variant="outline"
                      className="px-4"
                    >
                      <ScanLine className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  Enter the complete vehicle number including any letters and numbers
                </p>
              </div>

              <div className="space-y-4">
                <Label className="text-base font-semibold">Vehicle Type *</Label>
                <RadioGroup
                  value={vehicleType}
                  onValueChange={(value) => setVehicleType(value as 'two-wheeler' | 'three-wheeler' | 'four-wheeler')}
                  className="space-y-3"
                >
                  {vehicleTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <div key={type.value} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <RadioGroupItem value={type.value} id={type.value} />
                        <div className="flex items-center space-x-3 flex-1">
                          <Icon className="h-6 w-6 text-gray-600" />
                          <div className="flex-1">
                            <Label htmlFor={type.value} className="font-medium cursor-pointer">
                              {type.label}
                            </Label>
                            <p className="text-sm text-gray-500">{type.description}</p>
                          </div>
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
                  {detectedPass ? (
                    <li className="text-green-600 font-medium">• Free parking for monthly pass holders</li>
                  ) : (
                    <li>• Parking charges: ₹24 for first 6 hours, then ₹10 per hour</li>
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
