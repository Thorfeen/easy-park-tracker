
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import VehicleEntry from "@/components/VehicleEntry";
import VehicleExit from "@/components/VehicleExit";
import ParkingRecords from "@/components/ParkingRecords";
import MonthlyPassManagement from "@/components/MonthlyPassManagement";
import { Car, Clock, History, DollarSign, ScanLine, Truck, Bike, CreditCard } from "lucide-react";
import { useMobileDetection } from "@/hooks/use-mobile-detection";
import RevenueCard from "@/components/RevenueCard";
import { ParkingRecord, MonthlyPass } from "@/types/parking";

const Index = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'entry' | 'exit' | 'records' | 'passes'>('dashboard');
  const [parkingRecords, setParkingRecords] = useState<ParkingRecord[]>([]);
  const [monthlyPasses, setMonthlyPasses] = useState<MonthlyPass[]>([]);
  const isMobile = useMobileDetection();

  const activeVehicles = parkingRecords.filter(record => record.status === 'active');
  const activeTwoWheelers = activeVehicles.filter(record => record.vehicleType === 'two-wheeler');
  const activeThreeWheelers = activeVehicles.filter(record => record.vehicleType === 'three-wheeler');
  const activeFourWheelers = activeVehicles.filter(record => record.vehicleType === 'four-wheeler');
  const completedRecords = parkingRecords.filter(record => record.status === 'completed');
  const totalRevenue = completedRecords.reduce((sum, record) => sum + (record.amountDue || 0), 0);
  const activePasses = monthlyPasses.filter(pass => pass.status === 'active' && pass.endDate > new Date());
  const passHolderVehicles = activeVehicles.filter(record => record.isPassHolder);

  const findActivePass = (vehicleNumber: string): MonthlyPass | null => {
    return monthlyPasses.find(
      pass => pass.vehicleNumber === vehicleNumber.toUpperCase() && 
      pass.status === 'active' && 
      pass.endDate > new Date()
    ) || null;
  };

  const addVehicleEntry = (vehicleNumber: string, vehicleType: 'two-wheeler' | 'three-wheeler' | 'four-wheeler') => {
    const upperVehicleNumber = vehicleNumber.toUpperCase();
    const activePass = findActivePass(upperVehicleNumber);
    
    const newRecord: ParkingRecord = {
      id: Date.now().toString(),
      vehicleNumber: upperVehicleNumber,
      vehicleType,
      entryTime: new Date(),
      status: 'active',
      isPassHolder: !!activePass,
      passId: activePass?.id
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
    const durationHours = Math.ceil(durationMs / (1000 * 60 * 60));
    
    let amountDue = 0;
    
    // Check if vehicle has active pass
    const activePass = findActivePass(upperVehicleNumber);
    
    if (activePass && activePass.endDate > new Date()) {
      // Pass holder - no charges
      amountDue = 0;
    } else {
      // Regular pricing for non-pass holders or expired passes
      if (durationHours <= 6) {
        amountDue = 24;
      } else {
        const extraHours = durationHours - 6;
        amountDue = 24 + (extraHours * 10);
      }
    }

    const updatedRecord = {
      ...activeRecord,
      exitTime,
      duration: durationHours,
      amountDue,
      status: 'completed' as const,
      isPassHolder: !!activePass,
      passId: activePass?.id
    };

    setParkingRecords(prev =>
      prev.map(record =>
        record.id === activeRecord.id ? updatedRecord : record
      )
    );

    console.log('Vehicle exit processed:', updatedRecord);
    return updatedRecord;
  };

  const addMonthlyPass = (passData: Omit<MonthlyPass, 'id'>) => {
    const newPass: MonthlyPass = {
      ...passData,
      id: Date.now().toString()
    };
    setMonthlyPasses(prev => [...prev, newPass]);
    console.log('New monthly pass created:', newPass);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'entry':
        return <VehicleEntry onAddEntry={addVehicleEntry} onBack={() => setCurrentView('dashboard')} findActivePass={findActivePass} />;
      case 'exit':
        return <VehicleExit onProcessExit={processVehicleExit} onBack={() => setCurrentView('dashboard')} findActivePass={findActivePass} />;
      case 'records':
        return <ParkingRecords records={parkingRecords} passes={monthlyPasses} onBack={() => setCurrentView('dashboard')} />;
      case 'passes':
        return <MonthlyPassManagement passes={monthlyPasses} onAddPass={addMonthlyPass} onBack={() => setCurrentView('dashboard')} />;
      default:
        return (
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-blue-900 mb-2">Railway Parking Management</h1>
                <p className="text-lg text-blue-700">Efficient Vehicle Parking Management System</p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow border-blue-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-blue-700">Active Vehicles</CardTitle>
                    <Car className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{activeVehicles.length}</div>
                    <div className="space-y-1 mt-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1 text-blue-600">
                          <Bike className="h-3 w-3" />
                          Two Wheelers
                        </span>
                        <span className="font-medium text-blue-800">{activeTwoWheelers.length}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1 text-blue-600">
                          <Car className="h-3 w-3" />
                          Three Wheelers
                        </span>
                        <span className="font-medium text-blue-800">{activeThreeWheelers.length}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1 text-blue-600">
                          <Truck className="h-3 w-3" />
                          Four Wheelers
                        </span>
                        <span className="font-medium text-blue-800">{activeFourWheelers.length}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow border-blue-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-blue-700">Monthly Passes</CardTitle>
                    <CreditCard className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{activePasses.length}</div>
                    <div className="space-y-1 mt-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-blue-600">Pass Holders Parked</span>
                        <span className="font-medium text-blue-800">{passHolderVehicles.length}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-blue-600">Total Passes</span>
                        <span className="font-medium text-blue-800">{monthlyPasses.length}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow border-blue-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-blue-700">Total Records</CardTitle>
                    <History className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{parkingRecords.length}</div>
                    <p className="text-xs text-blue-500">All time entries</p>
                  </CardContent>
                </Card>

                <RevenueCard records={parkingRecords} />
              </div>

              {/* Action Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                    <Button variant="secondary" className="w-full bg-white text-blue-600 hover:bg-blue-50">
                      {isMobile ? "Scan New Entry" : "Add New Entry"}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 cursor-pointer"
                      onClick={() => setCurrentView('exit')}>
                  <CardHeader className="text-center">
                    {isMobile ? <ScanLine className="h-12 w-12 mx-auto mb-4" /> : <Clock className="h-12 w-12 mx-auto mb-4" />}
                    <CardTitle className="text-xl">Vehicle Exit</CardTitle>
                    <CardDescription className="text-blue-100">
                      Process vehicle departure
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <Button variant="secondary" className="w-full bg-white text-blue-600 hover:bg-blue-50">
                      {isMobile ? "Scan Process Exit" : "Process Exit"}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-700 to-blue-800 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 cursor-pointer"
                      onClick={() => setCurrentView('passes')}>
                  <CardHeader className="text-center">
                    <CreditCard className="h-12 w-12 mx-auto mb-4" />
                    <CardTitle className="text-xl">Monthly Passes</CardTitle>
                    <CardDescription className="text-blue-100">
                      Manage monthly passes
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <Button variant="secondary" className="w-full bg-white text-blue-600 hover:bg-blue-50">
                      Manage Passes
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-400 to-blue-500 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 cursor-pointer"
                      onClick={() => setCurrentView('records')}>
                  <CardHeader className="text-center">
                    <History className="h-12 w-12 mx-auto mb-4" />
                    <CardTitle className="text-xl">View Records</CardTitle>
                    <CardDescription className="text-blue-100">
                      Check parking history
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <Button variant="secondary" className="w-full bg-white text-blue-600 hover:bg-blue-50">
                      View History
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Active Vehicles Preview */}
              {activeVehicles.length > 0 && (
                <Card className="bg-white shadow-lg border-blue-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-800">
                      <Car className="h-5 w-5" />
                      Currently Parked Vehicles
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {activeTwoWheelers.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm text-blue-700 mb-2 flex items-center gap-2">
                            <Bike className="h-4 w-4" />
                            Two Wheelers ({activeTwoWheelers.length})
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {activeTwoWheelers.slice(0, 3).map(record => (
                              <div key={record.id} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg border border-blue-200">
                                <div>
                                  <p className="font-semibold text-sm text-blue-800">{record.vehicleNumber}</p>
                                  <p className="text-xs text-blue-600">
                                    {record.entryTime.toLocaleTimeString()}
                                  </p>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">Active</Badge>
                                  {record.isPassHolder && (
                                    <Badge variant="default" className="text-xs bg-blue-600 text-white">Pass</Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {activeThreeWheelers.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm text-blue-700 mb-2 flex items-center gap-2">
                            <Car className="h-4 w-4" />
                            Three Wheelers ({activeThreeWheelers.length})
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {activeThreeWheelers.slice(0, 3).map(record => (
                              <div key={record.id} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg border border-blue-200">
                                <div>
                                  <p className="font-semibold text-sm text-blue-800">{record.vehicleNumber}</p>
                                  <p className="text-xs text-blue-600">
                                    {record.entryTime.toLocaleTimeString()}
                                  </p>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">Active</Badge>
                                  {record.isPassHolder && (
                                    <Badge variant="default" className="text-xs bg-blue-600 text-white">Pass</Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {activeFourWheelers.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm text-blue-700 mb-2 flex items-center gap-2">
                            <Truck className="h-4 w-4" />
                            Four Wheelers ({activeFourWheelers.length})
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {activeFourWheelers.slice(0, 3).map(record => (
                              <div key={record.id} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg border border-blue-200">
                                <div>
                                  <p className="font-semibold text-sm text-blue-800">{record.vehicleNumber}</p>
                                  <p className="text-xs text-blue-600">
                                    {record.entryTime.toLocaleTimeString()}
                                  </p>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">Active</Badge>
                                  {record.isPassHolder && (
                                    <Badge variant="default" className="text-xs bg-blue-600 text-white">Pass</Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    {activeVehicles.length > 9 && (
                      <p className="text-center text-blue-500 mt-4">
                        And {activeVehicles.length - 9} more...
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
