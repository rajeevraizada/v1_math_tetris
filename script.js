let floor, left_wall, right_wall, number_blocks;
let block_size;
let box_blocks_width = 4;
let box_blocks_height = 6;
let max_blocks = box_blocks_width * box_blocks_height;
let wall_thickness = 6;
let gap = 5;
let scale_val = 0.7;
let max_x, max_y
let sprite_birth_count = 0;
let row_rec, col_rec;

function draw() {
  clear();
  block_count = number_blocks.length
  if (block_count > 0) {
    row_rec = new Array(max_blocks).fill(-1);
    col_rec = new Array(max_blocks).fill(-1);
    for (i = block_count - 1; i >= 0; i--) {
      this_block = number_blocks[i];
      if (this_block.mouse.pressing()) {
        this_block.remove();
      }
      this_col = x_to_col(this_block.x);
      this_row = y_to_row(this_block.y);
      this_block.col = this_col;
      this_block.row = this_row;
      row_rec[i] = this_row;
      col_rec[i] = this_col;
      this_block.text = this_block.value;
    }
  }
  check_neighbor_matches();
}

function check_neighbor_matches() {
  textSize(20);
  for (row = 0; row < box_blocks_height; row++) {
    for (col = 0; col < box_blocks_width; col++) {
      // First, check if a block is here
      matching_block_ind = look_for_block_at(row,col);
      // If we have a block in this row,col slot,
      // check for blocks above and to the right
      if (matching_block_ind != null) {
        this_block = number_blocks[matching_block_ind];
        if (this_block != null) {
          this_block_val = this_block.value;
          // Now that all those checks passed ok,
          // we can check for above and right blocks
          above_block_ind = look_for_block_at(row+1,col);
          if (above_block_ind != null) {
            above_block = number_blocks[above_block_ind];
            if (above_block != null) {
              above_block_val = above_block.value; 
              if (above_block_val == this_block_val)
                text('Match above found: '+this_block_val,20,20);
            }}
          block_to_right_ind = look_for_block_at(row,col+1);
          if (block_to_right_ind != null) {
            block_to_right = number_blocks[block_to_right_ind];
            if (block_to_right != null) {
              block_to_right_val = block_to_right.value; 
              if (block_to_right_val == this_block_val) {
                text('Match to right found: '+this_block_val,20,50);
              }
            }
          }   
        }
      }
    }
  }
}

function fill_grid() {
  counter = 0;
  for (row = 0; row < box_blocks_height; row++) {
    for (col = 0; col < box_blocks_width; col++) {
      this_block = new number_blocks.Sprite();
      this_block.color.setAlpha(10);
      this_block.x = col_to_x(col);
      this_block.y = col_to_y(row);
      this_block.textSize = 20;
      this_block.value = round(random(max_blocks)); //counter;
      counter++;
    }
  }
}

function setup() {
  new Canvas(displayWidth, displayHeight);
  world.gravity.y = 10;

  max_x = min(displayWidth, 600);
  max_y = min(displayHeight, 900);
  block_size =
    round(min(scale_val * max_x / box_blocks_height,
      scale_val * max_y / box_blocks_width));

  number_blocks = new Group();
  number_blocks.collider = 'dynamic';
  number_blocks.color = 'blue';
  number_blocks.width = block_size;
  number_blocks.height = block_size;

  make_box_walls();
  fill_grid();
}
  
function col_to_x(this_col) {
  this_x = left_wall.x + gap * (this_col + 1) +
    block_size * (this_col + 1 / 2) + wall_thickness / 2;
  return this_x;
}

function col_to_y(this_row) {
  this_y = floor.y - block_size * (this_row + 1 / 2) - wall_thickness / 2;
  return this_y;
}

function x_to_col(this_x) {
  this_col = round((this_x - left_wall.x) / block_size - 1 / 2);
  return this_col;
}

function y_to_row(this_y) {
  this_row = round((floor.y - this_y) / block_size - 1 / 2);
  return this_row;
}

function make_box_walls() {
  left_wall = new Sprite();
  left_wall.collider = 'static';
  left_wall.width = wall_thickness;
  left_wall.height = box_blocks_height * block_size;
  left_wall.color = 'black';
  left_wall.x = scale_val * max_x / 2 - block_size * box_blocks_width / 2
    - gap * box_blocks_width / 2 - wall_thickness;
  left_wall.y = scale_val * max_y / 2;

  right_wall = new Sprite();
  right_wall.collider = 'static';
  right_wall.width = wall_thickness;
  right_wall.height = box_blocks_height * block_size;
  right_wall.color = 'black';
  right_wall.x = scale_val * max_x / 2 + block_size * box_blocks_width / 2
    + gap * (box_blocks_width - 1) / 2 + wall_thickness;
  right_wall.height = box_blocks_height * block_size;
  right_wall.y = scale_val * max_y / 2;

  floor = new Sprite();
  floor.collider = 'static';
  floor.width = right_wall.x - left_wall.x + wall_thickness;
  floor.height = wall_thickness;
  floor.color = 'black'
  floor.x = scale_val * max_x / 2 - gap/4;
  floor.y = scale_val * max_y / 2 + block_size * box_blocks_height / 2;
}

function look_for_block_at(row,col) {
  row_matches = row_rec.map((x, index) => (x == row) ? index : -1);
  row_matches_filtered = row_matches.filter(x => (x > -1));
  col_matches = col_rec.map((x, index) => (x == col) ? index : -1);
  col_matches_filtered = col_matches.filter(x => (x > -1));

  if (row_matches_filtered != null && col_matches_filtered != null ) {
    row_col_match =
      _.intersection(row_matches_filtered, col_matches_filtered);
    
    if (row_col_match != null ) {
      matching_block_ind = row_col_match;
    }
  }
  return matching_block_ind;
}
