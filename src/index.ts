
import * as process from 'process';
import * as fs from 'fs';

import {parseScript} from 'shift-parser';
import * as S from './schema';
import {Importer, Registry} from './parse_js';
import {FixedSizeBufStream, Table, Encoder} from './encode_binast';

function encode(filename: string) {
    const data: string = fs.readFileSync(filename, "utf8");
    const json: any = parseScript(data);
    if (json.type !== 'Script') {
        throw new Error('Not a script');
    }
    const importer: Importer = new Importer();
    const script: S.Script = importer.liftScript(json);

    const sr: Registry<string> = importer.strings;
    const strings = sr.inFrequencyOrder();
    console.debug("DONE LIFTING");

    const stringTable = new Table<string>(strings);
    const nodeKindTable = new Table<S.BaseNode>([]);
    const writeStream = new FixedSizeBufStream();
    const encoder = new Encoder({script,
                                 stringTable,
                                 nodeKindTable,
                                 writeStream});

    const stSize = encoder.encodeStringTable();
    console.log(`Encoded string table size=${stSize}`);
    let stLength = 0;
    strings.forEach((s, i) => {
        const f = sr.frequencyOf(s);
        console.log(`String [${i}] \`${s}\` - ${f}`);
        stLength += (s.length + 1);
    });
    console.log(`String table length: ${stLength}`);
    /*
    // console.log(JSON.stringify(script, null, 2));
    */
}

function main() {
    const args: Array<string> = process.argv.slice(2);
    if (args.length < 2) {
        console.error("Filename not given.");
        process.exit(1);
    }
    if (args[0] === '--encode') {
        console.log(`ENCODING: ${args[1]}`);
        encode(args[1]);
    } else {
        console.error(`Unrecognized command: ${args[0]}`);
        process.exit(1);
    }
}

main();
