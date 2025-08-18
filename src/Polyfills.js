import { Buffer } from "buffer";
import process from "process";
import { Readable } from "stream-browserify";

window.Buffer = Buffer;
window.process = process;
window.Readable = Readable;
