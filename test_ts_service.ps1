# Test script for the TypeScript Candidate Summarization Service
$headers = @{
    "x-user-id" = "recruiter_test"
    "x-workspace-id" = "workspace_alpha"
}

Write-Host "1. Creating a new candidate..."
$candidateData = @{
    fullName = "Sarah Jenkins"
    email = "sarah.j@example.com"
} | ConvertTo-Json
$candidate = Invoke-RestMethod -Uri "http://localhost:3000/sample/candidates" -Method Post -Body $candidateData -Headers $headers -ContentType "application/json"
$candidateId = $candidate.id
Write-Host "Candidate Created: $($candidate.fullName) (ID: $candidateId)"

Write-Host "`n2. Uploading a candidate resume..."
$docData = @{
    documentType = "resume"
    fileName = "sarah_resume.txt"
    rawText = "Sarah is a Senior Frontend Engineer with 8 years of experience in React, TypeScript, and Next.js. She has led teams at two Fortune 500 companies and specializes in high-performance web applications."
} | ConvertTo-Json
$doc = Invoke-RestMethod -Uri "http://localhost:3000/candidates/$candidateId/documents" -Method Post -Body $docData -Headers $headers -ContentType "application/json"
Write-Host "Document Uploaded: $($doc.fileName)"

Write-Host "`n3. Requesting AI Summary generation..."
$summaryReq = Invoke-RestMethod -Uri "http://localhost:3000/candidates/$candidateId/summaries/generate" -Method Post -Headers $headers
$summaryId = $summaryReq.id
Write-Host "Summary Generation Queued (ID: $summaryId)"

Write-Host "`n4. Waiting for background processing (12 seconds)..."
Start-Sleep -Seconds 12

Write-Host "`n5. Retrieving the final AI summary..."
$summary = Invoke-RestMethod -Uri "http://localhost:3000/candidates/$candidateId/summaries/$summaryId" -Method Get -Headers $headers

Write-Host "`n--- AI SUMMARY RESULTS ---"
Write-Host "Status: $($summary.status)"
Write-Host "Score: $($summary.score)/100"
Write-Host "Recommendation: $($summary.recommendedDecision)"
Write-Host "`nStrengths:"
Write-Host $summary.strengths
Write-Host "`nSummary:"
Write-Host $summary.summary

Write-Host "`n--- TEST COMPLETE ---"
Write-Host "You can also view all summaries for this candidate at: http://localhost:3000/candidates/$candidateId/summaries"
