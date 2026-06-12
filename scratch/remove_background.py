import os
from PIL import Image, ImageFilter

def remove_background(input_path, output_path):
    print(f"Processing image: {input_path}")
    if not os.path.exists(input_path):
        print(f"Error: {input_path} not found.")
        return
        
    img = Image.open(input_path).convert("RGBA")
    datas = img.getdata()
    
    newData = []
    # Identify background color. We inspect the top-left corner pixel.
    bg_color = datas[0]
    print(f"Detected background color (top-left pixel): {bg_color}")
    
    # We define tolerance for matching background color
    tolerance = 25
    
    for item in datas:
        # Check if the pixel is close to the background color (or near white/light grey)
        r_diff = abs(item[0] - bg_color[0])
        g_diff = abs(item[1] - bg_color[1])
        b_diff = abs(item[2] - bg_color[2])
        
        # Also remove any pixel that is very close to pure white (since it's a studio background)
        is_near_white = item[0] > 240 and item[1] > 240 and item[2] > 240
        
        if (r_diff < tolerance and g_diff < tolerance and b_diff < tolerance) or is_near_white:
            # Make pixel transparent
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)
            
    img.putdata(newData)
    
    # Apply a gentle blur to the alpha channel to soften the edges (anti-aliasing)
    alpha = img.getchannel('A')
    alpha_blurred = alpha.filter(ImageFilter.GaussianBlur(1.0))
    img.putalpha(alpha_blurred)
    
    # Ensure directory exists and save
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    img.save(output_path, "PNG")
    print(f"Saved transparent image to: {output_path}")

if __name__ == "__main__":
    input_file = r"C:\Users\CA\.gemini\antigravity\brain\0675ca65-b842-4245-884a-748b208fc5d0\welcome_hero_generated_1781261463926.png"
    output_file = r"d:\digest\assets\images\welcome-hero.png"
    remove_background(input_file, output_file)
