import { LitElement, html, css } from 'lit-element';

class MemoBoardCard extends LitElement {
  config: any;
  hass: any;
  shadowRoot: any;
  ctx: any;
  canvas: any;
  painting = false;
  lastPoint: any = {x: 0, y: 0};
  activeColor = 'black';
  lWidth = 4;
  firstDot: any;
  clear = false;
  historyData: any[] = [];
  buttons: any;

  static get properties() {
    return {
      hass: {},
      config: {},
      active: {}
    };
  }
  
  constructor() {
    super();
  }
  
  render() {
    // var entity = this.config.entity;

    return html`
      <div class="container" id="memo-container">
        <canvas id="memo-board"></canvas>
        <div class="color-group">
          <ul>
              <li id="white" class="color-item" style="background-color: white;" @click="${(e) => this.setColor(e.target)}"></li>
              <li id="black" class="color-item active" style="background-color: black;" @click="${(e) => this.setColor(e.target)}"></li>
              <li id="red" class="color-item" style="background-color: #FF3333;" @click="${(e) => this.setColor(e.target)}"></li>
              <li id="blue" class="color-item" style="background-color: #0066FF;" @click="${(e) => this.setColor(e.target)}"></li>
              <li id="yellow" class="color-item" style="background-color: #FFFF33;" @click="${(e) => this.setColor(e.target)}"></li>
              <li id="green" class="color-item" style="background-color: #33CC66;" @click="${(e) => this.setColor(e.target)}"></li>
              <li id="gray" class="color-item" style="background-color: gray;" @click="${(e) => this.setColor(e.target)}"></li>
          </ul>
        </div>
        <div id="range-wrap"><input type="range" id="range" min="1" max="30" value="${this.lWidth}" title="" @change=${(e) => this.setLineWidth(e.target.value)}></div>
        <div class="tools">
            <button @click="${() => this.brush()}" id="brush" class="active" title="Brush"><ha-icon .icon=${"mdi:lead-pencil"}></ha-icon></button>
            <button @click="${() => this.eraser()}" id="eraser" title="Eraser"><ha-icon .icon=${"mdi:eraser"}></ha-icon></button>
            <button @click="${() => this.resetCanvas()}" id="clear" title="Clear"><ha-icon .icon=${"mdi:close-outline"}></ha-icon></button>
            <button @click="${() => this.undo()}" id="undo" title="Undo"><ha-icon .icon=${"mdi:undo"}></ha-icon></button>
            <button @click="${() => this.save()}" id="save" title="Save"><ha-icon .icon=${"mdi:content-save-outline"}></ha-icon></button>
        </div>
      </div>

    `;
  }

  firstUpdated() {
    console.log('firstUpdated');
    this.canvas = this.shadowRoot.getElementById("memo-board")
    console.log(this.canvas);
    if (this.canvas) {
      console.log('CANVAS FOUND!!');
      this.ctx = this.canvas.getContext("2d");
      this.ctx.fillStyle = this.activeColor;
      this.ctx.strokeStyle = this.activeColor;
      this.canvasSetSize();

      this.buttons = {
        brush: this.shadowRoot.getElementById("brush"),
        eraser: this.shadowRoot.getElementById("eraser"),
        clear: this.shadowRoot.getElementById("clear"),
        undo: this.shadowRoot.getElementById("undo"),
        save: this.shadowRoot.getElementById("save")
      }


      const self = this;
      if (document.body.ontouchstart !== undefined) {
        console.log("TOUCH");
        //Using the touch event
        this.canvas.ontouchstart = function (e) {
            //Start touching
            self.mouseDown(e);
        }
        this.canvas.ontouchmove = function (e) {
            //Start sliding
            self.mouseMove(e);
        }
        this.canvas.ontouchend = function () {
            //Slide end
            self.mouseUp();
        }
      } else {
        console.log("MOUSE");
        //Mouse down events
        this.canvas.onmousedown = function (e) {
          self.mouseDown(e);
        };
        //Mouse movement events
        this.canvas.onmousemove = function (e) {
          self.mouseMove(e);
        };
        //Mouse release event
        this.canvas.onmouseup = function () {
          self.mouseUp();
        }
      }

      window.onresize = function () {
          self.canvasSetSize();
      }
    }
  }

  canvasSetSize() {
      console.log("canvasSetSize");
      let container = this.shadowRoot.getElementById("memo-container");

      this.canvas.width = container.offsetWidth - 40;
      this.canvas.height = container.offsetHeight - 40;
  }

  getMousePosition(e) {
    var bounds = this.canvas.getBoundingClientRect();
    let x = e.pageX - bounds.left - scrollX;
    let y = e.pageY - bounds.top - scrollY;

    x /= bounds.width; 
    y /= bounds.height;

    x *= this.canvas.width;
    y *= this.canvas.height;

    return {"x": x, "y": y};
  }

  mouseDown(e) {
    console.log('mouseDown');
    this.firstDot = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    this.saveData(this.firstDot);
    this.painting = true;
    let position = this.getMousePosition(e);
    this.lastPoint = position;
    this.ctx.save();
    this.drawCircle(this.lastPoint.x, this.lastPoint.y, 0);
  }

  mouseMove(e) {
    console.log('mouseMove');
    console.log(this.lastPoint);
    if (this.painting) {
      let position = this.getMousePosition(e);
      let newPoint = position;
      this.drawLine(this.lastPoint.x, this.lastPoint.y, newPoint.x, newPoint.y);
      this.lastPoint = newPoint;
    }
  }

  mouseUp() {
    console.log('mouseUp');
    this.painting = false;
  }

  mouseLeave() {
    console.log('mouseLeave');
    this.painting = false;
  }

  //Draw point function
  drawCircle(x, y, radius) {
    console.log("drawCircle");
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fill();
    if (this.clear) {
      this.ctx.clip();
      this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
      this.ctx.restore();
    }
}

  //Scribing function
  drawLine(x1, y1, x2, y2) {
    console.log('drawLine');
    this.ctx.lineWidth = this.lWidth;
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";

    console.log(this.lWidth);

    if (this.clear) {
      this.ctx.save();
      this.ctx.globalCompositeOperation = "destination-out";
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.stroke();
      this.ctx.closePath();
      this.ctx.clip();
      this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
      this.ctx.restore();
    }else{
      console.log('x1', x1);
      console.log('y1', y1);
      console.log('x2', x2);
      console.log('y2', y2);
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.stroke();
      this.ctx.closePath();
    }
  }

  eraser() {
      console.log('eraser');
      this.clear = true;
      this.buttons.eraser.classList.add("active");
      this.buttons.brush.classList.remove("active");
  }

  brush() {
    console.log('brush');
    this.clear = false;
    this.buttons.brush.classList.add("active");
    this.buttons.eraser.classList.remove("active");
  }

  undo() {
    console.log('undo');
    if(this.historyData.length > 0) {
      this.ctx.putImageData(this.historyData[this.historyData.length - 1], 0, 0);
      this.historyData.pop()
    }
  }

  setColor(e) {
    console.log('setColor');
    this.shadowRoot.querySelectorAll(".color-item").forEach(function(color) {
      color.classList.remove("active")
    })  
    e.classList.add("active");
    this.activeColor = e.style.backgroundColor;
    this.ctx.fillStyle = this.activeColor;
    this.ctx.strokeStyle = this.activeColor;
  }

  setLineWidth(width) {
    console.log(width);
    this.lWidth = width;
  }

  resetCanvas() {
      console.log('resetCanvas');
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      // this.setCanvasBg('white');
  };

  save() {
    console.log('Save');

    let imgData =  this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);


    console.log('imgData', imgData);
    console.log('imgData.data', imgData.data);

    let imgUrl = this.canvas.toDataURL("image/png");
    console.log(imgUrl);
    let saveA = document.createElement("a");
    document.body.appendChild(saveA);
    saveA.href = imgUrl;
    saveA.download = "zspic" + (new Date).getTime();
    saveA.target = "_blank";
    saveA.click();
  }

  saveData (data) {
      (this.historyData.length === 10) && (this.historyData.shift());
      this.historyData.push(data);
  }
  
  updated() { }

  setConfig(config) {
    // if (!config.entity) {
    //   throw new Error("You need to define an entity");
    // }
    this.config = config;
  }

  getCardSize() {
    return 1;
  }
  
  static get styles() {
    return css`
    :host {
      width: 100%;
      display: block;
      height: calc(100% - 20px);
      box-sizing: border-box;
    }
    .container {
        width:100%;
        height:100%;
        padding:20px;
        box-sizing: border-box;
    }

    #memo-board {
      background: white;
      display: block;
      cursor: crosshair;
      width:100%;
      height:100%;
    }

    .tools{position: fixed;left:0;bottom: 50px; width:100%;display: flex;justify-content: center;text-align: center}
    .tools button{border-radius: 50%;width: 50px;height: 50px; background-color: rgba(255,255,255,0.7);border: 1px solid #eee;outline: none;cursor: pointer;box-sizing: border-box;margin: 0 10px;text-align: center;color:#ccc;line-height: 50px;box-shadow:0 0 8px rgba(0,0,0,0.1); transition: 0.3s;}
    .tools button.active,.tools button:active{box-shadow: 0 0 15px #00CCFF; color:#00CCFF;}
    .tools button i{font-size: 24px;}
    .color-group{position:fixed;width: 30px;left: 30px;top:50%;transform: translate(0,-150px)}
    .color-group ul{list-style: none;}
    .color-group ul li{width: 30px;height: 30px;margin: 10px 0;border-radius: 50%;box-sizing: border-box;border:3px solid white;box-shadow: 0 0 8px rgba(0,0,0,0.2);cursor: pointer;transition: 0.3s;}
    .color-group ul li.active{box-shadow:0 0 15px #00CCFF;}
    #range-wrap{position: fixed;top: 50%;right:30px;width: 30px;height: 150px;margin-top: -75px;}
    #range-wrap input{transform: rotate(-90deg);width: 150px;height: 20px;margin: 0;transform-origin: 75px 75px;    border-radius: 15px;-webkit-appearance: none;outline: none;position: relative;}
    #range-wrap input::after{display: block;content:"";width:0;height: 0;border:5px solid transparent;
        border-right:150px solid #00CCFF;border-left-width:0;position: absolute;left: 0;top: 5px;border-radius:15px; z-index: 0; }
    #range-wrap input[type=range]::-webkit-slider-thumb,#range-wrap input[type=range]::-moz-range-thumb{-webkit-appearance: none;}
    #range-wrap input[type=range]::-webkit-slider-runnable-track,#range-wrap input[type=range]::-moz-range-track {height: 10px;border-radius: 10px;box-shadow: none;}
    #range-wrap input[type=range]::-webkit-slider-thumb{-webkit-appearance: none;height: 20px;width: 20px;margin-top: -1px;background: #ffffff;border-radius: 50%;box-shadow: 0 0 8px #00CCFF;position: relative;z-index: 999;}

    @media screen and (max-width: 768px) {
        .tools{bottom:auto;top:20px;}
        .tools button{width: 35px;height: 35px;line-height: 35px;margin-bottom: 15px;box-shadow:0 0 5px rgba(0,0,0,0.1);}
        .tools button.active,.tools button:active{box-shadow: 0 0 5px #00CCFF;}
        .tools button i{font-size: 18px;}
        .tools #swatches{display: none}
        .color-group{left: 0;top:auto;bottom: 20px;display: flex;width:100%;justify-content: center;text-align: center;transform: translate(0,0)}
        .color-group ul li{display: inline-block;margin:0 5px;}
        .color-group ul li.active{box-shadow:0 0 10px #00CCFF;}
        #range-wrap{right:auto;left: 20px;}
    }
    `;
  }
}

customElements.define('memo-board-card', MemoBoardCard);