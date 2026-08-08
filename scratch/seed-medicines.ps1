$url = "https://jbaucxebzxgsirpycirp.supabase.co/rest/v1/medicines";
$key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiYXVjeGVienhnc2lycHljaXJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3NDMyNTIsImV4cCI6MjEwMTMxOTI1Mn0.FVC4ilQsWldp5niRV6c9D5ehKYTBdoM7i5GM1H0p1No";

$headers = @{
    "apikey" = $key;
    "Authorization" = "Bearer $key";
    "Content-Type" = "application/json";
    "Prefer" = "resolution=merge-duplicates";
};

$jsonPath = "c:\Projects\project\lib\medicine-catalog.ts";
$tsContent = Get-Content $jsonPath -Raw;

# Extract SAMPLE_MEDICINES array
$jsonStr = $tsContent -replace '(?s).*export const SAMPLE_MEDICINES: Medicine\[\] = ', '' -replace ';\s*$', '';

# Send to Supabase REST API
try {
    $response = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $jsonStr;
    Write-Output "Successfully seeded 40 medicines into Supabase remote database!";
} catch {
    Write-Output "Supabase REST API Error: $_";
}
