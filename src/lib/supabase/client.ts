import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const createMockClient = () => {
    console.warn("⚠️ Supabase credentials not found. Using mock client. Realtime features will not work.");

    return {
        from: (table: string) => ({
            insert: async (data: any) => {
                console.log(`[Mock Supabase] Inserting into ${table}:`, data);
                return { data: null, error: null };
            },
            select: (query: string) => ({
                eq: (column: string, value: any) => ({
                    single: async () => ({ data: null, error: null }),
                    order: (col: string, opts: any) => ({
                        limit: (n: number) => async () => ({ data: [], error: null })
                    })
                })
            })
        }),
        channel: (name: string) => ({
            on: (type: string, filter: any, callback: any) => ({
                subscribe: () => console.log(`[Mock Supabase] Subscribed to channel: ${name}`)
            }),
            subscribe: () => console.log(`[Mock Supabase] Subscribed to channel: ${name}`)
        })
    } as any;
};

export const supabase = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey)
    : createMockClient();
