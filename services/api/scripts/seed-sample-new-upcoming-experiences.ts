import { EventStatus, EventType, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type SeedItem = {
  title: string;
  description: string;
  venue: string;
  citySlug: string;
  categorySlug: string;
  daysFromNow: number;
  totalCapacity: number;
  featured?: boolean;
};

const UPCOMING_EXPERIENCES: SeedItem[] = [
  {
    title: '[Upcoming] Spring City Music Festival',
    description:
      'Early bird tickets now live. Pre-registration open and reminder notifications available.',
    venue: 'Addis Open Grounds',
    citySlug: 'addis-ababa',
    categorySlug: 'music',
    daysFromNow: 18,
    totalCapacity: 900,
    featured: true,
  },
  {
    title: '[Upcoming] Lakefront Culture Expo',
    description:
      'Limited early bird offer with partner access. Register now and get reminders.',
    venue: 'Bahir Dar Lake Arena',
    citySlug: 'bahir-dar',
    categorySlug: 'cultural',
    daysFromNow: 24,
    totalCapacity: 600,
  },
  {
    title: '[Upcoming] Creator Workshop Week',
    description:
      'Pre-registration for workshop tracks is open. Early bird seats for first 100 attendees.',
    venue: 'Hawassa Innovation Center',
    citySlug: 'hawassa',
    categorySlug: 'workshops-classes',
    daysFromNow: 30,
    totalCapacity: 240,
  },
  {
    title: '[Upcoming] National Awards Experience Night',
    description:
      'Awards showcase with early-bird booking and reminder opt-in for nominations and results.',
    venue: 'Mekelle Convention Hall',
    citySlug: 'mekelle',
    categorySlug: 'awards-recognition',
    daysFromNow: 36,
    totalCapacity: 700,
  },
];

function toFutureDate(daysFromNow: number): Date {
  const now = new Date();
  const d = new Date(now);
  d.setDate(now.getDate() + daysFromNow);
  d.setHours(20, 0, 0, 0);
  return d;
}

async function main() {
  console.log('Seeding sample New & Upcoming Experiences...');

  const organizer = await prisma.organizerProfile.findFirst({
    orderBy: { id: 'asc' },
    select: { id: true, organizationName: true },
  });
  if (!organizer) throw new Error('No organizer profile found. Create one first.');

  let created = 0;
  let updated = 0;

  for (const item of UPCOMING_EXPERIENCES) {
    const city = await prisma.city.findFirst({
      where: { slug: item.citySlug },
      select: { id: true },
    });
    if (!city) {
      console.log(`Skipped (missing city): ${item.title}`);
      continue;
    }

    const category = await prisma.mainCategory.findFirst({
      where: { slug: item.categorySlug },
      select: { id: true },
    });
    if (!category) {
      console.log(`Skipped (missing category): ${item.title}`);
      continue;
    }

    const existing = await prisma.event.findFirst({
      where: { title: item.title, organizerId: organizer.id },
      select: { id: true },
    });

    const payload = {
      title: item.title,
      description: item.description,
      venue: item.venue,
      dateTime: toFutureDate(item.daysFromNow),
      status: EventStatus.APPROVED,
      eventType: EventType.CAPACITY,
      totalCapacity: item.totalCapacity,
      coverImage:
        'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
      featured: item.featured ?? false,
      organizerId: organizer.id,
      categoryId: category.id,
      cityId: city.id,
      isPublic: true,
      isMovie: false,
      refundPolicy: 'No refunds within 24 hours of event.',
    };

    if (existing) {
      await prisma.event.update({ where: { id: existing.id }, data: payload });
      updated++;
      console.log(`Updated: ${item.title}`);
    } else {
      await prisma.event.create({ data: payload });
      created++;
      console.log(`Created: ${item.title}`);
    }
  }

  console.log(`Done. Created: ${created}, Updated: ${updated}`);
  console.log(`Organizer: ${organizer.organizationName}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
