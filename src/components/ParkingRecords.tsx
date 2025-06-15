
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, History, Search, Clock, IndianRupee, Download, FileText, FileSpreadsheet, CalendarIcon } from "lucide-react";
import { ParkingRecord } from "@/pages/Index";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface ParkingRecordsProps {
  records: ParkingRecord[];
  onBack: () => void;
}

const ParkingRecords = ({ records, onBack }: ParkingRecordsProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all');
  const [exportDateFrom, setExportDateFrom] = useState<Date>();
  const [exportDateTo, setExportDateTo] = useState<Date>();
  const [isFromCalendarOpen, setIsFromCalendarOpen] = useState(false);
  const [isToCalendarOpen, setIsToCalendarOpen] = useState(false);

  const filteredRecords = records.filter(record => {
    const matchesSearch = record.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getExportFilteredRecords = () => {
    return records.filter(record => {
      if (!exportDateFrom && !exportDateTo) return true;
      
      const recordDate = record.exitTime || record.entryTime;
      const recordDateOnly = new Date(recordDate.getFullYear(), recordDate.getMonth(), recordDate.getDate());
      
      if (exportDateFrom && exportDateTo) {
        const fromDate = new Date(exportDateFrom.getFullYear(), exportDateFrom.getMonth(), exportDateFrom.getDate());
        const toDate = new Date(exportDateTo.getFullYear(), exportDateTo.getMonth(), exportDateTo.getDate());
        return recordDateOnly >= fromDate && recordDateOnly <= toDate;
      }
      
      if (exportDateFrom) {
        const fromDate = new Date(exportDateFrom.getFullYear(), exportDateFrom.getMonth(), exportDateFrom.getDate());
        return recordDateOnly >= fromDate;
      }
      
      if (exportDateTo) {
        const toDate = new Date(exportDateTo.getFullYear(), exportDateTo.getMonth(), exportDateTo.getDate());
        return recordDateOnly <= toDate;
      }
      
      return true;
    });
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const exportRecords = getExportFilteredRecords();
    
    // Title
    doc.setFontSize(20);
    doc.text('Railway Parking Management - Records', 14, 22);
    
    // Date range
    if (exportDateFrom || exportDateTo) {
      doc.setFontSize(12);
      let dateText = 'Date Range: ';
      if (exportDateFrom) dateText += `From ${format(exportDateFrom, 'dd/MM/yyyy')} `;
      if (exportDateTo) dateText += `To ${format(exportDateTo, 'dd/MM/yyyy')}`;
      doc.text(dateText, 14, 32);
    }
    
    // Summary
    const completedRecords = exportRecords.filter(r => r.status === 'completed');
    const totalRevenue = completedRecords.reduce((sum, record) => sum + (record.amountDue || 0), 0);
    
    doc.setFontSize(12);
    doc.text(`Total Records: ${exportRecords.length}`, 14, 42);
    doc.text(`Active Vehicles: ${exportRecords.filter(r => r.status === 'active').length}`, 14, 50);
    doc.text(`Completed: ${completedRecords.length}`, 14, 58);
    doc.text(`Total Revenue: ₹${totalRevenue}`, 14, 66);
    
    // Table
    const tableData = exportRecords.map(record => [
      record.vehicleNumber,
      record.vehicleType,
      record.entryTime.toLocaleString(),
      record.exitTime ? record.exitTime.toLocaleString() : '-',
      record.duration ? `${record.duration} hours` : '-',
      record.amountDue ? `₹${record.amountDue}` : '-',
      record.status
    ]);
    
    (doc as any).autoTable({
      head: [['Vehicle Number', 'Type', 'Entry Time', 'Exit Time', 'Duration', 'Amount', 'Status']],
      body: tableData,
      startY: 75,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [79, 70, 229] },
    });
    
    doc.save(`parking-records-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const exportToExcel = () => {
    const exportRecords = getExportFilteredRecords();
    
    const worksheetData = exportRecords.map(record => ({
      'Vehicle Number': record.vehicleNumber,
      'Vehicle Type': record.vehicleType,
      'Entry Time': record.entryTime.toLocaleString(),
      'Exit Time': record.exitTime ? record.exitTime.toLocaleString() : '-',
      'Duration (Hours)': record.duration || '-',
      'Amount (₹)': record.amountDue || '-',
      'Status': record.status
    }));
    
    // Add summary at the top
    const completedRecords = exportRecords.filter(r => r.status === 'completed');
    const totalRevenue = completedRecords.reduce((sum, record) => sum + (record.amountDue || 0), 0);
    
    const summaryData = [
      { 'Vehicle Number': 'SUMMARY', 'Vehicle Type': '', 'Entry Time': '', 'Exit Time': '', 'Duration (Hours)': '', 'Amount (₹)': '', 'Status': '' },
      { 'Vehicle Number': `Total Records: ${exportRecords.length}`, 'Vehicle Type': '', 'Entry Time': '', 'Exit Time': '', 'Duration (Hours)': '', 'Amount (₹)': '', 'Status': '' },
      { 'Vehicle Number': `Active Vehicles: ${exportRecords.filter(r => r.status === 'active').length}`, 'Vehicle Type': '', 'Entry Time': '', 'Exit Time': '', 'Duration (Hours)': '', 'Amount (₹)': '', 'Status': '' },
      { 'Vehicle Number': `Completed: ${completedRecords.length}`, 'Vehicle Type': '', 'Entry Time': '', 'Exit Time': '', 'Duration (Hours)': '', 'Amount (₹)': '', 'Status': '' },
      { 'Vehicle Number': `Total Revenue: ₹${totalRevenue}`, 'Vehicle Type': '', 'Entry Time': '', 'Exit Time': '', 'Duration (Hours)': '', 'Amount (₹)': '', 'Status': '' },
      { 'Vehicle Number': '', 'Vehicle Type': '', 'Entry Time': '', 'Exit Time': '', 'Duration (Hours)': '', 'Amount (₹)': '', 'Status': '' },
    ];
    
    const finalData = [...summaryData, ...worksheetData];
    
    const worksheet = XLSX.utils.json_to_sheet(finalData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Parking Records");
    
    XLSX.writeFile(workbook, `parking-records-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const activeCount = records.filter(r => r.status === 'active').length;
  const completedCount = records.filter(r => r.status === 'completed').length;
  const totalRevenue = records
    .filter(r => r.status === 'completed')
    .reduce((sum, record) => sum + (record.amountDue || 0), 0);

  const formatDuration = (hours?: number) => {
    if (!hours) return '-';
    return hours === 1 ? '1 hour' : `${hours} hours`;
  };

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return <Badge variant="secondary" className="bg-blue-100 text-blue-700">Active</Badge>;
    }
    return <Badge variant="default" className="bg-green-100 text-green-700">Completed</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-violet-100 p-4">
      <div className="max-w-7xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="mb-6 hover:bg-white/50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="bg-white shadow-xl mb-6">
          <CardHeader className="text-center bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-t-lg">
            <div className="flex justify-center mb-4">
              <History className="h-16 w-16" />
            </div>
            <CardTitle className="text-2xl">Parking Records</CardTitle>
            <CardDescription className="text-purple-100">
              Complete history of all vehicle entries and exits
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-blue-600">Active Vehicles</p>
                    <p className="text-2xl font-bold text-blue-700">{activeCount}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-green-600">Completed</p>
                    <p className="text-2xl font-bold text-green-700">{completedCount}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-purple-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-purple-700">₹{totalRevenue}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Export Section */}
            <Card className="mb-6 bg-gray-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Export Records
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div>
                    <label className="text-sm font-medium mb-2 block">From Date</label>
                    <Popover open={isFromCalendarOpen} onOpenChange={setIsFromCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !exportDateFrom && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {exportDateFrom ? format(exportDateFrom, "dd/MM/yyyy") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={exportDateFrom}
                          onSelect={(date) => {
                            setExportDateFrom(date);
                            setIsFromCalendarOpen(false);
                          }}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">To Date</label>
                    <Popover open={isToCalendarOpen} onOpenChange={setIsToCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !exportDateTo && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {exportDateTo ? format(exportDateTo, "dd/MM/yyyy") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={exportDateTo}
                          onSelect={(date) => {
                            setExportDateTo(date);
                            setIsToCalendarOpen(false);
                          }}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <Button 
                    onClick={exportToPDF}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                  
                  <Button 
                    onClick={exportToExcel}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export Excel
                  </Button>
                </div>
                
                {(exportDateFrom || exportDateTo) && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      Export will include records 
                      {exportDateFrom && ` from ${format(exportDateFrom, "dd/MM/yyyy")}`}
                      {exportDateTo && ` to ${format(exportDateTo, "dd/MM/yyyy")}`}
                      {!exportDateFrom && !exportDateTo && ' for all dates'}
                    </p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setExportDateFrom(undefined);
                        setExportDateTo(undefined);
                      }}
                      className="mt-2 text-blue-600 hover:text-blue-800"
                    >
                      Clear date filter
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by vehicle number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant={filterStatus === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilterStatus('all')}
                  size="sm"
                >
                  All ({records.length})
                </Button>
                <Button
                  variant={filterStatus === 'active' ? 'default' : 'outline'}
                  onClick={() => setFilterStatus('active')}
                  size="sm"
                >
                  Active ({activeCount})
                </Button>
                <Button
                  variant={filterStatus === 'completed' ? 'default' : 'outline'}
                  onClick={() => setFilterStatus('completed')}
                  size="sm"
                >
                  Completed ({completedCount})
                </Button>
              </div>
            </div>

            {/* Records Table */}
            {filteredRecords.length === 0 ? (
              <div className="text-center py-8">
                <History className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Records Found</h3>
                <p className="text-gray-500">
                  {searchTerm ? 'No records match your search criteria.' : 'No parking records available yet.'}
                </p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold">Vehicle Number</TableHead>
                      <TableHead className="font-semibold">Entry Time</TableHead>
                      <TableHead className="font-semibold">Exit Time</TableHead>
                      <TableHead className="font-semibold">Duration</TableHead>
                      <TableHead className="font-semibold">Amount</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((record) => (
                      <TableRow key={record.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{record.vehicleNumber}</TableCell>
                        <TableCell>{record.entryTime.toLocaleString()}</TableCell>
                        <TableCell>
                          {record.exitTime ? record.exitTime.toLocaleString() : '-'}
                        </TableCell>
                        <TableCell>{formatDuration(record.duration)}</TableCell>
                        <TableCell>
                          {record.amountDue ? `₹${record.amountDue}` : '-'}
                        </TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ParkingRecords;
