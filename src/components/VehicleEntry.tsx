
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Car, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VehicleEntryProps {
  onAddEntry: (vehicleNumber: string) => void;
  onBack: () => void;
}

const VehicleEntry = ({ onAddEntry, onBack }: VehicleEntryProps) => {
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

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

    setIsSubmitting(true);
    
    try {
      onAddEntry(vehicleNumber);
      toast({
        title: "Success!",
        description: `Vehicle ${vehicleNumber.toUpperCase()} has been registered successfully`,
      });
      setVehicleNumber("");
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

  const currentTime = new Date().toLocaleString();

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

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="vehicleNumber" className="text-base font-semibold">
                  Vehicle Number *
                </Label>
                <Input
                  id="vehicleNumber"
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  placeholder="Enter vehicle number (e.g., ABC-1234)"
                  className="text-lg py-3 px-4"
                  disabled={isSubmitting}
                />
                <p className="text-sm text-gray-600">
                  Enter the complete vehicle number including any letters and numbers
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Entry Details:</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Entry time will be automatically recorded</li>
                  <li>• Vehicle will be marked as active in the system</li>
                  <li>• Parking charges: $10 per hour (minimum 1 hour)</li>
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
