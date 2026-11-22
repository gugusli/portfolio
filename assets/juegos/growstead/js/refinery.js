class Refinery {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.sizeX = CFG.refinery.sizeX;
    this.sizeY = CFG.refinery.sizeY;
    this.input = 0;
    this.maxInput = CFG.refinery.maxInput;
    this.output = 0;
    this.maxOutput = CFG.refinery.maxOutput;
    this.processingTimer = 0;
    this.processingSpeed = CFG.refinery.processingSpeed;
    this.inputPad = { x: x - 60, y: y, radius: CFG.refinery.padRadius };
    this.outputPad = { x: x + 60, y: y, radius: CFG.refinery.padRadius };
    this.processing = false;
  }

  update() {
    this.processing = false;
    if (this.input > 0 && this.output < this.maxOutput) {
      this.processingTimer++;
      this.processing = true;
      if (this.processingTimer >= this.processingSpeed) {
        this.processingTimer = 0;
        this.input--;
        this.output++;
      }
    } else if (this.processingTimer > 0) {
      this.processingTimer = 0;
    }
  }
}
