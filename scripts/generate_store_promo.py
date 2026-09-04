#!/usr/bin/env python3
import os
from PIL import Image, ImageDraw

def create_store_screenshot():
    w, h = 1280, 800
    im = Image.new('RGB', (w, h), (15, 23, 42))
    draw = ImageDraw.Draw(im)

    # Gradient background
    for y in range(h):
        ratio = y / h
        r = int(10 + ratio * 12)
        g = int(15 + ratio * 20)
        b = int(28 + ratio * 45)
        draw.line([(0, y), (w, y)], fill=(r, g, b))

    # Top header bar of Mockup
    draw.rectangle([60, 40, w - 60, 100], fill=(30, 41, 59), outline=(56, 189, 248, 80), width=1)
    draw.text((85, 60), "Web Scanner — Dead Links & Security Pro", fill=(248, 250, 252), font=None)
    draw.text((w - 320, 60), "Passive Enterprise Audit Mode [ACTIVE]", fill=(16, 185, 129), font=None)

    # Left Column: Security Grade & Compliance (width 360)
    draw.rounded_rectangle([60, 120, 420, 440], radius=12, fill=(30, 41, 59), outline=(51, 65, 85), width=1)
    draw.text((90, 140), "Security Score & Grade", fill=(148, 163, 184), font=None)
    # Big Grade Circle
    draw.ellipse([180, 180, 300, 300], fill=(16, 185, 129, 30), outline=(16, 185, 129), width=3)
    draw.text((232, 225), "A+", fill=(16, 185, 129), font=None)
    draw.text((185, 320), "Hardened & Compliant", fill=(241, 245, 249), font=None)

    # Compliance Bars
    draw.rounded_rectangle([60, 460, 420, 740], radius=12, fill=(30, 41, 59), outline=(51, 65, 85), width=1)
    draw.text((90, 480), "Compliance Readiness", fill=(148, 163, 184), font=None)
    draw.text((90, 520), "KVKK / GDPR Readiness: 92% (Pass)", fill=(56, 189, 248), font=None)
    draw.rounded_rectangle([90, 545, 390, 555], radius=5, fill=(56, 189, 248))

    draw.text((90, 590), "PCI-DSS v4.0 Transport: 100% (Compliant)", fill=(16, 185, 129), font=None)
    draw.rounded_rectangle([90, 615, 390, 625], radius=5, fill=(16, 185, 129))

    draw.text((90, 660), "OWASP Top 10 Application Hygiene: 88%", fill=(245, 158, 11), font=None)
    draw.rounded_rectangle([90, 685, 350, 695], radius=5, fill=(245, 158, 11))

    # Right Column: Findings & Network Inspector (width 740)
    draw.rounded_rectangle([450, 120, w - 60, 440], radius=12, fill=(30, 41, 59), outline=(51, 65, 85), width=1)
    draw.text((480, 140), "Audit Findings & Attack Surface Discovery", fill=(248, 250, 252), font=None)

    findings = [
        ("[HIGH]", (239, 68, 68), "Missing Strict-Transport-Security (HSTS)", "1-Click Fix: Nginx, Cloudflare, Apache"),
        ("[MEDIUM]", (245, 158, 11), "CSP Directive Contains 'unsafe-inline'", "Recommendation: Replace with cryptographic nonces"),
        ("[INFO]", (56, 189, 248), "Discovered 14 Backend API Endpoints in JS", "Identified /api/v1/auth, /internal/config"),
        ("[LOW]", (148, 163, 184), "Missing 'object-src none' in Policy", "1-Click Fix: Add object-src 'none' to header")
    ]

    fy = 180
    for badge, col, title, detail in findings:
        draw.rounded_rectangle([480, fy, w - 90, fy + 52], radius=8, fill=(15, 23, 42), outline=(51, 65, 85))
        draw.text((495, fy + 16), badge, fill=col, font=None)
        draw.text((570, fy + 10), title, fill=(241, 245, 249), font=None)
        draw.text((570, fy + 30), detail, fill=(148, 163, 184), font=None)
        fy += 62

    # Bottom Right: Live Network Traffic Inspector (width 740)
    draw.rounded_rectangle([450, 460, w - 60, 740], radius=12, fill=(30, 41, 59), outline=(51, 65, 85), width=1)
    draw.text((480, 480), "Live Network Traffic Inspector (Target Isolated)", fill=(248, 250, 252), font=None)
    draw.text((w - 260, 480), "● RECORDING ACTIVE", fill=(16, 185, 129), font=None)

    requests = [
        ("200", (16, 185, 129), "POST", "/api/v1/session/verify", "XHR / FETCH", "68 ms"),
        ("304", (56, 189, 248), "GET", "/assets/bundle-core.js", "SCRIPT (JS)", "12 ms"),
        ("200", (16, 185, 129), "GET", "/graphql?query=UserProfile", "FETCH", "44 ms"),
        ("404", (245, 158, 11), "GET", "/.well-known/security.txt", "HTTP REQUEST", "110 ms")
    ]

    ry = 520
    for code, c_col, meth, path, rtype, duration in requests:
        draw.rounded_rectangle([480, ry, w - 90, ry + 42], radius=6, fill=(15, 23, 42))
        draw.text((495, ry + 12), code, fill=c_col, font=None)
        draw.text((545, ry + 12), meth, fill=(248, 250, 252), font=None)
        draw.text((615, ry + 12), path, fill=(56, 189, 248), font=None)
        draw.text((960, ry + 12), rtype, fill=(148, 163, 184), font=None)
        draw.text((w - 160, ry + 12), duration, fill=(100, 116, 139), font=None)
        ry += 50

    im.save('public/icons/store_screenshot_1280x800.png')
    print("Saved public/icons/store_screenshot_1280x800.png")

create_store_screenshot()
