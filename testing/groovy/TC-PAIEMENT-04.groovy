def scenario = new groovy.json.JsonSlurper().parseText(new String(java.util.Base64.decoder.decode('eyJpZCI6IlRDLVBBSUVNRU5ULTA0Iiwic3VpdGUiOiJQYXltZW50IiwidGl0bGUiOiJTdGF0cyBjw7MgNCBmaWVsZCB2w6Agc+G7kSB0aeG7gW4ga2jDtG5nIMOibSIsInR5cGUiOiJQb3NpdGl2ZSIsInByaW9yaXR5IjoiTWVkaXVtIiwic2V0dXAiOltdLCJzdGVwcyI6W3sibmFtZSI6IlBheW1lbnQgc3RhdGlzdGljcyIsIm1ldGhvZCI6IkdFVCIsInBhdGgiOiIvYWRtaW4vcGFpZW1lbnRzL3N0YXRzIiwic3RhdHVzIjoyMDAsInJvbGUiOiJhZG1pbiIsImJvZHkiOm51bGwsImNoZWNrcyI6W3sib3AiOiJub25OZWdhdGl2ZSIsInBhdGgiOiJ0b3RhbF9lbmNhaXNzZSJ9LHsib3AiOiJub25OZWdhdGl2ZSIsInBhdGgiOiJ0b3RhbF9lbl9hdHRlbnRlIn0seyJvcCI6Im5vbk5lZ2F0aXZlIiwicGF0aCI6InRvdGFsX2VuX3JldGFyZCJ9LHsib3AiOiJhcnJheSIsInBhdGgiOiJwYXJfbWV0aG9kZSJ9XX1dLCJub3RlIjoiIiwiZGVmZWN0IjoiIn0='), 'UTF-8'))
def projectDefaults = new groovy.json.JsonSlurper().parseText(new String(java.util.Base64.decoder.decode('eyJiYXNlVXJsIjoiaHR0cDovLzEyNy4wLjAuMTo4MDAwL2FwaSIsInNsYU1zIjoyMDAwLCJ0aW1lb3V0TXMiOjE1MDAwLCJhZG1pbkVtYWlsIjoiYWRtaW5Ac3BvcnRjZW50ZXIubWEiLCJhZG1pblBhc3N3b3JkIjoiQWRtaW5AMTIzNCIsImNvYWNoRW1haWwiOiJrYXJpbUBzcG9ydGNlbnRlci5tYSIsImNvYWNoUGFzc3dvcmQiOiJDb2FjaEAxMjM0Iiwib3RoZXJDb2FjaEVtYWlsIjoic2FyYUBzcG9ydGNlbnRlci5tYSIsIm90aGVyQ29hY2hQYXNzd29yZCI6IkNvYWNoQDEyMzQiLCJjbGllbnRFbWFpbCI6Inlhc3NpbmUuYW1yYW5pQGdtYWlsLmNvbSIsImNsaWVudFBhc3N3b3JkIjoiQ2xpZW50QDEyMzQifQ=='), 'UTF-8'))
def clientTemplate = new groovy.json.JsonSlurper().parseText(new String(java.util.Base64.decoder.decode('eyJwcmVub20iOiJSZWFkeUFQSSIsIm5vbSI6IlFBIiwiZW1haWwiOiJ7e3VuaXF1ZUVtYWlsfX0iLCJwYXNzd29yZCI6IlBhc3N3b3JkMTIzISIsImNvYWNoX2lkIjoie3tjb2FjaElkfX0iLCJtb250YW50X2FubnVlbCI6MzYwMH0='), 'UTF-8'))
// Executed inside a ReadyAPI/SoapUI Groovy Script TestStep.
// The builder prepends a JSON scenario. This engine is shared by all 33 cases.
import groovy.json.JsonSlurper
import groovy.json.JsonOutput

def project = testRunner.testCase.testSuite.project
def options = [:]
projectDefaults.each { key, value ->
    def configured = project.getPropertyValue(key)
    options[key] = configured ? configured : value
}
options.slaMs = options.slaMs as long
options.timeoutMs = options.timeoutMs as int
def start = System.nanoTime()
def vars = new LinkedHashMap(options)
def date = java.time.LocalDate.now(java.time.ZoneOffset.UTC)
vars.uniqueEmail = 'qa-' + UUID.randomUUID().toString() + '@test.local'
vars.today = date.toString()
vars.month = date.monthValue
vars.year = date.year
def tokens = [:]
def clients = [] as Set
def coaches = [] as Set
def requests = []
def cleanupErrors = []
boolean setupDone = false
String failure = null

def at = { value, String dotted ->
    if (!dotted) return value
    dotted.tokenize('.').inject(value) { current, part ->
        if (current == null) return null
        if (current instanceof List) return part == 'length' ? current.size() : current[part as int]
        current[part]
    }
}
Closure resolve
resolve = { value ->
    if (value instanceof String) {
        def whole = value =~ /^\{\{([^}]+)\}\}$/
        if (whole.matches()) {
            assert vars.containsKey(whole[0][1]) : 'Missing variable ' + whole[0][1]
            return vars[whole[0][1]]
        }
        return value.replaceAll(/\{\{([^}]+)\}\}/) { match, key ->
            assert vars.containsKey(key) : 'Missing variable ' + key
            vars[key].toString()
        }
    }
    if (value instanceof List) return value.collect { resolve(it) }
    if (value instanceof Map) return value.collectEntries { key, v -> [key, resolve(v)] }
    value
}
def verify = { check, data ->
    def actual = at(data, check.path as String)
    def expected = resolve(check.value)
    def label = check.op + ' ' + (check.path ?: '$')
    switch (check.op) {
        case 'exists': assert actual != null : label; break
        case 'eq':
            if (expected instanceof Number) {
                assert actual != null && new BigDecimal(actual.toString()) == new BigDecimal(expected.toString()) : label
            } else { assert actual == expected : label }
            break
        case 'array': assert actual instanceof List : label; break
        case 'nonEmpty': assert actual instanceof List && !actual.isEmpty() : label; break
        case 'contains': assert actual != null && actual.toString().toLowerCase().contains(expected.toString().toLowerCase()) : label; break
        case 'regex': assert actual != null && actual.toString() ==~ expected.toString() : label; break
        case 'nonNegative': assert actual != null && new BigDecimal(actual.toString()) >= 0 : label; break
        case 'everyKeys':
            assert actual instanceof List && !actual.isEmpty() : label
            actual.each { row -> expected.each { key -> assert row[key] != null : label + '/' + key } }
            break
        case 'search':
            assert actual instanceof List && !actual.isEmpty() : label
            actual.each { row ->
                assert [row.nom, row.prenom, row.user?.email].any { (it ?: '').toString().toLowerCase().contains(expected.toString().toLowerCase()) } : label
            }
            break
        case 'overdue':
            assert actual instanceof List && !actual.isEmpty() : label
            actual.each { row ->
                assert row.statut == 'en_attente' : label
                // Laravel dates are serialized in ISO UTC; compare actual instants.
                assert java.time.Instant.parse(row.date_echeance).isBefore(java.time.Instant.now()) : label
            }
            break
        case 'coachOwnership':
            assert actual instanceof List : label
            actual.each { row -> assert row.coach_id.toString() == expected.toString() : label }
            break
        case 'balance':
            assert (new BigDecimal(actual.total_paye.toString()) + new BigDecimal(actual.total_restant.toString()) - new BigDecimal(actual.montant_annuel.toString())).abs() < 0.01 : label
            break
        default: throw new IllegalArgumentException('Unknown assertion ' + check.op)
    }
}
def http = { String method, String route, body, token, boolean main ->
    def begin = System.nanoTime()
    def connection = new URL(options.baseUrl.toString().replaceAll('/$', '') + route).openConnection() as HttpURLConnection
    connection.requestMethod = method
    connection.instanceFollowRedirects = false
    connection.connectTimeout = options.timeoutMs
    connection.readTimeout = options.timeoutMs
    connection.setRequestProperty('Accept', 'application/json')
    connection.setRequestProperty('Content-Type', 'application/json')
    if (token) connection.setRequestProperty('Authorization', 'Bearer ' + token)
    try {
        if (body != null) {
            connection.doOutput = true
            connection.outputStream.withCloseable { stream -> stream.write(JsonOutput.toJson(body).getBytes('UTF-8')) }
        }
        def status = connection.responseCode
        def stream = status >= 400 ? connection.errorStream : connection.inputStream
        def text = stream ? stream.withCloseable { it.getText('UTF-8') } : ''
        def ms = (System.nanoTime() - begin) / 1000000L as long
        def data
        requests << [phase: main ? 'test' : 'setup/cleanup', method: method, path: route, expected: null, status: status, ms: ms]
        log.info(method + ' ' + route + ' -> HTTP ' + status + ' (' + ms + 'ms)')
        try { data = new JsonSlurper().parseText(text) }
        catch (Exception ignored) { throw new IllegalStateException(method + ' ' + route + ' returned non-JSON (HTTP ' + status + ')') }
        assert (connection.contentType ?: '').toLowerCase().contains('application/json') : 'JSON Content-Type'
        assert !text.contains('SQLSTATE') && !text.contains('Stack trace') : 'No SQL/stack leak'
        if (data instanceof Map) ['exception', 'trace', 'file'].each { key -> assert !data.containsKey(key) : 'No debug leak: ' + key }
        if (main) assert ms <= options.slaMs : 'Response SLA ' + ms + 'ms > ' + options.slaMs + 'ms'
        [status: status, data: data]
    } finally { connection.disconnect() }
}
Closure roleToken
roleToken = { String role ->
    if (!tokens[role]) {
        def r = http('POST', '/login', [email: options[role + 'Email'], password: options[role + 'Password']], null, false)
        assert r.status == 200 : 'Setup login ' + role
        assert r.data.token : 'Setup token ' + role
        tokens[role] = r.data.token
    }
    tokens[role]
}
def identity = { String role ->
    def r = http('GET', '/me', null, roleToken(role), false)
    assert r.status == 200 && r.data.profile?.id != null : 'Setup profile ' + role
    r.data.profile.id
}
def createClient = { boolean foreign ->
    vars.coachId = identity('coach')
    def body = resolve(clientTemplate)
    body.coach_id = foreign ? identity('otherCoach') : vars.coachId
    def r = http('POST', '/admin/clients', body, roleToken('admin'), false)
    assert r.status == 201 : 'Setup create client'
    vars.clientId = r.data.client.id
    clients << vars.clientId
}
try {
    scenario.setup.each { fixture ->
        switch (fixture) {
            case 'coachIdentity': vars.coachId = identity('coach'); break
            case 'freshClient': createClient(false); break
            case 'foreignClient': createClient(true); break
            case 'paymentClient':
                createClient(false)
                def r = http('GET', '/admin/clients/' + vars.clientId, null, roleToken('admin'), false)
                assert r.status == 200 : 'Setup client installment'
                def installment = r.data.cotisations[0].echeances[0]
                vars.echeanceId = installment.id
                vars.echeanceAmount = new BigDecimal(installment.montant.toString())
                break
            case 'payInstallment':
                def r = http('POST', '/admin/paiements',
                    [echeance_id: vars.echeanceId, montant: vars.echeanceAmount, methode: 'carte', date_paiement: vars.today], roleToken('admin'), false)
                assert r.status == 201 : 'Setup first payment'
                break
            default: throw new IllegalArgumentException('Unknown fixture ' + fixture)
        }
    }
    setupDone = true
    scenario.steps.each { step ->
        def token = step.token ? resolve(step.token) : step.role ? roleToken(step.role) : null
        def r = http(step.method, resolve(step.path), resolve(step.body), token, true)
        requests[-1].expected = step.status
        if (step.trackClient && r.status == 201 && r.data.client?.id) clients << r.data.client.id
        if (step.trackCoach && r.status == 201 && r.data.coach?.id) coaches << r.data.coach.id
        if (step.trackRegistration && r.status == 201 && r.data.token) {
            def profile = http('GET', '/me', null, r.data.token, false)
            assert profile.status == 200 : 'Registration cleanup identity'
            clients << profile.data.profile.id
        }
        assert r.status == step.status : step.name + ': HTTP expected ' + step.status + ', actual ' + r.status
        step.checks.each { verify(it, r.data) }
        (step.capture ?: [:]).each { key, source ->
            vars[key] = at(r.data, source)
            assert vars[key] != null : 'Capture ' + source
        }
    }
} catch (Throwable e) {
    failure = e.message ?: e.toString()
} finally {
    [clients: clients, coaches: coaches].each { resource, ids ->
        ids.each { id ->
            try {
                def r = http('DELETE', '/admin/' + resource + '/' + id, null, roleToken('admin'), false)
                assert r.status in [200, 404] : 'Cleanup HTTP ' + r.status
            } catch (Throwable e) { cleanupErrors << resource + '/' + id + ': ' + e.message }
        }
    }
    tokens.values().each { token ->
        try {
            def r = http('POST', '/logout', null, token, false)
            assert r.status in [200, 401] : 'Token cleanup HTTP ' + r.status
        } catch (Throwable e) { cleanupErrors << 'Token cleanup: ' + e.message }
    }
    ['registeredToken', 'logoutToken', 'deletedUserToken'].each { key ->
        if (vars[key]) {
            try {
                def r = http('POST', '/logout', null, vars[key], false)
                assert r.status in [200, 401] : 'Scenario token cleanup'
            } catch (Throwable e) { cleanupErrors << 'Scenario token cleanup: ' + e.message }
        }
    }
}
if (!cleanupErrors.isEmpty()) failure = (failure ? failure + '; ' : '') + cleanupErrors.join('; ')
def result = [id: scenario.id, suite: scenario.suite, title: scenario.title,
    result: failure ? (setupDone ? 'Fail' : 'Blocked') : 'Pass',
    knownDefect: scenario.defect ?: null, error: failure,
    durationMs: ((System.nanoTime() - start) / 1000000L) as long,
    requests: requests, cleanupErrors: cleanupErrors]
context.setProperty('caseResult', result)
assert failure == null : failure
log.info(scenario.id + ' PASS')
return JsonOutput.toJson(result)
