import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma

  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    console.error(
      "\n⚠ DATABASE_URL not set — database calls will fail at runtime.\n" +
      "   Set it in .env.local or Vercel env vars. Get a free one at https://neon.tech\n"
    )
    throw new Error("DATABASE_URL is not set")
  }

  const adapter = new PrismaPg({ connectionString: dbUrl })
  const client = new PrismaClient({ adapter })
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = client
  return client
}

let prismaClient: PrismaClient | null = null

function lazyPrisma(): PrismaClient {
  if (!prismaClient) prismaClient = getPrismaClient()
  return prismaClient
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop) {
    return lazyPrisma()[prop as keyof PrismaClient]
  },
})
