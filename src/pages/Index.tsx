import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import VehicleEntry from "@/components/VehicleEntry";
import VehicleExit from "@/components/VehicleExit";
import ParkingRecords from "@/components/ParkingRecords";
import MonthlyPassManagement from "@/components/MonthlyPassManagement";
import { Car, Clock, History, DollarSign, ScanLine, Truck, Bike, CreditCard } from "lucide-react";
import { useMobileDetection } from "@/hooks/use-mobile-detection";
import { ParkingRecord, MonthlyPass } from "@/types/parking";
import { calculateParkingCharges } from "@/utils/parkingCharges";

const Index = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'entry' | 'exit' | 'records' | 'passes'>('dashboard');
  const [parkingRecords, setParkingRecords] = useState<ParkingRecord[]>([]);
  const [monthlyPasses, setMonthlyPasses] = useState<MonthlyPass[]>([]);
  const isMobile = useMobileDetection();

  const activeVehicles = parkingRecords.filter(record => record.status === 'active');
  const activeCycles = activeVehicles.filter(record => record.vehicleType === 'cycle');
  const activeTwoWheelers = activeVehicles.filter(record => record.vehicleType === 'two-wheeler');
  const activeThreeWheelers = activeVehicles.filter(record => record.vehicleType === 'three-wheeler');
  const activeFourWheelers = activeVehicles.filter(record => record.vehicleType === 'four-wheeler');
  const completedRecords = parkingRecords.filter(record => record.status === 'completed');
  // Calculate total parking revenue (from completed records, excluding pass holders)
  const parkingRevenue = completedRecords.filter(r => !r.isPassHolder).reduce((sum, record) => sum + (record.amountDue || 0), 0);
  // Calculate total monthly pass revenue (sum of all pass sales)
  const monthlyPassRevenue = monthlyPasses.reduce((sum, pass) => sum + (pass.amount || 0), 0);
  const totalRevenue = parkingRevenue + monthlyPassRevenue;

  const activePasses = monthlyPasses.filter(pass => pass.status === 'active' && pass.endDate > new Date());
  const passHolderVehicles = activeVehicles.filter(record => record.isPassHolder);

  // New: Update lastUsedAt for a monthly pass
  const updatePassLastUsedAt = (passId: string) => {
    setMonthlyPasses(prev =>
      prev.map(pass =>
        pass.id === passId
          ? { ...pass, lastUsedAt: new Date() }
          : pass
      )
    );
  };

  // DUPLICATE CHECK: Returns the active record if a duplicate is found, else null
  const findActiveVehicle = (vehicleNumber: string): ParkingRecord | null =>
    parkingRecords.find(
      record =>
        record.vehicleNumber === vehicleNumber.toUpperCase() &&
        record.status === 'active'
    ) || null;

  // STRICT PASS VALIDATION: Returns the pass only if both vehicle number & type are matched
  const findActivePass = (vehicleNumber: string, vehicleType?: 'cycle' | 'two-wheeler' | 'three-wheeler' | 'four-wheeler'): MonthlyPass | null => {
    const upperVehicleNumber = vehicleNumber.toUpperCase();
    if (vehicleType) {
      return monthlyPasses.find(
        pass =>
          pass.vehicleNumber === upperVehicleNumber &&
          pass.vehicleType === vehicleType &&
          pass.status === 'active' &&
          pass.endDate > new Date()
      ) || null;
    }
    // fallback for legacy usage
    return monthlyPasses.find(
      pass =>
        pass.vehicleNumber === upperVehicleNumber &&
        pass.status === 'active' &&
        pass.endDate > new Date()
    ) || null;
  };

  // Make sure addVehicleEntry accepts cycles and enforces both duplicate and pass validations
  const addVehicleEntry = (
    vehicleNumber: string,
    vehicleType: 'cycle' | 'two-wheeler' | 'three-wheeler' | 'four-wheeler',
    showToast?: (args: { title: string, description: string, variant?: string }) => void
  ) => {
    const upperVehicleNumber = vehicleNumber.toUpperCase();

    // DUPLICATE CHECK
    if (findActiveVehicle(upperVehicleNumber)) {
      showToast?.({
        title: "Error",
        description: `Vehicle ${upperVehicleNumber} is already inside the parking lot.`,
        variant: "destructive",
      });
      return false;
    }

    // STRICT PASS CHECK
    const matchedPass = findActivePass(upperVehicleNumber, vehicleType);
    const anyPass = findActivePass(upperVehicleNumber);

    if (anyPass && (!matchedPass || anyPass.vehicleType !== vehicleType)) {
      // Pass exists for this number but not for the selected type.
      showToast?.({
        title: "Pass Type Mismatch",
        description: `The active pass for ${upperVehicleNumber} is for ${anyPass.vehicleType.toUpperCase()}. Please select the correct vehicle type.`,
        variant: "destructive",
      });
      return false;
    }

    const newRecord: ParkingRecord = {
      id: Date.now().toString(),
      vehicleNumber: upperVehicleNumber,
      vehicleType,
      entryTime: new Date(),
      status: 'active',
      isPassHolder: !!matchedPass,
      passId: matchedPass?.id,
    };
    setParkingRecords(prev => [...prev, newRecord]);
    console.log('New vehicle entry added:', newRecord);
    return true;
  };

  // UPDATED EXIT PROCESSING LOGIC
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
    let calculationBreakdown: string[] = [];

    // Check if vehicle has active pass
    const activePass = findActivePass(upperVehicleNumber, activeRecord.vehicleType);

    if (activePass && activePass.endDate > new Date()) {
      // Pass holder - no charges
      amountDue = 0;
      calculationBreakdown = [`Monthly Pass Holder (${activePass.vehicleType.toUpperCase()}): ₹0`];
    } else {
      // Use new pricing function
      const { amount, breakdown } = calculateParkingCharges(
        activeRecord.vehicleType,
        activeRecord.entryTime,
        exitTime
      );
      amountDue = amount;
      calculationBreakdown = breakdown;
    }

    const updatedRecord = {
      ...activeRecord,
      exitTime,
      duration: durationHours,
      amountDue,
      calculationBreakdown, // <-- Pass this to VehicleExit for display
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
        return (
          <VehicleEntry
            onAddEntry={(
              vehicleNumber: string,
              vehicleType: 'cycle' | 'two-wheeler' | 'three-wheeler' | 'four-wheeler',
              toastCallback?: (args: { title: string, description: string, variant?: string }) => void
            ) => addVehicleEntry(vehicleNumber, vehicleType, toastCallback)}
            onBack={() => setCurrentView('dashboard')}
            // Now only matches pass if BOTH number and type match
            findActivePass={findActivePass}
            onUpdatePassLastUsedAt={updatePassLastUsedAt}
            findActiveVehicle={findActiveVehicle}
          />
        );
      case 'exit':
        return (
          <VehicleExit
            onProcessExit={processVehicleExit}
            onBack={() => setCurrentView('dashboard')}
            findActivePass={findActivePass}
            onUpdatePassLastUsedAt={updatePassLastUsedAt}
          />
        );
      case 'records':
        return <ParkingRecords records={parkingRecords} passes={monthlyPasses} onBack={() => setCurrentView('dashboard')} />;
      case 'passes':
        return <MonthlyPassManagement passes={monthlyPasses} onAddPass={addMonthlyPass} onBack={() => setCurrentView('dashboard')} />;
      default:
        return (
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Railway Parking Management</h1>
                <p className="text-lg text-gray-600">Efficient Vehicle Parking Management System</p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Vehicles</CardTitle>
                    <Car className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{activeVehicles.length}</div>
                    <div className="space-y-1 mt-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1">
                          <Bike className="h-3 w-3" />
                          Cycles
                        </span>
                        <span className="font-medium">{activeCycles.length}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1">
                          <Bike className="h-3 w-3" />
                          Two Wheelers
                        </span>
                        <span className="font-medium">{activeTwoWheelers.length}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1">
                          <Car className="h-3 w-3" />
                          Three Wheelers
                        </span>
                        <span className="font-medium">{activeThreeWheelers.length}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1">
                          <Truck className="h-3 w-3" />
                          Four Wheelers
                        </span>
                        <span className="font-medium">{activeFourWheelers.length}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Monthly Passes</CardTitle>
                    <CreditCard className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">{activePasses.length}</div>
                    <div className="space-y-1 mt-2">
                      <div className="flex items-center justify-between text-xs">
                        <span>Pass Holders Parked</span>
                        <span className="font-medium">{passHolderVehicles.length}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span>Total Passes</span>
                        <span className="font-medium">{monthlyPasses.length}</span>
                      </div>
                    </div>
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

                <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{`₹${totalRevenue}`}</div>
                    <div className="space-y-1 mt-2">
                      <div className="flex items-center justify-between text-xs">
                        <span>Parking Charges</span>
                        <span className="font-medium">{`₹${parkingRevenue}`}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span>Monthly Pass Sales</span>
                        <span className="font-medium">{`₹${monthlyPassRevenue}`}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
                      onClick={() => setCurrentView('passes')}>
                  <CardHeader className="text-center">
                    <CreditCard className="h-12 w-12 mx-auto mb-4" />
                    <CardTitle className="text-xl">Monthly Passes</CardTitle>
                    <CardDescription className="text-purple-100">
                      Manage monthly passes
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <Button variant="secondary" className="w-full">
                      Manage Passes
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 cursor-pointer"
                      onClick={() => setCurrentView('records')}>
                  <CardHeader className="text-center">
                    <History className="h-12 w-12 mx-auto mb-4" />
                    <CardTitle className="text-xl">View Records</CardTitle>
                    <CardDescription className="text-orange-100">
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
                    <div className="space-y-4">
                      {/* CYCLES SECTION */}
                      {activeCycles.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center gap-2">
                            <Bike className="h-4 w-4" />
                            Cycles ({activeCycles.length})
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {activeCycles.slice(0, 3).map(record => (
                              <div key={record.id} className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                                <div>
                                  <p className="font-semibold text-sm">{record.vehicleNumber}</p>
                                  <p className="text-xs text-gray-600">
                                    {format(record.entryTime, "hh:mm a")}
                                  </p>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <Badge variant="secondary" className="text-xs">Active</Badge>
                                  {record.isPassHolder && (
                                    <Badge variant="default" className="text-xs bg-purple-600">Pass</Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* EXISTING 2W/3W/4W sections */}
                      {activeTwoWheelers.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center gap-2">
                            <Bike className="h-4 w-4" />
                            Two Wheelers ({activeTwoWheelers.length})
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {activeTwoWheelers.slice(0, 3).map(record => (
                              <div key={record.id} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                                <div>
                                  <p className="font-semibold text-sm">{record.vehicleNumber}</p>
                                  <p className="text-xs text-gray-600">
                                    {format(record.entryTime, "hh:mm a")}
                                  </p>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <Badge variant="secondary" className="text-xs">Active</Badge>
                                  {record.isPassHolder && (
                                    <Badge variant="default" className="text-xs bg-purple-600">Pass</Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {activeThreeWheelers.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center gap-2">
                            <Car className="h-4 w-4" />
                            Three Wheelers ({activeThreeWheelers.length})
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {activeThreeWheelers.slice(0, 3).map(record => (
                              <div key={record.id} className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                                <div>
                                  <p className="font-semibold text-sm">{record.vehicleNumber}</p>
                                  <p className="text-xs text-gray-600">
                                    {format(record.entryTime, "hh:mm a")}
                                  </p>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <Badge variant="secondary" className="text-xs">Active</Badge>
                                  {record.isPassHolder && (
                                    <Badge variant="default" className="text-xs bg-purple-600">Pass</Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {activeFourWheelers.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center gap-2">
                            <Truck className="h-4 w-4" />
                            Four Wheelers ({activeFourWheelers.length})
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {activeFourWheelers.slice(0, 3).map(record => (
                              <div key={record.id} className="flex items-center justify-between p-2 bg-purple-50 rounded-lg">
                                <div>
                                  <p className="font-semibold text-sm">{record.vehicleNumber}</p>
                                  <p className="text-xs text-gray-600">
                                    {format(record.entryTime, "hh:mm a")}
                                  </p>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <Badge variant="secondary" className="text-xs">Active</Badge>
                                  {record.isPassHolder && (
                                    <Badge variant="default" className="text-xs bg-purple-600">Pass</Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    {activeVehicles.length > 9 && (
                      <p className="text-center text-gray-500 mt-4">
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

// ------------- WARNING: This file is getting long. Please consider asking for a refactor into smaller components!
