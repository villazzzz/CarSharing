# CarSharing - Paso Ecuador UPF 2026

A modern, lightweight carsharing web application designed to coordinate transportation for the **Paso Ecuador UPF 2026** event. The app features a unique "Airport/Station" retro-aesthetic with real-time data synchronization.

## Key Features

- **Interactive Route Map:** Visualizes origin and destination (Masia El Pinatar) using Leaflet, including automated geocoding for departure points.
- **Split-Flap Display:** Animated real-time counters for offers, seats, and passengers inspired by vintage airport departure boards.
- **Real-time Updates:** Powered by Supabase, the interface updates instantly when new rides are added or joined without needing to refresh.
- **Passwordless Management:** Users can manage and delete their own offers/bookings via a secure token system stored in `LocalStorage`. No account registration required.
- **Responsive Design:** Fully optimized for mobile and desktop using Tailwind CSS.

## Tech Stack

- **Frontend:** [React 19](https://react.dev/) + [Vite](https://vitejs.dev/).
- **Styling:** [Tailwind CSS](https://tailwindcss.com/).
- **Backend/Database:** [Supabase](https://supabase.com/) (PostgreSQL + Realtime).
- **Maps:** [Leaflet](https://leafletjs.com/) & [React-Leaflet](https://react-leaflet.js.org/).
- **Animations:** [Framer Motion](https://www.framer.com/motion/).