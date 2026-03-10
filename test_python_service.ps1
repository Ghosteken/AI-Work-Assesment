# Test data for the Python Briefing Generator
$briefingData = @{
    companyName = "Tesla Motors"
    ticker = "tsla"
    sector = "Automotive & Energy"
    analystName = "Alex Rivera"
    summary = "Tesla continues to dominate the EV market with its next-gen battery tech and Cybertruck ramp-up, despite increasing global competition."
    recommendation = "Overweight: Target $250"
    keyPoints = @(
        "Battery cell production at Giga Nevada hit a record high.",
        "FSD v12 adoption rate exceeded internal projections.",
        "Cybertruck production is currently at 2,000 units per week."
    )
    risks = @(
        "Lowering average selling price (ASP) may pressure margins.",
        "Increased regulatory scrutiny over Autopilot software."
    )
    metrics = @(
        @{ name = "Delivery Growth"; value = "38% YoY" }
        @{ name = "Gross Margin"; value = "17.6%" }
        @{ name = "Market Share"; value = "51% (US EV)" }
    )
} | ConvertTo-Json -Depth 5

Write-Host "1. Creating briefing for $($briefingData.companyName)..."
$createResp = Invoke-RestMethod -Uri "http://localhost:8000/briefings" -Method Post -Body $briefingData -ContentType "application/json"
$id = $createResp.id
Write-Host "Briefing created with ID: $id"

Write-Host "`n2. Generating HTML report..."
$genResp = Invoke-RestMethod -Uri "http://localhost:8000/briefings/$id/generate" -Method Post
Write-Host "Report generated successfully."

Write-Host "`n3. Viewing structured data..."
$getResp = Invoke-RestMethod -Uri "http://localhost:8000/briefings/$id" -Method Get
$getResp | Format-List

Write-Host "`n--- TEST COMPLETE ---"
Write-Host "You can view the professional HTML report at: http://localhost:8000/briefings/$id/html"
