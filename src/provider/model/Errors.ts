export type ErrorConstructor<T extends Error> = new(...args: any[]) => T;

export async function ErrorAggregator(items: Promise<void>[]): Promise<void> {
    const errors: Error[] = [];
    const promises = items.map((item) => item.catch((error: Error) => errors.push(error)));
    await Promise.all(promises);
    if (errors.length > 0) {
        throw new BatchError(errors);
    }
}

export abstract class CustomError extends Error {
    constructor(name: string, message: string, public readonly innerError?: Error, public readonly metadata?: {[key: string]: any}) {
        super(`${message || innerError}`);
        this.innerError = innerError;
        this.name = name;
    }

    public toString(): string {
        return `${this.name}: ${this.message}`;
    }
}

export class BatchError extends CustomError {
    public errors: Error[] = [];
    constructor(errors: Error[]) {
        super('BatchError', BatchError.generateMessage(errors));
        this.errors = errors;
    }

    public toString(): string {
        return `${this.name}: ${this.message}`;
    }

    private static generateMessage(errors: Error[]): string {
        const count = errors.length;

        if (count === 0) {
            // Should never happen. Only create a BatchError if an error occurred, and pass the error(s) into the batch.
            return '<Empty>';
        } else if (count === 1) {
            return errors[0].message;
        } else {
            return `Batch (${count} errors):\n${errors.map((error, index) => {
                const {name, message} = error;
                return ` ${index + 1}/${count}) ${name}: ${message.includes('\n') ? `${message.split('\n')[0]}...` : message}`;
            }).join('\n')}`;
        }
    }
}

export class DatabaseError extends CustomError {
    constructor(message: string, innerError?: Error) {
        super('DatabaseError', message, innerError);
    }
}

export class LaunchApplicationError extends CustomError {
    constructor(message: string, innerError?: Error) {
        super('LaunchApplicationError', message, innerError);
    }
}
