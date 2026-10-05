param(
  [Parameter(Mandatory=$true)][string]$TestingDirectory,
  [string]$NfrDirectory = (Join-Path $TestingDirectory 'nfr'),
  [string]$CombinedProject = (Join-Path $TestingDirectory 'VIPSportCenter-readyapi-project.xml'),
  [string]$CorrectedWorkbook = (Join-Path (Split-Path -Parent $TestingDirectory) 'VIPSportCenter_ReadyAPI_TestCases_Corrected.xlsx'),
  [string]$OriginalPlan = (Join-Path (Split-Path -Parent $TestingDirectory) 'VIPSportCenter_ReadyAPI_TestPlan.xlsx')
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$expectedIds = @((1..6 | ForEach-Object {'TC-NFR-PERF-{0:00}' -f $_}) + (1..11 | ForEach-Object {'TC-NFR-SEC-{0:00}' -f $_}))
function Assert-Project([string]$File, [int]$ExpectedCount) {
  [xml]$doc = Get-Content -Raw -Encoding UTF8 -LiteralPath $File
  $ns = [Xml.XmlNamespaceManager]::new($doc.NameTable); $ns.AddNamespace('c','http://eviware.com/soapui/config')
  $cases = $doc.SelectNodes('//c:testCase',$ns)
  if($cases.Count -ne $ExpectedCount) {throw "Wrong case count in $File"}
  $ids = @($cases | ForEach-Object {$_.GetAttribute('name').Split(' ')[0]})
  if(($ids | Select-Object -Unique).Count -ne $ExpectedCount) {throw 'Duplicate IDs'}
  if(Compare-Object $expectedIds @($ids | Where-Object {$_ -like 'TC-NFR-*'})) {throw 'NFR IDs missing/mismatched'}
  $confirm = $doc.SelectSingleNode('/c:soapui-project/c:properties/c:property[c:name="nfrLabOnly"]/c:value',$ns)
  if($confirm.InnerText -ne 'false') {throw 'NFR lab confirmation must default to false'}
  $settings = [Xml.XmlReaderSettings]::new(); $settings.ValidationType = [Xml.ValidationType]::Schema
  [void]$settings.Schemas.Add('http://eviware.com/soapui/config',(Join-Path $TestingDirectory 'soapui.xsd'))
  $issues = [Collections.Generic.List[string]]::new(); $settings.add_ValidationEventHandler({param($s,$e) $issues.Add($e.Message)})
  $reader = [Xml.XmlReader]::Create($File,$settings)
  try {while($reader.Read()) {}} finally {$reader.Dispose()}
  if($issues.Count) {throw ($issues -join '; ')}
  return ,$doc
}
$combined = Assert-Project $CombinedProject 50
$nfr = Assert-Project (Join-Path $NfrDirectory 'VIPSportCenter-nfr-readyapi-project.xml') 17
foreach($id in $expectedIds) {if(-not (Test-Path -LiteralPath (Join-Path $NfrDirectory "groovy/$id.groovy"))) {throw "Missing script $id"}}
foreach($workbook in @($CorrectedWorkbook,$OriginalPlan)) {
  $archive = [IO.Compression.ZipFile]::OpenRead($workbook)
  try {
    $parts = @{}
    foreach($entry in $archive.Entries) {if($entry.FullName -match '\.(xml|rels)$') {
      $r = [IO.StreamReader]::new($entry.Open()); try {[xml]$parts[$entry.FullName] = $r.ReadToEnd()} finally {$r.Dispose()}
    }}
    $book = $parts['xl/workbook.xml']; $ns = [Xml.XmlNamespaceManager]::new($book.NameTable)
    $ns.AddNamespace('s','http://schemas.openxmlformats.org/spreadsheetml/2006/main'); $ns.AddNamespace('r','http://schemas.openxmlformats.org/officeDocument/2006/relationships')
    foreach($name in @('NFR Overview','NFR Cases','NFR Results','NFR Defects')) {if(-not $book.SelectSingleNode("//s:sheet[@name='$name']",$ns)) {throw "Missing $name sheet"}}
    $sheet = $book.SelectSingleNode('//s:sheet[@name="NFR Cases"]',$ns)
    $rid = $sheet.GetAttribute('id','http://schemas.openxmlformats.org/officeDocument/2006/relationships')
    $rels = $parts['xl/_rels/workbook.xml.rels']; $rns = [Xml.XmlNamespaceManager]::new($rels.NameTable); $rns.AddNamespace('p','http://schemas.openxmlformats.org/package/2006/relationships')
    $target = $rels.SelectSingleNode("//p:Relationship[@Id='$rid']",$rns).GetAttribute('Target')
    $caseSheet = $parts['xl/' + $target]
    $sns = [Xml.XmlNamespaceManager]::new($caseSheet.NameTable); $sns.AddNamespace('s','http://schemas.openxmlformats.org/spreadsheetml/2006/main')
    $sheetIds = @($caseSheet.SelectNodes('//s:row[position()>1]/s:c[1]/s:is/s:t',$sns) | ForEach-Object {$_.InnerText})
    if(Compare-Object $expectedIds $sheetIds) {throw 'Workbook NFR IDs mismatch'}
    $gui = @($caseSheet.SelectNodes('//s:c[starts-with(@r,"M")]/s:is/s:t',$sns) | Select-Object -Skip 1 | ForEach-Object {$_.InnerText})
    if($gui.Count -ne 17 -or @($gui | Where-Object {$_ -ne 'Not run'}).Count) {throw 'GUI evidence must remain Not run'}
  } finally {$archive.Dispose()}
}
foreach($folder in @('reports','reports-groovy')) {
  $report = Get-Content -Raw -Encoding UTF8 -LiteralPath (Join-Path $NfrDirectory "$folder/results.json") | ConvertFrom-Json
  if($report.summary.total -ne 17 -or $report.cases.Count -ne 17 -or ($report.summary.pass + $report.summary.fail + $report.summary.blocked) -ne 17) {throw 'Incorrect report summary'}
  if(Compare-Object $expectedIds @($report.cases.id)) {throw 'Report IDs mismatch'}
  if($report.readyApiGui -ne 'Not run') {throw 'Standalone evidence cannot be GUI evidence'}
  foreach($result in $report.cases | Where-Object {$_.category -eq 'Performance'}) {
    if(-not $result.metrics.phases) {throw "Missing performance metrics: $($result.id)"}
    foreach($phase in $result.metrics.phases) {if($phase.requests -le 0 -or $phase.concurrency -gt 5 -or $phase.p50Ms -gt $phase.p95Ms -or $phase.p95Ms -gt $phase.p99Ms -or $phase.p99Ms -gt $phase.maxMs) {throw 'Bad percentile/load statistics'}}
  }
  $bola = $report.cases | Where-Object {$_.id -eq 'TC-NFR-SEC-07'}
  if($bola.result -eq 'Fail' -and (-not $bola.observations.foreignWritePersisted -or $bola.observations.attemptedStatus -ne 200)) {throw 'BOLA finding lacks persisted-write evidence'}
  Write-Output "$folder`: $($report.summary | ConvertTo-Json -Compress)"
}
Write-Output 'PASS: 50 combined / 17 NFR XML cases schema valid; both workbooks contain 17 matching NFR IDs; reports/percentiles/safety/GUI labels consistent.'
