/**
 * Object that reutrns the status of a database operation.
 * 
 * This interface is used for operations that return data. If an operation has no return value, it will use VoidResult instead.
 */
export interface ReturnResult<T> extends VoidResult {
    /**
     * Returns the results of the operation.
     * 
     * If the operation failed (see 'success'), null will be returned.
     */
    value: T;
}

/**
 * Object that reutrns the status of a database operation.
 * 
 * This interface is used for operations that do not return any data. If an operation returns data, it will use ReturnResult<T> instead.
 */
export interface VoidResult {
    /**
     * Returns if the operation was successful.
     * 
     * More information (in both success and fail cases) can be found under 'status'
     */
    success: boolean;

    /**
     * If the operation failed, this field will be appended to the result with details about the error.
     * 
     * This field will be returned if-and-only-if 'success' is false.
     */
    errorMsg?: string;
}