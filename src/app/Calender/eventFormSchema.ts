import { z } from "zod";

export const CalenderCreateFormSchema = z
    .object({
        title: z
            .string()
            .min(2, "mindestens 2 Zeichen")
            .max(40, { message: "maximal 40 Zeichen ." }),
        description: z
            .string()
            .optional()
            .refine((val) => !val || val.length <= 50, {
                message: "Beschreibung maximal 50 Zeichen .",
            }),
        start: z.date(),
        end: z.date(),
        allDay: z.boolean(),
        color: z.enum(["orange", "blue", "pink"]),
        location: z
            .string()
            .optional()
            .refine((val) => !val || val.length <= 40, {
                message: "maximal 40 Zeichen .",
            }),
    })
    .refine(
        (data) => {
          if (!data.start || !data.end) return false;
      
          const startOfDay = (date: Date) => {
            const d = new Date(date);
            d.setHours(0, 0, 0, 0);
            return d;
          };

          const startLocal = startOfDay(data.start);
          const endLocal = startOfDay(data.end);
      
          const sameDay = startLocal.getTime() === endLocal.getTime();
      
          return sameDay && data.end.getTime() > data.start.getTime();
        },
        {
          message: "Start und Ende müssen am selben Tag liegen und Ende muss nach Start sein.",
          path: ["end"],
        }
      );

export type CalenderCreateForm = z.infer<typeof CalenderCreateFormSchema>;


