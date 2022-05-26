/*
config : {
  id : '',
  name : 'button',
  pos : { x : 0, y : 0, w : 0, h : 0 },
  keys : []
}
*/

export default class Widget {
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.pos = config.pos;
  }
}