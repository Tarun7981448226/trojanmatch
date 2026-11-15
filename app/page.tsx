import { redirect } from "next/navigation";

// The login page is the front door (The split design carries the
// brand); signed-in users go from there to /dashboard.
export default function Home() {
  redirect("/login");
}
