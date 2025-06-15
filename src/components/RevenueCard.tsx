
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { IndianRupee, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ParkingRecord } from "@/types/parking";

interface RevenueCardProps {
  records: ParkingRecord[];
}

const RevenueCard = ({ records }: RevenueCardProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const getRevenueForDate = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    
    return records
      .filter(record => {
        if (record.status !== 'completed' || !record.exitTime) return false;
        const recordDate = format(record.exitTime, 'yyyy-MM-dd');
        return recordDate === dateString;
      })
      .reduce((sum, record) => sum + (record.amountDue || 0), 0);
  };

  const selectedDateRevenue = getRevenueForDate(selectedDate);
  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  return (
    <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow border-blue-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-blue-700">
          {isToday ? "Today's Revenue" : "Revenue"}
        </CardTitle>
        <IndianRupee className="h-4 w-4 text-blue-600" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-blue-600 mb-2">
          ₹{selectedDateRevenue}
        </div>
        <div className="flex items-center gap-2">
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "text-xs justify-start text-left font-normal border-blue-200 text-blue-700 hover:bg-blue-50",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-3 w-3" />
                {isToday ? "Today" : format(selectedDate, "MMM dd, yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    setSelectedDate(date);
                    setIsCalendarOpen(false);
                  }
                }}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
        <p className="text-xs text-blue-500 mt-1">
          {isToday ? "From completed exits today" : `From completed exits on ${format(selectedDate, "MMM dd")}`}
        </p>
      </CardContent>
    </Card>
  );
};

export default RevenueCard;
