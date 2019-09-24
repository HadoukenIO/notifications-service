export type ErrorConstructor<T extends Error> = {new(...args: any[]): T};

export async function ErrorAggregator(items: Promise<void>[]): Promise<void> {
    const errors: Error[] = [];
    const promises = items.map(item => item.catch((error: Error) => errors.push(error)));
    await Promise.all(promises);
    if (errors.length > 0) {
        throw new BatchError(errors);
    }
}

abstract class CustomError extends Error {
    public readonly innerError?: Error;

    constructor(name: string, message: string, innerError?: Error) {
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
        return `${errors.map(e => e.name).join(', ')}`;
    }
}

export class DatabaseError extends CustomError {
    constructor(message: string = '', innerError?: Error) {
        super('DatabaseError', message, innerError);
    }
}

export class LaunchApplicationError extends CustomError {
    constructor(message: string = '', innerError?: Error) {
        super('LaunchApplicationError', message, innerError);
    }
}
