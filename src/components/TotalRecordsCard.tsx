
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { History, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ParkingRecord } from "@/types/parking";

interface TotalRecordsCardProps {
  records: ParkingRecord[];
}

const TotalRecordsCard = ({ records }: TotalRecordsCardProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const getRecordCountForDate = (date: Date) => {
    const dateString = format(date, "yyyy-MM-dd");
    return records.filter(record => {
      if (!record.entryTime) return false;
      const entryDate = format(record.entryTime, "yyyy-MM-dd");
      return entryDate === dateString;
    }).length;
  };

  const count = getRecordCountForDate(selectedDate);
  const isToday = format(selectedDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

  return (
    <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {isToday ? "Today's Records" : "Records"}
        </CardTitle>
        <History className="h-4 w-4 text-green-600" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-green-600 mb-2">
          {count}
        </div>
        <div className="flex items-center gap-2">
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "text-xs justify-start text-left font-normal",
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
                onSelect={date => {
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
        <p className="text-xs text-muted-foreground mt-1">
          {isToday
            ? "Total vehicles entered today"
            : `Total vehicles entered on ${format(selectedDate, "MMM dd")}`}
        </p>
      </CardContent>
    </Card>
  );
};

export default TotalRecordsCard;
