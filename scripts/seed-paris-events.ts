import { EventType, PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Lieux emblématiques de Paris avec coordonnées
const parisLocations = [
  // 1er - 4ème arrondissement (Centre)
  { address: "4 Place du Louvre", city: "Paris 1er", lat: 48.8606, lng: 2.3376 },
  { address: "6 Parvis Notre-Dame", city: "Paris 4ème", lat: 48.853, lng: 2.3499 },
  { address: "Place des Vosges", city: "Paris 4ème", lat: 48.8555, lng: 2.3654 },
  { address: "2 Rue des Rosiers", city: "Paris 4ème", lat: 48.8569, lng: 2.3579 },
  
  // 5ème - 7ème arrondissement (Rive Gauche)
  { address: "Place du Panthéon", city: "Paris 5ème", lat: 48.8462, lng: 2.3461 },
  { address: "15 Boulevard Saint-Germain", city: "Paris 6ème", lat: 48.8534, lng: 2.3488 },
  { address: "5 Avenue Anatole France", city: "Paris 7ème", lat: 48.858, lng: 2.2945 },
  
  // 8ème - 9ème arrondissement (Grands Boulevards)
  { address: "Avenue des Champs-Élysées", city: "Paris 8ème", lat: 48.8698, lng: 2.3075 },
  { address: "Place de la Madeleine", city: "Paris 8ème", lat: 48.8701, lng: 2.3247 },
  { address: "Boulevard Haussmann", city: "Paris 9ème", lat: 48.8738, lng: 2.3318 },
  
  // 10ème - 12ème arrondissement (Est)
  { address: "Place de la République", city: "Paris 10ème", lat: 48.8675, lng: 2.3637 },
  { address: "Place de la Bastille", city: "Paris 11ème", lat: 48.8533, lng: 2.3692 },
  { address: "Rue du Faubourg Saint-Antoine", city: "Paris 11ème", lat: 48.8515, lng: 2.3789 },
  { address: "Avenue Daumesnil", city: "Paris 12ème", lat: 48.8396, lng: 2.3876 },
  
  // 13ème - 15ème arrondissement (Sud)
  { address: "Place d'Italie", city: "Paris 13ème", lat: 48.8312, lng: 2.3556 },
  { address: "Avenue du Maine", city: "Paris 14ème", lat: 48.8396, lng: 2.3249 },
  { address: "Place Denfert-Rochereau", city: "Paris 14ème", lat: 48.8339, lng: 2.3325 },
  { address: "Rue de Vaugirard", city: "Paris 15ème", lat: 48.8425, lng: 2.3006 },
  
  // 16ème - 17ème arrondissement (Ouest)
  { address: "Place du Trocadéro", city: "Paris 16ème", lat: 48.8625, lng: 2.2875 },
  { address: "Avenue Victor Hugo", city: "Paris 16ème", lat: 48.8697, lng: 2.2854 },
  { address: "Place de l'Étoile", city: "Paris 17ème", lat: 48.8738, lng: 2.295 },
  { address: "Avenue de Wagram", city: "Paris 17ème", lat: 48.8795, lng: 2.3025 },
  
  // 18ème - 20ème arrondissement (Nord-Est)
  { address: "Place du Tertre", city: "Paris 18ème", lat: 48.8865, lng: 2.3408 },
  { address: "Boulevard de Rochechouart", city: "Paris 18ème", lat: 48.8825, lng: 2.3445 },
  { address: "Parc des Buttes-Chaumont", city: "Paris 19ème", lat: 48.8809, lng: 2.3825 },
  { address: "Rue de Belleville", city: "Paris 20ème", lat: 48.8712, lng: 2.3845 },
  { address: "Cimetière du Père-Lachaise", city: "Paris 20ème", lat: 48.8612, lng: 2.3936 },
  
  // Banlieue proche
  { address: "Avenue Charles de Gaulle", city: "Neuilly-sur-Seine", lat: 48.8848, lng: 2.2683 },
  { address: "Place de la Défense", city: "La Défense", lat: 48.8918, lng: 2.2362 },
  { address: "Rue de Paris", city: "Vincennes", lat: 48.8473, lng: 2.4392 },
];

const eventTypes = [
  "SHEVA_BERAKHOT",
  "BRIT_MILA",
  "MINCHA",
  "ARVIT",
  "OTHER",
] as const;

const eventTitles: Record<(typeof eventTypes)[number], string[]> = {
  SHEVA_BERAKHOT: [
    "Sheva Berakhot - Famille Cohen",
    "Sheva Berakhot David & Sarah",
    "Sheva Berakhot Lévy",
    "7ème jour - Mariage Abitbol",
    "Sheva Berakhot Bensimon",
  ],
  BRIT_MILA: [
    "Brit Mila - Famille Azoulay",
    "Brit du petit Nathan",
    "Brit Mila Cohen",
    "Brit Mila - Invitation",
    "Brit Mila Toledano",
  ],
  MINCHA: [
    "Min'ha - Synagogue Beth El",
    "Min'ha communautaire",
    "Min'ha - Besoin de Minyan",
    "Min'ha express",
    "Min'ha - Azara",
  ],
  ARVIT: [
    "Arvit - Synagogue Rachi",
    "Arvit communautaire",
    "Arvit - Minyan urgent",
    "Arvit après le travail",
    "Arvit - Centre communautaire",
  ],
  OTHER: [
    "Étude de Torah",
    "Cours de Guemara",
    "Réunion communautaire",
    "Hilloulah",
    "Siyoum HaShas",
  ],
};

const descriptions = [
  "Nous avons besoin de personnes pour compléter le minyan. Tous sont les bienvenus !",
  "Rejoignez-nous pour cette belle occasion. Collation offerte.",
  "Événement ouvert à tous les membres de la communauté.",
  "Merci de confirmer votre présence. Kiddoush après l'office.",
  "Ambiance chaleureuse garantie. Venez nombreux !",
  "",
];

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomDate(): Date {
  const now = new Date();
  // Entre maintenant et 30 jours dans le futur
  const daysAhead = Math.floor(Math.random() * 30) + 1;
  const date = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  
  // Heure entre 7h et 21h
  const hour = Math.floor(Math.random() * 14) + 7;
  const minute = Math.random() > 0.5 ? 0 : 30;
  
  date.setHours(hour, minute, 0, 0);
  return date;
}

function getRandomParticipants(): { max: number; current: number } {
  const max = 10; // Toujours 10 (minyan)
  const current = Math.floor(Math.random() * 9); // 0 à 8 (jamais complet)
  return { max, current };
}

async function seed() {
  console.log("🌱 Début du seeding des événements à Paris...\n");

  // Récupérer un utilisateur existant pour l'organizer
  let organizer = await prisma.user.findFirst();
  
  if (!organizer) {
    console.log("⚠️  Aucun utilisateur trouvé. Création d'un utilisateur test...");
    organizer = await prisma.user.create({
      data: {
        email: "organizer@minyannow.com",
        name: "Organisateur Test",
        emailVerified: true,
      },
    });
  }

  console.log(`👤 Organisateur: ${organizer.name || organizer.email}\n`);

  // Supprimer les anciens événements de test (optionnel)
  const deleted = await prisma.event.deleteMany({
    where: {
      organizerId: organizer.id,
    },
  });
  console.log(`🗑️  ${deleted.count} anciens événements supprimés\n`);

  // Créer les événements
  const events = [];
  
  for (const location of parisLocations) {
    const type = getRandomElement(eventTypes as unknown as string[]);
    const title = getRandomElement(eventTitles[type as keyof typeof eventTitles]);
    const { max, current } = getRandomParticipants();
    
    const event = await prisma.event.create({
      data: {
        title,
        description: getRandomElement(descriptions) || null,
        type: type as EventType,
        date: getRandomDate(),
        address: location.address,
        city: location.city,
        latitude: location.lat,
        longitude: location.lng,
        maxParticipants: max,
        currentCount: current,
        organizerId: organizer.id,
      },
    });
    
    events.push(event);
    console.log(`✅ ${event.title} @ ${location.city}`);
  }

  console.log(`\n🎉 ${events.length} événements créés avec succès !`);
  console.log("\n📍 Répartition par arrondissement:");
  
  const byCity = events.reduce((acc, e) => {
    acc[e.city] = (acc[e.city] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  Object.entries(byCity).forEach(([city, count]) => {
    console.log(`   ${city}: ${count} événement(s)`);
  });

  console.log("\n📊 Répartition par type:");
  const byType = events.reduce((acc, e) => {
    acc[e.type] = (acc[e.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  Object.entries(byType).forEach(([type, count]) => {
    console.log(`   ${type}: ${count} événement(s)`);
  });
}

seed()
  .catch((e) => {
    console.error("❌ Erreur:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
