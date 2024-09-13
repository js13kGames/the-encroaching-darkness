import { setImagePath, loadImage, getSeed, seedRand, rand, randInt, init, initPointer, onPointer, GameLoop } from './libs/kontra.mjs';

(async () => {
  // TODO: make root before publish
  setImagePath('./')
  const tileSheet = await loadImage('tiles.png');

  let placing;

  init();
  const pointer = initPointer();
  let loop;

  function startGame(seed) {
    canvas.classList.add('play');

    seedRand(seed)
    console.log('seed:', getSeed());

    const size = 11; // can't go smaller than 9
    const cells = size * size;
    canvas.width = size * 50;
    canvas.height = size * 50;
    const ctx = canvas.getContext('2d');
    window.grid = [];
    const indices = [];
    let round = 1;
    const darkness = [];
    const highlightTiles = [];
    const scoringTiles = [];
    let scoring = false;
    const scoreTimeout = 500;
    const buildings = {
      H: 1,
      L: 2,
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
      L: '#b3c6e0',
      F: '#f7e7aa',
      LM: '#c9a999',
      SM: '#cfcfc4',
      C: '#CCBEF0',
      LT: '#ffcd91'
    };
    const imagePos = {
      C: [0, 0],
      F: [50, 0],
      1: [100, 0],
      H: [150, 0],
      LT: [200, 0],
      2: [250, 0],
      LM: [300, 0],
      SM: [350, 0],
      L: [400, 0]
    }

    const sawmillIncrease = 35;
    const stoneMasonIncrease = 35;

    for (let r = 0; r < size; r++) {
      grid[r] = [];
      for (let c = 0; c < size; c++) {
        grid[r][c] = 0;
      }
    }

    function row(i) {
      return i / size | 0;
    }

    function col(i) {
      return i % size | 0;
    }

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

    for (let count = 0; count < 13; count++) {
      spreadDarkness(false);
    }

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

    const buttonCanvas = document.createElement('canvas');
    const buttonCtx = buttonCanvas.getContext('2d');

    function getCards(grow = false) {
      setTimeout(() => {
        for (let i = 0; i < 3/*built.filter(b => b == 'H').length*/; i++) {
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
            Array.from(available.querySelectorAll('button')).map(button => button.classList.remove('selected'));
            btn.classList.add('selected');
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

        if (grow) {
          growDarkness(1);
        }
      }, 100);
    }
    getCards(false);

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

      let rowValue = buildings[name];
      let colValue = buildings[name];
      for (let i = 0; i < size; i++) {
        if (isBuildingPos(r, i)) {
          rowValue += buildings[ grid[r][i][0] ];
        }
        if (isBuildingPos(i, c)) {
          colValue += buildings[ grid[i][c][0] ];
        }
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

      growDarkness(1);

      // darkness spreads twice on round 13
      if (round == 13) {
        alert(`The Darkness intensifies`);
        growDarkness(3);
      }

      if (round <= 16) {
        getCards();
      }
      else {
        // give time for player to see game is over before scoring
        setTimeout(calculateScore, 1000);
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

    function wait(ms) {
      return new Promise(resolve => {
        setTimeout(resolve, ms);
      });
    }

    async function calculateScore() {
      gameScore.style.display = final.style.display = 'flex';
      let total = 0;

      for (const name of Object.keys(buildings)) {
        total += await score(name);
        scoringTiles.length = 0;
        highlightTiles.length = 0;
      }

      finalScore.textContent = total;
    }
    window.calculateScore = calculateScore;

    async function score(tileName) {
      scoring = true;
      let totalScore = 0;
      const visitedHouses = [];

      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (isBuildingPos(r, c)) {
            const [ name, _, shape ] = grid[r][c];

            if (
              tileName != name ||
              (
                tileName == 'H' &&
                visitedHouses.find(([tileR, tileC]) => tileR == r && tileC == c)
              )
            ) continue;

            let buildingScore = 0;
            highlightTiles.length = 0;

            highlightTiles.push([r, c]);
            scoringTiles.push([r, c]);
            await wait(scoreTimeout);

            score_switch:
            switch(name) {

            // house: +2 for each adjacent house in a group of
            // at least two adjacent houses
            case 'H': {
              // find all adjacent houses
              let tiles = [[r,c]];
              const visited = [];
              const nextTiles = [];

              while (tiles.length) {
                let curTile;

                while (tiles.length) {
                  const [ curTileR, curTileC ] = tiles.pop();
                  for (const [ tileR, tileC ] of getAdjacentTiles(curTileR, curTileC)) {
                    if (visited.find(([row, col]) => row == tileR && col == tileC)) {
                      continue;
                    }

                    const tile = grid[tileR][tileC];
                    if (tile[0] == 'H' && isBuildingPos(tileR, tileC)) {
                      nextTiles.push([tileR, tileC]);
                    }
                  }

                  visited.push([ curTileR, curTileC ]);
                  highlightTiles.push([ curTileR, curTileC ]);
                  await wait(scoreTimeout);
                }

                tiles = nextTiles.slice();
                nextTiles.length = 0;
              }

              if (visited.length > 1) {
                buildingScore += visited.length * 2;
              }

              visitedHouses.push(...visited);
              visited.map(([tileR, tileC]) => {
                if (
                  isBuildingPos(tileR, tileC) &&
                  !(
                    tileR == r &&
                    tileC == c
                  )
                ) {
                  scoringTiles.unshift([ tileR, tileC ]);
                }
              });

              break;
            }

            // lake: +1 for each nearby tile
            case 'L':
              for (const [ tileR, tileC ] of getNearbyTiles(r, c)) {
                if (
                  // forests or mountains
                  [1,2].includes(grid[tileR][tileC]) ||
                  isBuildingPos(tileR, tileC)
                ) {
                  buildingScore++;
                  highlightTiles.push([tileR, tileC]);
                  await wait(scoreTimeout);
                }
              }
              break;

            // farm: +1 for each square in the shape
            case 'F':
              const [ buildingRow, buildingCol ] = getShapeBuildingPos(shape);
              for (let row = 0; row < shape.length; row++) {
                for (let col = 0; col < shape[0].length; col++) {
                  const tileR = r + row - buildingRow;
                  const tileC = c + col - buildingCol;

                  if (
                    shape[row][col] &&
                    grid[tileR][tileC] != -1
                  ) {
                    buildingScore++;

                    if (!(tileR == r && tileC == c)) {
                      highlightTiles.push([tileR, tileC]);
                      await wait(scoreTimeout);
                    }
                  }
                }
              }
              break;

            // sawmill: +1 for each nearby forest
            case 'LM':
              for (const [ tileR, tileC ] of getNearbyTiles(r, c)) {
                if (grid[tileR][tileC] == 1) {
                  buildingScore++;
                  highlightTiles.push([tileR, tileC]);
                  await wait(scoreTimeout);
                }
              }
              break;

            // stone mason: +1 for each nearby mountain
            case 'SM':
              for (const [ tileR, tileC ] of getNearbyTiles(r, c)) {
                if (grid[tileR][tileC] == 2) {
                  buildingScore++;
                  highlightTiles.push([tileR, tileC]);
                  await wait(scoreTimeout);
                }
              }
              break;

            // church: +1 for each square to nearest darkness
            // or other church
            case 'C': {
              let tiles = [[r,c]];
              const visited = [];
              const nextTiles = [];

              for (let dist = 0; dist < size; dist++) {
                let curTile;

                while (tiles.length) {
                  curTile = tiles.pop();
                  for (const [ tileR, tileC ] of getAdjacentTiles(curTile[0], curTile[1])) {
                    if (visited.find(([row, col]) => row == tileR && col == tileC)) {
                      continue;
                    }

                    const tile = grid[tileR][tileC];
                    if (tile == -1 ||
                      (
                        tile[0] == 'C' &&
                        isBuildingPos(tileR, tileC)
                      )
                    ) {
                      buildingScore = dist;
                      break score_switch;
                    }

                    nextTiles.push([tileR, tileC]);
                  }
                }

                highlightTiles.push(...nextTiles);
                await wait(scoreTimeout);

                visited.push([ curTile[0], curTile[1] ]);
                tiles = nextTiles.slice();
                nextTiles.length = 0;
              }
              break;
            }

            // light tower: +2 points if not nearby or in same
            // row or col as another light tower
            case 'LT': {
              const tiles = getNearbyTiles(r, c);

              // highlight nearby tiles
              highlightTiles.push(...tiles);
              await wait(scoreTimeout);
              highlightTiles.length = 0;

              for (const [tileR, tileC] of tiles) {
                if (isBuildingPos(tileR, tileC)) {
                  const [ name ] = grid[tileR][tileC];
                  if (name == 'LT') {
                    break score_switch;
                  }
                }
              }

              // highlight row tiles
              for (let i = 0; i < size; i++) {
                highlightTiles.push([r, i]);
              }
              await wait(scoreTimeout);
              highlightTiles.length = 0;

              // highlight col tiles
              for (let i = 0; i < size; i++) {
                highlightTiles.push([i, c]);
              }
              await wait(scoreTimeout);
              highlightTiles.length = 0;

              for (let i = 0; i < size; i++) {
                if (
                  grid[r][c] == grid[r][i] ||
                  grid[r][c] == grid[i][c]
                ) {
                  continue;
                }

                if (isBuildingPos(r, i)) {
                  const [ name ] = grid[r][i];
                  if (name == 'LT') {
                    break score_switch;
                  }
                }
                if (isBuildingPos(i, c)) {
                  const [ name ] = grid[i][c];
                  if (name == 'LT') {
                    break score_switch;
                  }
                }
              }

              buildingScore += 2;
              break;
            }
            }

            highlightTiles.length = 0;
            scoringTiles[scoringTiles.length - 1][2] = buildingScore;
            await wait(scoreTimeout);
            totalScore += buildingScore;
          }
        }
      }

      window[tileName + 'Score'].textContent = totalScore;
      return totalScore;
    }
    window.score = score;

    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    loop = GameLoop({
      render() {
        ctx.font = '18px Arial';
        ctx.strokeStyle = 'black';
        ctx.fillStyle = 'black';

        // draw each Tile
        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            ctx.strokeStyle = 'grey';
            ctx.lineWidth = 1;
            ctx.strokeRect(c * 50, r * 50, 50, 50);

            if (grid[r][c] != -1) {
              ctx.fillStyle = 'white';
              ctx.fillRect(c * 50, r * 50, 50, 50);
            }

            const highlighted = highlightTiles.find(([tileR, tileC]) => tileR == r && tileC == c);
            if (highlighted) {
              ctx.fillStyle = 'grey';
              ctx.fillRect(c * 50, r * 50, 50, 50);
            }

            const tile = grid[r][c];
            if (!tile) {
              continue;
            }
            const name = tile[0] ?? tile;
            const [ x, y ] = imagePos[name] ?? [];

            // colors
            if (
              !highlighted &&
              name &&
              colors[name] ||
              name[0] == '#'
            ) {
              ctx.fillStyle = colors[name] || name;
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
              const scoreTile = scoringTiles.find(([tileR, tileC]) => tileR == r && tileC == c)

              ctx.save();
              if (scoreTile) {
                ctx.globalAlpha = 0.25;
              }
              ctx.drawImage(tileSheet, x, y, 50, 50, c * 50, r * 50, 50, 50);
              ctx.restore();

              ctx.fillStyle = 'black';

              if (scoreTile && scoreTile[2] != undefined) {
                ctx.font = '36px Arial';
                 ctx.fillText(scoreTile[2], (c + 0.5) * 50, (r + 0.5) * 50);
              }
              else if (!scoring) {
                ctx.font = '18px Arial';
                ctx.fillText(buildings[name], c * 50 + 9, r * 50 + 11);
              }
            }
          }
        }

        // draw dark border around each Tile shape
        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            if (highlightTiles.find(([tileR, tileC]) => tileR == r && tileC == c)) {
              continue;
            }

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

          const [ buildingRow, buildingCol ] = getShapeBuildingPos(shape);

          for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[0].length; col++) {
              if (shape[row][col]) {
                ctx.strokeRect((c + col - buildingCol) * 50, (r + row - buildingRow) * 50, 50, 50);
              }
            }
          }
          ctx.restore();
          ctx.font = '18px Arial';
          ctx.fillStyle = 'black';

          const [x, y] = imagePos[name];
          ctx.drawImage(tileSheet, x, y, 50, 50, c * 50, r * 50, 50, 50)
          ctx.fillText(value, c * 50 + 9, r * 50 + 11);
        }
      }
    });
    loop.start();
  }

  // rotate an NxN matrix 90deg
  // @see https://codereview.stackexchange.com/a/186834
  function rotateShape(matrix) {
    const N = matrix.length - 1;
    const result = matrix.map((row, i) =>
      row.map((val, j) => matrix[N - j][i])
    );

    return result;
  }

  rotate.addEventListener('click', () => {
    if (placing) {
      placing[2] = rotateShape(placing[2])
    }
  });
  document.addEventListener('keypress', ({code}) => {
    if (placing && code == 'KeyR') {
      placing[2] = rotateShape(placing[2]);
    }
  });

  dailySeed.addEventListener('click', () => {
    const today = new Date();
    const seed = today.setUTCHours(0,0,0,0);
    startGame(seed);
  });

  randSeed.addEventListener('click', () => {
    startGame();
  });
})();