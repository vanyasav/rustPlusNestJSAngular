export interface IOilRig {
  large: {
    monument: {
      x: number;
      y: number;
    };
    crate: {
      x: number;
      y: number;
      id: number;
      exists: boolean;
    };
  };
  small: {
    monument: {
      x: number;
      y: number;
    };
    crate: {
      x: number;
      y: number;
      id: number;
      exists: boolean;
    };
  };
}
