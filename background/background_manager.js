import {randint} from "../util/random.js"
import {Cloud, Skyline} from "./background_objects.js"


const FONT_SIZE = 0.02
const skipped_frames = 10

function resize(canvas_element) {
        const globalAlpha = canvas_element.getContext("2d").globalAlpha;
        canvas_element.width = window.innerWidth;
        canvas_element.height = window.innerHeight;
        canvas_element.getContext("2d").globalAlpha = globalAlpha;
    }


class BackgroundManager {
    constructor(canvas_element, keep_visible, legal_characters) {
        this.canvas_element = canvas_element;
        this.keep_visible = keep_visible;
        const ctx = this.canvas_element.getContext("2d")
        resize(this.canvas_element);
        this.update_font_size();
        window.addEventListener("resize", () => {
            resize(this.canvas_element);
            this.update_font_size()
        });


        this.objects = []
        // generate clouds
        let y = 10;
        let x = Math.random() * 100;
        while (y < 60) {
            const cols = randint(window.innerWidth / 90, window.innerWidth / 50);
            const rows = randint(cols/4, cols/2);
            let cloud = new Cloud(x, y, cols, rows, legal_characters, this.fontsize);
            cloud.generate();
            y += 30 * rows * this.canvas_element.getContext("2d").row_height / window.innerHeight + 3;
            x = (x + randint(30, 70)) % 100;
            this.objects.push(cloud);

        }

        // generate buildings
        for (let layer = 0; layer >= 0; layer--) {
            const x = 0;
            const y = 100;
            const width = window.innerWidth;
            const height = Math.floor(window.innerHeight / (3 * this.fontsize));
            let building = new Skyline(x, y, layer, width, height, legal_characters, this.fontsize);
            building.generate();
            this.objects.push(building);
        }

        this.start_animation()
    }

    update_font_size() {
        this.fontsize = Math.floor(FONT_SIZE * Math.min(window.innerHeight, window.innerWidth))
        const ctx = this.canvas_element.getContext("2d");
        ctx.fontsize = this.fontsize;
        ctx.row_height = this.fontsize + 2;
        ctx.font = `bold ${ctx.fontsize}px monospace`;
        ctx.letter_width = ctx.measureText("a").width;
    }

    start_animation() {
        this.canvas_element.getContext("2d").globalAlpha = 0;
        function draw(canvas, objects, keep_visible, frame_counter) {
            if (frame_counter == 0) {
                const ctx = canvas.getContext("2d");
                ctx.globalAlpha = Math.min(0.7, ctx.globalAlpha + 0.1)
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                for (let obj of objects) {
                    obj.update();
                    obj.draw(ctx, canvas.width, canvas.height);
                }

                for (const clear of keep_visible) {
                    const area = clear.getBoundingClientRect();
                    ctx.fillStyle="rgb(0, 0, 0)";
                    const area_width = Math.floor(area.right - area.left);
                    const area_height = Math.floor(area.bottom - area.top);
                    let area_image = ctx.getImageData(area.left, area.top, area_width, area_height);
                    let area_data = area_image.data;
                    for (let row = 0; row < area_height; row++) {
                        for (let col = 0; col < area_width; col++) {
                            const idx = (row * area_width + col) * 4;
                            const value = 1 - Math.min(col, area_width - col - 1) / area_width;
                            area_data[idx + 3] *= value*value;

                        }
                    }
                    ctx.putImageData(area_image, area.left, area.top);
                }
            }

            requestAnimationFrame(() => draw(canvas, objects, keep_visible, (frame_counter + 1) % skipped_frames));
        }

        draw(this.canvas_element, this.objects, this.keep_visible, 0)
    }

}

export {BackgroundManager}
