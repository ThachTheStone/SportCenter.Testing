// Actual generated NFR XML scripts, stand-in bindings. NOT ReadyAPI Desktop evidence.
import javax.xml.parsers.DocumentBuilderFactory
import groovy.json.JsonOutput
assert args.length == 3
def factory = DocumentBuilderFactory.newInstance()
factory.namespaceAware = true
factory.setFeature('http://apache.org/xml/features/disallow-doctype-decl', true)
def document = factory.newDocumentBuilder().parse(new File(args[0]))
def ns = 'http://eviware.com/soapui/config', properties = [:]
def children = document.documentElement.childNodes
for (int i = 0; i < children.length; i++) {
    def child = children.item(i)
    if (child.localName == 'properties') {
        def entries = child.getElementsByTagNameNS(ns, 'property')
        for (int j = 0; j < entries.length; j++) { def entry = entries.item(j); properties[entry.getElementsByTagNameNS(ns, 'name').item(0).textContent] = entry.getElementsByTagNameNS(ns, 'value').item(0).textContent }
    }
}
properties.baseUrl = args[1]
properties.nfrLabOnly = 'true'
def cases = document.getElementsByTagNameNS(ns, 'testCase'), results = []
for (int i = 0; i < cases.length; i++) {
    def tc = cases.item(i), script = tc.getElementsByTagName('script').item(0).textContent
    def project = new Expando(getPropertyValue: { String name -> properties[name] })
    def runner = new Expando(testCase: new Expando(testSuite: new Expando(project: project)))
    def ctx = new Binding(), logger = new Expando(info: { Object message -> })
    try { new GroovyShell(new Binding([testRunner: runner, context: ctx, log: logger])).evaluate(script, tc.getAttribute('name') + '.groovy') }
    catch (Throwable e) { if (!ctx.variables.caseResult) ctx.setVariable('caseResult', [id: tc.getAttribute('name').split(' - ')[0], title: tc.getAttribute('name'), suite: 'NFR', category: 'Unknown', result: 'Blocked', error: e.message ?: e.toString(), durationMs: 0, requests: [], cleanupErrors: []]) }
    results << ctx.variables.caseResult
    println(results.last().result.padRight(7) + ' ' + results.last().id)
}
new File(args[2]).text = JsonOutput.prettyPrint(JsonOutput.toJson(results))
