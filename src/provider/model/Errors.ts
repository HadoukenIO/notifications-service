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
}

type Constructor<T> = {new(...args: any[]): T};

export class BatchError extends CustomError {
    public errors: Error[] = [];
    constructor(errors: Error[]) {
        super('BatchError', BatchError.generateMessage(errors));
        this.errors = errors;
    }

    public getErrors<T extends CustomError>(error: Constructor<T>): Error[] {
        return this.errors.filter((e) => e instanceof error);
    }

    public static handleError(
        error: Error,
        handler: (batchError: BatchError) => (Promise<void> | void)
    ): void {
        if (error instanceof BatchError) {
            handler(error);
        } else {
            // If not a batch error throw
            throw error;
        }
    }

    public log(): void {
        const ERROR_CSS = 'border: 1px solid #FFD6D6; background: #FFF0F0; color: blue; width: 100%;';
        console.groupCollapsed('%cBatch Error', ERROR_CSS);
        this.errors.forEach(error => {
            console.groupCollapsed(error.name, error.message);
            console.log(error.stack);
            console.groupEnd();
        });
        console.groupEnd();
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
