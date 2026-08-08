$url = "https://jbaucxebzxgsirpycirp.supabase.co/rest/v1/medicines";
$key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiYXVjeGVienhnc2lycHljaXJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3NDMyNTIsImV4cCI6MjEwMTMxOTI1Mn0.FVC4ilQsWldp5niRV6c9D5ehKYTBdoM7i5GM1H0p1No";
$headers = @{
    "apikey" = $key;
    "Authorization" = "Bearer $key";
};

try {
    $res = Invoke-RestMethod -Uri $url -Headers $headers -Method Get;
    Write-Output "SUCCESSS GET: $($res.Count) medicines currently in Supabase database!";
} catch {
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream());
    Write-Output "GET ERROR: $($reader.ReadToEnd())";
}
