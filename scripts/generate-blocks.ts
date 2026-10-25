import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const blocksDir = path.join(rootDir, "blocks");

type BlockSpec = {
  id: string;
  name: string;
  category: string;
  label: string;
  shape: "hat" | "command" | "reporter";
  description: string;
  args?: string[];
};

const motion: BlockSpec[] = [
  { id: "moveSteps", name: "moveSteps", category: "Motion", label: "move %n steps", shape: "command", description: "Move a sprite forward.", args: ["steps"] },
  { id: "turnRight", name: "turnRight", category: "Motion", label: "turn @turnRight %n degrees", shape: "command", description: "Turn right by a number of degrees.", args: ["degrees"] },
  { id: "turnLeft", name: "turnLeft", category: "Motion", label: "turn @turnLeft %n degrees", shape: "command", description: "Turn left by a number of degrees.", args: ["degrees"] },
  { id: "pointInDirection", name: "pointInDirection", category: "Motion", label: "point in direction %n", shape: "command", description: "Point in a direction.", args: ["direction"] },
  { id: "pointTowards", name: "pointTowards", category: "Motion", label: "point towards %s", shape: "command", description: "Point toward a target.", args: ["target"] },
  { id: "goTo", name: "goTo", category: "Motion", label: "go to x:%n y:%n", shape: "command", description: "Move to an exact position.", args: ["x", "y"] },
  { id: "glideTo", name: "glideTo", category: "Motion", label: "glide %n secs to x:%n y:%n", shape: "command", description: "Glide to a position over time.", args: ["secs", "x", "y"] },
  { id: "setX", name: "setX", category: "Motion", label: "set x to %n", shape: "command", description: "Set the x position.", args: ["x"] },
  { id: "setY", name: "setY", category: "Motion", label: "set y to %n", shape: "command", description: "Set the y position.", args: ["y"] },
  { id: "changeX", name: "changeX", category: "Motion", label: "change x by %n", shape: "command", description: "Adjust x by an amount.", args: ["x"] },
  { id: "changeY", name: "changeY", category: "Motion", label: "change y by %n", shape: "command", description: "Adjust y by an amount.", args: ["y"] },
  { id: "ifOnEdgeBounce", name: "ifOnEdgeBounce", category: "Motion", label: "if on edge, bounce", shape: "command", description: "Bounce off the edge of the stage." },
  { id: "setRotationStyle", name: "setRotationStyle", category: "Motion", label: "set rotation style %s", shape: "command", description: "Set rotation style.", args: ["style"] },
  { id: "xPosition", name: "xPosition", category: "Motion", label: "x position", shape: "reporter", description: "Current x position.", value: "xPosition" },
  { id: "yPosition", name: "yPosition", category: "Motion", label: "y position", shape: "reporter", description: "Current y position.", value: "yPosition" },
  { id: "direction", name: "direction", category: "Motion", label: "direction", shape: "reporter", description: "Current direction.", value: "direction" },
  { id: "distanceTo", name: "distanceTo", category: "Motion", label: "distance to %s", shape: "reporter", description: "Distance to a target.", args: ["target"] },
  { id: "moveTowards", name: "moveTowards", category: "Motion", label: "move towards %s", shape: "command", description: "Move toward a target.", args: ["target"] }
];

const looks: BlockSpec[] = [
  { id: "say", name: "say", category: "Looks", label: "say %s", shape: "command", description: "Say a message.", args: ["message"] },
  { id: "sayForSeconds", name: "sayForSeconds", category: "Looks", label: "say %s for %n seconds", shape: "command", description: "Say a message for a period of time.", args: ["message", "seconds"] },
  { id: "think", name: "think", category: "Looks", label: "think %s", shape: "command", description: "Think a message.", args: ["message"] },
  { id: "show", name: "show", category: "Looks", label: "show", shape: "command", description: "Show the sprite." },
  { id: "hide", name: "hide", category: "Looks", label: "hide", shape: "command", description: "Hide the sprite." },
  { id: "switchCostume", name: "switchCostume", category: "Looks", label: "switch costume to %s", shape: "command", description: "Switch to a costume.", args: ["costume"] },
  { id: "nextCostume", name: "nextCostume", category: "Looks", label: "next costume", shape: "command", description: "Go to the next costume." },
  { id: "setEffect", name: "setEffect", category: "Looks", label: "set %s effect to %n", shape: "command", description: "Set a visual effect.", args: ["effect", "value"] },
  { id: "changeEffect", name: "changeEffect", category: "Looks", label: "change %s effect by %n", shape: "command", description: "Change a visual effect.", args: ["effect", "value"] },
  { id: "clearEffects", name: "clearEffects", category: "Looks", label: "clear graphic effects", shape: "command", description: "Clear all graphic effects." },
  { id: "setSize", name: "setSize", category: "Looks", label: "set size to %n%", shape: "command", description: "Set size of sprite.", args: ["size"] },
  { id: "changeSize", name: "changeSize", category: "Looks", label: "change size by %n", shape: "command", description: "Adjust the size of the sprite.", args: ["size"] }
];

const sounds: BlockSpec[] = [
  { id: "playSound", name: "playSound", category: "Sounds", label: "play sound %s", shape: "command", description: "Play a sound.", args: ["sound"] },
  { id: "playSoundUntilDone", name: "playSoundUntilDone", category: "Sounds", label: "play sound %s until done", shape: "command", description: "Play a sound until it finishes.", args: ["sound"] },
  { id: "stopAllSounds", name: "stopAllSounds", category: "Sounds", label: "stop all sounds", shape: "command", description: "Stop all sound playback." },
  { id: "setVolume", name: "setVolume", category: "Sounds", label: "set volume to %n%", shape: "command", description: "Set the sound volume.", args: ["volume"] },
  { id: "changeVolume", name: "changeVolume", category: "Sounds", label: "change volume by %n", shape: "command", description: "Change the sound volume.", args: ["volume"] },
  { id: "volume", name: "volume", category: "Sounds", label: "volume", shape: "reporter", description: "Current volume.", value: "volume" },
  { id: "setTempo", name: "setTempo", category: "Sounds", label: "set tempo to %n bpm", shape: "command", description: "Set tempo.", args: ["tempo"] },
  { id: "changeTempo", name: "changeTempo", category: "Sounds", label: "change tempo by %n", shape: "command", description: "Adjust tempo.", args: ["tempo"] },
  { id: "tempo", name: "tempo", category: "Sounds", label: "tempo", shape: "reporter", description: "Current tempo.", value: "tempo" },
  { id: "playDrum", name: "playDrum", category: "Sounds", label: "play drum %n for %n beats", shape: "command", description: "Play a drum sound.", args: ["drum", "beats"] }
];

const events: BlockSpec[] = [
  { id: "whenGreenFlagClicked", name: "whenGreenFlagClicked", category: "Events", label: "when green flag clicked", shape: "hat", description: "Runs when the green flag is clicked." },
  { id: "whenKeyPressed", name: "whenKeyPressed", category: "Events", label: "when %s key pressed", shape: "hat", description: "Runs when a key is pressed.", args: ["key"] },
  { id: "whenSpriteClicked", name: "whenSpriteClicked", category: "Events", label: "when this sprite clicked", shape: "hat", description: "Runs when the sprite is clicked." },
  { id: "whenBackdropSwitches", name: "whenBackdropSwitches", category: "Events", label: "when backdrop switches to %s", shape: "hat", description: "Runs when the backdrop changes.", args: ["backdrop"] },
  { id: "whenIReceive", name: "whenIReceive", category: "Events", label: "when I receive %s", shape: "hat", description: "Runs when a broadcast message is received.", args: ["message"] },
  { id: "broadcast", name: "broadcast", category: "Events", label: "broadcast %s", shape: "command", description: "Send a message.", args: ["message"] },
  { id: "broadcastAndWait", name: "broadcastAndWait", category: "Events", label: "broadcast %s and wait", shape: "command", description: "Send a message and wait for all receivers.", args: ["message"] },
  { id: "whenTimer", name: "whenTimer", category: "Events", label: "when timer > %n", shape: "hat", description: "Runs when the timer exceeds a threshold.", args: ["seconds"] },
  { id: "wait", name: "wait", category: "Events", label: "wait %n seconds", shape: "command", description: "Wait a number of seconds.", args: ["seconds"] },
  { id: "timer", name: "timer", category: "Events", label: "timer", shape: "reporter", description: "Current timer value.", value: "timer" },
  { id: "resetTimer", name: "resetTimer", category: "Events", label: "reset timer", shape: "command", description: "Reset the timer." },
  { id: "whenStageClicked", name: "whenStageClicked", category: "Events", label: "when stage clicked", shape: "hat", description: "Runs when the stage is clicked." },
  { id: "whenThisSpriteClicked", name: "whenThisSpriteClicked", category: "Events", label: "when this sprite clicked", shape: "hat", description: "Runs when the sprite is clicked." }
];

const controls: BlockSpec[] = [
  { id: "waitControl", name: "waitControl", category: "Controls", label: "wait %n seconds", shape: "command", description: "Wait for a number of seconds.", args: ["seconds"] },
  { id: "repeat", name: "repeat", category: "Controls", label: "repeat %n", shape: "command", description: "Repeat a block sequence.", args: ["count"] },
  { id: "forever", name: "forever", category: "Controls", label: "forever", shape: "command", description: "Repeat forever." },
  { id: "ifBlock", name: "ifBlock", category: "Controls", label: "if %b", shape: "command", description: "Run a block if a condition is true.", args: ["condition"] },
  { id: "ifElse", name: "ifElse", category: "Controls", label: "if %b else", shape: "command", description: "Run one branch or another.", args: ["condition"] },
  { id: "waitUntil", name: "waitUntil", category: "Controls", label: "wait until %b", shape: "command", description: "Pause until a condition is true.", args: ["condition"] },
  { id: "repeatUntil", name: "repeatUntil", category: "Controls", label: "repeat until %b", shape: "command", description: "Repeat until a condition is true.", args: ["condition"] },
  { id: "stop", name: "stop", category: "Controls", label: "stop %m.stop", shape: "command", description: "Stop a script or the project.", args: ["stopOption"] },
  { id: "createClone", name: "createClone", category: "Controls", label: "create clone of %s", shape: "command", description: "Create a clone of a target sprite.", args: ["sprite"] },
  { id: "deleteClone", name: "deleteClone", category: "Controls", label: "delete this clone", shape: "command", description: "Delete the current clone." },
  { id: "whenIStartAsClone", name: "whenIStartAsClone", category: "Controls", label: "when I start as a clone", shape: "hat", description: "Runs when this clone starts." },
  { id: "whenCloneStarts", name: "whenCloneStarts", category: "Controls", label: "when this sprite cloned", shape: "hat", description: "Runs when a clone is created." },
  { id: "cloneCount", name: "cloneCount", category: "Controls", label: "clone count", shape: "reporter", description: "Current clone count.", value: "cloneCount" },
  { id: "stopThisScript", name: "stopThisScript", category: "Controls", label: "stop this script", shape: "command", description: "Stop the current script." },
  { id: "startAsClone", name: "startAsClone", category: "Controls", label: "start as clone", shape: "command", description: "Start as a clone." },
  { id: "allAtOnce", name: "allAtOnce", category: "Controls", label: "run all at once", shape: "command", description: "Run blocks concurrently." },
  { id: "screenRefresh", name: "screenRefresh", category: "Controls", label: "if %b then", shape: "command", description: "Run without refreshing the screen." },
  { id: "forEach", name: "forEach", category: "Controls", label: "for each %s in %s", shape: "command", description: "Loop over each item in a list.", args: ["item", "list"] },
  { id: "repeatWhile", name: "repeatWhile", category: "Controls", label: "repeat while %b", shape: "command", description: "Repeat while a condition is true.", args: ["condition"] },
  { id: "switchToBackdrop", name: "switchToBackdrop", category: "Controls", label: "switch backdrop to %s", shape: "command", description: "Switch to a backdrop.", args: ["backdrop"] },
  { id: "nextBackdrop", name: "nextBackdrop", category: "Controls", label: "next backdrop", shape: "command", description: "Go to the next backdrop." }
];

const operators: BlockSpec[] = [
  { id: "add", name: "add", category: "Operators", label: "%n + %n", shape: "reporter", description: "Add two numbers.", args: ["a", "b"] },
  { id: "subtract", name: "subtract", category: "Operators", label: "%n - %n", shape: "reporter", description: "Subtract two numbers.", args: ["a", "b"] },
  { id: "multiply", name: "multiply", category: "Operators", label: "%n * %n", shape: "reporter", description: "Multiply two numbers.", args: ["a", "b"] },
  { id: "divide", name: "divide", category: "Operators", label: "%n / %n", shape: "reporter", description: "Divide two numbers.", args: ["a", "b"] },
  { id: "mod", name: "mod", category: "Operators", label: "%n mod %n", shape: "reporter", description: "Modulo operation.", args: ["a", "b"] },
  { id: "round", name: "round", category: "Operators", label: "round %n", shape: "reporter", description: "Round a number.", args: ["value"] },
  { id: "abs", name: "abs", category: "Operators", label: "abs %n", shape: "reporter", description: "Absolute value.", args: ["value"] },
  { id: "sqrt", name: "sqrt", category: "Operators", label: "sqrt %n", shape: "reporter", description: "Square root.", args: ["value"] },
  { id: "sin", name: "sin", category: "Operators", label: "sin %n", shape: "reporter", description: "Sine of an angle.", args: ["angle"] },
  { id: "cos", name: "cos", category: "Operators", label: "cos %n", shape: "reporter", description: "Cosine of an angle.", args: ["angle"] },
  { id: "tan", name: "tan", category: "Operators", label: "tan %n", shape: "reporter", description: "Tangent of an angle.", args: ["angle"] },
  { id: "asin", name: "asin", category: "Operators", label: "asin %n", shape: "reporter", description: "Arc sine.", args: ["value"] },
  { id: "acos", name: "acos", category: "Operators", label: "acos %n", shape: "reporter", description: "Arc cosine.", args: ["value"] },
  { id: "atan", name: "atan", category: "Operators", label: "atan %n", shape: "reporter", description: "Arc tangent.", args: ["value"] },
  { id: "power", name: "power", category: "Operators", label: "%n ^ %n", shape: "reporter", description: "Power calculation.", args: ["base", "power"] },
  { id: "lessThan", name: "lessThan", category: "Operators", label: "%n < %n", shape: "reporter", description: "Less than comparison.", args: ["a", "b"] },
  { id: "equals", name: "equals", category: "Operators", label: "%n = %n", shape: "reporter", description: "Equality comparison.", args: ["a", "b"] },
  { id: "greaterThan", name: "greaterThan", category: "Operators", label: "%n > %n", shape: "reporter", description: "Greater than comparison.", args: ["a", "b"] },
  { id: "and", name: "and", category: "Operators", label: "%b and %b", shape: "reporter", description: "Logical AND.", args: ["a", "b"] },
  { id: "or", name: "or", category: "Operators", label: "%b or %b", shape: "reporter", description: "Logical OR.", args: ["a", "b"] },
  { id: "not", name: "not", category: "Operators", label: "not %b", shape: "reporter", description: "Logical NOT.", args: ["value"] },
  { id: "join", name: "join", category: "Operators", label: "join %s %s", shape: "reporter", description: "Join two strings.", args: ["a", "b"] },
  { id: "letterOf", name: "letterOf", category: "Operators", label: "letter %n of %s", shape: "reporter", description: "Get one character from a string.", args: ["index", "text"] },
  { id: "lengthOf", name: "lengthOf", category: "Operators", label: "length of %s", shape: "reporter", description: "Get the length of a string.", args: ["text"] }
];

const variables: BlockSpec[] = [
  { id: "setVariable", name: "setVariable", category: "Variables", label: "set %s to %s", shape: "command", description: "Set a variable value.", args: ["name", "value"] },
  { id: "changeVariable", name: "changeVariable", category: "Variables", label: "change %s by %n", shape: "command", description: "Change a variable by an amount.", args: ["name", "value"] },
  { id: "showVariable", name: "showVariable", category: "Variables", label: "show variable %s", shape: "command", description: "Show a variable.", args: ["name"] },
  { id: "hideVariable", name: "hideVariable", category: "Variables", label: "hide variable %s", shape: "command", description: "Hide a variable.", args: ["name"] },
  { id: "variableReporter", name: "variableReporter", category: "Variables", label: "%s", shape: "reporter", description: "Read a variable value.", args: ["name"] }
];

const listBlocks: BlockSpec[] = [
  { id: "addToList", name: "addToList", category: "Lists", label: "add %s to %s", shape: "command", description: "Add an item to a list.", args: ["item", "list"] },
  { id: "deleteItem", name: "deleteItem", category: "Lists", label: "delete %n of %s", shape: "command", description: "Delete an item from a list.", args: ["index", "list"] },
  { id: "insertAt", name: "insertAt", category: "Lists", label: "insert %s at %n of %s", shape: "command", description: "Insert an item into a list.", args: ["item", "index", "list"] },
  { id: "replaceItem", name: "replaceItem", category: "Lists", label: "replace item %n of %s with %s", shape: "command", description: "Replace an item in a list.", args: ["index", "list", "item"] },
  { id: "itemOf", name: "itemOf", category: "Lists", label: "item %n of %s", shape: "reporter", description: "Read a list item.", args: ["index", "list"] },
  { id: "itemNumber", name: "itemNumber", category: "Lists", label: "item # of %s in %s", shape: "reporter", description: "Find the index of a value in a list.", args: ["value", "list"] },
  { id: "lengthOfList", name: "lengthOfList", category: "Lists", label: "length of %s", shape: "reporter", description: "Get the list length.", args: ["list"] },
  { id: "contains", name: "contains", category: "Lists", label: "%s contains %s?", shape: "reporter", description: "Check if a list contains a value.", args: ["list", "item"] },
  { id: "showList", name: "showList", category: "Lists", label: "show list %s", shape: "command", description: "Show a list.", args: ["list"] },
  { id: "hideList", name: "hideList", category: "Lists", label: "hide list %s", shape: "command", description: "Hide a list.", args: ["list"] },
  { id: "deleteAll", name: "deleteAll", category: "Lists", label: "delete all of %s", shape: "command", description: "Clear a list.", args: ["list"] },
  { id: "listCount", name: "listCount", category: "Lists", label: "count of %s", shape: "reporter", description: "Count elements in a list.", args: ["list"] },
  { id: "firstItem", name: "firstItem", category: "Lists", label: "first item of %s", shape: "reporter", description: "Get the first item in a list.", args: ["list"] },
  { id: "lastItem", name: "lastItem", category: "Lists", label: "last item of %s", shape: "reporter", description: "Get the last item in a list.", args: ["list"] },
  { id: "joinList", name: "joinList", category: "Lists", label: "join %s", shape: "reporter", description: "Join all list items into a string.", args: ["list"] }
];

const createListButton: BlockSpec = {
  id: "createList",
  name: "createList",
  category: "Lists",
  label: "Create List",
  shape: "command",
  description: "Create a new list."
};

co