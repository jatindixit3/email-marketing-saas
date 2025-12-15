// API Route: DELETE /api/user/delete
// Delete all user data (GDPR Article 17 - Right to Erasure)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { deleteUserData } from '@/lib/security/gdpr-compliance'
import { verifyPassword } from '@/lib/security/data-encryption'

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Require password confirmation for deletion
    const body = await request.json()
    const { password, reason } = body

    if (!password) {
      return NextResponse.json(
        {
          error: 'Password confirmation required',
          message: 'You must confirm your password to delete your account',
        },
        { status: 400 }
      )
    }

    // Verify password (in production, you'd verify against stored hash)
    // For Supabase auth, we can attempt to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password,
    })

    if (signInError) {
      return NextResponse.json(
        {
          error: 'Invalid password',
          message: 'Password confirmation failed',
        },
        { status: 401 }
      )
    }

    // Delete all user data
    const result = await deleteUserData(user.id, reason)

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Failed to delete account',
          message: result.error,
        },
        { status: 500 }
      )
    }

    // Sign out user
    await supabase.auth.signOut()

    return NextResponse.json({
      message: 'Account successfully deleted',
      deletedRecords: result.deletedRecords,
    })
  } catch (error: any) {
    console.error('Account deletion error:', error)
    return NextResponse.json(
      {
        error: 'Failed to delete account',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
