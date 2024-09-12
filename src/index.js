import { setImagePath, loadImage, getSeed, seedRand, rand, randInt, init, initPointer, onPointer, GameLoop } from './libs/kontra.mjs';

(async () => {
  // TODO: make root before publish
  setImagePath('./assets')
  const tileSheet = await loadImage('tiles.png');

  seedRand(1726182159003)
  console.log(getSeed())

  init();
  const pointer = initPointer();

  const size = 11; // can't go smaller than 9
  const cells = size * size;
  canvas.width = size * 50;
  canvas.height = size * 50;
  const ctx = canvas.getContext('2d');
  window.grid = [];
  const indices = [];
  let placing;
  const darkness = [];
  // const playerBuildings = [];

  // fixed tetrominoes (unique pieces taking into account
  // rotation and flipping)
  // const tetrominoes = [
  //   // 0; O
  //   [
  //     0,
  //     [1,1],
  //     [1,1]
  //   ],
  //   // 1; L (0°)
  //   [
  //     1,
  //     [1],
  //     [1],
  //     [1,1],
  //   ],
  //   // 2; L (90°)
  //   [
  //     2,
  //     [1,1,1],
  //     [1]
  //   ],
  //   // 3; L (180°)
  //   [
  //     3,
  //     [1,1],
  //     [0,1],
  //     [0,1]
  //   ],
  //   // 4; L (270°)
  //   [
  //     4,
  //     [0,0,1],
  //     [1,1,1]
  //   ],
  //   // 5; J (0°)
  //   [
  //     5,
  //     [0,1],
  //     [0,1],
  //     [1,1],
  //   ],
  //   // 6; J (90°)
  //   [
  //     6,
  //     [1],
  //     [1,1,1]
  //   ],
  //   // 7; J (180°)
  //   [
  //     7,
  //     [1,1],
  //     [1],
  //     [1]
  //   ],
  //   // 8; J (270°)
  //   [
  //     8,
  //     [1,1,1],
  //     [0,0,1]
  //   ],
  //   // 9: S (0°)
  //   [
  //     9,
  //     [0,1,1],
  //     [1,1]
  //   ],
  //   // 10; S (90°)
  //   [
  //     10,
  //     [1,0],
  //     [1,1],
  //     [0,1]
  //   ],
  //   // 11; Z (0°)
  //   [
  //     11,
  //     [1,1,0],
  //     [0,1,1]
  //   ],
  //   // 12; Z (90°)
  //   [
  //     12,
  //     [0,1],
  //     [1,1],
  //     [1,0]
  //   ],
  //   // 13; T (0°)
  //   [
  //     13,
  //     [1,1,1],
  //     [0,1]
  //   ],
  //   // 14; T (90°)
  //   [
  //     14,
  //     [0,1],
  //     [1,1],
  //     [0,1]
  //   ],
  //   // 15; T (180°)
  //   [
  //     15,
  //     [0,1],
  //     [1,1,1]
  //   ],
  //   // 16; T (270°)
  //   [
  //     16,
  //     [1,0],
  //     [1,1],
  //     [1,0]
  //   ],
  //   // 17; I (0°)
  //   [
  //     17,
  //     [1],
  //     [1],
  //     [1],
  //     [1]
  //   ],
  //   // 18; I (90°)
  //   [
  //     18,
  //     [1,1,1,1]
  //   ]
  // ];
  // const tetrominoRotations = [
  //   [],
  //   [2,3,4],
  //   [1,3,4],
  //   [1,2,4],
  //   [1,2,3],
  //   [6,7,8],
  //   [5,7,8],
  //   [5,6,8],
  //   [5,6,7],
  //   [10],
  //   [9],
  //   [12],
  //   [11],
  //   [14,15,16],
  //   [13,15,16],
  //   [13,14,16],
  //   [13,14,15],
  //   [18],
  //   [17]
  // ];

  const sawmillIncrease = 35;
  const stoneMasonIncrease = 35;

  // const groupedGrid = [];

  for (let r = 0; r < size; r++) {
    grid[r] = [];
    // groupedGrid[r] = [];
    for (let c = 0; c < size; c++) {
      grid[r][c] = 0;
      // groupedGrid[r][c] = -1;
    }
  }

  function row(i) {
    return i / size | 0;
  }

  function col(i) {
    return i % size | 0;
  }

  // const third = size / 3 | 0;
  // const midStart = third + 1;
  // const midEnd = size - third;
  // const midSize = midEnd - midStart + 1;

  // avoid darkness in the middle
  // for (let r = midStart - 1; r < midEnd; r++) {
  //   for (let c = midStart - 1; c < midEnd; c++) {
  //     grid[r][c] = -1;
  //   }
  // }

  for (let i = 0; i < cells; i++) {
    const r = row(i);
    const c = col(i);

    if (grid[r][c] < 0) {
      continue;
    }

    if ((i+1) % 13 == 0) {
      grid[r][c] = 0.5;
      grid[r][size - 1 - c] = 0.5;
      grid[c][r] = 0.5;
      grid[c][size - 1 - r] = 0.5;
    }

    if ((cells - i) % 13 == 0) {
      grid[r][c] = 0.5;
      grid[r][size - 1 - c] = 0.5;
      grid[c][r] = 0.5;
      grid[c][size - 1 - r] = 0.5;
    }
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] == 0.5) {
        indices.push(r * size + c);
        grid[r][c] = 0;
      }
    }
  }

  // fill grouped grid with tetrominoes
  // function fillTetrominoes(enforceDiversity = true, pieceSize = 4) {
  //   const usedPieces = [];
  //   for (let r = 0; r < size; r++) {
  //     for (let c = 0; c < size; c++) {
  //       if (groupedGrid[r][c] != -1) {
  //         continue;
  //       }

  //       let validPieces = tetrominoes.slice();
  //       while (true) {
  //         // sort by how often the piece was used to encourage
  //         // diversity
  //         validPieces.sort((a, b) => {
  //           return usedPieces[ b[0] ] - usedPieces[ a[0] ]
  //         });

  //         const index = randInt(
  //           0,
  //           validPieces.length - 1,
  //           // bias random towards 0
  //           // @see https://gamedev.stackexchange.com/a/116875
  //           () => {
  //             return rand() ** 2
  //           }
  //         );
  //         const tetromino = validPieces[index];
  //         const pieceIndex = tetromino[0];

  //         // shift piece by it's first square on the top row
  //         const pieceStartCol = tetromino[1].findIndex(v => v);
  //         const startCol = c - pieceStartCol;
  //         let canPlace = true;

  //         // the first row is the index
  //         check_piece:
  //         for (let pieceR = 1; pieceR < pieceSize + 1; pieceR++) {
  //           for (let pieceC = 0; pieceC < pieceSize; pieceC++) {
  //             if (!tetromino[pieceR]?.[pieceC]) {
  //               continue;
  //             }

  //             const gridR = r + pieceR - 1;
  //             const gridC = startCol + pieceC

  //             // prefer not grouping two same pieces or rotation
  //             if (
  //               getAdjacentTiles(gridR, gridC).some(([row, col]) => {
  //                 const index = groupedGrid[row][col];
  //                 if (index == -1) {
  //                   return;
  //                 }

  //                 return enforceDiversity
  //                   ? index == pieceIndex || tetrominoRotations[index].includes(pieceIndex)
  //                   : false
  //               })
  //             ) {
  //               canPlace = false;
  //               break check_piece;
  //             }

  //             // exit out of outer loop
  //             if (
  //               gridR >= size ||
  //               gridC >= size ||
  //               gridC < 0 ||
  //               groupedGrid[gridR][gridC] != -1
  //             ) {
  //               canPlace = false;
  //               break check_piece;
  //             }
  //           }
  //         }

  //         if (canPlace) {
  //           usedPieces[pieceIndex] ??= 0;
  //           usedPieces[pieceIndex]++;

  //           for (let pieceR = 1; pieceR < pieceSize + 1; pieceR++) {
  //             for (let pieceC = 0; pieceC < pieceSize; pieceC++) {
  //               if (!tetromino[pieceR]?.[pieceC]) {
  //                 continue;
  //               }

  //               groupedGrid[r + pieceR - 1][startCol + pieceC] = pieceIndex
  //             }
  //           }

  //           break;
  //         }
  //         else {
  //           // remove the piece as an option
  //           validPieces.splice(index, 1);

  //           if (!validPieces.length) {
  //             break;
  //           }
  //         }
  //       }
  //     }
  //   }
  // }

  // function fillBoard() {
  //   for (let r = 0; r < size; r++) {
  //     for (let c = 0; c < size; c++) {
  //       groupedGrid[r][c] = -1;
  //     }
  //   }

  //   fillTetrominoes();

  //   // fill any remaining size 4 holes with a piece that
  //   // is just a rotated version of a nearby piece
  //   fillTetrominoes(false);

  //   // turn a group of 3 in a row tiles into an area
  //   // so it won't be darkness
  //   fillTetrominoes(false, 3);


  //   let emptyCount = 0;
  //   for (let r = 0; r < size; r++) {
  //     for (let c = 0; c < size; c++) {
  //       if (groupedGrid[r][c] == -1) {
  //         emptyCount++;
  //         // grid[r][c] = -1;
  //         // darkness.push([r,c]);
  //       }
  //     }
  //   }

  //   if (emptyCount > 13) {
  //     fillBoard();
  //   }
  // }

  // fillBoard();
  // for (let r = 0; r < size; r++) {
  //   for (let c = 0; c < size; c++) {
  //     if (groupedGrid[r][c] == -1) {
  //       grid[r][c] = -1;
  //       darkness.push([r,c]);
  //     }
  //   }
  // }

  for (let count = 0; count < 13; count++) {
    spreadDarkness(false);
  }

  // add wood and stone
  // for (let i = 0; i < 2;) {
  //   const randR = randInt(0, size - 1);
  //   const randC = randInt(0, size - 1);

  //   if (grid[randR][randC]) {
  //     continue;
  //   }

  //   getTetrominoArea(randR, randC).map(([r, c]) => {
  //     grid[r][c] = 1;
  //   });
  //   i++;
  // }
  // for (let i = 0; i < 2;) {
  //   const randR = randInt(0, size - 1);
  //   const randC = randInt(0, size - 1);

  //   if (grid[randR][randC]) {
  //     continue;
  //   }

  //   getTetrominoArea(randR, randC).map(([r, c]) => {
  //     grid[r][c] = 2;
  //   });
  //   i++;
  // }

  // add wood
  let stoneWoodChance = 0.25;
  let wood = 0;
  let stone = 0;

  for (let count = 0; count < randInt(2, 4) || wood < 5; count++) {
    const index = randInt(0, indices.length - 1);
    const i = indices.splice(index, 1)[0];
    const r = row(i);
    const c = col(i);

    getAdjacentTiles(r, c).map(([ tileR, tileC ]) => {
      if (grid[tileR][tileC] || rand() > stoneWoodChance) {
        return;
      }

      grid[tileR][tileC] = 1;  // wood
      wood++;
    });

    if (rand() > stoneWoodChance) {
      grid[r][c] = 1;  // wood
      wood++;
    }
  }
  // add stone
  for (let count = 0; count < randInt(2, 4) || stone < 5; count++) {
    const index = randInt(0, indices.length - 1);
    const i = indices.splice(index, 1)[0];
    const r = row(i);
    const c = col(i);

    getAdjacentTiles(r, c).map(([ tileR, tileC ]) => {
      if (grid[tileR][tileC] || rand() > stoneWoodChance) {
        return;
      }

      grid[tileR][tileC] = 2;  // stone
      stone++;
    });

    if (rand() > stoneWoodChance) {
      grid[r][c] = 2;  // stone
      stone++;
    }
  }

  // function getTetrominoArea(tileR, tileC, seen = [], index) {
  //   if (!groupedGrid[tileR]?.[tileC]) {
  //     return [];
  //   }

  //   if (isNaN(index)) {
  //     index = groupedGrid[tileR][tileC]
  //   }

  //   if (
  //     groupedGrid[tileR][tileC] !== index ||
  //     seen.find(([r, c]) => r == tileR && c == tileC)
  //   ) {
  //     return [];
  //   }

  //   seen.push([tileR, tileC]);

  //   getTetrominoArea(tileR - 1, tileC, seen, index),
  //   getTetrominoArea(tileR, tileC + 1, seen, index),
  //   getTetrominoArea(tileR + 1, tileC, seen, index),
  //   getTetrominoArea(tileR, tileC - 1, seen, index)

  //   return seen;
  // }

  const buildings = {
    H: 1,
    W: 2,
    F: 3,
    LM: 4,
    SM: 5,
    C: 6,
    LT: 7
  };
  const colors = {
    1: '#c5dec1',
    2: '#dfdfdf',
    H: '#fa8072',
    W: '#b3c6e0',
    F: '#f7e7aa',
    LM: '#c9a999',
    SM: '#cfcfc4',
    C: '#CCBEF0',
    LT: '#ffcd91'
  };

  // const buildingPool = ['H', 'W', 'F', 'LM', 'SM'];
  // const buildingChance = {
  //   H: 100,
  //   W: 100,
  //   F: 0,
  //   LM: 100,
  //   SM: 100,
  //   C: 0,
  //   LT: 0
  // };
  // const built = [];
  let round = 1;

  // reroll.addEventListener('click', () => {
  //   available.innerHTML = '';
  //   getCards(false);
  //   reroll.setAttribute('disabled', '');
  // });
  rotate.addEventListener('click', () => {
    if (placing) {
      placing[2] = rotateShape(placing[2])
    }
  });

  getCards(false);

  function randBuilding() {
    // Calculate the sum of all portions.
    // @see https://stackoverflow.com/a/48267598/2124254
    let poolSize = 0;
    Object.values(buildingChance).map(chance => {
      poolSize += chance;
    });

    // Get a random integer from 0 to PoolSize.
    const rand = randInt(0, poolSize);

    // Detect the item, which corresponds to current random number.
    let accumulatedProbability = 0;
    for (let [name, chance] of Object.entries(buildingChance)) {
      accumulatedProbability += chance;
      if (rand <= accumulatedProbability) {
        return name;
      }
    }

    throw new Error('randBuilding failed!');
  }

  const shapes = [
    [
      [1]
    ],
    [
      [1,1],
      [0,0]
    ],
    [
      [0,0,0],
      [1,1,1],
      [0,0,0]
    ],
    [
      [1,1],
      [0,1]
    ]
  ]

  // rotate an NxN matrix 90deg
  // @see https://codereview.stackexchange.com/a/186834
  function rotateShape(matrix) {
    const N = matrix.length - 1;
    const result = matrix.map((row, i) =>
      row.map((val, j) => matrix[N - j][i])
    );

    return result;
  }

  const buttonCanvas = document.createElement('canvas');
  const buttonCtx = buttonCanvas.getContext('2d');

  function getCards(grow = false) {
    setTimeout(() => {
      // let total = 0;
      for (let i = 0; i < 3/*built.filter(b => b == 'H').length*/; i++) {
        // const name = randBuilding();
        const names = Object.keys(buildings);
        const name = names[ randInt(0, names.length - 1) ];
        const value = buildings[name];
        // const value = randInt(1, 7);

        // clone array
        let shape = shapes[ randInt(0,3) ].map(r => r.slice());

        // randomly rotate
        for (let i = 0; i < randInt(0, 3); i++) {
          shape = rotateShape(shape)
        }
        // randomly place building
        const numRows = shape.length;
        const numCols = shape[0].length;
        let row, col;

        while (true) {
          row = randInt(0, numRows - 1);
          col = randInt(0, numCols - 1);
          if (shape[row][col]) break;
        }
        shape[row][col] = name;

        buttonCanvas.width = numCols * 50 + 2;
        buttonCanvas.height = numRows * 50 + 2;

        buttonCtx.strokeStyle = 'grey';
        buttonCtx.font = '18px Arial';
        buttonCtx.textBaseline = 'middle';
        buttonCtx.textAlign = 'center';
        buttonCtx.fillStyle = colors[name];

        for (let r = 0; r < numRows; r++) {
          for (let c = 0; c < numCols; c++) {
            if (shape[r][c]) {
              buttonCtx.fillRect(c * 50 + 1, r * 50 + 1, 50, 50);
              buttonCtx.strokeRect(c * 50 + 1, r * 50 + 1, 50, 50);
            }
          }
        }

        buttonCtx.fillStyle = 'black';
        const [x, y] = imagePos[name] ?? [];
        buttonCtx.drawImage(tileSheet, x, y, 50, 50, col * 50, row * 50, 50, 50);
        buttonCtx.fillText(value, col * 50 + 9, row * 50 + 11);

        const imgData = buttonCanvas.toDataURL();
        const img = document.createElement('img');
        img.src = imgData;

        const btn = document.createElement('button');
        btn.setAttribute('class', 'available');

        btn.append(img);
        btn.addEventListener('click', () => {
          placing = [
            name,
            value,
            shape
          ];
          btn.classList.add('selected');
        });

        // total += value;
        available.append(btn);
      }

      // built.map(b => {
      //   if (b == 'C') {
      //     total -= 3;
      //   }
      // });
      // totalValue.textContent = total;

      if (false/*total >= 13*/) {
        growDarkness(1);

        setTimeout(() => {
          alert(`Total of all cards is >= 13. Darkness grows`);
        }, 100);
        // reroll.setAttribute('disabled', '');
      }
      else if (grow) {
        growDarkness(1);
      }
    }, 100);
  }

  function spreadDarkness(checkLightTower = true) {
    const index = randInt(0, indices.length - 1);
    const i = indices.splice(index, 1)[0];
    const r = row(i);
    const c = col(i);

    // tile already occupied so try again
    if (grid[r][c] < 0) {
      return spreadDarkness();
    }

    // light tower prevents spreading of darkness to nearby
    // tiles so try again
    if (checkLightTower && isNearbyLightTower(r, c)) {
      return spreadDarkness();
    }

    grid[r][c] = -1;
    darkness.push([r,c]);
  }

  function growDarkness(times = 1, checkLightTower = true) {

    // sort darkness tiles by how close it is to a player
    // building and then by how many open tiles are adjacent
    // to it
    const growableTiles = darkness
      .map(([ tileR, tileC ]) => {
        return getAdjacentTiles(tileR, tileC)
          .map(([r, c]) => {

            // tile already a darkness tile
            if (grid[r][c] < 0) {
              return;
            }

            // light tower prevents spreading of darkness
            if (checkLightTower && isNearbyLightTower(r, c)) {
              return;
            }

            return [r, c];
          })
          .filter(tile => !!tile)
      })
      .filter(tile => tile.length)
      .sort((a, b) => b.length - a.length)
      // .sort((a, b) => {
      //   const aRow = a[0][0];
      //   const aCol = a[0][1];
      //   const bRow = b[0][0];
      //   const bCol = b[0][1];

      //   let aDist = 20;
      //   let bDist = 20;

      //   playerBuildings.map(([r, c], index) => {
      //     // don't use the last placed building to determine
      //     // distance
      //     if (index == playerBuildings.length -1) return;

      //     aDist = Math.min(
      //       aDist,
      //       Math.hypot(aRow - r, aCol - c)
      //     );
      //     bDist = Math.min(
      //       bDist,
      //       Math.hypot(bRow - r, bCol - c)
      //     );
      //   });

      //   return b.length - a.length || aDist - bDist;
      // });

    // grow a random darkness tile adjacently
    for (
      let count = 0;
      count < times && count < growableTiles.length;
      count++
    ) {

      // bias random towards 0 (i.e. towards tiles that can grow
      // more)
      // @see https://gamedev.stackexchange.com/a/116875
      const index = randInt(
        0,
        growableTiles.length - 1,
        () => rand() ** 2
      );
      growableTiles[index].map(([ r, c ]) => {
        if (grid[r][c] < 0) return;

        // if (grid[r][c] == 'LM') {
        //   buildingChance.C = Math.max(0, buildingChance.C - sawmillIncrease);
        //   buildingChance.F = Math.max(0, buildingChance.F - sawmillIncrease);
        //   // buildingChance.B = Math.max(0, buildingChance.B - sawmillIncrease);
        //   // buildingPool.push('C', 'B');
        // }
        // else if (grid[r][c] == 'SM') {
        //   // buildingPool.push('LT'/*, 'Wa'*/);
        //   buildingChance.LT = Math.min(0, buildingChance.LT - stoneMasonIncrease);
        // }

        grid[r][c] = -1;
        darkness.push([r, c]);
      });
    }
  }

  function getAdjacentTiles(tileR, tileC) {
    return getNearbyTiles(tileR, tileC).filter(([r, c]) => {
      return r == tileR || c == tileC;
    });
  }

  function getNearbyTiles(tileR, tileC) {
    const tiles = [];

    for (let r = tileR - 1; r <= tileR + 1; r++) {
      if (r < 0 || r >= size) {
        continue;
      }

      for (let c = tileC - 1 ; c <= tileC + 1; c++) {
        if (
          c < 0 ||
          c >= size ||
          (r == tileR && c == tileC)
        ) {
          continue;
        }

        tiles.push([r, c]);
      }
    }

    return tiles;
  }

  function isNearbyLightTower(tileR, tileC) {
    if (grid[tileR][tileC][0] == 'LT') {
      return true;
    }

    return getNearbyTiles(tileR, tileC).some(([r, c]) => {
      return grid[r][c][0] == 'LT'
    });
  }
  window.isNearbyLightTower = isNearbyLightTower;

  onPointer('up', () => {
    if (!placing) {
      return;
    }

    const r = pointer.y / 50 | 0;
    const c = pointer.x / 50 | 0;

    const [ name, value, shape ] = placing;
    const [ buildingRow, buildingCol ] = getShapeBuildingPos(shape);

    // can't place already something there
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[0].length; col++) {
        if (!shape[row][col]) {
          continue;
        }

        const tileR = r + row - buildingRow;
        const tileC = c + col - buildingCol;

        if (
          tileR < 0 ||
          tileR >= size ||
          tileC < 0 ||
          tileC >= size ||
          grid[tileR][tileC]
        ) {
          return;
        }
      }
    }

    placing.push([r, c]);

    // let areaValue = buildings[placing];
    // let dupArea;
    // getTetrominoArea(r, c).map(([ tileR, tileC ]) => {
    //   const name = grid[tileR][tileC];
    //   areaValue += buildings[name] ?? 0;
    //   dupArea ||= name == placing;
    // });
    // const [ name ] = placing;
    let rowValue = buildings[name];
    // let dupRow;
    let colValue = buildings[name];
    // let dupCol;
    for (let i = 0; i < size; i++) {
      if (isBuildingPos(r, i)) {
        rowValue += buildings[ grid[r][i][0] ];
      }
      if (isBuildingPos(i, c)) {
        colValue += buildings[ grid[i][c][0] ];
      }

      // const rowName = grid[r][i][0];
      // rowName += buildings[rowName] ?? 0;
      // dupRow ||= rowName == name

      // const colName = grid[i][c][0];
      // colValue += buildings[colName] ?? 0;
      // dupCol ||= colName == name
    }

    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[0].length; col++) {
        if (shape[row][col]) {
          grid[r + row - buildingRow][c + col - buildingCol] = placing;
        }
      }
    }
    grid[r][c] = placing;

    if (rowValue > 12) {
      alert('Total row value >= 13. Darkness grows');
      growDarkness(1);
    }
    if (colValue > 12) {
      alert('Total col value >= 13. Darkness grows');
      growDarkness(1);
    }

    placing = 0;
    round++;
    roundS.textContent = round;
    available.innerHTML = '';

    // if (round > 1) {
      growDarkness(1);
    // }

    // darkness spreads twice on round 13
    if (round == 13) {
      alert(`The Darkness intensifies`);
      growDarkness(3);
    }

    if (round <= 16) {
      getCards();
    }
  });

  document.addEventListener('keypress', ({code}) => {
    if (placing && code == 'KeyR') {
      placing[2] = rotateShape(placing[2]);
    }
  });

  function getShapeBuildingPos(shape) {
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[0].length; col++) {
        if (buildings[ shape[row][col] ]) {
          return [row, col];
        }
      }
    }
  }

  function isBuildingPos(tileR, tileC) {
    const tile = grid[tileR][tileC];

    return tile[3]?.[0] == tileR && tile[3][1] == tileC;
  }

  // const fillColors = [
  //   'yellow',
  //   'orange',
  //   'orange',
  //   'orange',
  //   'orange',
  //   'blue',
  //   'blue',
  //   'blue',
  //   'blue',
  //   'lightgreen',
  //   'lightgreen',
  //   'red',
  //   'red',
  //   'magenta',
  //   'magenta',
  //   'magenta',
  //   'magenta',
  //   'cyan',
  //   'cyan'
  // ];

  const imagePos = {
    C: [0, 0],
    F: [50, 0],
    1: [100, 0],
    H: [150, 0],
    LT: [200, 0],
    2: [250, 0],
    LM: [300, 0],
    SM: [350, 0],
    W: [400, 0]
  }

  // grid[5][5] = 'C'
  // grid[5][6] = 'F'
  // grid[5][7] = 'LT'

  ctx.font = '18px Arial';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  GameLoop({
    render() {
      ctx.strokeStyle = 'black';
      ctx.fillStyle = 'black';

      // if (placing) {
      //   const r = pointer.y / 50 | 0;
      //   const c = pointer.x / 50 | 0;

      //   if (grid[r] && !grid[r][c]) {
      //     ctx.save();
          // ctx.globalAlpha = 0.5
          // ctx .fillStyle = 'lightskyblue';
          // for (let tileR = 0; tileR < size; tileR++) {
          //   ctx.fillRect(c * 50, tileR * 50, 50, 50);
          // }
          // for (let tileC = 0; tileC < size; tileC++) {
          //   ctx.fillRect(tileC * 50, r * 50, 50, 50);
          // }

          // ctx.globalAlpha = 0.85
          // ctx .fillStyle = 'deepskyblue';
          // const tiles = getTetrominoArea(r,c);
          // tiles.map(([tileR, tileC]) => {
          //   if (tileR == r && tileC == c) {
          //     return;
          //   }

          //   ctx.fillRect(tileC * 50, tileR * 50, 50, 50);
          // });

      //     ctx.globalAlpha = 0.25
      //     ctx.fillStyle = 'black';
      //     ctx.fillRect(c * 50, r * 50, 50, 50);
      //     ctx.restore();

      //     ctx.fillText(placing, c * 50 + 25, r * 50 + 25);
      //   }
      // }

      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {

          // if (!grid[r][c]) {
          //   continue;
          // }

          // if (!groupedGrid[r][c]) {
          //   continue;
          // }

          // ctx.fillText(groupedGrid[r][c], c * 50 + 25, r * 50 + 25);

          ctx.strokeStyle = 'grey';
          ctx.lineWidth = 1;
          ctx.strokeRect(c * 50, r * 50, 50, 50);

          // const index = groupedGrid[r][c];
          // if (index != -1) {
          //   ctx.lineWidth = 3;
          //   if (groupedGrid[r - 1]?.[c] != index) {
          //     ctx.beginPath();
          //     ctx.moveTo(c * 50, r * 50);
          //     ctx.lineTo((c + 1) * 50, r * 50);
          //     ctx.stroke();
          //   }
          //   if (groupedGrid[r][c + 1] != index) {
          //     ctx.beginPath();
          //     ctx.moveTo((c + 1) * 50, r * 50);
          //     ctx.lineTo((c + 1) * 50, (r + 1) * 50);
          //     ctx.stroke();
          //   }
          //   if (groupedGrid[r + 1]?.[c] != index) {
          //     ctx.beginPath();
          //     ctx.moveTo(c * 50, (r + 1) * 50);
          //     ctx.lineTo((c + 1) * 50, (r + 1) * 50);
          //     ctx.stroke();
          //   }
          //   if (groupedGrid[r][c - 1] != index) {
          //     ctx.beginPath();
          //     ctx.moveTo(c * 50, r * 50);
          //     ctx.lineTo(c * 50, (r + 1) * 50);
          //     ctx.stroke();
          //   }

          //   // ctx.save();
          //   // ctx.globalAlpha = 0.1;
          //   // ctx.fillStyle = fillColors[index];
          //   // ctx.fillRect(c * 50, r * 50, 50, 50);
          //   // ctx.restore();
          // }

          // if (grid[r][c] < 0) {
          //   ctx.globalAlpha = 0.8;
          //   ctx.fillStyle = '#101720';
          //   ctx.fillRect(c * 50, r * 50, 50, 50);
          //   // ctx.drawImage(tileSheet, c * 50, r * 50)
          // }
          if (grid[r][c] != -1) {
            ctx.fillStyle = 'white';
            ctx.fillRect(c * 50, r * 50, 50, 50);
          }

          const tile = grid[r][c];
          if (!tile) {
            continue;
          }
          const name = tile[0] ?? tile;
          const [ x, y ] = imagePos[name] ?? [];

          // colors
          if (name &&
            colors[name] ||
            name[0] == '#'
          ) {
            const color = colors[name] || name;
            ctx.fillStyle = color;
            ctx.fillRect(c * 50, r * 50, 50, 50);
          }

          // images
          if (name == 1) {
            ctx.drawImage(tileSheet, x, y, 50, 50, c * 50, r * 50, 50, 50)
          }
          else if (name == 2) {
            ctx.drawImage(tileSheet, x, y, 50, 50, c * 50, r * 50, 50, 50)
          }
          else if (isBuildingPos(r, c)) {
            ctx.drawImage(tileSheet, x, y, 50, 50, c * 50, r * 50, 50, 50)
            ctx.fillStyle = 'black';
            ctx.fillText(buildings[name], c * 50 + 9, r * 50 + 11);
          }
        }
      }

      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          const tile = grid[r][c];
          if (typeof tile != 'object') {
            continue;
          }

          ctx.strokeStyle = 'black';
          ctx.lineWidth = 3;
          const [ name ] = tile;
          const color = colors[name] || name;

          if (grid[r - 1]?.[c] != tile) {
            ctx.beginPath();
            ctx.moveTo(c * 50, r * 50);
            ctx.lineTo((c + 1) * 50, r * 50);
            ctx.stroke();
          }
          if (grid[r][c + 1] != tile) {
            ctx.beginPath();
            ctx.moveTo((c + 1) * 50, r * 50);
            ctx.lineTo((c + 1) * 50, (r + 1) * 50);
            ctx.stroke();
          }
          if (grid[r + 1]?.[c] != tile) {
            ctx.beginPath();
            ctx.moveTo(c * 50, (r + 1) * 50);
            ctx.lineTo((c + 1) * 50, (r + 1) * 50);
            ctx.stroke();
          }
          if (grid[r][c - 1] != tile) {
            ctx.beginPath();
            ctx.moveTo(c * 50, r * 50);
            ctx.lineTo(c * 50, (r + 1) * 50);
            ctx.stroke();
          }
        }
      }

      if (placing) {
        const r = pointer.y / 50 | 0;
        const c = pointer.x / 50 | 0;
        const [ name, value, shape ] = placing;

        ctx.save();
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'red';
        // ctx.setLineDash([15,15]);

        const [ buildingRow, buildingCol ] = getShapeBuildingPos(shape);

        for (let row = 0; row < shape.length; row++) {
          for (let col = 0; col < shape[0].length; col++) {
            if (shape[row][col]) {
              ctx.strokeRect((c + col - buildingCol) * 50, (r + row - buildingRow) * 50, 50, 50);
            }
          }
        }
        ctx.restore();

        // if (grid[r] && !grid[r][c]) {
          ctx.fillStyle = 'black';

          // ctx.save();
          // ctx.globalAlpha = 0.25
          // ctx.fillRect(c * 50, r * 50, 50, 50);
          // ctx.restore();

          const [x, y] = imagePos[name];
          ctx.drawImage(tileSheet, x, y, 50, 50, c * 50, r * 50, 50, 50)
          ctx.fillText(value, c * 50 + 9, r * 50 + 11);
        // }
      }
    }
  }).start();
})()