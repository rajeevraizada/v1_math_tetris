// Find out if on touch screen device.
// Mouse click behaviour will be different
let details = navigator.userAgent;
let regexp = /android|iphone|kindle|ipad/i;
let isMobileDevice = regexp.test(details);  

let num_values = 6;
let num_display_types = 2;
let floor, left_wall, right_wall, number_blocks, t0;
let new_cell = 0;
let select_time = 0;
let block_size;
let box_blocks_width = 4;
let box_blocks_height = 6;
let max_blocks = box_blocks_width * box_blocks_height;
let wall_thickness = 6;
let gap = 5;
let scale_val = 0.75;
let max_x, max_y;
let row_rec, col_rec, block_count;
let total_motion = 0;
let selected_blocks = [];
let b1x0, b1y0, b2x0, b2y0; // The two blocks getting swapped
let swap_started = 0;
let swap_dur = 500;
let selected_vals = [];
let touch_has_ended = 1;
let matching_blocks = [];
let match_highlight_started = 0;
let highlight_start_time = 0;
let match_highlight_dur = 500;
let matches_removed = 0;
let bang_sound_playing = 0;
let mouse_has_been_pressed = 0;
let sup1 = String.fromCharCode(0x00B9);
let sup2 = String.fromCharCode(0x00B2);
let sup_slash = String.fromCharCode(0x141F);

function draw() {
  clear();
  total_motion = calclulate_total_motion();
  block_count = number_blocks.length
  if (block_count > 0) {
    if (total_motion < 1) {
      check_for_block_selection();
      color_blocks();
    }  
    // If two are selected and adjacent, swap their positions
    if (selected_blocks.length == 2) { 
      b1  = number_blocks[selected_blocks[0]];
      b2 = number_blocks[selected_blocks[1]];  
      if (swap_started==0) {
        start_swap();
        swap_start_time = millis();
        swap_started = 1;
      }
      swap_proportion = (millis()-swap_start_time)/swap_dur;
      if (swap_proportion <= 1) {
        b1.x = b1x0 + (b2x0-b1x0)*swap_proportion;
        b1.y = b1y0 + (b2y0-b1y0)*swap_proportion;
        b2.x = b2x0 + (b1x0-b2x0)*swap_proportion;
        b2.y = b2y0 + (b1y0-b2y0)*swap_proportion;          
      } else {
        // Unselect the selected blocks, to reset
        selected_blocks = []; 
        selected_vals = [];
        swap_started = 0;
        // Set blocks back to non-overlapping and dynamic
        b1.collide(b2);
        b2.collide(b1);
        number_blocks.collider = 'dynamic';
      } // End of if (swap_proportion <= 1)
    } // End of if (selected_blocks.length == 2)
    // If no motion is happeng, update records
    // and check for matching neighbours
    if ( (total_motion < 1) && (swap_started==0)) {
      update_row_col_recs();
      matching_blocks = check_neighbor_matches();
      text('Matching vals  ' + matching_blocks.value,20,20);          
    } 
    if ( (total_motion < 1) && (matching_blocks != null) &&
         (matching_blocks.length > 1) &&
         (match_highlight_started==0) ) {
      // text('Highlighting matches ' + matching_blocks,20,20)
      highlight_start_time = millis();
      matches_removed = 0;
      for (i=0; i<matching_blocks.length; i++) {
        this_block = number_blocks[matching_blocks[i]];
        this_block.color = 'green';
        this_block.color.setAlpha(30);   
      }
      match_highlight_started = 1;
    }
    // Show bang signs near end of match duration
    if (millis()-highlight_start_time > 0.8*match_highlight_dur) {
      for (i=0; i<matching_blocks.length; i++) {
        this_block = number_blocks[matching_blocks[i]];
        this_block.text = '💥';  
        this_block.textSize = 80;
        text('Matched value ' + this_block.value,5*this_block.value,40);
      }
    }
    // Stop the match highlighting after its duration
    // and remove the matching blocks
    if ( (millis()-highlight_start_time > match_highlight_dur) &&
         matches_removed==0 && matching_blocks.length>1 ) { 
      // Simple approach: use emoji tag as marker of blocks to remove
      for (i=number_blocks.length-1; i>=0; i--) {
        this_block = number_blocks[i];
        if (this_block.text == '💥') {
          this_block.remove();
        }
      }
      bang_sound.play();
      matches_removed = 1; 
      match_highlight_started = 0;
      matching_blocks = [];
      selected_blocks = [];
      selected_vals = [];
      // highlight_start_time = 10**7;
    }
  } // End of if (block_count > 0)
}

function make_non_matching_grid_vals() {
  // Set up grid of zeros
  grid0 = new Array(box_blocks_height).fill(0);
  for (row = 0; row < box_blocks_height; row++) {
    grid0[row] = new Array(box_blocks_width).fill(0);
  }
  // Next, loop through the grid and pick and repick
  // random values for each cell until non-matching 
  // with cells below and to the left.
  for (row = 0; row < box_blocks_height; row++) {
    for (col = 0; col < box_blocks_width; col++) { 
      text(row + ',' + col,20,20)
      this_cell_matches = 1;
      // If in lowest row, don't check below
      // If iin left col, don't check to left
      while (this_cell_matches>0) {
        new_cell = ceil(random(num_values));
        if ( row==0 && col==0 ) {
          this_cell_matches = 0;
        }        
        if ( row==0 && col>0 ) {
          this_cell_matches = (new_cell == grid0[row][col-1]);
        }
        if ( row>0 && col==0 ) {
          this_cell_matches = (new_cell == grid0[row-1][col]);
        } 
        if ( row>0 && col>0 ) {
          this_cell_matches = (new_cell == grid0[row-1][col]) +
                              (new_cell == grid0[row][col-1]); 
        }
      } // End of while loop. We now have a non-matching cell
      grid0[row][col] = new_cell;
    } // End of loop through cols
  } // End of loop through rows
  return grid0;
}

function setup() {
  t0 = millis();
  new Canvas(displayWidth, displayHeight);
  world.gravity.y = 10;
  max_x = min(displayWidth, 600);
  max_y = min(displayHeight, 900);
  block_size =
    round(min(scale_val * max_x / box_blocks_height,
      scale_val * max_y / box_blocks_width));

  number_blocks = new Group();
  number_blocks.collider = 'dynamic';
  number_blocks.color = 'white';
  number_blocks.width = block_size;
  number_blocks.height = block_size;
  
  make_box_walls();
  // Set up an initial grid without any matches
  grid0 = make_non_matching_grid_vals();
  fill_grid(grid0);
  update_row_col_recs();
  matching_blocks = check_neighbor_matches();
}

function fill_grid(grid0) {
  counter = 0;
  for (row = 0; row < box_blocks_height; row++) {
    for (col = 0; col < box_blocks_width; col++) {
      this_block = new number_blocks.Sprite();
      this_block.x = col_to_x(col);
      this_block.y = row_to_y(row);
      this_block.textSize = 20;
      this_block.value = grid0[row][col]; 
      this_block.text = this_block.value;
//        + sup1 + sup_slash + sup2;
      counter++;
    }
  }
}

function preload() {  
  soundFormats('mp3');
  click_sound = loadSound('Sounds/click.mp3');
  click_sound.setVolume(0.4);
  bang_sound = loadSound('Sounds/crash.mp3');
  falling_sound = loadSound('Sounds/falling.mp3');
  sliding_sound = loadSound('Sounds/rolling.mp3');
  // sliding_sound .setVolume(0.4);
  wrong_sound = loadSound('Sounds/wrong.mp3');
  wrong_sound.setVolume(0.3);
}

function start_swap() {
  // If we just copy plain numbers, they shouldn't change
  b1x0 = b1.x.valueOf();
  b1y0 = b1.y.valueOf();
  b2x0 = b2.x.valueOf();
  b2y0 = b2.y.valueOf();
  // Allow these two blocks to overlap each other
  b1.overlaps(b2);
  b2.overlaps(b1);
  // Temporarily make number_blocks static
  number_blocks.collider = 'static';
  sliding_sound.play();
}

function check_for_block_selection() {
  block_count = number_blocks.length;
  for (i=0; i<block_count; i++) {
    this_block = number_blocks[i];
    selection_action_happening = check_for_mouse_click_or_touch(this_block);
    if (selection_action_happening) {
      if (selected_vals.length == 0) {
        // If this is the first selection, always accept it
        selected_blocks.push(i); 
        selected_vals.push(this_block.value); 
        click_sound.play();
      } else { 
        // If not first selection, check that we only have
        // one previous block, and that new one is different.
        // Then check if they are adjacent
        selections_are_adjacent = 0;
        if ( (selected_blocks.length>0) &&
             !_.includes(selected_blocks,i) ) {
          // Ok, now check if selections are adjacent
          selections_are_adjacent = check_if_adjacent(selected_blocks);
          if (selections_are_adjacent) {
            selected_blocks.push(i); 
            selected_vals.push(this_block.value); 
            click_sound.play();
          } else {
            // Wiggle an invalidly selected non-adjacent block
            // Do a smaller jump if on higher row
            this_block.vel.y = this_block.row - box_blocks_height; 
            wrong_sound.play();
          }
        } // End of if checking for adjacency
      } // End of else for when selected_blocks.length != 0
    } // End of if (selection_action_happening)
  } // End of loop through blocks
} 

function check_if_adjacent(selected_blocks) {
  selections_are_adjacent = 0;
  first_selected_block = number_blocks[selected_blocks[0]];
  first_selected_row = y_to_row(first_selected_block.y);
  first_selected_col = x_to_col(first_selected_block.x);  
  new_row = y_to_row(this_block.y);
  new_col = x_to_col(this_block.x);
  // Check for adjacency. Sum of abs diffs must be 1
  adjacency_val = abs(first_selected_row - new_row) +
                  abs(first_selected_col - new_col);
  if (adjacency_val==1) {
    selections_are_adjacent = 1;
  } else {
    selections_are_adjacent = 0;
  }
  return selections_are_adjacent;
}

function color_blocks() {
  // Colour selected blocks orange and red
  for (i=0; i<block_count; i++) {
    this_block = number_blocks[i];
    if (i==selected_blocks[0]) {
      this_block.color  = 'orange';
      this_block.color.setAlpha(150);
      select_time = millis();
    } if (i==selected_blocks[1]) {
      this_block.color  = 'red';
      this_block.strokeWeight = 1;
      this_block.color.setAlpha(150);
    } else {
      if ( (millis()-select_time > 200) && 
           (millis()-highlight_start_time > match_highlight_dur) ){
        this_block.color  = 'white';   
        this_block.color.setAlpha(0);
      } 
    }
  } // End of loop through coloring the blocks
}

function check_for_mouse_click_or_touch(this_block) {
  selection_action_happening = 0;
  if (isMobileDevice==0) {  // Normal mouse click
    if (this_block.mouse.pressing()) {
      selection_action_happening = 1;
    }
  } else { // Touch screeen mobile: no click required
    if ( touches.length>0 && touch_has_ended ) {
      if ( _.inRange(touches[0].x, this_block.x - block_size/2,  this_block.x + block_size/2) &&
           _.inRange(touches[0].y, this_block.y - block_size/2,  this_block.y + block_size/2) ) {
          selection_action_happening = 1;
          // Reset the touch_has_ended var, so that we don't get repeated calls
          touch_has_ended = 0;   
        }
      }
    }
  return selection_action_happening;
}

function touchEnded() {
  touch_has_ended = 1;
}

function update_row_col_recs() {
  block_count = number_blocks.length
  row_rec = new Array(max_blocks).fill(-1);
  col_rec = new Array(max_blocks).fill(-1);
  for (i = block_count - 1; i >= 0; i--) {
    this_block = number_blocks[i];
    this_col = x_to_col(this_block.x);
    this_row = y_to_row(this_block.y);
    this_block.col = this_col;
    this_block.row = this_row;
    row_rec[i] = this_row;
    col_rec[i] = this_col;
  }
}

function check_neighbor_matches() {
  matching_blocks = [];
  textSize(14);
  for (row = 0; row < box_blocks_height; row++) {
    for (col = 0; col < box_blocks_width; col++) {
      // First, check if a block is here
      starting_block_ind = look_for_block_at(row, col);
      // If we have a block in this row,col slot,
      // check for blocks above and to the right
      if (starting_block_ind != null) {
        this_block = number_blocks[starting_block_ind];
        if (this_block != null) {
          this_block_val = this_block.value;
          // Now that all those checks passed ok,
          // we can check for above and right blocks
          above_block_ind = look_for_block_at(row + 1, col);
          if (above_block_ind != null) {
            above_block = number_blocks[above_block_ind];
            if (above_block != null) {
              above_block_val = above_block.value;
              if (above_block_val == this_block_val) {
                matching_blocks.push(starting_block_ind);
                matching_blocks.push(above_block_ind);
              }
            }
          }
          block_to_right_ind = look_for_block_at(row, col + 1);
          if (block_to_right_ind != null) {
            block_to_right = number_blocks[block_to_right_ind];
            if (block_to_right != null) {
              block_to_right_val = block_to_right.value;
              if (block_to_right_val == this_block_val) {
                matching_blocks.push(starting_block_ind);
                matching_blocks.push(block_to_right_ind);
              }
            }
          } // End of checking block to right
        }
      } // End of if (starting_block_ind != null)
    } // End of loop through cols
  } // End of loop through rows
  return _.uniq(matching_blocks);
  // return matching_blocks
}

function calclulate_total_motion() {
  block_count = number_blocks.length
  motion_tally = 0
  if (block_count > 0) {
    for (i = 0; i < block_count; i++) {
      this_block = number_blocks[i];
      motion_tally += abs(this_block.vel.x) +
        abs(this_block.vel.y);
    }
  }
  return motion_tally;
}

function col_to_x(this_col) {
  this_x = left_wall.x + gap * (this_col + 1) +
    block_size * (this_col + 1 / 2) + wall_thickness / 2;
  return this_x;
}

function row_to_y(this_row) {
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
  floor.x = scale_val * max_x / 2 - gap / 4;
  floor.y = scale_val * max_y / 2 + block_size * box_blocks_height / 2;
}

function look_for_block_at(row, col) {
  row_matches = row_rec.map((x, index) => (x == row) ? index : -1);
  row_matches_filtered = row_matches.filter(x => (x > -1));
  col_matches = col_rec.map((x, index) => (x == col) ? index : -1);
  col_matches_filtered = col_matches.filter(x => (x > -1));

  if (row_matches_filtered != null && col_matches_filtered != null) {
    row_col_match =
      _.intersection(row_matches_filtered, col_matches_filtered);

    if (row_col_match != null) {
      matching_block_ind = row_col_match;
    }
  }
  return matching_block_ind;
}

// This last function helps to get sound to play on iOS
// by making thr first click play a sound.
// iOS needs sound-on to be triggered by a user action
function mousePressed() {
  if (mouse_has_been_pressed==0) {
    click_sound.play()
    mouse_has_been_pressed = 1
  } 
}