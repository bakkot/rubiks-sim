import { vec3_transformQuat, quat_fromAxisAngle, quat_multiply, quat_normalize } from './3d-math.js';

function getMoveKind(move) {
  const baseFace = move[0];
  const moveKinds = {
    U: 'simple',
    D: 'simple',
    R: 'simple',
    L: 'simple',
    F: 'simple',
    B: 'simple',
    x: 'reorientation',
    y: 'reorientation',
    z: 'reorientation',
    M: 'slice',
    E: 'slice',
    S: 'slice',
    r: 'double',
    l: 'double',
    u: 'double',
    d: 'double',
    f: 'double',
    b: 'double',
  };

  const kind = moveKinds[baseFace];
  if (!kind) {
    throw new Error(`Unknown move: ${move}`);
  }
  return kind;
}

function includesReorientation(kind) {
  return kind === 'reorientation' || kind === 'slice' || kind === 'double';
}

function sliceToReorientationMove(sliceMove) {
  const sliceToReorientationMap = {
    M: "x'",
    "M'": 'x',
    E: "y'",
    "E'": 'y',
    S: 'z',
    "S'": "z'",
  };

  return sliceToReorientationMap[sliceMove];
}

function sliceToFaceMoves(sliceMove) {
  const sliceToFaceMap = {
    M: ['R', "L'"], // M = R+L'
    "M'": ["R'", 'L'], // M' = R'+L
    E: ['U', "D'"], // E = U+D'
    "E'": ["U'", 'D'], // E' = U'+D
    S: ["F'", 'B'], // S = F'+B
    "S'": ['F', "B'"], // S' = F+B'
  };

  const moves = sliceToFaceMap[sliceMove];
  if (!moves) {
    throw new Error(`Unknown slice move: ${sliceMove}`);
  }
  return moves;
}

function doubleToReorientationMove(doubleMove) {
  const baseFace = doubleMove[0];
  const isPrime = doubleMove.includes("'");

  const doubleToReorientationMap = {
    r: isPrime ? "x'" : 'x',
    l: isPrime ? 'x' : "x'",
    u: isPrime ? "y'" : 'y',
    d: isPrime ? 'y' : "y'",
    f: isPrime ? "z'" : 'z',
    b: isPrime ? 'z' : "z'",
  };

  return doubleToReorientationMap[baseFace];
}

function doubleToFaceMove(doubleMove) {
  const baseFace = doubleMove[0];
  const isPrime = doubleMove.includes("'");

  const doubleToFaceMap = {
    r: isPrime ? "L'" : 'L',
    l: isPrime ? "R'" : 'R',
    u: isPrime ? "D'" : 'D',
    d: isPrime ? "U'" : 'U',
    f: isPrime ? "B'" : 'B',
    b: isPrime ? "F'" : 'F',
  };

  return doubleToFaceMap[baseFace];
}

function getRotationMatrix(axis, angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);

  if (axis === 'y') {
    return {
      x: (x, y, z) => x * c - z * s,
      y: (x, y, z) => y,
      z: (x, y, z) => x * s + z * c,
    };
  } else if (axis === 'x') {
    return {
      x: (x, y, z) => x,
      y: (x, y, z) => y * c - z * s,
      z: (x, y, z) => y * s + z * c,
    };
  } else if (axis === 'z') {
    return {
      x: (x, y, z) => x * c - y * s,
      y: (x, y, z) => x * s + y * c,
      z: (x, y, z) => z,
    };
  }
}

function getVisualToLogicalMapping(orientation) {
  const faceNormals = {
    U: [0, -1, 0], // Up face points down in our coordinate system
    D: [0, 1, 0], // Down face points up
    R: [1, 0, 0], // Right face points right
    L: [-1, 0, 0], // Left face points left
    F: [0, 0, -1], // Front face points toward viewer
    B: [0, 0, 1], // Back face points away from viewer
  };

  const visualDirections = {
    visualUp: [0, -1, 0], // Visual up is negative Y
    visualDown: [0, 1, 0], // Visual down is positive Y
    visualRight: [1, 0, 0], // Visual right is positive X
    visualLeft: [-1, 0, 0], // Visual left is negative X
    visualFront: [0, 0, -1], // Visual front is negative Z
    visualBack: [0, 0, 1], // Visual back is positive Z
  };

  // For each visual direction, find which logical face is closest to it
  return Object.fromEntries(
    Object.entries(visualDirections).map(([visualPos, visualDir]) => {
      let bestMatch = null;
      let bestDot = -2; // Start with impossible dot product value

      Object.entries(faceNormals).forEach(([logicalFace, normal]) => {
        const transformedNormal = vec3_transformQuat(normal, orientation);

        // Calculate dot product to find how aligned they are
        const dot =
          transformedNormal[0] * visualDir[0] +
          transformedNormal[1] * visualDir[1] +
          transformedNormal[2] * visualDir[2];

        if (dot > bestDot) {
          bestDot = dot;
          bestMatch = logicalFace;
        }
      });

      return [visualPos, bestMatch];
    }),
  );
}

function getFaceNormal(logicalFace, orientation) {
  const faceNormals = {
    U: [0, -1, 0],
    D: [0, 1, 0],
    R: [1, 0, 0],
    L: [-1, 0, 0],
    F: [0, 0, -1],
    B: [0, 0, 1],
  };

  const normal = faceNormals[logicalFace];
  const transformedNormal = vec3_transformQuat(normal, orientation);
  return transformedNormal;
}

function visualMoveToLogical(visualMove, orientation) {
  const mapping = getVisualToLogicalMapping(orientation);
  const isPrime = visualMove.includes("'");
  const baseFace = visualMove[0];

  let logicalFace;
  switch (baseFace) {
    case 'U':
      logicalFace = mapping.visualUp;
      break;
    case 'D':
      logicalFace = mapping.visualDown;
      break;
    case 'R':
      logicalFace = mapping.visualRight;
      break;
    case 'L':
      logicalFace = mapping.visualLeft;
      break;
    case 'F':
      logicalFace = mapping.visualFront;
      break;
    case 'B':
      logicalFace = mapping.visualBack;
      break;
    default:
      throw new Error(`not a move: ${baseFace}`);
  }

  return logicalFace + (isPrime ? "'" : '');
}

function isPieceAffectedByMove(piecePos, move, orientation) {
  const kind = getMoveKind(move);

  switch (kind) {
    case 'simple': {
      const logicalMove = visualMoveToLogical(move, orientation);
      return isPieceAffectedByFaceTurn(piecePos, logicalMove);
    }
    case 'reorientation': {
      return false
    }
    case 'slice': {
      const logicalMoves = sliceToFaceMoves(move).map(m => visualMoveToLogical(m, orientation));
      return isPieceAffectedByFaceTurn(piecePos, logicalMoves[0]) || isPieceAffectedByFaceTurn(piecePos, logicalMoves[1]);
    }
    case 'double': {
      const faceMove = doubleToFaceMove(move);
      const logicalMove = visualMoveToLogical(faceMove, orientation);
      return isPieceAffectedByFaceTurn(piecePos, logicalMove);
    }
    default: {
      throw new Error(`Unknown move kind: ${kind}`);
    }
  }
}

function isPieceAffectedByFaceTurn(piecePos, move) {
  const face = move[0];

  if (face === 'U') return piecePos.y < -0.5;
  if (face === 'D') return piecePos.y > 0.5;
  if (face === 'R') return piecePos.x > 0.5;
  if (face === 'L') return piecePos.x < -0.5;
  if (face === 'F') return piecePos.z < -0.5;
  if (face === 'B') return piecePos.z > 0.5;

  throw new Error(`not a move: ${face}`);
}

export class CubeRenderer {
  constructor(canvas, cube) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.cube = cube;
    this.scale = 100;
    this.animationDuration = 300; // milliseconds
    this.reset();
  }

  reset() {
    this.orientation = [0.14000166646724985, 0.14000166646724985, 0, 0.9802035843501011];
    this.animating = false;
    this.animationQueue = [];
    this.currentAnimation = null;
    this.render();
  }

  animateMove(move) {
    const kind = getMoveKind(move);

    switch (kind) {
      case 'simple':
        return this.animateSimpleMove(move);
      case 'reorientation':
        return this.animateReorientationMove(move);
      case 'slice':
        return this.animateSliceMove(move);
      case 'double':
        return this.animateDoubleMove(move);
      default:
        throw new Error(`Unknown move kind: ${kind}`);
    }
  }

  animateSimpleMove(move) {
    if (!['U', 'D', 'R', 'L', 'F', 'B', "U'", "D'", "R'", "L'", "F'", "B'"].includes(move)) {
      throw new Error(`unknown simple move ${move}`);
    }
    return new Promise(resolve => {
      this.animationQueue.push({ move, resolve, orientation: [...this.orientation] });
      if (!this.animating) {
        this.processAnimationQueue();
      }
    });
  }

  animateReorientationMove(move) {
    if (!['x', "y'", 'z', "x'", 'y', "z'"].includes(move)) {
      throw new Error(`unknown reorientation move ${move}`);
    }
    return new Promise(resolve => {
      this.animationQueue.push({ move, resolve, orientation: [...this.orientation] });
      if (!this.animating) {
        this.processAnimationQueue();
      }
    });
  }

  animateSliceMove(move) {
    if (!['M', "M'", 'E', "E'", 'S', "S'"].includes(move)) {
      throw new Error(`unknown slice move ${move}`);
    }

    return new Promise(resolve => {
      this.animationQueue.push({ move, resolve, orientation: [...this.orientation] });
      if (!this.animating) {
        this.processAnimationQueue();
      }
    });
  }

  animateDoubleMove(move) {
    if (!['r', "r'", 'l', "l'", 'u', "u'", 'd', "d'", 'f', "f'", 'b', "b'"].includes(move)) {
      throw new Error(`unknown double move ${move}`);
    }

    return new Promise(resolve => {
      this.animationQueue.push({ move, resolve, orientation: [...this.orientation] });
      if (!this.animating) {
        this.processAnimationQueue();
      }
    });
  }

  processAnimationQueue() {
    if (this.animationQueue.length === 0) {
      this.animating = false;
      this.render(); // Re-render to show solved indicator if applicable
      return;
    }

    this.animating = true;
    const { move, resolve, orientation } = this.animationQueue.shift();

    const kind = getMoveKind(move);
    let reorientationMove = null;
    if (includesReorientation(kind)) {
      if (kind === 'slice') {
        reorientationMove = sliceToReorientationMove(move);
      } else if (kind === 'double') {
        reorientationMove = doubleToReorientationMove(move);
      } else {
        reorientationMove = move; // reorientation kind
      }
    }

    const startTime = Date.now();
    const currentAnimation = {
      move,
      animationProgress: 0,
      initialOrientation: orientation,
    };
    this.currentAnimation = currentAnimation;

    let reorientationData = null;
    if (includesReorientation(kind)) {
      reorientationData = this.setupReorientationAnimation(reorientationMove, orientation);
    }

    const animate = () => {
      if (!this.currentAnimation) return;
      const elapsed = Date.now() - startTime;
      this.currentAnimation.animationProgress = Math.min(elapsed / this.animationDuration, 1);

      if (includesReorientation(kind)) {
        this.updateReorientationAnimation(reorientationData, this.currentAnimation.animationProgress);
      }

      this.render();

      if (this.currentAnimation.animationProgress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Apply the actual move(s) to the cube state
        if (kind === 'slice') {
          const logicalMoves = sliceToFaceMoves(move).map(m => visualMoveToLogical(m, orientation));
          this.cube.move(logicalMoves[0]);
          this.cube.move(logicalMoves[1]);
        } else if (kind === 'double') {
          const faceMove = doubleToFaceMove(move);
          const logicalMove = visualMoveToLogical(faceMove, orientation);
          this.cube.move(logicalMove);
        } else if (kind === 'simple') {
          const logicalMove = visualMoveToLogical(move, orientation);
          this.cube.move(logicalMove);
        }

        if (includesReorientation(kind)) {
          // Calculate the rotation that was just applied
          const rotationQuat = quat_fromAxisAngle(reorientationData.axis, reorientationData.totalRotation);

          // Update all remaining queue entries
          this.animationQueue.forEach(queueEntry => {
            queueEntry.orientation = quat_normalize(quat_multiply(rotationQuat, queueEntry.orientation));
          });
        }

        // Note: Reorientation moves don't change cube state, only visual orientation
        // Final orientation is already set by updateReorientationAnimation
        resolve();
        this.currentAnimation = null;
        this.render();
        this.processAnimationQueue();
      }
    };

    animate();
  }

  setupReorientationAnimation(move, orientation) {
    const isPrime = move.includes("'");
    const baseFace = move[0];
    const mapping = getVisualToLogicalMapping(orientation);

    let axis;
    const direction = isPrime ? 1 : -1;

    // Determine the rotation axis based on provided orientation
    switch (baseFace) {
      case 'x':
        // Rotate around R-L axis (current visual right to left)
        const rFace = mapping.visualRight;
        const lFace = mapping.visualLeft;
        // Get the axis by finding the vector between R and L face normals
        const rNormal = getFaceNormal(rFace, this.orientation);
        const lNormal = getFaceNormal(lFace, this.orientation);
        axis = [rNormal[0] - lNormal[0], rNormal[1] - lNormal[1], rNormal[2] - lNormal[2]];
        break;
      case 'y':
        // Rotate around U-D axis (current visual up to down)
        const uFace = mapping.visualUp;
        const dFace = mapping.visualDown;
        const uNormal = getFaceNormal(uFace, this.orientation);
        const dNormal = getFaceNormal(dFace, this.orientation);
        axis = [uNormal[0] - dNormal[0], uNormal[1] - dNormal[1], uNormal[2] - dNormal[2]];
        break;
      case 'z':
        // Rotate around F-B axis (current visual front to back)
        const fFace = mapping.visualFront;
        const bFace = mapping.visualBack;
        const fNormal = getFaceNormal(fFace, this.orientation);
        const bNormal = getFaceNormal(bFace, this.orientation);
        axis = [fNormal[0] - bNormal[0], fNormal[1] - bNormal[1], fNormal[2] - bNormal[2]];
        break;
      default:
        throw new Error(`not an axis: ${baseFace}`);
    }

    // Normalize the axis
    const axisLength = Math.sqrt(axis[0] * axis[0] + axis[1] * axis[1] + axis[2] * axis[2]);
    axis[0] /= axisLength;
    axis[1] /= axisLength;
    axis[2] /= axisLength;

    return {
      axis,
      totalRotation: (direction * Math.PI) / 2, // 90 degrees
      startOrientation: [...this.orientation],
    };
  }

  updateReorientationAnimation(reorientationData, animationProgress) {
    const { axis, totalRotation, startOrientation } = reorientationData;

    const currentAngle = totalRotation * animationProgress;

    // Create rotation quaternion for current progress
    const rotationQuat = quat_fromAxisAngle(axis, currentAngle);

    // Apply rotation to starting orientation
    this.orientation = quat_normalize(quat_multiply(rotationQuat, startOrientation));
  }

  getFaceTurnAnimationRotation(move, piecePosition, orientation) {
    const kind = getMoveKind(move);

    switch (kind) {
      case 'simple': {
        const logicalMove = visualMoveToLogical(move, orientation);
        if (isPieceAffectedByFaceTurn(piecePosition, logicalMove)) {
          return this.getFaceTurnAnimationRotationForSingleMove(logicalMove);
        }
      }
      case 'reorientation': {
        return null;
      }
      case 'slice': {
        const logicalMoves = sliceToFaceMoves(move).map(m => visualMoveToLogical(m, orientation));
        if (isPieceAffectedByFaceTurn(piecePosition, logicalMoves[0])) {
          return this.getFaceTurnAnimationRotationForSingleMove(logicalMoves[0]);
        } else if (isPieceAffectedByFaceTurn(piecePosition, logicalMoves[1])) {
          return this.getFaceTurnAnimationRotationForSingleMove(logicalMoves[1]);
        }
        return null;
      }
      case 'double': {
        const faceMove = doubleToFaceMove(move);
        const logicalMove = visualMoveToLogical(faceMove, orientation);

        if (isPieceAffectedByFaceTurn(piecePosition, logicalMove)) {
          return this.getFaceTurnAnimationRotationForSingleMove(logicalMove);
        }
        return null;
      }
      default: {
        throw new Error(`Unknown move kind: ${kind}`);
      }
    }
  }

  getFaceTurnAnimationRotationForSingleMove(move) {
    const face = move[0];
    const isPrime = move.includes("'");

    let axis, angle;
    if (face === 'U' || face === 'D') {
      axis = 'y';
      angle = (((face === 'U' ? -1 : 1) * (isPrime ? -1 : 1) * Math.PI) / 2) * this.currentAnimation.animationProgress;
    } else if (face === 'R' || face === 'L') {
      axis = 'x';
      angle = (((face === 'R' ? 1 : -1) * (isPrime ? 1 : -1) * Math.PI) / 2) * this.currentAnimation.animationProgress;
    } else if (face === 'F' || face === 'B') {
      axis = 'z';
      angle = (((face === 'B' ? -1 : 1) * (isPrime ? -1 : 1) * Math.PI) / 2) * this.currentAnimation.animationProgress;
    } else {
      throw new Error(`unknown move ${move}`);
    }

    return getRotationMatrix(axis, angle);
  }

  project3D(x, y, z, piecePosition) {
    if (this.currentAnimation) {
      const rotation = this.getFaceTurnAnimationRotation(this.currentAnimation.move, piecePosition, this.currentAnimation.initialOrientation);
      if (rotation) {
        const newX = rotation.x(x, y, z);
        const newY = rotation.y(x, y, z);
        const newZ = rotation.z(x, y, z);
        x = newX;
        y = newY;
        z = newZ;
      }
    }

    const rotatedPoint = vec3_transformQuat([x, y, z], this.orientation);

    const x1 = rotatedPoint[0];
    const y1 = rotatedPoint[1];
    const z2 = rotatedPoint[2];

    // Project to 2D
    const perspective = 1000 / (1000 + z2);
    const projX = x1 * this.scale * perspective + this.canvas.width / 2;
    const projY = y1 * this.scale * perspective + this.canvas.height / 2;

    return { x: projX, y: projY, z: z2 };
  }

  drawSticker(corners, color) {
    this.ctx.beginPath();
    this.ctx.moveTo(corners[0].x, corners[0].y);
    for (let i = 1; i < corners.length; i++) {
      this.ctx.lineTo(corners[i].x, corners[i].y);
    }
    this.ctx.closePath();

    const colorMap = {
      white: '#FFFFFF',
      yellow: '#FFD500',
      red: '#B71234',
      orange: '#FF5800',
      green: '#009E60',
      blue: '#0051BA',
    };

    this.ctx.fillStyle = colorMap[color] || color;
    this.ctx.fill();
    this.ctx.strokeStyle = '#000';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const faces = [];

    // Define piece positions and orientations
    const cornerPositions = [
      { x: 1, y: -1, z: -1 }, // URF
      { x: -1, y: -1, z: -1 }, // UFL
      { x: -1, y: -1, z: 1 }, // ULB
      { x: 1, y: -1, z: 1 }, // UBR
      { x: 1, y: 1, z: -1 }, // DFR
      { x: -1, y: 1, z: -1 }, // DLF
      { x: -1, y: 1, z: 1 }, // DBL
      { x: 1, y: 1, z: 1 }, // DRB
    ];

    const edgePositions = [
      { x: 1, y: -1, z: 0 }, // UR
      { x: 0, y: -1, z: -1 }, // UF
      { x: -1, y: -1, z: 0 }, // UL
      { x: 0, y: -1, z: 1 }, // UB
      { x: 1, y: 1, z: 0 }, // DR
      { x: 0, y: 1, z: -1 }, // DF
      { x: -1, y: 1, z: 0 }, // DL
      { x: 0, y: 1, z: 1 }, // DB
      { x: 1, y: 0, z: -1 }, // FR
      { x: -1, y: 0, z: -1 }, // FL
      { x: -1, y: 0, z: 1 }, // BL
      { x: 1, y: 0, z: 1 }, // BR
    ];

    const centers = [
      { pos: { x: 0, y: -1, z: 0 }, color: 'white' }, // U
      { pos: { x: 0, y: 1, z: 0 }, color: 'yellow' }, // D
      { pos: { x: 1, y: 0, z: 0 }, color: 'red' }, // R
      { pos: { x: -1, y: 0, z: 0 }, color: 'orange' }, // L
      { pos: { x: 0, y: 0, z: -1 }, color: 'green' }, // F
      { pos: { x: 0, y: 0, z: 1 }, color: 'blue' }, // B
    ];

    // Collect all stickers with their z-depth
    const stickers = [];

    // Add center stickers
    centers.forEach(center => {
      const normal = center.pos;
      const tangent1 = normal.x !== 0 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 };
      const tangent2 = {
        x: normal.y * tangent1.z - normal.z * tangent1.y,
        y: normal.z * tangent1.x - normal.x * tangent1.z,
        z: normal.x * tangent1.y - normal.y * tangent1.x,
      };

      const size = 0.333; // 1/3 of cube edge
      const faceDistance = 1.01; // Slightly outside the cube center

      const corners = [
        this.project3D(
          center.pos.x * faceDistance + tangent1.x * size + tangent2.x * size,
          center.pos.y * faceDistance + tangent1.y * size + tangent2.y * size,
          center.pos.z * faceDistance + tangent1.z * size + tangent2.z * size,
          center.pos,
        ),
        this.project3D(
          center.pos.x * faceDistance - tangent1.x * size + tangent2.x * size,
          center.pos.y * faceDistance - tangent1.y * size + tangent2.y * size,
          center.pos.z * faceDistance - tangent1.z * size + tangent2.z * size,
          center.pos,
        ),
        this.project3D(
          center.pos.x * faceDistance - tangent1.x * size - tangent2.x * size,
          center.pos.y * faceDistance - tangent1.y * size - tangent2.y * size,
          center.pos.z * faceDistance - tangent1.z * size - tangent2.z * size,
          center.pos,
        ),
        this.project3D(
          center.pos.x * faceDistance + tangent1.x * size - tangent2.x * size,
          center.pos.y * faceDistance + tangent1.y * size - tangent2.y * size,
          center.pos.z * faceDistance + tangent1.z * size - tangent2.z * size,
          center.pos,
        ),
      ];

      const avgZ = (corners[0].z + corners[1].z + corners[2].z + corners[3].z) / 4;
      stickers.push({ corners, color: center.color, z: avgZ });
    });

    // Add edge stickers
    this.cube.edges.forEach((edge, index) => {
      const pos = edgePositions[index];
      const colors = edge.colors;
      const ori = edge.orientation;

      // Determine which faces this edge touches
      const facesTouchingEdge = [];
      if (Math.abs(pos.y) > 0.5) facesTouchingEdge.push(pos.y > 0 ? 'D' : 'U');
      if (Math.abs(pos.x) > 0.5) facesTouchingEdge.push(pos.x > 0 ? 'R' : 'L');
      if (Math.abs(pos.z) > 0.5) facesTouchingEdge.push(pos.z > 0 ? 'B' : 'F');

      // Draw stickers
      facesTouchingEdge.forEach((face, i) => {
        // For edges on the middle layer (FR, FL, BL, BR), we need to adjust the color mapping
        let colorIndex;
        if (index >= 8 && index <= 11) {
          // Middle layer edges - first color goes to F/B face, second to R/L face
          if (face === 'F' || face === 'B') {
            colorIndex = ori;
          } else {
            colorIndex = 1 - ori;
          }
        } else {
          // Top/bottom layer edges - standard mapping
          colorIndex = (i + ori) % 2;
        }
        const color = colors[colorIndex];

        let stickerCorners;
        const size = 0.333; // 1/3 of cube edge
        const faceDistance = 1.01; // Slightly outside the cube center

        if (face === 'U' || face === 'D') {
          const y = (face === 'U' ? -1 : 1) * faceDistance;
          const xCenter = pos.x * 0.667;
          const zCenter = pos.z * 0.667;
          stickerCorners = [
            this.project3D(xCenter + size, y, zCenter + size, pos),
            this.project3D(xCenter - size, y, zCenter + size, pos),
            this.project3D(xCenter - size, y, zCenter - size, pos),
            this.project3D(xCenter + size, y, zCenter - size, pos),
          ];
        } else if (face === 'R' || face === 'L') {
          const x = (face === 'R' ? 1 : -1) * faceDistance;
          const yCenter = pos.y * 0.667;
          const zCenter = pos.z * 0.667;
          stickerCorners = [
            this.project3D(x, yCenter + size, zCenter + size, pos),
            this.project3D(x, yCenter - size, zCenter + size, pos),
            this.project3D(x, yCenter - size, zCenter - size, pos),
            this.project3D(x, yCenter + size, zCenter - size, pos),
          ];
        } else {
          const z = (face === 'F' ? -1 : 1) * faceDistance;
          const xCenter = pos.x * 0.667;
          const yCenter = pos.y * 0.667;
          stickerCorners = [
            this.project3D(xCenter + size, yCenter + size, z, pos),
            this.project3D(xCenter - size, yCenter + size, z, pos),
            this.project3D(xCenter - size, yCenter - size, z, pos),
            this.project3D(xCenter + size, yCenter - size, z, pos),
          ];
        }

        const avgZ = stickerCorners.reduce((sum, c) => sum + c.z, 0) / 4;
        stickers.push({ corners: stickerCorners, color, z: avgZ });
      });
    });

    // Add corner stickers
    this.cube.corners.forEach((corner, index) => {
      const pos = cornerPositions[index];
      const colors = corner.colors;
      const ori = corner.orientation;

      // Map each face to its color based on position
      const cornerMappings = [
        ['U', 'R', 'F'], // URF
        ['U', 'F', 'L'], // UFL
        ['U', 'L', 'B'], // ULB
        ['U', 'B', 'R'], // UBR
        ['D', 'F', 'R'], // DFR
        ['D', 'L', 'F'], // DLF
        ['D', 'B', 'L'], // DBL
        ['D', 'R', 'B'], // DRB
      ];

      const faceColorMap = Object.fromEntries(cornerMappings[index].map((face, i) => [face, colors[i]]));

      // Apply orientation
      // Define proper rotation order for each corner position
      const cornerRotationOrders = {
        0: ['U', 'R', 'F'], // URF
        1: ['U', 'F', 'L'], // UFL
        2: ['U', 'L', 'B'], // ULB
        3: ['U', 'B', 'R'], // UBR
        4: ['D', 'F', 'R'], // DFR
        5: ['D', 'L', 'F'], // DLF
        6: ['D', 'B', 'L'], // DBL
        7: ['D', 'R', 'B'], // DRB
      };

      const rotationOrder = cornerRotationOrders[index];
      const rotatedMap = Object.fromEntries(
        rotationOrder.map((face, i) => [face, faceColorMap[rotationOrder[(i + ori) % 3]]]),
      );

      // Draw stickers for each face this corner touches
      const facesToDraw = [];
      if (pos.y < 0) facesToDraw.push('U');
      else facesToDraw.push('D');
      if (pos.x > 0) facesToDraw.push('R');
      else facesToDraw.push('L');
      if (pos.z < 0) facesToDraw.push('F');
      else facesToDraw.push('B');

      facesToDraw.forEach(face => {
        const color = rotatedMap[face];

        let stickerCorners;
        const size = 0.333;
        const faceDistance = 1.01;

        if (face === 'U' || face === 'D') {
          const y = (face === 'U' ? -1 : 1) * faceDistance;
          const xSign = pos.x > 0 ? 1 : -1;
          const zSign = pos.z > 0 ? 1 : -1;
          const xCenter = xSign * 0.667;
          const zCenter = zSign * 0.667;
          stickerCorners = [
            this.project3D(xCenter + xSign * size, y, zCenter + zSign * size, pos),
            this.project3D(xCenter - xSign * size, y, zCenter + zSign * size, pos),
            this.project3D(xCenter - xSign * size, y, zCenter - zSign * size, pos),
            this.project3D(xCenter + xSign * size, y, zCenter - zSign * size, pos),
          ];
        } else if (face === 'R' || face === 'L') {
          const x = (face === 'R' ? 1 : -1) * faceDistance;
          const ySign = pos.y > 0 ? 1 : -1;
          const zSign = pos.z > 0 ? 1 : -1;
          const yCenter = ySign * 0.667;
          const zCenter = zSign * 0.667;
          stickerCorners = [
            this.project3D(x, yCenter + ySign * size, zCenter + zSign * size, pos),
            this.project3D(x, yCenter - ySign * size, zCenter + zSign * size, pos),
            this.project3D(x, yCenter - ySign * size, zCenter - zSign * size, pos),
            this.project3D(x, yCenter + ySign * size, zCenter - zSign * size, pos),
          ];
        } else {
          const z = (face === 'F' ? -1 : 1) * faceDistance;
          const xSign = pos.x > 0 ? 1 : -1;
          const ySign = pos.y > 0 ? 1 : -1;
          const xCenter = xSign * 0.667;
          const yCenter = ySign * 0.667;
          stickerCorners = [
            this.project3D(xCenter + xSign * size, yCenter + ySign * size, z, pos),
            this.project3D(xCenter - xSign * size, yCenter + ySign * size, z, pos),
            this.project3D(xCenter - xSign * size, yCenter - ySign * size, z, pos),
            this.project3D(xCenter + xSign * size, yCenter - ySign * size, z, pos),
          ];
        }

        const avgZ = stickerCorners.reduce((sum, c) => sum + c.z, 0) / 4;
        stickers.push({ corners: stickerCorners, color, z: avgZ });
      });
    });

    // Sort stickers by z-depth (back to front)
    stickers.sort((a, b) => b.z - a.z);

    stickers.forEach(sticker => {
      this.drawSticker(sticker.corners, sticker.color);
    });

    if (!this.animating && this.cube.isSolved()) {
      this.drawSolvedIndicator();
    }
  }

  drawSolvedIndicator() {
    const size = 30;
    const x = this.canvas.width - size - 10;
    const y = this.canvas.height - size - 10;

    this.ctx.strokeStyle = '#4CAF50';
    this.ctx.lineWidth = 3;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    this.ctx.beginPath();
    this.ctx.moveTo(x + size * 0.25, y + size * 0.5);
    this.ctx.lineTo(x + size * 0.45, y + size * 0.7);
    this.ctx.lineTo(x + size * 0.75, y + size * 0.3);
    this.ctx.stroke();
  }
}
