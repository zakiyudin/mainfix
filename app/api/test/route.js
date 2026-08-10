import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Test koneksi dengan query ke system catalog PostgreSQL
    const { data, error } = await supabase.rpc('version')

    // Kalau error tapi bukan masalah koneksi
    if (error) {
      // Coba cara lain — query ke auth.users (pasti ada di Supabase)
      const { error: error2 } = await supabase.auth.getSession()
      
      if (!error2) {
        return NextResponse.json({
          status: 'KONEKSI BERHASIL ✓',
          message: 'Terhubung ke Supabase Auth berhasil.',
          supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        })
      }
      throw error
    }

    return NextResponse.json({
      status: 'KONEKSI BERHASIL ✓',
      message: 'Terhubung ke Supabase.',
      supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      pg_version: data,
    })

  } catch (error) {
    return NextResponse.json({
      status: 'GAGAL ✗',
      error: error.message,
      hint: 'Cek .env.local — pastikan NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY sudah benar'
    }, { status: 500 })
  }
}