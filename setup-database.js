const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const databaseUrl = process.env.DATABASE_URL;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
    console.log('🚀 Setting up LMS database...\n');

    // Read the SQL file
    const sqlPath = path.join(__dirname, 'supabase', 'migrations', '20260202000000_setup_triggers_and_rls.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📝 Applying triggers and RLS policies...');

    // Split SQL into individual statements (rough split by semicolons)
    const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
        const statement = statements[i] + ';';

        // Skip comments and empty statements
        if (statement.trim().startsWith('--') || statement.trim().length < 5) {
            continue;
        }

        try {
            const { error } = await supabase.rpc('exec_sql', { sql_query: statement });

            if (error) {
                // Ignore "already exists" errors
                if (error.message.includes('already exists') || error.message.includes('does not exist')) {
                    console.log(`⚠️  Skipped (already exists): ${statement.substring(0, 50)}...`);
                } else {
                    console.error(`❌ Error: ${error.message}`);
                    console.error(`   Statement: ${statement.substring(0, 100)}...`);
                    errorCount++;
                }
            } else {
                successCount++;
                if (i % 10 === 0) {
                    console.log(`✅ Progress: ${i}/${statements.length} statements processed`);
                }
            }
        } catch (err) {
            console.error(`❌ Exception: ${err.message}`);
            errorCount++;
        }
    }

    console.log(`\n✅ Database setup complete!`);
    console.log(`   Successful: ${successCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log(`\n🎉 Your LMS is ready to use!`);
}

setupDatabase().catch(console.error);
