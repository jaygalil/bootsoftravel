import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { latitude, longitude, radius, name, description, isActive } = await request.json()

    // Validate coordinates if provided
    if (latitude !== undefined && (latitude < -90 || latitude > 90)) {
      return NextResponse.json(
        { error: 'Latitude must be between -90 and 90' },
        { status: 400 }
      )
    }

    if (longitude !== undefined && (longitude < -180 || longitude > 180)) {
      return NextResponse.json(
        { error: 'Longitude must be between -180 and 180' },
        { status: 400 }
      )
    }

    if (radius !== undefined && radius <= 0) {
      return NextResponse.json(
        { error: 'Radius must be greater than 0' },
        { status: 400 }
      )
    }

    // Check if checkpoint exists
    const existingCheckpoint = await db.checkpoint.findUnique({
      where: { id: params.id }
    })

    if (!existingCheckpoint) {
      return NextResponse.json(
        { error: 'Checkpoint not found' },
        { status: 404 }
      )
    }

    // Build update data (only include fields that are provided)
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (latitude !== undefined) updateData.latitude = latitude
    if (longitude !== undefined) updateData.longitude = longitude
    if (radius !== undefined) updateData.radius = radius
    if (isActive !== undefined) updateData.isActive = isActive

    // Update checkpoint
    const checkpoint = await db.checkpoint.update({
      where: { id: params.id },
      data: updateData
    })

    return NextResponse.json({
      message: 'Checkpoint updated successfully',
      checkpoint
    })

  } catch (error) {
    console.error('Update checkpoint error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if checkpoint exists
    const existingCheckpoint = await db.checkpoint.findUnique({
      where: { id: params.id }
    })

    if (!existingCheckpoint) {
      return NextResponse.json(
        { error: 'Checkpoint not found' },
        { status: 404 }
      )
    }

    // Delete checkpoint (this will cascade delete related attendance logs)
    await db.checkpoint.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      message: 'Checkpoint deleted successfully'
    })

  } catch (error) {
    console.error('Delete checkpoint error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}