$urlPharma = "https://jbaucxebzxgsirpycirp.supabase.co/rest/v1/pharmacies";
$urlMeds = "https://jbaucxebzxgsirpycirp.supabase.co/rest/v1/medicines";
$key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiYXVjeGVienhnc2lycHljaXJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3NDMyNTIsImV4cCI6MjEwMTMxOTI1Mn0.FVC4ilQsWldp5niRV6c9D5ehKYTBdoM7i5GM1H0p1No";

$headers = @{
    "apikey" = $key;
    "Authorization" = "Bearer $key";
    "Content-Type" = "application/json";
    "Prefer" = "resolution=merge-duplicates";
};

try {
    $pBody = Get-Content "c:\Projects\project\scratch\pharmacies.json" -Raw;
    $resP = Invoke-RestMethod -Uri $urlPharma -Method Post -Headers $headers -Body $pBody;
    Write-Output "Pharmacies seeded!";
} catch {
    Write-Output "Pharma error: $($_.Exception.Message)";
}

try {
    $mBody = Get-Content "c:\Projects\project\scratch\medicines.json" -Raw;
    $resM = Invoke-RestMethod -Uri $urlMeds -Method Post -Headers $headers -Body $mBody;
    Write-Output "SUCCESS: 40 Medicines seeded into Supabase database!";
} catch {
    Write-Output "Meds error: $($_.Exception.Message)";
}
