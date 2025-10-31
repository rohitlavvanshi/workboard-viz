import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting scheduled task creation job...');
    
    // Create Supabase client with service role key for admin access
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current timestamp
    const now = new Date();
    console.log(`Current time: ${now.toISOString()}`);

    // Query template tasks that are due for creation
    const { data: templateTasks, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('is_template', true)
      .lte('next_scheduled_at', now.toISOString())
      .not('next_scheduled_at', 'is', null);

    if (fetchError) {
      console.error('Error fetching template tasks:', fetchError);
      throw fetchError;
    }

    // Fetch all users to get names for webhook
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name');

    if (usersError) {
      console.error('Error fetching users:', usersError);
    }

    console.log(`Found ${templateTasks?.length || 0} template tasks to process`);

    const createdTasks = [];
    const errors = [];

    // Process each template task
    for (const template of templateTasks || []) {
      try {
        console.log(`Processing template task: ${template.id} - ${template.title}`);

        // Create new task instance
        const newTask = {
          user_id: template.user_id,
          title: template.title,
          description: template.description,
          frequency: template.frequency,
          scheduled_day: template.scheduled_day,
          status: template.status,
          chat_status: template.chat_status,
          parent_task_id: template.id,
          is_template: false,
          created_at: now.toISOString(),
        };

        const { data: createdTask, error: insertError } = await supabase
          .from('tasks')
          .insert(newTask)
          .select()
          .single();

        if (insertError) {
          console.error(`Error creating task instance for template ${template.id}:`, insertError);
          errors.push({ templateId: template.id, error: insertError.message });
          continue;
        }

        console.log(`Created task instance: ${createdTask.id}`);
        createdTasks.push(createdTask);

        // Send webhook notification
        try {
          const assignedUser = users?.find((u: any) => u.id === template.user_id);
          
          await fetch("https://alpharc.app.n8n.cloud/webhook/ad751273-410c-46d2-a41e-b3ae9f53e8ff", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: createdTask.id,
              title: createdTask.title,
              description: createdTask.description,
              user_id: createdTask.user_id,
              user_name: assignedUser?.name || "Unknown User",
              frequency: createdTask.frequency,
              scheduled_day: createdTask.scheduled_day,
              status: createdTask.status,
              created_at: createdTask.created_at,
            }),
          });
          
          console.log(`Webhook sent for task ${createdTask.id}`);
        } catch (webhookError) {
          console.error(`Error sending webhook for task ${createdTask.id}:`, webhookError);
          // Don't fail the entire process if webhook fails
        }

        // Calculate next scheduled date based on frequency
        let nextScheduledAt: Date | null = new Date(now);
        
        switch (template.frequency) {
          case 'daily':
            nextScheduledAt.setDate(nextScheduledAt.getDate() + 1);
            break;
          case 'monthly':
            nextScheduledAt.setMonth(nextScheduledAt.getMonth() + 1);
            if (template.scheduled_day) {
              nextScheduledAt.setDate(Math.min(template.scheduled_day, 28)); // Avoid invalid dates
            }
            break;
          case 'quarterly':
            nextScheduledAt.setMonth(nextScheduledAt.getMonth() + 3);
            if (template.scheduled_day) {
              nextScheduledAt.setDate(Math.min(template.scheduled_day, 28));
            }
            break;
          case 'semi_annually':
            nextScheduledAt.setMonth(nextScheduledAt.getMonth() + 6);
            if (template.scheduled_day) {
              nextScheduledAt.setDate(Math.min(template.scheduled_day, 28));
            }
            break;
          case 'annually':
            nextScheduledAt.setFullYear(nextScheduledAt.getFullYear() + 1);
            if (template.scheduled_day) {
              nextScheduledAt.setDate(Math.min(template.scheduled_day, 28));
            }
            break;
          default:
            // For one_time or unknown, don't schedule again
            nextScheduledAt = null;
        }

        // Update template with new scheduling info
        const updateData: any = {
          last_created_at: now.toISOString(),
        };

        if (nextScheduledAt) {
          updateData.next_scheduled_at = nextScheduledAt.toISOString();
          console.log(`Next scheduled at: ${nextScheduledAt.toISOString()}`);
        } else {
          updateData.next_scheduled_at = null;
          console.log('No next schedule (one-time task)');
        }

        const { error: updateError } = await supabase
          .from('tasks')
          .update(updateData)
          .eq('id', template.id);

        if (updateError) {
          console.error(`Error updating template ${template.id}:`, updateError);
          errors.push({ templateId: template.id, error: updateError.message });
        }

      } catch (error) {
        console.error(`Error processing template ${template.id}:`, error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push({ templateId: template.id, error: errorMessage });
      }
    }

    const summary = {
      timestamp: now.toISOString(),
      templatesProcessed: templateTasks?.length || 0,
      tasksCreated: createdTasks.length,
      errors: errors.length,
      errorDetails: errors,
    };

    console.log('Job completed:', summary);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Fatal error in create-scheduled-tasks function:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
