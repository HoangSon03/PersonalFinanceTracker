$logPath = Join-Path $env:TEMP 'PersonalFinanceTracker-agent-stop.log'
Add-Content -LiteralPath $logPath -Value 'agentStop' -Encoding utf8
Write-Output '{}'
