import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let status = 400;

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      status = 401;
      throw new Error('Missing Authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      status = 500;
      throw new Error('Server credentials are not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      status = 401;
      throw new Error('Invalid or expired session');
    }

    const userId = user.id;
    const body = await req.json().catch(() => ({}));

    // Handle delete action
    if (body.action === 'delete' && body.fileName) {
      const fileName = body.fileName;
      if (typeof fileName !== 'string' || fileName.includes('/') || fileName.includes('\\') || fileName.includes('..')) {
        status = 400;
        throw new Error('Invalid file name');
      }

      const filePath = `${userId}/${fileName}`;
      const { error: deleteError } = await supabase.storage.from('reports').remove([filePath]);
      if (deleteError) {
        status = 500;
        throw deleteError;
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ message: "Skeleton active", userId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Edge Function error:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status,
    });
  }
});
