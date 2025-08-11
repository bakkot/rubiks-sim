// 3D Renderer for Rubik's Cube
class CubeRenderer {
    constructor(canvas, cube) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.cube = cube;
        
        // Camera settings
        this.rotationX = -25;
        this.rotationY = -35;
        this.scale = 100;
        
        // Colors
        this.colors = [
            '#FFFFFF', // White (U)
            '#FF0000', // Red (R)
            '#0000FF', // Blue (F)
            '#FFFF00', // Yellow (D)
            '#FFA500', // Orange (L)
            '#00FF00'  // Green (B)
        ];
        
        // Animation state
        this.isAnimating = false;
        this.animationQueue = [];
        this.currentAnimation = null;

        // Mouse interaction
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;

        this.setupMouseEvents();
    }

    animateMove(move) {
        return new Promise(resolve => {
            const duration = 300; // milliseconds
            const startTime = Date.now();
            const maxAngle = move.includes('2') ? 180 : (move.includes("'") ? -90 : 90);

            // Determine which face is rotating
            const face = move[0];

            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Easing function
                const easeProgress = 1 - Math.pow(1 - progress, 3);
                const angle = maxAngle * easeProgress;

                this.currentAnimation = {
                    face: face,
                    angle: angle
                };

                this.render();

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    // Animation complete, apply the actual move
                    this.cube.executeMove(move);
                    this.currentAnimation = null;
                    this.render();
                    resolve();
                }
            };

            animate();
        });
    }

    async processAnimationQueue() {
        if (this.isAnimating || this.animationQueue.length === 0) return;

        this.isAnimating = true;
        while (this.animationQueue.length > 0) {
            const move = this.animationQueue.shift();
            await this.animateMove(move);
        }
        this.isAnimating = false;
    }

    setupMouseEvents() {
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;

            const deltaX = e.clientX - this.lastMouseX;
            const deltaY = e.clientY - this.lastMouseY;

            this.rotationY += deltaX * 0.5;
            this.rotationX -= deltaY * 0.5;

            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;

            this.render();
        });

        this.canvas.addEventListener('mouseup', () => {
            this.isDragging = false;
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.isDragging = false;
        });
    }

    // Convert 3D point to 2D
    project(x, y, z) {
        // Apply rotations
        const radX = this.rotationX * Math.PI / 180;
        const radY = this.rotationY * Math.PI / 180;

        // Rotate around Y axis
        const x1 = x * Math.cos(radY) - z * Math.sin(radY);
        const z1 = x * Math.sin(radY) + z * Math.cos(radY);

        // Rotate around X axis
        const y1 = y * Math.cos(radX) - z1 * Math.sin(radX);
        const z2 = y * Math.sin(radX) + z1 * Math.cos(radX);

        // Simple perspective projection
        const perspective = 1000;
        const scale = perspective / (perspective + z2);

        return {
            x: this.canvas.width / 2 + x1 * this.scale * scale,
            y: this.canvas.height / 2 + y1 * this.scale * scale,
            scale: scale
        };
    }

    // Draw a single sticker
    drawSticker(points, color) {
        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            this.ctx.lineTo(points[i].x, points[i].y);
        }
        this.ctx.closePath();

        this.ctx.fillStyle = color;
        this.ctx.fill();
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }

    // Get sticker positions for a face
    getFaceStickers(face, offset) {
        const stickers = [];
        const gap = 0.05;

        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                const x = (col - 1) * (1 + gap);
                const y = (row - 1) * (1 + gap);

                let points;
                let index;
                switch (face) {
                    case 0: // Up (White)
                        points = [
                            { x: offset.x + x - 0.45, y: offset.y - 1.5, z: offset.z - y - 0.45 },
                            { x: offset.x + x + 0.45, y: offset.y - 1.5, z: offset.z - y - 0.45 },
                            { x: offset.x + x + 0.45, y: offset.y - 1.5, z: offset.z - y + 0.45 },
                            { x: offset.x + x - 0.45, y: offset.y - 1.5, z: offset.z - y + 0.45 }
                        ];
                        index = row * 3 + col;
                        break;
                    case 1: // Right (Red)
                        points = [
                            { x: offset.x + 1.5, y: offset.y - y - 0.45, z: offset.z + x - 0.45 },
                            { x: offset.x + 1.5, y: offset.y - y + 0.45, z: offset.z + x - 0.45 },
                            { x: offset.x + 1.5, y: offset.y - y + 0.45, z: offset.z + x + 0.45 },
                            { x: offset.x + 1.5, y: offset.y - y - 0.45, z: offset.z + x + 0.45 }
                        ];
                        index = row * 3 + col;
                        break;
                    case 2: // Front (Blue)
                        points = [
                            { x: offset.x + x - 0.45, y: offset.y - y - 0.45, z: offset.z + 1.5 },
                            { x: offset.x + x + 0.45, y: offset.y - y - 0.45, z: offset.z + 1.5 },
                            { x: offset.x + x + 0.45, y: offset.y - y + 0.45, z: offset.z + 1.5 },
                            { x: offset.x + x - 0.45, y: offset.y - y + 0.45, z: offset.z + 1.5 }
                        ];
                        index = row * 3 + col;
                        break;
                    case 3: // Down (Yellow)
                        points = [
                            { x: offset.x + x - 0.45, y: offset.y + 1.5, z: offset.z + y - 0.45 },
                            { x: offset.x + x + 0.45, y: offset.y + 1.5, z: offset.z + y - 0.45 },
                            { x: offset.x + x + 0.45, y: offset.y + 1.5, z: offset.z + y + 0.45 },
                            { x: offset.x + x - 0.45, y: offset.y + 1.5, z: offset.z + y + 0.45 }
                        ];
                        index = row * 3 + col;
                        break;
                    case 4: // Left (Orange)
                        points = [
                            { x: offset.x - 1.5, y: offset.y - y - 0.45, z: offset.z - x - 0.45 },
                            { x: offset.x - 1.5, y: offset.y - y + 0.45, z: offset.z - x - 0.45 },
                            { x: offset.x - 1.5, y: offset.y - y + 0.45, z: offset.z - x + 0.45 },
                            { x: offset.x - 1.5, y: offset.y - y - 0.45, z: offset.z - x + 0.45 }
                        ];
                        index = row * 3 + col;
                        break;
                    case 5: // Back (Green)
                        points = [
                            { x: offset.x - x - 0.45, y: offset.y - y - 0.45, z: offset.z - 1.5 },
                            { x: offset.x - x + 0.45, y: offset.y - y - 0.45, z: offset.z - 1.5 },
                            { x: offset.x - x + 0.45, y: offset.y - y + 0.45, z: offset.z - 1.5 },
                            { x: offset.x - x - 0.45, y: offset.y - y + 0.45, z: offset.z - 1.5 }
                        ];
                        // Flip only vertically for back face
                        index = (2 - row) * 3 + col;
                        break;
                }

                stickers.push({
                    points: points,
                    index: index
                });
            }
        }

        return stickers;
    }

    isPartOfAnimatedFace(face, stickerIndex, animatedFace) {
        switch (animatedFace) {
            case 'U':
                if (face === 0) return true;
                if (face === 1 && stickerIndex < 3) return true;
                if (face === 2 && stickerIndex < 3) return true;
                if (face === 4 && stickerIndex < 3) return true;
                if (face === 5 && stickerIndex < 3) return true;
                break;
            case 'D':
                if (face === 3) return true;
                if (face === 1 && stickerIndex >= 6) return true;
                if (face === 2 && stickerIndex >= 6) return true;
                if (face === 4 && stickerIndex >= 6) return true;
                if (face === 5 && stickerIndex >= 6) return true;
                break;
            case 'R':
                if (face === 1) return true;
                if (face === 0 && (stickerIndex % 3) === 2) return true;
                if (face === 2 && (stickerIndex % 3) === 2) return true;
                if (face === 3 && (stickerIndex % 3) === 2) return true;
                if (face === 5 && (stickerIndex % 3) === 0) return true;
                break;
            case 'L':
                if (face === 4) return true;
                if (face === 0 && (stickerIndex % 3) === 0) return true;
                if (face === 2 && (stickerIndex % 3) === 0) return true;
                if (face === 3 && (stickerIndex % 3) === 0) return true;
                if (face === 5 && (stickerIndex % 3) === 2) return true;
                break;
            case 'F':
                if (face === 2) return true;
                if (face === 0 && stickerIndex >= 6) return true;
                if (face === 1 && (stickerIndex % 3) === 0) return true;
                if (face === 3 && stickerIndex < 3) return true;
                if (face === 4 && (stickerIndex % 3) === 2) return true;
                break;
            case 'B':
                if (face === 5) return true;
                if (face === 0 && stickerIndex < 3) return true;
                if (face === 1 && (stickerIndex % 3) === 2) return true;
                if (face === 3 && stickerIndex >= 6) return true;
                if (face === 4 && (stickerIndex % 3) === 0) return true;
                break;
        }
        return false;
    }

    applyAnimationRotation(points, face, angle) {
        const rad = angle * Math.PI / 180;

        return points.map(p => {
            let x = p.x, y = p.y, z = p.z;

            switch (face) {
                case 'U':
                    // Rotate around Y axis
                    const xU = x * Math.cos(rad) - z * Math.sin(rad);
                    const zU = x * Math.sin(rad) + z * Math.cos(rad);
                    return { x: xU, y: y, z: zU };
                case 'D':
                    // Rotate around Y axis (opposite direction)
                    const xD = x * Math.cos(-rad) - z * Math.sin(-rad);
                    const zD = x * Math.sin(-rad) + z * Math.cos(-rad);
                    return { x: xD, y: y, z: zD };
                case 'R':
                    // Rotate around X axis
                    const yR = y * Math.cos(rad) - z * Math.sin(rad);
                    const zR = y * Math.sin(rad) + z * Math.cos(rad);
                    return { x: x, y: yR, z: zR };
                case 'L':
                    // Rotate around X axis (opposite direction)
                    const yL = y * Math.cos(-rad) - z * Math.sin(-rad);
                    const zL = y * Math.sin(-rad) + z * Math.cos(-rad);
                    return { x: x, y: yL, z: zL };
                case 'F':
                    // Rotate around Z axis
                    const xF = x * Math.cos(rad) - y * Math.sin(rad);
                    const yF = x * Math.sin(rad) + y * Math.cos(rad);
                    return { x: xF, y: yF, z: z };
                case 'B':
                    // Rotate around Z axis (opposite direction)
                    const xB = x * Math.cos(-rad) - y * Math.sin(-rad);
                    const yB = x * Math.sin(-rad) + y * Math.cos(-rad);
                    return { x: xB, y: yB, z: z };
            }
            return { x, y, z };
        });
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const offset = { x: 0, y: 0, z: 0 };

        // Collect all faces with their average depths
        const faces = [];

        for (let face = 0; face < 6; face++) {
            const faceStickers = this.getFaceStickers(face, offset);
            const faceColors = this.cube.getFace(face);

            // Calculate face center for depth sorting
            let centerX = 0, centerY = 0, centerZ = 0;
            const faceData = {
                face: face,
                stickers: []
            };

            // Get face normal and center
            switch (face) {
                case 0: // Up
                    centerY = -1.5;
                    break;
                case 1: // Right
                    centerX = 1.5;
                    break;
                case 2: // Front
                    centerZ = 1.5;
                    break;
                case 3: // Down
                    centerY = 1.5;
                    break;
                case 4: // Left
                    centerX = -1.5;
                    break;
                case 5: // Back
                    centerZ = -1.5;
                    break;
            }

            // Apply rotations to face center
            const radX = this.rotationX * Math.PI / 180;
            const radY = this.rotationY * Math.PI / 180;

            // Rotate around Y axis
            const x1 = centerX * Math.cos(radY) - centerZ * Math.sin(radY);
            const z1 = centerX * Math.sin(radY) + centerZ * Math.cos(radY);

            // Rotate around X axis
            const y1 = centerY * Math.cos(radX) - z1 * Math.sin(radX);
            const z2 = centerY * Math.sin(radX) + z1 * Math.cos(radX);

            // Only render faces that are facing towards the camera (z2 > -1.5)
            if (z2 > -1.5) {
                faceStickers.forEach((sticker, i) => {
                    let points = sticker.points;

                    // Apply animation rotation if this sticker is part of the animated face
                    if (this.currentAnimation && this.isPartOfAnimatedFace(face, sticker.index, this.currentAnimation.face)) {
                        points = this.applyAnimationRotation(points, this.currentAnimation.face, this.currentAnimation.angle);
                    }

                    const projectedPoints = points.map(p => this.project(p.x, p.y, p.z));

                    faceData.stickers.push({
                        projectedPoints: projectedPoints,
                        color: this.colors[faceColors[sticker.index]]
                    });
                });

                faceData.depth = z2;
                faces.push(faceData);
            }
        }

        // Sort faces by depth (back to front)
        faces.sort((a, b) => a.depth - b.depth);

        // Draw faces
        faces.forEach(faceData => {
            faceData.stickers.forEach(sticker => {
                this.drawSticker(sticker.projectedPoints, sticker.color);
            });
        });
    }
}

// Initialize
const cube = new RubiksCube();
const canvas = document.getElementById('canvas');
const renderer = new CubeRenderer(canvas, cube);

// Initial render
renderer.render();

// Button handlers
document.getElementById('resetBtn').addEventListener('click', () => {
    if (renderer.isAnimating) return;
    cube.reset();
    renderer.render();
});

document.getElementById('scrambleBtn').addEventListener('click', async () => {
    if (renderer.isAnimating) return;

    const numMoves = 30 + Math.floor(Math.random() * 11); // 30-40 moves

    for (let i = 0; i < numMoves; i++) {
        const move = cube.getRandomMove();
        renderer.animationQueue.push(move);
    }

    renderer.processAnimationQueue();
});

// Move button handlers
document.querySelectorAll('.move-button').forEach(button => {
    button.addEventListener('click', () => {
        if (renderer.isAnimating) return;

        const move = button.getAttribute('data-move');
        renderer.animationQueue.push(move);
        renderer.processAnimationQueue();
    });
});