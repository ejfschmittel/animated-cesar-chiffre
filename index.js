import SegmentedSVGDisk from "./modules/SegmentedSVGCircle.js"
import CeasarDisk from "./modules/CeasarDisk.js"


let offset = 0;


const codeInput = document.getElementById("code-input")
const offsetButton = document.getElementById("offset-button")
const offsetInput = document.getElementById("offset-input")

const decodeButton = document.getElementById("decode-button")
const encodeButton = document.getElementById("encode-button");
const currentOffset = document.getElementById("current-offset")

const outputText = document.getElementById("output-text");


let ceasarDisk = null;
let outerRotationGroup = null;
let innerRotationGroup = null;


function mod(n, m) {
    return ((n % m) + m) % m;
}



window.onload = function(){


    let offset = 0;// offset of the inner 
    let rotation = 0; // current rotation 


    let offsetOuter = 0;
    let offsetInner = 0;
    let d = 360 / 26;

    const offsetZeroRotation = - 90 - d / 2 ;

    const parent = document.getElementById("ceasar-disk-container")
    ceasarDisk = new CeasarDisk("ceasar-disk", {svgSize: 1000, innerWidth: 120, outerWidth: 120})
    ceasarDisk.create(parent);

    // set disk to 0 0 
    outerRotationGroup = ceasarDisk.getOuterDiskRotationGroup();
    innerRotationGroup = ceasarDisk.getInnerDiskRotationGroup();

    gsap.set(innerRotationGroup, {rotation: offsetZeroRotation})
    gsap.set(outerRotationGroup, {rotation: offsetZeroRotation})




    const rotateTo = (n=0) => { // rotation of the outer disk rotates inner disk as well


        // get relative rotation (outerdisk current - goal)
        const x = mod(rotation - n, 26)
        const r = x > 13 ? 26 - x : - x;

        const relativeRotation = r * d;

        // create timeline
       
        const tl = gsap.timeline();

        // create rotation outer disk

        tl.to(outerRotationGroup, {rotation: () => {
            const rotationOuter = gsap.getProperty(outerRotationGroup, "rotation")
            return rotationOuter - relativeRotation;
        }, duration: () => {
            // find a better function
            return calcRotationDuration(r)
        }})

        // add relative rotation to inner rotation
        
        tl.to(innerRotationGroup, {rotation: () => {
            const rotationInner = gsap.getProperty(innerRotationGroup, "rotation")
            return rotationInner - relativeRotation;
        }, duration: () => {
            // find a better function
           // return Math.max(Math.abs(r) * .3,1);
           return calcRotationDuration(r)
        }}, "<")

        // no highlight highlight sepearte

        // update rotation value
        rotation = n;
        return tl;
    }

    const calcRotationDuration = (distance) => {
        distance = Math.abs(distance);
        return Math.max(distance * .3 - ((distance/26) * 3), .5);
    }


    const setOffset = (n=0) => {
        const tl = gsap.timeline();

        // get old offset - new offset 

        const o = mod(offset - n, 26)
        const r = o > 13 ? 26 - o : - o;
        const relativeRotation = r * d;


        // create relative offset rotation 

        // relative fofset rotation + current offset

        const rotation = n *d;
        tl.to(innerRotationGroup, {
            rotation: () => {
                const rotationInner = gsap.getProperty(innerRotationGroup, "rotation")
                return rotationInner - relativeRotation;
            },
            duration: () => {
            // find a better function
            return calcRotationDuration(r)
            },
            onComplete: () => {
                currentOffset.innerHTML = n;
            }
        });



        offset = n;

        return tl;
    }


    const getRelativeRotation = (n=0) => {
        const x = mod(rotation - n, 26)
        const r = x > 13 ? 26 - x : - x;
        const relativeRotation = r * d;
        return -relativeRotation;
    }

    const animateTextCoding = (text, offset=0) => {
        offset = offset
       
        let outputText = "";
        updateOutputText(outputText)
        const alphabet ='abcdefghijklmnopqrstuvwxyz'.split('');

        const chars = text.split("");

        const tl = gsap.timeline();

    
        tl.add(setOffset(offset));

        chars.forEach((char) => {
            char = char.toLowerCase()
            const charIndex = alphabet.indexOf(char);
            if(charIndex != -1){
                // exists
             

                
                const [segmentOuter] = ceasarDisk.getOuterDiskSegment(charIndex)               
                const [segmentInner] = ceasarDisk.getInnerDiskSegment(mod(charIndex + offset, 26))

                
                tl.add(rotateTo(charIndex))
                tl.to([segmentOuter, segmentInner], {fill: "#007000", duration: .1})
                tl.add(() => {             
                    outputText += alphabet[mod(charIndex + offset, 26)]
                    updateOutputText(outputText)
                })
                tl.to([segmentOuter, segmentInner], {fill: "#d2222d", duration: .1, delay: 1})

               

            }else{
                tl.add(() => {
                    outputText += char;
                    updateOutputText(outputText)
                })
            }
        })

        return tl; 
    }


    const updateOutputText = (text) => {
        outputText.innerHTML = text;
    }
    

    decodeButton.addEventListener("click", () => {
        let offset = -parseInt(offsetInput.value) || 0;
        const text = codeInput.value;

        if(text){
            animateTextCoding(text, offset)
        }
    })

    encodeButton.addEventListener("click", () => {
        const offset = parseInt(offsetInput.value)  || 0;
        const text = codeInput.value;

        if(text){
            animateTextCoding(text, offset)
        }
    })
    

 
}