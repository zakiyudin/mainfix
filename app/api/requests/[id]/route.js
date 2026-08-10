import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(request, { params }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single()

    const { id } = await params
    const body = await request.json()
    const { action } = body

    // Ambil request saat ini
    const { data: req } = await supabase
      .from('maintenance_requests')
      .select('*')
      .eq('id', id)
      .single()

    if (!req)
      return NextResponse.json({ error: 'Request tidak ditemukan.' }, { status: 404 })

    let updates = { updated_at: new Date().toISOString() }

    if (action === 'approve') {
      if (!['supervisor','admin'].includes(profile.role))
        return NextResponse.json({ error: 'Hanya supervisor yang bisa approve.' }, { status: 403 })
      if (req.status !== 'pending')
        return NextResponse.json({ error: 'Hanya request pending yang bisa di-approve.' }, { status: 400 })
      updates = { ...updates, status: 'approved',
        supervisor_id: user.id, supervisor_nama: profile.full_name,
        catatan_supervisor: body.catatan || null }
    }

    else if (action === 'reject') {
      if (!['supervisor','admin'].includes(profile.role))
        return NextResponse.json({ error: 'Hanya supervisor yang bisa reject.' }, { status: 403 })
      if (!body.catatan)
        return NextResponse.json({ error: 'Alasan penolakan wajib diisi.' }, { status: 400 })
      updates = { ...updates, status: 'rejected',
        supervisor_id: user.id, supervisor_nama: profile.full_name,
        catatan_reject: body.catatan }
    }

    else if (action === 'start') {
      if (!['technician','admin'].includes(profile.role))
        return NextResponse.json({ error: 'Hanya teknisi yang bisa ambil tugas.' }, { status: 403 })
      if (req.status !== 'approved')
        return NextResponse.json({ error: 'Request belum di-approve.' }, { status: 400 })
      updates = { ...updates, status: 'in_progress',
        teknisi_id: user.id, teknisi_nama: profile.full_name }
    }

    else if (action === 'close') {
      if (!['technician','admin'].includes(profile.role))
        return NextResponse.json({ error: 'Hanya teknisi yang bisa tutup request.' }, { status: 403 })
      if (req.status !== 'in_progress')
        return NextResponse.json({ error: 'Request belum in progress.' }, { status: 400 })
      if (!body.perbaikan)
        return NextResponse.json({ error: 'Catatan perbaikan wajib diisi.' }, { status: 400 })
      if (!body.penyebab)
        return NextResponse.json({ error: 'Penyebab wajib diisi.' }, { status: 400 })

      // Hitung downtime
      const start = new Date(req.created_at)
      const end   = new Date()
      const downtime_menit = Math.round((end - start) / 60000)

      updates = { ...updates, status: 'closed',
        penyebab: body.penyebab, perbaikan: body.perbaikan,
        spare_part: body.spare_part || null,
        downtime_menit, completed_at: new Date().toISOString() }
    }

    else {
      return NextResponse.json({ error: 'Action tidak valid.' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('maintenance_requests')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ data })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}