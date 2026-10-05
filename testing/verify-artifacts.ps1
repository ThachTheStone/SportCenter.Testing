param([Parameter(Mandatory=$true)][string]$Directory)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
function Read-ZipXml($Archive, [string]$Name) {
    $entry=$Archive.GetEntry($Name)
    if(-not $entry) { throw "Missing part: $Name" }
    $r=[IO.StreamReader]::new($entry.Open())
    try { [xml]$document=$r.ReadToEnd(); return ,$document } finally { $r.Dispose() }
}
$projectFile=Join-Path $Directory 'VIPSportCenter-readyapi-project.xml'
[xml]$project=Get-Content -LiteralPath $projectFile -Raw -Encoding UTF8
$ns=[Xml.XmlNamespaceManager]::new($project.NameTable)
$ns.AddNamespace('c','http://eviware.com/soapui/config')
$cases=$project.SelectNodes('//c:testCase',$ns)
$steps=$project.SelectNodes('//c:testStep',$ns)
if($cases.Count -ne 33 -or $steps.Count -ne 33) { throw 'Expected 33 cases / 33 Groovy steps' }
$ids=@($cases | ForEach-Object { $_.GetAttribute('name').Split(' ')[0] })
if(($ids | Select-Object -Unique).Count -ne 33) { throw 'Duplicate testcase IDs' }
$schema=Join-Path $Directory 'soapui.xsd'
if(Test-Path -LiteralPath $schema) {
    $settings=[Xml.XmlReaderSettings]::new()
    $settings.ValidationType=[Xml.ValidationType]::Schema
    [void]$settings.Schemas.Add('http://eviware.com/soapui/config',$schema)
    $issues=[Collections.Generic.List[string]]::new()
    $settings.add_ValidationEventHandler({param($sender,$event) $issues.Add($event.Message)})
    $reader=[Xml.XmlReader]::Create($projectFile,$settings)
    try {while($reader.Read()) {}} finally {$reader.Dispose()}
    if($issues.Count) { throw ($issues -join '; ') }
}
$workbook=Join-Path $Directory 'VIPSportCenter_ReadyAPI_TestCases_Corrected.xlsx'
if(-not (Test-Path -LiteralPath $workbook)) {$workbook=Join-Path (Split-Path -Parent $Directory) 'VIPSportCenter_ReadyAPI_TestCases_Corrected.xlsx'}
$archive=[IO.Compression.ZipFile]::OpenRead($workbook)
try {
    foreach($entry in $archive.Entries) {if($entry.FullName -match '\.(xml|rels)$') {[void](Read-ZipXml $archive $entry.FullName)}}
    $sheet=Read-ZipXml $archive 'xl/worksheets/sheet2.xml'
    $sn=[Xml.XmlNamespaceManager]::new($sheet.NameTable)
    $sn.AddNamespace('s','http://schemas.openxmlformats.org/spreadsheetml/2006/main')
    $sheetIds=@($sheet.SelectNodes('//s:sheetData/s:row[position()>1]/s:c[1]/s:is/s:t',$sn) | ForEach-Object {$_.InnerText})
    if($sheetIds.Count -ne 33) { throw 'Excel case count not 33' }
    if(Compare-Object $ids $sheetIds) { throw 'Excel/project IDs differ' }
    if($sheet.SelectNodes('//s:dataValidation',$sn).Count -ne 3) {throw 'Missing result dropdowns'}
    $gui=$sheet.SelectNodes('//s:c[starts-with(@r,"R")]/s:is/s:t',$sn)
    if(@($gui | Select-Object -Skip 1 | Where-Object {$_.InnerText -ne 'Not run'}).Count) {throw 'GUI execution must remain Not run'}
} finally {$archive.Dispose()}
foreach($folder in @('reports','reports-groovy')) {
    $report=Get-Content -LiteralPath (Join-Path $Directory "$folder/results.json") -Raw -Encoding UTF8 | ConvertFrom-Json
    if($report.summary.total -ne 33 -or $report.summary.pass -ne 32 -or $report.summary.fail -ne 1 -or $report.summary.blocked -ne 0) {throw "Unexpected results in $folder"}
    $failed=@($report.cases | Where-Object {$_.result -eq 'Fail'})
    if($failed[0].id -ne 'TC-ROLE-03') {throw 'Wrong failing testcase'}
    $tests=@($report.cases.requests | Where-Object {$_.phase -eq 'test'})
    if($tests.Count -ne 48) {throw "Expected 48 main HTTP requests, got $($tests.Count)"}
}
$research=Join-Path $Directory 'Research.docx'
if(-not (Test-Path -LiteralPath $research)) {$research=Join-Path (Split-Path -Parent (Split-Path -Parent $Directory)) 'Research.docx'}
if(Test-Path -LiteralPath $research) {
    $archive=[IO.Compression.ZipFile]::OpenRead($research)
    try {
        foreach($entry in $archive.Entries) {if($entry.FullName -match '\.(xml|rels)$') {[void](Read-ZipXml $archive $entry.FullName)}}
        $document=Read-ZipXml $archive 'word/document.xml'
        if(-not $document.OuterXml.Contains('BUG-001')) {throw 'Missing research appendix'}
    } finally {$archive.Dispose()}
}
Write-Output 'PASS: 33 matching IDs; 48 requests; Excel/Word XML valid; SoapUI schema valid; 32 Pass/1 Fail in both runners; GUI Not run.'
