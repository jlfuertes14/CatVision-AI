const fs = require('fs');

const headerContent = fs.readFileSync('c:\\Users\\Lenovo\\Desktop\\AI_Machine_Learning\\cat_pixelgif.h', 'utf8');

// Extract the frames array
const match = headerContent.match(/const uint8_t cat_pixelgif_frames\[[^\]]*\]\[[^\]]*\] = {([\s\S]*?)};/);
if (!match) {
    console.log("Could not find frames array.");
    process.exit(1);
}

const framesStr = match[1];
const frames = framesStr.split(/},\s*{/).map(frameStr => {
    return frameStr.replace(/[{}]/g, '').split(',')
        .map(s => s.trim())
        .filter(s => s.startsWith('0x'))
        .map(s => parseInt(s, 16));
});

const WIDTH = 128;
const HEIGHT = 64;
const BYTES_PER_ROW = WIDTH / 8;

let output = '';

frames.forEach((frame, frameIdx) => {
    if (frame.length === 0) return;
    
    let minX = WIDTH, maxX = 0, minY = HEIGHT, maxY = 0;
    
    // Find bounding box
    for (let y = 0; y < HEIGHT; y++) {
        for (let x = 0; x < WIDTH; x++) {
            const byteIdx = y * BYTES_PER_ROW + Math.floor(x / 8);
            const bitIdx = 7 - (x % 8); // Assuming MSB first
            const bit = (frame[byteIdx] >> bitIdx) & 1;
            
            if (bit) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
    }
    
    output += `Frame ${frameIdx}:\n`;
    output += `Bounding box: X:${minX}-${maxX}, Y:${minY}-${maxY}\n`;
    
    // Print bounded frame
    for (let y = minY; y <= maxY; y++) {
        let row = '';
        for (let x = minX; x <= maxX; x++) {
            const byteIdx = y * BYTES_PER_ROW + Math.floor(x / 8);
            const bitIdx = 7 - (x % 8);
            const bit = (frame[byteIdx] >> bitIdx) & 1;
            row += bit ? '#' : '.';
        }
        output += row + '\n';
    }
    output += '\n\n';
});

fs.writeFileSync('c:\\Users\\Lenovo\\Desktop\\AI_Machine_Learning\\parsed_frames.txt', output);
console.log("Done.");
