import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import CalenderMock from "@/app/Calender/Mocks/calenderMock.json"; // correct json import

// Type definition
export type CalendarEvent = {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  allDay?: boolean;
  color?: string;
  location?: string;
};

// Initialize events from mock JSON
let events: CalendarEvent[] = CalenderMock;

// Schema for validation
export const CalendarEventCreateSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().optional(),
  start: z.string(), // ISO string
  end: z.string(),
  allDay: z.boolean().optional(),
  color: z.enum(["orange", "blue", "pink"]),
  location: z.string().optional(),
});

// TRPC router
export const calenderRouter = createTRPCRouter({
  // GET all events
  getEvents: publicProcedure.query(() => {
    console.log("Fetching all calendar events:", events.length);
    return events;
  }),

  // CREATE event
  createEvent: publicProcedure
    .input(CalendarEventCreateSchema)
    .mutation(({ input }) => {
      console.log("Creating new calendar event:", input);
      const newEvent: CalendarEvent = {
        id: Date.now().toString(),
        title: input.title,
        description: input.description ?? "",
        start: input.start,
        end: input.end,
        allDay: input.allDay ?? false,
        color: input.color ?? "blue",
        location: input.location ?? "",
      };
      events.push(newEvent);
      return newEvent;
    }),

  // UPDATE event
  updateEvent: publicProcedure
    .input(CalendarEventCreateSchema.extend({ id: z.string() }))
    .mutation(({ input }) => {
      console.log(" Updating calendar event:", input.id);
      const idx = events.findIndex((e) => e.id === input.id);
      if (idx === -1) return null;
      const updated: CalendarEvent = { ...events[idx], ...input };
      events[idx] = updated;
      return updated;
    }),

  // DELETE event
  deleteEvent: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => {
      console.log(" Deleting calendar event:", input.id);
      const before = events.length;
      events = events.filter((e) => e.id !== input.id);
      return before !== events.length;
    }),
});
