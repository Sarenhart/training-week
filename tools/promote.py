#!/usr/bin/env python3
"""Copy the DEV app (../training-week-dev) into the main app (this repo): main-app storage keys (tw.*), no DEV bar,
no DEV-only buttons, main-app names. Run from the training-weel root, then bump sw.js and test before pushing."""
import re, shutil, sys
DEV = "../training-week-dev"
s = open(f"{DEV}/index.html", encoding="utf-8").read()
def cut(a, b, label):
    global s
    i = s.index(a); j = s.index(b, i) + len(b); s = s[:i] + s[j:]; print("removed", label)
# DEV bar markup + its script, and its CSS
cut('<div class="devbar"', '</script>\n', "DEV bar")
s = "\n".join(l for l in s.split("\n") if not l.startswith(".devbar")); print("removed DEV bar CSS")
# DEV-only buttons
for a in ['<button type="button" class="linkbtn" data-act="bkdemo">DEV: preview the backup reminder</button>',
          '<button type="button" class="linkbtn" data-act="obskip">DEV: skip setup and keep my current programme</button>']:
    n = s.count(a); s = s.replace(a, ""); print("removed", n, a[:60])
# names and storage
s = s.replace("<title>Training Week DEV</title>", "<title>Training Week</title>").replace('content="TW Dev"', 'content="Training"')
s = s.replace("Training Week DEV backup", "Training Week backup")
s = s.replace("twdev.", "tw.")
assert "twdev." not in s, "twdev storage key left"
open("index.html", "w", encoding="utf-8").write(s)
shutil.copy(f"{DEV}/library.js", "library.js")
w = open("sw.js").read()
if "./library.js" not in w: w = w.replace('"./index.html", ', '"./index.html", "./library.js", ')
open("sw.js", "w").write(w)
print("done – now bump the cache in sw.js and test")
