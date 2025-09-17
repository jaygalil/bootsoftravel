import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Get session from cookie
    const sessionCookie = request.cookies.get('user-session')
    
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const session = JSON.parse(sessionCookie.value)

    // Get user to verify role
    const user = await db.user.findUnique({
      where: { id: session.userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get all checkpoints (both active and inactive for admins, only active for agents)
    const where = user.role === 'ADMIN' ? {} : { isActive: true }

    const checkpoints = await db.checkpoint.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      checkpoints
    })

  } catch (error) {
    console.error('Get checkpoints error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get session from cookie
    const sessionCookie = request.cookies.get('user-session')
    
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const session = JSON.parse(sessionCookie.value)

    // Get user to verify role
    const user = await db.user.findUnique({
      where: { id: session.userId }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required' },
        { status: 403 }
      )
    }

    const { name, description, latitude, longitude, radius } = await request.json()

    // Validate input
    if (!name || latitude === undefined || longitude === undefined || !radius) {
      return NextResponse.json(
        { error: 'Name, latitude, longitude, and radius are required' },
        { status: 400 }
      )
    }

    // Validate coordinates
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return NextResponse.json(
        { error: 'Invalid latitude or longitude values' },
        { status: 400 }
      )
    }

    if (radius <= 0) {
      return NextResponse.json(
        { error: 'Radius must be greater than 0' },
        { status: 400 }
      )
    }

    // Create checkpoint
    const checkpoint = await db.checkpoint.create({
      data: {
        name,
        description,
        latitude,
        longitude,
        radius
      }
    })

    return NextResponse.json({
      message: 'Checkpoint created successfully',
      checkpoint
    }, { status: 201 })

  } catch (error) {
    console.error('Create checkpoint error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}