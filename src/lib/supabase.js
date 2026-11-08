import { createClient } from '@insforge/sdk'

const insforgeUrl = process.env.NEXT_PUBLIC_INSFORGE_URL
const insforgeAnonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY

if (!insforgeUrl || !insforgeAnonKey) {
    throw new Error('InsForge URL or Anon Key is missing in .env')
}

// Public client for the browser (realtime). Row access is denied by RLS —
// privileged server-side InsForge access goes through createAdminClient in
// src/lib/adminData.js with INSFORGE_API_KEY.
export const supabase = createClient({
    baseUrl: insforgeUrl,
    anonKey: insforgeAnonKey
})
