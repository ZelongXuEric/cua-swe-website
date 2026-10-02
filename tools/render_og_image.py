#!/usr/bin/env python3
"""Render tools/og-image.html to assets/media/og-image.png (1200x630 link preview).
Requires Playwright with a Chromium build (pip install playwright; playwright install chromium).
Re-run after the overview strip images in assets/media/hero change.
"""
import pathlib
from playwright.sync_api import sync_playwright

REPO = pathlib.Path(__file__).resolve().parents[1]
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1200, "height": 630})
    page.goto((REPO / "tools/og-image.html").as_uri(), wait_until="networkidle")
    page.screenshot(path=str(REPO / "assets/media/og-image.png"))
    browser.close()
print("assets/media/og-image.png")
