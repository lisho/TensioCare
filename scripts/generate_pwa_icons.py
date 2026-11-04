import zlib, struct, math, os

def make_icon(size, is_maskable=False):
    width = size
    height = size
    raw_data = bytearray()
    
    # Colors
    bg_teal = (0, 85, 112)       # #005570
    bg_teal_light = (14, 124, 156) # #0e7c9c
    white = (255, 255, 255)
    green = (16, 185, 129)
    transparent = (0, 0, 0, 0)
    
    # Pre-render grid
    for y in range(height):
        raw_data.append(0) # filter type none (0)
        ny = y / height
        for x in range(width):
            nx = x / width
            
            # Distance from center
            cx, cy = 0.5, 0.5
            dx = nx - cx
            dy = ny - cy
            dist_sq = dx*dx + dy*dy
            
            # Gradient background
            t = (nx + ny) / 2.0
            r = int(bg_teal[0] * (1 - t) + bg_teal_light[0] * t)
            g = int(bg_teal[1] * (1 - t) + bg_teal_light[1] * t)
            b = int(bg_teal[2] * (1 - t) + bg_teal_light[2] * t)
            a = 255
            
            if not is_maskable:
                # Rounded rect squircle boundary
                pad = 0.04
                corner_radius = 0.22
                qx = abs(nx - 0.5)
                qy = abs(ny - 0.5)
                max_d = 0.5 - pad
                
                if qx > max_d or qy > max_d:
                    # check corner
                    if qx > (max_d - corner_radius) and qy > (max_d - corner_radius):
                        cx_c = max_d - corner_radius
                        cy_c = max_d - corner_radius
                        cdist = math.sqrt((qx - cx_c)**2 + (qy - cy_c)**2)
                        if cdist > corner_radius:
                            a = 0
            
            # Draw Heart & Pulse inside center
            # Scale coords to [-1, 1] relative to center
            scale = 0.65 if is_maskable else 0.75
            hx = (nx - 0.5) / (scale * 0.5)
            hy = -(ny - 0.5) / (scale * 0.5) + 0.1 # flipped Y
            
            # Heart implicit equation: (x^2 + y^2 - 1)^3 - x^2 * y^3 <= 0
            # Normalized around origin
            if a > 0:
                f_heart = (hx*hx + hy*hy - 0.75)**3 - (hx*hx)*(hy*hy*hy)
                # Outer stroke of heart
                if -0.15 <= f_heart <= 0.08:
                    r, g, b = white
                
                # Pulse line inside
                # Y is near 0
                if abs(hy + 0.08) < 0.06 and -0.8 <= hx <= 0.8:
                    # ECG spikes
                    if -0.35 <= hx <= -0.15:
                        line_y = -0.08 + (hx - (-0.25)) * 1.5
                        if abs(hy - line_y) < 0.07:
                            r, g, b = white
                    elif -0.15 <= hx <= 0.05:
                        line_y = -0.08 - (hx - (-0.05)) * 3.0
                        if abs(hy - line_y) < 0.07:
                            r, g, b = white
                    elif 0.05 <= hx <= 0.25:
                        line_y = -0.08 + (hx - 0.15) * 2.2
                        if abs(hy - line_y) < 0.07:
                            r, g, b = white
                    else:
                        r, g, b = white

                # Status dot at upper right
                dot_dx = nx - (0.5 + scale * 0.32)
                dot_dy = ny - (0.5 - scale * 0.28)
                if dot_dx*dot_dx + dot_dy*dot_dy < (0.05 * scale)**2:
                    r, g, b = green
            
            if a == 0:
                raw_data.extend([0, 0, 0, 0])
            else:
                raw_data.extend([r, g, b, a])
                
    def chunk(tag, data):
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)

    ihdr = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    idat = zlib.compress(bytes(raw_data), 9)
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr) + chunk(b'IDAT', idat) + chunk(b'IEND', b'')

os.makedirs('public', exist_ok=True)

with open('public/pwa-192x192.png', 'wb') as f:
    f.write(make_icon(192, is_maskable=False))

with open('public/pwa-512x512.png', 'wb') as f:
    f.write(make_icon(512, is_maskable=False))

with open('public/pwa-maskable-512x512.png', 'wb') as f:
    f.write(make_icon(512, is_maskable=True))

with open('public/apple-touch-icon.png', 'wb') as f:
    f.write(make_icon(180, is_maskable=False))

print("All PWA PNG icons generated successfully!")
