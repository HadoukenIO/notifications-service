abstract class CustomError extends Error {
    public readonly type: string;
    public readonly innerError?: Error;

    constructor(type: string, message: string, innerError?: Error) {
        super(`${type}: ${message || innerError}`);
        this.type = type;
        this.innerError = innerError;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class DatabaseError extends CustomError {
    constructor(message: string = '', innerError?: Error) {
        super('DatabaseError', message, innerError);
    }
}
