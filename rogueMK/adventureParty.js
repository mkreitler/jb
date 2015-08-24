// Manages a party of Adventurers
rmk.adventureParty = {
  combatPosition: [{x: -1, y: -1}, {x: -1, y: -1}, {x: -1, y: -1}, {x: -1, y: -1}],
  members: [null, null, null, null],
  nMembers: 0,
  attackerIndex: -1,
  targetIndex: -1,

  setTarget: function() {
    // FOR_NOW: target first party member.
    this.targetIndex = this.nMembers - 1;

    if (this.targetIndex >= 0) {
      jb.messages.send("setTargetOrigin", this.members[this.targetIndex].bounds, true);
    }
  },

  firstAttack: function() {
    this.attackerIndex = 0;

    if (this.attackerIndex < this.nMembers) {
      jb.messages.send("setAttackOrigin", this.members[this.attackerIndex].bounds, true);
    }

    return this.attackerIndex < this.nMembers;
  },

  nextAttack: function() {
    this.attackerIndex += 1;

    if (this.attackerIndex < this.nMembers) {
      jb.messages.send("setAttackOrigin", this.members[this.attackerIndex].bounds, true);
    }

    return this.attackerIndex < this.nMembers;
  },

  draw: function(ctxt) {
    var i = 0;

    for (i=0; i<this.nMembers; ++i) {
      this.members[i].spriteDraw(ctxt);
    }
  },

  update: function(dt) {
    var i = 0;

    for (i=0; i<this.nMembers; ++i) {
      this.members[i].spriteUpdate(dt);
    }
  },

  addMember: function(newMember) {
    if (newMember && this.nMembers < this.members.length) {
      this.members[this.nMembers] = newMember;
      newMember.spriteMoveTo(this.combatPosition[this.nMembers].x,
                             this.combatPosition[this.nMembers].y);
      this.nMembers += 1;
    }
  },

  removeMember: function(delMember) {
    var iMember = -1,
        i = 0;

    if (delMember && this.nMembers > 0) {
      for (i=0; i<this.nMembers; ++i) {
        if (this.members[i] === delMember) {
          iMember = i;
          break;
        }
      }

      if (iMember >= 0) {
        for (i=iMember; i<this.members.length - 1; ++i) {
          this.members[i] = this.members[i + 1];
        }

        this.members[this.members.length - 1] = null;
        this.nMembers -= 1;
      }
    }
  },

  init: function() {
    jb.messages.listen("setPartyCombatLocation", this);
  },

  setPartyCombatLocation: function(index, x, y) {
    if (index >= 0 && index < this.combatPosition.length) {
      this.combatPosition[index].x = x;
      this.combatPosition[index].y = y;

      if (this.nMembers > index) {
        this.members[index].spriteMoveTo(this.combatPosition[index].x, this.combatPosition[index].y);
      }
    }
  }
};

rmk.adventureParty.init();