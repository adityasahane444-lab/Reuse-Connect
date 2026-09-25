import Link from "next/link";
import { supabase } from "@/lib/supabase";

const categories = [
  {
    icon: "🍱",
    title: "Food Reuse",
    description: "Share surplus food and help prevent food waste.",
    href: "/food",
  },
  {
    icon: "♻️",
    title: "Resource Reuse",
    description: "Give, exchange, borrow or find reusable items.",
    href: "/resources",
  },
  {
    icon: "🎒",
    title: "Travel & Gear",
    description: "List travel gear and equipment under Resources.",
    href: "/resources",
  },
  {
    icon: "🌍",
    title: "Community Events",
    description: "Join local activities that make your community greener.",
    href: "/events",
  },
];

export default async function Home() {
  const [{ data: eventRows }, { data: users }] = await Promise.all([
    supabase
      .from("events")
      .select("id, title, category, date, time, location, users(name), event_participants(user_id)")
      .order("date", { ascending: true })
      .limit(3),
    supabase.from("users").select("green_points"),
  ]);

  interface EventRow {
    id: string;
    title: string;
    category: string;
    date: string;
    time: string;
    location: string;
    users: { name: string } | null;
    event_participants: { user_id: string }[] | null;
  }

  const upcomingEvents = ((eventRows ?? []) as unknown as EventRow[]).map((e) => ({
    id: e.id,
    title: e.title,
    category: e.category,
    date: e.date,
    time: e.time,
    location: e.location,
    organizedBy: e.users?.name ?? "Unknown",
    participantCount: (e.event_participants ?? []).length,
  }));
  const totalGreenPoints = ((users ?? []) as { green_points: number }[]).reduce(
    (sum, u) => sum + (u.green_points ?? 0),
    0
  );

  return (
    <main className="min-h-screen bg-[#f6fbf7] text-gray-900">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 pb-14 pt-12 sm:px-6 sm:pb-20 sm:pt-20 lg:pb-28 lg:pt-28">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-5 inline-flex max-w-full items-center gap-2 rounded-full bg-green-100 px-3 py-2 text-xs font-semibold text-green-700 sm:px-4 sm:text-sm">
              🌍 Together for a sustainable future
            </div>

            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
              Reuse More.
              <span className="block text-green-600">Waste Less.</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600">
              Give useful things a second life, share what you have, discover
              what you need, and build a greener community together.
            </p>

            {/* Search */}
            <div className="mx-auto mt-7 flex max-w-2xl flex-col gap-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-lg sm:mt-9 sm:flex-row sm:items-center">
              <span className="px-3 text-xl sm:px-4">🔍</span>

              <input
                type="text"
                placeholder="Search food, items, travel gear or events..."
                className="min-w-0 flex-1 bg-transparent px-2 py-3 text-sm outline-none placeholder:text-gray-400"
              />

              <button className="w-full rounded-xl bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700 sm:w-auto">
                Search
              </button>
            </div>

            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/resources"
                className="w-full rounded-xl bg-green-600 px-7 py-3.5 font-semibold text-white shadow-md hover:bg-green-700 sm:w-auto"
              >
                Explore Reuse
              </Link>

              <Link
                href="/resources"
                className="w-full rounded-xl border border-green-200 bg-white px-7 py-3.5 font-semibold text-green-700 hover:bg-green-50 sm:w-auto"
              >
                + Create a Post
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative circles */}
        <div className="pointer-events-none absolute -left-24 top-20 h-56 w-56 rounded-full bg-green-100/60 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-10 h-64 w-64 rounded-full bg-emerald-100/70 blur-3xl" />
      </section>

      {/* Categories */}
      <section className="bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <p className="font-semibold text-green-600">EXPLORE</p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl md:text-4xl">
              Find ways to reuse
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-gray-500">
              One platform for sharing resources, reducing waste and
              connecting people.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.title}
                href={category.href}
                className="group rounded-3xl border border-gray-100 bg-[#f8fcf9] p-5 transition hover:-translate-y-1 sm:p-7 hover:border-green-200 hover:shadow-xl"
              >
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 text-3xl">
                  {category.icon}
                </div>

                <h3 className="text-xl font-bold group-hover:text-green-700">
                  {category.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-gray-500">
                  {category.description}
                </p>

                <div className="mt-5 font-semibold text-green-600">
                  Explore →
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-[#f6fbf7] py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <p className="font-semibold text-green-600">HOW IT WORKS</p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl md:text-4xl">
              Small actions. Big impact.
            </h2>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <div className="rounded-3xl bg-white p-5 text-center sm:p-8 shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
                📦
              </div>
              <h3 className="mt-5 text-xl font-bold">1. Share</h3>
              <p className="mt-3 text-sm leading-6 text-gray-500">
                List food, items, travel gear or an activity you want others
                to reuse or join.
              </p>
            </div>

            <div className="rounded-3xl bg-white p-5 text-center sm:p-8 shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
                🤝
              </div>
              <h3 className="mt-5 text-xl font-bold">2. Connect</h3>
              <p className="mt-3 text-sm leading-6 text-gray-500">
                Find people nearby who need what you have or want to
                participate in your activity.
              </p>
            </div>

            <div className="rounded-3xl bg-white p-5 text-center sm:p-8 shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
                🏆
              </div>
              <h3 className="mt-5 text-xl font-bold">3. Earn</h3>
              <p className="mt-3 text-sm leading-6 text-gray-500">
                Earn Green Points for reuse and community actions and climb
                the sustainability leaderboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Community Events */}
      <section className="bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="font-semibold text-green-600">COMMUNITY</p>
              <h2 className="mt-2 text-2xl font-bold sm:text-3xl md:text-4xl">
                Make an impact together
              </h2>
              <p className="mt-3 text-gray-500">
                Discover sustainability events happening in your community.
              </p>
            </div>

            <Link
              href="/events"
              className="font-semibold text-green-600 hover:text-green-700"
            >
              View all events →
            </Link>
          </div>

          {upcomingEvents.length === 0 ? (
            <div className="mt-10 rounded-3xl border border-dashed border-gray-200 bg-white p-10 text-center text-gray-500">
              No events yet.{" "}
              <Link href="/events" className="font-semibold text-green-600">
                Be the first to create one →
              </Link>
            </div>
          ) : (
            <div className="mt-8 grid gap-6 sm:mt-10 sm:grid-cols-2 md:grid-cols-3">
              {upcomingEvents.map((event) => (
                <Link
                  key={event.id}
                  href="/events"
                  className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm hover:shadow-lg"
                >
                  <div className="flex h-40 items-center justify-center bg-green-100 text-6xl">
                    🌳
                  </div>

                  <div className="p-5 sm:p-6">
                    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                      {event.category}
                    </span>

                    <h3 className="mt-4 text-xl font-bold">{event.title}</h3>

                    <p className="mt-2 text-sm text-gray-500">
                      📍 {event.location || "Location TBA"}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      📅 {event.date} {event.time}
                    </p>

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                      <span className="text-sm font-medium text-gray-500">
                        👥 {event.participantCount} joined
                      </span>

                      <span className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white">
                        View
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Rewards */}
      <section className="px-4 py-12 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-green-700 px-5 py-10 text-center text-white shadow-xl sm:px-8 sm:py-14 md:px-16">
          <div className="text-5xl">🏆</div>

          <h2 className="mt-5 text-3xl font-extrabold md:text-4xl">
            Your actions have value
          </h2>

          <p className="mx-auto mt-4 max-w-2xl leading-7 text-green-50">
            Earn Green Points when you donate, reuse, help others, join
            community events and contribute to a cleaner future. The
            community has earned{" "}
            <span className="font-bold">{totalGreenPoints.toLocaleString()}</span>{" "}
            Green Points so far.
          </p>

          <div className="mt-8">
            <Link
              href="/rewards"
              className="inline-block rounded-xl bg-white px-7 py-3.5 font-bold text-green-700 hover:bg-green-50"
            >
              Explore Rewards
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-green-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="font-bold text-green-700">🌱 Reuse & Connect</div>
            <p className="mt-1 text-sm text-gray-500">
              Building a culture of reuse, sharing and sustainability.
            </p>
          </div>

          <div className="text-sm text-gray-400">
            © 2026 Reuse & Connect
          </div>
        </div>
      </footer>
    </main>
  );
}