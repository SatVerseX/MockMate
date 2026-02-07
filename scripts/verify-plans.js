const SUPABASE_URL = "https://hckekiikqaaaavmblgnb.supabase.co";
const ANON_KEY = "sb_publishable_XbE3NuTizgRjNzXj-aR-3A_ynRbeYtA";

async function verifyPlans() {
  console.log("Verifying plans in DB...");
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/plans?select=*`, {
      method: "GET",
      headers: {
        "apikey": ANON_KEY,
        "Authorization": `Bearer ${ANON_KEY}`,
      }
    });

    const data = await response.json();
    console.log("Plans in DB:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error:", error);
  }
}

verifyPlans();
