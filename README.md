## School Calendar App

An interactive calendar application built with Next.js and React. It supports week/month views, creating, editing, and deleting events, all‑day events, color labels, locations, and validations.

### Features
- **Calendar views**: Week and Month
- **Create/Edit/Delete events**
- **All‑day events** and **time‑ranged events**
- **Event details**: title, description, color, location
- **Form validation** with Zod + React Hook Form
- **Date utilities** with date‑fns
- Type-Safe API: End-to-end type safety with tRPC

### Tech Stack
- **Next.js 15** (App Router) and **React 19**
- **TypeScript**
- **Tailwind CSS** UI with utility components
- **React Hook Form** + **Zod** for forms/validation
- **date‑fns** for date calculations
- **Shadcn UI**  - Accessible component primitives
- **tRPC** - End-to-end typesafe APIs


### Project Structure
- `src/app/Calender/` — Calendar UI, form schema, and page
- `src/ui/` — Reusable UI components (inputs, dialogs, buttons, etc.)
- `src/app/server/api/routers/` — Domain routers (e.g., `calender.ts`)
- `src/app/api/trpc/[trpc]/route.ts` — tRPC request handler (App Router endpoint)
- `src/app/server/api/` — Server-side tRPC setup and routers
- `src/app/server/api/routers/` — Domain routers (e.g., `calender.ts`)
  
### Notes
- If you open the new event dialog (Neues Ereignis), the form resets to defaults; clicking an existing event will populate the dialog with that event’s data.
- the description and location of an event can be seen by hovering over an event
- mock data is shown throughout the month of october,the mock data file is in the Calender folder.
- When designing new UI components, I referenced Origin UI for inspiration and design patterns. Origin UI offers excellent examples of clean, functional components.

