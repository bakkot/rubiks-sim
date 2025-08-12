export class RubiksCube {
  constructor() {
    this.reset();
  }

  reset() {
    this.corners = [
      { id: 0, orientation: 0, colors: ['white', 'red', 'green'] }, // URF
      { id: 1, orientation: 0, colors: ['white', 'green', 'orange'] }, // UFL
      { id: 2, orientation: 0, colors: ['white', 'orange', 'blue'] }, // ULB
      { id: 3, orientation: 0, colors: ['white', 'blue', 'red'] }, // UBR
      { id: 4, orientation: 0, colors: ['yellow', 'green', 'red'] }, // DFR
      { id: 5, orientation: 0, colors: ['yellow', 'orange', 'green'] }, // DLF
      { id: 6, orientation: 0, colors: ['yellow', 'blue', 'orange'] }, // DBL
      { id: 7, orientation: 0, colors: ['yellow', 'red', 'blue'] }, // DRB
    ];

    this.edges = [
      { id: 0, orientation: 0, colors: ['white', 'red'] }, // UR
      { id: 1, orientation: 0, colors: ['white', 'green'] }, // UF
      { id: 2, orientation: 0, colors: ['white', 'orange'] }, // UL
      { id: 3, orientation: 0, colors: ['white', 'blue'] }, // UB
      { id: 4, orientation: 0, colors: ['yellow', 'red'] }, // DR
      { id: 5, orientation: 0, colors: ['yellow', 'green'] }, // DF
      { id: 6, orientation: 0, colors: ['yellow', 'orange'] }, // DL
      { id: 7, orientation: 0, colors: ['yellow', 'blue'] }, // DB
      { id: 8, orientation: 0, colors: ['green', 'red'] }, // FR
      { id: 9, orientation: 0, colors: ['green', 'orange'] }, // FL
      { id: 10, orientation: 0, colors: ['blue', 'orange'] }, // BL
      { id: 11, orientation: 0, colors: ['blue', 'red'] }, // BR
    ];
  }

  move(notation) {
    const moveMap = {
      U: () => this.U(),
      "U'": () => this.Uprime(),
      D: () => this.D(),
      "D'": () => this.Dprime(),
      R: () => this.R(),
      "R'": () => this.Rprime(),
      L: () => this.L(),
      "L'": () => this.Lprime(),
      F: () => this.F(),
      "F'": () => this.Fprime(),
      B: () => this.B(),
      "B'": () => this.Bprime(),
    };

    moveMap[notation]();
  }

  cyclePieces(pieces, cycle, oriChange = 0) {
    const isCorner = pieces === this.corners;
    const first = pieces[cycle[0]];
    for (let i = cycle.length - 1; i >= 0; --i) {
      const piece = i === 0 ? first : pieces[cycle[i]];
      const newPos = cycle[(i + 1) % cycle.length];
      const dist = newPos - cycle[i];
      const sign = dist % 2 === 0 ? 1 : -1;
      piece.orientation = ((isCorner ? 3 : 2) + piece.orientation + sign * oriChange) % (isCorner ? 3 : 2);
      pieces[newPos] = piece;
    }
  }

  isSolved() {
    for (let i = 0; i < this.corners.length; i++) {
      const corner = this.corners[i];
      if (corner.id !== i || corner.orientation !== 0) {
        return false;
      }
    }

    for (let i = 0; i < this.edges.length; i++) {
      const edge = this.edges[i];
      if (edge.id !== i || edge.orientation !== 0) {
        return false;
      }
    }

    return true;
  }

  U() {
    this.cyclePieces(this.corners, [0, 1, 2, 3], 0);
    this.cyclePieces(this.edges, [0, 1, 2, 3], 0);
  }

  Uprime() {
    this.cyclePieces(this.corners, [3, 2, 1, 0], 0);
    this.cyclePieces(this.edges, [3, 2, 1, 0], 0);
  }

  D() {
    this.cyclePieces(this.corners, [4, 7, 6, 5], 0);
    this.cyclePieces(this.edges, [4, 7, 6, 5], 0);
  }

  Dprime() {
    this.cyclePieces(this.corners, [5, 6, 7, 4], 0);
    this.cyclePieces(this.edges, [5, 6, 7, 4], 0);
  }

  R() {
    this.cyclePieces(this.corners, [0, 3, 7, 4], 1);
    this.cyclePieces(this.edges, [0, 11, 4, 8], 0);
  }

  Rprime() {
    this.cyclePieces(this.corners, [4, 7, 3, 0], 2);
    this.cyclePieces(this.edges, [8, 4, 11, 0], 0);
  }

  L() {
    this.cyclePieces(this.corners, [2, 1, 5, 6], 1);
    this.cyclePieces(this.edges, [2, 9, 6, 10], 0);
  }

  Lprime() {
    this.cyclePieces(this.corners, [6, 5, 1, 2], 2);
    this.cyclePieces(this.edges, [10, 6, 9, 2], 0);
  }

  F() {
    this.cyclePieces(this.corners, [1, 0, 4, 5], 1);
    this.cyclePieces(this.edges, [1, 8, 5, 9], 1);
  }

  Fprime() {
    this.cyclePieces(this.corners, [5, 4, 0, 1], 2);
    this.cyclePieces(this.edges, [9, 5, 8, 1], 1);
  }

  B() {
    this.cyclePieces(this.corners, [3, 2, 6, 7], 1);
    this.cyclePieces(this.edges, [3, 10, 7, 11], 1);
  }

  Bprime() {
    this.cyclePieces(this.corners, [7, 6, 2, 3], 2);
    this.cyclePieces(this.edges, [11, 7, 10, 3], 1);
  }
}
