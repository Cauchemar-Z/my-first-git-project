#!/usr/bin/env python3
import os, yaml
from github import Github

tok = os.getenv("GH_TOKEN_W") or os.getenv("GH_TOKEN") or os.getenv("GITHUB_TOKEN")
if not tok: raise SystemExit("Missing GH_TOKEN_W")
gh = Github(tok); me = gh.get_user()
conf = yaml.safe_load(open("configs/taxonomy.yaml"))
labels_conf = conf["labels"]; triage = conf["triage_issue"]

def ensure_labels(repo):
    exist = {x.name for x in repo.get_labels()}
    for L in labels_conf:
        if L["name"] not in exist:
            repo.create_label(L["name"], L["color"])

def ensure_triage(repo):
    for i in repo.get_issues(state="open"):
        if i.title == triage["title"]:
            return
    repo.create_issue(title=triage["title"], body=triage["body"])

for r in me.get_repos(visibility="private"):
    if r.archived: continue
    ensure_labels(r); ensure_triage(r)
print("Applied taxonomy to private repos.")