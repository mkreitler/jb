///////////////////////////////////////////////////////////////////////////////
// Resources Test
///////////////////////////////////////////////////////////////////////////////
jb.program = {
    x: 50,
    y: 100,
    start: function() {
        jb.print("fred ate a chiken.`");
        jb.print("Then he blew up.`");
        jb.listenForTap();
    },

    do_loop: function() {
      var pot;

     pot=jb.readKey();    
     jb.clear();
     jb.ctxt.fillStyle="red";
     jb.ctxt.fillRect(this.x, this.y, 20,20);

     if (pot === "right"){
         this.x=this.x+10;
     }
     else if (pot === "left"){
     this.x=this.x-10   
     }
     else if (pot === "up"){
     this.y=this.y-10   
     }
     else if (pot === "down"){
     this.y=this.y+10
     }    
     jb.until(jb.tap.done);   
    },

    end: function() {
     jb.print("Good job!");   
    }
};




