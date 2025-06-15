import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Car, IndianRupee, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ParkingRecord } from "@/types/parking";
import { formatDurationFull } from "@/utils/parkingCharges";

interface VehicleExitProps {
  onProcessExit: (vehicleNumber: string) => Promise<ParkingRecord | null>;
  onBack: () => void;
  findActivePass: (vehicleNumber: string) => any | null;
  onUpdatePassLastUsedAt: (passId: string) => void;
}

const VehicleExit = ({ onProcessExit, onBack, findActivePass, onUpdatePassLastUsedAt }: VehicleExitProps) => {
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [exitRecord, setExitRecord] = useState<ParkingRecord | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [vehicleNotFound, setVehicleNotFound] = useState(false);
  const [detectedPass, setDetectedPass] = useState<any | null>(null);
  const { toast } = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!vehicleNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter a vehicle number",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setVehicleNotFound(false);
    setExitRecord(null);

    try {
      const record = await onProcessExit(vehicleNumber);
      
      if (record) {
        setExitRecord(record);

        // If the exited vehicle was a pass holder, update pass lastUsedAt
        if (record.isPassHolder && record.passId) {
          onUpdatePassLastUsedAt(record.passId);
        }

        toast({
          title: "Success!",
          description: `Vehicle ${vehicleNumber.toUpperCase()} has been processed for exit`,
        });
      } else {
        setVehicleNotFound(true);
        toast({
          title: "Vehicle Not Found",
          description: "No active parking record found for this vehicle number",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process vehicle exit. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
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

  const handleNewSearch = () => {
    setVehicleNumber("");
    setExitRecord(null);
    setVehicleNotFound(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
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
          <CardHeader className="text-center bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg">
            <div className="flex justify-center mb-4">
              <Clock className="h-16 w-16" />
            </div>
            <CardTitle className="text-2xl">Vehicle Exit</CardTitle>
            <CardDescription className="text-green-100">
              Process vehicle departure and calculate charges
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-8">
            {!exitRecord && !vehicleNotFound && (
              <div className="space-y-6">
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
                      <p className="text-green-600 font-medium">✓ No charges for valid pass holders</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSearch}>
                  <div className="space-y-2">
                    <Label htmlFor="vehicleNumber" className="text-base font-semibold">
                      Vehicle Number *
                    </Label>
                    <Input
                      id="vehicleNumber"
                      type="text"
                      value={vehicleNumber}
                      onChange={handleVehicleNumberChange}
                      placeholder="Enter vehicle number to process exit"
                      className="text-lg py-3 px-4"
                      disabled={isProcessing}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full mt-6 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 text-lg font-semibold"
                    disabled={isProcessing}
                  >
                    {isProcessing ? "Processing..." : "Process Exit"}
                  </Button>
                </form>
              </div>
            )}

            {exitRecord && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <Car className="h-16 w-16 mx-auto text-green-600 mb-2" />
                  <h3 className="text-xl font-semibold text-green-600">Exit Processed Successfully!</h3>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-600">Vehicle Number</Label>
                      <p className="font-semibold text-lg">{exitRecord.vehicleNumber}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Status</Label>
                      <div className="flex gap-2">
                        <Badge variant="default" className="bg-green-600">
                          Completed
                        </Badge>
                        {exitRecord.isPassHolder && (
                          <Badge variant="default" className="bg-purple-600">
                            Pass Holder
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-600">Entry Time</Label>
                      <p className="font-medium">{exitRecord.entryTime.toLocaleString()}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Exit Time</Label>
                      <p className="font-medium">{exitRecord.exitTime?.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-600">Parking Duration</Label>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <p className="font-medium">{formatDurationFull(exitRecord.duration || 0)}</p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Amount Due</Label>
                      <div className="flex items-center gap-2">
                        <IndianRupee className="h-4 w-4 text-green-600" />
                        <p className={`font-bold text-xl ${exitRecord.amountDue === 0 ? 'text-green-600' : 'text-green-600'}`}>
                          ₹{exitRecord.amountDue}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Show Helmet info if applicable */}
                  {(exitRecord.helmet && (exitRecord.vehicleType === 'cycle' || exitRecord.vehicleType === 'two-wheeler')) && (
                    <div className="bg-blue-50 p-4 rounded border border-blue-200 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path d="M20 21v-2a4 4 0 0 0-4-4h-4a4 4 0 0 0-4 4v2M12 3a6 6 0 0 1 6 6c0 3.314-5.373 6-6 6s-6-2.686-6-6a6 6 0 0 1 6-6z" />
                      </svg>
                      <span className="font-medium text-blue-700">Helmet was used for this parking.</span>
                    </div>
                  )}

                  {/* Calculation breakdown */}
                  {exitRecord.calculationBreakdown && (
                    <div className="bg-white p-4 rounded border">
                      <p className="text-sm text-gray-600 mb-2">Calculation:</p>
                      <ul className="list-disc pl-5 text-sm">
                        {exitRecord.calculationBreakdown.map((item, i) => (
                          <li key={i} className="text-gray-700">{item}</li>
                        ))}
                      </ul>
                      <p className="text-xs text-gray-500 mt-1">
                        For {exitRecord.vehicleType.replace(/-/g, ' ')}: according to detailed slab rates.
                      </p>
                    </div>
                  )}
                  {exitRecord.amountDue === 0 && (
                    <div className="bg-purple-100 p-4 rounded border border-purple-200">
                      <p className="text-sm text-purple-700 font-medium">
                        ✓ Free parking for monthly pass holders
                      </p>
                    </div>
                  )}
                </div>

                <Button 
                  onClick={handleNewSearch} 
                  className="w-full"
                  variant="outline"
                >
                  Process Another Exit
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VehicleExit;

// -------------- WARNING: This file is getting long. Please consider asking for a refactor into smaller components!
