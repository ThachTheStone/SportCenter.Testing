def scenario = new groovy.json.JsonSlurper().parseText(new String(java.util.Base64.decoder.decode('eyJpZCI6IlRDLU5GUi1TRUMtMDIiLCJzdWl0ZSI6Ik5GUiAtIFNlY3VyaXR5IiwiY2F0ZWdvcnkiOiJTZWN1cml0eSIsImtpbmQiOiJzZWN1cml0eSIsInRpdGxlIjoiQWx0ZXJlZCB0b2tlbiBtdXN0IGJlIHJlamVjdGVkIiwiYWN0aW9uIjoidGFtcGVyZWRUb2tlbiIsInJlcXVpcmVtZW50IjoiVG9rZW4gc2VjcmV0IGludGVncml0eSBtdXN0IGJlIGVuZm9yY2VkLiIsIm1hcHBpbmciOiJPV0FTUCBBUEkyOjIwMjMiLCJleHBlY3RlZCI6Ik9uZS1jaGFyYWN0ZXIgY2hhbmdlZCB0b2tlbiAtPiA0MDE7IG9yaWdpbmFsIHRva2VuIHN0aWxsIHdvcmtzLiJ9'), 'UTF-8'))
def projectDefaults = new groovy.json.JsonSlurper().parseText(new String(java.util.Base64.decoder.decode('eyJiYXNlVXJsIjoiaHR0cDovLzEyNy4wLjAuMTo4MDAwL2FwaSIsInNsYU1zIjoyMDAwLCJ0aW1lb3V0TXMiOjE1MDAwLCJhZG1pbkVtYWlsIjoiYWRtaW5Ac3BvcnRjZW50ZXIubWEiLCJhZG1pblBhc3N3b3JkIjoiQWRtaW5AMTIzNCIsImNvYWNoRW1haWwiOiJrYXJpbUBzcG9ydGNlbnRlci5tYSIsImNvYWNoUGFzc3dvcmQiOiJDb2FjaEAxMjM0Iiwib3RoZXJDb2FjaEVtYWlsIjoic2FyYUBzcG9ydGNlbnRlci5tYSIsIm90aGVyQ29hY2hQYXNzd29yZCI6IkNvYWNoQDEyMzQiLCJjbGllbnRFbWFpbCI6Inlhc3NpbmUuYW1yYW5pQGdtYWlsLmNvbSIsImNsaWVudFBhc3N3b3JkIjoiQ2xpZW50QDEyMzQiLCJuZnJUaW1lb3V0TXMiOjUwMDAsIm5mckxhYk9ubHkiOiJmYWxzZSJ9'), 'UTF-8'))
// Self-contained ReadyAPI Groovy Script step: bounded LOCAL lab only.
import groovy.json.JsonSlurper
import groovy.json.JsonOutput
import java.util.concurrent.Callable
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicInteger

def project = testRunner.testCase.testSuite.project
def options = projectDefaults.collectEntries { k, v -> [k, project.getPropertyValue(k) ?: v] }
options.timeoutMs = options.nfrTimeoutMs as int
def target = new URI(options.baseUrl.toString())
assert target.host in ['127.0.0.1', 'localhost', '[::1]', '::1'] : 'NFR requires localhost'
assert options.nfrLabOnly.toString() == 'true' : 'Confirm isolated seeded lab with nfrLabOnly=true'
assert !target.userInfo : 'URL must not embed credentials'
assert (options.timeoutMs as int) > 0 && (options.timeoutMs as int) <= 5000 : 'Timeout must be 1..5000ms'
def started = System.nanoTime()
def records = Collections.synchronizedList([])
def cleanupErrors = [], tokens = [:], allTokens = [] as Set, clients = [] as Set
def email = 'nfr-' + UUID.randomUUID() + '@test.local'
def today = java.time.LocalDate.now(java.time.ZoneOffset.UTC).toString()
boolean setupDone = false
String failure = null
def metrics = null, observations = [:]
def http = { String method, String route, body, token, String phase ->
    def begin = System.nanoTime()
    def row = [phase: phase, method: method, path: route, status: null, ms: 0]
    HttpURLConnection connection = new URL(options.baseUrl.toString().replaceAll('/$', '') + route).openConnection() as HttpURLConnection
    try {
        connection.requestMethod = method
        connection.instanceFollowRedirects = false
        connection.connectTimeout = options.timeoutMs as int
        connection.readTimeout = options.timeoutMs as int
        connection.setRequestProperty('Accept', 'application/json')
        connection.setRequestProperty('Content-Type', 'application/json')
        if (token) connection.setRequestProperty('Authorization', 'Bearer ' + token)
        if (body != null) { connection.doOutput = true; connection.outputStream.withCloseable { it.write(JsonOutput.toJson(body).getBytes('UTF-8')) } }
        row.status = connection.responseCode
        def stream = row.status >= 400 ? connection.errorStream : connection.inputStream
        def text = stream ? stream.withCloseable { it.getText('UTF-8') } : ''
        assert (connection.contentType ?: '').contains('application/json') : 'Expected JSON response'
        [status: row.status, data: new JsonSlurper().parseText(text), text: text, retryAfter: connection.getHeaderField('Retry-After'), row: row]
    } catch (Throwable e) { row.error = 'Transport/non-JSON response error'; throw e }
    finally { row.ms = Math.round((System.nanoTime() - begin) / 10000d) / 100d; records.add(row); connection.disconnect() }
}
def login = { String role ->
    if (!tokens[role]) {
        def r = http('POST', '/login', [email: options[role + 'Email'], password: options[role + 'Password']], null, 'setup')
        assert r.status == 200 && r.data.token : 'Login setup ' + role
        tokens[role] = r.data.token; allTokens.add(r.data.token)
    }
    tokens[role]
}
def newClient = { String owner ->
    def identity = http('GET', '/me', null, login(owner), 'setup')
    assert identity.status == 200 && identity.data.profile?.id : 'Coach setup identity'
    def r = http('POST', '/admin/clients', [prenom: 'NFR', nom: 'QA', email: email, password: 'Password123!', coach_id: identity.data.profile.id, montant_annuel: 3600], login('admin'), 'setup')
    assert r.status == 201 && r.data.client?.id : 'Create QA client'
    clients.add(r.data.client.id); r.data.client.id
}
def denied = { r, statuses ->
    assert r.status in statuses : 'Denied HTTP expected ' + statuses + ', actual ' + r.status
    assert r.data.containsKey('message') && !r.data.user && !r.data.profile && !r.data.token && !r.data.seance && !r.data.bilans_physiques : 'Protected data in denied response'
}
Closure noSecrets
noSecrets = { value ->
    if (value instanceof List) value.each { noSecrets(it) }
    else if (value instanceof Map) value.each { k, v ->
        assert !(k.toString().toLowerCase() in ['password', 'password_hash', 'remember_token', 'access_token', 'token']) : 'Secret field leaked: ' + k
        noSecrets(v)
    }
}
Closure debugKeys
debugKeys = { value ->
    if (value instanceof Map) value.each { k, v -> assert !(k in ['exception', 'trace', 'file']) : 'Debug key: ' + k; debugKeys(v) }
    else if (value instanceof List) value.each { debugKeys(it) }
}
def payloadValid = { route, data ->
    switch (route.path) {
        case '/me': return data.role == route.role && data.profile?.id != null
        case '/admin/clients': return data.data instanceof List && data.per_page == 10
        case '/coach/clients': return data instanceof List
        case '/client/paiements': return data.echeances instanceof List && Math.abs((data.total_paye as double) + (data.total_restant as double) - (data.montant_annuel as double)) < .01
        default: return ['total_encaisse', 'total_en_attente', 'total_en_retard'].every { data[it] != null && (data[it] as double) >= 0 } && data.par_methode instanceof List
    }
}
def batch = { phase ->
    assert phase.concurrency >= 1 && phase.concurrency <= 5 && phase.count > 0 && phase.count <= 100 : 'Unsafe load size'
    def samples = Collections.synchronizedList([]), begin = System.nanoTime(), next = new AtomicInteger(0)
    def pool = Executors.newFixedThreadPool(phase.concurrency as int)
    try {
        def futures = (0..<(phase.concurrency as int)).collect {
            pool.submit({
                while (true) {
                    int index = next.getAndIncrement()
                    if (index >= phase.count || (scenario.durationMs && (System.nanoTime() - begin) / 1000000d >= scenario.durationMs)) break
                    def route = scenario.routes[index % scenario.routes.size()], attempt = System.nanoTime()
                    try { def r = http('GET', route.path as String, null, tokens[route.role], phase.name as String); r.row.valid = payloadValid(route, r.data); samples.add(r.row) }
                    catch (Throwable ignored) { samples.add([status: null, ms: (System.nanoTime() - attempt) / 1000000d, error: 'Request/payload error', valid: false]) }
                    if (scenario.paceMs) Thread.sleep(Math.max(0L, (scenario.paceMs as long) - ((System.nanoTime() - attempt) / 1000000L as long)))
                }
            } as Callable)
        }
        futures.each { it.get(120, TimeUnit.SECONDS) }
    } finally { pool.shutdownNow(); pool.awaitTermination(5, TimeUnit.SECONDS) }
    def elapsed = (System.nanoTime() - begin) / 1000000d
    def sorted = samples.collect { it.ms as double }.sort()
    def rank = { double p -> sorted ? sorted[Math.max(0, (Math.ceil(sorted.size() * p) as int) - 1)] : 0 }
    int errors = samples.count { it.error || it.status != 200 || !it.valid }
    [phase: phase.name, concurrency: phase.concurrency, requests: samples.size(), errors: errors, errorRate: samples ? errors / (double)samples.size() : 1,
     p50Ms: rank(.5), p95Ms: rank(.95), p99Ms: rank(.99), maxMs: sorted ? sorted.last() : 0, elapsedMs: Math.round(elapsed), throughputRps: Math.round(samples.size() / Math.max(elapsed / 1000d, .001) * 100) / 100d]
}
try {
    if (scenario.kind == 'performance') {
        scenario.routes.collect { it.role }.unique().each { login(it as String) }
        (0..<(scenario.warmup as int)).each { i -> def route = scenario.routes[i % scenario.routes.size()]; def r = http('GET', route.path as String, null, tokens[route.role], 'warmup'); assert r.status == 200 && payloadValid(route, r.data) : 'Warmup status/payload invalid' }
        setupDone = true
        def profiles = scenario.phases ?: [[name: 'measured', count: scenario.count, concurrency: scenario.concurrency]]
        def phases = profiles.collect { batch(it) }
        metrics = [percentileMethod: 'nearest-rank', phases: phases]
        phases.eachWithIndex { p, i ->
            assert p.requests >= (scenario.minimumSamples ?: profiles[i].count) : 'Insufficient samples'
            assert p.errorRate <= scenario.errorRate : 'Unexpected status/payload/transport error rate'
            assert p.p95Ms <= scenario.p95Ms : 'p95 exceeds proposed lab target'
            assert p.maxMs <= scenario.maxMs : 'max exceeds proposed lab target'
        }
        if (scenario.phases) { metrics.recoveryLimitMs = Math.max(scenario.recoveryFloorMs as double, phases[0].p95Ms * (scenario.recoveryFactor as double)); assert phases[2].p95Ms <= metrics.recoveryLimitMs : 'Recovery p95 degraded' }
    } else {
        switch (scenario.action) {
            case 'invalidToken': setupDone = true; denied(http('GET', '/me', null, '999999|not-a-real-token', 'test'), [401]); break
            case 'tamperedToken':
                def token = login('client') as String; setupDone = true
                def modified = token.substring(0, token.length() - 1) + (token.endsWith('a') ? 'b' : 'a')
                denied(http('GET', '/me', null, modified, 'test'), [401]); assert http('GET', '/me', null, token, 'test').status == 200; break
            case 'revokedToken':
                def token = login('client'); setupDone = true
                assert http('POST', '/logout', null, token, 'test').status == 200; denied(http('GET', '/me', null, token, 'test'), [401]); break
            case 'roleMatrix':
                def id = newClient('coach'); login('client'); setupDone = true
                ['client', 'coach'].each { denied(http('GET', '/admin/clients', null, tokens[it], 'test'), [403]) }
                denied(http('PUT', '/admin/clients/' + id, [statut: 'suspendu'], tokens.client, 'test'), [403])
                def detail = http('GET', '/admin/clients/' + id, null, tokens.admin, 'test'); assert detail.status == 200 && detail.data.statut == 'actif'; break
            case 'massAssignment':
                login('admin'); setupDone = true
                def r = http('POST', '/register', [name: 'NFR QA', email: email, password: 'Password123!', password_confirmation: 'Password123!', specialite: 'Musculation', plan: 'mensuel', payment_method: 'cash', role: 'admin', active: true], null, 'test')
                if (r.status == 201 && r.data.token) { allTokens.add(r.data.token); def profile = http('GET', '/me', null, r.data.token, 'test'); if (profile.data.profile?.id) clients.add(profile.data.profile.id)
                    assert profile.status == 200 && profile.data.role == 'client'; denied(http('GET', '/admin/clients', null, r.data.token, 'test'), [403])
                } else { assert r.status == 422 : 'Registration must reject injection or force client role' }; break
            case 'objectRead':
                def id = newClient('otherCoach'); login('coach'); setupDone = true
                assert http('GET', '/coach/clients/' + id + '/bilans', null, tokens.otherCoach, 'test').status == 200
                denied(http('GET', '/coach/clients/' + id + '/bilans', null, tokens.coach, 'test'), [403, 404]); break
            case 'objectWrite':
                login('otherCoach'); login('coach')
                def planningPath = '/coach/planning?mois=' + (today.substring(5,7) as int) + '&annee=' + today.substring(0,4)
                def seedPlanning = http('GET', planningPath, null, tokens.otherCoach, 'setup')
                assert seedPlanning.status == 200 && seedPlanning.data.plannings && seedPlanning.data.plannings[0].client_id : 'Seed an owner planning first'
                def created = http('POST', '/coach/planning/seances', [client_id: seedPlanning.data.plannings[0].client_id, date: today, heure_debut: '10:00', heure_fin: '11:00', lieu: 'NFR QA', notes: email], tokens.otherCoach, 'setup')
                assert created.status == 201 && created.data.seance?.id : 'QA session setup'
                def sessionId = created.data.seance.id
                def findSession = { data -> data.plannings.collectMany { it.seances }.find { it.id == sessionId } }
                def before = http('GET', planningPath, null, tokens.otherCoach, 'setup'); assert before.status == 200 && findSession(before.data) != null && findSession(before.data).seance_realisee == null
                setupDone = true
                def r = http('POST', '/coach/seances/' + sessionId + '/realiser', [present: true, effort_percu: 5, remarques_coach: 'NFR unauthorized probe'], tokens.coach, 'test')
                def after = http('GET', planningPath, null, tokens.otherCoach, 'test'); assert after.status == 200 && findSession(after.data) != null
                observations = [attemptedStatus: r.status, foreignWritePersisted: findSession(after.data).seance_realisee != null]
                assert (r.status in [403, 404]) && !observations.foreignWritePersisted : 'BOLA: foreign coach write accepted or persisted; HTTP=' + r.status + ', persisted=' + observations.foreignWritePersisted; break
            case 'sensitiveData':
                def id = newClient('coach'); setupDone = true
                ['/me', '/admin/clients', '/admin/clients/' + id].each { route -> def r = http('GET', route as String, null, tokens.admin, 'test'); assert r.status == 200; noSecrets(r.data) }; break
            case 'errorLeak':
                login('admin'); setupDone = true
                [['POST','/login',[:],null,422], ['GET','/admin/clients/2147483647',null,tokens.admin,404], ['GET','/nfr-route-not-found',null,null,404]].each { row ->
                    def r = http(row[0] as String, row[1] as String, row[2], row[3], 'test'); assert r.status == row[4]
                    assert !(r.text =~ /(?i)SQLSTATE|Stack trace|vendor[\\\/]|\.php on line/).find() : 'Error disclosure'; debugKeys(r.data)
                }; break
            case 'enumeration':
                newClient('coach'); setupDone = true
                def unknown = http('POST', '/login', [email: 'absent-' + email, password: 'Wrong123!'], null, 'test')
                def known = http('POST', '/login', [email: email, password: 'Wrong123!'], null, 'test')
                observations = [unknownStatus: unknown.status, knownStatus: known.status, unknownMessage: unknown.data.message, knownMessage: known.data.message]
                assert unknown.status == 401 && known.status == 401
                assert unknown.data.message == known.data.message : 'PROPOSED policy: account enumeration via different error messages'; break
            case 'rateLimit':
                setupDone = true; def limited = null
                assert scenario.attempts <= 25
                for (int i = 0; i < scenario.attempts; i++) { def r = http('POST', '/login', [email: email, password: 'Wrong123!'], null, 'test'); if (r.status == 429) { limited = r; break }; assert r.status == 401 }
                observations = [attempts: records.count { it.phase == 'test' }, throttled: limited != null, retryAfter: limited?.retryAfter]
                assert limited != null : 'PROPOSED lab anti-abuse policy: no 429 in bounded 25-request login burst'
                assert limited.retryAfter && (limited.retryAfter as int) > 0 : 'Missing positive Retry-After'; break
            default: throw new IllegalArgumentException('Unknown NFR action')
        }
    }
} catch (Throwable e) { failure = e.message ?: e.toString() }
finally {
    clients.each { id -> try { assert http('DELETE', '/admin/clients/' + id, null, login('admin'), 'cleanup').status in [200,404] } catch (Throwable ignored) { cleanupErrors << 'QA client cleanup failed: ' + id } }
    allTokens.each { token -> try { assert http('POST', '/logout', null, token, 'cleanup').status in [200,401] } catch (Throwable ignored) { cleanupErrors << 'Issued-token cleanup failed' } }
}
if (cleanupErrors) failure = ([failure] + cleanupErrors).findAll { it }.join('; ')
def result = [id: scenario.id, title: scenario.title, suite: scenario.suite, category: scenario.category,
    result: failure ? (setupDone ? 'Fail' : 'Blocked') : 'Pass', error: failure, knownDefect: scenario.defect,
    durationMs: Math.round((System.nanoTime() - started) / 1000000d), metrics: metrics, observations: observations, requests: records, cleanupErrors: cleanupErrors]
context.setProperty('caseResult', result)
log.info(scenario.id + ' -> ' + result.result + (metrics ? ' ' + JsonOutput.toJson(metrics) : '') + (observations ? ' ' + JsonOutput.toJson(observations) : ''))
if (failure) throw new AssertionError(failure)
