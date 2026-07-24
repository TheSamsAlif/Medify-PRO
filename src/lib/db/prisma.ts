import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    if (typeof window === "undefined") {
      console.error(
        "\n❌ DATABASE_URL environment variable is not set!\n" +
        "   Please set it in your .env.local file or Vercel environment variables.\n" +
        "   Example: DATABASE_URL=\"postgresql://user:pass@host:5432/medify?schema=public\"\n" +
        "   Get a free PostgreSQL database at https://neon.tech\n"
      )
    }
    throw new Error("DATABASE_URL is not configured. Server cannot start without a database.")
  }

  const adapter = new PrismaPg({ connectionString: dbUrl })
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
