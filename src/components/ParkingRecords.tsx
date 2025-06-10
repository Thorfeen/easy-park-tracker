
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, History, Search, Clock, DollarSign } from "lucide-react";
import { ParkingRecord } from "@/pages/Index";

interface ParkingRecordsProps {
  records: ParkingRecord[];
  onBack: () => void;
}

const ParkingRecords = ({ records, onBack }: ParkingRecordsProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all');

  const filteredRecords = records.filter(record => {
    const matchesSearch = record.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

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
                  <DollarSign className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-purple-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-purple-700">${totalRevenue}</p>
                  </div>
                </div>
              </div>
            </div>

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
                          {record.amountDue ? `$${record.amountDue}` : '-'}
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
