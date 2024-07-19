import { SvgPlus } from "./SvgPlus/4.js";

export class Slider extends SvgPlus {
    constructor(){
        super("svg");
      
        this.props = {
            styles: {
                cursor: "pointer",
            },
            viewBox: "0 0 40 8"
        };
        this.createChild("path", {
            d: "M2,4L38,4",
            stroke: "gray",
            fill: "none",
            "stroke-linecap": "round",
            "stroke-width": 2,
            events: {
                click: (e) => this.selectAt(e)
            }
        })
        this.circle = this.createChild("circle", {
            cy: 4
        })
        this.r = 1.5;
        this.cx = 2;

        this.addEventListener("mousedown", (e) => {
            this.mode = "grab"
        })
        this.addEventListener("mousemove", (e) => {
            this.mode = e.buttons == 1 ? "grab" : "over";
            if (e.buttons) this.moveCursor(e);
        })
        this.addEventListener("mouseup", (e) => {
            this.mode = "over"
        })
        this.addEventListener("mouseleave", (e) => {
            this.mode = null;
        })

        let next = () => {
            this.draw();
            // if (this.offsetParent != null)
                window.requestAnimationFrame(next);
        }
        window.requestAnimationFrame(next);

    }

    /** @param {MouseEvent} e */
    selectAt(e){
        let [pos, size] = this.bbox;
        this.cx = 40 * (e.clientX - pos.x) / size.x;
        const event = new Event("change");
        this.dispatchEvent(event);
    }

    /** @param {MouseEvent} e */
    moveCursor(e) {
        let size = this.bbox[1].x;
        let dx = 40 * e.movementX / size;
        this.cx += dx;

        const event = new Event("change");
        this.dispatchEvent(event);
    }

    draw(){
        if (this.mode === "over") {
            if (this.r < 2) this.r += 0.05;
        } else if (this.mode == "grab") {
            if (this.r > 1) this.r -= 0.15;
        } 
    }

    /** @param {number} cx */
    set r(r){
        this.circle.props = {r}
        this._r = r;
    }
    
    /** @return {number} */
    get r(){
        return this._r;
    }

    /** @param {number} cx */
    set cx(cx){
        if (cx < 2) cx = 2;
        if (cx > 38) cx = 38;
        this.circle.props = {cx}
        this._x = cx
    }

    /** @return {number} */
    get cx(){
        return this._x;
    }

    set mode(mode){
        switch (mode) {
            case "grab":
                this.styles = {cursor: "grabbing"};
                break;
            case "over":
                this.styles = {cursor: "pointer"}
                break;
            default:
                this.r = 1.5;
        }
        this._mode = mode;
    }

    get mode(){
        return this._mode;
    }


    /** @param {number} value 0 <= value <= 1 */
    set value(value) {
        if (value < 0) value = 0;
        if (value > 1) value = 1;
        this.cx = value * 36 + 2;
    }

    /** @return {number} */
    get value(){
        return (this.cx - 2)/36;
    }
}

export class NumberSlider extends SvgPlus {
    constructor(rangeStart, rangeEnd, default_value = (rangeStart + rangeEnd) / 2){
        super("number-slider");

        this.dp = 2;
        this.rangeStart = rangeStart;
        this.rangeEnd = rangeEnd;
        this.slider = this.createChild(Slider, {events: {
            "change": () => {
                let value = this.slider.value * (rangeEnd - rangeStart) + rangeStart;
                value = Math.round(value * Math.pow(10, this.dp)) / Math.pow(10, this.dp);
                this.input.value = value;

                const event = new Event("change");
                this.dispatchEvent(event);
            }
        }});
        this.input = this.createChild("input", {
            type: "number",
            events: {
            "input": () => {
                let value = parseFloat(this.input.value);
                if (Number.isNaN(value)) {
                    value = default_value;
                } else if (value > rangeEnd) {
                    value = rangeEnd;
                } else if (value < rangeStart) {
                    value = rangeStart;
                }
                if (Number.isNaN(value) || value > rangeEnd || value < rangeStart) this.input.value = value;
                this.slider.value = (value - rangeStart) / (rangeEnd - rangeStart);

                console.log("xx");
                const event = new Event("change");
                this.dispatchEvent(event);
            }
        }})
    }


    set value(value) {
        let {rangeStart, rangeEnd} = this;
        if (value < rangeStart) value = rangeStart;
        if (value > rangeEnd) value = rangeEnd;

        this.slider.value = (value - rangeStart) / (rangeEnd - rangeStart);
        this.input.value = Math.round(value * Math.pow(10, this.dp)) / Math.pow(10, this.dp);
    }

    get value(){
        let {rangeStart, rangeEnd} = this;
        return this.slider.value * (rangeEnd - rangeStart) + rangeStart
    }
}