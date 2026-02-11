import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Initialize Supabase Client with Service Role Key for Admin actions
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Verify the Caller is an Admin
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // Get user from the JWT (Caller)
        const { data: { user: caller }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))

        if (authError || !caller) {
            return new Response(JSON.stringify({ error: 'Invalid Token' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // Check caller role in profiles
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', caller.id).single()

        if (profile?.role !== 'admin') {
            return new Response(JSON.stringify({ error: "Unauthorized: Admins only" }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // Process the Request
        const { users } = await req.json()
        if (!users || !Array.isArray(users)) {
            throw new Error("Invalid or missing 'users' array")
        }

        const results = { success: 0, failed: 0, errors: [] as any[] }

        // Loop through users
        // Note: Sequential loop to avoid rate limits if any, but Promise.all is faster for small batches. 
        // Staying sequential for safety/simplicity in debugging.
        for (const u of users) {
            try {
                // 1. Create Auth User
                const { data: authData, error: createError } = await supabase.auth.admin.createUser({
                    email: u.email,
                    password: u.password || 'default123',
                    email_confirm: true,
                    user_metadata: { role: 'student' }
                })

                if (createError) throw createError
                if (!authData.user) throw new Error("User creation returned no data")

                // 2. Upsert Profile (Trigger might exist, but we need to set extra fields)
                const { error: profileError } = await supabase.from('profiles').upsert({
                    id: authData.user.id,
                    email: u.email,
                    full_name: u.full_name,
                    role: 'student',
                    department: u.department,
                    semester: u.semester,
                    section: u.section,
                    phone: u.phone,
                    academic_year: u.academic_year || '2025-2026'
                })

                if (profileError) {
                    // If profile update fails, we have an auth user but incomplete profile.
                    // Could delete Auth user here for atomicity, but keeping it simple.
                    throw profileError
                }

                results.success++
            } catch (err: any) {
                results.failed++
                results.errors.push({ email: u.email, error: err.message })
            }
        }

        return new Response(JSON.stringify(results), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
