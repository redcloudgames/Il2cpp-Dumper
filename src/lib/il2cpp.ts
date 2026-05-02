/**
 * IL2CPP Metadata Parser and Binary Scanner
 */

import * as fs from 'fs';

export interface MetadataHeader {
    magic: number;
    version: number;
    stringOffset: number;
    stringCount: number;
    metadataUsageOffset: number;
    metadataUsageCount: number;
    typeDefinitionsOffset: number;
    typeDefinitionsCount: number;
    imagesOffset: number;
    imagesCount: number;
}

export class IL2CPPDumper {
    private metadata: Buffer;
    private assembly: Buffer;

    constructor(metadata: Buffer, assembly: Buffer) {
        this.metadata = metadata;
        this.assembly = assembly;
    }

    public dump(): string {
        try {
            const header = this.parseHeader();
            if (header.magic !== 0xFAB11BAF) {
                throw new Error('Invalid metadata magic');
            }

            let output = "// Dumped by IL2CPP Dumper Online\n";
            output += `// Metadata Version: ${header.version}\n\n`;

            // This is a simplified dumper that focuses on strings and basic structure
            // Real dumping requires full binary analysis which is heavy for a web demo
            // but we can extract a lot of info from metadata alone.

            const strings = this.extractStrings(header);
            output += `// Found ${header.typeDefinitionsCount / 92} type definitions (estimated)\n\n`; // v24 size is 92

            // Basic type dumping
            // offset to TypeDefinition varies by version.
            // v24: 92 bytes, v29: 88 bytes, etc.
            
            output += "/* Note: This is an automated extraction of metadata strings and structures. */\n\n";

            // Extract method names, type names, etc from the string pool
            // Actually, we can just list unique strings found in the definitions
            const uniqueStrings = Array.from(new Set(strings)).sort();
            
            output += "namespace Metadata.Symbols {\n";
            uniqueStrings.filter(s => s.length > 3 && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)).forEach(s => {
                output += `    // string: ${s}\n`;
            });
            output += "}\n\n";

            return output;
        } catch (e) {
            return `Error during dump: ${e instanceof Error ? e.message : String(e)}`;
        }
    }

    private parseHeader(): MetadataHeader {
        return {
            magic: this.metadata.readUInt32LE(0),
            version: this.metadata.readUInt32LE(4),
            stringOffset: this.metadata.readUInt32LE(8),
            stringCount: this.metadata.readUInt32LE(12),
            metadataUsageOffset: this.metadata.readUInt32LE(16),
            metadataUsageCount: this.metadata.readUInt32LE(20),
            typeDefinitionsOffset: this.metadata.readUInt32LE(24),
            typeDefinitionsCount: this.metadata.readUInt32LE(28),
            imagesOffset: this.metadata.readUInt32LE(32),
            imagesCount: this.metadata.readUInt32LE(36),
        };
    }

    private extractStrings(header: MetadataHeader): string[] {
        const strings: string[] = [];
        let pos = header.stringOffset;
        const end = header.stringOffset + header.stringCount;
        
        let currentString = "";
        while (pos < end && pos < this.metadata.length) {
            const char = this.metadata[pos];
            if (char === 0) {
                if (currentString.length > 0) {
                    strings.push(currentString);
                }
                currentString = "";
            } else {
                currentString += String.fromCharCode(char);
            }
            pos++;
        }
        return strings;
    }
}
