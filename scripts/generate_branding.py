import math
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

def create_rode_avatar(size=1024):
    scale = 2
    w = size * scale
    h = size * scale
    
    # 1. Base circle
    cx = w // 2
    cy = h // 2
    r = int(w * 0.46)
    
    # Gradient background
    base_circle = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    base_draw = ImageDraw.Draw(base_circle)
    base_draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(255, 255, 255, 255))
    
    grad = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    grad_draw = ImageDraw.Draw(grad)
    
    # Top-to-bottom vibrant emerald gradient
    # Top: #00f076 (0, 240, 118)
    # Mid-top: #00c853 (0, 200, 83)
    # Mid-bot: #009640 (0, 150, 64)
    # Bottom: #004d2c (0, 77, 44)
    for y in range(h):
        f = y / h
        if f < 0.5:
            # 0.0 to 0.5: #00f076 -> #00c853
            t = f / 0.5
            red = int(0 * (1 - t) + 0 * t)
            green = int(242 * (1 - t) + 195 * t)
            blue = int(122 * (1 - t) + 80 * t)
        else:
            # 0.5 to 1.0: #00c853 -> #004d2c
            t = (f - 0.5) / 0.5
            red = int(0 * (1 - t) + 0 * t)
            green = int(195 * (1 - t) + 72 * t)
            blue = int(80 * (1 - t) + 40 * t)
        grad_draw.line([(0, y), (w, y)], fill=(red, green, blue, 255))
        
    circle_img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    circle_img.paste(grad, (0, 0), mask=base_circle)
    
    # Top rim highlight (3D sphere effect)
    highlight = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    hl_draw = ImageDraw.Draw(highlight)
    for i in range(50):
        alpha = int(55 * (1.0 - i / 50.0))
        hl_r = r - i * 2
        if hl_r > 0:
            hl_draw.arc([cx - hl_r, cy - hl_r, cx + hl_r, cy + hl_r], start=200, end=340, fill=(255, 255, 255, alpha), width=3)
    highlight = highlight.filter(ImageFilter.GaussianBlur(10 * scale))
    circle_img = Image.alpha_composite(circle_img, highlight)

    # 2. Central Origami "R" Emblem
    # Designed with geometric crisp precision matching the oxDesktop origami jet
    S = r * 0.50
    
    # Coordinates for origami "R":
    # Vertical spine left:
    x_left = cx - S * 0.52
    x_spine_mid = cx - S * 0.22
    x_loop_inner = cx - S * 0.05
    x_loop_apex = cx + S * 0.56
    x_loop_outer = cx + S * 0.35
    x_leg_tip = cx + S * 0.62
    x_leg_inner = cx + S * 0.28

    y_top = cy - S * 0.72
    y_loop_apex = cy - S * 0.30
    y_waist = cy + S * 0.08
    y_bottom = cy + S * 0.72
    
    # Vertices
    v_top_left = (x_left, y_top)
    v_top_mid = (x_spine_mid, y_top)
    v_spine_crease = (x_left + S * 0.15, cy)
    v_bot_left = (x_left, y_bottom)
    v_bot_mid = (x_spine_mid, y_bottom)
    v_waist_left = (x_spine_mid, y_waist)
    
    # Loop outer
    v_loop_top_corner = (cx + S * 0.32, y_top)
    v_loop_apex = (x_loop_apex, y_loop_apex)
    v_loop_bot_corner = (x_spine_mid + S * 0.40, y_waist)
    v_loop_crease = (cx + S * 0.28, y_loop_apex)
    
    # Loop inner cutout (diamond origami fold)
    v_inner_top = (x_spine_mid + S * 0.12, y_top + S * 0.20)
    v_inner_apex = (x_loop_apex - S * 0.25, y_loop_apex)
    v_inner_bot = (x_spine_mid + S * 0.12, y_waist - S * 0.12)
    
    # Leg
    v_leg_top_outer = (x_loop_apex - S * 0.05, y_waist + S * 0.10)
    v_leg_tip_outer = (x_leg_tip, y_bottom)
    v_leg_tip_inner = (x_leg_inner, y_bottom)
    v_leg_crotch = (x_spine_mid + S * 0.08, y_waist)
    v_leg_ridge = (cx + S * 0.38, cy + S * 0.42)
    
    # Drop shadow of the emblem
    shadow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shadow)
    so_y = int(18 * scale)
    so_x = int(0)
    
    # Combined outline for drop shadow
    shadow_poly = [
        (v_top_left[0] + so_x, v_top_left[1] + so_y),
        (v_loop_top_corner[0] + so_x, v_loop_top_corner[1] + so_y),
        (v_loop_apex[0] + so_x, v_loop_apex[1] + so_y),
        (v_leg_tip_outer[0] + so_x, v_leg_tip_outer[1] + so_y),
        (v_leg_tip_inner[0] + so_x, v_leg_tip_inner[1] + so_y),
        (v_waist_left[0] + so_x, v_waist_left[1] + so_y),
        (v_bot_mid[0] + so_x, v_bot_mid[1] + so_y),
        (v_bot_left[0] + so_x, v_bot_left[1] + so_y),
    ]
    s_draw.polygon(shadow_poly, fill=(0, 35, 18, 120))
    shadow = shadow.filter(ImageFilter.GaussianBlur(18 * scale))
    circle_img = Image.alpha_composite(circle_img, shadow)

    # Emblem facets with realistic 3D origami shading
    # Colors:
    c_white_pure   = (255, 255, 255, 255) # Key light
    c_white_warm   = (246, 250, 248, 255) # Front surface
    c_facet_light  = (234, 245, 240, 255) # Top-right fold
    c_facet_mid    = (216, 235, 227, 255) # Angled fold
    c_facet_dark   = (192, 220, 209, 255) # Inner crease
    c_facet_accent = (175, 208, 196, 255) # Deepest shadow facet

    emblem = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    e_draw = ImageDraw.Draw(emblem)
    
    # 1. Left stem - left facet (pure white ridge)
    e_draw.polygon([v_top_left, (x_left + S * 0.12, cy), v_bot_left], fill=c_white_pure)
    
    # 2. Left stem - right facet (soft shadow)
    e_draw.polygon([v_top_left, v_top_mid, v_bot_mid, v_bot_left, (x_left + S * 0.12, cy)], fill=c_white_warm)

    # 3. Top loop - upper facet (pure white)
    e_draw.polygon([v_top_mid, v_loop_top_corner, v_loop_apex, v_loop_crease], fill=c_white_pure)

    # 4. Top loop - lower outer facet (light mint facet)
    e_draw.polygon([v_loop_crease, v_loop_apex, v_loop_bot_corner, v_waist_left], fill=c_facet_light)

    # 5. Inner loop cutout (shadow facet)
    e_draw.polygon([v_top_mid, v_loop_crease, v_waist_left, (v_top_mid[0] + S * 0.08, cy - S * 0.25)], fill=c_facet_dark)

    # 6. Diagonal leg - upper ridge facet (pure white)
    e_draw.polygon([v_waist_left, v_loop_bot_corner, v_leg_tip_outer, v_leg_ridge], fill=c_white_pure)

    # 7. Diagonal leg - bottom fold facet (medium shadow)
    e_draw.polygon([v_waist_left, v_leg_ridge, v_leg_tip_outer, v_leg_tip_inner, v_leg_crotch], fill=c_facet_mid)

    circle_img = Image.alpha_composite(circle_img, emblem)
    
    # Resample down
    return circle_img.resize((size, size), Image.Resampling.LANCZOS)

def create_banner(avatar_img, width=1280, height=360):
    scale = 2
    bw = width * scale
    bh = height * scale
    
    banner = Image.new("RGBA", (bw, bh), (12, 16, 14, 255)) # Dark obsidian
    draw = ImageDraw.Draw(banner)
    
    # 1. Concentric radar circles on background
    radar_cx = int(220 * scale)
    radar_cy = int(175 * scale)
    
    radar_radii = [180, 280, 420, 580, 780, 1020]
    for r in radar_radii:
        rad_px = int(r * scale)
        draw.ellipse([radar_cx - rad_px, radar_cy - rad_px, radar_cx + rad_px, radar_cy + rad_px],
                     outline=(0, 230, 118, 18), width=int(1.5 * scale))

    # Watermark: faint silhouette of emblem on the right side
    watermark_size = int(320 * scale)
    wm = avatar_img.resize((watermark_size, watermark_size), Image.Resampling.LANCZOS).convert("RGBA")
    # Make watermark very subtle (alpha ~ 12)
    r_ch, g_ch, b_ch, a_ch = wm.split()
    a_ch = a_ch.point(lambda p: int(p * 0.07))
    wm.putalpha(a_ch)
    banner.paste(wm, (bw - watermark_size - int(80 * scale), (bh - watermark_size) // 2), wm)

    # 2. Place Avatar Icon with subtle glow
    av_size = int(185 * scale)
    av_scaled = avatar_img.resize((av_size, av_size), Image.Resampling.LANCZOS)
    av_x = int(90 * scale)
    av_y = (bh - av_size) // 2 - int(8 * scale)
    
    # Avatar glow
    glow = Image.new("RGBA", (bw, bh), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_r = av_size // 2 + int(24 * scale)
    glow_cx = av_x + av_size // 2
    glow_cy = av_y + av_size // 2
    glow_draw.ellipse([glow_cx - glow_r, glow_cy - glow_r, glow_cx + glow_r, glow_cy + glow_r], fill=(0, 230, 118, 45))
    glow = glow.filter(ImageFilter.GaussianBlur(30 * scale))
    banner = Image.alpha_composite(banner, glow)
    
    banner.paste(av_scaled, (av_x, av_y), av_scaled)

    # 3. Typography
    draw = ImageDraw.Draw(banner)
    font_bold_path = r"C:\Windows\Fonts\segoeuib.ttf"
    font_reg_path  = r"C:\Windows\Fonts\segoeui.ttf"
    
    font_title = ImageFont.truetype(font_bold_path, int(38 * scale))
    font_sub   = ImageFont.truetype(font_reg_path, int(17 * scale))
    font_btn   = ImageFont.truetype(font_bold_path, int(16 * scale))
    font_ribbon = ImageFont.truetype(font_bold_path, int(13 * scale))
    
    text_x = av_x + av_size + int(45 * scale)
    
    # Title
    title_text = "Нравится Rode Browser?"
    draw.text((text_x, av_y + int(12 * scale)), title_text, fill=(255, 255, 255, 255), font=font_title)
    
    # Subtitle
    sub_text = "Поставьте звёздочку репозиторию и присоединяйтесь к сообществу WineSquad."
    draw.text((text_x, av_y + int(68 * scale)), sub_text, fill=(158, 175, 166, 255), font=font_sub)
    
    # Button: Pill shaped
    btn_x = text_x
    btn_y = av_y + int(112 * scale)
    btn_w = int(220 * scale)
    btn_h = int(46 * scale)
    btn_r = btn_h // 2
    
    # Draw button with bright emerald gradient
    btn_img = Image.new("RGBA", (btn_w, btn_h), (0, 0, 0, 0))
    btn_draw = ImageDraw.Draw(btn_img)
    btn_draw.rounded_rectangle([0, 0, btn_w, btn_h], radius=btn_r, fill=(0, 200, 83, 255))
    
    # Button top highlight line
    for bx in range(btn_w):
        bfactor = bx / btn_w
        red = int(0)
        green = int(200 + bfactor * 40)
        blue = int(83 + bfactor * 40)
        btn_draw.line([(bx, 0), (bx, btn_h)], fill=(red, green, blue, 255))
        
    btn_mask = Image.new("L", (btn_w, btn_h), 0)
    btn_mask_draw = ImageDraw.Draw(btn_mask)
    btn_mask_draw.rounded_rectangle([0, 0, btn_w, btn_h], radius=btn_r, fill=255)
    
    btn_final = Image.new("RGBA", (btn_w, btn_h), (0, 0, 0, 0))
    btn_final.paste(btn_img, (0, 0), mask=btn_mask)
    
    # Button text: ★ Поставить звезду
    btn_text = "★  Поставить звезду"
    b_bbox = font_btn.getbbox(btn_text)
    tw = b_bbox[2] - b_bbox[0]
    th = b_bbox[3] - b_bbox[1]
    btn_text_draw = ImageDraw.Draw(btn_final)
    btn_text_draw.text(((btn_w - tw) // 2, (btn_h - th) // 2 - int(2 * scale)), btn_text, fill=(255, 255, 255, 255), font=font_btn)
    
    banner.paste(btn_final, (btn_x, btn_y), btn_final)

    # 4. Bottom Ribbon: "RODE BROWSER • КЛИЕНТ НОВОГО ПОКОЛЕНИЯ" (без звездочек!)
    ribbon_w = int(470 * scale)
    ribbon_h = int(32 * scale)
    ribbon_x = (bw - ribbon_w) // 2
    ribbon_y = bh - ribbon_h
    ribbon_r = int(9 * scale)
    
    ribbon_img = Image.new("RGBA", (ribbon_w, ribbon_h), (0, 0, 0, 0))
    ribbon_draw = ImageDraw.Draw(ribbon_img)
    
    for rx in range(ribbon_w):
        rfactor = rx / ribbon_w
        # Gradient across ribbon
        red = 0
        green = int(185 + math.sin(rfactor * math.pi) * 55)
        blue = int(75 + math.sin(rfactor * math.pi) * 45)
        ribbon_draw.line([(rx, 0), (rx, ribbon_h)], fill=(red, green, blue, 255))
        
    ribbon_mask = Image.new("L", (ribbon_w, ribbon_h), 0)
    rm_draw = ImageDraw.Draw(ribbon_mask)
    rm_draw.rounded_rectangle([0, 0, ribbon_w, ribbon_h + ribbon_r * 2], radius=ribbon_r, fill=255)
    
    ribbon_final = Image.new("RGBA", (ribbon_w, ribbon_h), (0, 0, 0, 0))
    ribbon_final.paste(ribbon_img, (0, 0), mask=ribbon_mask)
    
    ribbon_text = "RODE BROWSER  •  КЛИЕНТ НОВОГО ПОКОЛЕНИЯ"
    rb_bbox = font_ribbon.getbbox(ribbon_text)
    rtw = rb_bbox[2] - rb_bbox[0]
    rth = rb_bbox[3] - rb_bbox[1]
    rib_draw = ImageDraw.Draw(ribbon_final)
    rib_draw.text(((ribbon_w - rtw) // 2, (ribbon_h - rth) // 2 - int(1 * scale)), ribbon_text, fill=(255, 255, 255, 255), font=font_ribbon)
    
    banner.paste(ribbon_final, (ribbon_x, ribbon_y), ribbon_final)
    
    # Resample down
    return banner.resize((width, height), Image.Resampling.LANCZOS)

# Generate assets
print("1. Generating 1024x1024 Avatar...")
avatar = create_rode_avatar(1024)
assets_dir = r"C:\Users\nanodev\NanoBrowser\assets"
os.makedirs(assets_dir, exist_ok=True)
avatar_path = os.path.join(assets_dir, "avatar.png")
avatar.save(avatar_path, "PNG")
print(f"Saved: {avatar_path}")

print("2. Generating 1280x360 Banner...")
banner = create_banner(avatar, 1280, 360)
banner_path = os.path.join(assets_dir, "banner.png")
banner.save(banner_path, "PNG")
print(f"Saved: {banner_path}")

# 3. Generate App Icons (for Tauri and Desktop)
icons_dir = r"C:\Users\nanodev\NanoBrowser\src-tauri\icons"
os.makedirs(icons_dir, exist_ok=True)

# 32x32
avatar.resize((32, 32), Image.Resampling.LANCZOS).save(os.path.join(icons_dir, "32x32.png"), "PNG")
# 128x128
avatar.resize((128, 128), Image.Resampling.LANCZOS).save(os.path.join(icons_dir, "128x128.png"), "PNG")
# 128x128@2x (256x256)
avatar.resize((256, 256), Image.Resampling.LANCZOS).save(os.path.join(icons_dir, "128x128@2x.png"), "PNG")
# icon.png (512x512)
avatar.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(icons_dir, "icon.png"), "PNG")

# Multi-resolution icon.ico
ico_sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
avatar.save(os.path.join(icons_dir, "icon.ico"), format="ICO", sizes=ico_sizes)
print("Updated all app icons in src-tauri/icons!")
