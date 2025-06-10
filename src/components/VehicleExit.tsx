
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, DollarSign, Car, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ParkingRecord } from "@/pages/Index";

interface VehicleExitProps {
  onProcessExit: (vehicleNumber: string) => ParkingRecord | null;
  onBack: () => void;
}

const VehicleExit = ({ onProcessExit, onBack }: VehicleExitProps) => {
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [exitRecord, setExitRecord] = useState<ParkingRecord | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [vehicleNotFound, setVehicleNotFound] = useState(false);
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
      const record = onProcessExit(vehicleNumber);
      
      if (record) {
        setExitRecord(record);
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

  const handleNewSearch = () => {
    setVehicleNumber("");
    setExitRecord(null);
    setVehicleNotFound(false);
  };

  const formatDuration = (hours: number) => {
    if (hours === 1) return "1 hour";
    return `${hours} hours`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
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
              <form onSubmit={handleSearch} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="vehicleNumber" className="text-base font-semibold">
                    Vehicle Number *
                  </Label>
                  <Input
                    id="vehicleNumber"
                    type="text"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    placeholder="Enter vehicle number to process exit"
                    className="text-lg py-3 px-4"
                    disabled={isProcessing}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 text-lg font-semibold"
                  disabled={isProcessing}
                >
                  {isProcessing ? "Processing..." : "Process Exit"}
                </Button>
              </form>
            )}

            {vehicleNotFound && (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <AlertCircle className="h-16 w-16 text-red-500" />
                </div>
                <h3 className="text-xl font-semibold text-red-600">Vehicle Not Found</h3>
                <p className="text-gray-600">
                  No active parking record found for vehicle number: <strong>{vehicleNumber.toUpperCase()}</strong>
                </p>
                <p className="text-sm text-gray-500">
                  Please check the vehicle number and ensure it has been registered for entry.
                </p>
                <Button onClick={handleNewSearch} variant="outline">
                  Try Another Vehicle
                </Button>
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
                      <div>
                        <Badge variant="default" className="bg-green-600">
                          Completed
                        </Badge>
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
                        <p className="font-medium">{formatDuration(exitRecord.duration || 0)}</p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Amount Due</Label>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <p className="font-bold text-xl text-green-600">${exitRecord.amountDue}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded border">
                    <p className="text-sm text-gray-600 mb-2">Calculation:</p>
                    <p className="text-sm">
                      {formatDuration(exitRecord.duration || 0)} × $10/hour = <strong>${exitRecord.amountDue}</strong>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      * Minimum charge of 1 hour applies
                    </p>
                  </div>
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
