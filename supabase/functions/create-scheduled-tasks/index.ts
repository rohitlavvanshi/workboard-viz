import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting scheduled task creation job...');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const now = new Date();
    console.log(`Current time: ${now.toISOString()}`);

    const { data: templateTasks, error: fetchError } = await supabase
      .from('tasks')
      .select('*, clients(id, name)')
      .eq('is_template', true)
      .lte('next_scheduled_at', now.toISOString())
      .not('next_scheduled_at', 'is', null);

    if (fetchError) {
      console.error('Error fetching template tasks:', fetchError);
      throw fetchError;
    }

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, phone');

    if (usersError) {
      console.error('Error fetching users:', usersError);
    }

    const { data: allClients } = await supabase
      .from('clients')
      .select('id, name');

    console.log(`Found ${templateTasks?.length || 0} template tasks to process`);

    const createdTasks = [];
    const errors = [];

    for (const template of templateTasks || []) {
      try {
        console.log(`Processing template task: ${template.id} - ${template.title}`);

        const targetClients = template.client_id 
          ? [{ id: template.client_id }]
          : allClients || [];

        for (const client of targetClients) {
          const newTask = {
            user_id: template.user_id,
            title: template.title,
            description: template.description,
            client_id: client.id,
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
            console.error(`Error creating task instance:`, insertError);
            errors.push({ templateId: template.id, error: insertError.message });
            continue;
          }

          console.log(`Created task instance: ${createdTask.id}`);
          createdTasks.push(createdTask);

          try {
            const assignedUser = users?.find((u: any) => u.id === template.user_id);
            const clientInfo = allClients?.find((c: any) => c.id === client.id);
            
            await fetch("https://alpharc.app.n8n.cloud/webhook/ad751273-410c-46d2-a41e-b3ae9f53e8ff", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: createdTask.id,
                title: createdTask.title,
                description: createdTask.description,
                user_id: createdTask.user_id,
                user_name: assignedUser?.name || "Unknown User",
                phone: assignedUser?.phone || null,
                client_name: clientInfo?.name || null,
                frequency: createdTask.frequency,
                scheduled_day: createdTask.scheduled_day,
                status: createdTask.status,
                created_at: createdTask.created_at,
              }),
            });
            
            console.log(`Webhook sent for task ${createdTask.id}`);
          } catch (webhookError) {
            console.error(`Error sending webhook:`, webhookError);
          }
        }

        let nextScheduledAt: Date | null = new Date(now);
        
        switch (template.frequency) {
          case 'daily':
            nextScheduledAt.setDate(nextScheduledAt.getDate() + 1);
            break;
          case 'monthly':
            nextScheduledAt.setMonth(nextScheduledAt.getMonth() + 1);
            if (template.scheduled_day) {
              nextScheduledAt.setDate(Math.min(template.scheduled_day, 28));
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
            nextScheduledAt = null;
        }

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
        console.error(`Error processing template:`, error);
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
    console.error('Fatal error:', error);
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
