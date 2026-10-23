#!/usr/bin/env python3
"""Sweep for remote roles open to India at Aditi's level.

Sources: Himalayas search API (roles tagged India or worldwide) and every YC
company that is hiring (each company's public /jobs page).

Usage:
    python3 remote_leads.py himalayas OUT.json     # ~4 min
    python3 remote_leads.py yc OUT_DIR             # ~2 min, writes OUT_DIR/co_jobs.json
    python3 remote_leads.py filter HIMALAYAS.json YC_CO_JOBS.json [--since YYYY-MM-DD]

The filter keeps roles that are remote, open to India (or worldwide), at most
4 years of experience asked, not a narrow specialist title, and not a company
listed in seen_companies.txt. Output is a short table for a human to read. It
sends nothing and writes nothing outside the files you name.

Always confirm a listing is live on the employer's own board before telling
Aditi about it. Himalayas pages return 403 to curl, so check the company's ATS
(Greenhouse, Ashby, Lever, Recruitee) instead.
"""
import ast, concurrent.futures as cf, datetime, html, json, os, re, sys, time, urllib.parse, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
UA = {"User-Agent": "Mozilla/5.0"}

QUERIES = [
    # ops and strategy
    "chief of staff", "founder's office", "founders associate", "business operations", "bizops",
    "strategy operations", "special projects", "operations manager", "operations lead",
    "operations associate", "operations analyst", "program manager", "project lead",
    "strategic projects", "revenue operations", "gtm operations", "implementation manager",
    "customer operations", "delivery manager", "operations generalist", "strategy associate",
    "strategic initiatives", "product operations", "business analyst", "strategy analyst",
    # marketing, growth, data mix
    "marketing manager", "marketing associate", "marketing generalist", "growth manager",
    "growth associate", "growth marketing", "product marketing", "brand marketing",
    "community manager", "partnerships manager", "partnerships associate", "go to market",
    "gtm", "data analyst", "marketing analyst", "growth analyst", "founding marketer",
    "customer success manager", "client success", "onboarding manager", "research analyst",
    "program coordinator", "project coordinator",
]

TITLE_OK = re.compile(
    r"chief of staff|founder|office of the|business operations|biz ?ops|strategy|strategic|special projects|"
    r"operations|\bops\b|program|project|generalist|implementation|deployment|delivery|launch|expansion|"
    r"partner|business analyst|data analyst|analyst|marketing|growth|brand|community|gtm|go-to-market|"
    r"customer success|client success|onboarding|coordinator|associate|research|insights", re.I)
TITLE_BAD = re.compile(
    r"engineer|developer|designer|scientist|account executive|\bsdr\b|\bbdr\b|sales development|recruit|talent|"
    r"intern\b|internship|head of|\bvp\b|vice president|director|principal|counsel|accountant|nurse|technician|"
    r"writer|video|\bseo\b|ppc|paid (search|social|media)|performance market|ugc|creator|copywriter|graphic|"
    r"affiliate|sales rep|assistant|tutor|teacher|commission|medical|clinical|payroll|bookkeep|legal|\btax\b|"
    r"\baml\b|\bkyc\b|fraud|support (agent|specialist|engineer)|help ?desk|it support|compliance|procurement|"
    r"supply chain|logistics|warehouse|driver|\bhr\b|human resources|benefits|annotat|transcri|translator|"
    r"moderator|senior|\bsr\b|staff|architect|attorney|devops|security|quantitative|volunteer", re.I)
US_ONLY = re.compile(
    r"authori[sz]ed to work in the (u\.?s|united states)|must (be|reside|live)[^.]{0,40}(united states|u\.s\.|\busa?\b|canada|europe|\buk\b)|"
    r"\bus[- ]based\b|us only|usa only|hybrid|on-?site|\best hours|pst hours|\bet hours|us time ?zones?", re.I)


def get(url, timeout=40):
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout).read().decode("utf-8", "ignore")


def himalayas(out):
    def one(q):
        found = {}
        for flt in ("country=India", "worldwide=true"):
            cursor = None
            for _ in range(5):
                url = f"https://himalayas.app/jobs/api/search?q={urllib.parse.quote(q)}&{flt}" + (f"&cursor={cursor}" if cursor else "")
                try:
                    d = json.loads(get(url, 30))
                except Exception:
                    break
                for j in d.get("jobs", []):
                    found[j["guid"]] = j
                cursor = d.get("nextCursor")
                if not cursor or not d.get("jobs"):
                    break
                time.sleep(0.2)
        return found
    res = {}
    with cf.ThreadPoolExecutor(6) as ex:
        for f in ex.map(one, QUERIES):
            res.update(f)
    json.dump(list(res.values()), open(out, "w"))
    print("himalayas jobs", len(res))


def yc(outdir):
    os.makedirs(outdir, exist_ok=True)
    cos = json.loads(get("https://yc-oss.github.io/api/companies/hiring.json", 90))
    def go(c):
        try:
            s = get(f"https://www.ycombinator.com/companies/{c['slug']}/jobs", 25)
            m = re.search(r'data-page="([^"]+)"', s)
            if not m:
                return c["slug"], []
            p = json.loads(html.unescape(m.group(1)))["props"]
            return c["slug"], p.get("jobPostings") or (p.get("company") or {}).get("jobPostings") or []
        except Exception:
            return c["slug"], None
    out, fail = {}, 0
    with cf.ThreadPoolExecutor(24) as ex:
        for slug, jobs in ex.map(go, cos):
            if jobs is None:
                fail += 1
            else:
                out[slug] = jobs
    json.dump(out, open(os.path.join(outdir, "co_jobs.json"), "w"))
    print("yc companies", len(out), "failed", fail, "jobs", sum(len(v) for v in out.values()))


def seen():
    s = set()
    p = os.path.join(HERE, "seen_companies.txt")
    if os.path.exists(p):
        for line in open(p):
            line = line.split("#")[0].strip().lower()
            if line:
                s.add(re.sub(r"[^a-z0-9]", "", line))
    return s


def years(text):
    m = [int(x) for x in re.findall(r"(\d{1,2})\s*\+?\s*(?:-|–|to)?\s*\d{0,2}\+?\s*years", text, re.I) if int(x) < 20]
    return min(m) if m else None


def lst(x):
    if isinstance(x, str):
        try:
            x = ast.literal_eval(x)
        except Exception:
            return []
    return [i if isinstance(i, str) else i.get("name", "") for i in x or []]


def filt(him_path, yc_path, since):
    skip = seen()
    cut = int(datetime.datetime.strptime(since, "%Y-%m-%d").timestamp()) if since else 0
    rows = []
    for j in json.load(open(him_path)):
        t, co = j["title"], j.get("companySlug", "")
        if re.sub(r"[^a-z0-9]", "", co.lower()) in skip or re.sub(r"[^a-z0-9]", "", j.get("companyName", "").lower()) in skip:
            continue
        if TITLE_BAD.search(t) or not TITLE_OK.search(t) or int(j["pubDate"]) < cut:
            continue
        names = lst(j.get("locationRestrictions"))
        if names and "India" not in names:
            continue
        d = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html.unescape(j.get("description") or "")))
        y = years(d)
        if (y is not None and y >= 5) or US_ONLY.search(d):
            continue
        sal = f"{j.get('currency')} {j.get('minSalary')}-{j.get('maxSalary')}/{j.get('salaryPeriod')}" if j.get("minSalary") not in (None, "None") else ""
        rows.append(("himalayas", j.get("companyName", co), t, ",".join(names) or "worldwide", y, sal,
                     datetime.datetime.utcfromtimestamp(int(j["pubDate"])).strftime("%Y-%m-%d"), j["guid"]))
    if yc_path:
        for slug, jobs in json.load(open(yc_path)).items():
            if re.sub(r"[^a-z0-9]", "", slug.lower()) in skip:
                continue
            for j in jobs:
                t, loc = j.get("title", ""), j.get("location") or ""
                if TITLE_BAD.search(t) or not TITLE_OK.search(t) or "remote" not in loc.lower():
                    continue
                if j.get("role") in ("eng", "design", "science", "legal", "finance"):
                    continue
                india = bool(re.search(r"india|\bin\b|anywhere|global|worldwide|apac|asia", loc, re.I))
                if not india and re.search(r"remote \((us|usa|united states|ca|canada|uk|gb|eu|europe|latam)", loc, re.I):
                    continue
                if "citizen" in (j.get("visa") or "").lower() and not india:
                    continue
                exp = j.get("minExperience") or ""
                m = re.match(r"(\d+)\+", exp)
                if m and int(m.group(1)) >= 5:
                    continue
                rows.append(("yc", f"{slug} ({j.get('companyBatchName')})", t, loc[:40], exp, j.get("salaryRange") or "",
                             j.get("createdAt") or "", "https://www.ycombinator.com" + j["url"]))
    rows.sort(key=lambda r: (r[0], r[1].lower()))
    for r in rows:
        print(" | ".join(str(x) for x in r))
    print(len(rows), "candidates", file=sys.stderr)


if __name__ == "__main__":
    a = sys.argv[1:]
    if a[:1] == ["himalayas"] and len(a) == 2:
        himalayas(a[1])
    elif a[:1] == ["yc"] and len(a) == 2:
        yc(a[1])
    elif a[:1] == ["filter"] and len(a) >= 3:
        since = a[a.index("--since") + 1] if "--since" in a else None
        filt(a[1], a[2] if a[2] != "-" else None, since)
    else:
        print(__doc__)
