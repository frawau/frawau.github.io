/*
* Colourwheel
* Copyright (c) 2015 François Wautier
* Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) license.
*/

colourwheel = function(target, size, prefix){
    var hue=0,
        satu=50,
        value=65,
        bu_callback,
        idprefix = prefix || "bu-",
        nbseg = 180,
        angle = 360/nbseg;;
            
    function toRadians (angle) {
        return (90-angle) * (Math.PI / 180);
    }
    
    function toDegrees (radians) {
        var deg = (radians * 180 / Math.PI)-90;
        if ( deg < 0) {
            return 360 + deg;
        }
        return deg;
    }
          
    function toHSL(colour){
        var h = colour[0];
        var l = (2 - colour[1] / 100) * colour[2] / 2; // Ligh. range 0-100
        var s = Math.round( colour[1] * colour[2] / (l<50 ? l * 2 : 200 - l * 2) );
        l = Math.round( l );
        return [h,s,l];
    }
    
    function toHSB(colour){
        var t = colour[1] * (colour[2]<50 ? colour[2] : 100-colour[2]) / 100; 
        var s = Math.round( 200 * t / (colour[2]+t) );
        var b = Math.round( t+colour[2] );
        return [colour[0],s,b]
    }

    function signature(){
        return {
            onchange: onchange,
            set_colour : set_colour,
            get_colour : get_colour,
            get_hsl_colour : get_hsl_colour,
            val: get_colour
        };
    }
    
    function set_colour(B) {
        set_hue(B[0]);
        var hslcol = toHSL(B);
        var sat = Math.round(675-((hslcol[1]*525)/100));
        var val = Math.round(196.9+((hslcol[2]*611)/100)) ;
        set_sv(sat,val);
        if (bu_callback) {
            bu_callback(get_colour());
        }
    }
     
    function get_colour() {
        var h = hue;
        var s = Math.round(100-((satu-150)/525)*100)
        var l = Math.round(((value-197)/611)*100)
        return toHSB([h,s,l])
    }
     
    function get_hsl_colour() {
        var h = hue;
        var s = Math.round(100-((satu-150)/525)*100)
        var l = Math.round(((value-197)/611)*100)
        return [h,s,l]
    }
    
    function onchange(fcnt) {
        bu_callback=fcnt;
    }
    
    function trackHue(e) {
        var svgobj =  document.getElementById(idprefix+"colourwheel");
        var pt = svgobj.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        var globalPoint = pt.matrixTransform(svgobj.getScreenCTM().inverse());
        var dragobj =  document.getElementById(idprefix+"hue-wheel");
        var globalToLocal = dragobj.getTransformToElement(svgobj).inverse();
        var inObjectSpace = globalPoint.matrixTransform( globalToLocal );
        //Find the angle
        var angle = toDegrees(Math.atan2(500-inObjectSpace.y,500-inObjectSpace.x));
        hue = angle;
        set_hue(angle);
        if (bu_callback) {
            bu_callback(get_colour());
        }
    } 
    function set_hue(angle) {
        var myelt = document.getElementById(idprefix+"sat-value");
        myelt.setAttribute("transform","rotate("+angle+" 500 500)");
        var mydiv=0;
        while ( mydiv < 100 ) {
            myelt = document.getElementById(idprefix+"stop-colour-"+mydiv);
            
            var myhsl=toHSL([0,mydiv,100])
            myelt.setAttribute("stop-color", "hsl("+Math.round(angle)+","+myhsl[1]+"%,"+myhsl[2]+"%");
            mydiv += 1;
            }
            var myelt = document.getElementById(idprefix+"cw-sv-handle");
            myelt.setAttribute("stroke","hsl("+(Math.round(angle)+180) % 360+",80%,50%)");
    };
    function startTrackHue(e) {
        document.addEventListener("mousemove", trackHue);
        document.addEventListener("mouseup", stopTrackHue);
    };
    function stopTrackHue(e) {
        document.removeEventListener("mousemove", trackHue);
        document.removeEventListener("mouseup", stopTrackHue);
    };
    
    function in_SVW (px,py) {

        //credit: http://www.blackpawn.com/texts/pointinpoly/default.html
        var ax = 500;
        var ay = 150;
        var bx = 196.9;
        var by = 676;
        var cx = 808.1;
        var cy = 675;
        var v0 = [cx-ax,cy-ay];
        var v1 = [bx-ax,by-ay];
        var v2 = [px-ax,py-ay];

        var dot00 = (v0[0]*v0[0]) + (v0[1]*v0[1]);
        var dot01 = (v0[0]*v1[0]) + (v0[1]*v1[1]);
        var dot02 = (v0[0]*v2[0]) + (v0[1]*v2[1]);
        var dot11 = (v1[0]*v1[0]) + (v1[1]*v1[1]);
        var dot12 = (v1[0]*v2[0]) + (v1[1]*v2[1]);

        var invDenom = 1/ (dot00 * dot11 - dot01 * dot01);

        var u = (dot11 * dot02 - dot01 * dot12) * invDenom;
        var v = (dot00 * dot12 - dot01 * dot02) * invDenom;

        return ((u >= 0) && (v >= 0) && (u + v <= 1));
    }
    
    function trackSV(e) {
        var svgobj =  document.getElementById(idprefix+"colourwheel");
        var pt = svgobj.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        var globalPoint = pt.matrixTransform(svgobj.getScreenCTM().inverse());
        var dragobj = document.getElementById(idprefix+"cw-sv-handle")
        var globalToLocal = dragobj.getTransformToElement(svgobj).inverse();
        var inObjectSpace = globalPoint.matrixTransform( globalToLocal );
        if ( in_SVW (inObjectSpace.x,inObjectSpace.y) ) { 
            value = inObjectSpace.x;
            satu = inObjectSpace.y
            dragobj.setAttribute("cx",inObjectSpace.x);
            dragobj.setAttribute("cy",inObjectSpace.y);
            
            if (bu_callback) {
                bu_callback(get_colour());
            }
        }
    }
    
    function set_sv(sat,val) {
       if ( in_SVW (val,sat) ) { 
            satu = sat;
            value = val;
            var dragobj = document.getElementById(idprefix+"cw-sv-handle")
            dragobj.setAttribute("cx",val);
            dragobj.setAttribute("cy",sat);
       }
    }
    
    function startTrackSV(e) {
        document.addEventListener("mousemove", trackSV);
        document.addEventListener("mouseup", stopTrackSV);
    };
    function stopTrackSV(e) {
        document.removeEventListener("mousemove", trackSV);
        document.removeEventListener("mouseup", stopTrackSV);
    };

    function create ( target, size) {
        
        var newElement, onewElement;
        var svgElement = document.createElementNS("http://www.w3.org/2000/svg", 'svg'); //Create a path in SVG's namespace
        svgElement.setAttribute("id",idprefix+"colourwheel");
        svgElement.setAttribute("viewBox","0 0 1000 1000");
        svgElement.setAttribute("width", size);
        svgElement.setAttribute("height", size);
        var defsElement = document.createElementNS("http://www.w3.org/2000/svg", 'defs');
        defsElement.setAttribute("id",idprefix+"wheel-defs");
        
        newElement = document.createElementNS("http://www.w3.org/2000/svg", 'clipPath');
        newElement.setAttribute("id",idprefix+"sv-clipPath");
        onewElement = document.createElementNS("http://www.w3.org/2000/svg", 'polygon');
        onewElement.setAttribute("points","500,150 196.9,675 808.1,675");
        newElement.appendChild(onewElement);
        defsElement.appendChild(newElement);
        svgElement.appendChild(defsElement);

        
        var hwElement = document.createElementNS("http://www.w3.org/2000/svg", 'g');
        hwElement.setAttribute("id",idprefix+"hue-wheel");
        svgElement.appendChild(hwElement)
        
        var svElement = document.createElementNS("http://www.w3.org/2000/svg", 'g');
        svElement.setAttribute("id",idprefix+"sat-value");
        var gradElement = document.createElementNS("http://www.w3.org/2000/svg", 'g');
        gradElement.setAttribute("id",idprefix+"value-grad");
        gradElement.setAttribute("style","clip-path: url(#"+idprefix+"sv-clipPath);")
        svElement.appendChild(gradElement)
        svgElement.appendChild(svElement)
        //The Hue Wheel
        newElement = document.createElementNS("http://www.w3.org/2000/svg", 'path');
        var mypath = "M 500,150 v -100 A 450,450 0 0,1 ";
        
        var cx = 500 + Math.cos(toRadians(angle))*450;
        var cy = 500 - Math.sin(toRadians(angle))*450;
        mypath += cx+","+cy+" L ";
        cx = 500 + Math.cos(toRadians(angle))*350;
        cy = 500 - Math.sin(toRadians(angle))*350;
        mypath += cx+","+cy+" M 500,150 A 350,350 0 0,1 "+cx+","+cy;
        newElement.setAttribute("id",idprefix+"wheelsegment");
        newElement.setAttribute("d",mypath);
        newElement.setAttribute("fill-rule","evenodd");
        hwElement.appendChild(newElement);
        //Re-use element , rotate it and set colour
        var cangle =  0 ; //tricky... We cover the original elt with a clone to get "fill"
        while ( cangle < 360 ) {
            newElement = document.createElementNS("http://www.w3.org/2000/svg", 'use');
            newElement.setAttributeNS('http://www.w3.org/1999/xlink','href',"#"+idprefix+"wheelsegment");
            newElement.setAttribute("transform","rotate("+cangle+" 500 500)")
            newElement.setAttribute("style","fill: hsl("+cangle+",90%,50%);");
            hwElement.appendChild(newElement);
            cangle += angle
        }
        
        var mydiv=0;
        var myLG, xstart, astop;
        // Create as many Linear gradients as we need, the middle "stop" has an id
        while ( mydiv < 100 ) {
            var ystart= 675 - (5.25*(mydiv+1))  // 5.25 = (675 - 150)/100;
            myLG = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
            myLG.setAttribute("id", idprefix+"LGID-"+mydiv);
            myLG.setAttribute("x1", "0%");
            myLG.setAttribute("x2", "100%");
            myLG.setAttribute("y1", "0%");
            myLG.setAttribute("y2", "0%");
            astop= document.createElementNS("http://www.w3.org/2000/svg", "stop");
            astop.setAttribute("offset", "0%");
            astop.setAttribute("stop-color", "hsl(0,"+mydiv+"%,0%");
            myLG.appendChild(astop);
            astop= document.createElementNS("http://www.w3.org/2000/svg", "stop");
            astop.setAttribute("id", idprefix+"stop-colour-"+mydiv);
            astop.setAttribute("offset", "50%");
            var myhsl=toHSL([0,mydiv,100])
            astop.setAttribute("stop-color", "hsl(0,"+myhsl[1]+"%,"+myhsl[2]+"%");
            myLG.appendChild(astop);
            astop= document.createElementNS("http://www.w3.org/2000/svg", "stop");
            astop.setAttribute("offset", "100%");
            astop.setAttribute("stop-color", "hsl(0,"+mydiv+"%,100%");
            myLG.appendChild(astop);
            defsElement.appendChild(myLG);
            // The clipped rect
            myLG = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            myLG.setAttribute("style","fill:url(#"+idprefix+"LGID-"+mydiv+");");
            myLG.setAttribute("x", 197);
            myLG.setAttribute("y",ystart);
            myLG.setAttribute("width", 605);
            myLG.setAttribute("height", 10.5);
            gradElement.appendChild(myLG);
            mydiv += 1;
        }
            
        newElement = document.createElementNS("http://www.w3.org/2000/svg", 'polygon'); 
        newElement.setAttribute("points","500,150 196.9,675 808.1,675");
        newElement.setAttribute("style","fill: transparent; stroke: black; stroke-width: 1;");
        //newElement.setAttribute("style","fill: url(#myLGID-XX); stroke: black; stroke-width: 1;");
        svElement.appendChild(newElement);
        newElement = document.createElementNS("http://www.w3.org/2000/svg", 'line');
        newElement.setAttribute("style","stroke:rgb(0,0,0);stroke-width:10;");
        newElement.setAttribute("x1",500);
        newElement.setAttribute("y1",150);
        newElement.setAttribute("x2",500);
        newElement.setAttribute("y2",25);
        svElement.appendChild(newElement);
        var huehandle = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
        huehandle.setAttribute("id",idprefix+"cw-hue-handle");
        huehandle.setAttribute("style","fill:black");
        huehandle.setAttribute("cx",500);
        huehandle.setAttribute("cy",25);
        huehandle.setAttribute("r",25);
        svElement.appendChild(huehandle);
        var svhandle = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
        svhandle.setAttribute("id",idprefix+"cw-sv-handle");
        svhandle.setAttribute("fill","transparent");
        svhandle.setAttribute("stroke","black");
        svhandle.setAttribute("stroke-width",7);
        svhandle.setAttribute("cx",500);
        svhandle.setAttribute("cy",500);
        svhandle.setAttribute("r",25);
        svElement.appendChild(svhandle);
        
        huehandle.addEventListener("mousedown", startTrackHue);
        svhandle.addEventListener("mousedown", startTrackSV);
        target.appendChild(svgElement)
        set_colour([0,50,65])
        return signature()
    };
            
    return create(target,size);
}
