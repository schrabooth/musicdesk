import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@musicdesk/database'
import bcrypt from 'bcryptjs'

/**
 * POST /api/test-auth
 * Test authentication logic
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    console.log('Testing auth for:', email)

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        password: true,
      },
    })

    console.log('User found:', !!user)
    console.log('User has password:', !!user?.password)

    if (!user || !user.password) {
      return NextResponse.json({
        success: false,
        error: 'User not found or no password set',
        debug: {
          userExists: !!user,
          hasPassword: !!user?.password,
        },
      })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    console.log('Password valid:', isPasswordValid)

    if (!isPasswordValid) {
      return NextResponse.json({
        success: false,
        error: 'Invalid password',
        debug: {
          passwordLength: password.length,
          hashLength: user.password.length,
        },
      })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('Auth test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal error',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}