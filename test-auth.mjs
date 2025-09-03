import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://daniel:@localhost:5432/musicdesk'
    }
  }
})

async function testAuth() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'admin@musicdesk.dev' }
    })
    
    console.log('User found:', !!user)
    console.log('User data:', {
      id: user?.id,
      email: user?.email,
      name: user?.name,
      role: user?.role,
      hasPassword: !!user?.password
    })
    
    if (user?.password) {
      const isValid = await bcrypt.compare('admin123!', user.password)
      console.log('Password valid:', isValid)
    }
    
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testAuth()