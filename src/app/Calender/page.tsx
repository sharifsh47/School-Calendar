
import { HydrateClient } from "@/trpc/server";
import CalendarComponent from "./index";
export default function TeacherCalendarPage() {
    return (
        <HydrateClient>
            <CalendarComponent />
        </HydrateClient>
    )
}