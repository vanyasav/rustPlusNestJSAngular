import { Injectable } from '@nestjs/common';
@Injectable()
export class MapService {
  gridDiameter = 146.25;

  getPos(x, y, mapSize) {
    const correctedMapSize = this.getCorrectedMapSize(mapSize);

    if (this.isOutsideGridSystem(x, y, correctedMapSize)) {
      if (this.isOutsideRowOrColumn(x, y, correctedMapSize)) {
        if (x < 0 && y > correctedMapSize) {
          return { location: 'NORTH_WEST' };
        } else if (x < 0 && y < 0) {
          return { location: 'SOUTH_WEST' };
        } else if (x > correctedMapSize && y > correctedMapSize) {
          return { location: 'NORTH_EAST' };
        } else {
          return { location: 'SOUTH_EAST' };
        }
      } else {
        if (x < 0 || x > correctedMapSize) {
          const grid = this.getGridPosNumberY(y, correctedMapSize);
          return x < 0
            ? { location: 'WEST_OF_GRID', grid }
            : { location: 'EAST_OF_GRID', grid };
        } else {
          const grid = this.getGridPosLettersX(x, correctedMapSize);
          return y < 0
            ? { location: 'SOUTH_OF_GRID', grid }
            : { location: 'NORTH_OF_GRID', grid };
        }
      }
    } else {
      return { grid: this.getGridPos(x, y, mapSize) };
    }
  }

  getGridPos(x, y, mapSize) {
    const correctedMapSize = this.getCorrectedMapSize(mapSize);

    /* Outside the grid system */
    if (this.isOutsideGridSystem(x, y, correctedMapSize)) {
      return null;
    }

    const gridPosLetters = this.getGridPosLettersX(x, correctedMapSize);
    const gridPosNumber = this.getGridPosNumberY(y, correctedMapSize);

    return gridPosLetters + gridPosNumber;
  }

  getGridPosLettersX(x, mapSize) {
    let num = 1;
    for (
      let startGrid = 0;
      startGrid < mapSize;
      startGrid += this.gridDiameter
    ) {
      if (x >= startGrid && x <= startGrid + this.gridDiameter) {
        /* We're at the correct grid! */
        return this.numberToLetters(num);
      }
      num++;
    }
  }

  getGridPosNumberY(y, mapSize) {
    let counter = 1;
    const numberOfGrids = Math.floor(mapSize / this.gridDiameter);
    for (
      let startGrid = 0;
      startGrid < mapSize;
      startGrid += this.gridDiameter
    ) {
      if (y >= startGrid && y <= startGrid + this.gridDiameter) {
        /* We're at the correct grid! */
        return numberOfGrids - counter;
      }
      counter++;
    }
  }

  numberToLetters(num) {
    const mod = num % 26;
    let pow = (num / 26) | 0;
    const out = mod ? String.fromCharCode(64 + mod) : (pow--, 'Z');
    return pow ? this.numberToLetters(pow) + out : out;
  }

  getCorrectedMapSize(mapSize) {
    const remainder = mapSize % this.gridDiameter;
    const offset = this.gridDiameter - remainder;
    return remainder < 120 ? mapSize - remainder : mapSize + offset;
  }

  getAngleBetweenPoints(x1, y1, x2, y2) {
    let angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;

    if (angle < 0) {
      angle = 360 + angle;
    }

    return Math.floor((Math.abs(angle - 360) + 90) % 360);
  }

  getDistance(x1, y1, x2, y2) {
    /* Pythagoras is the man! */
    const a = x1 - x2;
    const b = y1 - y2;
    return Math.sqrt(a * a + b * b);
  }

  isOutsideGridSystem(x, y, mapSize, offset = 0) {
    return (
      x < -offset || x > mapSize + offset || y < -offset || y > mapSize + offset
    );
  }

  isOutsideRowOrColumn(x, y, mapSize) {
    return (
      (x < 0 && y > mapSize) ||
      (x < 0 && y < 0) ||
      (x > mapSize && y > mapSize) ||
      (x > mapSize && y < 0)
    );
  }
}
