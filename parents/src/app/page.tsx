"use client";

import Link from "next/link";

export default function ParentDashboard() {
  const mockChildren = [
    {
      id: "1",
      name: "Alice Johnson",
      grade: "Grade 8",
      status: "Present today",
      recentGrade: "A-",
      avatarColor: "bg-red-accent text-white"
    },
    {
      id: "2",
      name: "Leo Johnson",
      grade: "Grade 5",
      status: "Absent today",
      recentGrade: "B+",
    }
  ];

  const upcomingEvents = [
    { date: "Oct 24", title: "PTA Meeting", time: "16:00 - 18:00" },
    { date: "Nov 01", title: "Mid-Term Break Begins", time: "All Day" },
    { date: "Nov 15", title: "Science Fair", time: "09:00 - 14:00" },
  ];

  const announcements = [
    { title: "End of Term 1 Newsletter", date: "Oct 20", excerpt: "See the full principal's review covering academic highlights and December holiday dates.", hasImage: true, imageName: "newsletter_preview.jpg" },
    { title: "New Parking Guidelines", date: "Oct 18", excerpt: "Please review the updated drop-off routes outside the main gate to ensure a smooth morning transition.", hasImage: false, imageName: null },
  ];

  const pendingAssignments = [
    { subject: "Mathematics", task: "Algebra Worksheet", due: "Tomorrow", child: "Alice", urgent: true },
    { subject: "History", task: "Read Chapter 4", due: "In 2 days", child: "Leo", urgent: false },
    { subject: "Science", task: "Lab Report Draft", due: "Friday", child: "Alice", urgent: false },
  ];

  const quickLinks = [
    { title: "School Calendar", icon: "📅", href: "#" },
    { title: "Cafeteria Menu", icon: "🍲", href: "#" },
    { title: "Uniform Shop", icon: "👕", href: "/uniform-shop" },
    { title: "Parent Handbook", icon: "📖", href: "#" },
  ];

  return (
    <div className="bg-background flex flex-col items-center py-12 px-6">
      {/* Header Area */}
      <header className="w-full max-w-4xl flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            Welcome back, Sarah
          </h1>
          <p className="text-foreground/60 mt-1 font-medium">
            Here&apos;s the latest update on your children&apos;s progress at Olabs.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-4xl space-y-8">

        {/* Latest Public Newsletter Slot */}
        <section className="bg-orange-accent text-white p-6 rounded-lg relative overflow-hidden shadow-sm">
          {/* Subtle background decoration */}
          <div className="absolute -right-16 -top-16 opacity-10">
            <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-bold tracking-wider uppercase">New Newsletter</span>
                <span className="text-sm font-medium opacity-80">Oct 20, 2026</span>
              </div>
              <h2 className="text-xl font-bold mb-1">End of Term 1 Review & Holiday Schedules</h2>
              <p className="text-white/90 font-medium">Read the principal&apos;s latest update covering academic highlights and December dates.</p>
            </div>

            <Link href="/announcements" className="shrink-0 bg-white text-orange-accent hover:bg-white/90 px-6 py-2.5 rounded-md font-bold transition-colors text-center shadow-sm w-full sm:w-auto mt-4 sm:mt-0">
              Read Newsletter
            </Link>
          </div>
        </section>

        {/* Quick Alerts Section */}
        <section className="bg-red-accent/10 border border-red-accent/30 p-6 rounded-lg">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="p-3 bg-red-accent text-white rounded-md shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-red-accent">Outstanding Fees Reminder</h2>
              <p className="text-foreground/80 mt-1 text-sm sm:text-base">
                You have an outstanding balance of <strong>$450.00</strong> for the current term. Please clear this by Friday to avoid late fees.
              </p>
              <button className="mt-4 px-6 py-2 bg-red-accent text-white font-medium rounded-md hover:opacity-90 transition-opacity w-full sm:w-auto">
                View Invoice
              </button>
            </div>
          </div>
        </section>

        {/* Children Overview */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-6">Your Children</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mockChildren.map((child) => (
              <div key={child.id} className="border border-border/30 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 mb-6">
                  <div className={`h-12 w-12 rounded-lg flex items-center justify-center font-bold text-xl ${child.avatarColor}`}>
                    {child.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{child.name}</h3>
                    <p className="text-foreground/60">{child.grade}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-background border border-border/30 rounded-md">
                    <span className="text-foreground/70 font-medium text-sm">Daily Attendance</span>
                    <span className={`font-semibold text-sm ${child.status.includes('Absent') ? 'text-red-accent' : 'text-green-600'}`}>
                      {child.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-background border border-border/30 rounded-md">
                    <span className="text-foreground/70 font-medium text-sm">Recent Assessment</span>
                    <span className="font-semibold text-orange-accent">{child.recentGrade}</span>
                  </div>
                </div>

                <button className="w-full mt-6 py-2 border border-border/30 font-medium text-foreground rounded-md hover:bg-border/50 transition-colors">
                  View Full Profile
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Information Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Upcoming Events */}
          <div className="bg-card border border-border/30 rounded-lg shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border/30 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-foreground">Upcoming Events</h2>
              <button className="text-sm font-medium text-foreground/60 hover:text-foreground">View Calendar</button>
            </div>
            <div className="divide-y divide-border/30">
              {upcomingEvents.map((event, i) => (
                <div key={i} className="p-6 hover:bg-background/50 transition-colors flex gap-4 items-start">
                  <div className="bg-orange-accent/10 border border-orange-accent/30 rounded-md p-2 text-center min-w-[60px]">
                    <span className="block text-xs font-semibold text-orange-accent uppercase tracking-wider">{event.date.split(' ')[0]}</span>
                    <span className="block text-xl font-bold text-orange-accent">{event.date.split(' ')[1]}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{event.title}</h3>
                    <p className="text-sm text-foreground/60 mt-1 flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                      {event.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Announcements */}
          <div className="bg-card border border-border/30 rounded-lg shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border/30 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-foreground">Announcements</h2>
              <Link href="/announcements" className="text-sm font-medium text-foreground/60 hover:text-foreground">View All</Link>
            </div>
            <div className="divide-y divide-border/30">
              {announcements.map((announcement, i) => (
                <div key={i} className="hover:bg-background/50 transition-colors">
                  {announcement.hasImage ? (
                    // --- Image Preview Card ---
                    <div>
                      <div className="relative w-full h-52 bg-background/50 overflow-hidden">
                        {/* Mock image placeholder */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-20">
                          <span className="text-6xl">📰</span>
                          <div className="w-2/3 h-3 bg-foreground/30 rounded mt-4 mb-2"></div>
                          <div className="w-1/2 h-3 bg-foreground/30 rounded mb-2"></div>
                          <div className="w-3/4 h-3 bg-foreground/30 rounded"></div>
                        </div>
                        {/* Gradient overlay */}
                        <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-card to-transparent pointer-events-none"></div>
                        {/* Overlaid action buttons */}
                        <div className="absolute inset-x-0 bottom-0 p-4 flex items-end justify-between gap-3">
                          <div>
                            <p className="font-semibold text-foreground text-sm">{announcement.imageName}</p>
                            <p className="text-xs text-foreground/60">Image Preview</p>
                          </div>
                          <div className="flex gap-2">
                            <button className="px-3 py-1.5 bg-card/80 backdrop-blur border border-border/30 text-foreground font-medium text-xs rounded-md hover:bg-card transition-colors flex items-center gap-1.5 shadow-sm">
                              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                              Download
                            </button>
                            <Link href="/announcements" className="px-3 py-1.5 bg-red-accent text-white font-medium text-xs rounded-md hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-sm">
                              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg>
                              View Full
                            </Link>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 pt-3">
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold text-foreground">{announcement.title}</h3>
                          <span className="text-xs font-medium text-foreground/50 whitespace-nowrap ml-3">{announcement.date}</span>
                        </div>
                        <p className="text-sm text-foreground/70 mt-1 line-clamp-2">{announcement.excerpt}</p>
                      </div>
                    </div>
                  ) : (
                    // --- Plain Text Card ---
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-foreground">{announcement.title}</h3>
                        <span className="text-xs font-medium text-foreground/50 ml-3 whitespace-nowrap">{announcement.date}</span>
                      </div>
                      <p className="text-sm text-foreground/80 line-clamp-2">{announcement.excerpt}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Action Items & Resources */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pending Assignments */}
          <div className="bg-card border border-border/30 rounded-lg shadow-sm overflow-hidden md:col-span-2">
            <div className="p-6 border-b border-border/30 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-foreground">Pending Assignments</h2>
              <button className="text-sm font-medium text-foreground/60 hover:text-foreground">View All</button>
            </div>
            <div className="divide-y divide-border/30">
              {pendingAssignments.map((assignment, i) => (
                <div key={i} className="p-4 hover:bg-background/50 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex flex-col">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-foreground">{assignment.subject}</span>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-border/50 text-foreground/70 whitespace-nowrap">{assignment.child}</span>
                    </div>
                    <span className="text-sm text-foreground/80 mt-1">{assignment.task}</span>
                  </div>
                  <div className={`text-sm font-medium whitespace-nowrap ${assignment.urgent ? 'text-red-accent' : 'text-foreground/60'}`}>
                    Due {assignment.due}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-card border border-border/30 rounded-lg shadow-sm border-b border-border/30">
            <div className="p-6 border-b border-border/30">
              <h2 className="text-xl font-semibold text-foreground">Quick Links</h2>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              {quickLinks.map((link, i) => (
                <Link key={i} href={link.href} className="flex flex-col items-center text-center p-3 rounded-md hover:bg-background/50 transition-colors border border-transparent hover:border-border/30">
                  <span className="text-2xl mb-2">{link.icon}</span>
                  <span className="text-xs font-medium text-foreground/80">{link.title}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
