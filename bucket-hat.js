import {SvgPlus, Vector} from "./SvgPlus/4.js"
import { NumberSlider } from "./slider-input.js";
import {saveSVG} from "./svg2pdf.js"

const DEFAULT_PARAMS = {
    top_dia: 16 ,
    brim_length: 5,
    brim_angle: 45,
    height: 7,
    side_angle: 5,
    sa: 0.625,
    notches_top: 4,
    notches_brim: 5,
}
const PARAM_TOOLS = [
    {vname: "top_dia", name: "Top Diameter", range: [10, 30], unit: "cm", dp: 2},
    {vname: "height", name: "Height", range: [1, 30], unit: "cm", dp: 2},
    {vname: "brim_length", name: "Brim Length", range: [1, 30], unit: "cm", dp:2},
    {vname: "side_angle", name: "Side Angle", range: [0.001, 45], unit: "deg", dp: 2},
    {vname: "brim_angle", name: "Brim Angle", range: [24, 89.999], unit: "deg", dp:2},
    {vname: "sa", name: "Seam Allowance", range: [0.5,3], unit: "cm", dp:2},
    {vname: "notches_top", name: "Notches Top", range: [0, 10], unit: "unit", dp:0},
    {vname: "notches_brim", name: "Notches Brim", range: [0, 12], unit: "unit", dp:0}
]



const cm2px = 37.795275591;
const PAGE_SIZES = {
    A0: [84*cm2px, 29.7*4*cm2px],
    A1: [29.7*2*cm2px, 84*cm2px],
    A2: [42*cm2px, 29.7*2*cm2px],
    A3: [29.7*cm2px, 42*cm2px],
    A4: [21*cm2px, 29.7*cm2px],
}
const BLEED = 0.6 * cm2px;


const strokeWidth = 1;
const fontSize = 30;
const SeamStyle = {"stroke": "#989591", "stroke-width": strokeWidth}

let {sqrt, pow, sin, cos, PI, ceil, abs, min, tan, round} = Math;

function cone(d1, d2, h) {
    let x = h * d1 / (d2 - d1);

    // console.log(d1, d2, h);

    let r2 = sqrt(pow(x + h, 2) + pow(d2, 2));
    
    let rdelta = sqrt(pow(h, 2) + pow(d2 - d1, 2));
    let r1 = r2 - rdelta;

    

    let theta = (2 * d1 * PI) / r1; // l = theta * r

    return [r1, r2, theta];
}

class ConePeicePattern extends SvgPlus {
    constructor(r1, r2, theta, v0 = new Vector, sa = 0.625, incs_top = 4, incs_bottom = incs_top) {
        super("g");
        let r0 = r1-sa;
        let r3 = r2+sa;

        incs_bottom = round(incs_bottom)+1;
        incs_top = round(incs_top)+1;

        let r2v = new Vector(0, r2);
        let r0v = new Vector(0, r0);
        for (let inc = 1; inc < incs_top; inc++) {
            let t = inc * theta/incs_top;
            let p1 = v0.add((r0v).rotate(-t).sub(r2v))
            this.createChild(Marker, {}, p1, (new Vector(-1, 0)).rotate(-t), sa * 0.6)
        }

        let r3v = new Vector(0, r3);
        for (let inc = 1; inc < incs_bottom; inc++) {
            let t = inc * theta/incs_bottom;
            let p1 = v0.add((r3v).rotate(-t).sub(r2v))
            this.createChild(Marker, {}, p1, (new Vector(1, 0)).rotate(-t), sa * 0.6)
        }

        this.createChild(ConePeice, SeamStyle, r1, r2, theta, v0, 0);
        this.createChild(ConePeice, {}, r0, r3, theta, v0.add(0, sa), sa);

        let rmid = (r0 + r3)/2;
        let vrm = new Vector(0, rmid);
        let p2 = vrm.rotate(-theta);

        let id = Math.random() + "" + performance.now();
        this.createChild("path", {
            d: `M${v0.addV(-(r2-r1)/2)}a${rmid},${rmid},0,${theta>PI?1:0},0${p2.sub(vrm)}`,
            fill: 'none',
            id: id,
        })
        this.name = this.createChild("text", {"font-size": fontSize, "text-anchor": "middle"}).createChild("textPath", {
            href: `#${id}`,
            content: "hello world",
            "startOffset": "50%"
        });


        let s = (r2-r1) * 0.5;
        this.createChild(FoldLine, {}, v0.addV(-(r2-r1)/2), s);
 

        


    }
}


async function nextFrame(){
    return new Promise((resolve, reject) => {
        window.requestAnimationFrame(resolve);
    })
}

const STYLE = new SvgPlus("style")
document.body.appendChild(STYLE);

class Semi extends SvgPlus {
    constructor(v0, r, theta) {
        super("path")
        let vr = new Vector(0, r);
        let p1 = vr.rotate(-theta).sub(vr);
        let path = `M${v0}a${r},${r},0,${theta > PI ? 1 : 0},0,${p1}l${p1.mul(-1).sub(vr)}z`;


        
        this.props = {
            stroke: "black", 
            "stroke-width": strokeWidth,
            fill: "none", 
            d: path
        }
    }
}

class SemiPattern extends SvgPlus {
    constructor(v0, r, theta, sa, incs = 4) {
        super("g");
        // console.log(v0);
        incs = round(incs)+1;
        let r0v = new Vector(0, r);
        let r1v = new Vector(0, r+sa);
        for (let inc = 1; inc < incs; inc++) {
            let t = inc * theta/incs;
            let p1 = v0.add((r1v).rotate(-t).sub(r0v))
            this.createChild(Marker, {}, p1, (new Vector(1, 0)).rotate(-t), sa * 0.6)
        }

        this.createChild(Semi, SeamStyle, v0, r, theta);
        this.createChild(Semi, {}, v0.addV(sa), r+sa, theta);


        let s = (r) * 0.4;
        let c = v0.addV(-r);
        this.createChild(FoldLine, {}, v0.addV(-r), s);

        let g = this.createChild("g", {transform: `translate(${c.x+s}, ${c.y})`})
        this.name = g.createChild("text", {content: "hey", "text-anchor": "middle", "font-size": fontSize, transform: 'rotate(90)'})

    }
    
}

class ConePeice extends SvgPlus {
    constructor(r1, r2, theta, v0 = new Vector(), ext = 0) {
        super('path')

        let v2 = new Vector(0, r2);
        let v1 = new Vector(0, r1);
        let p1 = v2.rotate(-theta);
        let p2 = v1.rotate(-theta);
        let pd = p2.sub(p1);



        let path = `M${v0}a${r2},${r2},0,${theta > PI ? 1 : 0},0,${p1.sub(v2)}l${pd}a${r1},${r1},0,${theta > PI ? 1 : 0},1,${v1.sub(p2)}z`;
        if (ext > 0) {
            let dext = (new Vector(ext, 0)).rotate(-theta);
            path = `M${v0}a${r2},${r2},0,${theta > PI ? 1 : 0},0,${p1.sub(v2)}l${dext}l${pd}l${dext.mul(-1)}a${r1},${r1},0,${theta > PI ? 1 : 0},1,${v1.sub(p2)}z`
        }


        this.props = {
            stroke: "black", 
            "stroke-width": strokeWidth,
            fill: "none", 
            d: path
        }
    }
}

class Marker extends SvgPlus {
    constructor(v0, dir, size = 0.4) {
        super("path")
        let w = size * 0.7;
        let p1 = new Vector(-w/2, 0);
        let p2 = new Vector(w/2, -size);
        let p3 = new Vector(w/2, size);

        p1 = p1.cross(dir.dir());
        p2 = p2.cross(dir.dir());
        p3 = p3.cross(dir.dir());

        let path = `M${v0}m${[p1,p2,p3].join('l')}`
        this.props = {
            stroke: "black", 
            "stroke-width": strokeWidth,
            fill: "darkgray", 
            d: path
        }
    }
}

class Arrow extends SvgPlus {
    constructor(v0, dir, size = 0.4 * cm2px) {
        super("path")
        let w = size * 0.7;
        let p2 = new Vector(-w/2, -size);
        let p3 = new Vector(w, 0);

        p2 = p2.cross(dir.dir());
        p3 = p3.cross(dir.dir());

        let path = `M${v0}l${[p2,p3].join('l')}z`
        this.props = {
            d: path,
            fill: "black"
        }
    }
}


class FoldLine extends SvgPlus {
    constructor(v0, s) {
        super('g');
        let w = 1.5 *cm2px;
        this.createChild("path", {
            stroke: "black", 
            "stroke-width": strokeWidth,
            fill: "none", 
            d: `M${v0.addV(s/2)}h${w}v${-s}h${-w}`
        })
        this.createChild(Arrow, {}, v0.addV(-s/2), new Vector(0, 1))
        this.createChild(Arrow, {}, v0.addV(s/2), new Vector(0, 1))

    }
}




export class Tools extends SvgPlus {
    constructor(){
        super("param-tools");
        this.inputs = {}
        for (let {vname, name, range, unit, dp} of PARAM_TOOLS) {
            let d = this.createChild("div", {class: "row"});
            d.createChild("div", {class: "tool-label", content: name});
            let s = d.createChild(NumberSlider, {
                events: {
                    change: () => {
                        const event = new Event("change");
                        this.dispatchEvent(event);
                    }
                }
            }, ...range);
            s.dp = dp;
            s.createChild("div", {class: "tool-unit", content: unit});
            this.inputs[vname] = s;
        }

        this.createChild("img", {src: "./params-guide.svg"})
    }

    set value(value) {
        for (let key in DEFAULT_PARAMS) {
            this.inputs[key].value = key in value ? value[key] : DEFAULT_PARAMS[key];
        }
    }

    get value() {
        let value = {};
        for (let key in this.inputs) {
            value[key] = this.inputs[key].value
        }
        return value;
    }
}


export class BucketHat extends SvgPlus {
    constructor() {
        super("bucket-hat");
        let tools = this.createChild(Tools, {
            events: {
                change: () => {
                   this.parameters = tools.value;
                   this.updateFlag = true;
                }
            }
        });
        tools.value = {};
        this.parameters = {}
        
        this.svg = this.createChild("section").createChild("svg");
        this._dummySvg = this.createChild("svg", {styles: {
            position: "absolute",
            "z-index": -1,
            opacity: 0
        }})
        this.createChild("div", {
            class: "icon", 
            content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--!Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M64 32C28.7 32 0 60.7 0 96L0 416c0 35.3 28.7 64 64 64l320 0c35.3 0 64-28.7 64-64l0-242.7c0-17-6.7-33.3-18.7-45.3L352 50.7C340 38.7 323.7 32 306.7 32L64 32zm0 96c0-17.7 14.3-32 32-32l192 0c17.7 0 32 14.3 32 32l0 64c0 17.7-14.3 32-32 32L96 224c-17.7 0-32-14.3-32-32l0-64zM224 288a64 64 0 1 1 0 128 64 64 0 1 1 0-128z"/></svg>`,
            events: {
                click: () => this.save()
            }
        })

        this.updateFlag = true;
        this.update();

    }

   

    save(){
        let d = new Date();
        saveSVG(this.svg, this.page, `Bucket Hat Pattern (${d.getDate()}-${d.getMonth()}-${d.getFullYear()})`);
    }

    async update(){
        while(true) {
            if (this.updateFlag) {
                await this.render_pattern();
                this.updateFlag = false;
            }

            await nextFrame();
        }
    }


    async render_pattern(){
        let {top_dia, side_angle, height, brim_length, brim_angle, sa, notches_top, notches_brim} = this.parameters;
        let bottom_dia = 2 * tan(side_angle ) * height + top_dia;
        
        let [r11, r12, theta1] = cone(top_dia/2, bottom_dia/2, height);
        let h2 = sin(brim_angle ) * brim_length;
        let bd2 = cos(brim_angle ) * brim_length + bottom_dia / 2;
        let [r21, r22, theta2] = cone(bottom_dia/2, bd2, h2);
        
        
        let v0 = new Vector();
        
        this._dummySvg.innerHTML = "";
        let g =this._dummySvg.createChild("g");
        let a = g.createChild(ConePeicePattern, {}, r21, r22, theta2/2, v0, sa, notches_brim);
        a.name.innerHTML = "Brim"
        
        let ex = 0; ///ex < 0 ? ex - sa * 3 : 0;
       
        let v_side = v0.add(0, r12-r11 + 2*sa + 0.2 - ex*1.2);
        let vr = new Vector(0, r11-sa);
        let vp = v_side.addV(r11-r12-sa);
        let ve = vr.rotate(-theta1/2).sub(vr).add(vp).add((new Vector(sa, 0).rotate(-theta1/2)))

        let p0 = v0.addV(-r22);
        let yi = sqrt(pow(r22+sa, 2) - pow(ve.x - p0.x, 2)) + p0.y;

        if (!Number.isNaN(yi) && yi - ve.y + 0.22 > 0) {
            console.log((yi-ve.y+0.22));
            v_side = v_side.addV((yi - ve.y + 0.22));
        }

        let b = g.createChild(ConePeicePattern, {}, r11, r12, theta1/2, v_side, sa, notches_top, notches_brim);
        b.name.innerHTML = "Side"

        let c = g.createChild(SemiPattern, {}, v0.addV(-(brim_length + 2*sa + 0.2)), top_dia/2, PI, sa, notches_top);
        c.name.innerHTML = "Top"
    
        await nextFrame();

        let [pos, size] = g.svgBBox;

        let {x, y} = size.add(2 * BLEED); // add 1cm for bleed
        let minDim = x > y ? y : x;
        let maxDim = x > y ? x : y;
        let page = null;
        for (let psize in PAGE_SIZES) {
            let [pmin, pmax] = PAGE_SIZES[psize];
            if (minDim < pmin && maxDim < pmax) {
                page = psize;
            }
        }
        let [pmin, pmax] = PAGE_SIZES[page];
        let nsize = new Vector(x == minDim ? pmin : pmax, y == minDim ? pmin : pmax);

        let npos = pos.sub(BLEED);
        this._width=nsize.x;
        this._height=nsize.y;
        this.page = page;
        STYLE.innerHTML = `
        @page {
            size: ${page};
            margin: 0;
        }`
        this.svg.props = {viewBox: `${npos.x} ${npos.y} ${nsize.x} ${nsize.y}`}
        this.svg.innerHTML = this._dummySvg.innerHTML;
        this.svg.createChild("text", {content: page, x: npos.x + nsize.x -BLEED, y:npos.y+fontSize*1.3*0.8+BLEED, "font-size": fontSize*1.3, "text-anchor": "end"})
    }


    


    /**
     * @typedef {{top_dia: number, bottom_dia: number, height: number, brim_length: number, brim_angle: number}} HatParameters
     * 
     * @param {HatParameters} params
     */
    set parameters(params) {
        let fparams = {};
        for (let {vname, unit} of PARAM_TOOLS) {
            let multi = unit == "cm" ? cm2px : unit == "deg" ? PI/180 : 1
            fparams[vname] = (vname in params ? params[vname] : DEFAULT_PARAMS[vname]) * multi;
        }
        this.params = fparams;
        console.log(fparams);
    }
    get parameters(){
        return this.params;
    }
}