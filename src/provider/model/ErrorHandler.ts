import {BatchError, ErrorConstructor} from './Errors';

/**
 * Util for consicely handling both errors (both singular and batches).
 */
export class ErrorHandler {
    public static for(error: Error): ErrorHandler {
        return new ErrorHandler(error);
    }

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

    /**
     * Calls a handler function for each instance of a particular error.
     * Will only trigger handler if there are one or more errors of the given type.
     *
     * @param errorType Error type
     * @param handler Error Handler
     */
    public processError<T extends Error>(errorType: ErrorConstructor<T>, handler: (this: ErrorHandler, error: Readonly<T>) => void): this {
        const matchingErrors: ReadonlyArray<T> = this.handleErrorsOfType(errorType);

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
    public processErrors<T extends Error>(errorType: ErrorConstructor<T>, handler: (this: ErrorHandler, errors: ReadonlyArray<T>) => void): this {
        const matchingErrors: T[] = this.handleErrorsOfType(errorType);

        if (matchingErrors.length > 0) {
            handler.call(this, matchingErrors);
        }

        return this;
    }

    /**
     * Calls a handler function with all remaining unhandled errors, regardless of error type.
     * Will only trigger handler if there are one or more unhandled errors.
     *
     * @param handler Error Handler
     */
    public processRemaining(handler: (errors: ReadonlyArray<Error>) => void): this {
        if (this.unhandledErrors.length > 0) {
            handler(this.unhandledErrors);
        }

        return this;
    }

    /**
     * Will throw any remaining unhandled errors, so they can be re-caught higher up the stack.
     *
     * Will only throw if there are unhandled errors.
     */
    public throwRemaining(): void {
        const unhandledErrors = this.unhandledErrors;

        if (unhandledErrors.length > 1) {
            throw new BatchError(unhandledErrors);
        } else if (unhandledErrors.length === 1) {
            throw unhandledErrors[0];
        }
    }

    public log(): void {
        const ERROR_CSS = 'border: 1px solid #FFD6D6; background: #FFF0F0; color: blue; width: 100%;';
        console.groupCollapsed(`%cError (${this.errors.length})`, ERROR_CSS);
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

    /**
     * Returns a list of all unhandled errors of the given type, whilst also moving them from the `unhandledErrors` list
     * to the `handledErrors` list.
     *
     * @param errorType The error type to filter by
     */
    private handleErrorsOfType<T extends Error>(errorType: ErrorConstructor<T>): T[] {
        const unhandledErrors = this.unhandledErrors.slice();
        return unhandledErrors.filter((error): error is T => {
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
