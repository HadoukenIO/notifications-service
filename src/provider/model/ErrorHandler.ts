import {BatchError, ErrorConstructor} from './Errors';

export class ErrorHandler {
    private errors: Error[];
    private handledErrors: Error[];
    private unhandledErrors: Error[];

    private constructor(error: Error) {
        if (error instanceof BatchError) {
            this.errors = [];

            error.errors.forEach(value => {
                if (value instanceof Error) {
                    this.errors.push(value);
                } else {
                    this.errors.push(new Error(value));
                }
            });
        } else if (error instanceof Error) {
            this.errors = [error];
        } else {
            this.errors = [];
        }
        this.handledErrors = [];
        this.unhandledErrors = this.errors.slice();
    }

    public static for(error: Error): ErrorHandler {
        return new ErrorHandler(error);
    }

    /**
     * Calls a handler function for each instance of a particular error.
     * Will only trigger handler if there are one or more errors of the given type.
     *
     * @param errorType Error type
     * @param handler Error Handler
     */
    public processError<T extends Error>(errorType: ErrorConstructor<T>, handler: (this: ErrorHandler, error: T) => void): this {
        const matchingErrors: T[] = this.errors.filter((error): error is T => {
            const isInstance = error instanceof errorType;

            if (isInstance && !this.handledErrors.includes(error)) {
                this.handledErrors.push(error);
            }

            return isInstance;
        });

        matchingErrors.forEach(handler.bind(this));

        return this;
    }

    /**
     * Calls a handler function with all instances of a particular error.
     * Will only trigger handler if there are one or more errors of the given type.
     *
     * @param errorType Error type
     * @param handler Error Handler
     */
    public processErrors<T extends Error>(errorType: ErrorConstructor<T>, handler: (this: ErrorHandler, errors: T[]) => void): this {
        const matchingErrors: T[] = this.getErrorsOfType(errorType);

        if (matchingErrors.length > 0) {
            handler.call(this, matchingErrors);
        }

        return this;
    }

    public processRemaining(handler: (errors: unknown[]) => void): this {
        handler(this.errors);

        return this;
    }

    public throwRemaining(): void {
        const unhandledErrors = this.errors.filter(error => !this.handledErrors.includes(error));

        if (unhandledErrors.length > 1) {
            throw new BatchError(unhandledErrors);
        } else if (unhandledErrors.length === 1) {
            throw unhandledErrors[0];
        }
    }

    public log(): void {
        const ERROR_CSS = 'border: 1px solid #FFD6D6; background: #FFF0F0; color: blue; width: 100%;';
        console.groupCollapsed(`%cBatch Error (${this.errors.length})`, ERROR_CSS);
        this.errors.forEach(error => {
            if (error instanceof BatchError) {
                new ErrorHandler(error).log();
            } else {
                console.groupCollapsed(error.name, error.message);
                console.log(error.stack);
                console.groupEnd();
            }
        });
        console.groupEnd();
    }

    private getErrorsOfType<T extends Error>(errorType: ErrorConstructor<T>): T[] {
        return this.unhandledErrors.filter((error): error is T => {
            const isInstance = error instanceof errorType;

            if (isInstance && !this.handledErrors.includes(error)) {
                const index = this.unhandledErrors.indexOf(error);

                if (index >= 0) {
                    this.unhandledErrors.splice(index, 1);
                }
                this.handledErrors.push(error);
            }

            return isInstance;
        });
    }
}
