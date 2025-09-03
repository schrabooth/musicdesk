import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@musicdesk/database'
import bcrypt from 'bcryptjs'

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!user) {
          return null
        }

        // For OAuth users, they might not have a password
        if (!user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          role: user.role,
        }
      }
    })
  ],
  session: {
    strategy: 'database',
  },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
    error: '/auth/error',
  },
  callbacks: {
    async session({ session, user }) {
      // Add user ID and role to session
      if (session.user) {
        session.user.id = user.id
        session.user.role = (user as any).role || 'USER'
      }
      return session
    },
    async signIn({ user, account, profile }) {
      // Allow all sign-ins for now
      // Add custom logic here if needed
      return true
    }
  },
  events: {
    async createUser({ user }) {
      // Create default organization for new users
      await prisma.organization.create({
        data: {
          name: `${user.name}'s Organization`,
          slug: `${user.name?.toLowerCase().replace(/\s+/g, '-')}-org-${Date.now()}`,
          members: {
            create: {
              userId: user.id,
              role: 'OWNER',
            }
          }
        }
      })
    }
  }
})

export { handler as GET, handler as POST }