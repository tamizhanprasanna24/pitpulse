$url = "https://jbaucxebzxgsirpycirp.supabase.co/rest/v1/medicines";
$key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiYXVjeGVienhnc2lycHljaXJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3NDMyNTIsImV4cCI6MjEwMTMxOTI1Mn0.FVC4ilQsWldp5niRV6c9D5ehKYTBdoM7i5GM1H0p1No";
$headers = @{
    "apikey" = $key;
    "Authorization" = "Bearer $key";
    "Content-Type" = "application/json";
    "Prefer" = "return=representation";
};

$body = '[{"name":"Paracetamol","quantity":100,"price":25,"prescription_required":false,"category":"Fever"}]';

try {
    $res = Invoke-RestMethod -Uri $url -Headers $headers -Method Post -Body $body;
    Write-Output "POST SUCCESS!";
    Write-Output $res;
} catch {
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream());
    Write-Output "POST ERROR: $($reader.ReadToEnd())";
}
