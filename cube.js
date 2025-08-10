// Rubik's Cube Simulator Library
class RubiksCube {
    constructor() {
        this.reset();
    }

    reset() {
        // Initialize cube state - each face has 9 stickers
        // Using Uint8Array for better performance
        // Colors: 0=White, 1=Red, 2=Blue, 3=Orange, 4=Green, 5=Yellow
        this.state = new Uint8Array(54);
        
        // Initialize faces in order: U, R, F, D, L, B
        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 9; j++) {
                this.state[i * 9 + j] = i;
            }
        }
    }

    // Get face as array
    getFace(face) {
        const start = face * 9;
        return this.state.slice(start, start + 9);
    }

    // Rotate a face 90 degrees clockwise
    rotateFace(face) {
        const start = face * 9;
        const temp = new Uint8Array(9);
        
        // Copy face to temp
        for (let i = 0; i < 9; i++) {
            temp[i] = this.state[start + i];
        }
        
        // Rotate positions: 0->2, 1->5, 2->8, 3->1, 4->4, 5->7, 6->0, 7->3, 8->6
        this.state[start + 0] = temp[6];
        this.state[start + 1] = temp[3];
        this.state[start + 2] = temp[0];
        this.state[start + 3] = temp[7];
        this.state[start + 4] = temp[4];
        this.state[start + 5] = temp[1];
        this.state[start + 6] = temp[8];
        this.state[start + 7] = temp[5];
        this.state[start + 8] = temp[2];
    }

    // Execute moves
    U() {
        this.rotateFace(0);
        const temp = new Uint8Array(3);
        
        // Save front row
        temp[0] = this.state[18]; temp[1] = this.state[19]; temp[2] = this.state[20];
        
        // Front <- Right
        this.state[18] = this.state[9];  this.state[19] = this.state[10]; this.state[20] = this.state[11];
        
        // Right <- Back
        this.state[9]  = this.state[53]; this.state[10] = this.state[52]; this.state[11] = this.state[51];
        
        // Back <- Left
        this.state[53] = this.state[36]; this.state[52] = this.state[37]; this.state[51] = this.state[38];
        
        // Left <- temp (Front)
        this.state[36] = temp[0]; this.state[37] = temp[1]; this.state[38] = temp[2];
    }

    R() {
        this.rotateFace(1);
        const temp = new Uint8Array(3);
        
        // Save front column
        temp[0] = this.state[20]; temp[1] = this.state[23]; temp[2] = this.state[26];
        
        // Front <- Down
        this.state[20] = this.state[29]; this.state[23] = this.state[32]; this.state[26] = this.state[35];
        
        // Down <- Back
        this.state[29] = this.state[51]; this.state[32] = this.state[48]; this.state[35] = this.state[45];
        
        // Back <- Up
        this.state[51] = this.state[2];  this.state[48] = this.state[5];  this.state[45] = this.state[8];
        
        // Up <- temp (Front)
        this.state[2] = temp[0]; this.state[5] = temp[1]; this.state[8] = temp[2];
    }

    F() {
        this.rotateFace(2);
        const temp = new Uint8Array(3);
        
        // Save up row
        temp[0] = this.state[6]; temp[1] = this.state[7]; temp[2] = this.state[8];
        
        // Up <- Left
        this.state[6] = this.state[44]; this.state[7] = this.state[41]; this.state[8] = this.state[38];
        
        // Left <- Down
        this.state[44] = this.state[27]; this.state[41] = this.state[28]; this.state[38] = this.state[29];
        
        // Down <- Right
        this.state[27] = this.state[9];  this.state[28] = this.state[12]; this.state[29] = this.state[15];
        
        // Right <- temp (Up)
        this.state[9] = temp[0]; this.state[12] = temp[1]; this.state[15] = temp[2];
    }

    D() {
        this.rotateFace(3);
        const temp = new Uint8Array(3);
        
        // Save front row
        temp[0] = this.state[24]; temp[1] = this.state[25]; temp[2] = this.state[26];
        
        // Front <- Left
        this.state[24] = this.state[42]; this.state[25] = this.state[43]; this.state[26] = this.state[44];
        
        // Left <- Back
        this.state[42] = this.state[47]; this.state[43] = this.state[46]; this.state[44] = this.state[45];
        
        // Back <- Right
        this.state[47] = this.state[15]; this.state[46] = this.state[16]; this.state[45] = this.state[17];
        
        // Right <- temp (Front)
        this.state[15] = temp[0]; this.state[16] = temp[1]; this.state[17] = temp[2];
    }

    L() {
        this.rotateFace(4);
        const temp = new Uint8Array(3);
        
        // Save front column
        temp[0] = this.state[18]; temp[1] = this.state[21]; temp[2] = this.state[24];
        
        // Front <- Up
        this.state[18] = this.state[0]; this.state[21] = this.state[3]; this.state[24] = this.state[6];
        
        // Up <- Back
        this.state[0] = this.state[53]; this.state[3] = this.state[50]; this.state[6] = this.state[47];
        
        // Back <- Down
        this.state[53] = this.state[27]; this.state[50] = this.state[30]; this.state[47] = this.state[33];
        
        // Down <- temp (Front)
        this.state[27] = temp[0]; this.state[30] = temp[1]; this.state[33] = temp[2];
    }

    B() {
        this.rotateFace(5);
        const temp = new Uint8Array(3);
        
        // Save up row
        temp[0] = this.state[0]; temp[1] = this.state[1]; temp[2] = this.state[2];
        
        // Up <- Right
        this.state[0] = this.state[11]; this.state[1] = this.state[14]; this.state[2] = this.state[17];
        
        // Right <- Down
        this.state[11] = this.state[35]; this.state[14] = this.state[34]; this.state[17] = this.state[33];
        
        // Down <- Left
        this.state[35] = this.state[36]; this.state[34] = this.state[39]; this.state[33] = this.state[42];
        
        // Left <- temp (Up)
        this.state[36] = temp[2]; this.state[39] = temp[1]; this.state[42] = temp[0];
    }

    // Prime moves (counter-clockwise)
    U_prime() { this.U(); this.U(); this.U(); }
    R_prime() { this.R(); this.R(); this.R(); }
    F_prime() { this.F(); this.F(); this.F(); }
    D_prime() { this.D(); this.D(); this.D(); }
    L_prime() { this.L(); this.L(); this.L(); }
    B_prime() { this.B(); this.B(); this.B(); }

    // Double moves
    U2() { this.U(); this.U(); }
    R2() { this.R(); this.R(); }
    F2() { this.F(); this.F(); }
    D2() { this.D(); this.D(); }
    L2() { this.L(); this.L(); }
    B2() { this.B(); this.B(); }

    // Execute a move string
    executeMove(move) {
        const moveMap = {
            'U': () => this.U(),
            'U\'': () => this.U_prime(),
            'U2': () => this.U2(),
            'R': () => this.R(),
            'R\'': () => this.R_prime(),
            'R2': () => this.R2(),
            'F': () => this.F(),
            'F\'': () => this.F_prime(),
            'F2': () => this.F2(),
            'D': () => this.D(),
            'D\'': () => this.D_prime(),
            'D2': () => this.D2(),
            'L': () => this.L(),
            'L\'': () => this.L_prime(),
            'L2': () => this.L2(),
            'B': () => this.B(),
            'B\'': () => this.B_prime(),
            'B2': () => this.B2()
        };
        
        if (moveMap[move]) {
            moveMap[move]();
        }
    }

    // Generate random move
    getRandomMove() {
        const moves = ['U', 'U\'', 'U2', 'R', 'R\'', 'R2', 'F', 'F\'', 'F2', 
                      'D', 'D\'', 'D2', 'L', 'L\'', 'L2', 'B', 'B\'', 'B2'];
        return moves[Math.floor(Math.random() * moves.length)];
    }

    // Clone the cube state
    clone() {
        const newCube = new RubiksCube();
        newCube.state = new Uint8Array(this.state);
        return newCube;
    }

    // Check if solved
    isSolved() {
        for (let face = 0; face < 6; face++) {
            const color = this.state[face * 9];
            for (let i = 1; i < 9; i++) {
                if (this.state[face * 9 + i] !== color) {
                    return false;
                }
            }
        }
        return true;
    }
}