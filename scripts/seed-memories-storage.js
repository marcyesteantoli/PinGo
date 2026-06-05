// Downloads images and uploads them to the memories Storage bucket.
// Updates image_url in DB with the storage path (app signs URLs at read time).
// Run: node scripts/seed-memories-storage.js

const { createClient } = require('@supabase/supabase-js')
const https = require('https')
const http = require('http')

const SUPABASE_URL = 'https://kvxhmcpnehcjkxctwgne.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_wP71AbmeyI0lP8Qs3i9T9g_rbVy9R5l'
const TEST_EMAIL = 'test@tripsync.app'
const TEST_PASSWORD = 'Tripsync2024!'

const MEMORIES = [
  // Escapada a Roma (aa000001)
  {
    id: 'dd000001-0000-0000-0000-000000000000',
    tripId: 'aa000001-0000-0000-0000-000000000000',
    url: 'https://picsum.photos/seed/colosseum/800/600',
  },
  {
    id: 'dd000002-0000-0000-0000-000000000000',
    tripId: 'aa000001-0000-0000-0000-000000000000',
    url: 'https://picsum.photos/seed/italyfood/800/600',
  },
  {
    id: 'dd000003-0000-0000-0000-000000000000',
    tripId: 'aa000001-0000-0000-0000-000000000000',
    url: 'https://picsum.photos/seed/vatican/800/600',
  },
  {
    id: 'dd000004-0000-0000-0000-000000000000',
    tripId: 'aa000001-0000-0000-0000-000000000000',
    url: 'https://picsum.photos/seed/rome_sunset/800/600',
  },
  {
    id: 'dd000005-0000-0000-0000-000000000000',
    tripId: 'aa000001-0000-0000-0000-000000000000',
    url: 'https://picsum.photos/seed/fontana/800/600',
  },
  {
    id: 'dd000006-0000-0000-0000-000000000000',
    tripId: 'aa000001-0000-0000-0000-000000000000',
    url: 'https://picsum.photos/seed/rome_group/800/600',
  },
  // Aventura en Japón (aa000002)
  {
    id: 'dd000012-0000-0000-0000-000000000000',
    tripId: 'aa000002-0000-0000-0000-000000000000',
    url: 'https://picsum.photos/seed/sensoji/800/600',
  },
  // Road Trip por Europa (cc000001)
  {
    id: 'ff100001-0000-0000-0000-000000000001',
    tripId: 'cc000001-0000-0000-0000-000000000000',
    url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80',
  },
  {
    id: 'ff100001-0000-0000-0000-000000000002',
    tripId: 'cc000001-0000-0000-0000-000000000000',
    url: 'https://images.unsplash.com/photo-1431274172761-fcdab704a338?w=800&q=80',
  },
  {
    id: 'ff100001-0000-0000-0000-000000000003',
    tripId: 'cc000001-0000-0000-0000-000000000000',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
  },
  {
    id: 'ff100001-0000-0000-0000-000000000004',
    tripId: 'cc000001-0000-0000-0000-000000000000',
    url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
  },
  {
    id: 'ff100001-0000-0000-0000-000000000005',
    tripId: 'cc000001-0000-0000-0000-000000000000',
    url: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800&q=80',
  },
  {
    id: 'ff100001-0000-0000-0000-000000000006',
    tripId: 'cc000001-0000-0000-0000-000000000000',
    url: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=80',
  },
  {
    id: 'ff100001-0000-0000-0000-000000000007',
    tripId: 'cc000001-0000-0000-0000-000000000000',
    url: 'https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=800&q=80',
  },
  {
    id: 'ff100001-0000-0000-0000-000000000008',
    tripId: 'cc000001-0000-0000-0000-000000000000',
    url: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800&q=80',
  },
  {
    id: 'ff100001-0000-0000-0000-000000000009',
    tripId: 'cc000001-0000-0000-0000-000000000000',
    url: 'https://images.unsplash.com/photo-1466442929976-97f336a657be?w=800&q=80',
  },
  {
    id: 'ff100001-0000-0000-0000-00000000000a',
    tripId: 'cc000001-0000-0000-0000-000000000000',
    url: 'https://images.unsplash.com/photo-1601918774946-25832a4be0d6?w=800&q=80',
  },
  {
    id: 'ff100001-0000-0000-0000-00000000000b',
    tripId: 'cc000001-0000-0000-0000-000000000000',
    url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=80',
  },
]

function downloadBuffer(url, redirectCount = 0) {
  if (redirectCount > 5) return Promise.reject(new Error('Too many redirects'))
  const lib = url.startsWith('https') ? https : http
  return new Promise((resolve, reject) => {
    lib
      .get(url, { headers: { 'User-Agent': 'TripSync-Seed/1.0' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return resolve(downloadBuffer(res.headers.location, redirectCount + 1))
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode} for ${url}`))
        }
        const chunks = []
        res.on('data', (c) => chunks.push(c))
        res.on('end', () => resolve(Buffer.concat(chunks)))
        res.on('error', reject)
      })
      .on('error', reject)
  })
}

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  console.log('Signing in as test user...')
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  })
  if (authError) {
    console.error('Auth failed:', authError.message)
    process.exit(1)
  }
  console.log('Signed in OK\n')

  let ok = 0
  let fail = 0

  for (const mem of MEMORIES) {
    const storagePath = `memories/${mem.tripId}/${mem.id}.jpg`
    process.stdout.write(`  [${mem.id.slice(-4)}] downloading...`)

    let imageBuffer
    try {
      imageBuffer = await downloadBuffer(mem.url)
      process.stdout.write(` ${imageBuffer.length}b → uploading...`)
    } catch (e) {
      console.log(` DOWNLOAD ERROR: ${e.message}`)
      fail++
      continue
    }

    const { error: uploadError } = await supabase.storage
      .from('memories')
      .upload(storagePath, imageBuffer, { contentType: 'image/jpeg', upsert: true })

    if (uploadError) {
      console.log(` UPLOAD ERROR: ${uploadError.message}`)
      fail++
      continue
    }

    process.stdout.write(' uploaded → updating DB...')

    const { error: dbError } = await supabase
      .from('memories')
      .update({ image_url: storagePath })
      .eq('id', mem.id)

    if (dbError) {
      console.log(` DB ERROR: ${dbError.message}`)
      fail++
    } else {
      console.log(' OK')
      ok++
    }
  }

  console.log(`\nDone. ${ok} OK, ${fail} failed.`)
  process.exit(fail > 0 ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
