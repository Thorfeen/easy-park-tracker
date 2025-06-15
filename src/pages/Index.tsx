import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import VehicleEntry from "@/components/VehicleEntry";
import VehicleExit from "@/components/VehicleExit";
import ParkingRecords from "@/components/ParkingRecords";
import { Car, Clock, History, DollarSign, ScanLine } from "lucide-react";
import { useMobileDetection } from "@/hooks/use-mobile-detection";
import RevenueCard from "@/components/RevenueCard";

export interface ParkingRecord {
  id: string;
  vehicleNumber: string;
  entryTime: Date;
  exitTime?: Date;
  duration?: number;
  amountDue?: number;
  status: 'active' | 'completed';
}

const Index = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'entry' | 'exit' | 'records'>('dashboard');
  const [parkingRecords, setParkingRecords] = useState<ParkingRecord[]>([]);
  const isMobile = useMobileDetection();

  const activeVehicles = parkingRecords.filter(record => record.status === 'active');
  const completedRecords = parkingRecords.filter(record => record.status === 'completed');
  const totalRevenue = completedRecords.reduce((sum, record) => sum + (record.amountDue || 0), 0);

  const addVehicleEntry = (vehicleNumber: string) => {
    const newRecord: ParkingRecord = {
      id: Date.now().toString(),
      vehicleNumber: vehicleNumber.toUpperCase(),
      entryTime: new Date(),
      status: 'active'
    };
    setParkingRecords(prev => [...prev, newRecord]);
    console.log('New vehicle entry added:', newRecord);
  };

  const processVehicleExit = (vehicleNumber: string) => {
    const upperVehicleNumber = vehicleNumber.toUpperCase();
    const activeRecord = parkingRecords.find(
      record => record.vehicleNumber === upperVehicleNumber && record.status === 'active'
    );

    if (!activeRecord) {
      return null;
    }

    const exitTime = new Date();
    const durationMs = exitTime.getTime() - activeRecord.entryTime.getTime();
    const durationHours = Math.ceil(durationMs / (1000 * 60 * 60)); // Round up to next hour
    const hourlyRate = 10; // $10 per hour
    const amountDue = durationHours * hourlyRate;

    const updatedRecord = {
      ...activeRecord,
      exitTime,
      duration: durationHours,
      amountDue,
      status: 'completed' as const
    };

    setParkingRecords(prev =>
      prev.map(record =>
        record.id === activeRecord.id ? updatedRecord : record
      )
    );

    console.log('Vehicle exit processed:', updatedRecord);
    return updatedRecord;
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'entry':
        return <VehicleEntry onAddEntry={addVehicleEntry} onBack={() => setCurrentView('dashboard')} />;
      case 'exit':
        return <VehicleExit onProcessExit={processVehicleExit} onBack={() => setCurrentView('dashboard')} />;
      case 'records':
        return <ParkingRecords records={parkingRecords} onBack={() => setCurrentView('dashboard')} />;
      default:
        return (
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Easy Park Tracker</h1>
                <p className="text-lg text-gray-600">Efficient Vehicle Parking Management System</p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Vehicles</CardTitle>
                    <Car className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{activeVehicles.length}</div>
                    <p className="text-xs text-muted-foreground">Currently parked</p>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Records</CardTitle>
                    <History className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{parkingRecords.length}</div>
                    <p className="text-xs text-muted-foreground">All time entries</p>
                  </CardContent>
                </Card>

                <RevenueCard records={parkingRecords} />
              </div>

              {/* Action Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 cursor-pointer"
                      onClick={() => setCurrentView('entry')}>
                  <CardHeader className="text-center">
                    {isMobile ? <ScanLine className="h-12 w-12 mx-auto mb-4" /> : <Car className="h-12 w-12 mx-auto mb-4" />}
                    <CardTitle className="text-xl">Vehicle Entry</CardTitle>
                    <CardDescription className="text-blue-100">
                      Register new vehicle arrival
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <Button variant="secondary" className="w-full">
                      {isMobile ? "Scan New Entry" : "Add New Entry"}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 cursor-pointer"
                      onClick={() => setCurrentView('exit')}>
                  <CardHeader className="text-center">
                    {isMobile ? <ScanLine className="h-12 w-12 mx-auto mb-4" /> : <Clock className="h-12 w-12 mx-auto mb-4" />}
                    <CardTitle className="text-xl">Vehicle Exit</CardTitle>
                    <CardDescription className="text-green-100">
                      Process vehicle departure
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <Button variant="secondary" className="w-full">
                      {isMobile ? "Scan Process Exit" : "Process Exit"}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 cursor-pointer"
                      onClick={() => setCurrentView('records')}>
                  <CardHeader className="text-center">
                    <History className="h-12 w-12 mx-auto mb-4" />
                    <CardTitle className="text-xl">View Records</CardTitle>
                    <CardDescription className="text-purple-100">
                      Check parking history
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <Button variant="secondary" className="w-full">
                      View History
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Active Vehicles Preview */}
              {activeVehicles.length > 0 && (
                <Card className="bg-white shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Car className="h-5 w-5" />
                      Currently Parked Vehicles
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {activeVehicles.slice(0, 6).map(record => (
                        <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-semibold">{record.vehicleNumber}</p>
                            <p className="text-sm text-gray-600">
                              Entry: {record.entryTime.toLocaleTimeString()}
                            </p>
                          </div>
                          <Badge variant="secondary">Active</Badge>
                        </div>
                      ))}
                    </div>
                    {activeVehicles.length > 6 && (
                      <p className="text-center text-gray-500 mt-4">
                        And {activeVehicles.length - 6} more...
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        );
    }
  };

  return renderCurrentView();
};

export default Index;
