import SegmentedSVGDisk from "./SegmentedSVGCircle.js"

class CeasarDisk{
    constructor(id, settings={}){

        this.id = id;
        this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
        this.svg.id = this.id;

        this.settings = {
            svgSize: 1000,
            innerWidth: 120,
            outerWidth: 120,                       
            ...settings,
        }

        this.innerDisk = null;
        this.outerDisk = null;

        this.alphabet ='abcdefghijklmnopqrstuvwxyz'.split('');
        this.numbers = [...new Array(26)].map((_, idx) => idx);
    }

    create(parent){
        const {svgSize, innerWidth, outerWidth} = this.settings

        // create outer svg
        this.svg.setAttributeNS(null, "viewBox", `0 0 ${svgSize} ${svgSize}`)

        // define outerDisk
        this.outerDisk = new SegmentedSVGDisk(`${this.id}-outer`, {segments: 26, width: outerWidth, svgSize: svgSize})
        this.outerDisk.setTextContents(this.alphabet,{})

        // define innerDisk
        this.innerDisk = new SegmentedSVGDisk(`${this.id}-inner`, {segments: 26, width: innerWidth, svgSize: svgSize - outerWidth * 2})
        this.innerDisk.setTextContents(this.alphabet,{})
        


        // create Disks
        this.outerDisk.create(this.svg)
        this.innerDisk.create(this.svg)
        this.innerDisk.svg.setAttributeNS(null, "y", outerWidth)

        parent.appendChild(this.svg);
    }


    getInnerDiskRotationGroup(){
        return this.innerDisk.getGroup();
    }

    getOuterDiskRotationGroup(){
        return this.outerDisk.getGroup();
    }

    getRotation(n=0){
        const baseRotation = -90 - (360/26) / 2;
        // current rotation
        return baseRotation - (360/26) * n;
    }

    getOuterDiskSegment(i){
        return this.outerDisk.getSegment(i);
    }

    getInnerDiskSegment(i){
        return this.innerDisk.getSegment(i)
    }


   
}


export default CeasarDisk