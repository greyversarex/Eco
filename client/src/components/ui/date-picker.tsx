import { useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Таджикская локализация для react-day-picker
const tjLocale = {
  localize: {
    day: (n: number) => ["Яш", "Дш", "Сш", "Чш", "Пш", "Ҷм", "Шб"][n],
    month: (n: number) => [
      "Январ",
      "Феврал",
      "Март",
      "Апрел",
      "Май",
      "Июн",
      "Июл",
      "Август",
      "Сентябр",
      "Октябр",
      "Ноябр",
      "Декабр",
    ][n],
    ordinalNumber: (n: number) => String(n),
    era: (n: number) => (n === 1 ? "н.э." : "до н.э."),
    quarter: (n: number) => `${n}`,
    dayPeriod: () => "",
  },
  formatLong: {
    date: () => "d. M. yyyy",
    time: () => "HH:mm",
    dateTime: () => "d. M. yyyy HH:mm",
  },
  code: "tg",
  options: {
    weekStartsOn: 1,
    firstWeekContainsDate: 1,
  },
};

interface DatePickerProps {
  value?: string;
  onChange: (date: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Санаро интихоб кунед",
  required = false,
  disabled = false,
  className,
  id,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    value ? new Date(value) : undefined
  );

  const handleSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      // Форматируем в ISO формат YYYY-MM-DD
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      onChange(`${year}-${month}-${day}`);
      setOpen(false);
    }
  };

  const handleClear = () => {
    setSelectedDate(undefined);
    onChange("");
  };

  const handleToday = () => {
    const today = new Date();
    handleSelect(today);
  };

  // Форматируем дату для отображения в формате "d. M. yyyy"
  const formatDisplayDate = (date: Date) => {
    return `${date.getDate()}. ${date.getMonth() + 1}. ${date.getFullYear()}`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !selectedDate && "text-muted-foreground",
            className
          )}
          disabled={disabled}
          data-testid="button-date-picker"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate ? formatDisplayDate(selectedDate) : placeholder}
          {required && !selectedDate && (
            <span className="ml-1 text-destructive">*</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3">
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            locale={tjLocale as any}
            showOutsideDays={false}
            className="rdp-custom"
            classNames={{
              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
              month: "space-y-4",
              caption: "flex justify-center pt-1 relative items-center",
              caption_label: "text-sm font-medium",
              nav: "space-x-1 flex items-center",
              nav_button:
                "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50",
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell:
                "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
              row: "flex w-full mt-2",
              cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
              day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md inline-flex items-center justify-center text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
              day_range_end: "day-range-end",
              day_selected:
                "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
              day_today: "bg-accent text-accent-foreground",
              day_outside:
                "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
              day_disabled: "text-muted-foreground opacity-50",
              day_hidden: "invisible",
            }}
          />
          <div className="flex gap-2 pt-3 border-t mt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleClear}
              data-testid="button-clear-date"
            >
              Тоза кардан
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              className="flex-1"
              onClick={handleToday}
              data-testid="button-today-date"
            >
              Имрӯз
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
