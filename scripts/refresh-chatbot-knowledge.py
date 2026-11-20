"""Refresh the public evidence used by /chatbot. Requires requests and beautifulsoup4."""
import concurrent.futures
import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup

SITE = "https://talkerstein.com"
ROOT = Path(__file__).resolve().parents[1]
CORE = {"/", "/about-us", "/services", "/our-process", "/contact", "/work", "/business-resources"}


# Omit commercial figures and rate-card copy from the public assistant's evidence.
PRICING = re.compile(
    r"[$£€¥]|\b(?:pricing|prices?|priced|fees?|rates?\s+(?:start|from)|rate\s+card|hourly\s+rate|"
    r"retainer\s+(?:of|starts)|starting\s+(?:at|from)|costs?\s+between|per\s+(?:hour|month)\b|"
    r"CAD|USD|dollars?|cents?)\b|\b\d[\d,.]*\s*(?:/\s*(?:mo|hr|month|hour)|[kK]\s+(?:per|a)\s+month)",
    re.IGNORECASE,
)


def public_copy(text):
    return "\n".join(line for line in text.splitlines() if not PRICING.search(line))


def fetch_page(url):
    response = requests.get(url, timeout=30)
    response.raise_for_status()
    if urlparse(response.url).hostname != "talkerstein.com":
        raise ValueError(f"Unexpected destination for {url}")
    soup = BeautifulSoup(response.content.decode("utf-8"), "html.parser")
    title = soup.find("meta", property="og:title")
    title = (title.get("content") if title else soup.title.get_text(strip=True)).strip()
    description = soup.find("meta", attrs={"name": "description"})
    paragraphs = [description["content"].strip()] if description and description.get("content") else []
    for tag in soup.select("nav, footer, header, [aria-hidden=true], script, style"):
        tag.decompose()
    for tag in soup.select("h1,h2,h3,h4,p,li"):
        value = " ".join(tag.stripped_strings)
        is_case_label = "/work/" in url and 3 <= len(value) < 45 and not tag.find_parent("a")
        if (len(value) >= 45 or is_case_label) and value not in paragraphs:
            paragraphs.append(value)
    return {"url": url, "title": title, "text": public_copy("\n".join(dict.fromkeys(paragraphs)))[:5200]}


def main():
    response = requests.get(SITE + "/sitemap.xml", timeout=30)
    response.raise_for_status()
    urls = {entry.text for entry in ET.fromstring(response.content).findall(".//{*}loc")}
    selected = sorted(url for url in urls if urlparse(url).hostname == "talkerstein.com" and
                      (urlparse(url).path in CORE or re.fullmatch(r"/(?:services|work)/[\w-]+", urlparse(url).path)))
    if not selected or SITE + "/work/fringe-boutique" not in selected:
        raise ValueError("Expected agency and case-study pages in sitemap")
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        pages = list(pool.map(fetch_page, selected))
    pages = [page for page in pages if not PRICING.search(page["title"] + " " + page["url"])]
    if any(not page["text"] for page in pages):
        raise ValueError("A source is missing its text")
    target = ROOT / "lib/chatbot/knowledge.json"
    target.parent.mkdir(parents=True, exist_ok=True)
    temp = target.with_suffix(".tmp")
    temp.write_text(json.dumps(pages, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temp.replace(target)
    print(f"Indexed {len(pages)} public pages")


if __name__ == "__main__":
    main()
