"""Insert/refresh a tools/<name>.js block inside dev/index.html between // <<name and // name>> markers (before libView)."""
import sys, re
name = sys.argv[1]
p = "dev/index.html"; s = open(p, encoding="utf-8").read()
code = open(f"tools/{name}.js", encoding="utf-8").read()
block = f"// <<{name}\n{code}\n// {name}>>\n"
m = re.search(rf"// <<{name}\n[\s\S]*?// {name}>>\n", s)
if m: s = s[:m.start()] + block + s[m.end():]
else:
    i = s.index("function libView() {"); s = s[:i] + block + s[i:]
open(p, "w", encoding="utf-8").write(s); print("injected", name)
