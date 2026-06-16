export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    // CORS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;
    
    // Bind to the COACH_TRACKER_KV namespace
    const db = env.COACH_TRACKER_KV;
    if (!db) {
      return new Response(JSON.stringify({ error: "KV binding COACH_TRACKER_KV is missing in Cloudflare settings" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" }
      });
    }

    try {
      // 1. CLIENTS ROUTES
      if (path === "/api/clients") {
        if (request.method === "GET") {
          const list = await db.list({ prefix: "client:" });
          const clients = (await Promise.all(
            list.keys.map(async (key) => {
              const val = await db.get(key.name);
              return val ? JSON.parse(val) : null;
            })
          )).filter(Boolean);
          return new Response(JSON.stringify(clients), {
            headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" }
          });
        }
        
        if (request.method === "POST" || request.method === "PUT") {
          const client = await request.json();
          if (!client.id) {
            return new Response(JSON.stringify({ error: "Missing client id" }), {
              status: 400,
              headers: corsHeaders
            });
          }
          await db.put(`client:${client.id}`, JSON.stringify(client));
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" }
          });
        }
      }

      if (path.startsWith("/api/clients/")) {
        const id = path.split("/").pop();
        if (request.method === "DELETE") {
          // Delete client
          await db.delete(`client:${id}`);
          
          // Delete associated weekly reports
          const weeklyList = await db.list({ prefix: "weekly:" });
          for (const key of weeklyList.keys) {
            const val = await db.get(key.name);
            if (val) {
              const r = JSON.parse(val);
              if (r.clientId === id) {
                await db.delete(key.name);
              }
            }
          }

          // Delete associated monthly reports
          const monthlyList = await db.list({ prefix: "monthly:" });
          for (const key of monthlyList.keys) {
            const val = await db.get(key.name);
            if (val) {
              const r = JSON.parse(val);
              if (r.clientId === id) {
                await db.delete(key.name);
              }
            }
          }

          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" }
          });
        }
      }

      // 2. WEEKLY REPORTS ROUTES
      if (path === "/api/weeklyReports") {
        if (request.method === "GET") {
          const clientId = url.searchParams.get("clientId");
          const list = await db.list({ prefix: "weekly:" });
          const reports = (await Promise.all(
            list.keys.map(async (key) => {
              const val = await db.get(key.name);
              if (val) {
                const r = JSON.parse(val);
                if (!clientId || r.clientId === clientId) {
                  return r;
                }
              }
              return null;
            })
          )).filter(Boolean);
          reports.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          return new Response(JSON.stringify(reports), {
            headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" }
          });
        }

        if (request.method === "POST" || request.method === "PUT") {
          const report = await request.json();
          if (!report.id) {
            return new Response(JSON.stringify({ error: "Missing report id" }), {
              status: 400,
              headers: corsHeaders
            });
          }
          await db.put(`weekly:${report.id}`, JSON.stringify(report));
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" }
          });
        }
      }

      if (path.startsWith("/api/weeklyReports/")) {
        const id = path.split("/").pop();
        if (request.method === "DELETE") {
          await db.delete(`weekly:${id}`);
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" }
          });
        }
      }

      // 3. MONTHLY REPORTS ROUTES
      if (path === "/api/monthlyReports") {
        if (request.method === "GET") {
          const clientId = url.searchParams.get("clientId");
          const list = await db.list({ prefix: "monthly:" });
          const reports = (await Promise.all(
            list.keys.map(async (key) => {
              const val = await db.get(key.name);
              if (val) {
                const r = JSON.parse(val);
                if (!clientId || r.clientId === clientId) {
                  return r;
                }
              }
              return null;
            })
          )).filter(Boolean);
          reports.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          return new Response(JSON.stringify(reports), {
            headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" }
          });
        }

        if (request.method === "POST" || request.method === "PUT") {
          const report = await request.json();
          if (!report.id) {
            return new Response(JSON.stringify({ error: "Missing report id" }), {
              status: 400,
              headers: corsHeaders
            });
          }
          await db.put(`monthly:${report.id}`, JSON.stringify(report));
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" }
          });
        }
      }

      if (path.startsWith("/api/monthlyReports/")) {
        const id = path.split("/").pop();
        if (request.method === "DELETE") {
          await db.delete(`monthly:${id}`);
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" }
          });
        }
      }

      return new Response(JSON.stringify({ error: "Endpoint Not Found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" }
      });

    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" }
      });
    }
  }
};
