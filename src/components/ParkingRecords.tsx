import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, History, Search, Clock, IndianRupee, Download, FileText, FileSpreadsheet, CalendarIcon } from "lucide-react";
import { ParkingRecord, MonthlyPass } from "@/types/parking";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { toast } from "@/hooks/use-toast";

interface ParkingRecordsProps {
  records: ParkingRecord[];
  passes: MonthlyPass[];
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

  // Helper for 12-hour time format with date-fns
  const formatExportTimestamp = (date: Date) =>
    format(date, "dd/MM/yyyy h:mm a"); // e.g., 13/06/2025 5:43 PM

  const exportToPDF = () => {
    const exportRecords = getExportFilteredRecords();
    if (exportRecords.length === 0) {
      toast({
        title: "No data to export",
        description: "Please ensure there are parking records in the selected range before exporting.",
        variant: "destructive",
      });
      return;
    }

    const doc = new jsPDF('p', 'mm', 'a4'); // Set to A4 format
    const primaryColor: [number, number, number] = [79, 70, 229]; // Indigo
    const secondaryColor: [number, number, number] = [236, 236, 241]; // Light gray
    const accentColor: [number, number, number] = [99, 102, 241]; // Lighter indigo

    // Header with rounded background and title
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.roundedRect(10, 10, 190, 25, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Railway Parking Management - Records', 105, 25, { align: 'center' });

    // Generated date/time at the top right (in 12-hour format)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(230, 230, 230);
    doc.text(
      `Generated: ${formatExportTimestamp(new Date())}`,
      198,
      16,
      { align: 'right' }
    );

    // Date range below header
    let yPosition = 45;
    if (exportDateFrom || exportDateTo) {
      doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.roundedRect(10, yPosition - 5, 190, 15, 2, 2, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      let dateText = 'Date Range: ';
      if (exportDateFrom) dateText += `From ${format(exportDateFrom, 'dd/MM/yyyy')} `;
      if (exportDateTo) dateText += `To ${format(exportDateTo, 'dd/MM/yyyy')}`;
      doc.setTextColor(40, 40, 40);
      doc.text(dateText, 15, yPosition + 3);
      yPosition += 25;
    }

    // Summary cards in a grid (no "Summary" heading)
    const completedRecords = exportRecords.filter(r => r.status === 'completed');
    const totalRevenue = completedRecords.reduce((sum, record) => sum + (record.amountDue || 0), 0);
    const cardWidth = 45;
    const cardHeight = 20;
    const spacing = 2;

    // Card 1: Total Records
    doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.roundedRect(10, yPosition, cardWidth, cardHeight, 5, 5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Total Records', 12, yPosition + 6);
    doc.setFontSize(16);
    doc.text(exportRecords.length.toString(), 12, yPosition + 15);

    // Card 2: Active Vehicles
    doc.setFillColor(34, 197, 94); // Green
    doc.roundedRect(10 + cardWidth + spacing, yPosition, cardWidth, cardHeight, 5, 5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Active Vehicles', 12 + cardWidth + spacing, yPosition + 6);
    doc.setFontSize(16);
    doc.text(exportRecords.filter(r => r.status === 'active').length.toString(), 12 + cardWidth + spacing, yPosition + 15);

    // Card 3: Completed
    doc.setFillColor(59, 130, 246); // Blue
    doc.roundedRect(10 + (cardWidth + spacing) * 2, yPosition, cardWidth, cardHeight, 5, 5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Completed', 12 + (cardWidth + spacing) * 2, yPosition + 6);
    doc.setFontSize(16);
    doc.text(completedRecords.length.toString(), 12 + (cardWidth + spacing) * 2, yPosition + 15);

    // Card 4: Total Revenue
    doc.setFillColor(168, 85, 247); // Purple
    doc.roundedRect(10 + (cardWidth + spacing) * 3, yPosition, cardWidth, cardHeight, 5, 5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Total Revenue', 12 + (cardWidth + spacing) * 3, yPosition + 6);
    doc.setFontSize(16);
    doc.text(`Rs. ${totalRevenue}`, 12 + (cardWidth + spacing) * 3, yPosition + 15);

    yPosition += 35;

    // Reset text color for table
    doc.setTextColor(0, 0, 0);

    // Table with modern, rounded styling
    const tableData = exportRecords.map(record => [
      record.vehicleNumber,
      record.vehicleType,
      format(record.entryTime, "h:mm a, dd/MM/yyyy"),
      record.exitTime ? format(record.exitTime, "h:mm a, dd/MM/yyyy") : '-',
      record.duration ? `${record.duration} hours` : '-',
      (record.status === 'completed' && record.isPassHolder)
        ? "Pass"
        : (record.amountDue ? `Rs. ${record.amountDue}` : '-'),
      record.status
    ]);

    autoTable(doc, {
      head: [['Vehicle Number', 'Type', 'Entry Time', 'Exit Time', 'Duration', 'Amount', 'Status']],
      body: tableData,
      startY: yPosition,
      styles: { 
        fontSize: 9,
        font: 'helvetica',
        cellPadding: 3,
        lineColor: [220, 220, 220] as [number, number, number],
        lineWidth: 0.5,
        fillColor: [255, 255, 255] as [number, number, number],
        textColor: 30,
        cellWidth: 'wrap'
      },
      headStyles: { 
        fillColor: primaryColor,
        textColor: [255, 255, 255] as [number, number, number],
        fontStyle: 'bold',
        fontSize: 10,
        font: 'helvetica',
        halign: 'center',
        valign: 'middle',
        cellPadding: 4,
        lineWidth: 0.5,
        lineColor: [180, 180, 255] as [number, number, number],
        cellWidth: 'wrap'
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251] as [number, number, number]
      },
      tableLineColor: [200, 200, 222] as [number, number, number],
      tableLineWidth: 0.9,
      theme: 'grid',
      didDrawCell: (data) => {
        // For modern rounded look, draw a rounded rectangle manually behind each cell
        const { cell, table } = data;
        if (cell.section === "body" || cell.section === "head") {
          const { x, y, width, height } = cell;
          const r = 6; // radius for rounded corners
          doc.setDrawColor(240, 240, 240);
          doc.setLineWidth(0.3);
          doc.setFillColor(cell.section === "head" ? 79 : 255, cell.section === "head" ? 70 : 255, cell.section === "head" ? 229 : 255);
          // Draw only for body and head for rounded rectangle bg
          doc.roundedRect(x, y, width, height, r, r, 'FD');
        }
      }
    });

    doc.save(`parking-records-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const exportToExcel = () => {
    const exportRecords = getExportFilteredRecords();
    if (exportRecords.length === 0) {
      toast({
        title: "No data to export",
        description: "Please ensure there are parking records in the selected range before exporting.",
        variant: "destructive",
      });
      return;
    }
    
    const worksheetData = exportRecords.map(record => ({
      'Vehicle Number': record.vehicleNumber,
      'Vehicle Type': record.vehicleType,
      'Entry Time': record.entryTime.toLocaleString(),
      'Exit Time': record.exitTime ? record.exitTime.toLocaleString() : '-',
      'Duration (Hours)': record.duration || '-',
      'Amount (₹)': (record.status === 'completed' && record.isPassHolder)
        ? "Pass"
        : (record.amountDue || '-'),
      'Status': record.status
    }));

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

  const formatDuration = (hours?: number) => {
    if (!hours) return '-';
    return hours === 1 ? '1 hour' : `${hours} hours`;
  };

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return <Badge variant="secondary" className="bg-blue-100 text-blue-700 rounded-full">Active</Badge>;
    }
    return (
      <Badge
        variant="default"
        className="bg-green-100 text-green-700 rounded-full hover:bg-green-200 !important"
        style={{ transition: 'background 0.2s' }}
      >
        Completed
      </Badge>
    );
  };

  const renderAmountCell = (record: ParkingRecord) => {
    if (record.status === 'completed' && record.isPassHolder)
      return (
        <span className="inline-block bg-purple-100 text-purple-700 rounded-full px-2.5 py-0.5 text-xs font-semibold">
          Pass
        </span>
      );
    return record.amountDue ? `₹${record.amountDue}` : '-';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 p-4">
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
          <CardHeader className="text-center bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg">
            <div className="flex justify-center mb-4">
              <History className="h-16 w-16" />
            </div>
            <CardTitle className="text-2xl">Parking Records</CardTitle>
            <CardDescription className="text-orange-100">
              Complete history of all vehicle entries and exits
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-6">
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
                  Active ({records.filter(r => r.status === 'active').length})
                </Button>
                <Button
                  variant={filterStatus === 'completed' ? 'default' : 'outline'}
                  onClick={() => setFilterStatus('completed')}
                  size="sm"
                >
                  Completed ({records.filter(r => r.status === 'completed').length})
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
                        <TableCell>
                          {format(record.entryTime, "h:mm a, dd/MM/yyyy")}
                        </TableCell>
                        <TableCell>
                          {record.exitTime
                            ? format(record.exitTime, "h:mm a, dd/MM/yyyy")
                            : '-'}
                        </TableCell>
                        <TableCell>{formatDuration(record.duration)}</TableCell>
                        <TableCell>
                          {renderAmountCell(record)}
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
