import os
from PIL import Image, ImageDraw

def draw_heart(size, color, bg_color=None):
    # Create image with background
    if bg_color:
        img = Image.new("RGBA", (size, size), bg_color)
    else:
        img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    
    # Draw heart at 4x resolution and downsample for smooth anti-aliased edges
    high_res_size = size * 4
    hr_img = Image.new("RGBA", (high_res_size, high_res_size), (0, 0, 0, 0))
    hr_draw = ImageDraw.Draw(hr_img)
    
    hr_scale = high_res_size / 100.0
    
    # Two overlapping circles
    # Center X: 35% and 65%, Center Y: 38%, Radius: 21.5%
    r = 21.5 * hr_scale
    c1 = (35 * hr_scale, 38 * hr_scale)
    c2 = (65 * hr_scale, 38 * hr_scale)
    
    hr_draw.ellipse([c1[0] - r, c1[1] - r, c1[0] + r, c1[1] + r], fill=color)
    hr_draw.ellipse([c2[0] - r, c2[1] - r, c2[0] + r, c2[1] + r], fill=color)
    
    # Polygon for the bottom triangle tip
    pt1 = (35 * hr_scale - r, 38 * hr_scale)
    pt2 = (65 * hr_scale + r, 38 * hr_scale)
    pt3 = (50 * hr_scale, 84 * hr_scale)
    hr_draw.polygon([pt1, pt2, pt3], fill=color)
    
    # Smooth central inner overlap area
    hr_draw.polygon([(40 * hr_scale, 30 * hr_scale), (60 * hr_scale, 30 * hr_scale), (50 * hr_scale, 60 * hr_scale)], fill=color)
    
    # Resize back down with LANCZOS resampling for perfect antialiasing
    resized_heart = hr_img.resize((size, size), Image.Resampling.LANCZOS)
    
    # Composite onto background
    if bg_color:
        final_img = Image.new("RGBA", (size, size), bg_color)
        final_img.alpha_composite(resized_heart)
        return final_img
    
    return resized_heart

# Define colors
SAGE_GREEN = (76, 110, 88, 255) # #4C6E58
BG_OFFWHITE = (248, 249, 248, 255) # #F8F9F8

os.makedirs("assets/images", exist_ok=True)

# Generate primary app icon (1024x1024, solid bg)
icon = draw_heart(1024, SAGE_GREEN, BG_OFFWHITE)
icon.convert("RGB").save("assets/images/icon.png", "PNG")

# Generate android adaptive icon foreground (1024x1024, transparent)
fg = draw_heart(1024, SAGE_GREEN, None)
fg.save("assets/images/android-icon-foreground.png", "PNG")

# Generate splash icon (1024x1024, transparent)
splash = draw_heart(1024, SAGE_GREEN, None)
splash.save("assets/images/splash-icon.png", "PNG")

# Generate android adaptive icon background (1024x1024, solid)
bg = Image.new("RGBA", (1024, 1024), BG_OFFWHITE)
bg.convert("RGB").save("assets/images/android-icon-background.png", "PNG")

# Generate favicon (48x48, transparent)
fav = draw_heart(48, SAGE_GREEN, None)
fav.save("assets/images/favicon.png", "PNG")

print("Generated all app icons and splash assets successfully!")
