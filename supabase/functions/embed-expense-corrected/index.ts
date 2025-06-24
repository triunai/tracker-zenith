import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

interface EmbeddingJob {
  id: number;
  table_name: string;
  record_id: number;
  content: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🚀 Starting batch embedding processing (expense-only MVP)...');

    // Get pending embedding jobs (expense only, up to 50 at a time)
    const { data: jobs, error: jobsError } = await supabase.rpc('get_pending_embedding_jobs', {
      p_limit: 50
    });

    if (jobsError) {
      console.error('❌ Error fetching jobs:', jobsError);
      throw new Error(`Failed to fetch jobs: ${jobsError.message}`);
    }

    if (!jobs || jobs.length === 0) {
      console.log('✅ No pending embedding jobs found');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No pending jobs', 
          processed: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📊 Found ${jobs.length} pending expense jobs to process`);

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Process each job
    for (const job of jobs as EmbeddingJob[]) {
      try {
        console.log(`🔄 Processing job ${job.id} for ${job.table_name}:${job.record_id}`);

        // Validate that this is an expense job (MVP safety check)
        if (job.table_name !== 'expense') {
          console.warn(`⚠️ Skipping non-expense job: ${job.table_name}`);
          continue;
        }

        // Mark job as processing
        await supabase.rpc('update_embedding_job_status', {
          p_job_id: job.id,
          p_status: 'processing'
        });

        // Generate embedding using Supabase AI inference
        const { data: embeddingData, error: embeddingError } = await supabase.rpc('embed', {
          model: 'gte-small',
          input: job.content
        });

        if (embeddingError) {
          console.error(`❌ Embedding error for job ${job.id}:`, embeddingError);
          
          await supabase.rpc('update_embedding_job_status', {
            p_job_id: job.id,
            p_status: 'failed',
            p_error_message: `Embedding generation failed: ${embeddingError.message}`
          });
          
          errors.push(`Job ${job.id}: ${embeddingError.message}`);
          errorCount++;
          continue;
        }

        if (!embeddingData || !Array.isArray(embeddingData) || embeddingData.length !== 384) {
          console.error(`❌ Invalid embedding dimensions for job ${job.id}:`, {
            isArray: Array.isArray(embeddingData),
            length: embeddingData?.length,
            expected: 384
          });
          
          await supabase.rpc('update_embedding_job_status', {
            p_job_id: job.id,
            p_status: 'failed',
            p_error_message: `Invalid embedding dimensions: ${embeddingData?.length || 'unknown'} (expected 384)`
          });
          
          errors.push(`Job ${job.id}: Wrong dimensions (${embeddingData?.length || 'unknown'})`);
          errorCount++;
          continue;
        }

        // Update the expense record with the embedding (expense-only MVP)
        const embeddingVector = `[${embeddingData.join(',')}]`;
        
        await supabase.rpc('update_record_embedding', {
          p_table_name: job.table_name,
          p_record_id: job.record_id,
          p_embedding: embeddingVector
        });

        // Mark job as completed
        await supabase.rpc('update_embedding_job_status', {
          p_job_id: job.id,
          p_status: 'completed'
        });

        console.log(`✅ Successfully processed expense job ${job.id}`);
        successCount++;

      } catch (error) {
        console.error(`💥 Unexpected error processing job ${job.id}:`, error);
        
        await supabase.rpc('update_embedding_job_status', {
          p_job_id: job.id,
          p_status: 'failed',
          p_error_message: `Unexpected error: ${error.message}`
        });
        
        errors.push(`Job ${job.id}: Unexpected error - ${error.message}`);
        errorCount++;
      }
    }

    console.log(`🏁 Batch processing complete: ${successCount} success, ${errorCount} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: jobs.length,
        successful: successCount,
        failed: errorCount,
        mvp_mode: 'expense_only',
        errors: errors.length > 0 ? errors : undefined
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );

  } catch (error) {
    console.error('💥 Fatal error in embed-expense function:', error);

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