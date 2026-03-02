/**
 * Seed script: Populates all main categories and subcategories
 * Run: npx ts-node scripts/seed-categories.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CATEGORY_TREE = [
    {
        name: 'Music', slug: 'music',
        subcategories: [
            { name: 'Concerts', slug: 'concerts' },
            { name: 'Music Festivals', slug: 'music-festivals' },
            { name: 'Live Band Shows', slug: 'live-band-shows' },
            { name: 'DJ Nights / EDM', slug: 'dj-nights-edm' },
            { name: 'Album Launch Parties', slug: 'album-launch-parties' },
            { name: 'Classical / Orchestra Performances', slug: 'classical-orchestra' },
            { name: 'Street & Community Music Events', slug: 'street-community-music' },
        ]
    },
    {
        name: 'Cultural', slug: 'cultural',
        subcategories: [
            { name: 'Theatre / Stage Drama', slug: 'theatre-stage-drama' },
            { name: 'Dance Performances', slug: 'dance-performances' },
            { name: 'Poetry & Spoken Word', slug: 'poetry-spoken-word' },
            { name: 'Art Exhibitions / Galleries', slug: 'art-exhibitions-galleries' },
            { name: 'Fashion Shows', slug: 'fashion-shows' },
            { name: 'Cultural Festivals', slug: 'cultural-festivals' },
        ]
    },
    {
        name: 'Movies', slug: 'movies',
        subcategories: [
            { name: 'Ethiopian Cinema', slug: 'ethiopian-cinema' },
            { name: 'International Films', slug: 'international-films' },
            { name: 'Film Festivals', slug: 'film-festivals' },
            { name: 'Movie Premieres', slug: 'movie-premieres' },
        ]
    },
    {
        name: 'Sports', slug: 'sports',
        subcategories: [
            { name: 'Football Matches', slug: 'football-matches' },
            { name: 'Basketball / Volleyball', slug: 'basketball-volleyball' },
            { name: 'Boxing / Martial Arts', slug: 'boxing-martial-arts' },
            { name: 'Marathons & Athletics', slug: 'marathons-athletics' },
            { name: 'Adventure Sports', slug: 'adventure-sports' },
            { name: 'School / University Sports Competition', slug: 'school-university-sports' },
        ]
    },
    {
        name: 'Comedy', slug: 'comedy',
        subcategories: [
            { name: 'Stand-up Comedy', slug: 'standup-comedy' },
            { name: 'Improv Nights', slug: 'improv-nights' },
            { name: 'Comedy Festivals', slug: 'comedy-festivals' },
            { name: 'Online Comedy Shows', slug: 'online-comedy-shows' },
        ]
    },
    {
        name: 'Family & Kids', slug: 'family-kids',
        subcategories: [
            { name: 'Kids Festivals & Fairs', slug: 'kids-festivals-fairs' },
            { name: 'School & Holiday Camps', slug: 'school-holiday-camps' },
            { name: 'Family Movie Screenings', slug: 'family-movie-screenings' },
            { name: 'Educational Workshops for Kids', slug: 'educational-workshops-kids' },
            { name: 'Amusement Parks / Zoo Trips', slug: 'amusement-parks-zoo-trips' },
        ]
    },
    {
        name: 'Conferences & Professional', slug: 'conferences-professional',
        subcategories: [
            { name: 'Business & Entrepreneurship Summits', slug: 'business-entrepreneurship-summits' },
            { name: 'Tech Meetups', slug: 'tech-meetups' },
            { name: 'Career & Job Fairs', slug: 'career-job-fairs' },
            { name: 'Corporate Workshops & Trainings', slug: 'corporate-workshops-trainings' },
            { name: 'Professional Networking Events', slug: 'professional-networking-events' },
            { name: 'Public Seminars / Lectures', slug: 'public-seminars-lectures' },
            { name: 'Startup Pitch Events', slug: 'startup-pitch-events' },
        ]
    },
    {
        name: 'Food & Drink', slug: 'food-drink',
        subcategories: [
            { name: 'Cultural & Traditional Dining', slug: 'cultural-traditional-dining' },
            { name: 'Coffee Ceremony Experiences', slug: 'coffee-ceremony-experiences' },
            { name: 'Rooftop / Fine Dining Nights', slug: 'rooftop-fine-dining-nights' },
            { name: 'Food Festivals / Tasting Events', slug: 'food-festivals-tasting' },
            { name: 'Cooking Classes', slug: 'cooking-classes' },
        ]
    },
    {
        name: 'Workshops & Classes', slug: 'workshops-classes',
        subcategories: [
            { name: 'Creative Workshops', slug: 'creative-workshops' },
            { name: 'Culinary / Cooking Classes', slug: 'culinary-cooking-classes' },
            { name: 'Mixology / Bartending Classes', slug: 'mixology-bartending-classes' },
            { name: 'Digital Skills Workshops', slug: 'digital-skills-workshops' },
            { name: 'Tech & Coding Classes', slug: 'tech-coding-classes' },
            { name: 'Language Classes', slug: 'language-classes' },
            { name: 'Business & Leadership Skills', slug: 'business-leadership-skills' },
            { name: 'Personal Development & Life Skills', slug: 'personal-development-life-skills' },
        ]
    },
    {
        name: 'Religious & Festivals', slug: 'religious-festivals',
        subcategories: [
            { name: 'Pilgrimage & Spiritual Events', slug: 'pilgrimage-spiritual-events' },
            { name: 'Cultural-Religious Festivals', slug: 'cultural-religious-festivals' },
        ]
    },
    {
        name: 'Nightlife', slug: 'nightlife',
        subcategories: [
            { name: 'Club Nights & Parties', slug: 'club-nights-parties' },
            { name: 'Themed Nights & Seasonal Events', slug: 'themed-nights-seasonal' },
            { name: 'Rooftop Bars / Lounges', slug: 'rooftop-bars-lounges' },
            { name: "Ladies' Nights / Promotions", slug: 'ladies-nights-promotions' },
        ]
    },
    {
        name: 'Tours & Travel Experiences', slug: 'tours-travel',
        subcategories: [
            { name: 'City Sightseeing Tours', slug: 'city-sightseeing-tours' },
            { name: 'Historical / Heritage Tours', slug: 'historical-heritage-tours' },
            { name: 'Adventure & Eco-Tourism', slug: 'adventure-eco-tourism' },
            { name: 'Pilgrimage & Spiritual Tours', slug: 'pilgrimage-spiritual-tours' },
            { name: 'Resort & Weekend Getaways', slug: 'resort-weekend-getaways' },
        ]
    },
    {
        name: 'Wellness & Lifestyle', slug: 'wellness-lifestyle',
        subcategories: [
            { name: 'Yoga / Meditation Classes', slug: 'yoga-meditation-classes' },
            { name: 'Fitness Bootcamps', slug: 'fitness-bootcamps' },
            { name: 'Spa & Wellness Retreats', slug: 'spa-wellness-retreats' },
            { name: 'Mental Health & Self-Improvement', slug: 'mental-health-self-improvement' },
            { name: 'Nutrition / Healthy Cooking', slug: 'nutrition-healthy-cooking' },
        ]
    },
    {
        name: 'Markets, Fairs & Expos', slug: 'markets-fairs-expos',
        subcategories: [
            { name: 'Trade & Business Expos', slug: 'trade-business-expos' },
            { name: 'Artisan & Handmade Markets', slug: 'artisan-handmade-markets' },
            { name: 'Fashion & Design Shows', slug: 'fashion-design-shows' },
            { name: 'Book Fairs', slug: 'book-fairs' },
            { name: 'Agricultural / Industry Exhibitions', slug: 'agricultural-industry-exhibitions' },
        ]
    },
    {
        name: 'Outdoor & Adventure', slug: 'outdoor-adventure',
        subcategories: [
            { name: 'Hiking / Trekking Events', slug: 'hiking-trekking-events' },
            { name: 'Cycling Events', slug: 'cycling-events' },
            { name: 'Camping & Glamping', slug: 'camping-glamping' },
            { name: 'Water & Lake Activities', slug: 'water-lake-activities' },
            { name: 'Extreme Sports & Eco-Adventure', slug: 'extreme-sports-eco-adventure' },
        ]
    },
    {
        name: 'Gaming & E-Sports', slug: 'gaming-esports',
        subcategories: [
            { name: 'LAN Competitions', slug: 'lan-competitions' },
            { name: 'Online Gaming Tournaments', slug: 'online-gaming-tournaments' },
            { name: 'Gaming Café Bookings', slug: 'gaming-cafe-bookings' },
            { name: 'E-Sports Events & Live Streams', slug: 'esports-events-live-streams' },
        ]
    },
    {
        name: 'Private Event Booking', slug: 'private-event-booking',
        subcategories: [
            { name: 'Wedding Halls / Venues', slug: 'wedding-halls-venues' },
            { name: 'Birthday Celebration Halls', slug: 'birthday-celebration-halls' },
            { name: 'Corporate Event Spaces', slug: 'corporate-event-spaces' },
            { name: 'Outdoor / Garden Spaces', slug: 'outdoor-garden-spaces' },
            { name: 'Event Equipment Rentals', slug: 'event-equipment-rentals' },
            { name: 'Digital Invitations & Ticketing', slug: 'digital-invitations-ticketing' },
        ]
    },
    {
        name: 'Education & Learning', slug: 'education-learning',
        subcategories: [
            { name: 'Short-Term Professional Trainings', slug: 'short-term-professional-trainings' },
            { name: 'University Seminars & Workshops', slug: 'university-seminars-workshops' },
            { name: 'Exam Prep & Certification Courses', slug: 'exam-prep-certification' },
            { name: 'Foreign Language Classes', slug: 'foreign-language-classes' },
            { name: 'Entrepreneurship & Business Development', slug: 'entrepreneurship-business-development' },
            { name: 'STEM & Technical Trainings', slug: 'stem-technical-trainings' },
        ]
    },
    {
        name: 'Entrepreneurship & Networking', slug: 'entrepreneurship-networking',
        subcategories: [
            { name: 'Startup Demo Days', slug: 'startup-demo-days' },
            { name: 'Investor Meetups', slug: 'investor-meetups' },
            { name: 'Co-working Space Passes', slug: 'coworking-space-passes' },
            { name: 'Innovation & Pitch Competitions', slug: 'innovation-pitch-competitions' },
            { name: 'Professional Networking Nights', slug: 'professional-networking-nights' },
        ]
    },
    {
        name: 'Online / Virtual Events', slug: 'online-virtual-events',
        subcategories: [
            { name: 'Webinars & Online Classes', slug: 'webinars-online-classes' },
            { name: 'Virtual Conferences', slug: 'virtual-conferences' },
            { name: 'Paid Livestream Shows', slug: 'paid-livestream-shows' },
            { name: 'Online Music & Comedy Events', slug: 'online-music-comedy-events' },
        ]
    },
    {
        name: 'Awards & Recognition', slug: 'awards-recognition',
        subcategories: [
            { name: 'Gumma Film Awards', slug: 'gumma-film-awards' },
            { name: 'Ethiopian International Film Festival Awards', slug: 'eth-intl-film-awards' },
            { name: 'Leza Film Awards', slug: 'leza-film-awards' },
            { name: 'Leza Music Awards', slug: 'leza-music-awards' },
            { name: 'ODA Awards', slug: 'oda-awards' },
            { name: 'TikTok Creative Awards', slug: 'tiktok-creative-awards' },
            { name: 'Ethiopia Influencer Awards', slug: 'ethiopia-influencer-awards' },
            { name: 'Digital Content Creator Awards', slug: 'digital-content-creator-awards' },
            { name: 'IGAD Media Awards', slug: 'igad-media-awards' },
            { name: 'African Media Awards', slug: 'african-media-awards' },
            { name: 'National Sports Awards', slug: 'national-sports-awards' },
            { name: 'League MVP & Seasonal Awards', slug: 'league-mvp-seasonal-awards' },
            { name: 'Startup / Innovation Awards', slug: 'startup-innovation-awards' },
            { name: 'Entrepreneurship Recognition Awards', slug: 'entrepreneurship-recognition-awards' },
        ]
    },
];

async function seed() {
    console.log('🌱 Seeding categories and subcategories...\n');

    // Wipe all existing categories (subcategories first via parentId, then roots)
    console.log('🗑️  Clearing existing categories...');
    await prisma.category.deleteMany({ where: { parentId: { not: null } } });
    await prisma.category.deleteMany({});
    console.log('✅ Cleared.\n');

    let totalMain = 0;
    let totalSub = 0;

    for (const cat of CATEGORY_TREE) {
        // Create main category
        const main = await prisma.category.create({
            data: { name: cat.name, slug: cat.slug }
        });
        totalMain++;
        console.log(`✅ [Main] ${cat.name}`);

        // Create subcategories linked to parent
        for (const sub of cat.subcategories) {
            await prisma.category.create({
                data: { name: sub.name, slug: sub.slug, parentId: main.id }
            });
            totalSub++;
            console.log(`   └─ ${sub.name}`);
        }
    }

    console.log(`\n🎉 Done! Seeded ${totalMain} main categories and ${totalSub} subcategories.`);
    await prisma.$disconnect();
}

seed().catch(async e => {
    console.error('❌ Seed failed:', e.message);
    await prisma.$disconnect();
    process.exit(1);
});
