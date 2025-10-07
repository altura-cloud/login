import {randint, get_random_element, blur_value} from "../util/random.js"

const direction = Math.random() > 0.5 ? 1 : -1;

function cloud_colors(height_level) {
    let colors = []
    for (let c = 0; c < 3; c++) {
        const hue = 17 + height_level/10;
        const sat = 100 - 20*c;
        const lit = 80 - 20*c;
        colors.push(`HSL(${hue},${sat}%,${lit}%)`)
    }
    return colors
}

function snap_to_grid(value, grid_size) {
    return Math.floor(value / grid_size) * grid_size;
}

function get_bounding_box(array, element) {
    // for
}

class Shape {
    constructor(lines, colors, col_offset, row_offset) {
        this.lines = lines;
        this.colors = colors;
        this.col_offset = col_offset;
        this.row_offset = row_offset;
        this.color = 0;
    }

    draw(ctx, x, y) {
        ctx.fillStyle = this.colors[this.color];
        this.lines.forEach((line, i) => {
            ctx.fillText(line, snap_to_grid(x + this.col_offset * ctx.letter_width, ctx.letter_width), Math.floor((y + (this.row_offset - i) * (ctx.row_height))));
        }, this)
    }
}

class BackgroundObject {
    constructor(x, y, columns, rows, legal_characters) {
        this.x = x;
        this.y = y;
        this.columns = columns;
        this.rows = rows;
        this.legal_characters = legal_characters;
    }

    update() {}

    generate() {
        this.ascii = [];
        let shape = Array(this.rows).fill(Array(this.columns).fill('#'));
        let lines = []
        for (let line of shape) {
            lines.push(line.map((char) => char == '.' ? ' ' : get_random_element(this.legal_characters)).join(""));
        }
        this.ascii.push(new Shape(lines, ["rgba(0, 0, 0, 1)"], 0, 0));
    }

    draw(ctx, frame_width, frame_height) {
        this.ascii.forEach((shape) => {shape.draw(ctx, this.x * frame_width / 100, this.y * frame_height / 100)})
    }
}

class Cloud extends BackgroundObject {

    constructor(x, y, columns, rows, legal_characters) {
        super(x, y, columns, rows, legal_characters)
        this.x_speed = (Math.random()*0.02 + 0.01) * Math.max(y / 50, 1) * direction;
    }

    generate() {
        const total_colors = 3

        let cloud_stencil = Array(this.rows).fill(0).map(() => (new Array(this.columns).fill(0)));
        // generate bottom layer
        const max_bottom_layer_row = Math.floor(this.rows / 7);
        let bottom_layer = randint(max_bottom_layer_row);
        let total_rows = bottom_layer + 2;
        for (let x = 0; x < this.columns; x++) {
            let middle_layer = (total_rows - bottom_layer) / 2 + bottom_layer;
            cloud_stencil[bottom_layer][x] = 3;
            for (let y = bottom_layer + 1; y < total_rows; y++) {
                cloud_stencil[y][x] = y <= middle_layer ? 2 : 1;
            }
            bottom_layer = blur_value(bottom_layer, 0.2, 0, max_bottom_layer_row);
            total_rows = blur_value(total_rows, 0.2, bottom_layer + 2, Math.min(this.rows, Math.min(x, this.columns - x) * 3));
        }


        let shapes = [[], [], []]
        for (let line of cloud_stencil) {
            let lines = [Array(this.columns).fill(' '), Array(this.columns).fill(' '), Array(this.columns).fill(' ')];
            for (const [i, char] of line.entries()) {
                if (char > 0) {
                    lines[char - 1][i] = get_random_element(this.legal_characters);
                }
            }
            for (let i = 0; i < total_colors; ++i) {
                shapes[i].push(lines[i].join(""));
            }
        }

        this.ascii = [];
        const colors = cloud_colors(this.y)
        for (let i = 0; i < total_colors; ++i) {
            this.ascii.push(new Shape(shapes[i], [colors[i]], 0, 0));
        }

    }

    update() {
        this.x += this.x_speed;
        if (this.x < -2)
            this.x += 100;
        else if (this.x > 100)
            this.x = -2
    }

}




class Skyline extends BackgroundObject {
    constructor(x, y, layer, columns, rows, legal_characters) {
        super(x, y, columns, rows, legal_characters);
        this.layer = layer;
        this.windows = [];
    }

    generate() {
        this.ascii = [];

        let col = 0;
        while (col < this.columns) {
            const col_offset = col;

            const buildingCols = Math.min(2*randint(1, 3) + 1, this.columns - col);
            const buildingRows = randint(Math.floor(this.rows / 4), this.rows/2) + buildingCols * 2;

            let building = (new Array(buildingRows)).fill(0).map(() => (new Array(buildingCols)).fill(' '));

            let window_count = 0;
            for (let row = 0; row < buildingRows; row++) {
                for (let col = 0; col < buildingCols; col++) {
                    if (col > 0 && col < buildingCols - 1 && row > 0 && row < buildingRows && Math.random() * (window_count + 1) < 0.35 * ((row - 1) * (buildingCols - 2))) {
                        const new_window = new Shape([get_random_element(this.legal_characters)], ["rgba(0,0,0,1)", "rgba(211, 197, 141, 1)"], col_offset + col, -row)
                        if (Math.random() > 0.8) {
                            new_window.color = 1;
                        }
                        new_window.remaining_picks = randint(5, 15);
                        this.ascii.push(new_window);
                        this.windows.push(new_window);
                        window_count++;
                    } else {
                        building[row][col] = get_random_element(this.legal_characters);
                    }
                }
            }
            col += buildingCols + randint(1, 3);
            this.ascii.push(new Shape(building.map((line) => line.join("")), ["rgba(0,0,0,1)"], col_offset, 0));
        }
    }

    update() {
        if (Math.random() > 0.1) {
            return;
        }
        let window_updates = randint(1, this.windows.length / 10);
        for (let i = 0; i < window_updates; ++i) {
            const random_window = get_random_element(this.windows)
            random_window.remaining_picks--;
            if (random_window.remaining_picks <= 0) {
                random_window.color = (random_window.color + 1) % random_window.colors.length;
                random_window.remaining_picks = randint(10, 20);
            }
        }
    }

}

export {Cloud, Skyline}