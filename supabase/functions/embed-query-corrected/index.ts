import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

interface EmbedRequest {
  content: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { content }: EmbedRequest = await req.json();

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Content is required and must be a non-empty string'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      );
    }

    console.log('🔍 Generating embedding for content:', content.substring(0, 100) + '...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Use Supabase AI inference with correct RPC call
    const { data: embeddingData, error: embeddingError } = await supabase.rpc('embed', {
      model: 'gte-small',
      input: content.trim()
    });

    if (embeddingError) {
      console.error('❌ Supabase AI embedding error:', embeddingError);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Embedding generation failed: ${embeddingError.message}`,
          details: embeddingError
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        },
      );
    }

    // Validate embedding data - Supabase AI returns embedding directly as array
    if (!embeddingData || !Array.isArray(embeddingData) || embeddingData.length !== 384) {
      console.error('❌ Invalid embedding response:', {
        isArray: Array.isArray(embeddingData),
        length: embeddingData?.length,
        expected: 384
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: `Invalid embedding response: expected 384-dim array, got ${embeddingData?.length || 'unknown'}`
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        },
      );
    }

    console.log('✅ Successfully generated 384-dimensional embedding');

    return new Response(
      JSON.stringify({
        success: true,
        embedding: embeddingData,
        dimensions: embeddingData.length,
        model: 'gte-small'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );

  } catch (error) {
    console.error('💥 Fatal error in embed-query function:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: error.stack
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
}); 