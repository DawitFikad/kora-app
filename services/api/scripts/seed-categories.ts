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
            { name: 'Dance Performances (Traditional & Modern)', slug: 'dance-performances' },
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
            { name: 'Premieres', slug: 'premieres' },
        ]
    },
    {
        name: 'Sports', slug: 'sports',
        subcategories: [
            { name: 'Football Matches', slug: 'football-matches' },
            { name: 'Basketball / Volleyball', slug: 'basketball-volleyball' },
            { name: 'Boxing / Martial Arts', slug: 'boxing-martial-arts' },
            { name: 'Marathons & Athletics', slug: 'marathons-athletics' },
            { name: 'Adventure Sports (Hiking, Cycling, Trekking)', slug: 'adventure-sports' },
            { name: 'School / University Sports Competition', slug: 'school-university-sports' },
        ]
    },
    {
        name: 'Comedy', slug: 'comedy',
        subcategories: [
            { name: 'Stand-up Comedy', slug: 'standup-comedy' },
            { name: 'Improv Nights', slug: 'improv-nights' },
            { name: 'Comedy Festivals / Special Shows', slug: 'comedy-festivals' },
            { name: 'Online Comedy Shows', slug: 'online-comedy-shows' },
        ]
    },
    {
        name: 'Family & Kids', slug: 'family-kids',
        subcategories: [
            { name: 'Kids Festivals & Fairs', slug: 'kids-festivals-fairs' },
            { name: 'School & Holiday Camps', slug: 'school-holiday-camps' },
            { name: 'Family Movie Screenings', slug: 'family-movie-screenings' },
            { name: 'Educational Workshops for Kids (STEM, Art)', slug: 'educational-workshops' },
            { name: 'Amusement Parks / Zoo Trips', slug: 'amusement-parks-zoo' },
        ]
    },
    {
        name: 'Conferences & Professional', slug: 'conferences-professional',
        subcategories: [
            { name: 'Business & Entrepreneurship Summits', slug: 'business-summits' },
            { name: 'Tech Meetups', slug: 'tech-meetups' },
            { name: 'Career & Job Fairs', slug: 'career-job-fairs' },
            { name: 'Corporate Workshops & Trainings', slug: 'corporate-workshops' },
            { name: 'Networking Events', slug: 'networking-events' },
            { name: 'Public Seminars / Lectures', slug: 'public-seminars' },
            { name: 'Startup Pitch Events', slug: 'startup-pitch' },
        ]
    },
    {
        name: 'Food & Drink', slug: 'food-drink',
        subcategories: [
            { name: 'Cultural & Traditional Dining Experiences', slug: 'cultural-dining' },
            { name: 'Coffee Ceremony Experiences', slug: 'coffee-ceremony' },
            { name: 'Rooftop / Fine Dining Nights', slug: 'fine-dining' },
            { name: 'Food Festivals / Tasting Events', slug: 'food-festivals' },
            { name: 'Cooking Classes / Short-Term Culinary Workshops', slug: 'culinary-workshops' },
        ]
    },
    {
        name: 'Workshops & Classes', slug: 'workshops-classes',
        subcategories: [
            { name: 'Creative Workshops (Painting, Pottery, Photography, Dance)', slug: 'creative-workshops' },
            { name: 'Culinary / Cooking Classes', slug: 'cooking-classes' },
            { name: 'Mixology / Bartending Classes', slug: 'mixology-classes' },
            { name: 'Digital Skills (Digital Marketing, Graphic Design, etc.)', slug: 'digital-skills' },
            { name: 'Tech (Coding, App Development, Data Science)', slug: 'tech-classes' },
            { name: 'Language Classes (English, French, Amharic)', slug: 'language-classes' },
            { name: 'Business Skills: Entrepreneurship, Leadership, Sales', slug: 'business-skills' },
            { name: 'Personal Development & Life Skills', slug: 'life-skills' },
        ]
    },
    {
        name: 'Religious & Festivals', slug: 'religious-festivals',
        subcategories: [
            { name: 'Pilgrimage & Spiritual Events', slug: 'spiritual-events' },
            { name: 'Cultural-Religious Festivals', slug: 'cultural-religious' },
        ]
    },
    {
        name: 'Nightlife', slug: 'nightlife',
        subcategories: [
            { name: 'Club Nights & Parties', slug: 'club-nights' },
            { name: 'Themed Nights & Seasonal Events', slug: 'themed-nights' },
            { name: 'Rooftop Bars / Lounges', slug: 'rooftop-bars' },
            { name: 'Ladies’ Nights / Special Promotions', slug: 'ladies-nights' },
        ]
    },
    {
        name: 'Tours & Travel Experiences', slug: 'tours-travel',
        subcategories: [
            { name: 'City Sightseeing Tours', slug: 'city-tours' },
            { name: 'Historical / Heritage Tours', slug: 'historical-tours' },
            { name: 'Adventure & Eco-Tourism (Hiking, Trekking, Lake Trips)', slug: 'eco-tourism' },
            { name: 'Pilgrimage & Spiritual Tours', slug: 'spiritual-tours' },
            { name: 'Resort & Weekend Getaways', slug: 'weekend-getaways' },
        ]
    },
    {
        name: 'Wellness & Lifestyle', slug: 'wellness-lifestyle',
        subcategories: [
            { name: 'Yoga / Meditation Classes', slug: 'yoga-meditation' },
            { name: 'Fitness Bootcamps', slug: 'fitness-bootcamps' },
            { name: 'Spa & Wellness Retreats', slug: 'wellness-retreats' },
            { name: 'Mental Health & Self-Improvement Workshops', slug: 'mental-health' },
            { name: 'Nutrition / Healthy Cooking Workshops', slug: 'nutrition-workshops' },
        ]
    },
    {
        name: 'Markets, Fairs & Expos', slug: 'markets-fairs-expos',
        subcategories: [
            { name: 'Trade & Business Expos', slug: 'business-expos' },
            { name: 'Artisan & Handmade Markets', slug: 'artisan-markets' },
            { name: 'Fashion & Design Shows', slug: 'fashion-design' },
            { name: 'Book Fairs', slug: 'book-fairs' },
            { name: 'Agricultural / Industry Exhibitions', slug: 'agricultural-exhibitions' },
        ]
    },
    {
        name: 'Outdoor & Adventure', slug: 'outdoor-adventure',
        subcategories: [
            { name: 'Hiking / Trekking', slug: 'hiking-trekking' },
            { name: 'Cycling Events', slug: 'cycling' },
            { name: 'Camping & Glamping', slug: 'camping' },
            { name: 'Water & Lake Activities', slug: 'water-activities' },
            { name: 'Extreme Sports & Eco-Adventure', slug: 'extreme-sports' },
        ]
    },
    {
        name: 'Gaming & E-Sports', slug: 'gaming-esports',
        subcategories: [
            { name: 'LAN Competitions', slug: 'lan-competitions' },
            { name: 'Online Gaming Tournaments', slug: 'gaming-tournaments' },
            { name: 'Gaming Café Bookings', slug: 'gaming-cafe' },
            { name: 'E-sports Events & Live Streams', slug: 'esports-streams' },
        ]
    },
    {
        name: 'Private Event Booking', slug: 'private-event-booking',
        subcategories: [
            { name: 'Wedding Halls / Venues', slug: 'wedding-venues' },
            { name: 'Birthday Celebration Halls', slug: 'birthday-halls' },
            { name: 'Corporate Event Spaces', slug: 'corporate-spaces' },
            { name: 'Outdoor / Garden Spaces', slug: 'garden-spaces' },
            { name: 'Event Equipment Rentals', slug: 'equipment-rentals' },
            { name: 'Digital Invitations & Ticketing', slug: 'digital-invitations' },
        ]
    },
    {
        name: 'Education & Learning', slug: 'education-learning',
        subcategories: [
            { name: 'Short-Term Professional Trainings', slug: 'professional-trainings' },
            { name: 'University Seminars & Workshops', slug: 'university-seminars' },
            { name: 'Exam Prep & Certification Courses', slug: 'exam-prep' },
            { name: 'Language Classes', slug: 'languages' },
            { name: 'Entrepreneurship & Business Development', slug: 'business-development' },
            { name: 'STEM & Technical Trainings', slug: 'stem-trainings' },
        ]
    },
    {
        name: 'Entrepreneurship & Networking', slug: 'entrepreneurship-networking',
        subcategories: [
            { name: 'Startup Demo Days', slug: 'startup-demo-days' },
            { name: 'Investor Meetups', slug: 'investor-meetups' },
            { name: 'Co-working Space Passes', slug: 'coworking-passes' },
            { name: 'Innovation & Idea Pitch Competitions', slug: 'pitch-competitions' },
            { name: 'Professional Networking Nights', slug: 'networking-nights' },
        ]
    },
    {
        name: 'Online / Virtual Events', slug: 'online-virtual-events',
        subcategories: [
            { name: 'Webinars & Online Classes', slug: 'webinars' },
            { name: 'Virtual Conferences', slug: 'virtual-conferences' },
            { name: 'Paid Livestream Shows & Workshops', slug: 'livestream-shows' },
            { name: 'Online Music & Comedy Events', slug: 'online-entertainment' },
        ]
    },
    {
        name: 'Awards & Recognition', slug: 'awards-recognition',
        subcategories: [
            { name: 'Film & TV Awards (Gumma, Leza, etc.)', slug: 'film-tv-awards' },
            { name: 'Music & Arts Awards (Leza, ODA, etc.)', slug: 'music-arts-awards' },
            { name: 'Social Media & Digital Awards (TikTok, etc.)', slug: 'digital-awards' },
            { name: 'Media & Journalism Awards', slug: 'media-awards' },
            { name: 'Sports Recognition Awards', slug: 'sports-awards' },
            { name: 'Business & Innovation Awards', slug: 'business-awards' },
        ]
    },
];

async function seed() {
    console.log('🌱 Seeding categories and subcategories...\n');

    // Wipe all existing categories (subcategories first via parentId, then roots)
    console.log('🗑️  Clearing existing categories...');
    try {
        await prisma.category.deleteMany({ where: { parentId: { not: null } } });
        await prisma.category.deleteMany({});
        console.log('✅ Cleared.\n');
    } catch (e) {
        console.log('⚠️  Note: Could not clear some categories, likely due to relations. Proceeding with creation/updates...');
    }

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
