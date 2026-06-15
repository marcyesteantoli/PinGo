// Uploads a sample PDF to Supabase Storage for each demo document
// and updates file_url with a 1-year signed URL (same flow as the app).
// Run: node scripts/seed-sample-pdfs.js

const { createClient } = require('@supabase/supabase-js')
const https = require('https')

const SUPABASE_URL = 'https://kvxhmcpnehcjkxctwgne.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_wP71AbmeyI0lP8Qs3i9T9g_rbVy9R5l'
const TEST_EMAIL = 'test@tripsync.app'
const TEST_PASSWORD = 'Tripsync2024!'

const TRIP_ID = 'aa000002-0000-0000-0000-000000000000'
const UPLOADED_BY = '11111111-1111-1111-1111-111111111111'

// Sample PDF URL (Mozilla PDF.js test — small, reliable, public)
const SAMPLE_PDF_URL = 'https://raw.githubusercontent.com/mozilla/pdf.js/master/test/pdfs/basicapi.pdf'

const DOCUMENTS = [
  { id: 'cc000001-0000-0000-0000-000000000000', exp_id: 'bb000011-0000-0000-0000-000000000000', name: 'billete_iberia_ib6827' },
  { id: 'cc000002-0000-0000-0000-000000000000', exp_id: 'bb000011-0000-0000-0000-000000000000', name: 'tarjeta_embarque_ida' },
  { id: 'cc000003-0000-0000-0000-000000000000', exp_id: 'bb000012-0000-0000-0000-000000000000', name: 'confirmacion_park_hyatt' },
  { id: 'cc000004-0000-0000-0000-000000000000', exp_id: 'bb000012-0000-0000-0000-000000000000', name: 'seguro_viaje_japon' },
  { id: 'cc000005-0000-0000-0000-000000000000', exp_id: 'bb000014-0000-0000-0000-000000000000', name: 'reserva_sushi_saito' },
  { id: 'cc000006-0000-0000-0000-000000000000', exp_id: 'bb000015-0000-0000-0000-000000000000', name: 'confirmacion_ryokan_hakone' },
  { id: 'cc000007-0000-0000-0000-000000000000', exp_id: 'bb000015-0000-0000-0000-000000000000', name: 'japan_rail_pass_7dias' },
  { id: 'cc000008-0000-0000-0000-000000000000', exp_id: 'bb000016-0000-0000-0000-000000000000', name: 'permiso_ascenso_fuji' },
  { id: 'cc000009-0000-0000-0000-000000000000', exp_id: 'bb000016-0000-0000-0000-000000000000', name: 'ticket_guia_montana' },
  { id: 'cc000010-0000-0000-0000-000000000000', exp_id: 'bb000017-0000-0000-0000-000000000000', name: 'billete_ana_nh214' },
  { id: 'cc000011-0000-0000-0000-000000000000', exp_id: 'bb000017-0000-0000-0000-000000000000', name: 'tarjeta_embarque_vuelta' },
]

function downloadBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return resolve(downloadBuffer(res.headers.location))
      }
      const chunks = []
      res.on('data', (c) => chunks.push(c))
      res.on('end', () => resolve(Buffer.concat(chunks)))
      res.on('error', reject)
    }).on('error', reject)
  })
}

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  console.log('Signing in as test user...')
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  })
  if (authError) { console.error('Auth failed:', authError.message); process.exit(1) }
  console.log('Signed in OK')

  console.log('Downloading sample PDF...')
  const pdfBuffer = await downloadBuffer(SAMPLE_PDF_URL)
  console.log(`Downloaded ${pdfBuffer.length} bytes`)

  for (const doc of DOCUMENTS) {
    const storagePath = `documents/${TRIP_ID}/${doc.exp_id}/${UPLOADED_BY}_${doc.name}.pdf`

    // Upload (upsert to overwrite if re-running)
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, pdfBuffer, {
        upsert: true,
        contentType: 'application/pdf',
      })

    if (uploadError) {
      console.error(`  UPLOAD ERROR [${doc.name}]:`, uploadError.message)
      continue
    }

    // Signed URL (365 days — same as app)
    const { data: signedData, error: urlError } = await supabase.storage
      .from('documents')
      .createSignedUrl(storagePath, 365 * 24 * 60 * 60)

    if (urlError || !signedData) {
      console.error(`  SIGNED URL ERROR [${doc.name}]:`, urlError?.message)
      continue
    }

    // Update DB record
    const { error: dbError } = await supabase
      .from('documents')
      .update({ file_url: signedData.signedUrl })
      .eq('id', doc.id)

    if (dbError) {
      console.error(`  DB ERROR [${doc.name}]:`, dbError.message)
    } else {
      console.log(`  OK: ${doc.name}`)
    }
  }

  console.log('\nDone.')
  process.exit(0)
}

main().catch((e) => { console.error(e); process.exit(1) })
