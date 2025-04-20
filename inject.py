from mitmproxy import ctx

with open("inject.js", "r") as f:
    INJECT_JS = f.read()

def response(flow):
    host = flow.request.pretty_host
    ctype = flow.response.headers.get("Content-Type", "")
    # target any HTML from tradingview.com
    if host.endswith("tradingview.com") and "text/html" in ctype:
        flow.response.headers.pop("content-security-policy", None)
        html = flow.response.get_text()
        if "</head>" in html:
            patched = html.replace(
                "</head>",
                f"<script>{INJECT_JS}</script></head>"
            )
            flow.response.set_text(patched)
