$ErrorActionPreference = 'Stop'
$B = 'http://localhost:3199'
function J($method, $path, $body, $token) {
  $h = @{ 'Content-Type' = 'application/json' }
  if ($token) { $h.Authorization = "Bearer $token" }
  try {
    $r = Invoke-WebRequest -Uri "$B$path" -Method $method -Headers $h -Body ($(if ($null -ne $body) { $body | ConvertTo-Json -Depth 5 } else { $null })) -UseBasicParsing
    return @{ status = [int]$r.StatusCode; body = ($r.Content | ConvertFrom-Json) }
  } catch {
    $resp = $_.Exception.Response
    if (-not $resp) { throw }
    $sr = New-Object IO.StreamReader($resp.GetResponseStream()); $txt = $sr.ReadToEnd()
    return @{ status = [int]$resp.StatusCode; body = ($(try { $txt | ConvertFrom-Json } catch { $txt })) }
  }
}
function Check($name, $cond, $detail) { if ($cond) { Write-Host "PASS  $name" } else { Write-Host "FAIL  $name  -> $detail" -ForegroundColor Red } }

$email = "e2e_$([guid]::NewGuid().ToString('N').Substring(0,8))@example.com"
$pw = 'Password123!'

# health
$h = J GET '/health' $null $null
Check 'health returns only status' ($h.body.status -eq 'ok' -and -not $h.body.PSObject.Properties['env']) ($h.body | ConvertTo-Json -Compress)

# register (new)
$r = J POST '/api/auth/register' @{ email = $email; password = $pw }
Check 'register new -> 200 generic, no token' ($r.status -eq 200 -and $r.body.message -eq 'Check your email to continue.' -and -not $r.body.token) ($r | ConvertTo-Json -Compress)

# register (existing) - same response
$r2 = J POST '/api/auth/register' @{ email = $email; password = 'otherpassword' }
Check 'register existing -> identical 200' ($r2.status -eq 200 -and $r2.body.message -eq $r.body.message) ($r2 | ConvertTo-Json -Compress)

# login
$l = J POST '/api/auth/login' @{ email = $email; password = $pw }
Check 'login -> token' ($l.status -eq 200 -and $l.body.token) ($l | ConvertTo-Json -Compress)
$tok = $l.body.token

# create chat + send message
$c = J POST '/api/chats' @{ title = 'E2E' } $tok
Check 'create chat' ($c.status -in 200,201 -and $c.body.chat.id) ($c | ConvertTo-Json -Compress)
$chatId = $c.body.chat.id
$m = J POST '/api/chat' @{ chatId = $chatId; content = 'Reply with exactly one short sentence: hello.' } $tok
Check 'chat -> content + messageId' ($m.status -eq 200 -and $m.body.content -and $m.body.messageId) ($m | ConvertTo-Json -Compress)
$msgId = $m.body.messageId

# share by messageId
$s = J POST '/api/share' @{ messageId = $msgId } $tok
Check 'share assistant message' ($s.status -eq 200 -and $s.body.token) ($s | ConvertTo-Json -Compress)
$g = J GET "/api/shared/$($s.body.token)" $null $null
Check 'shared link readable' ($g.status -eq 200 -and $g.body.content -eq $m.body.content) ($g | ConvertTo-Json -Compress)
$bad = J POST '/api/share' @{ messageId = 999999 } $tok
Check 'share unknown message -> 404' ($bad.status -eq 404) ($bad | ConvertTo-Json -Compress)
$legacy = J POST '/api/share' @{ content = 'arbitrary text' } $tok
Check 'share by content rejected -> 400' ($legacy.status -eq 400) ($legacy | ConvertTo-Json -Compress)
$d = J DELETE "/api/share/$($s.body.token)" $null $tok
Check 'owner deletes share' ($d.status -eq 200) ($d | ConvertTo-Json -Compress)
$g2 = J GET "/api/shared/$($s.body.token)" $null $null
Check 'deleted share -> 404' ($g2.status -eq 404) ($g2 | ConvertTo-Json -Compress)

# upload (tiny PDF)
$pdf = "%PDF-1.1`n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj`n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj`n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj`n4 0 obj<</Length 44>>stream`nBT /F1 12 Tf 20 100 Td (Hello Bell Guide) Tj ET`nendstream`nendobj`n5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj`ntrailer<</Root 1 0 R>>"
$tmp = Join-Path $env:TEMP 'e2e.pdf'; [IO.File]::WriteAllText($tmp, $pdf)
$boundary = [guid]::NewGuid().ToString()
$bytes = [IO.File]::ReadAllBytes($tmp)
$enc = [Text.Encoding]::GetEncoding('iso-8859-1')
$bodyStr = "--$boundary`r`nContent-Disposition: form-data; name=`"file`"; filename=`"e2e.pdf`"`r`nContent-Type: application/pdf`r`n`r`n" + $enc.GetString($bytes) + "`r`n--$boundary--`r`n"
try {
  $u = Invoke-WebRequest -Uri "$B/api/upload" -Method POST -Headers @{ Authorization = "Bearer $tok" } -ContentType "multipart/form-data; boundary=$boundary" -Body $enc.GetBytes($bodyStr) -UseBasicParsing
  Check 'upload pdf' ($u.StatusCode -eq 200) $u.Content
} catch { Check 'upload pdf' $false $_.Exception.Message }

# password change -> new token, old token rejected
$wrong = J POST '/api/auth/password' @{ currentPassword = 'nope'; newPassword = 'NewPassword456!' } $tok
Check 'wrong current password -> 403 (not 401)' ($wrong.status -eq 403) ($wrong | ConvertTo-Json -Compress)
$pc = J POST '/api/auth/password' @{ currentPassword = $pw; newPassword = 'NewPassword456!' } $tok
Check 'password change -> new token' ($pc.status -eq 200 -and $pc.body.token) ($pc | ConvertTo-Json -Compress)
$old = J GET '/api/chats' $null $tok
Check 'old token rejected 401' ($old.status -eq 401) ($old | ConvertTo-Json -Compress)
$tok = $pc.body.token
$new = J GET '/api/chats' $null $tok
Check 'new token works' ($new.status -eq 200) ($new | ConvertTo-Json -Compress)
$pw = 'NewPassword456!'

# forgot / reset
$f = J POST '/api/auth/forgot-password' @{ email = $email }
Check 'forgot -> dev reset url' ($f.status -eq 200 -and $f.body.devResetUrl) ($f | ConvertTo-Json -Compress)
$fNone = J POST '/api/auth/forgot-password' @{ email = 'nobody_here@example.com' }
Check 'forgot unknown email -> same message' ($fNone.status -eq 200 -and $fNone.body.message -eq $f.body.message -and -not $fNone.body.devResetUrl) ($fNone | ConvertTo-Json -Compress)
$rt = ([uri]$f.body.devResetUrl).Query -replace '^\?token=', ''
$rs = J POST '/api/auth/reset-password' @{ token = $rt; newPassword = 'ResetPassword789!' }
Check 'reset -> token' ($rs.status -eq 200 -and $rs.body.token) ($rs | ConvertTo-Json -Compress)
$stale = J GET '/api/chats' $null $tok
Check 'pre-reset token rejected' ($stale.status -eq 401) ($stale | ConvertTo-Json -Compress)
$tok = $rs.body.token
$pw = 'ResetPassword789!'
$reuse = J POST '/api/auth/reset-password' @{ token = $rt; newPassword = 'Again12345!' }
Check 'reset token single-use' ($reuse.status -eq 400) ($reuse | ConvertTo-Json -Compress)

# lockout: 10 bad logins on a different email -> 429
$lockEmail = "lock_$([guid]::NewGuid().ToString('N').Substring(0,6))@example.com"
$last = $null
for ($i = 0; $i -lt 11; $i++) { $last = J POST '/api/auth/login' @{ email = $lockEmail; password = 'bad' } }
Check 'lockout after 10 failures -> 429' ($last.status -eq 429) ($last | ConvertTo-Json -Compress)

# delete account requires password
$dn = J DELETE '/api/auth/account' @{} $tok
Check 'delete without password -> 400' ($dn.status -eq 400) ($dn | ConvertTo-Json -Compress)
$dw = J DELETE '/api/auth/account' @{ currentPassword = 'wrong' } $tok
Check 'delete wrong password -> 403' ($dw.status -eq 403) ($dw | ConvertTo-Json -Compress)
$dok = J DELETE '/api/auth/account' @{ currentPassword = $pw } $tok
Check 'delete with password -> 200' ($dok.status -eq 200) ($dok | ConvertTo-Json -Compress)
$gone = J POST '/api/auth/login' @{ email = $email; password = $pw }
Check 'deleted user cannot login' ($gone.status -eq 401) ($gone | ConvertTo-Json -Compress)
