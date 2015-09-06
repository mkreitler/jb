///////////////////////////////////////////////////////////////////////////////
// Resources Test
///////////////////////////////////////////////////////////////////////////////
jb.program = {
    xb: 1000, 
    yb: 100,
    x: 50,
    y: 100,
    start: function() {
        jb.print("fred ate a chiken.`");
        jb.print("Then he blew up.`");
        jb.listenForTap();
    },

    do_loop: function() {
        jb.clear();
        jb.ctxt.fillStyle="blue";
        jb.ctxt.fillRect(this.x, this.y, 20,20);
        jb.ctxt.fillStyle="red";
        jb.ctxt.fillRect(this.xb, this.yb, 20,20);
         
        if (jb.keys.isDown("down")) {
            this.y=this.y+10;
        }
           
        if (jb.keys.isDown("up")) {
            this.y=this.y-10;
        }

        if (jb.keys.isDown("left")) {
            this.x=this.x-10;
        }

        if (jb.keys.isDown("right")) {
            this.x=this.x+10;
        }

        if (jb.keys.isDown("S")) {
            this.yb=this.yb+10;
        }
           
        if (jb.keys.isDown("W")) {
            this.yb=this.yb-10;
        }

        if (jb.keys.isDown("A")) {
            this.xb=this.xb-10;
        }

        if (jb.keys.isDown("D")) {
            this.xb=this.xb+10;
        }  

        jb.until(false && jb.tap.done);   
    },

    end: function() {
     jb.print("Good job!");   
    }
};




