const SUPABASE_URL = "https://hckekiikqaaaavmblgnb.supabase.co";
const ANON_KEY = "sb_publishable_XbE3NuTizgRjNzXj-aR-3A_ynRbeYtA";

async function initPlans() {
  console.log("Triggering init-plans function...");
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/init-plans`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${ANON_KEY}`,
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error:", error);
  }
}

initPlans();
