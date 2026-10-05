// Verification harness: execute the actual scripts extracted from the generated ReadyAPI XML.
// Uses a small stand-in for ReadyAPI bindings; it does NOT claim GUI/license validation.
import javax.xml.parsers.DocumentBuilderFactory
import groovy.json.JsonOutput

assert args.length == 3 : 'Usage: verify-readyapi.groovy project.xml baseUrl output.json'
def factory = DocumentBuilderFactory.newInstance()
factory.namespaceAware = true
factory.setFeature('http://apache.org/xml/features/disallow-doctype-decl', true)
def document = factory.newDocumentBuilder().parse(new File(args[0]))
def ns = 'http://eviware.com/soapui/config'
def properties = [:]
def root = document.documentElement
def children = root.childNodes
for (int i = 0; i < children.length; i++) {
    def child = children.item(i)
    if (child.localName == 'properties') {
        def entries = child.getElementsByTagNameNS(ns, 'property')
        for (int j = 0; j < entries.length; j++) {
            def entry = entries.item(j)
            properties[entry.getElementsByTagNameNS(ns, 'name').item(0).textContent] =
                entry.getElementsByTagNameNS(ns, 'value').item(0).textContent
        }
    }
}
properties.baseUrl = args[1]
def cases = document.getElementsByTagNameNS(ns, 'testCase')
def results = []
def logger = new Expando(info: { Object message -> /* response logging suppressed in verifier output */ })
for (int i = 0; i < cases.length; i++) {
    def tc = cases.item(i)
    def script = tc.getElementsByTagName('script').item(0).textContent
    def project = new Expando(getPropertyValue: { String name -> properties[name] })
    def runner = new Expando(testCase: new Expando(testSuite: new Expando(project: project)))
    def ctx = new Binding()
    def binding = new Binding([testRunner: runner, context: ctx, log: logger])
    try {
        new GroovyShell(binding).evaluate(script, tc.getAttribute('name') + '.groovy')
    } catch (Throwable e) {
        if (!ctx.variables.caseResult) {
            ctx.setVariable('caseResult', [id: tc.getAttribute('name').split(' - ')[0], title: tc.getAttribute('name'), suite: 'Unknown',
                result: 'Blocked', error: e.message ?: e.toString(), durationMs: 0, requests: [], cleanupErrors: []]
            )
        }
    }
    def result = ctx.variables.caseResult
    results << result
    println(result.result.padRight(7) + ' ' + result.id + (result.error ? ' - ' + result.error : ''))
}
new File(args[2]).text = JsonOutput.prettyPrint(JsonOutput.toJson(results))
