"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  addDays,
  format,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  isSameDay,
} from "date-fns";
import { de } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Trash } from "lucide-react";

import { useForm } from "react-hook-form";
import { Button } from "@/ui/button";
import { Calendar } from "@/ui/calendar";
import * as React from "react";
import { api } from "@/trpc/react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/ui/form";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import { cn } from "@/lib/utils";
import { CalenderCreateFormSchema, type CalenderCreateForm } from "./eventFormSchema";

import {
  Table,
  TableBody,  
  TableCell,

  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/table";

import { ScrollArea } from "@/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/ui/radio-group";
import { Textarea } from "@/ui/textarea";
import { Checkbox } from "@/ui/checkbox";
import { CalendarEvent } from "../server/api/routers/calender";

export default function CalendarComponent() {
  const HOURS = Array.from({ length: 13 }, (_, i) => i + 7); // 7 AM to 19 PM (inclusive)

  // 1. Add a mapping for calendar view values to German
  const CALENDAR_VIEW_LABELS_DE: Record<string, string> = {
    month: "Monat",
    week: "Woche",
  };

  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const minutes = 7 * 60 + i * 30; // start at 07:00
    const h = String(Math.floor(minutes / 60)).padStart(2, "0");
    const m = String(minutes % 60).padStart(2, "0");
    return { time: `${h}:${m}`, available: true };
  });

  // ================= Utility Functions =================
  function getEventColorClass(colorValue: string | undefined): string {
    switch (colorValue) {
      case "orange":
        return "bg-[#F5A623] border-[#D48519]";
      case "pink":
        return "bg-[#E94E89] border-[#C73A72]";
      case "blue":
      default:
        return "bg-[#7ED6E8] border-[#5ABFD3]";
    }
  }

  function normalizeColor(colorValue: string | undefined): CalenderCreateForm["color"] {
    return colorValue === "blue" || colorValue === "pink" || colorValue === "orange"
      ? colorValue
      : "blue";
  }

  // ================= Main Component =================

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [calendarView, setCalendarView] = useState<
    "month" | "week"  
  >("week");
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { mutateAsync: createEvent } = api.calender.createEvent.useMutation();

  const { mutateAsync: deleteEvent } = api.calender.deleteEvent.useMutation();
  const { mutateAsync: updateEvent } = api.calender.updateEvent.useMutation();

  const DEFAULT_START = (() => { const d = new Date(); d.setHours(7, 0, 0, 0); return d; })();
  const DEFAULT_END = (() => { const d = new Date(); d.setHours(7, 30, 0, 0); return d; })();

  const INITIAL_VALUES: CalenderCreateForm = {
    title: "",
    description: "",
    start: DEFAULT_START,
    end: DEFAULT_END,
    allDay: false,
    color: "blue",
    location: "",
  };

  const form = useForm<CalenderCreateForm>({
    resolver: zodResolver(CalenderCreateFormSchema),
    defaultValues: INITIAL_VALUES,
  });

  const { data: fetchedEvents } = api.calender.getEvents.useQuery();

  const handleCreateEventClose = () => {
    setIsCreateEventOpen(false);
    form.reset(INITIAL_VALUES, { keepDefaultValues: false });
    form.clearErrors();
    setEditingEventId(null);
  };

  const onSubmit = async (data: CalenderCreateForm) => {
    setIsSubmitting(true);
    try {
      await createEvent({
        ...data,
        start: data.start?.toISOString(),
        end: data.end?.toISOString(),
      });
      form.reset(INITIAL_VALUES);
      setIsCreateEventOpen(false);
      setEditingEventId(null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onUpdate = async (data: CalenderCreateForm & { id: string }) => {
    setIsUpdating(true);
    try {
      await updateEvent({
        ...data,
        start: data.start?.toISOString(),
        end: data.end?.toISOString(),
      });
      form.reset(INITIAL_VALUES);
      setIsCreateEventOpen(false);
      setEditingEventId(null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const onDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await deleteEvent({ id });
      form.reset(INITIAL_VALUES);
      setIsCreateEventOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const isToday = (date: Date) => isSameDay(date, new Date());

  const handleEventClick = (event: CalendarEvent) => {
    setEditingEventId(event?.id ?? null);
    form.reset({
      title: event?.title ?? "",
      description: event?.description ?? "",
      start: event?.start ? new Date(event.start) : undefined,
      end: event?.end ? new Date(event.end) : undefined,
      allDay: event?.allDay ?? false,
      color: normalizeColor(event?.color),
      location: event?.location ?? "",
    }, { keepDefaultValues: true });
    setIsCreateEventOpen(true);
  };

  // Calculate week start and end
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 }); // Sunday
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });

  // Generate dates for the current week
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // --- Month helpers ---
  const monthWeeks = React.useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);

    const lead = first.getDay(); // 0=Sun..6=Sat
    const total = lead + last.getDate();
    const rows = Math.ceil(total / 7);

    const weeks: (Date | null)[][] = [];
    let day = 1 - lead;

    for (let r = 0; r < rows; r++) {
      const row: (Date | null)[] = [];
      for (let c = 0; c < 7; c++) {
        const d = new Date(year, month, day);
        row.push(day >= 1 && day <= last.getDate() ? d : null);
        day++;
      }
      weeks.push(row);
    }
    return weeks;
  }, [currentMonth]);

  const handlePrevWeek = () => {
    const newDate = subWeeks(currentDate, 1);
    setCurrentDate(newDate);
    if (newDate.getMonth() !== currentMonth.getMonth()) {
      setCurrentMonth(new Date(newDate.getFullYear(), newDate.getMonth(), 1));
    }
  };

  const handleNextWeek = () => {
    const newDate = addWeeks(currentDate, 1);
    setCurrentDate(newDate);
    if (newDate.getMonth() !== currentMonth.getMonth()) {
      setCurrentMonth(new Date(newDate.getFullYear(), newDate.getMonth(), 1));
    }
  };

  const handlePrevMonth = () => {
    const newDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - 1,
      1
    );
    setCurrentMonth(newDate);
    setCurrentDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      1
    );
    setCurrentMonth(newDate);
    setCurrentDate(newDate);
  };

  const handleSelectDay = (day: Date) => {
    if (day) {
      setSelectedDay(day);
      setCurrentDate(day);
    }
  };

  const handleTodayClick = () => {
    setCurrentDate(new Date());
    setSelectedDay(new Date());
    if (calendarView === "month") {
      setCurrentMonth(new Date());
    }
  };

  const handlePrevDay = () => {
    const newDate = addDays(selectedDay, -1);
    setSelectedDay(newDate);
    setCurrentDate(newDate);
    if (newDate.getMonth() !== currentMonth.getMonth()) {
      setCurrentMonth(new Date(newDate.getFullYear(), newDate.getMonth(), 1));
    }
  };

  const handleNextDay = () => {
    const newDate = addDays(selectedDay, 1);
    setSelectedDay(newDate);
    setCurrentDate(newDate);
    if (newDate.getMonth() !== currentMonth.getMonth()) {
      setCurrentMonth(new Date(newDate.getFullYear(), newDate.getMonth(), 1));
    }
  };
 
   return (
    <div className="flex h-screen bg-gray-50">
      {/* Left sidebar */}
      <div className="flex w-75 flex-col border-r p-4">
        <div className="mt-5 mb-8">
          <div className="mb-4 border-b border-gray-200" />
          <Calendar
            mode="single"
            selected={selectedDay}
            onSelect={(d) => d && handleSelectDay(d)}
            className="rounded-lg border"
          />
        </div>
        <div className="mb-4 border-b border-gray-200" />
      </div>

      {/* Main calendar area */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b bg-white p-4 text-gray-900">
          <div className="flex items-center">
            <h2 className="text-xl font-semibold">
              {calendarView === "month"
                ? format(currentDate, "MMMM yyyy", { locale: de })
                : calendarView === "week"
                ? `${format(weekStart, "d. MMMM yyyy", { locale: de })} - ${format(
                    weekEnd,
                    "d. MMMM yyyy",
                    { locale: de }
                  )}`
                : calendarView === "day"
                ? format(selectedDay, "d. MMMM yyyy, EEEE", { locale: de })
                : `${format(weekStart, "d. MMMM yyyy", { locale: de })} - ${format(
                    weekEnd,
                    "d. MMMM yyyy",
                    { locale: de }
                  )}`}
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleTodayClick}
              variant="secondary"
              className="font-semibold"
            >
              Heute
            </Button>
            <Button
              onClick={
                calendarView === "month"
                  ? handlePrevMonth
                  : calendarView === "week"
                  ? handlePrevWeek
                  : calendarView === "day"
                  ? handlePrevDay
                  : handlePrevWeek
              }
              variant="ghost"
              size="icon"
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              onClick={
                calendarView === "month"
                  ? handleNextMonth
                  : calendarView === "week"
                  ? handleNextWeek
                  : calendarView === "day"
                  ? handleNextDay
                  : handleNextWeek
              }
              variant="ghost"
              size="icon"
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => {
                setEditingEventId(null);
                form.reset(INITIAL_VALUES, { keepDefaultValues: false });
                form.clearErrors();
                setIsCreateEventOpen(true);
              }}
              variant="default"
              className="ml-2 font-semibold"
            >
              Neues Ereignis
            </Button>

            {/* View Switcher Dropdown */}
            <div className="relative ml-2">
              <Select
                value={calendarView}
                onValueChange={(v: string) =>
                  setCalendarView(v as "month" | "week")
                }
              >
                <SelectTrigger className="w-28 border border-gray-300 bg-gray-100 text-gray-900">
                  <SelectValue>
                    {CALENDAR_VIEW_LABELS_DE[calendarView]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-white text-gray-900">
                  <SelectItem value="month">Monat</SelectItem>
                  <SelectItem value="week">Woche</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Week view */}
        {calendarView === "week" && (
          <div className="bg-white text-gray-900">
            <Table>
              <TableHeader className="bg-transparent">
                <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                  <TableHead className="w-16 text-right pr-2">Zeit</TableHead>
                  {weekDays.map((day, i) => (
                    <TableHead key={i} className="text-center">
                      {format(day, "EEE d", { locale: de })}
                    </TableHead>
                  ))}
                </TableRow>
                <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                  <TableHead className="text-right pr-2">Ganztägig</TableHead>
                  {weekDays.map((day, i) => (
                    <TableHead key={i}>
                      <div className="relative h-12 cursor-pointer rounded-md">
                        {fetchedEvents
                          ?.filter((e) => e.allDay === true)
                          .map((event) => (
                            <div
                              key={event.id}
                              className={cn(
                                "absolute inset-0 flex items-center justify-start rounded-md px-2 text-xs font-semibold text-white",
                                getEventColorClass(event.color)
                              )}
                              title={`${event.title || ""}${
                                event.description
                                  ? `\n${event.description}`
                                  : ""
                              }${
                                event.location ? `\n${event.location}` : ""
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEventClick(event);
                              }}
                            >
                              {event.title}
                            </div>
                          ))}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>

              <TableBody className="[&_td:first-child]:rounded-l-lg [&_td:last-child]:rounded-r-lg">
                {HOURS.map((hour) => (
                  <TableRow
                    key={hour}
                    className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r border-0"
                  >
                    <TableCell className="w-16 text-right pr-2 align-top text-xs text-gray-400">
                      {`${hour}:00`}
                    </TableCell>

                    {weekDays.map((day, di) => (
                      <TableCell
                        key={di}
                        className="relative p-0 align-top bg-white"
                      >
                        <div className="h-16 w-full cursor-pointer rounded-md">
                          {(fetchedEvents ?? [])
                            .filter((e) => !e.allDay)
                            .map((event) => {
                              const start: Date = event?.start
                                ? new Date(event.start)
                                : new Date();
                              const end: Date = event?.end
                                ? new Date(event.end)
                                : new Date();

                              const endClamped = new Date(end);
                              if (
                                endClamped.getHours() > 20 ||
                                (endClamped.getHours() === 20 &&
                                  endClamped.getMinutes() > 0)
                              ) {
                                endClamped.setHours(20, 0, 0, 0);
                              }

                              const hourStart = new Date(day);
                              hourStart.setHours(hour, 0, 0, 0);
                              const hourEnd = new Date(day);
                              hourEnd.setHours(hour + 1, 0, 0, 0);

                              const overlapStart =
                                start > hourStart ? start : hourStart;
                              const overlapEnd =
                                endClamped < hourEnd ? endClamped : hourEnd;
                              if (overlapEnd <= overlapStart) return null;

                              const cellHeight = 64;
                              const minutesFromHourStart =
                                (overlapStart.getTime() -
                                  hourStart.getTime()) /
                                60000;
                              const duration =
                                (overlapEnd.getTime() -
                                  overlapStart.getTime()) /
                                60000;
                              const top = (minutesFromHourStart / 60) * cellHeight;
                              const height = (duration / 60) * cellHeight;

                              const startsBeforeHour = start < hourStart;
                              const endsAfterHour = endClamped > hourEnd;
                              const adjustedTop = top - (startsBeforeHour ? 1 : 0);
                              const adjustedHeight =
                                height +
                                (startsBeforeHour ? 1 : 0) +
                                (endsAfterHour ? 1 : 0);

                              const isFirstSeg =
                                overlapStart.getTime() === start.getTime();
                              const isLastSeg =
                                overlapEnd.getTime() === endClamped.getTime();

                              return (
                                <div
                                  key={`${event?.id ?? "evt"}-${hour}`}
                                  className="absolute left-0 right-0"
                                  style={{
                                    top: adjustedTop,
                                    height: adjustedHeight,
                                  }}
                                >
                                  <div
                                    className={cn(
                                      "flex h-full w-full items-center overflow-hidden px-2 text-xs font-semibold text-white",
                                      getEventColorClass(event?.color ?? "blue"),
                                      isFirstSeg && isLastSeg
                                        ? "rounded-md"
                                        : isFirstSeg
                                        ? "rounded-t-md"
                                        : isLastSeg
                                        ? "rounded-b-md"
                                        : "rounded-none"
                                    )}
                                    title={`${event?.title || ""}${
                                      event?.description
                                        ? `\n${event.description}`
                                        : ""
                                    }${
                                      event?.location
                                        ? `\n${event.location}`
                                        : ""
                                    }`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEventClick(event);
                                    }}
                                  >
                                    {isFirstSeg && (
                                      <>
                                        {format(start, "h:mmaaa").replace(
                                          ":00",
                                          ""
                                        )}{" "}
                                        -{" "}
                                        {format(end, "h:mmaaa").replace(
                                          ":00",
                                          ""
                                        )}{" "}
                                        • {event?.title}
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Month View */}
        {calendarView === "month" && (
          <div className="bg-white p-2 text-gray-900">
            <Table className="w-full table-fixed border-collapse">
              <colgroup>
                {Array.from({ length: 7 }).map((_, i) => (
                  <col key={i} className="w-[14.285%]" />
                ))}
              </colgroup>

              <TableHeader className="bg-transparent">
                <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                  {["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"].map((day) => (
                    <TableHead
                      key={day}
                      className="px-1 py-2 text-center text-xs font-semibold text-gray-500"
                    >
                      {day}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>

              <TableBody>
                {monthWeeks.map((week, wi) => (
                  <TableRow
                    key={wi}
                    className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r"
                  >
                    {week.map((date, di) => {
                      const isCurrentMonth =
                        date && date.getMonth() === currentMonth.getMonth();
                      const isTodayCell = date && isToday(date);
                      const dayEvents = fetchedEvents?.filter((e) =>
                        date ? isSameDay(new Date(e.start), date) : false
                      );
                      if (!dayEvents) return null;
                      return (
                        <TableCell key={di} className="align-top p-1 sm:p-2">
                          <div
                            className={cn(
                              "relative min-h-[120px] rounded-md p-1 min-w-0 overflow-hidden",
                              !isCurrentMonth && "bg-gray-50 text-gray-300",
                              isTodayCell &&
                                "border border-blue-400 bg-blue-50"
                            )}
                          >
                            <div
                              className={cn(
                                "text-xs font-bold mb-1",
                                isTodayCell && "text-blue-600"
                              )}
                            >
                              {(() => {
                                if (!date) return null; // Ensure no display for null dates

                                // Display date if it's the current month OR an off-month day with events
                                if (isCurrentMonth || (dayEvents && dayEvents.length > 0)) {
                                  return date.getDate();
                                }

                                return null; // Otherwise, explicitly render nothing
                              })()}
                            </div>

                            <div className="flex flex-col gap-1">
                              {dayEvents?.slice(0, 4).map((event) => (
                                <div
                                  key={event?.id ?? ""}
                                  className={cn(
                                    "cursor-pointer truncate rounded px-1 py-0.5 text-xs font-semibold text-white hover:opacity-90",
                                    getEventColorClass(event.color)
                                  )}
                                  title={`${event.title || ""}${
                                    event.description
                                      ? `\n${event.description}`
                                      : ""
                                  }${
                                    event.location
                                      ? `\n${event.location}`
                                      : ""
                                  }${
                                    event.start && event.end
                                      ? `\n${format(
                                          new Date(event.start),
                                          "HH:mm"
                                        )} - ${format(
                                          new Date(event.end),
                                          "HH:mm"
                                        )}`
                                      : ""
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEventClick(event);
                                  }}
                                >
                                  {event.title || "(no title)"}
                                  {event.start && event.end && (
                                    <span className="ml-1 text-[10px] font-normal opacity-80">
                                      {format(
                                        new Date(event.start),
                                        "HH:mm"
                                      )}{" "}
                                      -{" "}
                                      {format(
                                        new Date(event.end),
                                        "HH:mm"
                                      )}
                                    </span>
                                  )}
                                </div>
                              ))}

                              {dayEvents?.length && dayEvents.length > 4 && (
                                <div className="text-[10px] text-gray-400">
                                  +{dayEvents.length - 4} mehr
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Create Event Dialog */}
      <Dialog open={isCreateEventOpen} onOpenChange={handleCreateEventClose}>
        <DialogContent className="sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle>Neues Ereignis</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) => {
                if (editingEventId) {
                  onUpdate({ ...values, id: editingEventId });
                } else {
                  onSubmit(values);
                }
              })}
              className="grid gap-4 py-4"
            >
              
              {/*title from originUI*/}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="title">Titel</Label>
                    <FormControl>
                      <Input id="title" placeholder="Titel hinzufügen" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/*description from originUI*/}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="description">Beschreibung</Label>
                      <FormControl>
                        <Textarea
                          id="description"
                          placeholder="Beschreibung hinzufügen"
                          className="min-h-[100px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/*start from originUI*/}
                <FormField
                  control={form.control}
                  name="start"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="start">Start</Label>
                      <FormControl>
                        <div className="rounded-md border">
                          <div className="flex max-sm:flex-col">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={(newDate) => {
                                if (newDate) {
                                  const updated = new Date(newDate);
                                  updated.setHours(7, 0, 0, 0);
                                  field.onChange(updated);
                                }
                              }}
                              className="p-2 sm:pe-5"
                              disabled={[{ before: new Date() }]}
                            />
                            <div className="relative w-full max-sm:h-48 sm:w-40">
                              <div className="absolute inset-0 py-4 max-sm:border-t">
                                <ScrollArea className="h-full sm:border-s">
                                  <div className="space-y-3">
                                    <div className="flex h-5 shrink-0 items-center px-5">
                                      <p className="text-sm font-medium">
                                        {field.value && format(field.value, "EEEE, d")}
                                      </p>
                                    </div>
                                    <div className="grid gap-1.5 px-5 max-sm:grid-cols-2">
                                      {timeSlots.map(({ time: timeSlot, available }) => (
                                        <Button
                                          key={timeSlot}
                                          variant={
                                            field.value &&
                                            format(field.value, "HH:mm") === timeSlot
                                              ? "default"
                                              : "outline"
                                          }
                                          size="sm"
                                          className="w-full"
                                          onClick={() => {
                                            const [h, m] = timeSlot.split(":").map(Number);
                                            const updated = new Date(
                                              field.value ?? new Date()
                                            );
                                            updated.setHours(h ?? 0, m ?? 0, 0, 0);
                                            field.onChange(updated);
                                          }}
                                          disabled={!available}
                                          type="button"
                                        >
                                          {timeSlot}
                                        </Button>
                                      ))}
                                    </div>
                                  </div>
                                </ScrollArea>
                              </div>
                            </div>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/*end from originUI*/}
                <FormField
                  control={form.control}
                  name="end"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="end">Ende</Label>
                      <FormControl>
                        <div className="rounded-md border">
                          <div className="flex max-sm:flex-col">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={(newDate) => {
                                if (newDate) {
                                  const updated = new Date(newDate);
                                  updated.setHours(0, 0, 0, 0);
                                  field.onChange(updated);
                                }
                              }}
                              className="p-2 sm:pe-5"
                              disabled={[{ before: new Date() }]}
                            />
                            <div className="relative w-full max-sm:h-48 sm:w-40">
                              <div className="absolute inset-0 py-4 max-sm:border-t">
                                <ScrollArea className="h-full sm:border-s">
                                  <div className="space-y-3">
                                    <div className="flex h-5 shrink-0 items-center px-5">
                                      <p className="text-sm font-medium">
                                        {field.value && format(field.value, "EEEE, d")}
                                      </p>
                                    </div>
                                    <div className="grid gap-1.5 px-5 max-sm:grid-cols-2">
                                      {timeSlots.map(({ time: timeSlot, available }) => (
                                        <Button
                                          key={timeSlot}
                                          variant={
                                            field.value &&
                                            format(field.value, "HH:mm") === timeSlot
                                              ? "default"
                                              : "outline"
                                          }
                                          size="sm"
                                          className="w-full"
                                          onClick={() => {
                                            const [h, m] = timeSlot.split(":").map(Number);
                                            const updated = new Date(
                                              field.value ?? new Date()
                                            );
                                            updated.setHours(h ?? 0, m ?? 0, 0, 0);
                                            field.onChange(updated);
                                          }}
                                          disabled={!available}
                                          type="button"
                                        >
                                          {timeSlot}
                                        </Button>
                                      ))}
                                    </div>
                                  </div>
                                </ScrollArea>
                              </div>
                            </div>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

             {/*allDay from originUI*/}
                          <FormField
              control={form.control}
              name="allDay"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        id="allDay"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <Label htmlFor="allDay" className="text-sm font-medium leading-none">
                      Ganztägig
                    </Label>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
              />

              {/*color from originUI*/}
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="color">Farbe</Label>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(v: string) => field.onChange(v)}
                        value={field.value}
                        className="flex gap-4"
                      >
                        {[
                          { value: "blue", color: "bg-blue-500" },
                          { value: "pink", color: "bg-pink-500" },
                          { value: "orange", color: "bg-orange-500" },
                        ].map(({ value, color }) => (
                          <div key={value} className="flex items-center">
                            <RadioGroupItem value={value} id={value} className="sr-only" />
                            <Label
                              htmlFor={value}
                              className={cn(
                                "w-6 h-6 rounded-full cursor-pointer border-2 border-transparent",
                                color,
                                field.value === value
                                  ? "ring-2 ring-offset-2 ring-gray-400"
                                  : ""
                              )}
                            />
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/*location from originUI*/}
              <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="location">Ort</Label>
                      <FormControl>
                        <Textarea
                          id="location"
                          placeholder="Ort hinzufügen"
                          className="min-h-[100px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

             
              <DialogFooter className="mt-6">
                  <Button
                    variant="destructive"
                    type="button"
                    onClick={() => editingEventId && onDelete(editingEventId)}
                    disabled={isDeleting || !editingEventId}
                    className="mr-auto"
                  >
                    <Trash className="mr-1 h-5 w-5" />
                  </Button>
                <Button variant="outline" onClick={handleCreateEventClose} type="button">
                  Abbrechen
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || isUpdating}
                >
                  {editingEventId ? (isUpdating ? "Speichern..." : "Speichern") : (isSubmitting ? "Speichern..." : "Speichern")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
