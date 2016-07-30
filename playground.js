///////////////////////////////////////////////////////////////////////////////
// Number Line Test
///////////////////////////////////////////////////////////////////////////////
jb.program = {
  show: function() {
    /*
    jb.foreColor ="rgba(0,255,215,255)";
    jb.print("guy likes sci-fi!");
    jb.print("stan the man drives a van just because he can");
    jb.ctxt.strokeStyle ="rgba(0,255,215,255)";
    jb.ctxt.fillStyle ="rgba(0,255,215,255)";
    
    jb.ctxt.rect(6, 50, 50, 55);
    jb.ctxt.fill();

    jb.ctxt.stroke();
    */

    jb.ctxt.strokeStyle ="rgba(0,255,215,255)";
    jb.ctxt.fillStyle ="rgba(0,255,215,255)";
    jb.ctxt.beginPath();

    jb.ctxt.scale(2.0, 2.0);

    jb.ctxt.moveTo(200, 100);
    jb.ctxt.lineTo(200, 130);
    jb.ctxt.lineTo(220, 120);
    jb.ctxt.lineTo(250, 130);
    jb.ctxt.lineTo(280, 120);
    jb.ctxt.lineTo(270, 120);
    jb.ctxt.lineTo(280, 110);
    jb.ctxt.lineTo(250, 100);
    jb.ctxt.lineTo(220, 110);

    jb.ctxt.lineTo(200, 100);

    jb.ctxt.closePath();

    jb.ctxt.fill();
    jb.ctxt.stroke();

  }  


  // SEND THIS TO LORENAQ!
  
};


