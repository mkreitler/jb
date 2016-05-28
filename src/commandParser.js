// MUST be included *after* the jb module.
commandParser = {};

if (jb) {
	jb.commandParser = commandParser;
};

// CommandParser parses a subset of native English sentences.
commandParser.SEPARATOR = '~';
commandParser.CLAUSE_SEPARATOR = '&';
commandParser.ADJECTIVE_SEPARATOR = '::';
commandParser.CLAUSE_IDENTIFIERS = [
	"and" + commandParser.SEPARATOR + "then",
	"then",
	";",
	".",
];
commandParser.clauses   = null;
commandParser.grammarContext = {subject: "me"};

// Breaks up compound clauses.
commandParser.parse = function(command) {
	var commands = null;

	command = this.normalize(command);
	this.clauses = this.splitClauses(command);
	commands = this.clausesToCommands(this.clauses);

	return commands;
};

// Translate clauses into commands --------------------------------------------
commandParser.findPredicate = function(command, clause, tokens, leftChild, rightChild) {
	var key = null,
		verbIndex = -1,
		bSuccess = false;

	for (key in commandParser.verbs) {
		verbIndex = clause.indexOf(key);

		if (verbIndex >= 0) {
			leftChild = clause.substring(0, verbIndex);
			rightChild = clause.substring(verbIndex + key.length, clause.length);
			command.predicate = {action: key};
			bSuccess = true;
			break;
		}
	}

	return bSuccess;
},

commandParser.findSubject = function(command, clause, tokens, leftChild, rightChild) {
	var subjectStart = -1,
		key null,
		bFound = false,
		i = 0;

	for (key in commandParser.properNouns) {
		subjectStart = leftChild.indexOf(key);

		if (subjectStart >= 0) {
			command.subject = {actor: commandParser.properNouns[key].written};
			bFound = true;
			break;
		}
	}

	if (!bFound) {
		// Use parentheses to indicate implied subject.
		command.subject = "(" + commandParser.grammarContext.subject + ")";
	}

	return bFound;
},

commandParser.groupAdjectives = function(command, clause, tokens, leftChild, rightChild) {
	var iToken = 0,
		nounIndex = -1,
		iBack = 0,
		bRebuild = false,
		key = null;

	for (key in commandParser.nouns) {
		for (iToken=0; iToken<tokens.length; ++iToken) {
			if (key === tokens[iToken]) {
				// Found a noun.
				// Work backwards, collecting adjectives for this noun.
				for (iBack = iToken - 1; iBack >= 0; --iBack) {
					if (tokens[iBack] && commandParser.adjectives[tokens[iBack]]) {
						// Append adjective to the noun and replace the adjective token.
						tokens[iToken] += commandParser.ADJECTIVE_SEPARATOR + tokens[iBack];
						tokens[iBack] = null;
						bRebuild = true;
					}
					else {
						// No other adjectives for this noun.
						break;
					}
				}
			}
		}
	}

	if (bRebuild) {
		rightChild = null;
		for (iToken = 0; iToken < tokens.length; ++i) {
			if (tokens[iToken]) {
				rightChild += tokens[iToken] + commandParser.SEPARATOR;
			}
		}
	}

	return rightChild;
},

commandParser.resolvePrepositionalModifiers = function(command, clause, tokens, leftChild, rightChild) {

},

commandParser.clauseToCommand = function(clause) {
	// We expect clauses to have the form:
	// {verb} {[adjectives] object} [preposition {[adjectives] indirect object | [adjectives] description-of-nature-or-contents]
	//
	// Examples:
	//   	Take sword
	//		Get the bag of gold (where 'gold' describes the contents of the bag)
	//		Get the bag of holding (where 'holding' describes the "nature" of the bag)
	//		Get the bag with gold in it
	//		Put the armor on
	//		Set the sword down next to the bed
	//		Hit the thief with the eyepatch with the club with the spikes of silver

	var command = {subject: null, predicate: null, directObject: null},
		leftChild = null,
		rightChild = null,
		tokens = clause.split(commandParser.SEPARATOR),
		clauseCopy = clause,
		bSuccess = true;

	bSuccess = commandParser.findPredicate(command, clauseCopy, tokens, leftChild, rightChild);

	if (bSuccess) {
		bSuccess = commandParser.findSubject(command, clauseCopy, tokens, leftChild, rightChild);
	}

	if (bSuccess) {
		tokens = rightChild.split(commandParser.SEPARATOR);
		rightChild = commandParser.groupAdjectives(command, clauseCopy, tokens, leftChild, rightChild);
	}

	if (bSuccess) {
		commandParser.resolvePrepositionalModifiers(command, clauseCopy, tokens, leftChild, rightChild);
	}
};

commandParser.clausesToCommands = function(clauses) {
	var i = 0,
			command = null,
			commands = [];

	for (i=0; i<clauses.length; ++i) {
		command = commandParser.clauseToCommand(this.clauses[i]);

		if (command) {
			commands.add(command);
		}
	}

	return commands;
};

// Break command into clauses -------------------------------------------------
// Considerations:
//    1) 'and' can separate clauses, but it can also separate items in a list.
//		2) The expression 'and then' and separate clauses.
//		3) The word 'then' can separate clauses.
//		4) Semicolons can separate clauses.
//		5) Periods can separate clauses.
commandParser.splitClauses = function(command) {
	var i = 0,
			bFoundClause = false,
			tokens = null;

	// First, the easy bit...
	for (i=0; i<commandParser.CLAUSE_IDENTIFIERS.length; ++i) {
		command = command.replace(commandParser.CLAUSE_IDENTIFIERS[i], commandParser.CLAUSE_SEPARATOR);
	}

	// ...now, the tricky bit.
	// 'And' can separate clauses, or it can separate list items.
	// The "first order" way to detect the difference is to scan
	// through the command, looking for 'ands', then match the
	// next token against known verbs.
	tokens = command.split(commandParser.SEPARATOR);
	for (i=0; i<tokens.length; ++i) {
		if (tokens[i] === 'and' && i <tokens.length - 1 && commandParser.verbs[tokens[i + 1]]) {
			tokens[i] = commandParser.CLAUSE_SEPARATOR;
			bFoundClause = true;
		}
	}

	if (bFoundClause) {
		// Reconstruct the command.
		command = '';
		for (i=0; i<tokens.length; ++i) {
			if (i === 0) {
				command = tokens[i];
			}
			else {
				command = command + commandParser.SEPARATOR + tokens[i];
			}
		}
	}

	return command.split(commandParser.CLAUSE_SEPARATOR);
},

// Remove special characters and capitalize everything ------------------------
commandParser.normalize = function(command) {
	var i = 0;

	// Replace all whitespace with '~'.
	command = command.replace(',', ' ');
	command = command.replace(/\s+/g, commandParser.SEPARATOR);
	command = command.toLowerCase();
	command = commandParser.SEPARATOR + command;

	// Remove articles.
	for (i=0; i<commandParser.articles.length; ++i) {
		command = command.replace(commandParser.articles[i], commandParser.SEPARATOR);
	}

	return command;
};

// Grammar ////////////////////////////////////////////////////////////////////
commandParser.subject = function(what, which, with) {
	// 'what' is the generic identifier of the object: 'book'
	// 'which' is a list of qualifiers that identify the subject: 'big', {what: cover, which: battered}
	// 'where' is a list of qualifiers that locate the object: {inside: {what: bag, which: {of: gold}}}
	this.which = which;
};

commandParser.predicate = function() {

};

commandParser.directObject = function() {

};

commandParser.indirectObject = function() {

};

// Vocabulary /////////////////////////////////////////////////////////////////
commandParser.verbs = {
	'put~down': {},
	'get~up': {},
	put: {},
	get: {},
	walk: {},
	run: {},
	pick: {},
	drop: {},
	move: {},
	push: {},
	pull: {},
	grab: {},
	'throw': {},
	hit: {},
	stab: {},
	slice: {},
	block: {},
	wear: {},
	set: {},	// Set down
};

commandParser.articles = {
	a: {},
	an: {},
	the: {},
};

commandParser.nouns = {
	armor: {plural: "armor", gender: "neutral"},
	coin: {plural: "coins", gender: "neutral"},
	door: {plural: "door", gender: "neutral"},
	gold: {plural: "golds", gender: "neutral"},
	horse: {plural: "horse", gender: "neutral"},
	key: {plural: "keys", gender: "neutral"},
	shield: {plural: "shields", gender: "neutral"},
	sword: {plural: "swords", gender: "neutral"},
	torch: {plural: "torches", gender: "neutral"},
	fire: {plural: "fires", gender: "neutral"},
};

commandParser.properNouns = {
	// Proper nouns
	john: {written: "John", plural: null, gender: "male"},
	robin: {written: "Robin", plural: null, gender: "either"},
	marian: {written: "Marian", plural: null, gender: "female"},
};

commandParser.pronouns = {
	him: {},
	her: {},
	it: {},
	this: {},
	that: {},
},

commandParser.adjectives = {
	red: {},
	orange: {},
	yellow: {},
	green: {},
	blue: {},
	indigo: {},
	violet: {},
	gold: {},
	silver: {},
	copper: {},
	bronze: {},
	platinum: {},
	big: {},
	large: {},
	huge: {},
	small: {},
	tiny: {},
	miniscule: {},
	soft: {},
	hard: {},
	sharp: {},
	dull: {},
	rusty: {},
	shiny: {},
	polished: {},
	mottled: {},
	broken: {},
	'new': {},
	heavy: {},
	light: {},
};

commandParser.prepositions = {
	'next~to': {adverb: "where"},
	'in~to': {adverb: "where"},
	into: {adverb: "where"},
	on: {adverb: "where"},
	'in': {adverb: "where"},
	inside: {adverb: "where"},
	beside: {adverb: "where"},
	to: {adverb: ["whom", "where"]},
	from: {adverb: ["whom", "where"]},
	over: {adverb: "where"},
	under: {adverb: "where"},
	beside: {adverb: "where"},
	above: {adverb: "where"},
	below: {adverb: "where"},
	of: {adjective: "nature"},
	'with': {adverb: "where", adjective: "which"}, // Put the book with the other items. / Get the book with the battered cover.
};

commandParser.adverbs = {

};

// John, get the big book with the battered cover from inside the bag of treasure.
// John get big book with battered cover from inside bag of treasure.
//
//
// STEP ONE: identify verb
// Left of verb is subject, right of verb is object
//
//                  get
//                  / \
//                 /   \
//               John  big book with battered cover from inside bag of treasure
//
//
// STEP TWO: resolve adjectives
//
//                  get
//                  / \
//                 /   \
//               John  (big)book with (battered)cover from inside bag of treasure
//
//
// STEP THREE: identify object
//
//                  get
//                  / \
//                 /   \
//               John   [big]book
//                        \
//                         \
//                         with [battered]cover from inside bag of treasure
//
//
// STEP THREE: decompose prepositional phrases, back to front
//
//                  {get, where: {inside, what: {bag, which:treasure}}}
//                  / \       
//                 /   \
//               John   {book, big, which: {cover, battered}}
//                           


