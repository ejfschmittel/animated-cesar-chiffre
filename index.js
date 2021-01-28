import CeasarDisk from "./modules/CeasarDisk.js"



const createCesarAnimation = () => {

    const d = 360 / 26 // degrees per segment
    const offsetZeroRotation = - 90 - d / 2;
    const alphabet ='abcdefghijklmnopqrstuvwxyz'.split('');

    let state = {
        message: "",
        output: "",
        key: "",
        encode: true,
        offset: 0,
        rotation: 0,
        rotationDegrees: 0,
    }

    const messageInputField = document.getElementById("cesar-chiffre-message-input")
    const keyInputField = document.getElementById("cesar-chiffre-key-input")
    const codingRadioButtons = document.getElementsByName("cesar-coding")
    
    const outputField = document.getElementById("cesar-chiffre-output");
    const svgContainer = document.getElementById("cesar-chiffre-svg")

    const startAnimationButton = document.getElementById("cesar-start-animation-button");


    const cesarDiskID = "cesar-disk"
    let cesarDisk = null;
    let svg = null;
    let outerRotationGroup = null;
    let innerRotationGroup = null;

    let lastChar = 0;

    let animationRotation = 0;


    let isAnimating = false;
    let tl = null;

    let draggable = null;


    const init = () => {
        // create  and prepare cesar disk
        cesarDisk = new CeasarDisk(cesarDiskID, {svgSize: 1000, innerWidth: 120, outerWidth: 120})
        cesarDisk.create(svgContainer);
        svg = document.getElementById(cesarDiskID)

        resizeDisk();
        outerRotationGroup = cesarDisk.getOuterDiskRotationGroup();
        innerRotationGroup = cesarDisk.getInnerDiskRotationGroup();

        gsap.set(innerRotationGroup, {rotation: offsetZeroRotation})
        gsap.set(outerRotationGroup, {rotation: offsetZeroRotation})


        // add event listeners 
        keyInputField.addEventListener("keyup", onKeyInputFieldChange)
        keyInputField.addEventListener("change", onKeyInputFieldChange)
    
        messageInputField.addEventListener("keyup", onMessageInputChange)

        startAnimationButton.addEventListener("click", onStartAnimationClick)

        codingRadioButtons.forEach((elem) => {
            elem.addEventListener("change", onCodingChange)
        })
    
        window.addEventListener("resize", resizeDisk)



        innerRotationGroup.parentElement.addEventListener("mousedown", () => {
            console.log("mousedown")
        })

        // make inner disk draggable
        draggable = Draggable.create(innerRotationGroup, {
            type: 'rotation',
            onPress: () => {
                // add
                if(draggable[0].enabled()){
                    const body = document.querySelector("body")
                    body.style.cursor = "grabbing"
                    svg.classList.add("cesar-disk--rotating")
                }
            },
            onRelease: () => {
                const body = document.querySelector("body")
                body.style.cursor = "auto"
                svg.classList.remove("cesar-disk--rotating")
            },
            onDrag: () => {
                // calc offset
                const rotationInner = gsap.getProperty(innerRotationGroup, "rotation")
                const rotationOffset =  Math.round(( rotationInner - offsetZeroRotation ) / d);
                // update key display
                setOffset(rotationOffset)
            },
            onDragEnd: () => {
              
                const rotationInner = gsap.getProperty(innerRotationGroup, "rotation")   
                const rotationOffset = Math.round(( rotationInner -offsetZeroRotation ) / d);
                gsap.to(innerRotationGroup, {rotation: offsetZeroRotation + rotationOffset * d })
            }
        
        })
    }

    const resizeDisk = () => {
        const bounds  = svgContainer.getBoundingClientRect();
        const size = bounds.width >= bounds.height ? bounds.height : bounds.width;

        svg.style.height = size;
        svg.style.width = size;
    }


    /* event handlers */

    const onKeyInputFieldChange = (e) => {
        const key = parseInt(e.target.value) || 0;  
        setKey(key, false);
    }

    const onMessageInputChange = (e) => {
        codeMessage()
    }

    const onCodingChange = (e) => {
        const encode = e.target.value === "encode" ? true : false; 
        updateState({encode})
        setKey(state.key)
    }

    const onStartAnimationClick = (e) => {
        if(isAnimating){
            // stop animation
         
            e.target.innerHTML = "Stoppping animation..."
            handleAnimationStop();


            draggable.enable();
           
        }else{
            // start animaton
            
            
            console.log("start animation")
            console.log(draggable[0])
            draggable[0].disable();
            e.target.innerHTML = "Stop animation"
            animateTextCoding()
            isAnimating = true;

        }
      
    }

    const handleAnimationStop = () => {
        tl.pause();
        tl = null;

        e.target.innerHTML = "Animate"
        isAnimating = false;

        
    }


    const animateTextCoding = () => {
        
        const {message} = state;
    
        const chars = message.split("");


        tl = gsap.timeline({
            onStart: () => {
                svg.classList.add("cesar-disk--animating")
            },
            onComplete: () => {
                svg.classList.remove("cesar-disk--animating");
                startAnimationButton.innerHTML = "animate"
            }
        });

        chars.forEach((char) => {


            const charIndex = alphabet.indexOf(char);         
            if(charIndex != -1){

                const {offset} = state

                
                const [segmentOuter] = cesarDisk.getOuterDiskSegment(charIndex)               
                const [segmentInner] = cesarDisk.getInnerDiskSegment(mod(charIndex - offset, 26))

                
                tl.add(rotateTo(charIndex))
                tl.to([segmentOuter, segmentInner], {fill: "#007000", duration: .1})
                tl.to([segmentOuter, segmentInner], {fill: "#d2222d", duration: .1, delay: 1})    
                
                // add text highlight

            }
        })

        return tl; 
    }



    const rotateTo = (n=0) => {  

        const normalizeAnimationRotation = mod(animationRotation, 26); // maybe negative

        const segmentDistance = n - normalizeAnimationRotation;
        const shortestSegmentRotation = Math.abs(segmentDistance) > 13 ? (13 * (segmentDistance/Math.abs(segmentDistance)) -  (segmentDistance % 13)) * -1 : segmentDistance;
        const relativeRotation = shortestSegmentRotation * d;
        const absolutRotation = offsetZeroRotation - animationRotation * d - relativeRotation;
        const rotationDuration = calcRotationDuration(shortestSegmentRotation)


        const startPositionInner = offsetZeroRotation + state.offset * d;

        const absoluteRotationInner = startPositionInner - animationRotation * d - relativeRotation;


         console.log(`from ${alphabet[lastChar]} to ${alphabet[n]}:`)
         console.log(normalizeAnimationRotation, segmentDistance, shortestSegmentRotation, relativeRotation, absolutRotation)
         console.log(state.offset, relativeRotation)

        const tl = gsap.timeline();


        // rotate inner and outer disk synchronously
        tl.to(outerRotationGroup, {
          //  onStart: () =>   console.log(`rotate to: offset(${offset}) rotation(${rotation})`),
            delay: 1,
            rotation: () => absolutRotation,
            duration: () => rotationDuration,
        })

        tl.to(innerRotationGroup, {
            rotation: () => absoluteRotationInner,
            duration: () => rotationDuration
        }, "<")



        lastChar = n;
        animationRotation = animationRotation + shortestSegmentRotation;

       return tl;
    }

    const calcRotationDuration = (distance) => {
        distance = Math.abs(distance);
        const rotationTime = distance * .3 - ((distance/26) * 3) // rotation time formula
        const clampedTime = clamp(.5,rotationTime,5) // define upper and lower bounds
        return clampedTime
    }



    /* no clue  */

    const codeMessage = () => {
        let message = messageInputField.value || "";
        message = message.toLowerCase();
        updateState({message})
        const { offset } = state; 
        let codedMessage = "";
    
        // loop through message and encode 
        message.split("").forEach(char => {     
            // just copy over chars not included in the alphabet
            if(!alphabet.includes(char)){
                codedMessage += char;
                return;
            }
            codedMessage += codeChar(char, offset)
        })
    
        console.log(`codedMessage ${codedMessage}`)
    
        updateState({output: codedMessage})
        outputField.innerHTML = codedMessage;
       
    }
    
    const codeChar = (char, offset) => {
        const codedAlphabetIndex = mod(alphabet.indexOf(char) - offset, 26);
        return alphabet[codedAlphabetIndex];
    }

    const rotateToOffset = (offset) => {
        const rotation = offsetZeroRotation + offset * d - animationRotation * d;
        gsap.set(innerRotationGroup, { rotation })
    } 


    /* handling state updates */
    const setKey = (key, updateField=true) => {
        const {encode} = state;
    
        const offset = encode ? -key : key;
        updateState({...state, key, offset})
    
        // update displays
        if(updateField){
            keyInputField.value = key;
        }
         
        rotateToOffset(offset)
        codeMessage()
    }
    
    const setOffset = (offset) => {
        const {encode} = state;
        const key = encode ? -offset : offset;
      
        updateState({key, offset})
        keyInputField.value = key;
        codeMessage();
    }
    

    const updateState = (updates={}) => {
        state = {...state, ...updates}
        console.log(state)
        // show nes values 
        const {key, offset, rotation, message} = state
        const debug = `key: ${key}, offset: ${offset}, rotation: ${rotation}, message: ${message}`;
        console.log(debug)
    }


    const mod = (n, m) => ((n % m) + m) % m;

    const clamp = (min, number, max) => {
        return Math.min(max, Math.max(number, min))
    }

    init();
}


window.onload = function(){
    gsap.registerPlugin(Draggable);
    createCesarAnimation();
}
