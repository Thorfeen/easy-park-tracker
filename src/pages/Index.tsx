import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import VehicleEntry from "@/components/VehicleEntry";
import VehicleExit from "@/components/VehicleExit";
import ParkingRecords from "@/components/ParkingRecords";
import MonthlyPassManagement from "@/components/MonthlyPassManagement";
import { Car, Clock, History, DollarSign, ScanLine, Truck, Bike, CreditCard, IndianRupee, Fullscreen } from "lucide-react";
import { useMobileDetection } from "@/hooks/use-mobile-detection";
import { ParkingRecord, MonthlyPass } from "@/types/parking";
import { calculateParkingCharges } from "@/utils/parkingCharges";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useParkingRecords } from "@/hooks/useParkingRecords";
import { useMonthlyPasses } from "@/hooks/useMonthlyPasses";

const FullscreenToggleButton = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  // Update state if user leaves fullscreen via ESC or other means
  // (so we update the icon accordingly)
  // Only adds event listener once
  if (typeof window !== "undefined") {
    document.onfullscreenchange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
  }

  return (
    <button
      onClick={handleToggleFullscreen}
      className="absolute top-4 right-24 z-40 p-2 bg-white shadow rounded-full hover:bg-gray-100 transition-colors"
      title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
      aria-label="Toggle Fullscreen"
      type="button"
    >
      <Fullscreen className="w-6 h-6 text-gray-800" />
    </button>
  );
};

const Index = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'entry' | 'exit' | 'records' | 'passes'>('dashboard');
  const {
    records: parkingRecords,
    loading: parkingLoading,
    addEntry,
    updateExit,
    fetchRecords,
    setRecords,
  } = useParkingRecords();
  const {
    passes: monthlyPasses,
    loading: passesLoading,
    addPass,
    updatePass,
    fetchPasses,
    setPasses: setMonthlyPasses,
  } = useMonthlyPasses();
  const isMobile = useMobileDetection();

  const activeVehicles = parkingRecords.filter(record => record.status === 'active');
  // NEW: Calculate helmets in safe
  const helmetsInSafeCount = activeVehicles.filter(record => record.helmet === true).length;

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

  // New stats for monthly passes (counts by type)
  const cyclePassCount = monthlyPasses.filter(pass => pass.vehicleType === 'cycle').length;
  const twoWheelerPassCount = monthlyPasses.filter(pass => pass.vehicleType === 'two-wheeler').length;
  const threeWheelerPassCount = monthlyPasses.filter(pass => pass.vehicleType === 'three-wheeler').length;
  const fourWheelerPassCount = monthlyPasses.filter(pass => pass.vehicleType === 'four-wheeler').length;

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
  const addVehicleEntry = async (
    vehicleNumber: string,
    vehicleType: 'cycle' | 'two-wheeler' | 'three-wheeler' | 'four-wheeler',
    helmet?: boolean,
    showToast?: (args: { title: string, description: string, variant?: string }) => void
  ): Promise<boolean> => {
    const upperVehicleNumber = vehicleNumber.toUpperCase();

    if (activeVehicles.find(
      record =>
        record.vehicleNumber === upperVehicleNumber &&
        record.status === 'active'
    )) {
      showToast?.({
        title: "Error",
        description: `Vehicle ${upperVehicleNumber} is already inside the parking lot.`,
        variant: "destructive",
      });
      return false;
    }

    const matchedPass = findActivePass(upperVehicleNumber, vehicleType);
    const anyPass = findActivePass(upperVehicleNumber);

    if (anyPass && (!matchedPass || anyPass.vehicleType !== vehicleType)) {
      showToast?.({
        title: "Pass Type Mismatch",
        description: `The active pass for ${upperVehicleNumber} is for ${anyPass.vehicleType.toUpperCase()}. Please select the correct vehicle type.`,
        variant: "destructive",
      });
      return false;
    }

    // Create record in Supabase
    try {
      await addEntry({
        vehicleNumber: upperVehicleNumber,
        vehicleType,
        entryTime: new Date(),
        isPassHolder: !!matchedPass,
        passId: matchedPass?.id,
        status: "active",
        helmet: helmet || false,
      });
      console.log('New vehicle entry saved to Supabase');
      return true;
    } catch (err: any) {
      showToast?.({
        title: "Error",
        description: err?.message || "Failed to add entry in database",
        variant: "destructive",
      });
      return false;
    }
  };

  const processVehicleExit = async (vehicleNumber: string): Promise<ParkingRecord | null> => {
    const upperVehicleNumber = vehicleNumber.toUpperCase();
    const activeRecord = parkingRecords.find(
      record => record.vehicleNumber === upperVehicleNumber && record.status === 'active'
    );

    if (!activeRecord) return null;

    const exitTime = new Date();
    const durationMs = exitTime.getTime() - activeRecord.entryTime.getTime();
    const durationHours = Math.ceil(durationMs / (1000 * 60 * 60));
    const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));
    let amountDue = 0;
    let calculationBreakdown: string[] = [];

    const activePass = findActivePass(upperVehicleNumber, activeRecord.vehicleType);
    if (activePass && activePass.endDate > new Date()) {
      amountDue = 0;
      calculationBreakdown = [`Monthly Pass Holder (${activePass.vehicleType.toUpperCase()}): ₹0`];
    } else {
      const { amount, breakdown } = calculateParkingCharges(
        activeRecord.vehicleType,
        activeRecord.entryTime,
        exitTime
      );
      amountDue = amount;
      calculationBreakdown = [...breakdown];
      if (activeRecord.helmet && (activeRecord.vehicleType === 'cycle' || activeRecord.vehicleType === 'two-wheeler')) {
        const helmetCharge = durationDays * 2;
        amountDue += helmetCharge;
        calculationBreakdown.push(`Helmet Charges: ₹2 x ${durationDays} day(s) = ₹${helmetCharge}`);
      }
    }

    try {
      const updatedRecord = await updateExit(activeRecord.id, {
        exitTime,
        duration: durationHours,
        amountDue,
        calculationBreakdown,
        status: "completed",
        isPassHolder: !!activePass,
        passId: activePass?.id,
        helmet: activeRecord.helmet || false,
      });
      console.log('Vehicle exit processed & updated in Supabase:', updatedRecord);
      return updatedRecord;
    } catch (err: any) {
      console.error('Error updating vehicle exit in Supabase:', err);
      return null;
    }
  };

  // Update addMonthlyPass to save in database
  const addMonthlyPass = async (passData: Omit<MonthlyPass, 'id'>) => {
    try {
      await addPass(passData);
      await fetchPasses();
      console.log('New monthly pass created (DB):', passData);
    } catch (e) {
      console.error("Error adding monthly pass to DB", e);
    }
  };

  // Added: Compute entry counts by vehicle type
  const cycleEntriesCount = parkingRecords.filter(record => record.vehicleType === "cycle").length;
  const twoWheelerEntriesCount = parkingRecords.filter(record => record.vehicleType === "two-wheeler").length;
  const threeWheelerEntriesCount = parkingRecords.filter(record => record.vehicleType === "three-wheeler").length;
  const fourWheelerEntriesCount = parkingRecords.filter(record => record.vehicleType === "four-wheeler").length;

  const getDateString = (date: Date) => {
    return format(date, "yyyy-MM-dd");
  };
  const isSameDay = (a: Date, b: Date) => {
    return getDateString(a) === getDateString(b);
  };

  // --- Revenue Calculations ---
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  // --- Monthly Pass Sales Revenue ---
  function getPassSalesForDate(passes: MonthlyPass[], date: Date) {
    const dateStr = getDateString(date);
    return passes
      .filter(pass => pass.createdAt && getDateString(pass.createdAt) === dateStr)
      .reduce((sum, pass) => sum + (pass.amount || 0), 0);
  }

  function getPassSalesForPeriod(passes: MonthlyPass[], start: Date, end: Date) {
    return passes
      .filter(pass => pass.createdAt && pass.createdAt >= start && pass.createdAt <= end)
      .reduce((sum, pass) => sum + (pass.amount || 0), 0);
  }

  // --- Old Parking Revenue functions now include pass sales
  function getRevenueForDate(records: ParkingRecord[], passes: MonthlyPass[], date: Date) {
    const dateStr = getDateString(date);
    const parking = records
      .filter(r => r.status === "completed" && r.exitTime && getDateString(r.exitTime) === dateStr && !r.isPassHolder)
      .reduce((sum, rec) => sum + (rec.amountDue || 0), 0);
    const passSales = getPassSalesForDate(passes, date);
    return parking + passSales;
  }

  function getRevenueForPeriod(records: ParkingRecord[], passes: MonthlyPass[], start: Date, end: Date) {
    const parking = records
      .filter(r => r.status === "completed" && r.exitTime && r.exitTime >= start && r.exitTime <= end && !r.isPassHolder)
      .reduce((sum, rec) => sum + (rec.amountDue || 0), 0);
    const passSales = getPassSalesForPeriod(passes, start, end);
    return parking + passSales;
  }

  // --- Revenue Variables ---
  const [selectedRevenueDate, setSelectedRevenueDate] = useState<Date>(today);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Today's Revenue
  const todaysRevenue = getRevenueForDate(parkingRecords, monthlyPasses, today);

  // Yesterday's Revenue
  const yesterdaysRevenue = getRevenueForDate(parkingRecords, monthlyPasses, yesterday);

  // Last 7 Days Revenue (including today)
  const start7Days = new Date(today);
  start7Days.setDate(today.getDate() - 6);
  start7Days.setHours(0, 0, 0, 0);
  const endOfToday = new Date(today);
  endOfToday.setHours(23, 59, 59, 999);
  const last7DaysRevenue = getRevenueForPeriod(parkingRecords, monthlyPasses, start7Days, endOfToday);

  // Current Month Revenue
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0, 0);
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
  const monthlyRevenue = getRevenueForPeriod(parkingRecords, monthlyPasses, firstDayOfMonth, lastDayOfMonth);

  // Monthly Pass Sales (display-only, not included in stats card; if desired)
  const monthlyPassSales = monthlyPasses.filter(pass =>
    pass.createdAt &&
    pass.createdAt >= firstDayOfMonth &&
    pass.createdAt <= lastDayOfMonth
  ).reduce((sum, pass) => sum + (pass.amount || 0), 0);

  // Revenue for selected date
  const selectedDateRevenue = getRevenueForDate(parkingRecords, monthlyPasses, selectedRevenueDate);
  const isRevenueToday = isSameDay(selectedRevenueDate, today);

  const renderCurrentView = () => {
    switch (currentView) {
      case 'entry':
        return (
          <VehicleEntry
            onAddEntry={addVehicleEntry}
            onBack={() => setCurrentView('dashboard')}
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
        return <MonthlyPassManagement onBack={() => setCurrentView('dashboard')} />;
      default:
        // Show the fullscreen toggle only on dashboard view
        return (
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <FullscreenToggleButton />
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Railway Parking Management</h1>
                <p className="text-lg text-gray-600">Efficient Vehicle Parking Management System</p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {/* --- UPDATED: Active Vehicles stats card --- */}
                <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Vehicles</CardTitle>
                    <Car className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{activeVehicles.length}</div>
                    <div className="space-y-1 mt-2">
                      <div className="flex items-center justify-between text-xs">
                        <span>Helmets in Safe</span>
                        <span className="font-medium">{helmetsInSafeCount}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span>Cycles</span>
                        <span className="font-medium">{activeCycles.length}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span>Two Wheelers</span>
                        <span className="font-medium">{activeTwoWheelers.length}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span>Three Wheelers</span>
                        <span className="font-medium">{activeThreeWheelers.length}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span>Four Wheelers</span>
                        <span className="font-medium">{activeFourWheelers.length}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Modified: Monthly Passes Stats Card */}
                <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Monthly Passes</CardTitle>
                    <CreditCard className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    {/* Main stat value & green color */}
                    <div className="text-2xl font-bold text-green-600">{activePasses.length}</div>
                    <div className="space-y-1 mt-2">
                      {/* Pass Holders Parked */}
                      <div className="flex items-center justify-between text-xs">
                        <span>Pass Holders Parked</span>
                        <span className="font-medium text-green-700">{passHolderVehicles.length}</span>
                      </div>
                      {/* Total Cycle Passes */}
                      <div className="flex items-center justify-between text-xs">
                        <span>Total Cycle Passes</span>
                        <span className="font-medium text-green-700">{cyclePassCount}</span>
                      </div>
                      {/* Total Two-Wheeler Passes */}
                      <div className="flex items-center justify-between text-xs">
                        <span>Total Two-Wheeler Passes</span>
                        <span className="font-medium text-green-700">{twoWheelerPassCount}</span>
                      </div>
                      {/* Total Three-Wheeler Passes */}
                      <div className="flex items-center justify-between text-xs">
                        <span>Total Three-Wheeler Passes</span>
                        <span className="font-medium text-green-700">{threeWheelerPassCount}</span>
                      </div>
                      {/* Total Four-Wheeler Passes */}
                      <div className="flex items-center justify-between text-xs">
                        <span>Total Four-Wheeler Passes</span>
                        <span className="font-medium text-green-700">{fourWheelerPassCount}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Modified: Total Records Stats Card */}
                <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Records</CardTitle>
                    <History className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">{parkingRecords.length}</div>
                    <div className="space-y-1 mt-2">
                      <div className="flex items-center justify-between text-xs">
                        <span>Cycle Entries</span>
                        <span className="font-medium">{cycleEntriesCount}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span>Two-Wheeler Entries</span>
                        <span className="font-medium">{twoWheelerEntriesCount}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span>Three-Wheeler Entries</span>
                        <span className="font-medium">{threeWheelerEntriesCount}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span>Four-Wheeler Entries</span>
                        <span className="font-medium">{fourWheelerEntriesCount}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* UPDATED REVENUE STATS CARD (enhanced) */}
                <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {isRevenueToday ? "Today's Revenue" : "Revenue"}
                    </CardTitle>
                    <IndianRupee className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="text-2xl font-bold text-orange-600">
                        ₹{selectedDateRevenue}
                      </div>
                      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                              "text-xs justify-start text-left font-normal",
                              !selectedRevenueDate && "text-muted-foreground"
                            )}
                          >
                            <ChevronDown className="mr-2 h-3 w-3" />
                            {isRevenueToday
                              ? "Today"
                              : format(selectedRevenueDate, "MMM dd, yyyy")}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={selectedRevenueDate}
                            onSelect={date => {
                              if (date) {
                                setSelectedRevenueDate(date);
                                setIsCalendarOpen(false);
                              }
                            }}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {isRevenueToday
                        ? "Includes completed exits and pass sales today"
                        : `Includes completed exits and pass sales on ${format(selectedRevenueDate, "MMM dd, yyyy")}`}
                    </p>
                    <div className="space-y-1 mt-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span>Yesterday Sales</span>
                        <span className="font-medium">₹{yesterdaysRevenue}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Last 7 Days Sales</span>
                        <span className="font-medium">₹{last7DaysRevenue}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Monthly Sales</span>
                        <span className="font-medium">₹{monthlyRevenue}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Monthly Pass Sales</span>
                        <span className="font-medium">₹{monthlyPassSales}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Action Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {/* VEHICLE ENTRY */}
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 cursor-pointer"
                      onClick={() => setCurrentView('entry')}>
                  <CardHeader className="text-center">
                    <Car className="h-12 w-12 mx-auto mb-4" />
                    <CardTitle className="text-xl">Vehicle Entry</CardTitle>
                    <CardDescription className="text-blue-100">
                      Register new vehicle arrival
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <Button variant="secondary" className="w-full">
                      Add New Entry
                    </Button>
                  </CardContent>
                </Card>
                {/* VEHICLE EXIT */}
                <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 cursor-pointer"
                      onClick={() => setCurrentView('exit')}>
                  <CardHeader className="text-center">
                    <Clock className="h-12 w-12 mx-auto mb-4" />
                    <CardTitle className="text-xl">Vehicle Exit</CardTitle>
                    <CardDescription className="text-green-100">
                      Process vehicle departure
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <Button variant="secondary" className="w-full">
                      Process Exit
                    </Button>
                  </CardContent>
                </Card>
                {/* MONTHLY PASSES */}
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
                {/* VIEW RECORDS */}
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
