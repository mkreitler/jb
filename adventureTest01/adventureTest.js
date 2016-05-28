jb.program = {
	voiceResult: "",
	bVoiceDone: true,
	voiceProgress: null,
	clauses: null,

	start: function() {
		webVoice.init(this.voiceOnStart, this.voiceOnEnd, this.voiceOnResult, this.voiceOnError, true, true);
	},

	do_testLoop: function() {
		var i = 0;

		jb.clear();

		if (this.clauses) {
			jb.setForeColor("green");
			for (i=0; i<this.clauses.length; ++i) {
				jb.print("Clause " + (i + 1) + ": " + this.clauses[i] + "`");
			}
			jb.print("`");
		}

		jb.setForeColor("white");
		jb.print("Hold spacebar and speak to issue command.`");
		jb.until(jb.readKey() === ' ');
	},

	startSpeechInput: function() {
		var recog = webVoice.get();

		if (recog) {
			this.voiceResult = "";
			this.bVoiceDone = false;
			this.voiceProgress = "Processing";

			recog.start();
		}
		else {
			jb.goto("end");
		}
	},

	do_waitForSpeechResult: function() {
		jb.clear();
		jb.print(this.voiceProgress);

		jb.until(!jb.keys.isDown("space"));
	},

	stopSpeechInput: function() {
		var recog = webVoice.get();

		if (recog) {
			recog.stop();
		}
		else {
			jb.goto("end");
		}
	},

	do_waitForFinalSpeechResult: function() {
		jb.clear();
		jb.print(this.voiceProgress);

		jb.until(this.bVoiceDone);
	},

	restartSpeechLoop: function() {
		jb.commandParser.parse(this.voiceResult);
		jb.goto("do_testLoop");
	},

	end: function() {
		jb.clear();
		jb.print("This browser does not support web speech.`");
		jb.print("Please upgrade to Chrome 25 or higher.`");

		jb.end();
	},

	// Voice Recognition ////////////////////////////////////////////////////////
	voiceOnStart: function() {
	},

	voiceOnEnd: function() {
		jb.program.bVoiceDone = true;

	  if (jb.program.voiceResult) {
	  	jb.program.voiceResult = jb.program.voiceResult.toLowerCase();
	  	jb.program.clauses = jb.commandParser.parse(jb.program.voiceResult);
	  }
	},

	voiceOnError: function(event) {
		jb.program.voiceResult = "Voice Error: " + event.message;
		jb.program.bVoiceDone = true;
	},

	voiceOnResult: function(event) {
	  var interimResult = '',
	  		i = 0;

	  jb.program.voiceProgress += ".";

	  for (i = event.resultIndex; i < event.results.length; ++i) {
	    if (event.results[i].isFinal) {
	    	if (jb.program.voiceResult) {
		      jb.program.voiceResult += event.results[i][0].transcript;
	    	}
	    	else {
		      jb.program.voiceResult = event.results[i][0].transcript;
	    	}
	    }
	    else {
	      interimResult += event.results[i][0].transcript;
	    }
	  }
	},
};

