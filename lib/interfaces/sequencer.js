'use strict';

let svg = require('../util/svg');
let dom = require('../util/dom');
let Interface = require('../core/interface');
let ButtonTemplate = require('../components/buttontemplate');
let MatrixModel = require('../models/matrix');
let CounterModel = require('../models/counter');
//let Time = require('../core/time');
let touch = require('../util/touch');



class MatrixCell extends ButtonTemplate {

  constructor() {

    let options = ['value',];

    let defaults = {
      'size': [80,80],
      'target': false,
      'mode': 'toggle',
      'value': 0
    };

    super(arguments,options,defaults);

    this.index = this.settings.index;
    this.row = this.settings.row;
    this.column = this.settings.column;

    this.interacting = false;
    this.paintbrush = false;

    this.init();
    this.render();

  }

  buildFrame() {
    this.element = svg.create('svg');
    this.element.setAttribute('width',this.width);
    this.element.setAttribute('height',this.height);
    this.element.style.top = '0px';
    this.element.style.left = '0px';
    this.element.style.position = 'absolute';
    this.parent.appendChild(this.element);
  }

  buildInterface() {

    this.pad = svg.create('rect');
    this.element.appendChild(this.pad);

    this.sizeInterface();


    /* events */

    if (!touch.exists) {

      this.click = () => {
        this.matrix.interacting = true;
        this.matrix.paintbrush = !this.state;
        this.down(this.matrix.paintbrush);
      };
      this.pad.addEventListener('mouseover', () => {
        if (this.matrix.interacting) {
          this.down(this.matrix.paintbrush);
        }
      });


      this.move = () => {
      };
      this.pad.addEventListener('mousemove', (e) => {
        if (this.matrix.interacting) {
          if (!this.offset) {
            this.offset = dom.findPosition(this.element);
          }
          this.mouse = dom.locateMouse(e,this.offset);
          this.bend();
        }
      });


      this.release = () => {
        this.matrix.interacting = false;
      };
      this.pad.addEventListener('mouseup', () => {
        if (this.matrix.interacting) {
          this.up();
        }
      });
      this.pad.addEventListener('mouseout', () => {
        if (this.matrix.interacting) {
          this.up();
        }
      });
    }

  }

  sizeInterface() {

    this.pad.setAttribute('x',1);
    this.pad.setAttribute('y',1);
    if (this.width > 2) {
      this.pad.setAttribute('width', this.width - 2);
    } else {
      this.pad.setAttribute('width', this.width);
    }
    if (this.height > 2) {
      this.pad.setAttribute('height', this.height - 2);
    } else {
      this.pad.setAttribute('height', this.height);
    }
    //this.pad.setAttribute('height', this.height - 2);
    this.pad.setAttribute('fill', '#e7e7e7');

  }

  render() {
    if (!this.state) {
      this.pad.setAttribute('fill', '#e7e7e7');
    } else {
      this.pad.setAttribute('fill', '#d18');
    }
  }

}

/**
* Sequencer
*
* @description Grid of buttons with built-in step sequencer.
*
* @demo <div mt="sequencer" style="width:400px;height:200px;"></div>
*
* @example
* var sequencer = mt.sequencer('#target')
*
* @example
* var sequencer = mt.sequencer('#target',{
*  'size': [400,200],
*  'mode': 'toggle',
*  'rows': 5,
*  'columns': 10
*})
*
* @output
* change
* Fires any time the interface's matrix changes. <br>
* The event data is an object containing <i>row</i> (number), <i>column</i> (number), and <i>state</i> (boolean) properties.
*
* @outputexample
* sequencer.on('change',function(v) {
*   console.log(v);
* })
*
* @output
* step
* Fires any time the sequencer steps to the next column, in sequece mode. <br>
* The event data is an <i>array<i> containing all values in the column, top first.
*
* @outputexample
* sequencer.on('step',function(v) {
*   console.log(v);
* })
*
* @tutorial
* Tutorial
* ygGMxq
*
*
*/

export default class Sequencer extends Interface {

  constructor() {

    let options = ['value'];

    let defaults = {
      'size': [400,200],
      'mode': 'toggle',
      'rows': 5,
      'columns': 10
    };

    super(arguments,options,defaults);

    this.active = -1;

    this.mode = this.settings.mode;

    /**
    A Matrix model containing methods for manipulating the sequencer's array of values.
    @type {Matrix}
    */
    this.matrix = new MatrixModel(this.settings.rows,this.settings.columns);
    this.matrix.ui = this;

    /**
    A Counter model which the sequencer steps through. For example, you could use this model to step through the sequencer in reverse, randomly, or in a drunk walk.
    @type {Counter}
    */
    this.stepper = new CounterModel(0,this.columns);

    this.init();

  }

  buildFrame() {
    this.element = document.createElement('div');
    this.element.style.position = 'relative';
    this.element.style.display = 'block';
    this.element.style.width = '100%';
    this.element.style.height = '100%';
    this.parent.appendChild(this.element);
  }

  buildInterface() {

    this.cells = [];
    for (let i=0;i<this.matrix.length;i++) {

      let location = this.matrix.locate(i);
                     // returns {row,col}

      let container = document.createElement('span');
      container.style.position = 'absolute';


      let cell = new MatrixCell(container, {
          component: true,
          index: i,
          row: location.row,
          column: location.column,
          mode: this.mode
        }, this.keyChange.bind(this,i));

      cell.matrix = this;
      if (touch.exists) {
        cell.pad.index = i;
        cell.preClick = cell.preMove = cell.preRelease = () => {};
        cell.click = cell.move = cell.release = () => {};
        cell.preTouch = cell.preTouchMove = cell.preTouchRelease = () => {};
        cell.touch = cell.touchMove = cell.touchRelease = () => {};
      }

      this.cells.push(cell);
      this.element.appendChild(container);

    }
    if (touch.exists) {
      this.addTouchListeners();
    }
    this.sizeInterface();
  }

  sizeInterface() {

    let cellWidth = this.width / this.columns;
    let cellHeight = this.height / this.rows;

    for (let i=0; i<this.cells.length; i++) {
      let container = this.cells[i].parent;
      container.style.left = this.cells[i].column * cellWidth + 'px';
      container.style.top = this.cells[i].row * cellHeight + 'px';
      this.cells[i].resize(cellWidth,cellHeight);
    }


  }

  update() {
    this.matrix.iterate((r,c,i) => {
      if (this.matrix.pattern[r][c] > 0) {
        this.cells[i].state = true;
      } else {
        this.cells[i].state = false;
      }
    });
  }


  keyChange(note,value) {
    // emit data for any key turning on/off
    // i is the note index
    // v is whether it is on or off
    let cell = this.matrix.locate(note);
    this.matrix.set.cell(cell.column,cell.row,value);
    this.emit('change',note,value);
    // rename to (note,on)
  }

  render() {
    if (this.stepper.value >= 0) {
      this.matrix.iterate((r,c,i) => {
        if (c===this.stepper.value) {
          this.cells[i].pad.setAttribute('stroke','#ccc');
          this.cells[i].pad.setAttribute('stroke-width','5');
          this.cells[i].pad.setAttribute('stroke-opacity','0.8');
        } else {
          this.cells[i].pad.setAttribute('stroke','none');
        }
      });
    }
  }

  /**
  Start sequencing
  */
  start() {
    if (!this.invertal) {
      this.next();
      this.interval = setInterval(this.next.bind(this),200);
    }
  }

  /**
  Stop sequencing
  */
  stop() {
    clearInterval(this.interval);
    this.interval = false;
  }

  /**
  Manually jump to the next column and trigger the 'change' event. The "next" column is determined by your mode of sequencing.
  */
  next() {
    this.stepper.next();
    this.emit('change',this.matrix.column(this.stepper.value));
    this.render();
  }

  addTouchListeners() {

    this.preClick = this.preMove = this.preRelease = () => {};
    this.click = this.move = this.release = () => {};
    this.preTouch = this.preTouchMove = this.preTouchRelease = () => {};
    this.touch = this.touchMove = this.touchRelease = () => {};

    this.currentElement = false;

    this.element.addEventListener('touchstart', (e) => {
      let element = document.elementFromPoint(e.targetTouches[0].clientX,e.targetTouches[0].clientY);
      let cell = this.cells[element.index];
      this.paintbrush = !cell.state;
      cell.down(this.paintbrush);
      this.currentElement = element.index;
      e.preventDefault();
      e.stopPropagation();
    });

    this.element.addEventListener('touchmove', (e) => {
      let element = document.elementFromPoint(e.targetTouches[0].clientX,e.targetTouches[0].clientY);
      let cell = this.cells[element.index];
      if (element.index!==this.currentElement) {
        if (this.currentElement >= 0) {
          let pastCell = this.cells[this.currentElement];
          pastCell.up();
        }
        cell.down(this.paintbrush);
      } else {
        cell.bend();
      }
      this.currentElement = element.index;
      e.preventDefault();
      e.stopPropagation();
    });

    this.element.addEventListener('touchend', (e) => {
      // no touches to calculate because none remaining
      let cell = this.cells[this.currentElement];
      cell.up();
      this.interacting = false;
      this.currentElement = false;
      e.preventDefault();
      e.stopPropagation();
    });

  }

  /**
  Number of rows in the sequencer
  @type {number}
  */
  get rows() {
    return this.matrix.rows;
  }

  set rows(v) {
    this.matrix.rows = v;
    this.empty();
    this.buildInterface();
    this.update();
  }

  /**
  Number of columns in the sequencer
  @type {number}
  */
  get columns() {
    return this.matrix.columns;
  }

  set columns(v) {
    this.matrix.columns = v;
    this.stepper.max = v;
    this.empty();
    this.buildInterface();
    this.update();
  }

}