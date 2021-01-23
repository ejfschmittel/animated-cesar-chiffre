class SegmentedSVGDisk{
    constructor(id, diskOptions={}){


        this.id = id;
        

        this.diskOptions = {
            svgSize: 1000,
            segments: 10,
            margin: .02,
            width: 100,
            ...diskOptions,
        }

        this.diskOptions.radius = this.diskOptions.svgSize / 2;
        this.textContents = null;
        this.svg = null;
        this.group = null;

        this.segments = [];


        this.textOptions = {
            
        }
    }

    rotate(degree){
        this.group.style.transform = `rotate(${degree}deg)`;
    }

    setTextContents = (textContents, textOptions={}) => {
        this.textContents = textContents;
        this.textOptions = {...this.textOptions, ...textOptions};
    }



    create(parent){              
        const {svgSize, segments} = this.diskOptions

        var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttributeNS(null, "height", svgSize );
        svg.setAttributeNS(null, "viewBox", `0 0 ${svgSize} ${svgSize}`);
        svg.id = this.id;

        this.group = this.createSvgElement("g")
        this.group.id = `${this.id}-group`;
  

        [...new Array(segments)].forEach((_, idx) => {
            this.createSegment(this.group, idx)
        })
  
        svg.appendChild(this.group)
        parent.appendChild(svg)

        this.svg = svg;
    }

    createSegment(svg, idx){
        const {margin, segments, radius} = this.diskOptions;
        const degrees = 360 / segments 
        const start = degrees * idx
        const end = (degrees * (idx + 1 - margin) + (margin == 0 ? 1 : 0))

        const pathSegment = this.createSegmentPath(idx, start, end)                  
        svg.appendChild(pathSegment)

        const textSegment = this.createSegmentText(idx, start, end)
        if(textSegment !== null) svg.appendChild(textSegment)          


        this.segments.push([pathSegment, textSegment])
    }

    createSegmentPath(idx, start, end){
        const {radius, width} = this.diskOptions
        const path = this.createPath(radius, radius, radius, radius-width, start, end)

        const pathElement = this.createSvgElement("path", `${this.id}-segment-${idx}`, {
            d: path,
            style: `fill:#d2222d`, // make backgorund customizable;
            "stroke-width": "1",
            "stroke": "#333"
        })

        return pathElement
    }
    
    createSegmentText(idx, start, end){
        // return textContents is neither function nor array
        if(!this.isFunction(this.textContents) && !Array.isArray(this.textContents)) return null;
        if(Array.isArray(this.textContents) && typeof this.textContents[idx] === 'undefined') return null;

        const {radius, width} = this.diskOptions

        // define text position
        const textRadius = radius - ( width / 2 );
        const textDegree = ( start + end ) / 2
        const [textX, textY] = this.point(radius, radius, textRadius, textDegree)

        // create wrapper svg (for correct rotation)
        const wrapperSvg = this.createSvgElement("svg", null, {
            x: textX,
            y: textY,
            style: "overflow: visible"
        })

        // create and rotate text element
        let textElement = this.createSvgElement("text", `${this.id}-text-${idx}`, {
            fill: "#fff",
            "dominant-baseline": "middle",
            "text-anchor": "middle",
            "font-size": "2em",
            "transform": `rotate(${textDegree+90})`               
        })

        if(this.isFunction(this.textContents)){
            const newTextElement = this.textContents(textElement)
            textElement = newTextElement;
        }else{
            textElement.textContent = this.textContents[idx];
        }

        //textElement.textContent = idx

        // create wrapper svg (for correct rotation)
        wrapperSvg.appendChild(textElement);
        return wrapperSvg;

    }

 

    createSvgElement(type="path", id=null, attributes={}){
        const SVG_NS = "http://www.w3.org/2000/svg"
        let element = document.createElementNS(SVG_NS,type);
        if(id) element.id = id;

        for(let attribName in attributes){
            if(attributes.hasOwnProperty(attribName)){
                element.setAttributeNS(null, attribName, attributes[attribName])
            }
        }

        return element;
    }


    createPath(x, y, r0, r1, d0, d1){                   
        const arc = Math.abs(d0 - d1) > 180 ? 1 : 0             
        return [
            `M${this.pointString(r0, d0)}`,
            `A${r0},${r0},0,${arc},1,${this.pointString(r0, d1)}`,
            `L${this.pointString(r1, d1)}`,
            `A${r1},${r1},0,${arc},0,${this.pointString(r1, d0)}`,
            'Z',
        ].join('')
    }

    polarToCartesian(x, y, r, degrees){
        const radians = degrees * Math.PI / 180.0;
        return [x + (r * Math.cos(radians)),
                y + (r * Math.sin(radians))]
    }

    point(x,y, radius, degree){
        return this.polarToCartesian(x, y, radius, degree)
            .map(n => n.toPrecision(5))
    }

    pointString(radius, degree){
        const {radius: center} = this.diskOptions
        return this.point(center, center, radius, degree).join(',')
    }

    isFunction(functionToCheck){
        return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
    }


    getGroup(){
        return this.group;
    }

    getSegment(i){
        return this.segments[i]
    }
}

export default SegmentedSVGDisk;