import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, divisi')
      .eq('id', user.id)
      .single()

    // Query berdasarkan role
    let query = supabase.from('maintenance_requests').select('status, mesin_stop, downtime_menit')

    if (profile.role === 'operator')
      query = query.eq('operator_id', user.id)
    else if (profile.role === 'supervisor' && profile.divisi !== 'ALL')
      query = query.eq('divisi', profile.divisi)
    else if (profile.role === 'technician')
      query = query.eq('teknisi_id', user.id)

    const { data, error } = await query
    if (error) throw error

    const c = s => data.filter(r => r.status === s).length
    const closed = data.filter(r => r.status === 'closed' && r.downtime_menit > 0)
    const times  = closed.map(r => r.downtime_menit)

    const fmtDurasi = m => {
      if (!m || m <= 0) return '—'
      if (m < 60) return m + ' mnt'
      const j = Math.floor(m / 60), s = m % 60
      if (j < 24) return j + 'j ' + (s > 0 ? s + 'mnt' : '')
      const h = Math.floor(j / 24), sj = j % 24
      return h + 'hr ' + (sj > 0 ? sj + 'j' : '')
    }

    return NextResponse.json({
      data: {
        total:       data.length,
        pending:     c('pending'),
        approved:    c('approved'),
        in_progress: c('in_progress'),
        closed:      c('closed'),
        rejected:    c('rejected'),
        mesin_stop:  data.filter(r => r.mesin_stop === 'Yes').length,
        downtime: {
          total_kasus: times.length,
          avg_label: times.length ? fmtDurasi(Math.round(times.reduce((a,b)=>a+b,0)/times.length)) : '—',
          max_label: times.length ? fmtDurasi(Math.max(...times)) : '—',
          min_label: times.length ? fmtDurasi(Math.min(...times)) : '—',
        }
      }
    })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}