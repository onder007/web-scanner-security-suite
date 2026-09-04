#!/usr/bin/env python3
import os
import math
from PIL import Image, ImageDraw, ImageFont

def create_icon(size):
    # Render at 4x for super crisp anti-aliasing
    scale = 4
    canvas_size = size * scale
    im = Image.new('RGBA', (canvas_size, canvas_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(im)

    # 1. Background Rounded Rect / Shield with vibrant gradient
    pad = int(canvas_size * 0.06)
    w = canvas_size - 2 * pad
    h = canvas_size - 2 * pad

    # Gradient background: Deep indigo/violet to electric cyan
    for y in range(canvas_size):
        ratio = y / canvas_size
        r = int(15 + ratio * 20)
        g = int(23 + ratio * 90)
        b = int(42 + ratio * 180)
        # Rounded mask
        for x in range(canvas_size):
            dx = max(pad, min(x, canvas_size - pad)) - x
            dy = max(pad, min(y, canvas_size - pad)) - y
            dist = math.sqrt(dx*dx + dy*dy)
            corner_r = canvas_size * 0.22
            # Distance from corners
            corners = [
                (pad + corner_r, pad + corner_r),
                (canvas_size - pad - corner_r, pad + corner_r),
                (pad + corner_r, canvas_size - pad - corner_r),
                (canvas_size - pad - corner_r, canvas_size - pad - corner_r)
            ]
            in_bounds = True
            for cx, cy in corners:
                if (x < cx if cx < canvas_size/2 else x > cx) and (y < cy if cy < canvas_size/2 else y > cy):
                    if math.hypot(x - cx, y - cy) > corner_r:
                        in_bounds = False
                        break
            if in_bounds:
                draw.point((x, y), fill=(r, g, b, 255))

    # 2. Outer glowing ring
    border_col = (56, 189, 248, 220) # Sky blue
    draw.rounded_rectangle(
        [pad, pad, canvas_size - pad, canvas_size - pad],
        radius=int(canvas_size * 0.22),
        outline=border_col,
        width=int(scale * 1.5)
    )

    # 3. Draw a modern Shield Symbol in the center
    cx, cy = canvas_size / 2, canvas_size / 2
    sw = canvas_size * 0.52
    sh = canvas_size * 0.58
    top_y = cy - sh * 0.46
    mid_y = cy + sh * 0.08
    bot_y = cy + sh * 0.52

    shield_pts = [
        (cx - sw/2, top_y),
        (cx + sw/2, top_y),
        (cx + sw/2, mid_y),
        (cx, bot_y),
        (cx - sw/2, mid_y)
    ]
    # Draw shield gradient fill
    draw.polygon(shield_pts, fill=(30, 41, 59, 230))
    draw.polygon(shield_pts, outline=(56, 189, 248, 255), width=int(scale * 2.5))

    # 4. Draw a checkmark or lightning / link in shield
    lw = int(scale * 2.2)
    # Checkmark/radar line
    check_col = (16, 185, 129, 255) # Emerald green
    check_pts = [
        (cx - sw * 0.22, cy - sh * 0.02),
        (cx - sw * 0.04, cy + sh * 0.16),
        (cx + sw * 0.26, cy - sh * 0.16)
    ]
    draw.line([check_pts[0], check_pts[1]], fill=check_col, width=lw, joint='curve')
    draw.line([check_pts[1], check_pts[2]], fill=check_col, width=lw, joint='curve')

    # Downscale smoothly to target size
    final_im = im.resize((size, size), Image.Resampling.LANCZOS)
    return final_im

def create_marquee():
    w, h = 440, 280
    im = Image.new('RGBA', (w, h), (15, 23, 42, 255))
    draw = ImageDraw.Draw(im)

    # Gradient background
    for y in range(h):
        ratio = y / h
        r = int(10 + ratio * 15)
        g = int(15 + ratio * 25)
        b = int(30 + ratio * 60)
        draw.line([(0, y), (w, y)], fill=(r, g, b, 255))

    # Decorative glow circles
    glow = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.ellipse([-50, -50, 200, 200], fill=(56, 189, 248, 35))
    glow_draw.ellipse([250, 100, 500, 350], fill=(99, 102, 241, 40))
    im = Image.alpha_composite(im, glow)
    draw = ImageDraw.Draw(im)

    # Embed Icon (size 96)
    icon = create_icon(96)
    im.paste(icon, (35, 92), icon)

    # Titles and Texts
    draw.text((150, 95), "Web Scanner", fill=(248, 250, 252), font=None)
    draw.text((150, 120), "Dead Links & Security", fill=(56, 189, 248), font=None)
    draw.text((150, 150), "• Deep Vulnerability Auditing", fill=(148, 163, 184), font=None)
    draw.text((150, 170), "• Live Network Traffic Inspector", fill=(148, 163, 184), font=None)
    draw.text((150, 190), "• 1-Click Server Remediation Code", fill=(16, 185, 129), font=None)

    # Border
    draw.rectangle([0, 0, w - 1, h - 1], outline=(56, 189, 248, 100), width=1)
    return im

os.makedirs('public/icons', exist_ok=True)
for sz in [16, 48, 128]:
    icon = create_icon(sz)
    icon.save(f'public/icons/icon{sz}.png')
    print(f'Saved public/icons/icon{sz}.png')

marquee = create_marquee()
marquee.save('public/icons/marquee_440x280.png')
print('Saved public/icons/marquee_440x280.png')
