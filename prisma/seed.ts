import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding Medify database...")

  const emergencyContacts = [
    { name: "জাতীয় জরুরি সেবা", phone: "999", type: "National Emergency", priority: 1 },
    { name: "আম্বুলেন্স", phone: "16263", type: "Medical Services", priority: 2 },
    { name: "ফায়ার সার্ভিস", phone: "16163", type: "Fire Service", priority: 3 },
    { name: "পুলিশ কন্ট্রোল রুম", phone: "999", type: "Law & Order", priority: 4 },
    { name: "স্বাস্থ্য বাতায়ন", phone: "16263", type: "Medical Services", priority: 5 },
    { name: "নারী ও শিশু হেল্পলাইন", phone: "10921", type: "Medical Services", priority: 6 },
    { name: "শিশু হেল্পলাইন", phone: "1098", type: "Medical Services", priority: 7 },
    { name: "নেশা মুক্তির হটলাইন", phone: "16465", type: "Medical Services", priority: 8 },
    { name: "রক্তের জন্য", phone: "01714044444", type: "Blood Bank", priority: 9 },
    { name: "ময়মনসিংহ মেডিকেল কলেজ হাসপাতাল", phone: "01769000999", type: "Hospital", priority: 10 },
  ]

  for (const contact of emergencyContacts) {
    await prisma.emergencyContact.upsert({
      where: { id: contact.name },
      update: contact,
      create: { id: contact.name, ...contact },
    })
  }
  console.log(`✅ ${emergencyContacts.length} emergency contacts seeded`)

  const hospitals = [
    { name: "ময়মনসিংহ মেডিকেল কলেজ হাসপাতাল", type: "hospital", address: "ময়মনসিংহ সদর, ময়মনসিংহ", city: "ময়মনসিংহ", state: "ময়মনসিংহ বিভাগ", phone: "01769000999", latitude: 24.7536, longitude: 90.4073, emergency: true, ambulance: true, bloodBank: true, diagnostic: true, specialties: ["জরুরি", "কার্ডিওলজি", "মেডিসিন", "সার্জারি", "গাইনোকোলজি"], rating: 4.2, beds: 1000 },
    { name: "স্কয়ার হাসপাতাল", type: "hospital", address: "ধানমন্ডি, ঢাকা", city: "ঢাকা", state: "ঢাকা বিভাগ", phone: "01714040404", latitude: 23.7464, longitude: 90.3762, emergency: true, ambulance: true, bloodBank: true, diagnostic: true, specialties: ["কার্ডিওলজি", "নিউরোলজি", "গ্যাস্ট্রোএন্টারোলজি", "অর্থোপেডিক্স"], rating: 4.5, beds: 500 },
    { name: "ল্যাবএইড কার্ডিয়াক হাসপাতাল", type: "hospital", address: "ধানমন্ডি, ঢাকা", city: "ঢাকা", state: "ঢাকা বিভাগ", phone: "01706601234", latitude: 23.7481, longitude: 90.3789, emergency: true, ambulance: true, diagnostic: true, specialties: ["কার্ডিওলজি", "কার্ডিয়াক সার্জারি"], rating: 4.6, beds: 300 },
    { name: "আইবিএন সিনা হাসপাতাল", type: "hospital", address: "বারিধারা, ঢাকা", city: "ঢাকা", state: "ঢাকা বিভাগ", phone: "01714042020", latitude: 23.7837, longitude: 90.4147, emergency: true, ambulance: true, diagnostic: true, specialties: ["মেডিসিন", "সার্জারি", "গাইনোকোলজি"], rating: 4.0, beds: 200 },
    { name: "পপুলার মেডিকেল কলেজ হাসপাতাল", type: "hospital", address: "ধানমন্ডি, ঢাকা", city: "ঢাকা", state: "ঢাকা বিভাগ", phone: "01714043030", latitude: 23.7445, longitude: 90.3715, emergency: true, ambulance: true, bloodBank: true, diagnostic: true, specialties: ["মেডিসিন", "সার্জারি", "পেডিয়াট্রিক্স"], rating: 4.3, beds: 400 },
    { name: "কমফোর্ট ডায়াগনস্টিক সেন্টার", type: "diagnostic", address: "ময়মনসিংহ সদর", city: "ময়মনসিংহ", state: "ময়মনসিংহ বিভাগ", phone: "01769000888", latitude: 24.7540, longitude: 90.4080, emergency: false, ambulance: false, diagnostic: true, specialties: ["প্যাথলজি", "রেডিওলজি", "ইমেজিং"], rating: 4.1 },
    { name: "ঢাকা ডেন্টাল কলেজ হাসপাতাল", type: "hospital", address: "মিরপুর, ঢাকা", city: "ঢাকা", state: "ঢাকা বিভাগ", phone: "01714045050", latitude: 23.7925, longitude: 90.3478, emergency: true, ambulance: true, diagnostic: true, specialties: ["ডেন্টাল", "ম্যাক্সিলোফেসিয়াল সার্জারি"], rating: 4.0, beds: 100 },
    { name: "ইব্রাহিম কার্ডিয়াক হাসপাতাল", type: "hospital", address: "সেগুনবাগিচা, ঢাকা", city: "ঢাকা", state: "ঢাকা বিভাগ", phone: "01714046060", latitude: 23.7339, longitude: 90.4000, emergency: true, ambulance: true, bloodBank: true, diagnostic: true, specialties: ["কার্ডিওলজি", "কার্ডিয়াক সার্জারি"], rating: 4.4, beds: 250 },
    { name: "আল-রাজী হাসপাতাল", type: "hospital", address: "মিরপুর-২, ঢাকা", city: "ঢাকা", state: "ঢাকা বিভাগ", phone: "01714047070", latitude: 23.7889, longitude: 90.3567, emergency: true, ambulance: true, diagnostic: true, specialties: ["মেডিসিন", "সার্জারি", "গাইনোকোলজি"], rating: 3.9, beds: 150 },
    { name: "বাংলাদেশ আই হসপিটাল", type: "hospital", address: "মিরপুর, ঢাকা", city: "ঢাকা", state: "ঢাকা বিভাগ", phone: "01714048080", latitude: 23.7945, longitude: 90.3523, emergency: true, ambulance: true, diagnostic: true, specialties: ["চক্ষুরোগ", "চক্ষু সার্জারি"], rating: 4.2, beds: 80 },
  ]

  for (const hospital of hospitals) {
    await prisma.hospital.upsert({
      where: { id: hospital.name },
      update: hospital,
      create: { id: hospital.name, ...hospital },
    })
  }
  console.log(`✅ ${hospitals.length} hospitals seeded`)

  console.log("🎉 Database seeding completed!")
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
