import CeasarDisk from "./modules/CeasarDisk.js"


const codeInput = document.getElementById("cesar-chiffre-message-input")
const offsetInput = document.getElementById("cesar-chiffre-key-input")
const decodeButton = document.getElementById("cesar-chiffre-decode-button")
const encodeButton = document.getElementById("cesar-chiffre-encode-button");
const outputText = document.getElementById("cesar-chiffre-output");
const svgContainer = document.getElementById("cesar-chiffre-svg")


let ceasarDisk = null;
let outerRotationGroup = null;
let innerRotationGroup = null;

let coloredSegments = []

let tl;


function mod(n, m) {
    return ((n % m) + m) % m;
}



const resizeDisk = () => {
    const bounds  = svgContainer.getBoundingClientRect();

    const svg = document.getElementById("cesar-disk")
    const size = bounds.width >= bounds.height ? bounds.height : bounds.width;

    svg.style.height = size;
    svg.style.width = size;
}




window.onload = function(){

    gsap.registerPlugin(Draggable);

    let offset = 0;// offset of the inner 
    let rotation = 0; // current rotation outer

    let d = 360 / 26;

    // create disk
    ceasarDisk = new CeasarDisk("cesar-disk", {svgSize: 1000, innerWidth: 120, outerWidth: 120})
    ceasarDisk.create(svgContainer);
    resizeDisk();

    // set disk rotation to zero position (a of both disks at the top)
    const offsetZeroRotation = - 90 - d / 2 ;
    outerRotationGroup = ceasarDisk.getOuterDiskRotationGroup();
    innerRotationGroup = ceasarDisk.getInnerDiskRotationGroup();

    gsap.set(innerRotationGroup, {rotation: offsetZeroRotation})
    gsap.set(outerRotationGroup, {rotation: offsetZeroRotation})



    // rotates both disks to given segment number
    const rotateTo = (n=0) => { 


        // get relative rotation (outerdisk current - goal)
        const x = mod(rotation - n, 26)
        const r = x > 13 ? 26 - x : - x;

        const relativeRotation = r * d;

        const tl = gsap.timeline();

        // rotate inner and outer disk synchronously
        tl.to(outerRotationGroup, {
            onStart: () =>   console.log(`rotate to: offset(${offset}) rotation(${rotation})`),
            rotation: () => {
                const rotationOuter = gsap.getProperty(outerRotationGroup, "rotation")
                return rotationOuter - relativeRotation;
            }, 
            duration: () => calcRotationDuration(r)
        })
   
        tl.to(innerRotationGroup, {
            rotation: () => {
                const rotationInner = gsap.getProperty(innerRotationGroup, "rotation")
                return rotationInner - relativeRotation;
            }, 
            duration: () => calcRotationDuration(r)
        }, "<")

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

        console.log(`set offset: offset(${offset}) rotation(${rotation})`)

        tl.to(innerRotationGroup, {
            delay: .5,
            rotation: () => {
                const rotationInner = gsap.getProperty(innerRotationGroup, "rotation")
                return rotationInner - relativeRotation;
            },
            duration: () => calcRotationDuration(r)
        });

        offset = n;

        return tl;
    }


    const getRelativeRotation = (n=0) => {
        const x = mod(rotation - n, 26)
        const r = x > 13 ? 26 - x : - x;
        const relativeRotation = r * d;
      
    }

    const animateTextCoding = (text, offset=0) => {
        offset = offset
       
        let outputText = "";
        updateOutputText(outputText)
        const alphabet ='abcdefghijklmnopqrstuvwxyz'.split('');

        const chars = text.split("");

    


        

        tl = gsap.timeline();


       
    
        tl.add(setOffset(offset));

        chars.forEach((char) => {


            // check if character is in alphabet string
            char = char.toLowerCase()
            const charIndex = alphabet.indexOf(char);         
            if(charIndex != -1){

                const [segmentOuter] = ceasarDisk.getOuterDiskSegment(charIndex)               
                const [segmentInner] = ceasarDisk.getInnerDiskSegment(mod(charIndex + offset, 26))

                
                tl.add(rotateTo(charIndex))
                tl.to([segmentOuter, segmentInner], {fill: "#007000", duration: .1, onStart: () => coloredSegments = [segmentInner, segmentOuter]})
                tl.add(() => {             
                    outputText += alphabet[mod(charIndex + offset, 26)]
                    updateOutputText(outputText)
                })
                tl.to([segmentOuter, segmentInner], {fill: "#d2222d", duration: .1, delay: 1,  onComplete: () => coloredSegments = []})             

            }else{
                // if char is not part of alphabet just add it to the output
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
    

    

    const startAnmiatedCoding = (decode=true) => {
        let animationOffset = parseInt(offsetInput.value) || 0;
        animationOffset =  decode ? -animationOffset : animationOffset;
        const text = codeInput.value;




        if(text){ 
            


            // reset timeline correctly if one is running
            if(tl && tl.isActive()){
                tl.pause();
                console.log(coloredSegments)
                tl.clear();
                gsap.set([innerRotationGroup, outerRotationGroup], {rotation: offsetZeroRotation})
                gsap.set(coloredSegments, {fill: "#d2222d"})
                rotation = 0;
                offset = 0;
            }
            animateTextCoding(text, animationOffset)
        }
         

    }

    /* EVENT LISTENERS */

    decodeButton.addEventListener("click", () => {
        startAnmiatedCoding(true)
    })

    encodeButton.addEventListener("click", () => {
        startAnmiatedCoding(false)
    })

    window.addEventListener("resize", () => {
        resizeDisk();
    })

    Draggable.create(innerRotationGroup, {
        type: 'rotation',
        throwProps: true,
        onDragEnd: () => {
            const rotationInner = gsap.getProperty(innerRotationGroup, "rotation")

            const normalizedRotation = rotationInner % 360

            const t = Math.round(( normalizedRotation -offsetZeroRotation ) / d);

           
            // find closed rotation snap smaller than 360

            // (-90 - d /2 ) + x * d = rotation spot
            // r = +97
            console.log(rotationInner, normalizedRotation, t)
            
            const tl = gsap.timeline();
            tl.set(innerRotationGroup, {rotation: normalizedRotation})
            tl.to(innerRotationGroup, {rotation: (offsetZeroRotation+t*d)})
            offset = t;
 
            // update rotation value
        }
      
        }
    )

    const snapValues = [...new Array(26)].map((_,idx) => {
        return offsetZeroRotation + idx * d;
    })

    Draggable.create(outerRotationGroup, {
        type: 'rotation',
        throwProps: true,

        onDrag: () => {
            const rotationOuter = gsap.getProperty(outerRotationGroup, "rotation")
            gsap.set(innerRotationGroup, {rotation: rotationOuter + offset * d})
        },
        onDragEnd: () => {

            console.log(offset)
            const rotationInner = gsap.getProperty(outerRotationGroup, "rotation")

            const normalizedRotation = rotationInner % 360

            const t = Math.round(( normalizedRotation -offsetZeroRotation ) / d);

           
            // find closed rotation snap smaller than 360

            // (-90 - d /2 ) + x * d = rotation spot
            // r = +97
            console.log(rotationInner, normalizedRotation, t)
            
            const tl = gsap.timeline();
            tl.set(outerRotationGroup, {rotation: normalizedRotation})
            tl.to(outerRotationGroup, {rotation: (offsetZeroRotation+t*d)})
            tl.to(innerRotationGroup, {rotation: (offsetZeroRotation+t*d+offset*d)}, "<")
            // update rotation value
        }
        }
    )

    console.log(snapValues)
}