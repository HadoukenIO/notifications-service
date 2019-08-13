const path = require('path');
const fs = require('fs');

const deepEqual = require('deep-equal');
const TJS = require('typescript-json-schema');

class SchemaPlugin {
    constructor() {
        this._schemaConfigs = require(path.resolve('./res/provider/schemas/collections.json'));
        this._program = TJS.getProgramFromFiles(this._schemaConfigs.collections.map(collection => path.resolve(collection.schema.sourceFile)));
    }

    run(script) {
        switch (script.toLowerCase()) {
            case 'generate': {
                this.generate();
                break;
            }
            case 'validate': {
                this.validate();
                break;
            }
            case undefined: {
                this.validate();
            }
        }
    }

    generate() {
        this._schemaConfigs.collections.forEach(collection => {
            const outputFile = path.resolve(`./res/provider/schemas/${collection.schema.outputFile}`);
            const schema = TJS.generateSchema(this._program, collection.schema.typeName);

            fs.writeFileSync(outputFile, JSON.stringify(schema, undefined, 4));
        });
    }

    validate() {
        this._schemaConfigs.collections.forEach(collection => {
            const schemaFile = path.resolve(`./res/provider/schemas/${collection.schema.outputFile}`);

            if (fs.existsSync(schemaFile)) {
                const schemaFileContents = fs.readFileSync(schemaFile, 'utf8');
                const schema = TJS.generateSchema(this._program, collection.schema.typeName);

                if (!deepEqual(JSON.parse(schemaFileContents), schema)) {
                    throw new Error(`Schema ${schemaFile} does not match type ${collection.schema.typeName}. \
                        If this is an intentional change, please bump the version number for this schema in res/provider/schemas/collections.json.`);
                }
            } else {
                throw new Error(`Schema file for ${collection.schema.typeName} does not exist at ${schemaFile}`);
            }
        });
    }
}

new SchemaPlugin().run(process.argv[2]);
